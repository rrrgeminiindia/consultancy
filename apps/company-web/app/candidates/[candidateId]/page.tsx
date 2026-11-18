import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  FileClock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Badge, Card } from "@bench/ui";

import {
  ApiError,
  formatDate,
  formatStatus,
  getCandidate,
  getCandidateHistory,
  type TimelineEvent,
} from "../../lib/api";

const categoryStyle: Record<string, string> = {
  PROFILE: "bg-slate-100 text-slate-600",
  LIFECYCLE: "bg-indigo-100 text-indigo-700",
  GROUP: "bg-violet-100 text-violet-700",
  OWNERSHIP: "bg-sky-100 text-sky-700",
  NOTE: "bg-amber-100 text-amber-700",
  SUBMISSION: "bg-blue-100 text-blue-700",
  INTERVIEW: "bg-fuchsia-100 text-fuchsia-700",
  OFFER: "bg-orange-100 text-orange-700",
  PLACEMENT: "bg-emerald-100 text-emerald-700",
  ACTIVITY: "bg-cyan-100 text-cyan-700",
  DOCUMENT: "bg-stone-100 text-stone-700",
  MARKETING: "bg-teal-100 text-teal-700",
  TASK: "bg-rose-100 text-rose-700",
};

function TimelineItem({ event, last }: { event: TimelineEvent; last: boolean }) {
  return (
    <div className="relative grid grid-cols-[36px_1fr] gap-3">
      {!last && <div className="absolute bottom-0 left-[17px] top-9 w-px bg-slate-200" />}
      <div className={`relative z-10 grid size-9 place-items-center rounded-full ${categoryStyle[event.category] ?? "bg-slate-100 text-slate-600"}`}>
        <FileClock className="size-4" />
      </div>
      <div className="pb-7">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-semibold text-slate-900">{event.summary}</p>
            <p className="mt-1 text-xs text-slate-500">
              {formatStatus(event.category)}
              {event.actor_name ? ` · ${event.actor_name}` : ""}
              {event.group_name ? ` · ${event.group_name}` : ""}
            </p>
          </div>
          <time className="shrink-0 text-xs text-slate-400">{formatDate(event.occurred_at, true)}</time>
        </div>
        {typeof event.metadata.reason === "string" && event.metadata.reason && (
          <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">{event.metadata.reason}</p>
        )}
      </div>
    </div>
  );
}

export default async function CandidatePage({ params }: { params: Promise<{ candidateId: string }> }) {
  const { candidateId } = await params;
  let candidate;
  let history;
  try {
    [candidate, history] = await Promise.all([
      getCandidate(candidateId),
      getCandidateHistory(candidateId),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <div className="p-5 sm:p-8">
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600" href="/candidates">
        <ArrowLeft className="size-4" /> Back to candidates
      </Link>

      <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-indigo-100 text-lg font-bold text-indigo-700">
            {candidate.first_name[0]}{candidate.last_name[0]}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">{candidate.display_name}</h1>
              <Badge>{formatStatus(candidate.lifecycle_state)}</Badge>
            </div>
            <p className="mt-1 text-slate-500">{candidate.professional_title ?? "Professional title not set"} · {candidate.candidate_number}</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5"><Building2 className="size-4" />{candidate.group_name ?? "Unassigned"}</span>
              <span className="inline-flex items-center gap-1.5"><UserRound className="size-4" />{candidate.owner_name ?? "No owner"}</span>
              <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{candidate.current_location ?? "Location not set"}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{candidate.can_edit ? "Editable" : "Read only"}</Badge>
          {candidate.current_user_group_role && <Badge>{formatStatus(candidate.current_user_group_role)}</Badge>}
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.4fr]">
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="font-bold text-slate-950">Candidate profile</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <div><p className="text-xs uppercase tracking-wide text-slate-400">Email</p><p className="mt-1 flex items-center gap-2 text-sm text-slate-700"><Mail className="size-4" />{candidate.email ?? "—"}</p></div>
              <div><p className="text-xs uppercase tracking-wide text-slate-400">Phone</p><p className="mt-1 flex items-center gap-2 text-sm text-slate-700"><Phone className="size-4" />{candidate.phone ?? "—"}</p></div>
              <div><p className="text-xs uppercase tracking-wide text-slate-400">Primary stream</p><p className="mt-1 text-sm text-slate-700">{candidate.stream_name ?? "—"}</p></div>
              <div><p className="text-xs uppercase tracking-wide text-slate-400">Experience</p><p className="mt-1 text-sm text-slate-700">{candidate.total_experience_months ? `${Math.floor(candidate.total_experience_months / 12)} years` : "—"}</p></div>
              <div><p className="text-xs uppercase tracking-wide text-slate-400">Work authorization</p><p className="mt-1 flex items-center gap-2 text-sm text-slate-700"><ShieldCheck className="size-4" />{candidate.work_authorization ?? "—"}</p></div>
              <div><p className="text-xs uppercase tracking-wide text-slate-400">Available</p><p className="mt-1 flex items-center gap-2 text-sm text-slate-700"><CalendarClock className="size-4" />{formatDate(candidate.availability_date)}</p></div>
            </div>
            {candidate.summary && <p className="mt-5 border-t border-slate-100 pt-5 text-sm leading-6 text-slate-600">{candidate.summary}</p>}
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-600" /><h2 className="font-bold text-slate-950">Access & ownership</h2></div>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Current group</dt><dd className="font-semibold text-slate-800">{candidate.group_name ?? "Unassigned"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Group role</dt><dd className="font-semibold text-slate-800">{candidate.current_user_group_role ? formatStatus(candidate.current_user_group_role) : "Company-wide role"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Current owner</dt><dd className="font-semibold text-slate-800">{candidate.owner_name ?? "Unassigned"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Profile completion</dt><dd className="font-semibold text-slate-800">{candidate.profile_completeness}%</dd></div>
            </dl>
          </Card>

          {candidate.can_view_rates && (
            <Card className="p-5">
              <div className="flex items-center gap-2"><CircleDollarSign className="size-4 text-emerald-600" /><h2 className="font-bold text-slate-950">Rates</h2></div>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">Current pay</dt><dd>{candidate.current_pay_rate ? `${candidate.currency} ${candidate.current_pay_rate}` : "—"}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Target pay</dt><dd>{candidate.target_pay_rate ? `${candidate.currency} ${candidate.target_pay_rate}` : "—"}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Target bill</dt><dd>{candidate.target_bill_rate ? `${candidate.currency} ${candidate.target_bill_rate}` : "—"}</dd></div>
              </dl>
            </Card>
          )}
        </div>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2"><BriefcaseBusiness className="size-4 text-indigo-600" /><h2 className="font-bold text-slate-950">Complete candidate history</h2></div>
              <p className="mt-1 text-xs text-slate-500">Lifecycle, groups, owners, notes, documents, tasks, marketing, submissions, interviews, offers, and placements</p>
            </div>
            <Badge>{history.items.length} events</Badge>
          </div>
          <div className="mt-6">
            {history.items.map((event, index) => <TimelineItem event={event} key={`${event.category}-${event.id}`} last={index === history.items.length - 1} />)}
            {history.items.length === 0 && <p className="py-12 text-center text-sm text-slate-500">No history has been recorded.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
