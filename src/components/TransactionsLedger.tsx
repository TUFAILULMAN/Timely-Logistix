import React, { useState, useMemo } from 'react';
import { 
  FinancialTransaction, 
  PendingDriverPayment,
  PartialPaymentEntry,
  Driver, 
  Load, 
  CarrierOrOwner, 
  Invoice, 
  CompanySettings, 
  User,
  DriverAdvance,
  DriverSettlement
} from '../types';
import DispatchOwnerPaymentsLedger from './DispatchOwnerPaymentsLedger';
import { 
  Coins, 
  Search, 
  PlusCircle, 
  FileText, 
  ArrowRight, 
  Printer, 
  X, 
  Download, 
  ShieldCheck, 
  CheckCircle, 
  Trash2, 
  CreditCard, 
  Building2, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Filter, 
  Upload, 
  Image as ImageIcon,
  Check,
  AlertCircle,
  Truck,
  Flame,
  Layers,
  History,
  Handshake
} from 'lucide-react';
import { getSortedDriversByFrequency } from '../utils/driverSort';

interface TransactionsLedgerProps {
  currentUser: User;
  transactions?: FinancialTransaction[];
  pendingDriverPayments?: PendingDriverPayment[];
  drivers: Driver[];
  loads: Load[];
  carriers: CarrierOrOwner[];
  invoices: Invoice[];
  companySettings: CompanySettings;
  driverAdvances?: DriverAdvance[];
  driverSettlements?: DriverSettlement[];
  onAddTransaction: (tx: Omit<FinancialTransaction, 'id' | 'transactionNum' | 'createdAt'>) => Promise<void> | void;
  onEditTransaction: (id: string, updated: Partial<FinancialTransaction>) => Promise<void> | void;
  onDeleteTransaction: (id: string) => Promise<void> | void;
  onAddPendingPayment?: (payment: Omit<PendingDriverPayment, 'id' | 'paymentNum' | 'createdAt'>) => Promise<void> | void;
  onEditPendingPayment?: (id: string, updated: Partial<PendingDriverPayment>) => Promise<void> | void;
  onDeletePendingPayment?: (id: string) => Promise<void> | void;
  onRecordPartialPayment?: (pendingId: string, partial: Omit<PartialPaymentEntry, 'id'>) => Promise<void> | void;
  onCompletePendingPayment?: (pendingId: string) => Promise<void> | void;
  onEditInvoice?: (id: string, updated: Partial<Invoice>) => Promise<void> | void;
  onAddInvoice?: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => Promise<void> | void;
  onDeleteInvoice?: (id: string) => Promise<void> | void;
}

