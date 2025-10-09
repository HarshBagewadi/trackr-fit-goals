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
import { Loader2, Plus, Trash2 } from "lucide-react";

const mealSchema = z.object({
  meal_name: z.string().min(1, "Meal name is required"),
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  calories: z.string().min(1, "Calories required").transform(Number),
  protein: z.string().min(1, "Protein required").transform(Number),
  carbs: z.string().min(1, "Carbs required").transform(Number),
  fat: z.string().min(1, "Fat required").transform(Number),
});

type MealFormData = z.infer<typeof mealSchema>;

interface Meal {
  id: string;
  meal_name: string;
  meal_type: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  consumed_at: string;
}

interface MealTrackerProps {
  userId: string;
  dailyCalorieGoal: number;
}

export function MealTracker({ userId, dailyCalorieGoal }: MealTrackerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const form = useForm<MealFormData>({
    resolver: zodResolver(mealSchema),
    defaultValues: {
      meal_type: "breakfast",
    },
  });

  const fetchTodaysMeals = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("meals")
      .select("*")
      .eq("user_id", userId)
      .gte("consumed_at", today.toISOString())
      .order("consumed_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch meals",
        variant: "destructive",
      });
      return;
    }

    setMeals(data || []);
  };

  useEffect(() => {
    fetchTodaysMeals();
  }, [userId]);

  const onSubmit = async (data: MealFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from("meals").insert({
        user_id: userId,
        meal_name: data.meal_name,
        meal_type: data.meal_type,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
      });

      if (error) throw error;

      toast({
        title: "Meal added!",
        description: `${data.meal_name} has been logged.`,
      });

      form.reset();
      setShowForm(false);
      fetchTodaysMeals();
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

  const deleteMeal = async (mealId: string) => {
    try {
      const { error } = await supabase.from("meals").delete().eq("id", mealId);

      if (error) throw error;

      toast({
        title: "Meal deleted",
      });

      fetchTodaysMeals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const totals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + Number(meal.calories),
      protein: acc.protein + Number(meal.protein),
      carbs: acc.carbs + Number(meal.carbs),
      fat: acc.fat + Number(meal.fat),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const remaining = dailyCalorieGoal - totals.calories;

  return (
    <div className="space-y-6">
      {/* Daily Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Calories</p>
              <p className="text-2xl font-bold">{totals.calories}</p>
              <p className="text-xs text-muted-foreground">of {dailyCalorieGoal}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Protein</p>
              <p className="text-2xl font-bold">{totals.protein}g</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Carbs</p>
              <p className="text-2xl font-bold">{totals.carbs}g</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fat</p>
              <p className="text-2xl font-bold">{totals.fat}g</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm">
              <span className={remaining >= 0 ? "text-success" : "text-destructive"}>
                {Math.abs(remaining)} calories {remaining >= 0 ? "remaining" : "over goal"}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Add Meal Button */}
      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Meal
        </Button>
      )}

      {/* Add Meal Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Log Meal</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="meal_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meal Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Chicken breast with rice" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meal_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meal Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="breakfast">Breakfast</SelectItem>
                          <SelectItem value="lunch">Lunch</SelectItem>
                          <SelectItem value="dinner">Dinner</SelectItem>
                          <SelectItem value="snack">Snack</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="calories"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Calories</FormLabel>
                        <FormControl>
                          <Input type="number" step="1" placeholder="300" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="protein"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Protein (g)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="25" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="carbs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Carbs (g)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="30" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fat (g)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Meal
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

      {/* Meals List */}
      {meals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Meals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {meals.map((meal) => (
                <div key={meal.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{meal.meal_name}</h4>
                      {meal.meal_type && (
                        <span className="text-xs px-2 py-1 bg-secondary rounded-full capitalize">
                          {meal.meal_type}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{meal.calories} cal</span>
                      <span>P: {meal.protein}g</span>
                      <span>C: {meal.carbs}g</span>
                      <span>F: {meal.fat}g</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMeal(meal.id)}
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
