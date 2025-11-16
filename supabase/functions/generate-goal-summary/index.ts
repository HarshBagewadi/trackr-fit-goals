import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    await req.json();
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract JWT token and decode to get user ID
    const token = authHeader.replace('Bearer ', '');
    let userId: string;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub;
      if (!userId) throw new Error('No user ID in token');
      console.log('Authenticated user:', userId);
    } catch (error) {
      console.error('Token decode error:', error);
      return new Response(
        JSON.stringify({ error: "Invalid token format" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch user data
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const [profileResult, mealsResult, exercisesResult, sleepResult] = await Promise.all([
      supabaseClient.from('profiles').select('*').eq('id', userId).single(),
      supabaseClient.from('meals').select('*').eq('user_id', userId).gte('consumed_at', weekAgo).order('consumed_at', { ascending: false }),
      supabaseClient.from('exercises').select('*').eq('user_id', userId).gte('exercise_date', weekAgo).order('exercise_date', { ascending: false }),
      supabaseClient.from('sleep_logs').select('*').eq('user_id', userId).gte('sleep_date', weekAgo).order('sleep_date', { ascending: false })
    ]);

    const profile = profileResult.data;
    const meals = mealsResult.data || [];
    const exercises = exercisesResult.data || [];
    const sleepLogs = sleepResult.data || [];

    // Calculate totals
    const totalCalories = meals.reduce((sum, meal) => sum + Number(meal.calories), 0);
    const totalProtein = meals.reduce((sum, meal) => sum + Number(meal.protein), 0);
    const totalExerciseMinutes = exercises.reduce((sum, ex) => sum + Number(ex.duration), 0);
    const avgSleepHours = sleepLogs.length > 0 
      ? sleepLogs.reduce((sum, log) => sum + Number(log.hours_slept), 0) / sleepLogs.length 
      : 0;

    // Build context for AI
    const contextInfo = `
User Profile:
- Name: ${profile?.name || 'User'}
- Age: ${profile?.age || 'Not set'}, Gender: ${profile?.gender || 'Not set'}
- Current Weight: ${profile?.weight || 'Not set'}kg, Height: ${profile?.height || 'Not set'}cm
- Fitness Goal: ${profile?.goal || 'Not set'}
- Activity Level: ${profile?.activity_level || 'Not set'}
- Daily Calorie Goal: ${profile?.daily_calorie_goal || 'Not set'} calories

Recent Activity (Last 7 Days):
- Meals Logged: ${meals.length} meals (Total: ${totalCalories.toFixed(0)} calories, ${totalProtein.toFixed(0)}g protein)
- Exercises: ${exercises.length} sessions (Total: ${totalExerciseMinutes} minutes)
- Sleep: ${sleepLogs.length} entries (Average: ${avgSleepHours.toFixed(1)} hours/night)

Detailed Logs:
${meals.length > 0 ? `\nRecent Meals:\n${meals.slice(0, 5).map(m => `- ${m.meal_name}: ${m.calories} cal, ${m.protein}g protein (${new Date(m.consumed_at).toLocaleDateString()})`).join('\n')}` : ''}
${exercises.length > 0 ? `\n\nRecent Exercises:\n${exercises.slice(0, 5).map(e => `- ${e.exercise_name}: ${e.duration} min, ${e.calories_burnt} cal (${e.exercise_date})`).join('\n')}` : ''}
${sleepLogs.length > 0 ? `\n\nRecent Sleep:\n${sleepLogs.slice(0, 5).map(s => `- ${s.hours_slept} hours, Quality: ${s.sleep_quality || 'Not rated'} (${s.sleep_date})`).join('\n')}` : ''}
`;

    const systemPrompt = `You are an expert fitness coach and goal-setting specialist. Analyze the user's actual fitness data and profile to create:

1. A concise summary of their current progress and patterns
2. Specific insights based on their logged data
3. Specific, measurable, achievable, relevant, and time-bound (SMART) goals
4. An actionable step-by-step plan to achieve those goals
5. Key areas for improvement based on their data
6. Motivational encouragement based on their efforts

${contextInfo}

Provide a well-structured, personalized response that is encouraging, realistic, and actionable. Format your response clearly with sections and bullet points where appropriate. Be specific and reference their actual data.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: systemPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const summary = data.choices[0].message.content;

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Summary generation error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
