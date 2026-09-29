/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useMemo } from 'react';
import { Load, Driver } from '../types';
import { Compass, Info, MapPin, Navigation, Truck, ZoomIn } from 'lucide-react';

interface FleetMapWidgetProps {
  loads: Load[];
  drivers: Driver[];
}

// Approximate city-to-coordinate mapping engine
const getCityCoords = (locationStr: string): { lat: number; lng: number; name: string } | null => {
  if (!locationStr) return null;
  const clean = locationStr.toLowerCase().trim();
  
  const cities: { [key: string]: { lat: number; lng: number; name: string } } = {
    'miami': { lat: 25.7617, lng: -80.1918, name: 'Miami, FL' },
    'orlando': { lat: 28.5383, lng: -81.3792, name: 'Orlando, FL' },
    'jacksonville': { lat: 30.3322, lng: -81.6557, name: 'Jacksonville, FL' },
    'tampa': { lat: 27.9506, lng: -82.4572, name: 'Tampa, FL' },
    'chicago': { lat: 41.8781, lng: -87.6298, name: 'Chicago, IL' },
    'houston': { lat: 29.7604, lng: -95.3698, name: 'Houston, TX' },
    'dallas': { lat: 32.7767, lng: -96.7970, name: 'Dallas, TX' },
    'fort worth': { lat: 32.7555, lng: -97.3308, name: 'Fort Worth, TX' },
    'el paso': { lat: 31.7619, lng: -106.4850, name: 'El Paso, TX' },
    'austin': { lat: 30.2672, lng: -97.7431, name: 'Austin, TX' },
    'san antonio': { lat: 29.4241, lng: -98.4936, name: 'San Antonio, TX' },
    'atlanta': { lat: 33.7490, lng: -84.3880, name: 'Atlanta, GA' },
    'savannah': { lat: 32.0809, lng: -81.0912, name: 'Savannah, GA' },
    'new york': { lat: 40.7128, lng: -74.0060, name: 'New York, NY' },
    'buffalo': { lat: 42.8864, lng: -78.8784, name: 'Buffalo, NY' },
    'los angeles': { lat: 34.0522, lng: -118.2437, name: 'Los Angeles, CA' },
    'san francisco': { lat: 37.7749, lng: -122.4194, name: 'San Francisco, CA' },
    'san diego': { lat: 32.7157, lng: -117.1611, name: 'San Diego, CA' },
    'sacramento': { lat: 38.5816, lng: -121.4944, name: 'Sacramento, CA' },
    'seattle': { lat: 47.6062, lng: -122.3321, name: 'Seattle, WA' },
    'tacoma': { lat: 47.2529, lng: -122.4443, name: 'Tacoma, WA' },
    'spokane': { lat: 47.6588, lng: -117.4260, name: 'Spokane, WA' },
    'denver': { lat: 39.7392, lng: -104.9903, name: 'Denver, CO' },
    'boston': { lat: 42.3601, lng: -71.0589, name: 'Boston, MA' },
    'phoenix': { lat: 33.4484, lng: -112.0740, name: 'Phoenix, AZ' },
    'las vegas': { lat: 36.1716, lng: -115.1398, name: 'Las Vegas, NV' },
    'nashville': { lat: 36.1627, lng: -86.7816, name: 'Nashville, TN' },
    'memphis': { lat: 35.1495, lng: -90.0490, name: 'Memphis, TN' },
    'knoxville': { lat: 35.9606, lng: -83.9207, name: 'Knoxville, TN' },
    'columbus': { lat: 39.9612, lng: -82.9988, name: 'Columbus, OH' },
    'cleveland': { lat: 41.4993, lng: -81.6944, name: 'Cleveland, OH' },
    'cincinnati': { lat: 39.1031, lng: -84.5120, name: 'Cincinnati, OH' },
    'charlotte': { lat: 35.2271, lng: -80.8431, name: 'Charlotte, NC' },
    'raleigh': { lat: 35.7796, lng: -78.6382, name: 'Raleigh, NC' },
    'philadelphia': { lat: 39.9526, lng: -75.1652, name: 'Philadelphia, PA' },
    'pittsburgh': { lat: 40.4406, lng: -79.9959, name: 'Pittsburgh, PA' },
    'detroit': { lat: 42.3314, lng: -83.0458, name: 'Detroit, MI' },
    'grand rapids': { lat: 42.9634, lng: -85.6681, name: 'Grand Rapids, MI' },
    'minneapolis': { lat: 44.9778, lng: -93.2650, name: 'Minneapolis, MN' },
    'st. paul': { lat: 44.9537, lng: -93.0900, name: 'St. Paul, MN' },
    'kansas city': { lat: 39.0997, lng: -94.5786, name: 'Kansas City, MO' },
    'st. louis': { lat: 38.6270, lng: -90.1994, name: 'St. Louis, MO' },
    'indianapolis': { lat: 39.7684, lng: -86.1581, name: 'Indianapolis, IN' },
    'louisville': { lat: 38.2527, lng: -85.7585, name: 'Louisville, KY' },
    'birmingham': { lat: 33.5186, lng: -86.8104, name: 'Birmingham, AL' },
    'mobile': { lat: 30.6954, lng: -88.0399, name: 'Mobile, AL' },
    'new orleans': { lat: 29.9511, lng: -90.0715, name: 'New Orleans, LA' },
    'shreveport': { lat: 32.5140, lng: -93.7503, name: 'Shreveport, LA' },
    'baton rouge': { lat: 30.4515, lng: -91.1871, name: 'Baton Rouge, LA' },
    'oklahoma city': { lat: 35.4676, lng: -97.5164, name: 'Oklahoma City, OK' },
    'tulsa': { lat: 36.1540, lng: -95.9928, name: 'Tulsa, OK' },
    'salt lake city': { lat: 40.7608, lng: -111.8910, name: 'Salt Lake City, UT' },
    'albuquerque': { lat: 35.0844, lng: -106.6504, name: 'Albuquerque, NM' },
    'omaha': { lat: 41.2565, lng: -95.9345, name: 'Omaha, NE' },
    'des moines': { lat: 41.5868, lng: -93.6250, name: 'Des Moines, IA' },
    'milwaukee': { lat: 43.0389, lng: -87.9065, name: 'Milwaukee, WI' },
    'madison': { lat: 43.0731, lng: -89.4012, name: 'Madison, WI' },
    'wichita': { lat: 37.6872, lng: -97.3301, name: 'Wichita, KS' },
    'little rock': { lat: 34.7465, lng: -92.2896, name: 'Little Rock, AR' },
    'jackson': { lat: 32.2988, lng: -90.1848, name: 'Jackson, MS' },
    'portland': { lat: 45.5152, lng: -122.6784, name: 'Portland, OR' },
    'boise': { lat: 43.6150, lng: -116.2023, name: 'Boise, ID' },
    'richmond': { lat: 37.5407, lng: -77.4360, name: 'Richmond, VA' },
    'norfolk': { lat: 36.8508, lng: -76.2859, name: 'Norfolk, VA' },
    'baltimore': { lat: 39.2904, lng: -76.6122, name: 'Baltimore, MD' },
    'washington': { lat: 38.9072, lng: -77.0369, name: 'Washington, DC' },
    'charleston': { lat: 32.7765, lng: -79.9311, name: 'Charleston, SC' },
    'columbia': { lat: 34.0007, lng: -81.0348, name: 'Columbia, SC' },
  };

  for (const [key, val] of Object.entries(cities)) {
    if (clean.includes(key)) return val;
  }

  // Fallback to State matching
  const states: { [key: string]: { lat: number; lng: number; name: string } } = {
    'al': { lat: 32.3182, lng: -86.9023, name: 'Alabama' },
    'ar': { lat: 35.2010, lng: -91.8318, name: 'Arkansas' },
    'az': { lat: 34.0489, lng: -111.0937, name: 'Arizona' },
    'ca': { lat: 36.7783, lng: -119.4179, name: 'California' },
    'co': { lat: 39.5501, lng: -105.7821, name: 'Colorado' },
    'ct': { lat: 41.6032, lng: -73.0877, name: 'Connecticut' },
    'de': { lat: 38.9108, lng: -75.5277, name: 'Delaware' },
    'fl': { lat: 27.6648, lng: -81.5158, name: 'Florida' },
    'ga': { lat: 32.1656, lng: -82.9001, name: 'Georgia' },
    'ia': { lat: 41.8780, lng: -93.0977, name: 'Iowa' },
    'id': { lat: 44.0682, lng: -114.7420, name: 'Idaho' },
    'il': { lat: 40.6331, lng: -89.3985, name: 'Illinois' },
    'in': { lat: 40.2672, lng: -86.1349, name: 'Indiana' },
    'ks': { lat: 38.5266, lng: -96.7265, name: 'Kansas' },
    'ky': { lat: 37.8393, lng: -84.2700, name: 'Kentucky' },
    'la': { lat: 31.2448, lng: -92.1450, name: 'Louisiana' },
    'ma': { lat: 42.4072, lng: -71.3824, name: 'Massachusetts' },
    'md': { lat: 39.0458, lng: -76.6413, name: 'Maryland' },
    'me': { lat: 45.2538, lng: -69.4455, name: 'Maine' },
    'mi': { lat: 43.3266, lng: -85.3232, name: 'Michigan' },
    'mn': { lat: 45.6945, lng: -93.9002, name: 'Minnesota' },
    'mo': { lat: 37.9643, lng: -91.8318, name: 'Missouri' },
    'ms': { lat: 32.3547, lng: -89.3985, name: 'Mississippi' },
    'mt': { lat: 46.8797, lng: -110.3626, name: 'Montana' },
    'nc': { lat: 35.7596, lng: -79.0193, name: 'North Carolina' },
    'nd': { lat: 47.5515, lng: -101.0020, name: 'North Dakota' },
    'ne': { lat: 41.1254, lng: -98.2681, name: 'Nebraska' },
    'nh': { lat: 43.1939, lng: -71.5724, name: 'New Hampshire' },
    'nj': { lat: 40.0583, lng: -74.4057, name: 'New Jersey' },
    'nm': { lat: 34.5199, lng: -105.8701, name: 'New Mexico' },
    'nv': { lat: 38.8026, lng: -116.4194, name: 'Nevada' },
    'ny': { lat: 43.2994, lng: -74.2179, name: 'New York' },
    'oh': { lat: 40.4173, lng: -82.9071, name: 'Ohio' },
    'ok': { lat: 35.0078, lng: -97.0929, name: 'Oklahoma' },
    'or': { lat: 43.8041, lng: -120.5542, name: 'Oregon' },
    'pa': { lat: 41.2033, lng: -77.1945, name: 'Pennsylvania' },
    'ri': { lat: 41.5801, lng: -71.4774, name: 'Rhode Island' },
    'sc': { lat: 33.8361, lng: -81.1637, name: 'South Carolina' },
    'sd': { lat: 44.2998, lng: -99.4388, name: 'South Dakota' },
    'tn': { lat: 35.5175, lng: -86.5804, name: 'Tennessee' },
    'tx': { lat: 31.9686, lng: -99.9018, name: 'Texas' },
    'ut': { lat: 39.3210, lng: -111.0937, name: 'Utah' },
    'va': { lat: 37.4316, lng: -78.6569, name: 'Virginia' },
    'vt': { lat: 44.5588, lng: -72.5778, name: 'Vermont' },
    'wa': { lat: 47.7511, lng: -120.7401, name: 'Washington' },
    'wi': { lat: 43.7844, lng: -88.7879, name: 'Wisconsin' },
    'wv': { lat: 38.5976, lng: -80.4549, name: 'West Virginia' },
    'wy': { lat: 43.0760, lng: -107.2903, name: 'Wyoming' },
  };

  const parts = clean.split(/[\s,]+/);
  for (const part of parts) {
    if (states[part]) return states[part];
  }

  return { lat: 39.8283, lng: -98.5795, name: locationStr };
};

