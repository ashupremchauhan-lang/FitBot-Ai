import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Calendar, Flame, Clock, Target, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, subWeeks, addWeeks } from "date-fns";

interface WorkoutLog {
  id: string;
  workout_date: string;
  exercises_completed: string[];
  duration_minutes: number | null;
  calories_burned: number | null;
  mood: string | null;
  notes: string | null;
  created_at: string;
}

interface ProgressTrackerProps {
  user: User | null;
  refreshTrigger?: number;
}

const MOOD_EMOJI: Record<string, string> = {
  great: "💪",
  good: "😊",
  okay: "😐",
  tired: "😓",
  exhausted: "😴",
};

export const ProgressTracker = ({ user, refreshTrigger }: ProgressTrackerProps) => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalDuration: 0,
    totalCalories: 0,
    currentStreak: 0,
    thisWeekWorkouts: 0,
  });

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user, refreshTrigger]);

  const fetchLogs = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("workout_date", { ascending: false });

      if (error) throw error;

      const typedLogs: WorkoutLog[] = (data || []).map(log => ({
        ...log,
        exercises_completed: Array.isArray(log.exercises_completed) 
          ? log.exercises_completed as string[]
          : []
      }));

      setLogs(typedLogs);
      calculateStats(typedLogs);
    } catch (error) {
      console.error("Fetch logs error:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (workoutLogs: WorkoutLog[]) => {
    const now = new Date();
    const weekStartDate = startOfWeek(now, { weekStartsOn: 1 });

    const thisWeekLogs = workoutLogs.filter(log => 
      new Date(log.workout_date) >= weekStartDate
    );

    // Calculate streak
    let streak = 0;
    const sortedDates = [...new Set(workoutLogs.map(l => l.workout_date))].sort().reverse();
    const today = format(now, 'yyyy-MM-dd');
    const yesterday = format(new Date(now.getTime() - 86400000), 'yyyy-MM-dd');

    if (sortedDates[0] === today || sortedDates[0] === yesterday) {
      streak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const current = new Date(sortedDates[i - 1]);
        const prev = new Date(sortedDates[i]);
        const diffDays = Math.floor((current.getTime() - prev.getTime()) / 86400000);
        if (diffDays === 1) {
          streak++;
        } else {
          break;
        }
      }
    }

    setStats({
      totalWorkouts: workoutLogs.length,
      totalDuration: workoutLogs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0),
      totalCalories: workoutLogs.reduce((sum, l) => sum + (l.calories_burned || 0), 0),
      currentStreak: streak,
      thisWeekWorkouts: thisWeekLogs.length,
    });
  };

  const deleteLog = async (logId: string) => {
    try {
      const { error } = await supabase
        .from("workout_logs")
        .delete()
        .eq("id", logId);

      if (error) throw error;

      toast({ title: "Workout log deleted" });
      fetchLogs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete log",
        variant: "destructive",
      });
    }
  };

  const getWorkoutsForDay = (date: Date) => {
    return logs.filter(log => isSameDay(new Date(log.workout_date), date));
  };

  if (!user) {
    return (
      <Card className="p-6 shadow-card">
        <div className="text-center text-muted-foreground">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Login to view your progress</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <Target className="w-6 h-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{stats.totalWorkouts}</p>
          <p className="text-xs text-muted-foreground">Total Workouts</p>
        </Card>
        <Card className="p-4 text-center">
          <Flame className="w-6 h-6 mx-auto mb-2 text-orange-500" />
          <p className="text-2xl font-bold">{stats.totalCalories.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Calories Burned</p>
        </Card>
        <Card className="p-4 text-center">
          <Clock className="w-6 h-6 mx-auto mb-2 text-blue-500" />
          <p className="text-2xl font-bold">{Math.round(stats.totalDuration / 60)}h</p>
          <p className="text-xs text-muted-foreground">Total Time</p>
        </Card>
        <Card className="p-4 text-center">
          <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-500" />
          <p className="text-2xl font-bold">{stats.currentStreak}</p>
          <p className="text-xs text-muted-foreground">Day Streak 🔥</p>
        </Card>
      </div>

      {/* Weekly Calendar */}
      <Card className="p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Weekly Overview
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center">
              {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dayWorkouts = getWorkoutsForDay(day);
            const isToday = isSameDay(day, new Date());
            const hasWorkout = dayWorkouts.length > 0;

            return (
              <div
                key={day.toISOString()}
                className={`p-3 rounded-xl text-center transition-colors ${
                  isToday 
                    ? "bg-primary/10 border-2 border-primary" 
                    : hasWorkout 
                    ? "bg-green-500/10 border border-green-500/30" 
                    : "bg-muted/30 border border-transparent"
                }`}
              >
                <p className="text-xs text-muted-foreground">{format(day, "EEE")}</p>
                <p className={`text-lg font-bold ${isToday ? "text-primary" : ""}`}>
                  {format(day, "d")}
                </p>
                {hasWorkout && (
                  <div className="mt-1">
                    <span className="text-lg">{MOOD_EMOJI[dayWorkouts[0].mood || "good"]}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recent Workouts */}
      <Card className="p-6 shadow-card">
        <h3 className="text-lg font-bold mb-4">Recent Workouts</h3>
        
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No workouts logged yet. Start tracking your progress!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.slice(0, 10).map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-xl bg-muted/30 border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{MOOD_EMOJI[log.mood || "good"]}</span>
                      <span className="font-semibold">
                        {format(new Date(log.workout_date), "EEEE, MMM d")}
                      </span>
                      {log.duration_minutes && (
                        <span className="text-sm text-muted-foreground">
                          • {log.duration_minutes} mins
                        </span>
                      )}
                      {log.calories_burned && (
                        <span className="text-sm text-muted-foreground">
                          • {log.calories_burned} cal
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {log.exercises_completed.slice(0, 5).map((exercise, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary"
                        >
                          {exercise}
                        </span>
                      ))}
                      {log.exercises_completed.length > 5 && (
                        <span className="text-xs px-2 py-1 rounded-md bg-muted">
                          +{log.exercises_completed.length - 5} more
                        </span>
                      )}
                    </div>
                    {log.notes && (
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        "{log.notes}"
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteLog(log.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
