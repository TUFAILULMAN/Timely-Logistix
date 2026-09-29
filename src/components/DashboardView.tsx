/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Driver, Dispatcher, Load, ClockRecord, DriverSettlement, CompanyBroadcast } from '../types';
import timelyLogo from '../assets/images/timely_logistix_logo_1780067518769.png';
import FleetMapWidget from './FleetMapWidget';
import {
  TrendingUp,
  Truck,
  DollarSign,
  UserCheck,
  Calendar,
  AlertCircle,
  Clock,
  LogOut,
  ArrowUpRight,
  Sparkles,
  Play,
  Coffee,
  Activity,
  Target,
  Award,
  CheckCircle2,
  Plus,
  Minus,
  Zap,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Bell,
  Check,
  MapPin,
  ListTodo,
  FileSpreadsheet,
  Globe,
  Trash2,
  Lock,
  Percent,
  TrendingDown,
  FileCheck,
  RefreshCw,
  Search
} from 'lucide-react';

interface DashboardViewProps {
  currentUser: User;
  drivers: Driver[];
  dispatchers: Dispatcher[];
  loads: Load[];
  attendance: ClockRecord[];
  factoringRatePercent: number;
  currentClockRecord: ClockRecord | null;
  onClockIn: (dispId: string) => void;
  onClockOut: (recordId: string) => void;
  onNavigateTo: (tab: string) => void;
  allUsers?: User[];
  driverSettlements?: DriverSettlement[];
  broadcasts?: CompanyBroadcast[];
  onAddLoad?: (load: Omit<Load, 'id'>) => void;
}

interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt: string;
}

interface MockAvailableLoad {
  id: string;
  loadNum: string;
  broker: string;
  pickup: string;
  delivery: string;
  amount: number;
  miles: number;
  equipment: string;
  pickupDate: string;
}

