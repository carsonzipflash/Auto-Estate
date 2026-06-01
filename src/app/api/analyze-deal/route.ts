import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type DealAnalysis = {
  recommendation: "pursue" | "negotiate" | "pass";
  verdict: string;
  strengths: string[];
  risks: string[];
  commentary: string;
};

export type AnalyzeDealRequest = {
  address: string;
  arv: number;
  repairs: number;
  purchasePrice: number;
  feePercent: number;
  // optional lead metadata
  motivationScore?: number;
  ownerName?: string;
  distressFlags?: string[];
  propertyType?: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  yearBuilt?: number;
};

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  let body: AnalyzeDealRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { address, arv, repairs, purchasePrice, feePercent } = body;
  if (!address || !arv || !purchasePrice) {
    return NextResponse.json({ error: "address, arv, and purchasePrice are required" }, { status: 400 });
  }

  const feeAmount = arv * (feePercent / 100);
  const mao = arv * 0.7 - repairs - feeAmount;
  const profit = arv - purchasePrice - repairs - feeAmount;
  const profitMargin = arv > 0 ? ((profit / arv) * 100).toFixed(1) : "0";
  const spread = mao - purchasePrice;

  const distressContext = body.distressFlags?.length
    ? `Distress flags: ${body.distressFlags.join(", ")}.`
    : "No distress flags provided.";

  const propertyContext = body.sqft
    ? `Property: ${body.propertyType ?? "single-family"}, ${body.beds}bd/${body.baths}ba, ${body.sqft} sqft, built ${body.yearBuilt}.`
    : "";

  const prompt = `You are a sharp, experienced real estate wholesaler underwriting a deal. Analyze this deal and return ONLY a JSON object — no markdown, no explanation outside the JSON.

DEAL SUMMARY
------------
Property: ${address}
${propertyContext}
Owner: ${body.ownerName ?? "Unknown"}
Motivation Score: ${body.motivationScore ?? "N/A"}/10
${distressContext}

NUMBERS
-------
ARV (After Repair Value): $${arv.toLocaleString()}
Repair Estimate: $${repairs.toLocaleString()}
Purchase Price: $${purchasePrice.toLocaleString()}
Wholesaler Fee: ${feePercent}% ($${Math.round(feeAmount).toLocaleString()})
MAO (70% Rule): $${Math.round(mao).toLocaleString()}
Spread (MAO − Purchase): $${Math.round(spread).toLocaleString()}
Estimated Profit: $${Math.round(profit).toLocaleString()} (${profitMargin}% of ARV)

TASK
----
Return a JSON object with exactly this shape:
{
  "recommendation": "pursue" | "negotiate" | "pass",
  "verdict": "<one direct sentence — the bottom line on this deal>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "risks": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "commentary": "<2-3 sentence sharp take — what makes or breaks this deal, and what the buyer should watch out for>"
}

Rules:
- "pursue" if the deal clearly works at purchase price (spread ≥ $20k, profit margin ≥ 15%)
- "negotiate" if the numbers are close but not there yet, or if the spread is thin
- "pass" if the deal is underwater or the spread is negative
- Be direct and blunt — this is internal deal analysis, not marketing copy
- Strengths and risks must be specific to these numbers, not generic platitudes`;

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

    // Strip markdown code fences if Claude wraps it anyway
    const jsonStr = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const analysis: DealAnalysis = JSON.parse(jsonStr);

    return NextResponse.json(analysis);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
