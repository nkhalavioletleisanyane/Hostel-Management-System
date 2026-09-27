import React from 'react';
import './Logo.css';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  showText?: boolean;
  showSubtitle?: boolean;
  subtitle?: string;
  roleBadge?: string;
  className?: string;
  onClick?: () => void;
}

export const LogoIcon: React.FC<{ size?: number; className?: string }> = ({ size = 36, className = '' }) => {
  return (
    <div
      className={`hms-logo-icon-wrapper ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="hms-logo-svg"
      >
        <defs>
          {/* Main Shield / Badge Gradient */}
          <linearGradient id="hms-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="45%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>

          {/* Roof & Spire Accent Gradient */}
          <linearGradient id="hms-accent-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>

          {/* Golden Beacon Gradient */}
          <linearGradient id="hms-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>

          {/* Soft Glow */}
          <filter id="hms-soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#1e1b4b" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Outer Rounded Squircle Frame */}
        <rect
          x="1.5"
          y="1.5"
          width="45"
          height="45"
          rx="12"
          fill="url(#hms-bg-grad)"
          stroke="rgba(255, 255, 255, 0.28)"
          strokeWidth="1.2"
        />

        {/* Subtle Top Inner Highlight */}
        <path
          d="M3 13.5C3 7.7 7.7 3 13.5 3H34.5C40.3 3 45 7.7 45 13.5V17C35 15 20 16 3 21V13.5Z"
          fill="white"
          fillOpacity="0.12"
        />

        {/* Central Campus Emblem Group */}
        <g filter="url(#hms-soft-shadow)">
          {/* Base Foundation / Campus Plinth */}
          <path
            d="M10 37.5H38C38.83 37.5 39.5 36.83 39.5 36C39.5 35.17 38.83 34.5 38 34.5H10C9.17 34.5 8.5 35.17 8.5 36C8.5 36.83 9.17 37.5 10 37.5Z"
            fill="white"
            fillOpacity="0.85"
          />

          {/* Left Residence Wing (West Block) */}
          <path
            d="M11 20.5C11 19.95 11.45 19.5 12 19.5H19V34.5H11V20.5Z"
            fill="white"
            fillOpacity="0.95"
          />
          {/* Left Wing Roof Angle */}
          <path
            d="M10.5 20.5L19 14.5V19.5H11L10.5 20.5Z"
            fill="url(#hms-accent-grad)"
          />

          {/* Right Residence Wing (East Block) */}
          <path
            d="M29 20.5C29 19.95 29.45 19.5 30 19.5H37V34.5H29V20.5Z"
            fill="white"
            fillOpacity="0.95"
          />
          {/* Right Wing Roof Angle */}
          <path
            d="M37.5 20.5L29 14.5V19.5H37L37.5 20.5Z"
            fill="url(#hms-accent-grad)"
          />

          {/* Center Main Tower & Skybridge (Creating the iconic 'H' Architecture) */}
          <path
            d="M19 15.5C19 14.67 19.67 14 20.5 14H27.5C28.33 14 29 14.67 29 15.5V34.5H19V15.5Z"
            fill="white"
          />

          {/* Center Pitched Roof & Spire */}
          <path
            d="M24 8.5L18.5 14.5H29.5L24 8.5Z"
            fill="url(#hms-accent-grad)"
          />

          {/* Center Portal / Gateway Arch */}
          <path
            d="M21.5 34.5V26.5C21.5 25.12 22.62 24 24 24C25.38 24 26.5 25.12 26.5 26.5V34.5H21.5Z"
            fill="#4338ca"
          />

          {/* Center Portal Warm Glow */}
          <path
            d="M22.5 34.5V27.5C22.5 26.67 23.17 26 24 26C24.83 26 25.5 26.67 25.5 27.5V34.5H22.5Z"
            fill="url(#hms-gold-grad)"
          />

          {/* Windows / Balcony Lights (Left Tower) */}
          <rect x="13" y="22" width="4" height="2.5" rx="0.6" fill="#6366f1" />
          <rect x="13" y="26.5" width="4" height="2.5" rx="0.6" fill="#6366f1" />
          <rect x="13" y="31" width="4" height="2.5" rx="0.6" fill="#6366f1" />

          {/* Windows / Balcony Lights (Right Tower) */}
          <rect x="31" y="22" width="4" height="2.5" rx="0.6" fill="#6366f1" />
          <rect x="31" y="26.5" width="4" height="2.5" rx="0.6" fill="#6366f1" />
          <rect x="31" y="31" width="4" height="2.5" rx="0.6" fill="#6366f1" />

          {/* Center Upper Window */}
          <rect x="22" y="17" width="4" height="3.5" rx="0.8" fill="#38bdf8" />

          {/* Guiding Star / Beacon of Excellence above Spire */}
          <path
            d="M24 5.5L24.8 7.3L26.6 8.1L24.8 8.9L24 10.7L23.2 8.9L21.4 8.1L23.2 7.3L24 5.5Z"
            fill="url(#hms-gold-grad)"
          />
        </g>
      </svg>
    </div>
  );
};

const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  showSubtitle = false,
  subtitle = 'Hostel Management System',
  roleBadge,
  className = '',
  onClick,
}) => {
  const iconPixelSize =
    typeof size === 'number'
      ? size
      : size === 'sm'
      ? 34
      : size === 'lg'
      ? 46
      : size === 'xl'
      ? 56
      : 38; // 'md'

  return (
    <div
      className={`hms-logo-brand ${className} ${typeof size === 'string' ? `size-${size}` : ''}`}
      onClick={onClick}
    >
      <LogoIcon size={iconPixelSize} />
      {showText && (
        <div className="hms-logo-text-block">
          <div className="hms-logo-title-row">
            <span className="hms-brand-name">HMS</span>
            {roleBadge && (
              <span className={`nav-role-badge ${roleBadge.toLowerCase()}`}>
                {roleBadge}
              </span>
            )}
          </div>
          {showSubtitle && <span className="hms-brand-subtitle">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};

export default Logo;
