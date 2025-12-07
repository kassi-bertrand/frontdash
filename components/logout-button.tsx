"use client";

import { useAuth } from "@/hooks/use-auth";

interface LogoutButtonProps {
  className?: string;
}

/**
 * Logout button that uses the centralized useAuth hook.
 * Clears httpOnly cookies via /api/logout and redirects to /login.
 */
export function LogoutButton({ className }: LogoutButtonProps) {
  const { logout } = useAuth();

  return (
    <button
      type="button"
      onClick={logout}
      className={className ?? "inline-flex items-center rounded px-3 py-2 text-sm font-medium hover:opacity-90"}
      aria-label="Log out"
    >
      Log out
    </button>
  );
}