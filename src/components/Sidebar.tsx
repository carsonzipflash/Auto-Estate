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
    <aside className="w-56 shrink-0 min-h-screen bg-[#085e2d] text-white flex flex-col">
      <div className="px-6 py-5 border-b border-white/20">
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
                  ? "bg-white/20 text-white border-l-2 border-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white border-l-2 border-transparent"
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
