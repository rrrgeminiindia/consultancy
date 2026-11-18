import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge, Card, MetricCard } from "@bench/ui";

import { formatStatus, getCandidates, getDashboardSummary, getMe } from "./lib/api";

export default async function DashboardPage() {
  const [summary, candidates, user] = await Promise.all([
    getDashboardSummary(),
    getCandidates({ pageSize: 5 }),
    getMe(),
  ]);
  const { metrics } = summary;

  return (
    <div className="p-5 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Operations overview
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Dashboard</h1>
          <p className="mt-2 text-sm text-slate-500">
            {user.can_view_all_groups
              ? "Company-wide recruitment and placement activity."
              : `Activity for ${user.memberships.map((membership) => membership.group_name).join(", ")}.`}
          </p>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          href="/candidates"
        >
          View candidates
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Candidates" value={metrics.total_candidates} detail="Visible records" />
        <MetricCard accent="amber" label="On bench" value={metrics.bench_candidates} detail="Available candidates" />
        <MetricCard accent="sky" label="In marketing" value={metrics.marketing_candidates} detail="Ready or active" />
        <MetricCard accent="indigo" label="Interviews" value={metrics.upcoming_interviews} detail="Upcoming schedule" />
        <MetricCard accent="emerald" label="Placements" value={metrics.active_placements} detail="Currently active" />
      </div>

      <div className="mt-8">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div>
              <h2 className="font-bold text-slate-950">Recent candidate activity</h2>
              <p className="mt-1 text-xs text-slate-500">Scoped to the signed-in user&apos;s access</p>
            </div>
            <Link className="text-sm font-semibold text-indigo-600" href="/candidates">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Candidate</th>
                  <th className="px-5 py-3 font-semibold">Group</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Owner</th>
                  <th className="px-5 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {candidates.items.map((candidate) => (
                  <tr className="hover:bg-slate-50" key={candidate.id}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{candidate.display_name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{candidate.professional_title ?? candidate.candidate_number}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{candidate.group_name ?? "Unassigned"}</td>
                    <td className="px-5 py-4"><Badge>{formatStatus(candidate.lifecycle_state)}</Badge></td>
                    <td className="px-5 py-4 text-slate-600">{candidate.owner_name ?? "Unassigned"}</td>
                    <td className="px-5 py-4 text-right">
                      <Link aria-label={`View ${candidate.display_name}`} className="text-indigo-600" href={`/candidates/${candidate.id}`}>
                        <ArrowRight className="size-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

      </div>
    </div>
  );
}
