// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Upload, Plus, X, DollarSign, FileType, CheckCircle2, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import OfflineMap from '../components/OfflineMap';

export default function OrdersView({ isDark }: any) {
  const [currentBatch, setCurrentBatch] = useState<any[] | null>(null);
  
  const [geo, setGeo] = useState({ nyc: null, counties: null });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showManual, setShowManual] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('All');
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [sortCol, setSortCol] = useState('id');
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => { 
    Promise.all([fetch('/api/geojson/nyc').then(r => r.json()), fetch('/api/geojson/counties').then(r => r.json())]).then(([nyc, counties]) => setGeo({ nyc, counties }));
  }, []);

  const resetFilters = () => {
    setSearch(''); setStatusFilter('All'); setCityFilter('All'); setPage(1);
  };

  const processFile = async (file: File) => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData(); formData.append('file', file);
    
    try {
      const res = await fetch('/api/orders/import', { method: 'POST', body: formData }).then(r => r.json());
      setTimeout(() => {
        setCurrentBatch(Array.isArray(res.orders) ? res.orders : []);
        resetFilters();
        setUploading(false);
        
        // ПОПЕРЕДЖЕННЯ ПРО ДУБЛІКАТИ
        if (res.duplicates > 0) {
          alert(`Upload Summary:\n\n✅ Added: ${res.added} new orders\n⚠️ Ignored: ${res.duplicates} duplicate orders`);
        }
      }, 1500); 
    } catch (e) {
      alert("Error processing file. Please check CSV format.");
      setUploading(false);
    }
  };

  const handleManualSubmit = async (e: any) => {
    e.preventDefault();
    setShowManual(false); 
    setUploading(true);
    
    const latStr = e.target.lat.value.replace(',', '.');
    const lngStr = e.target.lng.value.replace(',', '.');
    const subStr = e.target.subtotal.value.replace(',', '.');

    const payload = { 
      latitude: parseFloat(latStr), 
      longitude: parseFloat(lngStr), 
      subtotal: parseFloat(subStr) 
    };
    
    try {
      const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json());
      setTimeout(() => {
        setCurrentBatch([res.order]);
        resetFilters();
        setUploading(false);
      }, 1000);
    } catch (e) {
      alert("Error saving manual entry.");
      setUploading(false);
    }
  };

  const safeBatch = Array.isArray(currentBatch) ? currentBatch.filter(o => o && typeof o === 'object') : [];
  const batchTotal = safeBatch.reduce((sum, o) => sum + Number(o.subtotal || 0), 0);
  const batchTax = safeBatch.reduce((sum, o) => sum + Number(o.tax_amount || 0), 0);
  const verifiedCount = safeBatch.filter(o => o.status === 'Verified').length;
  const verifiedPct = safeBatch.length > 0 ? ((verifiedCount / safeBatch.length) * 100).toFixed(1) : 0;
  const mapOrders = safeBatch.slice(0, 500);

  const uniqueCities = useMemo(() => {
    return [...new Set(safeBatch.map(o => o.identified_region))].filter(Boolean);
  }, [safeBatch]);

  const filteredOrders = useMemo(() => {
    return safeBatch
      .filter(o => Object.values(o).map(v => String(v || '')).join(' ').toLowerCase().includes(search.toLowerCase()))
      .filter(o => statusFilter === 'All' ? true : statusFilter === 'Error' ? o.status?.includes('Error') : o.status === statusFilter)
      .filter(o => cityFilter === 'All' ? true : o.identified_region === cityFilter)
      .sort((a, b) => {
        if (a[sortCol] < b[sortCol]) return sortDesc ? 1 : -1;
        if (a[sortCol] > b[sortCol]) return sortDesc ? -1 : 1;
        return 0;
      });
  }, [safeBatch, search, statusFilter, cityFilter, sortCol, sortDesc]);

  const totalPages = Math.ceil(filteredOrders.length / perPage) || 1;
  const paginatedOrders = filteredOrders.slice((page - 1) * perPage, page * perPage);

  const getColLabel = (col: string) => {
    if (col === 'subtotal') return 'GROSS REVENUE';
    if (col === 'tax_amount') return 'TAX AMOUNT';
    if (col === 'identified_region') return 'REGION';
    return col.replace('_', ' ').toUpperCase();
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Data Ingestion</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Upload or manually enter delivery coordinates to process local taxes.</p>
        </div>
      </div>

      {uploading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-h-[400px] shadow-sm">
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}><FileType className="h-16 w-16 text-indigo-500 mb-6" /></motion.div>
          <p className="text-xl font-bold">Processing Geodata...</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">Running 100% Offline Point-in-Polygon Checks</p>
          <div className="w-64 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><motion.div className="h-full bg-indigo-500 rounded-full" animate={{ width: ["0%", "100%"] }} transition={{ duration: 1.5, ease: "linear", repeat: Infinity }} /></div>
        </div>
      ) : (safeBatch.length === 0) ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-8 md:p-12 text-center shadow-sm max-w-3xl mx-auto mt-10">
          <div onDragOver={e=>{e.preventDefault();setIsDragging(true)}} onDragLeave={e=>{e.preventDefault();setIsDragging(false)}} onDrop={e => {e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if(f?.name.endsWith('.csv')) processFile(f);}} className={`border-2 border-dashed rounded-2xl p-10 md:p-16 transition-colors ${isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}>
            <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragging ? 'text-indigo-500' : 'text-slate-400'}`} />
            <h3 className="text-xl font-bold mb-2">Drop your CSV file here</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">File must contain headers: latitude, longitude, subtotal</p>
            <input type="file" accept=".csv" className="hidden" id="csv-upload" onChange={e => processFile(e.target.files[0])} />
            <label htmlFor="csv-upload" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold cursor-pointer shadow-sm hover:bg-indigo-700 transition">Browse Files</label>
          </div>
          <div className="mt-8 flex items-center justify-center gap-4 text-slate-400"><span className="h-px w-24 bg-slate-200 dark:bg-slate-800"></span> <span className="text-sm font-semibold">OR</span> <span className="h-px w-24 bg-slate-200 dark:bg-slate-800"></span></div>
          <button onClick={() => setShowManual(true)} className="mt-8 flex items-center gap-2 mx-auto bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"><Plus size={18}/> Add Single Order Manually</button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl"><DollarSign size={24}/></div>
              <div><p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Revenue</p><p className="text-2xl font-black mt-1">${batchTotal.toFixed(2)}</p></div>
            </div>
            <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl"><ShieldAlert size={24}/></div>
              <div><p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tax Liability</p><p className="text-2xl font-black mt-1">${batchTax.toFixed(2)}</p></div>
            </div>
            <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl"><CheckCircle2 size={24}/></div>
              <div><p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Points</p><p className="text-2xl font-black mt-1">{verifiedPct}%</p></div>
            </div>
          </div>

          <div className="h-[400px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm relative z-0 flex flex-col">
             <div className="absolute top-4 left-4 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold shadow-md border border-slate-200 dark:border-slate-700">
                Displaying {mapOrders.length} points {safeBatch.length > 500 && "(limited for performance)"}
             </div>
             <OfflineMap geo={geo} orders={mapOrders} zoom={6} center={[42.8, -75.5]} isDark={isDark} />
          </div>

          <div className="flex flex-wrap gap-4 items-center justify-between">
             <div className="flex gap-4 items-center">
               <input type="file" accept=".csv" className="hidden" id="csv-quick" onChange={e => processFile(e.target.files[0])} />
               <label htmlFor="csv-quick" className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold shadow-sm hover:bg-indigo-700 cursor-pointer transition"><Upload size={16}/> Process New CSV</label>
               <button onClick={() => setShowManual(true)} className="flex items-center gap-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 px-5 py-2.5 rounded-lg font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-900 transition"><Plus size={16}/> Add Manual Entry</button>
             </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
               <div className="relative w-full md:w-auto">
                 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input type="text" placeholder="Search orders..." value={search} onChange={e => {setSearch(e.target.value); setPage(1);}} className="w-full md:w-64 pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-sm outline-none focus:border-indigo-500" />
               </div>
               <div className="flex gap-3 items-center">
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
                    {['id', 'identified_region', 'subtotal', 'tax_amount', 'status'].map(col => (
                      <th key={col} onClick={() => { if(sortCol === col) setSortDesc(!sortDesc); else { setSortCol(col); setSortDesc(false); } }} className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 text-xs uppercase cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
                        <div className="flex items-center gap-1">{getColLabel(col)} {sortCol === col && (sortDesc ? <ChevronDown size={14}/> : <ChevronUp size={14}/>)}</div>
                      </th>
                    ))}
                    <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 text-xs uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {paginatedOrders.map((o:any) => (
                    <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4 font-bold">{o.id}</td>
                      <td className="px-6 py-4 font-medium">{o.identified_region || 'Unknown'}</td>
                      <td className="px-6 py-4 font-bold">${Number(o.subtotal||0).toFixed(2)}</td>
                      <td className="px-6 py-4 font-bold text-red-500 dark:text-red-400">-${Number(o.tax_amount||0).toFixed(2)}</td>
                      <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${o.status === 'Verified' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400'}`}>{o.status || 'Error'}</span></td>
                      <td className="px-6 py-4"><button onClick={() => setSelectedOrder(o)} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">View</button></td>
                    </tr>
                  ))}
                  {paginatedOrders.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-slate-500">No results found for these filters.</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-wrap justify-between items-center text-sm gap-4 text-slate-600 dark:text-slate-400">
               <div className="flex items-center gap-4">
                 <span className="font-semibold text-slate-900 dark:text-white">
                   Showing {filteredOrders.length === 0 ? 0 : (page - 1) * perPage + 1} to {Math.min(page * perPage, filteredOrders.length)} of {filteredOrders.length} entries
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
        </motion.div>
      )}

      <AnimatePresence>
        {showManual && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
               <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center"><h3 className="font-bold">Manual Entry</h3><button onClick={() => setShowManual(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X size={18}/></button></div>
               <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
                 <div><label className="text-xs font-bold text-slate-500 uppercase">Latitude</label><input type="text" name="lat" required className="w-full p-2.5 border border-slate-300 dark:border-slate-700 dark:bg-slate-950 rounded-lg mt-1 outline-none focus:border-indigo-500" placeholder="e.g. 40.7128" /></div>
                 <div><label className="text-xs font-bold text-slate-500 uppercase">Longitude</label><input type="text" name="lng" required className="w-full p-2.5 border border-slate-300 dark:border-slate-700 dark:bg-slate-950 rounded-lg mt-1 outline-none focus:border-indigo-500" placeholder="e.g. -74.0060" /></div>
                 <div><label className="text-xs font-bold text-slate-500 uppercase">Subtotal ($)</label><input type="text" name="subtotal" required className="w-full p-2.5 border border-slate-300 dark:border-slate-700 dark:bg-slate-950 rounded-lg mt-1 outline-none focus:border-indigo-500" placeholder="e.g. 120.50" /></div>
                 <button type="submit" className="w-full bg-indigo-600 text-white p-3 rounded-lg font-bold hover:bg-indigo-700 mt-4 transition">Process Order</button>
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