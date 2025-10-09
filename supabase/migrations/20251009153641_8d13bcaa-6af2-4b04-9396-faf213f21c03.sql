-- Create meals table for tracking daily food intake
CREATE TABLE public.meals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_name TEXT NOT NULL,
  calories NUMERIC NOT NULL,
  protein NUMERIC NOT NULL,
  carbs NUMERIC NOT NULL,
  fat NUMERIC NOT NULL,
  meal_type TEXT, -- breakfast, lunch, dinner, snack
  consumed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own meals" 
ON public.meals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own meals" 
ON public.meals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meals" 
ON public.meals 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meals" 
ON public.meals 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_meals_user_id_date ON public.meals(user_id, consumed_at DESC);