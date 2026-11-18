"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";

import { createGroupAction, initialGroupActionState } from "../actions";

export function CreateGroupForm() {
  const [state, formAction, pending] = useActionState(createGroupAction, initialGroupActionState);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className="text-sm font-semibold text-slate-700" htmlFor="name">Group name</label>
        <input className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" id="name" maxLength={120} name="name" placeholder="Cloud Engineering Team" required />
      </div>
      <div>
        <label className="text-sm font-semibold text-slate-700" htmlFor="code">Group code</label>
        <input className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm uppercase outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" id="code" maxLength={32} name="code" pattern="[A-Za-z][A-Za-z0-9_-]{1,31}" placeholder="CLOUD_TEAM" required />
        <p className="mt-1.5 text-xs text-slate-400">Used internally; letters, numbers, underscores, and hyphens only.</p>
      </div>
      <div>
        <label className="text-sm font-semibold text-slate-700" htmlFor="description">Description</label>
        <textarea className="mt-2 min-h-28 w-full resize-y rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" id="description" maxLength={1000} name="description" placeholder="What this recruitment group manages" />
      </div>
      {state.message && (
        <p aria-live="polite" className={`rounded-xl px-4 py-3 text-sm ${state.success ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{state.message}</p>
      )}
      <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={pending} type="submit">
        {pending && <LoaderCircle className="size-4 animate-spin" />}
        {pending ? "Creating group…" : "Create group"}
      </button>
    </form>
  );
}
