import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  Trophy, 
  Utensils, 
  Flame, 
  Target, 
  Dumbbell, 
  Moon, 
  Crown, 
  Award,
  Lock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria_type: string;
  criteria_value: number;
}

interface UserAchievement {
  achievement_id: string;
  unlocked_at: string;
}

interface AchievementsBadgesProps {
  userId: string;
}

const iconMap: Record<string, any> = {
  Trophy,
  Utensils,
  Flame,
  Target,
  Dumbbell,
  Moon,
  Crown,
  Award
};

export function AchievementsBadges({ userId }: AchievementsBadgesProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAchievements();
    const channels = setupRealtimeSubscriptions();
    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [userId]);

  useEffect(() => {
    if (achievements.length > 0) {
      checkForNewAchievements();
    }
  }, [achievements, userAchievements]);

  const setupRealtimeSubscriptions = () => {
    const channels = [];
    
    // Listen for new user achievements
    const achievementsChannel = supabase
      .channel('user_achievements_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          setUserAchievements(prev => [...prev, payload.new as UserAchievement]);
          
          // Find the achievement name to show in toast
          const achievement = achievements.find(a => a.id === payload.new.achievement_id);
          if (achievement) {
            toast({
              title: "🎉 Achievement Unlocked!",
              description: `${achievement.name}: ${achievement.description}`,
            });
          }
        }
      )
      .subscribe();
    
    channels.push(achievementsChannel);

    // Listen for meals, exercises, and sleep logs to check achievements
    const mealsChannel = supabase
      .channel('meals_for_achievements')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'meals',
          filter: `user_id=eq.${userId}`
        },
        () => checkForNewAchievements()
      )
      .subscribe();
    
    channels.push(mealsChannel);

    const exercisesChannel = supabase
      .channel('exercises_for_achievements')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'exercises',
          filter: `user_id=eq.${userId}`
        },
        () => checkForNewAchievements()
      )
      .subscribe();
    
    channels.push(exercisesChannel);

    const sleepChannel = supabase
      .channel('sleep_for_achievements')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sleep_logs',
          filter: `user_id=eq.${userId}`
        },
        () => checkForNewAchievements()
      )
      .subscribe();
    
    channels.push(sleepChannel);
    
    return channels;
  };

  const fetchAchievements = async () => {
    try {
      const [achievementsResult, userAchievementsResult] = await Promise.all([
        supabase.from("achievements").select("*").order("created_at"),
        supabase.from("user_achievements").select("*").eq("user_id", userId)
      ]);

      if (achievementsResult.data) {
        setAchievements(achievementsResult.data);
      }
      if (userAchievementsResult.data) {
        setUserAchievements(userAchievementsResult.data);
      }
    } catch (error) {
      console.error("Error fetching achievements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkForNewAchievements = async () => {
    const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id));
    
    for (const achievement of achievements) {
      if (unlockedIds.has(achievement.id)) continue;

      const shouldUnlock = await checkAchievementCriteria(achievement);
      if (shouldUnlock) {
        await unlockAchievement(achievement.id);
      }
    }
  };

  const checkAchievementCriteria = async (achievement: Achievement): Promise<boolean> => {
    try {
      switch (achievement.criteria_type) {
        case 'first_meal': {
          const { count } = await supabase
            .from("meals")
            .select("*", { count: 'exact', head: true })
            .eq("user_id", userId);
          return (count || 0) >= 1;
        }
        
        case 'total_meals': {
          const { count } = await supabase
            .from("meals")
            .select("*", { count: 'exact', head: true })
            .eq("user_id", userId);
          return (count || 0) >= achievement.criteria_value;
        }

        case 'workouts_completed': {
          const { count } = await supabase
            .from("exercises")
            .select("*", { count: 'exact', head: true })
            .eq("user_id", userId);
          return (count || 0) >= achievement.criteria_value;
        }

        case 'total_exercise_minutes': {
          const { data } = await supabase
            .from("exercises")
            .select("duration")
            .eq("user_id", userId);
          const total = data?.reduce((sum, e) => sum + Number(e.duration), 0) || 0;
          return total >= achievement.criteria_value;
        }

        case 'full_day_log': {
          const today = new Date().toISOString().split('T')[0];
          const [meals, exercises, sleep] = await Promise.all([
            supabase.from("meals").select("id").eq("user_id", userId).gte("consumed_at", today).limit(1),
            supabase.from("exercises").select("id").eq("user_id", userId).eq("exercise_date", today).limit(1),
            supabase.from("sleep_logs").select("id").eq("user_id", userId).eq("sleep_date", today).limit(1)
          ]);
          return meals.data && meals.data.length > 0 && 
                 exercises.data && exercises.data.length > 0 && 
                 sleep.data && sleep.data.length > 0;
        }

        default:
          return false;
      }
    } catch (error) {
      console.error("Error checking achievement criteria:", error);
      return false;
    }
  };

  const unlockAchievement = async (achievementId: string) => {
    try {
      await supabase.from("user_achievements").insert({
        user_id: userId,
        achievement_id: achievementId
      });
    } catch (error) {
      console.error("Error unlocking achievement:", error);
    }
  };

  const isUnlocked = (achievementId: string) => {
    return userAchievements.some(ua => ua.achievement_id === achievementId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading achievements...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Achievements
          <Badge variant="secondary" className="ml-auto">
            {userAchievements.length}/{achievements.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {achievements.map((achievement) => {
            const unlocked = isUnlocked(achievement.id);
            const IconComponent = iconMap[achievement.icon] || Trophy;
            
            return (
              <div
                key={achievement.id}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                  unlocked
                    ? "bg-primary/10 border-primary/20"
                    : "bg-muted/30 border-muted opacity-60"
                }`}
              >
                <div
                  className={`p-3 rounded-full ${
                    unlocked
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {unlocked ? (
                    <IconComponent className="h-5 w-5" />
                  ) : (
                    <Lock className="h-5 w-5" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold">{achievement.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {achievement.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
