// @ts-nocheck
import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, Check } from 'lucide-react';

const initNotifs = [
  { id: 1, icon: CheckCircle2, color: 'text-green-500 bg-green-100 dark:bg-green-500/20', title: 'Bulk upload completed', time: '2 mins ago', read: false },
  { id: 2, icon: Info, color: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-500/20', title: 'Tax database updated', time: '1 hour ago', read: false },
  { id: 3, icon: AlertTriangle, color: 'text-orange-500 bg-orange-100 dark:bg-orange-500/20', title: 'Invalid coordinates found in CSV', time: '3 hours ago', read: true },
];

export default function NotificationsView() {
  const [notifs, setNotifs] = useState(initNotifs);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div><h1 className="text-2xl font-bold">Notifications</h1><p className="text-sm text-slate-500 dark:text-slate-400">System alerts and background process logs.</p></div>
        <button onClick={() => setNotifs(notifs.map(n => ({ ...n, read: true })))} className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline"><Check size={16}/> Mark all as read</button>
      </div>
      <div className="space-y-3">
        {notifs.map(n => {
          const Icon = n.icon;
          return (
            <div key={n.id} className={`p-5 rounded-2xl border transition-colors flex items-start gap-4 ${n.read ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-70' : 'bg-white dark:bg-slate-950 border-indigo-100 dark:border-indigo-500/30 shadow-sm'}`}>
              <div className={`p-2 rounded-xl ${n.color}`}><Icon size={20}/></div>
              <div className="flex-1"><p className="font-bold">{n.title}</p><p className="text-xs font-medium text-slate-500 mt-1">{n.time}</p></div>
              {!n.read && <div className="h-2 w-2 rounded-full bg-indigo-500 mt-2"></div>}
            </div>
          )
        })}
      </div>
    </div>
  );
}