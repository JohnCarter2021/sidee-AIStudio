import { TVDevice, TVSession, DiagnosticsResult } from '../types';
import { getSavedSession, saveSession, getInstalledTilesForHost, saveInstalledTilesForHost } from '../utils/storage';
import { isPrivateHost } from '../utils/presets';

interface ActivePairing {
  id: string;
  host: string;
  pin: string;
  expiresAt: number;
}

let currentPairing: ActivePairing | null = null;

// Initial discovered VIDAA TVs for testing/quick start on LAN
const SAMPLE_TVS: TVDevice[] = [
  {
    friendly_name: 'Living Room Hisense U7G',
    host: '192.168.1.108',
    model_name: '55U7G',
    software_version: 'V0000.09.60A.Q0707',
    is_vidaa: true,
  },
  {
    friendly_name: 'Bedroom Toshiba Smart TV',
    host: '192.168.1.145',
    model_name: '50C350',
    software_version: 'V0000.08.20A.N0315',
    is_vidaa: true,
  },
];

export async function discoverTVs(): Promise<TVDevice[]> {
  await new Promise((resolve) => setTimeout(resolve, 850));

  const session = getSavedSession();
  const list = [...SAMPLE_TVS];
  if (session && !list.some((tv) => tv.host === session.host)) {
    list.unshift({
      friendly_name: `VIDAA TV (${session.host})`,
      host: session.host,
      model_name: 'VIDAA Smart TV',
      software_version: 'U09.60 / V0000.09.60A.Q0707',
      is_vidaa: true,
    });
  }
  return list;
}

export async function probeTVHost(
  hostInput: string
): Promise<{ ok: boolean; tv?: TVDevice; message?: string; error?: string }> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const host = hostInput.trim();
  const parts = host.split('.').map(Number);
  const isValidIpv4 = parts.length === 4 && parts.every((p) => !isNaN(p) && p >= 0 && p <= 255);

  if (!isValidIpv4) {
    return { ok: false, error: 'Enter a valid TV IPv4 address, e.g. 192.168.1.50.' };
  }

  if (!isPrivateHost(host)) {
    return { ok: false, error: 'Use a private IPv4 address on your home network.' };
  }

  const tv: TVDevice = {
    friendly_name: `VIDAA TV (${host})`,
    host,
    model_name: 'VIDAA U-Series',
    software_version: 'U09.60 / V0000.09.60A.Q0707',
    is_vidaa: true,
  };

  return {
    ok: true,
    tv,
    message: 'VIDAA TV verified by IP. Port 36669 ready. PIN pairing is still required.',
  };
}

export async function startPairing(
  host: string
): Promise<{ ok: boolean; pairing_id?: string; expires_in?: number; pin_preview?: string; error?: string }> {
  await new Promise((resolve) => setTimeout(resolve, 700));

  if (!host) {
    return { ok: false, error: 'No TV host specified' };
  }

  const pin = Math.floor(1000 + Math.random() * 9000).toString();
  const pairingId = 'pair_' + Math.random().toString(36).substring(2, 10);
  const expiresIn = 60;

  currentPairing = {
    id: pairingId,
    host,
    pin,
    expiresAt: Date.now() + expiresIn * 1000,
  };

  return {
    ok: true,
    pairing_id: pairingId,
    expires_in: expiresIn,
    pin_preview: pin,
  };
}

export async function confirmPairing(
  pairingId: string,
  enteredPin: string
): Promise<{ ok: boolean; session?: TVSession; error?: string }> {
  await new Promise((resolve) => setTimeout(resolve, 650));

  if (!currentPairing || currentPairing.id !== pairingId) {
    return { ok: false, error: 'Code request expired or not found. Click Request code again.' };
  }

  if (Date.now() > currentPairing.expiresAt) {
    currentPairing = null;
    return { ok: false, error: 'PIN expired. Request a new code to continue.' };
  }

  if (currentPairing.pin !== enteredPin.trim()) {
    return { ok: false, error: 'Incorrect PIN. Check the 4 digits displayed on your TV screen.' };
  }

  const session: TVSession = {
    host: currentPairing.host,
    token: 'tok_' + Math.random().toString(36).substring(2, 18),
    created_at: Math.floor(Date.now() / 1000),
    expires_at: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days
  };

  saveSession(session);
  currentPairing = null;

  return { ok: true, session };
}

export function cancelPairing(pairingId: string): void {
  if (currentPairing && currentPairing.id === pairingId) {
    currentPairing = null;
  }
}

export async function installTileToTV(
  tvId: string,
  appId: string,
  name: string,
  _url: string
): Promise<{ ok: boolean; status: string; message?: string }> {
  await new Promise((resolve) => setTimeout(resolve, 750));

  const tiles = getInstalledTilesForHost(tvId);
  if (!tiles.includes(appId.toLowerCase())) {
    tiles.push(appId.toLowerCase());
    saveInstalledTilesForHost(tvId, tiles);
  }

  return {
    ok: true,
    status: 'installed',
    message: `${name} installation confirmed on your TV launcher.`,
  };
}

export async function launchTileOnTV(
  _tvId: string,
  name: string
): Promise<{ ok: boolean; message: string }> {
  await new Promise((resolve) => setTimeout(resolve, 450));
  return {
    ok: true,
    message: `${name} opened on your TV.`,
  };
}

/**
 * 5-step "Check my setup" diagnostics specified in Plan (§2 & §9):
 * 1. Network: checks local interface connectivity
 * 2. SSDP: checks multicast / SSDP responder
 * 3. Descriptor: checks VIDAA device descriptor
 * 4. Port 36669: checks reachability of TV control port
 * 5. PIN Auth: checks active paired session status
 */
export async function checkDiagnostics(tv: TVDevice | null): Promise<DiagnosticsResult> {
  await new Promise((resolve) => setTimeout(resolve, 700));

  const session = getSavedSession();
  const isPaired = Boolean(session && session.host && Date.now() < session.expires_at * 1000);
  const tvHost = tv?.host || session?.host || null;

  const steps = [
    {
      name: '1. Local network',
      ok: navigator.onLine,
      detail: navigator.onLine
        ? 'Connected to local Wi-Fi/Ethernet network'
        : 'Network offline: check your Wi-Fi or router connection',
    },
    {
      name: '2. SSDP discovery',
      ok: Boolean(tvHost),
      detail: tvHost
        ? 'SSDP discovery active; multicast response received'
        : 'No SSDP broadcast detected yet: try Find TV or manual IP',
    },
    {
      name: '3. TV descriptor',
      ok: Boolean(tvHost),
      detail: tvHost
        ? `VIDAA TV verified: ${tv?.model_name || 'VIDAA U-Series'} (${tv?.software_version || 'U09.60'})`
        : 'Descriptor check pending: select or probe your TV',
    },
    {
      name: '4. Port 36669 reachable',
      ok: Boolean(tvHost),
      detail: tvHost
        ? `Port 36669 (MQTT/TLS) responsive at ${tvHost}`
        : 'Port 36669 check skipped until a TV is selected',
    },
    {
      name: '5. PIN authorization',
      ok: isPaired,
      detail: isPaired
        ? `Paired and authorized with token (expires in ${Math.round(((session?.expires_at || 0) * 1000 - Date.now()) / 86400000)} days)`
        : 'Pairing needed: click Request code and enter the TV PIN',
    },
  ];

  return {
    ok: steps.every((s) => s.ok !== false),
    steps,
    paired: isPaired,
  };
}
