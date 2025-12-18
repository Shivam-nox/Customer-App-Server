import { useEffect } from "react";
import { useLocation } from "wouter";
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
    <>
      <style>
        {`
          @keyframes gradientMove {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>

      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{
          background: `
            linear-gradient(
              120deg,
              #ffffff,
              #f4f4f4,
              #fde8e8,
              #f4f4f4,
              #ffffff
            )
          `,
          backgroundSize: "350% 350%",
          animation: "gradientMove 16s ease-in-out infinite",
        }}
        data-testid="splash-screen"
      >
        {/* Logo */}
        <div className="mb-8">
          <img
            src={logoUrl}
            alt="Zapygo - Fueling business, Driving progress"
            className="h-24 w-auto mx-auto"
          />
        </div>

        {/* Loader */}
        <div
          className="w-8 h-8 rounded-full animate-spin"
          style={{
            border: "2px solid rgba(0,0,0,0.25)",
            borderTopColor: "#c62828",
          }}
        />

        {/* Text */}
        <p
          className="mt-4 text-sm"
          style={{ color: "rgba(0,0,0,0.6)" }}
        >
          Loading...
        </p>
      </div>
    </>
  );
}
