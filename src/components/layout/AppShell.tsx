import React from 'react';

type AppShellProps = {
  sidebar?: React.ReactNode;
  auxPanel?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * Three-pane tactical shell: Sidebar | Main Stage | Aux Data.
 * Gunmetal / Burnt Orange palette with hard edges.
 */
const AppShell: React.FC<AppShellProps> = ({ sidebar, auxPanel, children }) => {
  return (
    <div className="h-screen w-screen grid grid-cols-[72px_1fr_320px] bg-[#0b0f12] text-tech-white border border-burnt-orange overflow-hidden">
      <div className="border-r border-burnt-orange bg-gradient-to-b from-black via-[#0f1419] to-black flex flex-col">
        {sidebar}
      </div>
      <div className="border-r border-burnt-orange bg-gradient-to-br from-[#0e141a] via-[#0b0f12] to-[#0a0c10]">
        {children}
      </div>
      <div className="bg-gradient-to-b from-[#0c1014] via-[#0a0d10] to-[#080a0d] border-l border-burnt-orange/80">
        {auxPanel}
      </div>
    </div>
  );
};

export default AppShell;
