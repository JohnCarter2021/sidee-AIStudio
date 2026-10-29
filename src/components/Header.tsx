import React from 'react';
import { TVDevice } from '../types';

interface HeaderProps {
  linked: boolean;
  tv: TVDevice | null;
  statusText: string;
  onOpenSettings: () => void;
  onForgetTV?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  linked,
  tv,
  statusText,
  onOpenSettings,
}) => {
  return (
    <header className="top">
      <div className="shell top-inner">
        <div className="brand">
          <img className="logo" src="/assets/sidee-logo.png" alt="Sidee" width="46" height="46" />
          <div>
            <div className="brand-name">Sidee</div>
            <div className="brand-by">For VIDAA TVs</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className={`status ${linked ? 'on' : ''}`} id="statusChip" title={tv ? tv.host : undefined}>
            <span className="status-dot"></span>
            <span id="tvchip" role="status">
              {statusText}
            </span>
          </div>

          <button
            className="button secondary"
            onClick={onOpenSettings}
            title="Settings & Diagnostics"
            aria-label="Open settings and diagnostics"
            style={{
              minHeight: '36px',
              padding: '6px 12px',
              borderRadius: '100px',
              fontSize: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
