import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { prompt, scholarship_name, sponsor, target_word_count, tone } = await req.json();
    if (!prompt) return new Response(JSON.stringify({ error: 'prompt required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: profile } = await admin.from('scholarship_profiles').select('*').eq('user_id', user.id).maybeSingle();

    const profileSummary = profile ? `
Student profile:
- Major: ${profile.intended_major || 'unspecified'}
- GPA: ${profile.current_gpa ?? 'n/a'}
- State: ${profile.state_of_residence || 'n/a'}
- Ethnicity: ${(profile.ethnicities || []).join(', ') || 'n/a'}
- First-generation: ${profile.first_generation_college ? 'yes' : 'no'}
- Pell-eligible: ${profile.pell_grant_eligible ? 'yes' : 'no'}
- Career goal: ${profile.career_goal || 'n/a'}
- Career motivation: ${profile.career_motivation || 'n/a'}
- Challenges overcome: ${profile.challenges_overcome || 'n/a'}
- Unique attributes: ${profile.unique_attributes || 'n/a'}
- Leadership: ${(profile.leadership_roles || []).join(', ') || 'n/a'}
- Community service hours: ${profile.community_service_hours ?? 0}
` : 'Student has not completed their scholarship profile.';

    const sys = `You are an essay coach helping California community college transfer students draft scholarship essays. Write in the student's voice — earnest, specific, concrete. Avoid clichés and generic platitudes. Use details from the profile. Target ~${target_word_count || 500} words. Tone: ${tone || 'authentic and reflective'}. Do NOT fabricate facts not in the profile — if details are missing, leave clearly marked [bracketed placeholders] for the student to fill in.`;

    const userMsg = `Scholarship: ${scholarship_name}\nSponsor: ${sponsor || ''}\nPrompt: ${prompt}\n\n${profileSummary}\n\nDraft the essay now.`;

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'system', content: sys }, { role: 'user', content: userMsg }],
      }),
    });
    if (!aiResp.ok) {
      const errText = await aiResp.text();
      return new Response(JSON.stringify({ error: 'AI failed', details: errText }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const aiData = await aiResp.json();
    const draft = aiData?.choices?.[0]?.message?.content || '';

    return new Response(JSON.stringify({ draft }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
