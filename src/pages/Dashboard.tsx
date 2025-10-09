import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Apple, Activity, TrendingUp, Zap } from "lucide-react";
import { getAuthState } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();

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
        
        setProfile(data);
      }
    };
    checkAuth();
  }, [navigate]);

  if (!user) return null;

  const stats = [
    {
      icon: Apple,
      title: "Calories Today",
      value: "0",
      goal: profile?.daily_calorie_goal || "0",
      color: "text-primary",
    },
    {
      icon: Activity,
      title: "Calories Burned",
      value: "0",
      goal: "500",
      color: "text-accent",
    },
    {
      icon: TrendingUp,
      title: "Current Weight",
      value: profile?.weight ? `${profile.weight} kg` : "Not set",
      goal: "",
      color: "text-success",
    },
    {
      icon: Zap,
      title: "Streak",
      value: "0 days",
      goal: "",
      color: "text-primary",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {profile?.name || "User"}!
            </h1>
            <p className="text-muted-foreground mt-2">
              Track your nutrition and reach your fitness goals
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="bg-gradient-card hover:shadow-glow transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    {stat.goal && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Goal: {stat.goal}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Apple className="h-5 w-5 text-primary" />
                  Quick Add Meal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Start tracking your meals to reach your daily calorie goal
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-accent" />
                  Log Workout
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Record your exercise to track calories burned
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
