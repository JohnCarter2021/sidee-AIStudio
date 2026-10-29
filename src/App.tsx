import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppItem, TVDevice, TVSession, DiagnosticsResult, LogEntry } from './types';
import { resolveUrl, validateCustomApp } from './utils/presets';
import { STRINGS } from './utils/strings';
import {
  getSavedSession,
  clearSession,
  getCustomApps,
  saveCustomApps,
  getInstalledTilesForHost,
  getStoredLogs,
  saveStoredLogs,
} from './utils/storage';
import {
  discoverTVs,
  probeTVHost,
  startPairing,
  confirmPairing,
  cancelPairing,
  installTileToTV,
  launchTileOnTV,
  checkDiagnostics,
} from './services/tvService';
import { getActiveCatalogue } from './services/catalogService';
import { generateRedactedDiagnosticReport, downloadDiagnosticReport } from './utils/logExporter';
import { Header } from './components/Header';
import { Intro } from './components/Intro';
import { PhoneAccess } from './components/PhoneAccess';
import { Banner } from './components/Banner';
import { SetupSteps } from './components/SetupSteps';
import { Catalog } from './components/Catalog';
import { Utilities } from './components/Utilities';
import { Footer } from './components/Footer';
import { SettingsModal } from './components/SettingsModal';

interface QueueItem {
  appKey: string;
  serverAddress: string;
}

