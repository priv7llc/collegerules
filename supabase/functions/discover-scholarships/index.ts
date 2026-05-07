import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DEFAULT_SEARCH_QUERIES = [
  // Transfer-specific foundations
  "Jack Kent Cooke Undergraduate Transfer Scholarship application",
  "Phi Theta Kappa transfer scholarship California 2026",
  "California community college transfer scholarship 2026 deadline",
  "AS-T AA-T degree transfer scholarship CSU",

  // Identity-based foundations (real organizations)
  "Hispanic Scholarship Fund transfer student",
  "UNCF Pell Grant transfer scholarship",
  "Asian Pacific Fund scholarship transfer",
  "American Indian College Fund transfer",
  "Point Foundation LGBTQ transfer scholarship",

  // Need + first-gen
  "first generation college transfer scholarship California",
  "low-income community college transfer scholarship 2026",
  "Pell Grant eligible transfer scholarship",

  // System-specific
  "CSU transfer scholarship application 2026",
  "UC transfer scholarship California community college",
  "site:csumentor.edu transfer scholarship",
  "site:admission.universityofcalifornia.edu transfer scholarship",

  // Major-specific transfer
  "STEM community college transfer scholarship women",
  "business administration transfer scholarship",
  "computer science transfer scholarship community college",
  "nursing transfer scholarship California",

  // Aggregator deep links (these have curation)
  "site:bold.org community college transfer California",
  "site:scholarships.com transfer student California 2026",
];

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
        limit: 5,
        scrapeOptions: { formats: ['markdown'] },
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error(`Firecrawl search error for "${query}":`, data);
      return '';
    }
    const results = data?.data || [];
    return results.map((r: any) => `## ${r.title || r.url}\nURL: ${r.url}\n${r.markdown || r.description || ''}`).join('\n\n---\n\n');
  } catch (err) {
    console.error(`Failed to search "${query}":`, err);
    return '';
  }
}

