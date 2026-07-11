"use client";

import { useEffect, useState } from "react";

interface EverosEpisode {
  id?: string;
  summary?: string;
  episode?: string;
  timestamp?: number | string;
}

interface MemoryData {
  learner_id: string;
  concepts: Record<
    string,
    { status: string; understanding: string; from_paper: string; last_seen: string }
  >;
  everos?: {
    enabled: boolean;
    episodes: EverosEpisode[];
    profiles: { profile_data?: unknown; explicit_info?: unknown }[];
  };
}

interface Props {
  open: boolean;
  refreshKey: number;
  lastExcerpt: Record<string, unknown> | null;
  onClose: () => void;
}

export default function MemoryReveal({ open, refreshKey, lastExcerpt, onClose }: Props) {
  const [record, setRecord] = useState<MemoryData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/memory")
      .then((r) => r.json())
      .then(setRecord)
      .catch(() => setRecord(null))
      .finally(() => setLoading(false));
  }, [open, refreshKey]);

  if (!open) return null;

  const everos = record?.everos;

  return (
    <div className="reveal-backdrop" onClick={onClose}>
      <div className="reveal" onClick={(e) => e.stopPropagation()}>
        <div className="panel-head">
          <span className="panel-kicker">Memory Reveal — raw EverOS record</span>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {everos && (
          <div className={`everos-status-line ${everos.enabled ? "on" : "off"}`}>
            <span className="status-dot online" /> EverOS Cloud —{" "}
            {everos.enabled ? "connected" : "not configured"}
            {everos.enabled && ` · ${everos.episodes.length} episodes · ${everos.profiles.length} profile`}
          </div>
        )}

        {lastExcerpt && (
          <>
            <h4>Recalled for the last explanation</h4>
            <pre className="reveal-json">{JSON.stringify(lastExcerpt, null, 2)}</pre>
          </>
        )}

        {everos?.enabled && everos.episodes.length > 0 && (
          <>
            <h4>Episodic memories in EverOS</h4>
            <ul className="everos-episodes">
              {everos.episodes.map((e, i) => (
                <li key={e.id ?? i}>{e.summary ?? e.episode}</li>
              ))}
            </ul>
          </>
        )}

        {everos?.enabled && everos.profiles.length > 0 && (
          <>
            <h4>Learner profile (extracted by EverOS)</h4>
            <pre className="reveal-json">{JSON.stringify(everos.profiles[0], null, 2)}</pre>
          </>
        )}

        {record && (
          <>
            <h4>Confirmed concepts (session state)</h4>
            <div className="concept-grid">
              {Object.entries(record.concepts).map(([id, c]) => (
                <div key={id} className={`concept-chip ${c.status}`}>
                  <strong>{id.replace(/_/g, " ")}</strong>
                  <span>{c.status}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {loading && <p className="muted">Loading memory…</p>}
      </div>
    </div>
  );
}
