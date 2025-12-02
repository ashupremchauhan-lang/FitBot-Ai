import { FitnessPlanner } from "@/components/FitnessPlanner";
import { AIChat } from "@/components/AIChat";
import { Activity, Sparkles } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10"></div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center space-y-6 mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">AI-Powered Fitness Coach</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Transform Your
              <span className="block text-gradient">Fitness Journey</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get personalized workout plans, nutrition guidance, and AI-powered coaching to reach your fitness goals
            </p>

            <div className="flex items-center justify-center gap-8 pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">AI</div>
                <div className="text-sm text-muted-foreground">Powered</div>
              </div>
              <div className="w-px h-12 bg-border"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary">100%</div>
                <div className="text-sm text-muted-foreground">Personalized</div>
              </div>
              <div className="w-px h-12 bg-border"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">24/7</div>
                <div className="text-sm text-muted-foreground">Available</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Fitness Planner - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl gradient-energy flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-3xl font-bold">Fitness Planner</h2>
            </div>
            <FitnessPlanner />
          </div>

          {/* AI Chat - Takes 1 column */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <AIChat />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">Your personal AI fitness coach, available 24/7</p>
            <p className="flex items-center justify-center gap-2">
              Made with <span className="text-red-500">♥</span> using AI technology
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
