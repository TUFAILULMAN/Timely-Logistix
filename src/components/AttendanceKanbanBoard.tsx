/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { ClockRecord, Dispatcher, User } from '../types';
import { parseTimeToMinutes, parseFullDateTimeToMs, normalizeTimestamp } from '../utils/timeTracker';
import {
  Calendar,
  Clock,
  Coffee,
  CheckCircle2,
  Users,
  Timer,
  ChevronLeft,
  ChevronRight,
  Search,
  FileSpreadsheet,
  Zap,
  Flame,
  Award,
  CalendarDays,
  Sparkles,
  ChevronDown,
  Layers,
  BarChart3,
  Activity,
  Play,
  Square,
  RefreshCw,
  PlusCircle,
  UserCheck,
  Filter,
  Check,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Eye,
  SlidersHorizontal,
  Lock,
  Shield
} from 'lucide-react';

interface AttendanceKanbanBoardProps {
  attendance: ClockRecord[];
  dispatchers: Dispatcher[];
  users?: User[];
  isAdmin?: boolean;
  myDispatcherId?: string;
  currentUser?: User;
  currentClockRecord?: ClockRecord | null;
  initialMode?: 'EVERYDAY' | 'WEEKLY' | 'MONTHLY';
  onClockIn?: (dispId: string, customTime?: string, customDate?: string) => void;
  onClockOut?: (recordId: string, customTime?: string) => void;
  onUpdateClockRecord?: (recordId: string, updatedFields: Partial<ClockRecord>) => Promise<void> | void;
  formatMinutesToHoursStr: (minutes?: number) => string;
  getRecordTotalBreakMinutes: (record: ClockRecord) => number;
  getRecordTotalOverBreakMinutes: (record: ClockRecord) => number;
  getRecordTotalShortLeaveMinutes: (record: ClockRecord) => number;
  getDispatcherName?: (id: string) => string;
}

