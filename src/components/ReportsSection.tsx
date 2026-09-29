/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { Load, Driver, Dispatcher, ClockRecord } from '../types';
import { 
  Download, 
  FileSpreadsheet, 
  Eye, 
  BarChart, 
  Calendar, 
  Briefcase, 
  Filter, 
  Info, 
  Clock, 
  UserCheck, 
  ShieldAlert, 
  Award, 
  TrendingUp, 
  Zap, 
  Gauge, 
  Users, 
  ArrowUpRight, 
  Percent, 
  CalendarRange, 
  Activity, 
  CheckCircle,
  Building,
  Search,
  Printer,
  ChevronRight,
  User,
  Sliders
} from 'lucide-react';

interface ReportsSectionProps {
  loads: Load[];
  drivers: Driver[];
  dispatchers: Dispatcher[];
  factoringRatePercent: number;
  attendance: ClockRecord[];
}

type GroupByOption = 'driver' | 'dispatcher' | 'company' | 'owner' | 'load' | 'truck';
type ActiveReportTab = 'financial' | 'attendance' | 'performance' | 'advanced';

export default function ReportsSection({
  loads,
  drivers,
  dispatchers,
  factoringRatePercent,
  attendance
}: ReportsSectionProps) {
  
  // Tab State
  const [activeTab, setActiveTab] = useState<ActiveReportTab>('advanced');

  // --- TAB 4: ADVANCED CARRIER & BROKER FILTERS & OWNER STATEMENT ---
  const [advDriverFilter, setAdvDriverFilter] = useState<string>('ALL');
  const [advCarrierFilter, setAdvCarrierFilter] = useState<string>('ALL');
  const [advBrokerFilter, setAdvBrokerFilter] = useState<string>('ALL');
  const [advStartDate, setAdvStartDate] = useState<string>('');
  const [advEndDate, setAdvEndDate] = useState<string>('');

  // Carrier Owner Report states
  const [ownerCarrierSelect, setOwnerCarrierSelect] = useState<string>('');
  const [ownerReportStart, setOwnerReportStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [ownerReportEnd, setOwnerReportEnd] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [showOwnerReport, setShowOwnerReport] = useState<boolean>(false);

  // Derive unique brokers and unique carriers from active loads and drivers
  const uniqueCarriers = useMemo(() => {
    const set = new Set<string>();
    drivers.forEach(d => {
      if (d.workingUnderName) set.add(d.workingUnderName.trim());
    });
    return Array.from(set).filter(Boolean);
  }, [drivers]);

  const uniqueBrokers = useMemo(() => {
    const set = new Set<string>();
    loads.forEach(l => {
      if (l.broker) set.add(l.broker.trim());
    });
    return Array.from(set).filter(Boolean);
  }, [loads]);

  // Set default carrier on load
  useEffect(() => {
    if (uniqueCarriers.length > 0 && !ownerCarrierSelect) {
      setOwnerCarrierSelect(uniqueCarriers[0]);
    }
  }, [uniqueCarriers, ownerCarrierSelect]);

  // Filter loads based on advanced search criteria
  const advFilteredLoads = useMemo(() => {
    return loads.filter(l => {
      const driverObj = drivers.find(d => d.id === l.driverId);
      
      if (advDriverFilter !== 'ALL' && l.driverId !== advDriverFilter) return false;
      if (advCarrierFilter !== 'ALL' && driverObj?.workingUnderName !== advCarrierFilter) return false;
      if (advBrokerFilter !== 'ALL' && l.broker !== advBrokerFilter) return false;
      
      if (advStartDate && l.pickupDate < advStartDate) return false;
      if (advEndDate && l.pickupDate > advEndDate) return false;
      
      return true;
    });
  }, [loads, drivers, advDriverFilter, advCarrierFilter, advBrokerFilter, advStartDate, advEndDate]);

  // Compiled stats for advanced search
  const advStats = useMemo(() => {
    const totalCount = advFilteredLoads.length;
    const totalGross = advFilteredLoads.reduce((sum, l) => sum + l.loadAmount, 0);
    const avgGross = totalCount > 0 ? Math.round(totalGross / totalCount) : 0;
    const totalDispatchFees = advFilteredLoads.reduce((sum, l) => {
      return sum + Math.round((l.loadAmount * l.feePercent) / 100);
    }, 0);

    return {
      totalCount,
      totalGross,
      avgGross,
      totalDispatchFees,
      netRevenue: totalGross - totalDispatchFees
    };
  }, [advFilteredLoads]);

  // Carrier Owner Report logic
  const ownerReportData = useMemo(() => {
    if (!ownerCarrierSelect) return null;
    
    // 1. Find all drivers belonging to this carrier
    const carrierDrivers = drivers.filter(d => d.workingUnderName === ownerCarrierSelect);
    const carrierDriverIds = carrierDrivers.map(d => d.id);

    // 2. Filter loads booked for these drivers in specified date range
    const matchingLoads = loads.filter(l => {
      if (!carrierDriverIds.includes(l.driverId)) return false;
      return l.pickupDate >= ownerReportStart && l.pickupDate <= ownerReportEnd;
    });

    // 3. Compile statistics grouped by driver
    const driverBreakdown: Record<string, {
      driverName: string;
      truckNum: string;
      loadsCount: number;
      grossRevenue: number;
      dispatchFees: number;
      netPayout: number;
    }> = {};

    carrierDrivers.forEach(d => {
      driverBreakdown[d.id] = {
        driverName: d.name,
        truckNum: d.truckNum,
        loadsCount: 0,
        grossRevenue: 0,
        dispatchFees: 0,
        netPayout: 0
      };
    });

    matchingLoads.forEach(l => {
      const db = driverBreakdown[l.driverId];
      if (db) {
        const fees = Math.round((l.loadAmount * l.feePercent) / 100);
        db.loadsCount += 1;
        db.grossRevenue += l.loadAmount;
        db.dispatchFees += fees;
        db.netPayout += (l.loadAmount - fees);
      }
    });

    const totalLoads = matchingLoads.length;
    const totalGross = matchingLoads.reduce((sum, l) => sum + l.loadAmount, 0);
    const totalFees = matchingLoads.reduce((sum, l) => sum + Math.round((l.loadAmount * l.feePercent) / 100), 0);

    return {
      carrierName: ownerCarrierSelect,
      dateStart: ownerReportStart,
      dateEnd: ownerReportEnd,
      drivers: Object.values(driverBreakdown).filter(d => d.loadsCount > 0),
      totalLoads,
      totalGross,
      totalFees,
      netPayoutToOwner: totalGross - totalFees
    };
  }, [ownerCarrierSelect, ownerReportStart, ownerReportEnd, loads, drivers]);

  // ---------------------------------------------------------
  // TAB 1: FINANCIAL LEDGER STATES & FUNCTIONS
  // ---------------------------------------------------------
  const [dateFilterType, setDateFilterType] = useState<'ALL' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM'>('ALL');
  const [customStart, setCustomStart] = useState('2026-05-01');
  const [customEnd, setCustomEnd] = useState('2026-05-31');
  const [groupBy, setGroupBy] = useState<GroupByOption>('driver');

  // Math dates helper relative to local time: 2026-05-29 (with fallback to any period)
  const getFilteredLoads = () => {
    return loads.filter(l => {
      if (dateFilterType === 'ALL') return true;
      if (dateFilterType === 'DAILY') {
        return l.pickupDate === '2026-05-29';
      }
      if (dateFilterType === 'WEEKLY') {
        const d = new Date(l.pickupDate);
        return d >= new Date('2026-05-24') && d <= new Date('2026-05-30');
      }
      if (dateFilterType === 'MONTHLY') {
        return l.pickupDate.startsWith('2026-05');
      }
      if (dateFilterType === 'CUSTOM') {
        return l.pickupDate >= customStart && l.pickupDate <= customEnd;
      }
      return true;
    });
  };

  const filteredLoads = getFilteredLoads();

  const getDriverName = (id: string) => drivers.find(d => d.id === id)?.name || 'N/A';
  const getTruckNum = (id: string) => drivers.find(d => d.id === id)?.truckNum || 'N/A';
  const getDispatcherName = (id: string) => dispatchers.find(dis => dis.id === id)?.name || 'Self';
  const getDispatcherComm = (id: string) => dispatchers.find(dis => dis.id === id)?.commissionPercent || 8;

  const compileAggregations = () => {
    const aggMap: Record<string, {
      key: string;
      label: string;
      sub: string;
      gross: number;
      driverPayout: number;
      dispatchFee: number;
      factoringFee: number;
      companyShare: number;
      count: number;
    }> = {};

    filteredLoads.forEach(l => {
      let key = '';
      let label = '';
      let sub = '';

      if (groupBy === 'driver') {
        key = l.driverId;
        label = getDriverName(l.driverId);
        sub = `Truck #${getTruckNum(l.driverId)}`;
      } else if (groupBy === 'dispatcher') {
        key = l.dispatcherId;
        label = getDispatcherName(l.dispatcherId);
        sub = `Agency Desk`;
      } else if (groupBy === 'company') {
        key = 'tl_express';
        label = 'Timely Logistix';
        sub = 'Primary Carrier Fleet';
      } else if (groupBy === 'owner') {
        key = 'owner_profit';
        label = 'Timely Capital Holdings';
        sub = 'Global Investment Share';
      } else if (groupBy === 'load') {
        key = l.id;
        label = `Load Resource #${l.loadNum}`;
        sub = `RC: ${l.rateConNum}`;
      } else if (groupBy === 'truck') {
        const drvObj = drivers.find(d => d.id === l.driverId);
        key = drvObj ? drvObj.truckNum : 'unknown';
        label = `Truck Unit #${key}`;
        sub = drvObj ? drvObj.truckType : 'unknown';
      }

      const baseShareRate = (100 - l.feePercent) / 100;
      const baseShareUSD = l.loadAmount * baseShareRate;
      const deductionsAccum = l.advanceFuel + l.cashAdvance + l.repairDeduction + l.tollDeduction;
      const driverPayoutValue = baseShareUSD - deductionsAccum;

      const factorValue = l.factoringStatus === 'Factored' ? (l.loadAmount * factoringRatePercent) / 100 : 0;
      const rateComm = getDispatcherComm(l.dispatcherId);
      const dispatchValue = (l.loadAmount * rateComm) / 100;
      const companyShareValue = (l.loadAmount * l.feePercent / 100) - factorValue - dispatchValue;

      if (!aggMap[key]) {
        aggMap[key] = {
          key,
          label,
          sub,
          gross: 0,
          driverPayout: 0,
          dispatchFee: 0,
          factoringFee: 0,
          companyShare: 0,
          count: 0
        };
      }

      aggMap[key].gross += l.loadAmount;
      aggMap[key].driverPayout += driverPayoutValue;
      aggMap[key].dispatchFee += dispatchValue;
      aggMap[key].factoringFee += factorValue;
      aggMap[key].companyShare += Math.max(0, companyShareValue);
      aggMap[key].count += 1;
    });

    return Object.values(aggMap).sort((a, b) => b.gross - a.gross);
  };

  const aggregationsData = compileAggregations();

  const handleExportCSV = () => {
    let csv = `Report Type,Grouped by ${groupBy.toUpperCase()}\n`;
    csv += `Timeline,${dateFilterType}\n\n`;
    csv += `Group Name,Gross Revenue,Driver Payout,Dispatch Agency cut,Factoring Fee,Company Share,Load Count\n`;

    aggregationsData.forEach(row => {
      csv += `"${row.label} (${row.sub})",${row.gross.toFixed(2)},${row.driverPayout.toFixed(2)},${row.dispatchFee.toFixed(2)},${row.factoringFee.toFixed(2)},${row.companyShare.toFixed(2)},${row.count}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${groupBy}_financial_report_${dateFilterType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const maxGross = Math.max(...aggregationsData.map(d => d.gross), 1500);


  // ---------------------------------------------------------
  // TAB 2: TIME CLOCK & ATTENDANCE REPORTS
  // ---------------------------------------------------------
  const [attPeriodType, setAttPeriodType] = useState<'ALL' | 'DAILY' | 'WEEKLY' | 'MONTHLY'>('ALL');
  const [attSelectedDate, setAttSelectedDate] = useState('2026-05-28');
  const [attSelectedWeekStart, setAttSelectedWeekStart] = useState('2026-05-24');
  const [attSelectedMonth, setAttSelectedMonth] = useState('2026-05');
  const [attSelectedDispatcherId, setAttSelectedDispatcherId] = useState<string>('ALL');

  // Date helper to get end of week (6 days later)
  const getEndOfWeekDate = (startStr: string) => {
    const d = new Date(startStr);
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + 6);
    return d.toISOString().split('T')[0];
  };

  const isDateInWeekRange = (dateStr: string, startOfWeekStr: string) => {
    const target = new Date(dateStr);
    const start = new Date(startOfWeekStr);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return target >= start && target <= end;
  };

  // Filter Attendance Logs
  const filteredAttendance = useMemo(() => {
    return attendance.filter(a => {
      // 1. Dispatcher Filter
      if (attSelectedDispatcherId !== 'ALL' && a.dispatcherId !== attSelectedDispatcherId) {
        return false;
      }

      // 2. Period Filter
      if (attPeriodType === 'DAILY') {
        return a.date === attSelectedDate;
      }
      if (attPeriodType === 'WEEKLY') {
        return isDateInWeekRange(a.date, attSelectedWeekStart);
      }
      if (attPeriodType === 'MONTHLY') {
        return a.date.startsWith(attSelectedMonth);
      }
      return true; // 'ALL'
    });
  }, [attendance, attPeriodType, attSelectedDate, attSelectedWeekStart, attSelectedMonth, attSelectedDispatcherId]);

  // Aggregate stats for Attendance
  const attendanceStats = useMemo(() => {
    const totalShifts = filteredAttendance.length;
    const totalMinutes = filteredAttendance.reduce((acc, curr) => acc + (curr.workMinutes || 0), 0);
    const totalHours = totalMinutes / 60;
    const avgHours = totalShifts > 0 ? totalHours / totalShifts : 0;
    const lateCount = filteredAttendance.filter(a => a.isLate).length;
    const lateRate = totalShifts > 0 ? (lateCount / totalShifts) * 100 : 0;

    return {
      totalShifts,
      totalHours,
      avgHours,
      lateCount,
      lateRate
    };
  }, [filteredAttendance]);

  // Export Attendance Report
  const handleExportAttendanceCSV = () => {
    let csv = `Attendance Report,Period: ${attPeriodType}\n`;
    if (attPeriodType === 'DAILY') csv += `Selected Date,${attSelectedDate}\n`;
    if (attPeriodType === 'WEEKLY') csv += `Selected Week,${attSelectedWeekStart} to ${getEndOfWeekDate(attSelectedWeekStart)}\n`;
    if (attPeriodType === 'MONTHLY') csv += `Selected Month,${attSelectedMonth}\n`;
    csv += `Dispatcher Filter,${attSelectedDispatcherId === 'ALL' ? 'All Dispatchers' : getDispatcherName(attSelectedDispatcherId)}\n\n`;

    csv += `Date,Dispatcher Name,Clock In,Clock Out,Minutes Worked,Hours Worked,Breaks Taken (X/5),Total Break Time (min),Over-Break Time (min),Short Leave Sessions,Short Leave Time (min),Lateness,Notes\n`;

    filteredAttendance.forEach(a => {
      const dispName = getDispatcherName(a.dispatcherId);
      const hours = ((a.workMinutes || 0) / 60).toFixed(2);
      const bCount = (a.breaksTaken || []).filter(b => b.status === 'COMPLETED').length;
      const bMins = (a.breaksTaken || []).reduce((s, b) => s + (b.durationMinutes || 0), 0);
      const obMins = a.totalOverBreakMinutes || (a.breaksTaken || []).reduce((s, b) => s + (b.overBreakMinutes || 0), 0);
      const slCount = (a.shortLeavesTaken || []).filter(sl => sl.status === 'COMPLETED').length;
      const slMins = a.totalShortLeaveMinutes || (a.shortLeavesTaken || []).reduce((s, sl) => s + (sl.durationMinutes || 0), 0);
      
      csv += `${a.date},"${dispName}",${a.clockIn},${a.clockOut || 'In Progress'},${a.workMinutes || 0},${hours},"${bCount}/5",${bMins},${obMins},${slCount},${slMins},${a.isLate ? 'LATE' : 'ON-TIME'},"${a.notes || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance_report_${attPeriodType}_${attSelectedDispatcherId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatWorkedHours = (minutes?: number) => {
    if (minutes === undefined) return 'In Progress';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };


  // ---------------------------------------------------------
  // TAB 3: DISPATCHER WORK PERFORMANCE & EFFICIENCY REPORT
  // ---------------------------------------------------------
  const [perfPeriodType, setPerfPeriodType] = useState<'WEEKLY' | 'MONTHLY' | 'ALL'>('WEEKLY');
  const [perfSelectedWeekStart, setPerfSelectedWeekStart] = useState('2026-05-24');
  const [perfSelectedMonth, setPerfSelectedMonth] = useState('2026-05');

  // Compile performance data for dispatchers in chosen window
  const dispatcherPerformanceData = useMemo(() => {
    // 1. Filter loads in window
    const windowLoads = loads.filter(l => {
      if (perfPeriodType === 'WEEKLY') {
        return isDateInWeekRange(l.pickupDate, perfSelectedWeekStart);
      }
      if (perfPeriodType === 'MONTHLY') {
        return l.pickupDate.startsWith(perfSelectedMonth);
      }
      return true; // 'ALL'
    });

    // 2. Filter attendance in window
    const windowAttendance = attendance.filter(a => {
      if (perfPeriodType === 'WEEKLY') {
        return isDateInWeekRange(a.date, perfSelectedWeekStart);
      }
      if (perfPeriodType === 'MONTHLY') {
        return a.date.startsWith(perfSelectedMonth);
      }
      return true; // 'ALL'
    });

    // Build data per dispatcher
    return dispatchers.map(disp => {
      const dispLoads = windowLoads.filter(l => l.dispatcherId === disp.id);
      const dispClocks = windowAttendance.filter(a => a.dispatcherId === disp.id);

      const totalLoads = dispLoads.length;
      const totalGross = dispLoads.reduce((acc, curr) => acc + curr.loadAmount, 0);
      const commPct = disp.commissionPercent || 8;
      const commRevenue = dispLoads.reduce((acc, curr) => acc + (curr.loadAmount * (curr.feePercent || commPct)) / 100, 0);

      const totalMinutes = dispClocks.reduce((acc, curr) => acc + (curr.workMinutes || 0), 0);
      const totalHours = totalMinutes / 60;

      // Efficiency Calculations
      const loadsPerHour = totalHours > 0 ? totalLoads / totalHours : 0;
      const revenuePerHour = totalHours > 0 ? totalGross / totalHours : 0;
      const commissionPerHour = totalHours > 0 ? commRevenue / totalHours : 0;

      const totalShifts = dispClocks.length;
      const lateShifts = dispClocks.filter(c => c.isLate).length;
      const lateRate = totalShifts > 0 ? (lateShifts / totalShifts) * 100 : 0;

      return {
        dispatcher: disp,
        totalLoads,
        totalGross,
        commRevenue,
        totalHours,
        totalShifts,
        loadsPerHour,
        revenuePerHour,
        commissionPerHour,
        lateRate
      };
    }).sort((a, b) => b.totalGross - a.totalGross);
  }, [loads, attendance, dispatchers, perfPeriodType, perfSelectedWeekStart, perfSelectedMonth]);

  // Overall statistics for performance summary
  const perfOverallSummary = useMemo(() => {
    const totalLoads = dispatcherPerformanceData.reduce((acc, curr) => acc + curr.totalLoads, 0);
    const totalGross = dispatcherPerformanceData.reduce((acc, curr) => acc + curr.totalGross, 0);
    const totalComm = dispatcherPerformanceData.reduce((acc, curr) => acc + curr.commRevenue, 0);
    const totalHours = dispatcherPerformanceData.reduce((acc, curr) => acc + curr.totalHours, 0);

    const avgRevenuePerHour = totalHours > 0 ? totalGross / totalHours : 0;
    const avgLoadsPerHour = totalHours > 0 ? totalLoads / totalHours : 0;

    return {
      totalLoads,
      totalGross,
      totalComm,
      totalHours,
      avgRevenuePerHour,
      avgLoadsPerHour
    };
  }, [dispatcherPerformanceData]);

  // Export Performance CSV
  const handleExportPerformanceCSV = () => {
    let csv = `Dispatcher Efficiency & Work Performance,Period: ${perfPeriodType}\n`;
    if (perfPeriodType === 'WEEKLY') csv += `Selected Week,${perfSelectedWeekStart} to ${getEndOfWeekDate(perfSelectedWeekStart)}\n`;
    if (perfPeriodType === 'MONTHLY') csv += `Selected Month,${perfSelectedMonth}\n\n`;

    csv += `Dispatcher Name,Loads Booked,Total Gross Booked,Commission Revenue,Hours Logged,Loads Per Hour,Revenue Per Hour,Late Shifts Rate %\n`;

    dispatcherPerformanceData.forEach(row => {
      csv += `"${row.dispatcher.name}",${row.totalLoads},${row.totalGross.toFixed(2)},${row.commRevenue.toFixed(2)},${row.totalHours.toFixed(2)},${row.loadsPerHour.toFixed(2)},${row.revenuePerHour.toFixed(2)},${row.lateRate.toFixed(1)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dispatcher_performance_efficiency_${perfPeriodType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="reports_section" className="space-y-6 font-sans">
      
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 font-display flex items-center gap-2">
            <TrendingUp className="h-5.5 w-5.5 text-blue-600" />
            <span>Corporate Analytics &amp; Reports Console</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Analyze dispatcher attendance schedules, hourly productivity metrics, and custom fleet financial performance metrics.
          </p>
        </div>

        {/* Dynamic Navigation Tabs inside Reports */}
        <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex flex-wrap gap-1 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('advanced')}
            className={`cursor-pointer flex-1 md:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'advanced'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Advanced Hub</span>
          </button>
          <button
            onClick={() => setActiveTab('financial')}
            className={`cursor-pointer flex-1 md:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'financial'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <BarChart className="h-3.5 w-3.5" />
            <span>Financials</span>
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`cursor-pointer flex-1 md:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'attendance'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Attendance</span>
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`cursor-pointer flex-1 md:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'performance'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Gauge className="h-3.5 w-3.5" />
            <span>Dispatcher Efficiency</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ADVANCED CARRIER & BROKER HUB TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'advanced' && (
        <div className="space-y-6">
          {/* ADVANCED FILTERS ROW */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sliders className="h-5 w-5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Dynamic Multi-Attribute Filters</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Select Driver</label>
                <select
                  className="w-full h-10 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                  value={advDriverFilter}
                  onChange={e => setAdvDriverFilter(e.target.value)}
                >
                  <option value="ALL">All Drivers</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} (#{d.truckNum})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Select Carrier</label>
                <select
                  className="w-full h-10 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                  value={advCarrierFilter}
                  onChange={e => setAdvCarrierFilter(e.target.value)}
                >
                  <option value="ALL">All Carrier Companies</option>
                  {uniqueCarriers.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Select Broker</label>
                <select
                  className="w-full h-10 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                  value={advBrokerFilter}
                  onChange={e => setAdvBrokerFilter(e.target.value)}
                >
                  <option value="ALL">All Brokers</option>
                  {uniqueBrokers.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Start Date</label>
                <input
                  type="date"
                  className="w-full h-10 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                  value={advStartDate}
                  onChange={e => setAdvStartDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">End Date</label>
                <input
                  type="date"
                  className="w-full h-10 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                  value={advEndDate}
                  onChange={e => setAdvEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            {(advDriverFilter !== 'ALL' || advCarrierFilter !== 'ALL' || advBrokerFilter !== 'ALL' || advStartDate || advEndDate) && (
              <div className="flex justify-end mt-3">
                <button
                  onClick={() => {
                    setAdvDriverFilter('ALL');
                    setAdvCarrierFilter('ALL');
                    setAdvBrokerFilter('ALL');
                    setAdvStartDate('');
                    setAdvEndDate('');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold transition-colors"
                >
                  Reset Advanced Filters
                </button>
              </div>
            )}
          </div>

          {/* ADVANCED STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Loads Count</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-slate-900">{advStats.totalCount}</span>
                <span className="text-slate-400 text-xs font-medium">hauls</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Gross Load Amount</span>
              <div className="text-xl font-black text-slate-900 text-blue-600">${advStats.totalGross.toLocaleString()}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Avg Load Revenue</span>
              <div className="text-xl font-black text-slate-900">${advStats.avgGross.toLocaleString()}<span className="text-xs text-slate-400 font-normal">/load</span></div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Est. Dispatch Fees</span>
              <div className="text-xl font-black text-indigo-600">${advStats.totalDispatchFees.toLocaleString()}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Est. Net Driver Yield</span>
              <div className="text-xl font-black text-emerald-600">${advStats.netRevenue.toLocaleString()}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* MATCHING LOADS LIST */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden lg:col-span-2">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-slate-500" />
                  Matching Filtered Loads ({advFilteredLoads.length})
                </span>
                <span className="text-[10px] text-slate-400">Real-time Search Results</span>
              </div>

              {advFilteredLoads.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-sm font-semibold text-slate-400">No loads matched these advanced filter combinations.</p>
                  <p className="text-xs text-slate-500 mt-1">Try resetting or expanding your query date ranges.</p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead>
                      <tr className="bg-slate-100 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                        <th className="p-3">Load Info</th>
                        <th className="p-3">Carrier / Driver</th>
                        <th className="p-3">Broker / Route</th>
                        <th className="p-3 text-right">Gross</th>
                        <th className="p-3 text-right">Fee %</th>
                        <th className="p-3 text-right">Yield</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {advFilteredLoads.map(l => {
                        const drv = drivers.find(d => d.id === l.driverId);
                        const feeVal = Math.round((l.loadAmount * l.feePercent) / 100);
                        return (
                          <tr key={l.id} className="hover:bg-slate-50/50">
                            <td className="p-3">
                              <div className="font-bold text-slate-900">#{l.loadNum}</div>
                              <div className="text-[10px] text-slate-400 font-mono">Date: {l.pickupDate}</div>
                            </td>
                            <td className="p-3">
                              <div className="font-semibold text-slate-800">{drv?.name || 'N/A'}</div>
                              <div className="text-[10px] text-slate-500 font-mono">Carrier: {drv?.workingUnderName || 'N/A'}</div>
                            </td>
                            <td className="p-3">
                              <div className="font-semibold text-slate-800">{l.broker}</div>
                              <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{l.pickupLocation.split(',')[0]} → {l.deliveryLocation.split(',')[0]}</div>
                            </td>
                            <td className="p-3 text-right font-semibold text-slate-900">${l.loadAmount.toLocaleString()}</td>
                            <td className="p-3 text-right text-indigo-600 font-medium">{l.feePercent}%</td>
                            <td className="p-3 text-right font-bold text-emerald-600">${(l.loadAmount - feeVal).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* CARRIER OWNER SPECIFIC STATEMENT GENERATOR */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Building className="h-5 w-5 text-indigo-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Carrier Owners Hub</h3>
                  <p className="text-[10px] text-slate-400">Generate period statements with active driver roster.</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Select Carrier Owner Company</label>
                  <select
                    className="w-full h-10 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                    value={ownerCarrierSelect}
                    onChange={e => setOwnerCarrierSelect(e.target.value)}
                  >
                    {uniqueCarriers.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Start Date</label>
                    <input
                      type="date"
                      className="w-full h-10 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                      value={ownerReportStart}
                      onChange={e => setOwnerReportStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-400 mb-1">End Date</label>
                    <input
                      type="date"
                      className="w-full h-10 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                      value={ownerReportEnd}
                      onChange={e => setOwnerReportEnd(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  onClick={() => setShowOwnerReport(true)}
                  className="cursor-pointer w-full mt-2 h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5"
                >
                  <Printer className="h-4 w-4" />
                  Generate Owner Statement
                </button>
              </div>

              {/* DYNAMIC REAL-TIME CARRIER OWNER SUMMARY MINICARD */}
              {ownerReportData && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                  <div className="text-slate-400 font-bold font-mono text-[9px] uppercase tracking-wider">Quick Metrics</div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Active Driver Roster:</span>
                    <span className="font-extrabold text-slate-900">{ownerReportData.drivers.length} drivers</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Total Hauls Booked:</span>
                    <span className="font-extrabold text-slate-900">{ownerReportData.totalLoads} loads</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Total Gross Revenue:</span>
                    <span className="font-bold text-blue-600">${ownerReportData.totalGross.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Est. Net Carrier Share:</span>
                    <span className="font-black text-emerald-600">${ownerReportData.netPayoutToOwner.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CARRIER OWNER HIGH-FIDELITY PRINTABLE MODAL */}
          {showOwnerReport && ownerReportData && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-start justify-center p-4">
              <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-4xl shadow-2xl mt-8 mb-8 overflow-hidden text-slate-900">
                
                {/* Print Control Header bar */}
                <div className="p-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center print:hidden">
                  <div className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-700">Owner Settlement Period Statement Generator</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="cursor-pointer inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md transition-all"
                    >
                      <Printer className="h-4 w-4" />
                      Print / Download Statement
                    </button>
                    <button
                      onClick={() => setShowOwnerReport(false)}
                      className="cursor-pointer p-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg transition-colors font-bold text-xs"
                    >
                      Close Preview
                    </button>
                  </div>
                </div>

                {/* STATEMENT BODY */}
                <div className="p-8 sm:p-12 print:p-0 bg-white">
                  {/* Title Letterhead */}
                  <div className="flex justify-between items-start border-b border-slate-300 pb-6">
                    <div>
                      <h1 className="text-2xl font-black tracking-tight text-indigo-900 flex items-center gap-2.5">
                        <Building className="h-6 w-6 text-indigo-600" />
                        {ownerReportData.carrierName}
                      </h1>
                      <p className="text-xs text-slate-500 uppercase font-mono mt-1 tracking-widest">Carrier Operations Partner Statement</p>
                      <p className="text-xs text-slate-500 mt-2">Compiled on: {new Date().toISOString().split('T')[0]}</p>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-400 font-mono uppercase">Settlement Invoice</div>
                      <div className="text-xs mt-3 text-slate-600 leading-relaxed font-mono">
                        <div>Report Period:</div>
                        <div className="text-slate-900 font-bold">{ownerReportData.dateStart} to {ownerReportData.dateEnd}</div>
                        <div className="mt-1">Loads Logged: <span className="text-slate-900 font-bold">{ownerReportData.totalLoads}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* ACTIVE DRIVERS BREAKDOWN */}
                  <div className="mt-8">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono mb-3">Carrier Driver Roster Summary</h3>
                    
                    {ownerReportData.drivers.length === 0 ? (
                      <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 italic text-xs">
                        No active driver loads booked within selected range for this carrier.
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs border-collapse font-sans">
                        <thead>
                          <tr className="border-b border-slate-300 text-slate-500 font-bold uppercase tracking-wider text-[9px] font-mono">
                            <th className="pb-2 text-left">Driver Name</th>
                            <th className="pb-2 text-center">Truck Unit</th>
                            <th className="pb-2 text-center">Loads Run</th>
                            <th className="pb-2 text-right">Gross Generated</th>
                            <th className="pb-2 text-right">Dispatch Fees (deducted)</th>
                            <th className="pb-2 text-right">Net Driver Payout</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {ownerReportData.drivers.map(drv => (
                            <tr key={drv.driverName} className="text-slate-700">
                              <td className="py-3 font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-slate-400" />
                                {drv.driverName}
                              </td>
                              <td className="py-3 text-center font-mono text-slate-600">Truck #{drv.truckNum}</td>
                              <td className="py-3 text-center font-mono font-bold text-slate-800">{drv.loadsCount} loads</td>
                              <td className="py-3 text-right font-mono font-semibold text-slate-800">${drv.grossRevenue.toLocaleString()}</td>
                              <td className="py-3 text-right font-mono text-rose-600">-${drv.dispatchFees.toLocaleString()}</td>
                              <td className="py-3 text-right font-mono font-bold text-emerald-600">${drv.netPayout.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* STATEMENT TERMS AND DOCK RECEIPTS SUMMARY */}
                  <div className="mt-10 border-t border-slate-300 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-4 rounded-xl text-2xs text-slate-500 leading-relaxed max-w-sm">
                      <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">Carrier Settlement Disclosures</h4>
                      <p>
                        This statement certifies the performance, booking amounts, and dispatch fees processed under {ownerReportData.carrierName} for the designated dates. Under regular agreement, a 10% dispatch desk fee has been deducted from overall gross earnings. All figures are verified with corresponding rate confirmations on file.
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <div className="w-full sm:w-80 space-y-2.5 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Aggregate Gross Generated:</span>
                          <span className="font-bold text-slate-950 font-mono">${ownerReportData.totalGross.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Aggregate Dispatch Fees:</span>
                          <span className="font-bold text-rose-600 font-mono">-${ownerReportData.totalFees.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-base font-black border-t-2 border-double border-slate-300 pt-2 text-slate-900">
                          <span>Final Net Carrier Payout:</span>
                          <span className="font-mono text-lg text-emerald-600">${ownerReportData.netPayoutToOwner.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Signature Blocks */}
                  <div className="mt-16 grid grid-cols-2 gap-12 text-center text-[10px] text-slate-400">
                    <div className="border-t border-slate-300 pt-2">
                      <div className="font-semibold text-slate-600">Operations desk signature</div>
                      <div className="text-[8px] font-mono mt-0.5">TIMELY LOGISTIX AGENT AUTHENTICATED</div>
                    </div>
                    <div className="border-t border-slate-300 pt-2">
                      <div className="font-semibold text-slate-600">Carrier owner acknowledgment</div>
                      <div className="text-[8px] font-mono mt-0.5">SIGNATURE DATE AND RECEIVED TIMESTAMP</div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* FINANCIAL LEDGER TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'financial' && (
        <>
          {/* Query Filter configuration panel */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                1. Period Interval Target
              </label>
              <select
                className="w-full h-10 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                value={dateFilterType}
                onChange={e => setDateFilterType(e.target.value as any)}
              >
                <option value="ALL">All Records (Legacy Archive)</option>
                <option value="DAILY">Daily (Today &bull; May 29)</option>
                <option value="WEEKLY">Weekly (May 24 – May 30)</option>
                <option value="MONTHLY">Monthly (May 2026)</option>
                <option value="CUSTOM">Custom Date Window</option>
              </select>
            </div>

            {dateFilterType === 'CUSTOM' && (
              <div className="grid grid-cols-2 gap-2 col-span-1 md:col-span-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Start</label>
                  <input
                    type="date"
                    className="w-full h-10 px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl text-2xs text-slate-800"
                    value={customStart}
                    onChange={e => setCustomStart(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">End</label>
                  <input
                    type="date"
                    className="w-full h-10 px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl text-2xs text-slate-800"
                    value={customEnd}
                    onChange={e => setCustomEnd(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                2. Group / Class Filter
              </label>
              <select
                className="w-full h-10 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                value={groupBy}
                onChange={e => setGroupBy(e.target.value as GroupByOption)}
              >
                <option value="driver">Group by Driver Performance</option>
                <option value="dispatcher">Group by Dispatcher Bookings</option>
                <option value="truck">Group by Truck Units</option>
                <option value="load">Group by Resource Loads</option>
                <option value="company">Group by Operating Company</option>
                <option value="owner">Group by Capital Payout Owner</option>
              </select>
            </div>

            <div className="flex items-end max-w-xs md:ml-auto w-full">
              <button
                onClick={handleExportCSV}
                className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/10 transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export CSV Sheet</span>
              </button>
            </div>
          </div>

          {aggregationsData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Comparative Revenue Chart */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6 flex items-center gap-1.5">
                  <BarChart className="h-4.5 w-4.5 text-blue-600" />
                  <span>Comparative Revenue Chart</span>
                </h3>

                <div className="space-y-4">
                  {aggregationsData.map(row => {
                    const ratio = (row.gross / maxGross) * 100;
                    return (
                      <div key={row.key} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-800 truncate max-w-[160px]">{row.label}</span>
                          <span className="font-mono text-slate-500 font-medium">${row.gross.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${ratio}%` }}
                            className="bg-blue-500 h-full rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Analytical details ledger */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Grouped Financial Records</span>
                  <Info className="h-3.5 w-3.5 text-slate-300" />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-xs">
                    <thead>
                      <tr className="border-b border-slate-150 text-slate-450 font-bold uppercase tracking-wider bg-slate-55 pb-3.5">
                        <th className="py-3 px-4">Entity</th>
                        <th className="py-3 px-4 text-center">Loads</th>
                        <th className="py-3 px-4 text-right">Gross Booked</th>
                        <th className="py-3 px-4 text-right">Driver Share</th>
                        <th className="py-3 px-4 text-right">Dispatch Rev</th>
                        <th className="py-3 px-4 text-right">Factoring Cost</th>
                        <th className="py-3 px-4 text-right font-bold text-slate-800">Company share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {aggregationsData.map(row => (
                        <tr key={row.key} className="hover:bg-slate-50/40">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{row.label}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{row.sub}</div>
                          </td>

                          <td className="py-3 px-4 text-center font-mono text-slate-500 font-semibold">{row.count}</td>
                          
                          <td className="py-3 px-4 text-right font-mono font-medium text-slate-700">
                            ${row.gross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-medium text-blue-600">
                            ${row.driverPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          <td className="py-3 px-4 text-right font-mono text-indigo-600 font-medium">
                            ${row.dispatchFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          <td className="py-3 px-4 text-right font-mono text-amber-600">
                            ${row.factoringFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 bg-slate-50/50">
                            ${row.companyShare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Info className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <h4 className="text-xs font-semibold text-slate-600">No matching load transactions inside this interval.</h4>
            </div>
          )}
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ATTENDANCE REPORTS TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          
          {/* Filters card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Attendance Interval
              </label>
              <select
                className="w-full h-10 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                value={attPeriodType}
                onChange={e => setAttPeriodType(e.target.value as any)}
              >
                <option value="ALL">All Logged Records</option>
                <option value="DAILY">Daily Sheet</option>
                <option value="WEEKLY">Weekly Sheet</option>
                <option value="MONTHLY">Monthly Sheet</option>
              </select>
            </div>

            {/* Daily Selector */}
            {attPeriodType === 'DAILY' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Select Specific Date
                </label>
                <input
                  type="date"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none"
                  value={attSelectedDate}
                  onChange={e => setAttSelectedDate(e.target.value)}
                />
              </div>
            )}

            {/* Weekly Selector */}
            {attPeriodType === 'WEEKLY' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Week Starting Sunday
                </label>
                <input
                  type="date"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none"
                  value={attSelectedWeekStart}
                  onChange={e => setAttSelectedWeekStart(e.target.value)}
                />
              </div>
            )}

            {/* Monthly Selector */}
            {attPeriodType === 'MONTHLY' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Select Month
                </label>
                <input
                  type="month"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none"
                  value={attSelectedMonth}
                  onChange={e => setAttSelectedMonth(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Dispatcher Filter
              </label>
              <select
                className="w-full h-10 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                value={attSelectedDispatcherId}
                onChange={e => setAttSelectedDispatcherId(e.target.value)}
              >
                <option value="ALL">All Dispatchers</option>
                {dispatchers.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <button
                onClick={handleExportAttendanceCSV}
                className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/10 transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export Attendance Sheet</span>
              </button>
            </div>
          </div>

          {/* Subtitle / Range Display */}
          <div className="flex items-center gap-2 px-1 text-xs text-slate-550 font-medium">
            <Activity className="h-4 w-4 text-blue-500" />
            <span>
              Currently viewing:{' '}
              <strong className="text-slate-800 font-bold">
                {attPeriodType === 'ALL' && 'All Historical Records'}
                {attPeriodType === 'DAILY' && `Daily Sheet for ${attSelectedDate}`}
                {attPeriodType === 'WEEKLY' && `Weekly Range from ${attSelectedWeekStart} to ${getEndOfWeekDate(attSelectedWeekStart)}`}
                {attPeriodType === 'MONTHLY' && `Monthly logs for ${attSelectedMonth}`}
              </strong>
              {' '}logged by{' '}
              <strong className="text-slate-800 font-bold">
                {attSelectedDispatcherId === 'ALL' ? 'All Dispatchers' : getDispatcherName(attSelectedDispatcherId)}
              </strong>
            </span>
          </div>

          {/* Stats metrics widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
              <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Total Work Hours</div>
                <div className="text-xl font-bold text-slate-800 mt-0.5 font-display">{attendanceStats.totalHours.toFixed(1)} hrs</div>
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
              <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                <CalendarRange className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Avg Hours / Shift</div>
                <div className="text-xl font-bold text-slate-800 mt-0.5 font-display">{attendanceStats.avgHours.toFixed(1)} hrs</div>
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold ${attendanceStats.lateCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Late Arrivals</div>
                <div className="text-xl font-bold text-slate-800 mt-0.5 font-display">{attendanceStats.lateCount} shifts</div>
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold ${attendanceStats.lateRate > 20 ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                <Percent className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Lateness Rate</div>
                <div className="text-xl font-bold text-slate-800 mt-0.5 font-display">{attendanceStats.lateRate.toFixed(0)}%</div>
              </div>
            </div>
          </div>

          {/* Logs table list */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filtered Attendance Sheets ({filteredAttendance.length})</span>
              <span className="text-[10px] text-slate-400 font-mono">Real-Time Sync</span>
            </div>

            {filteredAttendance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs">
                  <thead>
                    <tr className="border-b border-slate-150 text-slate-450 font-bold uppercase tracking-wider bg-slate-55 pb-3.5">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Dispatcher Name</th>
                      <th className="py-3 px-4">Clock In</th>
                      <th className="py-3 px-4">Clock Out</th>
                      <th className="py-3 px-3 text-center">Breaks (X/5)</th>
                      <th className="py-3 px-3 text-center">Over-Break</th>
                      <th className="py-3 px-3 text-center">Short Leave</th>
                      <th className="py-3 px-4 text-center">Total Worked</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-750">
                    {filteredAttendance.map(a => {
                      const bCount = (a.breaksTaken || []).filter(b => b.status === 'COMPLETED').length;
                      const obMins = a.totalOverBreakMinutes || (a.breaksTaken || []).reduce((s, b) => s + (b.overBreakMinutes || 0), 0);
                      const slMins = a.totalShortLeaveMinutes || (a.shortLeavesTaken || []).reduce((s, sl) => s + (sl.durationMinutes || 0), 0);
                      const slCount = (a.shortLeavesTaken || []).filter(sl => sl.status === 'COMPLETED').length;

                      return (
                        <tr key={a.id} className="hover:bg-slate-50/30">
                          <td className="py-3 px-4 font-semibold text-slate-900 font-mono">{a.date}</td>
                          <td className="py-3 px-4 font-bold text-slate-800">{getDispatcherName(a.dispatcherId)}</td>
                          <td className="py-3 px-4 font-mono text-emerald-600 font-medium">{a.clockIn}</td>
                          <td className="py-3 px-4 font-mono text-slate-600">{a.clockOut || <span className="text-slate-400 italic">In Progress</span>}</td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 font-bold rounded-md text-[10px] ${
                              bCount === 5 ? 'bg-emerald-100 text-emerald-800' : bCount > 0 ? 'bg-amber-100 text-amber-800' : 'text-slate-400'
                            }`}>
                              {bCount} / 5
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono">
                            {obMins > 0 ? (
                              <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 font-bold rounded text-[10px]">
                                +{obMins}m
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center font-mono">
                            {slMins > 0 ? (
                              <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 font-bold rounded text-[10px]">
                                {slCount} ({slMins}m)
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 bg-slate-50/20">{formatWorkedHours(a.workMinutes)}</td>
                          <td className="py-3 px-4 text-center">
                            {a.isLate ? (
                              <span className="inline-flex px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-rose-50 text-rose-700 border border-rose-100">
                                LATE {a.lateMinutes ? `(+${a.lateMinutes}m)` : ''}
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                                ON-TIME
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{a.notes || <span className="text-slate-300 italic">-</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <Info className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <h4 className="text-xs font-semibold text-slate-550">No attendance entries match these filters.</h4>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* DISPATCHER PERFORMANCE & EFFICIENCY REPORT TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'performance' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Controls row */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3.5 gap-4 items-end">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Efficiency Range Period
              </label>
              <select
                className="w-full h-10 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                value={perfPeriodType}
                onChange={e => setPerfPeriodType(e.target.value as any)}
              >
                <option value="WEEKLY">Weekly Performance Log</option>
                <option value="MONTHLY">Monthly Performance Log</option>
                <option value="ALL">All Records History</option>
              </select>
            </div>

            {perfPeriodType === 'WEEKLY' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Week Start Sunday
                </label>
                <input
                  type="date"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none"
                  value={perfSelectedWeekStart}
                  onChange={e => setPerfSelectedWeekStart(e.target.value)}
                />
              </div>
            )}

            {perfPeriodType === 'MONTHLY' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Performance Month
                </label>
                <input
                  type="month"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none"
                  value={perfSelectedMonth}
                  onChange={e => setPerfSelectedMonth(e.target.value)}
                />
              </div>
            )}

            <div>
              <button
                onClick={handleExportPerformanceCSV}
                className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/10 transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export Efficiency Sheet</span>
              </button>
            </div>
          </div>

          {/* Header Range subtitle info banner */}
          <div className="flex items-center gap-2 px-1 text-xs text-slate-550 font-medium">
            <Zap className="h-4 w-4 text-blue-500" />
            <span>
              Selected Efficiency Audit Window:{' '}
              <strong className="text-slate-800 font-bold">
                {perfPeriodType === 'ALL' && 'All Loaded Records Archive'}
                {perfPeriodType === 'WEEKLY' && `Week Range ${perfSelectedWeekStart} to ${getEndOfWeekDate(perfSelectedWeekStart)}`}
                {perfPeriodType === 'MONTHLY' && `Monthly range for ${perfSelectedMonth}`}
              </strong>
            </span>
          </div>

          {/* Performance scorecard widget metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
              <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Loads Dispatched</div>
                <div className="text-xl font-bold text-slate-800 mt-0.5 font-display">{perfOverallSummary.totalLoads} bookings</div>
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
              <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Gross Bookings</div>
                <div className="text-xl font-bold text-slate-800 mt-0.5 font-display">${perfOverallSummary.totalGross.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
              <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Dispatch Commissions</div>
                <div className="text-xl font-bold text-slate-800 mt-0.5 font-display">${perfOverallSummary.totalComm.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
              <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Total Timed Hours</div>
                <div className="text-xl font-bold text-slate-800 mt-0.5 font-display">{perfOverallSummary.totalHours.toFixed(1)} hrs</div>
              </div>
            </div>
          </div>

          {/* Interactive Bento Dispatcher Scorecards Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dispatcherPerformanceData.map(row => {
              const maxDispGross = Math.max(...dispatcherPerformanceData.map(d => d.totalGross), 1);
              const percentContribution = (row.totalGross / maxDispGross) * 100;

              return (
                <div key={row.dispatcher.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all space-y-4">
                  {/* Card Header Profile */}
                  <div className="flex items-center gap-3.5 pb-3 border-b border-slate-100">
                    {row.dispatcher.profilePhoto ? (
                      <img src={row.dispatcher.profilePhoto} alt={row.dispatcher.name} className="h-11 w-11 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="h-11 w-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-extrabold text-sm shadow">
                        {row.dispatcher.name.split(' ').map(n => n.charAt(0)).join('')}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm tracking-tight">{row.dispatcher.name}</h3>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">Dispatcher Agent ID: {row.dispatcher.id}</p>
                    </div>
                  </div>

                  {/* Operational Metrics Block */}
                  <div className="grid grid-cols-2 gap-3.5 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-150">
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Gross Booking</div>
                      <div className="text-sm font-extrabold text-slate-800 mt-0.5 font-mono">${row.totalGross.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                      <div className="text-[9px] text-slate-400 mt-1">{row.totalLoads} successful loads</div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-150">
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Commission Rev</div>
                      <div className="text-sm font-extrabold text-blue-600 mt-0.5 font-mono">${row.commRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                      <div className="text-[9px] text-slate-400 mt-1">{row.dispatcher.commissionPercent}% standard fee</div>
                    </div>
                  </div>

                  {/* Hourly Efficiency index */}
                  <div className="space-y-2.5 pt-1">
                    <h4 className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">Efficiency Indices (Hourly Yields)</h4>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-550 flex items-center gap-1">
                        <Gauge className="h-3.5 w-3.5 text-blue-500" />
                        Loads / Clocked Hour:
                      </span>
                      {row.totalHours > 0 ? (
                        <span className="font-mono font-bold text-slate-800">{row.loadsPerHour.toFixed(2)} loads/hr</span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No hours logged</span>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-550 flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                        Gross Booking / Clocked Hour:
                      </span>
                      {row.totalHours > 0 ? (
                        <span className="font-mono font-bold text-slate-800">${row.revenuePerHour.toFixed(2)}/hr</span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No hours logged</span>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-550 flex items-center gap-1">
                        <Percent className="h-3.5 w-3.5 text-indigo-500" />
                        Timeliness &amp; Lateness:
                      </span>
                      {row.totalShifts > 0 ? (
                        <span className={`font-mono font-bold ${row.lateRate > 15 ? 'text-rose-600' : 'text-emerald-600'}`}>{row.lateRate.toFixed(0)}% late</span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No shifts registered</span>
                      )}
                    </div>
                  </div>

                  {/* Progress visual percent contribution */}
                  <div className="pt-2">
                    <div className="flex justify-between items-center text-[10px] mb-1">
                      <span className="font-semibold text-slate-400">RELATIVE WORKFORCE CONTRIBUTION</span>
                      <span className="font-mono font-bold text-slate-700">{percentContribution.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${percentContribution}%` }}
                        className="bg-blue-600 h-full rounded-full transition-all"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Efficiency detail data table ledger */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dispatcher Workforce Productivity Matrix</span>
              <span className="text-[10px] text-slate-400">Filtered View</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="border-b border-slate-150 text-slate-450 font-bold uppercase tracking-wider bg-slate-55 pb-3.5">
                    <th className="py-3 px-4">Dispatcher Name</th>
                    <th className="py-3 px-4 text-center">Loads Booked</th>
                    <th className="py-3 px-4 text-right">Total Gross</th>
                    <th className="py-3 px-4 text-right">Dispatch Fee Rev</th>
                    <th className="py-3 px-4 text-center">Hours Logged</th>
                    <th className="py-3 px-4 text-right">Loads / Hour</th>
                    <th className="py-3 px-4 text-right">Revenue / Hour</th>
                    <th className="py-3 px-4 text-center">Lateness Penalty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {dispatcherPerformanceData.map(row => (
                    <tr key={row.dispatcher.id} className="hover:bg-slate-50/40">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{row.dispatcher.name}</div>
                        <div className="text-[10px] text-slate-400 font-medium font-mono">{row.dispatcher.phone}</div>
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-slate-600 font-semibold">{row.totalLoads}</td>
                      
                      <td className="py-3 px-4 text-right font-mono font-medium text-slate-800">
                        ${row.totalGross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-blue-600 font-semibold">
                        ${row.commRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-semibold bg-slate-50/40">
                        {row.totalHours.toFixed(1)} hrs
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-indigo-600 font-semibold">
                        {row.totalHours > 0 ? row.loadsPerHour.toFixed(2) : '-'}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-emerald-600 font-bold">
                        {row.totalHours > 0 ? `$${row.revenuePerHour.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {row.totalShifts > 0 ? (
                          <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold rounded ${row.lateRate > 15 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                            {row.lateRate.toFixed(0)}% late
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No shifts logged</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
