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

// Bay Area center — fits Vallejo down to Hayward/Antioch at zoom 10
const BAY_AREA_CENTER: [number, number] = [37.92, -122.10];
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
              weight:      1.5,
              opacity:     1,
              fillOpacity: 0.88,
            }}
          >
            <Popup minWidth={240} maxWidth={300}>
              <div className="text-sm font-sans">
                {/* Address + score */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-semibold text-neutral-900 leading-snug">{lead.address}</p>
                    <p className="text-neutral-500 text-xs mt-0.5">{lead.city}, {lead.zip}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded tabular-nums ${scoreStyle(lead.motivationScore)}`}>
                    {lead.motivationScore}
                  </span>
                </div>

                {/* Key facts */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-neutral-600 mb-2">
                  <span><span className="text-neutral-400">Type</span> {TYPE_LABELS[lead.propertyType]}</span>
                  <span><span className="text-neutral-400">Units</span> {lead.units}</span>
                  <span><span className="text-neutral-400">Equity</span> {lead.equityPercent}%</span>
                  <span><span className="text-neutral-400">Est. Value</span> ${lead.estimatedValue.toLocaleString()}</span>
                </div>

                {/* Status */}
                <div className="mb-2">
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[lead.status]}`}>
                    {STATUS_LABELS[lead.status]}
                  </span>
                </div>

                {/* Distress badges */}
                {signals.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2 border-t border-neutral-100">
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
