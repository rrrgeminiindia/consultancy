import Link from "next/link";
import { ArrowRight, Search, UsersRound } from "lucide-react";

import { Badge, Card } from "@bench/ui";

import { formatDate, formatStatus, getCandidates, getGroups } from "../lib/api";

const lifecycleStates = [
  "INTAKE",
  "SCREENING",
  "BENCH",
  "MARKETING_READY",
  "MARKETING_ACTIVE",
  "INTERVIEWING",
  "OFFERED",
  "PLACED",
  "ON_HOLD",
  "WITHDRAWN",
];

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; group?: string; state?: string; page?: string }>;
}) {
  const filters = await searchParams;
  const page = Math.max(1, Number(filters.page) || 1);
  const [result, groups] = await Promise.all([
    getCandidates({
      search: filters.search,
      groupId: filters.group,
      lifecycleState: filters.state,
      page,
      pageSize: 25,
    }),
    getGroups(),
  ]);

  return (
    <div className="p-5 sm:p-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">Talent operations</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Candidates</h1>
        <p className="mt-2 text-sm text-slate-500">Only candidates authorized for your company role and active groups are returned.</p>
      </div>

      <Card className="mt-8 p-4">
        <form className="grid gap-3 lg:grid-cols-[1fr_220px_220px_auto]" method="get">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3">
            <Search className="size-4 text-slate-400" />
            <input
              className="h-11 min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
              defaultValue={filters.search}
              name="search"
              placeholder="Name, email, title, or ID"
            />
          </label>
          <select className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm" defaultValue={filters.group ?? ""} name="group">
            <option value="">All visible groups</option>
            {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
          </select>
          <select className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm" defaultValue={filters.state ?? ""} name="state">
            <option value="">All lifecycle states</option>
            {lifecycleStates.map((state) => <option key={state} value={state}>{formatStatus(state)}</option>)}
          </select>
          <button className="h-11 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700" type="submit">Apply filters</button>
        </form>
      </Card>

      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><UsersRound className="size-5" /></div>
            <div>
              <h2 className="font-bold text-slate-950">Candidate directory</h2>
              <p className="text-xs text-slate-500">{result.total} visible candidate{result.total === 1 ? "" : "s"}</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Candidate</th>
                <th className="px-5 py-3 font-semibold">Group / stream</th>
                <th className="px-5 py-3 font-semibold">Lifecycle</th>
                <th className="px-5 py-3 font-semibold">Owner</th>
                <th className="px-5 py-3 font-semibold">Last activity</th>
                <th className="px-5 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.items.map((candidate) => (
                <tr className="hover:bg-slate-50" key={candidate.id}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">{candidate.display_name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{candidate.candidate_number} · {candidate.professional_title ?? "Title not set"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-slate-700">{candidate.group_name ?? "Unassigned"}</p>
                    <p className="text-xs text-slate-400">{candidate.stream_name ?? "No stream"}</p>
                  </td>
                  <td className="px-5 py-4"><Badge>{formatStatus(candidate.lifecycle_state)}</Badge></td>
                  <td className="px-5 py-4 text-slate-600">{candidate.owner_name ?? "Unassigned"}</td>
                  <td className="px-5 py-4 text-slate-500">{formatDate(candidate.last_activity_at, true)}</td>
                  <td className="px-5 py-4 text-right">
                    <Link aria-label={`View ${candidate.display_name}`} className="inline-grid size-9 place-items-center rounded-lg text-indigo-600 hover:bg-indigo-50" href={`/candidates/${candidate.id}`}>
                      <ArrowRight className="size-4" />
                    </Link>
                  </td>
                </tr>
              ))}
              {result.items.length === 0 && (
                <tr><td className="px-5 py-12 text-center text-slate-500" colSpan={6}>No candidates match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