export default function TransactionsLedger({
  currentUser,
  transactions = [],
  pendingDriverPayments = [],
  drivers = [],
  loads = [],
  carriers = [],
  invoices = [],
  companySettings,
  driverAdvances = [],
  driverSettlements = [],
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onAddPendingPayment,
  onEditPendingPayment,
  onDeletePendingPayment,
  onRecordPartialPayment,
  onCompletePendingPayment,
  onEditInvoice,
  onAddInvoice,
  onDeleteInvoice
}: TransactionsLedgerProps) {
  const isAdmin = currentUser.role === 'ADMIN';

  // Section Tab State
  const [activeLedgerTab, setActiveLedgerTab] = useState<'PENDING_PAYMENTS' | 'DISPATCH_OWNER_PAYMENTS' | 'TRANSACTIONS'>('PENDING_PAYMENTS');

  // Transactions Filters & Modal state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');
  const [showProofOnly, setShowProofOnly] = useState<boolean>(false);

  const [isAddingForm, setIsAddingForm] = useState(false);
  const [selectedTxForCertificate, setSelectedTxForCertificate] = useState<FinancialTransaction | null>(null);

  // Form Fields for Transactions
  const [txCategory, setTxCategory] = useState<'DRIVER_ADVANCE' | 'DRIVER_LOAD_PAYMENT' | 'CARRIER_DISPATCH_FEE' | 'MISC_TRANSFER'>('DRIVER_ADVANCE');
  const [txDate, setTxDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [txAmount, setTxAmount] = useState<number>(500);
  const [txPaymentMethod, setTxPaymentMethod] = useState<FinancialTransaction['paymentMethod']>('ZELLE');
  const [txStatus, setTxStatus] = useState<'COMPLETED' | 'PENDING' | 'REJECTED'>('COMPLETED');
  const [txSenderName, setTxSenderName] = useState<string>('E & G Express');
  const [txSenderType, setTxSenderType] = useState<'OWNER' | 'BROKER' | 'CARRIER' | 'COMPANY'>('OWNER');
  const [txReceiverName, setTxReceiverName] = useState<string>('');
  const [txReceiverRole, setTxReceiverRole] = useState<string>('Driver');
  const [txLoadId, setTxLoadId] = useState<string>('');
  const [txLoadNum, setTxLoadNum] = useState<string>('');
  const [txInvoiceNum, setTxInvoiceNum] = useState<string>('');
  const [txNotes, setTxNotes] = useState<string>('');
  
  // File upload state for Transactions
  const [proofFileName, setProofFileName] = useState<string>('');
  const [proofFileType, setProofFileType] = useState<'image' | 'pdf' | 'other'>('image');
  const [proofBase64, setProofBase64] = useState<string>('');

  // -------------------------------------------------------------
  // PENDING & PARTIAL DRIVER PAYMENTS FORM & MODAL STATES
  // -------------------------------------------------------------
  const [isAddingPending, setIsAddingPending] = useState(false);
  const [pendingDriverId, setPendingDriverId] = useState<string>('');
  const [selectedLoadIdsForPending, setSelectedLoadIdsForPending] = useState<string[]>([]);
  const [customLoadNumsInput, setCustomLoadNumsInput] = useState<string>('');
  const [payoutRatePercent, setPayoutRatePercent] = useState<number>(80);
  const [initialPartialAmount, setInitialPartialAmount] = useState<number>(0);
  const [initialPaymentMethod, setInitialPaymentMethod] = useState<PartialPaymentEntry['paymentMethod']>('ZELLE');
  const [pendingStatus, setPendingStatus] = useState<'PENDING' | 'PARTIAL' | 'COMPLETED'>('PENDING');
  const [pendingNotes, setPendingNotes] = useState<string>('');

  // Partial Payment Modal State
  const [activePartialPending, setActivePartialPending] = useState<PendingDriverPayment | null>(null);
  const [partialAmountInput, setPartialAmountInput] = useState<number>(0);
  const [partialMethodInput, setPartialMethodInput] = useState<PartialPaymentEntry['paymentMethod']>('ZELLE');
  const [partialDateInput, setPartialDateInput] = useState<string>(new Date().toISOString().split('T')[0]);
  const [partialNotesInput, setPartialNotesInput] = useState<string>('');
  const [partialProofFileName, setPartialProofFileName] = useState<string>('');
  const [partialProofFileType, setPartialProofFileType] = useState<'image' | 'pdf' | 'other'>('image');
  const [partialProofBase64, setPartialProofBase64] = useState<string>('');

  // History / Proof Lightbox Modal
  const [activeHistoryPending, setActiveHistoryPending] = useState<PendingDriverPayment | null>(null);

  // -------------------------------------------------------------
  // SORT DRIVERS BY FREQUENCY (MOST-USED DRIVERS ON TOP)
  // -------------------------------------------------------------
  const sortedDrivers = useMemo(() => {
    return getSortedDriversByFrequency(drivers, loads, transactions, driverAdvances, driverSettlements, pendingDriverPayments);
  }, [drivers, loads, transactions, driverAdvances, driverSettlements, pendingDriverPayments]);

  // Selected driver object
  const selectedPendingDriver = useMemo(() => {
    return drivers.find(d => d.id === pendingDriverId);
  }, [drivers, pendingDriverId]);

  // Active loads available for selected driver from Load Board
  const availableDriverLoads = useMemo(() => {
    if (!pendingDriverId) return [];
    return loads.filter(l => l.driverId === pendingDriverId);
  }, [loads, pendingDriverId]);

  // Auto calculation of gross amount from selected loads
  const calculatedGrossFromLoads = useMemo(() => {
    if (selectedLoadIdsForPending.length === 0) return 0;
    return selectedLoadIdsForPending.reduce((sum, id) => {
      const l = loads.find(item => item.id === id);
      return sum + (l?.loadAmount || 0);
    }, 0);
  }, [loads, selectedLoadIdsForPending]);

  const totalCalculatedDriverPayout = useMemo(() => {
    return calculatedGrossFromLoads * (payoutRatePercent / 100);
  }, [calculatedGrossFromLoads, payoutRatePercent]);

  const remainingCalculatedBalance = useMemo(() => {
    return Math.max(0, totalCalculatedDriverPayout - initialPartialAmount);
  }, [totalCalculatedDriverPayout, initialPartialAmount]);

  // File Upload Handler for Partial Payments
  const handlePartialProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPartialProofFileName(file.name);
    setPartialProofFileType(file.type.includes('image') ? 'image' : file.type.includes('pdf') ? 'pdf' : 'other');

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setPartialProofBase64(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit New Pending Payment
  const handleSavePendingPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingDriverId) {
      alert('Please select a driver.');
      return;
    }

    const driverObj = drivers.find(d => d.id === pendingDriverId);
    if (!driverObj) return;

    const selectedLoadObjs = loads.filter(l => selectedLoadIdsForPending.includes(l.id));
    let loadNums = selectedLoadObjs.map(l => l.loadNum);

    if (customLoadNumsInput.trim()) {
      const customArr = customLoadNumsInput.split(',').map(s => s.trim()).filter(Boolean);
      loadNums = Array.from(new Set([...loadNums, ...customArr]));
    }

    if (loadNums.length === 0) {
      loadNums = ['Unspecified Load'];
    }

    const grossAmount = calculatedGrossFromLoads > 0 ? calculatedGrossFromLoads : 2000;
    const totalPayoutOwed = grossAmount * (payoutRatePercent / 100);

    const initialPartialHistory: PartialPaymentEntry[] = initialPartialAmount > 0 ? [
      {
        id: 'pt_init_' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        amount: initialPartialAmount,
        paymentMethod: initialPaymentMethod,
        notes: 'Initial partial payment recorded upon setup'
      }
    ] : [];

    const totalPartialPaid = initialPartialAmount;
    const remainingBalance = Math.max(0, totalPayoutOwed - totalPartialPaid);
    const calculatedStatus = pendingStatus === 'COMPLETED' ? 'COMPLETED' : (remainingBalance === 0 ? 'COMPLETED' : (totalPartialPaid > 0 ? 'PARTIAL' : 'PENDING'));

    if (onAddPendingPayment) {
      await onAddPendingPayment({
        driverId: pendingDriverId,
        driverName: driverObj.name,
        loadIds: selectedLoadIdsForPending,
        loadNums,
        totalGrossAmount: grossAmount,
        driverPayoutPercent: payoutRatePercent,
        totalDriverPayoutOwed: totalPayoutOwed,
        totalPartialPaid,
        remainingBalanceOwed: remainingBalance,
        status: calculatedStatus,
        partialHistory: initialPartialHistory,
        notes: pendingNotes.trim()
      });

      alert(`Pending payment recorded for ${driverObj.name}!`);
    }

    // Reset
    setIsAddingPending(false);
    setPendingDriverId('');
    setSelectedLoadIdsForPending([]);
    setCustomLoadNumsInput('');
    setInitialPartialAmount(0);
    setPendingNotes('');
  };

  // Submit Additional Partial Payment
  const handleRecordPartialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePartialPending || partialAmountInput <= 0) {
      alert('Please enter a valid partial payment amount.');
      return;
    }

    if (onRecordPartialPayment) {
      await onRecordPartialPayment(activePartialPending.id, {
        date: partialDateInput,
        amount: Number(partialAmountInput),
        paymentMethod: partialMethodInput,
        notes: partialNotesInput.trim(),
        proofFileName: partialProofFileName || undefined,
        proofFileType: partialProofFileType,
        proofBase64: partialProofBase64 || undefined
      });

      alert(`Partial payment of $${partialAmountInput} recorded for ${activePartialPending.driverName}!`);
    }

    setActivePartialPending(null);
    setPartialAmountInput(0);
    setPartialNotesInput('');
    setPartialProofFileName('');
    setPartialProofBase64('');
  };

  // Handle Mark Completed & Auto Shift to Driver Payouts
  const handleMarkCompleted = async (pendingId: string, driverName: string) => {
    if (confirm(`Mark Pending Payment as COMPLETED for ${driverName}? This will automatically shift the completed record into the Driver Payouts section.`)) {
      if (onCompletePendingPayment) {
        await onCompletePendingPayment(pendingId);
        alert(`Status updated to COMPLETED! Record shifted to Driver Payouts.`);
      }
    }
  };

  // File Upload Handler for Transactions
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProofFileName(file.name);
    setProofFileType(file.type.includes('image') ? 'image' : file.type.includes('pdf') ? 'pdf' : 'other');

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setProofBase64(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txSenderName.trim() || !txReceiverName.trim() || !txAmount || txAmount <= 0) {
      alert('Please fill in sender, receiver, and a valid positive amount.');
      return;
    }

    await onAddTransaction({
      date: txDate,
      category: txCategory,
      amount: Number(txAmount),
      senderName: txSenderName.trim(),
      senderType: txSenderType,
      receiverName: txReceiverName.trim(),
      receiverRole: txReceiverRole,
      loadId: txLoadId || undefined,
      loadNum: txLoadNum.trim() || undefined,
      invoiceNum: txInvoiceNum.trim() || undefined,
      paymentMethod: txPaymentMethod,
      status: txStatus,
      notes: txNotes.trim(),
      proofFileName: proofFileName || undefined,
      proofFileType: proofFileType,
      proofBase64: proofBase64 || undefined
    });

    setIsAddingForm(false);
    setTxAmount(500);
    setTxNotes('');
    setProofFileName('');
    setProofBase64('');
  };

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (selectedCategory !== 'ALL' && t.category !== selectedCategory) return false;
      if (selectedMethod !== 'ALL' && t.paymentMethod !== selectedMethod) return false;
      if (showProofOnly && !t.proofBase64 && !t.proofFileName) return false;

      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        t.transactionNum.toLowerCase().includes(term) ||
        t.senderName.toLowerCase().includes(term) ||
        t.receiverName.toLowerCase().includes(term) ||
        (t.loadNum && t.loadNum.toLowerCase().includes(term)) ||
        (t.invoiceNum && t.invoiceNum.toLowerCase().includes(term)) ||
        (t.notes && t.notes.toLowerCase().includes(term))
      );
    });
  }, [transactions, selectedCategory, selectedMethod, showProofOnly, searchTerm]);

  // Aggregate Stats
  const totalVolume = useMemo(() => transactions.reduce((acc, t) => acc + (t.amount || 0), 0), [transactions]);
  const totalAdvances = useMemo(() => transactions.filter(t => t.category === 'DRIVER_ADVANCE').reduce((acc, t) => acc + (t.amount || 0), 0), [transactions]);
  const totalPendingOwed = useMemo(() => pendingDriverPayments.filter(p => p.status !== 'COMPLETED').reduce((acc, p) => acc + p.remainingBalanceOwed, 0), [pendingDriverPayments]);
  const totalPartialSent = useMemo(() => pendingDriverPayments.reduce((acc, p) => acc + p.totalPartialPaid, 0), [pendingDriverPayments]);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Coins className="h-6 w-6 text-emerald-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">Financial Management Vault</span>
          </div>
          <h1 className="text-2xl font-black font-display tracking-tight text-white mt-1">
            Payments, Pending Drivers &amp; Transactions
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Manage partial driver payments, auto-sync driver load board ledger, track remaining balances owed, and shift completed payouts directly to Driver Payouts.
          </p>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveLedgerTab('PENDING_PAYMENTS')}
            className={`px-4 py-2 text-xs font-extrabold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeLedgerTab === 'PENDING_PAYMENTS'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Pending &amp; Partial Payments</span>
            {pendingDriverPayments.filter(p => p.status !== 'COMPLETED').length > 0 && (
              <span className="bg-rose-500 text-white text-[9px] font-mono px-1.5 py-0.5 rounded-full">
                {pendingDriverPayments.filter(p => p.status !== 'COMPLETED').length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveLedgerTab('DISPATCH_OWNER_PAYMENTS')}
            className={`px-4 py-2 text-xs font-extrabold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeLedgerTab === 'DISPATCH_OWNER_PAYMENTS'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Dispatch Owner Ledger ({invoices.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveLedgerTab('TRANSACTIONS')}
            className={`px-4 py-2 text-xs font-extrabold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeLedgerTab === 'TRANSACTIONS'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Transactions Vault ({transactions.length})</span>
          </button>
        </div>
      </div>

      {/* Overview Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider">
            <span>Pending Balance Owed</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-950 mt-2">
            ${totalPendingOwed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">
            Remaining owner liability for open loads
          </div>
        </div>

        <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200/80 shadow-sm">
          <div className="flex justify-between items-center text-emerald-800 text-[10px] font-mono font-bold uppercase tracking-wider">
            <span>Total Partial Payments Sent</span>
            <Handshake className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-950 mt-2">
            ${totalPartialSent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-emerald-700 mt-1 font-medium">
            Advances &amp; partial transfers paid out
          </div>
        </div>

        <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-200/80 shadow-sm">
          <div className="flex justify-between items-center text-blue-800 text-[10px] font-mono font-bold uppercase tracking-wider">
            <span>Total Transactions Volume</span>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black font-mono text-blue-950 mt-2">
            ${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-blue-700 mt-1 font-medium">
            Across {transactions.length} ledger records
          </div>
        </div>

        <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-sm">
          <div className="flex justify-between items-center text-slate-400 text-[10px] font-mono font-bold uppercase tracking-wider">
            <span>Auto-Sync Status</span>
            <CheckCircle className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-lg font-black font-mono text-emerald-400 mt-2">
            Driver Ledger Synced
          </div>
          <div className="text-[10px] text-slate-300 mt-1">
            Top drivers sorted by usage frequency
          </div>
        </div>
      </div>

      {/* TAB 2: DISPATCH OWNER PAYMENTS & PARTIAL LEDGER */}
      {activeLedgerTab === 'DISPATCH_OWNER_PAYMENTS' && (
        <DispatchOwnerPaymentsLedger
          currentUser={currentUser}
          invoices={invoices}
          carriers={carriers}
          companySettings={companySettings}
          onEditInvoice={onEditInvoice}
          onAddInvoice={onAddInvoice}
          onDeleteInvoice={onDeleteInvoice}
        />
      )}

      {/* TAB 1: PENDING & PARTIAL DRIVER PAYMENTS MANAGER */}
      {activeLedgerTab === 'PENDING_PAYMENTS' && (
        <div className="space-y-6">
          
          {/* Header Action Bar */}
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                Pending Driver Payments &amp; Partial Payment Manager
              </h3>
              <p className="text-xs text-slate-500">
                Auto-sync driver load board data, record partial owner advances, and shift completed records to Driver Payouts.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingPending(prev => !prev)}
              className="cursor-pointer px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-xs flex items-center gap-2 transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              <span>{isAddingPending ? 'Close Form' : '+ New Pending Payment'}</span>
            </button>
          </div>

          {/* Form: Add New Pending Payment */}
          {isAddingPending && (
            <form onSubmit={handleSavePendingPayment} className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-5">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-emerald-400 text-sm flex items-center gap-2">
                  <Flame className="h-4 w-4" />
                  Auto-Sync Driver Load Payment Calculator
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Frequency-Sorted Drivers &amp; Load Board Ledger</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Driver Selection (Sorted by Frequency, Most-Used on Top!) */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Select Driver <span className="text-emerald-400">(Frequent drivers on top 🔥)</span>
                  </label>
                  <select
                    value={pendingDriverId}
                    onChange={(e) => {
                      setPendingDriverId(e.target.value);
                      setSelectedLoadIdsForPending([]);
                    }}
                    required
                    className="w-full text-xs font-bold px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="">-- Choose Driver --</option>
                    {sortedDrivers.map((d, index) => (
                      <option key={d.id} value={d.id}>
                        {index < 3 ? '🔥 ' : ''}{d.name} {d.truckNum ? `(Truck #${d.truckNum})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Driver Agreed Payout % */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Driver Payout Share (%)</label>
                  <select
                    value={payoutRatePercent}
                    onChange={(e) => setPayoutRatePercent(Number(e.target.value))}
                    className="w-full text-xs font-bold px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-emerald-400 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value={80}>80% Standard Owner-Operator Pay</option>
                    <option value={82}>82% Premium Driver Pay</option>
                    <option value={78}>78% Standard Carrier Agreement</option>
                    <option value={75}>75% Company Driver Rate</option>
                    <option value={100}>100% Full Gross Pass-Through</option>
                  </select>
                </div>

                {/* Initial Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Status</label>
                  <select
                    value={pendingStatus}
                    onChange={(e) => setPendingStatus(e.target.value as any)}
                    className="w-full text-xs font-bold px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="PENDING">🔴 PENDING</option>
                    <option value="PARTIAL">🟡 PARTIAL PAYMENT SENT</option>
                    <option value="COMPLETED">🟢 COMPLETED (Shift to Driver Payouts)</option>
                  </select>
                </div>

              </div>

              {/* Load Board Auto-Sync Selector (Single or Multiple Loads!) */}
              {pendingDriverId && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Truck className="h-4 w-4" />
                      Select Active Load(s) for {selectedPendingDriver?.name} from Load Board:
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">
                      Selected: {selectedLoadIdsForPending.length} Load(s)
                    </span>
                  </div>

                  {availableDriverLoads.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-40 overflow-y-auto scrollbar-thin">
                      {availableDriverLoads.map((load) => {
                        const isSelected = selectedLoadIdsForPending.includes(load.id);
                        return (
                          <label
                            key={load.id}
                            className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                              isSelected
                                ? 'bg-emerald-950/80 border-emerald-500 text-white font-bold'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedLoadIdsForPending(prev => [...prev, load.id]);
                                  } else {
                                    setSelectedLoadIdsForPending(prev => prev.filter(id => id !== load.id));
                                  }
                                }}
                                className="rounded text-emerald-500 focus:ring-0"
                              />
                              <div>
                                <p className="font-mono font-extrabold text-white">Load #{load.loadNum}</p>
                                <p className="text-[10px] text-slate-400">{load.pickupLocation} → {load.deliveryLocation}</p>
                              </div>
                            </div>
                            <span className="font-mono text-emerald-400 font-bold">${load.loadAmount.toLocaleString()}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-amber-400/90 italic">
                      No active load board records found for this driver. Enter load numbers manually below:
                    </div>
                  )}

                  {/* Manual Load # Fallback */}
                  <div className="pt-2">
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Manual Load # or Multiple Load Numbers (comma separated):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 160884, 4501, 8820"
                      value={customLoadNumsInput}
                      onChange={(e) => setCustomLoadNumsInput(e.target.value)}
                      className="w-full text-xs font-mono px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                    />
                  </div>
                </div>
              )}

              {/* Calculations Box */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Gross Booking Amount:</span>
                  <span className="text-lg font-black text-white">${calculatedGrossFromLoads.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Driver Total Share ({payoutRatePercent}%):</span>
                  <span className="text-lg font-black text-emerald-400">${totalCalculatedDriverPayout.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="p-3 bg-emerald-950 rounded-lg border border-emerald-800">
                  <span className="text-emerald-300 text-[10px] block">Remaining Owed by Owner:</span>
                  <span className="text-lg font-black text-amber-300">${remainingCalculatedBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Initial Partial Payment Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Initial Partial Payment Sent Now ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={initialPartialAmount}
                    onChange={(e) => setInitialPartialAmount(Number(e.target.value))}
                    className="w-full text-xs font-mono font-bold px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Payment Method</label>
                  <select
                    value={initialPaymentMethod}
                    onChange={(e) => setInitialPaymentMethod(e.target.value as any)}
                    className="w-full text-xs font-bold px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="ZELLE">Zelle Transfer</option>
                    <option value="WIRE">Bank Wire / ACH</option>
                    <option value="CASH">Cash Transfer</option>
                    <option value="EFS">EFS / Comcheck</option>
                    <option value="CHECK">Paper Check</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Notes / Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. Load #160884 - Sent $1,000 partial. Balance $1,400 due upon final BOL."
                  value={pendingNotes}
                  onChange={(e) => setPendingNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingPending(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl uppercase tracking-wider"
                >
                  Save Pending Payment Record
                </button>
              </div>
            </form>
          )}

          {/* Pending Driver Payments List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h4 className="font-extrabold text-xs uppercase font-mono text-emerald-400 tracking-wider">
                Active Pending &amp; Partial Driver Payments Ledger ({pendingDriverPayments.length})
              </h4>
              <span className="text-[10px] text-slate-300 font-mono">
                Click "+ Partial Pay" to add advances or "Mark Completed" to shift to Driver Payouts
              </span>
            </div>

            {pendingDriverPayments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[9px] font-mono tracking-wider">
                      <th className="p-3">Ref #</th>
                      <th className="p-3">Driver Name</th>
                      <th className="p-3">Load(s)</th>
                      <th className="p-3 text-right">Gross Booking</th>
                      <th className="p-3 text-right">Total Driver Owed</th>
                      <th className="p-3 text-right">Partial Sent</th>
                      <th className="p-3 text-right">Remaining Balance</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingDriverPayments.map((p) => {
                      return (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono font-extrabold text-slate-900">{p.paymentNum}</td>
                          
                          <td className="p-3 font-bold text-slate-900">
                            {p.driverName}
                          </td>

                          <td className="p-3">
                            <span className="font-mono bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded-md font-bold text-[10px]">
                              {p.loadNums?.join(', ') || 'General Load'}
                            </span>
                          </td>

                          <td className="p-3 text-right font-mono text-slate-600">
                            ${p.totalGrossAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="p-3 text-right font-mono font-bold text-slate-800">
                            ${p.totalDriverPayoutOwed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="p-3 text-right font-mono font-bold text-emerald-700">
                            ${p.totalPartialPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="p-3 text-right font-mono font-black text-rose-600 text-sm">
                            ${p.remainingBalanceOwed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="p-3 text-center">
                            <span className={`inline-block text-[9px] font-bold font-mono px-2.5 py-1 rounded-full uppercase ${
                              p.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : p.status === 'PARTIAL'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-rose-100 text-rose-900 border border-rose-300'
                            }`}>
                              {p.status}
                            </span>
                          </td>

                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              
                              {/* Send Partial Pay Button */}
                              {p.status !== 'COMPLETED' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActivePartialPending(p);
                                    setPartialAmountInput(p.remainingBalanceOwed);
                                  }}
                                  className="cursor-pointer px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-extrabold flex items-center gap-1 shadow-xs"
                                  title="Add Partial Payment / Advance"
                                >
                                  <PlusCircle className="h-3 w-3" />
                                  <span>+ Partial</span>
                                </button>
                              )}

                              {/* View History & Proofs */}
                              <button
                                type="button"
                                onClick={() => setActiveHistoryPending(p)}
                                className="cursor-pointer px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1"
                                title="View Payment History & Screenshot Proofs"
                              >
                                <History className="h-3 w-3 text-slate-600" />
                                <span>History ({p.partialHistory?.length || 0})</span>
                              </button>

                              {/* Mark Completed & Shift */}
                              {p.status !== 'COMPLETED' ? (
                                <button
                                  type="button"
                                  onClick={() => handleMarkCompleted(p.id, p.driverName)}
                                  className="cursor-pointer px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-extrabold flex items-center gap-1 shadow-xs"
                                  title="Mark Completed & Auto-Shift to Driver Payouts"
                                >
                                  <Check className="h-3 w-3" />
                                  <span>Shift to Payouts</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-emerald-700 font-bold font-mono">✓ Shifted</span>
                              )}

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Delete pending payment #${p.paymentNum}?`)) {
                                    if (onDeletePendingPayment) onDeletePendingPayment(p.id);
                                  }
                                }}
                                className="cursor-pointer p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>

                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 italic">
                No active pending driver payments recorded yet. Click "+ New Pending Payment" above to create one.
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: TRANSACTIONS VAULT */}
      {activeLedgerTab === 'TRANSACTIONS' && (
        <div className="space-y-6">
          
          {/* Action Header */}
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Financial Ledger Records Vault</h3>
              <p className="text-xs text-slate-500">Historical financial transfers with image and PDF payment receipts.</p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingForm(prev => !prev)}
              className="cursor-pointer px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-xs flex items-center gap-2 transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              <span>{isAddingForm ? 'Close Form' : '+ Record New Transaction'}</span>
            </button>
          </div>

          {/* Form: Add Transaction */}
          {isAddingForm && (
            <form onSubmit={handleSaveTransaction} className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-emerald-400 text-sm">Record New Financial Transaction</h3>
                <span className="text-[10px] font-mono text-slate-400">Ledger Entry #TXN-AUTO</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value as any)}
                    className="w-full text-xs font-bold px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="DRIVER_ADVANCE">Driver Cash Advance / Fuel</option>
                    <option value="DRIVER_LOAD_PAYMENT">Driver Settlement Payout</option>
                    <option value="CARRIER_DISPATCH_FEE">Carrier 8% Dispatch Commission</option>
                    <option value="MISC_TRANSFER">Misc Transfer / Expense</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={txAmount}
                    onChange={(e) => setTxAmount(Number(e.target.value))}
                    className="w-full text-xs font-mono font-bold px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Payment Method</label>
                  <select
                    value={txPaymentMethod}
                    onChange={(e) => setTxPaymentMethod(e.target.value as any)}
                    className="w-full text-xs font-bold px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="ZELLE">Zelle Transfer</option>
                    <option value="WIRE">Bank Wire Transfer</option>
                    <option value="DIRECT_DEPOSIT">Direct Deposit / ACH</option>
                    <option value="CHECK">Paper Check</option>
                    <option value="CASH">Cash</option>
                    <option value="EFS">EFS / Comcheck</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Sender Name</label>
                  <input
                    type="text"
                    required
                    value={txSenderName}
                    onChange={(e) => setTxSenderName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Receiver Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Frederick Lemont (Driver)"
                    value={txReceiverName}
                    onChange={(e) => setTxReceiverName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              {/* Upload Payment Screenshot Proof */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Upload Payment Screenshot / Receipt Proof</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="w-full text-xs bg-slate-800 text-slate-300 border border-slate-700 rounded-xl px-3 py-1.5"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingForm(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl uppercase tracking-wider"
                >
                  Save Transaction Record
                </button>
              </div>
            </form>
          )}

          {/* Transactions Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[9px] font-mono tracking-wider">
                    <th className="p-3">Txn #</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Sender → Receiver</th>
                    <th className="p-3">Method</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Proof / Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-extrabold text-slate-900">{t.transactionNum}</td>
                      <td className="p-3 font-bold text-slate-800">{t.category.replace(/_/g, ' ')}</td>
                      <td className="p-3 text-slate-700">{t.senderName} → <strong>{t.receiverName}</strong></td>
                      <td className="p-3 font-mono text-slate-600">{t.paymentMethod}</td>
                      <td className="p-3 text-right font-mono font-black text-emerald-800 text-sm">
                        ${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-emerald-100 text-emerald-800 font-bold text-[9px] px-2 py-0.5 rounded-md uppercase">
                          {t.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedTxForCertificate(t)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[10px] font-bold inline-flex items-center gap-1"
                        >
                          <Printer className="h-3 w-3" />
                          <span>Certificate</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* MODAL: Record Partial Payment */}
      {activePartialPending && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleRecordPartialSubmit} className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Record Partial Payment for {activePartialPending.driverName}
              </h3>
              <button
                type="button"
                onClick={() => setActivePartialPending(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs font-mono">
              <span className="text-amber-800 block font-bold">Remaining Owed Balance:</span>
              <span className="text-lg font-black text-amber-950">${activePartialPending.remainingBalanceOwed.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Partial Payment Amount ($)</label>
              <input
                type="number"
                min={1}
                max={activePartialPending.remainingBalanceOwed}
                required
                value={partialAmountInput}
                onChange={(e) => setPartialAmountInput(Number(e.target.value))}
                className="w-full text-sm font-mono font-bold px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={partialMethodInput}
                  onChange={(e) => setPartialMethodInput(e.target.value as any)}
                  className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-xl"
                >
                  <option value="ZELLE">Zelle</option>
                  <option value="WIRE">Wire / ACH</option>
                  <option value="CASH">Cash</option>
                  <option value="EFS">EFS / Comcheck</option>
                  <option value="CHECK">Paper Check</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={partialDateInput}
                  onChange={(e) => setPartialDateInput(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            {/* Upload Payment Proof */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Upload Payment Screenshot Proof (PNG/JPG/PDF)</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handlePartialProofUpload}
                className="w-full text-xs text-slate-600 border border-slate-300 rounded-xl px-3 py-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Transaction Reference</label>
              <input
                type="text"
                placeholder="e.g. Zelle Confirmation #994812"
                value={partialNotesInput}
                onChange={(e) => setPartialNotesInput(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActivePartialPending(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl"
              >
                Submit Partial Payment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: History & Proofs Lightbox */}
      {activeHistoryPending && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Partial Payment History - {activeHistoryPending.driverName} ({activeHistoryPending.paymentNum})
              </h3>
              <button
                type="button"
                onClick={() => setActiveHistoryPending(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin">
              {activeHistoryPending.partialHistory && activeHistoryPending.partialHistory.length > 0 ? (
                activeHistoryPending.partialHistory.map((item, idx) => (
                  <div key={item.id || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center font-mono text-xs">
                      <span className="font-bold text-emerald-800">${item.amount.toLocaleString()} ({item.paymentMethod})</span>
                      <span className="text-slate-500">{item.date}</span>
                    </div>
                    {item.notes && <p className="text-xs text-slate-600">{item.notes}</p>}
                    
                    {item.proofBase64 && (
                      <div className="pt-2 border-t border-slate-200 text-center">
                        {item.proofBase64.startsWith('data:image/') || item.proofFileType === 'image' ? (
                          <img src={item.proofBase64} alt="Payment Proof" className="max-h-40 mx-auto rounded-lg border border-slate-300 shadow-xs" />
                        ) : (
                          <a href={item.proofBase64} download={item.proofFileName || 'Proof.pdf'} className="inline-block px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-lg">
                            Download Receipt PDF
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-400 italic">No partial payments recorded yet.</div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveHistoryPending(null)}
                className="px-4 py-2 bg-slate-800 text-white font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Lightbox Modal */}
      {selectedTxForCertificate && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Transaction Certificate #{selectedTxForCertificate.transactionNum}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedTxForCertificate(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <p><strong>Sender:</strong> {selectedTxForCertificate.senderName}</p>
              <p><strong>Receiver:</strong> {selectedTxForCertificate.receiverName}</p>
              <p><strong>Amount:</strong> ${selectedTxForCertificate.amount.toLocaleString()}</p>
              <p><strong>Date:</strong> {selectedTxForCertificate.date}</p>
              <p><strong>Payment Method:</strong> {selectedTxForCertificate.paymentMethod}</p>
              <p><strong>Status:</strong> {selectedTxForCertificate.status}</p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
              >
                Print Certificate
              </button>
              <button
                type="button"
                onClick={() => setSelectedTxForCertificate(null)}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
