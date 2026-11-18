"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard, UserRoundSearch } from "lucide-react";

const navigation = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Candidates", href: "/candidates", icon: UserRoundSearch },
  { label: "Groups & leads", href: "/groups", icon: Building2 },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1 p-4">
      {navigation.map(({ label, href, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-indigo-500 text-white"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
            href={href}
            key={href}
          >
            <Icon className="size-4.5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
