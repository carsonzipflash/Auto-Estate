"use client";

import { useState, useMemo } from "react";
import { mockLeads } from "@/data/mockLeads";
import { Lead } from "@/types/lead";
import type { DealAnalysis } from "@/app/api/analyze-deal/route";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const parse = (s: string) => {
  const n = parseFloat(s.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
};

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 flex flex-col gap-1">
      <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
      <span className={`text-lg font-semibold ${accent ? "text-emerald-400" : "text-slate-100"}`}>
        {value}
      </span>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  readOnly,
  prefix,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  prefix?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-400 uppercase tracking-wider">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            {prefix}
          </span>
        )}
        <input
          type="text"
          readOnly={readOnly}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={`w-full rounded-md border bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none transition
            ${prefix ? "pl-7" : ""}
            ${readOnly ? "border-slate-700 text-slate-400 cursor-default" : "border-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"}`}
        />
      </div>
    </div>
  );
}

const BADGE = {
  pursue: "bg-emerald-900 text-emerald-300 border border-emerald-700",
  negotiate: "bg-amber-900 text-amber-300 border border-amber-700",
  pass: "bg-red-900 text-red-300 border border-red-800",
};

const BADGE_LABEL = { pursue: "Pursue", negotiate: "Negotiate", pass: "Pass" };

