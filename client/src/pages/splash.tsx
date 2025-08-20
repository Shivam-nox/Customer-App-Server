import { useEffect } from "react";
import { useLocation } from "wouter";
import { Fuel } from "lucide-react";
import logoUrl from "@assets/Final_Logo_with_Tagline_1755695309847.png";

export default function SplashScreen() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLocation("/login");
    }, 3000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="min-h-screen zapygo-gradient flex flex-col items-center justify-center text-white" data-testid="splash-screen">
      <div className="mb-8" data-testid="logo-container">
        <img 
          src={logoUrl} 
          alt="Zapygo - Fueling business, Driving progress" 
          className="h-24 w-auto mx-auto"
          data-testid="splash-logo"
        />
      </div>
      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" data-testid="loading-spinner"></div>
      <p className="mt-4 text-sm opacity-75" data-testid="loading-text">Loading...</p>
    </div>
  );
}
