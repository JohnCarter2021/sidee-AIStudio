import React, { useState } from 'react';
import { AppItem, Category, DiagnosticsResult } from '../types';
import { CATEGORIES } from '../utils/presets';
import { STRINGS } from '../utils/strings';

interface CatalogProps {
  apps: AppItem[];
  linked: boolean;
  installBusy: boolean;
  findBusy: boolean;
  queue: string[];
  activeInstallingKey: string | null;
  gridStateText: string;
  diagnostics: DiagnosticsResult | null;
  diagnosticsLoading: boolean;
  onInstall: (appKey: string, serverAddress: string) => Promise<void>;
  onLaunch: (appKey: string, serverAddress: string) => Promise<void>;
  onRefreshCatalog: () => void;
  onRunDiagnostics: () => void;
  onExportDiagnostics: () => void;
  onAddCustomApp: (app: Partial<AppItem>) => Promise<void>;
  onRemoveCustomApp: (appId: string) => Promise<void>;
}

export const Catalog: React.FC<CatalogProps> = ({
  apps,
  linked,
  installBusy,
  findBusy,
  queue,
  activeInstallingKey,
  gridStateText,
  diagnostics,
  diagnosticsLoading,
  onInstall,
  onLaunch,
  onRefreshCatalog,
  onRunDiagnostics,
  onExportDiagnostics,
  onAddCustomApp,
  onRemoveCustomApp,
}) => {
  const [filter, setFilter] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [serverInputs, setServerInputs] = useState<Record<string, string>>({});

  // Custom app form state
  const [customAppId, setCustomAppId] = useState('');
  const [customName, setCustomName] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customImage, setCustomImage] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customCategory, setCustomCategory] = useState<Category>('Custom');
  const [customError, setCustomError] = useState<string | null>(null);
  const [addingCustom, setAddingCustom] = useState(false);

  const availableCategories = ['All', ...Array.from(new Set(apps.map((a) => a.category)))];

  const filteredApps = apps.filter((app) => {
    const matchesFilter = filter === 'All' || app.category === filter;
    const query = search.toLowerCase().trim();
    const matchesSearch =
      !query ||
      app.name.toLowerCase().includes(query) ||
      (app.description || '').toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  const handleAction = async (app: AppItem) => {
    if (!linked || findBusy) return;
    const serverVal = serverInputs[app.key] || '';
    if (app.installed) {
      await onLaunch(app.key, serverVal);
    } else {
      await onInstall(app.key, serverVal);
    }
  };

  const handleCustomSubmit = async () => {
    setCustomError(null);
    setAddingCustom(true);
    try {
      await onAddCustomApp({
        app_id: customAppId,
        name: customName,
        url: customUrl,
        image: customImage,
        description: customDescription,
        category: customCategory,
      });
      setCustomAppId('');
      setCustomName('');
      setCustomUrl('');
      setCustomImage('');
      setCustomDescription('');
      setCustomCategory('Custom');
    } catch (err: unknown) {
      setCustomError(err instanceof Error ? err.message : 'Could not add custom app');
    } finally {
      setAddingCustom(false);
    }
  };

  return (
    <section className="catalog" aria-labelledby="catalogTitle">
      <div className="section-head">
        <h2 id="catalogTitle">{STRINGS.catalogTitle}</h2>
        <span className="section-meta">{STRINGS.catalogSubtitle}</span>
      </div>

      <div className="field">
        <label htmlFor="appSearch">Search apps</label>
        <input
          id="appSearch"
          type="search"
          placeholder={STRINGS.searchPlaceholder}
          spellCheck="false"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div
        id="appFilters"
        role="group"
        aria-label="Filter apps by category"
        style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBlock: '14px' }}
      >
        {availableCategories.map((cat) => (
          <button
            key={cat}
            className="button secondary"
            aria-pressed={filter === cat}
            style={filter === cat ? { background: '#20211f', color: '#fff' } : undefined}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="app-grid" id="appGrid">
        {filteredApps.length === 0 ? (
          <p style={{ color: 'var(--muted)', padding: '20px 0' }}>
            {apps.length ? STRINGS.noMatch : STRINGS.loading}
          </p>
        ) : (
          filteredApps.map((app) => {
            const isInstalled = app.installed === true;
            const isCurrentlyInstalling = activeInstallingKey === app.key;
            const queuePosition = queue.indexOf(app.key);
            const isQueued = queuePosition !== -1;
            const isBusy = isCurrentlyInstalling || isQueued;

            const imgSrc =
              app.icon && app.icon.startsWith('assets/')
                ? '/' + app.icon
                : app.image && app.image.startsWith('assets/')
                  ? '/' + app.image
                  : app.image || '';

            return (
              <article
                key={app.key}
                className="panel app"
                tabIndex={0}
                aria-label={`${app.name}, category ${app.category}. ${isInstalled ? 'Installed' : 'Not installed'}`}
              >
                <div className="app-body">
                  <div className="app-title">
                    <h3>{app.name}</h3>
                    <span className="app-pill">
                      {app.category}
                      {app.source === 'custom' ? ' · Custom' : ''}
                    </span>
                  </div>

                  {imgSrc && (
                    <img
                      className="app-icon"
                      src={imgSrc}
                      alt={`${app.name} icon`}
                      width={50}
                      height={50}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  )}

                  <p className="app-description">{app.description || ''}</p>

                  {(app.needs_server || app.server_builder) && (
                    <div className="field" style={{ marginTop: 'auto' }}>
                      <label htmlFor={`srv-${app.key}`}>
                        {app.server_placeholder || 'Server address'}
                      </label>
                      <input
                        id={`srv-${app.key}`}
                        type="text"
                        inputMode="url"
                        spellCheck="false"
                        placeholder={app.server_placeholder || ''}
                        value={serverInputs[app.key] || ''}
                        disabled={isBusy}
                        onChange={(e) =>
                          setServerInputs((prev) => ({ ...prev, [app.key]: e.target.value }))
                        }
                      />
                    </div>
                  )}

                  <div className="app-bottom">
                    <span className="app-note">
                      {app.installed === true
                        ? STRINGS.installed
                        : app.installed === false
                          ? ''
                          : STRINGS.unknownState}
                    </span>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        className={`button ${isInstalled ? 'secondary grid-launch' : 'grid-install'}`}
                        id={`btn-grid-${isInstalled ? 'launch' : 'install'}-${app.key}`}
                        disabled={!linked || isBusy || findBusy}
                        aria-busy={isBusy}
                        onClick={() => handleAction(app)}
                      >
                        <span>
                          {isCurrentlyInstalling
                            ? STRINGS.installing
                            : isQueued
                              ? `${STRINGS.inQueue} (#${queuePosition + 1})`
                              : isInstalled
                                ? `${STRINGS.launch} ${app.name}`
                                : `${STRINGS.install} ${app.name}`}
                        </span>
                      </button>

                      {app.source === 'custom' && (
                        <button
                          className="button secondary grid-remove"
                          disabled={installBusy || findBusy}
                          onClick={() => {
                            if (window.confirm(STRINGS.removeConfirm.replace('{name}', app.name))) {
                              onRemoveCustomApp(app.app_id);
                            }
                          }}
                        >
                          <span>{STRINGS.remove}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {!linked && (
        <p className="install-hint" id="installHint">
          {STRINGS.installHint}
        </p>
      )}

      {gridStateText && (
        <p id="gridState" role="status" style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '12px' }}>
          {gridStateText}
        </p>
      )}

      <div className="field" style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
        <button className="button secondary" id="btnRefreshCatalog" onClick={onRefreshCatalog}>
          <span>{STRINGS.refreshStateBtn}</span>
        </button>
        <button
          className="button secondary"
          id="btnDiagnostics"
          disabled={diagnosticsLoading}
          onClick={onRunDiagnostics}
        >
          <span>{diagnosticsLoading ? STRINGS.diagnosticsRunning : STRINGS.diagnosticsBtn}</span>
        </button>
        {diagnostics && (
          <button className="button secondary" onClick={onExportDiagnostics}>
            <span>{STRINGS.exportLogBtn}</span>
          </button>
        )}
      </div>

      {diagnostics && (
        <div id="diagResults" role="status" style={{ marginTop: '14px', background: '#f5f6f0', padding: '16px', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <strong style={{ fontSize: '13px' }}>5-Step Setup Diagnostics (§2 & §9)</strong>
            <button
              onClick={onExportDiagnostics}
              className="button secondary"
              style={{ minHeight: '28px', padding: '4px 8px', fontSize: '11px' }}
            >
              Export sanitized log
            </button>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'none', display: 'grid', gap: '8px' }}>
            {diagnostics.steps.map((step, idx) => (
              <li key={idx} style={{ fontSize: '13px', color: step.ok === true ? 'var(--positive)' : step.ok === false ? 'var(--negative)' : 'var(--muted)' }}>
                {step.ok === true ? '✓ ' : step.ok === false ? '✗ ' : '– '}
                <strong>{step.name}:</strong> {step.detail}
              </li>
            ))}
          </ul>
        </div>
      )}

      <details id="customApp" style={{ marginTop: '24px' }}>
        <summary>{STRINGS.customAppToggle}</summary>
        <div style={{ padding: '16px 20px', display: 'grid', gap: '14px' }}>
          <div className="field">
            <label htmlFor="customAppId">{STRINGS.customAppIdLabel}</label>
            <input
              id="customAppId"
              type="text"
              spellCheck="false"
              placeholder="myapp"
              maxLength={32}
              value={customAppId}
              onChange={(e) => setCustomAppId(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="customName">{STRINGS.customNameLabel}</label>
            <input
              id="customName"
              type="text"
              spellCheck="false"
              placeholder="My App"
              maxLength={40}
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="customUrl">{STRINGS.customUrlLabel}</label>
            <input
              id="customUrl"
              type="text"
              inputMode="url"
              spellCheck="false"
              placeholder="https://…"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="customImage">{STRINGS.customImageLabel}</label>
            <input
              id="customImage"
              type="text"
              inputMode="url"
              spellCheck="false"
              placeholder="https://…"
              value={customImage}
              onChange={(e) => setCustomImage(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="customDescription">{STRINGS.customDescLabel}</label>
            <input
              id="customDescription"
              type="text"
              spellCheck="false"
              maxLength={200}
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="customCategory">{STRINGS.customCategoryLabel}</label>
            <select
              id="customCategory"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value as Category)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <button
              className="button secondary"
              id="btnAddCustom"
              disabled={addingCustom}
              onClick={handleCustomSubmit}
            >
              <span>{addingCustom ? STRINGS.addingCustomBtn : STRINGS.addCustomBtn}</span>
            </button>
          </div>
          {customError && (
            <div className="field-error" id="customError" role="alert">
              {customError}
            </div>
          )}
        </div>
      </details>
    </section>
  );
};
