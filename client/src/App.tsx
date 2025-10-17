import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./lib/auth";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

import SplashScreen from "@/pages/splash";
import LoginScreen from "@/pages/login";
import SignupScreen from "@/pages/signup";
import KycUploadScreen from "@/pages/kyc-upload";
import HomeScreen from "@/pages/home";
import NewOrderScreen from "@/pages/new-order";
import TrackOrderScreen from "@/pages/track-order";
import PaymentScreen from "@/pages/payment";
import OrderHistoryScreen from "./pages/order-history";
import ProfileScreen from "@/pages/profile";
import NotificationsScreen from "@/pages/notifications";
import AddressesScreen from "@/pages/addresses";
import AnalysisScreen from "@/pages/analysis";
import AdminSettingsScreen from "@/pages/admin-settings";
import CancellationRefundsScreen from "@/pages/cancellation-refunds";
import TermsConditionsScreen from "@/pages/terms-conditions";
import ShippingPolicyScreen from "@/pages/shipping-policy";
import PrivacyPolicyScreen from "@/pages/privacy-policy";
import ContactUsScreen from "@/pages/contact-us";
import NotFound from "@/pages/not-found";
import { LocationPickerPage } from "@/components/LocationPicker";

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
          <Route path="/notifications" component={NotificationsScreen} />
          <Route path="/addresses" component={AddressesScreen} />
          <Route path="/location-picker" component={LocationPickerPage} />
          <Route path="/analysis" component={AnalysisScreen} />
          <Route path="/admin/settings" component={AdminSettingsScreen} />

          {/* Policy Pages */}
          <Route
            path="/cancellation-refunds"
            component={CancellationRefundsScreen}
          />
          <Route path="/terms-conditions" component={TermsConditionsScreen} />
          <Route path="/shipping-policy" component={ShippingPolicyScreen} />
          <Route path="/privacy-policy" component={PrivacyPolicyScreen} />
          <Route path="/contact-us" component={ContactUsScreen} />

          <Route path="/">
            <Redirect to="/home" />
          </Route>
        </>
      ) : (
        <>
          {/* Redirect all unauthenticated routes to login */}
          <Route path="/">
            <Redirect to="/login" />
          </Route>
          <Route path="/:rest*">
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
          <div className="max-w-sm mx-auto bg-surface shadow-xl min-h-screen mobile-container relative overflow-y-auto">
            <Toaster />
            <Router />
            <PWAInstallPrompt />
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