export default function AttendanceKanbanBoard({
  attendance,
  dispatchers,
  users = [],
  isAdmin = true,
  myDispatcherId = '',
  currentUser,
  currentClockRecord = null,
  initialMode = 'EVERYDAY',
  onClockIn,
  onClockOut,
  onUpdateClockRecord,
  formatMinutesToHoursStr,
  getRecordTotalBreakMinutes,
  getRecordTotalOverBreakMinutes,
  getRecordTotalShortLeaveMinutes,
  getDispatcherName: customGetDispatcherName
}: AttendanceKanbanBoardProps) {
  // Super Admin check - only ADMIN role can see other team members' attendance & break details
  const isSuperAdmin = isAdmin || currentUser?.role === 'ADMIN';

  // Main view tab: TODAY_BOXES (Little boxes for today) vs ATTENDANCE_CALENDAR (Calendar filter)
  const [mainView, setMainView] = useState<'TODAY_BOXES' | 'ATTENDANCE_CALENDAR'>(
    initialMode === 'WEEKLY' || initialMode === 'MONTHLY' ? 'ATTENDANCE_CALENDAR' : 'TODAY_BOXES'
  );

  // Live second ticker for live elapsed counters
  const [liveTick, setLiveTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setLiveTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedTodayDate, setSelectedTodayDate] = useState<string>(todayStr);

  // Helper name resolver
  const getDispatcherName = (id: string) => {
    if (customGetDispatcherName) return customGetDispatcherName(id);
    const d = dispatchers.find(disp => disp.id === id || disp.username?.toLowerCase() === id?.toLowerCase());
    if (d) return d.name;
    const u = users.find(usr => usr.id === id || usr.dispatcherId === id || usr.username?.toLowerCase() === id?.toLowerCase());
    if (u) return u.name;
    if (id === 'u1' || id === 'admin') return currentUser?.name || 'Administrator';
    return id || 'Team Member';
  };

  // Compile unified roster of all team members (Dispatchers, Sales reps, Admins)
  const allTeamMembers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; role: string; username?: string; phone?: string; dispatcherId?: string }>();
    
    // 1. Add all users from state
    (users || []).forEach(u => {
      if (u && u.id) {
        map.set(u.id, {
          id: u.id,
          name: u.name || u.username || 'User',
          role: u.role || 'DISPATCHER',
          username: u.username,
          phone: u.phone,
          dispatcherId: u.dispatcherId
        });
      }
    });

    // 2. Add or merge dispatchers
    (dispatchers || []).forEach(d => {
      if (d && d.id) {
        // Look for matching user by id, dispatcherId, or username
        let existingKey: string | null = null;
        for (const [key, val] of map.entries()) {
          if (
            key === d.id || 
            val.dispatcherId === d.id || 
            (d.username && val.username?.toLowerCase() === d.username.toLowerCase())
          ) {
            existingKey = key;
            break;
          }
        }

        if (existingKey) {
          const existing = map.get(existingKey)!;
          map.set(existingKey, {
            ...existing,
            name: d.name || existing.name,
            phone: d.phone || existing.phone,
            dispatcherId: d.id,
            username: d.username || existing.username
          });
        } else {
          map.set(d.id, {
            id: d.id,
            name: d.name || 'Dispatcher',
            role: 'DISPATCHER',
            username: d.username,
            phone: d.phone,
            dispatcherId: d.id
          });
        }
      }
    });

    return Array.from(map.values());
  }, [users, dispatchers]);

  // Helper to check if a member matches the currently logged in user
  const isCurrentUserMember = (member: { id: string; dispatcherId?: string; username?: string }) => {
    if (!currentUser) return false;
    if (currentUser.id && member.id === currentUser.id) return true;
    if (currentUser.dispatcherId && (member.dispatcherId === currentUser.dispatcherId || member.id === currentUser.dispatcherId)) return true;
    if (currentUser.username && member.username && member.username.toLowerCase() === currentUser.username.toLowerCase()) return true;
    if (myDispatcherId && (member.id === myDispatcherId || member.dispatcherId === myDispatcherId)) return true;
    return false;
  };

  // Team members list for live board synchronization across all accounts
  const visibleTeamMembers = useMemo(() => {
    return allTeamMembers;
  }, [allTeamMembers]);

  // Attendance records for board
  const sanitizedAttendance = useMemo(() => {
    return attendance;
  }, [attendance]);

  // Helper for flexible member to record matching across identifiers & aliases
  const isMatchRecordToMember = (r: ClockRecord, m: { id: string; dispatcherId?: string; username?: string; name?: string }) => {
    if (!r) return false;
    const rDisp = (r.dispatcherId || '').toLowerCase().trim();
    const rDispName = (r.dispatcherName || '').toLowerCase().trim();
    const mId = (m.id || '').toLowerCase().trim();
    const mDisp = (m.dispatcherId || '').toLowerCase().trim();
    const mUser = (m.username || '').toLowerCase().trim();
    const mName = (m.name || '').toLowerCase().trim();

    const clean = (s: string) => s.replace(/^(u_|disp_)/i, '');

    if (mId && (rDisp === mId || clean(rDisp) === clean(mId))) return true;
    if (mDisp && (rDisp === mDisp || clean(rDisp) === clean(mDisp))) return true;
    if (mUser && (rDisp === mUser || clean(rDisp) === clean(mUser))) return true;
    if (mUser && mUser.includes('@') && rDisp === mUser.split('@')[0]) return true;
    if (rDisp.includes('@') && mUser && rDisp.split('@')[0] === mUser) return true;
    if (mName && rDisp === mName) return true;
    if (mName && rDispName && (rDispName === mName || rDispName.includes(mName) || mName.includes(rDispName))) return true;
    return false;
  };

  const getLiveElapsedMinutes = (inTimeStr: string, outTimeStr?: string, startTimestamp?: number, endTimestamp?: number, recDate?: string) => {
    const normStart = normalizeTimestamp(startTimestamp);
    const normEnd = normalizeTimestamp(endTimestamp);
    if (normStart) {
      const endMs = normEnd || Date.now();
      return Math.max(0, Math.floor((endMs - normStart) / 60000));
    }
    if (!inTimeStr) return 0;
    try {
      if (recDate) {
        const startMs = parseFullDateTimeToMs(recDate, inTimeStr);
        let endMs = outTimeStr ? parseFullDateTimeToMs(recDate, outTimeStr) : Date.now();
        if (outTimeStr && endMs < startMs) {
          endMs += 24 * 60 * 60 * 1000;
        }
        return Math.max(0, Math.floor((endMs - startMs) / 60000));
      }
      const inMins = parseTimeToMinutes(inTimeStr);
      let outMins: number;
      if (outTimeStr) {
        outMins = parseTimeToMinutes(outTimeStr);
      } else {
        const now = new Date();
        outMins = now.getHours() * 60 + now.getMinutes();
      }
      if (outMins >= inMins) return outMins - inMins;
      return (1440 - inMins) + outMins;
    } catch {
      return 0;
    }
  };

  // -------------------------------------------------------------
  // VIEW 1: TODAY'S LIVE UPDATES (LITTLE BOXES PER TEAM MEMBER)
  // -------------------------------------------------------------
  const todayRecords = useMemo(() => {
    return sanitizedAttendance.filter(a => {
      if (!a) return false;
      if (a.date === selectedTodayDate) return true;
      if (!a.clockOut) return true; // Include open active shift even if started prior to midnight
      return false;
    });
  }, [sanitizedAttendance, selectedTodayDate]);

  // Build a today state for each visible member
  const teamTodayBoxes = useMemo(() => {
    return visibleTeamMembers.map(member => {
      // Find today's record for this member - prioritize active uncompleted shift, then latest record
      const memberRecords = todayRecords.filter(r => isMatchRecordToMember(r, member));
      memberRecords.sort((a, b) => {
        if (!a.clockOut && b.clockOut) return -1;
        if (a.clockOut && !b.clockOut) return 1;
        const timeA = a.clockInTimestamp || parseFullDateTimeToMs(a.date, a.clockIn);
        const timeB = b.clockInTimestamp || parseFullDateTimeToMs(b.date, b.clockIn);
        return timeB - timeA;
      });

      const rec = memberRecords[0] || null;

      let status: 'WORKING' | 'ON_BREAK' | 'SHORT_LEAVE' | 'COMPLETED' | 'OFF_CLOCK' = 'OFF_CLOCK';
      let activeBreakLabel = '';
      let activeBreakElapsed = 0;
      let activeShortLeaveReason = '';
      let activeShortLeaveElapsed = 0;
      let breaksCompleted = 0;
      let totalBreakMinutes = 0;
      let overBreakMinutes = 0;
      let workedMinutes = 0;
      let isLate = false;

      if (rec) {
        isLate = !!rec.isLate;
        const bList = rec.breaksTaken || [];
        const slList = rec.shortLeavesTaken || [];
        breaksCompleted = bList.filter(b => b.status === 'COMPLETED').length;
        totalBreakMinutes = getRecordTotalBreakMinutes(rec);
        overBreakMinutes = getRecordTotalOverBreakMinutes(rec);

        const curActiveBreak = bList.find(b => b.status === 'ACTIVE');
        const curActiveSL = slList.find(sl => sl.status === 'ACTIVE');

        if (rec.clockOut) {
          status = 'COMPLETED';
          const gross = rec.workMinutes || getLiveElapsedMinutes(rec.clockIn, rec.clockOut, rec.clockInTimestamp, rec.clockOutTimestamp, rec.date);
          workedMinutes = Math.max(0, gross - totalBreakMinutes - getRecordTotalShortLeaveMinutes(rec));
        } else if (curActiveBreak) {
          status = 'ON_BREAK';
          activeBreakLabel = curActiveBreak.label;
          activeBreakElapsed = getLiveElapsedMinutes(curActiveBreak.takenAt, undefined, curActiveBreak.startedAtTimestamp, undefined, rec.date);
          workedMinutes = Math.max(0, getLiveElapsedMinutes(rec.clockIn, undefined, rec.clockInTimestamp, undefined, rec.date) - totalBreakMinutes);
        } else if (curActiveSL) {
          status = 'SHORT_LEAVE';
          activeShortLeaveReason = curActiveSL.reason;
          activeShortLeaveElapsed = getLiveElapsedMinutes(curActiveSL.startedAt, undefined, curActiveSL.startedAtTimestamp, undefined, rec.date);
          workedMinutes = Math.max(0, getLiveElapsedMinutes(rec.clockIn, undefined, rec.clockInTimestamp, undefined, rec.date) - totalBreakMinutes);
        } else {
          status = 'WORKING';
          workedMinutes = Math.max(0, getLiveElapsedMinutes(rec.clockIn, undefined, rec.clockInTimestamp, undefined, rec.date) - totalBreakMinutes - getRecordTotalShortLeaveMinutes(rec));
        }
      }

      return {
        member,
        record: rec || null,
        status,
        activeBreakLabel,
        activeBreakElapsed,
        activeShortLeaveReason,
        activeShortLeaveElapsed,
        breaksCompleted,
        totalBreakMinutes,
        overBreakMinutes,
        workedMinutes,
        isLate
      };
    });
  }, [visibleTeamMembers, todayRecords, getRecordTotalBreakMinutes, getRecordTotalOverBreakMinutes, getRecordTotalShortLeaveMinutes, liveTick]);

  // Filter for today boxes search / role (Admins only; standard users only see self)
  const [todaySearch, setTodaySearch] = useState('');
  const [todayRoleFilter, setTodayRoleFilter] = useState<'ALL' | 'DISPATCHER' | 'SALES' | 'ADMIN'>('ALL');

  const filteredTodayBoxes = useMemo(() => {
    return teamTodayBoxes.filter(box => {
      if (!isSuperAdmin) return true; // Standard user sees their own box always
      if (todayRoleFilter !== 'ALL' && box.member.role !== todayRoleFilter) return false;
      if (!todaySearch.trim()) return true;
      const q = todaySearch.toLowerCase();
      return box.member.name.toLowerCase().includes(q) || (box.member.username && box.member.username.toLowerCase().includes(q));
    });
  }, [teamTodayBoxes, todayRoleFilter, todaySearch, isSuperAdmin]);

  const todayStatusCounts = useMemo(() => {
    let working = 0, onBreak = 0, shortLeave = 0, completed = 0, offClock = 0;
    teamTodayBoxes.forEach(b => {
      if (b.status === 'WORKING') working++;
      else if (b.status === 'ON_BREAK') onBreak++;
      else if (b.status === 'SHORT_LEAVE') shortLeave++;
      else if (b.status === 'COMPLETED') completed++;
      else offClock++;
    });
    return { working, onBreak, shortLeave, completed, offClock, total: teamTodayBoxes.length };
  }, [teamTodayBoxes]);

  // -------------------------------------------------------------
  // VIEW 2: ATTENDANCE CALENDAR & DETAILED FILTER SYSTEM
  // -------------------------------------------------------------
  // If not admin, lock selected member to current user's ID
  const myPersonalMemberId = useMemo(() => {
    return currentUser?.dispatcherId || currentUser?.id || myDispatcherId || 'me';
  }, [currentUser, myDispatcherId]);

  const [selectedMemberId, setSelectedMemberId] = useState<string>(isSuperAdmin ? 'ALL' : myPersonalMemberId);
  const [calendarRoleFilter, setCalendarRoleFilter] = useState<'ALL' | 'DISPATCHER' | 'SALES' | 'ADMIN'>('ALL');
  const [currentCalMonth, setCurrentCalMonth] = useState<Date>(() => new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(todayStr);
  const [dateFilterMode, setDateFilterMode] = useState<'CALENDAR_MONTH' | 'CUSTOM_RANGE'>('CALENDAR_MONTH');
  const [tableSearch, setTableSearch] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Keep member selection in sync with privacy rules
  useEffect(() => {
    if (!isSuperAdmin) {
      setSelectedMemberId(myPersonalMemberId);
    }
  }, [isSuperAdmin, myPersonalMemberId]);

  // Month navigation
  const prevMonth = () => {
    setCurrentCalMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentCalMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Filter attendance records for Calendar View
  const calendarFilteredRecords = useMemo(() => {
    return sanitizedAttendance.filter(rec => {
      if (!rec.date) return false;

      // Filter by Member Selection (Only applicable for Admin; for non-admin, sanitizedAttendance is already strictly user-only)
      if (isSuperAdmin && selectedMemberId !== 'ALL') {
        const mem = allTeamMembers.find(m => m.id === selectedMemberId);
        const match = rec.dispatcherId === selectedMemberId || 
          (mem?.dispatcherId && rec.dispatcherId === mem.dispatcherId) ||
          (mem?.username && rec.dispatcherId === mem.username);
        if (!match) return false;
      }

      // Filter by Role (Only applicable for Admin)
      if (isSuperAdmin && calendarRoleFilter !== 'ALL') {
        const mem = allTeamMembers.find(m => m.id === rec.dispatcherId || m.dispatcherId === rec.dispatcherId || m.username === rec.dispatcherId);
        if (mem && mem.role !== calendarRoleFilter) return false;
      }

      // Filter by Date Range / Month
      if (dateFilterMode === 'CALENDAR_MONTH') {
        const rDate = new Date(rec.date + 'T12:00:00');
        if (rDate.getFullYear() !== currentCalMonth.getFullYear() || rDate.getMonth() !== currentCalMonth.getMonth()) {
          return false;
        }
        if (selectedCalendarDate && rec.date !== selectedCalendarDate) {
          return false;
        }
      } else {
        if (customStartDate && rec.date < customStartDate) return false;
        if (customEndDate && rec.date > customEndDate) return false;
      }

      // Search filter
      if (tableSearch.trim()) {
        const q = tableSearch.toLowerCase();
        const name = getDispatcherName(rec.dispatcherId).toLowerCase();
        if (!name.includes(q) && !rec.date.includes(q)) return false;
      }

      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [sanitizedAttendance, isSuperAdmin, selectedMemberId, calendarRoleFilter, dateFilterMode, currentCalMonth, selectedCalendarDate, customStartDate, customEndDate, tableSearch, allTeamMembers]);

  // Aggregate scorecard for selected member / filtered set
  const calendarScorecard = useMemo(() => {
    const totalShifts = calendarFilteredRecords.length;
    let totalGrossMins = 0;
    let totalBreakMins = 0;
    let totalOverBreakMins = 0;
    let totalBreaksCount = 0;
    let totalShortLeaveMins = 0;
    let totalShortLeaveCount = 0;
    let lateCount = 0;

    calendarFilteredRecords.forEach(r => {
      const bMins = getRecordTotalBreakMinutes(r);
      const obMins = getRecordTotalOverBreakMinutes(r);
      const slMins = getRecordTotalShortLeaveMinutes(r);
      const bCount = (r.breaksTaken || []).filter(b => b.status === 'COMPLETED').length;
      const slCount = (r.shortLeavesTaken || []).filter(sl => sl.status === 'COMPLETED').length;

      totalGrossMins += r.workMinutes || 0;
      totalBreakMins += bMins;
      totalOverBreakMins += obMins;
      totalBreaksCount += bCount;
      totalShortLeaveMins += slMins;
      totalShortLeaveCount += slCount;
      if (r.isLate) lateCount++;
    });

    const totalNetWorkMins = Math.max(0, totalGrossMins - totalBreakMins - totalShortLeaveMins);
    const onTimeScore = totalShifts > 0 ? Math.round(((totalShifts - lateCount) / totalShifts) * 100) : 100;

    return {
      totalShifts,
      totalNetWorkMins,
      totalBreakMins,
      totalOverBreakMins,
      totalBreaksCount,
      totalShortLeaveMins,
      totalShortLeaveCount,
      lateCount,
      onTimeScore
    };
  }, [calendarFilteredRecords, getRecordTotalBreakMinutes, getRecordTotalOverBreakMinutes, getRecordTotalShortLeaveMinutes]);

  // Generate calendar days for the current selected month
  const monthCalendarDays = useMemo(() => {
    const year = currentCalMonth.getFullYear();
    const month = currentCalMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: { dateStr: string; dayNum: number; inMonth: boolean; records: ClockRecord[] }[] = [];

    // Padding for previous month
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dNum = prevMonthDays - i;
      const mStr = String(month === 0 ? 12 : month).padStart(2, '0');
      const yStr = month === 0 ? year - 1 : year;
      const dStr = `${yStr}-${mStr}-${String(dNum).padStart(2, '0')}`;
      days.push({ dateStr: dStr, dayNum: dNum, inMonth: false, records: [] });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const recs = sanitizedAttendance.filter(r => {
        if (r.date !== dStr) return false;
        if (isSuperAdmin && selectedMemberId !== 'ALL') {
          const mem = allTeamMembers.find(m => m.id === selectedMemberId);
          return r.dispatcherId === selectedMemberId || (mem?.dispatcherId && r.dispatcherId === mem.dispatcherId);
        }
        return true;
      });
      days.push({ dateStr: dStr, dayNum: d, inMonth: true, records: recs });
    }

    return days;
  }, [currentCalMonth, sanitizedAttendance, isSuperAdmin, selectedMemberId, allTeamMembers]);

  // CSV Export for Calendar Logs
  const handleExportCSV = () => {
    const headers = [
      'Personnel',
      'Role',
      'Shift Date',
      'Clock In',
      'Clock Out',
      'Net Work Duration',
      'Breaks Taken (X/5)',
      'Total Break Time',
      'Over-Break Duration',
      'Short Leave Sessions',
      'Short Leave Time',
      'Timeliness'
    ];

    const rows = calendarFilteredRecords.map(r => {
      const mem = allTeamMembers.find(m => m.id === r.dispatcherId || m.dispatcherId === r.dispatcherId);
      const bCount = (r.breaksTaken || []).filter(b => b.status === 'COMPLETED').length;
      const bMins = getRecordTotalBreakMinutes(r);
      const obMins = getRecordTotalOverBreakMinutes(r);
      const slMins = getRecordTotalShortLeaveMinutes(r);
      const slCount = (r.shortLeavesTaken || []).filter(sl => sl.status === 'COMPLETED').length;
      const net = Math.max(0, (r.workMinutes || 0) - bMins - slMins);

      return [
        `"${getDispatcherName(r.dispatcherId)}"`,
        mem?.role || 'DISPATCHER',
        r.date,
        `"${r.clockIn}"`,
        `"${r.clockOut || 'In Progress'}"`,
        `"${formatMinutesToHoursStr(net)}"`,
        `"${bCount}/5"`,
        `"${formatMinutesToHoursStr(bMins)}"`,
        `"${obMins > 0 ? `${obMins}m` : '0m'}"`,
        slCount,
        `"${formatMinutesToHoursStr(slMins)}"`,
        r.isLate ? 'Late Arrival' : 'On Time'
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const fileName = isSuperAdmin
      ? `Attendance_Report_${selectedMemberId}_${currentCalMonth.toISOString().slice(0, 7)}.csv`
      : `My_Personal_Attendance_${currentUser?.name || 'User'}_${currentCalMonth.toISOString().slice(0, 7)}.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="attendance_kanban_hub" className="space-y-6">

      {/* ================= TOP NAVIGATION BAR ================= */}
      <div className="bg-white p-5 rounded-3xl border border-blue-150 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 border text-[10px] font-extrabold uppercase tracking-wider rounded-md flex items-center gap-1 ${
                isSuperAdmin
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                {isSuperAdmin ? <Sparkles className="h-3 w-3 text-blue-600" /> : <Lock className="h-3 w-3 text-emerald-600" />}
                <span>{isSuperAdmin ? 'Team Attendance Matrix' : 'Private Personal Workspace'}</span>
              </span>
              <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-extrabold uppercase tracking-wider rounded-md flex items-center gap-1 font-mono">
                <Users className="h-3 w-3 text-slate-600" />
                <span>{isSuperAdmin ? `${allTeamMembers.length} Active Team Accounts` : '🔒 Private to Your Account'}</span>
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight font-display mt-1 flex items-center gap-2">
              <span>Attendance &amp; Live Break Center</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isSuperAdmin
                ? 'Live today status boxes for each team member, unified 5-preset break system, and full attendance calendar history with member-level filtering.'
                : 'Private workstation: live shift tracking, 5 preset breaks, short leaves, and your complete personal attendance calendar history. Peer records are strictly confidential and restricted to Super Admin.'}
            </p>
          </div>

          {/* Main Mode Toggle Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs shrink-0">
            <button
              onClick={() => setMainView('TODAY_BOXES')}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
                mainView === 'TODAY_BOXES'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Today's Live Updates</span>
            </button>
            <button
              onClick={() => setMainView('ATTENDANCE_CALENDAR')}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
                mainView === 'ATTENDANCE_CALENDAR'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Attendance Calendar &amp; Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: TODAY'S LIVE UPDATES (COMPACT LITTLE BOXES FOR EACH MEMBER)       */}
      {/* ========================================================================= */}
      {mainView === 'TODAY_BOXES' && (
        <div className="space-y-6">

          {/* Quick Metrics Header Strip */}
          {isSuperAdmin ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="bg-emerald-50/80 border border-emerald-200 p-3.5 rounded-2xl flex items-center gap-3 shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-emerald-800 uppercase">Working on Duty</div>
                  <div className="text-xl font-black text-emerald-950 font-mono mt-0.5">{todayStatusCounts.working}</div>
                </div>
              </div>

              <div className="bg-amber-50/80 border border-amber-200 p-3.5 rounded-2xl flex items-center gap-3 shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                  <Coffee className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-amber-800 uppercase">On Break</div>
                  <div className="text-xl font-black text-amber-950 font-mono mt-0.5">{todayStatusCounts.onBreak}</div>
                </div>
              </div>

              <div className="bg-purple-50/80 border border-purple-200 p-3.5 rounded-2xl flex items-center gap-3 shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black">
                  <Flame className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-purple-800 uppercase">On Short Leave</div>
                  <div className="text-xl font-black text-purple-950 font-mono mt-0.5">{todayStatusCounts.shortLeave}</div>
                </div>
              </div>

              <div className="bg-blue-50/80 border border-blue-200 p-3.5 rounded-2xl flex items-center gap-3 shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-blue-800 uppercase">Shift Completed</div>
                  <div className="text-xl font-black text-blue-950 font-mono mt-0.5">{todayStatusCounts.completed}</div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-center gap-3 shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-slate-300 text-slate-700 flex items-center justify-center font-black">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-600 uppercase">Off Duty / Pending</div>
                  <div className="text-xl font-black text-slate-800 font-mono mt-0.5">{todayStatusCounts.offClock}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-indigo-500/10 border border-emerald-200/80 p-4 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 block text-sm">Personal Privacy Shield Active</span>
                  <span className="text-slate-500 text-xs">
                    You are viewing your own private workstation status. Other team member activities and records are kept confidential and restricted to Super Admin.
                  </span>
                </div>
              </div>
              <span className="px-3 py-1.5 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl font-black text-[10px] uppercase font-mono tracking-wider shrink-0 shadow-2xs">
                🔒 Private Account
              </span>
            </div>
          )}

          {/* Filter & Date Selection Bar for Today */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {isSuperAdmin ? (
                <>
                  <div className="relative flex-1 sm:w-60">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search team member..."
                      value={todaySearch}
                      onChange={e => setTodaySearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-blue-500"
                    />
                  </div>

                  {/* Role filter buttons */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
                    {(['ALL', 'DISPATCHER', 'SALES', 'ADMIN'] as const).map(role => (
                      <button
                        key={role}
                        onClick={() => setTodayRoleFilter(role)}
                        className={`px-3 py-1 rounded-lg cursor-pointer transition-all ${
                          todayRoleFilter === role ? 'bg-white text-blue-700 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {role === 'ALL' ? 'All Roles' : role === 'DISPATCHER' ? 'Dispatchers' : role === 'SALES' ? 'Sales CRM' : 'Admins'}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>My Active Workstation Desk</span>
                </div>
              )}
            </div>

            {/* Date Picker */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Date:</span>
              <input
                type="date"
                value={selectedTodayDate}
                onChange={e => setSelectedTodayDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-blue-500"
              />
              {selectedTodayDate !== todayStr && (
                <button
                  onClick={() => setSelectedTodayDate(todayStr)}
                  className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 hover:bg-blue-100 cursor-pointer"
                >
                  Today
                </button>
              )}
            </div>
          </div>

          {/* ================= LITTLE BOXES GRID ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTodayBoxes.map(({ member, record, status, activeBreakLabel, activeBreakElapsed, activeShortLeaveReason, activeShortLeaveElapsed, breaksCompleted, totalBreakMinutes, overBreakMinutes, workedMinutes, isLate }) => {
              const isCurrentUser = isCurrentUserMember(member);

              return (
                <div
                  key={member.id}
                  className={`bg-white rounded-2xl border transition-all shadow-2xs hover:shadow-md p-4 space-y-3 relative overflow-hidden flex flex-col justify-between ${
                    status === 'WORKING'
                      ? 'border-emerald-300 ring-1 ring-emerald-400/20'
                      : status === 'ON_BREAK'
                      ? 'border-amber-400 ring-2 ring-amber-400/30 bg-amber-50/20'
                      : status === 'SHORT_LEAVE'
                      ? 'border-purple-300 ring-1 ring-purple-400/20 bg-purple-50/20'
                      : status === 'COMPLETED'
                      ? 'border-blue-200'
                      : 'border-slate-200 opacity-90'
                  }`}
                >
                  {/* Top Bar: Member Avatar + Name + Role + Status Badge */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 shadow-2xs ${
                          status === 'WORKING'
                            ? 'bg-emerald-600 text-white'
                            : status === 'ON_BREAK'
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : status === 'SHORT_LEAVE'
                            ? 'bg-purple-600 text-white'
                            : status === 'COMPLETED'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {member.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-black text-slate-900 truncate font-display flex items-center gap-1.5">
                            <span className="truncate">{member.name}</span>
                            {isCurrentUser && (
                              <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 text-[9px] font-black rounded uppercase">You</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                            <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">
                              {member.role === 'SALES' ? 'Sales CRM' : member.role === 'ADMIN' ? 'Super Admin' : 'Dispatcher'}
                            </span>
                            {isLate && (
                              <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded text-[9px] font-bold">Late</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Live Status Pill */}
                      <div className="shrink-0">
                        {status === 'WORKING' && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md flex items-center gap-1 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            <span>Working</span>
                          </span>
                        )}
                        {status === 'ON_BREAK' && (
                          <span className="px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black rounded-md flex items-center gap-1 shadow-xs animate-bounce">
                            <Coffee className="h-3 w-3" />
                            <span>Break</span>
                          </span>
                        )}
                        {status === 'SHORT_LEAVE' && (
                          <span className="px-2 py-0.5 bg-purple-600 text-white text-[10px] font-extrabold rounded-md flex items-center gap-1">
                            <Flame className="h-3 w-3" />
                            <span>Leave</span>
                          </span>
                        )}
                        {status === 'COMPLETED' && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-extrabold rounded-md flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            <span>Finished</span>
                          </span>
                        )}
                        {status === 'OFF_CLOCK' && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-md">
                            Off Clock
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Active Break / Short Leave Live Alert Banner */}
                    {status === 'ON_BREAK' && (
                      <div className="mt-2.5 p-2 bg-amber-100/90 border border-amber-300 rounded-xl text-[11px] font-bold text-amber-950 flex items-center justify-between">
                        <span className="truncate flex items-center gap-1">
                          <Coffee className="h-3 w-3 text-amber-700 shrink-0" />
                          <span className="truncate">{activeBreakLabel || 'Break'}</span>
                        </span>
                        <span className="font-mono text-xs font-black bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded shadow-2xs">
                          {activeBreakElapsed}m
                        </span>
                      </div>
                    )}

                    {status === 'SHORT_LEAVE' && (
                      <div className="mt-2.5 p-2 bg-purple-100 border border-purple-300 rounded-xl text-[11px] font-bold text-purple-950 flex items-center justify-between">
                        <span className="truncate flex items-center gap-1">
                          <Flame className="h-3 w-3 text-purple-700 shrink-0" />
                          <span className="truncate">{activeShortLeaveReason || 'Leave'}</span>
                        </span>
                        <span className="font-mono text-xs font-black bg-purple-600 text-white px-1.5 py-0.5 rounded shadow-2xs">
                          {activeShortLeaveElapsed}m
                        </span>
                      </div>
                    )}

                    {/* Little 2x2 Micro-Stats Box */}
                    <div className="grid grid-cols-2 gap-1.5 mt-2.5 pt-2.5 border-t border-slate-100 text-[11px] font-mono">
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-150">
                        <span className="text-[9px] text-slate-400 block uppercase font-sans font-bold">Check-In</span>
                        <span className="font-bold text-slate-800 text-xs">
                          {record ? record.clockIn : '—'}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-150">
                        <span className="text-[9px] text-slate-400 block uppercase font-sans font-bold">
                          {status === 'COMPLETED' ? 'Check-Out' : 'Net Duty'}
                        </span>
                        <span className="font-bold text-blue-700 text-xs">
                          {status === 'COMPLETED' ? record?.clockOut : formatMinutesToHoursStr(workedMinutes)}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-150">
                        <span className="text-[9px] text-slate-400 block uppercase font-sans font-bold">Breaks (X/5)</span>
                        <span className="font-bold text-amber-700 text-xs">
                          {breaksCompleted}/5 <span className="text-[10px] text-slate-400 font-normal">({totalBreakMinutes}m)</span>
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-150">
                        <span className="text-[9px] text-slate-400 block uppercase font-sans font-bold">Over-Break</span>
                        <span className={`font-bold text-xs ${overBreakMinutes > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                          {overBreakMinutes > 0 ? `+${overBreakMinutes}m` : '0m'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 text-[10px] truncate">
                      {member.phone || member.username || 'Active User'}
                    </span>

                    {/* Quick Clock-In if admin or self */}
                    {status === 'OFF_CLOCK' && (isAdmin || isCurrentUser) && onClockIn && (
                      <button
                        onClick={() => onClockIn(member.dispatcherId || member.id)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[10px] cursor-pointer shadow-2xs flex items-center gap-1"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        <span>Clock In</span>
                      </button>
                    )}

                    {status !== 'OFF_CLOCK' && status !== 'COMPLETED' && (isAdmin || isCurrentUser) && onClockOut && record && (
                      <button
                        onClick={() => onClockOut(record.id)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-[10px] cursor-pointer shadow-2xs flex items-center gap-1"
                      >
                        <Square className="h-3 w-3 fill-current" />
                        <span>Clock Out</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredTodayBoxes.length === 0 && (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
              <Users className="h-8 w-8 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-700">No team members match this search</div>
              <p className="text-xs text-slate-400">Try adjusting your role filter or search term above.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: ATTENDANCE CALENDAR & DETAILED FILTER (ALL DATA SHIFTED HERE)     */}
      {/* ========================================================================= */}
      {mainView === 'ATTENDANCE_CALENDAR' && (
        <div className="space-y-6">

          {/* MASTER FILTER CONTROL BAR */}
          <div className="bg-white p-6 rounded-3xl border border-blue-150 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900 font-display flex items-center gap-2">
                  <SlidersHorizontal className="h-4.5 w-4.5 text-blue-600" />
                  <span>{isSuperAdmin ? 'Attendance History & Break Ledger Filter' : 'My Personal Attendance & Break Ledger'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isSuperAdmin
                    ? 'Select any team member to inspect their complete calendar records, shift hours, break audits, over-breaks, and punctuality.'
                    : 'Inspect your complete shift calendar records, duty hours, 5-preset break audits, over-breaks, and punctuality. Your data is strictly private.'}
                </p>
              </div>

              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm flex items-center gap-2 shrink-0 transition-all"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>{isSuperAdmin ? 'Export Filtered CSV' : 'Export My Attendance CSV'}</span>
              </button>
            </div>

            {/* Selection Options Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-150">
              {/* 1. Member Selector Dropdown */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
                  <Users className="h-3 w-3 text-blue-600" />
                  <span>{isSuperAdmin ? 'Team Member Selection' : 'Account Owner'}</span>
                </label>
                {isSuperAdmin ? (
                  <select
                    value={selectedMemberId}
                    onChange={e => setSelectedMemberId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-blue-500"
                  >
                    <option value="ALL">👥 All Team Members ({allTeamMembers.length})</option>
                    {allTeamMembers.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role === 'SALES' ? 'Sales' : m.role === 'ADMIN' ? 'Super Admin' : 'Dispatcher'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-black text-slate-700 flex items-center gap-1.5 cursor-not-allowed">
                    <Lock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{currentUser?.name || 'My Account'} (Private Ledger)</span>
                  </div>
                )}
              </div>

              {/* 2. Role Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
                  <Filter className="h-3 w-3 text-blue-600" />
                  <span>Role Filter</span>
                </label>
                {isSuperAdmin ? (
                  <select
                    value={calendarRoleFilter}
                    onChange={e => setCalendarRoleFilter(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-blue-500"
                  >
                    <option value="ALL">All Roles (Dispatchers &amp; Sales)</option>
                    <option value="DISPATCHER">Dispatchers Only</option>
                    <option value="SALES">Sales CRM Team Only</option>
                    <option value="ADMIN">Super Admins Only</option>
                  </select>
                ) : (
                  <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-1.5 cursor-not-allowed">
                    <Shield className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span>{currentUser?.role === 'SALES' ? 'Sales CRM' : currentUser?.role === 'ADMIN' ? 'Super Admin' : 'Dispatcher'} (Locked)</span>
                  </div>
                )}
              </div>

              {/* 3. Date Mode Toggle */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
                  <CalendarDays className="h-3 w-3 text-blue-600" />
                  <span>Date Range Mode</span>
                </label>
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setDateFilterMode('CALENDAR_MONTH')}
                    className={`flex-1 py-1 rounded-lg cursor-pointer transition-all ${
                      dateFilterMode === 'CALENDAR_MONTH' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setDateFilterMode('CUSTOM_RANGE')}
                    className={`flex-1 py-1 rounded-lg cursor-pointer transition-all ${
                      dateFilterMode === 'CUSTOM_RANGE' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Custom Dates
                  </button>
                </div>
              </div>

              {/* 4. Custom Dates or Search */}
              {dateFilterMode === 'CUSTOM_RANGE' ? (
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">From / To Dates</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={e => setCustomStartDate(e.target.value)}
                      className="w-1/2 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-800 font-bold"
                    />
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={e => setCustomEndDate(e.target.value)}
                      className="w-1/2 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-800 font-bold"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Search in Records</label>
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder={isSuperAdmin ? "Search member or date..." : "Search shift date or time..."}
                      value={tableSearch}
                      onChange={e => setTableSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ================= MEMBER SCORECARD BANNER ================= */}
          <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-6 rounded-3xl shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-400/30 text-blue-300 font-black text-lg flex items-center justify-center">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-mono uppercase text-blue-300 tracking-wider">
                    {isSuperAdmin
                      ? (selectedMemberId === 'ALL' ? 'Consolidated Team Performance' : `Personnel Scorecard • ${getDispatcherName(selectedMemberId)}`)
                      : `🔒 Private Performance Scorecard • Confidential`}
                  </div>
                  <h3 className="text-xl font-black tracking-tight font-display text-white">
                    {isSuperAdmin
                      ? (selectedMemberId === 'ALL' ? 'All Team Attendance & Break Metrics' : getDispatcherName(selectedMemberId))
                      : (currentUser?.name ? `${currentUser.name} — Attendance & Break Performance` : 'My Attendance & Break Performance')}
                  </h3>
                </div>
              </div>

              {dateFilterMode === 'CALENDAR_MONTH' && (
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold font-mono">
                  <button onClick={prevMonth} className="hover:text-blue-300 p-1 cursor-pointer">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span>{currentCalMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                  <button onClick={nextMonth} className="hover:text-blue-300 p-1 cursor-pointer">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Shifts Logged</div>
                <div className="text-xl font-black font-mono text-white mt-0.5">{calendarScorecard.totalShifts}</div>
              </div>

              <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Net Duty Hours</div>
                <div className="text-xl font-black font-mono text-emerald-400 mt-0.5">{formatMinutesToHoursStr(calendarScorecard.totalNetWorkMins)}</div>
              </div>

              <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Breaks Taken</div>
                <div className="text-xl font-black font-mono text-amber-400 mt-0.5">
                  {calendarScorecard.totalBreaksCount} <span className="text-xs text-slate-400 font-normal">({formatMinutesToHoursStr(calendarScorecard.totalBreakMins)})</span>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Over-Break Time</div>
                <div className={`text-xl font-black font-mono mt-0.5 ${calendarScorecard.totalOverBreakMins > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {calendarScorecard.totalOverBreakMins > 0 ? `${calendarScorecard.totalOverBreakMins}m` : '0m'}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Short Leaves</div>
                <div className="text-xl font-black font-mono text-purple-400 mt-0.5">{formatMinutesToHoursStr(calendarScorecard.totalShortLeaveMins)}</div>
              </div>

              <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                <div className="text-[10px] font-bold text-slate-400 uppercase">On-Time Score</div>
                <div className="text-xl font-black font-mono text-cyan-400 mt-0.5">{calendarScorecard.onTimeScore}%</div>
              </div>
            </div>
          </div>

          {/* ================= CALENDAR MONTH GRID (IF MONTHLY MODE) ================= */}
          {dateFilterMode === 'CALENDAR_MONTH' && (
            <div className="bg-white p-5 rounded-3xl border border-blue-150 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2 font-display">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span>Monthly Attendance Calendar ({currentCalMonth.toLocaleString('default', { month: 'long', year: 'numeric' })})</span>
                  </h4>
                  <p className="text-xs text-slate-500">Click any day to filter records below or click "Show All Month" to view full logs.</p>
                </div>

                {selectedCalendarDate && (
                  <button
                    onClick={() => setSelectedCalendarDate(null)}
                    className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 hover:bg-blue-100 cursor-pointer"
                  >
                    Clear Filter ({selectedCalendarDate})
                  </button>
                )}
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Day Cells */}
              <div className="grid grid-cols-7 gap-2">
                {monthCalendarDays.map((cell, idx) => {
                  const hasRecords = cell.records.length > 0;
                  const isSelected = selectedCalendarDate === cell.dateStr;
                  const isToday = cell.dateStr === todayStr;

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={!cell.inMonth}
                      onClick={() => setSelectedCalendarDate(isSelected ? null : cell.dateStr)}
                      className={`min-h-[72px] p-2 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        !cell.inMonth
                          ? 'bg-slate-50/50 border-slate-100 text-slate-300 cursor-not-allowed opacity-40'
                          : isSelected
                          ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-400/40 shadow-xs'
                          : hasRecords
                          ? 'bg-white border-blue-200 hover:border-blue-400 hover:shadow-2xs'
                          : 'bg-slate-50/70 border-slate-200 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-mono font-bold ${
                          isToday
                            ? 'w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]'
                            : cell.inMonth
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }`}>
                          {cell.dayNum}
                        </span>

                        {hasRecords && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        )}
                      </div>

                      {cell.inMonth && hasRecords && (
                        <div className="space-y-0.5 mt-1">
                          <div className="text-[10px] font-mono font-bold text-blue-700 truncate">
                            {cell.records.length} {cell.records.length === 1 ? 'Shift' : 'Shifts'}
                          </div>
                          <div className="text-[9px] font-mono text-slate-500 truncate">
                            {formatMinutesToHoursStr(cell.records.reduce((sum, r) => sum + (r.workMinutes || 0), 0))}
                          </div>
                        </div>
                      )}

                      {cell.inMonth && !hasRecords && (
                        <span className="text-[9px] text-slate-400 font-mono italic">No shift</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= DETAILED SHIFT & BREAK AUDIT TABLE ================= */}
          <div className="bg-white rounded-3xl border border-blue-150 shadow-sm overflow-hidden space-y-4">
            <div className="p-5 border-b border-slate-150 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2 font-display">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span>Detailed Shift Logs &amp; 5-Break Audit Breakdown</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing {calendarFilteredRecords.length} recorded shift entries matching your filter criteria.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-wider">
                    <th className="px-4 py-3">Team Member</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Shift Date</th>
                    <th className="px-4 py-3">Clock In / Out</th>
                    <th className="px-4 py-3">Net Duty Time</th>
                    <th className="px-4 py-3">Breaks (X/5)</th>
                    <th className="px-4 py-3">Break Duration</th>
                    <th className="px-4 py-3">Over-Break</th>
                    <th className="px-4 py-3">Short Leaves</th>
                    <th className="px-4 py-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {calendarFilteredRecords.map(rec => {
                    const mem = allTeamMembers.find(m => m.id === rec.dispatcherId || m.dispatcherId === rec.dispatcherId);
                    const bCount = (rec.breaksTaken || []).filter(b => b.status === 'COMPLETED').length;
                    const bMins = getRecordTotalBreakMinutes(rec);
                    const obMins = getRecordTotalOverBreakMinutes(rec);
                    const slMins = getRecordTotalShortLeaveMinutes(rec);
                    const slCount = (rec.shortLeavesTaken || []).filter(sl => sl.status === 'COMPLETED').length;
                    const net = Math.max(0, (rec.workMinutes || 0) - bMins - slMins);
                    const isExpanded = expandedLogId === rec.id;

                    return (
                      <React.Fragment key={rec.id}>
                        <tr className={`hover:bg-blue-50/40 transition-colors ${isExpanded ? 'bg-blue-50/30' : ''}`}>
                          <td className="px-4 py-3 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                                {getDispatcherName(rec.dispatcherId).charAt(0)}
                              </div>
                              <span className="truncate">{getDispatcherName(rec.dispatcherId)}</span>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md uppercase font-mono">
                              {mem?.role === 'SALES' ? 'Sales CRM' : mem?.role === 'ADMIN' ? 'Super Admin' : 'Dispatcher'}
                            </span>
                          </td>

                          <td className="px-4 py-3 font-mono font-bold text-slate-700">
                            {rec.date}
                          </td>

                          <td className="px-4 py-3 font-mono text-slate-800">
                            <span>{rec.clockIn}</span>
                            <span className="text-slate-400 mx-1">&rarr;</span>
                            <span className={rec.clockOut ? 'text-slate-800' : 'text-emerald-600 font-bold'}>
                              {rec.clockOut || 'Live on Duty'}
                            </span>
                          </td>

                          <td className="px-4 py-3 font-mono font-bold text-blue-700">
                            {formatMinutesToHoursStr(net)}
                          </td>

                          <td className="px-4 py-3 font-mono font-bold text-amber-700">
                            {bCount}/5
                          </td>

                          <td className="px-4 py-3 font-mono text-slate-700">
                            {formatMinutesToHoursStr(bMins)}
                          </td>

                          <td className="px-4 py-3 font-mono">
                            {obMins > 0 ? (
                              <span className="text-rose-600 font-bold">+{obMins}m</span>
                            ) : (
                              <span className="text-slate-400">0m</span>
                            )}
                          </td>

                          <td className="px-4 py-3 font-mono text-purple-700">
                            {slCount > 0 ? `${slCount} (${formatMinutesToHoursStr(slMins)})` : 'None'}
                          </td>

                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setExpandedLogId(isExpanded ? null : rec.id)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 text-[10px] font-bold rounded-lg cursor-pointer transition-all"
                            >
                              {isExpanded ? 'Hide' : 'Audit Logs'}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Break & Short Leave Inspection Drawer */}
                        {isExpanded && (
                          <tr className="bg-blue-50/50">
                            <td colSpan={10} className="px-6 py-4 space-y-3">
                              <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-2xs space-y-3">
                                <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                  <Coffee className="h-3.5 w-3.5 text-amber-600" />
                                  <span>Shift Break &amp; Short Leave Intervals Breakdown</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
                                  {(rec.breaksTaken || []).map((b, bIdx) => (
                                    <div key={bIdx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px]">
                                      <div className="font-bold text-slate-900 truncate">{b.label}</div>
                                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                        {b.takenAt} - {b.completedAt || 'Active'}
                                      </div>
                                      <div className="flex items-center justify-between mt-1 text-[10px] font-mono">
                                        <span className="font-bold text-slate-700">{b.durationMinutes || 0} mins</span>
                                        {(b.overBreakMinutes || 0) > 0 && (
                                          <span className="text-rose-600 font-bold">+{b.overBreakMinutes}m over</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}

                                  {(rec.shortLeavesTaken || []).map((sl, slIdx) => (
                                    <div key={slIdx} className="bg-purple-50 p-2.5 rounded-xl border border-purple-200 text-[11px]">
                                      <div className="font-bold text-purple-900 truncate">Leave: {sl.reason}</div>
                                      <div className="text-[10px] text-purple-600 font-mono mt-0.5">
                                        {sl.startedAt} - {sl.completedAt || 'Active'}
                                      </div>
                                      <div className="mt-1 text-[10px] font-mono font-bold text-purple-800">
                                        {sl.durationMinutes || 0} mins
                                      </div>
                                    </div>
                                  ))}

                                  {(!rec.breaksTaken || rec.breaksTaken.length === 0) && (!rec.shortLeavesTaken || rec.shortLeavesTaken.length === 0) && (
                                    <div className="col-span-5 text-slate-400 italic text-xs py-2">
                                      No break intervals or short leaves were logged during this shift.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {calendarFilteredRecords.length === 0 && (
              <div className="p-12 text-center space-y-2">
                <Clock className="h-8 w-8 text-slate-300 mx-auto" />
                <div className="text-sm font-bold text-slate-700">No shift records found for this selection</div>
                <p className="text-xs text-slate-400">Select another member or adjust the date range above.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
