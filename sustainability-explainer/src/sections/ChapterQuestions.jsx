import React, { useState } from 'react';
import ChapterHero from '../components/ChapterHero.jsx';
import SectionHead from '../components/SectionHead.jsx';
import { questions, compare } from '../content.js';

function Questions() {
  const [open, setOpen] = useState(-1);
  return (
    <section data-screen-label="Objections" className="pad-96-40">
      <div className="wrap">
        <SectionHead title="six questions we hear most" label="click for the answer" />
        <div className="questions">
          {questions.map((q, k) => {
            const isOpen = open === k;
            return (
              <button key={q.say} type="button" aria-expanded={isOpen} className={'question' + (isOpen ? ' is-open' : '')}
                onClick={() => setOpen(isOpen ? -1 : k)}>
                <div className="question__head">
                  <span className="question__say">{q.say}</span>
                  <span className="question__cta">{isOpen ? 'close' : 'the answer'}</span>
                </div>
                {isOpen && <p className="question__answer">{q.answer}</p>}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Positioning() {
  return (
    <section data-screen-label="Positioning" className="pad-40-96">
      <div className="wrap">
        <SectionHead title="how it differs from a general chatbot" label="same question, different context" gap={20} />
        <p className="positioning__intro">A general assistant is a fine tool, and you'll keep using one. The difference is where the work happens and what the AI can see when you ask.</p>
        <div className="compare" role="table">
          <div className="compare__head" role="row">
            <div role="columnheader">axis</div>
            <div role="columnheader">copy-paste into a general chatbot</div>
            <div role="columnheader" style={{ color: 'var(--color-cool-ranch)' }}>workiva ai</div>
          </div>
          {compare.map((c) => (
            <div key={c.axis} className="compare__row" role="row">
              <div role="rowheader" className="compare__axis">{c.axis}</div>
              <div role="cell" className="compare__them">{c.them}</div>
              <div role="cell" className="compare__us">{c.us}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ChapterQuestions() {
  return (
    <>
      <ChapterHero id="talk-tracks" label="Ch5 Hero" word="five" num="05"
        title={<>common<br />questions</>}
        lede="Sustainability teams are professionally skeptical. Good. Here are straight answers to the questions we hear most, based on what the product does today."
        bg="var(--color-steel)" ink="var(--color-warm-light)" metaOpacity={0.8} grain={0.16}
        object={{ shape: 'shield', accent: '#FBAD17', secondary: '#FCF4E8' }} />
      <Questions />
      <Positioning />
    </>
  );
}
