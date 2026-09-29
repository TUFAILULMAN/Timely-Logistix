/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ClockRecord, Dispatcher, User, BreakRecord, ShortLeaveRecord } from '../types';
import AnalogClock from './AnalogClock';
import AttendanceKanbanBoard from './AttendanceKanbanBoard';
import {
  parseTimeToMinutes,
  parseFullDateTimeToMs,
  calculateBreakMinutes,
  formatSecondsToTimer,
  formatMinutesToHours,
  findUserActiveShift,
  getLiveShiftElapsedSeconds,
  normalizeTimestamp
} from '../utils/timeTracker';
import {
  Clock,
  Play,
  LogOut,
  CheckCircle,
  AlertTriangle,
  Calendar,
  UserCheck,
  ShieldAlert,
  Coffee,
  Utensils,
  Pause,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  Users,
  Timer,
  Info,
  Layers,
  BarChart3,
  Award,
  Sparkles,
  Zap,
  RotateCcw,
  Sun,
  Moon,
  Compass,
  ArrowRight,
  Hourglass,
  Lock,
  Unlock,
  AlertCircle,
  HeartHandshake,
  PhoneCall,
  Flame,
  Globe,
  Bell,
  Check
} from 'lucide-react';

interface ClockSystemProps {
  currentUser: User;
  dispatchers: Dispatcher[];
  users?: User[];
  attendance: ClockRecord[];
  currentClockRecord: ClockRecord | null;
  onClockIn: (dispId: string, customTime?: string, customDate?: string) => void;
  onClockOut: (recordId: string, customTime?: string) => void;
  onUpdateClockRecord?: (recordId: string, updatedFields: Partial<ClockRecord>) => Promise<void> | void;
}

// 6 Standard Presets: 5 Rest Breaks and 1 Meal Break (No specific time mentioned)
export interface BreakPresetConfig {
  key: 'REST_1' | 'REST_2' | 'MEAL' | 'REST_3' | 'REST_4' | 'REST_5' | 'REFRESHMENT_1' | 'REFRESHMENT_2' | 'REFRESHMENT_3' | 'REFRESHMENT_4';
  label: string;
  defaultMinutes?: number;
  type: 'REST' | 'MEAL' | string;
  icon: any;
  targetWindowPkt?: string;
  targetWindowEst?: string;
  desc?: string;
  order: number;
}

export const SHIFT_BREAK_PRESETS: BreakPresetConfig[] = [
  {
    key: 'REST_1',
    type: 'REST',
    label: 'Rest Break',
    icon: Coffee,
    order: 1
  },
  {
    key: 'REST_2',
    type: 'REST',
    label: 'Rest Break',
    icon: Sparkles,
    order: 2
  },
  {
    key: 'MEAL',
    type: 'MEAL',
    label: 'Meal Break',
    icon: Utensils,
    order: 3
  },
  {
    key: 'REST_3',
    type: 'REST',
    label: 'Rest Break',
    icon: Coffee,
    order: 4
  },
  {
    key: 'REST_4',
    type: 'REST',
    label: 'Rest Break',
    icon: Zap,
    order: 5
  },
  {
    key: 'REST_5',
    type: 'REST',
    label: 'Rest Break',
    icon: Coffee,
    order: 6
  }
];

