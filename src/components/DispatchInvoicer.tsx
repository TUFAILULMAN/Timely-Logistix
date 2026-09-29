/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, ChangeEvent, FormEvent } from 'react';
import { Load, Dispatcher, User, CarrierOrOwner, Driver, CompanySettings, Invoice, InvoiceLineItem } from '../types';
import SavedInvoicesRegistry from './SavedInvoicesRegistry';
import DispatchOwnerPaymentsLedger from './DispatchOwnerPaymentsLedger';
import { 
  FileSpreadsheet, 
  Printer, 
  Layers, 
  CheckCircle, 
  FileText, 
  Plus, 
  X, 
  Building, 
  User as UserIcon, 
  Truck, 
  Calendar, 
  DollarSign, 
  ArrowRight, 
  FileDown, 
  ShieldCheck, 
  Percent, 
  FileCheck2,
  BookmarkCheck,
  Briefcase,
  Upload,
  Edit2,
  Check,
  XCircle,
  Sliders,
  Save,
  Sparkles
} from 'lucide-react';

interface DispatchInvoicerProps {
  currentUser: User;
  loads: Load[];
  dispatchers: Dispatcher[];
  carriers: CarrierOrOwner[];
  drivers: Driver[];
  companySettings: CompanySettings;
  onUpdateCompanySettings: (settings: Partial<CompanySettings>) => Promise<void>;
  onEditLoad: (id: string, updated: Partial<Load>) => Promise<void>;
  invoices: Invoice[];
  onAddInvoice: (invoice: Omit<Invoice, 'id'>) => Promise<void>;
  onEditInvoice: (id: string, updated: Partial<Invoice>) => Promise<void>;
  onDeleteInvoice: (id: string) => Promise<void>;
}

// Pre-populate helpers for Brokers
const BROKER_DEFAULTS: Record<string, { address: string; phone: string; email: string }> = {
  'C.H. Robinson': {
    address: '14701 Charlson Road, Eden Prairie, MN 55347',
    phone: '(800) 323-7587',
    email: 'carrierpayment@chrobinson.com'
  },
  'Total Quality Logistics (TQL)': {
    address: '4289 Ivy Pointe Blvd, Cincinnati, OH 45245',
    phone: '(800) 580-3101',
    email: 'invoices@tql.com'
  },
  'RXO Logistics': {
    address: '11215 North Community House Rd, Charlotte, NC 28277',
    phone: '(800) 880-9280',
    email: 'quickpay@rxo.com'
  },
  'Echo Global Logistics': {
    address: '600 West Chicago Ave, Chicago, IL 60654',
    phone: '(800) 354-7993',
    email: 'carrierbilling@echo.com'
  },
  'Coyote Logistics': {
    address: '2545 W Diversey Ave, Chicago, IL 60647',
    phone: '(877) 626-9683',
    email: 'accounts_payable@coyote.com'
  },
  'Landstar Ranger': {
    address: '13410 Sutton Park Drive S, Jacksonville, FL 32224',
    phone: '(800) 873-5188',
    email: 'deliveries@landstar.com'
  }
};

const CARRIER_DEFAULTS: Record<string, { address: string; dot: string; mc: string; email: string; factoringNote: string }> = {
  'carr1': {
    address: '884 Carrier Way, Suite 4A, Chicago, IL 60611',
    dot: '3829104',
    mc: '1029482',
    email: 'billing@eg-express.com',
    factoringNote: 'IMPORTANT NOTICE: E & G Express assignees this invoice. Remit solely to: APEX Factoring LLC, P.O. Box 24890, Dallas, TX 75220.'
  },
  'carr2': {
    address: '15 Vance Plaza, Dallas, TX 75201',
    dot: '2718491',
    mc: '9840291',
    email: 'frederick@vancelogistics.com',
    factoringNote: 'Remit payment directly to: Frederick Logistics Group, 15 Vance Plaza, Dallas, TX 75201 or standard Broker Direct QuickPay.'
  },
  'carr3': {
    address: '500 Marcus Boulevard, Atlanta, GA 30303',
    dot: '3157294',
    mc: '1105829',
    email: 'marcus@apexoperators.com',
    factoringNote: 'IMPORTANT REMITTANCE: Invoiced for Apex Fleet Carriers. Payable only to Triumph Financial Services.'
  }
};

