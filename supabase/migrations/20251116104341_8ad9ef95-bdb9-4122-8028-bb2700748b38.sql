-- Create achievements table
CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  criteria_type text NOT NULL,
  criteria_value integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Achievements are viewable by everyone
CREATE POLICY "Achievements are viewable by everyone"
ON public.achievements
FOR SELECT
USING (true);

-- Users can view their own achievements
CREATE POLICY "Users can view their own achievements"
ON public.user_achievements
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own achievements
CREATE POLICY "Users can insert their own achievements"
ON public.user_achievements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, criteria_type, criteria_value) VALUES
('First Steps', 'Log your first meal', 'Utensils', 'first_meal', 1),
('Week Warrior', 'Maintain a 7-day logging streak', 'Flame', 'logging_streak', 7),
('Calorie Champion', 'Meet your calorie goal for 5 days', 'Target', 'calorie_goals_met', 5),
('Exercise Enthusiast', 'Complete 10 workout sessions', 'Dumbbell', 'workouts_completed', 10),
('Sleep Master', 'Log 7+ hours of sleep for 7 consecutive days', 'Moon', 'sleep_streak', 7),
('Consistency King', 'Log meals, exercise, and sleep in one day', 'Crown', 'full_day_log', 1),
('Century Club', 'Log 100 meals', 'Trophy', 'total_meals', 100),
('Marathon Runner', 'Complete 300 minutes of exercise', 'Award', 'total_exercise_minutes', 300);