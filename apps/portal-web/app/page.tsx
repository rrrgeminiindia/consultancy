import { ArrowRight, Building2, CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Button, Card } from "@bench/ui";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#e0e7ff,_transparent_42%),linear-gradient(135deg,#f8fafc_0%,#eef2ff_100%)] px-6 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-2xl shadow-indigo-200/40 backdrop-blur lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-indigo-500">
                <Building2 className="size-6" />
              </div>
              <span className="text-xl font-bold tracking-tight">BenchOS</span>
            </div>
            <h1 className="mt-20 max-w-lg text-5xl font-semibold leading-tight tracking-tight">
              One secure doorway to every consultancy operation.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
              Manage bench, marketing, submissions, interviews, and placements while every company
              remains independently deployable.
            </p>
          </div>
          <div className="grid gap-4 text-sm text-slate-300">
            {[
              "Company-isolated data and infrastructure",
              "Group-scoped candidate authorization",
              "Complete operational and audit history",
            ].map((item) => (
              <div className="flex items-center gap-3" key={item}>
                <CheckCircle2 className="size-5 text-emerald-400" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center p-8 sm:p-12">
          <div className="w-full max-w-md">
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white">
                <Building2 className="size-5" />
              </div>
              <span className="text-xl font-bold">BenchOS</span>
            </div>

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
              Secure portal
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Welcome back</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Sign in using the email address invited by your administrator.
            </p>

            <Card className="mt-8 border-slate-200/80 p-5 shadow-none">
              <Button className="w-full gap-2" type="button">
                <ShieldCheck className="size-4" />
                Continue with Google
              </Button>
              <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
                <div className="h-px flex-1 bg-slate-200" />
                OR
                <div className="h-px flex-1 bg-slate-200" />
              </div>
              <label className="text-sm font-medium text-slate-700" htmlFor="email">
                Work email
              </label>
              <input
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                id="email"
                placeholder="you@company.com"
                type="email"
              />
              <Button className="mt-4 w-full gap-2" type="button" variant="secondary">
                Continue with email
                <ArrowRight className="size-4" />
              </Button>
            </Card>

            <Link
              className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              href="/companies"
            >
              Preview company selector
              <ArrowRight className="size-4" />
            </Link>

            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
              <LockKeyhole className="size-3.5" />
              Authentication will be handled by the configured OIDC provider.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