export default function DashboardView({
  currentUser,
  drivers,
  dispatchers,
  loads,
  attendance,
  factoringRatePercent,
  currentClockRecord,
  onClockIn,
  onClockOut,
  onNavigateTo,
  allUsers = [],
  driverSettlements = [],
  broadcasts = [],
  onAddLoad
}: DashboardViewProps) {
  // --- REAL-TIME USA CLOCKS TIMER ---
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Time Formatter per US Timezone
  const formatZoneTime = (timeZone: string) => {
    return currentTime.toLocaleTimeString('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatZoneDate = (timeZone: string) => {
    return currentTime.toLocaleDateString('en-US', {
      timeZone,
      month: 'short',
      day: 'numeric'
    });
  };

  // --- COMPONENT LOCAL STATES ---
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'ACTIVE' | 'IDLE' | 'ON_BREAK'>('ALL');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeKpiTab, setActiveKpiTab] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [showDispatchModal, setShowDispatchModal] = useState<MockAvailableLoad | null>(null);
  
  // Dispatch form states
  const [dispatchDriverId, setDispatchDriverId] = useState('');
  const [dispatchDispId, setDispatchDispId] = useState('');
  const [dispatchFeePercent, setDispatchFeePercent] = useState('8');
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);

  // Today's date reference
  const todayStr = '2026-05-29'; // system reference date matching existing datasets

  // --- DYNAMIC TASKS ENGINE (LOCAL STORAGE PERSISTED) ---
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    const saved = localStorage.getItem(`tl_dispatcher_tasks_${currentUser.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore fallback
      }
    }
    return [
      { id: '1', title: 'Verify rate confirmation on broker Coyote Load #8092', completed: false, priority: 'HIGH', createdAt: todayStr },
      { id: '2', title: 'Collect missing POD from driver Frank on Dry Van #221', completed: false, priority: 'HIGH', createdAt: todayStr },
      { id: '3', title: 'Audit Apex Factoring invoice submissions', completed: true, priority: 'MEDIUM', createdAt: todayStr },
      { id: '4', title: 'Book backhaul load for owner-operator Dave out of Dallas', completed: false, priority: 'LOW', createdAt: todayStr },
    ];
  });

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');

  useEffect(() => {
    try {
      localStorage.setItem(`tl_dispatcher_tasks_${currentUser.id}`, JSON.stringify(tasks));
    } catch (e) {
      console.warn("Could not save dispatcher tasks to local storage", e);
    }
  }, [tasks, currentUser.id]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const item: TaskItem = {
      id: `task_${Date.now()}`,
      title: newTaskTitle.trim(),
      completed: false,
      priority: newTaskPriority,
      createdAt: todayStr
    };
    setTasks([item, ...tasks]);
    setNewTaskTitle('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  // --- INTERACTIVE AVAILABLE LOADS BOARD (MARKETPLACE) ---
  const [marketLoads, setMarketLoads] = useState<MockAvailableLoad[]>(() => {
    const saved = localStorage.getItem('tl_simulated_market_loads');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'm_101', loadNum: 'ML-9921', broker: 'CH Robinson', pickup: 'Chicago, IL', delivery: 'Atlanta, GA', amount: 2850, miles: 710, equipment: 'Dry Van', pickupDate: '2026-05-29' },
      { id: 'm_102', loadNum: 'ML-9922', broker: 'Coyote Logistics', pickup: 'Houston, TX', delivery: 'Denver, CO', amount: 3400, miles: 880, equipment: 'Reefer', pickupDate: '2026-05-29' },
      { id: 'm_103', loadNum: 'ML-9923', broker: 'TQL', pickup: 'Savannah, GA', delivery: 'Dallas, TX', amount: 3100, miles: 980, equipment: 'Flatbed', pickupDate: '2026-05-30' },
      { id: 'm_104', loadNum: 'ML-9924', broker: 'Landstar', pickup: 'Gary, IN', delivery: 'Allentown, PA', amount: 2450, miles: 680, equipment: 'Dry Van', pickupDate: '2026-05-30' },
      { id: 'm_105', loadNum: 'ML-9925', broker: 'Echo Global', pickup: 'Los Angeles, CA', delivery: 'Phoenix, AZ', amount: 1600, miles: 370, equipment: 'Flatbed', pickupDate: '2026-05-31' },
      { id: 'm_106', loadNum: 'ML-9926', broker: 'RTI Freight', pickup: 'Columbus, OH', delivery: 'Charlotte, NC', amount: 1950, miles: 430, equipment: 'Power Only', pickupDate: '2026-05-31' },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('tl_simulated_market_loads', JSON.stringify(marketLoads));
    } catch (e) {
      console.warn("Could not save market loads to local storage", e);
    }
  }, [marketLoads]);

  // --- DAILY LOAD GOAL METRICS ---
  const [dailyGoal, setDailyGoal] = useState<number>(() => {
    const saved = localStorage.getItem(`daily_load_goal_${currentUser.id}`);
    return saved ? parseInt(saved, 10) : 5;
  });

  const handleSetGoal = (newGoal: number) => {
    const val = Math.max(1, Math.min(50, newGoal));
    setDailyGoal(val);
    try {
      localStorage.setItem(`daily_load_goal_${currentUser.id}`, val.toString());
    } catch (e) {
      console.warn("Could not save goal to local storage", e);
    }
  };

  // --- DATA FILTERING BY USER ROLE ---
  const isAdmin = currentUser.role === 'ADMIN';
  const myDispatcher = !isAdmin
    ? dispatchers.find(d => d.username === currentUser.username)
    : null;
  const myDispatcherId = myDispatcher?.id || '';

  const visibleDrivers = isAdmin
    ? drivers
    : drivers.filter(d => d.assignedDispatcherId === myDispatcherId);

  const visibleLoads = isAdmin
    ? loads
    : loads.filter(l => l.dispatcherId === myDispatcherId);

  const visibleAttendance = isAdmin
    ? attendance
    : attendance.filter(a => a.dispatcherId === myDispatcherId);

  // --- REVENUE & FINANCIAL MATRICES ---
  const todayLoads = visibleLoads.filter(l => l.pickupDate === todayStr || l.deliveryDate === todayStr);
  const revenueToday = todayLoads.reduce((sum, l) => sum + l.loadAmount, 0);

  // Weekly Revenue (May 24th - May 30th 2026)
  const startOfWeek = new Date('2026-05-24');
  const endOfWeek = new Date('2026-05-30');
  const weeklyLoads = visibleLoads.filter(l => {
    const pickup = new Date(l.pickupDate);
    return pickup >= startOfWeek && pickup <= endOfWeek;
  });
  const revenueWeekly = weeklyLoads.reduce((sum, l) => sum + l.loadAmount, 0);

  // Monthly Revenue (May 2026)
  const monthlyLoads = visibleLoads.filter(l => l.pickupDate.startsWith('2026-05'));
  const revenueMonthly = monthlyLoads.reduce((sum, l) => sum + l.loadAmount, 0);

  // Pending Payments / Accounts Receivable
  const unpaidLoads = visibleLoads.filter(l => l.paymentStatus === 'Unpaid');
  const pendingPaymentsAmount = unpaidLoads.reduce((sum, l) => sum + l.loadAmount, 0);

  // Payout math definitions for profit:
  const totalDriverPayoutsVal = visibleLoads.reduce((sum, l) => {
    const rate = (100 - l.feePercent) / 100;
    const baseShare = l.loadAmount * rate;
    const deductions = l.advanceFuel + l.cashAdvance + l.repairDeduction + l.tollDeduction;
    return sum + (baseShare - deductions);
  }, 0);

  const totalFactoringFeesVal = visibleLoads.reduce((sum, l) => {
    if (l.factoringStatus === 'Factored') {
      return sum + (l.loadAmount * factoringRatePercent) / 100;
    }
    return sum;
  }, 0);

  const totalDispatchRevenueVal = visibleLoads.reduce((sum, l) => {
    const dObj = dispatchers.find(disp => disp.id === l.dispatcherId);
    const dRate = dObj ? dObj.commissionPercent : 8;
    return sum + (l.loadAmount * dRate) / 100;
  }, 0);

  const totalCompanyShareVal = visibleLoads.reduce((sum, l) => {
    const grossVal = l.loadAmount;
    const jointFeePercent = l.feePercent;
    const totalFeeDollar = grossVal * (jointFeePercent / 100);
    const factorDollar = l.factoringStatus === 'Factored' ? (grossVal * factoringRatePercent / 100) : 0;
    
    const dObj = dispatchers.find(disp => disp.id === l.dispatcherId);
    const dRate = dObj ? dObj.commissionPercent : 8;
    const dispatchDollar = (grossVal * dRate) / 100;

    return sum + Math.max(0, totalFeeDollar - factorDollar - dispatchDollar);
  }, 0);

  // Net Profit = Company Operating Buffer + Dispatch Commission Margin
  const netProfit = totalCompanyShareVal + totalDispatchRevenueVal;

  // --- STAFF ONLINE ENGINE ---
  // A dispatcher or sales agent is online if they have an active open shift (!clockOut)
  const activeClockRecords = attendance.filter(a => !a.clockOut);
  const isStaffOnline = (entityId: string, username?: string, dispId?: string) => {
    return activeClockRecords.some(a => {
      const r = (a.dispatcherId || '').toLowerCase().trim();
      const eId = (entityId || '').toLowerCase().trim();
      const uName = (username || '').toLowerCase().trim();
      const dId = (dispId || '').toLowerCase().trim();
      if (eId && (r === eId || (r.startsWith('u_') && r.substring(2) === eId))) return true;
      if (dId && (r === dId || (r.startsWith('u_') && r.substring(2) === dId))) return true;
      if (uName && (r === uName || (uName.includes('@') && r === uName.split('@')[0]))) return true;
      return false;
    });
  };

  // Fetch Dispatchers online
  const dispatchersOnline = dispatchers.filter(d => isStaffOnline(d.id, d.username, d.id));
  // Sales agents are tracked as users with role 'SALES' in allUsers
  const salesAgents = allUsers.filter(u => u.role === 'SALES');
  const salesAgentsOnline = salesAgents.filter(s => isStaffOnline(s.id, s.username, s.dispatcherId));

  // --- DRIVERS & TRUCKS UTILIZATION ---
  const activeDriversList = visibleDrivers.filter(d => d.status === 'ACTIVE');
  const activeTrucksCount = activeDriversList.map(d => d.truckNum).filter((v, i, self) => self.indexOf(v) === i).length;

  // Driver status categorizations for live cards
  const driverStatusData = visibleDrivers.map(d => {
    const dLoads = visibleLoads.filter(l => l.driverId === d.id);
    const hasActiveLoad = dLoads.some(l => l.paymentStatus === 'Unpaid');
    
    let subStatus: 'ACTIVE' | 'IDLE' | 'ON_BREAK' | 'INACTIVE' = 'IDLE';
    if (d.status === 'INACTIVE') {
      subStatus = 'INACTIVE';
    } else if (hasActiveLoad) {
      subStatus = 'ACTIVE';
    } else if (d.name.length % 3 === 0) {
      subStatus = 'ON_BREAK';
    } else {
      subStatus = 'IDLE';
    }

    return { driver: d, subStatus };
  });

  const activeDriversCount = driverStatusData.filter(item => item.subStatus === 'ACTIVE').length;
  const idleDriversCount = driverStatusData.filter(item => item.subStatus === 'IDLE').length;
  const breakDriversCount = driverStatusData.filter(item => item.subStatus === 'ON_BREAK').length;

  // --- REAL-TIME OPERATIONAL RECENT ACTIVITY Timeline ---
  const recentActivitiesList = [
    { type: 'LOAD', user: 'System Agent', text: 'Simulated market load board sync completed', time: '10:45 AM', icon: RefreshCw, color: 'text-indigo-600 bg-indigo-50' },
    ...loads.slice(-3).map(l => ({
      type: 'LOAD',
      user: dispatchers.find(d => d.id === l.dispatcherId)?.name || 'Dispatcher',
      text: `Booked Run #${l.loadNum} ($${l.loadAmount.toLocaleString()})`,
      time: '09:12 AM',
      icon: Activity,
      color: 'text-emerald-600 bg-emerald-50'
    })),
    ...attendance.slice(-2).map(a => ({
      type: 'CLOCK',
      user: dispatchers.find(d => d.id === a.dispatcherId)?.name || 'Personnel',
      text: `Clocked in ${a.isLate ? 'Late' : 'On-Time'} at ${a.clockIn}`,
      time: '08:00 AM',
      icon: Clock,
      color: 'text-blue-600 bg-blue-50'
    })),
    ...driverSettlements.slice(-2).map(s => ({
      type: 'SETTLEMENT',
      user: 'Finance Desk',
      text: `Settlement generated for ${s.driverName} ($${s.netPayout.toLocaleString()})`,
      time: 'Yesterday',
      icon: FileCheck,
      color: 'text-purple-600 bg-purple-50'
    }))
  ].slice(0, 8);

  // --- DISPATCH LOADBOARD SIMULATED TRIGGERS ---
  const handleOpenDispatchModal = (load: MockAvailableLoad) => {
    setShowDispatchModal(load);
    setDispatchDriverId(visibleDrivers[0]?.id || '');
    setDispatchDispId(myDispatcherId || (dispatchers[0]?.id || ''));
    setDispatchFeePercent('8');
    setDispatchSuccessMsg(null);
  };

  const handleConfirmDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showDispatchModal || !onAddLoad) return;

    const selectedDriver = drivers.find(d => d.id === dispatchDriverId);
    if (!selectedDriver) return;

    // Call state modifier in App.tsx
    onAddLoad({
      loadNum: showDispatchModal.loadNum,
      rateConNum: `RC-${Math.floor(100000 + Math.random() * 900000)}`,
      dispatcherId: dispatchDispId,
      driverId: dispatchDriverId,
      broker: showDispatchModal.broker,
      pickupLocation: showDispatchModal.pickup,
      deliveryLocation: showDispatchModal.delivery,
      pickupDate: showDispatchModal.pickupDate,
      deliveryDate: todayStr,
      loadAmount: showDispatchModal.amount,
      feePercent: parseFloat(dispatchFeePercent),
      advanceFuel: 0,
      cashAdvance: 0,
      repairDeduction: 0,
      tollDeduction: 0,
      factoringStatus: 'Factored',
      paymentStatus: 'Unpaid',
      status: 'Pending',
      podUploaded: false,
      rateConUploaded: false,
      notes: `Booked instantly via Live Dashboard Marketplace`
    });

    // Remove load from active board list to simulate absorption
    setMarketLoads(marketLoads.filter(ml => ml.id !== showDispatchModal.id));
    setDispatchSuccessMsg(`Success! Run #${showDispatchModal.loadNum} has been added to operational load logs and assigned to driver ${selectedDriver.name}!`);
    
    // Auto-dismiss
    setTimeout(() => {
      setShowDispatchModal(null);
      setDispatchSuccessMsg(null);
    }, 2500);
  };

  // --- SMART DIAGNOSTIC NOTIFICATIONS ALERTS ---
  const smartNotifications = [
    ...broadcasts.map(b => ({
      type: b.type === 'ALERT' ? 'CRITICAL' : 'BROADCAST',
      title: b.title,
      desc: b.message,
      source: b.senderName
    })),
    // Missing POD reminder
    ...loads.filter(l => l.status === 'Delivered' && !l.podUploaded).map(l => ({
      type: 'WARNING',
      title: 'Missing POD Document',
      desc: `Load #${l.loadNum} is marked Delivered but lacks Proof-of-Delivery files.`,
      source: 'Compliance Auditor'
    })),
    // Idle Active Driver reminder
    ...visibleDrivers.filter(d => d.status === 'ACTIVE' && !loads.some(l => l.driverId === d.id && l.paymentStatus === 'Unpaid')).map(d => ({
      type: 'INFO',
      title: 'Unassigned Active Truck',
      desc: `Driver ${d.name} (Truck ${d.truckNum}) has no active load assigned.`,
      source: 'Fleet Optimization'
    })),
    // Overdue accounts receivables
    ...loads.filter(l => l.paymentStatus === 'Unpaid' && l.pickupDate < '2026-05-20').map(l => ({
      type: 'WARNING',
      title: 'Overdue Invoice Reminder',
      desc: `Broker ${l.broker} payment overdue for Load #${l.loadNum} ($${l.loadAmount.toLocaleString()}).`,
      source: 'Accounts Receivable'
    }))
  ].slice(0, 6);

  return (
    <div id="dashboard_panel" className="space-y-6">

      {/* ================= SECTION 1: SYSTEM TITLE & LIVE TIME CLOCK ZONE BANNER ================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative overflow-hidden">
        {/* Decorative ambient background orb */}
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <img
            src={timelyLogo}
            alt="Timely Logistix"
            className="h-14 w-auto rounded-xl object-contain bg-slate-950 p-2 border border-slate-800 hidden sm:block"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-blue-400 bg-blue-500/15 border border-blue-500/30 px-2.5 py-1 rounded-full uppercase tracking-widest font-mono">
                {isAdmin ? 'System Control Tower' : 'Terminal Station'}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[9px] font-bold text-slate-400 font-mono">LIVE DATABASE</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight mt-2 font-display">
              Operational Command, {currentUser.name}
            </h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span>Freight logistics manager for Timely Logistix fleet</span>
              <span>&bull;</span>
              <span className="text-slate-300 font-semibold">{todayStr}</span>
            </p>
          </div>
        </div>

        {/* --- LIVE USA TIMEZONE CLOCKS CARD --- */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10 w-full xl:w-auto">
          {/* EST */}
          <div className="px-3 py-1.5 border-r border-slate-800/80 last:border-0 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1">
              <Globe className="h-3 w-3 text-blue-400 shrink-0" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Eastern (EST)</span>
            </div>
            <div className="text-base font-extrabold text-blue-100 font-mono mt-1 tracking-tight">
              {formatZoneTime('America/New_York')}
            </div>
            <div className="text-[9px] text-slate-500 font-mono mt-0.5">{formatZoneDate('America/New_York')}</div>
          </div>

          {/* CST */}
          <div className="px-3 py-1.5 border-r border-slate-800/80 last:border-0 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1">
              <Clock className="h-3 w-3 text-purple-400 shrink-0" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Central (CST)</span>
            </div>
            <div className="text-base font-extrabold text-purple-100 font-mono mt-1 tracking-tight">
              {formatZoneTime('America/Chicago')}
            </div>
            <div className="text-[9px] text-slate-500 font-mono mt-0.5">{formatZoneDate('America/Chicago')}</div>
          </div>

          {/* MST */}
          <div className="px-3 py-1.5 border-r border-slate-800/80 last:border-0 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1">
              <Clock className="h-3 w-3 text-amber-400 shrink-0" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Mountain (MST)</span>
            </div>
            <div className="text-base font-extrabold text-amber-100 font-mono mt-1 tracking-tight">
              {formatZoneTime('America/Denver')}
            </div>
            <div className="text-[9px] text-slate-500 font-mono mt-0.5">{formatZoneDate('America/Denver')}</div>
          </div>

          {/* PST */}
          <div className="px-3 py-1.5 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1">
              <Clock className="h-3 w-3 text-emerald-400 shrink-0" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Pacific (PST)</span>
            </div>
            <div className="text-base font-extrabold text-emerald-100 font-mono mt-1 tracking-tight">
              {formatZoneTime('America/Los_Angeles')}
            </div>
            <div className="text-[9px] text-slate-500 font-mono mt-0.5">{formatZoneDate('America/Los_Angeles')}</div>
          </div>
        </div>
      </div>

      {/* ================= SECTION 2: TOP LEVEL STATS COUNTER GRID ================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Today's Loads */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Today's Loads</span>
            <Activity className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-3">
            {todayLoads.length} <span className="text-xs text-slate-400 font-normal">Runs</span>
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">
            Booked gross: <span className="font-bold font-mono text-emerald-600">${revenueToday.toLocaleString()}</span>
          </div>
        </div>

        {/* Available Loads */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Available Loads</span>
            <FileSpreadsheet className="h-4 w-4 text-blue-500 animate-pulse" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-3">
            {marketLoads.length} <span className="text-xs text-slate-400 font-normal">Open</span>
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">
            Unbooked on board
          </div>
        </div>

        {/* Active Drivers */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Active Drivers</span>
            <Truck className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-3">
            {activeDriversCount} <span className="text-xs text-slate-400 font-normal">Transit</span>
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">
            Roster: {visibleDrivers.length} registered
          </div>
        </div>

        {/* Active Trucks */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Active Trucks</span>
            <CheckCircle2 className="h-4 w-4 text-sky-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-3">
            {activeTrucksCount} <span className="text-xs text-slate-400 font-normal">On-Duty</span>
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">
            In-transit and idle fleet
          </div>
        </div>

        {/* Dispatchers Online */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Dispatchers Online</span>
            <UserCheck className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-3">
            {dispatchersOnline.length} <span className="text-xs text-slate-400 font-normal">Active</span>
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">
            Total desk staff: {dispatchers.length}
          </div>
        </div>

        {/* Sales Agents Online */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Sales Online</span>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-3">
            {salesAgentsOnline.length} <span className="text-xs text-slate-400 font-normal">Active</span>
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">
            Sales profiles: {salesAgents.length}
          </div>
        </div>
      </div>

      {/* ================= SECTION 3: FINANCIAL MATRIX GRID ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Revenue Today */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono">Revenue Today</span>
              <h3 className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight mt-1">
                ${revenueToday.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <span className="p-1 px-2.5 text-[9px] font-bold bg-emerald-50 text-emerald-700 rounded-md font-mono border border-emerald-150">
              TODAY
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-4 flex items-center gap-1 border-t border-slate-50 pt-2.5">
            <Check className="h-3 w-3 text-emerald-500" />
            <span>Active shipments pickup scheduled today</span>
          </p>
        </div>

        {/* Revenue This Week */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono">Revenue This Week</span>
              <h3 className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight mt-1">
                ${revenueWeekly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <span className="p-1 px-2.5 text-[9px] font-bold bg-blue-50 text-blue-700 rounded-md font-mono border border-blue-150">
              WEEKLY
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-4 flex items-center gap-1 border-t border-slate-50 pt-2.5">
            <Calendar className="h-3 w-3 text-blue-500" />
            <span>Range: May 24 &ndash; May 30 2026</span>
          </p>
        </div>

        {/* Revenue This Month */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono">Revenue This Month</span>
              <h3 className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight mt-1">
                ${revenueMonthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <span className="p-1 px-2.5 text-[9px] font-bold bg-indigo-50 text-indigo-700 rounded-md font-mono border border-indigo-150">
              MONTHLY
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-4 flex items-center gap-1 border-t border-slate-50 pt-2.5">
            <ArrowUpRight className="h-3 w-3 text-indigo-500 animate-pulse" />
            <span>{monthlyLoads.length} operational runs in May</span>
          </p>
        </div>

        {/* profit */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-5 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono">Retention Net Profit</span>
              <h3 className="text-2xl font-extrabold text-emerald-400 font-mono tracking-tight mt-1">
                ${netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <span className="p-1 px-2.5 text-[9px] font-bold bg-emerald-500/10 text-emerald-400 rounded-md font-mono border border-emerald-500/20">
              PROFIT
            </span>
          </div>
          <div className="text-[10px] text-slate-350 mt-4 border-t border-slate-800 pt-2.5 flex justify-between">
            <span>Company Share + Dispatch Commissions</span>
            <span className="font-bold text-slate-200 font-mono">YTD 2026</span>
          </div>
        </div>
      </div>

      {/* ================= SECTION 4: MAIN INTERACTIVE BODY (BENTO GRID DESIGN) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN: LIVE MARKET AVAILABLE LOADS (LOADBOARD SIMULATOR) & GOAL PROGRESS */}
        <div className="lg:col-span-2 space-y-6">

          {/* DYNAMIC FREIGHT MARKET BOARD (AVAILABLE LOADS SIMULATOR) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/40">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
                  <FileSpreadsheet className="h-4.5 w-4.5 text-blue-600" />
                  <span>Real-time Available Loadboard Marketplace</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Select and book available loads directly to dispatch in-transit fleet drivers.
                </p>
              </div>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full font-mono tracking-wide shrink-0">
                {marketLoads.length} LIVE FREIGHT OFFERS
              </span>
            </div>

            <div className="p-5">
              <div className="overflow-x-auto rounded-xl border border-slate-150">
                <table className="w-full text-left font-sans text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-150 font-mono">
                      <th className="py-2.5 px-3">Offer #</th>
                      <th className="py-2.5 px-3">Brokerage</th>
                      <th className="py-2.5 px-3">Route (Origin ➜ Destination)</th>
                      <th className="py-2.5 px-3 text-right">RPM</th>
                      <th className="py-2.5 px-3 text-right">Payout Gross</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                    {marketLoads.map((mLoad) => {
                      const ratePerMile = (mLoad.amount / mLoad.miles).toFixed(2);
                      return (
                        <tr key={mLoad.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-3 font-semibold text-slate-900 font-mono">{mLoad.loadNum}</td>
                          <td className="py-3 px-3 font-medium text-slate-600">{mLoad.broker}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              <span className="font-semibold text-slate-800 text-[11px]">{mLoad.pickup.split(',')[0]}</span>
                              <span className="text-slate-400 font-mono text-[10px]">&rarr;</span>
                              <span className="font-semibold text-slate-800 text-[11px]">{mLoad.delivery.split(',')[0]}</span>
                            </div>
                            <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                              {mLoad.miles} miles &bull; {mLoad.equipment} &bull; Pickup: {mLoad.pickupDate}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-500 font-medium">${ratePerMile}/mi</td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono text-sm">${mLoad.amount.toLocaleString()}</td>
                          <td className="py-3 px-3 text-center">
                            {onAddLoad ? (
                              <button
                                onClick={() => handleOpenDispatchModal(mLoad)}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                              >
                                Book &amp; Dispatch
                              </button>
                            ) : (
                              <span className="text-slate-400 italic text-[10px]">Disabled</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {marketLoads.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-slate-400 bg-slate-50/40 italic">
                          All available brokerage loads successfully assigned to trucks.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* DISPATCH ACTION WIZARD OVERLAY MODAL */}
          {showDispatchModal && (
            <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl relative">
                <button
                  onClick={() => setShowDispatchModal(null)}
                  className="absolute right-4 top-4 p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                >
                  <Minus className="h-4 w-4" />
                </button>

                <h3 className="text-base font-extrabold text-slate-900 font-display flex items-center gap-2 pr-6">
                  <Truck className="h-5 w-5 text-blue-600 animate-bounce" />
                  <span>Fleet Dispatch Booking: {showDispatchModal.loadNum}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Secure this cargo line sheet from <strong className="text-slate-800">{showDispatchModal.broker}</strong>. Select driver assignment details to add immediately to operational logs.
                </p>

                {dispatchSuccessMsg ? (
                  <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                    <span>{dispatchSuccessMsg}</span>
                  </div>
                ) : (
                  <form onSubmit={handleConfirmDispatch} className="space-y-4 mt-4">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase font-mono">Freight Detail Block</div>
                      <div className="flex justify-between font-bold text-slate-800 text-xs">
                        <span>{showDispatchModal.pickup} &rarr; {showDispatchModal.delivery}</span>
                        <span className="text-blue-600">${showDispatchModal.amount.toLocaleString()}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {showDispatchModal.miles} miles &bull; {showDispatchModal.equipment} equipment format &bull; Pickup date {showDispatchModal.pickupDate}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Active Driver / Truck</label>
                        <select
                          required
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                          value={dispatchDriverId}
                          onChange={e => setDispatchDriverId(e.target.value)}
                        >
                          <option value="">-- Choose Driver --</option>
                          {visibleDrivers.map(dr => (
                            <option key={dr.id} value={dr.id}>
                              {dr.name} &bull; Truck {dr.truckNum} ({dr.truckType})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Assign Dispatcher</label>
                          <select
                            required
                            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                            value={dispatchDispId}
                            onChange={e => setDispatchDispId(e.target.value)}
                          >
                            <option value="">-- Choose Dispatcher --</option>
                            {dispatchers.map(disp => (
                              <option key={disp.id} value={disp.id}>{disp.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Dispatch Fee %</label>
                          <input
                            type="number"
                            required
                            min="1"
                            max="50"
                            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                            value={dispatchFeePercent}
                            onChange={e => setDispatchFeePercent(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowDispatchModal(null)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md"
                      >
                        Confirm Dispatch Order
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* DRIVER SETTLEMENTS & PENDING PAYMENTS SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Pending Payments Ledger */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-1.5 border-b border-slate-50 pb-2">
                <DollarSign className="h-4 text-emerald-600" />
                <span>Pending Payments &amp; Accounts Receivable</span>
              </h3>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Overdue Unpaid Runs:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{unpaidLoads.length} loads</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 font-mono">OUTSTANDING BALANCE</div>
                  <div className="text-lg font-extrabold text-red-600 font-mono mt-1">
                    ${pendingPaymentsAmount.toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => onNavigateTo('invoicer')}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-200/60 transition-colors cursor-pointer"
                >
                  Create Invoice
                </button>
              </div>
              <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                {unpaidLoads.slice(0, 3).map(load => (
                  <div key={load.id} className="flex justify-between items-center text-[11px] text-slate-600 p-1.5 hover:bg-slate-50/50 rounded-lg">
                    <span className="font-mono text-slate-800">Load #{load.loadNum}</span>
                    <span className="truncate max-w-[130px] text-slate-400">{load.broker}</span>
                    <span className="font-bold text-slate-900">${load.loadAmount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Driver Settlements Tracker */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-1.5 border-b border-slate-50 pb-2">
                <FileCheck className="h-4 text-purple-600" />
                <span>Driver Settlements Tracker</span>
              </h3>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Unpaid Settlements:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {driverSettlements.filter(s => s.paymentStatus === 'Unpaid').length} Pending
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 font-mono">TOTAL ACCUMULATED PAYOUT</div>
                  <div className="text-lg font-extrabold text-purple-600 font-mono mt-1">
                    ${totalDriverPayoutsVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <button
                  onClick={() => onNavigateTo('settlements')}
                  className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-bold rounded-lg border border-purple-200/60 transition-colors cursor-pointer"
                >
                  View Settlements
                </button>
              </div>
              <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                {driverSettlements.slice(0, 3).map(settlement => (
                  <div key={settlement.id} className="flex justify-between items-center text-[11px] text-slate-600 p-1.5 hover:bg-slate-50/50 rounded-lg">
                    <span className="font-medium text-slate-800">{settlement.driverName}</span>
                    <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${
                      settlement.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {settlement.paymentStatus}
                    </span>
                    <span className="font-bold text-slate-900">${settlement.netPayout.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* OPERATIONAL TASKS WORKLIST & COLLABORATIVE CHECKLIST */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-1.5">
                  <ListTodo className="h-4.5 w-4.5 text-blue-600" />
                  <span>Collaborative Dispatch Work Checklist &amp; Tasks</span>
                </h3>
                <p className="text-[11px] text-slate-500">Track operations, rate confirmations, broker checks, and compliance.</p>
              </div>
              <span className="text-xs font-semibold text-slate-400 font-mono bg-slate-100 px-2.5 py-0.5 rounded-full">
                {tasks.filter(t => !t.completed).length} Pending
              </span>
            </div>

            {/* Task Add Form */}
            <form onSubmit={handleAddTask} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter operational task (e.g., Audit Coyote Fuel Advance)..."
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
              />
              <select
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                value={newTaskPriority}
                onChange={e => setNewTaskPriority(e.target.value as any)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer shrink-0 shadow-sm"
              >
                <Plus className="h-3 w-3" />
                <span>Add</span>
              </button>
            </form>

            {/* Tasks list */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-3 border rounded-2xl transition-all ${
                    task.completed
                      ? 'bg-slate-50/50 border-slate-150 opacity-60'
                      : 'bg-white border-slate-200/80 hover:border-slate-350'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <button
                      type="button"
                      onClick={() => toggleTask(task.id)}
                      className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer shrink-0"
                    >
                      {task.completed ? (
                        <CheckSquare className="h-4.5 w-4.5 text-blue-600" />
                      ) : (
                        <Square className="h-4.5 w-4.5" />
                      )}
                    </button>
                    <span className={`text-xs text-slate-750 truncate ${task.completed ? 'line-through text-slate-400' : 'font-medium text-slate-800'}`}>
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded-md ${
                      task.priority === 'HIGH'
                        ? 'bg-red-50 text-red-700 border border-red-150'
                        : task.priority === 'MEDIUM'
                        ? 'bg-amber-50 text-amber-700 border border-amber-150'
                        : 'bg-slate-50 text-slate-600 border border-slate-150'
                    }`}>
                      {task.priority}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteTask(task.id)}
                      className="p-1 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-50 border border-dashed rounded-2xl border-slate-200">
                  No active operational tasks found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DYNAMIC ATTENDANCE, SYSTEM NOTIFICATIONS & KPI MATRIX */}
        <div className="space-y-6">

          {/* DAILY DISPATCH GOAL PROGRESS WIDGET */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-1.5">
                <Target className="h-4.5 w-4.5 text-blue-600 animate-pulse" />
                <span>Daily Dispatch Goal</span>
              </h3>
              <span className="text-[9px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold font-mono tracking-wider">
                TODAY
              </span>
            </div>

            <div className="flex items-center gap-5">
              <div className="relative flex-shrink-0">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    className="stroke-slate-100"
                    strokeWidth="7"
                    fill="transparent"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    className={`transition-all duration-700 ease-out ${
                      todayLoads.length >= dailyGoal
                        ? 'stroke-emerald-500'
                        : todayLoads.length >= dailyGoal / 2
                        ? 'stroke-blue-500'
                        : 'stroke-amber-500'
                    }`}
                    strokeWidth="7"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${
                      2 * Math.PI * 34 - (Math.min(todayLoads.length, dailyGoal) / dailyGoal) * (2 * Math.PI * 34)
                    }`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm font-extrabold text-slate-800 font-mono">
                    {Math.round((todayLoads.length / dailyGoal) * 100)}%
                  </span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">booked</span>
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-500">Today's Actual:</span>
                  <span className="text-xs font-extrabold text-slate-800 font-mono">
                    {todayLoads.length} {todayLoads.length === 1 ? 'load' : 'loads'}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs text-slate-500">Target Goal:</span>
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 rounded-lg p-0.5">
                    <button
                      onClick={() => handleSetGoal(dailyGoal - 1)}
                      disabled={dailyGoal <= 1}
                      className="p-1 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent rounded text-slate-600 transition-colors cursor-pointer"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-2 text-xs font-bold font-mono text-slate-800 min-w-[20px] text-center">
                      {dailyGoal}
                    </span>
                    <button
                      onClick={() => handleSetGoal(dailyGoal + 1)}
                      disabled={dailyGoal >= 50}
                      className="p-1 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent rounded text-slate-600 transition-colors cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 font-medium">
                  {todayLoads.length >= dailyGoal ? (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <Award className="h-3.5 w-3.5 animate-bounce" /> Daily target met! Exceptional!
                    </span>
                  ) : (
                    <span>
                      Need <strong className="text-blue-600 font-mono">{dailyGoal - todayLoads.length}</strong> more to reach goal
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* DYNAMIC COMPREHENSIVE KPIs MODULE */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-1.5">
                <TrendingUp className="h-4.5 w-4.5 text-blue-600" />
                <span>Performance KPI Indicators</span>
              </h3>
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() => setActiveKpiTab('WEEKLY')}
                  className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                    activeKpiTab === 'WEEKLY' ? 'bg-white text-slate-900 shadow-sm font-extrabold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setActiveKpiTab('MONTHLY')}
                  className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                    activeKpiTab === 'MONTHLY' ? 'bg-white text-slate-900 shadow-sm font-extrabold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>

            {activeKpiTab === 'WEEKLY' ? (
              <div className="space-y-3.5">
                {/* RPM */}
                <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase font-mono">Avg Rate per Mile</div>
                    <div className="text-base font-bold text-slate-800 mt-0.5">$2.85/mi</div>
                  </div>
                  <span className="p-1 text-[9px] bg-emerald-50 text-emerald-700 font-bold rounded-md font-mono flex items-center gap-0.5">
                    <TrendingUp className="h-3 w-3" />
                    <span>+2.4%</span>
                  </span>
                </div>

                {/* Average Load size */}
                <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase font-mono">Average Load Value</div>
                    <div className="text-base font-bold text-slate-800 mt-0.5">
                      ${weeklyLoads.length ? (revenueWeekly / weeklyLoads.length).toFixed(0) : '2,450'}
                    </div>
                  </div>
                  <span className="p-1 text-[9px] bg-blue-50 text-blue-700 font-bold rounded-md font-mono flex items-center gap-0.5">
                    <ArrowUpRight className="h-3 w-3" />
                    <span>Avg size</span>
                  </span>
                </div>

                {/* Dispatcher Efficiency */}
                <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase font-mono">Loads/Dispatcher Ratio</div>
                    <div className="text-base font-bold text-slate-800 mt-0.5">
                      {(weeklyLoads.length / (dispatchers.length || 1)).toFixed(1)} run average
                    </div>
                  </div>
                  <span className="p-1 text-[9px] bg-purple-50 text-purple-700 font-bold rounded-md font-mono">
                    Efficient
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                {/* Monthly Revenue target */}
                <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase font-mono">Target Month Revenue</div>
                    <div className="text-base font-bold text-slate-800 mt-0.5">$150,000.00</div>
                  </div>
                  <span className="p-1 text-[9px] bg-amber-50 text-amber-700 font-bold rounded-md font-mono">
                    {Math.round((revenueMonthly / 150000) * 100)}% met
                  </span>
                </div>

                {/* Active Trucks Ratio */}
                <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase font-mono">Fleet Utilization Rate</div>
                    <div className="text-base font-bold text-slate-800 mt-0.5">
                      {((activeDriversCount / (visibleDrivers.length || 1)) * 100).toFixed(0)}% Utilized
                    </div>
                  </div>
                  <span className="p-1 text-[9px] bg-emerald-50 text-emerald-700 font-bold rounded-md font-mono">
                    High
                  </span>
                </div>

                {/* Factored load usage */}
                <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase font-mono">Factoring Flow Rate</div>
                    <div className="text-base font-bold text-slate-800 mt-0.5">
                      {((visibleLoads.filter(l => l.factoringStatus === 'Factored').length / (visibleLoads.length || 1)) * 100).toFixed(0)}% factored
                    </div>
                  </div>
                  <span className="p-1 text-[9px] bg-slate-100 text-slate-600 font-bold rounded-md font-mono">
                    Liquid cash
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* DYNAMIC SMART OPERATIONAL NOTIFICATIONS & ALERTS */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-1.5">
                <Bell className="h-4.5 w-4.5 text-amber-500" />
                <span>Live Operational Alerts &amp; Notifications</span>
              </h3>
              <span className="text-[10px] bg-amber-50 text-amber-700 font-bold font-mono px-2 py-0.5 rounded-full">
                {smartNotifications.length} alerts
              </span>
            </div>

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {smartNotifications.map((noti, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border text-xs space-y-1 transition-all ${
                    noti.type === 'CRITICAL'
                      ? 'bg-red-50/60 border-red-200/80 text-red-900'
                      : noti.type === 'WARNING'
                      ? 'bg-amber-50/60 border-amber-200/80 text-amber-900'
                      : 'bg-slate-50/60 border-slate-200/80 text-slate-800'
                  }`}
                >
                  <div className="flex justify-between font-bold text-slate-900 font-sans">
                    <span className="flex items-center gap-1">
                      <AlertCircle className={`h-3.5 w-3.5 ${noti.type === 'CRITICAL' ? 'text-red-600 animate-pulse' : 'text-amber-600'}`} />
                      {noti.title}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">{noti.source}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{noti.desc}</p>
                </div>
              ))}
              {smartNotifications.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No active operational alerts flagged.
                </div>
              )}
            </div>
          </div>

          {/* REAL-TIME OPERATIONS ACTIVITY STREAM FEED */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-1.5 border-b border-slate-50 pb-2">
              <Activity className="h-4.5 w-4.5 text-blue-500 animate-pulse" />
              <span>Streaming System Activity Log</span>
            </h3>

            <div className="space-y-4 max-h-[240px] overflow-y-auto pr-1">
              {recentActivitiesList.map((act, idx) => {
                const IconComp = act.icon;
                return (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <span className={`p-1.5 rounded-lg ${act.color} shrink-0 mt-0.5`}>
                      <IconComp className="h-3.5 w-3.5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 truncate">{act.user}</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{act.text}</p>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono font-bold shrink-0">{act.time}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Management Quick Access Ports */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 font-display">
              Operational Port Access Points
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigateTo('loads')}
                className="p-3 text-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer text-xs font-semibold text-slate-700 hover:text-slate-900"
              >
                Book Load
              </button>
              <button
                onClick={() => onNavigateTo('invoicer')}
                className="p-3 text-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer text-xs font-semibold text-slate-700 hover:text-slate-900"
              >
                Create Invoice
              </button>
              <button
                onClick={() => onNavigateTo('drivers')}
                className="p-3 text-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer text-xs font-semibold text-slate-700 hover:text-slate-900"
              >
                Drivers List
              </button>
              <button
                onClick={() => onNavigateTo('reports')}
                className="p-3 text-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer text-xs font-semibold text-slate-700 hover:text-slate-900"
              >
                Full Reports
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ================= SECTION 5: NATIONAL FLEET GEOGRAPHIC GPS TRACKER WIDGET ================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-1.8">
            <Globe className="h-4.5 w-4.5 text-blue-600 animate-pulse" />
            <span>National Logistics Fleet Geographic GPS Radar Map</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Real-time visual map overlay showing coordinates, origin/destination pins, and active transit paths of active freight shipments.
          </p>
        </div>
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-inner">
          <FleetMapWidget loads={visibleLoads} drivers={visibleDrivers} />
        </div>
      </div>

    </div>
  );
}
