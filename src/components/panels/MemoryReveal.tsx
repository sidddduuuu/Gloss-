"use client";

import { useEffect, useState } from "react";

interface LearnerRecord {
  learner_id: string;
  style: { length: string; approach: string; struggles: string[] };
  concepts: Record<
    string,
    { status: string; understanding: string; from_paper: string; last_seen: string }
  >;
  sessions: { date: string; summary: string }[];
}

interface Props {
  open: boolean;
  refreshKey: number;
  lastExcerpt: Record<string, unknown> | null;
  onClose: () => void;
}

export default function MemoryReveal({ open, refreshKey, lastExcerpt, onClose }: Props) {
  const [record, setRecord] = useState<LearnerRecord | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/memory")
      .then((r) => r.json())
      .then(setRecord)
      .catch(() => setRecord(null));
  }, [open, refreshKey]);

  if (!open) return null;

  return (
    <div className="reveal-backdrop" onClick={onClose}>
      <div className="reveal" onClick={(e) => e.stopPropagation()}>
        <div className="panel-head">
          <span className="panel-kicker">Memory Reveal — raw EverOS record</span>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {lastExcerpt && (
          <>
            <h4>Recalled for the last explanation</h4>
            <pre className="reveal-json">{JSON.stringify(lastExcerpt, null, 2)}</pre>
          </>
        )}

        {record && (
          <>
            <h4>Full learner memory</h4>
            <div className="concept-grid">
              {Object.entries(record.concepts).map(([id, c]) => (
                <div key={id} className={`concept-chip ${c.status}`}>
                  <strong>{id.replace(/_/g, " ")}</strong>
                  <span>{c.status}</span>
                </div>
              ))}
            </div>
            <pre className="reveal-json">{JSON.stringify(record, null, 2)}</pre>
          </>
        )}
      </div>
    </div>
  );
}
