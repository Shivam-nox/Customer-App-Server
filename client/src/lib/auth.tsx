import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  isLoading: boolean;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Get stored user ID from localStorage
  const storedUserId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  const { data: userData, isLoading, refetch, error } = useQuery({
    queryKey: ["/api/user/profile"],
    queryFn: async () => {
      const response = await fetch("/api/user/profile", {
        headers: { "x-user-id": storedUserId || "" },
      });
      
      if (!response.ok) {
        // If user not found (cleared from database), clear localStorage
        if (response.status === 404 || response.status === 401) {
          localStorage.removeItem("userId");
          throw new Error("User not found - cleared from cache");
        }
        throw new Error("Unauthorized");
      }
      
      return response.json();
    },
    enabled: !!storedUserId && !user,
    retry: (failureCount, error) => {
      // Don't retry if user was cleared from database
      if (error?.message?.includes("User not found")) {
        return false;
      }
      return failureCount < 3;
    },
  });

  useEffect(() => {
    if (userData?.user) {
      setUser(userData.user);
    }
    // If there's an error and user was cleared, reset state
    if (error?.message?.includes("User not found")) {
      setUser(null);
      setIsInitialized(true);
    }
    if (!isLoading) {
      setIsInitialized(true);
    }
  }, [userData, isLoading, error]);

  const handleSetUser = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem("userId", newUser.id);
    } else {
      localStorage.removeItem("userId");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("userId");
  };

  const refetchUser = () => {
    refetch();
  };

  return (
    <AuthContext.Provider value={{
      user,
      setUser: handleSetUser,
      logout,
      isLoading: !isInitialized,
      refetchUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
