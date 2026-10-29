import React from 'react';
import { ShieldIcon } from './Icons';

export const Intro: React.FC = () => {
  return (
    <section className="intro" aria-labelledby="pageTitle">
      <div>
        <p className="eyebrow">A little more home</p>
        <h1 id="pageTitle">
          Your TV.
          <br />
          Your apps. Your way.
        </h1>
        <p className="intro-copy">
          Bring your favorite apps to the big screen.
          <br />
          Connect once. Make yourself at home.
        </p>
      </div>
      <div className="privacy">
        <ShieldIcon />
        <div>
          <b>At home, on your network.</b>
          <span>No account. No cloud. Just your TV.</span>
        </div>
      </div>
    </section>
  );
};
