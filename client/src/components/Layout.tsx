// @ts-nocheck
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, MapPin, Settings as SettingsIcon, Bell, Users, BarChart, Home, LogOut } from 'lucide-react';

export default function Layout({ children, setAuth, isDark, setIsDark }: any) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const NavLink = ({ to, icon, label }: any) => {
    const active = location.pathname === to;
    return (
      <Link to={to} title={isCollapsed ? label : ""} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${active ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'} ${isCollapsed ? 'justify-center px-0' : ''}`}>
        <span className={active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}>{icon}</span>
        {!isCollapsed && <span className="truncate whitespace-nowrap">{label}</span>}
      </Link>
    );
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors">
      
      <aside className={`${isCollapsed ? 'w-[80px]' : 'w-[260px]'} flex flex-col bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 shrink-0 z-10 transition-all duration-300 ease-in-out`}>
        <div className={`flex items-center px-6 py-6 border-b border-slate-200 dark:border-slate-800 h-20 shrink-0 ${isCollapsed ? 'justify-center px-0' : 'gap-3'}`}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-md text-white font-bold shrink-0">SS</div>
          {!isCollapsed && (
            <div className="min-w-[120px] overflow-hidden">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight truncate">SelfSense</h1>
              <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest truncate">OS</p>
            </div>
          )}
        </div>
        
        <nav className={`flex-1 py-6 space-y-1.5 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-4'}`}>
          <NavLink to="/" icon={<Home size={20}/>} label="Dashboard" />
          <NavLink to="/orders" icon={<MapPin size={20}/>} label="Orders" />
          <NavLink to="/analytics" icon={<BarChart size={20}/>} label="Analytics" />
          <NavLink to="/customers" icon={<Users size={20}/>} label="Customers" />
          <NavLink to="/notifications" icon={<Bell size={20}/>} label="Notifications" />
          <NavLink to="/settings" icon={<SettingsIcon size={20}/>} label="Settings" />
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button onClick={() => setAuth(false)} className={`flex items-center gap-2 w-full p-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${isCollapsed ? 'justify-center' : ''}`}>
            <LogOut size={20} /> {!isCollapsed && "Log Out"}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <header className="h-20 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors">
              <Menu size={20} />
            </button>
            <span className="font-bold text-lg hidden sm:block text-slate-900 dark:text-white">System Operations</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-slate-900 dark:text-white">Admin User</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">admin@selfsense.com</p>
             </div>
             <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">AD</div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-900 relative">
          {children}
        </main>
      </div>
    </div>
  );
}