// Map projection math: Equirectangular US projection
const mapLngToX = (lng: number, width: number) => {
  // US longitude bounds roughly -125 (West) to -66 (East)
  const minLng = -125;
  const maxLng = -66;
  const pct = (lng - minLng) / (maxLng - minLng);
  return pct * width;
};

const mapLatToY = (lat: number, height: number) => {
  // US latitude bounds roughly 50 (North) to 24 (South)
  const maxLat = 50;
  const minLat = 24;
  const pct = (maxLat - lat) / (maxLat - minLat);
  return pct * height;
};

// Simplified USA landmass vector nodes to draw land contour
const usOutlineCoords = [
  { lat: 48.4, lng: -124.7 }, // Cape Flattery, WA
  { lat: 49.0, lng: -123.0 }, // Northwest corner, WA
  { lat: 49.0, lng: -117.0 }, // Idaho border
  { lat: 49.0, lng: -95.2 },  // Lake of the Woods, MN
  { lat: 48.0, lng: -89.5 },  // Lake Superior, MN
  { lat: 46.5, lng: -84.4 },  // Sault Ste Marie, MI
  { lat: 45.0, lng: -71.5 },  // Vermont/Canada
  { lat: 47.3, lng: -68.3 },  // Maine north tip
  { lat: 44.8, lng: -67.0 },  // Maine east tip
  { lat: 43.6, lng: -70.2 },  // Portland, ME
  { lat: 42.3, lng: -70.9 },  // Boston, MA
  { lat: 41.3, lng: -72.0 },  // Long Island Sound
  { lat: 40.5, lng: -74.0 },  // New York Bay
  { lat: 38.9, lng: -74.9 },  // Cape May, NJ
  { lat: 36.9, lng: -76.0 },  // Cape Charles, VA
  { lat: 35.2, lng: -75.5 },  // Cape Hatteras, NC
  { lat: 32.8, lng: -79.8 },  // Charleston, SC
  { lat: 30.8, lng: -81.4 },  // Jacksonville, FL
  { lat: 28.6, lng: -80.6 },  // Cape Canaveral, FL
  { lat: 25.1, lng: -80.4 },  // Key Largo, FL
  { lat: 24.5, lng: -81.8 },  // Key West, FL
  { lat: 25.8, lng: -81.4 },  // Cape Sable, FL
  { lat: 27.8, lng: -82.8 },  // St. Petersburg, FL
  { lat: 29.8, lng: -84.0 },  // Apalachee Bay, FL
  { lat: 30.2, lng: -88.0 },  // Mobile Bay, AL
  { lat: 29.1, lng: -89.2 },  // Mississippi Delta, LA
  { lat: 29.7, lng: -93.9 },  // Sabine Pass, TX
  { lat: 27.8, lng: -97.0 },  // Corpus Christi, TX
  { lat: 26.0, lng: -97.1 },  // Brownsville, TX
  { lat: 29.3, lng: -103.5 }, // Big Bend, TX
  { lat: 31.8, lng: -106.5 }, // El Paso, TX
  { lat: 31.3, lng: -111.0 }, // Nogales, AZ
  { lat: 32.5, lng: -117.1 }, // Imperial Beach, CA
  { lat: 34.4, lng: -120.5 }, // Point Conception, CA
  { lat: 36.6, lng: -121.9 }, // Monterey Bay, CA
  { lat: 37.8, lng: -122.5 }, // Golden Gate, CA
  { lat: 40.4, lng: -124.4 }, // Cape Mendocino, CA
  { lat: 43.1, lng: -124.4 }, // Cape Blanco, OR
  { lat: 46.2, lng: -124.1 }, // Columbia River, WA
];

