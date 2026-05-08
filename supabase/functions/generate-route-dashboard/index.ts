import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function searchFirecrawl(query: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        limit: 3,
        scrapeOptions: { formats: ['markdown'] },
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error(`Firecrawl search error:`, data);
      return '';
    }
    const results = data?.data || [];
    return results.map((r: any) => `## ${r.title || r.url}\n${r.markdown || r.description || ''}`).join('\n\n---\n\n');
  } catch (err) {
    console.error(`Failed to search:`, err);
    return '';
  }
}

async function generateDashboard(
  communityCollege: string,
  major: string,
  degreeType: string,
  state: string,
  routeId: string,
  userId: string,
  destinationSystem: string,
  destinationCampus: string,
) {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) throw new Error('AI service not configured');

    const sys = (destinationSystem || 'CSU').toUpperCase();
    const campus = (destinationCampus || '').trim();
    const destLabel = campus || (sys === 'CSU' ? 'CSU System' : sys === 'UC' ? 'UC System' : 'target university');

    console.log(`Generating dashboard for ${communityCollege} - ${major} (${degreeType}) → ${sys} ${campus}`);

    let scrapedContent = '';
    if (firecrawlKey) {
      let queries: string[];
      if (sys === 'UC') {
        queries = [
          `${communityCollege} ${major} transfer requirements UC`,
          `${communityCollege} IGETC general education requirements`,
          `site:assist.org ${communityCollege} ${campus || 'UC'} ${major} articulation`,
          `${campus || 'UC'} transfer admission requirements ${major} TAG`,
        ];
      } else if (sys === 'CSU') {
        queries = [
          `${communityCollege} ${major} ${degreeType} degree requirements catalog`,
          `${communityCollege} Cal-GETC general education requirements`,
          `site:assist.org ${communityCollege} ${campus || ''} ${major} articulation`,
          `${communityCollege} transfer center CSU requirements`,
        ];
      } else {
        queries = [
          `${communityCollege} ${major} transfer requirements`,
          `${campus} transfer admission requirements ${major}`,
          `${campus} community college transfer credit articulation ${communityCollege}`,
          `${campus} general education transfer requirements`,
        ];
      }
      const results = await Promise.all(queries.map(q => searchFirecrawl(q, firecrawlKey)));
      scrapedContent = results.filter(Boolean).join('\n\n=== SOURCE BREAK ===\n\n');
      console.log(`Scraped ${scrapedContent.length} chars of content`);
    }

    const dt = degreeType || 'AS-T';
    const gePattern = sys === 'CSU' ? 'Cal-GETC' : sys === 'UC' ? 'IGETC' : `${campus || 'destination campus'}-specific GE pattern`;
    const pathwayDesc = sys === 'CSU'
      ? 'Associate Degree for Transfer (ADT) — AS-T or AA-T — for guaranteed CSU admission.'
      : sys === 'UC'
      ? `UC Transfer Pathway and (where eligible) a Transfer Admission Guarantee (TAG) for ${campus || 'a participating UC campus'}. Note: UC Berkeley and UCLA do NOT offer TAG.`
      : `Direct transfer pathway to ${campus || 'the target university'} based on its published transfer admission requirements and articulation with ${communityCollege}.`;

    const systemPrompt = `You are an expert California community college transfer counselor. You generate detailed, accurate transfer route dashboards.

The student's destination is: ${destLabel} (system: ${sys}).

Tailor the entire dashboard to this destination:
- GE pattern: ${gePattern}
- Pathway: ${pathwayDesc}
- Use REAL course codes from ${communityCollege}'s catalog and REAL articulation from ASSIST.org or the destination campus's transfer pages.
- Do NOT default to CSU/Cal-GETC/AS-T unless the destination is CSU.
- For UC: use IGETC (7-course pattern: Areas 1A, 1B, 1C [UC only], 2, 3, 4, 5, 6) and reference UC Transfer Pathways for the major.
- For Other (private/out-of-state): work from that specific school's transfer admission page; do not invent CSU-style guarantees.

Output must be valid JSON matching the exact schema requested.`;

    const userPrompt = `Generate a complete transfer route dashboard JSON for:
- Community College: ${communityCollege}
- Major/Degree: ${major}${sys === 'CSU' ? ` ${dt}` : ''}
- State: ${state || 'California'}
- Target System: ${sys}
- Target Campus: ${campus || '(not specified)'}

${scrapedContent ? `Here is scraped data from the college's website and related sources:\n\n${scrapedContent.substring(0, 30000)}` : 'Use your training knowledge.'}

