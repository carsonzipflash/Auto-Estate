"use client";

import { useState, useMemo } from "react";
import { mockLeads } from "@/data/mockLeads";
import { Lead } from "@/types/lead";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = "motivationScore" | "equityPercent" | "city" | "address" | "status" | "assignedTo";
type SortDir = "asc" | "desc";

// ─── Display maps ─────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<Lead["propertyType"], string> = {
  "single-family": "Single-Family",
  "multi-family":  "Multi-Family",
  "duplex":        "Duplex",
  "triplex":       "Triplex",
  "fourplex":      "Fourplex",
};

const STATUS_LABELS: Record<Lead["status"], string> = {
  "new":            "New",
  "contacted":      "Contacted",
  "responded":      "Responded",
  "under-contract": "Under Contract",
  "dead":           "Dead",
};

const STATUS_STYLES: Record<Lead["status"], string> = {
  "new":            "bg-blue-50 text-blue-700 border border-blue-200",
  "contacted":      "bg-amber-50 text-amber-700 border border-amber-200",
  "responded":      "bg-violet-50 text-violet-700 border border-violet-200",
  "under-contract": "bg-green-50 text-green-700 border border-green-200",
  "dead":           "bg-neutral-100 text-neutral-400 border border-neutral-200",
};

const DISTRESS_FLAGS: { key: keyof Lead; label: string; cls: string }[] = [
  { key: "preForeclosure", label: "Pre-FC",      cls: "bg-red-100 text-red-700" },
  { key: "taxDelinquent",  label: "Tax Del.",     cls: "bg-orange-100 text-orange-700" },
  { key: "probate",        label: "Probate",      cls: "bg-purple-100 text-purple-700" },
  { key: "codeViolations", label: "Code Viol.",   cls: "bg-amber-100 text-amber-700" },
  { key: "vacant",         label: "Vacant",       cls: "bg-neutral-200 text-neutral-600" },
  { key: "absenteeOwner",  label: "Absentee",     cls: "bg-sky-100 text-sky-700" },
];

