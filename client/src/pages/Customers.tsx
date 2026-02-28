// @ts-nocheck
import React, { useState } from 'react';
import { Search, ArrowUpDown } from 'lucide-react';

const mockCustomers = [
  { id: 1, name: "Acme Logistics", orders: 145, spent: 12450.50, status: "Active" },
  { id: 2, name: "TechStart Drones", orders: 89, spent: 8920.25, status: "Active" },
  { id: 3, name: "Global Delivery NY", orders: 210, spent: 25845.00, status: "Active" },
  { id: 4, name: "Metro Express", orders: 12, spent: 1234.75, status: "Inactive" },
];

export default function CustomersView() {
  const [search, setSearch] = useState('');
  const [sortDesc, setSortDesc] = useState(true);

  const filtered = mockCustomers
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortDesc ? b.spent - a.spent : a.spent - b.spent);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold">Customers</h1><p className="text-sm text-slate-500 dark:text-slate-400">Manage client accounts and total lifetime value.</p></div>
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative w-full max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors" /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
              <tr><th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-xs">Customer Name</th><th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-xs">Total Orders</th><th onClick={() => setSortDesc(!sortDesc)} className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"><div className="flex items-center gap-2">Total Spent <ArrowUpDown size={14}/></div></th><th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-xs">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"><td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{c.name}</td><td className="px-6 py-4 text-slate-600 dark:text-slate-400">{c.orders}</td><td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400">${c.spent.toLocaleString(undefined, {minimumFractionDigits: 2})}</td><td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${c.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>{c.status}</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}