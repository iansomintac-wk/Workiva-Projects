import React, { useState } from 'react';
import ChapterHero from '../components/ChapterHero.jsx';
import SectionHead from '../components/SectionHead.jsx';
import Grain from '../components/Grain.jsx';
import Icon from '../components/Icon.jsx';
import { quickWins, stageColors, cycle } from '../content.js';

function QuickWinDeck() {
  const [i, setI] = useState(0);
  const n = quickWins.length, w = quickWins[i];
  const [stageBg, stageInk] = stageColors[w.stage] || ['var(--color-silver-diva)', 'var(--color-steel)'];
  return (
    <section data-screen-label="Quick win deck" className="pad-96">
      <div className="wrap">
        <SectionHead title="six use cases, ordered by ease" label={String(i + 1).padStart(2, '0') + ' / ' + n + ' · step through'} gap={40} />
        <div className="deck">
          <button type="button" className="round-btn deck__prev" aria-label="Previous" onClick={() => setI((i - 1 + n) % n)}>
            <Icon name="ArrowForwardSize24px" size={24} style={{ color: 'currentColor', transform: 'rotate(180deg)' }} />
          </button>
          <div className="deck__card" aria-live="polite">
            <div className="deck__tags">
              <span className="pill" style={{ background: stageBg, color: stageInk }}>{w.stage}</span>
              <span className="pill pill--neutral">effort: {w.effort}</span>
              <span className="pill pill--neutral">where: {w.where}</span>
            </div>
            <h3 className="deck__title">{w.title}</h3>
            <p className="deck__motion">{w.motion}</p>
            <div className="deck__body">
              <div className="deck__prompt">
                <div className="kicker-sm-700" style={{ color: 'var(--color-ectoplasm)' }}>starter prompt</div>
                <p>“{w.prompt}”</p>
              </div>
              <div>
                <div className="kicker-sm-700" style={{ color: 'var(--color-storm-cloud)' }}>why start here</div>
                <p className="deck__why">{w.why}</p>
              </div>
            </div>
          </div>
          <button type="button" className="round-btn deck__next" aria-label="Next" onClick={() => setI((i + 1) % n)}>
            <Icon name="ArrowForwardSize24px" size={24} style={{ color: 'currentColor' }} />
          </button>
        </div>
        <div className="deck__dots">
          {quickWins.map((q, k) => (
            <button key={q.title} type="button" aria-label="Go to card" aria-current={k === i}
              className="deck__dot" onClick={() => setI(k)}
              style={{ width: k === i ? 30 : 10, background: k === i ? 'var(--color-mr-toad)' : 'var(--color-stainless)' }} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CloseCycle() {
  return (
    <section data-screen-label="Close cycle" className="pad-0-96">
      <div className="wrap dark-panel">
        <Grain opacity={0.14} />
        <div className="rel">
          <div className="eyebrow eyebrow--700 eyebrow--stainless" style={{ marginBottom: 18 }}>don't look for an ai feature yet</div>
          <h2 className="cycle__title">walk your reporting cycle and find the <span style={{ color: 'var(--color-ectoplasm)' }}>read, draft, or check</span> inside it</h2>
          <div className="cycle">
            {cycle.map((c) => (
              <div key={c.stage} className="glass-tile">
                <div className="glass-tile__stage">{c.stage}</div>
                <div className="glass-tile__q">"{c.q}"</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ChapterUseCases() {
  return (
    <>
      <ChapterHero id="use-cases" label="Ch3 Hero" word="three" num="03"
        title={<>sustainability<br />quick wins</>}
        lede={'Don\'t start with "write my climate disclosure." Start where you can check the result instantly: a table you already trust, a paragraph you already approved.'}
        bg="var(--color-zesty-neue)" ink="var(--color-steel)" metaOpacity={0.8}
        object={{ shape: 'ledger', accent: '#3F9F3F', secondary: '#FCF4E8', tertiary: '#333333' }} />
      <QuickWinDeck />
      <CloseCycle />
    </>
  );
}