const ALL_PROP_TYPES = Object.keys(TYPE_LABELS) as Lead["propertyType"][];
const ALL_CITIES     = [...new Set(mockLeads.map((l) => l.city))].sort();
const ALL_STATUSES   = ["new", "contacted", "responded", "under-contract", "dead"] as Lead["status"][];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreStyle(n: number) {
  if (n >= 8) return "bg-green-100 text-green-700";
  if (n >= 5) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

function needsFollowUp(lead: Lead): boolean {
  if (lead.status !== "contacted" || !lead.lastContactedDate) return false;
  const lastContact = new Date(lead.lastContactedDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = (today.getTime() - lastContact.getTime()) / 86_400_000;
  return diffDays > 7;
}

function fmt(n: number) {
  return n.toLocaleString();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  // Sort
  const [sortKey, setSortKey] = useState<SortKey>("motivationScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Filters
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCity,   setFilterCity]   = useState("all");
  const [filterType,   setFilterType]   = useState("all");
  const [minScore,     setMinScore]     = useState<number | "">("");

  // Expanded row
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Stats (always computed from full dataset) ──────────────────────────────

  const stats = useMemo(() => {
    const total      = mockLeads.length;
    const hot        = mockLeads.filter((l) => l.motivationScore >= 8).length;
    const avgScore   = mockLeads.reduce((s, l) => s + l.motivationScore, 0) / total;
    const newCount   = mockLeads.filter((l) => l.status === "new").length;
    const followUp   = mockLeads.filter(needsFollowUp).length;
    return { total, hot, avgScore, newCount, followUp };
  }, []);

  // ── Filtered + sorted rows ─────────────────────────────────────────────────

  const rows = useMemo(() => {
    const minS = minScore === "" ? 1 : minScore;
    return mockLeads
      .filter((l) => {
        if (filterStatus !== "all" && l.status !== filterStatus)         return false;
        if (filterCity   !== "all" && l.city   !== filterCity)           return false;
        if (filterType   !== "all" && l.propertyType !== filterType)     return false;
        if (l.motivationScore < minS)                                    return false;
        return true;
      })
      .sort((a, b) => {
        let av: string | number = a[sortKey] as string | number;
        let bv: string | number = b[sortKey] as string | number;
        if (typeof av === "string") av = av.toLowerCase();
        if (typeof bv === "string") bv = bv.toLowerCase();
        if (av < bv) return sortDir === "asc" ? -1 : 1;
        if (av > bv) return sortDir === "asc" ?  1 : -1;
        return 0;
      });
  }, [filterStatus, filterCity, filterType, minScore, sortKey, sortDir]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "motivationScore" || key === "equityPercent" ? "desc" : "asc");
    }
  }

  function clearFilters() {
    setFilterStatus("all");
    setFilterCity("all");
    setFilterType("all");
    setMinScore("");
  }

  const filtersActive =
    filterStatus !== "all" || filterCity !== "all" || filterType !== "all" || minScore !== "";

  // ── Sub-components ────────────────────────────────────────────────────────

  function ColHeader({ label, k }: { label: string; k: SortKey }) {
    const active = sortKey === k;
    return (
      <button
        onClick={() => handleSort(k)}
        className="group flex items-center gap-1 text-xs font-medium uppercase tracking-wide whitespace-nowrap select-none transition-colors text-neutral-400 hover:text-neutral-700"
      >
        <span className={active ? "text-neutral-800" : ""}>{label}</span>
        <span className={`text-[10px] transition-opacity ${active ? "opacity-100 text-neutral-600" : "opacity-0 group-hover:opacity-30"}`}>
          {active ? (sortDir === "asc" ? "↑" : "↓") : "↓"}
        </span>
      </button>
    );
  }

  function StaticHeader({ label }: { label: string }) {
    return (
      <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">
        {label}
      </span>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-full bg-neutral-50">

      {/* Page heading */}
      <div className="px-8 pt-8 pb-5 bg-white border-b border-neutral-200">
        <h1 className="text-xl font-semibold text-neutral-900">Deal Pipeline</h1>
        <p className="mt-0.5 text-sm text-neutral-500">Motivated seller leads — Bay Area</p>
      </div>

      {/* ── Stats summary bar ── */}
      <div className="px-8 py-4 bg-white border-b border-neutral-100">
        <div className="flex items-center gap-2 flex-wrap">
          <StatPill label="Total Leads"    value={stats.total} />
          <Divider />
          <StatPill label="Hot"            value={stats.hot}      accent="green" note="score ≥ 8" />
          <Divider />
          <StatPill label="Avg Score"      value={stats.avgScore.toFixed(1)} />
          <Divider />
          <StatPill label="New"            value={stats.newCount} />
          <Divider />
          <StatPill label="Need Follow-Up" value={stats.followUp} accent={stats.followUp > 0 ? "amber" : undefined} />
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="px-8 py-3 bg-white border-b border-neutral-100 flex flex-wrap items-center gap-3">
        <FilterSelect
          label="Status"
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { value: "all", label: "All statuses" },
            ...ALL_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
          ]}
        />
        <FilterSelect
          label="City"
          value={filterCity}
          onChange={setFilterCity}
          options={[
            { value: "all", label: "All cities" },
            ...ALL_CITIES.map((c) => ({ value: c, label: c })),
          ]}
        />
        <FilterSelect
          label="Type"
          value={filterType}
          onChange={setFilterType}
          options={[
            { value: "all", label: "All types" },
            ...ALL_PROP_TYPES.map((t) => ({ value: t, label: TYPE_LABELS[t] })),
          ]}
        />

        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-neutral-500 whitespace-nowrap">Min Score</label>
          <input
            type="number"
            min={1}
            max={10}
            placeholder="—"
            value={minScore}
            onChange={(e) =>
              setMinScore(e.target.value === "" ? "" : Math.max(1, Math.min(10, Number(e.target.value))))
            }
            className="w-14 text-sm border border-neutral-200 rounded-md px-2 py-1.5 text-neutral-700 bg-white placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-300 tabular-nums"
          />
        </div>

        {filtersActive && (
          <button
            onClick={clearFilters}
            className="text-xs text-neutral-400 hover:text-neutral-600 underline underline-offset-2 transition-colors ml-1"
          >
            Clear filters
          </button>
        )}

        <span className="ml-auto text-xs text-neutral-400 tabular-nums">
          {rows.length} of {mockLeads.length} leads
        </span>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-x-auto px-8 py-5">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="text-left px-3 py-2.5 bg-neutral-100/70 border-y border-l border-neutral-200 rounded-tl-lg">
                <ColHeader label="Address" k="address" />
              </th>
              <th className="text-left px-3 py-2.5 bg-neutral-100/70 border-y border-neutral-200">
                <ColHeader label="City" k="city" />
              </th>
              <th className="text-left px-3 py-2.5 bg-neutral-100/70 border-y border-neutral-200">
                <StaticHeader label="Type" />
              </th>
              <th className="text-left px-3 py-2.5 bg-neutral-100/70 border-y border-neutral-200">
                <StaticHeader label="Units" />
              </th>
              <th className="text-left px-3 py-2.5 bg-neutral-100/70 border-y border-neutral-200">
                <ColHeader label="Equity %" k="equityPercent" />
              </th>
              <th className="text-left px-3 py-2.5 bg-neutral-100/70 border-y border-neutral-200">
                <StaticHeader label="Distress" />
              </th>
              <th className="text-left px-3 py-2.5 bg-neutral-100/70 border-y border-neutral-200">
                <ColHeader label="Score" k="motivationScore" />
              </th>
              <th className="text-left px-3 py-2.5 bg-neutral-100/70 border-y border-neutral-200">
                <ColHeader label="Status" k="status" />
              </th>
              <th className="text-left px-3 py-2.5 bg-neutral-100/70 border-y border-r border-neutral-200 rounded-tr-lg">
                <ColHeader label="Assigned" k="assignedTo" />
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-12 text-center text-sm text-neutral-400 border-b border-x border-neutral-200 rounded-b-lg bg-white"
                >
                  No leads match the current filters.
                </td>
              </tr>
            )}

            {rows.map((lead, idx) => {
              const expanded   = expandedId === lead.id;
              const isLast     = idx === rows.length - 1;
              const followUp   = needsFollowUp(lead);
              const signals    = DISTRESS_FLAGS.filter((f) => lead[f.key] === true);
              const rowBorderB = expanded || !isLast ? "border-neutral-100" : "border-neutral-200";

              return (
                <>
                  <tr
                    key={lead.id}
                    onClick={() => setExpandedId(expanded ? null : lead.id)}
                    className={`cursor-pointer group transition-colors ${
                      expanded ? "bg-white" : "bg-white hover:bg-neutral-50"
                    }`}
                  >
                    <td className={`px-3 py-2.5 font-medium text-neutral-800 border-b border-l ${rowBorderB} border-neutral-200 ${isLast && !expanded ? "rounded-bl-lg" : ""}`}>
                      {lead.address}
                    </td>
                    <td className={`px-3 py-2.5 text-neutral-600 border-b ${rowBorderB}`}>
                      {lead.city}
                    </td>
                    <td className={`px-3 py-2.5 text-neutral-500 border-b ${rowBorderB}`}>
                      {TYPE_LABELS[lead.propertyType]}
                    </td>
                    <td className={`px-3 py-2.5 text-neutral-500 tabular-nums border-b ${rowBorderB}`}>
                      {lead.units}
                    </td>
                    <td className={`px-3 py-2.5 border-b ${rowBorderB}`}>
                      <span className="font-medium text-neutral-700 tabular-nums">{lead.equityPercent}%</span>
                    </td>
                    <td className={`px-3 py-2.5 border-b ${rowBorderB}`}>
                      <div className="flex flex-wrap gap-1">
                        {signals.map((s) => (
                          <span key={s.key as string} className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${s.cls}`}>
                            {s.label}
                          </span>
                        ))}
                        {signals.length === 0 && <span className="text-neutral-300 text-xs">—</span>}
                      </div>
                    </td>
                    <td className={`px-3 py-2.5 border-b ${rowBorderB}`}>
                      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded tabular-nums ${scoreStyle(lead.motivationScore)}`}>
                        {lead.motivationScore}
                      </span>
                    </td>
                    <td className={`px-3 py-2.5 border-b ${rowBorderB}`}>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[lead.status]}`}>
                          {STATUS_LABELS[lead.status]}
                        </span>
                        {followUp && (
                          <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
                            Follow up
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`px-3 py-2.5 text-neutral-500 border-b border-r ${rowBorderB} border-neutral-200 ${isLast && !expanded ? "rounded-br-lg" : ""}`}>
                      {lead.assignedTo}
                    </td>
                  </tr>

                  {expanded && (
                    <tr key={`${lead.id}-detail`}>
                      <td
                        colSpan={9}
                        className={`border-b border-r border-l border-neutral-200 border-l-amber-300 bg-amber-50/20 px-6 pt-3 pb-5 ${isLast ? "rounded-b-lg" : ""}`}
                        style={{ borderLeftWidth: "3px", borderLeftColor: followUp ? "#f59e0b" : "#e5e7eb" }}
                      >
                        {/* Follow-up callout */}
                        {followUp && (
                          <div className="mb-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md px-3 py-2.5 text-sm text-amber-800">
                            <span className="mt-px">⏰</span>
                            <span>
                              Follow up with{" "}
                              <span className="font-semibold">{lead.ownerName}</span> at{" "}
                              <span className="font-semibold">{lead.address}</span> — last contacted{" "}
                              <span className="font-semibold">{lead.lastContactedDate}</span>.
                            </span>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-x-10 gap-y-4">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 mb-1">
                              Score Reasoning
                            </p>
                            <p className="text-sm text-neutral-700 leading-relaxed">
                              {lead.scoreReasoning}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 mb-1">
                              Suggested Opener
                            </p>
                            <p className="text-sm text-neutral-600 leading-relaxed italic">
                              &ldquo;{lead.suggestedOpener}&rdquo;
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-neutral-200 flex flex-wrap gap-x-6 gap-y-1 text-xs text-neutral-500">
                          <span><span className="font-medium text-neutral-600">Owner:</span> {lead.ownerName}</span>
                          <span><span className="font-medium text-neutral-600">Est. Value:</span> ${fmt(lead.estimatedValue)}</span>
                          <span><span className="font-medium text-neutral-600">Est. Equity:</span> ${fmt(lead.estimatedEquity)}</span>
                          <span><span className="font-medium text-neutral-600">Beds/Baths:</span> {lead.beds}bd / {lead.baths}ba</span>
                          <span><span className="font-medium text-neutral-600">Sqft:</span> {fmt(lead.sqft)}</span>
                          <span><span className="font-medium text-neutral-600">Built:</span> {lead.yearBuilt}</span>
                          <span><span className="font-medium text-neutral-600">Last Sale:</span> ${fmt(lead.lastSalePrice)} ({lead.lastSaleDate})</span>
                          {lead.lastContactedDate && (
                            <span><span className="font-medium text-neutral-600">Last Contact:</span> {lead.lastContactedDate}</span>
                          )}
                        </div>

                        {lead.notes && (
                          <div className="mt-3 pt-3 border-t border-neutral-200">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 mb-1">Notes</p>
                            <p className="text-sm text-neutral-600">{lead.notes}</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Shared UI atoms ──────────────────────────────────────────────────────────

function StatPill({
  label,
  value,
  accent,
  note,
}: {
  label: string;
  value: string | number;
  accent?: "green" | "amber";
  note?: string;
}) {
  const valueClass =
    accent === "green" ? "text-green-700" :
    accent === "amber" ? "text-amber-600" :
    "text-neutral-900";

  return (
    <div className="flex items-baseline gap-1.5">
      <span className={`text-lg font-semibold tabular-nums leading-none ${valueClass}`}>{value}</span>
      <span className="text-xs text-neutral-500">{label}</span>
      {note && <span className="text-[10px] text-neutral-400">({note})</span>}
    </div>
  );
}

function Divider() {
  return <span className="text-neutral-200 select-none">·</span>;
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-1.5">
      <label className="text-xs font-medium text-neutral-500 whitespace-nowrap">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm border border-neutral-200 rounded-md px-2.5 py-1.5 text-neutral-700 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-300"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
