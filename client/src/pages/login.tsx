import { SignIn } from "@clerk/clerk-react";
import logoUrl from "@assets/Final_Logo_with_Tagline_1755695309847.png";


export default function LoginScreen() 
{
  return (
    // Reverted to Lighter Gradient
    // Changed justify-center to justify-start (Align Top)
    // Removed large paddings, just pt-10 for status bar clearance
    <div className="min-h-screen w-full flex flex-col items-center justify-start pt-10 bg-gradient-to-br from-red-50 via-white to-red-100 dark:from-red-950/30 dark:to-gray-900">
      
      <div className="mb-6 text-center">
        <img 
          src={logoUrl} 
          alt="Zapygo" 
          className="h-12 w-auto mx-auto"
        />
      </div>
      
      {/* Width Control: 
        - max-w-[320px] keeps it compact
        - No margin-top, attaches directly after logo
      */}
      <div className="mb-20">
        <SignIn 
          signUpUrl="/signup" 
          forceRedirectUrl="/home"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-xl border-0 bg-white/80 backdrop-blur-md rounded-xl",
              headerTitle: "text-red-600 text-lg font-bold",
              headerSubtitle: "text-xs text-gray-500",
              formButtonPrimary: "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 border-0 text-sm",
              footerActionLink: "text-red-600 hover:text-red-700 font-medium text-sm",
              formFieldInput: "focus:border-red-500 focus:ring-red-500/20 py-2 text-sm",
              formFieldLabel: "text-xs text-gray-600"
            }
          }}
        />
      </div>
    </div>
  );
}