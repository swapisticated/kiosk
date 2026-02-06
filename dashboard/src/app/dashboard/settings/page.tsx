"use client";

import { signOut } from "next-auth/react";

export default function SettingsPage() {
  const handleLogout = async () => {
    // Clear all cached data
    localStorage.removeItem("tenantId");
    localStorage.removeItem("apiKey");

    // Sign out from NextAuth (clears session cookie)
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-lg">
          Manage your account and preferences
        </p>
      </header>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold mb-4">Account</h2>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
