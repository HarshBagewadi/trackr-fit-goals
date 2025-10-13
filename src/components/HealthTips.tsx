import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";
import { useEffect, useState } from "react";

const tips = [
  "Drink at least 8 glasses of water daily for optimal hydration.",
  "Aim for 7-9 hours of quality sleep each night for recovery.",
  "Include protein in every meal to support muscle maintenance.",
  "Take the stairs whenever possible for extra daily activity.",
  "Prep your meals on Sunday to stay on track all week.",
  "Track your progress with photos, not just the scale.",
  "Add vegetables to every meal for fiber and nutrients.",
  "Rest days are just as important as workout days.",
  "Consistency beats perfection every single time.",
  "Set realistic goals and celebrate small victories.",
];

export function HealthTips() {
  const [tip, setTip] = useState("");

  useEffect(() => {
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    setTip(randomTip);
  }, []);

  return (
    <Card className="bg-gradient-to-r from-accent/10 to-secondary/10 border-accent/20">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-yellow-500 mt-1 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">💡 TIP OF THE DAY</p>
            <p className="text-sm text-foreground">{tip}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
