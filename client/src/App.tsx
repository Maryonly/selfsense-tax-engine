// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from './components/Layout';
import DashboardView from './pages/Dashboard';
import OrdersView from './pages/Orders';
import AnalyticsView from './pages/Analytics';
import CustomersView from './pages/Customers';
import NotificationsView from './pages/Notifications';
import SettingsView from './pages/Settings';

export default function App() {
  const [auth, setAuth] = useState(false);
  const [email, setEmail] = useState('admin@selfsense.com');
  const [pwd, setPwd] = useState('admin');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  if (!auth) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-md">
            <span className="text-white font-bold text-2xl">SS</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-1">SelfSense</h1>
          <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-8">Drone Tax Engine</p>
          <input className="w-full mb-3 p-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="w-full mb-6 p-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition" type="password" value={pwd} onChange={e => setPwd(e.target.value)} />
          <button onClick={() => { if(pwd === 'admin' && email === 'admin@selfsense.com') setAuth(true) }} className="w-full bg-indigo-600 text-white p-3.5 rounded-xl font-bold shadow-md hover:bg-indigo-700 transition">Sign In</button>
        </motion.div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Layout setAuth={setAuth} isDark={isDark} setIsDark={setIsDark}>
        <Routes>
          <Route path="/" element={<DashboardView isDark={isDark} />} />
          <Route path="/orders" element={<OrdersView isDark={isDark} />} />
          <Route path="/analytics" element={<AnalyticsView />} />
          <Route path="/customers" element={<CustomersView />} />
          <Route path="/notifications" element={<NotificationsView />} />
          <Route path="/settings" element={<SettingsView isDark={isDark} setIsDark={setIsDark} />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}