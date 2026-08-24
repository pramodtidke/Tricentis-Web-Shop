import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
      <h1 className="text-3xl font-semibold text-slate-900">403 — Access Denied</h1>
      <p className="text-slate-500">
        You don&apos;t have permission to view this page.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
      >
        Back to Home
      </Link>
    </div>
  );
}