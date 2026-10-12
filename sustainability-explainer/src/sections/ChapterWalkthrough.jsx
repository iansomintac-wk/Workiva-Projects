import React, { useState } from 'react';
import ChapterHero from '../components/ChapterHero.jsx';
import SectionHead from '../components/SectionHead.jsx';
import Icon from '../components/Icon.jsx';
import { demoSteps } from '../content.js';

function Walkthrough() {
  const [step, setStep] = useState(0);
  const D = demoSteps[step];
  return (
    <section data-screen-label="Demo walkthrough" className="pad-96">
      <div className="wrap">
        <SectionHead title="step by step" label="click a step" gap={40} />
        <div className="walk__grid">
          <div className="stack-10">
            {demoSteps.map((d, k) => {
              const active = k === step;
              return (
                <button key={d.title} type="button" aria-pressed={active} className="toggle-row toggle-row--step"
                  style={{ borderColor: active ? 'var(--color-cheetah)' : 'var(--color-ethereal)', background: active ? 'var(--color-paper)' : 'transparent' }}
                  onClick={() => setStep(k)}>
                  <span className="toggle-row__badge toggle-row__badge--40"
                    style={{ background: active ? 'var(--color-cheetah)' : 'var(--color-silver-diva)', color: active ? 'var(--color-paper)' : 'var(--color-steel)' }}>
                    {String(k + 1).padStart(2, '0')}
                  </span>
                  <span><strong>{d.title}</strong><span className="toggle-row__sub">{d.sub}</span></span>
                </button>
              );
            })}
          </div>
          <div className="sticky-96">
            <div className="window" aria-live="polite">
              <div className="window__bar">
                <span className="window__dot" /><span className="window__dot" /><span className="window__dot" />
                <span className="window__title">{D.screen}</span>
              </div>
              <div className="window__body">
                <div className="window__left">
                  <div className="kicker-sm-700" style={{ color: 'var(--color-storm-cloud)' }}>what you do</div>
                  <p style={{ margin: '0 0 20px' }}>{D.action}</p>
                  <div className="kicker-sm-700" style={{ color: 'var(--color-storm-cloud)' }}>what's happening</div>
                  <p style={{ fontWeight: 700 }}>{D.say}</p>
                </div>
                <div className="window__right">
                  <div className="window__panel-label">
                    <Icon name="SparkleSizeSmall" size={16} style={{ color: 'currentColor' }} />
                    <span>workiva ai panel</span>
                  </div>
                  <p>{D.prompt}</p>
                </div>
              </div>
            </div>
            <div className="tip"><strong>Tip:</strong> {D.watch}</div>
          </div>
        </div>
        <div className="banner banner--sand banner--lg">
          <p className="banner__big banner__big--lg">Type at least <span style={{ color: 'var(--color-squashy)' }}>one prompt yourself</span>.</p>
          <p className="banner__small banner__small--lg">Reading about it tells you Workiva has AI. Typing one prompt tells you that you can use it.</p>
        </div>
      </div>
    </section>
  );
}

export default function ChapterWalkthrough() {
  return (
    <>
      <ChapterHero id="demo" label="Ch4 Hero" word="four" num="04"
        title={<>the ten-minute<br />walkthrough</>}
        lede="One emissions table, one companion panel, one framework question. Follow the steps in your own draft; it takes about ten minutes."
        bg="var(--color-presentation)" ink="var(--color-steel)" metaOpacity={0.8}
        object={{ shape: 'peers', accent: '#3F9F3F', secondary: '#FCF4E8', tertiary: '#333333' }} />
      <Walkthrough />
    </>
  );
}
