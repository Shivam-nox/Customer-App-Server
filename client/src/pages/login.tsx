import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/loading-spinner";
import { Mail, Phone } from "lucide-react";

const loginSchema = z.object({
  identifier: z.string().min(1, "Phone number or email is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loginType, setLoginType] = useState<"phone" | "email">("phone");
  
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
    },
  });

  const sendOtpMutation = useMutation({
    mutationFn: async (data: { identifier: string; type: "phone" | "email" }) => {
      const response = await apiRequest("POST", "/api/auth/send-otp", data);
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "OTP Sent",
        description: `Verification code sent to ${variables.identifier}`,
      });
      // Store identifier for OTP verification
      sessionStorage.setItem("otpIdentifier", variables.identifier);
      sessionStorage.setItem("otpType", variables.type);
      setLocation("/otp-verify");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    sendOtpMutation.mutate({
      identifier: data.identifier,
      type: loginType,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" data-testid="login-screen">
      <div className="flex-1 p-6">
        <div className="text-center mb-8 mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-2" data-testid="welcome-title">Welcome Back</h2>
          <p className="text-gray-600" data-testid="signin-subtitle">Sign in to your account</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex space-x-2 mb-4">
                <Button
                  type="button"
                  variant={loginType === "phone" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLoginType("phone")}
                  className="flex-1"
                  data-testid="phone-login-tab"
                >
                  <Phone size={16} className="mr-2" />
                  Phone
                </Button>
                <Button
                  type="button"
                  variant={loginType === "email" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLoginType("email")}
                  className="flex-1"
                  data-testid="email-login-tab"
                >
                  <Mail size={16} className="mr-2" />
                  Email
                </Button>
              </div>

              <div className="floating-label">
                <Input
                  {...form.register("identifier")}
                  type={loginType === "email" ? "email" : "tel"}
                  placeholder=" "
                  className="peer"
                  data-testid={`${loginType}-input`}
                />
                <Label className="peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
                  {loginType === "phone" ? "Phone Number" : "Email Address"}
                </Label>
              </div>

              {form.formState.errors.identifier && (
                <p className="text-sm text-destructive" data-testid="error-message">
                  {form.formState.errors.identifier.message}
                </p>
              )}

              <Button
                type="submit"
                className="w-full ripple"
                disabled={sendOtpMutation.isPending}
                data-testid="send-otp-button"
              >
                {sendOtpMutation.isPending ? (
                  <LoadingSpinner />
                ) : (
                  `Send ${loginType === "phone" ? "SMS" : "Email"} OTP`
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="p-6 text-center">
        <p className="text-gray-600" data-testid="signup-prompt">
          New to Zapygo? Contact support for business registration
        </p>
      </div>
    </div>
  );
}
