"use client";

import { useRef } from "react";
import type { Paper } from "@/lib/papers";

interface Props {
  papers: Paper[];
  currentId: string;
  onSelectPaper: (idx: number) => void;
  onUpload: (file: File) => void;
  everosOnline: boolean;
  progressByPaper: Record<string, number>;
}

export default function Sidebar({
  papers,
  currentId,
  onSelectPaper,
  onUpload,
  everosOnline,
  progressByPaper,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const currentIdx = papers.findIndex((p) => p.id === currentId);
  const current = papers[currentIdx];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-mark">✦</span>
        <div>
          <div className="logo-name">Gloss</div>
          <div className="logo-tag">Read. Understand. Remember.</div>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
          e.target.value = "";
        }}
      />
      <button className="upload-btn" onClick={() => fileRef.current?.click()}>
        ＋ Upload PDF
      </button>

      <div className="sidebar-divider" />

      {current && (
        <div className="sidebar-section">
          <div className="section-label">Current paper</div>
          <div className="paper-item current">
            <div className="paper-item-title">{current.title}</div>
            {current.authors && <div className="paper-item-sub">{current.authors}</div>}
            <div className="paper-progress">
              <div
                className="paper-progress-fill"
                style={{ width: `${Math.round((progressByPaper[current.id] ?? 0) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {papers.length > 1 && (
        <div className="sidebar-section">
          <div className="section-label">Other papers</div>
          {papers.map((p, i) =>
            p.id === currentId ? null : (
              <button key={p.id} className="paper-item" onClick={() => onSelectPaper(i)}>
                <div className="paper-item-title">{p.shortTitle}</div>
                {p.authors && <div className="paper-item-sub">{p.authors}</div>}
                <div className="paper-progress">
                  <div
                    className="paper-progress-fill"
                    style={{ width: `${Math.round((progressByPaper[p.id] ?? 0) * 100)}%` }}
                  />
                </div>
              </button>
            )
          )}
        </div>
      )}

      <div className="sidebar-spacer" />

      <div className="profile-card">
        <div className="profile-head">
          <span className="profile-icon">◐</span> Your Learning Profile
        </div>
        <dl className="profile-list">
          <div><dt>Field</dt><dd>Neuroscience</dd></div>
          <div><dt>Goal</dt><dd>Understand ML/RL</dd></div>
          <div><dt>Style</dt><dd>Short, analogy-first</dd></div>
        </dl>
      </div>

      <div className="everos-status">
        <span className={`status-dot ${everosOnline ? "online" : ""}`} />
        EverOS Memory
        <span className="sync-note">{everosOnline ? "· Synced" : "· offline"}</span>
      </div>
    </aside>
  );
}
