import React from 'react';

export const PanelContainer = ({ children, className = "" }) => (
  <div className={`relative border border-[var(--burnt-orange)] bg-[var(--gunmetal)] text-white overflow-hidden flex flex-col ${className}`}>
    {children}
  </div>
);

export const TechHeader = ({ title }) => (
  <div className="label-plate px-3 py-2 border-b border-[var(--burnt-orange)]">{title}</div>
);
