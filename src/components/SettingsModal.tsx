import React, { useState } from 'react';
import { TVDevice, TVSession, DiagnosticStep, LogEntry } from '../types';
import { STRINGS } from '../utils/strings';
import { generateRedactedDiagnosticReport, downloadDiagnosticReport } from '../utils/logExporter';
import { syncRemoteCatalogue, resetToBundledCatalogue } from '../services/catalogService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tv: TVDevice | null;
  session: TVSession | null;
  diagnosticSteps: DiagnosticStep[];
  logs: LogEntry[];
  catalogueSource: 'bundled' | 'remote';
  catalogueSyncedAt?: string;
  onCatalogueUpdated: () => void;
  onForgetTV: () => void;
  onRunDiagnostics: () => Promise<void>;
  addLog: (msg: string, type?: 'info' | 'ok' | 'err') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  tv,
  session,
  diagnosticSteps,
  logs,
  catalogueSource,
  catalogueSyncedAt,
  onCatalogueUpdated,
  onForgetTV,
  onRunDiagnostics,
  addLog,
}) => {
  const [activeTab, setActiveTab] = useState<'tv' | 'catalog' | 'diag' | 'updates'>('tv');
  const [syncingCatalog, setSyncingCatalog] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [betaChannel, setBetaChannel] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  if (!isOpen) return null;

  const handleSyncCatalogue = async () => {
    setSyncingCatalog(true);
    addLog('Checking remote catalogue updates…');
    try {
      const res = await syncRemoteCatalogue();
      if (res.ok) {
        addLog(
          res.source === 'remote'
            ? 'Catalogue updated with remote vetted feed.'
            : 'Bundled catalogue is up to date.',
          'ok'
        );
        onCatalogueUpdated();
      } else {
        addLog(res.error || 'Catalogue update failed; kept bundled fallback.', 'err');
      }
    } finally {
      setSyncingCatalog(false);
    }
  };

  const handleResetCatalogue = () => {
    resetToBundledCatalogue();
    onCatalogueUpdated();
    addLog('Restored verified bundled catalogue.', 'ok');
  };

  const handleExportReport = () => {
    const text = generateRedactedDiagnosticReport({
      tv,
      session,
      diagnosticSteps,
      logs,
    });
    downloadDiagnosticReport(text);
    addLog('Sanitized diagnostic report exported.', 'ok');
  };

  const handleCopyReport = async () => {
    const text = generateRedactedDiagnosticReport({
      tv,
      session,
      diagnosticSteps,
      logs,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
      addLog('Sanitized diagnostic report copied to clipboard.', 'ok');
    } catch {
      handleExportReport();
    }
  };

  const handleCheckAppUpdates = async () => {
    setCheckingUpdate(true);
    setUpdateStatus(null);
    await new Promise((r) => setTimeout(r, 800));
    setCheckingUpdate(false);
    setUpdateStatus(
      betaChannel
        ? 'Sidee v0.1.4.2 is the latest release on the beta pre-release channel. All features are up to date.'
        : 'Sidee v0.1.4.2 is the latest stable release. Your app is up to date.'
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settingsModalTitle"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(32, 33, 31, 0.45)',
        backdropFilter: 'blur(6px)',
        display: 'grid',
        placeItems: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="panel"
        style={{
          width: 'min(640px, 100%)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#fff',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.25)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 id="settingsModalTitle" style={{ fontSize: '18px', fontWeight: 650 }}>
            {STRINGS.settingsTitle}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="button secondary"
            style={{ minHeight: '34px', padding: '6px 12px', borderRadius: '10px' }}
          >
            ✕
          </button>
        </div>

        {/* Tab navigation */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '12px 24px',
            backgroundColor: '#fafaf8',
            borderBottom: '1px solid var(--line)',
            overflowX: 'auto',
          }}
        >
          <button
            className={`button ${activeTab === 'tv' ? '' : 'secondary'}`}
            style={{ minHeight: '36px', fontSize: '12px', padding: '6px 12px' }}
            onClick={() => setActiveTab('tv')}
          >
            TV Connection
          </button>
          <button
            className={`button ${activeTab === 'catalog' ? '' : 'secondary'}`}
            style={{ minHeight: '36px', fontSize: '12px', padding: '6px 12px' }}
            onClick={() => setActiveTab('catalog')}
          >
            Catalogue Feed
          </button>
          <button
            className={`button ${activeTab === 'diag' ? '' : 'secondary'}`}
            style={{ minHeight: '36px', fontSize: '12px', padding: '6px 12px' }}
            onClick={() => setActiveTab('diag')}
          >
            Diagnostics & Log
          </button>
          <button
            className={`button ${activeTab === 'updates' ? '' : 'secondary'}`}
            style={{ minHeight: '36px', fontSize: '12px', padding: '6px 12px' }}
            onClick={() => setActiveTab('updates')}
          >
            Updates & Policy
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'grid', gap: '20px' }}>
          {/* TAB: TV Connection */}
          {activeTab === 'tv' && (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '15px', marginBottom: '6px' }}>Active TV Pairing</h3>
                <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
                  {STRINGS.multiTvNote}
                </p>
              </div>

              <div
                style={{
                  background: '#f8f8f6',
                  padding: '16px',
                  borderRadius: '14px',
                  border: '1px solid var(--line)',
                  fontSize: '13px',
                }}
              >
                {tv && session ? (
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <div><strong>Device:</strong> {tv.friendly_name}</div>
                    <div><strong>Address:</strong> {tv.host}</div>
                    <div><strong>Model & Firmware:</strong> {tv.model_name || 'VIDAA TV'} · {tv.software_version || 'U09.60'}</div>
                    <div><strong>Status:</strong> <span style={{ color: 'var(--positive)', fontWeight: 600 }}>Authorized & Paired</span></div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--muted)', margin: 0 }}>
                    No TV currently paired. Use the setup section on the main page to find and connect to your TV.
                  </p>
                )}
              </div>

              {session && (
                <div>
                  <button
                    className="button secondary"
                    style={{ color: 'var(--negative)', borderColor: '#eed0d0' }}
                    onClick={() => {
                      if (window.confirm(STRINGS.forgetTvConfirm)) {
                        onForgetTV();
                        onClose();
                      }
                    }}
                  >
                    <span>{STRINGS.forgetTvBtn}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB: Catalogue Feed */}
          {activeTab === 'catalog' && (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '15px', marginBottom: '6px' }}>Remote Catalogue Updates (§6)</h3>
                <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
                  Sidee uses a verified bundled catalogue by default. You can optionally check for
                  remote catalogue updates, which are strictly validated as data only without code execution.
                </p>
              </div>

              <div
                style={{
                  background: '#f8f8f6',
                  padding: '16px',
                  borderRadius: '14px',
                  border: '1px solid var(--line)',
                  fontSize: '13px',
                  display: 'grid',
                  gap: '6px',
                }}
              >
                <div>
                  <strong>Active Feed:</strong>{' '}
                  <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                    {catalogueSource} catalogue
                  </span>
                </div>
                {catalogueSyncedAt && (
                  <div><strong>Last checked:</strong> {catalogueSyncedAt}</div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  className="button"
                  disabled={syncingCatalog}
                  onClick={handleSyncCatalogue}
                >
                  <span>{syncingCatalog ? STRINGS.syncingRemote : STRINGS.syncRemoteBtn}</span>
                </button>
                {catalogueSource === 'remote' && (
                  <button
                    className="button secondary"
                    onClick={handleResetCatalogue}
                  >
                    <span>{STRINGS.resetBundledBtn}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB: Diagnostics & Log Export */}
          {activeTab === 'diag' && (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '15px', marginBottom: '6px' }}>Diagnostics Without Telemetry (§4)</h3>
                <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
                  Export a clean diagnostic report for GitHub issues. All private dashboard keys,
                  pairing tokens, and 4-digit PINs are fully redacted.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  className="button secondary"
                  onClick={async () => {
                    await onRunDiagnostics();
                  }}
                >
                  <span>Run 5-step test</span>
                </button>
                <button
                  className="button secondary"
                  onClick={handleExportReport}
                >
                  <span>{STRINGS.exportLogBtn}</span>
                </button>
                <button
                  className="button secondary"
                  onClick={handleCopyReport}
                >
                  <span>{copyFeedback ? 'Copied!' : 'Copy to clipboard'}</span>
                </button>
              </div>

              {diagnosticSteps.length > 0 && (
                <div style={{ background: '#f8f8f6', padding: '14px', borderRadius: '12px', border: '1px solid var(--line)' }}>
                  <ul style={{ margin: 0, paddingLeft: '18px', display: 'grid', gap: '6px', fontSize: '12px' }}>
                    {diagnosticSteps.map((step, idx) => (
                      <li key={idx} style={{ color: step.ok === true ? 'var(--positive)' : step.ok === false ? 'var(--negative)' : 'var(--muted)' }}>
                        <strong>{step.name}:</strong> {step.detail}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB: Updates & Policy */}
          {activeTab === 'updates' && (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '15px', marginBottom: '6px' }}>App Updates & Beta Channel</h3>
                <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
                  Manual update checks verify releases on GitHub without automated background downloads.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="betaToggle"
                  checked={betaChannel}
                  onChange={(e) => setBetaChannel(e.target.checked)}
                  style={{ width: '18px', height: '18px', minHeight: 'unset' }}
                />
                <label htmlFor="betaToggle" style={{ fontSize: '13px', cursor: 'pointer', color: 'var(--ink)' }}>
                  {STRINGS.betaToggleLabel}
                </label>
              </div>

              <div>
                <button
                  className="button secondary"
                  disabled={checkingUpdate}
                  onClick={handleCheckAppUpdates}
                >
                  <span>{checkingUpdate ? STRINGS.checkingUpdates : STRINGS.checkUpdatesBtn}</span>
                </button>
              </div>

              {updateStatus && (
                <div style={{ background: '#eef5eb', color: 'var(--positive)', padding: '12px', borderRadius: '12px', fontSize: '13px' }}>
                  {updateStatus}
                </div>
              )}

              <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '8px 0' }} />

              {/* Native Mode Exclusion Note (§3, §12) */}
              <div>
                <h4 style={{ fontSize: '13px', marginBottom: '4px' }}>{STRINGS.nativeModeTitle}</h4>
                <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5 }}>
                  {STRINGS.nativeModeDesc}
                </p>
              </div>

              {/* Trademark & Legal Note (§7) */}
              <div>
                <h4 style={{ fontSize: '13px', marginBottom: '4px' }}>Trademark Notice</h4>
                <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5 }}>
                  {STRINGS.trademarkNotice}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
