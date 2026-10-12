import React from 'react';

/* Lowercase heavy headline over a 2px steel rule, with a small caps label on
   the right. `size="lg"` is the larger intro-section headline. */
export default function SectionHead({ title, label, size, gap = 44, wrap }) {
  return (
    <div className={'section-head' + (wrap ? ' section-head--wrap' : '')} style={{ marginBottom: gap }}>
      <h2 className={size === 'lg' ? 'h2-lg' : 'h2'}>{title}</h2>
      {label && <span className="eyebrow">{label}</span>}
    </div>
  );
}
