-- Create workout_logs table for tracking completed workouts
CREATE TABLE public.workout_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  fitness_plan_id UUID REFERENCES public.fitness_plans(id) ON DELETE SET NULL,
  workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  exercises_completed JSONB NOT NULL DEFAULT '[]',
  duration_minutes INTEGER,
  calories_burned INTEGER,
  notes TEXT,
  mood TEXT CHECK (mood IN ('great', 'good', 'okay', 'tired', 'exhausted')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for workout_logs
CREATE POLICY "Users can view own workout logs"
ON public.workout_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout logs"
ON public.workout_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout logs"
ON public.workout_logs
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout logs"
ON public.workout_logs
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_workout_logs_user_date ON public.workout_logs(user_id, workout_date DESC);