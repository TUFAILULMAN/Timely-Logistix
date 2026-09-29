/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  FileSpreadsheet, 
  Plus, 
  Search, 
  Printer, 
  CheckCircle, 
  Clock, 
  Building, 
  User, 
  Calendar, 
  CreditCard, 
  Download, 
  Trash2, 
  Eye, 
  X,
  TrendingUp,
  Percent
} from 'lucide-react';
import { 
  SalarySlip, 
  HRStaffProfile, 
  User as UserType 
} from '../../types';

interface HRSalarySlipsVaultProps {
  salarySlips: SalarySlip[];
  hrProfiles: HRStaffProfile[];
  currentUser: UserType;
  isAdmin: boolean;
  onAddSalarySlip: (slip: Omit<SalarySlip, 'id' | 'createdAt'>) => Promise<void> | void;
  onUpdateSalarySlip?: (id: string, updates: Partial<SalarySlip>) => Promise<void> | void;
  onDeleteSalarySlip?: (id: string) => Promise<void> | void;
}

export default function HRSalarySlipsVault({
  salarySlips,
  hrProfiles,
  currentUser,
  isAdmin,
  onAddSalarySlip,
  onUpdateSalarySlip,
  onDeleteSalarySlip
}: HRSalarySlipsVaultProps) {
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedSlipForPrint, setSelectedSlipForPrint] = useState<SalarySlip | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('ALL');

  // Generator form state
  const [selectedProfileId, setSelectedProfileId] = useState<string>(hrProfiles[0]?.id || '');
  const [month, setMonth] = useState(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  });
  const [grossSalary, setGrossSalary] = useState<number>(85000);
  const [bonusAmount, setBonusAmount] = useState<number>(15000);
  const [allowances, setAllowances] = useState<number>(5000);
  const [deductions, setDeductions] = useState<number>(0);
  const [currency, setCurrency] = useState<'PKR' | 'USD'>('PKR');
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PENDING'>('PAID');
  const [paymentMethod, setPaymentMethod] = useState<SalarySlip['paymentMethod']>('BANK_TRANSFER');
  const [bankName, setBankName] = useState('Meezan Bank / HBL');
  const [accountNumber, setAccountNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-populate when selecting employee profile in generator
  const handleProfileSelect = (pId: string) => {
    setSelectedProfileId(pId);
    const p = hrProfiles.find(item => item.id === pId);
    if (p) {
      const gross = p.salaryStructure?.grossSalaryPKR || p.baseSalaryPKR || 85000;
      const bPercent = p.salaryStructure?.bonusPercent || p.bonusPercent || 10;
      const allow = p.salaryStructure?.allowancesPKR || 5000;
      setGrossSalary(gross);
      // approximate bonus from percentage
      setBonusAmount(Math.round(gross * (bPercent / 100)));
      setAllowances(allow);
    }
  };

  const netPayable = useMemo(() => {
    return (Number(grossSalary) || 0) + (Number(bonusAmount) || 0) + (Number(allowances) || 0) - (Number(deductions) || 0);
  }, [grossSalary, bonusAmount, allowances, deductions]);

  const monthLabel = useMemo(() => {
    try {
      const [y, m] = month.split('-');
      const date = new Date(parseInt(y), parseInt(m) - 1, 1);
      return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    } catch {
      return month;
    }
  }, [month]);

  // Distinct months for filtering
  const distinctMonths = useMemo(() => {
    const set = new Set<string>();
    salarySlips.forEach(s => {
      if (s.month) set.add(s.month);
    });
    return Array.from(set).sort().reverse();
  }, [salarySlips]);

  const filteredSlips = useMemo(() => {
    return salarySlips.filter(s => {
      if (selectedMonthFilter !== 'ALL' && s.month !== selectedMonthFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.employeeName.toLowerCase().includes(q) ||
          s.slipNumber.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [salarySlips, selectedMonthFilter, searchQuery]);

  const totalPayrollPaid = useMemo(() => {
    return filteredSlips.reduce((sum, s) => sum + (s.paymentStatus === 'PAID' ? s.netPayable : 0), 0);
  }, [filteredSlips]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = hrProfiles.find(item => item.id === selectedProfileId);
    if (!p) {
      alert('Please select an employee profile.');
      return;
    }
    setIsSubmitting(true);
    try {
      const slipNumber = `SLIP-${month.replace('-', '')}-${Math.floor(100 + Math.random() * 900)}`;
      await onAddSalarySlip({
        slipNumber,
        employeeId: p.id,
        employeeName: p.name,
        employeeRole: p.role,
        department: p.department || 'General',
        managerName: p.managerName,
        month,
        monthLabel,
        joiningDate: p.joiningDate,
        grossSalary: Number(grossSalary) || 0,
        bonusAmount: Number(bonusAmount) || 0,
        allowances: Number(allowances) || 0,
        deductions: Number(deductions) || 0,
        netPayable,
        currency,
        paymentStatus,
        paymentDate: paymentStatus === 'PAID' ? paymentDate : undefined,
        paymentMethod,
        bankName,
        accountNumber,
        notes,
        generatedBy: currentUser.name
      });
      setIsGenerateModalOpen(false);
      setNotes('');
    } catch (err: any) {
      alert(`Generation failed: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-5 rounded-2xl border border-emerald-900/50 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg border border-emerald-400/30">
                <FileSpreadsheet className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-extrabold uppercase tracking-wide">
                Monthly Salary Slip Records &amp; Payroll Vault
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              Generate, record, and print official salary slips with gross salary, performance commissions, allowances, and statutory deductions.
            </p>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  if (hrProfiles.length > 0) {
                    handleProfileSelect(hrProfiles[0].id);
                  }
                  setIsGenerateModalOpen(true);
                }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center gap-2 cursor-pointer transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Issue Monthly Salary Slip</span>
              </button>
            </div>
          )}
        </div>

        {/* Financial KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-emerald-900/60">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-[10px] uppercase font-mono text-slate-400 font-bold">Total Slips Recorded</div>
            <div className="text-base font-extrabold text-white">{filteredSlips.length} Slips</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-[10px] uppercase font-mono text-slate-400 font-bold">Disbursed Payroll (Paid)</div>
            <div className="text-base font-extrabold text-emerald-400 font-mono">
              Rs. {totalPayrollPaid.toLocaleString()}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-[10px] uppercase font-mono text-slate-400 font-bold">Active Staff Profiles</div>
            <div className="text-base font-extrabold text-white">{hrProfiles.length} Members</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-xs">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by staff name, slip #..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={selectedMonthFilter}
            onChange={(e) => setSelectedMonthFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All Months</option>
            {distinctMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="text-xs font-mono font-bold text-slate-500">
          Showing {filteredSlips.length} salary records
        </div>
      </div>

      {/* Salary Slips Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Slip #</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Billing Month</th>
                <th className="py-3 px-4">Gross + Bonus</th>
                <th className="py-3 px-4">Net Disbursed</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSlips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No salary slips recorded. Click "Issue Monthly Salary Slip" to create one.
                  </td>
                </tr>
              ) : (
                filteredSlips.map(slip => (
                  <tr key={slip.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700 text-xs">
                      {slip.slipNumber}
                    </td>

                    <td className="py-3 px-4">
                      <strong className="font-bold text-slate-800 block text-xs">{slip.employeeName}</strong>
                      <span className="text-[10px] text-slate-400 font-mono">{slip.department}</span>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {slip.monthLabel || slip.month}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-700">
                        Gross: Rs. {slip.grossSalary.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-bold font-mono">
                        +Bonus: Rs. {slip.bonusAmount.toLocaleString()}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900 font-mono text-sm">
                        Rs. {slip.netPayable.toLocaleString()}
                      </div>
                      <span className="text-[9px] text-slate-400 uppercase font-mono">
                        {slip.paymentMethod?.replace('_', ' ') || 'BANK TRANSFER'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase font-mono ${
                        slip.paymentStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {slip.paymentStatus === 'PAID' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        <span>{slip.paymentStatus}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedSlipForPrint(slip)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="View and Print Official Pay Stub"
                        >
                          <Printer className="h-3.5 w-3.5 text-blue-600" />
                          <span>View Pay Stub</span>
                        </button>

                        {isAdmin && onDeleteSalarySlip && (
                          <button
                            onClick={() => {
                              if (confirm(`Delete salary slip record ${slip.slipNumber}?`)) {
                                onDeleteSalarySlip(slip.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-500 rounded cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* GENERATE SALARY SLIP MODAL */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-extrabold">Generate Monthly Salary Slip</h3>
              </div>
              <button onClick={() => setIsGenerateModalOpen(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleGenerate} className="p-6 space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Employee *</label>
                  <select
                    value={selectedProfileId}
                    onChange={(e) => handleProfileSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {hrProfiles.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.role}) - {p.department}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Billing Month *</label>
                  <input
                    type="month"
                    required
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Salary Breakdown Inputs */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="text-xs font-extrabold uppercase font-mono text-slate-700 tracking-wider">
                  Earnings &amp; Deductions Breakdown (PKR)
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Gross Salary</label>
                    <input
                      type="number"
                      required
                      value={grossSalary}
                      onChange={(e) => setGrossSalary(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Bonus / Comm.</label>
                    <input
                      type="number"
                      value={bonusAmount}
                      onChange={(e) => setBonusAmount(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold font-mono text-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Allowances</label>
                    <input
                      type="number"
                      value={allowances}
                      onChange={(e) => setAllowances(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Deductions</label>
                    <input
                      type="number"
                      value={deductions}
                      onChange={(e) => setDeductions(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold font-mono text-rose-700"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-emerald-100/50 border border-emerald-200 rounded-xl">
                  <span className="font-bold text-emerald-900">Total Net Payable to Staff:</span>
                  <span className="text-base font-extrabold text-emerald-800 font-mono">
                    Rs. {netPayable.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="PAID">PAID</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CASH">Cash in Hand</option>
                    <option value="CHECK">Check</option>
                    <option value="WIRE">Wire / Online</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Bank Name"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Number / IBAN</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="PK..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / Disciplinary Adjustments</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Disbursed via online banking. Performance bonus included."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Record & Issue Salary Slip'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL PAY STUB PRINT VIEW MODAL */}
      {selectedSlipForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            
            {/* Modal Controls Bar */}
            <div className="px-6 py-3 bg-slate-900 text-white flex items-center justify-between no-print">
              <div className="text-xs font-mono font-bold text-emerald-400">
                {selectedSlipForPrint.slipNumber} &bull; {selectedSlipForPrint.monthLabel}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setSelectedSlipForPrint(null)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Pay Slip Sheet */}
            <div className="p-8 space-y-6 text-slate-800 print:p-6" id="printable-salary-slip">
              
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    FREIGHT LOGISTICS &amp; DISPATCH SERVICES
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Corporate Office &bull; Dispatch &amp; Sales Headquarters
                  </p>
                  <span className="inline-block mt-2 px-2.5 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-extrabold uppercase font-mono rounded">
                    Official Salary Slip
                  </span>
                </div>

                <div className="text-right">
                  <div className="text-sm font-extrabold font-mono text-emerald-700">
                    {selectedSlipForPrint.slipNumber}
                  </div>
                  <div className="text-xs font-bold text-slate-700 mt-1">
                    Month: {selectedSlipForPrint.monthLabel || selectedSlipForPrint.month}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Generated: {new Date(selectedSlipForPrint.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Employee Summary Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Employee Name</span>
                  <strong className="font-bold text-slate-900 text-sm">{selectedSlipForPrint.employeeName}</strong>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Job Role &amp; Dept</span>
                  <span className="font-bold text-slate-800">{selectedSlipForPrint.employeeRole}</span>
                  <div className="text-[10px] text-slate-500 font-mono">{selectedSlipForPrint.department}</div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Managerial Oversight</span>
                  <span className="font-bold text-slate-800">{selectedSlipForPrint.managerName || 'Operations Director'}</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Joining Date</span>
                  <span className="font-mono text-slate-700">{selectedSlipForPrint.joiningDate || '2024-01-01'}</span>
                </div>
              </div>

              {/* Earnings & Deductions Tables */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Earnings */}
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <div className="bg-emerald-50 px-4 py-2 font-bold text-emerald-900 border-b border-emerald-100 flex items-center justify-between">
                    <span>EARNINGS &amp; ALLOWANCES</span>
                    <span className="font-mono text-[10px]">PKR</span>
                  </div>
                  <div className="p-4 space-y-2.5">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Gross Base Salary</span>
                      <span className="font-mono font-bold">Rs. {selectedSlipForPrint.grossSalary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Performance Commission / Bonus</span>
                      <span className="font-mono font-bold text-emerald-700">+Rs. {selectedSlipForPrint.bonusAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Monthly Allowances</span>
                      <span className="font-mono font-bold">+Rs. {selectedSlipForPrint.allowances.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <div className="bg-rose-50 px-4 py-2 font-bold text-rose-900 border-b border-rose-100 flex items-center justify-between">
                    <span>DEDUCTIONS &amp; ADJUSTMENTS</span>
                    <span className="font-mono text-[10px]">PKR</span>
                  </div>
                  <div className="p-4 space-y-2.5">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Unpaid Leaves / Absences</span>
                      <span className="font-mono font-bold text-slate-700">Rs. 0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Advances / Tax / Penalties</span>
                      <span className="font-mono font-bold text-rose-700">-Rs. {selectedSlipForPrint.deductions.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-100">
                      <span className="text-slate-500 font-bold">Total Deductions</span>
                      <span className="font-mono font-bold text-rose-700">-Rs. {selectedSlipForPrint.deductions.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Net Pay Highlight */}
              <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase font-mono font-bold text-emerald-800">Net Take-Home Pay</div>
                  <div className="text-xs text-slate-500">
                    Payment Method: {selectedSlipForPrint.paymentMethod?.replace('_', ' ') || 'Bank Transfer'} &bull; Status: {selectedSlipForPrint.paymentStatus}
                  </div>
                </div>
                <div className="text-2xl font-black font-mono text-emerald-900">
                  Rs. {selectedSlipForPrint.netPayable.toLocaleString()}
                </div>
              </div>

              {/* Payment Bank Details & Signature Section */}
              <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase font-mono text-slate-400 block">Bank Account Details</span>
                  <div className="font-bold text-slate-800">{selectedSlipForPrint.bankName || 'Direct Account Deposit'}</div>
                  {selectedSlipForPrint.accountNumber && (
                    <div className="font-mono text-[11px] text-slate-600">IBAN: {selectedSlipForPrint.accountNumber}</div>
                  )}
                  {selectedSlipForPrint.notes && (
                    <div className="text-[11px] text-slate-500 italic mt-2">"{selectedSlipForPrint.notes}"</div>
                  )}
                </div>

                <div className="space-y-6 text-right">
                  <div className="h-10"></div>
                  <div className="border-t border-slate-300 pt-1 inline-block min-w-[200px] text-center">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-500 block">
                      Authorized Signatory / Finance Director
                    </span>
                    <span className="text-[9px] text-slate-400">Freight Systems Automated Payroll Engine</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
