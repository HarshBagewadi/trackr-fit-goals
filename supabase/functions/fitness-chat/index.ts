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
    const { messages } = await req.json();
    
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

    // Fetch user data for context
    const [profileRes, mealsRes, exercisesRes, sleepRes] = await Promise.all([
      supabaseClient.from('profiles').select('*').eq('id', userId).single(),
      supabaseClient.from('meals').select('*').eq('user_id', userId).gte('consumed_at', new Date(new Date().setHours(0,0,0,0)).toISOString()).order('consumed_at', { ascending: false }),
      supabaseClient.from('exercises').select('*').eq('user_id', userId).gte('exercise_date', new Date().toISOString().split('T')[0]).order('created_at', { ascending: false }),
      supabaseClient.from('sleep_logs').select('*').eq('user_id', userId).order('sleep_date', { ascending: false }).limit(7)
    ]);

    const profile = profileRes.data;
    const meals = mealsRes.data || [];
    const exercises = exercisesRes.data || [];
    const sleepLogs = sleepRes.data || [];

    // Calculate daily totals
    const mealTotals = meals.reduce((acc, meal) => ({
      calories: acc.calories + Number(meal.calories),
      protein: acc.protein + Number(meal.protein),
      carbs: acc.carbs + Number(meal.carbs),
    }), { calories: 0, protein: 0, carbs: 0 });

    const exerciseTotals = exercises.reduce((acc, ex) => ({
      duration: acc.duration + ex.duration,
      calories: acc.calories + Number(ex.calories_burnt)
    }), { duration: 0, calories: 0 });

    // Build context for AI
    const userContext = `
User Profile:
- Name: ${profile?.name || 'User'}
- Age: ${profile?.age || 'Not set'}, Gender: ${profile?.gender || 'Not set'}
- Weight: ${profile?.weight || 'Not set'}kg, Height: ${profile?.height || 'Not set'}cm
- Goal: ${profile?.goal || 'Not set'} (Activity Level: ${profile?.activity_level || 'Not set'})
- Daily Calorie Goal: ${profile?.daily_calorie_goal || 'Not set'} calories
- Daily Protein Goal: ${profile?.weight ? Math.round(profile.weight * 2) : 'Not set'}g

Today's Nutrition Progress:
- Calories: ${mealTotals.calories} / ${profile?.daily_calorie_goal || 'N/A'} (${profile?.daily_calorie_goal ? Math.max(0, profile.daily_calorie_goal - mealTotals.calories) : 'N/A'} remaining)
- Protein: ${mealTotals.protein}g / ${profile?.weight ? Math.round(profile.weight * 2) : 'N/A'}g
- Carbs: ${mealTotals.carbs}g
- Meals logged: ${meals.length}

Today's Exercise:
- Total duration: ${exerciseTotals.duration} minutes
- Calories burned: ${exerciseTotals.calories}
- Exercises: ${exercises.map(e => `${e.exercise_name} (${e.duration}min, ${e.exercise_type || 'N/A'})`).join(', ') || 'None logged'}

Recent Sleep (last 7 days):
${sleepLogs.length > 0 ? sleepLogs.map(s => `- ${s.sleep_date}: ${s.hours_slept} hours (${s.sleep_quality || 'N/A'})`).join('\n') : '- No sleep data logged'}
`;

    const systemPrompt = `You are a personal fitness and nutrition AI coach. You have access to the user's complete fitness data and provide personalized, actionable advice.

${userContext}

Provide supportive, evidence-based guidance. Be encouraging and specific. Reference their actual data when giving advice. Keep responses concise but helpful.`;

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
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
