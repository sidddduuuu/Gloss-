"use client";

import type { ExplainResponse } from "@/lib/contract";

interface Props {
  loading: boolean;
  data: ExplainResponse | null;
  confirmed: boolean;
  onGotIt: () => void;
  onViewInGraph: () => void;
}

export default function ExplanationPanel({
  loading,
  data,
  confirmed,
  onGotIt,
  onViewInGraph,
}: Props) {
  return (
    <section className="ai-panel">
      <div className="ai-header">Explain</div>

      <div className="ai-body">
        {loading && (
          <div className="ai-loading">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
            <p>Reading the passage and your history…</p>
          </div>
        )}

        {!loading && !data && (
          <div className="ai-empty">
            Highlight a passage and tap <strong>Explain</strong> to begin.
          </div>
        )}

        {!loading && data && (
          <>
            {data.resume_note && <p className="resume-note">↩ {data.resume_note}</p>}

            <div className={`grounded-badge ${data.grounded ? "" : "warn"}`}>
              {data.grounded ? "✓ Grounded in this paper" : "⚠ Low confidence"}
            </div>

            {data.built_on.length > 0 && (
              <article className="card built-on-card">
                <div className="built-on-head">Built on your knowledge</div>
                <div className="built-on-row">
                  <span className="built-on-check">✓</span>
                  <div>
                    <div className="built-on-concept">
                      {data.built_on[0].concept.replace(/_/g, " ")}
                    </div>
                    <div className="built-on-meta">
                      Previously mastered · from {data.built_on[0].from_paper}
                    </div>
                  </div>
                </div>
                <button className="link-btn" onClick={onViewInGraph}>
                  View in graph →
                </button>
              </article>
            )}

            <article className="card explanation-card">
              {data.title && <h3 className="card-title">{data.title}</h3>}
              <p className="explanation-text">{data.explanation}</p>
            </article>

            {data.analogy && (
              <article className="card analogy-card">
                <div className="analogy-kicker">Analogy</div>
                <p>{data.analogy}</p>
              </article>
            )}

            {data.new_concept && (
              <button className="cta" onClick={onGotIt} disabled={confirmed}>
                {confirmed ? "✓ Added to your understanding" : "Add to Understanding"}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
