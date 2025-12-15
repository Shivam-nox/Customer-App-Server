import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import logoUrl from "@assets/Final_Logo_with_Tagline_1755695309847.png";

const loginSchema = z.object({
  username: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Invalid username or password");
      }
      return response.json();
    },
    onSuccess: async (response) => {
      if (response.success && response.user) {
        setUser(response.user);
        toast({
          title: "Welcome!",
          description: "Successfully signed in to Zapygo",
        });
        // Use setTimeout to ensure state updates before navigation
        setTimeout(() => {
          setLocation("/home");
        }, 100);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-blue-50 dark:from-primary/10 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg" data-testid="login-card">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto mb-6">
            <img 
              src={logoUrl} 
              alt="Zapygo - Fueling business, Driving progress" 
              className="h-16 w-auto mx-auto"
              data-testid="login-logo"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your Zapygo account
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Email or Username</Label>
              <Input
                id="username"
                {...register("username")}
                placeholder="Enter your email or username"
                data-testid="input-username"
              />
              {errors.username && (
                <p className="text-sm text-red-500" data-testid="error-username">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="Enter your password"
                  data-testid="input-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500" data-testid="error-password">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
              data-testid="button-login"
            >
              <LogIn className="w-4 h-4 mr-2" />
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto font-medium text-primary"
                onClick={() => setLocation("/signup")}
                data-testid="link-signup"
              >
                Create one here
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}