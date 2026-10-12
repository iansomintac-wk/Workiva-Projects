import React, { useState } from 'react';
import ChapterHero from '../components/ChapterHero.jsx';
import SectionHead from '../components/SectionHead.jsx';
import Grain from '../components/Grain.jsx';
import Layers from '../three/Layers.jsx';
import { layers, promptStages, practices, scopeLetters, scopeParts, scopeHints } from '../content.js';

const layerColors = layers.map((l) => l.dot);

function CapabilityExplorer() {
  const [sel, setSel] = useState(4);
  const L = layers[sel];
  const included = L.avail === 'included';
  return (
    <section data-screen-label="Capability explorer" className="pad-96">
      <div className="wrap">
        <SectionHead title="eight capabilities, one stack" label="click a layer" gap={20} />
        <div className="explorer__scale"><span>general</span><span>grounded in the report</span></div>
        <div className="explorer__gradient" />
        <div className="explorer__grid">
          <Layers className="explorer__canvas" colors={layerColors} selected={sel} onSelect={setSel}
            label={'Capability stack, ' + L.name + ' selected'} />
          <div className="explorer__list">
            {layers.map((l, k) => (
              <button key={l.name} type="button" className={'layer-btn' + (k === sel ? ' is-active' : '')}
                aria-pressed={k === sel} onClick={() => setSel(k)}>
                <span className="layer-btn__dot" style={{ background: l.dot }} />
                <strong>{l.name}</strong>
                <span className="layer-btn__think">{l.think}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="card card--20 explorer__detail" aria-live="polite">
          <div className="explorer__num" style={{ background: L.dot }}>{String(sel + 1).padStart(2, '0')}</div>
          <div>
            <div className="explorer__name">{L.name} <span>— {L.think}</span></div>
            <div className="explorer__best">{L.best}</div>
          </div>
          <span className="pill" style={{
            background: included ? 'var(--color-morning-dew)' : 'var(--color-plastic-cheese)',
            color: included ? 'var(--color-forest)' : 'var(--color-steel)'
          }}>{L.avail}</span>
        </div>
      </div>
    </section>
  );
}

function Prompting() {
  const [stage, setStage] = useState(0);
  const st = promptStages[stage];
  return (
    <section data-screen-label="Prompting" className="pad-0-96">
      <div className="wrap">
        <SectionHead title="prompting: weak → strong" label="see the difference" />
        <div className="stage-tabs" role="tablist">
          {promptStages.map((sd, k) => (
            <button key={sd.label} type="button" role="tab" aria-selected={k === stage}
              className={'stage-tab' + (k === stage ? ' is-active' : '')} onClick={() => setStage(k)}>{sd.label}</button>
          ))}
        </div>
        <div className="prompting__grid">
          <div className="code-panel code-panel--240">
            <Grain opacity={0.12} />
            <div className="rel">
              <div className="kicker-700" style={{ color: 'var(--color-lavendery)', marginBottom: 18 }}>the prompt</div>
              <p className="mono-17">“{st.prompt}”</p>
            </div>
          </div>
          <div className="card card--20 prompting__verdict">
            <div className="kicker-700" style={{ color: 'var(--color-storm-cloud)', marginBottom: 16 }}>{st.verdictLabel}</div>
            <p>{st.verdict}</p>
          </div>
        </div>
        <div className="practices">
          {practices.map((p) => (
            <div key={p.kind} className="practice">
              <div className="practice__kind">{p.kind}</div>
              <div className="practice__text">{p.text}</div>
            </div>
          ))}
        </div>
        <div className="banner banner--paper">
          <p className="banner__big">Treat it like a knowledgeable coworker: write full sentences and include the background.</p>
          <p className="banner__small">Default knowledge base is general. Switch to ESRS / ISSB Intelligence for framework questions and check the Sources section.</p>
        </div>
      </div>
    </section>
  );
}

function ScopeBuilder() {
  const [on, setOn] = useState({ S: true, C: true, O: true, P: true, E: true });
  const active = scopeLetters.filter((l) => on[l]);
  const built = active.length ? active.map((l) => scopeParts[l].frag).join('') : 'Analyze this.';
  return (
    <section data-screen-label="SCOPE builder" className="pad-0-96">
      <div className="wrap">
        <SectionHead title="build it with scope" label="toggle the letters" gap={20} />
        <p className="scope__intro">A simple mnemonic (not an official Workiva framework) that turns "analyze this" into a strong prompt in about 30 seconds. Watch the prompt rebuild as each element switches on.</p>
        <div className="scope__grid">
          <div className="stack-10">
            {scopeLetters.map((l) => {
              const p = scopeParts[l];
              return (
                <button key={l} type="button" aria-pressed={on[l]} className="toggle-row toggle-row--scope"
                  style={{ borderColor: on[l] ? p.color : 'var(--color-ethereal)', background: on[l] ? 'var(--color-paper)' : 'transparent' }}
                  onClick={() => setOn((s) => ({ ...s, [l]: !s[l] }))}>
                  <span className="toggle-row__badge toggle-row__badge--44" style={{ background: p.color }}>{l}</span>
                  <span><strong>{p.word}</strong><span className="toggle-row__sub">{p.q}</span></span>
                  <span className="toggle-row__state" style={{ color: on[l] ? 'var(--color-mr-toad)' : 'var(--color-stainless)' }}>{on[l] ? 'ON' : 'OFF'}</span>
                </button>
              );
            })}
          </div>
          <div className="sticky-96">
            <div className="code-panel code-panel--320">
              <Grain opacity={0.12} />
              <div className="rel">
                <div className="scope__panel-head">
                  <div className="kicker-700" style={{ color: 'var(--color-lavendery)' }}>the assembled prompt</div>
                  <div className="scope__score">{active.length} / 5 elements</div>
                </div>
                <p className="mono-16" aria-live="polite">“{built}”</p>
              </div>
            </div>
            <div className="card scope__hint">{scopeHints[active.length]}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ChapterCapabilities() {
  return (
    <>
      <ChapterHero id="capabilities" label="Ch2 Hero" word="two" num="02"
        title={<>key<br />capabilities</>}
        lede="Think of the capabilities as a stack: the further down you go, the more context the AI already has, and the less you have to explain in the prompt."
        bg="var(--color-purple-mountain)" ink="var(--color-paper)"
        object={{ shape: 'stack', accent: '#FBAD17', secondary: '#FCF4E8', tertiary: '#D5B1EB' }} />
      <CapabilityExplorer />
      <Prompting />
      <ScopeBuilder />
    </>
  );
}
