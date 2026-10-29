import React, { useRef, useEffect } from 'react';
import { LogEntry } from '../types';
import { HelpIcon, ActivityIcon, ChevronIcon } from './Icons';
import { STRINGS } from '../utils/strings';

interface UtilitiesProps {
  logs: LogEntry[];
  activityStatusText: string;
  onExportLog: () => void;
}

export const Utilities: React.FC<UtilitiesProps> = ({
  logs,
  activityStatusText,
  onExportLog,
}) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="utilities">
      {/* A little help FAQ */}
      <details>
        <summary>
          <HelpIcon />
          <span>A little help</span>
          <ChevronIcon className="icon chevron" />
        </summary>
        <div className="help-content">
          <p>
            <b>First time connecting?</b> Click Find TV, then Request code. Enter the 4-digit PIN
            displayed on your TV in the TV PIN field above and click Confirm code. Installation
            becomes available as soon as the TV confirms the connection.
          </p>
          <p>
            <b>How do I switch TVs?</b> Sidee v1 maintains one active paired TV. To pair another
            TV, use <b>Forget this TV</b> in the setup section or Settings.
          </p>
          <p>
            <b>How do I export logs for help?</b> Click <b>Export diagnostic log</b> below to
            download a sanitized report. All pairing tokens, keys, and PINs are automatically
            redacted so you can safely share it on GitHub issues.
          </p>
          <p>
            <b>Can't find your TV?</b> Keep the TV on and connect both devices to the same network.
            Guest Wi-Fi or router isolation can prevent them from seeing each other. Restart the TV
            and try again.
          </p>
          <p>
            <b>Your PIN or saved connection expired?</b> Click Request code again, enter the new PIN
            shown on your TV, and click Confirm code.
          </p>
          <p>
            <b>Can I close the installer?</b> After installation is confirmed, you can close Sidee.
            Nuvio and the Stremio TV build open online from the TV launcher, so Sidee does not need to
            stay running. Jellyfin still needs its server; Stremio needs a streaming server only for
            playback that depends on one.
          </p>
          <p>
            <b>Which Stremio is installed?</b> Sidee installs the full community-maintained VIDAA TV
            build based on Stremio Theater with a modern Stremio core — not the limited VIDAA Stremio
            Lite app.
          </p>
          <p>
            <b>Why are native packages excluded?</b> Sidee installs web-app launcher tiles using the
            TV's authorized interface. Native system package installs are deliberately excluded in v1
            to protect device stability.
          </p>
        </div>
      </details>

      {/* Connection activity Log */}
      <details id="activity" open>
        <summary>
          <ActivityIcon />
          <span>{STRINGS.activityTitle}</span>
          <span className="activity-count" id="activityCount">
            {activityStatusText}
          </span>
          <ChevronIcon className="icon chevron" />
        </summary>
        <div id="log" ref={logContainerRef} role="log" aria-label="Connection activity" aria-live="off">
          {logs.map((log) => (
            <span
              key={log.id}
              className={`log-line ${log.type === 'ok' ? 'ok' : log.type === 'err' ? 'err' : ''}`}
            >
              {log.timestamp ? `[${log.timestamp}] ` : ''}
              {log.message}
            </span>
          ))}
        </div>
        <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onExportLog}
            className="button secondary"
            style={{ minHeight: '32px', fontSize: '11px', padding: '4px 10px' }}
            title={STRINGS.exportLogTooltip}
          >
            <span>{STRINGS.exportLogBtn}</span>
          </button>
        </div>
      </details>
    </div>
  );
};
