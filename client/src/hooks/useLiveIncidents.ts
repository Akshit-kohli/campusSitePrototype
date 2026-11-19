import { useEffect, useRef, useState, useCallback } from "react";
import { fetchIncidents } from "../api.js";
import type { Incident } from "campus-shield-shared";

const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
const WS_URL = `${proto}//${window.location.host}/ws`;
const MAX_BACKOFF_MS = 30_000;

/** Fetches incidents on mount, merges WS updates, auto-reconnects. */
export function useLiveIncidents(): Incident[] {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const backoffRef = useRef(500);
  const wsRef = useRef<WebSocket | null>(null);

  const merge = useCallback((updated: Incident) => {
    setIncidents(prev => {
      const idx = prev.findIndex(i => i.id === updated.id);
      if (idx === -1) return [updated, ...prev];
      const next = [...prev];
      next[idx] = updated;
      return next;
    });
  }, []);

  const connect = useCallback(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => { backoffRef.current = 500; };

    ws.onmessage = (ev: MessageEvent) => {
      const msg = JSON.parse(ev.data as string) as { type: string; payload: Incident };
      if (msg.type === "incident") merge(msg.payload);
    };

    ws.onclose = () => {
      const delay = backoffRef.current;
      backoffRef.current = Math.min(delay * 2, MAX_BACKOFF_MS);
      setTimeout(() => {
        fetchIncidents().then(setIncidents).catch(() => null);
        connect();
      }, delay);
    };
  }, [merge]);

  useEffect(() => {
    fetchIncidents().then(setIncidents).catch(console.error);
    connect();
    return () => wsRef.current?.close();
  }, [connect]);

  return incidents;
}
