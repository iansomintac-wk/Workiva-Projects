import React from 'react';
import logoUrl from '../assets/workiva-logo-steel.svg';

/* WorkivaLogoSteelEn from the design system, flattened to one SVG. */
export default function Logo() {
  return <img className="logo" src={logoUrl} width="93" height="22" alt="Workiva" />;
}
