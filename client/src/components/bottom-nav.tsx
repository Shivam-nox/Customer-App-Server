import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Home, Receipt, MapPin, User } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface BottomNavProps {
  activeTab: "home" | "orders" | "track" | "profile";
}

export default function BottomNav({ activeTab }: BottomNavProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Fetch orders to find the most recent trackable order
  const { data: ordersData } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: () => fetch("/api/orders", {
      headers: { "x-user-id": user?.id || "" },
    }).then(res => res.json()),
    enabled: !!user,
  });

  const orders = ordersData?.orders || [];
  
  // Find the most recent order that can be tracked (not delivered)
  const trackableOrder = orders.find((order: any) => 
    order.status !== "delivered" && order.status !== "cancelled"
  ) || orders[0]; // Fallback to most recent order

  const getTrackPath = () => {
    if (trackableOrder) {
      return `/track-order/${trackableOrder.id}`;
    }
    return "/orders"; // If no orders, go to orders page
  };

  const navItems = [
    { key: "home", label: "Home", icon: Home, path: "/home" },
    { key: "orders", label: "Orders", icon: Receipt, path: "/orders" },
    { key: "track", label: "Track", icon: MapPin, path: getTrackPath() },
    { key: "profile", label: "Profile", icon: User, path: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-white border-t border-gray-200 p-2" data-testid="bottom-navigation">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          
          return (
            <Button
              key={item.key}
              variant="ghost"
              size="sm"
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center p-2 min-w-0 flex-1 ${
                isActive ? "text-primary" : "text-gray-500"
              }`}
              data-testid={`nav-${item.key}`}
            >
              <Icon size={20} />
              <span className="text-xs mt-1">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
