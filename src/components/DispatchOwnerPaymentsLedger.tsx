import React, { useState, useMemo } from 'react';
import { Invoice, PartialPaymentEntry, CarrierOrOwner, CompanySettings, User } from '../types';
import { 
  FileSpreadsheet, 
  DollarSign, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Printer, 
  Upload, 
  Image as ImageIcon, 
  Eye, 
  Trash2, 
  X, 
  Search, 
  Filter, 
  Share2, 
  Copy, 
  Check, 
  FileText, 
  UserCheck, 
  Building2, 
  ArrowRight,
  TrendingUp,
  Receipt,
  Calendar
} from 'lucide-react';

interface DispatchOwnerPaymentsLedgerProps {
  currentUser: User;
  invoices: Invoice[];
  carriers: CarrierOrOwner[];
  companySettings: CompanySettings;
  onEditInvoice: (id: string, updated: Partial<Invoice>) => Promise<void> | void;
  onAddInvoice?: (invoice: Omit<Invoice, 'id'>) => Promise<void> | void;
  onDeleteInvoice?: (id: string) => Promise<void> | void;
}

export default function DispatchOwnerPaymentsLedger({
  currentUser,
  invoices = [],
  carriers = [],
  companySettings,
  onEditInvoice,
  onAddInvoice,
  onDeleteInvoice
}: DispatchOwnerPaymentsLedgerProps) {
  // State: View Tab Selection
  const [viewTab, setViewTab] = useState<'INVOICE_LEDGER' | 'OWNER_SUMMARY'>('INVOICE_LEDGER');

  // Filters
  const [carrierFilter, setCarrierFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [periodFilter, setPeriodFilter] = useState<string>('ALL_TIME');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Modals state
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [viewingProof, setViewingProof] = useState<{ name: string; type: string; base64: string; title: string } | null>(null);
  const [statementCarrierName, setStatementCarrierName] = useState<string | null>(null);
  const [copiedStatement, setCopiedStatement] = useState<boolean>(false);

  // Form state for adding partial payment
  const [payDate, setPayDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMethod, setPayMethod] = useState<PartialPaymentEntry['paymentMethod']>('ZELLE');
  const [payNotes, setPayNotes] = useState<string>('');
  const [proofFile, setProofFile] = useState<{ name: string; type: 'image' | 'pdf' | 'other'; base64: string } | null>(null);
  const [isSubmittingPay, setIsSubmittingPay] = useState<boolean>(false);

  // Filtered Invoices calculation
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // Dispatch fee mode or carrier freight mode filter
      if (carrierFilter !== 'ALL') {
        const cName = inv.carrierName?.toLowerCase() || '';
        if (!cName.includes(carrierFilter.toLowerCase())) return false;
      }

      // Status filter
      const totalPaid = inv.totalAmountPaid ?? (inv.paymentStatus === 'PAID' ? inv.netAmount : 0);
      const remaining = inv.remainingBalance ?? (inv.paymentStatus === 'PAID' ? 0 : inv.netAmount);
      const computedStatus = inv.paymentStatus || (remaining <= 0 ? 'PAID' : (totalPaid > 0 ? 'PARTIAL' : 'UNPAID'));

      if (statusFilter === 'UNPAID_PARTIAL' && computedStatus === 'PAID') return false;
      if (statusFilter === 'PARTIAL_ONLY' && computedStatus !== 'PARTIAL') return false;
      if (statusFilter === 'PAID_ONLY' && computedStatus !== 'PAID') return false;
      if (statusFilter === 'UNPAID_ONLY' && computedStatus !== 'UNPAID') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const numMatch = inv.invoiceNum?.toLowerCase().includes(q);
        const carrierMatch = inv.carrierName?.toLowerCase().includes(q);
        const notesMatch = inv.notes?.toLowerCase().includes(q);
        if (!numMatch && !carrierMatch && !notesMatch) return false;
      }

      // Period filter
      if (periodFilter === 'CUSTOM' && customStartDate && customEndDate) {
        if (inv.invoiceDate < customStartDate || inv.invoiceDate > customEndDate) return false;
      }

      return true;
    });
  }, [invoices, carrierFilter, statusFilter, searchQuery, periodFilter, customStartDate, customEndDate]);

  // Overall Financial Totals
  const totals = useMemo(() => {
    let totalInvoiced = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;

    filteredInvoices.forEach(inv => {
      const net = inv.netAmount || 0;
      const paid = inv.totalAmountPaid ?? (inv.paymentStatus === 'PAID' ? net : 0);
      const rem = inv.remainingBalance ?? (inv.paymentStatus === 'PAID' ? 0 : Math.max(0, net - paid));

      totalInvoiced += net;
      totalCollected += paid;
      totalOutstanding += rem;
    });

    const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

    return { totalInvoiced, totalCollected, totalOutstanding, collectionRate };
  }, [filteredInvoices]);

  // Grouped by Carrier/Owner for Summary view
  const carrierSummaries = useMemo(() => {
    const map = new Map<string, {
      carrierName: string;
      invoices: Invoice[];
      totalInvoiced: number;
      totalCollected: number;
      totalOutstanding: number;
      partialPaymentsCount: number;
    }>();

    invoices.forEach(inv => {
      const name = inv.carrierName || 'Unassigned Carrier';
      if (!map.has(name)) {
        map.set(name, {
          carrierName: name,
          invoices: [],
          totalInvoiced: 0,
          totalCollected: 0,
          totalOutstanding: 0,
          partialPaymentsCount: 0
        });
      }

      const item = map.get(name)!;
      item.invoices.push(inv);

      const net = inv.netAmount || 0;
      const paid = inv.totalAmountPaid ?? (inv.paymentStatus === 'PAID' ? net : 0);
      const rem = inv.remainingBalance ?? (inv.paymentStatus === 'PAID' ? 0 : Math.max(0, net - paid));

      item.totalInvoiced += net;
      item.totalCollected += paid;
      item.totalOutstanding += rem;
      item.partialPaymentsCount += (inv.partialPayments?.length || 0);
    });

    return Array.from(map.values());
  }, [invoices]);

  // Handle Proof Upload change inside Payment Modal
  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType: 'image' | 'pdf' | 'other' = file.type.includes('image') ? 'image' : (file.type.includes('pdf') ? 'pdf' : 'other');

    const reader = new FileReader();
    reader.onload = (evt) => {
      if (typeof evt.target?.result === 'string') {
        setProofFile({
          name: file.name,
          type: fileType,
          base64: evt.target.result
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Open Add Partial Payment Modal
  const handleOpenPaymentModal = (inv: Invoice) => {
    setSelectedInvoiceForPayment(inv);
    const net = inv.netAmount || 0;
    const paid = inv.totalAmountPaid ?? (inv.paymentStatus === 'PAID' ? net : 0);
    const rem = inv.remainingBalance ?? (inv.paymentStatus === 'PAID' ? 0 : Math.max(0, net - paid));

    setPayAmount(rem > 0 ? rem.toString() : '');
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayMethod('ZELLE');
    setPayNotes('');
    setProofFile(null);
  };

  // Save Partial Payment
  const handleSavePartialPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;

    const amountNum = parseFloat(payAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid partial payment amount.');
      return;
    }

    setIsSubmittingPay(true);

    try {
      const inv = selectedInvoiceForPayment;
      const currentPaid = inv.totalAmountPaid ?? (inv.paymentStatus === 'PAID' ? inv.netAmount : 0);
      const newTotalPaid = currentPaid + amountNum;
      const newRemaining = Math.max(0, inv.netAmount - newTotalPaid);
      const newStatus: Invoice['paymentStatus'] = newRemaining <= 0 ? 'PAID' : 'PARTIAL';

      const newEntry: PartialPaymentEntry = {
        id: 'pt_' + Date.now(),
        date: payDate,
        amount: amountNum,
        paymentMethod: payMethod,
        notes: payNotes.trim() || undefined,
        proofFileName: proofFile?.name,
        proofFileType: proofFile?.type,
        proofBase64: proofFile?.base64
      };

      const updatedPartialList = [...(inv.partialPayments || []), newEntry];

      await onEditInvoice(inv.id, {
        partialPayments: updatedPartialList,
        totalAmountPaid: newTotalPaid,
        remainingBalance: newRemaining,
        paymentStatus: newStatus,
        paymentDate: newRemaining <= 0 ? payDate : inv.paymentDate,
        ...(proofFile ? {
          paymentProofFileName: proofFile.name,
          paymentProofFileType: proofFile.type,
          paymentProofBase64: proofFile.base64
        } : {})
      });

      if (newRemaining <= 0) {
        alert(`🎉 Success! Invoice #${inv.invoiceNum} is now FULLY PAID ($${newTotalPaid.toFixed(2)}). Status shifted to PAID.`);
      } else {
        alert(`✓ Logged partial payment of $${amountNum.toFixed(2)} for Invoice #${inv.invoiceNum}. Remaining balance owed: $${newRemaining.toFixed(2)}.`);
      }

      setSelectedInvoiceForPayment(null);
    } catch (err) {
      console.error(err);
      alert('Failed to record partial payment.');
    } finally {
      setIsSubmittingPay(false);
    }
  };

  // Delete a partial payment entry
  const handleDeletePartialEntry = async (inv: Invoice, entryId: string) => {
    if (!window.confirm('Are you sure you want to delete this payment log entry?')) return;

    const remainingEntries = (inv.partialPayments || []).filter(p => p.id !== entryId);
    const newTotalPaid = remainingEntries.reduce((sum, p) => sum + p.amount, 0);
    const newRemaining = Math.max(0, inv.netAmount - newTotalPaid);
    const newStatus: Invoice['paymentStatus'] = newRemaining <= 0 ? 'PAID' : (newTotalPaid > 0 ? 'PARTIAL' : 'UNPAID');

    await onEditInvoice(inv.id, {
      partialPayments: remainingEntries,
      totalAmountPaid: newTotalPaid,
      remainingBalance: newRemaining,
      paymentStatus: newStatus
    });
  };

  // Copy Owner Statement text to clipboard
  const handleCopyStatementText = (carrierName: string, carrierInvoices: Invoice[]) => {
    let txt = `========================================\n`;
    txt += `DISPATCH SERVICE INVOICE & PAYMENTS STATEMENT\n`;
    txt += `Company: ${companySettings.name}\n`;
    txt += `Billed Owner / Carrier: ${carrierName}\n`;
    txt += `Date: ${new Date().toLocaleDateString()}\n`;
    txt += `========================================\n\n`;

    let totInv = 0;
    let totPaid = 0;
    let totOwed = 0;

    carrierInvoices.forEach(inv => {
      const net = inv.netAmount || 0;
      const paid = inv.totalAmountPaid ?? (inv.paymentStatus === 'PAID' ? net : 0);
      const rem = inv.remainingBalance ?? (inv.paymentStatus === 'PAID' ? 0 : Math.max(0, net - paid));

      totInv += net;
      totPaid += paid;
      totOwed += rem;

      txt += `Invoice #: ${inv.invoiceNum}\n`;
      txt += `Date Period: ${inv.invoiceDate} ${inv.startDate ? `(${inv.startDate} to ${inv.endDate})` : ''}\n`;
      txt += `Total Fee Due: $${net.toFixed(2)}\n`;
      txt += `Amount Received: $${paid.toFixed(2)}\n`;
      txt += `Remaining Balance: $${rem.toFixed(2)} [${inv.paymentStatus || (rem <= 0 ? 'PAID' : 'PARTIAL')}]\n`;

      if (inv.partialPayments && inv.partialPayments.length > 0) {
        txt += `  Payment History:\n`;
        inv.partialPayments.forEach(p => {
          txt += `   - ${p.date}: $${p.amount.toFixed(2)} via ${p.paymentMethod} ${p.notes ? `(${p.notes})` : ''}\n`;
        });
      }
      txt += `----------------------------------------\n`;
    });

    txt += `\nGRAND TOTALS FOR ${carrierName.toUpperCase()}:\n`;
    txt += `Total Invoiced Fees: $${totInv.toFixed(2)}\n`;
    txt += `Total Paid Received: $${totPaid.toFixed(2)}\n`;
    txt += `NET REMAINING BALANCE OWED: $${totOwed.toFixed(2)}\n`;
    txt += `========================================\n`;

    navigator.clipboard.writeText(txt);
    setCopiedStatement(true);
    setTimeout(() => setCopiedStatement(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER BAR */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-sky-400 font-mono text-[11px] font-bold uppercase tracking-widest">
            <Receipt className="h-4 w-4" />
            <span>Owner &amp; Carrier Dispatch Payments Ledger</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white font-display mt-1">
            Dispatch Partial Payments &amp; Owner Balance Tracker
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
            Track multi-week carrier dispatch invoices, log partial owner payments with screenshot receipts (Zelle/Wire), monitor remaining balances, and generate transparent statements.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setViewTab('INVOICE_LEDGER')}
            className={`px-4 py-2 text-xs font-black rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              viewTab === 'INVOICE_LEDGER'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>1. Invoice Installments Ledger</span>
          </button>

          <button
            type="button"
            onClick={() => setViewTab('OWNER_SUMMARY')}
            className={`px-4 py-2 text-xs font-black rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              viewTab === 'OWNER_SUMMARY'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>2. Owner Balance Summaries ({carrierSummaries.length})</span>
          </button>
        </div>
      </div>

      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Invoiced */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 text-[10px] font-mono font-bold uppercase tracking-wider">
            <span>Total Dispatch Fees Invoiced</span>
            <FileText className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white mt-2">
            ${totals.totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Across {filteredInvoices.length} matched invoices
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-emerald-900/50 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider">
            <span>Total Collected Received</span>
            <CheckCircle className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-2">
            ${totals.totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Collection Rate: <span className="font-bold text-emerald-400">{totals.collectionRate}%</span>
          </div>
        </div>

        {/* Total Remaining Balance Owed */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-amber-900/50 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider">
            <span>Remaining Balance Owed by Owners</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-400 mt-2">
            ${totals.totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Outstanding carrier dispatch liability
          </div>
        </div>

        {/* Open Invoices Count */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 text-[10px] font-mono font-bold uppercase tracking-wider">
            <span>Carriers with Open Balances</span>
            <Building2 className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white mt-2">
            {carrierSummaries.filter(c => c.totalOutstanding > 0).length} Carriers
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {carrierSummaries.length} total active carrier accounts
          </div>
        </div>

      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Carrier Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-black text-slate-500 font-mono uppercase">Carrier / Owner:</label>
            <select
              value={carrierFilter}
              onChange={(e) => setCarrierFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-extrabold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Carriers / Owners ({carrierSummaries.length})</option>
              {carrierSummaries.map(c => (
                <option key={c.carrierName} value={c.carrierName}>
                  {c.carrierName} {c.totalOutstanding > 0 ? `(Owes $${c.totalOutstanding.toFixed(0)})` : '✓ Paid'}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-black text-slate-500 font-mono uppercase">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-extrabold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="UNPAID_PARTIAL">🟡 Unpaid &amp; Partial Only</option>
              <option value="PARTIAL_ONLY">⚡ Partial Payments Only</option>
              <option value="UNPAID_ONLY">🔴 Completely Unpaid</option>
              <option value="PAID_ONLY">🟢 Fully Paid Only</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-xs">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Invoice #, Carrier, Notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

        </div>
      </div>

      {/* VIEW 1: INVOICE INSTALLMENTS LEDGER */}
      {viewTab === 'INVOICE_LEDGER' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
          
          <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-sky-400" />
              <div>
                <h3 className="font-extrabold text-white text-sm">Dispatch Invoice Partial Payment Ledger</h3>
                <p className="text-[10px] text-slate-400">Click "+ Log Payment" to record owner installments (Zelle/Wire) with screenshot receipts.</p>
              </div>
            </div>

            <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-mono font-black px-3 py-1 rounded-xl">
              {filteredInvoices.length} Invoices Found
            </span>
          </div>

          {filteredInvoices.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {filteredInvoices.map((inv) => {
                const net = inv.netAmount || 0;
                const paid = inv.totalAmountPaid ?? (inv.paymentStatus === 'PAID' ? net : 0);
                const remaining = inv.remainingBalance ?? (inv.paymentStatus === 'PAID' ? 0 : Math.max(0, net - paid));
                const currentStatus = inv.paymentStatus || (remaining <= 0 ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'UNPAID'));
                const partials = inv.partialPayments || [];

                return (
                  <div key={inv.id} className="p-6 hover:bg-slate-50/60 transition-colors space-y-4">
                    
                    {/* Invoice Top Row Info */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-base font-black font-mono text-slate-900">{inv.invoiceNum}</span>
                          
                          {/* Status Badge */}
                          <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-lg uppercase tracking-wider font-mono ${
                            currentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : currentStatus === 'PARTIAL'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold'
                              : 'bg-rose-100 text-rose-900 border border-rose-300'
                          }`}>
                            {currentStatus === 'PAID' && '🟢 FULLY PAID'}
                            {currentStatus === 'PARTIAL' && '🟡 PARTIAL PAYMENT'}
                            {currentStatus === 'UNPAID' && '🔴 UNPAID'}
                          </span>

                          <span className="text-[10px] font-mono text-slate-500">
                            Invoice Date: <strong className="text-slate-800">{inv.invoiceDate}</strong>
                            {inv.startDate && ` (${inv.startDate} to ${inv.endDate})`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                          <Building2 className="h-3.5 w-3.5 text-sky-600" />
                          <span>{inv.carrierName || 'Unassigned Carrier'}</span>
                          {inv.dispatchRatePercent && (
                            <span className="text-[10px] text-slate-500 font-mono">({inv.dispatchRatePercent}% Dispatch Rate)</span>
                          )}
                        </div>
                      </div>

                      {/* Financial Amounts & Action */}
                      <div className="flex flex-wrap items-center gap-4 font-mono">
                        
                        {/* Total Invoice */}
                        <div className="text-right">
                          <div className="text-[9px] font-bold text-slate-400 uppercase">Total Invoice Fee</div>
                          <div className="text-sm font-black text-slate-900">${net.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                        </div>

                        {/* Paid So Far */}
                        <div className="text-right">
                          <div className="text-[9px] font-bold text-emerald-600 uppercase">Received Paid</div>
                          <div className="text-sm font-black text-emerald-700">${paid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                        </div>

                        {/* Remaining Owed */}
                        <div className="text-right bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                          <div className="text-[9px] font-bold text-amber-800 uppercase">Remaining Owed</div>
                          <div className="text-base font-black text-amber-900">${remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                        </div>

                        {/* Button: Add Partial Payment */}
                        <button
                          type="button"
                          onClick={() => handleOpenPaymentModal(inv)}
                          className="cursor-pointer bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                        >
                          <Plus className="h-4 w-4" />
                          <span>+ Log Payment</span>
                        </button>
                      </div>
                    </div>

                    {/* Partial Payments Log Table / Sub-List */}
                    {partials.length > 0 && (
                      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-700 font-mono uppercase tracking-wider">
                          <span className="flex items-center gap-1.5">
                            <Receipt className="h-3.5 w-3.5 text-sky-600" />
                            Partial Payment History ({partials.length} Installments)
                          </span>
                          <span className="text-slate-500 font-normal">Auto-deducted from balance</span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="text-[9px] font-mono uppercase text-slate-400 border-b border-slate-200">
                                <th className="py-1.5 px-3">Date</th>
                                <th className="py-1.5 px-3">Method</th>
                                <th className="py-1.5 px-3 text-right">Amount Received</th>
                                <th className="py-1.5 px-3">Notes &amp; Reference</th>
                                <th className="py-1.5 px-3 text-center">Screenshot Proof</th>
                                <th className="py-1.5 px-3 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/60 font-mono">
                              {partials.map(p => (
                                <tr key={p.id} className="hover:bg-white transition-colors">
                                  <td className="py-2 px-3 font-bold text-slate-800">{p.date}</td>
                                  <td className="py-2 px-3">
                                    <span className="bg-slate-200 text-slate-800 font-extrabold text-[9px] px-2 py-0.5 rounded-md uppercase">
                                      {p.paymentMethod}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-right font-black text-emerald-700">${p.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                  <td className="py-2 px-3 text-slate-600 font-sans text-xs">{p.notes || '-'}</td>
                                  <td className="py-2 px-3 text-center">
                                    {p.proofBase64 ? (
                                      <button
                                        type="button"
                                        onClick={() => setViewingProof({ name: p.proofFileName || 'Receipt.png', type: p.proofFileType || 'image', base64: p.proofBase64!, title: `Payment Receipt: $${p.amount} on ${p.date}` })}
                                        className="cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-lg hover:bg-sky-100"
                                      >
                                        <ImageIcon className="h-3 w-3 text-sky-600" />
                                        <span>View Proof ✓</span>
                                      </button>
                                    ) : (
                                      <span className="text-slate-400 text-[10px] italic">No file attached</span>
                                    )}
                                  </td>
                                  <td className="py-2 px-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleDeletePartialEntry(inv, p.id)}
                                      className="cursor-pointer text-slate-400 hover:text-rose-600 transition-colors p-1"
                                      title="Delete payment entry"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <FileSpreadsheet className="h-10 w-10 mx-auto text-slate-300" />
              <p className="text-sm font-bold">No dispatch invoices found matching your filters.</p>
            </div>
          )}

        </div>
      )}

      {/* VIEW 2: OWNER BALANCE SUMMARIES & TRANSPARENT STATEMENT */}
      {viewTab === 'OWNER_SUMMARY' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {carrierSummaries.map(c => (
            <div key={c.carrierName} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 relative overflow-hidden">
              
              <div className="flex justify-between items-start gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-sky-600" />
                    <h3 className="text-lg font-black text-slate-900 font-display">{c.carrierName}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {c.invoices.length} Total Saved Invoices | {c.partialPaymentsCount} Logged Installments
                  </p>
                </div>

                <span className={`px-3 py-1 rounded-xl font-mono text-xs font-black ${
                  c.totalOutstanding > 0 ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}>
                  {c.totalOutstanding > 0 ? `OWES $${c.totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '✓ FULLY PAID'}
                </span>
              </div>

              {/* Progress & Totals */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 grid grid-cols-3 gap-3 text-center font-mono">
                <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Invoiced</div>
                  <div className="text-sm font-black text-slate-900">${c.totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-emerald-600 uppercase">Paid</div>
                  <div className="text-sm font-black text-emerald-700">${c.totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-amber-800 uppercase">Remaining</div>
                  <div className="text-sm font-black text-amber-900">${c.totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                </div>
              </div>

              {/* List of Invoices for this Owner */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin text-xs">
                {c.invoices.map(inv => {
                  const net = inv.netAmount || 0;
                  const paid = inv.totalAmountPaid ?? (inv.paymentStatus === 'PAID' ? net : 0);
                  const rem = inv.remainingBalance ?? (inv.paymentStatus === 'PAID' ? 0 : Math.max(0, net - paid));

                  return (
                    <div key={inv.id} className="flex justify-between items-center bg-slate-100/70 hover:bg-slate-100 px-3 py-2 rounded-xl text-slate-800">
                      <div>
                        <span className="font-mono font-black">{inv.invoiceNum}</span>
                        <span className="text-[10px] text-slate-500 ml-2">({inv.invoiceDate})</span>
                      </div>
                      <div className="font-mono font-bold text-right">
                        <span>${net.toFixed(2)}</span>
                        <span className={`ml-2 text-[10px] ${rem > 0 ? 'text-amber-700 font-black' : 'text-emerald-700'}`}>
                          {rem > 0 ? `(Owes $${rem.toFixed(2)})` : '✓ Paid'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons: Generate Owner Statement */}
              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setStatementCarrierName(c.carrierName)}
                  className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all"
                >
                  <FileText className="h-4 w-4 text-sky-400" />
                  <span>📄 Generate Owner Statement</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyStatementText(c.carrierName, c.invoices)}
                  className="cursor-pointer bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold text-xs px-3 py-2.5 rounded-xl flex items-center gap-1.5 transition-all"
                >
                  {copiedStatement ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-sky-600" />}
                  <span>{copiedStatement ? 'Copied!' : 'Copy WhatsApp/Text'}</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: ADD PARTIAL PAYMENT MODAL */}
      {selectedInvoiceForPayment && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden space-y-0">
            
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-white text-base font-display">Log Carrier Partial Payment</h3>
                <p className="text-xs text-sky-300 font-mono">Invoice #{selectedInvoiceForPayment.invoiceNum} • {selectedInvoiceForPayment.carrierName}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoiceForPayment(null)}
                className="cursor-pointer text-slate-400 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePartialPayment} className="p-6 space-y-4">
              
              {/* Financial Status Summary */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-3 gap-2 text-center font-mono">
                <div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase">Total Fee</div>
                  <div className="text-sm font-black text-slate-900">${(selectedInvoiceForPayment.netAmount || 0).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-[9px] text-emerald-600 font-bold uppercase">Paid So Far</div>
                  <div className="text-sm font-black text-emerald-700">${(selectedInvoiceForPayment.totalAmountPaid || 0).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-[9px] text-amber-800 font-bold uppercase">Remaining Owed</div>
                  <div className="text-sm font-black text-amber-900">${(selectedInvoiceForPayment.remainingBalance ?? selectedInvoiceForPayment.netAmount).toFixed(2)}</div>
                </div>
              </div>

              {/* Payment Date & Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 font-mono uppercase mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2 font-mono outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 font-mono uppercase mb-1">Amount Sent ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="e.g. 500.00"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-black font-mono rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-black text-slate-700 font-mono uppercase mb-1">Payment Method *</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="ZELLE">📱 Zelle Transfer</option>
                  <option value="WIRE">🏛️ Wire Transfer / ACH</option>
                  <option value="CASH">💵 Cash / Money Order</option>
                  <option value="CHECK">📝 Company Check</option>
                  <option value="EFS">💳 EFS Fuel Card</option>
                  <option value="COMCHECK">📄 Comcheck / T-Chek</option>
                  <option value="DIRECT_DEPOSIT">🏦 Direct Deposit</option>
                  <option value="QUICKPAY">⚡ QuickPay</option>
                </select>
              </div>

              {/* Notes / Ref # */}
              <div>
                <label className="block text-xs font-black text-slate-700 font-mono uppercase mb-1">Payment Notes / Ref Number</label>
                <input
                  type="text"
                  placeholder="e.g. Sent via Zelle ref #ZEL-99120 from Chase account"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Proof File Attachment */}
              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-700 font-mono uppercase">
                  Screenshot Receipt / Proof File (Zelle / Wire Proof)
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center hover:bg-slate-50 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleProofFileChange}
                    className="hidden"
                    id="proof-file-input"
                  />
                  <label htmlFor="proof-file-input" className="cursor-pointer space-y-1 block">
                    <Upload className="h-6 w-6 text-sky-600 mx-auto" />
                    <span className="text-xs font-bold text-slate-700 block">
                      {proofFile ? proofFile.name : 'Click to Upload Receipt Screenshot or PDF'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">PNG, JPG, PDF up to 10MB</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceForPayment(null)}
                  className="cursor-pointer px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPay}
                  className="cursor-pointer bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  <span>{isSubmittingPay ? 'Saving...' : 'Confirm & Save Partial Payment'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: VIEW PROOF IMAGE / PDF MODAL */}
      {viewingProof && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden space-y-0">
            
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-white text-sm font-display">{viewingProof.title}</h3>
                <p className="text-[10px] text-slate-400">{viewingProof.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingProof(null)}
                className="cursor-pointer text-slate-400 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 bg-slate-950 flex items-center justify-center max-h-[70vh] overflow-auto">
              {viewingProof.type === 'image' ? (
                <img
                  src={viewingProof.base64}
                  alt={viewingProof.name}
                  className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-lg"
                />
              ) : (
                <iframe
                  src={viewingProof.base64}
                  title={viewingProof.name}
                  className="w-full h-96 rounded-xl bg-white"
                />
              )}
            </div>

            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs text-slate-500 font-mono">Verified Payment Screenshot Receipt</span>
              <a
                href={viewingProof.base64}
                download={viewingProof.name}
                className="cursor-pointer bg-slate-900 text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5"
              >
                <Upload className="h-3.5 w-3.5 rotate-180" />
                <span>Download Attachment</span>
              </a>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: OWNER STATEMENT GENERATOR MODAL */}
      {statementCarrierName && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden space-y-0">
            
            {/* Modal Control Bar */}
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center no-print">
              <div>
                <h3 className="font-extrabold text-white text-base font-display">Owner Transparent Payment Statement</h3>
                <p className="text-xs text-sky-300 font-mono">{statementCarrierName}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="cursor-pointer bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Statement</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatementCarrierName(null)}
                  className="cursor-pointer text-slate-400 hover:text-white p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Print Area Content */}
            <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto scrollbar-thin">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div>
                  <h1 className="text-xl font-black text-slate-900 font-display">{companySettings.name}</h1>
                  <p className="text-xs text-slate-500">{companySettings.tagline}</p>
                  <p className="text-xs text-slate-500 mt-1 whitespace-pre-line">{companySettings.address}</p>
                  <p className="text-xs text-slate-500">{companySettings.phone} • {companySettings.email}</p>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-black uppercase text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1 rounded-xl inline-block">
                    CARRIER PAYMENT STATEMENT
                  </div>
                  <p className="text-xs font-mono text-slate-600 mt-2">
                    Date: <strong>{new Date().toLocaleDateString()}</strong>
                  </p>
                  <p className="text-xs font-mono font-bold text-slate-900 mt-1">
                    Billed To: <span className="text-sky-700">{statementCarrierName}</span>
                  </p>
                </div>
              </div>

              {/* Statement Invoices Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-black font-mono text-slate-700 uppercase tracking-wider">Weekly Dispatch Invoices Summary</h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold font-mono text-[9px] uppercase border-b border-slate-200">
                        <th className="py-2.5 px-4">Invoice #</th>
                        <th className="py-2.5 px-4">Period Date</th>
                        <th className="py-2.5 px-4 text-right">Gross Fee</th>
                        <th className="py-2.5 px-4 text-right">Total Paid</th>
                        <th className="py-2.5 px-4 text-right">Remaining Owed</th>
                        <th className="py-2.5 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {invoices.filter(i => (i.carrierName || '').toLowerCase().includes((statementCarrierName || '').toLowerCase())).map(inv => {
                        const net = inv.netAmount || 0;
                        const paid = inv.totalAmountPaid ?? (inv.paymentStatus === 'PAID' ? net : 0);
                        const rem = inv.remainingBalance ?? (inv.paymentStatus === 'PAID' ? 0 : Math.max(0, net - paid));

                        return (
                          <tr key={inv.id}>
                            <td className="py-2.5 px-4 font-black text-slate-900">{inv.invoiceNum}</td>
                            <td className="py-2.5 px-4 text-slate-600">{inv.invoiceDate}</td>
                            <td className="py-2.5 px-4 text-right font-bold text-slate-900">${net.toFixed(2)}</td>
                            <td className="py-2.5 px-4 text-right font-bold text-emerald-700">${paid.toFixed(2)}</td>
                            <td className="py-2.5 px-4 text-right font-black text-amber-900">${rem.toFixed(2)}</td>
                            <td className="py-2.5 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                                rem <= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                              }`}>
                                {rem <= 0 ? 'PAID' : 'OPEN OWED'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Statement Payment History Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-black font-mono text-slate-700 uppercase tracking-wider">Itemized Installment Payment Receipts Log</h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold font-mono text-[9px] uppercase border-b border-slate-200">
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4">Invoice #</th>
                        <th className="py-2.5 px-4">Method</th>
                        <th className="py-2.5 px-4 text-right">Amount Received</th>
                        <th className="py-2.5 px-4">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {invoices
                        .filter(i => (i.carrierName || '').toLowerCase().includes((statementCarrierName || '').toLowerCase()))
                        .flatMap(i => (i.partialPayments || []).map(p => ({ ...p, invoiceNum: i.invoiceNum })))
                        .map((p, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-4 font-bold text-slate-800">{p.date}</td>
                            <td className="py-2 px-4 font-black text-sky-700">{p.invoiceNum}</td>
                            <td className="py-2 px-4 font-bold">{p.paymentMethod}</td>
                            <td className="py-2 px-4 text-right font-black text-emerald-700">${p.amount.toFixed(2)}</td>
                            <td className="py-2 px-4 text-slate-600 font-sans text-xs">{p.notes || '-'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Grand Summary Block */}
              {(() => {
                const ownerInvoices = invoices.filter(i => (i.carrierName || '').toLowerCase().includes((statementCarrierName || '').toLowerCase()));
                const grandInv = ownerInvoices.reduce((sum, i) => sum + (i.netAmount || 0), 0);
                const grandPaid = ownerInvoices.reduce((sum, i) => sum + (i.totalAmountPaid ?? (i.paymentStatus === 'PAID' ? i.netAmount : 0)), 0);
                const grandRem = Math.max(0, grandInv - grandPaid);

                return (
                  <div className="bg-slate-900 text-white rounded-2xl p-6 flex justify-between items-center font-mono">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Statement Balance Total</div>
                      <div className="text-xl font-black text-white mt-1">{statementCarrierName}</div>
                    </div>

                    <div className="flex gap-6 text-right">
                      <div>
                        <div className="text-[9px] text-slate-400 uppercase font-bold">Total Invoiced</div>
                        <div className="text-base font-bold text-slate-200">${grandInv.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-emerald-400 uppercase font-bold">Total Collected</div>
                        <div className="text-base font-bold text-emerald-400">${grandPaid.toFixed(2)}</div>
                      </div>
                      <div className="bg-amber-950/80 border border-amber-700/80 px-4 py-1.5 rounded-xl">
                        <div className="text-[9px] text-amber-300 uppercase font-extrabold">Net Remaining Owed</div>
                        <div className="text-lg font-black text-amber-300">${grandRem.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