export const App: React.FC = () => {
  const [tv, setTv] = useState<TVDevice | null>(null);
  const [devices, setDevices] = useState<TVDevice[]>([]);
  const [session, setSession] = useState<TVSession | null>(null);
  const [linked, setLinked] = useState<boolean>(false);

  // Operation flags
  const [findBusy, setFindBusy] = useState<boolean>(false);
  const [pairBusy, setPairBusy] = useState<boolean>(false);
  const [installBusy, setInstallBusy] = useState<boolean>(false);

  // Pairing state
  const [pairingId, setPairingId] = useState<string | null>(null);
  const [pinHelpText, setPinHelpText] = useState<string>(STRINGS.step2HelpDefault);
  const [pinError, setPinError] = useState<string | null>(null);

  // Notice & Banner state
  const [notice, setNotice] = useState<{ message: string; type: 'ok' | 'err' | 'info' } | null>(
    null
  );
  const [banner, setBanner] = useState<{ visible: boolean; title: string; text: string }>({
    visible: false,
    title: '',
    text: '',
  });

  // Catalog state & remote feed info
  const [apps, setApps] = useState<AppItem[]>([]);
  const [catalogueSource, setCatalogueSource] = useState<'bundled' | 'remote'>('bundled');
  const [catalogueSyncedAt, setCatalogueSyncedAt] = useState<string | undefined>(undefined);
  const [gridStateText, setGridStateText] = useState<string>('');

  // Diagnostics
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResult | null>(null);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState<boolean>(false);

  // Settings modal
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Install queue state (§6)
  const [installQueue, setInstallQueue] = useState<QueueItem[]>([]);
  const [activeInstallingKey, setActiveInstallingKey] = useState<string | null>(null);
  const processingQueueRef = useRef<boolean>(false);

  // Activity logs
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const stored = getStoredLogs();
    if (stored.length > 0) return stored;
    return [
      {
        id: '1',
        message: 'Ready when you are.',
        type: 'info',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      },
    ];
  });
  const [activityStatus, setActivityStatus] = useState<string>('Ready');

  const addLog = useCallback((message: string, type: 'info' | 'ok' | 'err' = 'info') => {
    const time = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const newEntry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      message,
      type,
      timestamp: time,
    };
    setLogs((prev) => {
      const updated = [...prev, newEntry].slice(-80);
      saveStoredLogs(updated);
      return updated;
    });

    if (type === 'err') {
      setActivityStatus('Needs attention');
      setNotice({ message, type: 'err' });
    } else if (type === 'ok') {
      setActivityStatus('All good');
      setNotice({ message, type: 'ok' });
    } else {
      setActivityStatus('Working');
      setNotice({ message, type: 'info' });
    }
  }, []);

  // Sync catalog installed status with currently paired TV
  const refreshCatalog = useCallback(
    (currentTv: TVDevice | null, isLinked: boolean) => {
      const activeCat = getActiveCatalogue();
      setCatalogueSource(activeCat.source);
      setCatalogueSyncedAt(activeCat.lastSynced);

      const customs = getCustomApps();
      const all = [...activeCat.apps, ...customs];

      if (!isLinked || !currentTv) {
        const unlinked = all.map((app) => ({
          ...app,
          installed: null,
          installed_url: '',
        }));
        setApps(unlinked);
        setGridStateText('Pair your TV to check which apps are installed.');
        return;
      }

      const installedTileIds = getInstalledTilesForHost(currentTv.host);
      const updated = all.map((app) => {
        const isInst = installedTileIds.includes(app.app_id.toLowerCase());
        return {
          ...app,
          installed: isInst,
          installed_url: isInst ? app.url : '',
        };
      });

      setApps(updated);
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setGridStateText(`Installed state updated at ${nowStr} (${activeCat.source} catalogue).`);
    },
    []
  );

  // Initialize app on mount
  useEffect(() => {
    const saved = getSavedSession();
    if (saved && saved.expires_at * 1000 > Date.now()) {
      setSession(saved);
      const savedTv: TVDevice = {
        friendly_name: `VIDAA TV (${saved.host})`,
        host: saved.host,
        model_name: 'VIDAA TV',
        software_version: 'U09.60 / V0000.09.60A.Q0707',
        is_vidaa: true,
      };
      setTv(savedTv);
      setDevices([savedTv]);
      setLinked(true);
      document.body.classList.add('is-linked');
      refreshCatalog(savedTv, true);
      addLog(`Your saved connection to ${saved.host} is ready. Choose an app below.`, 'ok');
    } else {
      if (saved) clearSession();
      refreshCatalog(null, false);
    }
  }, [addLog, refreshCatalog]);

  // Find TV handler
  const handleFindTV = async () => {
    setFindBusy(true);
    setBanner((prev) => ({ ...prev, visible: false }));
    setNotice(null);
    addLog('Looking for your TV on the local network…');

    try {
      const tvs = await discoverTVs();
      if (tvs.length > 0) {
        setDevices(tvs);
        const selected = tvs[0];
        setTv(selected);

        const saved = getSavedSession();
        const isPaired = Boolean(
          saved && saved.host === selected.host && saved.expires_at * 1000 > Date.now()
        );
        setLinked(isPaired);
        if (isPaired) {
          document.body.classList.add('is-linked');
          refreshCatalog(selected, true);
          addLog(
            `Found ${selected.friendly_name} at ${selected.host}. Your saved connection is ready. Choose an app below.`,
            'ok'
          );
        } else {
          document.body.classList.remove('is-linked');
          refreshCatalog(selected, false);
          addLog(
            `Found ${selected.friendly_name} at ${selected.host}. Click Request code to connect.`,
            'ok'
          );
        }
      } else {
        addLog(
          'No TV found. Check that both devices are on the same network, then try again.',
          'err'
        );
      }
    } catch (err: unknown) {
      addLog(
        err instanceof Error ? err.message : 'The search was interrupted. Try again.',
        'err'
      );
    } finally {
      setFindBusy(false);
    }
  };

  // Select TV from dropdown
  const handleSelectTV = (selected: TVDevice) => {
    setTv(selected);
    if (pairingId) {
      cancelPairing(pairingId);
      setPairingId(null);
    }
    const saved = getSavedSession();
    const isPaired = Boolean(
      saved && saved.host === selected.host && saved.expires_at * 1000 > Date.now()
    );
    setLinked(isPaired);
    if (isPaired) {
      document.body.classList.add('is-linked');
      refreshCatalog(selected, true);
      addLog(`Selected ${selected.friendly_name}. Ready to install apps.`, 'ok');
    } else {
      document.body.classList.remove('is-linked');
      refreshCatalog(selected, false);
      addLog(`Selected ${selected.friendly_name}. Click Request code to connect.`);
    }
  };

  // Manual IP check
  const handleCheckManualIp = async (ip: string) => {
    setFindBusy(true);
    addLog(`Checking your TV directly at ${ip}…`);
    try {
      const res = await probeTVHost(ip);
      if (!res.ok || !res.tv) {
        throw new Error(res.error || 'TV could not be verified.');
      }
      setDevices([res.tv]);
      setTv(res.tv);
      const saved = getSavedSession();
      const isPaired = Boolean(
        saved && saved.host === res.tv.host && saved.expires_at * 1000 > Date.now()
      );
      setLinked(isPaired);
      if (isPaired) {
        document.body.classList.add('is-linked');
        refreshCatalog(res.tv, true);
      } else {
        document.body.classList.remove('is-linked');
        refreshCatalog(res.tv, false);
      }
      addLog(res.message || 'TV verified. Click Request code to pair.', 'ok');
    } finally {
      setFindBusy(false);
    }
  };

  // Forget this TV flow (§3, §6, §11)
  const handleForgetTV = useCallback(() => {
    clearSession();
    setSession(null);
    setLinked(false);
    document.body.classList.remove('is-linked');
    if (pairingId) {
      cancelPairing(pairingId);
      setPairingId(null);
    }
    refreshCatalog(tv, false);
    addLog('Saved TV pairing forgotten. You can now pair another TV.', 'ok');
  }, [pairingId, refreshCatalog, tv, addLog]);

  // Request Code PIN
  const handleRequestCode = async () => {
    if (!tv) return;
    setPairBusy(true);
    setPinError(null);
    setLinked(false);
    document.body.classList.remove('is-linked');
    addLog('Requesting a code. Look at your TV screen…');

    try {
      const res = await startPairing(tv.host);
      if (res.ok && res.pairing_id) {
        setPairingId(res.pairing_id);
        setPinHelpText(STRINGS.step2HelpCodeOnTv);
        addLog(
          `The code is on your TV (PIN: ${res.pin_preview}). Enter it here to connect.`,
          'ok'
        );
      } else {
        addLog(res.error || "The TV didn't display a code. Try requesting it again.", 'err');
      }
    } catch (err: unknown) {
      addLog(err instanceof Error ? err.message : "Couldn't request a code. Try again.", 'err');
    } finally {
      setPairBusy(false);
    }
  };

  // Confirm PIN
  const handleConfirmPin = async (enteredPin: string) => {
    if (!tv || !pairingId) return;
    if (!/^[0-9]{4}$/.test(enteredPin)) {
      setPinError(STRINGS.step2PinInvalid);
      return;
    }
    setPinError(null);
    setPairBusy(true);
    addLog('Making the connection to your TV…');

    try {
      const res = await confirmPairing(pairingId, enteredPin);
      if (res.ok && res.session) {
        setSession(res.session);
        setLinked(true);
        document.body.classList.add('is-linked');
        setPairingId(null);
        setPinHelpText(STRINGS.step2HelpConnected);
        refreshCatalog(tv, true);
        addLog('Your TV is paired. Choose an app below.', 'ok');
      } else {
        setPinError(res.error || 'Incorrect PIN.');
        addLog(res.error || "Couldn't connect. Request a new code and try again.", 'err');
      }
    } catch (err: unknown) {
      addLog(
        err instanceof Error ? err.message : 'The connection was interrupted. Request a new code.',
        'err'
      );
    } finally {
      setPairBusy(false);
    }
  };

  // Queue-based app installation processor (§6)
  useEffect(() => {
    if (processingQueueRef.current || installQueue.length === 0 || !tv || !linked) {
      return;
    }

    const processNext = async () => {
      processingQueueRef.current = true;
      const nextItem = installQueue[0];
      setActiveInstallingKey(nextItem.appKey);
      setInstallBusy(true);

      const app = apps.find((a) => a.key === nextItem.appKey);
      if (app) {
        let targetUrl = '';
        try {
          targetUrl = resolveUrl(app, nextItem.serverAddress);
          addLog(`Adding ${app.name} to your TV launcher…`);
          const res = await installTileToTV(tv.host, app.app_id, app.name, targetUrl);
          if (res.ok) {
            setBanner({
              visible: true,
              title: STRINGS.bannerInstalledTitle.replace('{name}', app.name),
              text: STRINGS.bannerInstalledText,
            });
            refreshCatalog(tv, true);
            addLog(`${app.name} is installed. Take a look at your TV launcher.`, 'ok');
          } else {
            addLog(`Your TV didn't confirm installation of ${app.name}. Try again.`, 'err');
          }
        } catch (err: unknown) {
          addLog(err instanceof Error ? err.message : 'Install interrupted', 'err');
        }
      }

      setInstallQueue((prev) => prev.slice(1));
      setActiveInstallingKey(null);
      setInstallBusy(false);
      processingQueueRef.current = false;
    };

    processNext();
  }, [installQueue, tv, linked, apps, addLog, refreshCatalog]);

  // Queue app install
  const handleEnqueueInstall = async (appKey: string, serverAddress: string) => {
    if (!tv || !linked) return;
    const app = apps.find((a) => a.key === appKey);
    if (!app) return;

    if (app.needs_server && !serverAddress) {
      addLog(`${app.name} requires your server address.`, 'err');
      return;
    }

    // Check if already in queue or installing
    if (installQueue.some((q) => q.appKey === appKey) || activeInstallingKey === appKey) {
      addLog(`${app.name} is already in the install queue.`);
      return;
    }

    setInstallQueue((prev) => [...prev, { appKey, serverAddress }]);
    if (activeInstallingKey) {
      addLog(`${app.name} added to install queue (#${installQueue.length + 1}).`);
    }
  };

  // Launch App
  const handleLaunchApp = async (appKey: string, _serverAddress: string) => {
    if (!tv || !linked) return;
    const app = apps.find((a) => a.key === appKey);
    if (!app) return;

    setInstallBusy(true);
    addLog(`Opening ${app.name} on your TV…`);
    try {
      const res = await launchTileOnTV(tv.host, app.name);
      if (res.ok) {
        addLog(`${app.name} was opened on your TV.`, 'ok');
      }
    } catch (err: unknown) {
      addLog(err instanceof Error ? err.message : 'The connection was interrupted.', 'err');
    } finally {
      setInstallBusy(false);
    }
  };

  // Add Custom App
  const handleAddCustomApp = async (customData: Partial<AppItem>) => {
    const cleaned = validateCustomApp(customData);
    const existing = getCustomApps();
    const activeCat = getActiveCatalogue();

    if (
      activeCat.apps.some(
        (b) => b.app_id.toLowerCase() === cleaned.app_id.toLowerCase() || b.key === cleaned.key
      )
    ) {
      throw new Error('That App ID is already used by a catalogue app.');
    }
    if (existing.some((e) => e.app_id.toLowerCase() === cleaned.app_id.toLowerCase())) {
      throw new Error('A custom app with that App ID already exists.');
    }

    const updated = [...existing, cleaned];
    saveCustomApps(updated);
    refreshCatalog(tv, linked);
    addLog(`${cleaned.name} was added to your grid.`, 'ok');
  };

  // Remove Custom App
  const handleRemoveCustomApp = async (appId: string) => {
    const existing = getCustomApps();
    const filtered = existing.filter((e) => e.app_id.toLowerCase() !== appId.toLowerCase());
    saveCustomApps(filtered);
    refreshCatalog(tv, linked);
    addLog(`Custom app was removed.`, 'ok');
  };

  // 5-Step Diagnostics
  const handleRunDiagnostics = async () => {
    setDiagnosticsLoading(true);
    addLog('Checking your setup (5-step verification)…');
    try {
      const result = await checkDiagnostics(tv);
      setDiagnostics(result);
      addLog(
        result.ok ? 'Setup check passed.' : 'Setup check found a problem. See the results above.',
        result.ok ? 'ok' : 'err'
      );
    } finally {
      setDiagnosticsLoading(false);
    }
  };

  // Export Redacted Diagnostics Log (§4 & §9)
  const handleExportDiagnostics = () => {
    const text = generateRedactedDiagnosticReport({
      tv,
      session,
      diagnosticSteps: diagnostics ? diagnostics.steps : [],
      logs,
    });
    downloadDiagnosticReport(text);
    addLog('Sanitized diagnostic report exported.', 'ok');
  };

  const statusChipText = linked && tv ? `Paired · ${tv.friendly_name}` : 'TV not connected';
  const queuedKeys = installQueue.map((q) => q.appKey);

  return (
    <div>
      <Header
        linked={linked}
        tv={tv}
        statusText={statusChipText}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <main className="shell">
        <Intro />
        <PhoneAccess tv={tv} />
        <Banner
          visible={banner.visible}
          title={banner.title}
          text={banner.text}
          onDismiss={() => setBanner((prev) => ({ ...prev, visible: false }))}
        />
        <SetupSteps
          tv={tv}
          devices={devices}
          linked={linked}
          pairingId={pairingId}
          pairBusy={pairBusy}
          findBusy={findBusy}
          installBusy={installBusy}
          pinHelpText={pinHelpText}
          pinError={pinError}
          notice={notice}
          onFindTV={handleFindTV}
          onSelectTV={handleSelectTV}
          onCheckManualIp={handleCheckManualIp}
          onRequestCode={handleRequestCode}
          onConfirmPin={handleConfirmPin}
          onForgetTV={handleForgetTV}
        />
        <Catalog
          apps={apps}
          linked={linked}
          installBusy={installBusy}
          findBusy={findBusy}
          queue={queuedKeys}
          activeInstallingKey={activeInstallingKey}
          gridStateText={gridStateText}
          diagnostics={diagnostics}
          diagnosticsLoading={diagnosticsLoading}
          onInstall={handleEnqueueInstall}
          onLaunch={handleLaunchApp}
          onRefreshCatalog={() => refreshCatalog(tv, linked)}
          onRunDiagnostics={handleRunDiagnostics}
          onExportDiagnostics={handleExportDiagnostics}
          onAddCustomApp={handleAddCustomApp}
          onRemoveCustomApp={handleRemoveCustomApp}
        />
        <Utilities
          logs={logs}
          activityStatusText={activityStatus}
          onExportLog={handleExportDiagnostics}
        />
        <Footer />

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          tv={tv}
          session={session}
          diagnosticSteps={diagnostics ? diagnostics.steps : []}
          logs={logs}
          catalogueSource={catalogueSource}
          catalogueSyncedAt={catalogueSyncedAt}
          onCatalogueUpdated={() => refreshCatalog(tv, linked)}
          onForgetTV={handleForgetTV}
          onRunDiagnostics={handleRunDiagnostics}
          addLog={addLog}
        />
      </main>
    </div>
  );
};

export default App;
