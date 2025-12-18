import { useUser, useClerk } from "@clerk/clerk-react";

// This is kept for compatibility, but it simply renders children now.
// The actual provider logic is in App.tsx (ClerkProvider).
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useAuth() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut, openUserProfile } = useClerk();

  // Bridge: Map Clerk's user object to match your app's existing structure.
  // We access custom fields like 'kycStatus' from Clerk's publicMetadata.
  const adaptedUser = user ? {
    ...user, // Keep all Clerk methods and props
    id: user.id,
    name: user.fullName,
    username: user.username,
    email: user.primaryEmailAddress?.emailAddress,
    // IMPORTANT: Custom fields must be stored in Clerk's publicMetadata
    kycStatus: (user.publicMetadata as any)?.kycStatus || "pending",
    role: (user.publicMetadata as any)?.role || "user",
  } : null;

  return {
    user: adaptedUser,
    isLoading: !isLoaded,
    isAuthenticated: isSignedIn,
    logout: async () => {
      await signOut();
      // Optional: Clear any local storage if you still use it
      localStorage.removeItem("userId");
    },
    // Convenience function to open Clerk's pre-built profile modal
    openProfile: () => openUserProfile(),
    
    // Legacy stubs to prevent crashes in components calling these
    setUser: () => console.warn("setUser is handled automatically by Clerk"),
    refetchUser: () => user?.reload(),
  };
}