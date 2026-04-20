import { Fragment, useEffect, useMemo, useState } from 'react';
import { Search, Copy, Download, FileText, ChevronLeft, ChevronRight, Columns3, Minus, Plus } from 'lucide-react';
import { Button } from './Button';
import { useToast } from '../../context/ToastContext';

export const DataTable = ({
  columns,
  data,
  searchPlaceholder = "Search...",
  actions,
  exportable = true,
  exportVariant = 'icons',
  showColumnVisibility = false,
  exportFileName = 'export',
  showSearch = true,
  getRowClassName,
  rowKey,
  renderExpandedRow,
}) => {
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState(columns.map((column) => column.key));
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const itemsPerPage = 10;

  useEffect(() => {
    setVisibleColumnKeys(columns.map((column) => column.key));
  }, [columns]);

  const visibleColumns = useMemo(
    () => columns.filter((column) => visibleColumnKeys.includes(column.key)),
    [columns, visibleColumnKeys]
  );

  const exportColumns = useMemo(
    () => visibleColumns.filter((column) => column.key !== 'actions' && column.key !== 'expand'),
    [visibleColumns]
  );

  const filteredData = data.filter(item => 
    Object.values(item).some(val => String(val).toLowerCase().includes(search.toLowerCase()))
  );
  
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getResolvedRowKey = (row, index) => {
    if (typeof rowKey === 'function') {
      return rowKey(row, index);
    }

    if (typeof rowKey === 'string' && row?.[rowKey] != null) {
      return row[rowKey];
    }

    if (row?.id != null) {
      return row.id;
    }

    return index;
  };

  useEffect(() => {
    if (typeof renderExpandedRow !== 'function') {
      setExpandedRowKeys([]);
      return;
    }

    const availableKeys = new Set(
      data.map((row, index) => String(getResolvedRowKey(row, index)))
    );

    setExpandedRowKeys((current) => current.filter((key) => availableKeys.has(String(key))));
  }, [data, renderExpandedRow, rowKey]);

  const getExportRows = () =>
    filteredData.map((row) =>
      exportColumns.map((column) => {
        const value = row[column.key];
        if (value == null) {
          return '';
        }
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        return String(value);
      })
    );

  const handleCopyExport = async () => {
    try {
      const lines = [
        exportColumns.map((column) => column.label).join('\t'),
        ...getExportRows().map((row) => row.join('\t')),
      ];
      const content = lines.join('\n');

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(content);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = content;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      addToast('Data copied successfully!');
    } catch {
      addToast('Unable to copy data.', 'error');
    }
  };

  const handleExcelExport = () => {
    try {
      const escapeCsvValue = (value) => `"${String(value).replace(/"/g, '""')}"`;
      const lines = [
        exportColumns.map((column) => escapeCsvValue(column.label)).join(','),
        ...getExportRows().map((row) => row.map(escapeCsvValue).join(',')),
      ];

      const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${exportFileName}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast('Excel export downloaded successfully!');
    } catch {
      addToast('Unable to export Excel file.', 'error');
    }
  };

  const handlePdfExport = () => {
    try {
      const tableHead = exportColumns.map((column) => `<th>${column.label}</th>`).join('');
      const tableRows = getExportRows()
        .map((row) => `<tr>${row.map((value) => `<td>${value}</td>`).join('')}</tr>`)
        .join('');

      const printWindow = window.open('', '_blank', 'width=1200,height=800');
      if (!printWindow) {
        addToast('Popup blocked. Allow popups to export PDF.', 'error');
        return;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>${exportFileName}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
              h1 { margin-bottom: 16px; font-size: 24px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 12px; }
              th { background: #f8fafc; }
            </style>
          </head>
          <body>
            <h1>${exportFileName}</h1>
            <table>
              <thead><tr>${tableHead}</tr></thead>
              <tbody>${tableRows}</tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();

      addToast('PDF export opened in print dialog.');
    } catch {
      addToast('Unable to export PDF.', 'error');
    }
  };

  const handleExport = (type) => {
    if (type === 'Copy') {
      handleCopyExport();
      return;
    }

    if (type === 'Excel') {
      handleExcelExport();
      return;
    }

    if (type === 'PDF') {
      handlePdfExport();
      return;
    }
  };
  const toggleColumn = (key) => {
    setVisibleColumnKeys((current) =>
      current.includes(key) ? current.filter((columnKey) => columnKey !== key) : [...current, key]
    );
  };

  const toggleExpandedRow = (resolvedRowKey) => {
    const normalizedKey = String(resolvedRowKey);
    setExpandedRowKeys((current) =>
      current.includes(normalizedKey)
        ? current.filter((key) => key !== normalizedKey)
        : [...current, normalizedKey]
    );
  };

  const renderCellValue = (column, row) => (column.render ? column.render(row[column.key], row) : row[column.key]);

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            {showSearch ? (
              <>
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder={searchPlaceholder}
                  className="w-full bg-white dark:bg-[#0a0a0f] border border-slate-300 dark:border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-sm"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                />
              </>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {exportable && (
            <div className={`flex items-center rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a0f] shadow-sm ${exportVariant === 'buttons' ? 'gap-1 p-1.5' : 'mr-2 p-1'}`}>
              {exportVariant === 'buttons' ? (
                <>
                  <button onClick={() => handleExport('Copy')} className="rounded px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10">Copy</button>
                  <button onClick={() => handleExport('Excel')} className="rounded px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10">Excel</button>
                  <button onClick={() => handleExport('PDF')} className="rounded px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10">PDF</button>
                </>
              ) : (
                <>
                  <button onClick={() => handleExport('Copy')} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded tooltip" title="Copy"><Copy className="w-4 h-4"/></button>
                  <button onClick={() => handleExport('Excel')} className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-400/10 rounded" title="Excel"><Download className="w-4 h-4"/></button>
                  <button onClick={() => handleExport('PDF')} className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-400/10 rounded" title="PDF"><FileText className="w-4 h-4"/></button>
                </>
              )}
              {showColumnVisibility && (
                <div className="relative">
                  <button
                    onClick={() => setIsColumnMenuOpen((current) => !current)}
                    className={`inline-flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 ${exportVariant === 'icons' ? 'ml-1' : ''}`}
                  >
                    <Columns3 className="h-4 w-4" />
                    {exportVariant === 'buttons' ? 'Column visibility' : ''}
                  </button>
                  {isColumnMenuOpen && (
                    <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-white/10 dark:bg-[#13131a]">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Visible Columns</p>
                      <div className="space-y-2">
                        {columns.map((column) => (
                          <label key={column.key} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <input
                              type="checkbox"
                              checked={visibleColumnKeys.includes(column.key)}
                              onChange={() => toggleColumn(column.key)}
                            />
                            <span>{column.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {actions}
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-[#0a0a0f] shadow-sm">
        <table className="w-full min-w-[720px] text-sm text-left">
          <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/10">
            <tr>
              {visibleColumns.map((col, i) => (
                <th key={i} className="px-4 py-3 font-semibold tracking-wider">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? paginatedData.map((row, i) => {
              const resolvedRowKey = getResolvedRowKey(row, (currentPage - 1) * itemsPerPage + i);
              const isExpanded = expandedRowKeys.includes(String(resolvedRowKey));

              return (
                <Fragment key={resolvedRowKey}>
                  <tr
                    className={`border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors ${getRowClassName ? getRowClassName(row) : ''}`}
                  >
                    {visibleColumns.map((col, j) => (
                      <td key={`${resolvedRowKey}-${col.key}`} className="px-4 py-3 align-middle text-slate-700 dark:text-slate-300">
                        {typeof renderExpandedRow === 'function' && j === 0 ? (
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => toggleExpandedRow(resolvedRowKey)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-sky-600 transition-colors hover:bg-sky-100 dark:border-sky-400/30 dark:bg-sky-500/10 dark:text-sky-300 dark:hover:bg-sky-500/20"
                              aria-label={isExpanded ? 'Collapse row details' : 'Expand row details'}
                            >
                              {isExpanded ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                            </button>
                            <div className="min-w-0 flex-1">{renderCellValue(col, row)}</div>
                          </div>
                        ) : (
                          renderCellValue(col, row)
                        )}
                      </td>
                    ))}
                  </tr>
                  {typeof renderExpandedRow === 'function' && isExpanded ? (
                    <tr key={`${resolvedRowKey}-expanded`} className="border-b border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02]">
                      <td colSpan={visibleColumns.length || 1} className="px-4 py-4">
                        {renderExpandedRow(row)}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            }) : (
              <tr><td colSpan={visibleColumns.length || 1} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">No records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries</p>
        <div className="flex items-center gap-1">
          <Button variant="secondary" className="px-3 py-1 text-xs" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} icon={ChevronLeft}>Prev</Button>
          <span className="px-3 py-1 text-sm text-slate-800 dark:text-white font-medium">{currentPage} / {totalPages || 1}</span>
          <Button variant="secondary" className="px-3 py-1 text-xs" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>Next <ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>
    </div>
  );
};
