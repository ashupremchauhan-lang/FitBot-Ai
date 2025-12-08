import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History as HistoryIcon, Dumbbell, Apple, ArrowLeft, Trash2, Loader2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface FitnessPlan {
  id: string;
  name: string | null;
  age: number | null;
  gender: string | null;
  height: number | null;
  weight: number | null;
  activity_level: string | null;
  goal: string | null;
  diet_preferences: string[] | null;
  equipment: string | null;
  bmi: number | null;
  bmi_category: string | null;
  exercises: any[] | null;
  diet_plan: any[] | null;
  notes: any[] | null;
  medical_records?: string[] | null;
  created_at: string;
}

const History = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plans, setPlans] = useState<FitnessPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
    fetchPlans();
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("fitness_plans")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPlans((data || []) as FitnessPlan[]);
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast({
        title: "Error",
        description: "Failed to load fitness plans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from("fitness_plans")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setPlans(plans.filter(plan => plan.id !== id));
      toast({
        title: "Deleted",
        description: "Fitness plan removed from history",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete plan",
        variant: "destructive",
      });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Underweight": return "text-yellow-600";
      case "Healthy": return "text-primary";
      case "Overweight": return "text-secondary";
      case "Obese": return "text-destructive";
      default: return "text-foreground";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl gradient-energy flex items-center justify-center shadow-glow">
              <HistoryIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Fitness History</h1>
              <p className="text-muted-foreground">
                {plans.length} {plans.length === 1 ? "plan" : "plans"} saved
              </p>
            </div>
          </div>
        </div>

        {plans.length === 0 ? (
          <Card className="p-12 text-center">
            <HistoryIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No fitness plans yet</h2>
            <p className="text-muted-foreground mb-6">
              Generate your first personalized fitness plan to see it here
            </p>
            <Button
              onClick={() => navigate("/")}
              className="gradient-energy hover:opacity-90 transition-opacity"
            >
              Create Your First Plan
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className="p-6 shadow-card hover:shadow-energy transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">
                      {plan.name || "Unnamed Plan"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Created {format(new Date(plan.created_at), "PPP")}
                    </p>
                    <p className={`text-lg font-semibold mt-1 ${getCategoryColor(plan.bmi_category ?? "")}`}>
                      BMI: {plan.bmi ?? "N/A"} ({plan.bmi_category ?? "N/A"})
                    </p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deletePlan(plan.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Age/Gender</p>
                    <p className="font-medium">{plan.age ?? "N/A"} years, {plan.gender ?? "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Height/Weight</p>
                    <p className="font-medium">{plan.height ?? "N/A"}cm, {plan.weight ?? "N/A"}kg</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Goal</p>
                    <p className="font-medium capitalize">{plan.goal ?? "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Activity Level</p>
                    <p className="font-medium capitalize">{plan.activity_level ?? "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Diet Preferences</p>
                    <p className="font-medium">{plan.diet_preferences?.join(", ") ?? "N/A"}</p>
                  </div>
                  {plan.equipment && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Equipment</p>
                      <p className="font-medium">{plan.equipment}</p>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Dumbbell className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold">Exercise Plan</h4>
                    </div>
                    <ScrollArea className="h-32">
                      <ul className="space-y-1">
                        {(plan.exercises ?? []).map((exercise, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>{typeof exercise === 'string' ? exercise : JSON.stringify(exercise)}</span>
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Apple className="w-4 h-4 text-secondary" />
                      <h4 className="font-semibold">Diet Plan</h4>
                    </div>
                    <ScrollArea className="h-32">
                      <ul className="space-y-1">
                        {(plan.diet_plan ?? []).map((meal, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-secondary">•</span>
                            <span>{typeof meal === 'string' ? meal : JSON.stringify(meal)}</span>
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </div>
                </div>

                {plan.medical_records && plan.medical_records.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4 text-accent" />
                      <h4 className="font-semibold">Medical Records</h4>
                    </div>
                    <div className="space-y-2">
                      {plan.medical_records.map((record, idx) => (
                        <Card key={idx} className="p-2 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm truncate">{record.split('/').pop()}</span>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
