import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const STEM_KEYWORDS = ['engineering', 'computer', 'biology', 'chemistry', 'physics', 'math', 'data', 'stem', 'technology', 'science'];
const LOW_INCOME_RANGES = ['under_25k', 'under_30k', '25k_50k', '30k_50k'];

function normalize(s: string): string {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function buildQueries(profile: any, route: any): string[] {
  const q: string[] = [];
  const major = profile.intended_major || route?.major || '';
  const state = profile.state_of_residence || 'CA';
  const city = profile.city || '';
  const ethnicities: string[] = profile.ethnicities || [];
  const isLowIncome = profile.pell_grant_eligible === true || (profile.household_income_range && LOW_INCOME_RANGES.includes(profile.household_income_range));
  const isStem = major && STEM_KEYWORDS.some(k => major.toLowerCase().includes(k));

  for (const eth of ethnicities.slice(0, 2)) {
    q.push(`${eth} community college transfer scholarship 2026`);
    if (major) q.push(`${eth} ${major} transfer scholarship`);
  }
  if (profile.first_generation_college) {
    q.push(`first generation college transfer scholarship ${state}`);
  }
  if (profile.gender && profile.gender.toLowerCase() === 'female' && isStem) {
    q.push(`women in STEM transfer scholarship ${major}`);
  }
  if (profile.lgbtq) {
    q.push('LGBTQ transfer scholarship application 2026');
  }
  if (profile.veteran_or_military_family) {
    q.push('military family transfer scholarship community college');
  }
  if (isLowIncome) {
    q.push('low-income transfer scholarship Pell eligible');
  }
  if (city) {
    q.push(`${city} ${state} community college scholarship`);
  }
  if (major) {
    q.push(`${major} transfer scholarship CSU UC California`);
  }
  if (route?.destination_university) {
    q.push(`${route.destination_university} transfer scholarship application`);
  }
  if (route?.community_college) {
    q.push(`${route.community_college} foundation scholarship transfer student`);
  }

  // Dedup, cap at 10
  return Array.from(new Set(q)).slice(0, 10);
}

async function searchFirecrawl(query: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit: 3, scrapeOptions: { formats: ['markdown'] } }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error(`Firecrawl error for "${query}":`, data);
      return '';
    }
    const results = data?.data || [];
    return results.map((r: any) => `## ${r.title || r.url}\nURL: ${r.url}\n${r.markdown || r.description || ''}`).join('\n\n---\n\n');
  } catch (err) {
    console.error(`Failed to search "${query}":`, err);
    return '';
  }
}

