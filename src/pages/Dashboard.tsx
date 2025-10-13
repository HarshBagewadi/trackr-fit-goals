import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { ProfileOnboarding } from "@/components/ProfileOnboarding";
import { MealTracker } from "@/components/MealTracker";
import { ExerciseTracker } from "@/components/ExerciseTracker";
import { SleepTracker } from "@/components/SleepTracker";
import { MotivationalQuotes } from "@/components/MotivationalQuotes";
import { RecipeIdeas } from "@/components/RecipeIdeas";
import { HealthTips } from "@/components/HealthTips";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { getAuthState } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const navigate = useNavigate();

  const calculateCalorieGoal = (profile: any) => {
    if (!profile.weight || !profile.height || !profile.age || !profile.gender || !profile.activity_level || !profile.goal) {
      return null;
    }

    // BMR calculation using Mifflin-St Jeor Equation
    let bmr;
    if (profile.gender === "male") {
      bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
    } else {
      bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
    }

    // Activity multipliers
    const activityMultipliers: { [key: string]: number } = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };

    const tdee = bmr * (activityMultipliers[profile.activity_level] || 1.2);

    // Adjust based on goal
    if (profile.goal === "gain") return Math.round(tdee + 300);
    if (profile.goal === "lose") return Math.round(tdee - 500);
    return Math.round(tdee);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { user } = await getAuthState();
      if (!user) {
        navigate("/auth");
      } else {
        setUser(user);
        
        // Fetch profile
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (data) {
          // Auto-fix invalid calorie goals
          if (!data.daily_calorie_goal || data.daily_calorie_goal <= 0) {
            const calculatedGoal = calculateCalorieGoal(data);
            if (calculatedGoal) {
              // Update the database with correct value
              await supabase
                .from("profiles")
                .update({ daily_calorie_goal: calculatedGoal })
                .eq("id", user.id);
              
              data.daily_calorie_goal = calculatedGoal;
            }
          }
        }
        
        setProfile(data);
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleOnboardingComplete = async () => {
    // Refetch profile after onboarding
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      setProfile(data);
    }
  };

  if (isLoading || !user) return null;

  // Check if profile is complete
  const isProfileComplete = profile?.weight && profile?.height && profile?.goal;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome back, {profile?.name || "User"}!
              </h1>
              <p className="text-muted-foreground mt-2">
                {isProfileComplete 
                  ? "Track your nutrition and reach your fitness goals"
                  : "Let's get your profile set up"}
              </p>
            </div>

            {/* Date Selector */}
            {isProfileComplete && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[280px] justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Show onboarding or dashboard content based on profile completion */}
          {!isProfileComplete ? (
            <ProfileOnboarding userId={user.id} onComplete={handleOnboardingComplete} />
          ) : (
            <div className="grid gap-6">
              {/* Motivational Quote */}
              <MotivationalQuotes />

              {/* Main Content Grid */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column - Nutrition & Exercise */}
                <div className="lg:col-span-2 space-y-6">
                  <MealTracker 
                    userId={user.id} 
                    dailyCalorieGoal={profile.daily_calorie_goal || 2000}
                    selectedDate={selectedDate}
                  />
                  
                  <ExerciseTracker userId={user.id} selectedDate={selectedDate} />
                </div>

                {/* Right Column - Sleep, Recipes & Tips */}
                <div className="space-y-6">
                  <SleepTracker userId={user.id} selectedDate={selectedDate} />
                  <RecipeIdeas />
                  <HealthTips />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
