"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Lead } from "@/types/lead";
import {
  TYPE_LABELS,
  STATUS_LABELS,
  STATUS_STYLES,
  DISTRESS_FLAGS,
  scoreColor,
  scoreStyle,
} from "@/lib/leadHelpers";

interface MapViewProps {
  leads: Lead[];
}

const BAY_AREA_CENTER: [number, number] = [37.92, -122.1];
const DEFAULT_ZOOM = 10;

export default function MapView({ leads }: MapViewProps) {
  return (
    <MapContainer
      center={BAY_AREA_CENTER}
      zoom={DEFAULT_ZOOM}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {leads.map((lead) => {
        const signals = DISTRESS_FLAGS.filter((f) => lead[f.key] === true);
        const color   = scoreColor(lead.motivationScore);

        return (
          <CircleMarker
            key={lead.id}
            center={[lead.lat, lead.lng]}
            radius={9}
            pathOptions={{
              fillColor:   color,
              color:       "#fff",
              weight:      2,
              opacity:     1,
              fillOpacity: 0.88,
            }}
          >
            <Popup minWidth={240} maxWidth={300}>
              <div style={{ fontFamily: "sans-serif", fontSize: "13px" }}>
                {/* Address + score */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "8px" }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, color: "#111827" }}>{lead.address}</p>
                    <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#6b7280" }}>{lead.city}, {lead.zip}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded tabular-nums ${scoreStyle(lead.motivationScore)}`}>
                    {lead.motivationScore}
                  </span>
                </div>

                {/* Key facts */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 12px", fontSize: "11px", color: "#374151", marginBottom: "8px" }}>
                  <span><span style={{ color: "#9ca3af" }}>Type </span>{TYPE_LABELS[lead.propertyType]}</span>
                  <span><span style={{ color: "#9ca3af" }}>Units </span>{lead.units}</span>
                  <span><span style={{ color: "#9ca3af" }}>Equity </span>{lead.equityPercent}%</span>
                  <span><span style={{ color: "#9ca3af" }}>Est. Value </span>${lead.estimatedValue.toLocaleString()}</span>
                </div>

                {/* Status */}
                <div style={{ marginBottom: "6px" }}>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[lead.status]}`}>
                    {STATUS_LABELS[lead.status]}
                  </span>
                </div>

                {/* Distress badges */}
                {signals.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", paddingTop: "8px", borderTop: "1px solid #f3f4f6" }}>
                    {signals.map((s) => (
                      <span
                        key={s.key as string}
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${s.cls}`}
                      >
                        {s.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
