import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Dumbbell, Clock, Flame, Smile } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface WorkoutLoggerProps {
  user: User | null;
  exercises?: string[];
  planId?: string;
  onLogComplete?: () => void;
}

const MOOD_OPTIONS = [
  { value: "great", label: "💪 Great", color: "text-green-500" },
  { value: "good", label: "😊 Good", color: "text-emerald-500" },
  { value: "okay", label: "😐 Okay", color: "text-yellow-500" },
  { value: "tired", label: "😓 Tired", color: "text-orange-500" },
  { value: "exhausted", label: "😴 Exhausted", color: "text-red-500" },
];

const DEFAULT_EXERCISES = [
  "Push-Ups",
  "Squats",
  "Planks",
  "Lunges",
  "Burpees",
  "Mountain Climbers",
  "Jumping Jacks",
  "Crunches",
];

export const WorkoutLogger = ({ user, exercises = DEFAULT_EXERCISES, planId, onLogComplete }: WorkoutLoggerProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    workoutDate: new Date().toISOString().split('T')[0],
    exercisesCompleted: [] as string[],
    durationMinutes: "",
    caloriesBurned: "",
    mood: "good",
    notes: "",
  });

  const toggleExercise = (exercise: string) => {
    setFormData(prev => ({
      ...prev,
      exercisesCompleted: prev.exercisesCompleted.includes(exercise)
        ? prev.exercisesCompleted.filter(e => e !== exercise)
        : [...prev.exercisesCompleted, exercise]
    }));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to log your workouts",
        variant: "destructive",
      });
      return;
    }

    if (formData.exercisesCompleted.length === 0) {
      toast({
        title: "Select Exercises",
        description: "Please select at least one exercise you completed",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("workout_logs").insert([{
        user_id: user.id,
        fitness_plan_id: planId || null,
        workout_date: formData.workoutDate,
        exercises_completed: formData.exercisesCompleted,
        duration_minutes: formData.durationMinutes ? parseInt(formData.durationMinutes) : null,
        calories_burned: formData.caloriesBurned ? parseInt(formData.caloriesBurned) : null,
        mood: formData.mood,
        notes: formData.notes || null,
      }]);

      if (error) throw error;

      toast({
        title: "Workout Logged! 🎉",
        description: "Great job on completing your workout!",
      });

      // Reset form
      setFormData({
        workoutDate: new Date().toISOString().split('T')[0],
        exercisesCompleted: [],
        durationMinutes: "",
        caloriesBurned: "",
        mood: "good",
        notes: "",
      });

      onLogComplete?.();
    } catch (error) {
      console.error("Log error:", error);
      toast({
        title: "Error",
        description: "Failed to log workout",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 shadow-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Plus className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Log Workout</h3>
          <p className="text-sm text-muted-foreground">Track your completed exercises</p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="workoutDate">Workout Date</Label>
          <Input
            id="workoutDate"
            type="date"
            value={formData.workoutDate}
            onChange={(e) => setFormData({ ...formData, workoutDate: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Exercises Completed</Label>
          <div className="grid grid-cols-2 gap-2">
            {exercises.map((exercise) => (
              <div
                key={exercise}
                className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                  formData.exercisesCompleted.includes(exercise)
                    ? "bg-primary/10 border-primary"
                    : "hover:bg-muted"
                }`}
                onClick={() => toggleExercise(exercise)}
              >
                <Checkbox
                  checked={formData.exercisesCompleted.includes(exercise)}
                  onCheckedChange={() => toggleExercise(exercise)}
                />
                <span className="text-sm">{exercise}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="duration" className="flex items-center gap-1">
              <Clock className="w-4 h-4" /> Duration (mins)
            </Label>
            <Input
              id="duration"
              type="number"
              placeholder="45"
              value={formData.durationMinutes}
              onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="calories" className="flex items-center gap-1">
              <Flame className="w-4 h-4" /> Calories Burned
            </Label>
            <Input
              id="calories"
              type="number"
              placeholder="300"
              value={formData.caloriesBurned}
              onChange={(e) => setFormData({ ...formData, caloriesBurned: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            <Smile className="w-4 h-4" /> How do you feel?
          </Label>
          <RadioGroup
            value={formData.mood}
            onValueChange={(value) => setFormData({ ...formData, mood: value })}
            className="flex flex-wrap gap-2"
          >
            {MOOD_OPTIONS.map((mood) => (
              <div key={mood.value} className="flex items-center">
                <RadioGroupItem
                  value={mood.value}
                  id={`mood-${mood.value}`}
                  className="sr-only"
                />
                <Label
                  htmlFor={`mood-${mood.value}`}
                  className={`px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                    formData.mood === mood.value
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  {mood.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            placeholder="How was your workout? Any achievements?"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading || !user}
          className="w-full gradient-energy hover:opacity-90"
        >
          {loading ? "Logging..." : (
            <>
              <Dumbbell className="w-4 h-4 mr-2" />
              Log Workout
            </>
          )}
        </Button>

        {!user && (
          <p className="text-sm text-muted-foreground text-center">
            Please login to track your workouts
          </p>
        )}
      </div>
    </Card>
  );
};
