import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Flame } from "lucide-react";
import { format } from "date-fns";

const exerciseSchema = z.object({
  exercise_name: z.string().min(1, "Exercise name is required"),
  exercise_type: z.string().optional(),
  calories_burnt: z.string().min(1, "Calories burnt required").transform(Number),
  duration: z.string().min(1, "Duration required").transform(Number),
  notes: z.string().optional(),
});

type ExerciseFormData = z.infer<typeof exerciseSchema>;

interface Exercise {
  id: string;
  exercise_name: string;
  exercise_type: string | null;
  calories_burnt: number;
  duration: number;
  notes: string | null;
  exercise_date: string;
}

interface ExerciseTrackerProps {
  userId: string;
  selectedDate: Date;
}

export function ExerciseTracker({ userId, selectedDate }: ExerciseTrackerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const form = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseSchema),
  });

  const fetchExercises = async () => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("exercises")
      .select("*")
      .eq("user_id", userId)
      .eq("exercise_date", dateStr)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch exercises",
        variant: "destructive",
      });
      return;
    }

    setExercises(data || []);
  };

  useEffect(() => {
    fetchExercises();
  }, [userId, selectedDate]);

  const onSubmit = async (data: ExerciseFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from("exercises").insert({
        user_id: userId,
        exercise_name: data.exercise_name,
        exercise_type: data.exercise_type,
        calories_burnt: data.calories_burnt,
        duration: data.duration,
        notes: data.notes,
        exercise_date: format(selectedDate, "yyyy-MM-dd"),
      });

      if (error) throw error;

      toast({
        title: "Exercise logged!",
        description: `${data.exercise_name} has been recorded.`,
      });

      form.reset();
      setShowForm(false);
      fetchExercises();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteExercise = async (exerciseId: string) => {
    try {
      const { error } = await supabase.from("exercises").delete().eq("id", exerciseId);

      if (error) throw error;

      toast({
        title: "Exercise deleted",
      });

      fetchExercises();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const totals = exercises.reduce(
    (acc, exercise) => ({
      caloriesBurnt: acc.caloriesBurnt + Number(exercise.calories_burnt),
      totalDuration: acc.totalDuration + Number(exercise.duration),
    }),
    { caloriesBurnt: 0, totalDuration: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Exercise Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Exercise Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Calories Burnt</p>
              <p className="text-2xl font-bold text-orange-500">{totals.caloriesBurnt}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Duration</p>
              <p className="text-2xl font-bold">{totals.totalDuration} min</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sessions</p>
              <p className="text-2xl font-bold">{exercises.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Exercise Button */}
      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Log Exercise
        </Button>
      )}

      {/* Add Exercise Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Log Exercise</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="exercise_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exercise Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Running, Cycling, Yoga" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="exercise_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cardio">Cardio</SelectItem>
                          <SelectItem value="strength">Strength</SelectItem>
                          <SelectItem value="flexibility">Flexibility</SelectItem>
                          <SelectItem value="sports">Sports</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="calories_burnt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Calories Burnt</FormLabel>
                        <FormControl>
                          <Input type="number" step="1" placeholder="250" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (min)</FormLabel>
                        <FormControl>
                          <Input type="number" step="1" placeholder="30" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="How did it go?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Log Exercise
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Exercise List */}
      {exercises.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Exercise Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exercises.map((exercise) => (
                <div key={exercise.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{exercise.exercise_name}</h4>
                      {exercise.exercise_type && (
                        <span className="text-xs px-2 py-1 bg-secondary rounded-full capitalize">
                          {exercise.exercise_type}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="text-orange-500">{exercise.calories_burnt} cal</span>
                      <span>{exercise.duration} min</span>
                    </div>
                    {exercise.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{exercise.notes}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteExercise(exercise.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
