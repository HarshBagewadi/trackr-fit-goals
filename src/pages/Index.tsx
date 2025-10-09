import { useEffect } from "react";
import { ArrowRight, Activity, Apple, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import heroImage from "@/assets/hero-fitness.jpg";
import { useNavigate } from "react-router-dom";
import { getAuthState } from "@/lib/auth";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { user } = await getAuthState();
      if (user) {
        navigate("/dashboard");
      }
    };
    checkAuth();
  }, [navigate]);
  
  const features = [
    {
      icon: Apple,
      title: "Track Nutrition",
      description: "Log meals and monitor your daily calorie and macro intake with ease.",
    },
    {
      icon: Activity,
      title: "Log Exercise",
      description: "Record your workouts and track calories burned throughout the day.",
    },
    {
      icon: TrendingUp,
      title: "Monitor Progress",
      description: "Visualize your weight trends and nutrition goals with beautiful charts.",
    },
    {
      icon: Zap,
      title: "Stay Motivated",
      description: "Earn badges, maintain streaks, and get inspired with daily motivation.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="space-y-8 text-center lg:text-left">
              <div className="inline-block rounded-full bg-primary-foreground/10 px-4 py-2 text-sm font-medium text-primary-foreground backdrop-blur-sm">
                Your Personal Fitness Companion
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl md:text-6xl lg:text-7xl">
                Track Your
                <span className="block bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent">
                  Nutrition Journey
                </span>
              </h1>
              <p className="text-lg text-primary-foreground/90 md:text-xl max-w-2xl mx-auto lg:mx-0">
                Monitor calories, track macros, log workouts, and achieve your fitness goals with FitTrackr. 
                Your all-in-one solution for a healthier lifestyle.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row justify-center lg:justify-start">
                <Button 
                  variant="hero" 
                  size="xl" 
                  className="group bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                  onClick={() => navigate("/auth")}
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button 
                  variant="outline" 
                  size="xl" 
                  className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 backdrop-blur-sm"
                  onClick={() => {
                    document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Learn More
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-accent/20 to-primary-foreground/20 blur-3xl" />
              <img 
                src={heroImage} 
                alt="Healthy lifestyle with fresh foods and fitness items" 
                className="relative rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Everything You Need to
              <span className="block text-primary">Reach Your Goals</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to make nutrition tracking simple, effective, and motivating.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index} 
                  className="group relative overflow-hidden border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glow bg-gradient-card"
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-card">
        <div className="container mx-auto px-4">
          <div className="rounded-2xl bg-gradient-hero p-12 text-center shadow-glow">
            <div className="mx-auto max-w-2xl space-y-6">
              <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
                Ready to Transform Your Health?
              </h2>
              <p className="text-lg text-primary-foreground/90">
                Join thousands of users who are already tracking their way to better health with FitTrackr.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row justify-center">
                <Button 
                  variant="hero" 
                  size="xl" 
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                  onClick={() => navigate("/auth")}
                >
                  Start Tracking Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">FitTrackr</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 FitTrackr. Track your nutrition, achieve your goals.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
