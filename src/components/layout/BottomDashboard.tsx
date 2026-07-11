"use client";

interface Props {
  conceptsLearned: number;
  connectionsMade: number;
  papersRead: number;
  progress: number; // 0..1
}

export default function BottomDashboard({
  conceptsLearned,
  connectionsMade,
  papersRead,
  progress,
}: Props) {
  return (
    <footer className="dashboard">
      <div className="dash-card progress-card">
        <div className="dash-label">Progress</div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
        <div className="dash-sub">{Math.round(progress * 100)}% this session</div>
      </div>

      <div className="dash-card">
        <div className="dash-value">{conceptsLearned}</div>
        <div className="dash-label">Concepts learned</div>
      </div>

      <div className="dash-card">
        <div className="dash-value">{connectionsMade}</div>
        <div className="dash-label">Connections made</div>
      </div>

      <div className="dash-card">
        <div className="dash-value">{papersRead}</div>
        <div className="dash-label">Papers read</div>
      </div>
    </footer>
  );
}
