import Link from "next/link";
import { mockLeads } from "@/data/mockLeads";
import { needsFollowUp, TYPE_LABELS } from "@/lib/leadHelpers";
import { Lead } from "@/types/lead";

// ─── Data ──────────────────────────────────────────────────────────────────────

const total = mockLeads.length;
const hot = mockLeads.filter((l) => l.motivationScore >= 8).length;
const underContract = mockLeads.filter((l) => l.status === "under-contract").length;
const followUp = mockLeads.filter(needsFollowUp).length;
const avgScore = (mockLeads.reduce((s, l) => s + l.motivationScore, 0) / total).toFixed(1);

const topLeads = [...mockLeads]
  .sort((a, b) => b.motivationScore - a.motivationScore)
  .slice(0, 6);

const pipelineStages: { status: Lead["status"]; label: string; color: string }[] = [
  { status: "new",            label: "New",            color: "bg-sky-500" },
  { status: "contacted",      label: "Contacted",      color: "bg-amber-500" },
  { status: "responded",      label: "Responded",      color: "bg-violet-500" },
  { status: "under-contract", label: "Under Contract", color: "bg-emerald-500" },
];

const statusCounts = pipelineStages.map(({ status, label, color }) => ({
  label,
  color,
  count: mockLeads.filter((l) => l.status === status).length,
}));

const modules = [
  { href: "/pipeline",     label: "Deal Pipeline",  desc: "Browse and filter all leads" },
  { href: "/underwriting", label: "Underwriting",   desc: "SFR & multifamily deal calc" },
  { href: "/map",          label: "Map View",       desc: "Geographic lead visualization" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function scoreBadge(n: number) {
  if (n >= 8) return "bg-emerald-900 text-emerald-300 border border-emerald-700";
  if (n >= 5) return "bg-amber-900 text-amber-300 border border-amber-700";
  return "bg-red-900 text-red-300 border border-red-800";
}

const STATUS_DARK: Record<Lead["status"], string> = {
  "new":            "bg-sky-900/60 text-sky-300",
  "contacted":      "bg-amber-900/60 text-amber-300",
  "responded":      "bg-violet-900/60 text-violet-300",
  "under-contract": "bg-emerald-900/60 text-emerald-300",
  "dead":           "bg-slate-800 text-slate-500",
};

const STATUS_LABEL: Record<Lead["status"], string> = {
  "new":            "New",
  "contacted":      "Contacted",
  "responded":      "Responded",
  "under-contract": "Contract",
  "dead":           "Dead",
};

// ─── Components ───────────────────────────────────────────────────────────────

function BigStat({
  label, value, sub, accent, warn,
}: {
  label: string; value: string | number; sub?: string; accent?: boolean; warn?: boolean;
}) {
  const color = accent ? "text-emerald-400" : warn ? "text-amber-400" : "text-slate-100";
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-5">
      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-4xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <main className="flex-1 min-h-screen bg-[#0F0F0F] text-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">{today}</p>
          </div>
          <Link
            href="/pipeline"
            className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition"
          >
            View Pipeline →
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <BigStat label="Total Leads" value={total} sub="across all statuses" />
          <BigStat label="Hot Leads" value={hot} sub="motivation score ≥ 8" accent />
          <BigStat label="Under Contract" value={underContract} sub="active PSAs" accent />
          <BigStat label="Need Follow-up" value={followUp} sub=">7 days since contact" warn />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-5 gap-6">

          {/* Left — Top Priority Leads */}
          <div className="col-span-3 rounded-xl border border-slate-700 bg-slate-900 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Top Priority Leads
              </h2>
              <Link href="/pipeline" className="text-xs text-emerald-500 hover:text-emerald-400 transition">
                View all →
              </Link>
            </div>
            <div className="divide-y divide-slate-800">
              {topLeads.map((lead) => (
                <div key={lead.id} className="px-6 py-3.5 flex items-center gap-4">
                  <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${scoreBadge(lead.motivationScore)}`}>
                    {lead.motivationScore}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-100 font-medium truncate">{lead.address}</p>
                    <p className="text-xs text-slate-400">{lead.city} · {TYPE_LABELS[lead.propertyType]}</p>
                  </div>
                  <p className="text-xs text-slate-400 hidden sm:block w-32 truncate">{lead.ownerName}</p>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-md font-medium ${STATUS_DARK[lead.status]}`}>
                    {STATUS_LABEL[lead.status]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Pipeline + Modules */}
          <div className="col-span-2 flex flex-col gap-6">

            {/* Pipeline Status */}
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Pipeline</h2>
                <span className="text-xs text-slate-500">avg score {avgScore}</span>
              </div>
              <div className="space-y-3">
                {statusCounts.map(({ label, color, count }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 w-32">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
                      <span className="text-xs text-slate-400">{label}</span>
                    </div>
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${(count / total) * 100}%` }} />
                    </div>
                    <span className="text-xs text-slate-300 w-4 text-right shrink-0">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Module Quick Links */}
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-5 space-y-3">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Modules</h2>
              <div className="space-y-2">
                {modules.map(({ href, label, desc }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center justify-between rounded-lg border border-slate-700 hover:border-emerald-700 bg-slate-800 px-4 py-3 group transition"
                  >
                    <div>
                      <p className="text-sm text-slate-100 font-medium group-hover:text-emerald-400 transition">{label}</p>
                      <p className="text-xs text-slate-400">{desc}</p>
                    </div>
                    <span className="text-slate-600 group-hover:text-emerald-500 transition">→</span>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
