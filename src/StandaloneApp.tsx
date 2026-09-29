/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Standalone Local Hosted Dispatch & Logistics Management System (Open Source Frontend)
 * Pure React 18 + Tailwind CSS + Lucide Icons (Zero External Backend Dependencies)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  Package,
  Users,
  FileText,
  DollarSign,
  BarChart3,
  Settings,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Share2,
  Trash2,
  Edit,
  Shield,
  Activity,
  ChevronRight,
  UserCheck,
  TrendingUp,
  MapPin,
  Calendar,
  LogOut,
  Moon,
  Sun,
  Database
} from 'lucide-react';

// ==========================================
// TYPES & DATA STRUCTURES
// ==========================================

export type NavCategory = 
  | 'DASHBOARD' 
  | 'LOADS' 
  | 'CARRIERS' 
  | 'FLEET' 
  | 'INVOICING' 
  | 'SETTLEMENTS' 
  | 'TRANSACTIONS' 
  | 'SETTINGS';

export interface LocalUser {
  id: string;
  name: string;
  role: 'ADMIN' | 'DISPATCHER' | 'SALES';
  email: string;
  avatar?: string;
}

export interface LocalLoad {
  id: string;
  loadNum: string;
  carrierName: string;
  driverName: string;
  pickupLocation: string;
  deliveryLocation: string;
  pickupDate: string;
  deliveryDate: string;
  loadAmount: number;
  dispatchFeePercent: number;
  status: 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'BILLED' | 'CANCELLED';
  notes: string;
}

export interface LocalCarrier {
  id: string;
  mcNumber: string;
  dotNumber: string;
  companyName: string;
  phone: string;
  email: string;
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  dispatchFeeRate: number;
}

export interface LocalDriver {
  id: string;
  name: string;
  phone: string;
  carrierId: string;
  truckNum: string;
  trailerNum: string;
  status: 'AVAILABLE' | 'ON_LOAD' | 'OFF_DUTY';
}

// ==========================================
// INITIAL MOCK STATE
// ==========================================

const INITIAL_USER: LocalUser = {
  id: 'usr-1',
  name: 'Operations Manager',
  role: 'ADMIN',
  email: 'admin@logistics.local'
};

const INITIAL_LOADS: LocalLoad[] = [
  {
    id: 'ld-101',
    loadNum: 'TL-9081',
    carrierName: 'Swift Logistics LLC',
    driverName: 'John Miller',
    pickupLocation: 'Chicago, IL',
    deliveryLocation: 'Atlanta, GA',
    pickupDate: '2026-08-10',
    deliveryDate: '2026-08-12',
    loadAmount: 3200,
    dispatchFeePercent: 10,
    status: 'IN_TRANSIT',
    notes: 'Reefer set at -5F. High priority perishable.'
  },
  {
    id: 'ld-102',
    loadNum: 'TL-9082',
    carrierName: 'Apex Transport Group',
    driverName: 'Robert Davis',
    pickupLocation: 'Dallas, TX',
    deliveryLocation: 'Phoenix, AZ',
    pickupDate: '2026-08-11',
    deliveryDate: '2026-08-13',
    loadAmount: 2850,
    dispatchFeePercent: 8,
    status: 'DISPATCHED',
    notes: 'Dry van 53ft. Clean rate confirmation signed.'
  },
  {
    id: 'ld-103',
    loadNum: 'TL-9080',
    carrierName: 'Titan Freight Services',
    driverName: 'Michael Brown',
    pickupLocation: 'Columbus, OH',
    deliveryLocation: 'Miami, FL',
    pickupDate: '2026-08-08',
    deliveryDate: '2026-08-10',
    loadAmount: 4100,
    dispatchFeePercent: 10,
    status: 'DELIVERED',
    notes: 'POD signed and attached.'
  }
];

