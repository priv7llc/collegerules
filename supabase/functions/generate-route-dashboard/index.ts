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
  skipCreditDeduction: boolean,
) {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) throw new Error('AI service not configured');

    const rawSys = (destinationSystem || 'CSU').trim();
    const sys = rawSys.toUpperCase();
    const campus = (destinationCampus || '').trim();
    const isTexas = (state || '').trim().toLowerCase() === 'texas'
      || /texas|houston|prairie view|sam houston|a&m/i.test(rawSys);
    // Normalize the Houston Community College → Houston City College rename
    const collegeAliases = /houston (community|city) college/i.test(communityCollege)
      ? 'Houston City College (formerly Houston Community College, "HCC")'
      : communityCollege;
    const destLabel = isTexas
      ? (rawSys && !/^other/i.test(rawSys) ? rawSys : campus || 'target Texas university')
      : (campus || (sys === 'CSU' ? 'CSU System' : sys === 'UC' ? 'UC System' : 'target university'));

    console.log(`Generating dashboard for ${communityCollege} - ${major} (${degreeType}) → ${rawSys} ${campus} [texas=${isTexas}]`);

    let scrapedContent = '';
    if (firecrawlKey) {
      let queries: string[];
      if (isTexas) {
        queries = [
          `${collegeAliases} ${major} ${degreeType} degree plan catalog`,
          `${communityCollege} Texas Core Curriculum 42 hours requirements TCCNS`,
          `${destLabel} transfer equivalency ${communityCollege} ${major}`,
          `${destLabel} ${major} transfer degree plan articulation agreement ${communityCollege}`,
          `ApplyTexas transfer application deadline ${destLabel}`,
        ];
      } else if (sys === 'UC') {
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

    const dt = degreeType || (isTexas ? 'AS' : 'AS-T');
    const isAasRoute = /^aas$/i.test(dt);
    const gePattern = isTexas
      ? 'Texas Core Curriculum (42 semester credit hours, Components 010–090)'
      : sys === 'CSU' ? 'Cal-GETC' : sys === 'UC' ? 'IGETC' : `${campus || 'destination campus'}-specific GE pattern`;
    const pathwayDesc = isTexas
      ? (isAasRoute
        ? `Applied-science pathway: ${collegeAliases} AAS → ${destLabel} BAAS (Bachelor of Applied Arts & Sciences) or similar applied bachelor's. This is NOT a traditional AA/AS academic transfer — technical/workforce hours apply only where the receiving university has an articulated applied program, and remaining core curriculum plus upper-level requirements must still be completed.`
        : `Texas academic transfer: complete the Texas Core Curriculum (42 SCH) and, where one exists, the state Field of Study / Texas Transfer Framework block for ${major}. State law guarantees BLOCK TRANSFER of a completed core curriculum to any Texas public university — it does NOT guarantee admission or that all courses apply to the major.`)
      : sys === 'CSU'
      ? 'Associate Degree for Transfer (ADT) — AS-T or AA-T — for guaranteed CSU admission.'
      : sys === 'UC'
      ? `UC Transfer Pathway and (where eligible) a Transfer Admission Guarantee (TAG) for ${campus || 'a participating UC campus'}. Note: UC Berkeley and UCLA do NOT offer TAG.`
      : `Direct transfer pathway to ${campus || 'the target university'} based on its published transfer admission requirements and articulation with ${communityCollege}.`;

    const systemPrompt = isTexas
      ? `You are an expert Texas community college transfer advisor. You generate detailed, accurate transfer route dashboards for students transferring from a Texas community college to a Texas university.

The student's destination is: ${destLabel}. Sending college: ${collegeAliases}.

Rules you MUST follow:
- GE pattern: ${gePattern}. NEVER mention Cal-GETC, IGETC, ASSIST.org, ADT, AS-T/AA-T, CSU, or UC — those are California-only and are wrong here.
- Pathway: ${pathwayDesc}
- Use REAL course codes from the college's catalog and include the TCCNS (Texas Common Course Numbering System) number for every lower-division academic course where one exists, e.g. "ENGL 1301 (TCCNS ENGL 1301)". Say "no TCCNS equivalent" when there isn't one.
- For every course, state plainly whether it COUNTS TOWARD THE DEGREE at ${destLabel} or only TRANSFERS AS ELECTIVE credit. If you are unsure, say so and tell the student to check the university's transfer equivalency tool.
- Cite Fields of Study / the Texas Transfer Framework and any published articulation or pathway agreement (e.g. HCC–UH pathway agreements) as evidence, but never imply an agreement guarantees admission.
- Applications go through ApplyTexas (or the university's own portal), not CSU Mentor or the UC application.
- Mention the Texas 90-hour / lower-division credit limits and the receiving university's residency (in-residence hours) requirement where relevant.

Output must be valid JSON matching the exact schema requested.`
      : `You are an expert California community college transfer counselor. You generate detailed, accurate transfer route dashboards.

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
- Community College: ${collegeAliases}
- Major/Degree: ${major}${sys === 'CSU' || isTexas ? ` ${dt}` : ''}
- State: ${state || 'California'}
- Target ${isTexas ? 'University' : 'System'}: ${rawSys}
- Target ${isTexas ? 'Program' : 'Campus'}: ${campus || '(not specified)'}

${scrapedContent ? `Here is scraped data from the college's website and related sources:\n\n${scrapedContent.substring(0, 30000)}` : 'Use your training knowledge.'}

Return a JSON object with this exact structure:
{
  "routeMeta": {
    "communityCollege": "${communityCollege}",
    "major": "${major}",
    "degreeType": "${dt}",
    "degreeName": "full degree name like '${major} ${dt}'",
    "destinationSystem": "${rawSys}",
    "destinationCampus": "${campus}",

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
    "basedOn": "${isTexas ? `${communityCollege} catalog 2025-2026, Texas Core Curriculum, TCCNS, ${destLabel} transfer equivalency` : `${communityCollege} catalog 2025-2026, Cal-GETC requirements, ASSIST.org`}",
    "lastVerified": "${new Date().toISOString()}",
    "notes": ["Requirements based on available data...", "Always verify with counselor...", ...]
  }
}

NOTE on field naming (the UI uses these exact keys regardless of system):
- "calGetcAreas": populate with the GE areas of the appropriate pattern. For UC use IGETC areas (1A, 1B, 1C, 2, 3A, 3B, 4, 5A, 5B, 6). For TEXAS use the Texas Core Curriculum components: 010 Communication, 020 Mathematics, 030 Life & Physical Sciences, 040 Language/Philosophy/Culture, 050 Creative Arts, 060 American History, 070 Government/Political Science, 080 Social & Behavioral Sciences, 090 Component Area Option — with the required semester credit hours for each and example courses shown with TCCNS numbers. For Other, use the destination campus's published transfer GE pattern.
- "geNotes": describe the actual GE pattern used. Do NOT mention Cal-GETC unless system is CSU.
- "nearbyCsus": treat as "nearby relevant campuses". For UC, list nearby UC campuses. For TEXAS, list other Texas universities that accept this pathway (with notes on program fit). For Other, list the target campus + alternates.
- "adtGuarantee": for UC, frame as TAG. For TEXAS, "guarantees" should describe core-curriculum BLOCK TRANSFER and any Field of Study block, and "doesNotGuarantee" must include admission to the university/major, application of every course to the degree, and upper-level/residency requirements. For Other, "guarantees" should be empty or note "No formal admission guarantee".
- "overviewCards", "criticalNotes", "transferDeadlines", "resources": all destination-specific. Do not reference CSU/UC/ASSIST for Texas routes; use ApplyTexas, the college's degree plans, TCCNS, and the university's transfer equivalency tool instead.
- "majorCourses": in "notes", always state whether the course counts toward the major/degree at the destination or transfers as elective credit only.


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

    // Deduct a credit (skip when regenerating)
    if (!skipCreditDeduction) {
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
    const { communityCollege, major, degreeType, state, routeId, userId, destinationSystem, destinationCampus, skipCreditDeduction } = await req.json();

    if (!communityCollege || !major || !routeId || !userId) {
      return new Response(
        JSON.stringify({ error: 'communityCollege, major, routeId, and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Received dashboard generation request for route', routeId);

    // For regeneration: clear any prior dashboards so the latest one is loaded.
    if (skipCreditDeduction) {
      const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      await supabaseAdmin.from('route_dashboards').delete().eq('route_id', routeId);
    }

    const work = generateDashboard(
      communityCollege,
      major,
      degreeType || 'AS-T',
      state || 'California',
      routeId,
      userId,
      destinationSystem || 'CSU',
      destinationCampus || '',
      Boolean(skipCreditDeduction),
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