function AnalysisPanel({ analysis }: { analysis: DealAnalysis }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 space-y-5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            AI Analysis
          </h2>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${BADGE[analysis.recommendation]}`}>
            {BADGE_LABEL[analysis.recommendation]}
          </span>
        </div>
        <span className="text-xs text-slate-500">claude-haiku</span>
      </div>

      {/* Verdict */}
      <p className="text-slate-100 font-medium leading-snug">{analysis.verdict}</p>

      {/* Strengths + Risks */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs text-emerald-500 uppercase tracking-wider font-semibold">Strengths</p>
          <ul className="space-y-1.5">
            {analysis.strengths.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-300">
                <span className="text-emerald-500 shrink-0 mt-0.5">+</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-red-500 uppercase tracking-wider font-semibold">Risks</p>
          <ul className="space-y-1.5">
            {analysis.risks.map((r, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-300">
                <span className="text-red-500 shrink-0 mt-0.5">−</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Commentary */}
      <p className="text-sm text-slate-400 leading-relaxed border-t border-slate-800 pt-4">
        {analysis.commentary}
      </p>
    </div>
  );
}

export default function UnderwritingPage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [address, setAddress] = useState("");
  const [arv, setArv] = useState("");
  const [repairs, setRepairs] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [fee, setFee] = useState("10");

  const [analysis, setAnalysis] = useState<DealAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const sfrLeads = mockLeads.filter((l) => l.propertyType === "single-family");

  function selectLead(id: string) {
    setSelectedLeadId(id);
    setAnalysis(null);
    setAnalyzeError(null);
    if (!id) return;
    const lead = mockLeads.find((l) => l.id === id);
    if (!lead) return;
    setAddress(`${lead.address}, ${lead.city}, ${lead.zip}`);
    setArv(String(lead.estimatedValue));
    setRepairs("");
    setPurchasePrice(String(lead.lastSalePrice));
    setFee("10");
  }

  function clearLead() {
    setSelectedLeadId("");
    setAddress("");
    setArv("");
    setRepairs("");
    setPurchasePrice("");
    setFee("10");
    setAnalysis(null);
    setAnalyzeError(null);
  }

  const arvNum = parse(arv);
  const repairsNum = parse(repairs);
  const purchaseNum = parse(purchasePrice);
  const feeNum = parse(fee);
  const feeAmount = arvNum * (feeNum / 100);
  const mao = arvNum * 0.7 - repairsNum - feeAmount;
  const profit = arvNum - purchaseNum - repairsNum - feeAmount;

  const selectedLead = selectedLeadId ? mockLeads.find((l) => l.id === selectedLeadId) : null;

  const comparables = useMemo(() => {
    const type = selectedLead?.propertyType ?? "single-family";
    return mockLeads
      .filter((l) => l.propertyType === type && l.id !== selectedLeadId)
      .slice(0, 3);
  }, [selectedLead, selectedLeadId]);

  async function analyzeDeal() {
    if (!arvNum || !purchaseNum) return;
    setAnalyzing(true);
    setAnalysis(null);
    setAnalyzeError(null);

    const distressFlags: string[] = [];
    if (selectedLead) {
      if (selectedLead.taxDelinquent) distressFlags.push("tax delinquent");
      if (selectedLead.preForeclosure) distressFlags.push("pre-foreclosure");
      if (selectedLead.probate) distressFlags.push("probate");
      if (selectedLead.codeViolations) distressFlags.push("code violations");
      if (selectedLead.vacant) distressFlags.push("vacant");
      if (selectedLead.absenteeOwner) distressFlags.push("absentee owner");
    }

    try {
      const res = await fetch("/api/analyze-deal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: address || "Unknown address",
          arv: arvNum,
          repairs: repairsNum,
          purchasePrice: purchaseNum,
          feePercent: feeNum,
          motivationScore: selectedLead?.motivationScore,
          ownerName: selectedLead?.ownerName,
          distressFlags,
          propertyType: selectedLead?.propertyType,
          beds: selectedLead?.beds,
          baths: selectedLead?.baths,
          sqft: selectedLead?.sqft,
          yearBuilt: selectedLead?.yearBuilt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setAnalysis(data as DealAnalysis);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setAnalyzing(false);
    }
  }

  const canAnalyze = arvNum > 0 && purchaseNum > 0 && !analyzing;

  return (
    <main className="flex-1 min-h-screen bg-[#0F0F0F] text-slate-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">SFR Underwriting</h1>
          <p className="mt-1 text-sm text-slate-400">
            Calculate MAO and deal metrics. Select a lead to pre-fill, or enter values manually.
          </p>
        </div>

        {/* Lead Picker */}
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Load from Pipeline
          </h2>
          <div className="flex gap-3 items-center">
            <select
              value={selectedLeadId}
              onChange={(e) => selectLead(e.target.value)}
              className="flex-1 rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100
                focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
            >
              <option value="">— Select a lead —</option>
              {sfrLeads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.address}, {l.city} — {l.ownerName}
                </option>
              ))}
            </select>
            {selectedLeadId && (
              <button
                onClick={clearLead}
                className="px-3 py-2 rounded-md border border-slate-600 text-xs text-slate-400 hover:border-slate-500 hover:text-slate-200 transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Inputs */}
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Deal Inputs
          </h2>
          <InputField
            label="Property Address"
            value={address}
            onChange={selectedLeadId ? undefined : setAddress}
            readOnly={!!selectedLeadId}
          />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="ARV (After Repair Value)" value={arv} onChange={setArv} prefix="$" />
            <InputField label="Repair Estimate" value={repairs} onChange={setRepairs} prefix="$" />
            <InputField label="Purchase Price" value={purchasePrice} onChange={setPurchasePrice} prefix="$" />
            <InputField label="Wholesaler Fee (%)" value={fee} onChange={setFee} />
          </div>
        </div>

        {/* MAO Result */}
        <div className="rounded-xl border border-emerald-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                Maximum Allowed Offer
              </p>
              <p className="text-xs text-slate-500 mb-3">
                Formula: (ARV × 70%) − Repairs − Wholesaler Fee
              </p>
              <p className={`text-4xl font-bold ${mao >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {arvNum > 0 ? fmt(mao) : "—"}
              </p>
            </div>
            <div className="flex flex-col items-end gap-4">
              <div className="text-right text-xs text-slate-500 space-y-1">
                <div>ARV × 70% = {arvNum > 0 ? fmt(arvNum * 0.7) : "—"}</div>
                <div>− Repairs = {repairsNum > 0 ? fmt(repairsNum) : "$0"}</div>
                <div>− Fee ({feeNum}%) = {feeAmount > 0 ? fmt(feeAmount) : "$0"}</div>
              </div>
              <button
                onClick={analyzeDeal}
                disabled={!canAnalyze}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition
                  ${canAnalyze
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                    : "bg-slate-700 text-slate-500 cursor-not-allowed"}`}
              >
                {analyzing ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <span className="text-base leading-none">✦</span>
                    Analyze Deal
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Purchase Price" value={purchaseNum > 0 ? fmt(purchaseNum) : "—"} />
          <StatCard label="Repair Estimate" value={repairsNum > 0 ? fmt(repairsNum) : "—"} />
          <StatCard label={`Fee (${feeNum}%)`} value={feeAmount > 0 ? fmt(feeAmount) : "—"} />
          <StatCard
            label="Estimated Profit"
            value={arvNum > 0 ? fmt(profit) : "—"}
            accent={profit >= 0}
          />
        </div>

        {/* AI Analysis */}
        {analyzeError && (
          <div className="rounded-xl border border-red-800 bg-red-950/40 px-5 py-4 text-sm text-red-300">
            Analysis failed: {analyzeError}
          </div>
        )}
        {analysis && <AnalysisPanel analysis={analysis} />}

        {/* Comparables */}
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Comparable Properties
            {selectedLead && (
              <span className="ml-2 font-normal text-slate-500 normal-case">
                — {selectedLead.propertyType} leads
              </span>
            )}
          </h2>
          {comparables.length === 0 ? (
            <p className="text-sm text-slate-500">No comparables found for this property type.</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {comparables.map((comp) => (
                <CompRow key={comp.id} lead={comp} />
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}

function CompRow({ lead }: { lead: Lead }) {
  return (
    <div className="py-3 grid grid-cols-4 gap-4 text-sm">
      <div>
        <p className="text-slate-100 font-medium">{lead.address}</p>
        <p className="text-xs text-slate-400">{lead.city}, {lead.zip}</p>
      </div>
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">ARV</p>
        <p className="text-slate-100">{fmt(lead.estimatedValue)}</p>
      </div>
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Last Sale</p>
        <p className="text-slate-100">{fmt(lead.lastSalePrice)}</p>
      </div>
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Equity</p>
        <p className="text-emerald-400">{lead.equityPercent}%</p>
      </div>
    </div>
  );
}
