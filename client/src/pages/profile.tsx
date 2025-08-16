import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import BottomNav from "@/components/bottom-nav";
import LoadingSpinner from "@/components/loading-spinner";
import { 
  ArrowLeft, 
  Edit, 
  Shield, 
  CreditCard, 
  Bell, 
  HelpCircle, 
  MessageSquare, 
  FileText, 
  LogOut,
  CheckCircle,
  Clock,
  XCircle,
  User
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  businessName: z.string().optional(),
  businessAddress: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfileScreen() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, logout, refetchUser } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      businessName: user?.businessName || "",
      businessAddress: user?.businessAddress || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const response = await apiRequest("PUT", "/api/user/profile", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setIsEditDialogOpen(false);
      refetchUser();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const { data: notificationsData } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: () => fetch("/api/notifications", {
      headers: { "x-user-id": user?.id || "" },
    }).then(res => res.json()),
    enabled: !!user,
  });

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
    setLocation("/login");
  };

  const onSubmit = (data: ProfileForm) => {
    updateProfileMutation.mutate(data);
  };

  if (!user) return null;

  const getKycStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="text-green-600" size={20} />;
      case "submitted":
        return <Clock className="text-orange-600" size={20} />;
      case "rejected":
        return <XCircle className="text-red-600" size={20} />;
      default:
        return <Shield className="text-gray-600" size={20} />;
    }
  };

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800 border-green-200";
      case "submitted":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getKycStatusText = (status: string) => {
    switch (status) {
      case "verified":
        return "KYC Verified";
      case "submitted":
        return "KYC Under Review";
      case "rejected":
        return "KYC Rejected";
      default:
        return "KYC Pending";
    }
  };

  const profileMenuItems = [
    {
      icon: Edit,
      label: "Edit Profile",
      action: () => setIsEditDialogOpen(true),
      testId: "edit-profile-button",
    },
    {
      icon: Shield,
      label: "KYC Documents",
      action: () => setLocation("/kyc-upload"),
      testId: "kyc-documents-button",
    },
    {
      icon: CreditCard,
      label: "Payment Methods",
      action: () => toast({ title: "Coming Soon", description: "Payment methods management will be available soon" }),
      testId: "payment-methods-button",
    },
    {
      icon: Bell,
      label: "Notification Settings",
      action: () => toast({ title: "Coming Soon", description: "Notification settings will be available soon" }),
      testId: "notifications-button",
    },
  ];

  const supportMenuItems = [
    {
      icon: HelpCircle,
      label: "Help Center",
      action: () => toast({ title: "Help Center", description: "Opening help center..." }),
      testId: "help-center-button",
    },
    {
      icon: MessageSquare,
      label: "Contact Support",
      action: () => toast({ title: "Contact Support", description: "Redirecting to support..." }),
      testId: "contact-support-button",
    },
    {
      icon: FileText,
      label: "Terms & Privacy",
      action: () => toast({ title: "Terms & Privacy", description: "Opening terms and privacy policy..." }),
      testId: "terms-privacy-button",
    },
  ];

  const unreadCount = notificationsData?.unreadCount || 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" data-testid="profile-screen">
      <div className="flex items-center p-4 border-b bg-white">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/home")}
          className="mr-3"
          data-testid="back-button"
        >
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-lg font-medium" data-testid="page-title">Profile</h2>
      </div>

      <div className="flex-1 pb-20">
        <div className="p-4 space-y-4">
          {/* User Info */}
          <Card data-testid="user-info-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <User size={32} className="text-gray-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg" data-testid="user-name">{user.name}</h3>
                  <p className="text-gray-600" data-testid="business-name">
                    {user.businessName || "Business Name Not Set"}
                  </p>
                  <p className="text-sm text-gray-500" data-testid="user-contact">
                    {user.phone || user.email}
                  </p>
                </div>
              </div>

              {/* KYC Status */}
              <div className={`flex items-center justify-between p-3 border rounded-lg ${getKycStatusColor(user.kycStatus)}`} data-testid="kyc-status">
                <div className="flex items-center space-x-2">
                  {getKycStatusIcon(user.kycStatus)}
                  <span className="font-medium">{getKycStatusText(user.kycStatus)}</span>
                </div>
                {user.kycStatus === "verified" && (
                  <span className="text-xs" data-testid="kyc-verified-date">
                    Verified
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profile Options */}
          <Card data-testid="profile-options">
            <CardContent className="p-0">
              {profileMenuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.label}
                    variant="ghost"
                    onClick={item.action}
                    className={`w-full flex items-center justify-between p-4 h-auto ${
                      index < profileMenuItems.length - 1 ? "border-b border-gray-100" : ""
                    }`}
                    data-testid={item.testId}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="text-gray-600" size={20} />
                      <span>{item.label}</span>
                    </div>
                    <ArrowLeft className="text-gray-400 rotate-180" size={16} />
                  </Button>
                );
              })}
            </CardContent>
          </Card>

          {/* Support & Help */}
          <Card data-testid="support-options">
            <CardContent className="p-0">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-lg">Support & Help</h3>
              </div>
              {supportMenuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.label}
                    variant="ghost"
                    onClick={item.action}
                    className={`w-full flex items-center justify-between p-4 h-auto ${
                      index < supportMenuItems.length - 1 ? "border-b border-gray-100" : ""
                    }`}
                    data-testid={item.testId}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="text-gray-600" size={20} />
                      <span>{item.label}</span>
                    </div>
                    <ArrowLeft className="text-gray-400 rotate-180" size={16} />
                  </Button>
                );
              })}
            </CardContent>
          </Card>

          {/* App Info */}
          <Card className="bg-gray-100" data-testid="app-info">
            <CardContent className="p-4 text-center">
              <p className="text-gray-600 text-sm" data-testid="app-version">App Version: 1.0.0</p>
              <p className="text-gray-500 text-xs mt-1" data-testid="copyright">© 2024 Zapygo. All rights reserved.</p>
            </CardContent>
          </Card>

          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full py-3 font-medium ripple"
            data-testid="logout-button"
          >
            <LogOut size={20} className="mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent data-testid="edit-profile-dialog">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="floating-label">
              <Input
                {...form.register("name")}
                placeholder=" "
                className="peer"
                data-testid="edit-name-input"
              />
              <Label className="peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
                Full Name
              </Label>
            </div>

            {form.formState.errors.name && (
              <p className="text-sm text-destructive" data-testid="name-error">
                {form.formState.errors.name.message}
              </p>
            )}

            <div className="floating-label">
              <Input
                {...form.register("businessName")}
                placeholder=" "
                className="peer"
                data-testid="edit-business-name-input"
              />
              <Label className="peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
                Business Name
              </Label>
            </div>

            <div className="floating-label">
              <Input
                {...form.register("businessAddress")}
                placeholder=" "
                className="peer"
                data-testid="edit-business-address-input"
              />
              <Label className="peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
                Business Address
              </Label>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1"
                data-testid="cancel-edit-button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="flex-1"
                data-testid="save-profile-button"
              >
                {updateProfileMutation.isPending ? <LoadingSpinner /> : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <BottomNav activeTab="profile" />
    </div>
  );
}
