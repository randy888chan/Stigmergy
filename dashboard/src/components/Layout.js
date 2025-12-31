import React from 'react';

const Layout = ({ sidebar, children, rightPanel }) => {
  return (
    <div className="flex h-screen bg-zinc-950 text-white font-sans">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-zinc-900 p-4 flex flex-col space-y-4">
        <h1 className="text-xl font-semibold mb-4 text-center">Stigmergy</h1>
        {sidebar}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Right Panel (Collapsible) */}
      <aside className="w-96 bg-zinc-900 p-2 rounded-l-xl">
        {rightPanel}
      </aside>
    </div>
  );
};

export default Layout;
