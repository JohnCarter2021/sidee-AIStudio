export type Category = 'Media' | 'Anime' | 'Music' | 'Tools' | 'Custom';

export interface AppItem {
  key: string;
  app_id: string;
  name: string;
  url: string;
  image?: string;
  icon?: string;
  description?: string;
  category: Category;
  needs_server?: boolean;
  server_builder?: 'stremio' | string;
  server_optional?: boolean;
  server_placeholder?: string;
  source: 'built-in' | 'custom';
  installed?: boolean | null;
  installed_url?: string;
}

export interface TVDevice {
  friendly_name: string;
  host: string;
  model_name?: string;
  software_version?: string;
  is_vidaa?: boolean;
}

export interface TVSession {
  host: string;
  token: string;
  created_at: number;
  expires_at: number; // timestamp in seconds
}

export interface DiagnosticStep {
  name: string;
  ok: boolean | null;
  detail: string;
}

export interface DiagnosticsResult {
  ok: boolean;
  steps: DiagnosticStep[];
  paired: boolean;
}

export interface LogEntry {
  id: string;
  message: string;
  type: 'info' | 'ok' | 'err';
  timestamp: string;
}
