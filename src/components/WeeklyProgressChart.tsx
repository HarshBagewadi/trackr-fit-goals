import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";

interface ChartDataPoint {
  date: string;
  calories: number;
  exerciseMinutes: number;
  sleepHours: number;
}

interface WeeklyProgressChartProps {
  userId: string;
}

export function WeeklyProgressChart({ userId }: WeeklyProgressChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWeeklyData();
    
    // Set up realtime subscriptions for data changes
    const mealsChannel = supabase
      .channel('meals_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meals',
          filter: `user_id=eq.${userId}`
        },
        () => fetchWeeklyData()
      )
      .subscribe();

    const exercisesChannel = supabase
      .channel('exercises_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exercises',
          filter: `user_id=eq.${userId}`
        },
        () => fetchWeeklyData()
      )
      .subscribe();

    const sleepChannel = supabase
      .channel('sleep_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sleep_logs',
          filter: `user_id=eq.${userId}`
        },
        () => fetchWeeklyData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(mealsChannel);
      supabase.removeChannel(exercisesChannel);
      supabase.removeChannel(sleepChannel);
    };
  }, [userId]);

  const fetchWeeklyData = async () => {
    try {
      const today = startOfDay(new Date());
      const sevenDaysAgo = subDays(today, 6);
      
      // Fetch all data for the last 7 days
      const [mealsResult, exercisesResult, sleepResult] = await Promise.all([
        supabase
          .from("meals")
          .select("calories, consumed_at")
          .eq("user_id", userId)
          .gte("consumed_at", sevenDaysAgo.toISOString()),
        supabase
          .from("exercises")
          .select("duration, exercise_date")
          .eq("user_id", userId)
          .gte("exercise_date", format(sevenDaysAgo, "yyyy-MM-dd")),
        supabase
          .from("sleep_logs")
          .select("hours_slept, sleep_date")
          .eq("user_id", userId)
          .gte("sleep_date", format(sevenDaysAgo, "yyyy-MM-dd"))
      ]);

      // Group data by date
      const dataByDate: Record<string, ChartDataPoint> = {};
      
      // Initialize all 7 days
      for (let i = 0; i < 7; i++) {
        const date = format(subDays(today, 6 - i), "yyyy-MM-dd");
        dataByDate[date] = {
          date: format(subDays(today, 6 - i), "MMM dd"),
          calories: 0,
          exerciseMinutes: 0,
          sleepHours: 0
        };
      }

      // Aggregate meals
      mealsResult.data?.forEach(meal => {
        const date = format(new Date(meal.consumed_at), "yyyy-MM-dd");
        if (dataByDate[date]) {
          dataByDate[date].calories += Number(meal.calories);
        }
      });

      // Aggregate exercises
      exercisesResult.data?.forEach(exercise => {
        const date = exercise.exercise_date;
        if (dataByDate[date]) {
          dataByDate[date].exerciseMinutes += Number(exercise.duration);
        }
      });

      // Aggregate sleep
      sleepResult.data?.forEach(sleep => {
        const date = sleep.sleep_date;
        if (dataByDate[date]) {
          dataByDate[date].sleepHours = Number(sleep.hours_slept);
        }
      });

      setChartData(Object.values(dataByDate));
    } catch (error) {
      console.error("Error fetching weekly data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Weekly Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Loading chart...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Weekly Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="calories" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Calories"
              dot={{ fill: 'hsl(var(--primary))' }}
            />
            <Line 
              type="monotone" 
              dataKey="exerciseMinutes" 
              stroke="hsl(var(--chart-2))" 
              strokeWidth={2}
              name="Exercise (min)"
              dot={{ fill: 'hsl(var(--chart-2))' }}
            />
            <Line 
              type="monotone" 
              dataKey="sleepHours" 
              stroke="hsl(var(--chart-3))" 
              strokeWidth={2}
              name="Sleep (hrs)"
              dot={{ fill: 'hsl(var(--chart-3))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
