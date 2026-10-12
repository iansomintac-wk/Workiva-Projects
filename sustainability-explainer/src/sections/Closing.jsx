import React from 'react';
import Field from '../three/Field.jsx';
import Grain from '../components/Grain.jsx';
import { donts } from '../content.js';

export function Closing() {
  return (
    <section data-screen-label="Closing" className="closing">
      <Grain opacity={0.16} />
      <Field accent="#FBAD17" density={14} opacity={0.22} />
      <div className="wrap rel">
        <div className="eyebrow eyebrow--700 eyebrow--stainless" style={{ marginBottom: 34 }}>the short version</div>
        <div className="closing__list">
          {donts.map((d) => (
            <p key={d.no}><span style={{ color: 'var(--color-cool-ranch)' }}>{d.no}</span> {d.yes}</p>
          ))}
        </div>
        <p className="closing__note">Start small: one table, one paragraph, one check. Ground the AI in your own report, get a useful result in minutes, verify it, and then make it part of every reporting cycle.</p>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer__inner">
        <div className="site-footer__source">Built from Workiva AI support and release guidance · Sept 2026</div>
        <nav className="site-footer__nav"><a href="#top">↑ top</a></nav>
      </div>
    </footer>
  );
}