export default function ClockSystem({
  currentUser,
  dispatchers,
  users = [],
  attendance,
  currentClockRecord,
  onClockIn,
  onClockOut,
  onUpdateClockRecord
}: ClockSystemProps) {
  const isAdmin = currentUser.role === 'ADMIN';
  const myDispatcher = dispatchers.find(d => 
    d.username.toLowerCase() === currentUser.username.toLowerCase() ||
    (currentUser.username.includes('@') && d.username.toLowerCase() === currentUser.username.split('@')[0].toLowerCase()) ||
    (currentUser.dispatcherId && d.id === currentUser.dispatcherId)
  ) || null;
  const myDispatcherId = myDispatcher?.id || currentUser.dispatcherId || currentUser.id || (isAdmin ? currentUser.id : '');

  // Tab state
  const [activeTab, setActiveTab] = useState<'CLOCK_DESK' | 'SUMMARY_REPORTS'>('CLOCK_DESK');
  const [reportPeriod, setReportPeriod] = useState<'THIS_WEEK' | 'LAST_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'ALL_TIME'>('THIS_WEEK');

  // Timezone selection & auto detection
  const [selectedTimeZone, setSelectedTimeZone] = useState<string>(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Karachi';
    } catch {
      return 'Asia/Karachi';
    }
  });

  // Break preset selection
  const [selectedPresetKey, setSelectedPresetKey] = useState<BreakPresetConfig['key']>('REFRESHMENT_1');

  // Short Leave Modal
  const [showShortLeaveModal, setShowShortLeaveModal] = useState(false);
  const [shortLeaveReason, setShortLeaveReason] = useState('Prayer / Namaz');
  const [customLeaveNote, setCustomLeaveNote] = useState('');

  // Modal / Row details toggle
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  // Live timer tick
  const [liveSeconds, setLiveSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter attendance based on role (Strictly private: only Super Admin can access all accounts; team members see ONLY their own)
  const visibleAttendance = isAdmin
    ? attendance
    : attendance.filter(a => {
        if (!a) return false;
        if (myDispatcherId && a.dispatcherId === myDispatcherId) return true;
        if (currentUser.id && a.dispatcherId === currentUser.id) return true;
        if (currentUser.dispatcherId && a.dispatcherId === currentUser.dispatcherId) return true;
        if (currentUser.username && a.dispatcherId?.toLowerCase() === currentUser.username.toLowerCase()) return true;
        if (myDispatcher && a.dispatcherId === myDispatcher.id) return true;
        return false;
      });

  // Sorting attendance records (most recent date first)
  const sortedAttendance = [...visibleAttendance].sort((a, b) => b.date.localeCompare(a.date));

  // Manual logging config
  const [manualDispId, setManualDispId] = useState(myDispatcherId || (dispatchers[0]?.id || ''));
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [manualInTime, setManualInTime] = useState('05:00 PM');
  const [manualOutTime, setManualOutTime] = useState('02:00 AM');
  const [isSimulating, setIsSimulating] = useState(false);

  // Helper time functions
  const getCurrentFormattedTime = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const getRecordTotalBreakMinutes = (record: ClockRecord) => {
    if (!record.breaksTaken || record.breaksTaken.length === 0) return 0;
    return record.breaksTaken.reduce((sum, b) => {
      if (b.status === 'COMPLETED' && b.completedAt) {
        return sum + (b.durationMinutes || calculateBreakMinutes(b.takenAt, b.completedAt, b.startedAtTimestamp, b.completedAtTimestamp));
      }
      return sum;
    }, 0);
  };

  const getRecordTotalOverBreakMinutes = (record: ClockRecord) => {
    if (!record.breaksTaken || record.breaksTaken.length === 0) return 0;
    return record.breaksTaken.reduce((sum, b) => {
      if (b.status === 'COMPLETED' && b.completedAt) {
        const actualMins = b.durationMinutes || calculateBreakMinutes(b.takenAt, b.completedAt, b.startedAtTimestamp, b.completedAtTimestamp);
        const allocated = b.allocatedMinutes || (b.label.includes('Meal') ? 20 : 10);
        return sum + Math.max(0, actualMins - allocated);
      }
      return sum;
    }, 0);
  };

  const getRecordTotalShortLeaveMinutes = (record: ClockRecord) => {
    if (!record.shortLeavesTaken || record.shortLeavesTaken.length === 0) return 0;
    return record.shortLeavesTaken.reduce((sum, sl) => {
      if (sl.status === 'COMPLETED' && sl.completedAt) {
        return sum + (sl.durationMinutes || calculateBreakMinutes(sl.startedAt, sl.completedAt, sl.startedAtTimestamp, sl.completedAtTimestamp));
      }
      return sum;
    }, 0);
  };

  // Find active shift record dynamically from live attendance or currentClockRecord
  const effectiveClockRecord = useMemo(() => {
    const activeFromList = findUserActiveShift(attendance, currentUser);
    if (activeFromList) return activeFromList;
    if (currentClockRecord && !currentClockRecord.clockOut) {
      return currentClockRecord;
    }
    return null;
  }, [attendance, currentUser, currentClockRecord]);

  // Find active break and active short leave
  const activeBreak = effectiveClockRecord?.breaksTaken?.find(b => b.status === 'ACTIVE');
  const activeShortLeave = effectiveClockRecord?.shortLeavesTaken?.find(sl => sl.status === 'ACTIVE');

  // Compute live elapsed break duration string (HH:MM:SS)
  const getElapsedBreakDuration = () => {
    if (!activeBreak) return '00:00:00';
    const startMs = normalizeTimestamp(activeBreak.startedAtTimestamp) || parseFullDateTimeToMs(effectiveClockRecord?.date, activeBreak.takenAt);
    const elapsedSecs = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
    return formatSecondsToTimer(elapsedSecs);
  };

  // Compute live elapsed short leave duration
  const getElapsedShortLeaveDuration = () => {
    if (!activeShortLeave) return '00:00:00';
    const startMs = normalizeTimestamp(activeShortLeave.startedAtTimestamp) || parseFullDateTimeToMs(effectiveClockRecord?.date, activeShortLeave.startedAt);
    const elapsedSecs = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
    return formatSecondsToTimer(elapsedSecs);
  };

  // Compute live shift duration string (HH:MM:SS) using monotonic elapsed calculation
  const getElapsedShiftDuration = () => {
    if (!effectiveClockRecord) return '00:00:00';
    return formatSecondsToTimer(getLiveShiftElapsedSeconds(effectiveClockRecord));
  };

  // Shift Phase Logic (6 Breaks: 5 Rest Breaks, 1 Meal Break)
  const getShiftPhaseInfo = () => {
    if (!effectiveClockRecord) return null;
    const completedBreaksCount = effectiveClockRecord.breaksTaken?.filter(b => b.status === 'COMPLETED').length || 0;
    const remainingBreaks = Math.max(0, 6 - completedBreaksCount);

    return {
      phase: 'FLEXIBLE_BREAKS',
      title: 'Shift Breaks (6 Breaks: 5 Rest Breaks & 1 Meal Break)',
      isLocked: false,
      minutesRemaining: 0,
      completedBreaksCount,
      remainingBreaks,
      message: `Break Allowance: ${completedBreaksCount}/6 breaks used (${remainingBreaks} remaining).`
    };
  };

  const shiftPhaseInfo = getShiftPhaseInfo();

  // Check which break presets have already been taken on the current shift record
  const takenPresetKeys = new Set<string>();
  (effectiveClockRecord?.breaksTaken || []).forEach(b => {
    if (b.status === 'COMPLETED' || b.status === 'ACTIVE') {
      if (b.presetKey) takenPresetKeys.add(b.presetKey);
      else if (b.label.includes('Meal') || b.label.includes('Lunch') || b.label.includes('Dinner')) takenPresetKeys.add('MEAL');
      else if (b.label.includes('Rest Break 1') || b.label.includes('Refreshment 1')) takenPresetKeys.add('REST_1');
      else if (b.label.includes('Rest Break 2') || b.label.includes('Refreshment 2')) takenPresetKeys.add('REST_2');
      else if (b.label.includes('Rest Break 3') || b.label.includes('Refreshment 3')) takenPresetKeys.add('REST_3');
      else if (b.label.includes('Rest Break 4') || b.label.includes('Refreshment 4')) takenPresetKeys.add('REST_4');
      else if (b.label.includes('Rest Break 5')) takenPresetKeys.add('REST_5');
    }
  });

  const totalBreaksTakenCount = effectiveClockRecord?.breaksTaken?.filter(b => b.status === 'COMPLETED').length || 0;
  const currentPreset = SHIFT_BREAK_PRESETS.find(p => p.key === selectedPresetKey) || SHIFT_BREAK_PRESETS[0];

  // Start Break action
  const handleStartBreak = async () => {
    if (!effectiveClockRecord || !onUpdateClockRecord) return;
    if (activeBreak || activeShortLeave) return; // Already on leave or break
    
    let presetKey: BreakRecord['presetKey'] = 'CUSTOM';
    let breakType: BreakRecord['type'] = 'CUSTOM';
    let label = `Flex Break ${(effectiveClockRecord.breaksTaken?.length || 0) + 1}`;
    let defaultMinutes = 10;

    let preset = SHIFT_BREAK_PRESETS.find(p => p.key === selectedPresetKey);
    if (!preset || takenPresetKeys.has(preset.key)) {
      const nextAvailable = SHIFT_BREAK_PRESETS.find(p => !takenPresetKeys.has(p.key));
      if (nextAvailable) {
        preset = nextAvailable;
        setSelectedPresetKey(nextAvailable.key);
      }
    }

    if (preset && !takenPresetKeys.has(preset.key)) {
      presetKey = preset.key;
      breakType = preset.type;
      label = preset.label;
      defaultMinutes = preset.defaultMinutes;
    }

    const nowStr = getCurrentFormattedTime();
    const startedAtTimestamp = Date.now();
    const newBreak: BreakRecord = {
      id: `brk_${startedAtTimestamp}`,
      presetKey,
      type: breakType,
      label,
      durationMinutes: 0,
      allocatedMinutes: defaultMinutes,
      overBreakMinutes: 0,
      takenAt: nowStr,
      startedAtTimestamp,
      status: 'ACTIVE'
    };

    const updatedBreaks = [...(effectiveClockRecord.breaksTaken || []), newBreak];
    await onUpdateClockRecord(effectiveClockRecord.id, {
      breaksTaken: updatedBreaks
    });
  };

  // Stop Break action
  const handleStopBreak = async () => {
    if (!effectiveClockRecord || !onUpdateClockRecord || !activeBreak) return;

    const nowStr = getCurrentFormattedTime();
    const completedAtTimestamp = Date.now();
    const durMins = calculateBreakMinutes(activeBreak.takenAt, nowStr, activeBreak.startedAtTimestamp, completedAtTimestamp);
    const allocated = activeBreak.allocatedMinutes || (activeBreak.label.includes('Meal') ? 20 : 10);
    const overBreak = Math.max(0, durMins - allocated);

    const updatedBreaks = (effectiveClockRecord.breaksTaken || []).map(b => {
      if (b.id === activeBreak.id) {
        return {
          ...b,
          completedAt: nowStr,
          completedAtTimestamp,
          durationMinutes: durMins,
          overBreakMinutes: overBreak,
          status: 'COMPLETED' as const
        };
      }
      return b;
    });

    const totalOver = updatedBreaks.reduce((s, b) => s + (b.overBreakMinutes || 0), 0);

    await onUpdateClockRecord(effectiveClockRecord.id, {
      breaksTaken: updatedBreaks,
      totalOverBreakMinutes: totalOver
    });
  };

  // Start Short Leave
  const handleStartShortLeave = async () => {
    if (!effectiveClockRecord || !onUpdateClockRecord) return;
    if (activeBreak || activeShortLeave) return;

    const finalReason = shortLeaveReason === 'Custom Reason' ? (customLeaveNote || 'Short Leave') : shortLeaveReason;
    const nowStr = getCurrentFormattedTime();
    const startedAtTimestamp = Date.now();
    const newShortLeave: ShortLeaveRecord = {
      id: `sl_${startedAtTimestamp}`,
      reason: finalReason,
      startedAt: nowStr,
      startedAtTimestamp,
      durationMinutes: 0,
      status: 'ACTIVE'
    };

    const updatedShortLeaves = [...(effectiveClockRecord.shortLeavesTaken || []), newShortLeave];
    await onUpdateClockRecord(effectiveClockRecord.id, {
      shortLeavesTaken: updatedShortLeaves
    });

    setShowShortLeaveModal(false);
  };

  // Stop Short Leave
  const handleStopShortLeave = async () => {
    if (!effectiveClockRecord || !onUpdateClockRecord || !activeShortLeave) return;

    const nowStr = getCurrentFormattedTime();
    const completedAtTimestamp = Date.now();
    const durMins = calculateBreakMinutes(activeShortLeave.startedAt, nowStr, activeShortLeave.startedAtTimestamp, completedAtTimestamp);

    const updatedShortLeaves = (effectiveClockRecord.shortLeavesTaken || []).map(sl => {
      if (sl.id === activeShortLeave.id) {
        return {
          ...sl,
          completedAt: nowStr,
          completedAtTimestamp,
          durationMinutes: durMins,
          status: 'COMPLETED' as const
        };
      }
      return sl;
    });

    const totalSL = updatedShortLeaves.reduce((s, sl) => s + (sl.durationMinutes || 0), 0);

    await onUpdateClockRecord(effectiveClockRecord.id, {
      shortLeavesTaken: updatedShortLeaves,
      totalShortLeaveMinutes: totalSL
    });
  };

  const handleSimulatedClock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDispId) return;

    onClockIn(manualDispId, manualInTime, manualDate);
    setTimeout(() => {
      const matched = attendance.find(a => a.dispatcherId === manualDispId && a.date === manualDate);
      if (matched && !matched.clockOut) {
        onClockOut(matched.id, manualOutTime);
      }
    }, 50);

    setIsSimulating(false);
  };

  const getDispatcherName = (dispId: string) => {
    return dispatchers.find(d => d.id === dispId)?.name || 'Timely Logistix Staff';
  };

  const formatMinutesToHoursStr = (minutes?: number) => {
    if (minutes === undefined || minutes === null) return 'In Progress';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  // Date range filtering logic for reports
  const getFilteredAttendanceByPeriod = () => {
    const today = new Date();

    return visibleAttendance.filter(rec => {
      if (!rec.date) return false;
      const recDate = new Date(rec.date);
      if (isNaN(recDate.getTime())) return false;

      if (reportPeriod === 'THIS_WEEK') {
        const dayOfWeek = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);
        return recDate >= startOfWeek;
      }

      if (reportPeriod === 'LAST_WEEK') {
        const dayOfWeek = today.getDay();
        const endOfLastWeek = new Date(today);
        endOfLastWeek.setDate(today.getDate() - dayOfWeek - 1);
        endOfLastWeek.setHours(23, 59, 59, 999);

        const startOfLastWeek = new Date(endOfLastWeek);
        startOfLastWeek.setDate(endOfLastWeek.getDate() - 6);
        startOfLastWeek.setHours(0, 0, 0, 0);

        return recDate >= startOfLastWeek && recDate <= endOfLastWeek;
      }

      if (reportPeriod === 'THIS_MONTH') {
        return recDate.getMonth() === today.getMonth() && recDate.getFullYear() === today.getFullYear();
      }

      if (reportPeriod === 'LAST_MONTH') {
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        return recDate.getMonth() === lastMonth.getMonth() && recDate.getFullYear() === lastMonth.getFullYear();
      }

      return true; // ALL_TIME
    });
  };

  const periodAttendance = getFilteredAttendanceByPeriod();

  // Aggregate Metrics for Period Summary
  const totalPeriodShifts = periodAttendance.length;
  const totalPeriodGrossWorkMinutes = periodAttendance.reduce((acc, r) => acc + (r.workMinutes || 0), 0);
  
  let totalPeriodBreaksCount = 0;
  let totalPeriodBreakMinutes = 0;
  let totalPeriodOverBreakMinutes = 0;
  let totalPeriodShortLeaveCount = 0;
  let totalPeriodShortLeaveMinutes = 0;

  periodAttendance.forEach(r => {
    const breaks = r.breaksTaken || [];
    totalPeriodBreaksCount += breaks.filter(b => b.status === 'COMPLETED').length;
    totalPeriodBreakMinutes += getRecordTotalBreakMinutes(r);
    totalPeriodOverBreakMinutes += getRecordTotalOverBreakMinutes(r);

    const sLeaves = r.shortLeavesTaken || [];
    totalPeriodShortLeaveCount += sLeaves.filter(sl => sl.status === 'COMPLETED').length;
    totalPeriodShortLeaveMinutes += getRecordTotalShortLeaveMinutes(r);
  });

  const totalPeriodNetWorkMinutes = Math.max(0, totalPeriodGrossWorkMinutes - totalPeriodBreakMinutes - totalPeriodShortLeaveMinutes);
  const totalPeriodLateArrivals = periodAttendance.filter(r => r.isLate).length;
  const periodOnTimePercent = totalPeriodShifts > 0 ? Math.round(((totalPeriodShifts - totalPeriodLateArrivals) / totalPeriodShifts) * 100) : 100;

  // Breakdown per staff member
  const staffSummaryMap = new Map<string, {
    dispatcherId: string;
    name: string;
    shiftsCount: number;
    grossMinutes: number;
    breakCount: number;
    breakMinutes: number;
    overBreakMinutes: number;
    shortLeaveCount: number;
    shortLeaveMinutes: number;
    netWorkMinutes: number;
    lateCount: number;
  }>();

  dispatchers.forEach(d => {
    staffSummaryMap.set(d.id, {
      dispatcherId: d.id,
      name: d.name,
      shiftsCount: 0,
      grossMinutes: 0,
      breakCount: 0,
      breakMinutes: 0,
      overBreakMinutes: 0,
      shortLeaveCount: 0,
      shortLeaveMinutes: 0,
      netWorkMinutes: 0,
      lateCount: 0
    });
  });

  periodAttendance.forEach(rec => {
    let entry = staffSummaryMap.get(rec.dispatcherId);
    if (!entry) {
      entry = {
        dispatcherId: rec.dispatcherId,
        name: getDispatcherName(rec.dispatcherId),
        shiftsCount: 0,
        grossMinutes: 0,
        breakCount: 0,
        breakMinutes: 0,
        overBreakMinutes: 0,
        shortLeaveCount: 0,
        shortLeaveMinutes: 0,
        netWorkMinutes: 0,
        lateCount: 0
      };
      staffSummaryMap.set(rec.dispatcherId, entry);
    }

    entry.shiftsCount += 1;
    entry.grossMinutes += rec.workMinutes || 0;
    const bCount = (rec.breaksTaken || []).filter(b => b.status === 'COMPLETED').length;
    const bMins = getRecordTotalBreakMinutes(rec);
    const obMins = getRecordTotalOverBreakMinutes(rec);
    const slCount = (rec.shortLeavesTaken || []).filter(sl => sl.status === 'COMPLETED').length;
    const slMins = getRecordTotalShortLeaveMinutes(rec);

    entry.breakCount += bCount;
    entry.breakMinutes += bMins;
    entry.overBreakMinutes += obMins;
    entry.shortLeaveCount += slCount;
    entry.shortLeaveMinutes += slMins;
    entry.netWorkMinutes += Math.max(0, (rec.workMinutes || 0) - bMins - slMins);
    if (rec.isLate) entry.lateCount += 1;
  });

  const staffSummaryList = Array.from(staffSummaryMap.values()).filter(s => isAdmin || s.dispatcherId === myDispatcherId);

  // Export to CSV helper
  const handleExportCSV = () => {
    const headers = [
      'Staff Name',
      'Shifts Logged',
      'Gross Hours',
      'Breaks Taken (X/5)',
      'Total Break Time',
      'Over-Break Duration',
      'Short Leave Sessions',
      'Total Short Leave Time',
      'Net Duty Hours',
      'Late Arrivals'
    ];

    const rows = staffSummaryList.map(s => [
      `"${s.name}"`,
      s.shiftsCount,
      `"${formatMinutesToHoursStr(s.grossMinutes)}"`,
      `"${s.breakCount}/5"`,
      `"${formatMinutesToHoursStr(s.breakMinutes)}"`,
      `"${s.overBreakMinutes > 0 ? `${s.overBreakMinutes}m` : '0m'}"`,
      s.shortLeaveCount,
      `"${formatMinutesToHoursStr(s.shortLeaveMinutes)}"`,
      `"${formatMinutesToHoursStr(s.netWorkMinutes)}"`,
      s.lateCount
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Breaks_ShortLeave_Report_${reportPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="clock_system" className="space-y-6">
      
      {/* ================= HEADER & NAVIGATION BAR ================= */}
      <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider rounded-md flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-blue-600" />
                <span>Shift &amp; Break Station</span>
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider rounded-md flex items-center gap-1 font-mono">
                <Globe className="h-3 w-3 text-emerald-600" />
                <span>PKT 5:00 PM – 2:00 AM | EST 9:00 AM – 5:00 PM</span>
              </span>
              {activeBreak && (
                <span className="px-2.5 py-0.5 bg-amber-50 border border-amber-300 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider rounded-md flex items-center gap-1 animate-pulse">
                  <Coffee className="h-3 w-3 text-amber-600" />
                  <span>Active Break Interval</span>
                </span>
              )}
              {activeShortLeave && (
                <span className="px-2.5 py-0.5 bg-purple-50 border border-purple-300 text-purple-900 text-[10px] font-extrabold uppercase tracking-wider rounded-md flex items-center gap-1 animate-pulse">
                  <Flame className="h-3 w-3 text-purple-600" />
                  <span>On Short Leave ({activeShortLeave.reason})</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display mt-1.5 flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                <Clock className="h-5 w-5" />
              </div>
              <span>Time Clock, Break Presets &amp; Short Leave Station</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Precision analog dials formatted for Pakistan Standard Time and US Freight corridors, single-use 5-break preset enforcement, short leave logging, and comprehensive attendance audits.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Timezone Toggle Selector */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setSelectedTimeZone('Asia/Karachi')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedTimeZone === 'Asia/Karachi'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Pakistan Standard Time (Karachi/Islamabad/Lahore)"
              >
                🇵🇰 PKT (UTC+5)
              </button>
              <button
                onClick={() => setSelectedTimeZone('America/New_York')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedTimeZone === 'America/New_York'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="US Eastern Standard Time (New York / Atlanta / Miami)"
              >
                🇺🇸 EST (US)
              </button>
              <button
                onClick={() => setSelectedTimeZone('America/Chicago')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedTimeZone === 'America/Chicago'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="US Central Standard Time (Chicago / Dallas / Houston)"
              >
                🇺🇸 CST (US)
              </button>
              <button
                onClick={() => setSelectedTimeZone('America/Denver')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedTimeZone === 'America/Denver'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="US Mountain Standard Time (Denver / Phoenix / Salt Lake City)"
              >
                🇺🇸 MST (US)
              </button>
              <button
                onClick={() => setSelectedTimeZone('America/Los_Angeles')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedTimeZone === 'America/Los_Angeles'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="US Pacific Standard Time (Los Angeles / Seattle / Portland)"
              >
                🇺🇸 PST (US)
              </button>
            </div>

            <button
              onClick={() => setIsSimulating(p => !p)}
              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5 text-blue-600" />
              <span>{isSimulating ? 'Hide Form' : 'Manual Shift'}</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-150 pt-2 gap-6">
          <button
            onClick={() => setActiveTab('CLOCK_DESK')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'CLOCK_DESK'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Shift, Break Presets &amp; Short Leave</span>
          </button>

          <button
            onClick={() => setActiveTab('SUMMARY_REPORTS')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'SUMMARY_REPORTS'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Attendance, Over-Breaks &amp; Leave Audit</span>
          </button>
        </div>
      </div>

      {/* Manual clock entry form */}
      {isSimulating && (
        <form onSubmit={handleSimulatedClock} className="bg-white p-6 rounded-2xl border border-blue-200 shadow-xl space-y-4 max-w-xl animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span>Log Manual Attendance Entry</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Administrative override</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {isAdmin ? (
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Dispatcher Account</label>
                <select
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-blue-500"
                  value={manualDispId}
                  onChange={e => setManualDispId(e.target.value)}
                >
                  <option value="">-- Choose Dispatcher --</option>
                  {dispatchers.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Dispatcher</label>
                <input
                  type="text"
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed"
                  value={myDispatcher?.name || ''}
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Shift Date</label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-blue-500"
                value={manualDate}
                onChange={e => setManualDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Clock In (HH:MM AM/PM)</label>
              <input
                type="text"
                required
                placeholder="e.g. 05:00 PM"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-blue-500"
                value={manualInTime}
                onChange={e => setManualInTime(e.target.value)}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Clock Out (HH:MM AM/PM)</label>
              <input
                type="text"
                required
                placeholder="e.g. 02:00 AM"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-blue-500"
                value={manualOutTime}
                onChange={e => setManualOutTime(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsSimulating(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 cursor-pointer text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white cursor-pointer text-xs font-bold shadow-md shadow-blue-500/20"
            >
              Log Manual Shift
            </button>
          </div>
        </form>
      )}

      {/* VIEW 1: CLOCK & BREAK STATION */}
      {activeTab === 'CLOCK_DESK' && (
        <div className="space-y-6">

          {/* ================= TOP SECTION: TIME ZONE WALL CLOCKS GALLERY ================= */}
          <div className="bg-gradient-to-b from-white to-blue-50/40 p-6 rounded-3xl border border-blue-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-blue-100/80 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2 font-display">
                  <Compass className="h-4.5 w-4.5 text-blue-600" />
                  <span>Operations Time Zone Wall Clocks</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Synchronous analog sweep dials covering Pakistan Standard Time and North American freight dispatch zones.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-blue-700 bg-blue-100/60 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Live Timezone Sync Feed</span>
              </div>
            </div>

            {/* Grid of Analog Wall Clocks */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-2">
              {/* Pakistan Standard Time (Karachi / PKT) - Featured Gold Border */}
              <div className="bg-white p-3.5 rounded-2xl border-2 border-amber-400 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-bl-lg uppercase font-mono tracking-wider">
                  Primary Shift
                </div>
                <AnalogClock
                  timeZone="Asia/Karachi"
                  label="Pakistan (PKT)"
                  subLabel="5:00 PM – 2:00 AM Shift"
                  size="md"
                  variant="light"
                />
              </div>

              {/* Eastern Time */}
              <div className="bg-white p-3.5 rounded-2xl border border-blue-100/80 shadow-2xs hover:shadow-md transition-shadow">
                <AnalogClock
                  timeZone="America/New_York"
                  label="Eastern (EST/EDT)"
                  subLabel="9:00 AM – 5:00 PM USA"
                  size="md"
                  variant="light"
                />
              </div>

              {/* Central Time */}
              <div className="bg-white p-3.5 rounded-2xl border border-blue-100/80 shadow-2xs hover:shadow-md transition-shadow">
                <AnalogClock
                  timeZone="America/Chicago"
                  label="Central (CST/CDT)"
                  subLabel="Chicago / Dallas / Houston"
                  size="md"
                  variant="light"
                />
              </div>

              {/* Mountain Time */}
              <div className="bg-white p-3.5 rounded-2xl border border-blue-100/80 shadow-2xs hover:shadow-md transition-shadow">
                <AnalogClock
                  timeZone="America/Denver"
                  label="Mountain (MST/MDT)"
                  subLabel="Denver / Phoenix / SLC"
                  size="md"
                  variant="light"
                />
              </div>

              {/* Pacific Time */}
              <div className="bg-white p-3.5 rounded-2xl border border-blue-100/80 shadow-2xs hover:shadow-md transition-shadow">
                <AnalogClock
                  timeZone="America/Los_Angeles"
                  label="Pacific (PST/PDT)"
                  subLabel="Los Angeles / Seattle"
                  size="md"
                  variant="light"
                />
              </div>
            </div>
          </div>

          {/* ================= SHIFT PHASE STATUS BANNER ================= */}
          {currentClockRecord && shiftPhaseInfo && (
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs ${
              shiftPhaseInfo.isLocked
                ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                : shiftPhaseInfo.phase === 'PHASE_3_WRAP_UP'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-950'
                : 'bg-emerald-50 border-emerald-200 text-emerald-950'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${
                  shiftPhaseInfo.isLocked
                    ? 'bg-amber-500 text-white'
                    : shiftPhaseInfo.phase === 'PHASE_3_WRAP_UP'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}>
                  {shiftPhaseInfo.isLocked ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                    <span>{shiftPhaseInfo.title}</span>
                    {shiftPhaseInfo.isLocked && (
                      <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-mono font-bold text-[10px] rounded-md animate-pulse">
                        Unlocks in {shiftPhaseInfo.minutesRemaining}m
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 mt-0.5">
                    {shiftPhaseInfo.message}
                  </p>
                </div>
              </div>

              {/* Progress pill of 6 breaks */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-bold uppercase text-slate-600 mr-1">Breaks:</span>
                {SHIFT_BREAK_PRESETS.map((p, i) => {
                  const isTaken = takenPresetKeys.has(p.key);
                  const isCurActive = activeBreak?.presetKey === p.key;
                  return (
                    <div
                      key={p.key}
                      className={`w-7 h-7 rounded-lg font-mono text-[10px] font-bold flex items-center justify-center border transition-all ${
                        isCurActive
                          ? 'bg-amber-500 text-slate-950 border-amber-600 ring-2 ring-amber-400 animate-bounce'
                          : isTaken
                          ? 'bg-emerald-600 text-white border-emerald-700'
                          : shiftPhaseInfo.isLocked
                          ? 'bg-slate-200 text-slate-400 border-slate-300'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                      title={`${p.label} (${i + 1}/6) - ${isTaken ? 'Taken' : isCurActive ? 'Active' : 'Available'}`}
                    >
                      {isTaken ? '✓' : i + 1}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= MIDDLE SECTION: INTERACTIVE BREAK CIRCLE GEAR STATION ================= */}
          {(myDispatcher || isAdmin || currentUser.role === 'SALES' || true) && (
            <div className="bg-white p-6 rounded-3xl border border-blue-150 shadow-md space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
                
                {/* Left Side: Shift Status & Metrics */}
                <div className="space-y-4 max-w-md text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    <span>{currentUser.name} &bull; {isAdmin ? 'Super Admin Terminal' : currentUser.role === 'SALES' ? 'Sales CRM Terminal' : 'Dispatcher Terminal'}</span>
                  </div>

                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight font-display">
                      {effectiveClockRecord ? (
                        activeShortLeave ? (
                          <span className="text-purple-600 flex items-center justify-center lg:justify-start gap-2">
                            <Flame className="h-6 w-6 text-purple-500" />
                            <span>On Short Leave</span>
                          </span>
                        ) : activeBreak ? (
                          <span className="text-amber-600 flex items-center justify-center lg:justify-start gap-2">
                            <Coffee className="h-6 w-6 text-amber-500" />
                            <span>On Scheduled Break</span>
                          </span>
                        ) : (
                          <span className="text-blue-600 flex items-center justify-center lg:justify-start gap-2">
                            <Zap className="h-6 w-6 text-blue-500" />
                            <span>Shift In Progress</span>
                          </span>
                        )
                      ) : (
                        <span className="text-slate-500">Off The Clock (Ready to Clock In)</span>
                      )}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      {effectiveClockRecord
                        ? `Clocked in at ${effectiveClockRecord.clockIn} (${effectiveClockRecord.timeZone || selectedTimeZone}). Use the central gear button to start/stop breaks, or log short leaves.`
                        : 'Begin your duty shift by clicking the central gear button below to start tracking your working hours and dispatch activities.'}
                    </p>
                  </div>

                  {/* Shift Stats Widgets */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl">
                      <div className="text-[10px] font-bold uppercase text-blue-600 flex items-center gap-1">
                        <Timer className="h-3 w-3" />
                        <span>Shift Duration</span>
                      </div>
                      <div className="text-lg font-black font-mono text-slate-900 mt-0.5">
                        {effectiveClockRecord ? getElapsedShiftDuration() : '00:00:00'}
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                      <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                        <Coffee className="h-3 w-3 text-amber-500" />
                        <span>Breaks Taken</span>
                      </div>
                      <div className="text-lg font-black font-mono text-slate-900 mt-0.5">
                        {totalBreaksTakenCount} / 5 ({getRecordTotalBreakMinutes(effectiveClockRecord || ({} as any))}m)
                      </div>
                    </div>
                  </div>

                  {/* Short Leave Quick Launcher Button */}
                  {effectiveClockRecord && !activeBreak && !activeShortLeave && (
                    <div className="pt-1">
                      <button
                        onClick={() => setShowShortLeaveModal(true)}
                        className="w-full py-2.5 px-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-2"
                      >
                        <Flame className="h-4 w-4 text-purple-600" />
                        <span>Take Short Leave (Prayer / Urgent Errand)</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Center: THE CATCHY ROTATING GEAR BREAK CIRCLE BUTTON */}
                <div className="flex flex-col items-center justify-center relative py-4">
                  {/* Outer Mechanical Gear SVG Ring */}
                  <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
                    
                    {/* SVG Rotating Cog Gear Ring */}
                    <svg
                      className={`absolute inset-0 w-full h-full ${
                        activeShortLeave
                          ? 'animate-[spin_15s_linear_infinite] text-purple-500'
                          : activeBreak
                          ? 'animate-[spin_20s_linear_infinite] text-amber-500'
                          : effectiveClockRecord
                          ? 'animate-[spin_35s_linear_infinite] text-blue-600'
                          : 'text-slate-300'
                      }`}
                      viewBox="0 0 200 200"
                    >
                      <defs>
                        <linearGradient id="gearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={activeShortLeave ? '#a855f7' : activeBreak ? '#f59e0b' : effectiveClockRecord ? '#2563eb' : '#94a3b8'} />
                          <stop offset="100%" stopColor={activeShortLeave ? '#7e22ce' : activeBreak ? '#d97706' : effectiveClockRecord ? '#1d4ed8' : '#64748b'} />
                        </linearGradient>
                      </defs>

                      {/* 12 Outer Gear Teeth */}
                      {Array.from({ length: 12 }).map((_, i) => {
                        const deg = i * 30;
                        return (
                          <rect
                            key={`gear-tooth-${i}`}
                            x="92"
                            y="4"
                            width="16"
                            height="18"
                            rx="3"
                            fill="url(#gearGrad)"
                            transform={`rotate(${deg} 100 100)`}
                          />
                        );
                      })}

                      {/* Outer Rim of the Gear */}
                      <circle
                        cx="100"
                        cy="100"
                        r="88"
                        fill="none"
                        stroke="url(#gearGrad)"
                        strokeWidth="10"
                      />

                      {/* Inner Cog Accent Ring */}
                      <circle
                        cx="100"
                        cy="100"
                        r="76"
                        fill="none"
                        stroke={activeShortLeave ? '#e9d5ff' : activeBreak ? '#fde68a' : effectiveClockRecord ? '#93c5fd' : '#e2e8f0'}
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                    </svg>

                    {/* Central Catchy Interactive Circular Button Inside Gear */}
                    <div className="relative z-10 flex flex-col items-center justify-center">
                      {effectiveClockRecord ? (
                        activeShortLeave ? (
                          /* On Short Leave: Glowing Purple Stop Button */
                          <button
                            onClick={handleStopShortLeave}
                            className="group w-44 h-44 sm:w-48 sm:h-48 rounded-full bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 hover:from-purple-400 hover:to-indigo-600 text-white p-4 flex flex-col items-center justify-center shadow-xl shadow-purple-500/40 hover:shadow-purple-500/60 transition-all transform hover:scale-105 active:scale-95 cursor-pointer border-4 border-white"
                          >
                            <div className="p-2 rounded-full bg-white/20 mb-1 group-hover:scale-110 transition-transform">
                              <Pause className="h-6 w-6 text-white fill-current" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-wider">END LEAVE</span>
                            <span className="text-[10px] font-mono font-extrabold bg-slate-950 text-purple-300 px-2.5 py-0.5 rounded-full mt-1">
                              {getElapsedShortLeaveDuration()}
                            </span>
                            <span className="text-[9px] font-semibold text-purple-100 mt-0.5 truncate max-w-[120px]">
                              {activeShortLeave.reason}
                            </span>
                          </button>
                        ) : activeBreak ? (
                          /* On Break: Glowing Amber Stop Break Circular Button */
                          <button
                            onClick={handleStopBreak}
                            className="group w-44 h-44 sm:w-48 sm:h-48 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 p-4 flex flex-col items-center justify-center shadow-xl shadow-amber-500/40 hover:shadow-amber-500/60 transition-all transform hover:scale-105 active:scale-95 cursor-pointer border-4 border-white"
                          >
                            <div className="p-2.5 rounded-full bg-white/30 mb-1 group-hover:scale-110 transition-transform">
                              <Pause className="h-6 w-6 text-slate-950 fill-current" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-wider">END BREAK</span>
                            <span className="text-[10px] font-mono font-extrabold bg-slate-950 text-amber-300 px-2.5 py-0.5 rounded-full mt-1">
                              {getElapsedBreakDuration()}
                            </span>
                            <span className="text-[9px] font-semibold text-slate-900/80 mt-0.5">Resume Active Shift</span>
                          </button>
                        ) : (
                          /* On Shift: Blue Start Break Circular Button (or Locked in Phase 1) */
                          <button
                            onClick={handleStartBreak}
                            disabled={shiftPhaseInfo?.isLocked}
                            className={`group w-44 h-44 sm:w-48 sm:h-48 rounded-full p-4 flex flex-col items-center justify-center shadow-xl transition-all transform border-4 border-white ${
                              shiftPhaseInfo?.isLocked
                                ? 'bg-slate-300 text-slate-600 cursor-not-allowed shadow-none'
                                : 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 hover:from-blue-400 hover:to-indigo-600 text-white shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-105 active:scale-95 cursor-pointer'
                            }`}
                          >
                            <div className="p-2.5 rounded-full bg-white/20 mb-1 group-hover:scale-110 transition-transform">
                              {shiftPhaseInfo?.isLocked ? <Lock className="h-6 w-6 text-slate-700" /> : <Coffee className="h-6 w-6 text-white" />}
                            </div>
                            <span className="text-xs font-black uppercase tracking-wider">
                              {shiftPhaseInfo?.isLocked ? 'LOCKED' : 'START BREAK'}
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-white/20 text-white px-2 py-0.5 rounded-full mt-1 truncate max-w-[130px]">
                              {shiftPhaseInfo?.isLocked ? `${shiftPhaseInfo.minutesRemaining}m to unlock` : `${currentPreset.label} (${currentPreset.defaultMinutes}m)`}
                            </span>
                            <span className="text-[9px] text-blue-100/80 mt-0.5">
                              {shiftPhaseInfo?.isLocked ? 'Phase 1 Active Focus' : 'Click to Begin Rest'}
                            </span>
                          </button>
                        )
                      ) : (
                        /* Off Clock: Emerald Clock In Button Inside Gear */
                        <button
                          onClick={() => onClockIn(myDispatcherId || currentUser.dispatcherId || currentUser.id)}
                          className="group w-44 h-44 sm:w-48 sm:h-48 rounded-full bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 hover:from-emerald-400 hover:to-teal-600 text-white p-4 flex flex-col items-center justify-center shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all transform hover:scale-105 active:scale-95 cursor-pointer border-4 border-white"
                        >
                          <div className="p-2.5 rounded-full bg-white/20 mb-1 group-hover:scale-110 transition-transform">
                            <Play className="h-7 w-7 text-white fill-white" />
                          </div>
                          <span className="text-sm font-black uppercase tracking-wider">CLOCK IN</span>
                          <span className="text-[10px] font-semibold text-emerald-100 mt-1">Start Daily Shift</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Subtitle Under Gear Button */}
                  <div className="mt-3 text-center">
                    {(effectiveClockRecord || currentClockRecord) && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const outId = effectiveClockRecord?.id || currentClockRecord?.id;
                            if (outId) onClockOut(outId);
                          }}
                          className="px-4 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          <span>End Shift &amp; Clock Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Shift Break Presets (5 Fixed Single-Use Presets) */}
                <div className="w-full lg:w-80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Utensils className="h-3.5 w-3.5 text-blue-600" />
                      <span>Shift Break Presets ({totalBreaksTakenCount}/6 Used)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Single-use per day</span>
                  </div>

                  <div className="space-y-2">
                    {SHIFT_BREAK_PRESETS.map((preset) => {
                      const isSelected = selectedPresetKey === preset.key;
                      const isAlreadyTaken = takenPresetKeys.has(preset.key);
                      const isCurActive = activeBreak?.presetKey === preset.key;
                      const Icon = preset.icon;

                      return (
                        <button
                          key={preset.key}
                          type="button"
                          disabled={!!activeBreak || isAlreadyTaken || !!shiftPhaseInfo?.isLocked}
                          onClick={() => setSelectedPresetKey(preset.key)}
                          className={`w-full p-2.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                            isCurActive
                              ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/40 shadow-xs'
                              : isAlreadyTaken
                              ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                              : isSelected
                              ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-400/30 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-blue-200 hover:bg-slate-50'
                          } ${(activeBreak || shiftPhaseInfo?.isLocked) && !isCurActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`p-2 rounded-xl shrink-0 ${
                              isCurActive
                                ? 'bg-amber-500 text-slate-950'
                                : isAlreadyTaken
                                ? 'bg-emerald-100 text-emerald-700'
                                : isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {isAlreadyTaken ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                                <span>{preset.label}</span>
                                {isAlreadyTaken && (
                                  <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                                    Taken
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 ml-2">
                            {isCurActive ? (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black">
                                In Progress
                              </span>
                            ) : isAlreadyTaken ? (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                                Completed
                              </span>
                            ) : isSelected ? (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-600 text-white">
                                Ready
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                                Available
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Active Break Banner */}
              {activeBreak && (
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 p-4 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white/20 text-slate-950 animate-bounce">
                      <Coffee className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-black flex items-center gap-2">
                        <span>Active Break: {activeBreak.label} ({activeBreak.allocatedMinutes || 10}m allocated)</span>
                        <span className="text-[11px] font-mono bg-slate-950 text-amber-300 px-2 py-0.5 rounded-md">
                          Started: {activeBreak.takenAt}
                        </span>
                      </div>
                      <p className="text-xs text-slate-900 font-medium mt-0.5">
                        Break counter is live ({getElapsedBreakDuration()}). Click "End Break" once you are back at your station.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleStopBreak}
                    className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-amber-300 text-xs font-black rounded-xl cursor-pointer shadow-md flex items-center gap-2 transition-all shrink-0"
                  >
                    <Pause className="h-4 w-4 fill-current" />
                    <span>End Break &amp; Resume Shift</span>
                  </button>
                </div>
              )}

              {/* Active Short Leave Banner */}
              {activeShortLeave && (
                <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-4 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white/20 text-white animate-bounce">
                      <Flame className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-black flex items-center gap-2">
                        <span>Active Short Leave: {activeShortLeave.reason}</span>
                        <span className="text-[11px] font-mono bg-slate-950 text-purple-300 px-2 py-0.5 rounded-md">
                          Started: {activeShortLeave.startedAt}
                        </span>
                      </div>
                      <p className="text-xs text-purple-100 font-medium mt-0.5">
                        Short leave time is being tracked ({getElapsedShortLeaveDuration()}). Please end leave upon returning.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleStopShortLeave}
                    className="px-5 py-2.5 bg-white text-purple-900 hover:bg-purple-50 text-xs font-black rounded-xl cursor-pointer shadow-md flex items-center gap-2 transition-all shrink-0"
                  >
                    <Pause className="h-4 w-4 fill-current" />
                    <span>End Short Leave &amp; Resume Duty</span>
                  </button>
                </div>
              )}

              {/* Today's Logged Intervals & Short Leaves */}
              {effectiveClockRecord && (
                <div className="pt-4 border-t border-slate-150 space-y-4">
                  {/* Breaks Carousel */}
                  {effectiveClockRecord.breaksTaken && effectiveClockRecord.breaksTaken.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Coffee className="h-3.5 w-3.5 text-amber-600" />
                          <span>Today's Logged Rest &amp; Meal Intervals ({totalBreaksTakenCount} of 5 Completed)</span>
                        </span>
                        <span className="text-xs font-mono font-bold text-blue-700">
                          Total: {getRecordTotalBreakMinutes(effectiveClockRecord)}m {getRecordTotalOverBreakMinutes(effectiveClockRecord) > 0 && `(+${getRecordTotalOverBreakMinutes(effectiveClockRecord)}m over-break)`}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
                        {effectiveClockRecord.breaksTaken.map((b, idx) => (
                          <div
                            key={b.id || idx}
                            className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                              b.status === 'ACTIVE'
                                ? 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-300/30 animate-pulse'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-[11px] truncate">{b.label}</div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                {b.takenAt} - {b.completedAt || 'Active'}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] ${
                                b.status === 'ACTIVE' ? 'bg-amber-500 text-slate-950' : 'bg-white border border-slate-200 text-slate-800'
                              }`}>
                                {b.status === 'ACTIVE' ? 'Live' : `${b.durationMinutes || 0}m`}
                              </span>
                              {(b.overBreakMinutes || 0) > 0 && (
                                <div className="text-[9px] font-bold text-rose-600 mt-0.5 font-mono">
                                  +{b.overBreakMinutes}m over
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Short Leaves Carousel */}
                  {effectiveClockRecord.shortLeavesTaken && effectiveClockRecord.shortLeavesTaken.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Flame className="h-3.5 w-3.5 text-purple-600" />
                          <span>Today's Short Leaves ({effectiveClockRecord.shortLeavesTaken.length} sessions)</span>
                        </span>
                        <span className="text-xs font-mono font-bold text-purple-700">
                          Total Leave: {getRecordTotalShortLeaveMinutes(effectiveClockRecord)} mins
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                        {effectiveClockRecord.shortLeavesTaken.map((sl, idx) => (
                          <div
                            key={sl.id || idx}
                            className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                              sl.status === 'ACTIVE'
                                ? 'bg-purple-50 border-purple-300 text-purple-900 ring-2 ring-purple-300/30 animate-pulse'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-[11px] truncate">{sl.reason}</div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                {sl.startedAt} - {sl.completedAt || 'Active'}
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] ${
                              sl.status === 'ACTIVE' ? 'bg-purple-600 text-white' : 'bg-white border border-slate-200 text-slate-800'
                            }`}>
                              {sl.status === 'ACTIVE' ? 'Live' : `${sl.durationMinutes || 0}m`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================= BOTTOM SECTION: EASY KANBAN ATTENDANCE & REPORT BOARD ================= */}
          <AttendanceKanbanBoard
            attendance={attendance}
            dispatchers={dispatchers}
            users={users}
            isAdmin={isAdmin}
            myDispatcherId={myDispatcherId}
            currentUser={currentUser}
            currentClockRecord={currentClockRecord}
            onClockIn={onClockIn}
            onClockOut={onClockOut}
            onUpdateClockRecord={onUpdateClockRecord}
            getRecordTotalBreakMinutes={getRecordTotalBreakMinutes}
            getRecordTotalOverBreakMinutes={getRecordTotalOverBreakMinutes}
            getRecordTotalShortLeaveMinutes={getRecordTotalShortLeaveMinutes}
            formatMinutesToHoursStr={formatMinutesToHoursStr}
            getDispatcherName={getDispatcherName}
            initialMode="EVERYDAY"
          />
        </div>
      )}

      {/* VIEW 2: SUMMARY & BREAK AUDIT REPORTS */}
      {activeTab === 'SUMMARY_REPORTS' && (
        <AttendanceKanbanBoard
          attendance={attendance}
          dispatchers={dispatchers}
          users={users}
          isAdmin={isAdmin}
          myDispatcherId={myDispatcherId}
          currentUser={currentUser}
          currentClockRecord={currentClockRecord}
          onClockIn={onClockIn}
          onClockOut={onClockOut}
          onUpdateClockRecord={onUpdateClockRecord}
          getRecordTotalBreakMinutes={getRecordTotalBreakMinutes}
          getRecordTotalOverBreakMinutes={getRecordTotalOverBreakMinutes}
          getRecordTotalShortLeaveMinutes={getRecordTotalShortLeaveMinutes}
          formatMinutesToHoursStr={formatMinutesToHoursStr}
          getDispatcherName={getDispatcherName}
          initialMode="WEEKLY"
        />
      )}

      {/* ================= SHORT LEAVE MODAL ================= */}
      {showShortLeaveModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-purple-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-600 text-white">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Start Short Leave</h3>
                  <p className="text-xs text-slate-500">Prayer, urgent calls &amp; temporary departures</p>
                </div>
              </div>
              <button
                onClick={() => setShowShortLeaveModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">Select Leave Reason</label>
              
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Prayer / Namaz', icon: '🕌' },
                  { label: 'Urgent Call', icon: '📞' },
                  { label: 'Emergency / Urgent', icon: '🚨' },
                  { label: 'Personal Errand', icon: '☕' }
                ].map(r => (
                  <button
                    key={r.label}
                    type="button"
                    onClick={() => {
                      setShortLeaveReason(r.label);
                    }}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                      shortLeaveReason === r.label
                        ? 'bg-purple-50 border-purple-500 text-purple-900 ring-2 ring-purple-400/30'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-base">{r.icon}</span>
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Optional Note</label>
                <input
                  type="text"
                  placeholder="e.g. Asr / Maghrib prayer, doctor call..."
                  value={customLeaveNote}
                  onChange={e => setCustomLeaveNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowShortLeaveModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartShortLeave}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md shadow-purple-500/20"
              >
                Begin Short Leave Now
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
