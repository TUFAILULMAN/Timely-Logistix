/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Driver, Load, DriverSettlement, CompanySettings, User, DriverAdvance, Invoice, Dispatcher, CarrierOrOwner, FinancialTransaction } from '../types';
import DispatchInvoicer from './DispatchInvoicer';
import { getSortedDriversByFrequency } from '../utils/driverSort';
import { 
  FileText, 
  CheckCircle, 
  XCircle,
  DollarSign, 
  Calendar, 
  TrendingUp, 
  Percent, 
  Trash2, 
  Plus, 
  X, 
  Printer, 
  ArrowRight, 
  Search, 
  Building, 
  Truck, 
  Sliders,
  Check,
  FileSpreadsheet,
  Coins
} from 'lucide-react';

interface DriverSettlementsProps {
  currentUser: User;
  drivers: Driver[];
  loads: Load[];
  settlements: DriverSettlement[];
  companySettings: CompanySettings;
  driverAdvances?: DriverAdvance[];
  invoices?: Invoice[];
  dispatchers?: Dispatcher[];
  carriers?: CarrierOrOwner[];
  financialTransactions?: FinancialTransaction[];
  onAddSettlement: (settlement: Omit<DriverSettlement, 'id'>) => void;
  onEditSettlement: (id: string, updated: Partial<DriverSettlement>) => void;
  onDeleteSettlement: (id: string) => void;
  onAddAdvance?: (adv: Omit<DriverAdvance, 'id'>) => Promise<void> | void;
  onAddInvoice?: (invoice: Omit<Invoice, 'id'>) => Promise<void>;
  onEditInvoice?: (id: string, updated: Partial<Invoice>) => Promise<void>;
  onDeleteInvoice?: (id: string) => Promise<void>;
  onUpdateCompanySettings?: (settings: Partial<CompanySettings>) => Promise<void>;
  onEditLoad?: (id: string, updated: Partial<Load>) => Promise<void>;
}

