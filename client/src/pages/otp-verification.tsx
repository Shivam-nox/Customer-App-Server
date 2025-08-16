import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import LoadingSpinner from "@/components/loading-spinner";
import { ArrowLeft } from "lucide-react";

export default function OtpVerificationScreen() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setUser } = useAuth();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const identifier = sessionStorage.getItem("otpIdentifier") || "";
  const otpType = sessionStorage.getItem("otpType") || "phone";
  
  useEffect(() => {
    if (!identifier) {
      setLocation("/login");
      return;
    }
    
    const timer = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [identifier, setLocation]);

  const verifyOtpMutation = useMutation({
    mutationFn: async (data: { identifier: string; otp: string }) => {
      const response = await apiRequest("POST", "/api/auth/verify-otp", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "OTP verified successfully",
      });
      setUser(data.user);
      sessionStorage.removeItem("otpIdentifier");
      sessionStorage.removeItem("otpType");
      
      // Redirect based on KYC status
      if (data.user.kycStatus === "pending") {
        setLocation("/kyc-upload");
      } else {
        setLocation("/home");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Invalid OTP",
        variant: "destructive",
      });
    },
  });

  const resendOtpMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/send-otp", {
        identifier,
        type: otpType,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "OTP Sent",
        description: "New verification code sent",
      });
      setResendTimer(30);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resend OTP",
        variant: "destructive",
      });
    },
  });

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when all fields are filled
    if (newOtp.every(digit => digit.length === 1)) {
      verifyOtpMutation.mutate({
        identifier,
        otp: newOtp.join(""),
      });
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const maskIdentifier = (id: string) => {
    if (otpType === "phone") {
      return id.replace(/(\d{2})\d+(\d{3})/, "$1****$2");
    }
    const [user, domain] = id.split("@");
    return `${user.charAt(0)}***@${domain}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" data-testid="otp-verification-screen">
      <div className="flex items-center p-4 border-b bg-white">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/login")}
          className="mr-3"
          data-testid="back-button"
        >
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-lg font-medium" data-testid="page-title">Verify OTP</h2>
      </div>

      <div className="flex-1 p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center mb-8">
              <p className="text-gray-600 mb-4" data-testid="otp-instruction">Enter the 6-digit code sent to</p>
              <p className="font-medium" data-testid="masked-identifier">{maskIdentifier(identifier)}</p>
            </div>

            <div className="flex justify-center space-x-3 mb-8">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-lg font-medium"
                  data-testid={`otp-input-${index}`}
                />
              ))}
            </div>

            <Button
              onClick={() => verifyOtpMutation.mutate({ identifier, otp: otp.join("") })}
              className="w-full ripple mb-4"
              disabled={verifyOtpMutation.isPending || otp.join("").length !== 6}
              data-testid="verify-otp-button"
            >
              {verifyOtpMutation.isPending ? <LoadingSpinner /> : "Verify OTP"}
            </Button>

            <div className="text-center">
              <p className="text-gray-600" data-testid="resend-prompt">
                Didn't receive code?{" "}
                {resendTimer > 0 ? (
                  <span className="text-sm text-gray-500" data-testid="resend-timer">
                    Resend in {resendTimer}s
                  </span>
                ) : (
                  <Button
                    variant="link"
                    onClick={() => resendOtpMutation.mutate()}
                    disabled={resendOtpMutation.isPending}
                    className="p-0 h-auto font-medium"
                    data-testid="resend-button"
                  >
                    {resendOtpMutation.isPending ? "Sending..." : "Resend"}
                  </Button>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
