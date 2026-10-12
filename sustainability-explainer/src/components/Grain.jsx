import React from 'react';

/* Noise-grain texture overlay used on brand-color blocks. */
export default function Grain({ opacity = 0.14 }) {
  return <div className="grain" style={{ opacity }} aria-hidden="true" />;
}
