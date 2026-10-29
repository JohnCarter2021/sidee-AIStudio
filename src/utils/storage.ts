import { AppItem, TVSession, LogEntry } from '../types';

const SESSION_KEY = 'sidee_session';
const CUSTOM_APPS_KEY = 'sidee_custom_apps';
const TV_TILES_PREFIX = 'sidee_tv_tiles_';
const LOGS_KEY = 'sidee_activity_logs';

export function getSavedSession(): TVSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.host && parsed.token) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveSession(session: TVSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getCustomApps(): AppItem[] {
  try {
    const raw = localStorage.getItem(CUSTOM_APPS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (Array.isArray(list)) {
      return list;
    }
    return [];
  } catch {
    return [];
  }
}

export function saveCustomApps(apps: AppItem[]): void {
  localStorage.setItem(CUSTOM_APPS_KEY, JSON.stringify(apps));
}

export function getInstalledTilesForHost(host: string): string[] {
  try {
    const raw = localStorage.getItem(TV_TILES_PREFIX + host);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveInstalledTilesForHost(host: string, tiles: string[]): void {
  localStorage.setItem(TV_TILES_PREFIX + host, JSON.stringify(tiles));
}

export function getStoredLogs(): LogEntry[] {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredLogs(logs: LogEntry[]): void {
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(-100)));
}
