"use client";

import { useActionState } from "react";
import { LoaderCircle, Search, UserPlus } from "lucide-react";

import type { EligibleGroupUser } from "../../lib/api";
import { addGroupMemberAction, initialGroupActionState } from "../actions";

export function MemberManager({
  groupId,
  users,
  total,
  search,
}: {
  groupId: string;
  users: EligibleGroupUser[];
  total: number;
  search: string;
}) {
  const action = addGroupMemberAction.bind(null, groupId);
  const [state, formAction, pending] = useActionState(action, initialGroupActionState);

  return (
    <div>
      <div className="flex items-center gap-2"><UserPlus className="size-4 text-indigo-600" /><h2 className="font-bold text-slate-950">Add group member</h2></div>
      <p className="mt-1 text-xs text-slate-500">Eligible active standard users; Admin, Operations, and Auditor accounts are excluded.</p>
      <form className="mt-4 flex gap-2" method="get">
        <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3">
          <Search className="size-4 shrink-0 text-slate-400" />
          <input className="min-w-0 flex-1 bg-transparent text-sm outline-none" defaultValue={search} name="user_search" placeholder="Search eligible users" />
        </label>
        <button className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50" type="submit">Search</button>
      </form>
      {users.length > 0 ? (
        <form action={formAction} className="mt-5 space-y-3">
          <select className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" defaultValue="" name="user_id" required>
            <option disabled value="">Select a user</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>{user.display_name} · {user.email}</option>
            ))}
          </select>
          <select className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" defaultValue="RECRUITER" name="membership_role">
            <option value="LEAD">Lead</option>
            <option value="RECRUITER">Recruiter</option>
            <option value="MARKETING">Marketing</option>
            <option value="VIEWER">Viewer</option>
          </select>
          <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60" disabled={pending} type="submit">
            {pending && <LoaderCircle className="size-4 animate-spin" />}{pending ? "Adding user…" : "Add user"}
          </button>
          {state.message && <p aria-live="polite" className={`rounded-xl px-3 py-2 text-xs ${state.success ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{state.message}</p>}
        </form>
      ) : (
        <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">{search ? "No eligible users match this search." : "No additional standard users are available for this group."}</p>
      )}

      {users.length > 0 && (
        <div className="mt-6 border-t border-slate-100 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Eligible users ({total})</p>
          <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
            {users.map((user) => (
              <div className="rounded-xl border border-slate-100 p-3" key={user.id}>
                <p className="text-sm font-semibold text-slate-800">{user.display_name}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
                <p className="mt-1 text-xs text-slate-500">{user.memberships.length ? user.memberships.map((membership) => `${membership.group_name} · ${membership.role.toLowerCase()}`).join(", ") : "Not assigned to another group"}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
