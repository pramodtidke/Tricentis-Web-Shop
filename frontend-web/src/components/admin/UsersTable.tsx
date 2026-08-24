"use client";

import { useEffect, useState } from "react";
import { apiClient, ApiError } from "@/lib/apiClient";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function UsersTable() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchUsers() {
      try {
        const data = await apiClient.get<AdminUser[]>("/admin/users");
        if (isMounted) setUsers(data);
      } catch (err) {
        if (isMounted) {
          if (err instanceof ApiError && err.status === 403) {
            setError("You do not have permission to view this data.");
          } else {
            setError("Failed to load users.");
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) return <div className="text-sm text-slate-500">Loading users…</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Name</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Email</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Role</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Created At</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {users.map((u) => (
            <tr key={u.id}>
              <td className="px-4 py-3 text-slate-900">{u.name}</td>
              <td className="px-4 py-3 text-slate-600">{u.email}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    u.role === "admin"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {u.role}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-500">
                {new Date(u.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                No users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}