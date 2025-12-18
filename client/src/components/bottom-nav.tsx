import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Receipt, BarChart3, User } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface BottomNavProps {
  activeTab: "home" | "orders" | "analytics" | "profile";
}

export default function BottomNav({ activeTab }: BottomNavProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const navItems = [
    { key: "home", label: "Home", icon: Home, path: "/home" },
    { key: "orders", label: "Orders", icon: Receipt, path: "/orders" },
    { key: "analytics", label: "Analytics", icon: BarChart3, path: "/analysis" },
    { key: "profile", label: "Profile", icon: User, path: "/profile" },
  ];

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-sm z-50"
      data-testid="bottom-navigation"
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200 px-2 py-1">
        <div className="flex justify-between">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;

            return (
              <Button
                key={item.key}
                variant="ghost"
                size="sm"
                onClick={() => setLocation(item.path)}
                className={`relative flex flex-col items-center gap-1 flex-1 py-2 transition-all duration-200 ${
                  isActive
                    ? "text-red-600"
                    : "text-gray-500 hover:text-gray-900"
                }`}
                data-testid={`nav-${item.key}`}
              >
                {/* Active indicator */}
                {isActive && (
                  <span className="absolute -top-1 h-1 w-6 rounded-full bg-red-600" />
                )}

                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span
                  className={`text-xs ${
                    isActive ? "font-medium" : "font-normal"
                  }`}
                >
                  {item.label}
                </span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
