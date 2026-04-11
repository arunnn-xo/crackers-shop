import { createContext, useContext, useState } from 'react';
import { Check } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div key={toast.id} className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 transform transition-all duration-300 translate-y-0 opacity-100 ${
            toast.type === 'success' 
            ? 'bg-emerald-50 dark:bg-[#1a2e25] text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' 
            : 'bg-rose-50 dark:bg-[#2e1a1a] text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
          }`}>
            <Check className="w-5 h-5" />
            <p className="font-medium text-sm">{toast.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