function normalize(s: string): string {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function runDiscovery(queries: string[]) {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

  if (!firecrawlKey) throw new Error('FIRECRAWL_API_KEY not configured');
  if (!lovableApiKey) throw new Error('LOVABLE_API_KEY not configured');

  let totalDiscovered = 0;
  let totalInserted = 0;
  let totalDuplicates = 0;
  let totalRejected = 0;

  const today = new Date().toISOString().slice(0, 10);

  // Pre-fetch existing scholarships for fuzzy duplicate matching
  const { data: existingScholarships } = await supabaseAdmin
    .from('scholarships')
    .select('name, sponsor');
  const existingSet = new Set(
    (existingScholarships || []).map((s: any) => `${normalize(s.sponsor)}::${normalize(s.name).slice(0, 20)}`)
  );

  for (const query of queries) {
    console.log(`Discovering: ${query}`);

    try {
      const scraped = await searchFirecrawl(query, firecrawlKey);
      if (!scraped) {
        console.log(`No scraped content for "${query}"`);
        continue;
      }

      const systemPrompt = `You are a scholarship research assistant for a service that helps CALIFORNIA COMMUNITY COLLEGE TRANSFER STUDENTS find scholarships to fund their transfer to a 4-year university (CSU or UC system).

Your job is to extract ONLY scholarships that are genuinely useful to this specific audience. Be aggressive in rejecting scholarships that don't fit.

REJECT (return relevance_score < 0.5) any scholarship that is:
- Only for high school students
- Only for graduate students or PhD candidates
- Only for students already enrolled at a specific 4-year university (UNLESS that university is in the CSU or UC system AND it's for incoming transfers)
- A generic "all undergrads" scholarship with no transfer or community-college preference
- An employer-specific scholarship requiring employment at that company
- An international student scholarship requiring non-US citizenship
- Outdated (deadline already passed)
- A scam (asks for payment, no clear sponsor, no legitimate URL)

ACCEPT (relevance_score >= 0.7) scholarships that are:
- Specifically for community college transfer students
- For California residents transferring to CSU/UC
- For underrepresented groups transferring to a 4-year (Hispanic, Black, Native American, AAPI, LGBTQ, first-gen, low-income)
- Major-specific transfer scholarships in STEM, business, healthcare, education
- Foundation scholarships open to community college students
- For specific California community colleges or CSU/UC campuses

CONFIDENCE: separate field. Score 0-1 on how confident you are the data is real and accurate (not invented).

For each scholarship return: { name, sponsor, amount_cents (integer or null), deadline (YYYY-MM-DD or null), description, eligibility_criteria, essay_prompts, external_url, source_url, confidence_score (0-1), relevance_score (0-1), relevance_reasoning (one sentence) }

Return JSON: { scholarships: [...] }

If a scholarship's data is incomplete or unclear, set lower confidence. Never invent details. Always include the source_url where you found this data.`;

      const userPrompt = `Search query: ${query}\n\nWeb content:\n\n${scraped.substring(0, 25000)}\n\nReturn ONLY valid JSON.`;

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
          temperature: 0.2,
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error(`AI error for "${query}":`, aiResponse.status, errText);
        continue;
      }

      const aiData = await aiResponse.json();
      const content = aiData?.choices?.[0]?.message?.content;
      if (!content) continue;

      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch (err) {
        console.error(`Failed to parse AI JSON for "${query}":`, err);
        continue;
      }

      const scholarships = parsed?.scholarships || [];
      console.log(`Got ${scholarships.length} scholarships from AI for "${query}"`);

      for (const s of scholarships) {
        totalDiscovered++;

        const conf = typeof s.confidence_score === 'number' ? s.confidence_score : 0;
        const rel = typeof s.relevance_score === 'number' ? s.relevance_score : 0;

        if (!s.name || !s.sponsor || !s.external_url) { totalRejected++; continue; }
        if (rel < 0.6) { totalRejected++; continue; }
        if (conf < 0.6) { totalRejected++; continue; }

        const deadline = s.deadline && /^\d{4}-\d{2}-\d{2}$/.test(s.deadline) ? s.deadline : null;
        if (deadline && deadline < today) { totalRejected++; continue; }

        const fpKey = `${normalize(s.sponsor)}::${normalize(s.name).slice(0, 20)}`;
        const isDuplicate = existingSet.has(fpKey);

        const row = {
          name: String(s.name).slice(0, 500),
          sponsor: String(s.sponsor).slice(0, 500),
          amount_cents: typeof s.amount_cents === 'number' ? s.amount_cents : null,
          deadline,
          description: s.description || null,
          eligibility_criteria: s.eligibility_criteria || {},
          essay_prompts: s.essay_prompts || [],
          external_url: s.external_url,
          source_query: query,
          source_url: s.source_url || null,
          confidence_score: conf,
          relevance_score: rel,
          relevance_reasoning: s.relevance_reasoning || null,
          status: isDuplicate ? 'duplicate' : 'pending',
        };

        const { error: insertErr } = await supabaseAdmin
          .from('scholarship_candidates')
          .insert(row);

        if (insertErr) {
          if (insertErr.code === '23505') {
            totalDuplicates++;
          } else {
            console.error('Insert error:', insertErr);
          }
        } else {
          if (isDuplicate) {
            totalDuplicates++;
          } else {
            totalInserted++;
            existingSet.add(fpKey);
          }
        }
      }
    } catch (err) {
      console.error(`Error processing query "${query}":`, err);
    }
  }

  console.log(`Discovery complete: discovered=${totalDiscovered}, inserted=${totalInserted}, duplicates=${totalDuplicates}, rejected=${totalRejected}`);
  return { discovered: totalDiscovered, inserted: totalInserted, duplicates: totalDuplicates, rejected: totalRejected };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    // Accept either `queries` (preferred) or legacy `categories`
    const queries: string[] = Array.isArray(body?.queries) && body.queries.length > 0
      ? body.queries
      : Array.isArray(body?.categories) && body.categories.length > 0
        ? body.categories
        : DEFAULT_SEARCH_QUERIES;

    console.log(`Starting discovery for ${queries.length} queries`);

    const work = runDiscovery(queries).catch(err => {
      console.error('Background discovery failed:', err);
    });
    EdgeRuntime.waitUntil(work);

    return new Response(
      JSON.stringify({ success: true, status: 'processing', queries: queries.length, categories: queries.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in handler:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
