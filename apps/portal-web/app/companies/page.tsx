import { ArrowRight, Building2, CircleAlert, LogOut, Users } from "lucide-react";

import { Badge, Card } from "@bench/ui";

interface CompanyInstance {
  id: string;
  instance_code: string;
  display_name: string;
  base_url: string;
  status: string;
  deployment_version: string;
}

async function getCompanyInstances(): Promise<CompanyInstance[]> {
  const apiUrl = process.env.PORTAL_API_URL ?? "http://127.0.0.1:8000";

  try {
    const response = await fetch(`${apiUrl}/api/v1/instances`, { cache: "no-store" });
    if (!response.ok) return [];
    return response.json() as Promise<CompanyInstance[]>;
  } catch {
    return [];
  }
}

export default async function CompaniesPage() {
  const companies = await getCompanyInstances();

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white">
              <Building2 className="size-5" />
            </div>
            <div>
              <p className="font-bold text-slate-950">BenchOS</p>
              <p className="text-xs text-slate-500">Company access portal</p>
            </div>
          </div>
          <button className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
          Your companies
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
          Choose a workspace
        </h1>
        <p className="mt-3 max-w-2xl text-slate-500">
          Your access is determined by company assignment. Each workspace maintains separate users,
          recruitment data, documents, and audit history.
        </p>

        {companies.length === 0 ? (
          <Card className="mt-10 flex items-start gap-4 border-amber-200 bg-amber-50 p-6">
            <CircleAlert className="mt-0.5 size-5 text-amber-700" />
            <div>
              <p className="font-semibold text-amber-950">Portal API is not available</p>
              <p className="mt-1 text-sm text-amber-800">
                Start the portal backend on port 8000 to load FlyHigh and Dattai from PostgreSQL.
              </p>
            </div>
          </Card>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {companies.map((company, index) => (
              <a href={company.base_url} key={company.id}>
                <Card className="group h-full overflow-hidden p-0 transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/70">
                  <div
                    className={`h-2 ${index % 2 === 0 ? "bg-indigo-500" : "bg-emerald-500"}`}
                  />
                  <div className="p-7">
                    <div className="flex items-start justify-between">
                      <div className="grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                        <Building2 className="size-7" />
                      </div>
                      <Badge>{company.status}</Badge>
                    </div>
                    <h2 className="mt-8 text-2xl font-bold text-slate-950">{company.display_name}</h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Independent recruitment and bench-management console
                    </p>
                    <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Users className="size-4" />
                        Version {company.deployment_version}
                      </div>
                      <span className="flex items-center gap-2 text-sm font-semibold text-indigo-600">
                        Open workspace
                        <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </Card>
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

