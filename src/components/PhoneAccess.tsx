import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { TVDevice } from '../types';

interface PhoneAccessProps {
  tv: TVDevice | null;
}

export const PhoneAccess: React.FC<PhoneAccessProps> = ({ tv }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [phoneUrl, setPhoneUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function generateQR() {
      setLoading(true);
      try {
        const urlObj = new URL(window.location.href);
        if (tv) {
          urlObj.searchParams.set('tv_host', tv.host);
        }
        const fullUrl = urlObj.toString();
        setPhoneUrl(fullUrl);
        const dataUrl = await QRCode.toDataURL(fullUrl, {
          width: 192,
          margin: 1,
          color: {
            dark: '#20211f',
            light: '#ffffff',
          },
        });
        setQrDataUrl(dataUrl);
      } catch (err) {
        console.error('Failed to generate QR code', err);
      } finally {
        setLoading(false);
      }
    }
    generateQR();
  }, [tv]);

  return (
    <section className="panel phone-access" aria-labelledby="phoneTitle">
      <div className="phone-copy">
        <h2 id="phoneTitle">Use your phone</h2>
        <p>
          TV far from your computer? Scan this QR with your phone's camera and enter the TV PIN while
          standing beside your TV.
        </p>
        <p className="phone-note">
          Use the same home network on your phone, TV and computer. Keep Sidee running on the computer.
        </p>
        {phoneUrl && !loading && (
          <a id="phoneLink" className="phone-url" href={phoneUrl} target="_blank" rel="noopener noreferrer">
            {phoneUrl}
          </a>
        )}
      </div>
      <div className="phone-visual">
        {!loading && qrDataUrl ? (
          <img
            id="phoneQr"
            className="phone-qr"
            src={qrDataUrl}
            width={192}
            height={192}
            alt="Scan to open this dashboard on your phone"
          />
        ) : (
          <p id="phoneMessage" className="phone-message" role="status">
            Preparing your QR code…
          </p>
        )}
      </div>
    </section>
  );
};
