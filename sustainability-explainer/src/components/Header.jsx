import React, { useEffect, useState } from 'react';
import Logo from './Logo.jsx';
import { nav } from '../content.js';

function ProgressBar() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const d = document.documentElement, max = d.scrollHeight - d.clientHeight;
      setProgress(max > 0 ? Math.min(100, (d.scrollTop / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className="progress" aria-hidden="true">
      <div className="progress__bar" style={{ width: progress.toFixed(1) + '%' }} />
    </div>
  );
}

export default function Header() {
  return (
    <>
      <ProgressBar />
      <header className="site-header">
        <a href="#top" className="site-header__brand">
          <Logo />
          <span className="site-header__product">workiva ai · sustainability</span>
        </a>
        <nav className="site-header__nav" aria-label="Chapters">
          {nav.map((n) => (
            <a key={n.href} href={n.href} style={{ '--hover': n.hover }}>{n.label}</a>
          ))}
        </nav>
      </header>
    </>
  );
}
