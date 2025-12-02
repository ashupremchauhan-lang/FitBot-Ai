import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Dumbbell, Activity, Apple, Heart, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FitnessPlan {
  bmi: number;
  category: string;
  exercises: string[];
  diet: string[];
  notes: string[];
}

export const FitnessPlanner = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "Male",
    height: "",
    weight: "",
    activityLevel: "moderate",
    goal: "maintain",
    dietPreference: "veg",
    equipment: "",
  });

  const [plan, setPlan] = useState<FitnessPlan | null>(null);
  const [loading, setLoading] = useState(false);

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

      // Exercise recommendations based on equipment
      const equipment = formData.equipment.toLowerCase();
      let exercises: string[] = [];

      if (equipment.includes("dumbbell")) {
        exercises.push("Dumbbell Bench Press", "Dumbbell Shoulder Press", "Dumbbell Bicep Curls", "Dumbbell Squats");
      }
      if (equipment.includes("treadmill") || equipment.includes("cardio")) {
        exercises.push("Treadmill Running (20-30 mins)", "Incline Walk", "HIIT Session");
      }
      if (!equipment || equipment.includes("bodyweight")) {
        exercises.push("Push-Ups", "Bodyweight Squats", "Planks", "Lunges", "Mountain Climbers");
      }

      // Add goal-specific exercises
      if (formData.goal === "lose") {
        exercises.push("Jump Rope", "Burpees", "High Knees");
      } else if (formData.goal === "gain") {
        exercises.push("Progressive Overload Lifts", "Compound Movements");
      }

      // Diet recommendations
      const diet: string[] = [];
      const isVeg = formData.dietPreference === "veg";

      if (formData.goal === "gain") {
        diet.push(
          isVeg ? "Breakfast: Paneer bhurji + Whole wheat bread + Milk" : "Breakfast: Omelette + Whole wheat bread + Milk",
          isVeg ? "Lunch: Rajma + Brown rice + Ghee" : "Lunch: Brown rice + Grilled Chicken + Veggies",
          "Snack: Dry fruits + Smoothie",
          isVeg ? "Dinner: Paneer tikka + Roti + Salad" : "Dinner: Chicken curry + Roti + Salad"
        );
      } else if (formData.goal === "lose") {
        diet.push(
          isVeg ? "Breakfast: Oats + Banana + Green tea" : "Breakfast: Boiled eggs + Oats + Green tea",
          isVeg ? "Lunch: Moong dal + Brown rice + Veggies" : "Lunch: Grilled fish + Brown rice + Salad",
          "Snack: Roasted chana + Buttermilk",
          isVeg ? "Dinner: Soup + Salad + Light dal" : "Dinner: Clear soup + Veg sauté + Chicken breast"
        );
      } else {
        diet.push(
          isVeg ? "Breakfast: Upma/Poha + Milk" : "Breakfast: Scrambled eggs + Fruits",
          isVeg ? "Lunch: Khichdi + Curd + Salad" : "Lunch: Mixed dal + Chicken + Veg curry",
          "Snack: Fresh fruits + Nuts",
          isVeg ? "Dinner: Roti + Dal + Veg curry" : "Dinner: Paneer tikka + Brown rice + Soup"
        );
      }

      // Notes
      const notes: string[] = [
        `Your BMI: ${bmi} (${category})`,
        formData.goal === "lose" ? "Focus on calorie deficit and daily step target (8k-10k)" : 
        formData.goal === "gain" ? "Add 400-500 kcal/day; focus on protein-rich meals" :
        "Maintain balance with consistent training & nutrition",
        "Stay hydrated - drink 2-3 liters of water daily",
        "Get 7-8 hours of quality sleep for recovery"
      ];

      setPlan({
        bmi,
        category,
        exercises: exercises.slice(0, 8),
        diet,
        notes
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

            <div className="space-y-2">
              <Label>Diet Preference</Label>
              <RadioGroup value={formData.dietPreference} onValueChange={(value) => setFormData({ ...formData, dietPreference: value })}>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="veg" id="veg" />
                    <Label htmlFor="veg">Vegetarian</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nonveg" id="nonveg" />
                    <Label htmlFor="nonveg">Non-Veg</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="equipment">Available Equipment (optional)</Label>
              <Textarea
                id="equipment"
                placeholder="e.g. dumbbells, treadmill, resistance bands..."
                value={formData.equipment}
                onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
              />
            </div>
          </div>

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
            <div className="flex items-center gap-3 mb-6">
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
