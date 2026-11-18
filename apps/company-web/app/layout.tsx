import type { Metadata } from "next";
import Link from "next/link";
import { Bell, Building2, CircleUserRound, Search } from "lucide-react";

import { Badge } from "@bench/ui";

import "./globals.css";
import { SidebarNav } from "./_components/sidebar-nav";
import { getDashboardSummary, getMe } from "./lib/api";

export const metadata: Metadata = {
  title: "BenchOS Company Console",
  description: "Recruitment and bench-management operations",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [summary, user] = await Promise.all([getDashboardSummary(), getMe()]);

  return (
    <html lang="en">
      <body>
        <main className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[260px_1fr]">
          <aside className="hidden min-h-screen border-r border-slate-800 bg-slate-950 text-white lg:flex lg:flex-col">
            <Link className="flex h-20 items-center gap-3 border-b border-slate-800 px-6" href="/">
              <div className="grid size-10 place-items-center rounded-xl bg-indigo-500">
                <Building2 className="size-5" />
              </div>
              <div>
                <p className="font-bold">{summary.company.display_name}</p>
                <p className="text-xs text-slate-400">Recruitment console</p>
              </div>
            </Link>
            <div className="flex-1">
              <SidebarNav />
            </div>
            <div className="border-t border-slate-800 p-4">
              <div className="flex items-center gap-3 rounded-xl bg-slate-900 p-3">
                <CircleUserRound className="size-9 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{user.display_name}</p>
                  <p className="text-xs text-slate-400">
                    {user.global_role === "STANDARD"
                      ? user.memberships.map((membership) => membership.role).join(", ") || "No group access"
                      : user.global_role}
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <section className="min-w-0">
            <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
              <Link className="flex items-center gap-3 lg:hidden" href="/">
                <div className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-white">
                  <Building2 className="size-4.5" />
                </div>
                <span className="font-bold">{summary.company.display_name}</span>
              </Link>
              <div className="hidden w-full max-w-md items-center gap-3 rounded-xl bg-slate-100 px-4 py-2.5 lg:flex">
                <Search className="size-4 text-slate-400" />
                <span className="text-sm text-slate-400">Search from the Candidates page</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge>{summary.company.status}</Badge>
                <button
                  aria-label="Notifications"
                  className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                >
                  <Bell className="size-4.5" />
                </button>
              </div>
            </header>
            <div className="border-b border-slate-200 bg-white px-5 py-3 lg:hidden">
              <div className="flex gap-2 overflow-x-auto">
                <Link className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold" href="/">
                  Dashboard
                </Link>
                <Link className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold" href="/candidates">
                  Candidates
                </Link>
                <Link className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold" href="/groups">
                  Groups
                </Link>
              </div>
            </div>
            {children}
          </section>
        </main>
      </body>
    </html>
  );
}

