import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dumbbell, Activity, Apple, Heart, Sparkles, Save, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { MedicalRecordUpload } from "./MedicalRecordUpload";

interface WeeklyPlan {
  day: string;
  focus: string;
  exercises: string[];
  duration: string;
}

interface FitnessPlan {
  bmi: number;
  category: string;
  exercises: string[];
  diet: string[];
  notes: string[];
  weeklyPlan: WeeklyPlan[];
}

const EQUIPMENT_OPTIONS = [
  { id: "bodyweight", label: "Bodyweight Only" },
  { id: "dumbbells", label: "Dumbbells" },
  { id: "barbell", label: "Barbell & Plates" },
  { id: "kettlebell", label: "Kettlebells" },
  { id: "resistance_bands", label: "Resistance Bands" },
  { id: "pull_up_bar", label: "Pull-up Bar" },
  { id: "treadmill", label: "Treadmill" },
  { id: "stationary_bike", label: "Stationary Bike" },
  { id: "rowing_machine", label: "Rowing Machine" },
  { id: "cable_machine", label: "Cable Machine" },
  { id: "bench", label: "Workout Bench" },
  { id: "yoga_mat", label: "Yoga Mat" },
  { id: "medicine_ball", label: "Medicine Ball" },
  { id: "jump_rope", label: "Jump Rope" },
  { id: "foam_roller", label: "Foam Roller" },
];

interface FitnessPlannerProps {
  user?: User | null;
}

