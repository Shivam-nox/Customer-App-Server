import React from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./lib/auth";

import SplashScreen from "@/pages/splash";
import LoginScreen from "@/pages/login";
import SignupScreen from "@/pages/signup";
import KycUploadScreen from "@/pages/kyc-upload";
import HomeScreen from "@/pages/home";
import NewOrderScreen from "@/pages/new-order";
import TrackOrderScreen from "@/pages/track-order";
import PaymentScreen from "@/pages/payment";
import OrderHistoryScreen from "@/pages/order-history";
import ProfileScreen from "@/pages/profile";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Switch>
      <Route path="/splash" component={SplashScreen} />
      <Route path="/login" component={LoginScreen} />
      <Route path="/signup" component={SignupScreen} />
      
      {user ? (
        <>
          <Route path="/kyc-upload" component={KycUploadScreen} />
          <Route path="/home" component={HomeScreen} />
          <Route path="/new-order" component={NewOrderScreen} />
          <Route path="/track-order/:orderId?" component={TrackOrderScreen} />
          <Route path="/payment/:orderId" component={PaymentScreen} />
          <Route path="/orders" component={OrderHistoryScreen} />
          <Route path="/profile" component={ProfileScreen} />
          <Route path="/">
            <Redirect to="/home" />
          </Route>
        </>
      ) : (
        <>
          <Route path="/">
            <Redirect to="/login" />
          </Route>
        </>
      )}
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="max-w-sm mx-auto bg-surface shadow-xl min-h-screen mobile-container relative overflow-hidden">
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
