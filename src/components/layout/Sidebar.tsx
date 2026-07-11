"use client";

import { PAPERS, type Paper } from "@/lib/papers";

const NAV = [
  { icon: "▤", label: "Library", active: true },
  { icon: "◈", label: "Knowledge Graph" },
  { icon: "✎", label: "Notes" },
  { icon: "◉", label: "Memory" },
  { icon: "⚙", label: "Settings" },
];

interface Props {
  current: Paper;
  onSelectPaper: (idx: number) => void;
  everosOnline: boolean;
}

export default function Sidebar({ current, onSelectPaper, everosOnline }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-mark">G</span>
        <div>
          <div className="logo-name">Gloss</div>
          <div className="logo-tag">understanding that compounds</div>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Primary">
        {NAV.map((n) => (
          <button key={n.label} className={`nav-item ${n.active ? "active" : ""}`}>
            <span className="nav-icon" aria-hidden>
              {n.icon}
            </span>
            {n.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <div className="section-label">Current paper</div>
        <div className="paper-current">{current.title}</div>
      </div>

      <div className="sidebar-section">
        <div className="section-label">Other papers</div>
        {PAPERS.map((p, i) =>
          p.id === current.id ? null : (
            <button key={p.id} className="paper-other" onClick={() => onSelectPaper(i)}>
              {p.shortTitle}
            </button>
          )
        )}
      </div>

      <div className="sidebar-spacer" />

      <div className="learner-card">
        <div className="learner-avatar">S</div>
        <div>
          <div className="learner-name">Sam</div>
          <div className="learner-role">1st-yr Neuroscience PhD</div>
        </div>
      </div>

      <div className="everos-status">
        <span className={`status-dot ${everosOnline ? "online" : ""}`} />
        EverOS {everosOnline ? "connected" : "offline"}
        <span className="sync-note">· synced</span>
      </div>
    </aside>
  );
}
