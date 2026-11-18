import { Card } from "./card";

export interface MetricCardProps {
  label: string;
  value: number | string;
  detail: string;
  accent?: "indigo" | "emerald" | "amber" | "sky";
}

const accentStyles = {
  indigo: "bg-indigo-50 text-indigo-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  sky: "bg-sky-50 text-sky-700",
};

export function MetricCard({ label, value, detail, accent = "indigo" }: MetricCardProps) {
  return (
    <Card className="p-5">
      <div className={`mb-4 h-2 w-12 rounded-full ${accentStyles[accent]}`} />
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </Card>
  );
}

