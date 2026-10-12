import React from 'react';
import iconData from '../assets/icon-data.json';

/* Workiva design-system icon. Path data is extracted verbatim from the DS
   bundle (assets/icons/icon-data.js) and paints with currentColor. */
export default function Icon({ name, size, style, className }) {
  const d = iconData[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox={d.viewBox} fill="none" style={style} className={className}
      aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: d.body }} />
  );
}
