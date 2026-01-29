import React from 'react';

const Layout = ({ sidebar, children, rightPanel }) => {
  return (
    <div className="flex h-screen bg-gradient-to-br from-zinc-900 to-black text-zinc-300 font-sans">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-black/40 backdrop-blur-xl border-r border-white/10 p-4 flex flex-col space-y-4">
        <h1 className="text-xl text-white font-tracking-tight font-semibold mb-4 text-center">Stigmergy</h1>
        {sidebar}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Right Panel (Collapsible) */}
      <aside className="w-96 bg-black/40 backdrop-blur-xl border-l border-white/10 p-2 rounded-l-xl">
        {rightPanel}
      </aside>
    </div>
  );
};

export default Layout;
