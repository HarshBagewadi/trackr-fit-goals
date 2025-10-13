-- Create exercise tracking table
CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exercise_name TEXT NOT NULL,
  calories_burnt NUMERIC NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  exercise_type TEXT,
  notes TEXT,
  exercise_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Create policies for exercise tracking
CREATE POLICY "Users can view their own exercises" 
ON public.exercises 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exercises" 
ON public.exercises 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exercises" 
ON public.exercises 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exercises" 
ON public.exercises 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create sleep tracking table
CREATE TABLE public.sleep_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  hours_slept NUMERIC NOT NULL,
  sleep_quality TEXT, -- poor, fair, good, excellent
  notes TEXT,
  sleep_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for sleep tracking
CREATE POLICY "Users can view their own sleep logs" 
ON public.sleep_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sleep logs" 
ON public.sleep_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sleep logs" 
ON public.sleep_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sleep logs" 
ON public.sleep_logs 
FOR DELETE 
USING (auth.uid() = user_id);