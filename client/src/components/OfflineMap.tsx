// @ts-nocheck
import React from 'react';
import { MapContainer, GeoJSON, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const verifiedIcon = L.divIcon({ className: 'custom-pin', html: '<div style="width: 10px; height: 10px; background: #4F46E5; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px #4F46E5;"></div>', iconSize: [10, 10] });
const errorIcon = L.divIcon({ className: 'custom-pin', html: '<div style="width: 10px; height: 10px; background: #F87171; border-radius: 50%; border: 2px solid white;"></div>', iconSize: [10, 10] });

export default function OfflineMap({ geo, orders = [], zoom, center, isDark }: any) {
  const safeCenter = (center && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) 
    ? [Number(center[0]), Number(center[1])] 
    : [42.8, -75.5];

  const validOrders = orders.filter((o:any) => 
    o && o.latitude != null && o.longitude != null && !isNaN(Number(o.latitude)) && !isNaN(Number(o.longitude))
  );

  return (
    <MapContainer center={safeCenter as any} zoom={zoom} style={{ height: '100%', width: '100%', background: isDark ? '#0f172a' : '#FDFBF7', zIndex: 0 }}>
      {geo.counties && <GeoJSON data={geo.counties} style={{ fillColor: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#334155' : '#e2e8f0', weight: 1, fillOpacity: 1 }} />}
      {geo.nyc && <GeoJSON data={geo.nyc} style={{ fillColor: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#475569' : '#cbd5e1', weight: 1.5, fillOpacity: 1 }} />}
      {validOrders.map((o:any) => (
         <Marker key={`map-marker-${o.id}`} position={[Number(o.latitude), Number(o.longitude)]} icon={o.status === 'Verified' ? verifiedIcon : errorIcon}>
           <Popup><b className="text-slate-900 text-xs">{o.identified_region || 'Unknown'}</b></Popup>
         </Marker>
      ))}
    </MapContainer>
  );
}