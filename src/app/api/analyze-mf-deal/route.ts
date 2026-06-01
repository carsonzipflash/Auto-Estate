import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { DealAnalysis } from "@/app/api/analyze-deal/route";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type AnalyzeMfDealRequest = {
  address: string;
  grossIncome: number;
  operatingExpenses: number;
  noi: number;
  expenseRatioPercent: number;
  capRateTarget: number;
  arvAtCapRate: number;
  purchasePrice: number;
  spread: number;
  units?: number;
  propertyType?: string;
  sqft?: number;
  yearBuilt?: number;
  ownerName?: string;
  motivationScore?: number;
  distressFlags?: string[];
};

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  let body: AnalyzeMfDealRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { address, grossIncome, noi, capRateTarget, arvAtCapRate, purchasePrice, spread } = body;
  if (!address || !grossIncome || !purchasePrice) {
    return NextResponse.json(
      { error: "address, grossIncome, and purchasePrice are required" },
      { status: 400 }
    );
  }

  const distressContext = body.distressFlags?.length
    ? `Distress flags: ${body.distressFlags.join(", ")}.`
    : "No distress flags.";

  const propertyContext = [
    body.propertyType && `Type: ${body.propertyType}`,
    body.units && `${body.units} units`,
    body.sqft && `${body.sqft.toLocaleString()} sqft`,
    body.yearBuilt && `built ${body.yearBuilt}`,
  ]
    .filter(Boolean)
    .join(", ");

  const spreadPct =
    arvAtCapRate > 0 ? ((spread / arvAtCapRate) * 100).toFixed(1) : "0";

  const prompt = `You are an experienced multifamily real estate investor underwriting an acquisition. Analyze this deal and return ONLY a JSON object — no markdown, no explanation outside the JSON.

PROPERTY
--------
Address: ${address}
${propertyContext}
Owner: ${body.ownerName ?? "Unknown"}
Motivation Score: ${body.motivationScore ?? "N/A"}/10
${distressContext}

FINANCIALS
----------
Gross Annual Income: $${grossIncome.toLocaleString()}
Operating Expenses: $${body.operatingExpenses.toLocaleString()} (${body.expenseRatioPercent.toFixed(1)}% expense ratio)
NOI: $${noi.toLocaleString()}
Cap Rate Target: ${capRateTarget}%
ARV at ${capRateTarget}% Cap Rate: $${Math.round(arvAtCapRate).toLocaleString()}
Purchase Price: $${purchasePrice.toLocaleString()}
Spread (ARV − Purchase): $${Math.round(spread).toLocaleString()} (${spreadPct}% of ARV)

TASK
----
Return a JSON object with exactly this shape:
{
  "recommendation": "pursue" | "negotiate" | "pass",
  "verdict": "<one direct sentence — the bottom line on this MF deal>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "risks": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "commentary": "<2-3 sentence sharp take focused on cap rate viability, expense ratio reasonableness, NOI sustainability, and whether the spread justifies the price>"
}

Rules:
- "pursue" if spread is positive and ≥ 15% of ARV, expense ratio seems defensible, NOI is real
- "negotiate" if spread is thin (5-15%) or expense ratio seems low/high for this property type
- "pass" if spread is negative, or NOI doesn't support the cap rate at this price
- Bay Area multifamily context: market cap rates are typically 3.5-5.5% — a 6%+ target is aggressive and may require distressed pricing
- A 35% expense ratio is on the low end for older properties; flag if the year built suggests higher maintenance costs
- Be blunt and specific — this is internal deal analysis, not a sales pitch`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")
      .trim();

    const jsonStr = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const analysis: DealAnalysis = JSON.parse(jsonStr);

    return NextResponse.json(analysis);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
