import React from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  accent?: 'green' | 'accent' | 'warning' | 'danger';
  icon?: React.ReactNode;
  delay?: number;
}

const KpiCard: React.FC<KpiCardProps> = ({
  label, value, change, changeType = 'neutral', accent = 'green', icon, delay = 0,
}) => (
  <div
    className={`kpi-card ${accent}`}
    style={{ animationDelay: `${delay}s`, opacity: 0, animation: `fadeInUp 0.4s ease ${delay}s forwards` }}
  >
    <div className="kpi-label">
      <span>{label}</span>
      {icon && <span className="icon">{icon}</span>}
    </div>
    <div className="kpi-value">{value}</div>
    {change && (
      <div className={`kpi-change ${changeType}`}>{change}</div>
    )}
  </div>
);

export default KpiCard;