const INITIAL_CARRIERS: LocalCarrier[] = [
  {
    id: 'car-1',
    mcNumber: 'MC-109283',
    dotNumber: 'DOT-389102',
    companyName: 'Swift Logistics LLC',
    phone: '(555) 234-5678',
    email: 'dispatch@swiftlogistics.local',
    status: 'ACTIVE',
    dispatchFeeRate: 10
  },
  {
    id: 'car-2',
    mcNumber: 'MC-882190',
    dotNumber: 'DOT-210928',
    companyName: 'Apex Transport Group',
    phone: '(555) 987-6543',
    email: 'ops@apextransport.local',
    status: 'ACTIVE',
    dispatchFeeRate: 8
  }
];

const INITIAL_DRIVERS: LocalDriver[] = [
  {
    id: 'drv-1',
    name: 'John Miller',
    phone: '(555) 111-2222',
    carrierId: 'car-1',
    truckNum: 'TK-101',
    trailerNum: 'TR-5301',
    status: 'ON_LOAD'
  },
  {
    id: 'drv-2',
    name: 'Robert Davis',
    phone: '(555) 333-4444',
    carrierId: 'car-2',
    truckNum: 'TK-204',
    trailerNum: 'TR-5309',
    status: 'AVAILABLE'
  }
];

// ==========================================
// MAIN APP COMPONENT
// ==========================================

