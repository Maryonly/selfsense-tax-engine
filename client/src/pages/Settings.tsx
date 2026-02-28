// @ts-nocheck
import React from 'react';
import { Download, Trash2, Moon, LogOut } from 'lucide-react';

export default function SettingsView({ isDark, setIsDark }: any) {
  const handleClearHistory = async () => {
    if (window.confirm("CRITICAL WARNING: This will permanently delete all orders from the local SQLite database.")) {
      await fetch('/api/orders', { method: 'DELETE' });
      alert("Database wiped successfully.");
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div><h1 className="text-2xl font-bold">Settings</h1><p className="text-sm text-slate-500 dark:text-slate-400">Manage your workspace and system data.</p></div>
      
      <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center">
        <div><h3 className="font-bold text-lg flex items-center gap-2"><Moon size={20}/> Appearance</h3><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Toggle dark mode for the interface.</p></div>
        <button onClick={() => setIsDark(!isDark)} className={`w-14 h-7 rounded-full transition-colors relative ${isDark ? 'bg-indigo-600' : 'bg-slate-300'}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${isDark ? 'left-8' : 'left-1'}`}></div></button>
      </div>

      <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
         <h3 className="font-bold text-lg mb-4">Data Management</h3>
         <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Export all current system data (JSON) or completely wipe the local SQLite database to start fresh.</p>
         <div className="flex flex-wrap gap-4">
           <button onClick={() => window.open('/api/orders/export', '_blank')} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-lg font-bold shadow-sm hover:bg-slate-800"><Download size={18}/> Export Data Dump</button>
           <button onClick={handleClearHistory} className="flex items-center gap-2 px-5 py-2.5 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg font-bold hover:bg-red-100 dark:hover:bg-red-900/40"><Trash2 size={18}/> Clear Database History</button>
         </div>
      </div>
    </div>
  );
}