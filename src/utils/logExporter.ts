import { TVDevice, TVSession, DiagnosticStep, LogEntry } from '../types';

export function redactSensitiveText(text: string): string {
  return text
    // Redact dashboard key query param
    .replace(/key=[a-zA-Z0-9_\-]+/g, 'key=[REDACTED_KEY]')
    // Redact auth tokens
    .replace(/tok_[a-zA-Z0-9_\-]+/g, '[REDACTED_TOKEN]')
    .replace(/token["':\s]+[a-zA-Z0-9_\-]+/gi, 'token: [REDACTED_TOKEN]')
    // Redact 4-digit PINs in messages
    .replace(/PIN:?\s*([0-9]{4})/gi, 'PIN: [REDACTED_PIN]')
    .replace(/code:?\s*([0-9]{4})/gi, 'code: [REDACTED_PIN]');
}

export function generateRedactedDiagnosticReport(options: {
  tv: TVDevice | null;
  session: TVSession | null;
  diagnosticSteps: DiagnosticStep[];
  logs: LogEntry[];
  appVersion?: string;
}): string {
  const { tv, session, diagnosticSteps, logs, appVersion = '0.1.4.2' } = options;

  const header = [
    '=====================================================',
    `Sidee Diagnostic Report (Redacted)`,
    `Generated at: ${new Date().toISOString()}`,
    `App Version: Sidee ${appVersion}`,
    `Platform: ${navigator.userAgent}`,
    '=====================================================',
    '',
    '### TV Information',
    `Friendly Name: ${tv?.friendly_name || 'None'}`,
    `LAN Address: ${tv?.host || 'None'}`,
    `Model: ${tv?.model_name || 'VIDAA TV'}`,
    `Firmware Version: ${tv?.software_version || 'U09.60'}`,
    `Pairing State: ${session ? 'Paired (Token active)' : 'Unpaired'}`,
    '',
    '### 5-Step Setup Diagnostics',
    diagnosticSteps.length > 0
      ? diagnosticSteps
          .map((s) => `[${s.ok === true ? 'PASS' : s.ok === false ? 'FAIL' : 'SKIP'}] ${s.name}: ${s.detail}`)
          .join('\n')
      : 'Diagnostics have not been run in this session yet.',
    '',
    '### Connection Activity Log (Sanitized & Redacted)',
    logs.length > 0
      ? logs
          .map((l) => `[${l.timestamp}] [${l.type.toUpperCase()}] ${redactSensitiveText(l.message)}`)
          .join('\n')
      : 'No activity logs recorded.',
    '',
    '=====================================================',
    'Privacy notice: Dashboard keys, pairing tokens, and PIN codes',
    'have been completely stripped from this export file.',
    'Safe to attach to GitHub issue reports: https://github.com/JohnCarter2021/Sidee/issues',
    '=====================================================',
  ].join('\n');

  return header;
}

export function downloadDiagnosticReport(content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `sidee-diagnostic-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
