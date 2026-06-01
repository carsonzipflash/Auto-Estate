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
  if (n >= 8) return "bg-[#dfe9e5] text-[#085e2d] border border-[#b3d1c4]";
  if (n >= 5) return "bg-amber-100 text-amber-700 border border-amber-200";
  return "bg-red-100 text-red-700 border border-red-200";
}

const STATUS_DARK: Record<Lead["status"], string> = {
  "new":            "bg-sky-100 text-sky-700",
  "contacted":      "bg-amber-100 text-amber-700",
  "responded":      "bg-violet-100 text-violet-700",
  "under-contract": "bg-[#dfe9e5] text-[#085e2d]",
  "dead":           "bg-neutral-100 text-neutral-400",
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
  const color = accent ? "text-[#085e2d]" : warn ? "text-amber-600" : "text-[#1a1a1a]";
  return (
    <div className="rounded-xl border border-[#e5e5e5] bg-white px-6 py-5">
      <p className="text-xs text-[#666666] uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-4xl font-bold font-mono ${color}`}>{value}</p>
      {sub && <p className="text-xs text-[#999999] mt-1">{sub}</p>}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <main className="flex-1 min-h-screen bg-[#f4f5f7] text-[#1a1a1a] p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm text-[#666666]">{today}</p>
          </div>
          <Link
            href="/pipeline"
            className="px-4 py-2 rounded-md bg-[#085e2d] hover:bg-[#064d24] text-white text-sm font-medium transition"
          >
            View Pipeline →
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 [&>*]:bg-white [&>*]:border-[#e5e5e5]">
          <BigStat label="Total Leads" value={total} sub="across all statuses" />
          <BigStat label="Hot Leads" value={hot} sub="motivation score ≥ 8" accent />
          <BigStat label="Under Contract" value={underContract} sub="active PSAs" accent />
          <BigStat label="Need Follow-up" value={followUp} sub=">7 days since contact" warn />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-5 gap-6">

          {/* Left — Top Priority Leads */}
          <div className="col-span-3 rounded-xl border border-[#e5e5e5] bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5e5e5] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#666666] uppercase tracking-wider">
                Top Priority Leads
              </h2>
              <Link href="/pipeline" className="text-xs text-[#085e2d] hover:text-[#064d24] transition">
                View all →
              </Link>
            </div>
            <div className="divide-y divide-[#e5e5e5]">
              {topLeads.map((lead) => (
                <div key={lead.id} className="px-6 py-3.5 flex items-center gap-4">
                  <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono ${scoreBadge(lead.motivationScore)}`}>
                    {lead.motivationScore}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#1a1a1a] font-medium truncate">{lead.address}</p>
                    <p className="text-xs text-[#666666]">{lead.city} · {TYPE_LABELS[lead.propertyType]}</p>
                  </div>
                  <p className="text-xs text-[#666666] hidden sm:block w-32 truncate">{lead.ownerName}</p>
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
            <div className="rounded-xl border border-[#e5e5e5] bg-white p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#666666] uppercase tracking-wider">Pipeline</h2>
                <span className="text-xs text-[#999999] font-mono">avg score {avgScore}</span>
              </div>
              <div className="space-y-3">
                {statusCounts.map(({ label, color, count }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 w-32">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
                      <span className="text-xs text-[#666666]">{label}</span>
                    </div>
                    <div className="flex-1 h-1.5 bg-[#e5e5e5] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${(count / total) * 100}%` }} />
                    </div>
                    <span className="text-xs text-[#1a1a1a] font-mono w-4 text-right shrink-0">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Module Quick Links */}
            <div className="rounded-xl border border-[#e5e5e5] bg-white p-5 space-y-3">
              <h2 className="text-sm font-semibold text-[#666666] uppercase tracking-wider">Modules</h2>
              <div className="space-y-2">
                {modules.map(({ href, label, desc }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center justify-between rounded-lg border border-[#e5e5e5] hover:border-[#085e2d] bg-[#f4f5f7] px-4 py-3 group transition"
                  >
                    <div>
                      <p className="text-sm text-[#1a1a1a] font-medium group-hover:text-[#085e2d] transition">{label}</p>
                      <p className="text-xs text-[#666666]">{desc}</p>
                    </div>
                    <span className="text-[#999999] group-hover:text-[#085e2d] transition">→</span>
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
