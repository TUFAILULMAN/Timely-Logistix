/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSystemState } from './useSystemState';
import {
  Truck,
  FolderLock,
  DollarSign,
  TrendingUp,
  Clock,
  LogOut,
  FolderHeart,
  FileSpreadsheet,
  Grid,
  Menu,
  ShieldAlert,
  Download,
  Upload,
  RefreshCw,
  Folder,
  LayoutDashboard,
  Users,
  ShieldCheck,
  Settings,
  AlertCircle,
  AlertTriangle,
  Bell,
  Briefcase,
  MessageSquare,
  CalendarRange,
  Coins,
  Receipt,
  Sun,
  Moon,
  Wrench,
  Sliders,
  Box,
  Calculator,
  Coffee,
  Hourglass,
  Building2,
  GraduationCap,
  X,
  Camera,
  UserCheck,
  KeyRound,
  CheckCircle2,
  Lock,
  Shield,
  Trash2,
  User as UserIcon,
  Image as ImageIcon
} from 'lucide-react';

// Import subcomponents
import LoginScreen from './components/LoginScreen';
import DashboardView from './components/DashboardView';
import DriverManagement from './components/DriverManagement';
import DailyAssignments from './components/DailyAssignments';
import DispatcherManagement from './components/DispatcherManagement';
import StaffSection from './components/StaffSection';
import LoadManagement from './components/LoadManagement';
import DispatchInvoicer from './components/DispatchInvoicer';
import ToolsSection from './components/ToolsSection';
import DriverSettlements from './components/DriverSettlements';
import SalesTracking from './components/SalesTracking';
import SalesTeamHub from './components/sales/SalesTeamHub';
import SalesTrainingModule from './components/sales/SalesTrainingModule';
import ClockSystem from './components/ClockSystem';
import ReportsSection from './components/ReportsSection';
import CarrierPayoutsHub from './components/CarrierPayoutsHub';
import TeamChat from './components/TeamChat';
import TransactionsLedger from './components/TransactionsLedger';
import BrokerManagement from './components/BrokerManagement';
import timelyLogo from './assets/images/timely_logistix_logo_1780067518769.png';
import { triggerBrowserNotification } from './utils/notifications';

