import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import {
  createIncident, fetchConfig, fetchIncident,
} from "../api.js";
import {
  IncidentType, IncidentStatus, type Incident, type CampusConfig, type Building,
} from "campus-shield-shared";
import "leaflet/dist/leaflet.css";

// Fix leaflet default icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const TYPES: { label: string; value: IncidentType; emoji: string }[] = [
  { label: "Medical", value: IncidentType.MEDICAL, emoji: "🏥" },
  { label: "Fire", value: IncidentType.FIRE, emoji: "🔥" },
  { label: "Threat", value: IncidentType.THREAT, emoji: "⚠️" },
  { label: "Accident", value: IncidentType.ACCIDENT, emoji: "🚗" },
];

const STATUS_STEPS = [
  IncidentStatus.REPORTED,
  IncidentStatus.ACKNOWLEDGED,
  IncidentStatus.DISPATCHED,
  IncidentStatus.ON_SITE,
  IncidentStatus.RESOLVED,
];

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function nearestBuilding(lat: number, lng: number, buildings: Building[]): Building {
  return buildings.reduce((best, b) =>
    haversine(lat, lng, b.lat, b.lng) < haversine(lat, lng, best.lat, best.lng) ? b : best
  );
}

function DraggableMarker({
  lat, lng, onChange,
}: { lat: number; lng: number; onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) { onChange(e.latlng.lat, e.latlng.lng); },
  });
  return <Marker position={[lat, lng]} draggable eventHandlers={{
    dragend(e) {
      const m = e.target as L.Marker;
      const { lat: la, lng: ln } = m.getLatLng();
      onChange(la, ln);
    },
  }} />;
}

