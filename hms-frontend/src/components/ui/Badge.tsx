import React from 'react';

type BadgeVariant = 'active' | 'pending' | 'danger' | 'vacant' | 'full' | 'info' | 'resolved';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({ variant, children }) => (
  <span className={`badge badge-${variant}`}>{children}</span>
);

export default Badge;
