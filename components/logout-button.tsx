"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  async function handleLogout() {
    try {
      // Best-effort call to your logout API if present
      await fetch("/api/logout", { method: "POST" }).catch(() => {});
    } catch {}
    // Clear any client-only flags used by guards
    try {
      localStorage.removeItem("fd_role");
      localStorage.removeItem("fd_must_change_pwd");
      localStorage.removeItem("fd_pwd_changed");
      sessionStorage.removeItem("fd_temp_pwd");
    } catch {}
    // Go back to login
    router.replace("/login");
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={className ?? "inline-flex items-center rounded px-3 py-2 text-sm font-medium hover:opacity-90"}
      aria-label="Log out"
    >
      Log out
    </button>
  );
}