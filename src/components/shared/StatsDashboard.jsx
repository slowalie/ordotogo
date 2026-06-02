import React from 'react';

export function StatsCard({ label, value, icon, bgColor = '#f3f4f6', iconColor = '#111', onClick, trend }) {
  return (
    <div className="stat-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="stat-info">
        <div className="stat-icon-lg" style={{ background: bgColor, color: iconColor }}>{icon}</div>
        <div>
          <p className="stat-lbl-lg">{label}</p>
          <p className="stat-val-lg">{value}</p>
          {trend && <p className="stat-trend">{trend}</p>}
        </div>
      </div>
    </div>
  );
}

export default function StatsDashboard({ stats = [], columns = 3, className = '' }) {
  const gridClass = columns === 2 ? 'stats-grid-2' : columns === 4 ? 'stats-grid-4' : 'stats-grid-3';
  return (
    <div className={`stats-grid ${gridClass} ${className}`}>
      {stats.map((s, i) => (
        <StatsCard key={i} {...s} />
      ))}
    </div>
  );
}
