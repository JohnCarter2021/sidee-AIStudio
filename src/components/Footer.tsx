import React from 'react';
import { CoffeeIcon } from './Icons';

export const Footer: React.FC = () => {
  return (
    <>
      <footer>
        <div>
          <p className="footer-brand">Small tool. A lot of heart.</p>
          <p>Made by Sidee, after months of trying and nearly giving up.</p>
        </div>
      </footer>

      <a
        className="coffee"
        id="kofi"
        href="https://ko-fi.com/sidee"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Support Sidee on Ko-fi"
      >
        <span className="coffee-mark">
          <CoffeeIcon />
        </span>
        <span className="coffee-copy">
          <strong>Support Sidee</strong>
          <small>Keep it free · Ko-fi</small>
        </span>
      </a>
    </>
  );
};
