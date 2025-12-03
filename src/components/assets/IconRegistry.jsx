import React from 'react';

const icons = {
  microphone: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="23"></line>
    </svg>
  ),
  'signal-bars': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <line x1="1" y1="20" x2="1" y2="16"></line>
      <line x1="7" y1="20" x2="7" y2="12"></line>
      <line x1="13" y1="20" x2="13" y2="8"></line>
      <line x1="19" y1="20" x2="19" y2="4"></line>
    </svg>
  ),
  'medic-cross': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
};

const IconRegistry = ({ name, className }) => {
  const icon = icons[name];
  if (!icon) {
    return null;
  }
  return React.cloneElement(icon, { className });
};

export default IconRegistry;
