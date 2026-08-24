"use client";

import { useEffect, useState } from "react";
import { apiClient, ApiError } from "@/lib/apiClient";

interface AdminOrder {
  id: string;
  userId: string;
  totalAmount: string | number;
  status: string;
  createdAt: string;
}

interface OrdersResponse {
  data: AdminOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  shipped: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function OrdersTable() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchOrders() {
      setIsLoading(true);
      try {
        const res = await apiClient.get<OrdersResponse>(
          `/admin/orders?page=${page}&limit=50`,
        );
        if (isMounted) {
          setOrders(res.data);
          setTotalPages(res.pagination.totalPages);
          setTotal(res.pagination.total);
        }
      } catch (err) {
        if (isMounted) {
          if (err instanceof ApiError && err.status === 403) {
            setError("You do not have permission to view this data.");
          } else {
            setError("Failed to load orders.");
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchOrders();
    return () => {
      isMounted = false;
    };
  }, [page]);

  if (isLoading)
    return <div className="text-sm text-slate-500">Loading orders…</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-slate-500">
          {total.toLocaleString()} orders total — page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-500">
                Order ID
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">
                User ID
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">
                Total Amount
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">
                  {o.id}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">
                  {o.userId}
                </td>
                <td className="px-4 py-3 text-slate-900">
                  ${Number(o.totalAmount).toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      statusStyles[o.status] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {o.status}
                  </span>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-slate-400"
                >
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
