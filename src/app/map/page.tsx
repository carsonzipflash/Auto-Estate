"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { mockLeads } from "@/data/mockLeads";
import {
  TYPE_LABELS,
  STATUS_LABELS,
  ALL_PROP_TYPES,
  ALL_STATUSES,
} from "@/lib/leadHelpers";

// Leaflet only runs client-side — no SSR
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-neutral-100">
      <span className="text-sm text-neutral-400">Loading map…</span>
    </div>
  ),
});

const ALL_CITIES = [...new Set(mockLeads.map((l) => l.city))].sort();

export default function MapPage() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCity,   setFilterCity]   = useState("all");
  const [filterType,   setFilterType]   = useState("all");
  const [minScore,     setMinScore]     = useState<number | "">("");

  const filtered = useMemo(() => {
    const minS = minScore === "" ? 1 : minScore;
    return mockLeads.filter((l) => {
      if (filterStatus !== "all" && l.status !== filterStatus)     return false;
      if (filterCity   !== "all" && l.city   !== filterCity)       return false;
      if (filterType   !== "all" && l.propertyType !== filterType) return false;
      if (l.motivationScore < minS)                                return false;
      return true;
    });
  }, [filterStatus, filterCity, filterType, minScore]);

  const filtersActive =
    filterStatus !== "all" || filterCity !== "all" || filterType !== "all" || minScore !== "";

  function clearFilters() {
    setFilterStatus("all");
    setFilterCity("all");
    setFilterType("all");
    setMinScore("");
  }

  return (
    <div className="flex flex-1 overflow-hidden">

      {/* ── Filter panel ── */}
      <aside className="w-60 shrink-0 bg-white border-r border-neutral-200 flex flex-col overflow-y-auto">
        <div className="px-5 pt-6 pb-4 border-b border-neutral-100">
          <h1 className="text-base font-semibold text-neutral-900">Map View</h1>
          <p className="mt-0.5 text-xs text-neutral-500">Bay Area motivated sellers</p>
        </div>

        {/* Lead count */}
        <div className="px-5 py-3 border-b border-neutral-100">
          <span className="text-xs font-medium text-neutral-500 tabular-nums">
            <span className="text-neutral-900 font-semibold">{filtered.length}</span>
            {" "}of {mockLeads.length} leads visible
          </span>
        </div>

        {/* Filters */}
        <div className="px-5 py-4 flex flex-col gap-4 flex-1">
          <PanelFilter
            label="Status"
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: "all", label: "All statuses" },
              ...ALL_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
            ]}
          />
          <PanelFilter
            label="City"
            value={filterCity}
            onChange={setFilterCity}
            options={[
              { value: "all", label: "All cities" },
              ...ALL_CITIES.map((c) => ({ value: c, label: c })),
            ]}
          />
          <PanelFilter
            label="Type"
            value={filterType}
            onChange={setFilterType}
            options={[
              { value: "all", label: "All types" },
              ...ALL_PROP_TYPES.map((t) => ({ value: t, label: TYPE_LABELS[t] })),
            ]}
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-neutral-500">Min Score</label>
            <input
              type="number"
              min={1}
              max={10}
              placeholder="—"
              value={minScore}
              onChange={(e) =>
                setMinScore(
                  e.target.value === ""
                    ? ""
                    : Math.max(1, Math.min(10, Number(e.target.value)))
                )
              }
              className="w-full text-sm border border-neutral-200 rounded-md px-2.5 py-1.5 text-neutral-700 bg-white placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-300 tabular-nums"
            />
          </div>

          {filtersActive && (
            <button
              onClick={clearFilters}
              className="text-xs text-neutral-400 hover:text-neutral-600 underline underline-offset-2 transition-colors self-start"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Legend */}
        <div className="px-5 py-4 border-t border-neutral-100">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 mb-2">
            Motivation Score
          </p>
          <div className="flex flex-col gap-1.5">
            <LegendItem color="#16a34a" label="High (8–10)" />
            <LegendItem color="#d97706" label="Medium (5–7)" />
            <LegendItem color="#dc2626" label="Low (1–4)" />
          </div>
        </div>
      </aside>

      {/* ── Map ── */}
      <div className="flex-1 relative">
        <MapView leads={filtered} />
      </div>

    </div>
  );
}

// ─── UI atoms ─────────────────────────────────────────────────────────────────

function PanelFilter({
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
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-neutral-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm border border-neutral-200 rounded-md px-2.5 py-1.5 text-neutral-700 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-300"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block w-3 h-3 rounded-full border border-white shadow-sm shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-neutral-500">{label}</span>
    </div>
  );
}
