"use client";

import { useState, useEffect, useCallback } from "react";
import type { AuthUser, AdminUser, StaffUser, RestaurantUser } from "@/lib/auth/types";

/** Auth state returned by useAuth hook */
interface AuthState {
  /** Current user, or null if not authenticated */
  user: AuthUser | null;
  /** True while fetching auth state */
  isLoading: boolean;
  /** True if user is authenticated */
  isAuthenticated: boolean;
  /** Refresh auth state from server */
  refresh: () => Promise<void>;
  /** Log out and clear auth state */
  logout: () => Promise<void>;
}

/**
 * Hook to access authentication state from client components.
 *
 * Fetches user data from /api/auth/me (which reads httpOnly cookies)
 * and provides typed access to the current user.
 *
 * @example
 * ```tsx
 * function Header() {
 *   const { user, isLoading, logout } = useAuth();
 *
 *   if (isLoading) return <Spinner />;
 *   if (!user) return <LoginLink />;
 *
 *   return (
 *     <div>
 *       Welcome, {user.username}!
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setUser(data.user);
    } catch (err) {
      console.error("Failed to fetch auth state:", err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout request failed:", err);
    }
    // Clear local state and redirect regardless of API success
    setUser(null);
    window.location.href = "/login";
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    isLoading,
    isAuthenticated: user !== null,
    refresh: fetchUser,
    logout,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Type Guards - for narrowing AuthUser discriminated union
// ─────────────────────────────────────────────────────────────────────────────

/** Check if user is an admin */
export function isAdminUser(user: AuthUser | null): user is AdminUser {
  return user?.role === "admin";
}

/** Check if user is a staff member */
export function isStaffUser(user: AuthUser | null): user is StaffUser {
  return user?.role === "staff";
}

/** Check if user is a restaurant */
export function isRestaurantUser(user: AuthUser | null): user is RestaurantUser {
  return user?.role === "restaurant";
}
