import { Link, useLocation } from 'react-router-dom';
import { Star, X, ChevronRight } from 'lucide-react';
import { MENU_SECTIONS } from '../../data/menuConfig';

export const Sidebar = ({ isOpen, setOpen }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <>
      <div className={`fixed inset-0 bg-slate-900/50 dark:bg-black/60 z-40 lg:hidden ${isOpen ? 'block' : 'hidden'}`} onClick={() => setOpen(false)} />
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#13131a] border-r border-slate-200 dark:border-white/5 flex flex-col transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
              <Star className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-bold text-lg tracking-wide text-slate-800 dark:text-white">Tom Crackers</span>
          </div>
          <button className="lg:hidden text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white" onClick={() => setOpen(false)}><X className="w-5 h-5"/></button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-2 px-3 custom-scrollbar">
          {MENU_SECTIONS.map((section, sIdx) => (
            <div key={sIdx} className="mb-2">
              <h4 className="px-3 text-xs font-bold text-slate-400 dark:text-slate-500 mb-2 tracking-wider uppercase mt-4">
                {section.title}
              </h4>
              <ul className="space-y-1">
                {section.items.map((item, idx) => (
                  <li key={idx}>
                    <Link
                      to={item.path}
                      onClick={() => window.innerWidth < 1024 && setOpen(false)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                        isActive(item.path) 
                        ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3 transform transition-transform duration-200 group-hover:translate-x-1">
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </div>
                      {item.hasArrow && <ChevronRight className="w-4 h-4 opacity-50" />}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
};