function LiveTracker({ incidentId, config }: { incidentId: string; config: CampusConfig }) {
  const [incident, setIncident] = useState<Incident | null>(null);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const inc = await fetchIncident(incidentId);
        if (alive) setIncident(inc);
      } catch { /* ignore */ }
    };
    poll();
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${proto}//${window.location.host}/ws`);
    ws.onmessage = (ev: MessageEvent) => {
      const msg = JSON.parse(ev.data as string) as { type: string; payload: Incident };
      if (msg.type === "incident" && msg.payload.id === incidentId) {
        if (alive) setIncident(msg.payload);
      }
    };
    return () => { alive = false; ws.close(); };
  }, [incidentId]);

  if (!incident) return <p style={{ padding: "var(--space-4)" }}>Loading...</p>;

  const stepIdx = STATUS_STEPS.indexOf(incident.status);
  const instructions = config.instructions[incident.type] ?? [];
  const nearest = config.safePoints.reduce((best, sp) =>
    haversine(incident.lat, incident.lng, sp.lat, sp.lng) <
    haversine(incident.lat, incident.lng, best.lat, best.lng) ? sp : best
  );

  return (
    <div style={{ padding: "var(--space-4)", maxWidth: 600, margin: "0 auto" }}>
      <h2 style={{ marginBottom: "var(--space-4)", fontSize: "var(--font-size-xl)" }}>
        Incident Tracking — {incident.locationLabel}
      </h2>

      <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-6)", overflowX: "auto" }}>
        {STATUS_STEPS.map((s, i) => (
          <div key={s} style={{
            padding: "var(--space-2) var(--space-3)",
            borderRadius: "var(--radius-full)",
            background: i <= stepIdx ? "var(--color-primary)" : "var(--color-border)",
            color: i <= stepIdx ? "#fff" : "var(--color-text-muted)",
            fontSize: "var(--font-size-sm)",
            whiteSpace: "nowrap",
            fontWeight: i === stepIdx ? 700 : 400,
          }}>
            {s.replace("_", " ")}
          </div>
        ))}
      </div>

      <div style={{
        background: "var(--color-surface-alt)", borderRadius: "var(--radius-md)",
        padding: "var(--space-4)", marginBottom: "var(--space-4)"
      }}>
        <h3 style={{ marginBottom: "var(--space-2)" }}>📍 Nearest Safe Point</h3>
        <p style={{ fontWeight: 600 }}>{nearest.name}</p>
        <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
          {(haversine(incident.lat, incident.lng, nearest.lat, nearest.lng) * 1000).toFixed(0)}m away
        </p>
      </div>

      <div style={{ background: "var(--color-surface-alt)", borderRadius: "var(--radius-md)", padding: "var(--space-4)" }}>
        <h3 style={{ marginBottom: "var(--space-2)" }}>📋 Instructions</h3>
        <ol style={{ paddingLeft: "var(--space-6)" }}>
          {instructions.map((step, i) => (
            <li key={i} style={{ marginBottom: "var(--space-2)", lineHeight: 1.6 }}>{step}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default function Report() {
  const [config, setConfig] = useState<CampusConfig | null>(null);
  const [selectedType, setSelectedType] = useState<IncidentType | null>(null);
  const [isSos, setIsSos] = useState(false);
  const [lat, setLat] = useState(28.4723);
  const [lng, setLng] = useState(77.4939);
  const [locationLabel, setLocationLabel] = useState("Library Block");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [incidentId, setIncidentId] = useState<string | null>(
    () => localStorage.getItem("campusShield_incidentId")
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig().then(setConfig).catch(console.error);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        if (!config) return;
        const nearest = nearestBuilding(pos.coords.latitude, pos.coords.longitude, config.buildings);
        setLat(nearest.lat);
        setLng(nearest.lng);
        setLocationLabel(nearest.name);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBuildingSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!config) return;
    const building = config.buildings.find(b => b.id === e.target.value);
    if (!building) return;
    setLat(building.lat);
    setLng(building.lng);
    setLocationLabel(building.name);
  }, [config]);

  const handleMapChange = useCallback((la: number, ln: number) => {
    setLat(la);
    setLng(ln);
    if (config) {
      const nearest = nearestBuilding(la, ln, config.buildings);
      setLocationLabel(nearest.name);
    }
  }, [config]);

  const handleSubmit = useCallback(async () => {
    if (!selectedType && !isSos) return;
    const type = selectedType ?? IncidentType.MEDICAL;
    setSubmitting(true);
    setError(null);
    try {
      const inc = await createIncident({ type, isSos, lat, lng, locationLabel, note });
      localStorage.setItem("campusShield_incidentId", inc.id);
      setIncidentId(inc.id);
    } catch (e) {
      setError(String(e));
    } finally {
      setSubmitting(false);
    }
  }, [selectedType, isSos, lat, lng, locationLabel, note]);

  if (incidentId && config) {
    return (
      <>
        <LiveTracker incidentId={incidentId} config={config} />
        <div style={{ textAlign: "center", padding: "var(--space-4)" }}>
          <button onClick={() => { localStorage.removeItem("campusShield_incidentId"); setIncidentId(null); }}
            style={{ background: "none", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "var(--space-2) var(--space-4)", fontSize: "var(--font-size-sm)" }}>
            Report New Incident
          </button>
        </div>
      </>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "var(--space-4)" }}>
      <h1 style={{ textAlign: "center", fontSize: "var(--font-size-2xl)", fontWeight: 700, marginBottom: "var(--space-6)" }}>
        🛡️ CampusShield
      </h1>

      {/* SOS Button */}
      <button onClick={() => { setIsSos(true); setSelectedType(IncidentType.MEDICAL); }}
        style={{
          width: "100%", padding: "var(--space-6)", fontSize: "var(--font-size-3xl)",
          background: "var(--color-sos)", color: "#fff", border: "none",
          borderRadius: "var(--radius-lg)", fontWeight: 900, marginBottom: "var(--space-6)",
          boxShadow: "var(--shadow-lg)", cursor: "pointer",
        }}>
        🆘 SOS
      </button>

      <p style={{ textAlign: "center", color: "var(--color-text-muted)", marginBottom: "var(--space-4)", fontSize: "var(--font-size-sm)" }}>
        — or select incident type —
      </p>

      {/* Type Buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
        {TYPES.map(t => (
          <button key={t.value} onClick={() => { setSelectedType(t.value); setIsSos(false); }}
            style={{
              padding: "var(--space-4)", fontSize: "var(--font-size-xl)",
              border: selectedType === t.value ? "2px solid var(--color-primary)" : "2px solid var(--color-border)",
              borderRadius: "var(--radius-md)", background: selectedType === t.value ? "#eff6ff" : "var(--color-surface)",
              cursor: "pointer",
            }}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* Location */}
      {config && (
        <div style={{ marginBottom: "var(--space-4)" }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: "var(--space-2)" }}>📍 Location</label>
          <select onChange={handleBuildingSelect} value={config.buildings.find(b => b.name === locationLabel)?.id ?? ""}
            style={{ width: "100%", padding: "var(--space-3)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", marginBottom: "var(--space-3)" }}>
            {config.buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <div style={{ height: 200, borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--color-border)" }}>
            <MapContainer center={[lat, lng]} zoom={16} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://openstreetmap.org">OSM</a>' />
              <DraggableMarker lat={lat} lng={lng} onChange={handleMapChange} />
            </MapContainer>
          </div>
        </div>
      )}

      {/* Note */}
      <div style={{ marginBottom: "var(--space-6)" }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: "var(--space-2)" }}>📝 Note (optional)</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
          placeholder="Describe the situation..."
          style={{ width: "100%", padding: "var(--space-3)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", resize: "vertical" }} />
      </div>

      {error && <p style={{ color: "var(--color-critical)", marginBottom: "var(--space-4)" }}>{error}</p>}

      <button onClick={handleSubmit} disabled={submitting || (!selectedType && !isSos)}
        style={{
          width: "100%", padding: "var(--space-4)", fontSize: "var(--font-size-lg)",
          background: "var(--color-primary)", color: "#fff", border: "none",
          borderRadius: "var(--radius-md)", fontWeight: 700, opacity: submitting || (!selectedType && !isSos) ? 0.5 : 1,
        }}>
        {submitting ? "Submitting..." : "Report Incident"}
      </button>
    </div>
  );
}
