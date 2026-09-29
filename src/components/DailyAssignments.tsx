/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Driver, Dispatcher, User, DriverDailyPosting, DriverPostingStatus, Load } from '../types';
import { AuditInfoBadge } from './AuditInfoBadge';
import { 
  Users, 
  UserCheck, 
  ArrowRight, 
  Search, 
  TrendingUp, 
  Calendar, 
  ClipboardCheck, 
  FileText, 
  ShieldAlert, 
  Info, 
  Activity, 
  Truck, 
  Phone,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  MapPin,
  Compass,
  AlertCircle,
  Sparkles,
  Sliders,
  Filter,
  Check,
  X,
  RefreshCw,
  Eye,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  ChevronDown,
  Building2
} from 'lucide-react';

interface DailyAssignmentsProps {
  currentUser: User;
  drivers: Driver[];
  dispatchers: Dispatcher[];
  loads?: Load[];
  driverPostings?: DriverDailyPosting[];
  onAssignDriver: (driverId: string, dispatcherId: string) => Promise<void>;
  onEditDriver?: (id: string, updated: Partial<Driver>) => Promise<void> | void;
  onAddDriverPosting?: (posting: Omit<DriverDailyPosting, 'id' | 'updatedAt'>) => Promise<any> | void;
  onEditDriverPosting?: (id: string, updated: Partial<DriverDailyPosting>) => Promise<void> | void;
  onDeleteDriverPosting?: (id: string) => Promise<void> | void;
  onQuickSetPostingStatus?: (id: string, status: DriverPostingStatus, currentLoadNum?: string) => Promise<void> | void;
}

