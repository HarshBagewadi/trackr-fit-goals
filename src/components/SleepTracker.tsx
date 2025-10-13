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
import { Loader2, Moon, Plus } from "lucide-react";
import { format } from "date-fns";

const sleepSchema = z.object({
  hours_slept: z.coerce.number().min(0.5, "Hours required"),
  sleep_quality: z.enum(["poor", "fair", "good", "excellent"]),
  notes: z.string().optional(),
});

type SleepFormData = z.infer<typeof sleepSchema>;

interface SleepLog {
  id: string;
  hours_slept: number;
  sleep_quality: string;
  notes: string | null;
  sleep_date: string;
}

interface SleepTrackerProps {
  userId: string;
  selectedDate: Date;
}

export function SleepTracker({ userId, selectedDate }: SleepTrackerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [sleepLog, setSleepLog] = useState<SleepLog | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const form = useForm<SleepFormData>({
    resolver: zodResolver(sleepSchema),
    defaultValues: {
      sleep_quality: "good",
    },
  });

  const fetchSleepLog = async () => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("sleep_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("sleep_date", dateStr)
      .single();

    if (error && error.code !== "PGRST116") {
      toast({
        title: "Error",
        description: "Failed to fetch sleep data",
        variant: "destructive",
      });
      return;
    }

    setSleepLog(data || null);
    if (data) {
      form.reset({
        hours_slept: data.hours_slept,
        sleep_quality: data.sleep_quality as any,
        notes: data.notes || "",
      });
    }
  };

  useEffect(() => {
    fetchSleepLog();
  }, [userId, selectedDate]);

  const onSubmit = async (data: SleepFormData) => {
    setIsLoading(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      
      if (sleepLog) {
        // Update existing log
        const { error } = await supabase
          .from("sleep_logs")
          .update({
            hours_slept: data.hours_slept,
            sleep_quality: data.sleep_quality,
            notes: data.notes,
          })
          .eq("id", sleepLog.id);

        if (error) throw error;

        toast({
          title: "Sleep log updated!",
        });
      } else {
        // Create new log
        const { error } = await supabase.from("sleep_logs").insert({
          user_id: userId,
          hours_slept: data.hours_slept,
          sleep_quality: data.sleep_quality,
          notes: data.notes,
          sleep_date: dateStr,
        });

        if (error) throw error;

        toast({
          title: "Sleep logged!",
        });
      }

      setShowForm(false);
      fetchSleepLog();
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

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "excellent": return "text-green-500";
      case "good": return "text-blue-500";
      case "fair": return "text-yellow-500";
      case "poor": return "text-red-500";
      default: return "text-muted-foreground";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Moon className="h-5 w-5 text-purple-500" />
          Sleep Tracker
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sleepLog && !showForm ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Hours Slept</p>
                <p className="text-2xl font-bold">{sleepLog.hours_slept}h</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quality</p>
                <p className={`text-2xl font-bold capitalize ${getQualityColor(sleepLog.sleep_quality)}`}>
                  {sleepLog.sleep_quality}
                </p>
              </div>
            </div>
            {sleepLog.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm">{sleepLog.notes}</p>
              </div>
            )}
            <Button onClick={() => setShowForm(true)} variant="outline" className="w-full">
              Update Sleep Log
            </Button>
          </div>
        ) : showForm ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="hours_slept"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hours Slept</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" placeholder="8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sleep_quality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quality</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="poor">Poor</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="excellent">Excellent</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <Input placeholder="How did you sleep?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {sleepLog ? "Update" : "Log Sleep"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <Button onClick={() => setShowForm(true)} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Log Sleep
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
