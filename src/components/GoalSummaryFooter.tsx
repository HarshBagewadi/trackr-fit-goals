import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function GoalSummaryFooter() {
  const [input, setInput] = useState("");
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateSummary = async () => {
    if (!input.trim()) {
      toast({
        title: "Input required",
        description: "Please enter your fitness goals and progress",
        variant: "destructive",
      });
      return;
    }

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
          body: JSON.stringify({ userInput: input }),
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

  return (
    <footer className="border-t bg-muted/30 py-8 mt-12">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Goal Summary Generator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Textarea
                placeholder="Describe your current fitness status, goals, challenges, and what you'd like to achieve... (e.g., 'I want to lose 10 pounds in 3 months, currently exercising 2 times per week, struggling with late-night snacking')"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-[100px] resize-none"
                disabled={isLoading}
              />
            </div>
            
            <Button 
              onClick={generateSummary} 
              disabled={isLoading || !input.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating your personalized plan...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Summary & Goals
                </>
              )}
            </Button>

            {summary && (
              <div className="mt-6 p-4 bg-background rounded-lg border">
                <h3 className="font-semibold text-lg mb-3 text-primary">Your Personalized Plan</h3>
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
