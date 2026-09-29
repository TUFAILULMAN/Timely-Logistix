/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CarrierOrOwner, Driver, Dispatcher, Load, User } from '../types';
import { 
  Folder, 
  FolderPlus, 
  Users, 
  Printer, 
  Share2, 
  Check, 
  X, 
  Edit2, 
  Trash2, 
  ChevronRight, 
  Briefcase, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Percent, 
  FileSpreadsheet, 
  Plus,
  ArrowRight,
  UserCheck,
  Upload,
  ShieldAlert,
  PlusCircle,
  ShieldCheck,
  FileCheck,
  Download,
  Building2,
  CreditCard,
  CheckCircle2
} from 'lucide-react';

interface CarrierPayoutsHubProps {
  currentUser: User;
  drivers: Driver[];
  dispatchers: Dispatcher[];
  carriers: CarrierOrOwner[];
  loads: Load[];
  onAddCarrier: (carrier: Omit<CarrierOrOwner, 'id'>) => void;
  onEditCarrier: (id: string, updated: Partial<CarrierOrOwner>) => void;
  onDeleteCarrier: (id: string) => void;
  onAssignDriverDaily: (driverId: string, dispatcherId: string) => void;
  onEditDriver: (id: string, updated: Partial<Driver>) => void;
  onAddDriver: (driver: Omit<Driver, 'id'>) => void;
  onAddCarriersBulk?: (carriers: (Omit<CarrierOrOwner, 'id'> & { id?: string })[]) => Promise<void> | void;
}