export default function DispatchInvoicer({
  currentUser,
  loads,
  dispatchers,
  carriers,
  drivers,
  companySettings,
  onUpdateCompanySettings,
  onEditLoad,
  invoices = [],
  onAddInvoice,
  onEditInvoice,
  onDeleteInvoice
}: DispatchInvoicerProps) {
  const isAdmin = currentUser.role === 'ADMIN';

  // --- NEW INVOICE CUSTOMIZATION STATES ---
  const [isManualCustomMode, setIsManualCustomMode] = useState(false);
  const [invoiceLogoUrl, setInvoiceLogoUrl] = useState(companySettings.logoUrl || '');
  const [saveLogoAsDefault, setSaveLogoAsDefault] = useState(true);

  // Reference Template Specific Fields
  const [sendToContact, setSendToContact] = useState('Frank WU');
  const [paymentMethod, setPaymentMethod] = useState('Zelle');
  const [customPaymentMethodText, setCustomPaymentMethodText] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [selectedFeePercent, setSelectedFeePercent] = useState<number | 'CUSTOM'>(8);
  const [customFeePercentValue, setCustomFeePercentValue] = useState<number>(8);
  const [activeTemplateStyle, setActiveTemplateStyle] = useState<'REFERENCE_LOOK' | 'DETAILED_LOADS'>('REFERENCE_LOOK');

  // Custom Biller / Dispatch Account Info
  const [customBillerName, setCustomBillerName] = useState(companySettings.name || 'Timely Logistix');
  const [customBillerAddress, setCustomBillerAddress] = useState(companySettings.address || '100 Logistics Blvd, Suite 400, Chicago, IL 60601');
  const [customBillerPhone, setCustomBillerPhone] = useState(companySettings.phone || '(800) 555-0199');
  const [customBillerEmail, setCustomBillerEmail] = useState(companySettings.email || 'billing@timelylogistix.com');

  // Custom Recipient / Carrier Account Info
  const [customCarrierName, setCustomCarrierName] = useState('E & G EXPRESS TRUCKING LLC');
  const [customCarrierAddress, setCustomCarrierAddress] = useState('18 WHITNEY LN\nGRAND ISLAND, NY 14072');
  const [customCarrierDot, setCustomCarrierDot] = useState(CARRIER_DEFAULTS['carr1']?.dot || '3004819');
  const [customCarrierMc, setCustomCarrierMc] = useState(CARRIER_DEFAULTS['carr1']?.mc || '918402');
  const [customCarrierEmail, setCustomCarrierEmail] = useState(CARRIER_DEFAULTS['carr1']?.email || 'billing@eg-express.com');

  // Custom Payer / Broker Account Info
  const [customBrokerName, setCustomBrokerName] = useState('C.H. Robinson');
  const [customBrokerAddress, setCustomBrokerAddress] = useState(BROKER_DEFAULTS['C.H. Robinson']?.address || '14701 Charlson Road, Eden Prairie, MN 55347');
  const [customBrokerPhone, setCustomBrokerPhone] = useState(BROKER_DEFAULTS['C.H. Robinson']?.phone || '(800) 323-7587');
  const [customBrokerEmail, setCustomBrokerEmail] = useState(BROKER_DEFAULTS['C.H. Robinson']?.email || 'ap@chrobinson.com');

  // Custom Line items
  const [customLineItems, setCustomLineItems] = useState<InvoiceLineItem[]>([]);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');

  // State: Corporate branding edit states (initialized from companySettings)
  const [showConfig, setShowConfig] = useState(false);
  const [cfgName, setCfgName] = useState(companySettings?.name || 'Timely Logistix Inc.');
  const [cfgTagline, setCfgTagline] = useState(companySettings?.tagline || 'Premium Commercial Dispatch Console');
  const [cfgAddress, setCfgAddress] = useState(companySettings?.address || '100 Logistics Blvd, Suite 200\nChicago, IL 60611');
  const [cfgPhone, setCfgPhone] = useState(companySettings?.phone || '(555) 777-8888');
  const [cfgEmail, setCfgEmail] = useState(companySettings?.email || 'billing@timely-logistix.com');
  const [cfgDefaultFee, setCfgDefaultFee] = useState<number>(companySettings?.defaultDispatchFeePercent || 8);
  const [isSavingBranding, setIsSavingBranding] = useState(false);

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        await onUpdateCompanySettings({ logoUrl: base64String });
        alert('Company logo uploaded and saved successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBranding = async (e: FormEvent) => {
    e.preventDefault();
    setIsSavingBranding(true);
    try {
      await onUpdateCompanySettings({
        name: cfgName,
        tagline: cfgTagline,
        address: cfgAddress,
        phone: cfgPhone,
        email: cfgEmail,
        defaultDispatchFeePercent: cfgDefaultFee
      });
      alert('Company branding and default percentage updated successfully!');
      setShowConfig(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save settings.');
    } finally {
      setIsSavingBranding(false);
    }
  };

  // State: Main Dispatch Workspace Section
  const [activeMainTab, setActiveMainTab] = useState<'OWNER_LEDGER' | 'BUILDER' | 'REGISTRY'>('OWNER_LEDGER');

  // State: Invoice Category Mode
  const [invoiceMode, setInvoiceMode] = useState<'DISPATCH_FEE' | 'CARRIER_FREIGHT'>('DISPATCH_FEE');

  // ==========================================
  // STATE & LOGIC: DISPATCH SERVICE FEE INVOICE (TL to Carrier)
  // ==========================================
  const [selectedDispatcherId, setSelectedDispatcherId] = useState(
    isAdmin ? '' : (dispatchers.find(d => d.username === currentUser.username)?.id || '')
  );
  
  const [feeCarrierId, setFeeCarrierId] = useState<string>('carr1'); // default to E&G Express
  const [dispatchInvoiceNum, setDispatchInvoiceNum] = useState(() => `TL-DS-${new Date().getFullYear()}-${1000 + Math.floor(Math.random() * 9000)}`);
  const [dispatchInvoiceDate, setDispatchInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dispatchStartDate, setDispatchStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // first of this month
    return d.toISOString().split('T')[0];
  });
  const [dispatchEndDate, setDispatchEndDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [dispatchCustomNotes, setDispatchCustomNotes] = useState('Standard dispatch management statement compiled offline. Terms: NET 15 days from invoice date.');

  // Extract carriers from db or helper custom
  const selectedCarrierObj = carriers.find(c => c.id === feeCarrierId);
  const carrierNameForDispatch = selectedCarrierObj ? selectedCarrierObj.name : 'E & G Express';
  const carrierRateForDispatch = selectedCarrierObj ? selectedCarrierObj.payoutRatePercent : 8;

  // Driver IDs belonging to the selected Carrier
  const carrierDriverIds = useMemo(() => {
    if (!feeCarrierId) return [];
    return drivers.filter(d => d.carrierId === feeCarrierId).map(d => d.id);
  }, [feeCarrierId, drivers]);

  // Filters loads for Dispatch Fee Invoicing
  const matchedLoadsForDispatchFee = useMemo(() => {
    return loads.filter(l => {
      // Filter by dispatcher
      if (selectedDispatcherId && l.dispatcherId !== selectedDispatcherId) return false;
      // Filter by Carrier drivers or direct load carrier association
      if (feeCarrierId) {
        const matchesDirect = l.carrierId === feeCarrierId || (selectedCarrierObj && l.carrierName === selectedCarrierObj.name);
        const matchesDriver = carrierDriverIds.includes(l.driverId);
        if (!matchesDirect && !matchesDriver) return false;
      }
      // Filter by pickup date
      return l.pickupDate >= dispatchStartDate && l.pickupDate <= dispatchEndDate;
    });
  }, [loads, selectedDispatcherId, feeCarrierId, carrierDriverIds, selectedCarrierObj, dispatchStartDate, dispatchEndDate]);

  // Calculate Dispatch Fees
  const computeDispatchFeeForLoad = (l: Load) => {
    // Determine the fee percent. 
    // Use the load-level fee percent, carrier default rate, or company settings default. Fallback to 8
    const rate = l.feePercent || carrierRateForDispatch || companySettings.defaultDispatchFeePercent || 8;
    return Math.round((l.loadAmount * rate) / 100);
  };

  const dispatchGrossBookingsTot = matchedLoadsForDispatchFee.reduce((sum, l) => sum + l.loadAmount, 0);
  const dispatchFeeTot = matchedLoadsForDispatchFee.reduce((sum, l) => sum + computeDispatchFeeForLoad(l), 0);

  // CSV export for Dispatch Fee
  const handleExportDispatchCSV = () => {
    let csv = `Invoice ID,${dispatchInvoiceNum}\n`;
    csv += `Statement Date,${dispatchInvoiceDate}\n`;
    csv += `Dispatch Company,${companySettings.name}\n`;
    csv += `Billed To Carrier,${carrierNameForDispatch}\n`;
    csv += `Date Range,${dispatchStartDate} to ${dispatchEndDate}\n\n`;
    csv += `Load ID,Rate Con #,Broker,Driver,Pickup Date,Gross Booking,Dispatch Fee Rate,Dispatch Fee\n`;

    matchedLoadsForDispatchFee.forEach(l => {
      const drvName = drivers.find(d => d.id === l.driverId)?.name || 'Unknown Driver';
      const rate = l.feePercent || carrierRateForDispatch || 8;
      const fee = computeDispatchFeeForLoad(l);
      csv += `"${l.loadNum}","${l.rateConNum}","${l.broker}","${drvName}","${l.pickupDate}",${l.loadAmount},${rate}%,${fee}\n`;
    });

    csv += `,,,,Total Bookings,${dispatchGrossBookingsTot},Total Fees Due,${dispatchFeeTot}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${dispatchInvoiceNum}_Statement_${carrierNameForDispatch.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // ==========================================
  // STATE & LOGIC: CARRIER FREIGHT INVOICE (Carrier to Broker)
  // ==========================================
  const [freightCarrierId, setFreightCarrierId] = useState<string>('carr1');
  
  // Custom edit fields for the Carrier letterhead
  const [carrierAddress, setCarrierAddress] = useState(CARRIER_DEFAULTS['carr1'].address);
  const [carrierDot, setCarrierDot] = useState(CARRIER_DEFAULTS['carr1'].dot);
  const [carrierMc, setCarrierMc] = useState(CARRIER_DEFAULTS['carr1'].mc);
  const [carrierEmail, setCarrierEmail] = useState(CARRIER_DEFAULTS['carr1'].email);
  const [factoringNote, setFactoringNote] = useState(CARRIER_DEFAULTS['carr1'].factoringNote);

  // Broker selection
  const [brokerSelection, setBrokerSelection] = useState<string>('C.H. Robinson');
  const [brokerCustomName, setBrokerCustomName] = useState('C.H. Robinson');
  const [brokerAddress, setBrokerAddress] = useState(BROKER_DEFAULTS['C.H. Robinson'].address);
  const [brokerPhone, setBrokerPhone] = useState(BROKER_DEFAULTS['C.H. Robinson'].phone);
  const [brokerEmail, setBrokerEmail] = useState(BROKER_DEFAULTS['C.H. Robinson'].email);

  // Filter carrier loads for carrier broker selection dropdown
  const freightCarrierDriverIds = useMemo(() => {
    return drivers.filter(d => d.carrierId === freightCarrierId).map(d => d.id);
  }, [freightCarrierId, drivers]);

  const carrierAvailableLoads = useMemo(() => {
    return loads.filter(l => {
      const matchesDirect = l.carrierId === freightCarrierId || (carriers.find(c => c.id === freightCarrierId)?.name === l.carrierName);
      const matchesDriver = freightCarrierDriverIds.includes(l.driverId);
      return matchesDirect || matchesDriver;
    });
  }, [loads, freightCarrierDriverIds, freightCarrierId, carriers]);

  // Load single or multiple selectors for freight invoices
  const [selectedLoadId, setSelectedLoadId] = useState<string>('');
  const [carrierInvoiceNum, setCarrierInvoiceNum] = useState(() => `INV-${freightCarrierId.toUpperCase()}-${100 + Math.floor(Math.random() * 900)}`);
  const [freightInvoiceDate, setFreightInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentTerms, setPaymentTerms] = useState('Factored (Remit to Apex)');
  
  // Accessorial lines
  const [fuelSurcharge, setFuelSurcharge] = useState<number>(0);
  const [detentionCharge, setDetentionCharge] = useState<number>(0);
  const [layoverCharge, setLayoverCharge] = useState<number>(0);
  const [lumperCharge, setLumperCharge] = useState<number>(0);
  const [otherCharge, setOtherCharge] = useState<number>(0);
  const [otherChargeLabel, setOtherChargeLabel] = useState('Driver Assist Fee');
  const [fuelAdvanceDeducted, setFuelAdvanceDeducted] = useState<number>(0);

  // Dynamic load mapping
  const currentSelectedLoadObj = useMemo(() => {
    if (!selectedLoadId) {
      return carrierAvailableLoads[0] || null;
    }
    return carrierAvailableLoads.find(l => l.id === selectedLoadId) || null;
  }, [selectedLoadId, carrierAvailableLoads]);

  // Auto-fill form details when modifying settings
  const handleCarrierChange = (cId: string) => {
    setFreightCarrierId(cId);
    setSelectedLoadId(''); // reset selection
    const defaults = CARRIER_DEFAULTS[cId];
    if (defaults) {
      setCarrierAddress(defaults.address);
      setCarrierDot(defaults.dot);
      setCarrierMc(defaults.mc);
      setCarrierEmail(defaults.email);
      setFactoringNote(defaults.factoringNote);
      
      setCustomCarrierName(carriers.find(c => c.id === cId)?.name || 'E & G Express');
      setCustomCarrierAddress(defaults.address);
      setCustomCarrierDot(defaults.dot);
      setCustomCarrierMc(defaults.mc);
      setCustomCarrierEmail(defaults.email);
    } else {
      const carrObj = carriers.find(c => c.id === cId);
      const name = carrObj ? carrObj.name : 'Partner Carrier';
      const addr = carrObj?.address || 'Partner Carrier Industrial Park, Suite 100';
      const dot = carrObj?.dotNumber || '3004819';
      const mc = carrObj?.mcNumber || '918402';
      const email = carrObj?.email || 'dispatch@eg-carriers.com';

      setCarrierAddress(addr);
      setCarrierDot(dot);
      setCarrierMc(mc);
      setCarrierEmail(email);
      setFactoringNote('Remit to standard factoring company partners on record.');

      setCustomCarrierName(name);
      setCustomCarrierAddress(addr);
      setCustomCarrierDot(dot);
      setCustomCarrierMc(mc);
      setCustomCarrierEmail(email);
    }
    setCarrierInvoiceNum(`INV-${cId.toUpperCase()}-${100 + Math.floor(Math.random() * 900)}`);
  };

  const handleBrokerChange = (selection: string) => {
    setBrokerSelection(selection);
    if (selection === 'CUSTOM') {
      setBrokerCustomName('Custom Freight Broker');
      setBrokerAddress('');
      setBrokerPhone('');
      setBrokerEmail('');

      setCustomBrokerName('Custom Freight Broker');
      setCustomBrokerAddress('');
      setCustomBrokerPhone('');
      setCustomBrokerEmail('');
    } else {
      setBrokerCustomName(selection);
      const bDef = BROKER_DEFAULTS[selection];
      if (bDef) {
        setBrokerAddress(bDef.address);
        setBrokerPhone(bDef.phone);
        setBrokerEmail(bDef.email);

        setCustomBrokerName(selection);
        setCustomBrokerAddress(bDef.address);
        setCustomBrokerPhone(bDef.phone);
        setCustomBrokerEmail(bDef.email);
      }
    }
  };

  const selectedCarrierName = carriers.find(c => c.id === freightCarrierId)?.name || 'E & G Express';
  const driverForFreight = currentSelectedLoadObj ? (drivers.find(d => d.id === currentSelectedLoadObj.driverId)?.name || 'Assigned Carrier Driver') : 'Assigned Carrier Driver';
  const truckForFreight = currentSelectedLoadObj ? (drivers.find(d => d.id === currentSelectedLoadObj.driverId)?.truckNum || 'N/A') : 'N/A';

  const freightLoadRate = currentSelectedLoadObj ? currentSelectedLoadObj.loadAmount : 0;
  const accessorialTotal = fuelSurcharge + detentionCharge + layoverCharge + lumperCharge + otherCharge;
  
  // Total Freight Invoice Amount = Raw Gross Load + Accessorials
  const grossInvoiceTotal = freightLoadRate + accessorialTotal;
  const netInvoicePayout = grossInvoiceTotal - fuelAdvanceDeducted;

  // Manual Custom Mode Totals
  const customGrossTotal = useMemo(() => {
    return customLineItems.reduce((sum, item) => sum + Number(item.loadAmount || 0), 0);
  }, [customLineItems]);

  const customFeeTotal = useMemo(() => {
    return customLineItems.reduce((sum, item) => {
      const itemRate = item.feePercent || carrierRateForDispatch || companySettings.defaultDispatchFeePercent || 8;
      return sum + Math.round((Number(item.loadAmount || 0) * itemRate) / 100);
    }, 0);
  }, [customLineItems, carrierRateForDispatch, companySettings.defaultDispatchFeePercent]);

  const customLinehaulGross = useMemo(() => {
    return customLineItems.reduce((sum, item) => sum + Number(item.loadAmount || 0), 0);
  }, [customLineItems]);

  // --- HANDLERS FOR CUSTOMIZATION ---
  const handleLoadLast7Days = () => {
    const targetCarrierId = invoiceMode === 'DISPATCH_FEE' ? feeCarrierId : freightCarrierId;
    const cDrivers = drivers.filter(d => d.carrierId === targetCarrierId).map(d => d.id);
    
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    const startStr = sevenDaysAgo.toISOString().split('T')[0];
    const endStr = today.toISOString().split('T')[0];

    const matched = loads.filter(l => 
      cDrivers.includes(l.driverId) &&
      l.pickupDate >= startStr && 
      l.pickupDate <= endStr
    );

    const mappedItems: InvoiceLineItem[] = matched.map(l => {
      const drv = drivers.find(d => d.id === l.driverId);
      return {
        id: l.id,
        loadNum: l.loadNum,
        rateConNum: l.rateConNum,
        broker: l.broker,
        pickupLocation: l.pickupLocation,
        deliveryLocation: l.deliveryLocation,
        pickupDate: l.pickupDate,
        deliveryDate: l.deliveryDate,
        loadAmount: l.loadAmount,
        driverName: drv?.name || 'Unknown Driver',
        truckNum: drv?.truckNum || 'N/A',
        feePercent: l.feePercent || carrierRateForDispatch || companySettings.defaultDispatchFeePercent || 8
      };
    });

    setCustomLineItems(mappedItems);
    setIsManualCustomMode(true);
    
    const carrierObj = carriers.find(c => c.id === targetCarrierId);
    if (carrierObj) {
      setCustomCarrierName(carrierObj.name);
      setCustomCarrierAddress(carrierObj.address || 'Partner Carrier Blvd');
      setCustomCarrierDot(carrierObj.dotNumber || '3004819');
      setCustomCarrierMc(carrierObj.mcNumber || '918402');
      setCustomCarrierEmail(carrierObj.email || 'billing@eg-express.com');
    }
    alert(`Queried and loaded ${matched.length} dispatched cargo orders from the last 7 days!`);
  };

  const handleApplyFeePercent = (percent: number) => {
    setSelectedFeePercent(percent);
    if (customLineItems.length > 0) {
      setCustomLineItems(prev => prev.map(item => {
        const gross = item.loadAmount || 0;
        const calcAmt = gross > 0 ? Math.round((gross * percent) / 100) : (item.amount || 0);
        return {
          ...item,
          feePercent: percent,
          rate: calcAmt,
          amount: calcAmt
        };
      }));
    }
  };

  const handleParseGoogleSheetData = (text: string, append: boolean = false) => {
    if (!text.trim()) return;
    const lines = text.trim().split(/\r?\n/);
    const currentPct = typeof selectedFeePercent === 'number' ? selectedFeePercent : 8;
    const parsedItems: InvoiceLineItem[] = [];

    lines.forEach((line, idx) => {
      if (!line.trim()) return;
      let cols: string[] = [];
      if (line.includes('\t')) {
        cols = line.split('\t');
      } else if (line.includes('|')) {
        cols = line.split('|');
      } else if (line.includes(',')) {
        cols = line.split(',');
      } else {
        cols = line.split(/\s{2,}/);
      }

      cols = cols.map(c => c.trim());

      // Expected pattern: Date | Load# | Driver Name | Broker Name | Gross Amount
      const dateVal = cols[0] || new Date().toISOString().split('T')[0];
      const loadVal = cols[1] || `${32000000 + idx}`;
      const driverVal = cols[2] || '';
      const brokerVal = cols[3] || '';
      const rawGross = cols[4] || cols[cols.length - 1] || '0';
      const grossVal = parseFloat(rawGross.replace(/[^0-9.]/g, '')) || 0;

      const calculatedAmt = Math.round((grossVal * currentPct) / 100);

      parsedItems.push({
        id: `pasted-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        pickupDate: dateVal,
        loadNum: loadVal,
        driverName: driverVal,
        broker: brokerVal,
        loadAmount: grossVal,
        feePercent: currentPct,
        rate: calculatedAmt,
        amount: calculatedAmt,
        quantity: 1,
        description: `${dateVal} ${loadVal} $${grossVal} ${driverVal} ${brokerVal}`.trim()
      });
    });

    if (parsedItems.length > 0) {
      if (append) {
        setCustomLineItems(prev => [...prev, ...parsedItems]);
      } else {
        setCustomLineItems(parsedItems);
      }
      setIsManualCustomMode(true);
      setShowPasteModal(false);
      setPasteText('');
      alert(`Successfully imported ${parsedItems.length} items from Google Sheets!`);
    } else {
      alert('Could not parse rows. Please copy tab-separated cells from Google Sheets or Excel.');
    }
  };

  const handleLoadReferenceSample = () => {
    setIsManualCustomMode(true);
    setActiveTemplateStyle('REFERENCE_LOOK');
    setDispatchInvoiceNum('47');
    setDispatchInvoiceDate('2026-06-05');
    setDueDate('2026-06-06');
    setSendToContact('Frank WU');
    setCustomBillerName('Timely Logistix LLC');
    setCustomCarrierName('E & G EXPRESS TRUCKING LLC');
    setCustomCarrierAddress('18 WHITNEY LN\nGRAND ISLAND, NY 14072');
    setPaymentMethod('Zelle');

    const refItems: InvoiceLineItem[] = [
      { id: 'ref-1', pickupDate: '5/20/2026', loadNum: 'PREV-BAL', driverName: 'Frank WU', broker: 'Zelle Receipt', loadAmount: 3144, feePercent: 8, amount: 2244, description: 'Last Invoice $3144 received 500+400=900' },
      { id: 'ref-2', pickupDate: '5/21/2026', loadNum: '32629712', driverName: 'Jama', broker: 'TQL', loadAmount: 1400, feePercent: 8, amount: 112 },
      { id: 'ref-3', pickupDate: '5/26/2026', loadNum: '32146077', driverName: 'Jama', broker: 'Landstar', loadAmount: 1100, feePercent: 8, amount: 88 },
      { id: 'ref-4', pickupDate: '5/26/2026', loadNum: '3318050', driverName: 'TY', broker: 'Echo Global', loadAmount: 1750, feePercent: 8, amount: 118 },
      { id: 'ref-5', pickupDate: '5/27/2026', loadNum: '360028', driverName: 'Jama', broker: 'TQL', loadAmount: 1400, feePercent: 8, amount: 112 },
      { id: 'ref-6', pickupDate: '5/28/2026', loadNum: '31485-26112', driverName: 'Jama', broker: 'CH Robinson', loadAmount: 2200, feePercent: 8, amount: 176 },
      { id: 'ref-7', pickupDate: '5/29/2026', loadNum: '7WR6445', driverName: 'Frederick', broker: 'Coyote', loadAmount: 1900, feePercent: 8, amount: 152 },
      { id: 'ref-8', pickupDate: '5/30/2026', loadNum: 'ZELLE-84', driverName: 'Carrier Zelle', broker: 'Direct Zelle', loadAmount: 84, feePercent: 100, amount: 84 },
    ];

    setCustomLineItems(refItems);
    alert('Loaded reference sample invoice matching your screenshot (#47, Frank WU, E & G Express Trucking LLC)!');
  };

  const handleAddBlankLineItem = () => {
    const currentPct = typeof selectedFeePercent === 'number' ? selectedFeePercent : 8;
    const gross = 1000;
    const calcAmt = Math.round((gross * currentPct) / 100);

    const newItem: InvoiceLineItem = {
      id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      pickupDate: new Date().toISOString().split('T')[0],
      loadNum: `${32000000 + Math.floor(Math.random() * 900000)}`,
      driverName: 'Jama',
      broker: 'TQL',
      loadAmount: gross,
      feePercent: currentPct,
      rate: calcAmt,
      amount: calcAmt,
      quantity: 1,
      description: 'Dispatched Cargo Load'
    };
    setCustomLineItems(prev => [...prev, newItem]);
    setIsManualCustomMode(true);
  };

  const handleUpdateLineItem = (itemId: string, field: keyof InvoiceLineItem, value: any) => {
    setCustomLineItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: value };
        const currentPct = updated.feePercent || (typeof selectedFeePercent === 'number' ? selectedFeePercent : 8);

        if (field === 'loadAmount') {
          const gross = Number(value) || 0;
          updated.loadAmount = gross;
          const calc = Math.round((gross * currentPct) / 100);
          updated.rate = calc;
          updated.amount = calc;
        } else if (field === 'feePercent') {
          const pct = Number(value) || 0;
          updated.feePercent = pct;
          const gross = updated.loadAmount || 0;
          const calc = Math.round((gross * pct) / 100);
          updated.rate = calc;
          updated.amount = calc;
        } else if (field === 'amount') {
          updated.amount = Number(value) || 0;
        } else if (field === 'quantity' || field === 'rate') {
          const qty = field === 'quantity' ? Number(value) : (item.quantity || 1);
          const rate = field === 'rate' ? Number(value) : (item.rate || 0);
          updated.amount = qty * rate;
        }
        return updated;
      }
      return item;
    }));
  };

  const handleRemoveLineItem = (itemId: string) => {
    setCustomLineItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleCreateNewInvoice = () => {
    setIsManualCustomMode(false);
    setCustomLineItems([]);
    setInvoiceLogoUrl(companySettings.logoUrl || '');
    setDispatchInvoiceNum(`TL-DS-${new Date().getFullYear()}-${1000 + Math.floor(Math.random() * 9000)}`);
    setCarrierInvoiceNum(`INV-${freightCarrierId.toUpperCase()}-${100 + Math.floor(Math.random() * 900)}`);
    setFuelSurcharge(0);
    setDetentionCharge(0);
    setLayoverCharge(0);
    setLumperCharge(0);
    setOtherCharge(0);
    setFuelAdvanceDeducted(0);
    alert('Cleared form and reset to a new invoice draft.');
  };

  const handleSaveInvoiceRecord = async () => {
    const biller = {
      billerName: isManualCustomMode ? customBillerName : companySettings.name,
      billerAddress: isManualCustomMode ? customBillerAddress : companySettings.address,
      billerPhone: isManualCustomMode ? customBillerPhone : companySettings.phone,
      billerEmail: isManualCustomMode ? customBillerEmail : companySettings.email,
    };

    const carrier = {
      carrierId: invoiceMode === 'DISPATCH_FEE' ? feeCarrierId : freightCarrierId,
      carrierName: isManualCustomMode ? customCarrierName : (invoiceMode === 'DISPATCH_FEE' ? carrierNameForDispatch : selectedCarrierName),
      carrierAddress: isManualCustomMode ? customCarrierAddress : carrierAddress,
      carrierDot: isManualCustomMode ? customCarrierDot : carrierDot,
      carrierMc: isManualCustomMode ? customCarrierMc : carrierMc,
      carrierEmail: isManualCustomMode ? customCarrierEmail : carrierEmail,
      factoringNote: factoringNote
    };

    const broker = {
      brokerName: isManualCustomMode ? customBrokerName : brokerCustomName,
      brokerAddress: isManualCustomMode ? customBrokerAddress : brokerAddress,
      brokerPhone: isManualCustomMode ? customBrokerPhone : brokerPhone,
      brokerEmail: isManualCustomMode ? customBrokerEmail : brokerEmail,
    };

    let finalLineItems: InvoiceLineItem[] = [];
    let gross = 0;
    let net = 0;

    if (invoiceMode === 'DISPATCH_FEE') {
      if (isManualCustomMode) {
        finalLineItems = customLineItems;
        gross = customGrossTotal;
        net = customFeeTotal;
      } else {
        finalLineItems = matchedLoadsForDispatchFee.map(l => ({
          id: l.id,
          loadNum: l.loadNum,
          rateConNum: l.rateConNum,
          broker: l.broker,
          pickupLocation: l.pickupLocation,
          deliveryLocation: l.deliveryLocation,
          pickupDate: l.pickupDate,
          deliveryDate: l.deliveryDate,
          loadAmount: l.loadAmount,
          feePercent: l.feePercent || carrierRateForDispatch || companySettings.defaultDispatchFeePercent || 8
        }));
        gross = dispatchGrossBookingsTot;
        net = dispatchFeeTot;
      }
    } else {
      if (isManualCustomMode) {
        finalLineItems = customLineItems;
        gross = customLinehaulGross + accessorialTotal;
        net = gross - fuelAdvanceDeducted;
      } else {
        if (currentSelectedLoadObj) {
          finalLineItems = [{
            id: currentSelectedLoadObj.id,
            loadNum: currentSelectedLoadObj.loadNum,
            rateConNum: currentSelectedLoadObj.rateConNum,
            broker: currentSelectedLoadObj.broker,
            pickupLocation: currentSelectedLoadObj.pickupLocation,
            deliveryLocation: currentSelectedLoadObj.deliveryLocation,
            pickupDate: currentSelectedLoadObj.pickupDate,
            deliveryDate: currentSelectedLoadObj.deliveryDate,
            loadAmount: currentSelectedLoadObj.loadAmount
          }];
        }
        gross = grossInvoiceTotal;
        net = netInvoicePayout;
      }
    }

    const newInvoice: Omit<Invoice, 'id'> = {
      invoiceNum: invoiceMode === 'DISPATCH_FEE' ? dispatchInvoiceNum : carrierInvoiceNum,
      invoiceDate: invoiceMode === 'DISPATCH_FEE' ? dispatchInvoiceDate : freightInvoiceDate,
      invoiceMode: invoiceMode === 'DISPATCH_FEE' 
        ? (isManualCustomMode ? 'CUSTOM_DISPATCH' : 'DISPATCH_FEE') 
        : (isManualCustomMode ? 'CUSTOM_CARRIER' : 'CARRIER_FREIGHT'),
      logoUrl: invoiceLogoUrl,
      
      billerName: biller.billerName,
      billerAddress: biller.billerAddress,
      billerPhone: biller.billerPhone,
      billerEmail: biller.billerEmail,

      carrierId: carrier.carrierId,
      carrierName: carrier.carrierName,
      carrierAddress: carrier.carrierAddress,
      carrierDot: carrier.carrierDot,
      carrierMc: carrier.carrierMc,
      carrierEmail: carrier.carrierEmail,
      factoringNote: carrier.factoringNote,

      brokerName: broker.brokerName,
      brokerAddress: broker.brokerAddress,
      brokerPhone: broker.brokerPhone,
      brokerEmail: broker.brokerEmail,

      paymentTerms: invoiceMode === 'DISPATCH_FEE' ? 'NET 15 DAYS' : paymentTerms,
      dueDate: dueDate,
      sendToContact: sendToContact,
      paymentMethod: paymentMethod === 'CUSTOM' ? customPaymentMethodText : paymentMethod,
      startDate: invoiceMode === 'DISPATCH_FEE' ? dispatchStartDate : undefined,
      endDate: invoiceMode === 'DISPATCH_FEE' ? dispatchEndDate : undefined,

      lineItems: finalLineItems,

      fuelSurcharge: invoiceMode === 'CARRIER_FREIGHT' ? fuelSurcharge : undefined,
      detentionCharge: invoiceMode === 'CARRIER_FREIGHT' ? detentionCharge : undefined,
      layoverCharge: invoiceMode === 'CARRIER_FREIGHT' ? layoverCharge : undefined,
      lumperCharge: invoiceMode === 'CARRIER_FREIGHT' ? lumperCharge : undefined,
      otherCharge: invoiceMode === 'CARRIER_FREIGHT' ? otherCharge : undefined,
      otherChargeLabel: invoiceMode === 'CARRIER_FREIGHT' ? otherChargeLabel : undefined,
      fuelAdvanceDeducted: invoiceMode === 'CARRIER_FREIGHT' ? fuelAdvanceDeducted : undefined,

      grossAmount: gross,
      netAmount: net,
      notes: invoiceMode === 'DISPATCH_FEE' ? dispatchCustomNotes : undefined
    };

    try {
      await onAddInvoice(newInvoice);
      alert('Invoice successfully saved and archived in system records!');
    } catch (err) {
      console.error(err);
      alert('Failed to save invoice record.');
    }
  };

  const handleLoadInvoice = (inv: Invoice) => {
    setInvoiceMode(inv.invoiceMode.includes('DISPATCH') ? 'DISPATCH_FEE' : 'CARRIER_FREIGHT');
    setIsManualCustomMode(true);
    setInvoiceLogoUrl(inv.logoUrl || '');

    setCustomBillerName(inv.billerName);
    setCustomBillerAddress(inv.billerAddress);
    setCustomBillerPhone(inv.billerPhone);
    setCustomBillerEmail(inv.billerEmail);

    setCustomCarrierName(inv.carrierName);
    setCustomCarrierAddress(inv.carrierAddress);
    setCustomCarrierDot(inv.carrierDot || '');
    setCustomCarrierMc(inv.carrierMc || '');
    setCustomCarrierEmail(inv.carrierEmail || '');
    if (inv.carrierId) {
      if (inv.invoiceMode.includes('DISPATCH')) {
        setFeeCarrierId(inv.carrierId);
      } else {
        setFreightCarrierId(inv.carrierId);
      }
    }

    setCustomBrokerName(inv.brokerName || '');
    setCustomBrokerAddress(inv.brokerAddress || '');
    setCustomBrokerPhone(inv.brokerPhone || '');
    setCustomBrokerEmail(inv.brokerEmail || '');

    if (inv.invoiceMode.includes('DISPATCH')) {
      setDispatchInvoiceNum(inv.invoiceNum);
      setDispatchInvoiceDate(inv.invoiceDate);
      if (inv.startDate) setDispatchStartDate(inv.startDate);
      if (inv.endDate) setDispatchEndDate(inv.endDate);
      if (inv.notes) setDispatchCustomNotes(inv.notes);
    } else {
      setCarrierInvoiceNum(inv.invoiceNum);
      setFreightInvoiceDate(inv.invoiceDate);
      setPaymentTerms(inv.paymentTerms);
      setFuelSurcharge(inv.fuelSurcharge || 0);
      setDetentionCharge(inv.detentionCharge || 0);
      setLayoverCharge(inv.layoverCharge || 0);
      setLumperCharge(inv.lumperCharge || 0);
      setOtherCharge(inv.otherCharge || 0);
      setOtherChargeLabel(inv.otherChargeLabel || 'Driver Assist Fee');
      setFuelAdvanceDeducted(inv.fuelAdvanceDeducted || 0);
      setFactoringNote(inv.factoringNote || '');
    }

    setCustomLineItems(inv.lineItems);
    alert(`Loaded Invoice #${inv.invoiceNum} into active workspace! You can edit or print now.`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">

      {/* TOP NAVIGATION WORKSPACE TABS */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-2.5 rounded-2xl border border-slate-800 shadow-lg no-print">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveMainTab('OWNER_LEDGER')}
            className={`px-4 py-2.5 text-xs font-black rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeMainTab === 'OWNER_LEDGER'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <DollarSign className="h-4 w-4" />
            <span>1. Owner Dispatch Payments &amp; Ledger</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('BUILDER')}
            className={`px-4 py-2.5 text-xs font-black rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeMainTab === 'BUILDER'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>2. Invoice Builder &amp; Generator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('REGISTRY')}
            className={`px-4 py-2.5 text-xs font-black rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeMainTab === 'REGISTRY'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>3. Saved Invoices Registry ({invoices.length})</span>
          </button>
        </div>

        <div className="text-[10px] font-mono text-slate-400 px-3">
          Carrier Dispatch System • Timely Logistix
        </div>
      </div>

      {/* TAB 1: OWNER DISPATCH PAYMENTS & PARTIAL LEDGER */}
      {activeMainTab === 'OWNER_LEDGER' && (
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

      {/* TAB 3: SAVED INVOICES REGISTRY */}
      {activeMainTab === 'REGISTRY' && (
        <SavedInvoicesRegistry 
          invoices={invoices}
          onLoadInvoice={(inv) => {
            handleLoadInvoice(inv);
            setActiveMainTab('BUILDER');
          }}
          onDeleteInvoice={onDeleteInvoice}
          onEditInvoice={onEditInvoice}
        />
      )}

      {/* TAB 2: INVOICE BUILDER & GENERATOR */}
      {activeMainTab === 'BUILDER' && (
        <div className="space-y-6">


      {/* Control / Config Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5 no-print">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 font-display">
              Invoicing
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Select or generate dual dispatch fees statements or broker billing freight invoices on behalf of drivers and carrier teams.
            </p>
          </div>

          {/* Mode Tabs Buttons */}
          <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              onClick={() => {
                setInvoiceMode('DISPATCH_FEE');
                setIsManualCustomMode(false);
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                invoiceMode === 'DISPATCH_FEE' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Percent className="h-4 w-4" />
              <span>Dispatch Fees Billing (TL ➜ Carrier)</span>
            </button>
            <button
              onClick={() => {
                setInvoiceMode('CARRIER_FREIGHT');
                setIsManualCustomMode(false);
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                invoiceMode === 'CARRIER_FREIGHT' 
                  ? 'bg-amber-600 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Briefcase className="h-4 w-4" />
              <span>Carrier Freight Invoice (Carrier ➜ Broker)</span>
            </button>
          </div>
        </div>

        {/* Dynamic Customization Mode Switches */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="text-xs font-bold text-slate-800">Manual Invoice Customization Mode</h4>
            <p className="text-[10px] text-slate-500">Unlocks full manual editing of billing headers, carrier/dispatch account details, and line items.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (isManualCustomMode) {
                  if (confirm("Disable custom mode? This will reset custom entries and revert to the database values.")) {
                    setIsManualCustomMode(false);
                    setCustomLineItems([]);
                  }
                } else {
                  setIsManualCustomMode(true);
                  // Initialize custom details from standard active values
                  setCustomBillerName(companySettings.name);
                  setCustomBillerAddress(companySettings.address);
                  setCustomBillerPhone(companySettings.phone);
                  setCustomBillerEmail(companySettings.email);
                  
                  const targetCarrId = invoiceMode === 'DISPATCH_FEE' ? feeCarrierId : freightCarrierId;
                  const cObj = carriers.find(c => c.id === targetCarrId);
                  setCustomCarrierName(cObj ? cObj.name : carrierNameForDispatch);
                  setCustomCarrierAddress(cObj ? (cObj.address || 'Partner Carrier Blvd') : carrierAddress);
                  setCustomCarrierDot(cObj ? (cObj.dotNumber || '3004819') : carrierDot);
                  setCustomCarrierMc(cObj ? (cObj.mcNumber || '918402') : carrierMc);
                  setCustomCarrierEmail(cObj ? (cObj.email || 'billing@eg-express.com') : carrierEmail);

                  setCustomBrokerName(brokerCustomName);
                  setCustomBrokerAddress(brokerAddress);
                  setCustomBrokerPhone(brokerPhone);
                  setCustomBrokerEmail(brokerEmail);
                  
                  // Map initial lines from matched loads in standard view
                  if (invoiceMode === 'DISPATCH_FEE') {
                    setCustomLineItems(matchedLoadsForDispatchFee.map(l => {
                      const drv = drivers.find(d => d.id === l.driverId);
                      return {
                        id: l.id,
                        loadNum: l.loadNum,
                        rateConNum: l.rateConNum,
                        broker: l.broker,
                        pickupLocation: l.pickupLocation,
                        deliveryLocation: l.deliveryLocation,
                        pickupDate: l.pickupDate,
                        deliveryDate: l.deliveryDate,
                        loadAmount: l.loadAmount,
                        driverName: drv?.name || 'Unknown Driver',
                        truckNum: drv?.truckNum || 'N/A',
                        feePercent: l.feePercent || carrierRateForDispatch || companySettings.defaultDispatchFeePercent || 8
                      };
                    }));
                  } else {
                    if (currentSelectedLoadObj) {
                      const drv = drivers.find(d => d.id === currentSelectedLoadObj.driverId);
                      setCustomLineItems([{
                        id: currentSelectedLoadObj.id,
                        loadNum: currentSelectedLoadObj.loadNum,
                        rateConNum: currentSelectedLoadObj.rateConNum,
                        broker: currentSelectedLoadObj.broker,
                        pickupLocation: currentSelectedLoadObj.pickupLocation,
                        deliveryLocation: currentSelectedLoadObj.deliveryLocation,
                        pickupDate: currentSelectedLoadObj.pickupDate,
                        deliveryDate: currentSelectedLoadObj.deliveryDate,
                        loadAmount: currentSelectedLoadObj.loadAmount,
                        driverName: drv?.name || 'Unknown Driver',
                        truckNum: drv?.truckNum || 'N/A'
                      }]);
                    } else {
                      setCustomLineItems([]);
                    }
                  }
                }
              }}
              className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all border ${
                isManualCustomMode
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {isManualCustomMode ? '✨ Manual Custom Active' : '✏️ Enable Manual Custom Mode'}
            </button>

            <button
              type="button"
              onClick={handleCreateNewInvoice}
              className="cursor-pointer px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-750 text-xs font-bold rounded-lg border border-slate-300 transition-colors"
              title="Clear active workspace to start a new blank invoice sheet"
            >
              ✨ Create New Invoice
            </button>
          </div>
        </div>

        {/* Invoice Logo & Branding Custom Uploader */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-800">Invoice Letterhead Logo / Corporate Branding</h4>
              <p className="text-[10px] text-slate-500">Upload a custom logo to display on this specific invoice. Click to save as global default.</p>
            </div>
            
            <div className="flex items-center gap-3">
              {invoiceLogoUrl ? (
                <img src={invoiceLogoUrl} alt="Invoice logo preview" className="h-8 max-w-32 object-contain bg-white rounded p-1 shadow-sm border border-slate-200" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono bg-slate-200/50 px-2.5 py-1 rounded-md">No Logo</span>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <label className="cursor-pointer bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold px-4 py-2 rounded-lg border border-slate-300 transition-colors inline-flex items-center gap-1.5 shadow-sm">
              <Upload className="h-4 w-4 text-slate-500" />
              <span>Upload Custom Logo</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                      const base64 = reader.result as string;
                      setInvoiceLogoUrl(base64);
                      if (saveLogoAsDefault) {
                        await onUpdateCompanySettings({ logoUrl: base64 });
                        alert('Logo successfully saved and registered as your corporate default on every new invoice!');
                      } else {
                        alert('Logo updated for this active invoice workspace!');
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
            
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 select-none">
              <input
                type="checkbox"
                checked={saveLogoAsDefault}
                onChange={(e) => setSaveLogoAsDefault(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span>Keep as default logo for every new invoice</span>
            </label>
          </div>
        </div>

        {/* Manual Account Details Form */}
        {isManualCustomMode && (
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-5 animate-fadeIn">
            
            {/* Template Style & Quick Preset Actions */}
            <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-200/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  Quick Presets &amp; Reference Matcher
                </h4>
                <p className="text-[10px] text-amber-800/80">Instantly apply percentage rates or load reference image data matching your screenshot.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadReferenceSample}
                  className="cursor-pointer bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-[11px] px-3.5 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                  title="Loads the exact 8 sample items, invoice #47, Frank WU, and $3,086 total matching your screenshot reference!"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>📸 Load Reference Sample (#47 Frank WU)</span>
                </button>
              </div>
            </div>

            {/* Percentage Presets Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Percentage Fee Rate Presets (Selectable / Auto-Calculate Rate)</label>
              <div className="flex flex-wrap items-center gap-2">
                {[5, 6, 7, 8, 22].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleApplyFeePercent(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      selectedFeePercent === p 
                        ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {p === 22 ? '22% Driver Commission' : `${p}% Dispatch Fee`}
                  </button>
                ))}
              </div>
            </div>

            {/* Account & Billing Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Send To & Payment Controls */}
              <div className="space-y-3 bg-white p-4 rounded-lg border border-slate-200">
                <h5 className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider border-b pb-1">Recipient &amp; Payment Method</h5>
                <div className="space-y-2">
                  <div>
                    <label className="text-[9px] text-slate-400 block font-bold uppercase">Send to Contact</label>
                    <input type="text" className="w-full text-xs border rounded p-1.5 font-bold focus:ring-1 focus:ring-blue-500" placeholder="e.g. Frank WU" value={sendToContact} onChange={e => setSendToContact(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 block font-bold uppercase">Payment Method</label>
                    <select className="w-full text-xs border rounded p-1.5 font-semibold focus:ring-1 focus:ring-blue-500" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                      <option value="Zelle">Zelle</option>
                      <option value="Western Union">Western Union</option>
                      <option value="CashApp">CashApp</option>
                      <option value="ACH Direct Deposit">ACH Direct Deposit</option>
                      <option value="Direct Deposit">Direct Deposit</option>
                      <option value="Wire Transfer">Wire Transfer</option>
                      <option value="Check">Check</option>
                      <option value="CUSTOM">Custom Method...</option>
                    </select>
                  </div>
                  {paymentMethod === 'CUSTOM' && (
                    <div>
                      <label className="text-[9px] text-slate-400 block font-bold uppercase">Custom Payment Instructions</label>
                      <input type="text" className="w-full text-xs border rounded p-1.5" value={customPaymentMethodText} onChange={e => setCustomPaymentMethodText(e.target.value)} />
                    </div>
                  )}
                  <div>
                    <label className="text-[9px] text-slate-400 block font-bold uppercase">Due Date</label>
                    <input type="date" className="w-full text-xs border rounded p-1.5 font-mono" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Biller Info (TL / Dispatcher) */}
              <div className="space-y-3 bg-white p-4 rounded-lg border border-slate-200">
                <h5 className="text-[10px] font-bold text-blue-600 uppercase tracking-wider border-b pb-1">Dispatcher Billing Agent</h5>
                <div className="space-y-2">
                  <div>
                    <label className="text-[9px] text-slate-400 block font-bold uppercase">Company Name</label>
                    <input type="text" className="w-full text-xs border rounded p-1.5 focus:ring-1 focus:ring-blue-500 font-bold" value={customBillerName} onChange={e => setCustomBillerName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 block font-bold uppercase">Address</label>
                    <textarea rows={2} className="w-full text-xs border rounded p-1.5 focus:ring-1 focus:ring-blue-500" value={customBillerAddress} onChange={e => setCustomBillerAddress(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Carrier Info */}
              <div className="space-y-3 bg-white p-4 rounded-lg border border-slate-200">
                <h5 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider border-b pb-1">Billed Carrier / Fleet</h5>
                <div className="space-y-2">
                  <div>
                    <label className="text-[9px] text-slate-400 block font-bold uppercase">Carrier Name</label>
                    <input type="text" className="w-full text-xs border rounded p-1.5 focus:ring-1 focus:ring-blue-500 font-bold" value={customCarrierName} onChange={e => setCustomCarrierName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 block font-bold uppercase">Carrier Address</label>
                    <textarea rows={2} className="w-full text-xs border rounded p-1.5 focus:ring-1 focus:ring-blue-500" value={customCarrierAddress} onChange={e => setCustomCarrierAddress(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Broker / Invoice # */}
              <div className="space-y-3 bg-white p-4 rounded-lg border border-slate-200">
                <h5 className="text-[10px] font-bold text-amber-600 uppercase tracking-wider border-b pb-1">Invoice Header Details</h5>
                <div className="space-y-2">
                  <div>
                    <label className="text-[9px] text-slate-400 block font-bold uppercase">Invoice Number</label>
                    <input type="text" className="w-full text-xs border rounded p-1.5 font-bold font-mono focus:ring-1 focus:ring-blue-500" value={dispatchInvoiceNum} onChange={e => setDispatchInvoiceNum(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 block font-bold uppercase">Invoice Date</label>
                    <input type="date" className="w-full text-xs border rounded p-1.5 font-mono" value={dispatchInvoiceDate} onChange={e => setDispatchInvoiceDate(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Line items Builder */}
        {isManualCustomMode && (
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="border-b border-slate-200 pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                  Custom Invoice Line Items Sheet Builder
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Edit items directly in spreadsheet cells or copy-paste rows from Google Sheets.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasteModal(!showPasteModal)}
                  className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white text-[10.5px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-sm"
                  title="Copy rows from Google Sheets or Excel and paste them directly into this invoice!"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>📋 Paste Google Sheet Data</span>
                </button>
                <button
                  type="button"
                  onClick={handleLoadLast7Days}
                  className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10.5px] font-bold px-3 py-1.5 rounded-lg border border-blue-200 transition-all flex items-center gap-1 shadow-sm shrink-0"
                  title="Queries the database for all loads dispatched to this carrier within the last 7 days, and loads them as custom items."
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Sync Dispatched Loads</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddBlankLineItem}
                  className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white text-[10.5px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Add Line Item</span>
                </button>
              </div>
            </div>

            {/* Google Sheet Copy-Paste Modal Box */}
            {showPasteModal && (
              <div className="bg-emerald-50/90 p-4 rounded-xl border border-emerald-300 space-y-3 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <h5 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
                    Copy &amp; Paste Rows directly from Google Sheets / Excel
                  </h5>
                  <button 
                    type="button" 
                    onClick={() => setShowPasteModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-0.5"
                  >
                    ✕ Close
                  </button>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Select rows in Google Sheets or Excel, press <strong className="font-mono bg-white px-1 py-0.5 rounded border border-emerald-200">Ctrl+C / Cmd+C</strong>, then paste (<strong className="font-mono bg-white px-1 py-0.5 rounded border border-emerald-200">Ctrl+V</strong>) below.<br />
                  Columns pattern recognized: <strong className="font-mono bg-white px-1 py-0.5 rounded border border-emerald-200">Date | Load# | Driver Name | Broker Name | Gross Amount</strong>
                </p>
                <textarea
                  rows={4}
                  className="w-full text-xs font-mono p-3 border border-emerald-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 shadow-inner"
                  placeholder={`5/21/2026\t32629712\tJama\tTQL\t1400\n5/26/2026\t32146077\tJama\tLandstar\t1100\n5/26/2026\t3318050\tTY\tEcho Global\t1750`}
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                />
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="text-[11px] text-slate-600 font-medium">
                    Gross Amounts auto-calculate at <strong className="text-emerald-700 font-bold">{typeof selectedFeePercent === 'number' ? selectedFeePercent : 8}%</strong> rate (e.g. $1,000 &rarr; $80).
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleParseGoogleSheetData(pasteText, true)}
                      className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      + Append to Sheet
                    </button>
                    <button
                      type="button"
                      onClick={() => handleParseGoogleSheetData(pasteText, false)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
                    >
                      Replace Sheet Items
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {customLineItems.length > 0 ? (
              <div className="overflow-x-auto border border-slate-300 rounded-lg bg-white shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#333333] text-white font-bold uppercase text-[10px] tracking-wider">
                      <th className="p-2.5 border border-slate-500 w-28">Date</th>
                      <th className="p-2.5 border border-slate-500 w-28">Load#</th>
                      <th className="p-2.5 border border-slate-500">Driver Name</th>
                      <th className="p-2.5 border border-slate-500">Broker Name</th>
                      <th className="p-2.5 border border-slate-500 text-right w-28">Gross Amount ($)</th>
                      <th className="p-2.5 border border-slate-500 text-center w-20">Fee %</th>
                      <th className="p-2.5 border border-slate-500 text-right w-32">Amount ($)</th>
                      <th className="p-2.5 border border-slate-500 text-center w-12">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {customLineItems.map((item) => {
                      const gross = item.loadAmount || 0;
                      const feePct = item.feePercent || (typeof selectedFeePercent === 'number' ? selectedFeePercent : 8);
                      const calcAmt = item.amount !== undefined ? item.amount : Math.round((gross * feePct) / 100);

                      return (
                        <tr key={item.id} className="hover:bg-blue-50/20">
                          <td className="p-1.5 border border-slate-200">
                            <input
                              type="text"
                              className="w-full text-xs border border-slate-200 rounded p-1.5 font-mono focus:bg-blue-50/30"
                              placeholder="5/21/2026"
                              value={item.pickupDate || ''}
                              onChange={e => handleUpdateLineItem(item.id, 'pickupDate', e.target.value)}
                            />
                          </td>
                          <td className="p-1.5 border border-slate-200">
                            <input
                              type="text"
                              className="w-full text-xs border border-slate-200 rounded p-1.5 font-mono font-bold focus:bg-blue-50/30"
                              placeholder="32629712"
                              value={item.loadNum || ''}
                              onChange={e => handleUpdateLineItem(item.id, 'loadNum', e.target.value)}
                            />
                          </td>
                          <td className="p-1.5 border border-slate-200">
                            <input
                              type="text"
                              className="w-full text-xs border border-slate-200 rounded p-1.5 font-bold text-slate-800 focus:bg-blue-50/30"
                              placeholder="Jama / Driver"
                              value={item.driverName || ''}
                              onChange={e => handleUpdateLineItem(item.id, 'driverName', e.target.value)}
                            />
                          </td>
                          <td className="p-1.5 border border-slate-200">
                            <input
                              type="text"
                              className="w-full text-xs border border-slate-200 rounded p-1.5 font-medium text-slate-700 focus:bg-blue-50/30"
                              placeholder="TQL / Broker"
                              value={item.broker || ''}
                              onChange={e => handleUpdateLineItem(item.id, 'broker', e.target.value)}
                            />
                          </td>
                          <td className="p-1.5 border border-slate-200">
                            <input
                              type="number"
                              className="w-full text-xs border border-slate-200 rounded p-1.5 text-right font-mono font-bold focus:bg-blue-50/30"
                              placeholder="1000"
                              value={item.loadAmount === undefined ? '' : item.loadAmount}
                              onChange={e => handleUpdateLineItem(item.id, 'loadAmount', e.target.value)}
                            />
                          </td>
                          <td className="p-1.5 border border-slate-200 text-center">
                            <input
                              type="number"
                              className="w-14 text-xs border border-slate-200 rounded p-1.5 text-center font-bold text-blue-600 focus:bg-blue-50/30"
                              value={item.feePercent === undefined ? (typeof selectedFeePercent === 'number' ? selectedFeePercent : 8) : item.feePercent}
                              onChange={e => handleUpdateLineItem(item.id, 'feePercent', e.target.value)}
                            />
                          </td>
                          <td className="p-1.5 border border-slate-200 text-right">
                            <input
                              type="number"
                              className="w-full text-xs border border-amber-200 rounded p-1.5 text-right font-mono font-extrabold bg-amber-50/60 text-slate-900"
                              value={calcAmt}
                              onChange={e => handleUpdateLineItem(item.id, 'amount', e.target.value)}
                            />
                          </td>
                          <td className="p-1.5 border border-slate-200 text-center">
                            <button type="button" onClick={() => handleRemoveLineItem(item.id)} className="text-red-500 hover:text-red-700 transition-colors p-1 cursor-pointer">
                              <X className="h-4 w-4 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 border border-dashed border-slate-200 rounded-lg text-center text-slate-400 italic">
                No items added yet. Click "+ Add Line Item", "📋 Paste Google Sheet Data", or "📸 Load Reference Sample".
              </div>
            )}
          </div>
        )}

        {isAdmin && (
          <div className="border-t border-slate-100 pt-4 mt-2">
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setShowConfig(!showConfig)}
                className="cursor-pointer text-xs font-bold text-blue-600 hover:text-blue-500 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5" />
                {showConfig ? 'Hide Custom Invoice Branding Settings' : 'Customize Corporate Branding & Invoice Settings'}
              </button>
              
              {companySettings.logoUrl && (
                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                  <span>Current Logo:</span>
                  <img src={companySettings.logoUrl} alt="Logo preview" className="h-7 max-w-28 object-contain bg-slate-50 rounded p-0.5" referrerPolicy="no-referrer" />
                </div>
              )}
            </div>

            {showConfig && (
              <form onSubmit={handleSaveBranding} className="mt-4 bg-slate-55 p-5 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
                <div className="col-span-1 md:col-span-3 pb-2 border-b border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Update Corporate Identity Details</h4>
                  <p className="text-[10.5px] text-slate-500 mt-0.5">These settings update all Dispatch commission invoices, settlement statements, and system headers globally.</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Company Name</label>
                  <input
                    type="text"
                    required
                    value={cfgName}
                    onChange={e => setCfgName(e.target.value)}
                    className="w-full bg-white text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. Timely Logistix Inc."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Company Tagline</label>
                  <input
                    type="text"
                    value={cfgTagline}
                    onChange={e => setCfgTagline(e.target.value)}
                    className="w-full bg-white text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. Premium Commercial Dispatch Console"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Default Dispatch Commission Fee Rate (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={cfgDefaultFee}
                    onChange={e => setCfgDefaultFee(Number(e.target.value))}
                    className="w-full bg-white text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. 8"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Company Phone</label>
                  <input
                    type="text"
                    required
                    value={cfgPhone}
                    onChange={e => setCfgPhone(e.target.value)}
                    className="w-full bg-white text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Company Email</label>
                  <input
                    type="email"
                    required
                    value={cfgEmail}
                    onChange={e => setCfgEmail(e.target.value)}
                    className="w-full bg-white text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Upload Corporate Logo</label>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1 shadow transition-colors">
                      <Upload className="h-3.5 w-3.5" />
                      Choose Logo File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] text-slate-500">Supports PNG, JPG, GIF</span>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Corporate Mailing &amp; Remittance Address</label>
                  <textarea
                    required
                    rows={2}
                    value={cfgAddress}
                    onChange={e => setCfgAddress(e.target.value)}
                    className="w-full bg-white text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none"
                    placeholder="100 Logistics Blvd, Suite 200&#10;Chicago, IL 60611"
                  />
                </div>

                <div className="col-span-1 md:col-span-3 flex justify-end gap-2.5 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowConfig(false)}
                    className="cursor-pointer px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingBranding}
                    className="cursor-pointer px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow transition-colors"
                  >
                    {isSavingBranding ? 'Saving...' : 'Save Branding Identity'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* MODE A: DISPATCH SERVICE FEE STATEMENT SETTING FORM */}
        {invoiceMode === 'DISPATCH_FEE' && (
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-150 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            
            {isAdmin ? (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Dispatcher Desk</label>
                <select
                  className="w-full h-10 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                  value={selectedDispatcherId}
                  onChange={e => setSelectedDispatcherId(e.target.value)}
                >
                  <option value="">All Dispatch Desks</option>
                  {dispatchers.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Dispatcher User</label>
                <input
                  type="text"
                  disabled
                  className="w-full h-10 px-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed"
                  value={dispatchers.find(d => d.username === currentUser.username)?.name || 'Dispatcher Desk'}
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Select Partner Carrier</label>
              <select
                className="w-full h-10 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                value={feeCarrierId}
                onChange={e => setFeeCarrierId(e.target.value)}
              >
                {carriers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.type === 'CARRIER' ? `${c.payoutRatePercent}% Fee` : 'Owner-Op'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Invoice #</label>
              <input
                type="text"
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 font-mono"
                value={dispatchInvoiceNum}
                onChange={e => setDispatchInvoiceNum(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Start Date</label>
              <input
                type="date"
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                value={dispatchStartDate}
                onChange={e => setDispatchStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">End Date</label>
              <input
                type="date"
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                value={dispatchEndDate}
                onChange={e => setDispatchEndDate(e.target.value)}
              />
            </div>

            <div className="flex items-end gap-1.5 w-full">
              <button
                onClick={handlePrint}
                className="h-10 px-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer grow transition-all"
                title="Print Dispatch Fee Statement"
              >
                <Printer className="h-4 w-4" />
                <span>Print UI</span>
              </button>
              <button
                onClick={handleExportDispatchCSV}
                className="h-10 px-3 bg-emerald-650 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer grow transition-all"
                title="Export Excel Worksheet"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* Custom Notes editor */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-6 border-t border-slate-200 pt-3 mt-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Custom Statement Footer Terms</label>
              <input
                type="text"
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700"
                value={dispatchCustomNotes}
                onChange={e => setDispatchCustomNotes(e.target.value)}
                placeholder="Declare payment instructions, wire methods etc."
              />
            </div>
          </div>
        )}

        {/* MODE B: CARRIER SHIPPED FREIGHT INVOICE FORM (CARRIER TO BROKER) */}
        {invoiceMode === 'CARRIER_FREIGHT' && (
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-150 space-y-4">
            
            {/* Step 1: Select Carrier Billing and Broker Payer */}
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">From Carrier (Invoicer)</label>
                <select
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  value={freightCarrierId}
                  onChange={e => handleCarrierChange(e.target.value)}
                >
                  {carriers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.type === 'CARRIER' ? 'Fleet Carrier' : 'Owner Operator'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Dispatched Load</label>
                <select
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-blue-700"
                  value={selectedLoadId}
                  onChange={e => setSelectedLoadId(e.target.value)}
                >
                  {carrierAvailableLoads.length === 0 ? (
                    <option value="">No loads logged for this Carrier</option>
                  ) : (
                    <>
                      <option value="">-- Choose Dispatched Load --</option>
                      {carrierAvailableLoads.map(l => (
                        <option key={l.id} value={l.id}>
                          Load #{l.loadNum} - {l.broker} [${l.loadAmount}]
                        </option>
                      ))}
                    </>
                  )}
                </select>
                {carrierAvailableLoads.length > 0 && !selectedLoadId && (
                  <p className="text-[10px] text-amber-600 mt-1">Please select an individual load from list above.</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Broker (Payer)</label>
                <select
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  value={brokerSelection}
                  onChange={e => handleBrokerChange(e.target.value)}
                >
                  {Object.keys(BROKER_DEFAULTS).map(bName => (
                    <option key={bName} value={bName}>{bName}</option>
                  ))}
                  <option value="CUSTOM">-- Custom/Other Broker --</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Payment Method / Terms</label>
                <input
                  type="text"
                  placeholder="e.g. Standard 30 Days / Factored Apex"
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                  value={paymentTerms}
                  onChange={e => setPaymentTerms(e.target.value)}
                />
              </div>

            </div>

            {/* Editable Parties Metadata Expansion */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200 pt-4 text-xs">
              
              {/* Carrier Details editable */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Carrier Company Metadata</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-400 block">USDOT Number</label>
                    <input type="text" className="w-full border rounded px-2 py-1 font-mono text-xs" value={carrierDot} onChange={e => setCarrierDot(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 block">MC Number</label>
                    <input type="text" className="w-full border rounded px-2 py-1 font-mono text-xs" value={carrierMc} onChange={e => setCarrierMc(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] text-slate-400 block">Carrier Mailing Address</label>
                  <input type="text" className="w-full border rounded px-2 py-1" value={carrierAddress} onChange={e => setCarrierAddress(e.target.value)} />
                </div>

                <div>
                  <label className="text-[9px] text-slate-400 block">Billing Email</label>
                  <input type="text" className="w-full border rounded px-2 py-1 font-mono" value={carrierEmail} onChange={e => setCarrierEmail(e.target.value)} />
                </div>
              </div>

              {/* Broker Payer details editable */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Broker / Payer Billing Details</span>
                
                <div>
                  <label className="text-[9px] text-slate-400 block">Broker Billing Name</label>
                  <input type="text" className="w-full border rounded px-2 py-1 font-semibold" value={brokerCustomName} onChange={e => setBrokerCustomName(e.target.value)} />
                </div>

                <div>
                  <label className="text-[9px] text-slate-400 block">Broker Mailing Address</label>
                  <input type="text" className="w-full border rounded px-2 py-1 text-xs" value={brokerAddress} onChange={e => setBrokerAddress(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-400 block">Broker Phone</label>
                    <input type="text" className="w-full border rounded px-2 py-1 text-xs font-mono" value={brokerPhone} onChange={e => setBrokerPhone(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 block">Accounts Payable Email</label>
                    <input type="text" className="w-full border rounded px-2 py-1 text-xs font-mono" value={brokerEmail} onChange={e => setBrokerEmail(e.target.value)} />
                  </div>
                </div>
              </div>

            </div>

            {/* Accessorials & Surcharges Additions Panel */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Accessorial Surcharges &amp; Deduction Line items</span>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                <div>
                  <label className="text-[9px] text-slate-400 block font-bold">Fuel Surcharge ($)</label>
                  <input
                    type="number"
                    className="w-full border rounded px-2.5 py-1 text-slate-800 font-mono font-medium"
                    value={fuelSurcharge === 0 ? '' : fuelSurcharge}
                    placeholder="0.00"
                    onChange={e => setFuelSurcharge(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 block font-bold">Detention Charge ($)</label>
                  <input
                    type="number"
                    className="w-full border rounded px-2.5 py-1 text-slate-800 font-mono font-medium"
                    value={detentionCharge === 0 ? '' : detentionCharge}
                    placeholder="0.00"
                    onChange={e => setDetentionCharge(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 block font-bold">Layover Hour Pay ($)</label>
                  <input
                    type="number"
                    className="w-full border rounded px-2.5 py-1 text-slate-800 font-mono font-medium"
                    value={layoverCharge === 0 ? '' : layoverCharge}
                    placeholder="0.00"
                    onChange={e => setLayoverCharge(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 block font-bold">Lumper Receipts ($)</label>
                  <input
                    type="number"
                    className="w-full border rounded px-2.5 py-1 text-slate-800 font-mono font-medium"
                    value={lumperCharge === 0 ? '' : lumperCharge}
                    placeholder="0.00"
                    onChange={e => setLumperCharge(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 block font-bold">
                    <input 
                      type="text" 
                      className="text-[9px] text-blue-600 font-bold bg-transparent border-b border-dashed focus:outline-none w-24" 
                      value={otherChargeLabel} 
                      onChange={e => setOtherChargeLabel(e.target.value)} 
                    />
                  </label>
                  <input
                    type="number"
                    className="w-full border rounded px-2.5 py-1 text-slate-800 font-mono font-medium"
                    value={otherCharge === 0 ? '' : otherCharge}
                    placeholder="0.00"
                    onChange={e => setOtherCharge(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-[9px] text-red-500 block font-bold">Fuel Advance Deduction (-$)</label>
                  <input
                    type="number"
                    className="w-full border border-red-200 rounded px-2.5 py-1 text-red-700 bg-red-50 font-mono font-bold"
                    value={fuelAdvanceDeducted === 0 ? '' : fuelAdvanceDeducted}
                    placeholder="0.00"
                    onChange={e => setFuelAdvanceDeducted(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Remittance Factoring Instructions editable */}
              <div className="pt-2 border-t border-slate-100">
                <label className="text-[9px] text-slate-400 block font-bold">Remittance &amp; Factoring Notice (Appears on Invoice Base)</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-1.5 text-xs text-slate-700 bg-amber-50/20"
                  value={factoringNote}
                  onChange={e => setFactoringNote(e.target.value)}
                  placeholder="Remittance payment details or notice of standard banking factoring structures."
                />
              </div>
            </div>

            {/* Print trigger button */}
            <div className="flex justify-end gap-2.5">
              <button
                onClick={handlePrint}
                className="h-10 px-5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer transition-all shadow-md shadow-amber-600/10"
              >
                <Printer className="h-4 w-4" />
                <span>Compile &amp; Print Freight Invoice</span>
              </button>
            </div>

          </div>
        )}

      </div>




      {/* ========================================================
       * RENDER WORKSPACE: DISPLAY SHEETS (DESIGNED FOR VIEW + PRINT)
       * ======================================================== */}
       
      {invoiceMode === 'DISPATCH_FEE' ? (
        
        // ----------------------------------------------------
        // RENDER: DISPATCH SERVICE FEE INVOICE (Timely Logistix -> Carrier)
        // ----------------------------------------------------
        <div id="print_dispatch_invoice" className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden p-8 md:p-10 max-w-4xl mx-auto print-shadow-none">
          
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6">
            {/* Left Logo / Branding */}
            <div>
              {invoiceLogoUrl ? (
                <img src={invoiceLogoUrl} alt="Logo" className="h-16 max-w-56 object-contain" referrerPolicy="no-referrer" />
              ) : companySettings.logoUrl ? (
                <img src={companySettings.logoUrl} alt="Logo" className="h-16 max-w-56 object-contain" referrerPolicy="no-referrer" />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-amber-500 rounded-xl flex items-center justify-center text-white font-black text-xl">
                    TL
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold tracking-tight text-amber-500 font-display uppercase">TIMELY LOGISTIX</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">TRUCK DISPATCHING</p>
                  </div>
                </div>
              )}
              
              <div className="text-xs text-slate-600 mt-4 leading-relaxed space-y-0.5">
                <div className="font-bold text-slate-900">{isManualCustomMode ? customBillerName : companySettings.name}</div>
                <div className="whitespace-pre-line">{isManualCustomMode ? customBillerAddress : companySettings.address}</div>
                <div>Phone: {isManualCustomMode ? customBillerPhone : companySettings.phone}</div>
                <div>Email: {isManualCustomMode ? customBillerEmail : companySettings.email}</div>
              </div>
            </div>

            {/* Right Invoice Title, Meta & Balance Due Banner */}
            <div className="sm:text-right space-y-2">
              <h1 className="text-3xl font-normal tracking-wide text-slate-800 font-sans">INVOICE</h1>
              <div className="text-sm font-semibold text-slate-500">#{dispatchInvoiceNum}</div>

              <div className="pt-2 text-xs text-slate-600 space-y-1">
                <div className="flex justify-between sm:justify-end gap-6"><span className="text-slate-400">Date:</span> <span className="font-semibold text-slate-800">{dispatchInvoiceDate}</span></div>
                <div className="flex justify-between sm:justify-end gap-6"><span className="text-slate-400">Due Date:</span> <span className="font-semibold text-slate-800">{dueDate}</span></div>
              </div>

              <div className="mt-3 bg-slate-100 rounded-lg px-6 py-2.5 flex justify-between sm:justify-end items-center gap-6 text-slate-900 border border-slate-200">
                <span className="font-bold text-sm text-slate-700">Balance Due:</span>
                <span className="font-extrabold text-xl font-mono">${(isManualCustomMode 
                  ? customLineItems.reduce((acc, item) => acc + (item.amount !== undefined ? item.amount : (item.quantity || 1) * (item.rate || 0)), 0)
                  : dispatchFeeTot
                ).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Send To & Bill To Section */}
          <div className="my-6 pt-4 border-t border-slate-200 space-y-2 text-xs leading-relaxed">
            {sendToContact && (
              <div className="font-bold text-slate-900 text-sm mb-1">
                Send to {sendToContact}
              </div>
            )}
            
            <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Bill To:</div>
            <div className="font-extrabold text-slate-900 text-sm uppercase">{isManualCustomMode ? customCarrierName : carrierNameForDispatch}</div>
            <div className="text-slate-600 whitespace-pre-line font-medium">{isManualCustomMode ? customCarrierAddress : (selectedCarrierObj?.address || '18 WHITNEY LN\nGRAND ISLAND, NY 14072')}</div>
            
            <div className="pt-2 flex items-center gap-2">
              <span className="font-bold text-slate-500">Payment Method:</span>
              <span className="font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">{paymentMethod === 'CUSTOM' ? customPaymentMethodText : paymentMethod}</span>
            </div>
          </div>

          {/* Statement Items Table */}
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-300 shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#333333] text-white text-[11px] font-semibold">
                  <th className="py-2.5 px-3 border border-slate-400/80">Date</th>
                  <th className="py-2.5 px-3 border border-slate-400/80">Load#</th>
                  <th className="py-2.5 px-3 border border-slate-400/80">Driver Name</th>
                  <th className="py-2.5 px-3 border border-slate-400/80">Broker Name</th>
                  <th className="py-2.5 px-3 border border-slate-400/80 text-right">Gross Amount ($)</th>
                  <th className="py-2.5 px-3 border border-slate-400/80 text-right">Amount ($)</th>
                </tr>
              </thead>
              <tbody className="bg-white text-slate-800">
                {isManualCustomMode ? (
                  customLineItems.map((item, idx) => {
                    const gross = item.loadAmount || 0;
                    const feePct = item.feePercent || (typeof selectedFeePercent === 'number' ? selectedFeePercent : 8);
                    const calcAmt = item.amount !== undefined ? item.amount : Math.round((gross * feePct) / 100);

                    return (
                      <tr key={item.id || idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 border border-slate-200 font-mono text-slate-700">{item.pickupDate || 'N/A'}</td>
                        <td className="py-2.5 px-3 border border-slate-200 font-bold text-slate-900 font-mono">{item.loadNum || 'N/A'}</td>
                        <td className="py-2.5 px-3 border border-slate-200 font-bold text-slate-800">{item.driverName || 'N/A'}</td>
                        <td className="py-2.5 px-3 border border-slate-200 font-medium text-slate-700">{item.broker || 'N/A'}</td>
                        <td className="py-2.5 px-3 border border-slate-200 text-right font-mono text-slate-800">${gross.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2.5 px-3 border border-slate-200 text-right font-mono font-extrabold text-slate-900">${calcAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })
                ) : (
                  matchedLoadsForDispatchFee.map((l, idx) => {
                    const driverObj = drivers.find(d => d.id === l.driverId);
                    const feeValue = computeDispatchFeeForLoad(l);

                    return (
                      <tr key={l.id || idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 border border-slate-200 font-mono text-slate-700">{l.pickupDate}</td>
                        <td className="py-2.5 px-3 border border-slate-200 font-bold text-slate-900 font-mono">{l.loadNum}</td>
                        <td className="py-2.5 px-3 border border-slate-200 font-bold text-slate-800">{driverObj?.name || 'N/A'}</td>
                        <td className="py-2.5 px-3 border border-slate-200 font-medium text-slate-700">{l.broker}</td>
                        <td className="py-2.5 px-3 border border-slate-200 text-right font-mono text-slate-800">${l.loadAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2.5 px-3 border border-slate-200 text-right font-mono font-extrabold text-slate-900">${feeValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })
                )}

                {((isManualCustomMode ? customLineItems.length : matchedLoadsForDispatchFee.length) === 0) && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 italic border border-slate-200">
                      No line items added to this invoice.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Total Footer */}
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
            <div className="text-xs text-slate-600">
              Total Gross Cargo Value: <span className="font-mono font-bold text-slate-900">${(isManualCustomMode
                ? customLineItems.reduce((acc, item) => acc + (item.loadAmount || 0), 0)
                : dispatchGrossBookingsTot
              ).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <span className="text-slate-600 font-bold">Total Invoice Fee Due:</span>
              <span className="font-mono font-extrabold text-slate-900 text-2xl">${(isManualCustomMode 
                ? customLineItems.reduce((acc, item) => acc + (item.amount !== undefined ? item.amount : Math.round(((item.loadAmount || 0) * (item.feePercent || 8)) / 100)), 0)
                : dispatchFeeTot
              ).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Actions & Verification Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap justify-between items-center gap-4 print:hidden">
            <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4" />
              <span>{isManualCustomMode ? customBillerName : companySettings.name} Authenticity Verified</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveInvoiceRecord}
                className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 text-xs"
              >
                <BookmarkCheck className="h-4 w-4" />
                <span>Save Invoice Record</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="cursor-pointer px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 text-xs"
              >
                <Printer className="h-4 w-4" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>
        </div>

      ) : (

        // ----------------------------------------------------
        // RENDER: CARRIER FREIGHT INVOICE (Carrier -> Broker / Factor)
        // ----------------------------------------------------
        <div id="print_carrier_invoice" className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden p-8 max-w-4xl mx-auto print-shadow-none">
          
          {/* Carrier Header / Letterhead */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-300 pb-8">
            <div>
              <div className="flex items-center gap-2">
                {invoiceLogoUrl ? (
                  <img src={invoiceLogoUrl} alt="Logo" className="h-11 max-w-44 object-contain rounded-lg" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-10 w-10 bg-amber-600 rounded-xl flex items-center justify-center text-white font-black font-display text-lg">
                    {(isManualCustomMode ? customCarrierName : selectedCarrierName).charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 font-display uppercase">
                    {isManualCustomMode ? customCarrierName : selectedCarrierName}
                  </h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Motor Carriage Cargo Carrier</p>
                </div>
              </div>
              
              <div className="text-xs text-slate-600 mt-5 leading-relaxed space-y-0.5">
                <div>Office: {isManualCustomMode ? customCarrierAddress : (carrierAddress || 'Commercial Carrier Blvd')}</div>
                <div>USDOT #: <strong className="text-slate-800 font-mono font-semibold">{isManualCustomMode ? customCarrierDot : carrierDot}</strong> &bull; MC #: <strong className="text-slate-800 font-mono font-semibold">{isManualCustomMode ? customCarrierMc : carrierMc}</strong></div>
                <div>Billing direct: {isManualCustomMode ? customCarrierEmail : carrierEmail}</div>
              </div>
            </div>

            <div className="sm:text-right">
              <h1 className="text-3xl font-extrabold uppercase tracking-widest text-slate-300 font-display">
                Invoice
              </h1>
              <div className="mt-5 text-xs space-y-1 font-mono text-slate-600">
                <div>Invoice Code: <strong className="text-slate-900 font-extrabold">{carrierInvoiceNum}</strong></div>
                <div>Invoice Date: {freightInvoiceDate}</div>
                <div>Carrier Contact Desk: {isManualCustomMode ? 'Carrier Dispatch Admin' : (selectedCarrierObj?.contactName || 'Dispatching Admin')}</div>
                <div>Terms: <strong className="text-amber-605 font-bold">{paymentTerms}</strong></div>
              </div>
            </div>
          </div>

          {/* Broker payer & Carrier details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 my-8 text-xs leading-relaxed">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To (Freight Broker)</h4>
              <div className="font-extrabold text-slate-900 text-sm uppercase">{isManualCustomMode ? customBrokerName : brokerCustomName}</div>
              <div className="text-slate-600 mt-1">{isManualCustomMode ? customBrokerAddress : (brokerAddress || 'Billing & Accounts Payable Address')}</div>
              {(isManualCustomMode ? customBrokerPhone : brokerPhone) && <div className="text-slate-500 font-mono">Phone: {isManualCustomMode ? customBrokerPhone : brokerPhone}</div>}
              {(isManualCustomMode ? customBrokerEmail : brokerEmail) && <div className="text-slate-550 font-mono">Mail: {isManualCustomMode ? customBrokerEmail : brokerEmail}</div>}
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
              <h4 className="font-bold text-slate-400 uppercase tracking-wider">Asset Dispatched Specifications</h4>
              
              <div className="space-y-1 text-slate-700">
                <div className="flex justify-between">
                  <span>Assigned Driver:</span>
                  <strong className="text-slate-800 font-bold">
                    {isManualCustomMode ? (customLineItems[0]?.driverName || 'N/A') : driverForFreight}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Truck / Equipment Num:</span>
                  <strong className="text-slate-800 font-mono">
                    Truck #{isManualCustomMode ? (customLineItems[0]?.truckNum || 'N/A') : truckForFreight}
                  </strong>
                </div>
                {(isManualCustomMode ? customLineItems[0] : currentSelectedLoadObj) && (
                  <>
                    <div className="flex justify-between">
                      <span>Rate Confirmation #:</span>
                      <strong className="text-slate-850 font-mono font-bold text-blue-600 bg-blue-50/50 px-1.5 py-0.5 rounded">
                        {isManualCustomMode ? (customLineItems[0]?.rateConNum || 'N/A') : currentSelectedLoadObj?.rateConNum}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Pickup Dates:</span>
                      <span className="font-mono">
                        {isManualCustomMode ? (customLineItems[0]?.pickupDate || 'N/A') : currentSelectedLoadObj?.pickupDate} &bull; {isManualCustomMode ? (customLineItems[0]?.deliveryDate || 'N/A') : currentSelectedLoadObj?.deliveryDate}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Shipped Item Table */}
          <div className="mt-8">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="border-b-2 border-slate-300 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                  <th className="pb-3 text-left">Disposed Cargo Description</th>
                  <th className="pb-3 text-left">Routing Addresses</th>
                  <th className="pb-3 text-right">Linehaul Rate</th>
                  <th className="pb-3 text-right">Accessorial Surcharges</th>
                  <th className="pb-3 text-right">Line Gross Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-slate-700">
                {isManualCustomMode ? (
                  customLineItems.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="py-4 font-semibold text-slate-900 block max-w-xs">
                        <div>Commercial Road Freight Carriage</div>
                        <div className="text-[10px] text-slate-400 mt-1 font-normal select-none font-mono">
                          Ref Load Code: {item.loadNum || 'N/A'} &bull; Rate Con: {item.rateConNum || 'N/A'}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="font-medium text-slate-800 truncate max-w-[240px]">{item.pickupLocation || 'N/A'}</div>
                        <div className="text-slate-400 flex items-center my-0.5">&darr;</div>
                        <div className="font-medium text-slate-800 truncate max-w-[240px]">{item.deliveryLocation || 'N/A'}</div>
                      </td>
                      <td className="py-4 text-right font-mono font-medium">
                        ${(item.loadAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 text-right">
                        {idx === 0 && accessorialTotal > 0 ? (
                          <div className="font-mono text-slate-800">
                            +${accessorialTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No accessorials</span>
                        )}
                      </td>
                      <td className="py-4 text-right font-mono font-bold text-slate-900">
                        ${((item.loadAmount || 0) + (idx === 0 ? accessorialTotal : 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                ) : currentSelectedLoadObj ? (
                  <tr>
                    <td className="py-4 font-semibold text-slate-900 block max-w-xs">
                      <div>Commercial Road Freight Carriage</div>
                      <div className="text-[10px] text-slate-400 mt-1 font-normal select-none">
                        Ref Load Code: {currentSelectedLoadObj.loadNum} &bull; Rate Con Ref: {currentSelectedLoadObj.rateConNum}
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="font-medium text-slate-800 truncate max-w-[240px]">{currentSelectedLoadObj.pickupLocation}</div>
                      <div className="text-slate-400 flex items-center my-0.5">&darr;</div>
                      <div className="font-medium text-slate-800 truncate max-w-[240px]">{currentSelectedLoadObj.deliveryLocation}</div>
                    </td>
                    <td className="py-4 text-right font-mono font-medium">
                      ${freightLoadRate.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 text-right">
                      {accessorialTotal > 0 ? (
                        <div className="font-mono text-slate-800">
                          +${accessorialTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No accessorials</span>
                      )}
                    </td>
                    <td className="py-4 text-right font-mono font-bold text-slate-900">
                      ${grossInvoiceTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400 italic bg-amber-50/10">
                      No matching freight load linked. Please select a load under the Dispatched Load selection box configurations above.
                    </td>
                  </tr>
                )}

                {/* Detailed Surcharge Line items list if added */}
                {accessorialTotal > 0 && (
                  <tr className="bg-slate-50/50">
                    <td colSpan={5} className="p-4 space-y-1.5 text-[11px] text-slate-600">
                      <div className="font-bold text-slate-400 text-[9px] uppercase tracking-wider mb-1">Accessorial Surcharge Details:</div>
                      {fuelSurcharge > 0 && <div className="flex justify-between max-w-sm"><span>• Fuel Surcharge Addition:</span> <strong className="font-mono">${fuelSurcharge.toFixed(2)}</strong></div>}
                      {detentionCharge > 0 && <div className="flex justify-between max-w-sm"><span>• Detention Waiting Time:</span> <strong className="font-mono">${detentionCharge.toFixed(2)}</strong></div>}
                      {layoverCharge > 0 && <div className="flex justify-between max-w-sm"><span>• Layover Scheduled Pay:</span> <strong className="font-mono">${layoverCharge.toFixed(2)}</strong></div>}
                      {lumperCharge > 0 && <div className="flex justify-between max-w-sm"><span>• Lumper Reimbursement (receipt):</span> <strong className="font-mono">${lumperCharge.toFixed(2)}</strong></div>}
                      {otherCharge > 0 && <div className="flex justify-between max-w-sm"><span>• {otherChargeLabel}:</span> <strong className="font-mono">${otherCharge.toFixed(2)}</strong></div>}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Remittance Factoring / Financing Notice block */}
          {factoringNote && (
            <div className="bg-amber-100/30 border border-amber-250 p-4 rounded-xl text-[11px] text-slate-800 mt-8 leading-relaxed font-semibold">
              <div className="text-[9px] font-bold text-amber-800 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <BookmarkCheck className="h-4 w-4" />
                <span>Notice of Cargo Invoice Assignment</span>
              </div>
              {factoringNote}
            </div>
          )}

          {/* Pricing Totals columns */}
          <div className="border-t-2 border-slate-200 pt-6 mt-8 flex flex-col md:flex-row justify-between gap-6 leading-relaxed">
            <div className="max-w-md text-slate-400 text-[11px] self-end pb-2">
              <p className="font-bold text-slate-650 mb-0.5">Claims or Rate adjustments:</p>
              <p>For any shortages, freight overages, or detention claims, please notify dispatch desk directly. Rate confirmations must be updated before final factoring settlement is accepted.</p>
            </div>

            <div className="w-full md:max-w-xs text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Linehaul Gross Booking:</span>
                <strong className="font-mono">
                  ${(isManualCustomMode 
                    ? customLineItems.reduce((acc, l) => acc + (l.loadAmount || 0), 0)
                    : freightLoadRate
                  ).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </strong>
              </div>

              {accessorialTotal > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Accessorial Charges sum:</span>
                  <strong className="font-mono text-emerald-800">+${accessorialTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                </div>
              )}

              {fuelAdvanceDeducted > 0 && (
                <div className="flex justify-between text-red-650 bg-red-50 p-2.5 rounded-lg border border-red-150">
                  <span>Deduction (Fuel Advance):</span>
                  <strong className="font-mono">-${fuelAdvanceDeducted.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                </div>
              )}

              <div className="flex justify-between text-base pt-3 text-slate-950 border-t border-slate-150">
                <span className="font-extrabold text-slate-800">Total Invoice Base:</span>
                <strong className="font-mono text-xl font-black text-amber-700">
                  ${((isManualCustomMode 
                    ? customLineItems.reduce((acc, l) => acc + (l.loadAmount || 0), 0)
                    : freightLoadRate) + accessorialTotal - fuelAdvanceDeducted
                  ).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="print:hidden mt-6 pt-6 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={handleSaveInvoiceRecord}
              className="cursor-pointer px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 text-xs"
            >
              <BookmarkCheck className="h-4 w-4" />
              <span>Save Invoice Record</span>
            </button>
          </div>

        </div>
      )}
      </div>
      )}

    </div>
  );
}
