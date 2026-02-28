// @ts-nocheck
import React, { useState, useEffect } from 'react';
import OfflineMap from '../components/OfflineMap';
import StatCard from '../components/StatCard';

export default function DashboardView({ isDark }: any) {
  const [orders, setOrders] = useState([]);
  const [geo, setGeo] = useState({ nyc: null, counties: null });

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(data => setOrders(Array.isArray(data) ? data : []));
    Promise.all([fetch('/api/geojson/nyc').then(r => r.json()), fetch('/api/geojson/counties').then(r => r.json())]).then(([nyc, counties]) => setGeo({ nyc, counties }));
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  
  const todaysOrders = orders.filter((o:any) => {
    const dateStr = o.ingested_at || o.timestamp;
    return dateStr && dateStr.startsWith(todayStr);
  });

  const manualCount = todaysOrders.filter((o:any) => o.source === 'manual').length;
  const csvCount = todaysOrders.length - manualCount; 

  const uniqueCounties = new Set(orders.map((o:any) => o.identified_region)).size;
  const avgTax = orders.length ? ((orders.reduce((a:any, o:any) => a + Number(o.composite_tax_rate||0), 0) / orders.length) * 100).toFixed(2) : 0;

  const mapOrders = orders.slice(0, 200);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold">Dashboard</h1><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Welcome back! Here's your drone delivery tax overview.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <StatCard 
          title="Today's Processed" 
          value={todaysOrders.length} 
          subtitle={`${csvCount} from CSV, ${manualCount} manual`} 
        />
        
        <StatCard title="Active Routes" value={uniqueCounties} subtitle="Unique locations" />
        <StatCard title="Avg. Tax Rate" value={`${avgTax}%`} subtitle="Calculated offline" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm relative z-0 flex flex-col">
          <div className="absolute top-4 left-4 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold shadow-md text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Showing latest {mapOrders.length} routes for performance
          </div>
          <OfflineMap geo={geo} orders={mapOrders} zoom={6} center={[42.8, -75.5]} isDark={isDark} />
        </div>
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-y-auto">
          <h3 className="font-bold mb-4 text-lg">Recent Activity</h3>
          <div className="space-y-5">
            {orders.slice(0, 10).map((o:any, i) => (
              <div key={o.id} className="flex gap-3">
                <div className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${o.status === 'Verified' ? 'bg-indigo-500' : 'bg-red-500'}`}></div>
                <div><p className="text-sm font-bold">Order #{o.id} processed</p><p className="text-xs text-slate-500 dark:text-slate-400">{o.identified_region || 'Unknown'} - ${Number(o.tax_amount||0).toFixed(2)} tax calculated</p></div>
              </div>
            ))}
            {orders.length === 0 && <p className="text-sm text-slate-500">No recent activity.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}