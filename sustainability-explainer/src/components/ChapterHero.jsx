import React from 'react';
import Grain from './Grain.jsx';
import HeroObject from '../three/HeroObject.jsx';

/* Full-bleed brand-color chapter opener: numbered meta row, display headline,
   lede, and a three.js object on the right. */
export default function ChapterHero({ id, label, word, num, title, lede, bg, ink, metaOpacity = 0.85, grain = 0.14, object }) {
  return (
    <section id={id} data-screen-label={label} className="chapter-hero" style={{ background: bg, color: ink }}>
      <Grain opacity={grain} />
      <div className="wrap chapter-hero__grid">
        <div>
          <div className="chapter-hero__meta" style={{ opacity: metaOpacity }}>
            <span>chapter {word}</span><span>{num} / 06</span>
          </div>
          <h1 className="chapter-hero__title">{title}</h1>
          <p className="chapter-hero__lede">{lede}</p>
        </div>
        <div className="chapter-hero__object"><HeroObject {...object} /></div>
      </div>
    </section>
  );
}
