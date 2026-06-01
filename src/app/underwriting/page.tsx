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

// ─── Shared UI ────────────────────────────────────────────────────────────────

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-md border border-[#e5e5e5] bg-[#f4f5f7] px-4 py-3 flex flex-col gap-1 shadow-sm">
      <span className="text-xs text-[#666666] uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-mono font-medium ${accent ? "text-[#085e2d]" : "text-[#1a1a1a]"}`}>
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
  suffix,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-[#666666] uppercase tracking-wider">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] text-sm">
            {prefix}
          </span>
        )}
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] text-sm">
            {suffix}
          </span>
        )}
        <input
          type="text"
          readOnly={readOnly}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={`w-full rounded-md border bg-[#f4f5f7] px-3 py-2 text-sm font-mono outline-none transition
            ${prefix ? "pl-7" : ""}
            ${suffix ? "pr-7" : ""}
            ${readOnly
              ? "border-[#e5e5e5] text-[#999999] cursor-default"
              : "border-[#e5e5e5] text-[#1a1a1a] focus:border-[#085e2d] focus:ring-1 focus:ring-[#085e2d] focus:bg-white"}`}
        />
      </div>
    </div>
  );
}

const BADGE = {
  pursue:    "bg-[#dfe9e5] text-[#085e2d] border border-[#085e2d]",
  negotiate: "bg-[#fef3c7] text-[#f59e0b] border border-[#f59e0b]",
  pass:      "bg-[#fee2e2] text-[#dc2626] border border-[#dc2626]",
};
const BADGE_LABEL = { pursue: "Pursue", negotiate: "Negotiate", pass: "Pass" };

function AnalysisPanel({ analysis, label }: { analysis: DealAnalysis; label?: string }) {
  return (
    <div className="rounded-lg border border-[#e5e5e5] bg-white p-6 space-y-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">
            {label ?? "AI Analysis"}
          </h2>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${BADGE[analysis.recommendation]}`}>
            {BADGE_LABEL[analysis.recommendation]}
          </span>
        </div>
        <span className="text-xs text-[#999999]">claude-haiku</span>
      </div>
      <p className="text-sm text-[#1a1a1a] font-medium leading-snug">{analysis.verdict}</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs font-bold text-[#085e2d] uppercase tracking-wider">Strengths</p>
          <ul className="space-y-1.5">
            {analysis.strengths.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-[#1a1a1a]">
                <span className="text-[#085e2d] shrink-0 mt-0.5">+</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-bold text-[#dc2626] uppercase tracking-wider">Risks</p>
          <ul className="space-y-1.5">
            {analysis.risks.map((r, i) => (
              <li key={i} className="flex gap-2 text-sm text-[#1a1a1a]">
                <span className="text-[#dc2626] shrink-0 mt-0.5">−</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="text-sm text-[#666666] leading-relaxed border-t border-[#e5e5e5] pt-4">
        {analysis.commentary}
      </p>
    </div>
  );
}

function AnalyzeButton({
  onClick,
  loading,
  disabled,
  label,
}: {
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
  label: string;
}) {
  const active = !disabled && !loading;
  return (
    <button
      onClick={onClick}
      disabled={!active}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition
        ${active
          ? "bg-[#085e2d] hover:bg-[#064b23] text-white cursor-pointer"
          : "bg-[#e5e5e5] text-[#999999] cursor-not-allowed"}`}
    >
      {loading ? (
        <>
          <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Analyzing…
        </>
      ) : (
        <>
          <span className="text-base leading-none">✦</span>
          {label}
        </>
      )}
    </button>
  );
}