Return a JSON object with this exact structure:
{
  "routeMeta": {
    "communityCollege": "${communityCollege}",
    "major": "${major}",
    "degreeType": "${dt}",
    "degreeName": "full degree name like '${major} ${dt}'",
    "destinationSystem": "CSU",
    "catalogYear": "2025-2026",
    "totalUnitsRequired": number (typically 90 quarter or 60 semester),
    "majorUnits": number,
    "lastUpdated": "${new Date().toISOString()}"
  },
  "overviewCards": [
    {"title": "CSU Admission Guarantee", "description": "...", "icon": "shield", "boldText": "..."},
    {"title": "60 Units After Transfer", "description": "...", "icon": "clock", "boldText": "..."},
    {"title": "Online Availability", "description": "...", "icon": "monitor"},
    {"title": "Total Units", "description": "...", "icon": "book", "boldText": "..."}
  ],
  "keyRequirements": [
    {"text": "Minimum X quarter units total", "boldPart": "X quarter units"},
    ...
  ],
  "criticalNotes": [
    {"text": "Cal-GETC begins Fall 2025...", "boldPart": "Cal-GETC begins Fall Quarter 2025"},
    ...
  ],
  "quickStartChecklist": [
    {"key": "qs1", "label": "Apply to ${communityCollege}...", "priority": "high"},
    ... (8-12 items, mix of high/medium/low)
  ],
  "majorCourses": [
    {
      "key": "course1",
      "code": "REAL COURSE CODE",
      "name": "Full Course Name",
      "units": 5,
      "description": "Course description...",
      "prerequisites": "None or prereq course code",
      "notes": "Tips, recommendations",
      "alternatives": [{"code": "ALT CODE", "name": "Alt Course Name"}],
      "honorsAvailable": true/false
    },
    ... (all required major courses)
  ],
  "gradingRules": [
    "All major courses must be completed with C or better",
    ...
  ],
  "calGetcAreas": [
    {
      "key": "a1",
      "area": "Area A1",
      "title": "Oral Communication",
      "description": "...",
      "exampleCourses": ["SPCH 1", "COMM 1"],
      "notes": "...",
      "doubleDip": false,
      "doubleDipNote": ""
    },
    ... (all Cal-GETC areas: A1, A2, A3, B1, B2, B4, C, D)
  ],
  "geNotes": [
    "Cal-GETC begins Fall Quarter 2025...",
    ...
  ],
  "courseSequence": [
    {
      "term": "Term 1",
      "label": "First Quarter — Launch",
      "description": "No prerequisites needed...",
      "courses": [
        {"code": "COURSE CODE", "name": "Course Name", "type": "major"},
        {"code": "ENGL 1A", "name": "English Comp", "type": "ge", "geArea": "A2"}
      ]
    },
    ... (4-6 terms plus application reminder)
  ],
  "sequenceBottlenecks": ["Accounting chain: ACTG 1A → 1B → 1C...", ...],
  "sequenceProTips": ["Take X + Y in first term...", ...],
  "transferGuide": [
    {
      "key": "tg1",
      "step": 1,
      "title": "Meet with a Counselor",
      "description": "...",
      "link": {"label": "Book Appointment", "url": "real URL"}
    },
    ... (6-8 steps)
  ],
  "nearbyCsus": [
    {"name": "San José State University", "distance": "~10 miles", "notes": "..."},
    ...
  ],
  "transferDeadlines": [
    {"date": "Oct 1 – Dec 1", "description": "CSU Fall application window"},
    ...
  ],
  "adtGuarantee": {
    "guarantees": ["Guaranteed admission to CSU system...", ...],
    "doesNotGuarantee": ["Admission to a specific CSU campus...", ...]
  },
  "resources": [
    {
      "title": "Official AS-T Catalog Page",
      "description": "...",
      "url": "real catalog URL",
      "type": "catalog"
    },
    ... (8-12 resources with REAL URLs)
  ],
  "contactInfo": {
    "generalCounseling": "phone number",
    "transferCenter": "phone number",
    "inPerson": "Room/building info",
    "dropIn": ["Tuesdays 11:30am...", ...]
  },
  "sourceInfo": {
    "basedOn": "${communityCollege} catalog 2025-2026, Cal-GETC requirements, ASSIST.org",
    "lastVerified": "${new Date().toISOString()}",
    "notes": ["Requirements based on available data...", "Always verify with counselor...", ...]
  }
}

IMPORTANT: Return ONLY valid JSON. No markdown, no code fences, no explanation. Just the JSON object.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errText);
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData?.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in AI response:', aiData);
      throw new Error('AI returned empty response');
    }

    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const dashboard = JSON.parse(cleaned);

    // Save dashboard to DB
    await supabaseAdmin.from('route_dashboards').insert({
      route_id: routeId,
      dashboard_payload: dashboard,
      version: 1,
      generated_by: 'ai',
      llm_model: 'gemini-3-flash-preview',
    });

    // Deduct a credit
    const { data: creditRecords } = await supabaseAdmin
      .from('route_credits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (creditRecords) {
      for (const cr of creditRecords) {
        const available = cr.credits_added - cr.credits_used;
        if (available > 0) {
          await supabaseAdmin.from('route_credits').update({ credits_used: cr.credits_used + 1 }).eq('id', cr.id);
          break;
        }
      }
    }

    // Mark route as ready
    await supabaseAdmin.from('routes').update({ status: 'ready' }).eq('id', routeId);
    console.log('Dashboard generated and saved successfully for route', routeId);

  } catch (error) {
    console.error('Error generating dashboard:', error);
    // Mark route as needs_review so user knows it failed
    await supabaseAdmin.from('routes').update({ status: 'needs_review' }).eq('id', routeId);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { communityCollege, major, degreeType, state, routeId, userId } = await req.json();

    if (!communityCollege || !major || !routeId || !userId) {
      return new Response(
        JSON.stringify({ error: 'communityCollege, major, routeId, and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Received dashboard generation request for route', routeId);

    const work = generateDashboard(
      communityCollege,
      major,
      degreeType || 'AS-T',
      state || 'California',
      routeId,
      userId,
    );

    work.catch(err => console.error('Background generation failed:', err));
    EdgeRuntime.waitUntil(work);

    return new Response(
      JSON.stringify({ success: true, status: 'processing' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in request handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
