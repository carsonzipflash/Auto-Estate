"use client";

import { useState, useMemo } from "react";
import { mockLeads } from "@/data/mockLeads";
import { Lead } from "@/types/lead";

type SortKey = "motivationScore" | "equityPercent" | "city" | "address" | "status" | "assignedTo";
type SortDir = "asc" | "desc";

const DISTRESS_FLAGS: { key: keyof Lead; label: string; cls: string }[] = [
  { key: "preForeclosure", label: "Pre-FC",      cls: "bg-red-100 text-red-700" },
  { key: "taxDelinquent",  label: "Tax Del.",    cls: "bg-orange-100 text-orange-700" },
  { key: "probate",        label: "Probate",     cls: "bg-purple-100 text-purple-700" },
  { key: "codeViolations", label: "Code Viol.", cls: "bg-amber-100 text-amber-700" },
  { key: "vacant",         label: "Vacant",      cls: "bg-neutral-200 text-neutral-600" },
  { key: "absenteeOwner",  label: "Absentee",    cls: "bg-sky-100 text-sky-700" },
];

const STATUS_STYLES: Record<Lead["status"], string> = {
  "new":            "bg-blue-50 text-blue-700 border border-blue-200",
  "contacted":      "bg-amber-50 text-amber-700 border border-amber-200",
  "responded":      "bg-violet-50 text-violet-700 border border-violet-200",
  "under-contract": "bg-green-50 text-green-700 border border-green-200",
  "dead":           "bg-neutral-100 text-neutral-400 border border-neutral-200",
};

const STATUS_LABELS: Record<Lead["status"], string> = {
  "new":            "New",
  "contacted":      "Contacted",
  "responded":      "Responded",
  "under-contract": "Under Contract",
  "dead":           "Dead",
};

const TYPE_LABELS: Record<Lead["propertyType"], string> = {
  "single-family": "SFR",
  "multi-family":  "Multi",
  "duplex":        "Duplex",
  "triplex":       "Triplex",
  "fourplex":      "Fourplex",
};

