"use client";

import type { ExplainResponse } from "@/lib/contract";

interface Props {
  loading: boolean;
  data: ExplainResponse | null;
  confirmed: boolean;
  onGotIt: () => void;
  onClose: () => void;
}

export default function ExplanationPanel({
  loading,
  data,
  confirmed,
  onGotIt,
  onClose,
}: Props) {
  return (
    <aside className="panel explanation" aria-live="polite">
      <div className="panel-head">
        <span className="panel-kicker">Explanation</span>
        <button className="icon-btn" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      {loading && <p className="muted">Reading the passage and your history…</p>}

      {!loading && data && (
        <>
          {data.resume_note && <p className="resume-note">↩ {data.resume_note}</p>}

          {data.built_on.length > 0 && (
            <div className="built-on">
              Building on what you learned in{" "}
              <strong>{data.built_on[0].from_paper}</strong>
            </div>
          )}

          <p className="explanation-text">{data.explanation}</p>

          <div className="trust-row">
            <span className={`badge ${data.grounded ? "ok" : "warn"}`}>
              {data.grounded ? "grounded in passage" : "low confidence"}
            </span>
          </div>

          {data.new_concept && (
            <button className="gotit" onClick={onGotIt} disabled={confirmed}>
              {confirmed ? "✓ Got it — saved to memory" : "Got it"}
            </button>
          )}
        </>
      )}
    </aside>
  );
}
