import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// MET values for different exercise types (Metabolic Equivalent of Task)
const MET_VALUES: { [key: string]: number } = {
  // Cardio
  'running': 8.0,
  'jogging': 7.0,
  'walking': 3.5,
  'cycling': 7.5,
  'swimming': 8.0,
  'hiking': 6.0,
  'dancing': 5.0,
  'aerobics': 6.5,
  'jump rope': 12.0,
  'elliptical': 7.0,
  'stair climbing': 8.5,
  
  // Strength
  'weight lifting': 6.0,
  'bodyweight': 5.5,
  'resistance training': 5.0,
  'push ups': 5.5,
  'pull ups': 8.0,
  'squats': 5.5,
  
  // Flexibility & Mind-body
  'yoga': 3.0,
  'pilates': 4.0,
  'stretching': 2.5,
  'tai chi': 3.0,
  
  // Sports
  'basketball': 8.0,
  'soccer': 10.0,
  'tennis': 7.0,
  'badminton': 5.5,
  'volleyball': 4.0,
  'cricket': 5.0,
  'football': 8.0,
  
  // Default
  'cardio': 7.0,
  'strength': 5.5,
  'flexibility': 3.0,
  'sports': 7.5,
  'other': 5.0,
};

function getMETValue(exerciseName: string, exerciseType: string): number {
  const name = exerciseName.toLowerCase();
  
  // Try to match exact exercise name
  for (const [key, value] of Object.entries(MET_VALUES)) {
    if (name.includes(key)) {
      return value;
    }
  }
  
  // Fall back to exercise type
  if (exerciseType && MET_VALUES[exerciseType.toLowerCase()]) {
    return MET_VALUES[exerciseType.toLowerCase()];
  }
  
  // Default MET value
  return 5.5;
}

function calculateCaloriesBurned(
  weight: number,
  duration: number,
  met: number
): number {
  // Formula: Calories = MET × weight(kg) × duration(hours)
  const durationHours = duration / 60;
  return Math.round(met * weight * durationHours);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { exerciseName, exerciseType, duration } = await req.json();
    
    if (!exerciseName || !duration) {
      return new Response(
        JSON.stringify({ error: "Exercise name and duration are required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the authorization header
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
      // Decode JWT payload (without verification since verify_jwt is false)
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub;
      
      if (!userId) {
        console.error('No user ID in token');
        return new Response(
          JSON.stringify({ error: "Invalid token: no user ID" }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
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

    // Fetch user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('weight, height, age, gender')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: "Could not fetch user profile" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile.weight) {
      return new Response(
        JSON.stringify({ error: "Please complete your profile with weight information" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get MET value for this exercise
    const met = getMETValue(exerciseName, exerciseType || '');
    
    // Calculate calories burned
    const caloriesBurned = calculateCaloriesBurned(
      profile.weight,
      duration,
      met
    );

    console.log('Exercise analysis:', {
      exerciseName,
      exerciseType,
      duration,
      weight: profile.weight,
      met,
      caloriesBurned
    });

    return new Response(
      JSON.stringify({
        caloriesBurned,
        met,
        exerciseInfo: `Based on your weight (${profile.weight}kg) and a MET value of ${met}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing exercise:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
