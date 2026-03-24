"use client";

import { useState, useEffect } from "react";

interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  locale: string;
  theme_id: string;
  created_at: string;
  subscription?: { plan: string; status: string } | null;
}

export function UsersPanel({ adminKey }: { adminKey: string }) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users", { headers: { "x-admin-key": adminKey } })
      .then(r => r.json())
      .then(data => setUsers(data.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [adminKey]);

  if (loading) return <div className="text-hud-muted text-xs p-4">Loading users...</div>;

  return (
    <div className="p-2 space-y-2">
      <div className="flex justify-between items-center mb-2">
        <span className="hud-label">REGISTERED USERS ({users.length})</span>
      </div>
      <table className="w-full text-[10px] font-mono">
        <thead>
          <tr className="text-hud-muted border-b border-hud-border">
            <td className="py-1 px-2">EMAIL</td>
            <td className="py-1 px-2">PLAN</td>
            <td className="py-1 px-2">STATUS</td>
            <td className="py-1 px-2">LOCALE</td>
            <td className="py-1 px-2">JOINED</td>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className="border-b border-hud-border/30 hover:bg-hud-surface">
              <td className="py-1 px-2 text-hud-text">{u.email}</td>
              <td className="py-1 px-2 text-hud-accent">{u.subscription?.plan || "free"}</td>
              <td className="py-1 px-2">{u.subscription?.status || "active"}</td>
              <td className="py-1 px-2 text-hud-muted">{u.locale}</td>
              <td className="py-1 px-2 text-hud-muted">{new Date(u.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && (
        <div className="text-hud-muted text-center py-8 text-xs">No registered users yet</div>
      )}
    </div>
  );
}
