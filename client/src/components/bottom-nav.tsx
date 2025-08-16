import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Receipt, MapPin, User } from "lucide-react";

interface BottomNavProps {
  activeTab: "home" | "orders" | "track" | "profile";
}

export default function BottomNav({ activeTab }: BottomNavProps) {
  const [, setLocation] = useLocation();

  const navItems = [
    { key: "home", label: "Home", icon: Home, path: "/home" },
    { key: "orders", label: "Orders", icon: Receipt, path: "/orders" },
    { key: "track", label: "Track", icon: MapPin, path: "/track-order" },
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
