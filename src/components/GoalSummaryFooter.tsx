import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function GoalSummaryFooter() {
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkUserData();
  }, []);

  const checkUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsChecking(false);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [mealsResult, exercisesResult, sleepResult] = await Promise.all([
        supabase.from("meals").select("id").eq("user_id", user.id).gte("consumed_at", weekAgo).limit(1),
        supabase.from("exercises").select("id").eq("user_id", user.id).gte("exercise_date", weekAgo).limit(1),
        supabase.from("sleep_logs").select("id").eq("user_id", user.id).gte("sleep_date", weekAgo).limit(1)
      ]);

      const hasAnyData = 
        (mealsResult.data && mealsResult.data.length > 0) ||
        (exercisesResult.data && exercisesResult.data.length > 0) ||
        (sleepResult.data && sleepResult.data.length > 0);

      setHasData(hasAnyData);
    } catch (error) {
      console.error("Error checking user data:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const generateSummary = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to use this feature",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-goal-summary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({}),
        }
      );

      if (response.status === 429) {
        toast({
          title: "Rate limit exceeded",
          description: "Please try again later.",
          variant: "destructive",
        });
        return;
      }

      if (response.status === 402) {
        toast({
          title: "Payment required",
          description: "Please add funds to your Lovable AI workspace.",
          variant: "destructive",
        });
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }

      const data = await response.json();
      setSummary(data.summary);
      
      toast({
        title: "Summary generated!",
        description: "Your personalized fitness goals and plan are ready.",
      });
    } catch (error) {
      console.error("Error generating summary:", error);
      toast({
        title: "Error",
        description: "Failed to generate summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return null;
  }

  return (
    <footer className="border-t bg-muted/30 py-8 mt-12">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI-Powered Progress Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!hasData ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Start logging your meals, exercises, and sleep to generate an AI-powered summary of your progress and personalized goals.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Generate an AI-powered summary based on your recent activity logs (meals, exercises, and sleep).
                </p>
                
                <Button 
                  onClick={generateSummary} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing your data...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Summary & Goals
                    </>
                  )}
                </Button>
              </>
            )}

            {summary && (
              <div className="mt-6 p-4 bg-background rounded-lg border">
                <h3 className="font-semibold text-lg mb-3 text-primary">Your Personalized Analysis</h3>
                <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                  {summary}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </footer>
  );
}