export default function StandaloneApp() {
  const [activeCategory, setActiveCategory] = useState<NavCategory>('DASHBOARD');
  const [activeSubTab, setActiveSubTab] = useState<string>('overview');
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Persistent Local State
  const [user] = useState<LocalUser>(INITIAL_USER);
  const [loads, setLoads] = useState<LocalLoad[]>(() => {
    const saved = localStorage.getItem('standalone_loads');
    return saved ? JSON.parse(saved) : INITIAL_LOADS;
  });

  const [carriers, setCarriers] = useState<LocalCarrier[]>(() => {
    const saved = localStorage.getItem('standalone_carriers');
    return saved ? JSON.parse(saved) : INITIAL_CARRIERS;
  });

  const [drivers, setDrivers] = useState<LocalDriver[]>(() => {
    const saved = localStorage.getItem('standalone_drivers');
    return saved ? JSON.parse(saved) : INITIAL_DRIVERS;
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('standalone_loads', JSON.stringify(loads));
    } catch (e) {
      console.warn("Storage write notice", e);
    }
  }, [loads]);

  useEffect(() => {
    try {
      localStorage.setItem('standalone_carriers', JSON.stringify(carriers));
    } catch (e) {
      console.warn("Storage write notice", e);
    }
  }, [carriers]);

  useEffect(() => {
    try {
      localStorage.setItem('standalone_drivers', JSON.stringify(drivers));
    } catch (e) {
      console.warn("Storage write notice", e);
    }
  }, [drivers]);

  // Derived Financial Stats
  const metrics = useMemo(() => {
    const totalGross = loads.reduce((sum, l) => sum + l.loadAmount, 0);
    const totalDispatchFees = loads.reduce((sum, l) => sum + (l.loadAmount * l.dispatchFeePercent / 100), 0);
    const activeLoadsCount = loads.filter(l => l.status === 'DISPATCHED' || l.status === 'IN_TRANSIT').length;
    const deliveredCount = loads.filter(l => l.status === 'DELIVERED' || l.status === 'BILLED').length;
    return { totalGross, totalDispatchFees, activeLoadsCount, deliveredCount };
  }, [loads]);

  // Add New Load Helper
  const handleAddLoad = (newLoad: Omit<LocalLoad, 'id'>) => {
    const created: LocalLoad = {
      ...newLoad,
      id: `ld-${Date.now()}`
    };
    setLoads(prev => [created, ...prev]);
  };

  // Delete Load Helper
  const handleDeleteLoad = (id: string) => {
    setLoads(prev => prev.filter(l => l.id !== id));
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans flex flex-col`}>
      {/* HEADER BAR */}
      <header className={`h-16 border-b ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'} px-6 flex items-center justify-between sticky top-0 z-50 backdrop-blur`}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 font-black">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight flex items-center gap-2">
              <span>TIMELY LOGISTIX</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold">
                STANDALONE LOCAL
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">Open Source Freight &amp; Dispatch Engine</p>
          </div>
        </div>

        {/* User Info & Preferences */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-xl border ${darkMode ? 'border-slate-800 hover:bg-slate-800 text-amber-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'} transition`}
            title="Toggle Visual Theme"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
            <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
              {user.name[0]}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold leading-none">{user.name}</p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase">{user.role}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* MAIN SIDEBAR NAVIGATION */}
        <aside className={`w-64 border-r ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} p-4 flex flex-col justify-between shrink-0`}>
          <div className="space-y-1">
            <p className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider px-3 mb-2">Main Category Modules</p>
            
            <NavButton icon={<Activity className="h-4 w-4" />} label="Dashboard & Ops" active={activeCategory === 'DASHBOARD'} onClick={() => { setActiveCategory('DASHBOARD'); setActiveSubTab('overview'); }} />
            <NavButton icon={<Package className="h-4 w-4" />} label="Load Management" active={activeCategory === 'LOADS'} onClick={() => { setActiveCategory('LOADS'); setActiveSubTab('all-loads'); }} />
            <NavButton icon={<Truck className="h-4 w-4" />} label="Carrier Directory" active={activeCategory === 'CARRIERS'} onClick={() => { setActiveCategory('CARRIERS'); setActiveSubTab('all-carriers'); }} />
            <NavButton icon={<Users className="h-4 w-4" />} label="Fleet & Drivers" active={activeCategory === 'FLEET'} onClick={() => { setActiveCategory('FLEET'); setActiveSubTab('roster'); }} />
            <NavButton icon={<FileText className="h-4 w-4" />} label="Dispatch Invoicing" active={activeCategory === 'INVOICING'} onClick={() => { setActiveCategory('INVOICING'); setActiveSubTab('invoices'); }} />
            <NavButton icon={<DollarSign className="h-4 w-4" />} label="Settlements & Pay" active={activeCategory === 'SETTLEMENTS'} onClick={() => { setActiveCategory('SETTLEMENTS'); setActiveSubTab('statements'); }} />
            <NavButton icon={<BarChart3 className="h-4 w-4" />} label="Financial Ledger" active={activeCategory === 'TRANSACTIONS'} onClick={() => { setActiveCategory('TRANSACTIONS'); setActiveSubTab('ledger'); }} />
            <NavButton icon={<Settings className="h-4 w-4" />} label="System Settings" active={activeCategory === 'SETTINGS'} onClick={() => { setActiveCategory('SETTINGS'); setActiveSubTab('backup'); }} />
          </div>

          <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'} text-xs space-y-1`}>
            <div className="flex items-center gap-2 font-bold text-emerald-400">
              <Database className="h-3.5 w-3.5" />
              <span>Offline Local Persistence</span>
            </div>
            <p className="text-[11px] text-slate-400">All records persist automatically in browser LocalStorage. No server required.</p>
          </div>
        </aside>

        {/* CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* CATEGORY: DASHBOARD */}
          {activeCategory === 'DASHBOARD' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Dispatch Control Center</h2>
                  <p className="text-xs text-slate-400">Real-time load throughput, dispatch revenue, and operational velocity.</p>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard title="Total Freight Gross" value={`$${metrics.totalGross.toLocaleString()}`} change="+12.4%" icon={<DollarSign className="h-5 w-5 text-emerald-400" />} />
                <MetricCard title="Dispatch Fee Earnings" value={`$${metrics.totalDispatchFees.toLocaleString()}`} change="+8.1%" icon={<TrendingUp className="h-5 w-5 text-blue-400" />} />
                <MetricCard title="Active In-Transit Loads" value={metrics.activeLoadsCount.toString()} subtitle="Currently on road" icon={<Truck className="h-5 w-5 text-amber-400" />} />
                <MetricCard title="Delivered & Billed" value={metrics.deliveredCount.toString()} subtitle="POD confirmed" icon={<CheckCircle className="h-5 w-5 text-purple-400" />} />
              </div>

              {/* Active Loads Quick Table */}
              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} space-y-4`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm">Active &amp; In-Transit Loads</h3>
                  <button onClick={() => setActiveCategory('LOADS')} className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-semibold">
                    View All Loads <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Load #</th>
                        <th className="py-2.5 px-3">Carrier / Driver</th>
                        <th className="py-2.5 px-3">Route</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {loads.map(load => (
                        <tr key={load.id} className="hover:bg-slate-800/30">
                          <td className="py-3 px-3 font-mono font-extrabold text-blue-400">{load.loadNum}</td>
                          <td className="py-3 px-3">
                            <p className="font-semibold">{load.carrierName}</p>
                            <p className="text-[10px] text-slate-400">{load.driverName}</p>
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-mono text-[11px]">{load.pickupLocation} → {load.deliveryLocation}</p>
                            <p className="text-[10px] text-slate-400">{load.pickupDate} to {load.deliveryDate}</p>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-emerald-400">${load.loadAmount.toLocaleString()}</td>
                          <td className="py-3 px-3">
                            <StatusBadge status={load.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY: LOADS */}
          {activeCategory === 'LOADS' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Load Management &amp; Dispatch</h2>
                  <p className="text-xs text-slate-400">Create, assign, track, and manage rate confirmations.</p>
                </div>
              </div>

              {/* Add Load Form Modal / Panel */}
              <LoadBuilderForm carriers={carriers} drivers={drivers} onAdd={handleAddLoad} />

              {/* Loads List */}
              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} space-y-4`}>
                <h3 className="font-bold text-sm">Dispatched Loads Registry</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Load #</th>
                        <th className="py-2.5 px-3">Carrier</th>
                        <th className="py-2.5 px-3">Driver</th>
                        <th className="py-2.5 px-3">Pickup</th>
                        <th className="py-2.5 px-3">Delivery</th>
                        <th className="py-2.5 px-3">Gross Rate</th>
                        <th className="py-2.5 px-3">Dispatch Fee</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {loads.map(load => {
                        const feeAmt = (load.loadAmount * load.dispatchFeePercent) / 100;
                        return (
                          <tr key={load.id} className="hover:bg-slate-800/30">
                            <td className="py-3 px-3 font-mono font-bold text-blue-400">{load.loadNum}</td>
                            <td className="py-3 px-3 font-semibold">{load.carrierName}</td>
                            <td className="py-3 px-3">{load.driverName}</td>
                            <td className="py-3 px-3 font-mono">{load.pickupLocation} ({load.pickupDate})</td>
                            <td className="py-3 px-3 font-mono">{load.deliveryLocation} ({load.deliveryDate})</td>
                            <td className="py-3 px-3 font-mono font-bold text-emerald-400">${load.loadAmount.toLocaleString()}</td>
                            <td className="py-3 px-3 font-mono text-purple-300">${feeAmt.toLocaleString()} ({load.dispatchFeePercent}%)</td>
                            <td className="py-3 px-3"><StatusBadge status={load.status} /></td>
                            <td className="py-3 px-3 text-right">
                              <button onClick={() => handleDeleteLoad(load.id)} className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition" title="Delete Load">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY: CARRIERS */}
          {activeCategory === 'CARRIERS' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Carrier Directory &amp; Compliance</h2>
                  <p className="text-xs text-slate-400">Onboarded trucking companies and dispatch agreement profiles.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {carriers.map(c => (
                  <div key={c.id} className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} space-y-3`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold">
                          <Truck className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-white">{c.companyName}</h3>
                          <p className="text-xs font-mono text-slate-400">{c.mcNumber} • {c.dotNumber}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-mono font-bold">
                        {c.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-800/80 pt-3 font-mono">
                      <div>
                        <span className="text-slate-500 text-[10px]">Contact Phone:</span>
                        <p className="text-slate-300">{c.phone}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px]">Dispatch Fee Rate:</span>
                        <p className="text-purple-300 font-bold">{c.dispatchFeeRate}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CATEGORY: FLEET & DRIVERS */}
          {activeCategory === 'FLEET' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Fleet Roster &amp; Assigned Drivers</h2>
                  <p className="text-xs text-slate-400">Truck and trailer assignments, driver contacts, and duty states.</p>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Driver Name</th>
                      <th className="py-2.5 px-3">Phone</th>
                      <th className="py-2.5 px-3">Truck #</th>
                      <th className="py-2.5 px-3">Trailer #</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {drivers.map(drv => (
                      <tr key={drv.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-3 font-semibold">{drv.name}</td>
                        <td className="py-3 px-3 font-mono text-slate-400">{drv.phone}</td>
                        <td className="py-3 px-3 font-mono text-blue-400 font-bold">{drv.truckNum}</td>
                        <td className="py-3 px-3 font-mono text-slate-300">{drv.trailerNum}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            drv.status === 'ON_LOAD' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {drv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CATEGORY: INVOICING */}
          {activeCategory === 'INVOICING' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold">Dispatch Fee Invoicer</h2>
                <p className="text-xs text-slate-400">Generate statements and collect dispatch commissions from carriers.</p>
              </div>

              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} space-y-4`}>
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="font-extrabold text-base text-blue-400">INVOICE STATEMENT #INV-2026-001</h3>
                    <p className="text-xs text-slate-400">Period: August 2026 Freight Dispatch</p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition">
                    <Download className="h-4 w-4" /> Export CSV / Print
                  </button>
                </div>

                <div className="space-y-3">
                  {loads.map(load => {
                    const feeAmt = (load.loadAmount * load.dispatchFeePercent) / 100;
                    return (
                      <div key={load.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 font-mono text-xs">
                        <div>
                          <p className="font-bold text-white">{load.loadNum} - {load.carrierName}</p>
                          <p className="text-[10px] text-slate-400">{load.pickupLocation} → {load.deliveryLocation}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-400">${feeAmt.toFixed(2)}</p>
                          <p className="text-[10px] text-slate-500">{load.dispatchFeePercent}% of ${load.loadAmount}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY: SETTLEMENTS */}
          {activeCategory === 'SETTLEMENTS' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold">Carrier &amp; Driver Settlements</h2>
                <p className="text-xs text-slate-400">Calculate net payouts after fuel advances, repairs, and fees.</p>
              </div>

              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} space-y-4`}>
                <h3 className="font-bold text-sm">Settlement Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Gross Load Rates</span>
                    <p className="text-lg font-bold text-emerald-400">${metrics.totalGross.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Dispatch Fee Deductions</span>
                    <p className="text-lg font-bold text-purple-400">-${metrics.totalDispatchFees.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Net Carrier Settlement</span>
                    <p className="text-lg font-bold text-blue-400">${(metrics.totalGross - metrics.totalDispatchFees).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY: TRANSACTIONS */}
          {activeCategory === 'TRANSACTIONS' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold">Financial Ledger &amp; Cash Flow</h2>
                <p className="text-xs text-slate-400">Complete audit trail of earnings and operational expenses.</p>
              </div>

              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="p-8 text-center space-y-3">
                  <BarChart3 className="h-10 w-10 text-blue-400 mx-auto" />
                  <h3 className="font-bold text-base">Real-Time Financial Audit Ledger</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    All completed dispatches and fee collections are logged locally in standard accounting JSON formats.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY: SETTINGS */}
          {activeCategory === 'SETTINGS' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold">System Configuration &amp; Backup Vault</h2>
                <p className="text-xs text-slate-400">Manage local storage data, export backup JSON, or reset environment.</p>
              </div>

              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} space-y-5 max-w-xl`}>
                <div className="space-y-2">
                  <h3 className="font-bold text-sm text-white">Local Data Operations</h3>
                  <p className="text-xs text-slate-400">Export or import your entire dispatch software state without needing a database connection.</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ loads, carriers, drivers }));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", `dispatch_backup_${Date.now()}.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                    }}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition shadow-lg"
                  >
                    <Download className="h-4 w-4" /> Export Backup JSON
                  </button>

                  <button
                    onClick={() => {
                      localStorage.clear();
                      window.location.reload();
                    }}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition"
                  >
                    <Trash2 className="h-4 w-4" /> Reset Local Vault
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
        active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function MetricCard({ title, value, subtitle, change, icon }: { title: string; value: string; subtitle?: string; change?: string; icon: React.ReactNode }) {
  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400 font-semibold">{title}</span>
        <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50">{icon}</div>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-black font-mono text-white">{value}</span>
        {change && <span className="text-xs font-mono font-bold text-emerald-400">{change}</span>}
      </div>
      {subtitle && <p className="text-[10px] text-slate-500 font-mono">{subtitle}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: LocalLoad['status'] }) {
  const styles = {
    DISPATCHED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    IN_TRANSIT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    DELIVERED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    BILLED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    CANCELLED: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${styles[status]}`}>
      {status}
    </span>
  );
}

function LoadBuilderForm({ carriers, drivers, onAdd }: { carriers: LocalCarrier[]; drivers: LocalDriver[]; onAdd: (load: Omit<LocalLoad, 'id'>) => void }) {
  const [loadNum, setLoadNum] = useState(`TL-${Math.floor(1000 + Math.random() * 9000)}`);
  const [carrierName, setCarrierName] = useState(carriers[0]?.companyName || 'Swift Logistics LLC');
  const [driverName, setDriverName] = useState(drivers[0]?.name || 'John Miller');
  const [pickupLocation, setPickupLocation] = useState('Chicago, IL');
  const [deliveryLocation, setDeliveryLocation] = useState('Atlanta, GA');
  const [loadAmount, setLoadAmount] = useState(3000);
  const [dispatchFeePercent, setDispatchFeePercent] = useState(10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      loadNum,
      carrierName,
      driverName,
      pickupLocation,
      deliveryLocation,
      pickupDate: new Date().toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      loadAmount: Number(loadAmount),
      dispatchFeePercent: Number(dispatchFeePercent),
      status: 'DISPATCHED',
      notes: 'Dispatched via local standalone app.'
    });
    setLoadNum(`TL-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
      <h3 className="font-bold text-sm text-white flex items-center gap-2">
        <Plus className="h-4 w-4 text-blue-400" /> Dispatch New Freight Load
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="text-slate-400 text-[10px] font-mono">Load #</label>
          <input value={loadNum} onChange={e => setLoadNum(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white font-mono" required />
        </div>
        <div>
          <label className="text-slate-400 text-[10px] font-mono">Carrier</label>
          <select value={carrierName} onChange={e => setCarrierName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white">
            {carriers.map(c => <option key={c.id} value={c.companyName}>{c.companyName}</option>)}
          </select>
        </div>
        <div>
          <label className="text-slate-400 text-[10px] font-mono">Driver</label>
          <select value={driverName} onChange={e => setDriverName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white">
            {drivers.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-slate-400 text-[10px] font-mono">Pickup Origin</label>
          <input value={pickupLocation} onChange={e => setPickupLocation(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white" required />
        </div>
        <div>
          <label className="text-slate-400 text-[10px] font-mono">Delivery Destination</label>
          <input value={deliveryLocation} onChange={e => setDeliveryLocation(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white" required />
        </div>
        <div>
          <label className="text-slate-400 text-[10px] font-mono">Gross Amount ($)</label>
          <input type="number" value={loadAmount} onChange={e => setLoadAmount(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white font-mono" required />
        </div>
      </div>

      <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer transition shadow-lg flex items-center justify-center gap-2">
        <Plus className="h-4 w-4" /> Save &amp; Dispatch Load
      </button>
    </form>
  );
}
