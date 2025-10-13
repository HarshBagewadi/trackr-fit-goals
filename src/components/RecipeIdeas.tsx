import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChefHat } from "lucide-react";

const recipes = [
  {
    name: "Grilled Chicken & Veggies",
    calories: 350,
    protein: 45,
    description: "6oz chicken breast with mixed vegetables",
  },
  {
    name: "Greek Yogurt Parfait",
    calories: 280,
    protein: 25,
    description: "Greek yogurt with berries and granola",
  },
  {
    name: "Tuna Salad Bowl",
    calories: 320,
    protein: 40,
    description: "Tuna with mixed greens and olive oil",
  },
  {
    name: "Protein Smoothie",
    calories: 250,
    protein: 30,
    description: "Whey protein, banana, and almond milk",
  },
  {
    name: "Egg White Omelette",
    calories: 200,
    protein: 28,
    description: "4 egg whites with spinach and mushrooms",
  },
  {
    name: "Turkey & Quinoa Bowl",
    calories: 380,
    protein: 38,
    description: "Ground turkey with quinoa and vegetables",
  },
];

export function RecipeIdeas() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChefHat className="h-5 w-5 text-primary" />
          High-Protein Recipe Ideas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recipes.map((recipe, index) => (
            <div key={index} className="p-3 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{recipe.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{recipe.description}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm font-bold text-primary">{recipe.protein}g protein</p>
                  <p className="text-xs text-muted-foreground">{recipe.calories} cal</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
