"use client";

import { useState } from "react";
import AdminRoute from "@/components/AdminRoute";
import UsersTable from "@/components/admin/UsersTable";
import OrdersTable from "@/components/admin/OrdersTable";

type Tab = "users" | "orders";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("users");

  const tabs: { id: Tab; label: string }[] = [
    { id: "users", label: "Users" },
    { id: "orders", label: "Orders" },
  ];

  return (
    <div className="flex min-h-[80vh]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-slate-200 bg-slate-50 p-4">
        <h2 className="mb-4 px-2 text-lg font-semibold text-slate-900">
          Admin Panel
        </h2>
        <nav className="flex flex-col gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 p-6">
        {activeTab === "users" && <UsersTable />}
        {activeTab === "orders" && <OrdersTable />}
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminRoute>
      <AdminDashboard />
    </AdminRoute>
  );
}
