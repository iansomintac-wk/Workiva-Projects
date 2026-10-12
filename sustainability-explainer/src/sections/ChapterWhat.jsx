import React from 'react';
import ChapterHero from '../components/ChapterHero.jsx';
import SectionHead from '../components/SectionHead.jsx';
import Grain from '../components/Grain.jsx';
import Icon from '../components/Icon.jsx';
import { places, facts } from '../content.js';

export default function ChapterWhat() {
  return (
    <>
      <ChapterHero id="what" label="Ch1 Hero" word="one" num="01"
        title={<>what<br />workiva ai is</>}
        lede="A secure, integrated assistant built into the Workiva platform. Not a separate chatbot you paste into — it reads the report, emissions data, or disclosure you're already working in."
        bg="var(--color-link-blue)" ink="var(--color-paper)"
        object={{ shape: 'sparkle', accent: '#FCF4E8', secondary: '#7CBEFF' }} />

      <section data-screen-label="Where it shows up" className="pad-96-40">
        <div className="wrap">
          <SectionHead title="three places it shows up" label="where to find them" />
          <div className="places">
            {places.map((p) => (
              <div key={p.title} className="card card--20 place">
                <Icon name={p.icon} size={40} />
                <h3>{p.title}</h3>
                <p className="place__body">{p.body}</p>
                <p className="place__best">{p.best}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-screen-label="Governance" className="pad-40-96">
        <div className="wrap dark-panel">
          <Grain opacity={0.14} />
          <div className="governance">
            <div>
              <div className="kicker-700" style={{ color: 'var(--color-robins-egg)', marginBottom: 16 }}>security, first</div>
              <h2 className="governance__title">your data stays in workiva</h2>
              <p className="body-155" style={{ color: 'var(--color-silver-diva)' }}>The questions your security and legal teams will ask, answered plainly.</p>
            </div>
            <div className="governance__facts">
              {facts.map((f) => (
                <div key={f} className="glass-row">
                  <Icon name="CheckSizeSmall" size={20} />
                  <span>{f}</span>
                </div>
              ))}
              <p className="governance__summary">In short: it operates inside the Workiva environment you already control. Your data isn't used to train it, your existing permissions still apply, and your own AI policy still governs what you put in.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
