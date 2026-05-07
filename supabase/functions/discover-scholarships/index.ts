import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DEFAULT_CATEGORIES = [
  "community college transfer",
  "California transfer student",
  "first-generation college",
  "STEM transfer",
  "women in STEM transfer",
  "Latino/Hispanic transfer",
  "Black/African American transfer",
  "Asian American transfer",
  "AAPI transfer",
  "low-income transfer",
  "Phi Theta Kappa",
  "AS-T AA-T degree",
  "community service scholarship",
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
        limit: 4,
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

async function runDiscovery(categories: string[]) {
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

  // Pre-fetch existing scholarships for fuzzy duplicate matching
  const { data: existingScholarships } = await supabaseAdmin
    .from('scholarships')
    .select('name, sponsor');
  const existingSet = new Set(
    (existingScholarships || []).map((s: any) => `${normalize(s.sponsor)}::${normalize(s.name).slice(0, 20)}`)
  );

  for (const category of categories) {
    const query = `${category} scholarship 2026 deadline application`;
    console.log(`Discovering: ${query}`);

    try {
      const scraped = await searchFirecrawl(query, firecrawlKey);
      if (!scraped) {
        console.log(`No scraped content for "${category}"`);
        continue;
      }

      const systemPrompt = `You are a scholarship research assistant. Extract real scholarship details from the provided web content. Only include scholarships where you can identify a real name, sponsor, and external URL. Do NOT invent or hallucinate scholarships. If amount or deadline is unclear, leave those fields null. Return JSON: { scholarships: [{ name, sponsor, amount_cents, deadline (YYYY-MM-DD or null), description, eligibility_criteria, essay_prompts, external_url, source_url, confidence_score (0 to 1) }] }`;

      const userPrompt = `Category: ${category}\n\nWeb content:\n\n${scraped.substring(0, 25000)}\n\nReturn ONLY valid JSON.`;

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
        console.error(`AI error for "${category}":`, aiResponse.status, errText);
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
        console.error(`Failed to parse AI JSON for "${category}":`, err);
        continue;
      }

      const scholarships = parsed?.scholarships || [];
      console.log(`Got ${scholarships.length} scholarships from AI for "${category}"`);

      for (const s of scholarships) {
        totalDiscovered++;

        const conf = typeof s.confidence_score === 'number' ? s.confidence_score : 0;
        if (conf < 0.6) continue;
        if (!s.name || !s.sponsor || !s.external_url) continue;

        const fpKey = `${normalize(s.sponsor)}::${normalize(s.name).slice(0, 20)}`;
        const isDuplicate = existingSet.has(fpKey);

        const row = {
          name: String(s.name).slice(0, 500),
          sponsor: String(s.sponsor).slice(0, 500),
          amount_cents: typeof s.amount_cents === 'number' ? s.amount_cents : null,
          deadline: s.deadline && /^\d{4}-\d{2}-\d{2}$/.test(s.deadline) ? s.deadline : null,
          description: s.description || null,
          eligibility_criteria: s.eligibility_criteria || {},
          essay_prompts: s.essay_prompts || [],
          external_url: s.external_url,
          source_query: query,
          source_url: s.source_url || null,
          confidence_score: conf,
          status: isDuplicate ? 'duplicate' : 'pending',
        };

        const { error: insertErr } = await supabaseAdmin
          .from('scholarship_candidates')
          .insert(row);

        if (insertErr) {
          // Likely unique constraint violation - that's ok, just skip
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
      console.error(`Error processing category "${category}":`, err);
    }
  }

  console.log(`Discovery complete: discovered=${totalDiscovered}, inserted=${totalInserted}, duplicates=${totalDuplicates}`);
  return { discovered: totalDiscovered, inserted: totalInserted, duplicates: totalDuplicates };
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
    const categories: string[] = Array.isArray(body?.categories) && body.categories.length > 0
      ? body.categories
      : DEFAULT_CATEGORIES;

    console.log(`Starting discovery for ${categories.length} categories`);

    const work = runDiscovery(categories).catch(err => {
      console.error('Background discovery failed:', err);
    });
    EdgeRuntime.waitUntil(work);

    return new Response(
      JSON.stringify({ success: true, status: 'processing', categories: categories.length }),
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
