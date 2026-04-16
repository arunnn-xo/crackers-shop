import { Link, useLocation } from 'react-router-dom';
import { Star, X, ChevronRight } from 'lucide-react';
import { MENU_SECTIONS } from '../../data/menuConfig';
import crackersBgVideo from '../../assets/crackersbgvideo.mp4';

export const Sidebar = ({ isOpen, setOpen }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <>
      <div className={`fixed inset-0 bg-slate-900/50 dark:bg-black/60 z-40 lg:hidden ${isOpen ? 'block' : 'hidden'}`} onClick={() => setOpen(false)} />
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#13131a] border-r border-slate-200 dark:border-white/5 flex flex-col transition-transform duration-300 lg:translate-x-0 overflow-hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Global Sidebar Background Video for Dark Mode */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover hidden dark:block opacity-30 pointer-events-none mix-blend-lighten"
        >
          <source src={crackersBgVideo} type="video/mp4" />
        </video>

        <div className="relative z-10 h-16 flex items-center justify-between px-6 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Star className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-bold text-lg tracking-wide text-slate-800 dark:text-white dark:drop-shadow-md">Tom Crackers</span>
          </div>
          <button className="lg:hidden text-slate-500 hover:text-slate-800 dark:text-white dark:drop-shadow-md" onClick={() => setOpen(false)}><X className="w-5 h-5"/></button>
        </div>
        
        <div className="relative z-10 flex-1 overflow-y-auto py-2 px-3 custom-scrollbar">
          {MENU_SECTIONS.map((section, sIdx) => (
            <div key={sIdx} className="mb-2">
              <h4 className="px-3 text-xs font-bold text-slate-400 dark:text-slate-300/80 mb-2 tracking-wider uppercase mt-4 dark:drop-shadow-lg">
                {section.title}
              </h4>
              <ul className="space-y-1">
                {section.items.map((item, idx) => (
                  <li key={idx}>
                    <Link
                      to={item.path}
                      onClick={() => window.innerWidth < 1024 && setOpen(false)}
                      className={`relative w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 group dark:backdrop-blur-sm ${
                        isActive(item.path) 
                        ? 'bg-amber-50 dark:bg-amber-500/30 text-amber-600 dark:text-amber-300 border border-transparent dark:border-amber-400/40 dark:shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                        : 'text-slate-500 dark:text-slate-200 hover:text-slate-900 dark:hover:text-amber-300 hover:bg-slate-100/50 dark:hover:bg-black/50 border border-transparent dark:hover:border-white/10'
                      }`}
                    >
                      <div className="relative z-10 flex items-center gap-3 transform transition-transform duration-200 group-hover:translate-x-1 dark:drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        <item.icon className={`w-4 h-4 transition-colors ${isActive(item.path) ? 'dark:text-amber-300' : 'dark:text-slate-300 group-hover:dark:text-amber-300'}`} />
                        <span className="dark:tracking-wide">{item.label}</span>
                      </div>
                      {item.hasArrow && <ChevronRight className="relative z-10 w-4 h-4 opacity-50 dark:drop-shadow-md" />}
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
