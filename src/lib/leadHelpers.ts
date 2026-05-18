import { Lead } from "@/types/lead";

// ─── Display maps ─────────────────────────────────────────────────────────────

export const TYPE_LABELS: Record<Lead["propertyType"], string> = {
  "single-family": "Single-Family",
  "multi-family":  "Multi-Family",
  "duplex":        "Duplex",
  "triplex":       "Triplex",
  "fourplex":      "Fourplex",
};

export const STATUS_LABELS: Record<Lead["status"], string> = {
  "new":            "New",
  "contacted":      "Contacted",
  "responded":      "Responded",
  "under-contract": "Under Contract",
  "dead":           "Dead",
};

export const STATUS_STYLES: Record<Lead["status"], string> = {
  "new":            "bg-blue-50 text-blue-700 border border-blue-200",
  "contacted":      "bg-amber-50 text-amber-700 border border-amber-200",
  "responded":      "bg-violet-50 text-violet-700 border border-violet-200",
  "under-contract": "bg-green-50 text-green-700 border border-green-200",
  "dead":           "bg-neutral-100 text-neutral-400 border border-neutral-200",
};

export const DISTRESS_FLAGS: { key: keyof Lead; label: string; cls: string }[] = [
  { key: "preForeclosure", label: "Pre-FC",     cls: "bg-red-100 text-red-700" },
  { key: "taxDelinquent",  label: "Tax Del.",    cls: "bg-orange-100 text-orange-700" },
  { key: "probate",        label: "Probate",     cls: "bg-purple-100 text-purple-700" },
  { key: "codeViolations", label: "Code Viol.",  cls: "bg-amber-100 text-amber-700" },
  { key: "vacant",         label: "Vacant",      cls: "bg-neutral-200 text-neutral-600" },
  { key: "absenteeOwner",  label: "Absentee",    cls: "bg-sky-100 text-sky-700" },
];

// ─── Filter option lists ───────────────────────────────────────────────────────

export const ALL_PROP_TYPES = Object.keys(TYPE_LABELS) as Lead["propertyType"][];

export const ALL_STATUSES = [
  "new",
  "contacted",
  "responded",
  "under-contract",
  "dead",
] as Lead["status"][];

// ─── Utility functions ────────────────────────────────────────────────────────

export function scoreStyle(n: number): string {
  if (n >= 8) return "bg-green-100 text-green-700";
  if (n >= 5) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

export function scoreColor(n: number): string {
  if (n >= 8) return "#16a34a"; // green-600
  if (n >= 5) return "#d97706"; // amber-600
  return "#dc2626";             // red-600
}

export function needsFollowUp(lead: Lead): boolean {
  if (lead.status !== "contacted" || !lead.lastContactedDate) return false;
  const lastContact = new Date(lead.lastContactedDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = (today.getTime() - lastContact.getTime()) / 86_400_000;
  return diffDays > 7;
}

export function fmt(n: number): string {
  return n.toLocaleString();
}