export default function DailyAssignments({
  currentUser,
  drivers,
  dispatchers,
  loads = [],
  driverPostings = [],
  onAssignDriver,
  onEditDriver,
  onAddDriverPosting,
  onEditDriverPosting,
  onDeleteDriverPosting,
  onQuickSetPostingStatus
}: DailyAssignmentsProps) {
  const isAdmin = currentUser.role === 'ADMIN';
  const isManager = currentUser.role === 'MANAGER';

  // Sub-category Navigation
  const [activeSubTab, setActiveSubTab] = useState<'postings' | 'matrix' | 'driver_editor'>('postings');

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | DriverPostingStatus>('ALL');
  const [routeTypeFilter, setRouteTypeFilter] = useState<'ALL' | 'OTR' | 'LOCAL' | 'REGIONAL' | 'DEDICATED'>('ALL');
  const [viewScope, setViewScope] = useState<'ALL' | 'MY_DRIVERS'>(isAdmin ? 'ALL' : 'MY_DRIVERS');

  // Admin Pairing state
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedDispatcherId, setSelectedDispatcherId] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Daily Directions / Notes
  const [notes, setNotes] = useState<{ [key: string]: string }>(() => {
    try {
      const saved = localStorage.getItem('dispatch_daily_assignment_notes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Modal State for Posting Create / Edit
  const [isPostingModalOpen, setIsPostingModalOpen] = useState(false);
  const [editingPosting, setEditingPosting] = useState<DriverDailyPosting | null>(null);
  const [deletedPostingIds, setDeletedPostingIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('timely_deleted_driver_posting_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Posting Form State
  const [formDriverId, setFormDriverId] = useState('');
  const [formOrigin, setFormOrigin] = useState('');
  const [formDestination, setFormDestination] = useState('Anywhere / Open');
  const [formEmptyLocation, setFormEmptyLocation] = useState('');
  const [formEmptyDate, setFormEmptyDate] = useState(new Date().toISOString().split('T')[0]);
  const [formEmptyTime, setFormEmptyTime] = useState('08:00 AM');
  const [formRouteType, setRouteType] = useState<'OTR' | 'LOCAL' | 'REGIONAL' | 'DEDICATED'>('OTR');
  const [formStatus, setFormStatus] = useState<DriverPostingStatus>('NEEDS_LOAD');
  const [formCapacityStatus, setFormCapacityStatus] = useState<'EMPTY' | 'PARTIAL' | 'BOOKED'>('EMPTY');
  const [formDispatcherAction, setFormDispatcherAction] = useState<'ASSIGNED' | 'ACCEPTED' | 'NONE'>('NONE');
  const [formAssignedTime, setFormAssignedTime] = useState('');
  const [formAssignedBy, setFormAssignedBy] = useState('');
  const [formAcceptedTime, setFormAcceptedTime] = useState('');
  const [formAcceptedBy, setFormAcceptedBy] = useState('');
  const [formMaxWeight, setFormMaxWeight] = useState<number>(9500);
  const [formMaxPallets, setFormMaxPallets] = useState<number>(12);
  const [formCurrentLoadNum, setFormCurrentLoadNum] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Driver Quick Edit Modal State
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [driverEditName, setDriverEditName] = useState('');
  const [driverEditPhone, setDriverEditPhone] = useState('');
  const [driverEditTruckNum, setDriverEditTruckNum] = useState('');
  const [driverEditTruckType, setDriverEditTruckType] = useState('');
  const [driverEditPayoutRate, setDriverEditPayoutRate] = useState<number>(88);
  const [driverEditWorkingUnder, setDriverEditWorkingUnder] = useState('');
  const [driverEditStatus, setDriverEditStatus] = useState<'ACTIVE' | 'INACTIVE' | 'TERMINATED'>('ACTIVE');
  const [driverEditNotes, setDriverEditNotes] = useState('');

  // Find user's dispatcher ID
  const myDispatcherId = useMemo(() => {
    const disp = dispatchers.find(d => 
      (d.username && d.username.toLowerCase() === currentUser.username.toLowerCase()) ||
      (d.name && d.name.toLowerCase() === currentUser.name.toLowerCase()) ||
      d.id === currentUser.id
    );
    return disp ? disp.id : currentUser.id;
  }, [dispatchers, currentUser]);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleSaveNote = (dispId: string, text: string) => {
    const updated = { ...notes, [dispId]: text };
    setNotes(updated);
    try {
      localStorage.setItem('dispatch_daily_assignment_notes', JSON.stringify(updated));
    } catch (e) {
      console.warn("Could not save daily assignment notes to local storage", e);
    }
    showNotification('Daily instructions updated!');
  };

  const handleQuickReassign = async (drvId: string, dispId: string) => {
    if (!drvId || !dispId) return;
    await onAssignDriver(drvId, dispId);
    showNotification('Driver assignment updated successfully!');
  };

  // Open Posting Modal
  const openNewPostingModal = (presetDriverId?: string) => {
    const drv = drivers.find(d => d.id === presetDriverId) || drivers[0];
    setEditingPosting(null);
    setFormDriverId(drv ? drv.id : '');
    setFormOrigin(drv?.currentLocation || '');
    setFormDestination('Anywhere / Open');
    setFormEmptyLocation(drv?.currentLocation || '');
    setFormEmptyDate(new Date().toISOString().split('T')[0]);
    setFormEmptyTime('08:00 AM');
    setRouteType('OTR');
    setFormStatus('NEEDS_LOAD');
    setFormCapacityStatus('EMPTY');
    setFormDispatcherAction('NONE');
    setFormAssignedTime('');
    setFormAssignedBy('');
    setFormAcceptedTime('');
    setFormAcceptedBy('');
    setFormMaxWeight(Number(drv?.maxWeight) || 9500);
    setFormMaxPallets(drv?.maxPallets || 12);
    setFormCurrentLoadNum('');
    setFormNotes('');
    setIsPostingModalOpen(true);
  };

  const openEditPostingModal = (posting: DriverDailyPosting) => {
    setEditingPosting(posting);
    setFormDriverId(posting.driverId);
    setFormOrigin(posting.origin || '');
    setFormDestination(posting.destinationPreference || 'Anywhere / Open');
    setFormEmptyLocation(posting.emptyLocation || '');
    setFormEmptyDate(posting.emptyDate || new Date().toISOString().split('T')[0]);
    setFormEmptyTime(posting.emptyTime || '08:00 AM');
    setRouteType(posting.routeType || 'OTR');
    setFormStatus(posting.status);
    setFormCapacityStatus(posting.capacityStatus || (posting.status === 'BOOKED' ? 'BOOKED' : posting.status === 'PARTIAL' ? 'PARTIAL' : 'EMPTY'));
    setFormDispatcherAction(posting.dispatcherAction || (posting.status === 'ASSIGNED' ? 'ASSIGNED' : posting.status === 'ACCEPTED' ? 'ACCEPTED' : 'NONE'));
    setFormAssignedTime(posting.assignedTime || '');
    setFormAssignedBy(posting.assignedBy || '');
    setFormAcceptedTime(posting.acceptedTime || '');
    setFormAcceptedBy(posting.acceptedBy || '');
    setFormMaxWeight(Number(posting.maxWeight) || 9500);
    setFormMaxPallets(posting.maxPallets || 12);
    setFormCurrentLoadNum(posting.currentLoadNum || '');
    setFormNotes(posting.notes || '');
    setIsPostingModalOpen(true);
  };

  const handleSavePosting = async (e: React.FormEvent) => {
    e.preventDefault();
    const drv = drivers.find(d => d.id === formDriverId);
    const disp = dispatchers.find(d => d.id === (drv?.assignedDispatcherId || myDispatcherId));

    const legacyStatus: DriverPostingStatus = 
      formCapacityStatus === 'BOOKED' ? 'BOOKED' :
      formCapacityStatus === 'PARTIAL' ? 'PARTIAL' :
      'NEEDS_LOAD';

    const payload: Partial<DriverDailyPosting> = {
      driverId: formDriverId,
      driverName: drv?.name || 'Driver',
      driverPhone: drv?.phone || '',
      truckNum: drv?.truckNum || 'T-100',
      truckType: drv?.truckType || '26ft Box Truck',
      assignedDispatcherId: drv?.assignedDispatcherId || myDispatcherId,
      assignedDispatcherName: disp?.name || currentUser.name,
      origin: formOrigin,
      destinationPreference: formDestination,
      emptyLocation: formEmptyLocation,
      emptyDate: formEmptyDate,
      emptyTime: formEmptyTime,
      routeType: formRouteType,
      status: legacyStatus,
      capacityStatus: formCapacityStatus,
      dispatcherAction: formDispatcherAction,
      assignedTime: formAssignedTime.trim() || undefined,
      assignedBy: formAssignedBy.trim() || undefined,
      acceptedTime: formAcceptedTime.trim() || undefined,
      acceptedBy: formAcceptedBy.trim() || undefined,
      maxWeight: Number(formMaxWeight),
      maxPallets: Number(formMaxPallets),
      currentLoadNum: formCapacityStatus === 'BOOKED' ? (formCurrentLoadNum || 'Assigned') : undefined,
      notes: formNotes
    };

    if (editingPosting && onEditDriverPosting) {
      await onEditDriverPosting(editingPosting.id, payload);
      showNotification(`Updated posting for ${payload.driverName}`);
    } else if (onAddDriverPosting) {
      await onAddDriverPosting(payload as any);
      showNotification(`Created new daily posting for ${payload.driverName}`);
    }

    setDeletedPostingIds(prev => {
      const updated = prev.filter(id => id !== formDriverId && id !== `virtual_${formDriverId}` && (!editingPosting || id !== editingPosting.id));
      try {
        localStorage.setItem('timely_deleted_driver_posting_ids', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setIsPostingModalOpen(false);
  };

  const handleSetCapacityStatus = async (post: DriverDailyPosting, status: 'EMPTY' | 'PARTIAL' | 'BOOKED') => {
    const legacyStatus: DriverPostingStatus = status === 'EMPTY' ? 'NEEDS_LOAD' : status;
    if (onEditDriverPosting) {
      await onEditDriverPosting(post.id, {
        capacityStatus: status,
        status: legacyStatus,
        currentLoadNum: status === 'BOOKED' ? (post.currentLoadNum || 'Assigned') : undefined
      });
    } else if (onQuickSetPostingStatus) {
      await onQuickSetPostingStatus(post.id, legacyStatus);
    }
    showNotification(`Driver status set to ${status}`);
  };

  const handleSetDispatcherAction = async (post: DriverDailyPosting, action: 'ASSIGNED' | 'ACCEPTED') => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString([], { month: 'short', day: 'numeric' });
    const userDisplayName = currentUser.name || currentUser.username || (action === 'ASSIGNED' ? 'Admin' : 'Dispatcher');
    
    const updates: Partial<DriverDailyPosting> = {
      dispatcherAction: action,
    };
    
    if (action === 'ASSIGNED') {
      updates.assignedTime = nowTime;
      updates.assignedBy = userDisplayName;
    } else if (action === 'ACCEPTED') {
      updates.acceptedTime = nowTime;
      updates.acceptedBy = userDisplayName;
    }
    
    if (onEditDriverPosting) {
      await onEditDriverPosting(post.id, updates);
    } else if (onQuickSetPostingStatus) {
      await onQuickSetPostingStatus(post.id, action as any);
    }
    showNotification(`Dispatcher action set to ${action} by ${userDisplayName}`);
  };

  // Open Driver Quick Edit Modal
  const openDriverEditModal = (driver: Driver) => {
    setEditingDriver(driver);
    setDriverEditName(driver.name);
    setDriverEditPhone(driver.phone);
    setDriverEditTruckNum(driver.truckNum);
    setDriverEditTruckType(driver.truckType);
    setDriverEditPayoutRate(driver.driverPayoutPercent || 88);
    setDriverEditWorkingUnder(driver.workingUnderName || '');
    setDriverEditStatus(driver.status);
    setDriverEditNotes(driver.notes || '');
  };

  const handleSaveDriverEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDriver || !onEditDriver) return;

    await onEditDriver(editingDriver.id, {
      name: driverEditName.trim(),
      phone: driverEditPhone.trim(),
      truckNum: driverEditTruckNum.trim(),
      truckType: driverEditTruckType.trim(),
      driverPayoutPercent: Number(driverEditPayoutRate),
      workingUnderName: driverEditWorkingUnder.trim(),
      status: driverEditStatus,
      notes: driverEditNotes.trim()
    });

    showNotification(`Driver ${driverEditName} updated successfully!`);
    setEditingDriver(null);
  };

  const handleDeletePosting = async (id: string) => {
    setDeletedPostingIds(prev => {
      const updated = [...new Set([...prev, id])];
      try {
        localStorage.setItem('timely_deleted_driver_posting_ids', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (onDeleteDriverPosting) {
      await onDeleteDriverPosting(id);
    }
    showNotification("Driver posting deleted successfully");
  };

  const handleQuickStatus = async (post: DriverDailyPosting, status: DriverPostingStatus) => {
    if (onQuickSetPostingStatus) {
      setDeletedPostingIds(prev => {
        const updated = prev.filter(pId => pId !== post.id && pId !== post.driverId && pId !== `virtual_${post.driverId}`);
        try {
          localStorage.setItem('timely_deleted_driver_posting_ids', JSON.stringify(updated));
        } catch {}
        return updated;
      });
      await onQuickSetPostingStatus(post.id, status);
      showNotification(`Driver status set to ${status.replace('_', ' ')}`);
    }
  };

  // Build combined driver posting records (Every active driver gets a record if not already in postings or deleted)
  const combinedPostings = useMemo(() => {
    const list: DriverDailyPosting[] = (driverPostings || []).filter(p => !deletedPostingIds.includes(p.id) && !deletedPostingIds.includes(p.driverId));

    drivers.forEach(drv => {
      const exists = (driverPostings || []).some(p => p.driverId === drv.id);
      const isDeleted = deletedPostingIds.includes(`virtual_${drv.id}`) || deletedPostingIds.includes(drv.id);
      if (!exists && !isDeleted) {
        const disp = dispatchers.find(d => d.id === drv.assignedDispatcherId);
        // Find if driver has an active non-delivered load
        const activeLoad = loads.find(l => l.driverId === drv.id && l.status !== 'Delivered' && (l.status as string) !== 'DELIVERED' && (l.status as string) !== 'PAID');
        
        list.push({
          id: `virtual_${drv.id}`,
          driverId: drv.id,
          driverName: drv.name,
          driverPhone: drv.phone,
          truckNum: drv.truckNum,
          truckType: drv.truckType,
          assignedDispatcherId: drv.assignedDispatcherId,
          assignedDispatcherName: disp?.name || 'Unassigned',
          origin: drv.currentLocation || 'Market Base',
          destinationPreference: 'Anywhere / Open',
          emptyLocation: drv.currentLocation || 'Available Now',
          emptyDate: new Date().toISOString().split('T')[0],
          emptyTime: '08:00 AM',
          routeType: 'OTR',
          status: activeLoad ? 'BOOKED' : 'NEEDS_LOAD',
          currentLoadNum: activeLoad?.loadNum,
          currentLoadId: activeLoad?.id,
          maxWeight: drv.maxWeight || 9500,
          maxPallets: drv.maxPallets || 12,
          notes: drv.notes || '',
          updatedAt: new Date().toISOString()
        });
      }
    });

    return list;
  }, [driverPostings, drivers, dispatchers, loads, deletedPostingIds]);

  // Filtered driver postings
  const filteredPostings = useMemo(() => {
    return combinedPostings.filter(post => {
      // Visibility Filter (Admins see all; Dispatchers see their assigned drivers or can toggle)
      if (viewScope === 'MY_DRIVERS' && !isAdmin) {
        const assignedToMe = post.assignedDispatcherId === myDispatcherId || post.assignedDispatcherId === currentUser.id;
        const matchingDriver = drivers.find(d => d.id === post.driverId && d.assignedDispatcherId === myDispatcherId);
        if (!assignedToMe && !matchingDriver) return false;
      }

      // Status Filter
      if (statusFilter !== 'ALL' && post.status !== statusFilter) return false;

      // Route Type Filter
      if (routeTypeFilter !== 'ALL' && post.routeType !== routeTypeFilter) return false;

      // Search Filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match = 
          post.driverName.toLowerCase().includes(q) ||
          post.truckNum.toLowerCase().includes(q) ||
          post.truckType.toLowerCase().includes(q) ||
          (post.origin && post.origin.toLowerCase().includes(q)) ||
          (post.emptyLocation && post.emptyLocation.toLowerCase().includes(q)) ||
          (post.destinationPreference && post.destinationPreference.toLowerCase().includes(q)) ||
          (post.assignedDispatcherName && post.assignedDispatcherName.toLowerCase().includes(q)) ||
          (post.currentLoadNum && post.currentLoadNum.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [combinedPostings, viewScope, isAdmin, myDispatcherId, currentUser, statusFilter, routeTypeFilter, searchTerm, drivers]);

  // Stats Summary
  const stats = useMemo(() => {
    const total = combinedPostings.length;
    const needsLoad = combinedPostings.filter(p => p.status === 'NEEDS_LOAD').length;
    const booked = combinedPostings.filter(p => p.status === 'BOOKED').length;
    const partial = combinedPostings.filter(p => p.status === 'PARTIAL').length;
    const accepted = combinedPostings.filter(p => p.status === 'ACCEPTED').length;
    const assigned = combinedPostings.filter(p => p.status === 'ASSIGNED').length;
    return { total, needsLoad, booked, partial, accepted, assigned };
  }, [combinedPostings]);

  return (
    <div id="daily_assignments_master" className="space-y-6 font-sans">
      
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
              <Calendar className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 font-display">
                Daily Operations &amp; Driver Capacity Matrix
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time driver posting updates, availability color-coding, load routing, and dispatcher fleet alignment.
              </p>
            </div>
          </div>
        </div>

        {/* Global Live Summary Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-1.5 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
            <span>Needs Load: <strong>{stats.needsLoad}</strong></span>
          </div>
          <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-700 flex items-center gap-1.5 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            <span>Partial: <strong>{stats.partial}</strong></span>
          </div>
          <div className="px-3 py-1.5 bg-sky-50 border border-sky-200 rounded-xl text-xs font-bold text-sky-700 flex items-center gap-1.5 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-sky-500"></span>
            <span>Accepted: <strong>{stats.accepted}</strong></span>
          </div>
          <div className="px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-xl text-xs font-bold text-purple-700 flex items-center gap-1.5 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-purple-500"></span>
            <span>Assigned: <strong>{stats.assigned}</strong></span>
          </div>
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 flex items-center gap-1.5 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>Booked: <strong>{stats.booked}</strong></span>
          </div>
        </div>
      </div>

      {/* Sub-Category Navigation Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('postings')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all flex items-center gap-2 border ${
              activeSubTab === 'postings'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>Driver Daily Postings &amp; Live Status</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 font-mono">
              {filteredPostings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('matrix')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all flex items-center gap-2 border ${
              activeSubTab === 'matrix'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Dispatcher-Driver Fleet Matrix</span>
          </button>

          <button
            onClick={() => setActiveSubTab('driver_editor')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all flex items-center gap-2 border ${
              activeSubTab === 'driver_editor'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Edit2 className="h-4 w-4" />
            <span>Driver Info Quick Editor</span>
          </button>
        </div>

        {activeSubTab === 'postings' && (
          <button
            onClick={() => openNewPostingModal()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Post New Driver Status</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-CATEGORY 1: DRIVER DAILY POSTING & LIVE AVAILABILITY TICKETS/BANNERS */}
      {/* ========================================================================= */}
      {activeSubTab === 'postings' && (
        <div className="space-y-5">
          
          {/* Controls Bar: Filters & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            
            {/* Left: Scope Toggle & Status Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Dashboard Scope Toggle (Admin can see Everyone in single dashboard; Dispatchers see their own) */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setViewScope('MY_DRIVERS')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewScope === 'MY_DRIVERS'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  My Assigned Drivers
                </button>
                <button
                  onClick={() => setViewScope('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    viewScope === 'ALL'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span>All Drivers (Global)</span>
                  {isAdmin && <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-extrabold">ADMIN</span>}
                </button>
              </div>

              {/* Status Filter Chips */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'ALL' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({combinedPostings.length})
                </button>
                <button
                  onClick={() => setStatusFilter('NEEDS_LOAD')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                    statusFilter === 'NEEDS_LOAD' ? 'bg-red-600 text-white shadow-sm' : 'text-red-700 hover:bg-red-100'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-red-500 inline-block"></span>
                  <span>Need Load ({stats.needsLoad})</span>
                </button>
                <button
                  onClick={() => setStatusFilter('PARTIAL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                    statusFilter === 'PARTIAL' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-amber-500 inline-block"></span>
                  <span>Partial ({stats.partial})</span>
                </button>
                <button
                  onClick={() => setStatusFilter('ACCEPTED')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                    statusFilter === 'ACCEPTED' ? 'bg-sky-600 text-white shadow-sm' : 'text-sky-700 hover:bg-sky-100'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-sky-500 inline-block"></span>
                  <span>Accepted ({stats.accepted})</span>
                </button>
                <button
                  onClick={() => setStatusFilter('ASSIGNED')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                    statusFilter === 'ASSIGNED' ? 'bg-purple-600 text-white shadow-sm' : 'text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-purple-500 inline-block"></span>
                  <span>Assigned ({stats.assigned})</span>
                </button>
                <button
                  onClick={() => setStatusFilter('BOOKED')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                    statusFilter === 'BOOKED' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
                  <span>Booked ({stats.booked})</span>
                </button>
              </div>

              {/* Route Type Filter */}
              <select
                className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold px-3 py-1.5 text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                value={routeTypeFilter}
                onChange={e => setRouteTypeFilter(e.target.value as any)}
              >
                <option value="ALL">All Route Types</option>
                <option value="OTR">OTR (Over The Road)</option>
                <option value="LOCAL">Local Only</option>
                <option value="REGIONAL">Regional</option>
                <option value="DEDICATED">Dedicated Lane</option>
              </select>

            </div>

            {/* Right: Search Input */}
            <div className="relative w-full lg:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search driver, truck, city, load#..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

          </div>

          {/* DRIVER POSTING ROW / TICKET BANNERS */}
          <div className="space-y-3">
            {filteredPostings.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
                <Compass className="h-10 w-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">No driver postings match your criteria</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Try adjusting your search query, status filters, or create a new daily posting for your active fleet.
                </p>
                <button
                  onClick={() => openNewPostingModal()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Driver Posting</span>
                </button>
              </div>
            ) : (
              filteredPostings.map(post => {
                const isNeedLoad = post.status === 'NEEDS_LOAD';
                const isBooked = post.status === 'BOOKED';
                const isPartial = post.status === 'PARTIAL';
                const isAccepted = post.status === 'ACCEPTED';
                const isAssigned = post.status === 'ASSIGNED';

                // Row/Ticket border & background styling based on exact specification
                const bannerCardStyle = isBooked
                  ? 'bg-gradient-to-r from-emerald-50/90 via-emerald-50/40 to-white border-l-4 border-l-emerald-500 border-t border-r border-b border-emerald-200/80 shadow-sm hover:shadow-md'
                  : isAccepted
                  ? 'bg-gradient-to-r from-sky-50/90 via-sky-50/40 to-white border-l-4 border-l-sky-500 border-t border-r border-b border-sky-200/80 shadow-sm hover:shadow-md'
                  : isAssigned
                  ? 'bg-gradient-to-r from-purple-50/90 via-purple-50/40 to-white border-l-4 border-l-purple-500 border-t border-r border-b border-purple-200/80 shadow-sm hover:shadow-md'
                  : isNeedLoad
                  ? 'bg-gradient-to-r from-red-50/90 via-red-50/40 to-white border-l-4 border-l-red-500 border-t border-r border-b border-red-200/80 shadow-sm hover:shadow-md'
                  : 'bg-gradient-to-r from-amber-50/90 via-amber-50/40 to-white border-l-4 border-l-amber-500 border-t border-r border-b border-amber-200/80 shadow-sm hover:shadow-md';

                const statusBadgeStyle = isBooked
                  ? 'bg-emerald-600 text-white font-extrabold shadow-sm'
                  : isAccepted
                  ? 'bg-sky-600 text-white font-extrabold shadow-sm'
                  : isAssigned
                  ? 'bg-purple-600 text-white font-extrabold shadow-sm'
                  : isNeedLoad
                  ? 'bg-red-600 text-white font-extrabold shadow-sm animate-pulse'
                  : 'bg-amber-500 text-slate-950 font-extrabold shadow-sm';

                const statusLabel = isBooked
                  ? '✓ BOOKED'
                  : isAccepted
                  ? '⚡ ACCEPTED'
                  : isAssigned
                  ? '📌 ASSIGNED'
                  : isNeedLoad
                  ? '⚠ NEEDS LOAD'
                  : '⚡ PARTIAL LOAD';

                const driverObj = drivers.find(d => d.id === post.driverId);

                return (
                  <div
                    key={post.id}
                    className={`p-4 md:p-5 rounded-2xl transition-all duration-200 ${bannerCardStyle}`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      
                      {/* Left: Driver Identity, Equipment, & Status Tag */}
                      <div className="flex items-start gap-3.5 min-w-[260px]">
                        <div className={`p-3 rounded-2xl shrink-0 ${
                          isBooked ? 'bg-emerald-100 text-emerald-800' : isAccepted ? 'bg-sky-100 text-sky-800' : isAssigned ? 'bg-purple-100 text-purple-800' : isNeedLoad ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'
                        }`}>
                          <Truck className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-extrabold text-slate-900">{post.driverName}</h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] uppercase font-mono tracking-wider ${statusBadgeStyle}`}>
                              {statusLabel}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-slate-800 text-white font-mono">
                              {post.routeType || 'OTR'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-slate-600 font-mono mt-1 flex-wrap">
                            <span>Truck #{post.truckNum}</span>
                            <span>&bull;</span>
                            <span>{post.truckType}</span>
                            <span>&bull;</span>
                            <span className="text-slate-500 font-sans">Dispatcher: <strong className="text-slate-800">{post.assignedDispatcherName || 'Unassigned'}</strong></span>
                          </div>

                          {/* Quick Capacity Specs */}
                          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-600 flex-wrap">
                            <span className="bg-white/80 border border-slate-200 px-2 py-0.5 rounded-md font-medium">
                              Max: <strong>{post.maxWeight ? post.maxWeight.toLocaleString() : '9,500'} lbs</strong> / <strong>{post.maxPallets || 12} Plts</strong>
                            </span>
                            {driverObj?.hasLiftgate && (
                              <span className="bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                ⚡ Liftgate
                              </span>
                            )}
                            {driverObj?.hasPalletJack && (
                              <span className="bg-purple-100 text-purple-900 border border-purple-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                📦 Pallet Jack
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Middle: Route & Where / When Driver Gets Empty Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-white/80 p-3.5 rounded-xl border border-slate-200/80 flex-1">
                        
                        {/* Empty Details */}
                        <div>
                          <div className="flex items-center gap-1 text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider font-mono">
                            <MapPin className="h-3.5 w-3.5 text-rose-500" />
                            <span>Where / When Empty</span>
                          </div>
                          <div className="text-xs font-extrabold text-slate-900 mt-1 truncate" title={post.emptyLocation}>
                            {post.emptyLocation || post.origin || 'Location TBD'}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span>{post.emptyDate || 'Today'} @ {post.emptyTime || '08:00 AM'}</span>
                          </div>
                        </div>

                        {/* Destination Preference */}
                        <div>
                          <div className="flex items-center gap-1 text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider font-mono">
                            <Compass className="h-3.5 w-3.5 text-blue-500" />
                            <span>Looking For Load To</span>
                          </div>
                          <div className="text-xs font-bold text-blue-900 mt-1 truncate" title={post.destinationPreference}>
                            {post.destinationPreference || 'Anywhere / All Lanes'}
                          </div>
                          <div className="text-[10px] text-slate-500 uppercase font-mono mt-0.5">
                            Origin: {post.origin || 'Current Location'}
                          </div>
                        </div>

                        {/* Current Assigned Load or Notes */}
                        <div>
                          <div className="flex items-center gap-1 text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider font-mono">
                            <Activity className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Current Load Status</span>
                          </div>
                          {post.currentLoadNum ? (
                            <div className="text-xs font-mono font-bold text-emerald-800 mt-1 flex items-center gap-1">
                              <span>Load #{post.currentLoadNum}</span>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500 italic mt-1">
                              {post.notes || 'Ready for dispatch'}
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Right: Quick Action Buttons & Status Toggles */}
                      <div className="flex items-center gap-3 lg:flex-col lg:items-end justify-between lg:justify-center shrink-0">
                        
                        {/* 2 Buttons with Selectable Options: 1) Status (Empty, Partial, Booked) & 2) Dispatcher Action (Assigned, Accepted) */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* 1st Button: Status (Empty, Partial, Booked) */}
                          <div className="flex flex-col items-start">
                            <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                              Status
                            </span>
                            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                              <button
                                type="button"
                                onClick={() => handleSetCapacityStatus(post, 'EMPTY')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                                  (post.capacityStatus === 'EMPTY' || (!post.capacityStatus && (post.status === 'EMPTY' || post.status === 'NEEDS_LOAD')))
                                    ? 'bg-red-600 text-white shadow-xs font-extrabold'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-red-600'
                                }`}
                                title="Mark status as Empty"
                              >
                                <span className={`h-2 w-2 rounded-full ${
                                  (post.capacityStatus === 'EMPTY' || (!post.capacityStatus && (post.status === 'EMPTY' || post.status === 'NEEDS_LOAD'))) ? 'bg-white' : 'bg-red-500'
                                }`} />
                                <span>Empty</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSetCapacityStatus(post, 'PARTIAL')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                                  (post.capacityStatus === 'PARTIAL' || (!post.capacityStatus && post.status === 'PARTIAL'))
                                    ? 'bg-amber-500 text-slate-950 shadow-xs font-extrabold'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-amber-600'
                                }`}
                                title="Mark status as Partial"
                              >
                                <span className={`h-2 w-2 rounded-full ${
                                  (post.capacityStatus === 'PARTIAL' || (!post.capacityStatus && post.status === 'PARTIAL')) ? 'bg-slate-950' : 'bg-amber-500'
                                }`} />
                                <span>Partial</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSetCapacityStatus(post, 'BOOKED')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                                  (post.capacityStatus === 'BOOKED' || (!post.capacityStatus && post.status === 'BOOKED'))
                                    ? 'bg-emerald-600 text-white shadow-xs font-extrabold'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-emerald-600'
                                }`}
                                title="Mark status as Booked"
                              >
                                <span className={`h-2 w-2 rounded-full ${
                                  (post.capacityStatus === 'BOOKED' || (!post.capacityStatus && post.status === 'BOOKED')) ? 'bg-white' : 'bg-emerald-500'
                                }`} />
                                <span>Booked</span>
                              </button>
                            </div>
                          </div>

                          {/* 2nd Button: Dispatcher Action (Assigned, Accepted) */}
                          <div className="flex flex-col items-start">
                            <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                              Dispatcher Action
                            </span>
                            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                              <button
                                type="button"
                                onClick={() => handleSetDispatcherAction(post, 'ASSIGNED')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                                  post.dispatcherAction === 'ASSIGNED' || (!post.dispatcherAction && post.status === 'ASSIGNED')
                                    ? 'bg-purple-600 text-white shadow-xs font-extrabold'
                                    : 'text-purple-700 hover:bg-purple-50'
                                }`}
                                title="Set Dispatcher Action to Assigned"
                              >
                                <span>📌</span>
                                <span>Assigned</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSetDispatcherAction(post, 'ACCEPTED')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                                  post.dispatcherAction === 'ACCEPTED' || (!post.dispatcherAction && post.status === 'ACCEPTED')
                                    ? 'bg-sky-600 text-white shadow-xs font-extrabold'
                                    : 'text-sky-700 hover:bg-sky-50'
                                }`}
                                title="Set Dispatcher Action to Accepted"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Accepted</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Call / Edit / Driver Info Edit */}
                        <div className="flex items-center gap-1.5">
                          {post.driverPhone && (
                            <a
                              href={`tel:${post.driverPhone}`}
                              className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1"
                              title={`Call ${post.driverName}`}
                            >
                              <Phone className="h-3.5 w-3.5 text-emerald-600" />
                              <span className="hidden sm:inline">Call</span>
                            </a>
                          )}
                          
                          <button
                            onClick={() => openEditPostingModal(post)}
                            className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1"
                            title="Edit posting details"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Edit Posting</span>
                          </button>

                          {driverObj && (
                            <button
                              onClick={() => openDriverEditModal(driverObj)}
                              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1"
                              title="Edit assigned driver profile"
                            >
                              <Users className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Driver Info</span>
                            </button>
                          )}

                          {onDeleteDriverPosting && (
                            <button
                              onClick={() => handleDeletePosting(post.id)}
                              className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all cursor-pointer"
                              title="Delete posting ticket"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                      </div>

                    </div>

                    {/* Timestamps: Dispatcher Accepted Time & Admin Assigned Time */}
                    <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                      <div className="flex flex-wrap items-center gap-2">
                        {post.assignedTime ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-900 border border-purple-200 font-semibold shadow-2xs">
                            <Clock className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                            <span>Assigned Time: <strong>{post.assignedTime}</strong></span>
                            {post.assignedBy && (
                              <span className="text-purple-600 text-[10px] font-normal">by {post.assignedBy}</span>
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-400 border border-slate-200 text-[10px]">
                            <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>Assigned Time: Unrecorded</span>
                          </span>
                        )}

                        {post.acceptedTime ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-900 border border-sky-200 font-semibold shadow-2xs">
                            <CheckCircle2 className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                            <span>Accepted Time: <strong>{post.acceptedTime}</strong></span>
                            {post.acceptedBy && (
                              <span className="text-sky-600 text-[10px] font-normal">by {post.acceptedBy}</span>
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-400 border border-slate-200 text-[10px]">
                            <CheckCircle2 className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>Accepted Time: Pending Dispatcher</span>
                          </span>
                        )}
                      </div>

                      <AuditInfoBadge
                        createdBy={post.createdBy}
                        createdByName={post.createdByName}
                        createdAt={post.createdAt}
                        lastModifiedBy={post.lastModifiedBy}
                        lastModifiedByName={post.lastModifiedByName}
                        lastModifiedAt={post.lastModifiedAt || post.updatedAt}
                        compact={true}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-CATEGORY 2: DISPATCHER & DRIVER MATRIX ("WHO LOOKS AFTER WHOM")      */}
      {/* ========================================================================= */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-6">
          
          {/* Admin Panel: Live Fleet Reassignment Engine */}
          {isAdmin && (
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-amber-400 font-mono">
                  Admin Operations Center &bull; Live Driver Reassignment Engine
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
                    Select Active Driver
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    value={selectedDriverId}
                    onChange={e => setSelectedDriverId(e.target.value)}
                  >
                    <option value="">-- Choose Driver --</option>
                    {drivers.map(drv => {
                      const currentDisp = dispatchers.find(disp => disp.id === drv.assignedDispatcherId);
                      return (
                        <option key={drv.id} value={drv.id}>
                          {drv.name} (Truck #{drv.truckNum} - Currently: {currentDisp?.name || 'Unassigned'})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="flex justify-center pb-2.5">
                  <div className="p-2 bg-slate-800 rounded-full text-amber-500 border border-slate-700 shadow-inner hidden md:block">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
                    Assign To Dispatcher
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    value={selectedDispatcherId}
                    onChange={e => setSelectedDispatcherId(e.target.value)}
                  >
                    <option value="">-- Choose Dispatcher --</option>
                    {dispatchers.map(disp => (
                      <option key={disp.id} value={disp.id}>
                        {disp.name} ({disp.assignedDriverIds?.length || 0} active drivers)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={async () => {
                    if (!selectedDriverId || !selectedDispatcherId) return;
                    await handleQuickReassign(selectedDriverId, selectedDispatcherId);
                    setSelectedDriverId('');
                    setSelectedDispatcherId('');
                  }}
                  disabled={!selectedDriverId || !selectedDispatcherId}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-amber-500/10 disabled:cursor-not-allowed"
                >
                  Update Fleet Alignment
                </button>
              </div>
            </div>
          )}

          {/* Grid: Dispatcher Associations & Daily Notes ("Who Looks For Whom") */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dispatchers.map(disp => {
              const assignedDrivers = drivers.filter(d => d.assignedDispatcherId === disp.id);
              const currentDispNote = notes[disp.id] || '';

              return (
                <div key={disp.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col hover:border-slate-300 transition-colors">
                  
                  {/* Header Dispatcher Profile */}
                  <div className="bg-slate-50/80 border-b border-slate-100 p-5 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-500/15">
                        {disp.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{disp.name}</h3>
                        <div className="flex items-center gap-2 text-slate-500 text-[10px] font-mono font-medium uppercase mt-0.5">
                          <span>Personnel Code: {disp.id}</span>
                          <span>&bull;</span>
                          <span>{disp.phone}</span>
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] bg-slate-200/60 text-slate-700 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                      {assignedDrivers.length} Paired Drivers
                    </span>
                  </div>

                  {/* Assigned Drivers Sublist */}
                  <div className="flex-grow p-5 space-y-3">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono mb-2">
                      Assigned Fleet
                    </h4>

                    {assignedDrivers.length === 0 ? (
                      <div className="p-6 text-center border-2 border-dashed border-slate-100 rounded-xl">
                        <p className="text-xs text-slate-400 font-medium">No drivers assigned to {disp.name} today</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {assignedDrivers.map(drv => (
                          <div key={drv.id} className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 flex items-center justify-between gap-4 transition-all">
                            <div className="flex items-center gap-2.5">
                              <span className="p-1.5 bg-slate-200/60 text-slate-600 rounded-lg">
                                <Truck className="h-4 w-4" />
                              </span>
                              <div>
                                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                                  <span>{drv.name}</span>
                                  {drv.truckSpecCategory === 'BUSINESS' && (
                                    <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded text-[9px] font-bold uppercase">
                                      Business Spec
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  Truck #{drv.truckNum} &bull; {drv.truckType} &bull; Payout: {drv.driverPayoutPercent || 88}%
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openDriverEditModal(drv)}
                                className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
                                title="Edit Driver Profile"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                                <span className="text-[10px]">Edit</span>
                              </button>

                              {isAdmin && (
                                <select
                                  className="bg-white border border-slate-200 rounded-lg text-[10px] py-1 px-1.5 text-slate-700 focus:outline-none focus:border-blue-500 font-medium"
                                  value={disp.id}
                                  onChange={e => handleQuickReassign(drv.id, e.target.value)}
                                >
                                  {dispatchers.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Daily Management Instructions */}
                  <div className="bg-slate-50/50 p-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                        <span>Daily Dispatch Directions</span>
                      </div>
                      {isAdmin ? (
                        <span className="text-[8px] bg-blue-100 text-blue-800 font-extrabold px-1.5 py-0.5 rounded font-mono">ADMIN WRITE</span>
                      ) : (
                        <span className="text-[8px] bg-slate-200 text-slate-600 font-extrabold px-1.5 py-0.5 rounded font-mono">READ-ONLY</span>
                      )}
                    </div>

                    {isAdmin ? (
                      <div className="space-y-2">
                        <textarea
                          placeholder={`Write daily operational focus for ${disp.name}...`}
                          rows={2}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                          defaultValue={currentDispNote}
                          onBlur={e => handleSaveNote(disp.id, e.target.value)}
                        />
                        <p className="text-[9px] text-slate-400 font-medium italic">Changes are saved automatically when clicking outside the box.</p>
                      </div>
                    ) : (
                      <div className="p-3 bg-white border border-slate-100 rounded-xl text-xs text-slate-600 min-h-[50px]">
                        {currentDispNote || <span className="text-slate-400 italic">No specific daily directions entered for today.</span>}
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-CATEGORY 3: DRIVER QUICK EDITOR (TEAM MEMBERS CAN EDIT & SAVE DRIVERS) */}
      {/* ========================================================================= */}
      {activeSubTab === 'driver_editor' && (
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display">Assigned Driver Quick Editor</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Team members and dispatchers can edit, update, and save assigned driver contact info, equipment numbers, and dispatch settings.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
              Total Fleet: {drivers.length} Drivers
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drivers.map(drv => {
              const assignedDisp = dispatchers.find(d => d.id === drv.assignedDispatcherId);
              return (
                <div key={drv.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{drv.name}</h3>
                      <p className="text-xs text-slate-500 font-mono">{drv.phone}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase font-mono ${
                      drv.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {drv.status}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Truck #:</span>
                      <span className="font-mono font-bold text-slate-800">{drv.truckNum}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Type:</span>
                      <span className="font-bold text-slate-800">{drv.truckType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Payout Rate:</span>
                      <span className="font-mono font-bold text-emerald-600">{drv.driverPayoutPercent || 88}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Dispatcher:</span>
                      <span className="font-bold text-slate-800">{assignedDisp?.name || 'Unassigned'}</span>
                    </div>
                    {drv.workingUnderName && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Working Under:</span>
                        <span className="font-bold text-blue-700 truncate max-w-[120px]">{drv.workingUnderName}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => openDriverEditModal(drv)}
                    className="w-full py-2 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Edit &amp; Update Driver Info</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE / EDIT DRIVER DAILY POSTING                               */}
      {/* ========================================================================= */}
      {isPostingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-500 text-slate-950 rounded-lg">
                  <Compass className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold font-display">
                  {editingPosting ? 'Edit Driver Daily Posting' : 'Post Driver Daily Capacity & Status'}
                </h3>
              </div>
              <button
                onClick={() => setIsPostingModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSavePosting} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Driver Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Driver</label>
                <select
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                  value={formDriverId}
                  onChange={e => {
                    setFormDriverId(e.target.value);
                    const selected = drivers.find(d => d.id === e.target.value);
                    if (selected) {
                      setFormOrigin(selected.currentLocation || formOrigin);
                      setFormEmptyLocation(selected.currentLocation || formEmptyLocation);
                      setFormMaxWeight(Number(selected.maxWeight) || 9500);
                      setFormMaxPallets(selected.maxPallets || 12);
                    }
                  }}
                >
                  <option value="">-- Choose Driver --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} (Truck #{d.truckNum} - {d.truckType})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status & Dispatcher Action */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">1. Capacity Status</label>
                  <select
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 focus:outline-none focus:border-blue-500"
                    value={formCapacityStatus}
                    onChange={e => setFormCapacityStatus(e.target.value as any)}
                  >
                    <option value="EMPTY">🔴 Empty (Needs Load)</option>
                    <option value="PARTIAL">🟡 Partial Space Available</option>
                    <option value="BOOKED">🟢 Booked / Covered</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">2. Dispatcher Action</label>
                  <select
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 focus:outline-none focus:border-blue-500"
                    value={formDispatcherAction}
                    onChange={e => {
                      const val = e.target.value as any;
                      setFormDispatcherAction(val);
                      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString([], { month: 'short', day: 'numeric' });
                      if (val === 'ASSIGNED' && !formAssignedTime) {
                        setFormAssignedTime(nowTime);
                        setFormAssignedBy(currentUser.name || 'Admin');
                      } else if (val === 'ACCEPTED' && !formAcceptedTime) {
                        setFormAcceptedTime(nowTime);
                        setFormAcceptedBy(currentUser.name || 'Dispatcher');
                      }
                    }}
                  >
                    <option value="NONE">-- No Action / Pending --</option>
                    <option value="ASSIGNED">📌 Assigned (Admin)</option>
                    <option value="ACCEPTED">⚡ Accepted (Dispatcher)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Route / Operation Type</label>
                  <select
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                    value={formRouteType}
                    onChange={e => setRouteType(e.target.value as any)}
                  >
                    <option value="OTR">OTR (Over The Road)</option>
                    <option value="LOCAL">Local Dispatch</option>
                    <option value="REGIONAL">Regional Lanes</option>
                    <option value="DEDICATED">Dedicated Contract</option>
                  </select>
                </div>
              </div>

              {/* Assignment & Acceptance Timestamps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-purple-800 uppercase mb-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Admin Assigned Time</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 10:30 AM, Sep 3"
                      value={formAssignedTime}
                      onChange={e => setFormAssignedTime(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Assigned By (Name)"
                      value={formAssignedBy}
                      onChange={e => setFormAssignedBy(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-sky-800 uppercase mb-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Dispatcher Accepted Time</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 10:35 AM, Sep 3"
                      value={formAcceptedTime}
                      onChange={e => setFormAcceptedTime(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Accepted By (Name)"
                      value={formAcceptedBy}
                      onChange={e => setFormAcceptedBy(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Where & When Empty */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider font-mono">
                  Emptying Schedule &amp; Destination Preference
                </h4>
                
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Where will driver get empty? (City, State / Zip)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dallas, TX or Chicago, IL"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    value={formEmptyLocation}
                    onChange={e => setFormEmptyLocation(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Empty Date</label>
                    <input
                      type="date"
                      required
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                      value={formEmptyDate}
                      onChange={e => setFormEmptyDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Empty Time (EST / PKT)</label>
                    <input
                      type="text"
                      placeholder="e.g. 08:00 AM"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                      value={formEmptyTime}
                      onChange={e => setFormEmptyTime(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Looking for load to: (Destination Preference)</label>
                  <input
                    type="text"
                    placeholder="e.g. East Coast, Midwest, Anywhere / Open"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    value={formDestination}
                    onChange={e => setFormDestination(e.target.value)}
                  />
                </div>
              </div>

              {/* Current Load & Weight Limits */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Current Load #</label>
                  <input
                    type="text"
                    placeholder="e.g. LD-9821"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    value={formCurrentLoadNum}
                    onChange={e => setFormCurrentLoadNum(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Max Weight (lbs)</label>
                  <input
                    type="number"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    value={formMaxWeight}
                    onChange={e => setFormMaxWeight(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Max Pallets</label>
                  <input
                    type="number"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    value={formMaxPallets}
                    onChange={e => setFormMaxPallets(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Dispatch Notes / Remarks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Ready in morning, prefers high rate per mile, liftgate available..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPostingModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md"
                >
                  {editingPosting ? 'Save Changes' : 'Publish Daily Posting'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DRIVER PROFILE EDIT (TEAM MEMBERS CAN EDIT & SAVE DRIVER INFO)   */}
      {/* ========================================================================= */}
      {editingDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-500 text-white rounded-lg">
                  <Users className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold font-display">
                  Edit Assigned Driver Profile: {editingDriver.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingDriver(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDriverEdit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Driver Full Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                    value={driverEditName}
                    onChange={e => setDriverEditName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Phone</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
                    value={driverEditPhone}
                    onChange={e => setDriverEditPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Truck Number</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono font-bold"
                    value={driverEditTruckNum}
                    onChange={e => setDriverEditTruckNum(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Truck / Equipment Type</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    value={driverEditTruckType}
                    onChange={e => setDriverEditTruckType(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payout Rate (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono font-bold"
                    value={driverEditPayoutRate}
                    onChange={e => setDriverEditPayoutRate(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                  <select
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-bold"
                    value={driverEditStatus}
                    onChange={e => setDriverEditStatus(e.target.value as any)}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="TERMINATED">TERMINATED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Carrier / Working Under</label>
                <input
                  type="text"
                  placeholder="e.g. Independent, Express Logistics LLC"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  value={driverEditWorkingUnder}
                  onChange={e => setDriverEditWorkingUnder(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  value={driverEditNotes}
                  onChange={e => setDriverEditNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDriver(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md"
                >
                  Save &amp; Update Driver
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
