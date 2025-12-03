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
    <div className="h-screen w-screen grid grid-cols-[72px_1fr_300px] bg-gunmetal text-tech-white border border-burnt-orange">
      <div className="border-r border-burnt-orange bg-black/40 flex flex-col">{sidebar}</div>
      <div className="border-r border-burnt-orange bg-gunmetal/80">{children}</div>
      <div className="bg-black/50">{auxPanel}</div>
    </div>
  );
};

export default AppShell;