export default function DriverSettlements({
  currentUser,
  drivers,
  loads,
  settlements = [],
  companySettings,
  driverAdvances = [],
  invoices = [],
  dispatchers = [],
  carriers = [],
  financialTransactions = [],
  onAddSettlement,
  onEditSettlement,
  onDeleteSettlement,
  onAddAdvance,
  onAddInvoice = async () => {},
  onEditInvoice = async () => {},
  onDeleteInvoice = async () => {},
  onUpdateCompanySettings = async () => {},
  onEditLoad = async () => {}
}: DriverSettlementsProps) {
  const isAdmin = currentUser.role === 'ADMIN';

  // Section switcher: SETTLEMENTS vs DISPATCH_INVOICES
  const [activePayoutSection, setActivePayoutSection] = useState<'SETTLEMENTS' | 'DISPATCH_INVOICES'>('SETTLEMENTS');

  // Sort drivers by frequency (most-used drivers on top)
  const sortedDrivers = useMemo(() => {
    return getSortedDriversByFrequency(drivers, loads, financialTransactions, driverAdvances, settlements);
  }, [drivers, loads, financialTransactions, driverAdvances, settlements]);

  // State: Tab sub-controls / list filters
  const [selectedDriverFilter, setSelectedDriverFilter] = useState<string>('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('ALL');

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [calcMode, setCalcMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  
  const [formDriverId, setFormDriverId] = useState<string>('');
  const [formStartDate, setFormStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [formEndDate, setFormEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [formPayoutRate, setFormPayoutRate] = useState<number>(80);
  const [formNotes, setFormNotes] = useState<string>('');
  
  // Custom manual state
  const [manualGross, setManualGross] = useState<number>(0);
  const [manualDeductions, setManualDeductions] = useState<number>(0);
  const [manualDesc, setManualDesc] = useState<string>('');

  // Auto calculation selections
  const [selectedLoadIds, setSelectedLoadIds] = useState<string[]>([]);

  // Active Payout Modal for detail viewing / printing
  const [activeReceiptSettlement, setActiveReceiptSettlement] = useState<DriverSettlement | null>(null);

  // Derive driver object from ID helper
  const getDriverName = (driverId: string) => {
    return drivers.find(d => d.id === driverId)?.name || 'Unknown Driver';
  };

  const getDriverObj = (driverId: string) => {
    return drivers.find(d => d.id === driverId);
  };

  // Loads already linked in any settlement
  const settlementsLoadIds = useMemo(() => {
    const ids: string[] = [];
    settlements.forEach(s => {
      if (s.loadIds && s.loadIds.length > 0) {
        ids.push(...s.loadIds);
      }
    });
    return ids;
  }, [settlements]);

  // Find loads for active auto-calc selection
  const availableLoadsForDriver = useMemo(() => {
    if (!formDriverId) return [];
    return loads.filter(l => {
      // Must be driver's loads
      if (l.driverId !== formDriverId) return false;
      // Must match date range
      if (l.pickupDate < formStartDate || l.pickupDate > formEndDate) return false;
      // Must not be already in another settlement
      if (settlementsLoadIds.includes(l.id)) return false;
      return true;
    });
  }, [loads, formDriverId, formStartDate, formEndDate, settlementsLoadIds]);

  // Update selected load ids when available loads change or driver is selected
  React.useEffect(() => {
    setSelectedLoadIds(availableLoadsForDriver.map(l => l.id));
    const selectedDriver = drivers.find(d => d.id === formDriverId);
    if (selectedDriver) {
      setFormPayoutRate(selectedDriver.defaultPayoutPercent || 80);
    }
  }, [availableLoadsForDriver, formDriverId, drivers]);

  // Calculations for current selection
  const currentCalcStats = useMemo(() => {
    const selectedLoads = availableLoadsForDriver.filter(l => selectedLoadIds.includes(l.id));
    const gross = selectedLoads.reduce((sum, l) => sum + l.loadAmount, 0);
    const companyFeePercent = Math.max(0, 100 - formPayoutRate);
    const companyShareTotal = Math.round((gross * companyFeePercent) / 100);
    const driverShareGross = gross - companyShareTotal;
    const deductions = selectedLoads.reduce((sum, l) => {
      return sum + l.advanceFuel + l.cashAdvance + l.repairDeduction + l.tollDeduction;
    }, 0);
    const netPayout = driverShareGross - deductions;
    return {
      gross,
      companyFeePercent,
      companyShareTotal,
      driverShareGross,
      deductions,
      netPayout,
      selectedLoads
    };
  }, [availableLoadsForDriver, selectedLoadIds, formPayoutRate]);

  // Handle Form Submission
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDriverId) {
      alert('Please select a driver.');
      return;
    }

    const driverName = getDriverName(formDriverId);
    const todayStr = new Date().toISOString().split('T')[0];

    if (calcMode === 'AUTO') {
      const companyFeePercent = 100 - formPayoutRate;
      onAddSettlement({
        driverId: formDriverId,
        driverName,
        settlementDate: todayStr,
        startDate: formStartDate,
        endDate: formEndDate,
        grossEarnings: currentCalcStats.driverShareGross,
        deductions: currentCalcStats.deductions,
        netPayout: currentCalcStats.netPayout,
        paymentStatus: 'Unpaid',
        loadIds: selectedLoadIds,
        payoutRate: formPayoutRate,
        companyFeePercent,
        totalGrossLoads: currentCalcStats.gross,
        notes: formNotes || `Auto-calculated settlement (${formPayoutRate}% Driver Share / ${companyFeePercent}% Company Fee). Included ${selectedLoadIds.length} loads.`,
        isManual: false
      });
    } else {
      onAddSettlement({
        driverId: formDriverId,
        driverName,
        settlementDate: todayStr,
        startDate: formStartDate,
        endDate: formEndDate,
        grossEarnings: manualGross,
        deductions: manualDeductions,
        netPayout: manualGross - manualDeductions,
        paymentStatus: 'Unpaid',
        loadIds: [],
        payoutRate: formPayoutRate,
        companyFeePercent: 100 - formPayoutRate,
        totalGrossLoads: manualGross,
        notes: formNotes || `Manual Settlement: ${manualDesc}`,
        isManual: true,
        manualDetails: {
          grossAmount: manualGross,
          deductionsAmount: manualDeductions,
          description: manualDesc
        }
      });
    }

    setIsAdding(false);
    resetForm();
  };

  const resetForm = () => {
    setFormDriverId('');
    setFormNotes('');
    setManualGross(0);
    setManualDeductions(0);
    setManualDesc('');
    setSelectedLoadIds([]);
  };

  // Toggle Single Load Checked/Unchecked
  const toggleLoadSelection = (loadId: string) => {
    if (selectedLoadIds.includes(loadId)) {
      setSelectedLoadIds(prev => prev.filter(id => id !== loadId));
    } else {
      setSelectedLoadIds(prev => [...prev, loadId]);
    }
  };

  // Filter Settlements
  const filteredSettlements = useMemo(() => {
    return settlements.filter(s => {
      if (selectedDriverFilter !== 'ALL' && s.driverId !== selectedDriverFilter) return false;
      if (paymentStatusFilter !== 'ALL' && s.paymentStatus !== paymentStatusFilter) return false;
      return true;
    });
  }, [settlements, selectedDriverFilter, paymentStatusFilter]);

  // Dynamic Print PDF
  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div id="driver_settlements_container" className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/40 pb-5">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2.5 font-display">
            <DollarSign className="h-6 w-6 text-sky-400" />
            Driver Payouts &amp; Settlements Hub
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Calculate earnings, log corporate driver advances, compile detailed run records, and manage Dispatch Invoices in two separate sections.
          </p>
        </div>
        
        {isAdmin && activePayoutSection === 'SETTLEMENTS' && (
          <button
            onClick={() => setIsAdding(true)}
            className="cursor-pointer inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-[11px] uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-lg hover:shadow-sky-500/10 transition-all duration-150 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Create Settlement Statement
          </button>
        )}
      </div>

      {/* SECTION NAV TABS: 2 SEPARATE SECTIONS UNDER DRIVER PAYOUTS */}
      <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
        <button
          type="button"
          onClick={() => setActivePayoutSection('SETTLEMENTS')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activePayoutSection === 'SETTLEMENTS'
              ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Coins className="h-4 w-4" />
          <span>1. Driver Settlements &amp; Pay Stubs</span>
        </button>

        <button
          type="button"
          onClick={() => setActivePayoutSection('DISPATCH_INVOICES')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activePayoutSection === 'DISPATCH_INVOICES'
              ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>2. Dispatch Invoices ({invoices.length})</span>
        </button>
      </div>

      {/* SECTION 2: DISPATCH INVOICES VIEW */}
      {activePayoutSection === 'DISPATCH_INVOICES' ? (
        <DispatchInvoicer
          currentUser={currentUser}
          loads={loads}
          dispatchers={dispatchers}
          carriers={carriers}
          drivers={drivers}
          companySettings={companySettings}
          onUpdateCompanySettings={onUpdateCompanySettings}
          onEditLoad={onEditLoad}
          invoices={invoices}
          onAddInvoice={onAddInvoice}
          onEditInvoice={onEditInvoice}
          onDeleteInvoice={onDeleteInvoice}
        />
      ) : (
        <>
      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Total Settlements Compiled</p>
            <h3 className="text-lg font-black text-slate-100 mt-1">{settlements.length}</h3>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Paid Statements</p>
            <h3 className="text-lg font-black text-emerald-400 mt-1">
              {settlements.filter(s => s.paymentStatus === 'Paid').length}
            </h3>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
            <XCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Unpaid Payouts</p>
            <h3 className="text-lg font-black text-rose-400 mt-1">
              {settlements.filter(s => s.paymentStatus === 'Unpaid').length}
            </h3>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Pending Payout Sum</p>
            <h3 className="text-lg font-black text-slate-100 mt-1">
              ${settlements.filter(s => s.paymentStatus === 'Unpaid').reduce((sum, s) => sum + s.netPayout, 0).toLocaleString()}
            </h3>
          </div>
        </div>

      </div>

      {/* FILTERING HEADER */}
      <div className="bg-slate-900/20 border border-slate-800/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
        
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 shrink-0">
          <Sliders className="h-4 w-4 text-sky-500" />
          <span>Filter Ledger:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Select Driver</label>
            <select
              value={selectedDriverFilter}
              onChange={(e) => setSelectedDriverFilter(e.target.value)}
              className="w-full bg-slate-900 text-slate-200 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-sky-500 focus:outline-none"
            >
              <option value="ALL">All Active Fleet Drivers</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.truckNum})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Settlement Paid Status</label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full bg-slate-900 text-slate-200 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-sky-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Paid">Paid Only</option>
              <option value="Unpaid">Unpaid Only</option>
            </select>
          </div>
        </div>

      </div>

      {/* SETTLEMENTS LEDGER TABLE */}
      <div className="bg-slate-950 border border-slate-800/60 rounded-2xl overflow-hidden">
        
        {filteredSettlements.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">No driver settlements recorded</p>
            <p className="text-xs text-slate-500 mt-1">Change filters or create a new statement above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  <th className="p-4">Settlement ID</th>
                  <th className="p-4">Driver &amp; Info</th>
                  <th className="p-4">Date Range</th>
                  <th className="p-4 text-right">Gross Pay</th>
                  <th className="p-4 text-right">Deductions</th>
                  <th className="p-4 text-right text-sky-400 font-extrabold">Net Driver Payout</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredSettlements.map(s => {
                  const driverObj = getDriverObj(s.driverId);
                  return (
                    <tr key={s.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-400">{s.id}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-100">{s.driverName}</div>
                        {driverObj && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {driverObj.driverType === 'OWNER_OPERATOR' ? 'Owner Operator' : 'Company Driver'} (Truck #{driverObj.truckNum})
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-slate-400 font-mono">
                        {s.isManual ? 'Manual Entry' : `${s.startDate} to ${s.endDate}`}
                      </td>
                      <td className="p-4 text-right font-semibold text-emerald-400">
                        +${s.grossEarnings.toLocaleString()}
                      </td>
                      <td className="p-4 text-right font-semibold text-rose-400">
                        -${s.deductions.toLocaleString()}
                      </td>
                      <td className="p-4 text-right font-black text-slate-100 text-sm">
                        ${s.netPayout.toLocaleString()}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                          s.paymentStatus === 'Paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {s.paymentStatus}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          
                          {/* PRINT Payout Statement */}
                          <button
                            onClick={() => setActiveReceiptSettlement(s)}
                            className="cursor-pointer p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-sky-400 transition-colors"
                            title="Print Payout Statement / Download PDF"
                          >
                            <Printer className="h-4 w-4" />
                          </button>

                          {/* Toggle Paid/Unpaid (Admin-only) */}
                          {isAdmin && (
                            <button
                              onClick={() => {
                                const newStatus = s.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid';
                                onEditSettlement(s.id, { paymentStatus: newStatus });
                              }}
                              className={`cursor-pointer p-1.5 rounded-lg transition-colors ${
                                s.paymentStatus === 'Paid'
                                  ? 'hover:bg-rose-500/15 text-slate-400 hover:text-rose-400'
                                  : 'hover:bg-emerald-500/15 text-slate-400 hover:text-emerald-400'
                              }`}
                              title={s.paymentStatus === 'Paid' ? 'Mark as Unpaid' : 'Mark as Paid'}
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}

                          {/* Delete Settlement Statement */}
                          {isAdmin && (
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete settlement statement ${s.id}?`)) {
                                  onDeleteSettlement(s.id);
                                }
                              }}
                              className="cursor-pointer p-1.5 hover:bg-rose-500/15 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* CREATE SETTLEMENT DRAWER / DIALOG MODAL */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
            
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/60 sticky top-0 z-10">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-sky-400" />
                  New Settlement Statement
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Define driver payouts, run totals, and deduct fuel advances.</p>
              </div>
              <button
                onClick={() => setIsAdding(false)}
                className="cursor-pointer p-1.5 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-5">
              
              {/* Select Driver & Mode Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Select Fleet Driver</label>
                  <select
                    required
                    value={formDriverId}
                    onChange={(e) => setFormDriverId(e.target.value)}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="">-- Choose a Driver --</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.truckNum})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Calculation Engine</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setCalcMode('AUTO')}
                      className={`py-1.5 text-center text-xs font-extrabold rounded-lg transition-all ${
                        calcMode === 'AUTO'
                          ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-250'
                      }`}
                    >
                      Auto-Calc Loads
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcMode('MANUAL')}
                      className={`py-1.5 text-center text-xs font-extrabold rounded-lg transition-all ${
                        calcMode === 'MANUAL'
                          ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-250'
                      }`}
                    >
                      Manual Details
                    </button>
                  </div>
                </div>
              </div>

              {/* DATE RANGE CONTROLS (Always needed for period report) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Trip Start Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="date"
                      required
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs font-semibold focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Trip End Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="date"
                      required
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs font-semibold focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* AUTO-CALCULATE METHOD PANEL */}
              {calcMode === 'AUTO' && (
                <div className="space-y-4 border-t border-slate-800/80 pt-4">
                  
                  {/* Select loads table */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Unsettled Loads in Date Range</span>
                      <span className="text-[10px] font-mono text-sky-400">{availableLoadsForDriver.length} found</span>
                    </div>
                    
                    {availableLoadsForDriver.length === 0 ? (
                      <div className="p-6 bg-slate-950 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500 leading-relaxed">
                        No unsettled loads found for this driver inside selected dates.<br/>
                        <span className="text-[10px] text-slate-600 font-mono">Verify dates or ensure Loads exist under this driver.</span>
                      </div>
                    ) : (
                      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead className="bg-slate-900 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono sticky top-0 z-10">
                            <tr>
                              <th className="p-2.5 w-10 text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedLoadIds.length === availableLoadsForDriver.length}
                                  onChange={() => {
                                    if (selectedLoadIds.length === availableLoadsForDriver.length) {
                                      setSelectedLoadIds([]);
                                    } else {
                                      setSelectedLoadIds(availableLoadsForDriver.map(l => l.id));
                                    }
                                  }}
                                  className="rounded text-sky-500 focus:ring-sky-500 h-3.5 w-3.5"
                                />
                              </th>
                              <th className="p-2.5">Load #</th>
                              <th className="p-2.5">Broker &amp; Route</th>
                              <th className="p-2.5 text-right">Gross</th>
                              <th className="p-2.5 text-right text-blue-400">Fee ({100 - formPayoutRate}%)</th>
                              <th className="p-2.5 text-right text-emerald-400">Driver ({formPayoutRate}%)</th>
                              <th className="p-2.5 text-right text-rose-400">Advances</th>
                              <th className="p-2.5 text-right">Net</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/50 text-[11px]">
                            {availableLoadsForDriver.map(l => {
                              const dTotal = l.advanceFuel + l.cashAdvance + l.repairDeduction + l.tollDeduction;
                              const compFee = Math.round((l.loadAmount * (100 - formPayoutRate)) / 100);
                              const drvGross = l.loadAmount - compFee;
                              const net = drvGross - dTotal;
                              return (
                                <tr key={l.id} className="hover:bg-slate-900/40">
                                  <td className="p-2.5 text-center">
                                    <input
                                      type="checkbox"
                                      checked={selectedLoadIds.includes(l.id)}
                                      onChange={() => toggleLoadSelection(l.id)}
                                      className="rounded text-sky-500 focus:ring-sky-500 h-3.5 w-3.5 cursor-pointer"
                                    />
                                  </td>
                                  <td className="p-2.5 font-mono font-bold text-slate-400">{l.loadNum}</td>
                                  <td className="p-2.5">
                                    <div className="font-semibold text-slate-200">{l.broker}</div>
                                    <div className="text-[9.5px] text-slate-500 mt-0.5">{l.pickupLocation.split(',')[0]} → {l.deliveryLocation.split(',')[0]}</div>
                                  </td>
                                  <td className="p-2.5 text-right font-mono font-bold text-slate-200">${l.loadAmount.toLocaleString()}</td>
                                  <td className="p-2.5 text-right font-mono text-blue-400">${compFee.toLocaleString()}</td>
                                  <td className="p-2.5 text-right font-mono text-emerald-400">${drvGross.toLocaleString()}</td>
                                  <td className="p-2.5 text-right font-mono text-rose-400">-${dTotal.toLocaleString()}</td>
                                  <td className="p-2.5 text-right font-mono font-bold text-slate-100">${net.toLocaleString()}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Payout rate presets & custom slider */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Split Contract Rate</label>
                        <p className="text-[10.5px] text-slate-500 mt-0.5">Driver payout share % vs Company fee %</p>
                      </div>
                      
                      {/* Presets */}
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { drv: 78, comp: 22 },
                          { drv: 80, comp: 20 },
                          { drv: 85, comp: 15 },
                          { drv: 90, comp: 10 },
                          { drv: 100, comp: 0 }
                        ].map(p => (
                          <button
                            key={p.drv}
                            type="button"
                            onClick={() => setFormPayoutRate(p.drv)}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                              formPayoutRate === p.drv
                                ? 'bg-sky-500/20 text-sky-400 border-sky-500/50'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            {p.drv}% / {p.comp}%
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-1">
                      <div className="flex-1">
                        <input
                          type="range"
                          min="20"
                          max="100"
                          step="1"
                          value={formPayoutRate}
                          onChange={(e) => setFormPayoutRate(Number(e.target.value))}
                          className="w-full accent-sky-500 cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-center bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1">
                          <span className="text-[9px] uppercase text-emerald-400 font-mono block">Driver</span>
                          <span className="font-mono font-black text-slate-100 text-xs">{formPayoutRate}%</span>
                        </div>
                        <div className="text-center bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1">
                          <span className="text-[9px] uppercase text-blue-400 font-mono block">Company</span>
                          <span className="font-mono font-black text-slate-100 text-xs">{100 - formPayoutRate}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Calculated summary cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/60 text-center">
                      <div className="text-[8.5px] uppercase font-extrabold text-slate-500 font-mono tracking-widest">Gross Loads</div>
                      <div className="font-extrabold text-slate-200 mt-1">${currentCalcStats.gross.toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/60 text-center">
                      <div className="text-[8.5px] uppercase font-extrabold text-blue-400 font-mono tracking-widest">Company Fee ({100 - formPayoutRate}%)</div>
                      <div className="font-bold text-blue-400 mt-1">${currentCalcStats.companyShareTotal.toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/60 text-center">
                      <div className="text-[8.5px] uppercase font-extrabold text-emerald-400 font-mono tracking-widest">Driver Gross ({formPayoutRate}%)</div>
                      <div className="font-bold text-emerald-400 mt-1">${currentCalcStats.driverShareGross.toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/60 text-center">
                      <div className="text-[8.5px] uppercase font-extrabold text-rose-400 font-mono tracking-widest">Advances</div>
                      <div className="font-bold text-rose-400 mt-1">-${currentCalcStats.deductions.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-500/10 to-sky-500/15 border border-sky-500/25 p-4 rounded-xl flex justify-between items-center">
                    <span className="text-xs font-bold text-sky-400">Net Calculated Payout to Driver:</span>
                    <span className="text-xl font-black text-white font-mono">${currentCalcStats.netPayout.toLocaleString()}</span>
                  </div>

                </div>
              )}

              {/* MANUAL DETAILS METHOD PANEL */}
              {calcMode === 'MANUAL' && (
                <div className="space-y-4 border-t border-slate-800 pt-4">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Manual Gross Earnings ($)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={manualGross}
                        onChange={(e) => setManualGross(Number(e.target.value))}
                        className="w-full bg-slate-950 text-slate-250 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold focus:ring-1 focus:ring-sky-500 focus:outline-none"
                        placeholder="e.g. 5200"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Manual Total Deductions ($)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={manualDeductions}
                        onChange={(e) => setManualDeductions(Number(e.target.value))}
                        className="w-full bg-slate-950 text-slate-250 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold focus:ring-1 focus:ring-sky-500 focus:outline-none"
                        placeholder="e.g. 450"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Deduction / Trip Details Description</label>
                    <input
                      type="text"
                      required={calcMode === 'MANUAL'}
                      value={manualDesc}
                      onChange={(e) => setManualDesc(e.target.value)}
                      className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      placeholder="e.g. Dry Van Haul Flat rate minus $100 fueling fee"
                    />
                  </div>

                  <div className="bg-gradient-to-r from-blue-500/10 to-sky-500/15 border border-sky-500/25 p-4 rounded-xl flex justify-between items-center">
                    <span className="text-xs font-bold text-sky-400">Manual Net Payout:</span>
                    <span className="text-xl font-black text-white font-mono">${(manualGross - manualDeductions).toLocaleString()}</span>
                  </div>

                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Statement Notes / Remarks</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none h-16 resize-none"
                  placeholder="Optional billing remarks, payment instructions or bank wire details..."
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="cursor-pointer px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cursor-pointer bg-sky-500 hover:bg-sky-400 text-white font-extrabold text-xs px-5 py-2 rounded-xl shadow-lg transition-colors"
                >
                  Confirm &amp; Log Settlement
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* PRINT RECEIPT HIGH-FIDELITY MODAL */}
      {activeReceiptSettlement && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-start justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl mt-8 mb-8 overflow-hidden">
            
            {/* Modal Controls Bar */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/60 sticky top-0 z-10 print:hidden">
              <span className="text-xs font-bold text-slate-400">Statement Preview / Print Hub</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintReceipt}
                  className="cursor-pointer inline-flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg shadow-md transition-colors"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print / Save as PDF
                </button>
                <button
                  onClick={() => setActiveReceiptSettlement(null)}
                  className="cursor-pointer p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* HIGH FIDELITY STATEMENT PRINT AREA */}
            <div id="print_driver_settlement_receipt" className="bg-white p-8 sm:p-12 text-slate-900 font-sans min-h-[11in] print:p-0">
              
              {/* Header Letterhead */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-300 pb-6">
                <div>
                  <div className="flex items-center gap-3">
                    {companySettings.logoUrl ? (
                      <img 
                        src={companySettings.logoUrl} 
                        alt="Company Logo" 
                        className="h-12 max-w-40 object-contain rounded-lg" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="h-10 w-10 bg-sky-600 rounded-xl flex items-center justify-center text-white font-black font-mono text-lg">
                        {companySettings.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
                        {companySettings.name}
                      </h2>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">{companySettings.tagline || 'Dispatch Fleet Operations'}</p>
                    </div>
                  </div>
                  
                  <div className="text-xs text-slate-600 mt-4 leading-relaxed space-y-0.5 font-sans">
                    <div className="whitespace-pre-line">{companySettings.address}</div>
                    <div>Phone: {companySettings.phone}</div>
                    <div>Email: {companySettings.email}</div>
                  </div>
                </div>

                <div className="sm:text-right">
                  <h1 className="text-xl font-black uppercase tracking-wider text-slate-400 font-mono">
                    Payout Receipt
                  </h1>
                  <div className="mt-4 text-xs space-y-1 font-mono text-slate-600">
                    <div>Statement ID: <strong className="text-slate-900 font-extrabold">{activeReceiptSettlement.id}</strong></div>
                    <div>Date Processed: {activeReceiptSettlement.settlementDate}</div>
                    {!activeReceiptSettlement.isManual && (
                      <div>Period: <span className="text-slate-900 font-bold">{activeReceiptSettlement.startDate} to {activeReceiptSettlement.endDate}</span></div>
                    )}
                    <div>Status: <span className={`font-bold uppercase ${activeReceiptSettlement.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-rose-600'}`}>{activeReceiptSettlement.paymentStatus}</span></div>
                  </div>
                </div>
              </div>

              {/* Driver Meta Data Grid */}
              {(() => {
                const compRate = activeReceiptSettlement.companyFeePercent ?? (100 - (activeReceiptSettlement.payoutRate ?? 78));
                const drvRate = activeReceiptSettlement.payoutRate ?? (100 - compRate);
                const statementLoads = loads.filter(l => activeReceiptSettlement.loadIds?.includes(l.id));

                const totalGrossBilled = activeReceiptSettlement.totalGrossLoads ?? (
                  statementLoads.length > 0 
                    ? statementLoads.reduce((sum, l) => sum + l.loadAmount, 0)
                    : Math.round(((activeReceiptSettlement.grossEarnings || 0) * 100) / (drvRate || 1))
                );

                const totalCompanyFee = Math.round((totalGrossBilled * compRate) / 100);
                const totalDriverGrossShare = activeReceiptSettlement.grossEarnings || (totalGrossBilled - totalCompanyFee);
                const totalDeductions = activeReceiptSettlement.deductions;
                const totalNetPayout = activeReceiptSettlement.netPayout;

                return (
                  <>
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl my-6 text-xs leading-relaxed grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono text-[9px]">Driver Information</h4>
                        <div className="font-black text-slate-900 text-sm">{activeReceiptSettlement.driverName}</div>
                        {getDriverObj(activeReceiptSettlement.driverId) && (
                          <div className="text-slate-600 font-medium space-y-0.5 mt-1">
                            <div>Truck Number: <span className="font-bold text-slate-800">{getDriverObj(activeReceiptSettlement.driverId)?.truckNum}</span></div>
                            <div>Truck Type: {getDriverObj(activeReceiptSettlement.driverId)?.truckType}</div>
                            <div>Relationship: {getDriverObj(activeReceiptSettlement.driverId)?.driverType === 'OWNER_OPERATOR' ? 'Owner Operator' : 'Company Driver'}</div>
                          </div>
                        )}
                      </div>

                      <div className="sm:text-right flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono text-[9px]">Contract Split Split Structure</h4>
                          <div className="font-black text-slate-900 text-sm">
                            Driver Share: {drvRate}% | Company Fee: {compRate}%
                          </div>
                          <div className="text-slate-500 mt-1 font-mono text-[10px]">
                            Total Hauls Count: {statementLoads.length || (activeReceiptSettlement.isManual ? 1 : 0)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Print CSS rule to ensure clean output on print */}
                    <style>{`
                      @media print {
                        body * {
                          visibility: hidden;
                        }
                        #print_driver_settlement_receipt, #print_driver_settlement_receipt * {
                          visibility: visible;
                        }
                        #print_driver_settlement_receipt {
                          position: absolute;
                          left: 0;
                          top: 0;
                          width: 100%;
                          margin: 0;
                          padding: 1rem !important;
                          background: white !important;
                          color: black !important;
                        }
                      }
                    `}</style>

                    {/* Loads Table breakdown (if Auto) */}
                    {!activeReceiptSettlement.isManual && statementLoads.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Dispatched Trips &amp; Earnings Breakdown</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left font-sans text-xs border-collapse border border-slate-200">
                            <thead>
                              <tr className="border-b-2 border-slate-300 text-slate-700 font-bold uppercase tracking-wider text-[9px] font-mono bg-slate-100">
                                <th className="py-2.5 px-2 text-left">Load #</th>
                                <th className="py-2.5 px-2 text-left">Route &amp; Broker</th>
                                <th className="py-2.5 px-2 text-center">Pickup Date</th>
                                <th className="py-2.5 px-2 text-right">Gross Load</th>
                                <th className="py-2.5 px-2 text-right text-blue-800 bg-blue-50/50">Company ({compRate}%)</th>
                                <th className="py-2.5 px-2 text-right text-emerald-800 bg-emerald-50/50">Driver ({drvRate}%)</th>
                                <th className="py-2.5 px-2 text-right text-rose-700">Fuel / Advances</th>
                                <th className="py-2.5 px-2 text-right font-black text-slate-900">Net Payout</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {statementLoads.map(l => {
                                const loadCompFee = Math.round((l.loadAmount * compRate) / 100);
                                const loadDrvShare = l.loadAmount - loadCompFee;
                                const loadAdv = l.advanceFuel + l.cashAdvance + l.repairDeduction + l.tollDeduction;
                                const loadNetPayout = loadDrvShare - loadAdv;
                                return (
                                  <tr key={l.id} className="text-slate-800 hover:bg-slate-50/50">
                                    <td className="py-2 px-2 font-mono font-bold text-slate-900">{l.loadNum}</td>
                                    <td className="py-2 px-2">
                                      <div className="font-semibold text-slate-900">{l.pickupLocation.split(',')[0]} → {l.deliveryLocation.split(',')[0]}</div>
                                      <div className="text-[9.5px] text-slate-500">Broker: {l.broker}</div>
                                    </td>
                                    <td className="py-2 px-2 text-center font-mono text-slate-600">{l.pickupDate}</td>
                                    <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">${l.loadAmount.toLocaleString()}</td>
                                    <td className="py-2 px-2 text-right font-mono font-semibold text-blue-900 bg-blue-50/30">${loadCompFee.toLocaleString()}</td>
                                    <td className="py-2 px-2 text-right font-mono font-bold text-emerald-800 bg-emerald-50/30">${loadDrvShare.toLocaleString()}</td>
                                    <td className="py-2 px-2 text-right font-mono font-semibold text-rose-600">{loadAdv > 0 ? `-$${loadAdv.toLocaleString()}` : '$0'}</td>
                                    <td className="py-2 px-2 text-right font-mono font-black text-slate-950">${loadNetPayout.toLocaleString()}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="border-t-2 border-slate-300 font-bold text-xs bg-slate-100 font-mono text-slate-900">
                                <td colSpan={3} className="py-2.5 px-2 uppercase tracking-wider text-right font-sans">Total Load Board Summary:</td>
                                <td className="py-2.5 px-2 text-right">${totalGrossBilled.toLocaleString()}</td>
                                <td className="py-2.5 px-2 text-right text-blue-900">${totalCompanyFee.toLocaleString()}</td>
                                <td className="py-2.5 px-2 text-right text-emerald-800">${totalDriverGrossShare.toLocaleString()}</td>
                                <td className="py-2.5 px-2 text-right text-rose-600">-${totalDeductions.toLocaleString()}</td>
                                <td className="py-2.5 px-2 text-right text-slate-950 font-black text-sm">${totalNetPayout.toLocaleString()}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Manual details block */}
                    {activeReceiptSettlement.isManual && activeReceiptSettlement.manualDetails && (
                      <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <h4 className="text-[10px] font-mono uppercase font-bold text-slate-500 mb-1">Manual Entry Details</h4>
                        <div className="text-xs text-slate-800 font-medium">
                          {activeReceiptSettlement.manualDetails.description}
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                          <div>Gross Settled: <strong className="text-slate-900 font-bold">${activeReceiptSettlement.manualDetails.grossAmount.toLocaleString()}</strong></div>
                          <div>Deductions Applied: <strong className="text-rose-600 font-bold">-${activeReceiptSettlement.manualDetails.deductionsAmount.toLocaleString()}</strong></div>
                        </div>
                      </div>
                    )}

                    {/* DUAL PARTY FINANCIAL SUMMARY (COMPANY & DRIVER) */}
                    <div className="mt-8 border-t-2 border-slate-200 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* COMPANY SUMMARY */}
                      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs font-sans">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-blue-950 font-mono mb-2 pb-1.5 border-b border-blue-200 flex justify-between items-center">
                          <span>Company Financial Summary</span>
                          <span className="bg-blue-200/60 text-blue-900 px-2 py-0.5 rounded text-[9px]">Fee Share: {compRate}%</span>
                        </div>
                        <div className="space-y-2 text-slate-700">
                          <div className="flex justify-between">
                            <span>Total Gross Billed Hauls:</span>
                            <span className="font-mono font-bold text-slate-900">${totalGrossBilled.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Driver Gross Share Allocation ({drvRate}%):</span>
                            <span className="font-mono font-medium">-${totalDriverGrossShare.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-blue-200/80 font-bold text-blue-950 text-sm">
                            <span>Company Net Fee Retained ({compRate}%):</span>
                            <span className="font-mono text-blue-900 font-black">${totalCompanyFee.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* DRIVER PAYOUT SUMMARY */}
                      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-xs font-sans">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-950 font-mono mb-2 pb-1.5 border-b border-emerald-200 flex justify-between items-center">
                          <span>Driver Payout Statement</span>
                          <span className="bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded text-[9px]">Driver Share: {drvRate}%</span>
                        </div>
                        <div className="space-y-2 text-slate-700">
                          <div className="flex justify-between">
                            <span>Total Driver Gross Share ({drvRate}%):</span>
                            <span className="font-mono font-bold text-slate-900">${totalDriverGrossShare.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-rose-600">
                            <span>Less Fuel &amp; Cash Advances Deducted:</span>
                            <span className="font-mono font-bold">-${totalDeductions.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-emerald-200/80 font-black text-slate-900 text-sm">
                            <span>Final Net Driver Payable:</span>
                            <span className="font-mono text-emerald-700 text-base font-black">${totalNetPayout.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Footer Terms & Signatures */}
              <div className="mt-12 border-t border-slate-200 pt-6 text-[10px] text-slate-500 text-center leading-relaxed font-sans">
                {activeReceiptSettlement.notes && (
                  <div className="text-left bg-slate-50 p-3 rounded-lg border border-slate-100 mb-6 text-slate-600 italic">
                    <span className="font-extrabold not-italic uppercase tracking-wider block font-mono text-[9px] text-slate-400 mb-0.5">Remarks / Remarks:</span>
                    {activeReceiptSettlement.notes}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-8 mt-8 text-center print:mt-16">
                  <div className="border-t border-slate-300 pt-2">
                    <div className="font-semibold text-slate-700">Dispatch Desk Authorization</div>
                    <div className="text-[8px] text-slate-400 mt-1 font-mono">Digitally Approved via {companySettings.name} System</div>
                  </div>
                  <div className="border-t border-slate-300 pt-2">
                    <div className="font-semibold text-slate-700">Carrier / Driver Acknowledgment</div>
                    <div className="text-[8px] text-slate-400 mt-1 font-mono">Signature on File or Verification Token Approved</div>
                  </div>
                </div>


              </div>

            </div>

          </div>
        </div>
      )}

      </>
      )}

    </div>
  );
}
