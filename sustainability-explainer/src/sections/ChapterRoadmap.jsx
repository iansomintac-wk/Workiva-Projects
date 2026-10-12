import React, { useEffect, useRef, useState } from 'react';
import ChapterHero from '../components/ChapterHero.jsx';
import SectionHead from '../components/SectionHead.jsx';
import { roadmap, fourStages, startSteps, library } from '../content.js';

function Roadmap() {
  return (
    <section data-screen-label="Roadmap" className="pad-96-40">
      <div className="wrap">
        <SectionHead title="core, premium, planned" label="availability depends on your package" />
        <div className="roadmap">
          {roadmap.map((r) => (
            <div key={r.label} className="roadmap__col">
              <div className="roadmap__head" style={{ background: r.bg, color: r.ink }}>
                <div className="roadmap__label">{r.label}</div>
                <div className="roadmap__title">{r.title}</div>
              </div>
              <div className="roadmap__items">
                {r.items.map((it) => (
                  <div key={it.name} className="roadmap__item">
                    <div className="roadmap__name">{it.name}</div>
                    <div className="roadmap__desc">{it.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="stages__head">
          <h3>four stages, and they compound</h3>
          <span className="eyebrow eyebrow--12">happening at once, not one after another</span>
        </div>
        <div className="stages">
          {fourStages.map((s) => (
            <div key={s.num} className="card stage">
              <div className="stage__top">
                <span className="stage__num" style={{ color: s.numColor }}>{s.num}</span>
                <span className="stage__tag" style={{ background: s.tagBg, color: s.tagInk }}>{s.tag}</span>
              </div>
              <div className="stage__title">{s.title}</div>
              <p className="stage__body">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="banner banner--sand banner--packaging">
          <p className="packaging__text">Packaging: <span style={{ color: 'var(--color-forest)' }}>Core AI</span> included for everyone · <span style={{ color: 'var(--color-cheetah)' }}>Premium AI</span> tiers for agents · <span style={{ color: 'var(--color-purple-mountain)' }}>AI Builder</span> add-on for Agent Studio.</p>
          <p className="banner__small">Your account team can confirm which tier you’re on.</p>
        </div>
      </div>
    </section>
  );
}

function GettingStarted() {
  return (
    <section id="start" data-screen-label="Getting started" className="pad-40-96">
      <div className="wrap">
        <SectionHead title="getting started" label="your first two weeks" />
        <div className="start">
          {startSteps.map((s, k) => (
            <div key={s.title} className="card card--20 start__step">
              <span className="start__num">{String(k + 1).padStart(2, '0')}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PromptLibrary() {
  const [copied, setCopied] = useState(-1);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = (k, text) => {
    try { navigator.clipboard.writeText(text).catch(() => {}); } catch (e) { /* clipboard unavailable */ }
    setCopied(k);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(-1), 1400);
  };
  return (
    <section data-screen-label="Prompt library" className="pad-0-96">
      <div className="wrap">
        <SectionHead title="starter prompts to copy" label="click to copy" gap={40} />
        <div className="library">
          {library.map((p, k) => (
            <button key={p.kind} type="button" className="library__item" onClick={() => copy(k, p.text)}>
              <div className="library__meta"><span>{p.kind}</span><span aria-live="polite">{copied === k ? 'copied' : 'copy'}</span></div>
              <div className="library__text">"{p.text}"</div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ChapterRoadmap() {
  return (
    <>
      <ChapterHero id="roadmap" label="Ch6 Hero" word="six" num="06"
        title={<>what's next,<br />and how to start</>}
        lede="What's available today, what sits in advanced packages, and what's planned, so you can plan your rollout around what you can switch on now. Plus the four-stage direction Workiva laid out at Amplify."
        bg="var(--color-poseidon)" ink="var(--color-paper)"
        object={{ shape: 'check', accent: '#66CC66', secondary: '#FCF4E8', tertiary: '#7CBEFF' }} />
      <Roadmap />
      <GettingStarted />
      <PromptLibrary />
    </>
  );
}
