import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TONE_DESCRIPTIONS: Record<string, string> = {
  inspirational: 'Hopeful, forward-looking. Show how challenges shaped purpose.',
  professional: 'Mature, articulate, polished. Lead with achievements and clear goals.',
  personal: 'Story-driven, vulnerable. Use vivid scenes and specific moments.',
  bold: 'Confident and direct. Take a clear stance and defend it.',
};

const SYSTEM_PROMPT = `You are an expert scholarship essay writer helping a community college transfer student. Write essays that are specific, personal, and genuinely compelling — never generic. Pull only from the student's actual background; do not invent achievements, statistics, family situations, or experiences that aren't in their profile. Match the requested tone exactly. Stay under the word limit. Do not use AI clichés like 'In conclusion,' 'Throughout my journey,' 'I have always been passionate about,' or excessive adjectives. Write the way a thoughtful student would write.`;

function line(label: string, value: any): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && !value.trim()) return null;
  if (Array.isArray(value) && value.length === 0) return null;
  if (typeof value === 'boolean') return `- ${label}: ${value ? 'yes' : 'no'}`;
  if (Array.isArray(value)) return `- ${label}: ${value.join(', ')}`;
  return `- ${label}: ${value}`;
}

function section(title: string, items: (string | null)[]): string {
  const filtered = items.filter(Boolean) as string[];
  if (filtered.length === 0) return '';
  return `${title}:\n${filtered.join('\n')}\n\n`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = claimsData.claims.sub as string;

    const body = await req.json();
    const { applicationId, promptIndex, tone, mode, currentContent } = body || {};

    if (!applicationId || typeof promptIndex !== 'number' || !tone || !mode) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!TONE_DESCRIPTIONS[tone]) {
      return new Response(JSON.stringify({ error: 'Invalid tone' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (mode !== 'generate' && !currentContent) {
      return new Response(JSON.stringify({ error: 'currentContent is required for this mode' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Load application
    const { data: app, error: appErr } = await supabase
      .from('scholarship_applications').select('*').eq('id', applicationId).maybeSingle();
    if (appErr || !app) {
      return new Response(JSON.stringify({ error: 'Application not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const [{ data: scholarship }, { data: profile }, { data: route }, { data: profileRow }] = await Promise.all([
      supabase.from('scholarships').select('*').eq('id', app.scholarship_id).maybeSingle(),
      supabase.from('scholarship_profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('routes').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('profiles').select('full_name').eq('id', userId).maybeSingle(),
    ]);

    if (!scholarship) {
      return new Response(JSON.stringify({ error: 'Scholarship not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let routeInputs: any = null;
    if (route?.id) {
      const { data: ri } = await supabase.from('route_inputs').select('*').eq('route_id', route.id).maybeSingle();
      routeInputs = ri;
    }

    const prompts = Array.isArray(scholarship.essay_prompts) ? scholarship.essay_prompts : [];
    if (promptIndex < 0 || promptIndex >= prompts.length) {
      return new Response(JSON.stringify({ error: 'promptIndex out of range' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const rawPrompt: any = prompts[promptIndex];
    const promptText = typeof rawPrompt === 'object' ? (rawPrompt.prompt || rawPrompt.question || '') : String(rawPrompt);
    const promptTitle = typeof rawPrompt === 'object' ? (rawPrompt.title || `Essay ${promptIndex + 1}`) : `Essay ${promptIndex + 1}`;
    const maxWords = (typeof rawPrompt === 'object' && (rawPrompt.max_words || rawPrompt.word_limit)) || 500;

    const p = profile || {};
    const workExp = Array.isArray(p.work_experience) && p.work_experience.length
      ? p.work_experience.map((w: any) => typeof w === 'object' ? `${w.title || ''} at ${w.employer || w.company || ''}`.trim() : String(w)).join('; ')
      : null;

    let userPrompt = '';
    userPrompt += section('STUDENT BACKGROUND', [
      line('Name', profileRow?.full_name),
      line('Community college', route?.community_college),
      line('Major', p.intended_major || route?.major),
      line('Target transfer university', route?.destination_university),
      line('GPA', p.current_gpa ?? routeInputs?.gpa),
      line('Transfer term', route?.transfer_term),
    ]);
    userPrompt += section('DEMOGRAPHICS (use only if directly relevant to the essay prompt)', [
      line('Ethnicities', p.ethnicities),
      line('Gender', p.gender),
      line('First-generation college student', p.first_generation_college),
      line('LGBTQ+', p.lgbtq),
      line('Citizenship', p.citizenship_status),
      line('Veteran or military family', p.veteran_or_military_family),
      line('Location', [p.city, p.state_of_residence].filter(Boolean).join(', ') || null),
    ]);
    userPrompt += section('FINANCIAL CONTEXT (use only if relevant)', [
      line('Pell Grant eligible', p.pell_grant_eligible),
      line('Household income', p.household_income_range),
      line('Single-parent household', p.single_parent_household),
    ]);
    userPrompt += section('ACTIVITIES & EXPERIENCE (cite specific examples — these are real)', [
      line('Community service hours', p.community_service_hours),
      line('Leadership roles', p.leadership_roles),
      line('Sports', p.sports),
      line('Arts', p.arts_activities),
      line('Clubs/organizations', p.clubs_organizations),
      line('Work experience', workExp),
    ]);
    userPrompt += section('PERSONAL CONTEXT (use as raw material for stories)', [
      line('Challenges overcome', p.challenges_overcome),
      line('Unique attributes', p.unique_attributes),
      line('Career motivation', p.career_motivation),
      line('Career goal', p.career_goal),
    ]);
    userPrompt += section('SCHOLARSHIP', [
      line('Name', scholarship.name),
      line('Sponsor', scholarship.sponsor),
      line('About', scholarship.description),
    ]);
    userPrompt += `ESSAY PROMPT (answer this exactly):\n${promptText}\n\n`;
    userPrompt += `CONSTRAINTS:\n- Maximum ${maxWords} words — aim for 90-95% of the limit.\n- Tone: ${tone} — ${TONE_DESCRIPTIONS[tone]}\n\n`;

    if (mode === 'generate') {
      userPrompt += `Write the essay now. Return only the essay text — no preamble, no quotes, no markdown.`;
    } else if (mode === 'improve') {
      userPrompt += `Here is the student's current draft. Improve it: keep their authentic voice and specific details, but tighten the language, strengthen weak sentences, and remove anything generic.\n\nCurrent draft:\n${currentContent}\n\nReturn only the improved essay text.`;
    } else if (mode === 'shorten') {
      userPrompt += `Here is the student's current draft. Cut it to roughly 70% of its current length. Preserve the most powerful specific details and the core message. Remove filler, not substance.\n\nCurrent draft:\n${currentContent}\n\nReturn only the shortened essay text.`;
    } else if (mode === 'expand') {
      userPrompt += `Here is the student's current draft. Expand it using more concrete specifics from the student's background — but only details that fit naturally. Do not pad with generic statements. Stay under the word limit.\n\nCurrent draft:\n${currentContent}\n\nReturn only the expanded essay text.`;
    } else if (mode === 'stronger') {
      userPrompt += `Here is the student's current draft. Make it stronger: more confident, sharper thesis, replace weak verbs, cut hedging language. Keep all the student's authentic personal details.\n\nCurrent draft:\n${currentContent}\n\nReturn only the stronger essay text.`;
    } else {
      return new Response(JSON.stringify({ error: 'Invalid mode' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        temperature: 0.7,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error('AI gateway error:', aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit reached, please try again in a moment.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Add credits to continue.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ error: 'AI gateway error' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const aiData = await aiResp.json();
    const essay = (aiData?.choices?.[0]?.message?.content || '').trim();
    if (!essay) {
      return new Response(JSON.stringify({ error: 'AI returned empty response, please try again' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const wordCount = essay.split(/\s+/).filter(Boolean).length;

    // Find existing essay row by application_id + prompt
    const { data: existing } = await supabase
      .from('essays').select('id').eq('application_id', applicationId).eq('prompt', promptText).maybeSingle();

    if (existing?.id) {
      await supabase.from('essays').update({
        content: essay, word_count: wordCount, tone,
      }).eq('id', existing.id);
    } else {
      await supabase.from('essays').insert({
        user_id: userId,
        application_id: applicationId,
        title: promptTitle,
        prompt: promptText,
        content: essay,
        word_count: wordCount,
        tone,
      });
    }

    return new Response(JSON.stringify({ essay, wordCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('generate-scholarship-essay error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
