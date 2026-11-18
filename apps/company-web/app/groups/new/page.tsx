import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck, UsersRound } from "lucide-react";

import { Card } from "@bench/ui";

import { getMe } from "../../lib/api";
import { CreateGroupForm } from "./create-group-form";

export default async function NewGroupPage() {
  const user = await getMe();
  if (!user.can_manage_company) notFound();

  return (
    <div className="p-5 sm:p-8">
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600" href="/groups"><ArrowLeft className="size-4" /> Back to groups</Link>
      <div className="mx-auto mt-6 max-w-2xl">
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 p-6">
            <div className="grid size-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><UsersRound className="size-5" /></div>
            <h1 className="mt-4 text-2xl font-bold text-slate-950">Create recruitment group</h1>
            <p className="mt-2 text-sm text-slate-500">Create the group first, then add standard users and assign their group roles.</p>
          </div>
          <div className="p-6"><CreateGroupForm /></div>
          <div className="flex items-start gap-3 border-t border-slate-100 bg-slate-50 p-5 text-xs leading-5 text-slate-500"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-indigo-600" /> Only Admin and Operations users can create groups or manage memberships.</div>
        </Card>
      </div>
    </div>
  );
}
