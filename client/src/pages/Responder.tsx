import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { fetchResponders, acceptIncident, advanceIncident } from "../api.js";
import { useLiveIncidents } from "../hooks/useLiveIncidents.js";
import { useResponderOffers } from "../hooks/useResponderOffers.js";
import { IncidentStatus, type Responder, type Incident } from "campus-shield-shared";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const NEXT_LABEL: Partial<Record<IncidentStatus, string>> = {
  [IncidentStatus.REPORTED]: "Accept",
  [IncidentStatus.ACKNOWLEDGED]: "Mark Dispatched",
  [IncidentStatus.DISPATCHED]: "Mark On-Site",
  [IncidentStatus.ON_SITE]: "Resolve",
};

function IncidentCard({
  incident, responderId, onAction,
}: { incident: Incident; responderId: string; onAction: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    setLoading(true);
    try {
      if (incident.status === IncidentStatus.REPORTED) {
        await acceptIncident(incident.id, responderId);
      } else {
        await advanceIncident(incident.id, responderId);
      }
      onAction();
    } finally {
      setLoading(false);
    }
  };

  const label = NEXT_LABEL[incident.status];
  if (!label) return null;

  return (
    <div style={{
      border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
      padding: "var(--space-4)", background: "var(--color-surface)",
      display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <div>
        <p style={{ fontWeight: 700 }}>{incident.type} — {incident.priority}</p>
        <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>{incident.locationLabel}</p>
        <p style={{ fontSize: "var(--font-size-sm)" }}>Status: {incident.status}</p>
      </div>
      <button onClick={handleAction} disabled={loading}
        style={{
          padding: "var(--space-2) var(--space-4)", background: "var(--color-primary)", color: "#fff",
          border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", fontWeight: 600,
          opacity: loading ? 0.6 : 1,
        }}>
        {loading ? "..." : label}
      </button>
    </div>
  );
}

export default function Responder() {
  const [responders, setResponders] = useState<Responder[]>([]);
  const [responderId, setResponderId] = useState<string | null>(
    () => localStorage.getItem("campusShield_responderId")
  );
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const incidents = useLiveIncidents();
  const myAssigned = incidents.filter(i => i.assignedResponderId === responderId &&
    i.status !== IncidentStatus.RESOLVED);
  const offers = useResponderOffers(incidents, responders, responderId);
  const myIncidents = [...new Map([...offers, ...myAssigned].map(i => [i.id, i])).values()];

  useEffect(() => {
    fetchResponders().then(setResponders).catch(console.error);
  }, []);

  const handleSelectResponder = useCallback((id: string) => {
    localStorage.setItem("campusShield_responderId", id);
    setResponderId(id);
  }, []);

  const handleAction = useCallback(() => {
    // WS will update incidents automatically
  }, []);

  if (!responderId) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "var(--space-6)" }}>
        <h1 style={{ fontSize: "var(--font-size-2xl)", fontWeight: 700, marginBottom: "var(--space-6)" }}>
          🚑 Responder Login
        </h1>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {responders.map(r => (
            <button key={r.id} onClick={() => handleSelectResponder(r.id)}
              style={{
                padding: "var(--space-4)", border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)", background: "var(--color-surface)",
                textAlign: "left", cursor: "pointer",
              }}>
              <p style={{ fontWeight: 600 }}>{r.name}</p>
              <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
                {r.role} — {r.available ? "✅ Available" : "🔴 Busy"}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const me = responders.find(r => r.id === responderId);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "var(--space-4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
        <h1 style={{ fontSize: "var(--font-size-xl)", fontWeight: 700 }}>
          Responder: {me?.name ?? responderId}
        </h1>
        <button onClick={() => { localStorage.removeItem("campusShield_responderId"); setResponderId(null); }}
          style={{ background: "none", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "var(--space-2) var(--space-3)", fontSize: "var(--font-size-sm)" }}>
          Switch
        </button>
      </div>

      {selectedIncident && (
        <div style={{ height: 300, borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--color-border)", marginBottom: "var(--space-4)" }}>
          <MapContainer center={[selectedIncident.lat, selectedIncident.lng]} zoom={16} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://openstreetmap.org">OSM</a>' />
            <Marker position={[selectedIncident.lat, selectedIncident.lng]}>
              <Popup>{selectedIncident.locationLabel} — {selectedIncident.type}</Popup>
            </Marker>
          </MapContainer>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {myIncidents.length === 0 && (
          <p style={{ color: "var(--color-text-muted)", textAlign: "center", padding: "var(--space-8)" }}>
            No incidents assigned to you.
          </p>
        )}
        {myIncidents.map(inc => (
          <div key={inc.id} onClick={() => setSelectedIncident(inc)} style={{ cursor: "pointer" }}>
            <IncidentCard incident={inc} responderId={responderId} onAction={handleAction} />
          </div>
        ))}
      </div>
    </div>
  );
}
