import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Controller } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  CreditCard,
  FileText,
  Building2,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import logoUrl from "@assets/Final_Logo_with_Tagline_1755695309847.png";

// SIMPLIFIED SIGNUP - Business details commented out for easier onboarding
// TODO: Can be re-enabled later or moved to profile completion
const signupSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50),
    email: z.string().email("Invalid email address"),
    phone: z
      .string()
      .min(10, "Phone number is required")
      .regex(/^[6-9]\d{9}$/, "Invalid Indian phone number"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    
    // COMMENTED OUT - Business fields (can be added later via profile)
    // businessName: z.string().min(1, "Business name is required"),
    // businessAddress: z.string().min(1, "Business address is required"),
    // industryType: z.string().min(1, "Industry type is required"),
    // gstNumber: z
    //   .string()
    //   .transform((val) => val.toUpperCase())
    //   .pipe(
    //     z
    //       .string()
    //       .regex(
    //         /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    //         "Invalid GST number format"
    //       )
    //   ),
    // panNumber: z
    //   .string()
    //   .transform((val) => val.toUpperCase())
    //   .pipe(
    //     z
    //       .string()
    //       .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN number format")
    //   ),
    // cinNumber: z
    //   .string()
    //   .optional()
    //   .transform((val) => (val ? val.toUpperCase() : val))
    //   .pipe(
    //     z
    //       .string()
    //       .optional()
    //       .refine(
    //         (val) =>
    //           !val ||
    //           /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/.test(val),
    //         "Invalid CIN format (21 characters: L/U + 5 digits + 2 letters + 4 digits + 3 letters + 6 digits)"
    //       )
    //   ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

const industryOptions = [
  "Agriculture & Farming",
  "Manufacturing",
  "Construction",
  "Transportation & Logistics",
  "Mining & Quarrying",
  "Retail & Wholesale",
  "Hospitality & Tourism",
  "Healthcare",
  "Education",
  "Real Estate",
  "IT & Technology",
  "Financial Services",
  "Government",
  "Others",
];

export default function SignupScreen() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupFormData) => {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create account");
      }
      return response.json();
    },
    onSuccess: (response) => {
      if (response.success && response.user) {
        setUser(response.user);
        toast({
          title: "Account created successfully!",
          description: "Welcome to Zapygo",
        });
        setLocation("/home");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Signup failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SignupFormData) => {
    // Remove confirmPassword before sending to API
    const { confirmPassword, ...signupData } = data;
    signupMutation.mutate(signupData as SignupFormData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-blue-50 dark:from-primary/10 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg" data-testid="signup-card">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto mb-6">
            <img
              src={logoUrl}
              alt="Zapygo - Fueling business, Driving progress"
              className="h-16 w-auto mx-auto"
              data-testid="signup-logo"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            Create Account
          </CardTitle>
          <CardDescription>
            Join Zapygo for reliable diesel delivery
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Enter your full name"
                data-testid="input-name"
              />
              {errors.name && (
                <p className="text-sm text-red-500" data-testid="error-name">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                {...register("username")}
                placeholder="Choose a username"
                data-testid="input-username"
              />
              {errors.username && (
                <p
                  className="text-sm text-red-500"
                  data-testid="error-username"
                >
                  {errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="Enter your email"
                data-testid="input-email"
              />
              {errors.email && (
                <p className="text-sm text-red-500" data-testid="error-email">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="Create a password"
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
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p
                  className="text-sm text-red-500"
                  data-testid="error-password"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  placeholder="Re-enter your password"
                  data-testid="input-confirmPassword"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  data-testid="button-toggle-confirmPassword"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p
                  className="text-sm text-red-500"
                  data-testid="error-confirmPassword"
                >
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number *
              </Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="Enter 10-digit mobile number"
                data-testid="input-phone"
              />
              {errors.phone && (
                <p className="text-sm text-red-500" data-testid="error-phone">
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* COMMENTED OUT - Business Details Section (can be added later via profile or separate flow) */}
            {/* 
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4 text-primary">
                Business Details
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="businessName"
                    className="flex items-center gap-2"
                  >
                    <Building className="w-4 h-4" />
                    Business Name *
                  </Label>
                  <Input
                    id="businessName"
                    {...register("businessName")}
                    placeholder="Enter your business name"
                    data-testid="input-businessName"
                  />
                  {errors.businessName && (
                    <p
                      className="text-sm text-red-500"
                      data-testid="error-businessName"
                    >
                      {errors.businessName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="businessAddress"
                    className="flex items-center gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    Business Address *
                  </Label>
                  <Input
                    id="businessAddress"
                    {...register("businessAddress")}
                    placeholder="Enter complete business address"
                    data-testid="input-businessAddress"
                  />
                  {errors.businessAddress && (
                    <p
                      className="text-sm text-red-500"
                      data-testid="error-businessAddress"
                    >
                      {errors.businessAddress.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industryType">Industry Type *</Label>
                  <Controller
                    name="industryType"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger data-testid="select-industryType">
                          <SelectValue placeholder="Select your industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {industryOptions.map((industry) => (
                            <SelectItem key={industry} value={industry}>
                              {industry}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.industryType && (
                    <p
                      className="text-sm text-red-500"
                      data-testid="error-industryType"
                    >
                      {errors.industryType.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="gstNumber"
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    GST Number *
                  </Label>
                  <Input
                    id="gstNumber"
                    {...register("gstNumber")}
                    placeholder="Enter 15-digit GST number"
                    data-testid="input-gstNumber"
                    style={{ textTransform: "uppercase" }}
                  />
                  {errors.gstNumber && (
                    <p
                      className="text-sm text-red-500"
                      data-testid="error-gstNumber"
                    >
                      {errors.gstNumber.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="panNumber"
                    className="flex items-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    PAN Number *
                  </Label>
                  <Input
                    id="panNumber"
                    {...register("panNumber")}
                    placeholder="Enter 10-digit PAN number"
                    data-testid="input-panNumber"
                    style={{ textTransform: "uppercase" }}
                  />
                  {errors.panNumber && (
                    <p
                      className="text-sm text-red-500"
                      data-testid="error-panNumber"
                    >
                      {errors.panNumber.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="cinNumber"
                    className="flex items-center gap-2"
                  >
                    <Building2 className="w-4 h-4" />
                    CIN Number (Optional)
                  </Label>
                  <Input
                    id="cinNumber"
                    {...register("cinNumber")}
                    placeholder="Enter 21-digit CIN number"
                    data-testid="input-cinNumber"
                    style={{ textTransform: "uppercase" }}
                    maxLength={21}
                  />
                  {errors.cinNumber && (
                    <p
                      className="text-sm text-red-500"
                      data-testid="error-cinNumber"
                    >
                      {errors.cinNumber.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Format: L/U + 5 digits + 2 letters + 4 digits + 3 letters +
                    6 digits
                  </p>
                </div>
              </div>
            </div>
            */}

            <Button
              type="submit"
              className="w-full"
              disabled={signupMutation.isPending}
              data-testid="button-signup"
            >
              {signupMutation.isPending
                ? "Creating Account..."
                : "Create Account"}
            </Button>
          </form>

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto font-medium text-primary"
                onClick={() => setLocation("/login")}
                data-testid="link-login"
              >
                Sign in here
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}