import { useEffect } from "react";
import { useLocation } from "wouter";
import { Fuel } from "lucide-react";

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
      <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6" data-testid="logo-container">
        <Fuel size={48} className="text-white" />
      </div>
      <h1 className="text-4xl font-bold mb-2" data-testid="app-title">Zapygo</h1>
      <p className="text-lg opacity-90 mb-8" data-testid="tagline">Doorstep Diesel Delivery</p>
      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" data-testid="loading-spinner"></div>
      <p className="mt-4 text-sm opacity-75" data-testid="loading-text">Loading...</p>
    </div>
  );
}
