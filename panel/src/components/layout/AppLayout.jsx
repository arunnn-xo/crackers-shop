import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f] text-slate-800 dark:text-slate-200 font-['DM_Sans',sans-serif] selection:bg-amber-500/30 transition-colors duration-300">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');
        * { font-family: 'DM Sans', sans-serif !important; }
      `}</style>
      <Sidebar isOpen={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <Header setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