export default function CarrierPayoutsHub({
  currentUser,
  drivers,
  dispatchers,
  carriers,
  loads,
  onAddCarrier,
  onEditCarrier,
  onDeleteCarrier,
  onAssignDriverDaily,
  onEditDriver,
  onAddDriver,
  onAddCarriersBulk
}: CarrierPayoutsHubProps) {
  const isAdmin = currentUser.role === 'ADMIN';

  // Sub-tabs: 'folders' | 'assignments' | 'payments'
  const [subTab, setSubTab] = useState<'folders' | 'assignments' | 'payments'>('folders');

  // Carrier CRUD state
  const [isAddingCarrier, setIsAddingCarrier] = useState(false);
  const [editingCarrierId, setEditingCarrierId] = useState<string | null>(null);
  const [carrierName, setCarrierName] = useState('');
  const [carrierType, setCarrierType] = useState<'OWNER_OPERATOR' | 'CARRIER'>('OWNER_OPERATOR');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [mcNumber, setMcNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [dotNumber, setDotNumber] = useState('');
  const [payoutRate, setPayoutRate] = useState<number>(22);
  const [dispatchRate, setDispatchRate] = useState<number>(8); // Editable rates: 8%, 7%, 5%, 4%
  const [truckType, setTruckType] = useState<string>('53ft Dry Van');
  const [carrierNotes, setCarrierNotes] = useState('');

  // Factoring state
  const [hasFactoring, setHasFactoring] = useState<boolean>(false);
  const [factoringCompanyName, setFactoringCompanyName] = useState<string>('');
  const [noticeOfAssignmentDoc, setNoticeOfAssignmentDoc] = useState<{ name: string; base64: string; uploadedAt: string } | undefined>(undefined);

  // Insurance state
  const [insuranceCompanyName, setInsuranceCompanyName] = useState<string>('');
  const [liabilityLimit, setLiabilityLimit] = useState<string>('$1,000,000');
  const [cargoLimit, setCargoLimit] = useState<string>('$100,000');
  const [certificateOfInsuranceDoc, setCertificateOfInsuranceDoc] = useState<{ name: string; base64: string; uploadedAt: string } | undefined>(undefined);

  // Compliance Paperwork state
  const [voidedCheckDoc, setVoidedCheckDoc] = useState<{ name: string; base64: string; uploadedAt: string } | undefined>(undefined);
  const [w9FormDoc, setW9FormDoc] = useState<{ name: string; base64: string; uploadedAt: string } | undefined>(undefined);
  const [mcAuthorityLetterDoc, setMcAuthorityLetterDoc] = useState<{ name: string; base64: string; uploadedAt: string } | undefined>(undefined);

  // Helper to handle base64 document upload
  const handleDocFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onSuccess: (doc: { name: string; base64: string; uploadedAt: string }) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Please select a file smaller than 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      onSuccess({
        name: file.name,
        base64,
        uploadedAt: new Date().toISOString()
      });
    };
    reader.readAsDataURL(file);
  };

  // Helper to download base64 file
  const downloadBase64File = (base64: string, filename: string) => {
    const link = document.createElement('a');
    link.href = base64;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Bulk Importer States for Carriers
  const [isImportingCarriers, setIsImportingCarriers] = useState(false);
  const [carrierImportText, setCarrierImportText] = useState('');
  const [carrierImportError, setCarrierImportError] = useState<string | null>(null);
  const [parsedCarriers, setParsedCarriers] = useState<any[]>([]);

  // Active Payout Modal State for Load-level printing/sharing
  const [activePayoutLoad, setActivePayoutLoad] = useState<Load | null>(null);
  const [customFeePercent, setCustomFeePercent] = useState<number>(22);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Filter lists based on role
  const myDispatcherObj = !isAdmin ? dispatchers.find(d => d.username === currentUser.username) : null;
  const myDispatcherId = myDispatcherObj?.id || '';

  // Carrier Folder Selection State (to view details)
  const [selectedCarrierFolder, setSelectedCarrierFolder] = useState<string | null>(null);

  // CRUD submits
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!carrierName.trim()) return;

    onAddCarrier({
      name: carrierName,
      type: carrierType,
      contactName,
      phone,
      mcNumber: mcNumber.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      dotNumber: dotNumber.trim() || undefined,
      payoutRatePercent: payoutRate,
      defaultDispatchRatePercent: dispatchRate,
      truckType: truckType,
      notes: carrierNotes,
      hasFactoring,
      factoringCompanyName: hasFactoring ? factoringCompanyName.trim() : undefined,
      noticeOfAssignmentDoc,
      insuranceCompanyName: insuranceCompanyName.trim() || undefined,
      liabilityLimit: liabilityLimit.trim() || undefined,
      cargoLimit: cargoLimit.trim() || undefined,
      certificateOfInsuranceDoc,
      voidedCheckDoc,
      w9FormDoc,
      mcAuthorityLetterDoc
    });

    setIsAddingCarrier(false);
    resetForm();
  };

  const startEdit = (c: CarrierOrOwner) => {
    setEditingCarrierId(c.id);
    setCarrierName(c.name);
    setCarrierType(c.type);
    setContactName(c.contactName);
    setPhone(c.phone);
    setMcNumber(c.mcNumber || '');
    setEmail(c.email || '');
    setAddress(c.address || '');
    setDotNumber(c.dotNumber || '');
    setPayoutRate(c.payoutRatePercent);
    setDispatchRate(c.defaultDispatchRatePercent || 8);
    setTruckType(c.truckType || '53ft Dry Van');
    setCarrierNotes(c.notes || '');
    setHasFactoring(c.hasFactoring || false);
    setFactoringCompanyName(c.factoringCompanyName || '');
    setNoticeOfAssignmentDoc(c.noticeOfAssignmentDoc);
    setInsuranceCompanyName(c.insuranceCompanyName || '');
    setLiabilityLimit(c.liabilityLimit ? String(c.liabilityLimit) : '$1,000,000');
    setCargoLimit(c.cargoLimit ? String(c.cargoLimit) : '$100,000');
    setCertificateOfInsuranceDoc(c.certificateOfInsuranceDoc);
    setVoidedCheckDoc(c.voidedCheckDoc);
    setW9FormDoc(c.w9FormDoc);
    setMcAuthorityLetterDoc(c.mcAuthorityLetterDoc);
  };

  const handleSaveEdit = (id: string) => {
    onEditCarrier(id, {
      name: carrierName,
      type: carrierType,
      contactName,
      phone,
      mcNumber: mcNumber.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      dotNumber: dotNumber.trim() || undefined,
      payoutRatePercent: payoutRate,
      defaultDispatchRatePercent: dispatchRate,
      truckType: truckType,
      notes: carrierNotes,
      hasFactoring,
      factoringCompanyName: hasFactoring ? factoringCompanyName.trim() : undefined,
      noticeOfAssignmentDoc,
      insuranceCompanyName: insuranceCompanyName.trim() || undefined,
      liabilityLimit: liabilityLimit.trim() || undefined,
      cargoLimit: cargoLimit.trim() || undefined,
      certificateOfInsuranceDoc,
      voidedCheckDoc,
      w9FormDoc,
      mcAuthorityLetterDoc
    });
    setEditingCarrierId(null);
    resetForm();
  };

  const resetForm = () => {
    setCarrierName('');
    setCarrierType('OWNER_OPERATOR');
    setContactName('');
    setPhone('');
    setMcNumber('');
    setEmail('');
    setAddress('');
    setDotNumber('');
    setPayoutRate(22);
    setDispatchRate(8);
    setTruckType('53ft Dry Van');
    setCarrierNotes('');
    setHasFactoring(false);
    setFactoringCompanyName('');
    setNoticeOfAssignmentDoc(undefined);
    setInsuranceCompanyName('');
    setLiabilityLimit('$1,000,000');
    setCargoLimit('$100,000');
    setCertificateOfInsuranceDoc(undefined);
    setVoidedCheckDoc(undefined);
    setW9FormDoc(undefined);
    setMcAuthorityLetterDoc(undefined);
  };

  const parseCarriersCSVorTSV = (text: string) => {
    try {
      setCarrierImportError(null);
      if (!text.trim()) {
        setCarrierImportError("Please paste some data or select a valid CSV file.");
        return;
      }

      const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
      if (lines.length === 0) {
        setCarrierImportError("No readable lines found in the input data.");
        return;
      }

      const hasTabs = text.includes('\t');
      const sep = hasTabs ? '\t' : ',';

      const parseLineFields = (line: string) => {
        if (sep === '\t') {
          return line.split('\t').map(f => f.trim().replace(/^["']|["']$/g, ''));
        }
        
        const fields: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"' || char === "'") {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            fields.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        fields.push(current.trim());
        return fields.map(f => f.replace(/^["']|["']$/g, ''));
      };

      const parsedRows = lines.map(parseLineFields);
      if (parsedRows.length === 0) {
        setCarrierImportError("No parseable rows found.");
        return;
      }

      const firstRow = parsedRows[0];
      let hasHeader = false;
      let nameColIdx = -1;
      let typeColIdx = -1;
      let contactColIdx = -1;
      let phoneColIdx = -1;
      let payoutColIdx = -1;
      let addressColIdx = -1;
      let dotColIdx = -1;
      let mcColIdx = -1;
      let emailColIdx = -1;
      let notesColIdx = -1;

      firstRow.forEach((col, idx) => {
        const val = col.toLowerCase().replace(/[\s#_]/g, '');
        if (val.includes('company') || val.includes('carrier') || val.includes('firm') || val.includes('partner') || (val.includes('name') && !val.includes('contact') && nameColIdx === -1)) {
          nameColIdx = idx;
          hasHeader = true;
        } else if (val.includes('type') || val.includes('category') || val.includes('entity')) {
          typeColIdx = idx;
          hasHeader = true;
        } else if (val.includes('contact') || val.includes('representative') || val.includes('rep') || val.includes('manager')) {
          contactColIdx = idx;
          hasHeader = true;
        } else if (val.includes('phone') || val.includes('tel') || val.includes('mobile') || val.includes('cell')) {
          phoneColIdx = idx;
          hasHeader = true;
        } else if (val.includes('payout') || val.includes('rate') || val.includes('fee') || val.includes('percent')) {
          payoutColIdx = idx;
          hasHeader = true;
        } else if (val.includes('address') || val.includes('street') || val.includes('location')) {
          addressColIdx = idx;
          hasHeader = true;
        } else if (val.includes('dot') || val.includes('usdot')) {
          dotColIdx = idx;
          hasHeader = true;
        } else if (val.includes('mc') || val.includes('mcnumber')) {
          mcColIdx = idx;
          hasHeader = true;
        } else if (val.includes('email') || val.includes('mail')) {
          emailColIdx = idx;
          hasHeader = true;
        } else if (val.includes('notes') || val.includes('desc') || val.includes('memo')) {
          notesColIdx = idx;
          hasHeader = true;
        }
      });

      const dataRows = hasHeader ? parsedRows.slice(1) : parsedRows;
      if (dataRows.length === 0) {
        setCarrierImportError("No data records found below the header row.");
        return;
      }

      if (!hasHeader) {
        const sampleRow = dataRows[0];
        sampleRow.forEach((val, idx) => {
          const clean = val.trim();
          if (clean.includes('@')) {
            if (emailColIdx === -1) emailColIdx = idx;
          } else if (clean.match(/^\+?[\d\s\-\(\)]{7,20}$/)) {
            if (phoneColIdx === -1) phoneColIdx = idx;
          } else if (clean.match(/^\d+(\.\d+)?%?$/) && (parseFloat(clean) === 18 || parseFloat(clean) === 22 || parseFloat(clean) === 8)) {
            if (payoutColIdx === -1) payoutColIdx = idx;
          } else if (nameColIdx === -1) {
            nameColIdx = idx;
          }
        });
      }

      const drafts: any[] = [];
      dataRows.forEach((row, rowIdx) => {
        const rawName = nameColIdx !== -1 && row[nameColIdx] ? row[nameColIdx].trim() : '';
        if (!rawName) return;

        const rawType = typeColIdx !== -1 && row[typeColIdx] ? row[typeColIdx].trim().toUpperCase() : 'OWNER_OPERATOR';
        const rawContact = contactColIdx !== -1 && row[contactColIdx] ? row[contactColIdx].trim() : rawName;
        const rawPhone = phoneColIdx !== -1 && row[phoneColIdx] ? row[phoneColIdx].trim() : '(555) 555-5555';
        const rawPayout = payoutColIdx !== -1 && row[payoutColIdx] ? row[payoutColIdx].replace(/[\$%]/g, '').trim() : '22';
        const rawAddress = addressColIdx !== -1 && row[addressColIdx] ? row[addressColIdx].trim() : '';
        const rawDot = dotColIdx !== -1 && row[dotColIdx] ? row[dotColIdx].trim() : '';
        const rawMc = mcColIdx !== -1 && row[mcColIdx] ? row[mcColIdx].trim() : '';
        const rawEmail = emailColIdx !== -1 && row[emailColIdx] ? row[emailColIdx].trim() : '';
        const rawNotes = notesColIdx !== -1 && row[notesColIdx] ? row[notesColIdx].trim() : '';

        let payoutVal: 8 | 18 | 22 = 22;
        const parsedPayout = parseInt(rawPayout);
        if (parsedPayout === 8 || parsedPayout === 18 || parsedPayout === 22) {
          payoutVal = parsedPayout as 8 | 18 | 22;
        }

        drafts.push({
          id: `draft_${Date.now()}_${rowIdx}_${Math.random().toString(36).substr(2, 4)}`,
          name: rawName,
          type: rawType.includes('CARRIER') ? 'CARRIER' : 'OWNER_OPERATOR',
          contactName: rawContact,
          phone: rawPhone,
          payoutRatePercent: payoutVal,
          address: rawAddress || undefined,
          dotNumber: rawDot || undefined,
          mcNumber: rawMc || undefined,
          email: rawEmail || undefined,
          notes: rawNotes || 'Imported via spreadsheet'
        });
      });

      if (drafts.length === 0) {
        setCarrierImportError("Could not extract any carriers. Please check your columns or paste format.");
      } else {
        setParsedCarriers(drafts);
      }
    } catch (err: any) {
      setCarrierImportError(`Parsing error: ${err.message || 'Please check input structure.'}`);
    }
  };

  const handleCarriersFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCarriersCSVorTSV(text);
    };
    reader.onerror = () => {
      setCarrierImportError("Failed to read selected file.");
    };
    reader.readAsText(file);
  };

  const handleSaveCarriersBulkImport = async () => {
    if (parsedCarriers.length === 0) return;

    if (onAddCarriersBulk) {
      const carriersPayload = parsedCarriers.map(draft => ({
        name: draft.name,
        type: draft.type,
        contactName: draft.contactName,
        phone: draft.phone,
        payoutRatePercent: draft.payoutRatePercent,
        address: draft.address,
        dotNumber: draft.dotNumber,
        mcNumber: draft.mcNumber,
        email: draft.email,
        notes: draft.notes,
        companyDocs: []
      }));
      await onAddCarriersBulk(carriersPayload);
    } else {
      for (const draft of parsedCarriers) {
        await onAddCarrier({
          name: draft.name,
          type: draft.type,
          contactName: draft.contactName,
          phone: draft.phone,
          payoutRatePercent: draft.payoutRatePercent,
          address: draft.address,
          dotNumber: draft.dotNumber,
          mcNumber: draft.mcNumber,
          email: draft.email,
          notes: draft.notes
        });
      }
    }

    setParsedCarriers([]);
    setCarrierImportText('');
    setIsImportingCarriers(false);
  };

  // Render Load Payout dynamic PDF report details
  const triggerPayoutReport = (load: Load) => {
    setActivePayoutLoad(load);
    setCustomFeePercent(load.feePercent || 22);
    setShareSuccess(false);
  };

  // Payout math helper (with selectable fee percent: number)
  const computePayoutReportDetails = (load: Load, feeRate: number) => {
    const grossVal = load.loadAmount;
    const feeDollar = (grossVal * feeRate) / 100;
    const deductions = load.advanceFuel + load.cashAdvance + load.repairDeduction + load.tollDeduction || 0;
    // Payout to Carrier Owner = Gross - Fee - Deductions
    const netPayout = grossVal - feeDollar - (load.advanceFuel + load.cashAdvance + load.repairDeduction + load.tollDeduction);
    return {
      grossVal,
      feeDollar,
      deductions,
      netPayout,
      retainedCompanyAmount: feeDollar
    };
  };

  const handleShareReport = (load: Load, feePercent: number) => {
    const driverObj = drivers.find(d => d.id === load.driverId);
    const carrierObj = carriers.find(c => c.id === driverObj?.carrierId);
    const data = computePayoutReportDetails(load, feePercent);

    const shareText = `*TIMLEY LOGISTIX PAYOUT RECEIPT*
Load ID: ${load.loadNum}
Broker: ${load.broker}
Route: ${load.pickupLocation} -> ${load.deliveryLocation}
Driver: ${driverObj?.name || 'N/A'} (Truck #${driverObj?.truckNum || 'N/A'})
Owner/Company: ${carrierObj?.name || 'Direct / Independent'}
---------------------------
Gross Load Amount: $${data.grossVal.toLocaleString()}
Service Fee Retained (${feePercent}%): $${data.feeDollar.toLocaleString()}
Total Deductions (Fuel, cash advances, tolls, repairs): $${data.deductions.toLocaleString()}
---------------------------
*NET PAYOUT SENT TO OWNER: $${data.netPayout.toLocaleString()}*

Offline Receipt Active. Verified via Timely Logistix Management Suite.`;

    if (navigator.share) {
      navigator.share({
        title: `Payout Load #${load.loadNum}`,
        text: shareText
      }).catch(err => {
        console.error('Sharing failed', err);
        copyToClipboard(shareText);
      });
    } else {
      copyToClipboard(shareText);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 3000);
  };

  // PDF Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="carrier_payouts_hub" className="space-y-6">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm no-print">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 font-display">
            Timely Logistix Carrier &amp; Owner Operator Desk
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Group operations into custom partner folders, run daily dispatcher assignments, and handle instant selectable load payouts.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => { setSubTab('folders'); setSelectedCarrierFolder(null); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              subTab === 'folders' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            📁 Owner Folders
          </button>
          <button
            onClick={() => setSubTab('assignments')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              subTab === 'assignments' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            🔄 Dynamic Assignments
          </button>
          <button
            onClick={() => setSubTab('payments')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              subTab === 'payments' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            💳 Selectable Payments
          </button>
        </div>
      </div>

      {/**********************************************************
       * SUB METER 1: OWNER OPERATORS / CARRIER DIRECTORY FOLDERS 
       **********************************************************/}
      {subTab === 'folders' && (
        <div id="folders_desk" className="space-y-6 no-print">
          
          <div className="flex justify-between items-center bg-slate-50 p-1 rounded-xl">
            <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase px-2">
              Registered Partner Portfolios
            </h3>
            {isAdmin && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportingCarriers(!isImportingCarriers);
                    setIsAddingCarrier(false);
                    setEditingCarrierId(null);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-500 px-3 py-1.5 bg-emerald-50 rounded-lg cursor-pointer transition-all"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>{isImportingCarriers ? 'Close Importer' : 'Import Carriers (CSV)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCarrier(!isAddingCarrier);
                    setIsImportingCarriers(false);
                    setEditingCarrierId(null);
                    resetForm();
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-500 px-3 py-1.5 bg-blue-50 rounded-lg cursor-pointer transition-all"
                >
                  <FolderPlus className="h-4 w-4" />
                  <span>Onboard Partner Company</span>
                </button>
              </div>
            )}
          </div>

          {/* Carriers Bulk Importer (Toggled) */}
          {isImportingCarriers && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-lg space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  <span>Bulk Carriers &amp; Owner Operators Spreadsheet Importer</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsImportingCarriers(false);
                    setParsedCarriers([]);
                    setCarrierImportText('');
                  }}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Option 1: Paste spreadsheet rows</h4>
                  <p className="text-xs text-slate-500">
                    Select and copy carrier cells directly from Google Sheets or Excel, then paste them below:
                  </p>
                  <textarea
                    rows={6}
                    placeholder="Paste columns here...&#10;e.g. Algonquin Group LLC	CARRIER	Chris Owens	(312) 555-0192	22%	Chicago, IL	US-DOT-123	MC-9999"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-850 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={carrierImportText}
                    onChange={e => setCarrierImportText(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => parseCarriersCSVorTSV(carrierImportText)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-all shadow-sm cursor-pointer"
                  >
                    Analyze &amp; Parse Pasted Text
                  </button>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Option 2: Upload CSV File</h4>
                  <p className="text-xs text-slate-500">
                    Select a CSV file containing your carrier directory to parse values directly:
                  </p>
                  
                  <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-6 hover:border-blue-400 hover:bg-slate-50/50 flex flex-col items-center justify-center text-center cursor-pointer min-h-[160px]">
                    <input
                      type="file"
                      accept=".csv,.txt,.tsv"
                      onChange={handleCarriersFileSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="h-8 w-8 text-slate-400 mb-2" />
                    <span className="text-xs font-semibold text-slate-600">Click or drag CSV file here</span>
                    <span className="text-[10px] text-slate-400 mt-1">Accepts .csv, .tsv or raw txt</span>
                  </div>
                </div>
              </div>

              {/* Import error */}
              {carrierImportError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{carrierImportError}</span>
                </div>
              )}

              {/* Parsed output preview and confirmation */}
              {parsedCarriers.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Parsed Preview ({parsedCarriers.length} Carriers Found)
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setParsedCarriers([]);
                          setCarrierImportText('');
                        }}
                        className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveCarriersBulkImport}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
                      >
                        <PlusCircle className="h-4 w-4" />
                        <span>Confirm &amp; Import {parsedCarriers.length} Carriers</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-mono">
                          <th className="p-2.5 font-semibold">Company Name</th>
                          <th className="p-2.5 font-semibold">Type</th>
                          <th className="p-2.5 font-semibold">Representative</th>
                          <th className="p-2.5 font-semibold">Phone</th>
                          <th className="p-2.5 font-semibold">Fee Rate</th>
                          <th className="p-2.5 font-semibold">Address</th>
                          <th className="p-2.5 font-semibold">USDOT #</th>
                          <th className="p-2.5 font-semibold">MC #</th>
                          <th className="p-2.5 font-semibold">Email</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {parsedCarriers.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-slate-50 text-slate-700">
                            <td className="p-2.5 font-semibold">{item.name}</td>
                            <td className="p-2.5">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                item.type === 'OWNER_OPERATOR' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                              }`}>
                                {item.type}
                              </span>
                            </td>
                            <td className="p-2.5 font-medium">{item.contactName}</td>
                            <td className="p-2.5">{item.phone}</td>
                            <td className="p-2.5 font-bold text-blue-600">{item.payoutRatePercent}%</td>
                            <td className="p-2.5 text-slate-500">{item.address || 'N/A'}</td>
                            <td className="p-2.5 font-mono text-[10px] bg-slate-50/50">{item.dotNumber || 'N/A'}</td>
                            <td className="p-2.5 font-mono text-[10px] bg-slate-50/50">{item.mcNumber || 'N/A'}</td>
                            <td className="p-2.5 text-slate-500">{item.email || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Expansion for CRUD (Admins) */}
          {(isAddingCarrier || editingCarrierId) && (
            <form 
              onSubmit={editingCarrierId ? (e) => { e.preventDefault(); handleSaveEdit(editingCarrierId); } : handleAddSubmit} 
              className="bg-white p-6 rounded-2xl border border-blue-100 shadow-md space-y-4 max-w-4xl"
            >
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-blue-600" />
                <span>{editingCarrierId ? 'Edit Partner Company Profile' : 'Register New Owner Operator / Carrier Folder'}</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Company / Fleet Name</label>
                  <input
                    type="text"
                    required
                    value={carrierName}
                    onChange={(e) => setCarrierName(e.target.value)}
                    placeholder="e.g., Algonquin Group LLC"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Company Entity Type</label>
                  <select
                    value={carrierType}
                    onChange={(e) => setCarrierType(e.target.value as 'OWNER_OPERATOR' | 'CARRIER')}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50"
                  >
                    <option value="OWNER_OPERATOR">Independent Owner Operator</option>
                    <option value="CARRIER">Contracted Carrier Fleet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-700 mb-1">Agreed Carrier Dispatch Rate (%)</label>
                  <select
                    value={dispatchRate}
                    onChange={(e) => setDispatchRate(Number(e.target.value))}
                    className="w-full text-xs font-bold px-3 py-2 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-emerald-50 text-emerald-950"
                  >
                    <option value={8}>8% Standard Carrier Dispatch Fee</option>
                    <option value={7}>7% Volume / Multi-Truck Agreement Rate</option>
                    <option value={5}>5% Exclusive Partner Rate</option>
                    <option value={4}>4% Special Truck / Fleet Agreement Rate</option>
                    <option value={10}>10% Dedicated Dispatch Rate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Truck / Trailer Equipment Type</label>
                  <select
                    value={truckType}
                    onChange={(e) => setTruckType(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50"
                  >
                    <option value="53ft Dry Van">53ft Dry Van</option>
                    <option value="53ft Reefer">53ft Reefer (Temperature Control)</option>
                    <option value="Flatbed">Flatbed (48ft / 53ft)</option>
                    <option value="Stepdeck">Stepdeck / Dropdeck</option>
                    <option value="Power Only">Power Only</option>
                    <option value="Box Truck">Box Truck / Straight Truck</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Primary Fee Bracket</label>
                  <select
                    value={payoutRate}
                    onChange={(e) => setPayoutRate(Number(e.target.value) as 18 | 22)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50"
                  >
                    <option value={22}>22% Timely Logistix Fee</option>
                    <option value={18}>18% Timely Logistix Fee</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Contact Representative</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Representative Name"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Direct Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-blue-700 mb-1">Carrier MC Number (MC#)</label>
                  <input
                    type="text"
                    value={mcNumber}
                    onChange={(e) => setMcNumber(e.target.value)}
                    placeholder="e.g., MC-123456"
                    className="w-full text-xs font-mono font-bold px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-blue-50/40 text-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g., dispatch@carrier.com"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Physical / Mailing Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g., 100 Main St, Chicago, IL 60601"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">USDOT Number</label>
                  <input
                    type="text"
                    value={dotNumber}
                    onChange={(e) => setDotNumber(e.target.value)}
                    placeholder="e.g., US-DOT-987654"
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Notes / Operational Rules</label>
                  <input
                    type="text"
                    value={carrierNotes}
                    onChange={(e) => setCarrierNotes(e.target.value)}
                    placeholder="Route instructions..."
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50"
                  />
                </div>
              </div>

              {/* CRM SECTION 1: Factoring & Notice of Assignment (NOA) */}
              <div className="p-4 bg-blue-50/50 border border-blue-200/80 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                      Factoring Details &amp; Notice of Assignment (NOA)
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasFactoring}
                      onChange={(e) => setHasFactoring(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-slate-700">Uses Factoring Company</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Factoring Company Name
                    </label>
                    <input
                      type="text"
                      value={factoringCompanyName}
                      onChange={(e) => setFactoringCompanyName(e.target.value)}
                      placeholder="e.g., Apex Capital, Triumph, RTS Financial"
                      disabled={!hasFactoring}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Notice of Assignment (NOA) Document (JPG or PDF)
                    </label>
                    {noticeOfAssignmentDoc ? (
                      <div className="flex items-center justify-between p-2 bg-white border border-emerald-300 rounded-lg text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span className="truncate font-semibold text-slate-800">{noticeOfAssignmentDoc.name}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => downloadBase64File(noticeOfAssignmentDoc.base64, noticeOfAssignmentDoc.name)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-600"
                            title="Download NOA"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setNoticeOfAssignmentDoc(undefined)}
                            className="p-1 hover:bg-rose-50 rounded text-rose-500"
                            title="Remove NOA"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => handleDocFileUpload(e, setNoticeOfAssignmentDoc)}
                        disabled={!hasFactoring}
                        className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200 cursor-pointer disabled:opacity-50"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* CRM SECTION 2: Insurance & Coverage Limits */}
              <div className="p-4 bg-emerald-50/40 border border-emerald-200/80 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                    Insurance Details &amp; Certificate of Insurance (COI)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Insurance Company Name
                    </label>
                    <input
                      type="text"
                      value={insuranceCompanyName}
                      onChange={(e) => setInsuranceCompanyName(e.target.value)}
                      placeholder="e.g., Progressive Commercial, Great West"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Auto Liability Limit
                    </label>
                    <input
                      type="text"
                      value={liabilityLimit}
                      onChange={(e) => setLiabilityLimit(e.target.value)}
                      placeholder="e.g., $1,000,000"
                      className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Cargo Coverage Limit
                    </label>
                    <input
                      type="text"
                      value={cargoLimit}
                      onChange={(e) => setCargoLimit(e.target.value)}
                      placeholder="e.g., $100,000"
                      className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Certificate of Insurance (COI) Paper Upload (JPG or PDF)
                    </label>
                    {certificateOfInsuranceDoc ? (
                      <div className="flex items-center justify-between p-2 bg-white border border-emerald-300 rounded-lg text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span className="truncate font-semibold text-slate-800">{certificateOfInsuranceDoc.name}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => downloadBase64File(certificateOfInsuranceDoc.base64, certificateOfInsuranceDoc.name)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-600"
                            title="Download COI"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCertificateOfInsuranceDoc(undefined)}
                            className="p-1 hover:bg-rose-50 rounded text-rose-500"
                            title="Remove COI"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => handleDocFileUpload(e, setCertificateOfInsuranceDoc)}
                        className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200 cursor-pointer"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* CRM SECTION 3: Compliance Paperwork Uploads (JPG or PDF) */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-700" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Carrier Compliance Paperwork (JPG or PDF)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Voided Check */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Voided Check
                    </label>
                    {voidedCheckDoc ? (
                      <div className="flex items-center justify-between p-2 bg-white border border-emerald-300 rounded-lg text-xs">
                        <span className="truncate font-semibold text-slate-800 text-[11px]">{voidedCheckDoc.name}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => downloadBase64File(voidedCheckDoc.base64, voidedCheckDoc.name)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-600"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setVoidedCheckDoc(undefined)}
                            className="p-1 hover:bg-rose-50 rounded text-rose-500"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => handleDocFileUpload(e, setVoidedCheckDoc)}
                        className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-slate-200 file:text-slate-800 hover:file:bg-slate-300 cursor-pointer"
                      />
                    )}
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Direct pay banking scan</span>
                  </div>

                  {/* W-9 Form */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      W-9 Form
                    </label>
                    {w9FormDoc ? (
                      <div className="flex items-center justify-between p-2 bg-white border border-emerald-300 rounded-lg text-xs">
                        <span className="truncate font-semibold text-slate-800 text-[11px]">{w9FormDoc.name}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => downloadBase64File(w9FormDoc.base64, w9FormDoc.name)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-600"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setW9FormDoc(undefined)}
                            className="p-1 hover:bg-rose-50 rounded text-rose-500"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => handleDocFileUpload(e, setW9FormDoc)}
                        className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-slate-200 file:text-slate-800 hover:file:bg-slate-300 cursor-pointer"
                      />
                    )}
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Signed IRS W-9 form</span>
                  </div>

                  {/* MC Authority Letter */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      MC Authority Letter
                    </label>
                    {mcAuthorityLetterDoc ? (
                      <div className="flex items-center justify-between p-2 bg-white border border-emerald-300 rounded-lg text-xs">
                        <span className="truncate font-semibold text-slate-800 text-[11px]">{mcAuthorityLetterDoc.name}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => downloadBase64File(mcAuthorityLetterDoc.base64, mcAuthorityLetterDoc.name)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-600"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setMcAuthorityLetterDoc(undefined)}
                            className="p-1 hover:bg-rose-50 rounded text-rose-500"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => handleDocFileUpload(e, setMcAuthorityLetterDoc)}
                        className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-slate-200 file:text-slate-800 hover:file:bg-slate-300 cursor-pointer"
                      />
                    )}
                    <span className="text-[10px] text-slate-400 mt-0.5 block">FMCSA operating authority</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => { setIsAddingCarrier(false); setEditingCarrierId(null); resetForm(); }}
                  className="px-4 py-2 bg-slate-150 text-slate-700 hover:bg-slate-200 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg cursor-pointer"
                >
                  {editingCarrierId ? 'Save Changes' : 'Register Folder'}
                </button>
              </div>
            </form>
          )}

          {/* Grid Layout of Folders */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {carriers.map(c => {
              const assignedDrivers = drivers.filter(d => d.carrierId === c.id);
              const driverIds = assignedDrivers.map(d => d.id);
              const carrierLoads = loads.filter(l => driverIds.includes(l.driverId));
              const totalGross = carrierLoads.reduce((sum, cl) => sum + cl.loadAmount, 0);

              return (
                <div 
                  key={c.id}
                  className={`bg-white rounded-2xl border transition-all relative overflow-hidden group hover:shadow-md ${
                    selectedCarrierFolder === c.id 
                      ? 'border-blue-500 ring-1 ring-blue-500/20 shadow-blue-500/5 shadow-md' 
                      : 'border-slate-200/80'
                  }`}
                >
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2.5 rounded-xl ${c.type === 'CARRIER' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                          <Folder className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors font-display truncate max-w-[160px]">
                            {c.name}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400 font-bold tracking-wider block mt-0.5">
                            {c.type === 'CARRIER' ? '💼 Contract Carrier' : '🚜 Owner Operator'}
                          </span>
                        </div>
                      </div>

                      {/* CRUD Buttons */}
                      {isAdmin && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(c)}
                            title="Edit partner metadata"
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete folder: ${c.name}? Associated drivers will be set back to unassigned.`)) {
                                onDeleteCarrier(c.id);
                              }
                            }}
                            title="Delete folder"
                            className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3 rounded-xl">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Drivers Linked</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-xs font-bold text-slate-800 font-mono">{assignedDrivers.length}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Gross Bookings</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-xs font-extrabold text-blue-600 font-mono">${totalGross.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Meta contacts */}
                    <div className="space-y-1 text-[11px] text-slate-500 border-t border-slate-100/80 pt-3">
                      <div className="flex justify-between">
                        <span>Contact Lead:</span>
                        <span className="font-semibold text-slate-700">{c.contactName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Direct Phone:</span>
                        <span className="font-mono text-slate-700">{c.phone || 'N/A'}</span>
                      </div>
                      {c.mcNumber && (
                        <div className="flex justify-between items-center">
                          <span>MC Number:</span>
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[10px]">{c.mcNumber}</span>
                        </div>
                      )}
                      {c.email && (
                        <div className="flex justify-between items-center">
                          <span>Email:</span>
                          <span className="text-slate-700 font-medium truncate max-w-[140px]">{c.email}</span>
                        </div>
                      )}
                      {c.address && (
                        <div className="flex justify-between items-center">
                          <span>Address:</span>
                          <span className="text-slate-700 truncate max-w-[140px]">{c.address}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Default Fee %:</span>
                        <span className="font-bold text-slate-700">{c.payoutRatePercent}% Fee</span>
                      </div>

                      {/* Factoring & Insurance Quick Badges */}
                      <div className="pt-2 border-t border-slate-100/80 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Factoring:</span>
                          <span className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                            c.hasFactoring 
                              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {c.hasFactoring ? (c.factoringCompanyName || 'Factoring Company') : 'Direct Pay'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Insurance:</span>
                          <span className="font-mono text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            {c.liabilityLimit || '$1M'} Liab &bull; {c.cargoLimit || '$100k'} Cargo
                          </span>
                        </div>
                        {/* Compliance Credentials Indicators */}
                        <div className="flex items-center gap-1 pt-1 flex-wrap">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            c.noticeOfAssignmentDoc ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}>
                            NOA {c.noticeOfAssignmentDoc ? '✓' : '—'}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            c.certificateOfInsuranceDoc ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}>
                            COI {c.certificateOfInsuranceDoc ? '✓' : '—'}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            c.w9FormDoc ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}>
                            W9 {c.w9FormDoc ? '✓' : '—'}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            c.voidedCheckDoc ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}>
                            Check {c.voidedCheckDoc ? '✓' : '—'}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            c.mcAuthorityLetterDoc ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}>
                            MC Auth {c.mcAuthorityLetterDoc ? '✓' : '—'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedCarrierFolder(selectedCarrierFolder === c.id ? null : c.id)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-slate-100/80 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-xs font-semibold text-slate-700 transition"
                    >
                      <span>{selectedCarrierFolder === c.id ? 'Hide Fleet Directory' : 'View Drivers & Invoices'}</span>
                      <ChevronRight className={`h-4 w-4 transition-transform ${selectedCarrierFolder === c.id ? 'rotate-90 text-blue-500' : 'text-slate-400'}`} />
                    </button>
                  </div>

                  {/* Drivers linked list inside directory folder */}
                  {selectedCarrierFolder === c.id && (
                    <div className="border-t border-slate-100 bg-blue-50/10 space-y-3">
                      <div className="p-5 space-y-3 border-b border-slate-100">
                        <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                          Linked Fleet Operators
                        </h5>
                        {assignedDrivers.length === 0 ? (
                          <div className="text-xs text-slate-400 italic bg-white p-3 rounded-lg border border-slate-100">
                            No drivers attached to this folder folder yet. Go to "Dynamic Assignments" tab to assign drivers.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {assignedDrivers.map(dr => {
                              const dispObj = dispatchers.find(dis => dis.id === dr.assignedDispatcherId);
                              return (
                                <div key={dr.id} className="bg-white p-2.5 rounded-lg border border-slate-100 flex items-center justify-between text-xs transition hover:border-blue-200">
                                  <div>
                                    <div className="font-bold text-slate-800">{dr.name}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">Truck #{dr.truckNum} &bull; {dr.truckType}</div>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[10px] bg-slate-100 border text-slate-600 font-semibold px-2 py-0.5 rounded-full block">
                                      Disp: {dispObj?.name ? dispObj.name.split(' ')[0] : 'Unassigned'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Factoring & Insurance Details Section */}
                      <div className="p-5 bg-blue-50/20 border-b border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <Building2 className="h-4 w-4 text-blue-600" />
                            <span>Factoring &amp; Notice of Assignment (NOA)</span>
                          </h5>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            c.hasFactoring 
                              ? 'bg-blue-100 text-blue-800 border-blue-200' 
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {c.hasFactoring ? 'Factoring Active' : 'Direct Pay Carrier'}
                          </span>
                        </div>

                        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                            <div>
                              <div className="text-[10px] uppercase font-bold text-slate-400">Factoring Company</div>
                              <div className="text-xs font-bold text-slate-800 mt-0.5">
                                {c.hasFactoring ? (c.factoringCompanyName || 'Unspecified Factoring Partner') : 'No Factoring Assigned (Direct Carrier Payout)'}
                              </div>
                            </div>
                            <div>
                              {c.noticeOfAssignmentDoc ? (
                                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs">
                                  <FileCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                                  <div className="min-w-0">
                                    <span className="font-bold text-emerald-900 truncate block max-w-[130px]">{c.noticeOfAssignmentDoc.name}</span>
                                    <span className="text-[9px] text-emerald-600">NOA Document Attached</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => downloadBase64File(c.noticeOfAssignmentDoc!.base64, c.noticeOfAssignmentDoc!.name)}
                                    className="p-1 hover:bg-emerald-100 rounded text-emerald-700"
                                    title="Download NOA"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm('Remove Notice of Assignment document?')) {
                                        onEditCarrier(c.id, { noticeOfAssignmentDoc: undefined });
                                      }
                                    }}
                                    className="p-1 hover:bg-rose-100 rounded text-rose-600"
                                    title="Remove NOA"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold cursor-pointer transition">
                                    <Upload className="h-3.5 w-3.5" />
                                    <span>Upload NOA (PDF/JPG)</span>
                                    <input
                                      type="file"
                                      accept=".pdf,image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        handleDocFileUpload(e, (doc) => {
                                          onEditCarrier(c.id, { noticeOfAssignmentDoc: doc });
                                        });
                                      }}
                                    />
                                  </label>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Insurance Details Section */}
                      <div className="p-5 bg-emerald-50/20 border-b border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                            <span>Insurance &amp; Certificate of Insurance (COI)</span>
                          </h5>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {c.liabilityLimit || '$1,000,000'} Auto Liab &bull; {c.cargoLimit || '$100,000'} Cargo
                          </span>
                        </div>

                        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div>
                              <div className="text-[10px] uppercase font-bold text-slate-400">Insurance Carrier</div>
                              <div className="font-bold text-slate-800 mt-0.5">
                                {c.insuranceCompanyName || 'Standard Motor Carrier Policy'}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase font-bold text-slate-400">Liability Limit</div>
                              <div className="font-mono font-semibold text-slate-800 mt-0.5">
                                {c.liabilityLimit || '$1,000,000'}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase font-bold text-slate-400">Cargo Limit</div>
                              <div className="font-mono font-semibold text-slate-800 mt-0.5">
                                {c.cargoLimit || '$100,000'}
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                            <div className="text-xs text-slate-500">
                              Certificate of Insurance (COI) Status:
                            </div>
                            {c.certificateOfInsuranceDoc ? (
                              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs">
                                <FileCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                                <span className="font-bold text-emerald-900 truncate max-w-[150px]">{c.certificateOfInsuranceDoc.name}</span>
                                <button
                                  type="button"
                                  onClick={() => downloadBase64File(c.certificateOfInsuranceDoc!.base64, c.certificateOfInsuranceDoc!.name)}
                                  className="p-1 hover:bg-emerald-100 rounded text-emerald-700"
                                  title="Download COI"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm('Remove Certificate of Insurance document?')) {
                                      onEditCarrier(c.id, { certificateOfInsuranceDoc: undefined });
                                    }
                                  }}
                                  className="p-1 hover:bg-rose-100 rounded text-rose-600"
                                  title="Remove COI"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold cursor-pointer transition">
                                <Upload className="h-3.5 w-3.5" />
                                <span>Upload COI (PDF/JPG)</span>
                                <input
                                  type="file"
                                  accept=".pdf,image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    handleDocFileUpload(e, (doc) => {
                                      onEditCarrier(c.id, { certificateOfInsuranceDoc: doc });
                                    });
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Compliance Paperwork Section: Voided Check, W9, MC Authority */}
                      <div className="p-5 bg-slate-50/50 border-b border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-slate-700" />
                            <span>Carrier Compliance Vault</span>
                          </h5>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                            {[c.voidedCheckDoc, c.w9FormDoc, c.mcAuthorityLetterDoc].filter(Boolean).length} / 3 Uploaded
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Voided Check */}
                          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800">Voided Check</span>
                              <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                            </div>
                            {c.voidedCheckDoc ? (
                              <div className="space-y-1">
                                <div className="text-[11px] font-semibold text-slate-700 truncate" title={c.voidedCheckDoc.name}>
                                  {c.voidedCheckDoc.name}
                                </div>
                                <div className="flex items-center justify-between pt-1">
                                  <span className="text-[9px] text-emerald-600 font-bold">On File</span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => downloadBase64File(c.voidedCheckDoc!.base64, c.voidedCheckDoc!.name)}
                                      className="p-1 hover:bg-slate-100 rounded text-slate-600"
                                      title="Download Voided Check"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm('Remove Voided Check?')) {
                                          onEditCarrier(c.id, { voidedCheckDoc: undefined });
                                        }
                                      }}
                                      className="p-1 hover:bg-rose-50 rounded text-rose-500"
                                      title="Remove"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <label className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-dashed border-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition">
                                <Upload className="h-3.5 w-3.5" />
                                <span>Upload Check</span>
                                <input
                                  type="file"
                                  accept=".pdf,image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    handleDocFileUpload(e, (doc) => {
                                      onEditCarrier(c.id, { voidedCheckDoc: doc });
                                    });
                                  }}
                                />
                              </label>
                            )}
                          </div>

                          {/* W-9 Form */}
                          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800">W-9 Form</span>
                              <FileText className="h-3.5 w-3.5 text-slate-400" />
                            </div>
                            {c.w9FormDoc ? (
                              <div className="space-y-1">
                                <div className="text-[11px] font-semibold text-slate-700 truncate" title={c.w9FormDoc.name}>
                                  {c.w9FormDoc.name}
                                </div>
                                <div className="flex items-center justify-between pt-1">
                                  <span className="text-[9px] text-emerald-600 font-bold">On File</span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => downloadBase64File(c.w9FormDoc!.base64, c.w9FormDoc!.name)}
                                      className="p-1 hover:bg-slate-100 rounded text-slate-600"
                                      title="Download W-9"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm('Remove W-9 Form?')) {
                                          onEditCarrier(c.id, { w9FormDoc: undefined });
                                        }
                                      }}
                                      className="p-1 hover:bg-rose-50 rounded text-rose-500"
                                      title="Remove"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <label className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-dashed border-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition">
                                <Upload className="h-3.5 w-3.5" />
                                <span>Upload W-9</span>
                                <input
                                  type="file"
                                  accept=".pdf,image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    handleDocFileUpload(e, (doc) => {
                                      onEditCarrier(c.id, { w9FormDoc: doc });
                                    });
                                  }}
                                />
                              </label>
                            )}
                          </div>

                          {/* MC Authority Letter */}
                          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800">MC Authority Letter</span>
                              <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
                            </div>
                            {c.mcAuthorityLetterDoc ? (
                              <div className="space-y-1">
                                <div className="text-[11px] font-semibold text-slate-700 truncate" title={c.mcAuthorityLetterDoc.name}>
                                  {c.mcAuthorityLetterDoc.name}
                                </div>
                                <div className="flex items-center justify-between pt-1">
                                  <span className="text-[9px] text-emerald-600 font-bold">On File</span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => downloadBase64File(c.mcAuthorityLetterDoc!.base64, c.mcAuthorityLetterDoc!.name)}
                                      className="p-1 hover:bg-slate-100 rounded text-slate-600"
                                      title="Download MC Authority Letter"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm('Remove MC Authority Letter?')) {
                                          onEditCarrier(c.id, { mcAuthorityLetterDoc: undefined });
                                        }
                                      }}
                                      className="p-1 hover:bg-rose-50 rounded text-rose-500"
                                      title="Remove"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <label className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-dashed border-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition">
                                <Upload className="h-3.5 w-3.5" />
                                <span>Upload MC Auth</span>
                                <input
                                  type="file"
                                  accept=".pdf,image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    handleDocFileUpload(e, (doc) => {
                                      onEditCarrier(c.id, { mcAuthorityLetterDoc: doc });
                                    });
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Company Documents Section */}
                      <div className="p-5 bg-emerald-50/15 space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <Folder className="h-4 w-4 text-emerald-600" />
                            <span>Company Documents &amp; Images</span>
                          </h5>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 border border-emerald-200">
                            {(c.companyDocs || []).length} / 10 Files
                          </span>
                        </div>

                        {/* Document List */}
                        {(c.companyDocs || []).length === 0 ? (
                          <div className="text-xs text-slate-400 italic bg-white p-4 rounded-xl border border-dashed border-slate-200 text-center">
                            No credential documents uploaded. Upload W-9, Insurance, or MC Certificates below.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(c.companyDocs || []).map(doc => (
                              <div key={doc.id} className="bg-white p-3 rounded-xl border border-slate-200/85 flex items-center justify-between gap-2 text-xs hover:border-emerald-200 transition-colors shadow-sm">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                                    <FileText className="h-4 w-4 shrink-0" />
                                  </div>
                                  <div className="min-w-0">
                                    <a 
                                      href={doc.base64} 
                                      download={doc.name}
                                      className="font-bold text-slate-850 hover:text-emerald-600 truncate block cursor-pointer hover:underline"
                                      title="Click to download document"
                                    >
                                      {doc.name}
                                    </a>
                                    <div className="text-[9px] text-slate-400 mt-0.5">
                                      {doc.type} &bull; {new Date(doc.uploadedAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete ${doc.name}?`)) {
                                      const updatedDocs = (c.companyDocs || []).filter(d => d.id !== doc.id);
                                      onEditCarrier(c.id, { companyDocs: updatedDocs });
                                    }
                                  }}
                                  className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer shrink-0"
                                  title="Delete document"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Document Upload Input */}
                        {(c.companyDocs || []).length < 10 ? (
                          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Doc Type</label>
                                <select 
                                  id={`doc_type_select_${c.id}`}
                                  defaultValue="Insurance"
                                  className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white"
                                >
                                  <option value="Insurance">Insurance Policy</option>
                                  <option value="W-9">W-9 Form</option>
                                  <option value="MC Certificate">MC Certificate</option>
                                  <option value="Authority">Operating Authority</option>
                                  <option value="Other">Other Document / Image</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">File Upload</label>
                                <input 
                                  type="file"
                                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    if (file.size > 2 * 1024 * 1024) {
                                      alert("File is too large. Please select a file smaller than 2MB.");
                                      return;
                                    }
                                    const selectEl = document.getElementById(`doc_type_select_${c.id}`) as HTMLSelectElement;
                                    const docType = selectEl ? selectEl.value : 'Other';

                                    const reader = new FileReader();
                                    reader.onload = () => {
                                      const base64 = reader.result as string;
                                      const newDoc = {
                                        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                                        name: file.name,
                                        type: docType,
                                        base64,
                                        uploadedAt: new Date().toISOString()
                                      };
                                      onEditCarrier(c.id, { companyDocs: [...(c.companyDocs || []), newDoc] });
                                    };
                                    reader.readAsDataURL(file);
                                  }}
                                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                />
                              </div>
                            </div>
                            <p className="text-[9px] text-slate-400 italic">Supports PDF, Word, Excel, Images, TXT (Max 2MB per file)</p>
                          </div>
                        ) : (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-medium">
                            Maximum limit of 10 company documents reached. Delete existing documents to upload new ones.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/**********************************************************
       * SUB METER 2: DYNAMIC DAILY DISPATCHER ASSIGNMENT STATION 
       **********************************************************/}
      {subTab === 'assignments' && (
        <div id="dynamic_assignments" className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6 no-print">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-950 font-display flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-blue-600" />
                <span>Daily Fleet Routing Matrix</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Drivers can be dynamically routed to different dispatchers on a daily basis. Dispatchers will immediately only see loads from their currently assigned drivers.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="p-4">Driver Profile</th>
                  <th className="p-4">Truck Info</th>
                  <th className="p-4">Carrier / Owner Folder</th>
                  <th className="p-4">Current Assigned Dispatcher (Daily Changeable)</th>
                  <th className="p-4">Actions / Quick Swaps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-xs text-slate-700">
                {drivers.map(drv => {
                  const currentCarrier = carriers.find(c => c.id === drv.carrierId);
                  
                  // Filter out dispatchers available for re-assignment
                  return (
                    <tr key={drv.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{drv.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{drv.phone}</div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono font-bold bg-slate-100 border text-slate-600 px-2 py-0.5 rounded text-[10px] mr-1">
                          #{drv.truckNum}
                        </span>
                        <span className="text-[11px] text-slate-500">{drv.truckType}</span>
                      </td>
                      <td className="p-4">
                        {currentCarrier ? (
                          <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[10px] ${
                            currentCarrier.type === 'CARRIER' 
                              ? 'bg-indigo-50 border border-indigo-200 text-indigo-700' 
                              : 'bg-amber-50 border border-amber-200 text-amber-700'
                          }`}>
                            <Folder className="h-3 w-3" />
                            <span>{currentCarrier.name}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No Attached Folder (Direct)</span>
                        )}
                        
                        {/* Inline Carrier Picker */}
                        {isAdmin && (
                          <select
                            value={drv.carrierId || ''}
                            onChange={(e) => {
                              onEditDriver(drv.id, { carrierId: e.target.value || undefined });
                            }}
                            className="block mt-1 text-[10px] px-1 py-0.5 border border-slate-200 bg-slate-50 rounded"
                          >
                            <option value="">-- Direct Owner --</option>
                            {carriers.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="p-4 font-semibold">
                        {/* Selector for assignment */}
                        <div className="flex items-center gap-1.5">
                          <select
                            value={drv.assignedDispatcherId}
                            onChange={(e) => {
                              onAssignDriverDaily(drv.id, e.target.value);
                            }}
                            className="text-xs px-2.5 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">Unassigned Desk</option>
                            {dispatchers.map(disp => (
                              <option key={disp.id} value={disp.id}>
                                {disp.name} ({disp.notes ? disp.notes.slice(0, 16) + '...' : 'Active Desk'})
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="p-4">
                        {/* Short-cut dispatcher buttons for lightning fast swaps */}
                        <div className="flex gap-1">
                          {dispatchers.slice(0, 3).map(disp => {
                            const isAssigned = drv.assignedDispatcherId === disp.id;
                            const initials = disp.name.split(' ').map(n => n[0]).join('');
                            return (
                              <button
                                key={disp.id}
                                onClick={() => onAssignDriverDaily(drv.id, disp.id)}
                                title={`Instantly route driver to ${disp.name}`}
                                className={`h-7 w-7 rounded-lg text-[9px] font-bold border flex items-center justify-center transition cursor-pointer ${
                                  isAssigned 
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/10' 
                                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                {initials}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/**********************************************************
       * SUB METER 3: CARRIER & OWNER CATEGORIZED PAYMENTS folder
       **********************************************************/}
      {subTab === 'payments' && (
        <div id="carrier_load_payments" className="space-y-6 no-print">
          
          <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between border border-slate-150">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
                Owner Operator Folders &bull; Dynamic Calculations
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Generate custom payout invoices for each owner operator. Fee rates are selectable (18% or 22%) per payout for maximum contract flexibility.
              </p>
            </div>
            
            <div className="text-right">
              <span className="text-[10px] bg-blue-50 border border-blue-200 text-blue-700 font-bold px-2.5 py-1 rounded-full uppercase">
                Active Company: Timely Logistix
              </span>
            </div>
          </div>

          <div className="space-y-6">
            {carriers.map(carrier => {
              const carrierDrivers = drivers.filter(dr => dr.carrierId === carrier.id);
              const driverIds = carrierDrivers.map(dr => dr.id);
              const carrierLoads = loads.filter(l => driverIds.includes(l.driverId));

              return (
                <div key={carrier.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Folder className="h-5 w-5 text-indigo-500 shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{carrier.name} Folder</h4>
                        <span className="text-[10px] text-slate-400 font-bold">{carrier.type === 'CARRIER' ? '💼 Contract Fleet' : '🌾 Partner Operator'}</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600">
                      Total Loads: <strong className="text-slate-900 font-mono bg-slate-150/80 px-2 py-0.5 rounded-md">{carrierLoads.length}</strong>
                    </div>
                  </div>

                  <div className="p-4">
                    {carrierLoads.length === 0 ? (
                      <div className="text-xs text-slate-400 italic py-4 text-center">
                        No bookable loads on record for any drivers linked to {carrier.name}.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left font-sans text-xs">
                          <thead>
                            <tr className="border-b border-slate-150 text-slate-400 text-[9px] font-bold uppercase tracking-wide">
                              <th className="py-2 px-3">Load #</th>
                              <th className="py-2 px-3">Driver Name</th>
                              <th className="py-2 px-3">Carrier Dispatch Contract</th>
                              <th className="py-2 px-3">Gross Amount</th>
                              <th className="py-2 px-3">Standard Fee %</th>
                              <th className="py-2 px-3">Advance &amp; Deductions</th>
                              <th className="py-2 px-3 text-right">Instant Print Payout</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {carrierLoads.map(ld => {
                              const drv = carrierDrivers.find(d => d.id === ld.driverId);
                              const deductionsTot = ld.advanceFuel + ld.cashAdvance + ld.repairDeduction + ld.tollDeduction;

                              return (
                                <tr key={ld.id} className="hover:bg-slate-50/50">
                                  <td className="py-3 px-3 font-semibold text-slate-900">
                                    {ld.loadNum}
                                    <span className="block text-[9px] text-slate-400 font-mono">RC: {ld.rateConNum}</span>
                                  </td>
                                  <td className="py-3 px-3">
                                    <div className="font-bold text-slate-800">{drv ? drv.name : 'Unknown Driver'}</div>
                                    <div className="text-[9px] text-slate-400 font-mono">Truck #{drv?.truckNum || 'N/A'}</div>
                                  </td>
                                  <td className="py-3 px-3">
                                    <span className="text-[10px] bg-slate-100 border text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                                      {ld.pickupLocation.split(',')[0]} &rarr; {ld.deliveryLocation.split(',')[0]}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                                    ${ld.loadAmount.toLocaleString()}
                                  </td>
                                  <td className="py-3 px-3 font-bold text-blue-600">
                                    {ld.feePercent}% Standard
                                  </td>
                                  <td className="py-3 px-3">
                                    {deductionsTot > 0 ? (
                                      <span className="text-red-600 font-mono font-bold text-[11px] bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
                                        -${deductionsTot} Deduct
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 text-[10px] italic">No deductions</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-3 text-right">
                                    <button
                                      onClick={() => triggerPayoutReport(ld)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg cursor-pointer transition shadow hover:shadow-blue-500/10"
                                    >
                                      <FileText className="h-3 w-3" />
                                      <span>Payout Receipt</span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/**********************************************************
       * MODAL/PRINT SHEET: ONE CLICK DYNAMIC LOAD PAYOUT PDF RECEIPT
       **********************************************************/}
      {activePayoutLoad && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden relative font-sans my-8">
            
            {/* Modal Actions Header Bar */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between no-print shadow-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Dynamic Driver Payout Invoice</span>
              </div>

              {/* PDF Settings */}
              <div className="flex items-center gap-3">
                
                {/* 18% or 22% Selectable Checkers */}
                <div className="bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selectable Fee:</span>
                  <label className="inline-flex items-center gap-1 font-mono text-xs font-bold cursor-pointer text-white">
                    <input
                      type="radio"
                      name="fee_select"
                      checked={customFeePercent === 18}
                      onChange={() => setCustomFeePercent(18)}
                      className="accent-blue-500"
                    />
                    <span>18%</span>
                  </label>
                  <label className="inline-flex items-center gap-1 font-mono text-xs font-bold cursor-pointer text-white">
                    <input
                      type="radio"
                      name="fee_select"
                      checked={customFeePercent === 22}
                      onChange={() => setCustomFeePercent(22)}
                      className="accent-blue-500"
                    />
                    <span>22%</span>
                  </label>
                </div>

                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print PDF</span>
                </button>

                <button
                  onClick={() => handleShareReport(activePayoutLoad, customFeePercent)}
                  className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>{shareSuccess ? 'Copied!' : 'Share'}</span>
                </button>

                <button
                  onClick={() => setActivePayoutLoad(null)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Print Confirmation Banner */}
            {shareSuccess && (
              <div className="bg-emerald-50 text-emerald-800 p-2 text-center text-[11px] font-bold border-b border-emerald-100 no-print flex items-center justify-center gap-1">
                <Check className="h-4 w-4" />
                <span>Text summary compiled and copied to clipboard successfully! Share with owners.</span>
              </div>
            )}

            {/* THE INVOICE TEMPLATE SHEET - STYLED FOR PRINT */}
            <div id="print-sheet" className="p-8 space-y-6 text-slate-800 bg-white">
              
              {/* Header Info */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900 font-display">
                    TIMLEY LOGISTIX
                  </h2>
                  <span className="text-[10px] font-mono text-slate-400 font-bold tracking-widest block uppercase mt-0.5">
                    Premium Truck Dispatch &amp; Operations desk
                  </span>
                  <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
                    <div>100 Logistics Blvd, Suite 200</div>
                    <div>Phone: (555) 777-8888</div>
                    <div>Billing: payments@timley-logistix.com</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Payout Voucher</div>
                  <div className="text-lg font-mono font-extrabold text-blue-600 mt-1">PAY-#{activePayoutLoad.loadNum}</div>
                  <div className="text-[11px] text-slate-500 mt-2">
                    Date Generated: {new Date().toISOString().split('T')[0]}
                  </div>
                </div>
              </div>

              {/* Parties Block */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Send Payout To:</div>
                  <div className="font-bold text-slate-900">
                    {(() => {
                      const drvObj = drivers.find(d => d.id === activePayoutLoad.driverId);
                      const carrObj = carriers.find(c => c.id === drvObj?.carrierId);
                      return carrObj ? `${carrObj.name}` : 'Direct Owner Operator';
                    })()}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {(() => {
                      const drvObj = drivers.find(d => d.id === activePayoutLoad.driverId);
                      const carrObj = carriers.find(c => c.id === drvObj?.carrierId);
                      return carrObj ? `Contact: ${carrObj.contactName} • ${carrObj.phone}` : 'Independent Dispatch Client';
                    })()}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Active Asset:</div>
                  <div className="font-bold text-slate-900">
                    {drivers.find(d => d.id === activePayoutLoad.driverId)?.name || 'N/A'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Truck: #{drivers.find(d => d.id === activePayoutLoad.driverId)?.truckNum || 'N/A'} &bull; Type: {drivers.find(d => d.id === activePayoutLoad.driverId)?.truckType || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Load details specifications */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Associated Cargo Specifications
                </div>
                
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <div className="grid grid-cols-4 bg-slate-50 p-3 font-bold border-b border-slate-200 text-[10px] text-slate-500 uppercase">
                    <div>Broker</div>
                    <div>Rate Con #</div>
                    <div>Route Details</div>
                    <div className="text-right">Gross Booked</div>
                  </div>
                  <div className="grid grid-cols-4 p-3 border-b border-slate-100 goods-details items-center">
                    <div className="font-bold text-slate-900">{activePayoutLoad.broker}</div>
                    <div className="font-mono text-slate-600">{activePayoutLoad.rateConNum}</div>
                    <div>
                      <div className="font-semibold text-slate-800">{activePayoutLoad.pickupLocation}</div>
                      <div className="text-[9px] text-slate-400">&rarr; {activePayoutLoad.deliveryLocation}</div>
                    </div>
                    <div className="font-mono font-bold text-right text-slate-900">
                      ${activePayoutLoad.loadAmount.toLocaleString()}.00
                    </div>
                  </div>
                </div>
              </div>

              {/* Math calculations ledger */}
              <div className="flex justify-end">
                <div className="w-full md:w-3/4 space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">
                    Operational Fee &amp; Deductions Balance
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2.5 text-xs">
                    
                    <div className="flex justify-between text-slate-600">
                      <span>Gross Load Value:</span>
                      <span className="font-mono font-semibold">${activePayoutLoad.loadAmount.toLocaleString()}.00</span>
                    </div>

                    <div className="flex justify-between text-blue-700">
                      <span>Timely Logistix Custom Dispatch Fee ({customFeePercent}%):</span>
                      <span className="font-mono font-bold">
                        -${Math.round((activePayoutLoad.loadAmount * customFeePercent) / 100).toLocaleString()}.00
                      </span>
                    </div>

                    {/* Deductions breakdown */}
                    {(activePayoutLoad.advanceFuel > 0 || activePayoutLoad.cashAdvance > 0 || activePayoutLoad.repairDeduction > 0 || activePayoutLoad.tollDeduction > 0) && (
                      <div className="border-t border-slate-200/80 pt-2 space-y-1.5 text-red-700">
                        <div className="text-[9px] font-bold text-rose-500 uppercase tracking-wider mb-1">Contract Deductions Sub-ledger:</div>
                        {activePayoutLoad.advanceFuel > 0 && (
                          <div className="flex justify-between text-[11px]">
                            <span>• Fuel Cash Advance:</span>
                            <span className="font-mono font-medium">-${activePayoutLoad.advanceFuel.toLocaleString()}.00</span>
                          </div>
                        )}
                        {activePayoutLoad.cashAdvance > 0 && (
                          <div className="flex justify-between text-[11px]">
                            <span>• Cash Advance Offset:</span>
                            <span className="font-mono font-medium">-${activePayoutLoad.cashAdvance.toLocaleString()}.00</span>
                          </div>
                        )}
                        {activePayoutLoad.repairDeduction > 0 && (
                          <div className="flex justify-between text-[11px]">
                            <span>• Road Repairs Backup:</span>
                            <span className="font-mono font-medium">-${activePayoutLoad.repairDeduction.toLocaleString()}.00</span>
                          </div>
                        )}
                        {activePayoutLoad.tollDeduction > 0 && (
                          <div className="flex justify-between text-[11px]">
                            <span>• Toll &amp; Scale Fees refund:</span>
                            <span className="font-mono font-medium">-${activePayoutLoad.tollDeduction.toLocaleString()}.00</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Final Net payout to owner */}
                    <div className="flex justify-between items-center text-sm font-bold border-t border-slate-200/80 pt-3 text-slate-900 bg-slate-100/30 p-2 rounded-lg">
                      <span className="text-slate-900 uppercase tracking-wide">Net Payout to Fleet Owner:</span>
                      <span className="font-mono text-base font-extrabold text-blue-700">
                        ${computePayoutReportDetails(activePayoutLoad, customFeePercent).netPayout.toLocaleString()}.00
                      </span>
                    </div>

                  </div>
                </div>
              </div>

              {/* Bottom legal notice */}
              <div className="text-center text-[10px] text-slate-400 border-t border-slate-200 pt-5 mt-8 max-w-lg mx-auto leading-relaxed">
                <div>This document is generated automatically by Timely Logistix Management Desk.</div>
                <div>Funds dispersed are subject to final audit. No physical signature is required for digital offline clearance.</div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
