import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { WorkoutLogger } from "@/components/WorkoutLogger";
import { ProgressTracker } from "@/components/ProgressTracker";
import { Button } from "@/components/ui/button";
import { TrendingUp, Home, History, LogIn, LogOut } from "lucide-react";

const Progress = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-energy flex items-center justify-center">
              <span className="text-xl">🏋️</span>
            </div>
            <span className="font-bold text-xl">FitBot AI</span>
          </a>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate("/")}>
              <Home className="w-4 h-4 mr-2" /> Planner
            </Button>
            <Button variant="default" className="gradient-energy">
              <TrendingUp className="w-4 h-4 mr-2" /> Progress
            </Button>
            <Button variant="ghost" onClick={() => navigate("/history")}>
              <History className="w-4 h-4 mr-2" /> History
            </Button>
            {user ? (
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            ) : (
              <Button variant="outline" onClick={() => navigate("/auth")}>
                <LogIn className="w-4 h-4 mr-2" /> Login
              </Button>
            )}
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl gradient-energy flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Progress Tracker</h1>
            <p className="text-muted-foreground">Log workouts and track your fitness journey</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <WorkoutLogger 
              user={user} 
              onLogComplete={handleLogComplete}
            />
          </div>
          <div className="lg:col-span-2">
            <ProgressTracker 
              user={user} 
              refreshTrigger={refreshTrigger}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Progress;
