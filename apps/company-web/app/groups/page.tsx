import Link from "next/link";
import { ArrowRight, Crown, Plus, UsersRound } from "lucide-react";

import { Badge, Card } from "@bench/ui";

import { formatStatus, getGroups, getMe } from "../lib/api";

export default async function GroupsPage() {
  const [groups, user] = await Promise.all([getGroups(), getMe()]);

  return (
    <div className="p-5 sm:p-8">
      {user.can_manage_company && (
        <div className="flex justify-end">
          <Link className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700" href="/groups/new"><Plus className="size-4" /> Create group</Link>
        </div>
      )}

      <div className={`${user.can_manage_company ? "mt-6" : ""} grid gap-5 lg:grid-cols-2 2xl:grid-cols-3`}>
        {groups.map((group) => (
          <Card className="group overflow-hidden" key={group.id}>
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="grid size-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><UsersRound className="size-5" /></div>
                <div className="flex gap-2">
                  {group.current_user_role && <Badge>{formatStatus(group.current_user_role)}</Badge>}
                  <Badge>{group.status}</Badge>
                </div>
              </div>
              <h2 className="mt-5 text-xl font-bold text-slate-950">{group.name}</h2>
              <p className="mt-1 min-h-10 text-sm leading-5 text-slate-500">{group.description ?? "No description"}</p>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Group lead{group.leads.length === 1 ? "" : "s"}</p>
                  <div className="mt-2 space-y-1">
                    {group.leads.map((lead) => <p className="flex items-center gap-2 text-sm font-semibold text-slate-800" key={lead.user_id}><Crown className="size-4 text-amber-500" />{lead.display_name}</p>)}
                    {group.leads.length === 0 && <p className="text-sm text-amber-700">Lead not assigned</p>}
                  </div>
                </div>
                <div className="text-right"><p className="text-2xl font-bold text-slate-950">{group.candidate_count}</p><p className="text-xs text-slate-400">candidates</p></div>
              </div>
              <Link className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-indigo-600 transition group-hover:bg-indigo-50" href={`/groups/${group.id}`}>
                View members and candidates <ArrowRight className="size-4" />
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
