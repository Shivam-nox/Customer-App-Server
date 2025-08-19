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

  const { data: userData, isLoading, refetch } = useQuery<{ user: User }>({
    queryKey: ["/api/user/profile"],
    enabled: !!storedUserId && !user,
    retry: false,
    staleTime: 0,
  });

  useEffect(() => {
    if (userData?.user) {
      setUser(userData.user);
    }
    if (!isLoading) {
      setIsInitialized(true);
    }
  }, [userData, isLoading]);

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
