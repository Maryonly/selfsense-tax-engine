// @ts-nocheck
import React from 'react';

export default function StatCard({ title, value, subtitle }: any) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
      <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
      <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{value}</p>
      <p className="mt-2 text-xs font-medium text-slate-400 dark:text-slate-500">{subtitle}</p>
    </div>
  );
}