function LeadPicker({
  leads,
  value,
  onSelect,
  onClear,
}: {
  leads: Lead[];
  value: string;
  onSelect: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-lg border border-[#e5e5e5] bg-white p-6 space-y-4 shadow-sm">
      <h2 className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">
        Load from Pipeline
      </h2>
      <div className="flex gap-3 items-center">
        <select
          value={value}
          onChange={(e) => onSelect(e.target.value)}
          className="flex-1 rounded-md border border-[#e5e5e5] bg-[#f4f5f7] px-3 py-2 text-sm text-[#1a1a1a] focus:border-[#085e2d] focus:ring-1 focus:ring-[#085e2d] focus:bg-white outline-none transition"
        >
          <option value="">— Select a lead —</option>
          {leads.map((l) => (
            <option key={l.id} value={l.id}>
              {l.address}, {l.city} — {l.ownerName}
            </option>
          ))}
        </select>
        {value && (
          <button
            onClick={onClear}
            className="px-3 py-2 rounded-md border border-[#e5e5e5] text-sm text-[#1a1a1a] hover:bg-[#f4f5f7] transition"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

function CompRow({ lead }: { lead: Lead }) {
  return (
    <div className="py-4 grid grid-cols-4 gap-4 text-sm">
      <div>
        <p className="text-[#1a1a1a] font-medium">{lead.address}</p>
        <p className="text-xs text-[#666666]">{lead.city}, {lead.zip}</p>
      </div>
      <div>
        <p className="text-xs text-[#666666] uppercase tracking-wider mb-0.5">Est. Value</p>
        <p className="text-[#1a1a1a] font-mono">{fmt(lead.estimatedValue)}</p>
      </div>
      <div>
        <p className="text-xs text-[#666666] uppercase tracking-wider mb-0.5">Last Sale</p>
        <p className="text-[#1a1a1a] font-mono">{fmt(lead.lastSalePrice)}</p>
      </div>
      <div>
        <p className="text-xs text-[#666666] uppercase tracking-wider mb-0.5">Equity</p>
        <p className="text-[#085e2d] font-mono">{lead.equityPercent}%</p>
      </div>
    </div>
  );
}

// ─── SFR Mode ─────────────────────────────────────────────────────────────────

function SfrMode() {
  const [selectedLeadId, setSelectedLeadId] = useState("");
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
    return mockLeads
      .filter((l) => l.propertyType === "single-family" && l.id !== selectedLeadId)
      .slice(0, 3);
  }, [selectedLeadId]);

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

  return (
    <div className="space-y-8">
      <LeadPicker leads={sfrLeads} value={selectedLeadId} onSelect={selectLead} onClear={clearLead} />

      {/* Inputs */}
      <div className="rounded-lg border border-[#e5e5e5] bg-white p-6 space-y-5 shadow-sm">
        <h2 className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">Deal Inputs</h2>
        <InputField label="Property Address" value={address} onChange={selectedLeadId ? undefined : setAddress} readOnly={!!selectedLeadId} />
        <div className="grid grid-cols-2 gap-4">
          <InputField label="ARV (After Repair Value)" value={arv} onChange={setArv} prefix="$" />
          <InputField label="Repair Estimate" value={repairs} onChange={setRepairs} prefix="$" />
          <InputField label="Purchase Price" value={purchasePrice} onChange={setPurchasePrice} prefix="$" />
          <InputField label="Wholesaler Fee (%)" value={fee} onChange={setFee} suffix="%" />
        </div>
      </div>

      {/* MAO */}
      <div className="rounded-lg border-2 border-[#085e2d] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#666666] uppercase tracking-wider mb-1">Maximum Allowed Offer</p>
            <p className="text-xs text-[#666666] mb-3">Formula: (ARV × 70%) − Repairs − Wholesaler Fee</p>
            <p className={`text-4xl font-mono font-bold ${mao >= 0 ? "text-[#085e2d]" : "text-[#dc2626]"}`}>
              {arvNum > 0 ? fmt(mao) : "—"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-4">
            <div className="text-right text-xs text-[#666666] font-mono space-y-1">
              <div>ARV × 70% = {arvNum > 0 ? fmt(arvNum * 0.7) : "—"}</div>
              <div>− Repairs = {repairsNum > 0 ? fmt(repairsNum) : "$0"}</div>
              <div>− Fee ({feeNum}%) = {feeAmount > 0 ? fmt(feeAmount) : "$0"}</div>
            </div>
            <AnalyzeButton onClick={analyzeDeal} loading={analyzing} disabled={!arvNum || !purchaseNum} label="Analyze Deal" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Purchase Price" value={purchaseNum > 0 ? fmt(purchaseNum) : "—"} />
        <StatCard label="Repair Estimate" value={repairsNum > 0 ? fmt(repairsNum) : "—"} />
        <StatCard label={`Fee (${feeNum}%)`} value={feeAmount > 0 ? fmt(feeAmount) : "—"} />
        <StatCard label="Estimated Profit" value={arvNum > 0 ? fmt(profit) : "—"} accent={profit >= 0} />
      </div>

      {analyzeError && (
        <div className="rounded-lg border border-[#dc2626] bg-[#fee2e2] px-5 py-4 text-sm text-[#dc2626]">
          Analysis failed: {analyzeError}
        </div>
      )}
      {analysis && <AnalysisPanel analysis={analysis} />}

      {/* Comparables */}
      <div className="rounded-lg border border-[#e5e5e5] bg-white p-6 space-y-2 shadow-sm">
        <h2 className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">
          Comparable Properties
          <span className="ml-2 font-normal text-[#666666] normal-case">— single-family leads</span>
        </h2>
        <div className="divide-y divide-[#e5e5e5]">
          {comparables.map((comp) => <CompRow key={comp.id} lead={comp} />)}
        </div>
      </div>
    </div>
  );
}

// ─── Multifamily Mode ──────────────────────────────────────────────────────────

const MF_TYPES = ["multi-family", "duplex", "triplex", "fourplex"] as const;

function MfMode() {
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [address, setAddress] = useState("");
  const [grossIncome, setGrossIncome] = useState("");
  const [expenseRatio, setExpenseRatio] = useState("35");
  const [capRate, setCapRate] = useState("6");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [analysis, setAnalysis] = useState<DealAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const mfLeads = mockLeads.filter((l) => (MF_TYPES as readonly string[]).includes(l.propertyType));

  function selectLead(id: string) {
    setSelectedLeadId(id);
    setAnalysis(null);
    setAnalyzeError(null);
    if (!id) return;
    const lead = mockLeads.find((l) => l.id === id);
    if (!lead) return;
    setAddress(`${lead.address}, ${lead.city}, ${lead.zip}`);
    setGrossIncome("");
    setPurchasePrice(String(lead.lastSalePrice));
    setExpenseRatio("35");
    setCapRate("6");
  }

  function clearLead() {
    setSelectedLeadId("");
    setAddress("");
    setGrossIncome("");
    setPurchasePrice("");
    setExpenseRatio("35");
    setCapRate("6");
    setAnalysis(null);
    setAnalyzeError(null);
  }

  const grossIncomeNum = parse(grossIncome);
  const expenseRatioNum = parse(expenseRatio);
  const operatingExpenses = grossIncomeNum * (expenseRatioNum / 100);
  const noi = grossIncomeNum - operatingExpenses;
  const capRateNum = parse(capRate) / 100;
  const arvAtCapRate = capRateNum > 0 && noi > 0 ? noi / capRateNum : 0;
  const purchaseNum = parse(purchasePrice);
  const spread = arvAtCapRate - purchaseNum;
  const expenseRatioDisplay = grossIncomeNum > 0
    ? ((operatingExpenses / grossIncomeNum) * 100).toFixed(1)
    : expenseRatioNum.toFixed(1);

  const selectedLead = selectedLeadId ? mockLeads.find((l) => l.id === selectedLeadId) : null;

  const comparables = useMemo(() => {
    return mockLeads
      .filter((l) => (MF_TYPES as readonly string[]).includes(l.propertyType) && l.id !== selectedLeadId)
      .slice(0, 3);
  }, [selectedLeadId]);

  async function analyzeDeal() {
    if (!grossIncomeNum || !purchaseNum) return;
    setAnalyzing(true);
    setAnalysis(null);
    setAnalyzeError(null);

    const distressFlags: string[] = [];
    if (selectedLead) {
      if (selectedLead.taxDelinquent) distressFlags.push("tax delinquent");
      if (selectedLead.preForeclosure) distressFlags.push("pre-foreclosure");
      if (selectedLead.codeViolations) distressFlags.push("code violations");
      if (selectedLead.vacant) distressFlags.push("vacant");
      if (selectedLead.absenteeOwner) distressFlags.push("absentee owner");
    }

    try {
      const res = await fetch("/api/analyze-mf-deal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: address || "Unknown address",
          grossIncome: grossIncomeNum,
          operatingExpenses,
          noi,
          expenseRatioPercent: expenseRatioNum,
          capRateTarget: parse(capRate),
          arvAtCapRate,
          purchasePrice: purchaseNum,
          spread,
          units: selectedLead?.units,
          propertyType: selectedLead?.propertyType,
          sqft: selectedLead?.sqft,
          yearBuilt: selectedLead?.yearBuilt,
          ownerName: selectedLead?.ownerName,
          motivationScore: selectedLead?.motivationScore,
          distressFlags,
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

  const canAnalyze = grossIncomeNum > 0 && purchaseNum > 0;

  return (
    <div className="space-y-8">
      <LeadPicker leads={mfLeads} value={selectedLeadId} onSelect={selectLead} onClear={clearLead} />

      {/* Inputs */}
      <div className="rounded-lg border border-[#e5e5e5] bg-white p-6 space-y-5 shadow-sm">
        <h2 className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">Deal Inputs</h2>
        <InputField label="Property Address" value={address} onChange={selectedLeadId ? undefined : setAddress} readOnly={!!selectedLeadId} />
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Gross Annual Income" value={grossIncome} onChange={setGrossIncome} prefix="$" />
          <InputField label="Expense Ratio" value={expenseRatio} onChange={setExpenseRatio} suffix="%" />
          <InputField label="Purchase Price" value={purchasePrice} onChange={setPurchasePrice} prefix="$" />
          <InputField label="Cap Rate Target" value={capRate} onChange={setCapRate} suffix="%" />
        </div>
        {/* Calculated NOI preview */}
        {grossIncomeNum > 0 && (
          <div className="rounded-md border border-[#e5e5e5] bg-[#f4f5f7] px-4 py-3 flex items-center justify-between">
            <div className="text-xs text-[#666666] font-mono space-y-0.5">
              <div>{fmt(grossIncomeNum)} gross income</div>
              <div>− {fmt(operatingExpenses)} expenses ({expenseRatioDisplay}%)</div>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#666666] uppercase tracking-wider mb-0.5">NOI</p>
              <p className={`text-xl font-mono font-bold ${noi >= 0 ? "text-[#085e2d]" : "text-[#dc2626]"}`}>
                {fmt(noi)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Investment Analysis */}
      <div className="rounded-lg border-2 border-[#085e2d] bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div>
              <p className="text-xs text-[#666666] uppercase tracking-wider mb-1">Investment Analysis</p>
              <p className="text-xs text-[#666666] mb-3">ARV = NOI ÷ Cap Rate</p>
              <p className={`text-4xl font-mono font-bold ${noi >= 0 ? "text-[#085e2d]" : "text-[#dc2626]"}`}>
                {grossIncomeNum > 0 ? fmt(noi) : "—"}
              </p>
              <p className="text-xs text-[#666666] mt-1">Net Operating Income / year</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-[#e5e5e5] bg-[#f4f5f7] px-3 py-2">
                <p className="text-xs text-[#666666] uppercase tracking-wider mb-0.5">ARV @ {capRate}% Cap</p>
                <p className="text-[#1a1a1a] font-mono font-medium text-sm">
                  {arvAtCapRate > 0 ? fmt(arvAtCapRate) : "—"}
                </p>
              </div>
              <div className="rounded-md border border-[#e5e5e5] bg-[#f4f5f7] px-3 py-2">
                <p className="text-xs text-[#666666] uppercase tracking-wider mb-0.5">Spread (ARV − Purchase)</p>
                <p className={`font-mono font-medium text-sm ${spread >= 0 ? "text-[#085e2d]" : "text-[#dc2626]"}`}>
                  {arvAtCapRate > 0 && purchaseNum > 0 ? fmt(spread) : "—"}
                </p>
              </div>
            </div>
          </div>
          <div className="shrink-0 pt-8">
            <AnalyzeButton onClick={analyzeDeal} loading={analyzing} disabled={!canAnalyze} label="Analyze MF Deal" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Gross Annual Income" value={grossIncomeNum > 0 ? fmt(grossIncomeNum) : "—"} />
        <StatCard label="Operating Expenses" value={operatingExpenses > 0 ? fmt(operatingExpenses) : "—"} />
        <StatCard label="NOI" value={grossIncomeNum > 0 ? fmt(noi) : "—"} accent={noi > 0} />
        <StatCard label="Expense Ratio" value={grossIncomeNum > 0 ? `${expenseRatioDisplay}%` : "—"} />
      </div>

      {analyzeError && (
        <div className="rounded-lg border border-[#dc2626] bg-[#fee2e2] px-5 py-4 text-sm text-[#dc2626]">
          Analysis failed: {analyzeError}
        </div>
      )}
      {analysis && <AnalysisPanel analysis={analysis} label="AI Analysis — Multifamily" />}

      {/* Comparables */}
      <div className="rounded-lg border border-[#e5e5e5] bg-white p-6 space-y-2 shadow-sm">
        <h2 className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">
          Comparable Properties
          <span className="ml-2 font-normal text-[#666666] normal-case">— multifamily leads</span>
        </h2>
        {comparables.length === 0 ? (
          <p className="text-sm text-[#666666]">No multifamily comparables found.</p>
        ) : (
          <div className="divide-y divide-[#e5e5e5]">
            {comparables.map((comp) => <CompRow key={comp.id} lead={comp} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function UnderwritingPage() {
  const [mode, setMode] = useState<"sfr" | "multifamily">("sfr");

  return (
    <main className="flex-1 min-h-screen bg-white text-[#1a1a1a] p-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header + Mode Toggle */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight text-[#1a1a1a]">Underwriting</h1>
            <p className="mt-1 text-sm text-[#666666]">
              Select a lead to pre-fill, or enter values manually.
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-md border border-[#e5e5e5] bg-white p-1 shadow-sm">
            <button
              onClick={() => setMode("sfr")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                mode === "sfr"
                  ? "bg-[#085e2d] text-white"
                  : "text-[#666666] hover:text-[#1a1a1a]"
              }`}
            >
              SFR
            </button>
            <button
              onClick={() => setMode("multifamily")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                mode === "multifamily"
                  ? "bg-[#085e2d] text-white"
                  : "text-[#666666] hover:text-[#1a1a1a]"
              }`}
            >
              Multifamily
            </button>
          </div>
        </div>

        {mode === "sfr" ? <SfrMode /> : <MfMode />}

      </div>
    </main>
  );
}
