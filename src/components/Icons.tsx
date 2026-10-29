import React from 'react';

export const TvIcon: React.FC<{ className?: string }> = ({ className = 'icon' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="13" rx="3" />
    <path d="M8 21h8m-4-4v4" />
  </svg>
);

export const CheckIcon: React.FC<{ className?: string }> = ({ className = 'icon' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="m5 12 4 4L19 6" />
  </svg>
);

export const ArrowIcon: React.FC<{ className?: string }> = ({ className = 'icon' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14m-5-5 5 5-5 5" />
  </svg>
);

export const LockIcon: React.FC<{ className?: string }> = ({ className = 'icon' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="10" width="14" height="11" rx="3" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
  </svg>
);

export const ShieldIcon: React.FC<{ className?: string }> = ({ className = 'icon' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z" />
    <path d="m8 12 3 3 5-6" />
  </svg>
);

export const ChevronIcon: React.FC<{ className?: string }> = ({ className = 'icon' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const HelpIcon: React.FC<{ className?: string }> = ({ className = 'icon' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 8.5a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4M12 16h.01" />
  </svg>
);

export const ActivityIcon: React.FC<{ className?: string }> = ({ className = 'icon' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12h4l3-8 4 16 3-8h4" />
  </svg>
);

export const CoffeeIcon: React.FC<{ className?: string }> = ({ className = 'icon' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 8h12v7a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5zm12 1h2a3 3 0 0 1 0 6h-2M8 3v2m4-2v2" />
  </svg>
);

export const StarIcon: React.FC<{ className?: string }> = ({ className = 'icon' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9z" />
  </svg>
);
