import React from 'react';
import Field from '../three/Field.jsx';
import Grain from '../components/Grain.jsx';
import SectionHead from '../components/SectionHead.jsx';
import { outcomes } from '../content.js';

export function Hero() {
  return (
    <section id="top" data-screen-label="Hero" className="hero">
      <Field accent="#333333" density={22} opacity={0.18} />
      <div className="wrap hero__inner">
        <div className="hero__meta eyebrow">
          <span>a guide for sustainability reporting teams</span>
          <span>six chapters, one scroll</span>
        </div>
        <h1 className="hero__title">workiva ai,<br />inside the<br /><span style={{ color: 'var(--color-forest)' }}>report</span></h1>
        <p className="hero__lede">A practical guide to Workiva AI for your sustainability team: what it is, where it lives, the tasks it speeds up, and how to get a useful result on day one.</p>
        <div className="hero__ctas">
          <a href="#what" className="btn-primary">Start with chapter one</a>
          <a href="#start" className="link-strong">Skip to getting started →</a>
        </div>
      </div>
    </section>
  );
}

export function Thesis() {
  return (
    <section data-screen-label="Thesis" className="thesis">
      <Grain opacity={0.18} />
      <div className="wrap rel">
        <div className="eyebrow eyebrow--stainless" style={{ marginBottom: 34 }}>the one idea</div>
        <div className="thesis__pill">
          <p>Workiva AI is most useful when you give it <span style={{ color: 'var(--color-link-blue)' }}>a real sustainability task</span>, <span style={{ color: 'var(--color-purple-mountain)' }}>the data, disclosure, or framework it should read</span>, and <span style={{ color: 'var(--color-mr-toad)' }}>a clear picture of what a useful answer looks like</span>.</p>
        </div>
        <p className="thesis__note">Quick wins come from tasks that are repetitive and text-heavy: drafting, explaining, and checking. You don't need to learn "AI" — find one of those tasks in your reporting cycle and remove part of it this year.</p>
      </div>
    </section>
  );
}

export function WhyWorkiva() {
  return (
    <section data-screen-label="Why Workiva AI" className="pad-96-40">
      <div className="wrap">
        <SectionHead title="why workiva is building this" label="from the amplify keynote" size="lg" wrap />
        <div className="why__grid">
          <div className="card card--24 why__shift">
            <div className="kicker" style={{ color: 'var(--color-link-blue)' }}>the shift</div>
            <h3 className="why__h3">software that helps <span style={{ color: 'var(--color-link-blue)' }}>→</span> software that does the work</h3>
            <p className="body-155">Enterprise software has always run on one model: you do the work and the software helps by organizing, connecting, and speeding things up. AI breaks that model. Software can now understand what needs to happen and do it.</p>
            <div className="why__models">
              <div className="why__model">
                <div className="kicker-sm" style={{ color: 'var(--color-storm-cloud)' }}>old model</div>
                <p>Your team decides in a meeting that you need to know why Scope 3 emissions spiked in one region. That becomes an action item.</p>
              </div>
              <div className="why__model why__model--dark">
                <div className="kicker-sm" style={{ color: 'var(--color-cool-ranch)' }}>new model</div>
                <p>The software is already pulling the data, comparing periods, and drafting the analysis before the meeting ends.</p>
              </div>
            </div>
          </div>
          <div className="why__right">
            <div className="why__line">
              <Grain opacity={0.14} />
              <div className="why__line-inner">
                <div className="kicker" style={{ color: 'var(--color-robins-egg)' }}>the line that never moves</div>
                <h3 className="why__h3">traceable. governed. defensible.</h3>
                <p className="body-155" style={{ color: 'var(--color-silver-diva)' }}>More automation means more decisions about how much control to hand over, and you make that choice. Self-driving on a familiar route in good weather feels fine; on an icy mountain road you want the wheel back. Every AI action explains itself, respects permissions, and holds up to an audit. That isn’t a constraint on the AI story. It is the AI story.</p>
                <p className="why__quote">“More of the work gets done, you stay in control, and you can trust the result.” <span>Julie Iskow, President &amp; CEO</span></p>
              </div>
            </div>
          </div>
        </div>
        <div className="why__number">
          <div className="why__number-big">5.3 million</div>
          <p>Means nothing on its own. Add tonnes of CO₂e, which scope, which period, which boundary, how it compares to the target, and suddenly it can be analyzed, explained, and questioned. Workiva AI is moving from the value in a cell to understanding what that number is, where it came from, and what it connects to. That understanding is what lets it take on more of the work well, not just faster.</p>
        </div>
      </div>
    </section>
  );
}

export function Outcomes() {
  return (
    <section data-screen-label="Outcomes" className="pad-40-96">
      <div className="wrap">
        <SectionHead title="what you'll be able to do" label="five outcomes" size="lg" gap={48} />
        <div className="outcomes">
          {outcomes.map((o) => (
            <div key={o.num} className="card card--16 outcome">
              <span className="outcome__num" style={{ color: o.color }}>{o.num}</span>
              <p>{o.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
