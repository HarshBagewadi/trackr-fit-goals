import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getAuthState } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { user } = await getAuthState();
      if (!user) {
        navigate("/auth");
      } else {
        setUser(user);
        
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

  const calculateCalorieGoal = (
    weight: number,
    height: number,
    age: number,
    gender: string,
    activityLevel: string,
    goal: string
  ) => {
    // BMR calculation using Mifflin-St Jeor Equation
    let bmr;
    if (gender === "male") {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Activity multipliers
    const activityMultipliers: { [key: string]: number } = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };

    const tdee = bmr * (activityMultipliers[activityLevel] || 1.2);

    // Adjust based on goal
    if (goal === "gain") return Math.round(tdee + 300);
    if (goal === "lose") return Math.round(tdee - 500);
    return Math.round(tdee);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const updates = {
      name: formData.get("name") as string,
      age: parseInt(formData.get("age") as string) || null,
      gender: formData.get("gender") as string,
      height: parseFloat(formData.get("height") as string) || null,
      weight: parseFloat(formData.get("weight") as string) || null,
      activity_level: formData.get("activity_level") as string,
      goal: formData.get("goal") as string,
      daily_calorie_goal: 0, // Will be calculated below
    };

    // Calculate the calorie goal
    if (updates.weight && updates.height && updates.age && updates.gender && updates.activity_level && updates.goal) {
      updates.daily_calorie_goal = calculateCalorieGoal(
        updates.weight,
        updates.height,
        updates.age,
        updates.gender,
        updates.activity_level,
        updates.goal
      );
    }

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message,
      });
    } else {
      toast({
        title: "Profile updated",
        description: `Your daily calorie goal is ${updates.daily_calorie_goal} calories.`,
      });
      setProfile({ ...profile, ...updates });
    }

    setIsLoading(false);
  };

  if (!user || !profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>
              Update your personal information and fitness goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={profile.name}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    defaultValue={profile.age || ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select name="gender" defaultValue={profile.gender || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    name="height"
                    type="number"
                    step="0.1"
                    defaultValue={profile.height || ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    name="weight"
                    type="number"
                    step="0.1"
                    defaultValue={profile.weight || ""}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activity_level">Activity Level</Label>
                <Select name="activity_level" defaultValue={profile.activity_level || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select activity level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
                    <SelectItem value="light">Light (exercise 1-3 days/week)</SelectItem>
                    <SelectItem value="moderate">Moderate (exercise 3-5 days/week)</SelectItem>
                    <SelectItem value="active">Active (exercise 6-7 days/week)</SelectItem>
                    <SelectItem value="very_active">Very Active (intense exercise daily)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal">Fitness Goal</Label>
                <Select name="goal" defaultValue={profile.goal || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lose">Lose Weight</SelectItem>
                    <SelectItem value="maintain">Maintain Weight</SelectItem>
                    <SelectItem value="gain">Gain Weight</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
