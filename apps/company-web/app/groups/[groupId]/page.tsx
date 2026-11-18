import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Crown, Mail, ShieldCheck, UsersRound } from "lucide-react";

import { Badge, Card } from "@bench/ui";

import {
  ApiError,
  formatStatus,
  getCandidates,
  getEligibleGroupUsers,
  getGroup,
  getMe,
  type EligibleGroupUserList,
} from "../../lib/api";
import { MemberManager } from "./member-manager";

export default async function GroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ user_search?: string }>;
}) {
  const { groupId } = await params;
  const filters = await searchParams;
  const user = await getMe();
  let group;
  let candidates;
  let eligibleUsers: EligibleGroupUserList = { items: [], total: 0, page: 1, page_size: 50 };
  try {
    [group, candidates, eligibleUsers] = await Promise.all([
      getGroup(groupId),
      getCandidates({ groupId, pageSize: 100 }),
      user.can_manage_company
        ? getEligibleGroupUsers(groupId, filters.user_search)
        : Promise.resolve(eligibleUsers),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <div className="p-5 sm:p-8">
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600" href="/groups"><ArrowLeft className="size-4" /> Back to groups</Link>
      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2"><h1 className="text-3xl font-bold tracking-tight text-slate-950">{group.name}</h1><Badge>{group.status}</Badge>{group.current_user_role && <Badge>{formatStatus(group.current_user_role)}</Badge>}</div>
          <p className="mt-2 text-sm text-slate-500">{group.description ?? group.code}</p>
        </div>
        <p className="text-sm font-semibold text-slate-600">{candidates.total} active candidate{candidates.total === 1 ? "" : "s"}</p>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.8fr_1.3fr]">
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center gap-2"><Crown className="size-4 text-amber-500" /><h2 className="font-bold text-slate-950">Group leads</h2></div>
            <div className="mt-5 space-y-3">
              {group.leads.map((lead) => (
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4" key={lead.user_id}>
                  <p className="font-semibold text-slate-900">{lead.display_name}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><Mail className="size-3.5" />{lead.email}</p>
                </div>
              ))}
              {group.leads.length === 0 && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">This group needs a lead assignment.</p>}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-100 p-5"><ShieldCheck className="size-4 text-indigo-600" /><h2 className="font-bold text-slate-950">Active members</h2></div>
            <div className="divide-y divide-slate-100">
              {group.members.map((member) => (
                <div className="flex items-center justify-between gap-3 p-4" key={member.user_id}>
                  <div><p className="text-sm font-semibold text-slate-900">{member.display_name}</p><p className="text-xs text-slate-400">{member.email}</p></div>
                  <Badge>{formatStatus(member.membership_role)}</Badge>
                </div>
              ))}
            </div>
          </Card>

          {user.can_manage_company && (
            <Card className="p-5"><MemberManager groupId={groupId} search={filters.user_search ?? ""} total={eligibleUsers.total} users={eligibleUsers.items} /></Card>
          )}
        </div>

        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-100 p-5"><UsersRound className="size-4 text-indigo-600" /><h2 className="font-bold text-slate-950">Current candidates</h2></div>
          <div className="divide-y divide-slate-100">
            {candidates.items.map((candidate) => (
              <Link className="flex items-center justify-between gap-4 p-5 hover:bg-slate-50" href={`/candidates/${candidate.id}`} key={candidate.id}>
                <div className="min-w-0"><p className="truncate font-semibold text-slate-900">{candidate.display_name}</p><p className="mt-1 truncate text-xs text-slate-500">{candidate.professional_title ?? candidate.candidate_number} · Owner: {candidate.owner_name ?? "Unassigned"}</p></div>
                <div className="flex shrink-0 items-center gap-3"><Badge>{formatStatus(candidate.lifecycle_state)}</Badge><ArrowRight className="size-4 text-indigo-600" /></div>
              </Link>
            ))}
            {candidates.items.length === 0 && <p className="p-10 text-center text-sm text-slate-500">No active candidates are assigned to this group.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
