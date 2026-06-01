"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/pipeline", label: "Deal Pipeline" },
  { href: "/underwriting", label: "Comp & Underwriting" },
  { href: "/map", label: "Map View" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 min-h-screen bg-neutral-900 text-neutral-100 flex flex-col">
      <div className="px-6 py-5 border-b border-neutral-700">
        <span className="text-lg font-semibold tracking-tight">Prophet Homes</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                active
                  ? "bg-emerald-900/50 text-emerald-300 border-l-2 border-emerald-500"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-white border-l-2 border-transparent"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