async function runDiscoveryForUser(userId: string) {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!firecrawlKey || !lovableApiKey) throw new Error('Missing API keys');

  // Load profile
  const { data: profile } = await supabaseAdmin.from('scholarship_profiles').select('*').eq('user_id', userId).maybeSingle();
  if (!profile) throw new Error('NO_PROFILE');

  const { data: routes } = await supabaseAdmin.from('routes').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1);
  const route = routes?.[0] || null;
  let routeInputs: any = null;
  if (route) {
    const { data: ri } = await supabaseAdmin.from('route_inputs').select('*').eq('route_id', route.id).maybeSingle();
    routeInputs = ri;
  }

  const queries = buildQueries(profile, route);
  if (queries.length === 0) {
    await supabaseAdmin.from('user_discovery_runs').insert({ user_id: userId, query_count: 0, results_count: 0 });
    return { discovered: 0, queries: 0 };
  }

  // Pre-fetch existing for dedup
  const { data: existingScholarships } = await supabaseAdmin.from('scholarships').select('name, sponsor');
  const { data: existingPersonal } = await supabaseAdmin
    .from('scholarship_candidates')
    .select('name, sponsor')
    .eq('discovered_for_user_id', userId);
  const existingSet = new Set<string>();
  for (const s of (existingScholarships || [])) existingSet.add(`${normalize(s.sponsor)}::${normalize(s.name).slice(0, 20)}`);
  for (const s of (existingPersonal || [])) existingSet.add(`${normalize(s.sponsor)}::${normalize(s.name).slice(0, 20)}`);

  // Parallel scrapes
  const scraped = await Promise.all(queries.map(async (q) => ({ q, content: await searchFirecrawl(q, firecrawlKey) })));
  const combined = scraped.filter(s => s.content).map(s => `# Query: ${s.q}\n\n${s.content}`).join('\n\n===\n\n');

  if (!combined) {
    await supabaseAdmin.from('user_discovery_runs').insert({ user_id: userId, query_count: queries.length, results_count: 0 });
    return { discovered: 0, queries: queries.length };
  }

  const profileForAI = {
    intended_major: profile.intended_major,
    current_gpa: profile.current_gpa,
    ethnicities: profile.ethnicities,
    gender: profile.gender,
    first_generation_college: profile.first_generation_college,
    pell_grant_eligible: profile.pell_grant_eligible,
    household_income_range: profile.household_income_range,
    state_of_residence: profile.state_of_residence,
    city: profile.city,
    citizenship_status: profile.citizenship_status,
    lgbtq: profile.lgbtq,
    veteran_or_military_family: profile.veteran_or_military_family,
    disability_status: profile.disability_status,
    religion: profile.religion,
    leadership_roles: profile.leadership_roles,
    sports: profile.sports,
    arts_activities: profile.arts_activities,
    clubs_organizations: profile.clubs_organizations,
    community_service_hours: profile.community_service_hours,
    career_goal: profile.career_goal,
    community_college: route?.community_college,
    destination_university: route?.destination_university,
    transfer_term: route?.transfer_term,
  };

  const systemPrompt = `You are a scholarship research assistant searching for ONE specific California community college transfer student. The student's profile is provided below. Only return scholarships where THIS specific student clearly qualifies based on their actual profile. Reject anything that doesn't directly fit. Do not invent details — only extract verifiable data from the source content. For each scholarship, score relevance to THIS student 0-1 — be strict, only return relevance >= 0.7.

For each scholarship return: { name, sponsor, amount_cents (integer or null), deadline (YYYY-MM-DD or null), description, eligibility_criteria (object), essay_prompts (array of strings), external_url, source_url, confidence_score (0-1), relevance_score (0-1), relevance_reasoning (one sentence explaining why THIS student fits) }

Return JSON: { scholarships: [...] }`;

  const userPrompt = `STUDENT PROFILE:\n${JSON.stringify(profileForAI, null, 2)}\n\nWEB CONTENT FROM TARGETED SEARCHES:\n\n${combined.substring(0, 60000)}\n\nReturn ONLY valid JSON with scholarships matching THIS specific student.`;

  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
  });

  if (!aiResponse.ok) {
    const errText = await aiResponse.text();
    console.error('AI error:', aiResponse.status, errText);
    await supabaseAdmin.from('user_discovery_runs').insert({ user_id: userId, query_count: queries.length, results_count: 0 });
    throw new Error(`AI gateway error: ${aiResponse.status}`);
  }

  const aiData = await aiResponse.json();
  const content = aiData?.choices?.[0]?.message?.content || '';
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  let parsed: any = {};
  try { parsed = JSON.parse(cleaned); } catch (e) { console.error('parse err', e); }

  const scholarships = parsed?.scholarships || [];
  const today = new Date().toISOString().slice(0, 10);
  let inserted = 0;

  for (const s of scholarships) {
    const conf = typeof s.confidence_score === 'number' ? s.confidence_score : 0;
    const rel = typeof s.relevance_score === 'number' ? s.relevance_score : 0;
    if (!s.name || !s.sponsor || !s.external_url) continue;
    if (rel < 0.7 || conf < 0.6) continue;
    const deadline = s.deadline && /^\d{4}-\d{2}-\d{2}$/.test(s.deadline) ? s.deadline : null;
    if (deadline && deadline < today) continue;

    const fp = `${normalize(s.sponsor)}::${normalize(s.name).slice(0, 20)}`;
    if (existingSet.has(fp)) continue;

    const { error: insErr } = await supabaseAdmin.from('scholarship_candidates').insert({
      name: String(s.name).slice(0, 500),
      sponsor: String(s.sponsor).slice(0, 500),
      amount_cents: typeof s.amount_cents === 'number' ? s.amount_cents : null,
      deadline,
      description: s.description || null,
      eligibility_criteria: s.eligibility_criteria || {},
      essay_prompts: s.essay_prompts || [],
      external_url: s.external_url,
      source_query: 'personal: ' + queries.join(' | '),
      source_url: s.source_url || null,
      confidence_score: conf,
      relevance_score: rel,
      relevance_reasoning: s.relevance_reasoning || null,
      status: 'pending',
      discovered_for_user_id: userId,
    });
    if (!insErr) {
      inserted++;
      existingSet.add(fp);
    } else {
      console.error('insert err', insErr);
    }
  }

  await supabaseAdmin.from('user_discovery_runs').insert({
    user_id: userId,
    query_count: queries.length,
    results_count: inserted,
  });

  return { discovered: inserted, queries: queries.length };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Invalid auth' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Rate limit
    const { data: countData, error: rpcErr } = await supabaseAdmin.rpc('user_discovery_runs_today', { _user_id: user.id });
    if (rpcErr) console.error('rate limit rpc err', rpcErr);
    const used = (countData as number) ?? 0;
    if (used >= 5) {
      return new Response(
        JSON.stringify({ error: 'Daily limit of 5 AI searches reached. Try again tomorrow.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Profile check
    const { data: profile } = await supabaseAdmin.from('scholarship_profiles').select('id').eq('user_id', user.id).maybeSingle();
    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'Complete your scholarship profile first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Run synchronously so we can return real counts (takes 30-90s)
    const result = await runDiscoveryForUser(user.id);

    return new Response(
      JSON.stringify({
        discovered: result.discovered,
        queries: result.queries,
        remainingToday: Math.max(0, 5 - (used + 1)),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('handler error:', error);
    const msg = error?.message === 'NO_PROFILE'
      ? 'Complete your scholarship profile first.'
      : (error?.message || 'Unknown error');
    const status = error?.message === 'NO_PROFILE' ? 400 : 500;
    return new Response(
      JSON.stringify({ error: msg }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
