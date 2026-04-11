import { useState } from 'react';
import { Search, Copy, Download, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import { useToast } from '../../context/ToastContext';

export const DataTable = ({ columns, data, searchPlaceholder = "Search...", actions, exportable = true }) => {
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredData = data.filter(item => 
    Object.values(item).some(val => String(val).toLowerCase().includes(search.toLowerCase()))
  );
  
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExport = (type) => addToast(`Data exported as ${type} successfully!`, 'success');

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder={searchPlaceholder}
              className="w-full bg-white dark:bg-[#0a0a0f] border border-slate-300 dark:border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-sm"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {exportable && (
            <div className="flex bg-white dark:bg-[#0a0a0f] rounded-lg border border-slate-200 dark:border-white/10 p-1 mr-2 shadow-sm">
              <button onClick={() => handleExport('Copy')} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded tooltip" title="Copy"><Copy className="w-4 h-4"/></button>
              <button onClick={() => handleExport('Excel')} className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-400/10 rounded" title="Excel"><Download className="w-4 h-4"/></button>
              <button onClick={() => handleExport('PDF')} className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-400/10 rounded" title="PDF"><FileText className="w-4 h-4"/></button>
            </div>
          )}
          {actions}
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-[#0a0a0f] shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/10">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="px-4 py-3 font-semibold tracking-wider">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? paginatedData.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                {columns.map((col, j) => (
                  <td key={j} className="px-4 py-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            )) : (
              <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">No records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries</p>
        <div className="flex items-center gap-1">
          <Button variant="secondary" className="px-3 py-1 text-xs" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} icon={ChevronLeft}>Prev</Button>
          <span className="px-3 py-1 text-sm text-slate-800 dark:text-white font-medium">{currentPage} / {totalPages || 1}</span>
          <Button variant="secondary" className="px-3 py-1 text-xs" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>Next <ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>
    </div>
  );
};