// Major logistics hubs to render as reference points
const hubCities = [
  { name: 'Seattle', lat: 47.6062, lng: -122.3321 },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
  { name: 'Dallas', lat: 32.7767, lng: -96.7970 },
  { name: 'Chicago', lat: 41.8781, lng: -87.6298 },
  { name: 'Atlanta', lat: 33.7490, lng: -84.3880 },
  { name: 'New York', lat: 40.7128, lng: -74.0060 },
  { name: 'Miami', lat: 25.7617, lng: -80.1918 },
  { name: 'Denver', lat: 39.7392, lng: -104.9903 },
];

export default function FleetMapWidget({ loads, drivers }: FleetMapWidgetProps) {
  const [hoveredLoad, setHoveredLoad] = useState<Load | null>(null);
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);

  // Filter loads to active/in-transit/pending ones that can be placed on map
  const activeRoutes = useMemo(() => {
    return loads
      .filter(l => l.status !== 'Delivered' && l.paymentStatus === 'Unpaid')
      .map(load => {
        const pickup = getCityCoords(load.pickupLocation);
        const delivery = getCityCoords(load.deliveryLocation);
        const assignedDriver = drivers.find(d => d.id === load.driverId);

        return {
          load,
          pickup,
          delivery,
          driverName: assignedDriver?.name || 'Unassigned Driver',
          truckNum: assignedDriver?.truckNum || 'N/A'
        };
      })
      .filter(item => item.pickup !== null && item.delivery !== null) as Array<{
        load: Load;
        pickup: { lat: number; lng: number; name: string };
        delivery: { lat: number; lng: number; name: string };
        driverName: string;
        truckNum: string;
      }>;
  }, [loads, drivers]);

  // SVG dimensions for projection (responsive viewBox 800x450)
  const width = 800;
  const height = 450;

  // Generate landmass outline path
  const landmassPolygonPoints = useMemo(() => {
    return usOutlineCoords
      .map(c => {
        const x = mapLngToX(c.lng, width).toFixed(1);
        const y = mapLatToY(c.lat, height).toFixed(1);
        return `${x},${y}`;
      })
      .join(' ');
  }, []);

  return (
    <div id="fleet_distribution_map_widget" className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
      
      {/* Map Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
            <Compass className="h-5 w-5 text-blue-600 animate-spin-slow" />
            <span>National Fleet Distribution Map</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Geographic routing &amp; live load dispersion of active corporate assets
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 font-mono bg-slate-50 border border-slate-150 px-2.5 py-1 rounded-full shrink-0">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span>{activeRoutes.length} LOADS ACTIVE ON RADAR</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* INTERACTIVE VECTOR SVG CANVAS */}
        <div className="lg:col-span-3 bg-slate-950 rounded-xl overflow-hidden relative border border-slate-800 h-[320px] sm:h-[380px] lg:h-[400px] flex items-center justify-center">
          
          {/* Compass Rose Accent */}
          <div className="absolute top-4 right-4 pointer-events-none opacity-15">
            <Compass className="h-14 w-14 text-white" />
          </div>

          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full select-none"
            style={{ maxHeight: '100%' }}
          >
            {/* Grid Mesh Overlay */}
            <defs>
              <pattern id="map_grid_pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#map_grid_pattern)" />

            {/* Styled landmass representation of the USA */}
            <polygon
              points={landmassPolygonPoints}
              className="fill-slate-900 stroke-slate-800/80 stroke-1 transition-all duration-300"
            />

            {/* Reference Hub Cities */}
            {hubCities.map((hub, idx) => {
              const x = mapLngToX(hub.lng, width);
              const y = mapLatToY(hub.lat, height);
              return (
                <g key={`hub-${idx}`} className="opacity-40">
                  <circle cx={x} cy={y} r="2.5" fill="#475569" />
                  <text
                    x={x + 4}
                    y={y + 3}
                    className="fill-slate-500 text-[8px] font-mono font-bold uppercase tracking-wider"
                  >
                    {hub.name}
                  </text>
                </g>
              );
            })}

            {/* Active load transit lines and markers */}
            {activeRoutes.map((route, idx) => {
              const { load, pickup, delivery, driverName, truckNum } = route;
              const x1 = mapLngToX(pickup.lng, width);
              const y1 = mapLatToY(pickup.lat, height);
              const x2 = mapLngToX(delivery.lng, width);
              const y2 = mapLatToY(delivery.lat, height);

              // Curved path calculation (Beziér curve for elegant routing visual)
              const dx = x2 - x1;
              const dy = y2 - y1;
              const dr = Math.sqrt(dx * dx + dy * dy) * 1.2; // bend factor
              const pathString = `M${x1},${y1} A${dr},${dr} 0 0,1 ${x2},${y2}`;

              // Determine if selected or hovered for highlight
              const isHighlighted = selectedLoadId === load.id || hoveredLoad?.id === load.id;

              return (
                <g
                  key={`route-${load.id}`}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredLoad(load)}
                  onMouseLeave={() => setHoveredLoad(null)}
                  onClick={() => setSelectedLoadId(selectedLoadId === load.id ? null : load.id)}
                >
                  {/* Outer glow line for highlighted route */}
                  {isHighlighted && (
                    <path
                      d={pathString}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="4"
                      className="opacity-25"
                    />
                  )}

                  {/* Base Route connection line */}
                  <path
                    d={pathString}
                    fill="none"
                    stroke={isHighlighted ? '#f59e0b' : '#3b82f6'}
                    strokeWidth={isHighlighted ? '2' : '1.2'}
                    strokeDasharray={isHighlighted ? '5,3' : '4,4'}
                    className="transition-all duration-200"
                  />

                  {/* Flow Animation Dot moving from pickup to delivery */}
                  <circle r="3.5" fill={isHighlighted ? '#f59e0b' : '#60a5fa'}>
                    <animateMotion
                      dur="5s"
                      repeatCount="indefinite"
                      path={pathString}
                    />
                  </circle>

                  {/* Pickup glowing node */}
                  <g>
                    <circle
                      cx={x1}
                      cy={y1}
                      r={isHighlighted ? '8' : '5'}
                      fill="#22c55e"
                      className="opacity-25 animate-pulse"
                    />
                    <circle
                      cx={x1}
                      cy={y1}
                      r="3.5"
                      fill="#22c55e"
                    />
                  </g>

                  {/* Delivery flag/pin node */}
                  <g>
                    <circle
                      cx={x2}
                      cy={y2}
                      r={isHighlighted ? '8' : '5'}
                      fill="#ef4444"
                      className="opacity-25 animate-pulse"
                    />
                    <circle
                      cx={x2}
                      cy={y2}
                      r="3.5"
                      fill="#ef4444"
                    />
                  </g>
                </g>
              );
            })}
          </svg>

          {/* Map Controls / Interactive Overlay HUD */}
          <div className="absolute bottom-3 left-3 bg-slate-900/95 border border-slate-800/80 p-2.5 rounded-lg max-w-[200px] pointer-events-none space-y-1.5 shadow-lg">
            <div className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wide">
              HUD Radar Legend
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Origin (Pickup)</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-300">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span>Destination (Delivery)</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-300">
              <span className="h-0.5 w-4 border-t border-dashed border-blue-500 inline-block" />
              <span>Active Transit Path</span>
            </div>
          </div>

          {/* Hover / Selected Load Information Window (Float HUD) */}
          {(hoveredLoad || selectedLoadId) && (
            (() => {
              const target = activeRoutes.find(r => r.load.id === (hoveredLoad?.id || selectedLoadId));
              if (!target) return null;
              const { load, pickup, delivery, driverName, truckNum } = target;

              return (
                <div className="absolute top-3 left-3 right-3 sm:right-auto bg-slate-900/95 border border-amber-500/40 p-4 rounded-xl max-w-sm shadow-2xl backdrop-blur-sm space-y-2 text-left animate-fade-in z-20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Truck className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="text-xs font-bold text-white font-mono">LOAD #{load.loadNum}</span>
                    </div>
                    <span className="text-[9px] bg-amber-500/10 text-amber-400 font-mono font-bold px-2 py-0.5 rounded border border-amber-500/20">
                      IN TRANSIT
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-2 text-[10px]">
                    <div>
                      <span className="text-slate-400 block">Broker</span>
                      <span className="font-semibold text-slate-200 truncate block">{load.broker}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Driver (Truck)</span>
                      <span className="font-semibold text-slate-200 truncate block">{driverName} (Trk {truckNum})</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-2 space-y-1">
                    <div className="flex items-center gap-1 text-[10.5px]">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-slate-300 font-medium truncate">{pickup.name} ({load.pickupDate})</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10.5px]">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      <span className="text-slate-300 font-medium truncate">{delivery.name} ({load.deliveryDate})</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-2 flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-mono">Gross Rate Value</span>
                    <span className="text-xs font-extrabold text-amber-400 font-mono">
                      ${load.loadAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  
                  {selectedLoadId === load.id && (
                    <p className="text-[8px] text-slate-400 text-center font-mono pt-1">
                      Click map to dismiss detail lock.
                    </p>
                  )}
                </div>
              );
            })()
          )}

        </div>

        {/* SIDEBAR LIST: ACTIVE COORDINATION DIRECTORY */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 flex flex-col h-[320px] sm:h-[380px] lg:h-[400px]">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-2">
            Active Load Manifest ({activeRoutes.length})
          </h4>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {activeRoutes.map(({ load, pickup, delivery, driverName }) => {
              const isSelected = selectedLoadId === load.id || hoveredLoad?.id === load.id;
              return (
                <div
                  key={load.id}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/35 shadow-xs'
                      : 'bg-white hover:bg-slate-100/80 border-slate-200'
                  }`}
                  onMouseEnter={() => setHoveredLoad(load)}
                  onMouseLeave={() => setHoveredLoad(null)}
                  onClick={() => setSelectedLoadId(selectedLoadId === load.id ? null : load.id)}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800 font-mono">#{load.loadNum}</span>
                    <span className="text-[10px] font-extrabold font-mono text-blue-700">
                      ${load.loadAmount.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{driverName}</p>
                  
                  <div className="mt-1.5 space-y-0.5 text-[9px] font-mono text-slate-400 border-t border-slate-100 pt-1.5">
                    <div className="truncate flex items-center gap-1">
                      <span className="h-1 w-1 rounded-full bg-emerald-500" />
                      <span>{pickup.name}</span>
                    </div>
                    <div className="truncate flex items-center gap-1">
                      <span className="h-1 w-1 rounded-full bg-red-500" />
                      <span>{delivery.name}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {activeRoutes.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <Info className="h-7 w-7 text-slate-400 mb-1.5" />
                <h5 className="text-xs font-semibold text-slate-700">No active loads in transit</h5>
                <p className="text-[10px] text-slate-400 mt-1 max-w-xs">
                  Active loads booked in Load Management display coordinates on radar automatically.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
