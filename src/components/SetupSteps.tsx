import React, { useState } from 'react';
import { TVDevice } from '../types';
import { TvIcon, CheckIcon, ArrowIcon, LockIcon } from './Icons';
import { STRINGS } from '../utils/strings';

interface SetupStepsProps {
  tv: TVDevice | null;
  devices: TVDevice[];
  linked: boolean;
  pairingId: string | null;
  pairBusy: boolean;
  findBusy: boolean;
  installBusy: boolean;
  pinHelpText: string;
  pinError: string | null;
  notice: { message: string; type: 'ok' | 'err' | 'info' } | null;
  onFindTV: () => void;
  onSelectTV: (device: TVDevice) => void;
  onCheckManualIp: (ip: string) => Promise<void>;
  onRequestCode: () => void;
  onConfirmPin: (pin: string) => void;
  onForgetTV?: () => void;
}

export const SetupSteps: React.FC<SetupStepsProps> = ({
  tv,
  devices,
  linked,
  pairingId,
  pairBusy,
  findBusy,
  installBusy,
  pinHelpText,
  pinError,
  notice,
  onFindTV,
  onSelectTV,
  onCheckManualIp,
  onRequestCode,
  onConfirmPin,
  onForgetTV,
}) => {
  const [manualIp, setManualIp] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualBusy, setManualBusy] = useState(false);
  const [pinValue, setPinValue] = useState('');

  const handleManualCheck = async () => {
    if (!manualIp.trim()) {
      setManualError('Enter the IPv4 address shown on your TV.');
      return;
    }
    setManualError(null);
    setManualBusy(true);
    try {
      await onCheckManualIp(manualIp.trim());
    } catch (e: unknown) {
      setManualError(e instanceof Error ? e.message : 'Check failed');
    } finally {
      setManualBusy(false);
    }
  };

  const handlePinSubmit = () => {
    onConfirmPin(pinValue);
  };

  return (
    <section className="panel setup" id="setup" aria-labelledby="setupTitle">
      <div className="section-head">
        <h2 id="setupTitle">{STRINGS.setupTitle}</h2>
        {!linked && (
          <span className="section-meta" id="setupMeta">
            {STRINGS.setupMeta}
          </span>
        )}
        {linked && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge" id="pairbadge">
              <CheckIcon />
              {STRINGS.setupPairedBadge}
            </span>
            {onForgetTV && (
              <button
                className="button secondary"
                style={{
                  minHeight: '28px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  color: 'var(--muted)',
                }}
                onClick={() => {
                  if (window.confirm(STRINGS.forgetTvConfirm)) {
                    onForgetTV();
                  }
                }}
              >
                <span>{STRINGS.forgetTvBtn}</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="steps">
        {/* Step 1: Find TV */}
        <div className={`step ${tv ? 'complete' : 'current'}`} id="stepFind">
          <div className="step-heading">
            <span className="step-number">1</span>
            <h3>{STRINGS.step1Title}</h3>
          </div>
          <p id="tvname">
            {tv
              ? `${tv.friendly_name} · ${tv.host}`
              : STRINGS.step1DescDefault}
          </p>

          {devices.length > 1 && (
            <div className="field device-field" id="deviceField">
              <label htmlFor="tvselect">{STRINGS.step1SelectLabel}</label>
              <select
                id="tvselect"
                value={tv?.host || ''}
                disabled={pairBusy || installBusy || findBusy}
                onChange={(e) => {
                  const dev = devices.find((d) => d.host === e.target.value);
                  if (dev) onSelectTV(dev);
                }}
              >
                {devices.map((device) => (
                  <option key={device.host} value={device.host}>
                    {device.friendly_name} · {device.host}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="step-actions">
            <button
              className="button secondary"
              id="btnFind"
              disabled={findBusy || pairBusy || installBusy}
              aria-busy={findBusy}
              onClick={onFindTV}
            >
              <TvIcon />
              <span>{findBusy ? STRINGS.step1SearchingBtn : STRINGS.step1FindBtn}</span>
            </button>
          </div>

          <details className="manual-tv">
            <summary>{STRINGS.step1ManualToggle}</summary>
            <div className="manual-tv-body">
              <div className="field">
                <label htmlFor="manualIp">{STRINGS.step1ManualLabel}</label>
                <input
                  id="manualIp"
                  type="text"
                  inputMode="decimal"
                  spellCheck="false"
                  maxLength={15}
                  placeholder={STRINGS.step1ManualPlaceholder}
                  value={manualIp}
                  disabled={manualBusy || pairBusy || installBusy || findBusy}
                  onChange={(e) => {
                    setManualIp(e.target.value);
                    setManualError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleManualCheck();
                  }}
                />
                <span className="help-text" id="manualHelp">
                  {STRINGS.step1ManualHelp}
                </span>
              </div>
              <button
                className="button secondary"
                id="btnFindIp"
                disabled={manualBusy || pairBusy || installBusy || findBusy}
                aria-busy={manualBusy}
                onClick={handleManualCheck}
              >
                <span>{manualBusy ? STRINGS.step1CheckingBtn : STRINGS.step1ManualBtn}</span>
              </button>
              {manualError && (
                <div className="field-error" id="manualError" role="alert">
                  {manualError}
                </div>
              )}
            </div>
          </details>
        </div>

        {/* Step 2: Make the connection */}
        <div
          className={`step ${linked ? 'complete' : tv && !linked ? 'current' : ''}`}
          id="stepPair"
        >
          <div className="step-heading">
            <span className="step-number">2</span>
            <h3>{STRINGS.step2Title}</h3>
          </div>
          <p id="pinHelp">{pinHelpText}</p>

          <div className="step-actions">
            <button
              className="button secondary"
              id="btnRequest"
              disabled={!tv || pairBusy || installBusy || findBusy}
              aria-busy={pairBusy && !pairingId}
              onClick={onRequestCode}
            >
              <span>{pairingId ? STRINGS.step2RequestNewBtn : STRINGS.step2RequestBtn}</span>
              <TvIcon />
            </button>
          </div>

          <div className="step-actions">
            <div className="field pin-field">
              <label htmlFor="pin">{STRINGS.step2PinLabel}</label>
              <input
                id="pin"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{4}"
                maxLength={4}
                placeholder={STRINGS.step2PinPlaceholder}
                value={pinValue}
                disabled={!pairingId || pairBusy || installBusy || findBusy}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                  setPinValue(cleaned);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && pairingId && !pairBusy) handlePinSubmit();
                }}
              />
            </div>
            <button
              className="button secondary"
              id="btnPair"
              disabled={!pairingId || pairBusy || installBusy || findBusy}
              aria-busy={pairBusy && Boolean(pairingId)}
              onClick={handlePinSubmit}
            >
              <span>{pairBusy && pairingId ? STRINGS.step2ConnectingBtn : STRINGS.step2ConfirmBtn}</span>
              <ArrowIcon />
            </button>
          </div>
          {pinError && (
            <div className="field-error" id="pinError">
              {pinError}
            </div>
          )}
        </div>

        {/* Step 3: Choose what you love */}
        <div className={`step ${linked ? 'current' : ''}`} id="stepInstall">
          <div className="step-heading">
            <span className="step-number">3</span>
            <h3>{STRINGS.step3Title}</h3>
          </div>
          <p>{STRINGS.step3Desc}</p>
          <div className="ready-note">
            {linked ? <CheckIcon /> : <LockIcon />}
            <span id="readyText">
              {linked ? STRINGS.step3ReadyNote : STRINGS.step3LockNote}
            </span>
          </div>
        </div>
      </div>

      {notice && (
        <div id="notice" className={notice.type} role="status">
          {notice.message}
        </div>
      )}
    </section>
  );
};
