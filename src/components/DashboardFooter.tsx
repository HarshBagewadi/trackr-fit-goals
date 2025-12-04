import { AlertTriangle, Bot } from "lucide-react";

export function DashboardFooter() {
  return (
    <footer className="border-t bg-muted/30 mt-8">
      <div className="container mx-auto px-4 py-6">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Calorie Disclaimer */}
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
            <p>
              <span className="font-medium text-foreground">Calorie Disclaimer:</span>{" "}
              Daily calorie goals are estimated using the Mifflin-St Jeor equation based on your BMI, age, gender, and activity level. Actual calorie needs may vary. Consult a healthcare professional for personalized advice.
            </p>
          </div>

          {/* AI Disclaimer */}
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <Bot className="h-5 w-5 shrink-0 text-blue-500" />
            <p>
              <span className="font-medium text-foreground">AI Disclaimer:</span>{" "}
              All AI-generated suggestions, analyses, and summaries are for informational purposes only. Please verify recommendations with qualified professionals before making health decisions.
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} FitTrackr. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
