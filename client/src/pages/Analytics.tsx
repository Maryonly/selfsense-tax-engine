// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { Download, Search, TrendingUp, DollarSign, ChevronDown, ChevronUp, Package, CheckCircle2, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import OfflineMap from '../components/OfflineMap';

export default function AnalyticsView({ isDark }: any) {
  const [orders, setOrders] = useState([]);
  const [geo, setGeo] = useState({ nyc: null, counties: null });
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [sortCol, setSortCol] = useState('id');
  const [sortDesc, setSortDesc] = useState(true);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const [exFormat, setExFormat] = useState('csv');
  const [exStart, setExStart] = useState('');
  const [exEnd, setExEnd] = useState('');
  const [exCity, setExCity] = useState('All');
  const [exStatus, setExStatus] = useState('All');

  useEffect(() => { 
    fetch('/api/orders')
      .then(r => r.json())
      .then(data => setOrders(Array.isArray(data) ? data : [])); 
    Promise.all([fetch('/api/geojson/nyc').then(r => r.json()), fetch('/api/geojson/counties').then(r => r.json())]).then(([nyc, counties]) => setGeo({ nyc, counties }));
  }, []);

  const safeOrders = Array.isArray(orders) ? orders.filter(o => o && typeof o === 'object') : [];
  
  const totalRev = safeOrders.reduce((acc:any, o:any) => acc + Number(o.subtotal||0), 0);
  const totalTax = safeOrders.reduce((acc:any, o:any) => acc + Number(o.tax_amount||0), 0);
  const totalOrders = safeOrders.length;
  const verifiedCount = safeOrders.filter((o:any) => o.status === 'Verified').length;
  const verifiedPct = totalOrders > 0 ? ((verifiedCount / totalOrders) * 100).toFixed(1) : 0;

  const uniqueCities = useMemo(() => {
    return [...new Set(safeOrders.map((o:any) => o.identified_region))].filter(Boolean);
  }, [safeOrders]);

  const handleAdvancedExport = (e: any) => {
    e.preventDefault();
    let filteredToExport = safeOrders;
    
    if (exStart) filteredToExport = filteredToExport.filter((o:any) => new Date(o.timestamp) >= new Date(exStart));
    if (exEnd) {
       const end = new Date(exEnd); end.setHours(23, 59, 59, 999);
       filteredToExport = filteredToExport.filter((o:any) => new Date(o.timestamp) <= end);
    }
    if (exCity !== 'All') filteredToExport = filteredToExport.filter((o:any) => o.identified_region === exCity);
    if (exStatus !== 'All') {
      if (exStatus === 'Verified') filteredToExport = filteredToExport.filter((o:any) => o.status === 'Verified');
      else filteredToExport = filteredToExport.filter((o:any) => o.status !== 'Verified'); 
    }

    if (filteredToExport.length === 0) {
      alert("No data found for these export filters.");
      return;
    }

    if (exFormat === 'csv') {
      const csvContent = "data:text/csv;charset=utf-8," + "ID,Timestamp,Latitude,Longitude,Region,Gross Revenue,Tax Liability,Net Revenue,Status\n" 
        + filteredToExport.map((o:any) => `${o.id},${o.timestamp},${o.latitude},${o.longitude},${o.identified_region},${o.subtotal},${o.tax_amount},${(Number(o.subtotal||0) - Number(o.tax_amount||0)).toFixed(2)},${o.status}`).join("\n");
      const link = document.createElement("a"); 
      link.setAttribute("href", encodeURI(csvContent)); 
      link.setAttribute("download", `SelfSense_Report_${new Date().toISOString().split('T')[0]}.csv`); 
      document.body.appendChild(link); link.click(); link.remove();
    } else {
      const printWindow = window.open('', '_blank');
      const html = `
        <html>
          <head>
            <title>SelfSense Tax Report</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
              h1 { color: #4F46E5; margin-bottom: 5px; }
              p { margin-top: 0; color: #666; font-size: 14px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
              th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
              th { background-color: #f8fafc; color: #475569; text-transform: uppercase; }
              .status-ok { color: #16a34a; font-weight: bold; }
              .status-err { color: #dc2626; font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>SelfSense Drone Tax Engine</h1>
            <p>Historical Tax Report &bull; Generated: ${new Date().toLocaleString()}</p>
            <p>Total Records: <strong>${filteredToExport.length}</strong> &bull; Filters: Status [${exStatus}], City [${exCity}]</p>
            <table>
              <thead><tr><th>ID</th><th>Date</th><th>Coordinates</th><th>City/Region</th><th>Gross Revenue</th><th>Tax Liability</th><th>Net Revenue</th><th>Status</th></tr></thead>
              <tbody>
                ${filteredToExport.map((o:any) => `<tr><td>${o.id}</td><td>${o.timestamp ? new Date(o.timestamp).toLocaleString('uk-UA') : 'N/A'}</td><td>${Number(o.latitude||0).toFixed(4)}, ${Number(o.longitude||0).toFixed(4)}</td><td>${o.identified_region || 'Unknown'}</td><td>$${Number(o.subtotal||0).toFixed(2)}</td><td style="color:#dc2626">-$${Number(o.tax_amount||0).toFixed(2)}</td><td><strong>$${(Number(o.subtotal||0) - Number(o.tax_amount||0)).toFixed(2)}</strong></td><td class="${o.status === 'Verified' ? 'status-ok' : 'status-err'}">${o.status}</td></tr>`).join('')}
              </tbody>
            </table>
            <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
          </body>
        </html>
      `;
      printWindow?.document.write(html);
      printWindow?.document.close();
    }
    setShowExportModal(false);
  };

  const filtered = useMemo(() => {
    return safeOrders
      .filter((o:any) => Object.values(o).map(v => String(v || '')).join(' ').toLowerCase().includes(search.toLowerCase()))
      .filter((o:any) => statusFilter === 'All' ? true : statusFilter === 'Error' ? o.status?.includes('Error') : o.status === statusFilter)
      .filter((o:any) => cityFilter === 'All' ? true : o.identified_region === cityFilter)
      .sort((a:any, b:any) => {
        if (a[sortCol] < b[sortCol]) return sortDesc ? 1 : -1;
        if (a[sortCol] > b[sortCol]) return sortDesc ? -1 : 1;
        return 0;
      });
  }, [safeOrders, search, statusFilter, cityFilter, sortCol, sortDesc]);

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const getColLabel = (col: string) => {
    if (col === 'subtotal') return 'GROSS REVENUE';
    if (col === 'tax_amount') return 'TAX LIABILITY';
    if (col === 'identified_region') return 'REGION';
    return col.replace('_', ' ').toUpperCase();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div><h1 className="text-2xl font-bold">Analytics & Reports</h1><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Historical performance and tax liability tracking.</p></div>
        <button onClick={() => setShowExportModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold shadow-sm hover:bg-indigo-700 transition"><Download size={16}/> Export Report</button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl"><Package size={24}/></div>
          <div><p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Total Orders</p><p className="text-2xl font-black mt-1">{totalOrders}</p></div>
        </div>
        <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl"><CheckCircle2 size={24}/></div>
          <div><p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Verified Points</p><p className="text-2xl font-black mt-1">{verifiedPct}%</p></div>
        </div>
        <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl"><TrendingUp size={24}/></div>
          <div><p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Gross Revenue</p><p className="text-2xl font-black mt-1">${totalRev.toFixed(2)}</p></div>
        </div>
        <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl"><DollarSign size={24}/></div>
          <div><p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Tax Liability</p><p className="text-2xl font-black mt-1">${totalTax.toFixed(2)}</p></div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 gap-4">
           <div className="relative w-full md:w-auto">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input type="text" placeholder="Search archive..." value={search} onChange={e => {setSearch(e.target.value); setPage(1);}} className="w-full md:w-64 pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors" />
           </div>
           
           <div className="flex gap-3 items-center flex-wrap">
             <select value={statusFilter} onChange={e => {setStatusFilter(e.target.value); setPage(1);}} className="py-2 px-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-sm outline-none">
               <option value="All">All Statuses</option><option value="Verified">Verified</option><option value="Error">Errors Only</option>
             </select>
             <select value={cityFilter} onChange={e => {setCityFilter(e.target.value); setPage(1);}} className="py-2 px-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-sm outline-none max-w-[150px] truncate">
               <option value="All">All Cities</option>{uniqueCities.map(c => <option key={String(c)} value={String(c)}>{c}</option>)}
             </select>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
              <tr>
                {['id', 'timestamp', 'latitude', 'longitude', 'identified_region', 'subtotal', 'tax_amount', 'status'].map(col => (
                  <th key={col} onClick={() => { if(sortCol === col) setSortDesc(!sortDesc); else { setSortCol(col); setSortDesc(false); } }} className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 text-xs uppercase cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
                    <div className="flex items-center gap-1">{getColLabel(col)} {sortCol === col && (sortDesc ? <ChevronDown size={14}/> : <ChevronUp size={14}/>)}</div>
                  </th>
                ))}
                <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {paginated.map((o:any) => (
                <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4 font-bold">{o.id}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{o.timestamp ? new Date(o.timestamp).toLocaleString('uk-UA') : 'N/A'}</td>
                  <td className="px-6 py-4 font-mono text-xs">{Number(o.latitude||0).toFixed(4)}</td>
                  <td className="px-6 py-4 font-mono text-xs">{Number(o.longitude||0).toFixed(4)}</td>
                  <td className="px-6 py-4 font-medium">{o.identified_region || 'Unknown'}</td>
                  <td className="px-6 py-4 font-bold">${Number(o.subtotal||0).toFixed(2)}</td>
                  <td className="px-6 py-4 font-bold text-red-500 dark:text-red-400">-${Number(o.tax_amount||0).toFixed(2)}</td>
                  <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${o.status === 'Verified' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400'}`}>{o.status || 'Error'}</span></td>
                  <td className="px-6 py-4"><button onClick={() => setSelectedOrder(o)} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">View</button></td>
                </tr>
              ))}
              {paginated.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-slate-500">No records found.</td></tr>}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-wrap justify-between items-center text-sm gap-4 text-slate-600 dark:text-slate-400">
           <div className="flex items-center gap-4">
             <span className="font-semibold text-slate-900 dark:text-white">
               Showing {filtered.length === 0 ? 0 : (page - 1) * perPage + 1} to {Math.min(page * perPage, filtered.length)} of {filtered.length} entries
             </span>
             <div className="hidden sm:block">Rows: <select value={perPage} onChange={e => {setPerPage(Number(e.target.value)); setPage(1);}} className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded p-1 ml-1 outline-none"><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></select></div>
           </div>
           <div className="flex gap-2 items-center">
             <span>Page {page} of {totalPages}</span>
             <button disabled={page === 1} onClick={() => setPage(p=>p-1)} className="px-3 py-1 border border-slate-300 dark:border-slate-700 rounded disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 transition">Prev</button>
             <button disabled={page === totalPages} onClick={() => setPage(p=>p+1)} className="px-3 py-1 border border-slate-300 dark:border-slate-700 rounded disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 transition">Next</button>
           </div>
        </div>
      </div>

      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
               <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center"><h3 className="font-bold flex items-center gap-2"><FileText size={18}/> Export Report Options</h3><button onClick={() => setShowExportModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X size={18}/></button></div>
               <form onSubmit={handleAdvancedExport} className="p-6 space-y-5">
                 <div className="grid grid-cols-2 gap-4">
                   <div><label className="text-xs font-bold text-slate-500 uppercase">Start Date</label><input type="date" value={exStart} onChange={e=>setExStart(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-700 dark:bg-slate-950 rounded-lg mt-1 outline-none" /></div>
                   <div><label className="text-xs font-bold text-slate-500 uppercase">End Date</label><input type="date" value={exEnd} onChange={e=>setExEnd(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-700 dark:bg-slate-950 rounded-lg mt-1 outline-none" /></div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-xs font-bold text-slate-500 uppercase">City / Region</label>
                     <select value={exCity} onChange={e=>setExCity(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-700 dark:bg-slate-950 rounded-lg mt-1 outline-none"><option value="All">All Regions</option>{uniqueCities.map(c => <option key={String(c)} value={String(c)}>{c}</option>)}</select>
                   </div>
                   <div>
                     <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                     <select value={exStatus} onChange={e=>setExStatus(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-700 dark:bg-slate-950 rounded-lg mt-1 outline-none"><option value="All">All Statuses</option><option value="Verified">Verified Only</option><option value="Error">Errors / Out of Bounds</option></select>
                   </div>
                 </div>
                 <div>
                   <label className="text-xs font-bold text-slate-500 uppercase">Export Format</label>
                   <div className="flex gap-4 mt-2">
                     <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="format" value="csv" checked={exFormat === 'csv'} onChange={()=>setExFormat('csv')} className="w-4 h-4 text-indigo-600" /> <span>CSV (Excel)</span></label>
                     <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="format" value="pdf" checked={exFormat === 'pdf'} onChange={()=>setExFormat('pdf')} className="w-4 h-4 text-indigo-600" /> <span>PDF Document</span></label>
                   </div>
                 </div>
                 <button type="submit" className="w-full bg-slate-900 dark:bg-indigo-600 text-white p-3.5 rounded-lg font-bold hover:bg-slate-800 dark:hover:bg-indigo-700 transition mt-2 flex justify-center items-center gap-2"><Download size={18}/> Generate & Download</button>
               </form>
            </motion.div>
          </div>
        )}

        {selectedOrder && (
          <>
            <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25 }} className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white dark:bg-slate-950 shadow-2xl border-l border-slate-200 dark:border-slate-800 overflow-y-auto">
              <div className="p-6">
                
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Order Details</h2>
                    <p className="text-sm font-medium text-slate-500">ID: {selectedOrder.id}</p>
                  </div>
                  <button onClick={() => setSelectedOrder(null)} className="hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition"><X/></button>
                </div>
                
                <div className="mb-8 space-y-3">
                  <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Order Information</h3>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Timestamp</span><span className="font-semibold text-slate-900 dark:text-white">{selectedOrder.timestamp ? new Date(selectedOrder.timestamp).toLocaleString('uk-UA') : 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Jurisdiction</span><span className="font-semibold text-slate-900 dark:text-white">{selectedOrder.identified_region || 'Unknown'}</span></div>
                    <div className="flex justify-between items-center"><span className="text-slate-500">Status</span><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${selectedOrder.status === 'Verified' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400'}`}>{selectedOrder.status || 'Error'}</span></div>
                  </div>
                </div>

                <div className="mb-8 space-y-3">
                  <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Delivery Location</h3>
                  <div className="h-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 relative z-0 overflow-hidden shadow-inner">
                    <OfflineMap geo={geo} orders={[selectedOrder]} zoom={12} center={[selectedOrder.latitude, selectedOrder.longitude]} isDark={isDark} />
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Financial Breakdown</h3>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950 shadow-sm">
                    <div className="p-5 space-y-3 text-sm border-b border-slate-200 dark:border-slate-800">
                      <div className="flex justify-between"><span className="text-slate-500">State Tax ({(Number(selectedOrder.state_rate||0)*100).toFixed(2)}%)</span><span className="font-medium text-slate-700 dark:text-slate-300">${(Number(selectedOrder.subtotal||0) * Number(selectedOrder.state_rate||0)).toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">County Tax ({(Number(selectedOrder.county_rate||0)*100).toFixed(2)}%)</span><span className="font-medium text-slate-700 dark:text-slate-300">${(Number(selectedOrder.subtotal||0) * Number(selectedOrder.county_rate||0)).toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">City Tax ({(Number(selectedOrder.city_rate||0)*100).toFixed(2)}%)</span><span className="font-medium text-slate-700 dark:text-slate-300">${(Number(selectedOrder.subtotal||0) * Number(selectedOrder.city_rate||0)).toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">MCTD (Special Dist.) ({(Number(selectedOrder.special_rates||0)*100).toFixed(3)}%)</span><span className="font-medium text-slate-700 dark:text-slate-300">${(Number(selectedOrder.subtotal||0) * Number(selectedOrder.special_rates||0)).toFixed(2)}</span></div>
                    </div>
                    <div className="p-5 space-y-3 text-sm">
                      <div className="flex justify-between"><span className="font-semibold text-slate-900 dark:text-white">Total Collected</span><span className="font-bold text-slate-900 dark:text-white">${Number(selectedOrder.subtotal||0).toFixed(2)}</span></div>
                      <div className="flex justify-between text-red-500 dark:text-red-400"><span className="font-semibold">Less Tax Liability</span><span className="font-bold">-${Number(selectedOrder.tax_amount||0).toFixed(2)}</span></div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-sm">Net Revenue</span>
                      <span className="text-2xl font-black text-slate-900 dark:text-white">${(Number(selectedOrder.subtotal||0) - Number(selectedOrder.tax_amount||0)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}