export default function App() {
  const {
    state,
    syncStatus,
    login,
    logout,
    addDriver,
    editDriver,
    deleteDriver,
    addDispatcher,
    editDispatcher,
    deleteDispatcher,
    addLoad,
    editLoad,
    deleteLoad,
    clockIn,
    clockOut,
    addCarrier,
    editCarrier,
    deleteCarrier,
    assignDriverDaily,
    setFactoringRate,
    exportBackupJSON,
    importBackupJSON,
    resetToFactoryDefaults,
    snapshots,
    createSnapshot,
    restoreSnapshot,
    deleteSnapshot,
    changePassword,
    sendMessage,
    reactToMessage,
    updateProfilePhoto,
    registerUser,
    addSalesAgent,
    editUser,
    googleSignIn,
    updateCompanySettings,
    addDriverSettlement,
    editDriverSettlement,
    deleteDriverSettlement,
    addInvoice,
    editInvoice,
    deleteInvoice,
    removeTeamMember,
    sendBroadcast,
    dismissBroadcast,
    addHRProfile,
    editHRProfile,
    deleteHRProfile,
    addLeaveRequest,
    updateLeaveRequest,
    deleteLeaveRequest,
    addSalarySlip,
    updateSalarySlip,
    deleteSalarySlip,
    addDriversBulk,
    addLoadsBulk,
    addCarriersBulk,
    updateClockRecord,
    addDriverAdvance,
    editDriverAdvance,
    deleteDriverAdvance,
    addFinancialTransaction,
    editFinancialTransaction,
    deleteFinancialTransaction,
    addPendingDriverPayment,
    editPendingDriverPayment,
    deletePendingDriverPayment,
    recordPartialPayment,
    completePendingPayment,
    autoSaveBroker,
    addBroker,
    editBroker,
    deleteBroker,
    addBrokersBulk,
    addDriverPosting,
    editDriverPosting,
    deleteDriverPosting,
    quickSetPostingStatus,
    addLead,
    editLead,
    deleteLead,
    addSalesDailyLog,
    editSalesDailyLog,
    deleteSalesDailyLog,
    updateTrainingScripts
  } = useSystemState();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState<boolean>(() => localStorage.getItem('theme_mode') === 'dark');

  const toggleTheme = () => {
    setDarkMode(prev => {
      const next = !prev;
      try {
        localStorage.setItem('theme_mode', next ? 'dark' : 'light');
      } catch (e) {
        console.warn("Could not save theme mode", e);
      }
      return next;
    });
  };
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [backupString, setBackupString] = useState('');
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'err'; text: string } | null>(null);
  const [customSnapshotLabel, setCustomSnapshotLabel] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'err'; text: string } | null>(null);
  const [photoFeedback, setPhotoFeedback] = useState<{ type: 'success' | 'err'; text: string } | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const currentUser = state.currentUser;
  const currentUserId = currentUser?.id;

  // Unread message tracking for Team Chat
  const [lastReadChatTime, setLastReadChatTime] = useState<number>(() => {
    try {
      if (!currentUserId) return 0;
      const stored = localStorage.getItem(`timely_last_read_chat_${currentUserId}`);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    if (activeTab === 'chat' && currentUserId) {
      const now = Date.now();
      setLastReadChatTime(now);
      try {
        localStorage.setItem(`timely_last_read_chat_${currentUserId}`, now.toString());
      } catch {
        // ignore
      }
    }
  }, [activeTab, state.messages, currentUserId]);

  const unreadMessageCount = useMemo(() => {
    if (activeTab === 'chat' || !currentUserId) return 0;
    return (state.messages || []).filter(msg => {
      if (msg.senderId === currentUserId) return false;
      const msgTime = new Date(msg.createdAt).getTime();
      return msgTime > lastReadChatTime;
    }).length;
  }, [state.messages, lastReadChatTime, activeTab, currentUserId]);

  // Global message watcher for audio bell chime & desktop notification
  const prevChatCountRef = useRef<number>((state.messages || []).length);
  useEffect(() => {
    const msgs = state.messages || [];
    if (msgs.length > prevChatCountRef.current) {
      const newestMsg = msgs[msgs.length - 1];
      if (newestMsg && currentUserId && newestMsg.senderId !== currentUserId && currentUser?.role !== 'SALES') {
        // Trigger sound effect and browser notification (only for dispatch & admin team)
        triggerBrowserNotification(
          newestMsg.senderName,
          newestMsg.senderRole || 'DISPATCHER',
          newestMsg.content,
          newestMsg.id,
          () => setActiveTab('chat')
        );
      }
    }
    prevChatCountRef.current = msgs.length;
  }, [state.messages, currentUserId, currentUser?.role]);

  // Active Break & Short Leave tracking for current user
  const activeBreak = useMemo(() => {
    return state.currentClockRecord?.breaksTaken?.find(b => b.status === 'ACTIVE') || null;
  }, [state.currentClockRecord]);

  const activeShortLeave = useMemo(() => {
    return state.currentClockRecord?.shortLeavesTaken?.find(sl => sl.status === 'ACTIVE') || null;
  }, [state.currentClockRecord]);

  const isAgentLate = !!state.currentClockRecord?.isLate;
  const lateMinutes = state.currentClockRecord?.lateMinutes || 0;
  const [lateBannerDismissed, setLateBannerDismissed] = useState(false);

  // Time tracker for PKT shift (5:00 PM – 2:00 AM PKT)
  const [currentTimePkt, setCurrentTimePkt] = useState<string>('');
  const [shiftLatenessWarning, setShiftLatenessWarning] = useState<{ isPastStart: boolean; minutesPast: number } | null>(null);

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      try {
        const pktStr = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Karachi',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          hour12: true
        }).format(now);
        setCurrentTimePkt(pktStr);

        if (state.currentClockRecord) {
          setShiftLatenessWarning(null);
          return;
        }

        const pktFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Karachi',
          hour: 'numeric',
          minute: 'numeric',
          hour12: false
        });
        const parts = pktFormatter.formatToParts(now);
        let h = 0, m = 0;
        parts.forEach(p => {
          if (p.type === 'hour') h = parseInt(p.value, 10);
          if (p.type === 'minute') m = parseInt(p.value, 10);
        });
        const totalPktMins = h * 60 + m;
        // Shift is 17:00 (1020 mins) to 02:00 (120 mins). If past 17:05 or into next morning before 02:00:
        const isShiftTime = totalPktMins >= 1020 || totalPktMins < 120;
        if (isShiftTime && (totalPktMins > 1025 || totalPktMins < 120)) {
          const minsPast = totalPktMins >= 1020 ? (totalPktMins - 1020) : (1440 - 1020 + totalPktMins);
          setShiftLatenessWarning({ isPastStart: true, minutesPast: minsPast });
        } else {
          setShiftLatenessWarning(null);
        }
      } catch {
        // ignore
      }
    };

    updateTimes();
    const timer = setInterval(updateTimes, 10000);
    return () => clearInterval(timer);
  }, [state.currentClockRecord]);

  // If user is not logged in, render the login box!
  if (!state.currentUser) {
    return (
      <LoginScreen
        users={state.users}
        dispatchers={state.dispatchers}
        onLogin={login}
        onRegister={registerUser}
        onGoogleSignIn={googleSignIn}
        companyName={state.companySettings.name}
        companyLogoUrl={state.companySettings.logoUrl}
      />
    );
  }

  const isAdmin = currentUser.role === 'ADMIN';
  const isManager = currentUser.role === 'MANAGER';
  const perms = currentUser.permissions;

  // Access permissions evaluation
  const isFullAccess = isAdmin || perms?.isFullAccess || (isManager && perms === undefined);

  const canAccessInvoicing = isFullAccess || perms?.canAccessInvoicing === true;
  const canAccessTools = true; // Dispatch tools accessible to all operational roles
  const canAccessDriverPayout = isFullAccess || perms?.canAccessDriverPayout === true;
  const canAccessTransactionVault = isFullAccess || perms?.canAccessTransactionVault === true;
  const canAccessCarrierCRM = isFullAccess || perms?.canAccessCarrierCRM === true;
  const canAccessCorporateReports = isFullAccess || perms?.canAccessCorporateReports === true;
  const canAccessDailyAssignment = isFullAccess || perms?.canAccessDailyAssignment !== false;
  const canAccessDriverIndex = isFullAccess || perms?.canAccessDriverIndex !== false;
  const canAccessLoadBoard = isFullAccess || perms?.canAccessLoadBoard !== false;
  const canAccessTimeClock = isFullAccess || perms?.canAccessTimeClock !== false;
  const canAccessSalesCRM = isFullAccess || perms?.canAccessSalesCRM === true || (currentUser.role === 'SALES' && perms?.canAccessSalesCRM !== false);
  const canAccessTeamSeats = isFullAccess || perms?.canAccessTeamSeats === true;
  const canAccessBrokersIndex = isAdmin || currentUser.role === 'ADMIN';
  const canAccessTeamChat = currentUser.role !== 'SALES' && (isFullAccess || perms?.canAccessTeamChat !== false);
  const canAccessTraining = isFullAccess || perms?.canAccessTraining !== false;

  // Backups and restore handlers
  const handleExportBackup = () => {
    const backupData = exportBackupJSON();
    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `timely_logistix_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSampleTemplate = () => {
    fetch('/sample-company-template.json')
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'sample_company_template.json');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch(() => {
        alert('Could not download sample company template.');
      });
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBackupMessage(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        const res = await importBackupJSON(result);
        if (res.success) {
          setBackupMessage({ type: 'success', text: 'Operational database restored successfully! Active session refreshed.' });
        } else {
          setBackupMessage({ type: 'err', text: res.error || 'Failed to parse backup upload.' });
        }
      }
    };
    reader.readAsText(file);
  };

  const handleManualImportInput = async (e: React.FormEvent) => {
    e.preventDefault();
    setBackupMessage(null);
    if (!backupString.trim()) return;

    const res = await importBackupJSON(backupString);
    if (res.success) {
      setBackupMessage({ type: 'success', text: 'Operational database restored successfully.' });
      setBackupString('');
    } else {
      setBackupMessage({ type: 'err', text: res.error || 'Syntax error in manual JSON input.' });
    }
  };

  return (
    <div id="app_frame" className={`min-h-screen flex flex-col font-sans leading-normal transition-colors duration-200 ${darkMode ? 'bg-slate-950 text-slate-100 dark' : 'bg-[#F0F4F8] text-slate-900'}`}>
      
      {/* TOP HEADER & BRANDING */}
      <header className={`${darkMode ? 'bg-slate-950/95 border-slate-800/80 shadow-slate-950/30' : 'bg-[#002B49] border-blue-900 shadow-blue-950/30'} backdrop-blur-md text-white sticky top-0 z-30 no-print border-b shadow-lg transition-colors duration-200`}>
        <div className="w-full mx-auto px-4 md:px-6">
          
          {/* Main row: Branding, Quick Info & User credentials */}
          <div className="flex items-center justify-between h-16">
            
            {/* Left: Sidebar Toggle & Company Terminal Branding */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2.5 -ml-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-all duration-200 cursor-pointer focus:outline-none"
                title={sidebarOpen ? "Collapse Navigation Menu" : "Expand Navigation Menu"}
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3.5 group">
                <div className="relative">
                  <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl blur-sm opacity-20 group-hover:opacity-40 transition-all duration-300"></div>
                  <img
                    src={state.companySettings.logoUrl || timelyLogo}
                    alt={state.companySettings.name}
                    className="relative h-10 w-auto rounded-xl object-contain bg-white p-1.5 shadow-md border border-slate-700/50 max-h-[44px]"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <h2 className="text-white text-sm md:text-base font-extrabold tracking-tight font-display bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent truncate max-w-[150px]">
                      {state.companySettings.name}
                    </h2>
                    <span className="flex items-center gap-1 text-[8.5px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold px-2 py-0.5 rounded-full uppercase font-mono tracking-wider shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                      <span>Live</span>
                    </span>
                  </div>
                  <p className="text-[9.5px] text-blue-200 font-semibold tracking-wider uppercase font-mono truncate max-w-[150px]">
                    {state.companySettings.tagline}
                  </p>
                </div>
              </div>
            </div>

            {/* Center: Live PKT Time & Active Break / Short Leave Status Chips */}
            <div className="hidden lg:flex items-center gap-3">
              {currentTimePkt && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/60 border border-slate-700/60 rounded-xl text-[11px] font-mono font-bold text-slate-300 shadow-inner">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-slate-400 font-normal">PKT:</span>
                  <span className="text-amber-300">{currentTimePkt}</span>
                </div>
              )}

              {activeBreak && (
                <button
                  onClick={() => setActiveTab('clock')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 rounded-xl text-[11px] font-bold animate-pulse cursor-pointer shadow-sm"
                  title="Active Break in progress - Click to view Time Clock"
                >
                  <Coffee className="h-3.5 w-3.5 text-amber-400" />
                  <span>Break: {activeBreak.label} ({activeBreak.takenAt})</span>
                </button>
              )}

              {activeShortLeave && (
                <button
                  onClick={() => setActiveTab('clock')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/50 rounded-xl text-[11px] font-bold animate-pulse cursor-pointer shadow-sm"
                  title="Short Leave in progress - Click to view Time Clock"
                >
                  <Hourglass className="h-3.5 w-3.5 text-purple-400" />
                  <span>Short Leave: {activeShortLeave.reason} ({activeShortLeave.startedAt})</span>
                </button>
              )}

              {isAgentLate && (
                <button
                  onClick={() => setActiveTab('clock')}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50 rounded-xl text-[10.5px] font-extrabold cursor-pointer"
                  title="Late Clock-In recorded today"
                >
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                  <span>Late (+{lateMinutes}m)</span>
                </button>
              )}
            </div>

            {/* Right: Quick Settings, Theme Switcher, Avatar & Logout */}
            <div className="flex items-center gap-3 md:gap-4">
              
              {/* Theme Mode Switcher Button (DAT Blue & White <-> Dark Mode) */}
              <button
                onClick={toggleTheme}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all duration-200 border shadow-sm ${
                  darkMode 
                    ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-400/30' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400/40 ring-1 ring-blue-300/30'
                }`}
                title={darkMode ? "Switch to DAT Light Theme (Blue & White)" : "Switch to Dark Theme"}
              >
                {darkMode ? (
                  <>
                    <Sun className="h-4 w-4 text-amber-300 shrink-0" />
                    <span className="hidden sm:inline font-mono uppercase text-[10px] tracking-wider">DAT Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 text-blue-100 shrink-0" />
                    <span className="hidden sm:inline font-mono uppercase text-[10px] tracking-wider">Dark Mode</span>
                  </>
                )}
              </button>

              {/* Status lights indicator */}
              <div className="hidden sm:flex items-center gap-2.5 text-xs text-blue-200 border-r border-blue-800/80 pr-4">
                {syncStatus === 'Syncing...' ? (
                  <>
                    <div className="relative flex h-2 w-2">
                      <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </div>
                    <span className="font-semibold font-mono text-[9.5px] uppercase tracking-widest text-amber-300">Syncing...</span>
                  </>
                ) : syncStatus === 'Offline Mode' ? (
                  <>
                    <div className="relative flex h-2 w-2">
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </div>
                    <span className="font-semibold font-mono text-[9.5px] uppercase tracking-widest text-rose-300">Offline Mode</span>
                  </>
                ) : (
                  <>
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </div>
                    <span className="font-semibold font-mono text-[9.5px] uppercase tracking-widest text-emerald-300">Cloud Connected</span>
                  </>
                )}
              </div>

              {/* Session Profile user details */}
              <div className="flex items-center gap-3 pl-1">
                <div className="relative">
                  {currentUser.profilePhoto ? (
                    <img
                      src={currentUser.profilePhoto}
                      className="h-9 w-9 rounded-full object-cover shrink-0 border-2 border-blue-400/50 shadow-md ring-2 ring-blue-900"
                      alt={currentUser.name || 'User'}
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-700 to-blue-900 border border-blue-400/40 font-extrabold text-xs text-white flex items-center justify-center shrink-0 font-mono uppercase shadow-md">
                      {(currentUser.name || 'User').split(' ').filter(Boolean).map(n => n[0]).join('') || 'U'}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-slate-950"></span>
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-xs font-extrabold text-white max-w-[120px] truncate tracking-wide">{currentUser.name || 'User'}</div>
                  <div className="text-[9px] text-amber-300 font-bold font-mono uppercase tracking-widest">
                    {currentUser.role === 'ADMIN' ? 'Owner / Admin' : currentUser.role === 'SALES' ? 'Sales Rep' : 'Dispatcher'}
                  </div>
                </div>
              </div>

              {/* Sign Out Profile Button */}
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 bg-blue-950/80 hover:bg-rose-600/20 hover:text-rose-300 border border-blue-800/80 hover:border-rose-500/40 text-blue-100 rounded-xl text-xs font-bold cursor-pointer transition-all duration-200 hover:shadow-lg shadow-inner"
                title="Sign Out Profile"
              >
                <LogOut className="h-3.5 w-3.5 text-blue-200 hover:text-rose-300" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>

          </div>

        </div>

        {/* AUTOMATIC TOP BAR NOTIFICATION POPUP FOR LATE AGENTS & ACTIVE SESSIONS */}
        {isAgentLate && !lateBannerDismissed && (
          <div className="bg-gradient-to-r from-rose-950/95 via-rose-900/90 to-rose-950/95 border-t border-rose-600/50 px-4 md:px-6 py-2.5 text-white text-xs flex flex-wrap items-center justify-between gap-3 shadow-inner backdrop-blur-md">
            <div className="flex items-center gap-2.5 font-medium min-w-0">
              <span className="p-1.5 bg-rose-800/80 border border-rose-500/50 rounded-lg text-rose-200 shrink-0 shadow-sm animate-pulse">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <div className="truncate">
                <span className="font-extrabold text-white bg-rose-500/30 px-1.5 py-0.5 rounded mr-1.5 border border-rose-400/40 uppercase tracking-wider text-[10px]">
                  Late Arrival Logged
                </span>
                <span>
                  Clocked in at <strong className="font-mono font-bold text-amber-300">{state.currentClockRecord?.clockIn}</strong> (<span className="text-rose-200 font-bold">+{lateMinutes}m</span> past standard 5:00 PM PKT / 9:00 AM EST shift start).
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setActiveTab('clock')}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-all border border-white/20 shadow-sm"
              >
                View Shift Station
              </button>
              <button
                onClick={() => setLateBannerDismissed(true)}
                className="p-1 hover:bg-white/15 rounded-lg text-rose-200 hover:text-white cursor-pointer transition-colors"
                title="Dismiss Notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {shiftLatenessWarning?.isPastStart && !state.currentClockRecord && (
          <div className="bg-gradient-to-r from-amber-950/95 via-amber-900/90 to-amber-950/95 border-t border-amber-500/50 px-4 md:px-6 py-2.5 text-white text-xs flex flex-wrap items-center justify-between gap-3 shadow-inner backdrop-blur-md">
            <div className="flex items-center gap-2.5 font-medium min-w-0">
              <span className="p-1.5 bg-amber-800/80 border border-amber-500/50 rounded-lg text-amber-200 shrink-0 shadow-sm animate-bounce">
                <Clock className="h-4 w-4" />
              </span>
              <div className="truncate">
                <span className="font-extrabold text-amber-200 bg-amber-500/30 px-1.5 py-0.5 rounded mr-1.5 border border-amber-400/40 uppercase tracking-wider text-[10px]">
                  Shift In Progress
                </span>
                <span>
                  The 5:00 PM PKT (9:00 AM EST) shift is active (<span className="text-amber-300 font-bold font-mono">+{shiftLatenessWarning.minutesPast}m</span>). You are currently not clocked in!
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  clockIn(currentUser.id);
                  setActiveTab('clock');
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-extrabold cursor-pointer shadow-md flex items-center gap-1.5 transition-all border border-emerald-400/40"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Clock In Now</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* CORE FRAME SPLIT: SIDEBAR + CONTENT AREA */}
      <div className="flex-grow flex relative overflow-hidden">
        
        {/* COLLAPSIBLE LEFT SIDEBAR */}
        <aside
          className={`${
            darkMode ? 'bg-slate-950 border-slate-800/60' : 'bg-[#001E36] border-blue-900/80'
          } border-r flex flex-col no-print transition-all duration-300 ease-in-out shrink-0 z-20 ${
            sidebarOpen ? 'w-64' : 'w-16'
          }`}
        >
          {/* Sidebar Navigation Options list */}
          <div className="flex-1 overflow-y-auto px-3.5 py-5 space-y-2.5 scrollbar-thin">
            
            {/* GROUP 1: Core Operations */}
            {sidebarOpen && (
              <p className="px-2.5 mb-1.5 text-[8.5px] font-extrabold text-slate-500 uppercase tracking-widest font-mono">
                Core Operations
              </p>
            )}
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center rounded-xl text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-150 border ${
                sidebarOpen ? 'px-3 py-2.5 gap-3' : 'p-3.5 justify-center'
              } ${
                activeTab === 'dashboard'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/35 font-extrabold shadow-sm shadow-amber-500/5'
                  : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-900 hover:text-slate-100 hover:border-slate-800'
              }`}
              title="Dashboard Overview"
            >
              <LayoutDashboard className="h-4.5 w-4.5 shrink-0" />
              {sidebarOpen && <span>Dashboard</span>}
            </button>

            {canAccessLoadBoard && (
              <button
                onClick={() => setActiveTab('loads')}
                className={`w-full flex items-center rounded-xl text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-150 border ${
                  sidebarOpen ? 'px-3 py-2.5 gap-3' : 'p-3.5 justify-center'
                } ${
                  activeTab === 'loads'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/35 font-extrabold shadow-sm shadow-emerald-500/5'
                    : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-900 hover:text-slate-100 hover:border-slate-800'
                }`}
                title="Load Board"
              >
                <FolderHeart className="h-4.5 w-4.5 shrink-0" />
                {sidebarOpen && <span>Load Board</span>}
              </button>
            )}

            {canAccessDriverIndex && (
              <button
                onClick={() => setActiveTab('drivers')}
                className={`w-full flex items-center rounded-xl text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-150 border ${
                  sidebarOpen ? 'px-3 py-2.5 gap-3' : 'p-3.5 justify-center'
                } ${
                  activeTab === 'drivers'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/35 font-extrabold shadow-sm shadow-rose-500/5'
                    : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-900 hover:text-slate-100 hover:border-slate-800'
                }`}
                title="Drivers Index"
              >
                <Users className="h-4.5 w-4.5 shrink-0" />
                {sidebarOpen && <span>Drivers Index</span>}
              </button>
            )}

            {canAccessBrokersIndex && (
              <button
                onClick={() => setActiveTab('brokers')}
                className={`w-full flex items-center rounded-xl text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-150 border ${
                  sidebarOpen ? 'px-3 py-2.5 gap-3' : 'p-3.5 justify-center'
                } ${
                  activeTab === 'brokers'
                    ? 'bg-teal-500/10 text-teal-400 border-teal-500/35 font-extrabold shadow-sm shadow-teal-500/5'
                    : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-900 hover:text-slate-100 hover:border-slate-800'
                }`}
                title="Brokers Index (Admin Only)"
              >
                <Building2 className="h-4.5 w-4.5 shrink-0 text-teal-400" />
                {sidebarOpen && (
                  <div className="flex items-center justify-between flex-1">
                    <span>Brokers Index</span>
                    <span className="text-[8px] bg-teal-500/20 text-teal-300 font-extrabold px-1.5 py-0.2 rounded border border-teal-500/40 uppercase font-mono">
                      ADMIN
                    </span>
                  </div>
                )}
              </button>
            )}

            {canAccessDailyAssignment && (
              <button
                onClick={() => setActiveTab('assignments')}
                className={`w-full flex items-center rounded-xl text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-150 border ${
                  sidebarOpen ? 'px-3 py-2.5 gap-3' : 'p-3.5 justify-center'
                } ${
                  activeTab === 'assignments'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/35 font-extrabold shadow-sm shadow-amber-500/5'
                    : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-900 hover:text-slate-100 hover:border-slate-800'
                }`}
                title="Daily assignments matrix"
              >
                <CalendarRange className="h-4.5 w-4.5 shrink-0" />
                {sidebarOpen && <span>Daily Assignments</span>}
              </button>
            )}

            {canAccessTeamSeats && (
              <button
                onClick={() => setActiveTab('dispatchers')}
                className={`w-full flex items-center rounded-xl text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-150 border ${
                  sidebarOpen ? 'px-3 py-2.5 gap-3' : 'p-3.5 justify-center'
                } ${
                  activeTab === 'dispatchers'
                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/35 font-extrabold shadow-sm shadow-indigo-500/5'
                    : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-900 hover:text-slate-100 hover:border-slate-800'
                }`}
                title="Team & Seats Hub"
              >
                <ShieldCheck className="h-4.5 w-4.5 shrink-0 text-indigo-400" />
                {sidebarOpen && <span>Team &amp; Seats System</span>}
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setActiveTab('hr')}
                className={`w-full flex items-center rounded-xl text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-150 border ${
                  sidebarOpen ? 'px-3 py-2.5 gap-3' : 'p-3.5 justify-center'
                } ${
                  activeTab === 'hr'
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/40 font-extrabold shadow-sm shadow-rose-500/10'
                    : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-900 hover:text-slate-100 hover:border-slate-800'
                }`}
                title="HR Operations, Dossiers, Leaves & Payroll Hub (Admin Only)"
              >
                <Briefcase className="h-4.5 w-4.5 shrink-0 text-rose-400" />
                {sidebarOpen && (
                  <div className="flex items-center justify-between w-full">
                    <span>HR Operations</span>
                    <span className="text-[8.5px] bg-rose-500/25 text-rose-300 px-1.5 py-0.5 rounded font-mono font-bold uppercase border border-rose-500/40">Admin</span>
                  </div>
                )}
              </button>
            )}

            {/* Visual separating line */}
            <div className="h-[1px] bg-slate-800/60 my-4" />

            {/* GROUP 2: Financial & CRM */}
            {(canAccessSalesCRM || canAccessTimeClock || canAccessInvoicing || canAccessDriverPayout || canAccessTransactionVault || canAccessCarrierCRM || canAccessCorporateReports) && sidebarOpen && (
              <p className="px-2.5 mb-1.5 text-[8.5px] font-extrabold text-slate-500 uppercase tracking-widest font-mono">
                Financial &amp; CRM
              </p>
            )}

            {canAccessSalesCRM && (
              <button
                onClick={() => setActiveTab('sales')}
                className={`w-full flex items-center rounded-xl text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-150 border ${
                  sidebarOpen ? 'px-3 py-2.5 gap-3' : 'p-3.5 justify-center'
                } ${
                  activeTab === 'sales'
                    ? 'bg-violet-500/10 text-violet-400 border-violet-500/35 font-extrabold shadow-sm shadow-violet-500/5'
                    : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-900 hover:text-slate-100 hover:border-slate-800'
                }`}
                title="Sales Team Dashboard, MC# Logs & Carrier Pipeline"
              >
                <TrendingUp className="h-4.5 w-4.5 shrink-0" />
                {sidebarOpen && <span>Sales Team &amp; CRM</span>}
              </button>
            )}

            {canAccessTraining && (
              <button
                onClick={() => setActiveTab('training')}
                className={`w-full flex items-center rounded-xl text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-150 border ${
                  sidebarOpen ? 'px-3 py-2.5 gap-3' : 'p-3.5 justify-center'
                } ${
                  activeTab === 'training'
                    ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40 font-extrabold shadow-sm shadow-indigo-500/10'
                    : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-900 hover:text-slate-100 hover:border-slate-800'
                }`}
                title="Sales & Dispatcher Training Course Academy"
              >
                <GraduationCap className="h-4.5 w-4.5 shrink-0 text-indigo-400" />
                {sidebarOpen && <span>Training Academy</span>}
              </button>
            )}

            {canAccessTimeClock && (
              <button
                onClick={() => setActiveTab('clock')}
                className={`w-full flex items-center rounded-xl text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-150 border ${
                  sidebarOpen ? 'px-3 py-2.5 gap-3' : 'p-3.5 justify-center'
                } ${
                  activeTab === 'clock'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/35 font-extrabold shadow-sm shadow-amber-500/5'
                    : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-900 hover:text-slate-100 hover:border-slate-800'
                }`}
                title="Attendance Time Clock"
              >
                <Clock className="h-4.5 w-4.5 shrink-0" />
                {sidebarOpen && <span>Time Clock</span>}
              </button>
            )}

            {canAccessInvoicing && (
              <button
                onClick={() => setActiveTab('invoicer')}
                className={`w-full flex items-center rounded-xl text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-150 border ${
                  sidebarOpen ? 'px-3 py-2.5 gap-3' : 'p-3.5 justify-center'
                } ${
                  activeTab === 'invoicer'
                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/35 font-extrabold shadow-sm shadow-sky-500/5'
                    : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-900 hover:text-slate-100 hover:border-slate-800'
                }`}
                title="Invoicing"
              >
                <FileSpreadsheet className="h-4.5 w-4.5 shrink-0" />
                {sidebarOpen && <span>Invoicing</span>}
              </button>
            )}

            {canAccessTools && (
              <button
                onClick={() => setActiveTab('tools')}
                className={`w-full flex items-center rounded-xl text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-150 border ${
                  sidebarOpen ? 'px-3 py-2.5 gap-3' : 'p-3.5 justify-center'
                } ${
                  activeTab === 'tools'
                    ? 'bg-blue-500/15 text-blue-400 border-blue-500/40 font-extrabold shadow-sm shadow-blue-500/10'
                    : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-900 hover:text-slate-100 hover:border-slate-800'
                }`}
                title="Dispatch Tools, Cargo Space Calculator & RPM Matrix"
              >
                <Sliders className="h-4.5 w-4.5 shrink-0 text-blue-400" />
                {sidebarOpen && <span>Tools</span>}
              </button>
            )}

            {canAccessDriverPayout && (
              <button
                onClick={() => setActiveTab('settlements')}
                className={`w-full flex items-center rounded-xl text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-150 border ${
                  sidebarOpen ? 'px-3 py-2.5 gap-3' : 'p-3.5 justify-center'
                } ${
                  activeTab === 'settlements'
                    ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/35 font-extrabold shadow-sm shadow-yellow-500/5'
                    : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-900 hover:text-slate-100 hover:border-slate-800'
                }`}
                title="Driver Payouts Hub & Dispatch Invoices"
              >
                <Coins className="h-4.5 w-4.5 shrink-0" />
                {sidebarOpen && <span>Driver Payouts</span>}
              </button>
            )}

            {canAccessTransactionVault && (
              <button
                onClick={() => setActiveTab('transactions')}
                className={`w-full flex items-center rounded-xl text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-150 border ${
                  sidebarOpen ? 'px-3 py-2.5 gap-3' : 'p-3.5 justify-center'
                } ${
                  activeTab === 'transactions'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/35 font-extrabold shadow-sm shadow-emerald-500/5'
                    : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-900 hover:text-slate-100 hover:border-slate-800'
                }`}
                title="Transactions Ledger & Payment Proofs"
              >
                <Receipt className="h-4.5 w-4.5 shrink-0 text-emerald-400" />
                {sidebarOpen && <span>Transactions Vault</span>}
              </button>
            )}

            {canAccessCarrierCRM && (
              <button
                onClick={() => setActiveTab('carriers')}
                className={`w-full flex items-center rounded-xl text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-150 border ${
                  sidebarOpen ? 'px-3 py-2.5 gap-3' : 'p-3.5 justify-center'
                } ${
                  activeTab === 'carriers'
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/35 font-extrabold shadow-sm shadow-cyan-500/5'
                    : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-900 hover:text-slate-100 hover:border-slate-800'
                }`}
                title="Carrier CRM"
              >
                <Briefcase className="h-4.5 w-4.5 shrink-0" />
                {sidebarOpen && <span>Carrier CRM</span>}
              </button>
            )}

            {canAccessCorporateReports && (
              <button
                onClick={() => setActiveTab('reports')}
                className={`w-full flex items-center rounded-xl text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-150 border ${
                  sidebarOpen ? 'px-3 py-2.5 gap-3' : 'p-3.5 justify-center'
                } ${
                  activeTab === 'reports'
                    ? 'bg-teal-500/10 text-teal-400 border-teal-500/35 font-extrabold shadow-sm shadow-teal-500/5'
                    : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-900 hover:text-slate-100 hover:border-slate-800'
                }`}
                title="Corporate Reports Section"
              >
                <Folder className="h-4.5 w-4.5 shrink-0" />
                {sidebarOpen && <span>Corporate Reports</span>}
              </button>
            )}

            {/* Visual separating line */}
            <div className="h-[1px] bg-slate-800/60 my-4" />

            {/* GROUP 3: Social & Settings */}
            {sidebarOpen && (
              <p className="px-2.5 mb-1.5 text-[8.5px] font-extrabold text-slate-500 uppercase tracking-widest font-mono">
                System &amp; Chat
              </p>
            )}

            {canAccessTeamChat && (
              <button
                onClick={() => setActiveTab('chat')}
                className={`w-full flex items-center rounded-xl text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-150 border relative ${
                  sidebarOpen ? 'px-3 py-2.5 gap-3' : 'p-3.5 justify-center'
                } ${
                  activeTab === 'chat'
                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/35 font-extrabold shadow-sm shadow-indigo-500/5'
                    : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-900 hover:text-slate-100 hover:border-slate-800'
                }`}
                title={unreadMessageCount > 0 ? `Team Chat (${unreadMessageCount} unread)` : "Internal Team Chat Feed"}
              >
                <div className="relative shrink-0 flex items-center justify-center">
                  <MessageSquare className="h-4.5 w-4.5 shrink-0" />
                  {!sidebarOpen && unreadMessageCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-extrabold px-1 py-0.2 rounded-full min-w-[15px] h-3.5 flex items-center justify-center shadow-md animate-pulse font-mono">
                      {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                    </span>
                  )}
                </div>
                {sidebarOpen && (
                  <div className="flex items-center justify-between flex-1 min-w-0">
                    <span className="truncate">Team Chat</span>
                    {unreadMessageCount > 0 && (
                      <span className="ml-auto bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm font-mono flex items-center gap-1 animate-pulse">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping inline-block" />
                        <span>{unreadMessageCount > 99 ? '99+' : unreadMessageCount}</span>
                      </span>
                    )}
                  </div>
                )}
              </button>
            )}

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center rounded-xl text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-150 border ${
                sidebarOpen ? 'px-3 py-2.5 gap-3' : 'p-3.5 justify-center'
              } ${
                activeTab === 'settings'
                  ? 'bg-slate-850 text-white border-slate-750 font-extrabold shadow-sm'
                  : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-900 hover:text-slate-100 hover:border-slate-800'
              }`}
              title={isAdmin ? "System Backup & Settings (Admin)" : "My Account & Profile Settings"}
            >
              <Settings className="h-4.5 w-4.5 shrink-0" />
              {sidebarOpen && <span>{isAdmin ? 'Backup & Settings' : 'My Account & Settings'}</span>}
            </button>

          </div>

          {/* Collapsible toggle status footer inside aside */}
          <div className="p-3.5 border-t border-slate-900/80 bg-slate-950 flex items-center justify-between">
            {sidebarOpen ? (
              <span className="text-[9px] text-slate-500 font-mono font-bold tracking-widest uppercase">Console v1.4</span>
            ) : null}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-900 rounded-lg cursor-pointer transition-all duration-200 ml-auto"
              title={sidebarOpen ? "Collapse Side Navigation" : "Expand Side Navigation"}
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </aside>

        {/* MAIN CONTAINER WORKSPACE */}
        <main className={`flex-grow flex flex-col min-w-0 bg-slate-50/50 ${activeTab === 'chat' ? 'overflow-hidden' : 'overflow-y-auto'}`}>

        {/* VIEW PORT CONTENT ROUTER */}
        <div className={`max-w-7xl w-full mx-auto flex-1 ${activeTab === 'chat' ? 'p-3 md:p-6 flex flex-col h-full overflow-hidden' : 'p-6'}`}>
          {activeTab === 'dashboard' && (
            <DashboardView
              currentUser={currentUser}
              drivers={state.drivers}
              dispatchers={state.dispatchers}
              loads={state.loads}
              attendance={state.attendance}
              factoringRatePercent={state.factoringRatePercent}
              currentClockRecord={state.currentClockRecord}
              onClockIn={clockIn}
              onClockOut={clockOut}
              onNavigateTo={setActiveTab}
              allUsers={state.users}
              driverSettlements={state.driverSettlements}
              broadcasts={state.broadcasts}
              onAddLoad={addLoad}
            />
          )}

          {activeTab === 'loads' && (
            <LoadManagement
              currentUser={currentUser}
              loads={state.loads}
              drivers={state.drivers}
              dispatchers={state.dispatchers}
              carriers={state.carriers}
              factoringRatePercent={state.factoringRatePercent}
              driverAdvances={state.driverAdvances || []}
              brokers={state.brokers || []}
              onAutoSaveBroker={autoSaveBroker}
              onAdd={addLoad}
              onEdit={editLoad}
              onDelete={deleteLoad}
              onAddDriver={addDriver}
              onAddDispatcher={addDispatcher}
              onAddCarrier={addCarrier}
              onAddLoadsBulk={addLoadsBulk}
              onAddAdvance={addDriverAdvance}
              onEditAdvance={editDriverAdvance}
              onDeleteAdvance={deleteDriverAdvance}
            />
          )}

          {activeTab === 'drivers' && (
            <DriverManagement
              currentUser={currentUser}
              drivers={state.drivers}
              dispatchers={state.dispatchers}
              carriers={state.carriers}
              loads={state.loads}
              onAdd={addDriver}
              onEdit={editDriver}
              onDelete={deleteDriver}
              onAddDispatcher={addDispatcher}
              onAddCarrier={addCarrier}
              onAddDriversBulk={addDriversBulk}
            />
          )}

          {activeTab === 'brokers' && canAccessBrokersIndex && (
            <BrokerManagement
              currentUser={currentUser}
              brokers={state.brokers || []}
              onAddBroker={addBroker}
              onEditBroker={editBroker}
              onDeleteBroker={deleteBroker}
              onAddBrokersBulk={addBrokersBulk}
            />
          )}

          {activeTab === 'assignments' && (
            <DailyAssignments
              currentUser={currentUser}
              drivers={state.drivers}
              dispatchers={state.dispatchers}
              loads={state.loads}
              driverPostings={state.driverPostings || []}
              onAssignDriver={assignDriverDaily}
              onEditDriver={editDriver}
              onAddDriverPosting={addDriverPosting}
              onEditDriverPosting={editDriverPosting}
              onDeleteDriverPosting={deleteDriverPosting}
              onQuickSetPostingStatus={quickSetPostingStatus}
            />
          )}

          {(activeTab === 'dispatchers' || (activeTab === 'hr' && isAdmin)) && (isAdmin || isManager || canAccessTeamSeats) && (
            <StaffSection
              currentUser={currentUser}
              dispatchers={state.dispatchers}
              drivers={state.drivers}
              attendance={state.attendance}
              currentClockRecord={state.currentClockRecord}
              loads={state.loads}
              allUsers={state.users}
              onClockIn={clockIn}
              onClockOut={clockOut}
              onAddDispatcher={addDispatcher}
              onEditDispatcher={editDispatcher}
              onDeleteDispatcher={deleteDispatcher}
              onRemoveTeamMember={removeTeamMember}
              onAddSalesAgent={addSalesAgent}
              onEditUser={editUser}
              onChangePassword={changePassword}
              hrProfiles={state.hrProfiles || []}
              onAddHRProfile={addHRProfile}
              onEditHRProfile={editHRProfile}
              onDeleteHRProfile={deleteHRProfile}
              leaveRequests={state.leaveRequests || []}
              onAddLeaveRequest={addLeaveRequest}
              onUpdateLeaveRequest={updateLeaveRequest}
              onDeleteLeaveRequest={deleteLeaveRequest}
              salarySlips={state.salarySlips || []}
              onAddSalarySlip={addSalarySlip}
              onUpdateSalarySlip={updateSalarySlip}
              onDeleteSalarySlip={deleteSalarySlip}
              onUpdateClockRecord={updateClockRecord}
              defaultSubTab={activeTab === 'hr' ? 'hr' : 'team'}
            />
          )}

          {activeTab === 'sales' && canAccessSalesCRM && (
            <SalesTeamHub
              leads={state.leads || []}
              salesDailyLogs={state.salesDailyLogs || []}
              users={state.users || []}
              currentUser={currentUser}
              carriers={state.carriers || []}
              onAddLead={addLead}
              onEditLead={editLead}
              onDeleteLead={deleteLead}
              onAddSalesDailyLog={addSalesDailyLog}
              onEditSalesDailyLog={editSalesDailyLog}
              onDeleteSalesDailyLog={deleteSalesDailyLog}
              onAddCarrier={addCarrier}
              onAddSalesAgent={addSalesAgent}
              onRemoveTeamMember={removeTeamMember}
              trainingScripts={state.trainingScripts}
              onUpdateTrainingScripts={updateTrainingScripts}
            />
          )}

          {activeTab === 'training' && canAccessTraining && (
            <SalesTrainingModule
              currentUser={currentUser}
              trainingScripts={state.trainingScripts}
              onUpdateTrainingScripts={updateTrainingScripts}
            />
          )}

          {activeTab === 'clock' && (
            <ClockSystem
              currentUser={currentUser}
              dispatchers={state.dispatchers}
              users={state.users}
              attendance={state.attendance}
              currentClockRecord={state.currentClockRecord}
              onClockIn={clockIn}
              onClockOut={clockOut}
              onUpdateClockRecord={updateClockRecord}
            />
          )}

          {activeTab === 'invoicer' && (
            <DispatchInvoicer
              currentUser={currentUser}
              loads={state.loads}
              dispatchers={state.dispatchers}
              carriers={state.carriers}
              drivers={state.drivers}
              companySettings={state.companySettings}
              onUpdateCompanySettings={updateCompanySettings}
              onEditLoad={editLoad}
              invoices={state.invoices || []}
              onAddInvoice={addInvoice}
              onEditInvoice={editInvoice}
              onDeleteInvoice={deleteInvoice}
            />
          )}

          {activeTab === 'tools' && (
            <ToolsSection
              currentUser={currentUser}
              loads={state.loads}
              drivers={state.drivers}
              carriers={state.carriers}
              companySettings={state.companySettings}
            />
          )}

          {activeTab === 'settlements' && (
            <DriverSettlements
              currentUser={currentUser}
              drivers={state.drivers}
              loads={state.loads}
              settlements={state.driverSettlements}
              companySettings={state.companySettings}
              driverAdvances={state.driverAdvances || []}
              invoices={state.invoices || []}
              dispatchers={state.dispatchers}
              carriers={state.carriers}
              financialTransactions={state.financialTransactions || []}
              onAddSettlement={addDriverSettlement}
              onEditSettlement={editDriverSettlement}
              onDeleteSettlement={deleteDriverSettlement}
              onAddAdvance={addDriverAdvance}
              onAddInvoice={addInvoice}
              onEditInvoice={editInvoice}
              onDeleteInvoice={deleteInvoice}
              onUpdateCompanySettings={updateCompanySettings}
              onEditLoad={editLoad}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsLedger
              currentUser={currentUser}
              transactions={state.financialTransactions || []}
              pendingDriverPayments={state.pendingDriverPayments || []}
              drivers={state.drivers}
              carriers={state.carriers}
              loads={state.loads}
              invoices={state.invoices || []}
              driverAdvances={state.driverAdvances || []}
              driverSettlements={state.driverSettlements || []}
              companySettings={state.companySettings}
              onAddTransaction={addFinancialTransaction}
              onEditTransaction={editFinancialTransaction}
              onDeleteTransaction={deleteFinancialTransaction}
              onAddPendingPayment={addPendingDriverPayment}
              onEditPendingPayment={editPendingDriverPayment}
              onDeletePendingPayment={deletePendingDriverPayment}
              onRecordPartialPayment={recordPartialPayment}
              onCompletePendingPayment={completePendingPayment}
              onAddInvoice={addInvoice}
              onEditInvoice={editInvoice}
              onDeleteInvoice={deleteInvoice}
            />
          )}

          {activeTab === 'carriers' && (
            <CarrierPayoutsHub
              currentUser={currentUser}
              drivers={state.drivers}
              dispatchers={state.dispatchers}
              carriers={state.carriers}
              loads={state.loads}
              onAddCarrier={addCarrier}
              onEditCarrier={editCarrier}
              onDeleteCarrier={deleteCarrier}
              onAssignDriverDaily={assignDriverDaily}
              onEditDriver={editDriver}
              onAddDriver={addDriver}
              onAddCarriersBulk={addCarriersBulk}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsSection
              loads={state.loads}
              drivers={state.drivers}
              dispatchers={state.dispatchers}
              factoringRatePercent={state.factoringRatePercent}
              attendance={state.attendance}
            />
          )}

          {activeTab === 'chat' && (
            <TeamChat
              currentUser={currentUser}
              dispatchers={state.dispatchers}
              messages={state.messages || []}
              onSendMessage={sendMessage}
              onUpdateProfilePhoto={updateProfilePhoto}
              users={state.users}
              onAddTeamMember={registerUser}
              onRemoveTeamMember={removeTeamMember}
              onSendBroadcast={sendBroadcast}
              onReactToMessage={reactToMessage}
            />
          )}

          {activeTab === 'settings' && (
            <div id="settings_tab" className="space-y-6">
              
              {/* Header Banner - Differentiated for Admin vs Non-Admin */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 font-display">
                      {isAdmin ? 'System Settings & Backup Console' : 'My Account & Security Center'}
                    </h1>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider font-mono border ${
                      isAdmin 
                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' 
                        : 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                    }`}>
                      {isAdmin ? 'Super Admin Privileges' : `${currentUser.role || 'Member'} Account`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {isAdmin
                      ? 'Manage complete database backups, instant snapshots, factoring rates, company branding, and personal credentials.'
                      : 'Manage your individual profile picture, view account credentials, and securely update your password.'}
                  </p>
                </div>

                {!isAdmin && (
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs text-slate-600">
                    <Lock className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span className="font-semibold text-[11px]">Private User Account</span>
                  </div>
                )}
              </div>

              {/* Global backup message notification for admin */}
              {backupMessage && isAdmin && (
                <div className={`p-4 rounded-xl flex items-start gap-2.5 text-xs font-semibold ${
                  backupMessage.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-250 text-emerald-800'
                    : 'bg-red-50 border border-red-250 text-red-800'
                }`}>
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{backupMessage.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Profile Picture & Avatar Manager Card (Available for ALL users) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Camera className="h-4 w-4 text-blue-600" />
                      <span>Profile Picture &amp; Identity</span>
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono font-medium">All Team Accounts</span>
                  </div>

                  {photoFeedback && (
                    <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 ${
                      photoFeedback.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                      <span>{photoFeedback.text}</span>
                      <button 
                        onClick={() => setPhotoFeedback(null)} 
                        className="text-[11px] font-bold underline cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-1">
                    {/* Avatar Preview */}
                    <div className="relative group shrink-0">
                      {currentUser.profilePhoto ? (
                        <img
                          src={currentUser.profilePhoto}
                          alt={currentUser.name || 'User'}
                          className="h-24 w-24 rounded-2xl object-cover border-2 border-blue-500 shadow-md ring-4 ring-blue-50"
                        />
                      ) : (
                        <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 border-2 border-blue-400/40 text-white font-extrabold text-2xl flex items-center justify-center font-mono shadow-md ring-4 ring-blue-50 uppercase">
                          {(currentUser.name || 'User').split(' ').filter(Boolean).map(n => n[0]).join('') || 'U'}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow border border-slate-200">
                        <span className="h-3.5 w-3.5 rounded-full bg-emerald-500 block"></span>
                      </div>
                    </div>

                    {/* Upload / Remove Actions */}
                    <div className="flex-1 space-y-3 text-center sm:text-left w-full">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{currentUser.name || 'User'}</h4>
                        <p className="text-xs text-slate-500 font-mono">@{currentUser.username || 'user'}</p>
                        <div className="mt-1 flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                          <span className="text-[9px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded uppercase font-mono">
                            Role: {currentUser.role || 'MEMBER'}
                          </span>
                          {currentUser.dispatcherId && (
                            <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded font-mono">
                              Seat: {currentUser.dispatcherId}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                        <label className={`px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm transition-all flex items-center gap-1.5 ${isUploadingPhoto ? 'opacity-50 pointer-events-none' : ''}`}>
                          <Upload className="h-3.5 w-3.5" />
                          <span>{isUploadingPhoto ? 'Uploading...' : 'Upload Profile Picture'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isUploadingPhoto}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 5 * 1024 * 1024) {
                                setPhotoFeedback({ type: 'err', text: 'Image file must be under 5MB.' });
                                return;
                              }
                              setIsUploadingPhoto(true);
                              setPhotoFeedback(null);
                              const reader = new FileReader();
                              reader.onload = async (event) => {
                                try {
                                  const base64 = event.target?.result as string;
                                  await updateProfilePhoto(currentUser.id, base64);
                                  setPhotoFeedback({ type: 'success', text: 'Profile picture updated successfully!' });
                                } catch (err: any) {
                                  setPhotoFeedback({ type: 'err', text: err.message || 'Failed to update photo.' });
                                } finally {
                                  setIsUploadingPhoto(false);
                                }
                              };
                              reader.onerror = () => {
                                setPhotoFeedback({ type: 'err', text: 'Failed to read image file.' });
                                setIsUploadingPhoto(false);
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>

                        {currentUser.profilePhoto && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await updateProfilePhoto(currentUser.id, '');
                                setPhotoFeedback({ type: 'success', text: 'Profile picture removed.' });
                              } catch (err: any) {
                                setPhotoFeedback({ type: 'err', text: 'Failed to remove photo.' });
                              }
                            }}
                            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-400 font-medium">
                        Supported: PNG, JPG, WEBP or GIF. Displays across Team Chat, Attendance, and top header.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Change My Password Card (Available for ALL users) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-blue-600" />
                      <span>Change My Password</span>
                    </h3>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Personal Account Only
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">
                    Update your personal login password. This change applies strictly to your own account and will not affect administrator or other team member accounts.
                  </p>

                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setPasswordFeedback(null);
                    if (!newPassword.trim()) {
                      setPasswordFeedback({ type: 'err', text: 'Password cannot be blank.' });
                      return;
                    }
                    if (newPassword.length < 4) {
                      setPasswordFeedback({ type: 'err', text: 'Password must be at least 4 characters.' });
                      return;
                    }
                    if (newPassword !== confirmPassword) {
                      setPasswordFeedback({ type: 'err', text: 'Passwords do not match.' });
                      return;
                    }
                    try {
                      const res = await changePassword(currentUser.id, newPassword);
                      if (res.success) {
                        setPasswordFeedback({ type: 'success', text: 'Your account password was updated successfully!' });
                        setNewPassword('');
                        setConfirmPassword('');
                      } else {
                        setPasswordFeedback({ type: 'err', text: 'Failed to update credentials.' });
                      }
                    } catch (err: any) {
                      setPasswordFeedback({ type: 'err', text: err.message || 'Operation failed.' });
                    }
                  }} className="space-y-4">
                    {passwordFeedback && (
                      <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 ${
                        passwordFeedback.type === 'success'
                          ? 'bg-emerald-50 border border-emerald-150 text-emerald-800'
                          : 'bg-red-50 border border-red-150 text-red-800'
                      }`}>
                        <span>{passwordFeedback.text}</span>
                        <button 
                          type="button" 
                          onClick={() => setPasswordFeedback(null)} 
                          className="text-[11px] font-bold underline cursor-pointer"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        New Security Password
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-850 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-850 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl text-center cursor-pointer transition-colors shadow-sm"
                    >
                      Apply Password Change
                    </button>
                  </form>
                </div>

                {/* 3. Non-Admin Account Security & Privacy Overview Card */}
                {!isAdmin && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 col-span-1 lg:col-span-2">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                        Account Security &amp; Privacy Shield
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                        <div className="text-[10px] uppercase font-mono font-bold text-slate-400">Attendance Privacy</div>
                        <div className="text-xs font-bold text-slate-800">Private to Your Desk</div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Your live clock records, break timers, and performance metrics are private to your session and admin review only.
                        </p>
                      </div>

                      <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                        <div className="text-[10px] uppercase font-mono font-bold text-slate-400">Database &amp; Snapshots</div>
                        <div className="text-xs font-bold text-slate-800">Admin Managed</div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          System data backups, factoring rates, and company brand settings are securely maintained by administrators.
                        </p>
                      </div>

                      <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                        <div className="text-[10px] uppercase font-mono font-bold text-slate-400">Security Encryption</div>
                        <div className="text-xs font-bold text-slate-800">Direct Account Access</div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          You maintain 100% control over your account password and personal profile avatar.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Factoring Config card (Admin Only) */}
                {isAdmin && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Coins className="h-4 w-4 text-amber-500" />
                        <span>Factoring Settings</span>
                      </h3>
                      <span className="text-[9px] bg-amber-50 text-amber-700 font-extrabold px-2 py-0.5 rounded border border-amber-200 font-mono">
                        ADMIN ONLY
                      </span>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-2">
                        Global Agency Factoring Rate (%)
                      </label>
                      <div className="flex gap-2.5">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="20"
                          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-850 w-24 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={state.factoringRatePercent}
                          onChange={e => setFactoringRate(Number(e.target.value))}
                        />
                        <span className="text-xs text-slate-400 self-center">
                          Default is 3.25% of gross load amount on 'Factored' status.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Company Branding & Identity Panel (Admin Only) */}
                {isAdmin && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <span>Company Brand Identity</span>
                      </h3>
                      <span className="text-[9px] bg-amber-50 text-amber-700 font-extrabold px-2 py-0.5 rounded border border-amber-200 font-mono">
                        ADMIN ONLY
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Company Name</label>
                          <input
                            type="text"
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                            value={state.companySettings.name}
                            onChange={e => updateCompanySettings({ name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Brand Tagline</label>
                          <input
                            type="text"
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                            value={state.companySettings.tagline}
                            onChange={e => updateCompanySettings({ tagline: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Contact Phone</label>
                          <input
                            type="text"
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                            value={state.companySettings.phone}
                            onChange={e => updateCompanySettings({ phone: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Contact Email</label>
                          <input
                            type="text"
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                            value={state.companySettings.email}
                            onChange={e => updateCompanySettings({ email: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Corporate Address</label>
                        <textarea
                          rows={2}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                          value={state.companySettings.address}
                          onChange={e => updateCompanySettings({ address: e.target.value })}
                        />
                      </div>

                      <div className="border-t border-slate-100 pt-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Upload Custom Company Logo</label>
                        <div className="flex items-center gap-4">
                          <img
                            src={state.companySettings.logoUrl || timelyLogo}
                            alt="Preview Logo"
                            className="h-14 w-auto rounded border border-slate-200 bg-white p-1 object-contain"
                          />
                          <div className="flex-1">
                            <label className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm transition-all text-center inline-block">
                              <span>Select Logo File</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = async (event) => {
                                      const base64 = event.target?.result as string;
                                      await updateCompanySettings({ logoUrl: base64 });
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Accepts PNG, JPG, or SVG. Dynamic real-time update.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. Data Backup & System Recovery Vault (Admin Only) */}
                {isAdmin && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6 col-span-1 lg:col-span-2">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <FolderLock className="h-4 w-4 text-blue-600" />
                            <span>System Data Backup &amp; Instant Recovery Vault</span>
                          </h3>
                          <span className="text-[9px] bg-amber-50 text-amber-700 font-extrabold px-2 py-0.5 rounded border border-amber-200 font-mono">
                            ADMIN ONLY
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Keep back all system state up to this last change. Create timestamped snapshot backups, download offline JSON files, or roll back to any previous state.
                        </p>
                      </div>

                      <div className="flex items-center flex-wrap gap-2">
                        <button
                          onClick={handleExportBackup}
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                          title="Export your current live database with all records"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download Current Live Backup</span>
                        </button>

                        <button
                          onClick={handleDownloadSampleTemplate}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                          title="Download a clean starter template with non-personal sample loads and carriers"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download Clean Sample Template</span>
                        </button>

                        <label className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors">
                          <Upload className="h-3.5 w-3.5" />
                          <span>Upload JSON File</span>
                          <input
                            type="file"
                            accept=".json"
                            className="hidden"
                            onChange={handleImportBackup}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Standalone Distribution & App Download Banner */}
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-bold text-blue-900 flex items-center gap-1.5">
                          <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
                          <span>Distribute This Software to Another Company</span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5">
                          To give this app to another company or run it on their own server/computer: click <strong>Settings &rarr; Export to ZIP</strong> in the Google AI Studio menu. The exported software contains <strong>zero personal data</strong> and includes full setup instructions in <code>README.md</code> and <code>Dockerfile</code>.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleDownloadSampleTemplate}
                        className="px-3 py-1.5 bg-white border border-blue-300 text-blue-800 hover:bg-blue-50 font-bold rounded-lg shrink-0 shadow-2xs transition"
                      >
                        Sample Template (.json)
                      </button>
                    </div>

                    {backupMessage && (
                      <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 ${backupMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                        <span>{backupMessage.text}</span>
                        <button onClick={() => setBackupMessage(null)} className="text-xs font-bold hover:underline cursor-pointer">Dismiss</button>
                      </div>
                    )}

                    {/* Instant Snapshot Creator */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        <span>Take Instant Data Backup Snapshot (Up To Last Change)</span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Instantly store a point-in-time snapshot of all loads, drivers, dispatchers, advances, pending payouts, invoices, and accounting ledgers in local safety storage.
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Snapshot label (e.g., 'Backup Before Rate Update' or 'State Up To Last Change')"
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={customSnapshotLabel}
                          onChange={e => setCustomSnapshotLabel(e.target.value)}
                        />
                        <button
                          onClick={() => {
                            const snap = createSnapshot(customSnapshotLabel || `Data Snapshot - ${new Date().toLocaleTimeString()}`);
                            setCustomSnapshotLabel('');
                            setBackupMessage({ type: 'success', text: `Saved instant backup snapshot "${snap.label}" successfully!` });
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm transition-all flex items-center gap-1.5 shrink-0"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>Save Snapshot Now</span>
                        </button>
                      </div>
                    </div>

                    {/* Saved Snapshots Vault Table */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                          Saved Data Snapshots &amp; History ({snapshots.length})
                        </h4>
                        <span className="text-[11px] text-slate-400 font-medium">Click Restore to roll back all data to any snapshot</span>
                      </div>

                      {snapshots.length === 0 ? (
                        <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                          <p className="text-xs text-slate-500 font-medium">No snapshots saved yet. Click "Save Snapshot Now" above to freeze data up to this point.</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                          {snapshots.map(snap => (
                            <div key={snap.id} className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-300 transition-all shadow-xs">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-800">{snap.label}</span>
                                  <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-mono font-semibold border border-blue-100">
                                    {new Date(snap.timestamp).toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                                  <span>📦 Loads: {snap.itemCounts.loads}</span>
                                  <span>🚛 Drivers: {snap.itemCounts.drivers}</span>
                                  <span>👔 Dispatchers: {snap.itemCounts.dispatchers}</span>
                                  <span>🧾 Invoices: {snap.itemCounts.invoices}</span>
                                  <span>💸 Payouts: {snap.itemCounts.pendingDriverPayments}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={async () => {
                                    if (confirm(`Are you sure you want to restore data to snapshot "${snap.label}" (${new Date(snap.timestamp).toLocaleString()})? A backup of your current state will automatically be created.`)) {
                                      const res = await restoreSnapshot(snap.id);
                                      if (res.success) {
                                        setBackupMessage({ type: 'success', text: `System state rolled back to snapshot "${snap.label}"!` });
                                      } else {
                                        setBackupMessage({ type: 'err', text: res.error || 'Failed to restore snapshot.' });
                                      }
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1"
                                >
                                  <RefreshCw className="h-3 w-3" />
                                  <span>Restore Snapshot</span>
                                </button>

                                <button
                                  onClick={() => {
                                    const jsonStr = JSON.stringify(snap.data, null, 2);
                                    const blob = new Blob([jsonStr], { type: 'application/json' });
                                    const url = URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.setAttribute('download', `snapshot_${snap.id}_${snap.timestamp.split('T')[0]}.json`);
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs cursor-pointer border border-slate-200"
                                  title="Download JSON file for this snapshot"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </button>

                                <button
                                  onClick={() => {
                                    if (confirm(`Delete snapshot "${snap.label}"?`)) {
                                      deleteSnapshot(snap.id);
                                    }
                                  }}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs cursor-pointer border border-rose-200"
                                  title="Delete snapshot"
                                >
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Manual Paste Area & Reset Data */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <form onSubmit={handleManualImportInput} className="flex-1 space-y-2">
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                          Paste Encoded JSON Backup String
                        </label>
                        <div className="flex gap-2">
                          <textarea
                            placeholder="Paste schema JSON here..."
                            rows={1}
                            className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:bg-white"
                            value={backupString}
                            onChange={e => setBackupString(e.target.value)}
                          />
                          <button
                            type="submit"
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl cursor-pointer shrink-0"
                          >
                            Apply JSON
                          </button>
                        </div>
                      </form>

                      <button
                        onClick={() => {
                          if (confirm('Are you absolutely sure you want to restore original factory clean data? A backup snapshot of your current state will automatically be saved first.')) {
                            resetToFactoryDefaults();
                            setBackupMessage({ type: 'success', text: 'Restored standard factory data. Your pre-reset data was safely snapshot in history.' });
                          }
                        }}
                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold cursor-pointer border border-rose-200 shrink-0 self-end md:self-auto"
                      >
                        Reset Factory Defaults
                      </button>
                    </div>

                  </div>
                )}

              </div>

            </div>
          )}
        </div>

      </main>

      {/* Real-time Broadcast Alerts Popup */}
      {state.broadcasts && state.broadcasts.length > 0 && (
        (() => {
          const activeBroadcast = state.broadcasts.find(b => !dismissedAlerts.includes(b.id));
          if (!activeBroadcast) return null;

          return (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
                
                {/* Header depending on type */}
                <div className={`p-5 text-white flex items-center gap-3 ${
                  activeBroadcast.type === 'ALERT'
                    ? 'bg-red-600 animate-pulse-slow'
                    : activeBroadcast.type === 'WARNING'
                    ? 'bg-amber-500'
                    : 'bg-blue-600'
                }`}>
                  <div className="p-2 bg-white/10 rounded-xl">
                    {activeBroadcast.type === 'ALERT' ? (
                      <AlertTriangle className="h-6 w-6 text-white" />
                    ) : activeBroadcast.type === 'WARNING' ? (
                      <AlertCircle className="h-6 w-6 text-white" />
                    ) : (
                      <Bell className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white/15 px-2 py-0.5 rounded-full text-white">
                      Company Broadcast
                    </span>
                    <h3 className="text-base font-extrabold tracking-tight mt-1">{activeBroadcast.title}</h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <p className="text-sm text-slate-600 leading-relaxed font-semibold">
                    {activeBroadcast.message}
                  </p>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
                    <span className="text-slate-400">
                      Broadcasted by: <strong className="text-slate-700">{activeBroadcast.senderName}</strong>
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {new Date(activeBroadcast.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-1 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setDismissedAlerts(prev => [...prev, activeBroadcast.id])}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wide rounded-xl shadow-sm transition-colors cursor-pointer text-center"
                    >
                      Acknowledge &amp; Dismiss
                    </button>
                  </div>
                </div>

              </div>
            </div>
          );
        })()
      )}

    </div>
   </div>
  );
}
