import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton"; // Assuming you have this, or use a spinner

// Clerk Imports
import { 
  useUser, 
  useOrganization, 
  OrganizationSwitcher, 
} from "@clerk/clerk-react";

import BottomNav from "@/components/bottom-nav";
import { 
  Bell, 
  Fuel, 
  MapPin, 
  Shield, 
  CheckCircle2,
  Briefcase,
  User,
  ChevronRight,
  Droplets,
  Wallet
} from "lucide-react";
import { format } from "date-fns";
import logoUrl from "@assets/Final_Logo_with_Tagline_1755695309847.png";

export default function HomeScreen() {
  const [, setLocation] = useLocation();
  const { user, isLoaded } = useUser();
  const { organization } = useOrganization();
  
  // -- KYC CHECK --
  const contextKycStatus = organization 
    ? (organization.publicMetadata?.kycStatus as string)
    : (user?.publicMetadata?.kycStatus as string);
  const kycStatus = contextKycStatus || "pending";
  const isKycVerified = kycStatus === "verified";

  // -- DATA FETCHING --
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders", organization?.id || "personal"], 
    queryFn: () =>
      fetch("/api/orders", {
        headers: { 
          "x-user-id": user?.id || "",
          ...(organization?.id ? { "x-org-id": organization.id } : {}) 
        },
      }).then((res) => res.json()),
    refetchInterval: 10000,
    enabled: !!user, 
  });

  const { data: notificationsData } = useQuery({
    queryKey: ["/api/notifications", organization?.id || "personal"],
    queryFn: () =>
      fetch("/api/notifications", {
        headers: { "x-user-id": user?.id || "" },
      }).then((res) => res.json()),
    enabled: !!user,
  });

  const orders = ordersData?.orders || [];
  const recentOrders = [...orders]
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);
  const unreadCount = notificationsData?.unreadCount || 0;
  
  const monthlyLiters = orders.reduce((sum: number, order: any) => {
    if (order.status === 'delivered') return sum + (parseInt(order.quantity) || 0);
    return sum;
  }, 0);
  const totalSaved = monthlyLiters * 7;

  // -- Helpers --
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "delivered": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "in_transit": return "bg-orange-100 text-orange-700 border-orange-200";
      case "confirmed": return "bg-blue-100 text-blue-700 border-blue-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (!isLoaded || !user) return null;

  return (
    <div className="min-h-screen bg-slate-50/80 pb-28" data-testid="home-screen">
      
      {/* --- HEADER SECTION --- */}
      {/* We use a relative container to handle the background curve */}
      <div className="relative bg-white pb-10">
        
        {/* Background Gradient & Pattern */}
        <div className="absolute inset-0 zapygo-gradient overflow-hidden rounded-b-[40px] shadow-lg">
          {/* Decorative circles for texture */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>
        </div>

        {/* Header Content */}
        <div className="relative z-10 pt-6 px-6">
          
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-8">
            <img src={logoUrl} alt="Zapygo" className="h-9 w-auto brightness-0 invert opacity-95 drop-shadow-sm" />
            
            <div className="flex items-center gap-3">
               {/* Glassy Org Switcher */}
               <div className="bg-white/15 border border-white/20 rounded-full px-1.5 py-1 backdrop-blur-md shadow-sm">
                  <OrganizationSwitcher 
                     hidePersonal={false}
                     appearance={{
                       elements: {
                         rootBox: "flex items-center",
                         organizationSwitcherTrigger: "text-white font-medium text-xs px-2 hover:opacity-80 transition-opacity",
                         organizationPreviewAvatarBox: "h-6 w-6 ring-2 ring-white/20", 
                         organizationPreviewTextContainer: "hidden"
                       }
                     }}
                  />
               </div>

               {/* Notification Bell */}
               <Button
                 variant="ghost"
                 size="icon"
                 className="relative bg-white/15 text-white hover:bg-white/25 rounded-full w-10 h-10 border border-white/20 shadow-sm transition-all"
                 onClick={() => setLocation("/notifications")}
               >
                 <Bell size={18} />
                 {unreadCount > 0 && (
                   <span className="absolute top-2.5 right-2.5 bg-red-500 w-2.5 h-2.5 rounded-full ring-2 ring-indigo-500 animate-pulse" />
                 )}
               </Button>
            </div>
          </div>

          {/* User Profile & Greeting */}
          <div className="flex items-center gap-4 mb-8">
            <div className="relative group">
              <div className="h-16 w-16 rounded-2xl p-[3px] bg-white/30 backdrop-blur-sm shadow-inner">
                {organization ? (
                  <img src={organization.imageUrl} alt="Org" className="h-full w-full object-cover rounded-[14px] shadow-sm" />
                ) : (
                  <img src={user.imageUrl} alt="User" className="h-full w-full object-cover rounded-[14px] shadow-sm" />
                )}
              </div>
              {isKycVerified && (
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 border-[3px] border-indigo-600 shadow-md">
                  <CheckCircle2 size={12} strokeWidth={4} />
                </div>
              )}
            </div>

            <div className="flex flex-col text-white">
               <div className="flex items-center gap-1.5 opacity-80 mb-1">
                 <span className="bg-white/20 p-1 rounded-md">
                   {organization ? <Briefcase size={10} /> : <User size={10} />}
                 </span>
                 <span className="text-xs font-semibold uppercase tracking-wider">
                   {organization ? "Business Account" : "Personal Account"}
                 </span>
               </div>
               <h1 className="text-2xl font-bold leading-tight tracking-tight drop-shadow-md">
                 Hello, {organization ? organization.name : user.firstName}
               </h1>
            </div>
          </div>

          {/* Stats Grid - Floating Effect */}
          <div className="grid grid-cols-2 gap-4 -mb-16">
            <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl p-4 shadow-xl shadow-indigo-900/5">
              <div className="flex items-start justify-between mb-2">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">Volume</p>
                <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg">
                  <Droplets size={14} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-800">{monthlyLiters}<span className="text-sm font-medium text-slate-400 ml-1">L</span></p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl p-4 shadow-xl shadow-indigo-900/5">
              <div className="flex items-start justify-between mb-2">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">Saved</p>
                <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg">
                  <Wallet size={14} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-800">₹{totalSaved.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT START --- */}
      <div className="px-5 mt-20 space-y-8">
        
        {/* 1. KYC ALERT (Softer UI) */}
        {!isKycVerified && (
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
             <div className="bg-orange-100 p-2.5 rounded-xl shrink-0">
               <Shield className="w-5 h-5 text-orange-600" />
             </div>
             <div className="flex-1">
               <h3 className="font-bold text-orange-900 text-sm">Account Verification</h3>
               <p className="text-xs text-orange-700/80 mt-0.5">Complete KYC to start ordering fuel.</p>
             </div>
             <Button 
               onClick={() => setLocation("/kyc-upload")}
               size="sm"
               className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs h-8 px-4 shadow-orange-200 shadow-md"
             >
               Verify
             </Button>
          </div>
        )}

        {/* 2. Primary Actions (Gradient Cards) */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setLocation("/new-order")}
            className="group relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-5 text-left shadow-lg shadow-emerald-900/20 transition-transform active:scale-95"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Fuel size={80} />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between gap-4">
              <div className="bg-white/20 w-fit p-2.5 rounded-2xl backdrop-blur-md">
                <Fuel size={22} className="text-white" />
              </div>
              <div>
                <span className="block font-bold text-white text-lg">Order Fuel</span>
                <span className="text-emerald-100 text-xs font-medium">Schedule delivery</span>
              </div>
            </div>
          </button>

          <button
            onClick={() => setLocation("/track-order")}
            className="group relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-5 text-left shadow-lg shadow-indigo-900/20 transition-transform active:scale-95"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <MapPin size={80} />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between gap-4">
              <div className="bg-white/20 w-fit p-2.5 rounded-2xl backdrop-blur-md">
                <MapPin size={22} className="text-white" />
              </div>
              <div>
                <span className="block font-bold text-white text-lg">Track Order</span>
                <span className="text-indigo-100 text-xs font-medium">Real-time updates</span>
              </div>
            </div>
          </button>
        </div>

        {/* 3. Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-lg">Recent Orders</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/orders")}
              className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 text-xs font-semibold h-auto py-1 px-2"
            >
              View All <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>

          {ordersLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
            </div>
          ) : recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order: any) => (
                <div 
                  key={order.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4 transition-all hover:shadow-md"
                >
                  {/* Icon Box */}
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl shrink-0 flex flex-col items-center justify-center w-14 h-14">
                    <span className="text-sm font-bold text-slate-800">{order.quantity}</span>
                    <span className="text-[10px] text-slate-400 font-medium">Ltrs</span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-bold text-slate-800 text-sm truncate">#{order.orderNumber}</p>
                      <Badge variant="outline" className={`${getStatusStyle(order.status)} border rounded-full px-2 py-0 text-[10px] uppercase font-bold tracking-wide`}>
                        {order.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      {format(new Date(order.createdAt), "dd MMM, hh:mm a")}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="text-right shrink-0">
                    <p className="font-bold text-slate-900 text-base">₹{parseFloat(order.totalAmount).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-200">
                <div className="bg-slate-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Fuel size={24} className="text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium text-sm">No recent orders found</p>
                <Button variant="link" onClick={() => setLocation("/new-order")} className="text-indigo-600 text-xs mt-1">
                  Place your first order
                </Button>
            </div>
          )}
        </div>
      </div>

      <BottomNav activeTab="home" />
    </div>
  );
}