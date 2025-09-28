"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json()) as { success: boolean; role?: "admin" | "staff"; message?: string };
      if (!res.ok || !data.success || !data.role) {
        setError(data.message || "Invalid credentials");
        setLoading(false);
        return;
      }

      localStorage.setItem("fd_role", data.role);
      if (data.role === "staff") {
        const alreadyChanged = localStorage.getItem("fd_pwd_changed") === "1";
        if (!alreadyChanged) {
          localStorage.setItem("fd_must_change_pwd", "1");
          try { sessionStorage.setItem("fd_temp_pwd", password); } catch {}
        } else {
          localStorage.removeItem("fd_must_change_pwd");
          try { sessionStorage.removeItem("fd_temp_pwd"); } catch {}
        }
      } else {
        localStorage.removeItem("fd_must_change_pwd");
        try { sessionStorage.removeItem("fd_temp_pwd"); } catch {}
      }

      if (data.role === "admin") router.replace("/admin/dashboard");
      else router.replace("/staff");
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-xl font-semibold">Login</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm">Username or email</label>
          <input
            className="w-full rounded border px-3 py-2 text-sm"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin or staff"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">Password</label>
          <input
            className="w-full rounded border px-3 py-2 text-sm"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password1 or Temp1234"
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}