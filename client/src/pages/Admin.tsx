import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import {
  fetchMetrics, demoSpawn, demoAdvanceAll, demoFast, demoReset,
} from "../api.js";
import { useLiveIncidents } from "../hooks/useLiveIncidents.js";
import {
  IncidentStatus, IncidentType, Priority,
  type Incident, type MetricsSummary,
} from "campus-shield-shared";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const PRIORITY_COLOR: Record<Priority, string> = {
  [Priority.CRITICAL]: "#dc2626",
  [Priority.HIGH]: "#ea580c",
  [Priority.MEDIUM]: "#ca8a04",
};

function priorityIcon(priority: Priority) {
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${PRIORITY_COLOR[priority]};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function MetricsCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      background: "var(--color-surface)", border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-md)", padding: "var(--space-4)", textAlign: "center",
    }}>
      <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>{label}</p>
      <p style={{ fontSize: "var(--font-size-2xl)", fontWeight: 700 }}>{value}</p>
    </div>
  );
}

function fmt(ms: number | null) {
  if (ms === null) return "—";
  return ms < 60000 ? `${(ms / 1000).toFixed(0)}s` : `${(ms / 60000).toFixed(1)}m`;
}

export default function Admin() {
  const incidents = useLiveIncidents();
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fastMode, setFastMode] = useState(false);

  const hasL2 = incidents.some(i => i.escalationLevel >= 2 && i.status === IncidentStatus.REPORTED);
  const selectedIncident = incidents.find(i => i.id === selectedId) ?? null;

  const refreshMetrics = useCallback(() => {
    fetchMetrics().then(setMetrics).catch(console.error);
  }, []);

  useEffect(() => {
    refreshMetrics();
    const id = setInterval(refreshMetrics, 5000);
    return () => clearInterval(id);
  }, [refreshMetrics]);

  const handleFastToggle = async () => {
    const next = !fastMode;
    await demoFast(next);
    setFastMode(next);
  };

  const handleSpawn = async (type?: IncidentType) => {
    await demoSpawn(type);
    refreshMetrics();
  };

  const handleAdvanceAll = async () => {
    await demoAdvanceAll();
    refreshMetrics();
  };

  const handleReset = async () => {
    await demoReset();
    setMetrics(null);
    refreshMetrics();
  };

  const mapCenter: [number, number] = [28.4723, 77.4939];

  return (
    <div style={{ padding: "var(--space-4)", maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ fontSize: "var(--font-size-2xl)", fontWeight: 700, marginBottom: "var(--space-4)" }}>
        🛡️ CampusShield Admin
      </h1>

      {hasL2 && (
        <div style={{
          background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "var(--radius-md)",
          padding: "var(--space-4)", marginBottom: "var(--space-4)", color: "#991b1b", fontWeight: 700,
        }}>
          🚨 ESCALATION L2: Critical incidents not acknowledged. All responders alerted.
        </div>
      )}

      {/* Map */}
      <div style={{ height: 400, borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--color-border)", marginBottom: "var(--space-4)" }}>
        <MapContainer center={mapCenter} zoom={15} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://openstreetmap.org">OSM</a>' />
          {incidents.filter(i => i.status !== IncidentStatus.RESOLVED).map(inc => (
            <Marker key={inc.id} position={[inc.lat, inc.lng]} icon={priorityIcon(inc.priority)}
              eventHandlers={{ click: () => setSelectedId(inc.id) }}>
              <Popup>{inc.type} — {inc.locationLabel}<br />{inc.status}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Metrics */}
      {metrics && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
          {Object.values(IncidentStatus).map(s => (
            <MetricsCard key={s} label={s.replace("_", " ")} value={metrics.counts[s] ?? 0} />
          ))}
          <MetricsCard label="Avg Ack Time" value={fmt(metrics.meanTimeToAck)} />
          <MetricsCard label="Med Ack Time" value={fmt(metrics.medianTimeToAck)} />
          <MetricsCard label="Avg Dispatch" value={fmt(metrics.meanTimeToDispatch)} />
        </div>
      )}

      {/* Demo Controls */}
      <div style={{
        background: "var(--color-surface-alt)", border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)", padding: "var(--space-4)", marginBottom: "var(--space-4)",
      }}>
        <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--space-3)" }}>Demo Controls</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
          {Object.values(IncidentType).map(t => (
            <button key={t} onClick={() => handleSpawn(t)}
              style={{ padding: "var(--space-2) var(--space-3)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-surface)", cursor: "pointer" }}>
              Spawn {t}
            </button>
          ))}
          <button onClick={handleAdvanceAll}
            style={{ padding: "var(--space-2) var(--space-3)", background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer" }}>
            Advance All
          </button>
          <button onClick={handleFastToggle}
            style={{ padding: "var(--space-2) var(--space-3)", background: fastMode ? "#16a34a" : "var(--color-surface)", color: fastMode ? "#fff" : "var(--color-text)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer" }}>
            Fast Mode: {fastMode ? "ON" : "OFF"}
          </button>
          <button onClick={handleReset}
            style={{ padding: "var(--space-2) var(--space-3)", background: "#dc2626", color: "#fff", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer" }}>
            Reset
          </button>
        </div>
      </div>

      {/* Incident Table */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden", marginBottom: "var(--space-4)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--color-surface-alt)" }}>
              {["Type", "Priority", "Status", "Location", "Escalation", "Created"].map(h => (
                <th key={h} style={{ padding: "var(--space-3)", textAlign: "left", fontSize: "var(--font-size-sm)", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {incidents.map(inc => (
              <tr key={inc.id} onClick={() => setSelectedId(inc.id === selectedId ? null : inc.id)}
                style={{ borderTop: "1px solid var(--color-border)", cursor: "pointer", background: inc.id === selectedId ? "#eff6ff" : undefined }}>
                <td style={{ padding: "var(--space-3)" }}>{inc.type}</td>
                <td style={{ padding: "var(--space-3)", color: PRIORITY_COLOR[inc.priority], fontWeight: 700 }}>{inc.priority}</td>
                <td style={{ padding: "var(--space-3)" }}>{inc.status.replace("_", " ")}</td>
                <td style={{ padding: "var(--space-3)" }}>{inc.locationLabel}</td>
                <td style={{ padding: "var(--space-3)" }}>L{inc.escalationLevel}</td>
                <td style={{ padding: "var(--space-3)", fontSize: "var(--font-size-sm)" }}>
                  {new Date(inc.createdAt).toLocaleTimeString()}
                </td>
              </tr>
            ))}
            {incidents.length === 0 && (
              <tr><td colSpan={6} style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-muted)" }}>No incidents</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Timeline */}
      {selectedIncident && (
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "var(--space-4)" }}>
          <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--space-3)" }}>
            Timeline: {selectedIncident.locationLabel} ({selectedIncident.type})
          </h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>
            Click rows in the table above to view incident details. Timeline events loaded from server.
          </p>
        </div>
      )}
    </div>
  );
}
