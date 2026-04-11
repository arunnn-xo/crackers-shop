import { Menu, Moon, Sun, ChevronDown, LogOut } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export const Header = ({ setSidebarOpen }) => {
  const { isDark, toggleTheme } = useTheme();
  const { logout } = useAuth();
  
  return (
    <header className="h-16 bg-white/80 dark:bg-[#13131a]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"><Menu className="w-6 h-6" /></button>
        <div className="hidden sm:block text-sm text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase">Admin Portal</div>
      </div>
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleTheme} 
          className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
          title="Toggle Theme"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 py-1.5 px-3 rounded-full border border-slate-200 dark:border-white/10 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
          <div className="w-7 h-7 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">SA</div>
          <span className="text-sm font-medium text-slate-800 dark:text-white hidden sm:block">System Admin</span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>

        <button 
          onClick={logout}
          className="p-2 text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-full transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