function scoreStyle(n: number) {
  if (n >= 8) return "bg-green-100 text-green-700";
  if (n >= 5) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

const ALL_CITIES    = [...new Set(mockLeads.map((l) => l.city))].sort();
const ALL_STATUSES  = ["new", "contacted", "responded", "under-contract", "dead"] as Lead["status"][];

export default function PipelinePage() {
  const [sortKey,      setSortKey]      = useState<SortKey>("motivationScore");
  const [sortDir,      setSortDir]      = useState<SortDir>("desc");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCity,   setFilterCity]   = useState("all");
  const [minScore,     setMinScore]     = useState(1);
  const [expandedId,   setExpandedId]   = useState<string | null>(null);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "motivationScore" || key === "equityPercent" ? "desc" : "asc");
    }
  }

  const rows = useMemo(() => {
    return mockLeads
      .filter((l) => {
        if (filterStatus !== "all" && l.status !== filterStatus) return false;
        if (filterCity   !== "all" && l.city   !== filterCity)   return false;
        if (l.motivationScore < minScore)                        return false;
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
  }, [filterStatus, filterCity, minScore, sortKey, sortDir]);

  function ColHeader({ label, k }: { label: string; k: SortKey }) {
    const active = sortKey === k;
    return (
      <button
        onClick={() => handleSort(k)}
        className={`flex items-center gap-1 text-xs font-medium uppercase tracking-wide whitespace-nowrap select-none transition-colors ${
          active ? "text-neutral-800" : "text-neutral-400 hover:text-neutral-600"
        }`}
      >
        {label}
        <span className="text-[10px] font-normal">
          {active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
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

  return (
    <div className="flex flex-col min-h-full">
      {/* Page header */}
      <div className="px-8 pt-8 pb-5 border-b border-neutral-200 bg-white">
        <h1 className="text-xl font-semibold text-neutral-900">Deal Pipeline</h1>
        <p className="mt-0.5 text-sm text-neutral-500">Motivated seller leads — Bay Area</p>
      </div>

      {/* Filter bar */}
      <div className="px-8 py-3 flex flex-wrap items-center gap-4 bg-white border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-neutral-500">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border border-neutral-200 rounded-md px-2.5 py-1.5 text-neutral-700 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-300"
          >
            <option value="all">All statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-neutral-500">City</label>
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="text-sm border border-neutral-200 rounded-md px-2.5 py-1.5 text-neutral-700 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-300"
          >
            <option value="all">All cities</option>
            {ALL_CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-neutral-500">Min Score</label>
          <input
            type="number"
            min={1}
            max={10}
            value={minScore}
            onChange={(e) => setMinScore(Math.max(1, Math.min(10, Number(e.target.value))))}
            className="w-16 text-sm border border-neutral-200 rounded-md px-2.5 py-1.5 text-neutral-700 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-300"
          />
        </div>

        <span className="ml-auto text-xs text-neutral-400 tabular-nums">
          {rows.length} of {mockLeads.length} leads
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto px-8 py-6">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="text-left px-3 py-2.5 bg-neutral-50 border-y border-l border-neutral-200 rounded-tl-md">
                <ColHeader label="Address" k="address" />
              </th>
              <th className="text-left px-3 py-2.5 bg-neutral-50 border-y border-neutral-200">
                <ColHeader label="City" k="city" />
              </th>
              <th className="text-left px-3 py-2.5 bg-neutral-50 border-y border-neutral-200">
                <StaticHeader label="Type" />
              </th>
              <th className="text-left px-3 py-2.5 bg-neutral-50 border-y border-neutral-200">
                <StaticHeader label="Units" />
              </th>
              <th className="text-left px-3 py-2.5 bg-neutral-50 border-y border-neutral-200">
                <ColHeader label="Equity %" k="equityPercent" />
              </th>
              <th className="text-left px-3 py-2.5 bg-neutral-50 border-y border-neutral-200">
                <StaticHeader label="Distress" />
              </th>
              <th className="text-left px-3 py-2.5 bg-neutral-50 border-y border-neutral-200">
                <ColHeader label="Score" k="motivationScore" />
              </th>
              <th className="text-left px-3 py-2.5 bg-neutral-50 border-y border-neutral-200">
                <ColHeader label="Status" k="status" />
              </th>
              <th className="text-left px-3 py-2.5 bg-neutral-50 border-y border-r border-neutral-200 rounded-tr-md">
                <ColHeader label="Assigned" k="assignedTo" />
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-12 text-center text-sm text-neutral-400 border-b border-x border-neutral-200 rounded-b-md"
                >
                  No leads match the current filters.
                </td>
              </tr>
            )}

            {rows.map((lead, idx) => {
              const expanded = expandedId === lead.id;
              const isLast   = idx === rows.length - 1;
              const signals  = DISTRESS_FLAGS.filter((f) => lead[f.key] === true);
              const borderB  = expanded || !isLast ? "border-neutral-100" : "border-neutral-200";

              return (
                <tr
                  key={lead.id}
                  onClick={() => setExpandedId(expanded ? null : lead.id)}
                  className={`cursor-pointer group transition-colors ${expanded ? "bg-neutral-50" : "hover:bg-neutral-50/60"}`}
                >
                  {/* --- DATA CELLS --- */}
                  <td className={`px-3 py-2.5 font-medium text-neutral-800 border-b border-l ${borderB} border-neutral-200 ${isLast && !expanded ? "rounded-bl-md" : ""}`}>
                    {lead.address}
                  </td>
                  <td className={`px-3 py-2.5 text-neutral-600 border-b ${borderB}`}>
                    {lead.city}
                  </td>
                  <td className={`px-3 py-2.5 text-neutral-500 border-b ${borderB}`}>
                    {TYPE_LABELS[lead.propertyType]}
                  </td>
                  <td className={`px-3 py-2.5 text-neutral-500 border-b ${borderB}`}>
                    {lead.units}
                  </td>
                  <td className={`px-3 py-2.5 border-b ${borderB}`}>
                    <span className="font-medium text-neutral-700 tabular-nums">{lead.equityPercent}%</span>
                  </td>
                  <td className={`px-3 py-2.5 border-b ${borderB}`}>
                    <div className="flex flex-wrap gap-1">
                      {signals.map((s) => (
                        <span key={s.key as string} className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${s.cls}`}>
                          {s.label}
                        </span>
                      ))}
                      {signals.length === 0 && <span className="text-neutral-300">—</span>}
                    </div>
                  </td>
                  <td className={`px-3 py-2.5 border-b ${borderB}`}>
                    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded tabular-nums ${scoreStyle(lead.motivationScore)}`}>
                      {lead.motivationScore}
                    </span>
                  </td>
                  <td className={`px-3 py-2.5 border-b ${borderB}`}>
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[lead.status]}`}>
                      {STATUS_LABELS[lead.status]}
                    </span>
                  </td>
                  <td className={`px-3 py-2.5 text-neutral-500 border-b border-r ${borderB} border-neutral-200 ${isLast && !expanded ? "rounded-br-md" : ""}`}>
                    {lead.assignedTo}
                  </td>
                </tr>
              );
            })}

            {/* Expanded detail panel — rendered as a separate row after the lead row */}
            {rows.map((lead, idx) => {
              if (expandedId !== lead.id) return null;
              const isLast = idx === rows.length - 1;
              return (
                <tr key={`${lead.id}-detail`} className="bg-neutral-50">
                  <td
                    colSpan={9}
                    className={`px-6 pt-2 pb-5 border-b border-x border-neutral-200 ${isLast ? "rounded-b-md" : ""}`}
                  >
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
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
                      <span><span className="font-medium text-neutral-600">Est. Value:</span> ${lead.estimatedValue.toLocaleString()}</span>
                      <span><span className="font-medium text-neutral-600">Est. Equity:</span> ${lead.estimatedEquity.toLocaleString()}</span>
                      <span><span className="font-medium text-neutral-600">Beds/Baths:</span> {lead.beds}bd / {lead.baths}ba</span>
                      <span><span className="font-medium text-neutral-600">Sqft:</span> {lead.sqft.toLocaleString()}</span>
                      <span><span className="font-medium text-neutral-600">Built:</span> {lead.yearBuilt}</span>
                      <span><span className="font-medium text-neutral-600">Last Sale:</span> ${lead.lastSalePrice.toLocaleString()} ({lead.lastSaleDate})</span>
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