const DIET_OPTIONS = [
  { id: "veg", label: "Vegetarian" },
  { id: "nonveg", label: "Non-Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "keto", label: "Keto" },
  { id: "paleo", label: "Paleo" },
];

export const FitnessPlanner = ({ user }: FitnessPlannerProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "Male",
    height: "",
    weight: "",
    activityLevel: "moderate",
    goal: "maintain",
    dietPreferences: ["veg"],
    equipment: [] as string[],
  });

  const toggleEquipment = (equipmentId: string) => {
    setFormData(prev => {
      const newEquipment = prev.equipment.includes(equipmentId)
        ? prev.equipment.filter(e => e !== equipmentId)
        : [...prev.equipment, equipmentId];
      return { ...prev, equipment: newEquipment };
    });
  };

  const [plan, setPlan] = useState<FitnessPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [medicalRecords, setMedicalRecords] = useState<string[]>([]);

  const calculateBMI = (weight: number, height: number) => {
    const heightM = height / 100;
    return (weight / (heightM * heightM)).toFixed(2);
  };

  const getBMICategory = (bmi: number): string => {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Healthy";
    if (bmi < 30) return "Overweight";
    return "Obese";
  };

  const toggleDietPreference = (dietId: string) => {
    setFormData(prev => {
      const newPrefs = prev.dietPreferences.includes(dietId)
        ? prev.dietPreferences.filter(p => p !== dietId)
        : [...prev.dietPreferences, dietId];
      return { ...prev, dietPreferences: newPrefs.length > 0 ? newPrefs : ["veg"] };
    });
  };

  const generateWeeklyPlan = (goal: string, exercises: string[], activityLevel: string): WeeklyPlan[] => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const weeklyPlan: WeeklyPlan[] = [];
    
    const restDays = activityLevel === "low" ? 3 : activityLevel === "moderate" ? 2 : 1;
    const workoutDays = 7 - restDays;
    
    const focusAreas = goal === "gain" 
      ? ["Chest & Triceps", "Back & Biceps", "Legs & Glutes", "Shoulders & Core", "Full Body", "Active Recovery", "Rest"]
      : goal === "lose"
      ? ["HIIT & Cardio", "Upper Body", "Lower Body & Core", "Cardio & Mobility", "Full Body Circuit", "Active Recovery", "Rest"]
      : ["Upper Body", "Lower Body", "Cardio & Core", "Full Body", "Flexibility & Mobility", "Active Recovery", "Rest"];

    const durations = goal === "gain" 
      ? ["45-60 mins", "45-60 mins", "50-60 mins", "40-50 mins", "45-55 mins", "30 mins", "Rest"]
      : goal === "lose"
      ? ["30-40 mins", "40-50 mins", "40-50 mins", "35-45 mins", "35-45 mins", "20-30 mins", "Rest"]
      : ["40-50 mins", "40-50 mins", "30-40 mins", "40-50 mins", "30 mins", "20-30 mins", "Rest"];

    days.forEach((day, index) => {
      const isRestDay = index >= workoutDays;
      const dayExercises = isRestDay 
        ? ["Light stretching", "Walking (20-30 mins)", "Foam rolling"]
        : exercises.slice(index * 3, index * 3 + 4).length > 0 
          ? exercises.slice(index * 3, index * 3 + 4)
          : exercises.slice(0, 4);

      weeklyPlan.push({
        day,
        focus: isRestDay ? (index === 6 ? "Rest Day" : "Active Recovery") : focusAreas[index % focusAreas.length],
        exercises: isRestDay ? ["Light stretching", "Walking", "Foam rolling"] : dayExercises,
        duration: isRestDay ? (index === 6 ? "Rest" : "20-30 mins") : durations[index % durations.length]
      });
    });

    return weeklyPlan;
  };

  const generatePlan = () => {
    setLoading(true);
    
    try {
      const weight = parseFloat(formData.weight);
      const height = parseFloat(formData.height);
      
      if (!weight || !height || weight <= 0 || height <= 0) {
        toast({
          title: "Invalid Input",
          description: "Please enter valid height and weight",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const bmi = parseFloat(calculateBMI(weight, height));
      const category = getBMICategory(bmi);

      // Exercise recommendations based on selected equipment
      const selectedEquipment = formData.equipment;
      let exercises: string[] = [];

      // Always include bodyweight exercises as base
      if (selectedEquipment.length === 0 || selectedEquipment.includes("bodyweight")) {
        exercises.push("Push-Ups (3x15)", "Bodyweight Squats (3x20)", "Planks (3x45s)", "Lunges (3x12 each)", "Mountain Climbers (3x30s)");
      }

      if (selectedEquipment.includes("dumbbells")) {
        exercises.push("Dumbbell Bench Press (4x10)", "Dumbbell Shoulder Press (3x12)", "Dumbbell Bicep Curls (3x12)", "Dumbbell Rows (3x10)", "Goblet Squats (3x12)");
      }

      if (selectedEquipment.includes("barbell")) {
        exercises.push("Barbell Deadlift (4x6)", "Barbell Squats (4x8)", "Barbell Bench Press (4x8)", "Barbell Rows (4x8)", "Overhead Press (3x10)");
      }

      if (selectedEquipment.includes("kettlebell")) {
        exercises.push("Kettlebell Swings (4x15)", "Goblet Squats (3x12)", "Turkish Get-Ups (2x5 each)", "Kettlebell Clean & Press (3x10)");
      }

      if (selectedEquipment.includes("resistance_bands")) {
        exercises.push("Banded Rows (3x15)", "Banded Squats (3x15)", "Banded Chest Press (3x12)", "Banded Face Pulls (3x15)", "Banded Bicep Curls (3x15)");
      }

      if (selectedEquipment.includes("pull_up_bar")) {
        exercises.push("Pull-Ups (3x max)", "Chin-Ups (3x max)", "Hanging Leg Raises (3x10)", "Dead Hangs (3x30s)");
      }

      if (selectedEquipment.includes("treadmill")) {
        exercises.push("Treadmill Running (20-30 mins)", "Incline Walk (15 mins)", "HIIT Sprints (10x30s)");
      }

      if (selectedEquipment.includes("stationary_bike")) {
        exercises.push("Cycling Intervals (20 mins)", "Steady State Cycling (30 mins)", "HIIT Bike Sprints (15 mins)");
      }

      if (selectedEquipment.includes("rowing_machine")) {
        exercises.push("Rowing Intervals (15 mins)", "Steady State Rowing (20 mins)", "500m Row Sprints (5 rounds)");
      }

      if (selectedEquipment.includes("cable_machine")) {
        exercises.push("Cable Flyes (3x12)", "Cable Rows (3x12)", "Tricep Pushdowns (3x15)", "Face Pulls (3x15)", "Cable Woodchops (3x10 each)");
      }

      if (selectedEquipment.includes("bench")) {
        exercises.push("Incline Dumbbell Press (3x10)", "Step-Ups (3x12 each)", "Hip Thrusts (3x12)", "Box Jumps (3x10)");
      }

      if (selectedEquipment.includes("yoga_mat")) {
        exercises.push("Yoga Flow (15-20 mins)", "Stretching Routine (10 mins)", "Core Work (Crunches, Leg Raises)", "Glute Bridges (3x15)");
      }

      if (selectedEquipment.includes("medicine_ball")) {
        exercises.push("Medicine Ball Slams (3x15)", "Wall Balls (3x12)", "Russian Twists with Ball (3x20)", "Med Ball Push-Ups (3x10)");
      }

      if (selectedEquipment.includes("jump_rope")) {
        exercises.push("Jump Rope (5 mins)", "Double Unders (3x30s)", "Jump Rope HIIT (10 mins)");
      }

      // Add goal-specific exercises
      if (formData.goal === "lose") {
        exercises.push("Burpees (3x10)", "High Knees (3x45s)", "Box Jumps (3x10)");
      } else if (formData.goal === "gain") {
        exercises.push("Progressive Overload Focus", "Compound Movements Priority", "Rest 2-3 mins between sets");
      }

      // Generate weekly plan
      const weeklyPlan: WeeklyPlan[] = generateWeeklyPlan(formData.goal, exercises, formData.activityLevel);

      // Diet recommendations based on selected preferences
      const diet: string[] = [];
      const hasVeg = formData.dietPreferences.includes("veg");
      const hasNonVeg = formData.dietPreferences.includes("nonveg");
      const hasVegan = formData.dietPreferences.includes("vegan");
      const hasKeto = formData.dietPreferences.includes("keto");

      if (formData.goal === "gain") {
        if (hasNonVeg) {
          diet.push("Breakfast: Omelette + Whole wheat bread + Milk", "Lunch: Brown rice + Grilled Chicken + Veggies");
        }
        if (hasVeg || hasVegan) {
          diet.push("Breakfast: Paneer bhurji + Whole wheat bread", "Lunch: Rajma + Brown rice + Ghee");
        }
        if (hasKeto) {
          diet.push("Breakfast: Eggs + Avocado + Cheese", "Lunch: Grilled meat + Leafy greens + Olive oil");
        }
        diet.push("Snack: Dry fruits + Smoothie", "Dinner: High-protein meal + Salad");
      } else if (formData.goal === "lose") {
        if (hasNonVeg) {
          diet.push("Breakfast: Boiled eggs + Oats", "Lunch: Grilled fish + Brown rice + Salad");
        }
        if (hasVeg || hasVegan) {
          diet.push("Breakfast: Oats + Banana + Green tea", "Lunch: Moong dal + Brown rice + Veggies");
        }
        if (hasKeto) {
          diet.push("Breakfast: Eggs + Spinach + Butter", "Lunch: Grilled protein + Cauliflower rice");
        }
        diet.push("Snack: Roasted chana + Buttermilk", "Dinner: Light soup + Salad");
      } else {
        if (hasNonVeg) {
          diet.push("Breakfast: Scrambled eggs + Fruits", "Lunch: Mixed dal + Chicken + Veg curry");
        }
        if (hasVeg || hasVegan) {
          diet.push("Breakfast: Upma/Poha + Milk", "Lunch: Khichdi + Curd + Salad");
        }
        diet.push("Snack: Fresh fruits + Nuts", "Dinner: Balanced meal + Vegetables");
      }

      // Notes
      const notes: string[] = [
        `Your BMI: ${bmi} (${category})`,
        formData.goal === "lose" ? "Focus on calorie deficit and daily step target (8k-10k)" : 
        formData.goal === "gain" ? "Add 400-500 kcal/day; focus on protein-rich meals" :
        "Maintain balance with consistent training & nutrition",
        "Stay hydrated - drink 2-3 liters of water daily",
        "Get 7-8 hours of quality sleep for recovery",
        `Diet preferences: ${formData.dietPreferences.map(p => DIET_OPTIONS.find(o => o.id === p)?.label).join(", ")}`,
        `Equipment: ${selectedEquipment.length > 0 ? selectedEquipment.map(e => EQUIPMENT_OPTIONS.find(o => o.id === e)?.label).join(", ") : "Bodyweight only"}`
      ];

      setPlan({
        bmi,
        category,
        exercises: [...new Set(exercises)].slice(0, 12),
        diet: Array.from(new Set(diet)).slice(0, 6),
        notes,
        weeklyPlan
      });

      toast({
        title: "Plan Generated! 🎉",
        description: "Your personalized fitness plan is ready",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate plan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to save your fitness plans",
        variant: "destructive",
      });
      return;
    }

    if (!plan) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("fitness_plans").insert([{
        user_id: user.id,
        name: formData.name || `${formData.goal} Plan`,
        age: parseInt(formData.age),
        gender: formData.gender,
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        activity_level: formData.activityLevel,
        goal: formData.goal,
        diet_preferences: formData.dietPreferences,
        equipment: formData.equipment.join(", "),
        bmi: plan.bmi,
        bmi_category: plan.category,
        exercises: JSON.parse(JSON.stringify({ list: plan.exercises, weeklyPlan: plan.weeklyPlan })),
        diet_plan: plan.diet as unknown as import("@/integrations/supabase/types").Json,
        notes: plan.notes as unknown as import("@/integrations/supabase/types").Json,
        medical_records: medicalRecords,
      }]);

      if (error) throw error;

      toast({
        title: "Saved! 💾",
        description: "Your fitness plan has been saved to history",
      });
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: "Failed to save plan",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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

  return (
    <div className="space-y-8">
      <Card className="p-8 shadow-card">
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Your Details</h2>
              <p className="text-muted-foreground">Let's create your personalized plan</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                placeholder="Enter your age"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Gender</Label>
              <RadioGroup value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Male" id="male" />
                    <Label htmlFor="male">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Female" id="female" />
                    <Label htmlFor="female">Female</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                placeholder="170"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="65"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Activity Level</Label>
              <RadioGroup value={formData.activityLevel} onValueChange={(value) => setFormData({ ...formData, activityLevel: value })}>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="low" />
                    <Label htmlFor="low">Low</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="moderate" id="moderate" />
                    <Label htmlFor="moderate">Moderate</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="high" />
                    <Label htmlFor="high">High</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Goal</Label>
              <RadioGroup value={formData.goal} onValueChange={(value) => setFormData({ ...formData, goal: value })}>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lose" id="lose" />
                    <Label htmlFor="lose">Lose Weight</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="gain" id="gain" />
                    <Label htmlFor="gain">Gain Muscle</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="maintain" id="maintain" />
                    <Label htmlFor="maintain">Maintain</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Diet Preferences (Select multiple)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {DIET_OPTIONS.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.id}
                      checked={formData.dietPreferences.includes(option.id)}
                      onCheckedChange={() => toggleDietPreference(option.id)}
                    />
                    <Label
                      htmlFor={option.id}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Available Equipment (Select all that apply)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {EQUIPMENT_OPTIONS.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`equip-${option.id}`}
                      checked={formData.equipment.includes(option.id)}
                      onCheckedChange={() => toggleEquipment(option.id)}
                    />
                    <Label
                      htmlFor={`equip-${option.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <MedicalRecordUpload
            onUploadComplete={setMedicalRecords}
            existingRecords={medicalRecords}
          />

          <Button 
            onClick={generatePlan} 
            disabled={loading}
            className="w-full h-12 text-lg font-semibold gradient-energy hover:opacity-90 transition-opacity"
          >
            {loading ? "Generating..." : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate My Plan
              </>
            )}
          </Button>
        </div>
      </Card>

      {plan && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="p-8 shadow-card border-2 border-primary/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl gradient-energy flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {formData.name ? `${formData.name}'s ` : "Your "}Fitness Plan
                  </h2>
                  <p className={`text-lg font-semibold ${getCategoryColor(plan.category)}`}>
                    BMI: {plan.bmi} ({plan.category})
                  </p>
                </div>
              </div>

              {user && (
                <Button
                  onClick={savePlan}
                  disabled={saving}
                  className="gradient-calm hover:opacity-90 transition-opacity"
                >
                  {saving ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Plan
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-bold">Exercise Plan</h3>
                </div>
                <ul className="space-y-2">
                  {plan.exercises.map((exercise, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{exercise}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Apple className="w-5 h-5 text-secondary" />
                  <h3 className="text-xl font-bold">Diet Plan</h3>
                </div>
                <ul className="space-y-2">
                  {plan.diet.map((meal, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-secondary mt-1">•</span>
                      <span className="text-sm">{meal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Weekly Plan Section */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold">Weekly Plan</h3>
              </div>
              <div className="grid gap-3">
                {plan.weeklyPlan.map((day, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-xl border ${
                      day.focus === "Rest Day" 
                        ? "bg-muted/50 border-muted" 
                        : day.focus === "Active Recovery"
                        ? "bg-secondary/10 border-secondary/30"
                        : "bg-primary/5 border-primary/20"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg min-w-[100px]">{day.day}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          day.focus === "Rest Day" 
                            ? "bg-muted text-muted-foreground" 
                            : day.focus === "Active Recovery"
                            ? "bg-secondary/20 text-secondary-foreground"
                            : "bg-primary/20 text-primary"
                        }`}>
                          {day.focus}
                        </span>
                        <span className="text-sm text-muted-foreground">({day.duration})</span>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {day.exercises.map((exercise, exIndex) => (
                        <span 
                          key={exIndex} 
                          className="text-xs px-2 py-1 rounded-md bg-background border"
                        >
                          {exercise}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <h3 className="text-lg font-bold mb-3">💡 Important Notes</h3>
              <ul className="space-y-2">
                {plan.notes.map((note, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">→</span>
                    <span className="text-sm">{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
