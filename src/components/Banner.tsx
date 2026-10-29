import React from 'react';
import { CheckIcon } from './Icons';

interface BannerProps {
  title: string;
  text: string;
  visible: boolean;
  onDismiss?: () => void;
}

export const Banner: React.FC<BannerProps> = ({ title, text, visible }) => {
  if (!visible) return null;

  return (
    <div id="banner" role="status">
      <CheckIcon />
      <div>
        <b id="bannerTitle">{title}</b>
        <span id="bannerText">{text}</span>
      </div>
    </div>
  );
};
