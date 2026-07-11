"use client";

export interface Highlight {
  text: string;
  paper: string;
}

interface Props {
  conceptsLearned: number;
  connectionsMade: number;
  papersRead: number;
  progress: number; // 0..1
  highlights: Highlight[];
}

export default function BottomDashboard({
  conceptsLearned,
  connectionsMade,
  papersRead,
  progress,
  highlights,
}: Props) {
  const pct = Math.round(progress * 100);
  const r = 20;
  const circ = 2 * Math.PI * r;

  return (
    <footer className="dashboard">
      <div className="dash-group">
        <div className="dash-title">Today&apos;s progress</div>
        <div className="dash-stats">
          <div className="ring-card">
            <svg viewBox="0 0 52 52" className="ring" aria-hidden>
              <circle cx="26" cy="26" r={r} className="ring-bg" />
              <circle
                cx="26"
                cy="26"
                r={r}
                className="ring-fg"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - progress)}
              />
            </svg>
            <span className="ring-pct">{pct}%</span>
          </div>
          <div className="dash-metric">
            <div className="dash-value">{conceptsLearned}</div>
            <div className="dash-label">Concepts learned</div>
          </div>
          <div className="dash-metric">
            <div className="dash-value">{connectionsMade}</div>
            <div className="dash-label">Connections made</div>
          </div>
          <div className="dash-metric">
            <div className="dash-value">{papersRead}</div>
            <div className="dash-label">Papers read</div>
          </div>
        </div>
      </div>

      <div className="dash-group highlights-group">
        <div className="dash-title">Recent highlights</div>
        <div className="highlight-chips">
          {highlights.length === 0 && <span className="dash-empty">Highlights appear here.</span>}
          {highlights.slice(0, 4).map((h, i) => (
            <div key={i} className="highlight-chip">
              <div className="highlight-text">{h.text}</div>
              <div className="highlight-paper">{h.paper}</div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
