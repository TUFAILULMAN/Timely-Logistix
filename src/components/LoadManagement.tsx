/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Load, Driver, Dispatcher, User, DriverAdvance, BrokerContact, CarrierOrOwner } from '../types';
import { AuditInfoBadge } from './AuditInfoBadge';
import {
  PlusCircle,
  Search,
  Filter,
  FileCheck,
  CheckCircle,
  FileText,
  Trash2,
  Edit,
  DollarSign,
  AlertTriangle,
  UploadCloud,
  XCircle,
  ListFilter,
  Eye,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Printer,
  Sliders,
  Check,
  Folder,
  ArrowUpDown,
  Coins,
  Building,
  Building2,
  Briefcase,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  X,
  FileUp,
  ChevronDown,
  ChevronRight,
  Calendar,
  Maximize2,
  Minimize2,
  Lock
} from 'lucide-react';

interface LoadManagementProps {
  currentUser: User;
  loads: Load[];
  drivers: Driver[];
  dispatchers: Dispatcher[];
  carriers?: CarrierOrOwner[];
  factoringRatePercent: number;
  driverAdvances?: DriverAdvance[];
  brokers?: BrokerContact[];
  onAutoSaveBroker?: (broker: { companyName: string; contactPerson?: string; phone?: string; email?: string }) => void;
  onAddCarrier?: (carrier: Omit<CarrierOrOwner, 'id'>) => Promise<void> | void;
  onAdd: (load: Omit<Load, 'id'>) => void;
  onEdit: (id: string, updated: Partial<Load>) => void;
  onDelete: (id: string) => void;
  onAddDriver: (driver: Omit<Driver, 'id'> & { id?: string }) => Promise<void> | void;
  onAddDispatcher: (disp: Omit<Dispatcher, 'id' | 'assignedDriverIds'> & { id?: string }) => Promise<void> | void;
  onAddLoadsBulk?: (loads: (Omit<Load, 'id'> & { id?: string })[]) => Promise<void> | void;
  onAddAdvance?: (adv: Omit<DriverAdvance, 'id'>) => Promise<void> | void;
  onEditAdvance?: (id: string, updated: Partial<DriverAdvance>) => Promise<void> | void;
  onDeleteAdvance?: (id: string) => Promise<void> | void;
}

interface ParsedLoadDraft {
  id: string;
  loadNum: string;
  rateConNum: string;
  pickupDate: string;
  deliveryDate: string;
  pickupLocation: string;
  deliveryLocation: string;
  broker: string;
  loadAmount: number;
  feePercent: number;
  dispatcherId: string;
  driverId: string;
  factoringStatus: 'Factored' | 'Non-Factored';
  paymentStatus: 'Paid' | 'Unpaid';
  status: 'Pending' | 'In Transit' | 'Delivered';
}

export default function LoadManagement({
  currentUser,
  loads,
  drivers,
  dispatchers,
  carriers = [],
  factoringRatePercent,
  driverAdvances = [],
  brokers = [],
  onAutoSaveBroker,
  onAddCarrier,
  onAdd,
  onEdit,
  onDelete,
  onAddDriver,
  onAddDispatcher,
  onAddLoadsBulk,
  onAddAdvance,
  onEditAdvance,
  onDeleteAdvance
}: LoadManagementProps) {
  const isAdmin = currentUser.role === 'ADMIN';
  const isManager = currentUser.role === 'MANAGER';
  const myDispatcher = (!isAdmin && !isManager) ? dispatchers.find(d => d.username === currentUser.username || d.id === currentUser.dispatcherId) : null;
  const myDispatcherId = myDispatcher?.id || currentUser.dispatcherId || '';

  // Form toggles
  const [isAdding, setIsAdding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importRawText, setImportRawText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [parsedLoads, setParsedLoads] = useState<ParsedLoadDraft[]>([]);
  const [isSavingImport, setIsSavingImport] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Cash Advance & Proof Modal States
  const [showAdvancesModal, setShowAdvancesModal] = useState(false);
  const [selectedAdvanceProof, setSelectedAdvanceProof] = useState<DriverAdvance | null>(null);
  const [isAddingAdvanceForm, setIsAddingAdvanceForm] = useState(false);

  // Advance Form Inputs
  const [advDriverId, setAdvDriverId] = useState('');
  const [advSenderName, setAdvSenderName] = useState('E & G Express');
  const [advSenderType, setAdvSenderType] = useState<'OWNER' | 'BROKER' | 'COMPANY'>('OWNER');
  const [advReceiverName, setAdvReceiverName] = useState('');
  const [advLoadId, setAdvLoadId] = useState('');
  const [advLoadNum, setAdvLoadNum] = useState('');
  const [advBrokerName, setAdvBrokerName] = useState('');
  const [advAmount, setAdvAmount] = useState<number>(500);
  const [advType, setAdvType] = useState<'CASH' | 'FUEL' | 'WIRE' | 'ZELLE' | 'CHECK' | 'EFS' | 'COMCHECK'>('ZELLE');
  const [advDate, setAdvDate] = useState(new Date().toISOString().split('T')[0]);
  const [advNotes, setAdvNotes] = useState('');
  const [advProofFileName, setAdvProofFileName] = useState('');
  const [advProofFileType, setAdvProofFileType] = useState<'image' | 'pdf' | 'other'>('pdf');
  const [advProofBase64, setAdvProofBase64] = useState('');
  const [advFilterTerm, setAdvFilterTerm] = useState('');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'Paid' | 'Unpaid'>('ALL');
  const [carrierFilter, setCarrierFilter] = useState<string>('ALL');
  const [factoringFilter, setFactoringFilter] = useState<'ALL' | 'Factored' | 'Non-Factored'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Pending' | 'In Transit' | 'Delivered'>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'GROSS_HIGH' | 'STATUS'>('NEWEST');
  const [expandedMonths, setExpandedMonths] = useState<{ [monthKey: string]: boolean }>({});

  // Input States for New Load
  const [loadNum, setLoadNum] = useState('');
  const [rateConNum, setRateConNum] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedDispatcherId, setSelectedDispatcherId] = useState('');
  const [carrierId, setCarrierId] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [customCarrierMode, setCustomCarrierMode] = useState(false);
  const [broker, setBroker] = useState('');
  const [brokerContactPerson, setBrokerContactPerson] = useState('');
  const [brokerPhone, setBrokerPhone] = useState('');
  const [brokerEmail, setBrokerEmail] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [loadAmount, setLoadAmount] = useState<number>(0);
  const [feePercent, setFeePercent] = useState<number>(8);
  const [advanceFuel, setAdvanceFuel] = useState<number>(0);
  const [cashAdvance, setCashAdvance] = useState<number>(0);
  const [repairDeduction, setRepairDeduction] = useState<number>(0);
  const [tollDeduction, setTollDeduction] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [factoringStatus, setFactoringStatus] = useState<'Factored' | 'Non-Factored'>('Factored');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Unpaid'>('Unpaid');
  const [status, setStatus] = useState<'Pending' | 'In Transit' | 'Delivered'>('Pending');
  const [podUploaded, setPodUploaded] = useState(false);
  const [podFileName, setPodFileName] = useState('');
  const [podBase64, setPodBase64] = useState('');
  const [rateConUploaded, setRateConUploaded] = useState(false);
  const [rateConFileName, setRateConFileName] = useState('');
  const [rateConBase64, setRateConBase64] = useState('');

  // Upload Progress and Error feedback state
  const [podUploading, setPodUploading] = useState(false);
  const [podProgress, setPodProgress] = useState(0);
  const [podError, setPodError] = useState<string | null>(null);

  const [rateConUploading, setRateConUploading] = useState(false);
  const [rateConProgress, setRateConProgress] = useState(0);
  const [rateConError, setRateConError] = useState<string | null>(null);

  // Simulation toggles for live demonstration & robust testing
  const [simulateNetworkError, setSimulateNetworkError] = useState(false);

  // Multi-select state
  const [selectedLoadIds, setSelectedLoadIds] = useState<string[]>([]);

  // Preview dialog state
  const [previewFile, setPreviewFile] = useState<{
    base64: string;
    name: string;
    type: 'pod' | 'ratecon';
    loadId?: string;
  } | null>(null);

  const [activeVaultLoad, setActiveVaultLoad] = useState<Load | null>(null);

  const [previewZoom, setPreviewZoom] = useState(1.0);
  const [previewRotation, setPreviewRotation] = useState(0);
  const [previewFilter, setPreviewFilter] = useState<'standard' | 'high-contrast' | 'grayscale' | 'invert'>('standard');
  const [localNotes, setLocalNotes] = useState('');
  const [isNotesSaving, setIsNotesSaving] = useState(false);

  // Sync local notes state with active load
  const activeLoadForPreview = previewFile?.loadId ? loads.find(l => l.id === previewFile.loadId) : null;
  React.useEffect(() => {
    if (activeLoadForPreview) {
      setLocalNotes(activeLoadForPreview.notes || '');
    } else {
      setLocalNotes('');
    }
  }, [activeLoadForPreview?.id, previewFile]);

  // Escape key listener to close preview modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewFile(null);
      }
    };
    if (previewFile) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [previewFile]);

  // Handle printing documents
  const handlePrintDocument = (fileData: string, fileName: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Document - \${fileName}</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #fff; font-family: sans-serif; }
            img { max-width: 100%; max-height: 100%; object-fit: contain; }
            iframe { border: none; width: 100%; height: 100%; }
          </style>
        </head>
        <body>
          \${fileData.startsWith('data:application/pdf') 
            ? \`<iframe src="\${fileData}"></iframe>\` 
            : \`<img src="\${fileData}" />\`
          }
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Edit States for existing loads
  const [editLoadNum, setEditLoadNum] = useState('');
  const [editRateConNum, setEditRateConNum] = useState('');
  const [editDriverId, setEditDriverId] = useState('');
  const [editDispatcherId, setEditDispatcherId] = useState('');
  const [editCarrierId, setEditCarrierId] = useState('');
  const [editCarrierName, setEditCarrierName] = useState('');
  const [editCustomCarrierMode, setEditCustomCarrierMode] = useState(false);
  const [editBroker, setEditBroker] = useState('');
  const [editBrokerContactPerson, setEditBrokerContactPerson] = useState('');
  const [editBrokerPhone, setEditBrokerPhone] = useState('');
  const [editBrokerEmail, setEditBrokerEmail] = useState('');
  const [editPickupLocation, setEditPickupLocation] = useState('');
  const [editDeliveryLocation, setEditDeliveryLocation] = useState('');
  const [editPickupDate, setEditPickupDate] = useState('');
  const [editDeliveryDate, setEditDeliveryDate] = useState('');
  const [editLoadAmount, setEditLoadAmount] = useState<number>(0);
  const [editFeePercent, setEditFeePercent] = useState<number>(8);
  const [editAdvanceFuel, setEditAdvanceFuel] = useState<number>(0);
  const [editCashAdvance, setEditCashAdvance] = useState<number>(0);
  const [editRepairDeduction, setEditRepairDeduction] = useState<number>(0);
  const [editTollDeduction, setEditTollDeduction] = useState<number>(0);
  const [editNotes, setEditNotes] = useState('');
  const [editFactoringStatus, setEditFactoringStatus] = useState<'Factored' | 'Non-Factored'>('Factored');
  const [editPaymentStatus, setEditPaymentStatus] = useState<'Paid' | 'Unpaid'>('Unpaid');
  const [editStatus, setEditStatus] = useState<'Pending' | 'In Transit' | 'Delivered' | 'UNLOADED' | 'PAID'>('Pending');
  const [editPodUploaded, setEditPodUploaded] = useState(false);
  const [editPodFileName, setEditPodFileName] = useState('');
  const [editPodBase64, setEditPodBase64] = useState('');
  const [editRateConUploaded, setEditRateConUploaded] = useState(false);
  const [editRateConFileName, setEditRateConFileName] = useState('');
  const [editRateConBase64, setEditRateConBase64] = useState('');

  // Edit Form Upload Progress and Error states
  const [editPodUploading, setEditPodUploading] = useState(false);
  const [editPodProgress, setEditPodProgress] = useState(0);
  const [editPodError, setEditPodError] = useState<string | null>(null);

  const [editRateConUploading, setEditRateConUploading] = useState(false);
  const [editRateConProgress, setEditRateConProgress] = useState(0);
  const [editRateConError, setEditRateConError] = useState<string | null>(null);

  // Determine active driver list
  const activeDrivers = drivers.filter(d => d.status === 'ACTIVE');
  const allowedDrivers = (isAdmin || isManager)
    ? activeDrivers
    : activeDrivers.filter(d => d.assignedDispatcherId === myDispatcherId);

  // Filter loads based on criteria & search
  const visibleLoads = loads.filter(l => {
    // Respect explicit onlyAssignedLoads permission or role clearance limit
    const enforceOnlyAssignedLoads = currentUser.permissions?.onlyAssignedLoads ?? (!isAdmin && !isManager);
    
    if (enforceOnlyAssignedLoads) {
      const isMyDispatcher = Boolean(myDispatcherId && (l.dispatcherId === myDispatcherId || l.dispatcherId === currentUser.id));
      const assignedDriver = drivers.find(d => d.id === l.driverId);
      const isMyDriver = Boolean(myDispatcherId && assignedDriver && assignedDriver.assignedDispatcherId === myDispatcherId);
      if (!isMyDispatcher && !isMyDriver) {
        return false;
      }
    }

    // Filters
    if (paymentFilter !== 'ALL' && l.paymentStatus !== paymentFilter) return false;
    if (statusFilter !== 'ALL' && (l.status || 'Pending') !== statusFilter) return false;

    if (carrierFilter !== 'ALL') {
      const driverObj = drivers.find(d => d.id === l.driverId);
      const effectiveCarrierId = l.carrierId || driverObj?.carrierId;
      const effectiveCarrierName = l.carrierName || driverObj?.workingUnderName;

      if (carrierFilter === 'INDEPENDENT') {
        if (effectiveCarrierId || (effectiveCarrierName && effectiveCarrierName.toLowerCase() !== 'independent' && effectiveCarrierName.trim() !== '')) {
          return false;
        }
      } else {
        const matchesCarrier = effectiveCarrierId === carrierFilter || (effectiveCarrierName && effectiveCarrierName.toLowerCase() === carrierFilter.toLowerCase());
        if (!matchesCarrier) return false;
      }
    }

    // Search query matched
    const carrierObj = carriers.find(c => c.id === l.carrierId);
    const carrierNameStr = l.carrierName || carrierObj?.name || '';
    const driverObj = drivers.find(d => d.id === l.driverId);
    const driverNameStr = driverObj?.name || '';

    const matchesSearch =
      l.loadNum.includes(searchTerm) ||
      l.rateConNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.broker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.pickupLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.deliveryLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      carrierNameStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driverNameStr.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Sort loads (Default: NEWEST to OLDEST / Aging Sort)
  const sortedVisibleLoads = [...visibleLoads].sort((a, b) => {
    if (sortBy === 'NEWEST') {
      const pDateA = a.pickupDate || '';
      const pDateB = b.pickupDate || '';
      if (pDateA !== pDateB) return pDateB.localeCompare(pDateA);
      return b.id.localeCompare(a.id);
    } else if (sortBy === 'OLDEST') {
      const pDateA = a.pickupDate || '';
      const pDateB = b.pickupDate || '';
      if (pDateA !== pDateB) return pDateA.localeCompare(pDateB);
      return a.id.localeCompare(b.id);
    } else if (sortBy === 'GROSS_HIGH') {
      return (b.loadAmount || 0) - (a.loadAmount || 0);
    } else if (sortBy === 'STATUS') {
      return (a.status || 'Pending').localeCompare(b.status || 'Pending');
    }
    return 0;
  });

  const isAllVisibleSelected = visibleLoads.length > 0 && visibleLoads.every(l => selectedLoadIds.includes(l.id));

  const handleSelectAllToggle = () => {
    if (isAllVisibleSelected) {
      // Unselect only the visible ones
      const visibleIds = visibleLoads.map(l => l.id);
      setSelectedLoadIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      // Select all visible ones
      const visibleIds = visibleLoads.map(l => l.id);
      setSelectedLoadIds(prev => {
        const union = new Set([...prev, ...visibleIds]);
        return Array.from(union);
      });
    }
  };

  const handleSelectRowToggle = (id: string) => {
    setSelectedLoadIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleFileChange = (
    file: File,
    type: 'pod' | 'ratecon',
    isEdit: boolean = false
  ) => {
    // 1. Reset progress and error states
    if (isEdit) {
      if (type === 'pod') {
        setEditPodError(null);
        setEditPodUploading(true);
        setEditPodProgress(0);
      } else {
        setEditRateConError(null);
        setEditRateConUploading(true);
        setEditRateConProgress(0);
      }
    } else {
      if (type === 'pod') {
        setPodError(null);
        setPodUploading(true);
        setPodProgress(0);
      } else {
        setRateConError(null);
        setRateConUploading(true);
        setRateConProgress(0);
      }
    }

    // 2. Comprehensive Type Validation (PDF or Image)
    const allowedTypes = [
      'application/pdf', 
      'image/jpeg', 
      'image/png', 
      'image/webp', 
      'image/gif', 
      'image/svg+xml'
    ];
    if (!allowedTypes.includes(file.type)) {
      const typeError = "Invalid file type. Only PDF and standard Image files (JPEG, PNG, WEBP, GIF) are supported.";
      if (isEdit) {
        if (type === 'pod') {
          setEditPodError(typeError);
          setEditPodUploading(false);
        } else {
          setEditRateConError(typeError);
          setEditRateConUploading(false);
        }
      } else {
        if (type === 'pod') {
          setPodError(typeError);
          setPodUploading(false);
        } else {
          setRateConError(typeError);
          setRateConUploading(false);
        }
      }
      return;
    }

    // 3. Strict Size Validation (under 800 KB for sync performance)
    if (file.size > 800 * 1024) {
      const sizeError = `File size is too large (${(file.size / 1024).toFixed(1)} KB). Maximum allowed limit is 800 KB to guarantee high Firestore synchronicity.`;
      if (isEdit) {
        if (type === 'pod') {
          setEditPodError(sizeError);
          setEditPodUploading(false);
        } else {
          setEditRateConError(sizeError);
          setEditRateConUploading(false);
        }
      } else {
        if (type === 'pod') {
          setPodError(sizeError);
          setPodUploading(false);
        } else {
          setRateConError(sizeError);
          setRateConUploading(false);
        }
      }
      return;
    }

    // 4. Read file and simulate network stream progress
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      
      let currentProgress = 0;
      const totalSteps = 10;
      const stepDuration = 120; // 120ms * 10 steps = ~1.2s upload experience

      const progressInterval = setInterval(() => {
        // If simulation of network error is active and we are at half progress, interrupt and trigger failure
        if (simulateNetworkError && currentProgress >= 50) {
          clearInterval(progressInterval);
          const networkError = "Network connection interrupted: Cloud storage transfer failed. Please check your connection and try again.";
          if (isEdit) {
            if (type === 'pod') {
              setEditPodError(networkError);
              setEditPodUploading(false);
            } else {
              setEditRateConError(networkError);
              setEditRateConUploading(false);
            }
          } else {
            if (type === 'pod') {
              setPodError(networkError);
              setPodUploading(false);
            } else {
              setRateConError(networkError);
              setRateConUploading(false);
            }
          }
          return;
        }

        currentProgress += 100 / totalSteps;
        
        if (isEdit) {
          if (type === 'pod') {
            setEditPodProgress(Math.min(currentProgress, 100));
          } else {
            setEditRateConProgress(Math.min(currentProgress, 100));
          }
        } else {
          if (type === 'pod') {
            setPodProgress(Math.min(currentProgress, 100));
          } else {
            setRateConProgress(Math.min(currentProgress, 100));
          }
        }

        if (currentProgress >= 100) {
          clearInterval(progressInterval);
          
          if (isEdit) {
            if (type === 'pod') {
              setEditPodUploaded(true);
              setEditPodFileName(file.name);
              setEditPodBase64(base64Data);
              setEditPodUploading(false);
            } else {
              setEditRateConUploaded(true);
              setEditRateConFileName(file.name);
              setEditRateConBase64(base64Data);
              setEditRateConUploading(false);
            }
          } else {
            if (type === 'pod') {
              setPodUploaded(true);
              setPodFileName(file.name);
              setPodBase64(base64Data);
              setPodUploading(false);
            } else {
              setRateConUploaded(true);
              setRateConFileName(file.name);
              setRateConBase64(base64Data);
              setRateConUploading(false);
            }
          }
        }
      }, stepDuration);
    };

    reader.onerror = () => {
      const readError = "Local file parsing failed. The file may be corrupt or inaccessible.";
      if (isEdit) {
        if (type === 'pod') {
          setEditPodError(readError);
          setEditPodUploading(false);
        } else {
          setEditRateConError(readError);
          setEditRateConUploading(false);
        }
      } else {
        if (type === 'pod') {
          setPodError(readError);
          setPodUploading(false);
        } else {
          setRateConError(readError);
          setRateConUploading(false);
        }
      }
    };

    reader.readAsDataURL(file);
  };

  const parseCSVorTSV = (text: string) => {
    try {
      setImportError(null);
      if (!text.trim()) {
        setImportError("Please paste some data or select a valid CSV file.");
        return;
      }

      const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
      if (lines.length === 0) {
        setImportError("No readable lines found in the input data.");
        return;
      }

      // Check if there are tabs (common in spreadsheet copies)
      const hasTabs = text.includes('\t');
      const sep = hasTabs ? '\t' : ',';

      const parseLineFields = (line: string) => {
        if (sep === '\t') {
          return line.split('\t').map(f => f.trim().replace(/^["']|["']$/g, ''));
        }
        
        // Basic CSV parsing with double-quotes handling
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
        setImportError("No parseable rows found.");
        return;
      }

      // Detect header row if it exists
      const firstRow = parsedRows[0];
      let hasHeader = false;
      let loadColIdx = -1;
      let amountColIdx = -1;
      let dateColIdx = -1;
      let dispatcherColIdx = -1;
      let driverColIdx = -1;
      let brokerColIdx = -1;

      firstRow.forEach((col, idx) => {
        const val = col.toLowerCase().replace(/[\s#_]/g, '');
        if (val.includes('load') || val.includes('booking') || val.includes('run')) {
          loadColIdx = idx;
          hasHeader = true;
        } else if (val.includes('amount') || val.includes('rate') || val.includes('gross') || val.includes('price')) {
          amountColIdx = idx;
          hasHeader = true;
        } else if (val.includes('date') || val.includes('pickup') || val.includes('column1') || val.includes('time')) {
          dateColIdx = idx;
          hasHeader = true;
        } else if (val.includes('dispatcher') || val.includes('disp') || val.includes('bookedby')) {
          dispatcherColIdx = idx;
          hasHeader = true;
        } else if (val.includes('driver') || val.includes('trucker') || val.includes('carrier') || val.includes('drivername')) {
          driverColIdx = idx;
          hasHeader = true;
        } else if (val.includes('broker') || val.includes('customer') || val.includes('shipper')) {
          brokerColIdx = idx;
          hasHeader = true;
        }
      });

      const dataRows = hasHeader ? parsedRows.slice(1) : parsedRows;
      if (dataRows.length === 0) {
        setImportError("No data records found below the header row.");
        return;
      }

      // Column heuristics if not detected via header keywords
      if (!hasHeader) {
        const sampleRow = dataRows[0];
        sampleRow.forEach((val, idx) => {
          const clean = val.trim();
          if (clean.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/) || clean.match(/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/)) {
            if (dateColIdx === -1) dateColIdx = idx;
          } else if (clean.startsWith('$') || (clean.replace(/[\$,]/g, '').match(/^\d+(\.\d+)?$/) && parseFloat(clean.replace(/[\$,]/g, '')) > 200)) {
            if (amountColIdx === -1) amountColIdx = idx;
          } else {
            const cleanLower = clean.toLowerCase();
            const hasDriver = drivers.some(d => d.name.toLowerCase().includes(cleanLower) || cleanLower.includes(d.name.toLowerCase()));
            if (hasDriver && driverColIdx === -1) {
              driverColIdx = idx;
              return;
            }
            const hasDisp = dispatchers.some(dis => dis.name.toLowerCase().includes(cleanLower) || cleanLower.includes(dis.name.toLowerCase()));
            if (hasDisp && dispatcherColIdx === -1) {
              dispatcherColIdx = idx;
              return;
            }
          }
        });

        // Match leftover columns for broker and load number
        sampleRow.forEach((val, idx) => {
          if (idx === dateColIdx || idx === amountColIdx || idx === driverColIdx || idx === dispatcherColIdx) return;
          const clean = val.trim();
          if (clean.match(/^[a-zA-Z0-9\-]+$/) && clean.length >= 4 && clean.length <= 15 && loadColIdx === -1) {
            loadColIdx = idx;
          } else if (brokerColIdx === -1 && clean.length > 2) {
            brokerColIdx = idx;
          }
        });
      }

      // Ultimate Fallbacks
      if (loadColIdx === -1) loadColIdx = Math.min(1, firstRow.length - 1);
      if (amountColIdx === -1) amountColIdx = Math.min(2, firstRow.length - 1);
      if (dateColIdx === -1) dateColIdx = 0;
      if (driverColIdx === -1) driverColIdx = Math.min(7, firstRow.length - 1);
      if (dispatcherColIdx === -1) dispatcherColIdx = Math.min(5, firstRow.length - 1);
      if (brokerColIdx === -1) brokerColIdx = Math.min(8, firstRow.length - 1);

      const drafts: ParsedLoadDraft[] = [];

      dataRows.forEach((row, rowIdx) => {
        if (row.length < Math.max(loadColIdx, amountColIdx, dateColIdx) + 1) return;

        const rawLoadNum = row[loadColIdx] || `L-${Date.now()}-${rowIdx}`;
        const rawAmountStr = row[amountColIdx] || '0';
        const rawDateStr = row[dateColIdx] || '2026-05-29';
        const rawDriverName = row[driverColIdx] || '';
        const rawDispatcherName = row[dispatcherColIdx] || '';
        const rawBroker = row[brokerColIdx] || 'Broker LLC';

        const loadAmountVal = parseFloat(rawAmountStr.replace(/[\$,\s]/g, '')) || 0;

        // Date Parser
        let formattedDate = '2026-05-29';
        if (rawDateStr) {
          try {
            const dateObj = new Date(rawDateStr);
            if (!isNaN(dateObj.getTime())) {
              formattedDate = dateObj.toISOString().split('T')[0];
            } else {
              const parts = rawDateStr.split(/[\/\-]/);
              if (parts.length === 3) {
                let y = parseInt(parts[2], 10);
                if (y < 100) y += 2000;
                let m = parseInt(parts[0], 10);
                let d = parseInt(parts[1], 10);
                if (m > 12 && m <= 31 && d <= 12) {
                  const tmp = m; m = d; d = tmp;
                }
                const mm = m < 10 ? `0${m}` : `${m}`;
                const dd = d < 10 ? `0${d}` : `${d}`;
                formattedDate = `${y}-${mm}-${dd}`;
              }
            }
          } catch (e) {}
        }

        // Match driver
        let matchedDriverId = '';
        if (rawDriverName) {
          const lowerName = rawDriverName.toLowerCase().replace(/[\s\.]/g, '');
          const match = drivers.find(d => {
            const dName = d.name.toLowerCase().replace(/[\s\.]/g, '');
            return dName.includes(lowerName) || lowerName.includes(dName);
          });
          if (match) {
            matchedDriverId = match.id;
          } else {
            matchedDriverId = 'create_driver_' + rawDriverName;
          }
        }

        // Match dispatcher
        let matchedDispatcherId = '';
        if (rawDispatcherName) {
          const lowerDisp = rawDispatcherName.toLowerCase().replace(/[\s\.]/g, '');
          const match = dispatchers.find(dis => {
            const disName = dis.name.toLowerCase().replace(/[\s\.]/g, '');
            return disName.includes(lowerDisp) || lowerDisp.includes(disName);
          });
          if (match) {
            matchedDispatcherId = match.id;
          } else {
            matchedDispatcherId = 'create_dispatcher_' + rawDispatcherName;
          }
        }

        if (!matchedDispatcherId) {
          matchedDispatcherId = myDispatcherId || dispatchers[0]?.id || '';
        }

        let feePct = 8;
        if (matchedDriverId) {
          const dr = drivers.find(d => d.id === matchedDriverId);
          if (dr) {
            feePct = dr.defaultPayoutPercent;
          }
        }

        drafts.push({
          id: `draft_${Date.now()}_${rowIdx}_${Math.random().toString(36).substr(2, 4)}`,
          loadNum: rawLoadNum,
          rateConNum: `RC-${rawLoadNum}`,
          pickupDate: formattedDate,
          deliveryDate: formattedDate,
          pickupLocation: 'Chicago, IL',
          deliveryLocation: 'Atlanta, GA',
          broker: rawBroker,
          loadAmount: loadAmountVal,
          feePercent: feePct,
          dispatcherId: matchedDispatcherId,
          driverId: matchedDriverId,
          factoringStatus: 'Factored',
          paymentStatus: 'Paid',
          status: 'Delivered'
        });
      });

      if (drafts.length === 0) {
        setImportError("Could not extract any records. Please make sure columns are correct.");
      } else {
        setParsedLoads(drafts);
      }
    } catch (err: any) {
      setImportError(`Parsing error: ${err.message || 'Please check input structure.'}`);
    }
  };

  const handleImportFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSVorTSV(text);
    };
    reader.onerror = () => {
      setImportError("Failed to read selected file.");
    };
    reader.readAsText(file);
  };

  const handleSaveBulkImport = async () => {
    if (parsedLoads.length === 0) return;
    
    setIsSavingImport(true);
    setImportError(null);
    try {
      const createdDriversCache: { [name: string]: string } = {};
      const createdDispatchersCache: { [name: string]: string } = {};
      
      // Process auto-creations first and collect final IDs
      const finalLoads = [...parsedLoads];

      for (let i = 0; i < finalLoads.length; i++) {
        const draft = finalLoads[i];

        // Auto-create dispatcher if prefix exists
        if (draft.dispatcherId && draft.dispatcherId.startsWith('create_dispatcher_')) {
          const rawName = draft.dispatcherId.replace('create_dispatcher_', '').trim();
          if (!createdDispatchersCache[rawName]) {
            const newDispId = `disp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
            await onAddDispatcher({
              id: newDispId,
              name: rawName,
              username: `${rawName.toLowerCase().replace(/\s+/g, '')}@company.com`,
              password: '123',
              phone: '(555) 555-5555',
              commissionPercent: 8,
              notes: 'Auto-created from spreadsheet import.'
            });
            createdDispatchersCache[rawName] = newDispId;
          }
          draft.dispatcherId = createdDispatchersCache[rawName];
        }

        // Auto-create driver if prefix exists
        if (draft.driverId && draft.driverId.startsWith('create_driver_')) {
          const rawName = draft.driverId.replace('create_driver_', '').trim();
          if (!createdDriversCache[rawName]) {
            const newDriverId = `drv_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
            const dispId = draft.dispatcherId || '';
            await onAddDriver({
              id: newDriverId,
              name: rawName,
              phone: '(555) 555-5555',
              truckNum: 'TBD',
              truckType: 'Dry Van',
              defaultPayoutPercent: 8,
              status: 'ACTIVE',
              assignedDispatcherId: dispId,
              driverType: 'OWNER_OPERATOR',
              workingUnderName: '',
              notes: 'Auto-created from spreadsheet import.'
            });
            createdDriversCache[rawName] = newDriverId;
          }
          draft.driverId = createdDriversCache[rawName];
        }
      }
      
      // Save each parsed load to global state
      if (onAddLoadsBulk) {
        const loadsPayload = finalLoads.map(draft => ({
          loadNum: draft.loadNum || `L-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          rateConNum: draft.rateConNum || `RC-${draft.loadNum || Date.now()}`,
          dispatcherId: draft.dispatcherId || '',
          driverId: draft.driverId || '',
          broker: draft.broker || 'Unknown Broker',
          pickupLocation: draft.pickupLocation || 'Chicago, IL',
          deliveryLocation: draft.deliveryLocation || 'Atlanta, GA',
          pickupDate: draft.pickupDate || '2026-05-29',
          deliveryDate: draft.deliveryDate || '2026-05-29',
          loadAmount: Number(draft.loadAmount) || 0,
          feePercent: Number(draft.feePercent) || 8,
          advanceFuel: 0,
          cashAdvance: 0,
          repairDeduction: 0,
          tollDeduction: 0,
          notes: `Imported from spreadsheet`,
          factoringStatus: draft.factoringStatus || 'Factored',
          paymentStatus: draft.paymentStatus || 'Paid',
          status: draft.status || 'Delivered',
          podUploaded: false,
          rateConUploaded: false
        }));
        await onAddLoadsBulk(loadsPayload);
      } else {
        for (const draft of finalLoads) {
          await onAdd({
            loadNum: draft.loadNum || `L-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            rateConNum: draft.rateConNum || `RC-${draft.loadNum || Date.now()}`,
            dispatcherId: draft.dispatcherId || '',
            driverId: draft.driverId || '',
            broker: draft.broker || 'Unknown Broker',
            pickupLocation: draft.pickupLocation || 'Chicago, IL',
            deliveryLocation: draft.deliveryLocation || 'Atlanta, GA',
            pickupDate: draft.pickupDate || '2026-05-29',
            deliveryDate: draft.deliveryDate || '2026-05-29',
            loadAmount: Number(draft.loadAmount) || 0,
            feePercent: Number(draft.feePercent) || 8,
            advanceFuel: 0,
            cashAdvance: 0,
            repairDeduction: 0,
            tollDeduction: 0,
            notes: `Imported from spreadsheet`,
            factoringStatus: draft.factoringStatus || 'Factored',
            paymentStatus: draft.paymentStatus || 'Paid',
            status: draft.status || 'Delivered',
            podUploaded: false,
            rateConUploaded: false
          });
        }
      }

      // Reset importer on success
      setParsedLoads([]);
      setImportRawText('');
      setIsImporting(false);
    } catch (err: any) {
      console.error("Bulk Import Save Error: ", err);
      let cleanMsg = err.message || String(err);
      try {
        const parsedErr = JSON.parse(cleanMsg);
        if (parsedErr.error) {
          cleanMsg = parsedErr.error;
        }
      } catch (e) {}
      setImportError(`Failed to save records: ${cleanMsg}`);
    } finally {
      setIsSavingImport(false);
    }
  };

  const handleStartEdit = (l: Load) => {
    setEditingId(l.id);
    setEditLoadNum(l.loadNum);
    setEditRateConNum(l.rateConNum);
    setEditDriverId(l.driverId);
    setEditDispatcherId(l.dispatcherId || '');
    setEditCarrierId(l.carrierId || '');
    setEditCarrierName(l.carrierName || '');
    setEditCustomCarrierMode(!l.carrierId && Boolean(l.carrierName && l.carrierName !== 'Independent'));
    setEditBroker(l.broker);
    setEditBrokerContactPerson(l.brokerContactPerson || '');
    setEditBrokerPhone(l.brokerPhone || '');
    setEditBrokerEmail(l.brokerEmail || '');
    setEditPickupLocation(l.pickupLocation);
    setEditDeliveryLocation(l.deliveryLocation);
    setEditPickupDate(l.pickupDate);
    setEditDeliveryDate(l.deliveryDate);
    setEditLoadAmount(l.loadAmount);
    setEditFeePercent(l.feePercent);
    setEditAdvanceFuel(l.advanceFuel);
    setEditCashAdvance(l.cashAdvance);
    setEditRepairDeduction(l.repairDeduction);
    setEditTollDeduction(l.tollDeduction);
    setEditNotes(l.notes || '');
    setEditFactoringStatus(l.factoringStatus);
    setEditPaymentStatus(l.paymentStatus);
    setEditStatus(l.status || 'Pending');
    setEditPodUploaded(l.podUploaded);
    setEditPodFileName(l.podFileName || '');
    setEditPodBase64(l.podBase64 || '');
    setEditRateConUploaded(l.rateConUploaded);
    setEditRateConFileName(l.rateConFileName || '');
    setEditRateConBase64(l.rateConBase64 || '');
  };

  const calculateOwnerNetProfit = (grossVal: number, driverFee: number, factored: boolean, dispId: string) => {
    const totalFeeDollar = grossVal * (driverFee / 100);
    const factorDollar = factored ? (grossVal * factoringRatePercent / 100) : 0;
    const dObj = dispatchers.find(disp => disp.id === dispId);
    const dRate = dObj ? dObj.commissionPercent : 8;
    const dispatchDollar = (grossVal * dRate) / 100;
    const companyShareDollar = totalFeeDollar - factorDollar - dispatchDollar;
    return companyShareDollar + dispatchDollar; // Company share + dispatcher commission = Owner Net
  };

  const handleSaveEdit = (id: string, dispIdFallback?: string) => {
    let finalEditCarrierId = editCarrierId;
    let finalEditCarrierName = editCarrierName;
    if (!finalEditCarrierId && !finalEditCarrierName) {
      const selectedDrv = drivers.find(d => d.id === editDriverId);
      if (selectedDrv?.carrierId) {
        finalEditCarrierId = selectedDrv.carrierId;
        const cObj = carriers.find(c => c.id === selectedDrv.carrierId);
        finalEditCarrierName = cObj?.name || selectedDrv.workingUnderName;
      } else if (selectedDrv?.workingUnderName) {
        finalEditCarrierName = selectedDrv.workingUnderName;
      }
    }

    onEdit(id, {
      loadNum: editLoadNum,
      rateConNum: editRateConNum,
      driverId: editDriverId,
      dispatcherId: editDispatcherId || dispIdFallback || '',
      carrierId: finalEditCarrierId || undefined,
      carrierName: finalEditCarrierName || undefined,
      broker: editBroker,
      brokerContactPerson: editBrokerContactPerson || undefined,
      brokerPhone: editBrokerPhone || undefined,
      brokerEmail: editBrokerEmail || undefined,
      pickupLocation: editPickupLocation,
      deliveryLocation: editDeliveryLocation,
      pickupDate: editPickupDate,
      deliveryDate: editDeliveryDate,
      loadAmount: Number(editLoadAmount),
      feePercent: editFeePercent,
      advanceFuel: Number(editAdvanceFuel),
      cashAdvance: 0,
      repairDeduction: 0,
      tollDeduction: 0,
      notes: editNotes,
      factoringStatus: editFactoringStatus,
      paymentStatus: editPaymentStatus,
      status: editStatus,
      podUploaded: editPodUploaded,
      podFileName: editPodUploaded ? editPodFileName : undefined,
      podBase64: editPodUploaded ? editPodBase64 : undefined,
      rateConUploaded: editRateConUploaded,
      rateConFileName: editRateConUploaded ? editRateConFileName : undefined,
      rateConBase64: editRateConUploaded ? editRateConBase64 : undefined
    });

    if (onAutoSaveBroker && editBroker) {
      onAutoSaveBroker({
        companyName: editBroker,
        contactPerson: editBrokerContactPerson,
        phone: editBrokerPhone,
        email: editBrokerEmail
      });
    }

    setEditingId(null);
  };

  // Autocomplete Driver fee, carrier & dispatcher when selecting driver in creation form
  const handleDriverChange = (id: string) => {
    setSelectedDriverId(id);
    const drvObj = drivers.find(d => d.id === id);
    if (drvObj) {
      setFeePercent(drvObj.defaultPayoutPercent);
      if (!selectedDispatcherId && drvObj.assignedDispatcherId) {
        setSelectedDispatcherId(drvObj.assignedDispatcherId);
      }
      if (drvObj.carrierId) {
        setCarrierId(drvObj.carrierId);
        const c = carriers.find(item => item.id === drvObj.carrierId);
        setCarrierName(c?.name || drvObj.workingUnderName || '');
        setCustomCarrierMode(false);
      } else if (drvObj.workingUnderName && drvObj.workingUnderName.toLowerCase() !== 'independent') {
        setCarrierId('');
        setCarrierName(drvObj.workingUnderName);
        setCustomCarrierMode(true);
      } else {
        setCarrierId('');
        setCarrierName('');
        setCustomCarrierMode(false);
      }
    }
  };

  // Auto-fill broker contact person, phone, and email if company exists in saved brokers
  const handleBrokerCompanyChange = (name: string) => {
    setBroker(name);
    const matched = brokers.find(b => b.companyName.toLowerCase().trim() === name.toLowerCase().trim());
    if (matched) {
      if (matched.contactPerson && !brokerContactPerson) setBrokerContactPerson(matched.contactPerson);
      if (matched.phone && !brokerPhone) setBrokerPhone(matched.phone);
      if (matched.email && !brokerEmail) setBrokerEmail(matched.email);
    }
  };

  const handleEditBrokerCompanyChange = (name: string) => {
    setEditBroker(name);
    const matched = brokers.find(b => b.companyName.toLowerCase().trim() === name.toLowerCase().trim());
    if (matched) {
      if (matched.contactPerson && !editBrokerContactPerson) setEditBrokerContactPerson(matched.contactPerson);
      if (matched.phone && !editBrokerPhone) setEditBrokerPhone(matched.phone);
      if (matched.email && !editBrokerEmail) setEditBrokerEmail(matched.email);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loadNum || !selectedDriverId) return;

    // Detect dispatcher from user selection, logged-in dispatcher, or driver assignment
    let finalDispId = selectedDispatcherId;
    if (!finalDispId) {
      const selectedDrv = drivers.find(d => d.id === selectedDriverId);
      finalDispId = myDispatcherId || (selectedDrv ? selectedDrv.assignedDispatcherId : '');
    }

    let finalCarrierId = carrierId;
    let finalCarrierName = carrierName;
    if (!finalCarrierId && !finalCarrierName) {
      const selectedDrv = drivers.find(d => d.id === selectedDriverId);
      if (selectedDrv?.carrierId) {
        finalCarrierId = selectedDrv.carrierId;
        const cObj = carriers.find(c => c.id === selectedDrv.carrierId);
        finalCarrierName = cObj?.name || selectedDrv.workingUnderName;
      } else if (selectedDrv?.workingUnderName) {
        finalCarrierName = selectedDrv.workingUnderName;
      }
    }

    onAdd({
      loadNum,
      rateConNum: rateConNum || `RC-${loadNum}`,
      dispatcherId: finalDispId,
      driverId: selectedDriverId,
      carrierId: finalCarrierId || undefined,
      carrierName: finalCarrierName || undefined,
      broker,
      brokerContactPerson: brokerContactPerson || undefined,
      brokerPhone: brokerPhone || undefined,
      brokerEmail: brokerEmail || undefined,
      pickupLocation,
      deliveryLocation,
      pickupDate,
      deliveryDate,
      loadAmount: Number(loadAmount),
      feePercent,
      advanceFuel: Number(advanceFuel),
      cashAdvance: 0,
      repairDeduction: 0,
      tollDeduction: 0,
      notes,
      factoringStatus: 'Non-Factored',
      paymentStatus,
      status,
      podUploaded,
      podFileName: podUploaded ? (podFileName || `pod_${loadNum}.pdf`) : undefined,
      podBase64: podUploaded ? podBase64 : undefined,
      rateConUploaded,
      rateConFileName: rateConUploaded ? (rateConFileName || `ratecon_${loadNum}.pdf`) : undefined,
      rateConBase64: rateConUploaded ? rateConBase64 : undefined
    });

    if (onAutoSaveBroker && broker) {
      onAutoSaveBroker({
        companyName: broker,
        contactPerson: brokerContactPerson,
        phone: brokerPhone,
        email: brokerEmail
      });
    }

    // Reset Form
    setIsAdding(false);
    setLoadNum('');
    setRateConNum('');
    setStatus('Pending');
    setSelectedDriverId('');
    setSelectedDispatcherId('');
    setBroker('');
    setBrokerContactPerson('');
    setBrokerPhone('');
    setBrokerEmail('');
    setPickupLocation('');
    setDeliveryLocation('');
    setPickupDate('');
    setDeliveryDate('');
    setLoadAmount(0);
    setAdvanceFuel(0);
    setCashAdvance(0);
    setRepairDeduction(0);
    setTollDeduction(0);
    setNotes('');
    setPodUploaded(false);
    setPodFileName('');
    setPodBase64('');
    setRateConUploaded(false);
    setRateConFileName('');
    setRateConBase64('');

    // Clear progress and errors
    setPodUploading(false);
    setPodProgress(0);
    setPodError(null);
    setRateConUploading(false);
    setRateConProgress(0);
    setRateConError(null);
  };

  const downloadBase64File = (base64Data: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDocumentClick = (l: Load, type: 'pod' | 'ratecon') => {
    const uploaded = type === 'pod' ? l.podUploaded : l.rateConUploaded;
    const base64 = type === 'pod' ? l.podBase64 : l.rateConBase64;
    const fileName = type === 'pod' ? l.podFileName : l.rateConFileName;
    
    if (!uploaded) return;

    // Reset preview interactive visual controls
    setPreviewZoom(1.0);
    setPreviewRotation(0);
    setPreviewFilter('standard');

    if (base64) {
      setPreviewFile({
        base64,
        name: fileName || `${type}_${l.loadNum}.pdf`,
        type,
        loadId: l.id
      });
    } else {
      // Mock / fallback
      const mockContent = `Mock file for load ${l.loadNum} ${type.toUpperCase()}`;
      const blob = new Blob([mockContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `${type}_${l.loadNum}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const FileUploadBox = ({
    type,
    uploaded,
    fileName,
    base64,
    onFileSelect,
    onClear,
    label,
    isUploading,
    progress,
    error,
    onClearError
  }: {
    type: 'pod' | 'ratecon';
    uploaded: boolean;
    fileName: string;
    base64: string;
    onFileSelect: (file: File) => void;
    onClear: () => void;
    label: string;
    isUploading: boolean;
    progress: number;
    error: string | null;
    onClearError: () => void;
  }) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    };

    const handleDragLeave = () => {
      setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (isUploading) return;
      const file = e.dataTransfer.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isUploading) return;
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    };

    return (
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-500 uppercase">{label}</label>
        
        {isUploading ? (
          /* Uploading State with high-fidelity progress bar & metrics */
          <div className="p-4 bg-blue-50/50 border border-blue-150 rounded-xl space-y-3 shadow-sm animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-700 shrink-0">
                  <UploadCloud className="h-5 w-5 animate-bounce" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">Uploading document...</p>
                  <p className="text-[10px] text-blue-600 font-mono">Synchronizing cloud records</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md shrink-0">
                {Math.round(progress)}%
              </span>
            </div>

            <div className="space-y-1">
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden shadow-inner">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[9px] text-slate-400">
                <span>Encrypting payload</span>
                <span>Optimizing sync buffers</span>
              </div>
            </div>
          </div>
        ) : error ? (
          /* Error State with descriptive warning box and actions */
          <div className="p-4 bg-rose-50/75 border border-rose-200 rounded-xl space-y-3 shadow-sm">
            <div className="flex items-start gap-2.5">
              <div className="p-2 bg-rose-100 rounded-lg text-rose-700 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800">Upload failed</p>
                <p className="text-[10px] text-rose-750 font-sans mt-0.5 leading-relaxed">
                  {error}
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={onClearError}
                className="px-3 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Clear Error
              </button>
              <label className="relative px-3 py-1 text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer text-center">
                Retry Upload
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileInput}
                />
              </label>
            </div>
          </div>
        ) : uploaded ? (
          /* Success Uploaded state */
          <div className="p-4 bg-emerald-50 border border-emerald-200/60 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700 shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{fileName || `${type}_document.pdf`}</p>
                <p className="text-[10px] text-emerald-600 font-mono">Ready to sync</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0">
              {base64 && (
                <button
                  type="button"
                  onClick={() => {
                    setPreviewZoom(1.0);
                    setPreviewRotation(0);
                    setPreviewFilter('standard');
                    setPreviewFile({ base64, name: fileName || `${type}.pdf`, type });
                  }}
                  className="p-1.5 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                  title="Preview document"
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClear}
                className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition-colors cursor-pointer"
                title="Remove file"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Default drop area state */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-4 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px] ${
              isDragOver
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/50'
            }`}
          >
            <input
              type="file"
              accept="application/pdf,image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileInput}
            />
            <UploadCloud className={`h-8 w-8 mb-2 transition-transform duration-200 ${isDragOver ? 'scale-110 text-blue-500' : 'text-slate-400'}`} />
            <p className="text-xs font-semibold text-slate-700">
              Drag &amp; drop or <span className="text-blue-600 underline">browse</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-sans">
              PDF or Images up to 800 KB
            </p>
          </div>
        )}
      </div>
    );
  };

  const handleProofFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/');

    const reader = new FileReader();
    reader.onload = () => {
      const base64Str = reader.result as string;
      setAdvProofFileName(file.name);
      setAdvProofFileType(isPdf ? 'pdf' : isImage ? 'image' : 'other');
      setAdvProofBase64(base64Str);
    };
    reader.readAsDataURL(file);
  };

  const handleOpenNewAdvanceModal = (prefillLoad?: Load) => {
    if (prefillLoad) {
      setAdvLoadId(prefillLoad.id);
      setAdvLoadNum(prefillLoad.loadNum);
      setAdvBrokerName(prefillLoad.broker);
      setAdvDriverId(prefillLoad.driverId);
      const drv = drivers.find(d => d.id === prefillLoad.driverId);
      setAdvReceiverName(drv?.name || 'Frederick Lemont');
    } else {
      setAdvLoadId('');
      setAdvLoadNum('160884');
      setAdvBrokerName('');
      if (drivers.length > 0) {
        setAdvDriverId(drivers[0].id);
        setAdvReceiverName(drivers[0].name);
      } else {
        setAdvReceiverName('Frederick Lemont');
      }
    }
    setAdvSenderName('E & G Express');
    setAdvSenderType('OWNER');
    setAdvAmount(700);
    setAdvType('ZELLE');
    setAdvDate(new Date().toISOString().split('T')[0]);
    setAdvNotes('Partial load payment transfer / cash advance sent via Zelle.');
    setAdvProofFileName('');
    setAdvProofFileType('pdf');
    setAdvProofBase64('');
    setIsAddingAdvanceForm(true);
    setShowAdvancesModal(true);
  };

  const handleSaveAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advSenderName || !advReceiverName || advAmount <= 0) {
      alert('Please fill in required fields: Sender Name, Receiver Name, and Amount.');
      return;
    }

    const selectedDrv = drivers.find(d => d.id === advDriverId);
    const finalDriverName = selectedDrv ? selectedDrv.name : advReceiverName;

    const newAdvanceData: Omit<DriverAdvance, 'id'> = {
      driverId: advDriverId || (selectedDrv?.id || 'drv_gen'),
      driverName: finalDriverName,
      senderName: advSenderName,
      senderType: advSenderType,
      receiverName: advReceiverName || finalDriverName,
      loadId: advLoadId || undefined,
      loadNum: advLoadNum || undefined,
      brokerName: advBrokerName || undefined,
      amount: advAmount,
      advanceType: advType,
      date: advDate,
      notes: advNotes,
      proofFileName: advProofFileName || undefined,
      proofFileType: advProofFileType,
      proofBase64: advProofBase64 || undefined,
      createdAt: new Date().toISOString()
    };

    if (onAddAdvance) {
      await onAddAdvance(newAdvanceData);
    }

    setIsAddingAdvanceForm(false);
  };

  return (
    <div id="load_management" className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm col-span-full">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight font-display">
            Load Board
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin ? 'Corporate bookings, automated driver payout margins, cash advance sync & proof vault' : 'Assign booked runs to my drivers, submit POD templates & review commissions'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setShowAdvancesModal(true);
              setIsAdding(false);
              setIsImporting(false);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
          >
            <Coins className="h-4 w-4" />
            <span>Driver Advances &amp; Proofs ({driverAdvances.length})</span>
          </button>

          <button
            onClick={() => {
              setIsImporting(prev => !prev);
              setIsAdding(false);
              setEditingId(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
              isImporting
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80 shadow-sm'
            }`}
          >
            <UploadCloud className="h-4 w-4 text-slate-550" />
            <span>{isImporting ? 'Close Importer' : 'Import Spreadsheet / CSV'}</span>
          </button>

          <button
            onClick={() => {
              setIsAdding(prev => !prev);
              setIsImporting(false);
              setEditingId(null);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-blue-500/10 cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{isAdding ? 'Close Booking Wizard' : 'Book Load'}</span>
          </button>
        </div>
      </div>

      {/* Adding Load Panel Form */}
      {isAdding && (
        <form onSubmit={handleAddSubmit} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-lg space-y-6">
          <div className="flex justify-between items-center text-slate-900 border-b border-slate-100 pb-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
              <PlusCircle className="h-4.5 w-4.5 text-blue-600" />
              <span>Book New Run</span>
            </h3>
            <span className="text-[10px] bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded uppercase">
              Draft Booking
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Row 1 */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Load Number</label>
              <input
                type="text"
                required
                placeholder="e.g. 4515"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
                value={loadNum}
                onChange={e => setLoadNum(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Booked By Dispatcher</label>
              <select
                required
                className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium"
                value={selectedDispatcherId}
                onChange={e => setSelectedDispatcherId(e.target.value)}
              >
                <option value="">-- Choose Dispatcher --</option>
                {dispatchers.map(disp => (
                  <option key={disp.id} value={disp.id}>
                    {disp.name} ({disp.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Assign Active Driver</label>
              <select
                required
                className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
                value={selectedDriverId}
                onChange={e => handleDriverChange(e.target.value)}
              >
                <option value="">-- Choose Driver --</option>
                {allowedDrivers.map(drv => (
                  <option key={drv.id} value={drv.id}>
                    {drv.name} (Truck {drv.truckNum} &bull; {drv.truckType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Carrier Company / Authority</label>
              <select
                className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium"
                value={customCarrierMode ? 'CUSTOM' : (carrierId || (carrierName === 'Independent' ? 'INDEPENDENT' : (carrierName ? 'CUSTOM' : '')))}
                onChange={e => {
                  const val = e.target.value;
                  if (val === 'CUSTOM') {
                    setCustomCarrierMode(true);
                    setCarrierId('');
                  } else if (val === 'INDEPENDENT') {
                    setCustomCarrierMode(false);
                    setCarrierId('');
                    setCarrierName('Independent');
                  } else if (val === '') {
                    setCustomCarrierMode(false);
                    setCarrierId('');
                    setCarrierName('');
                  } else {
                    setCustomCarrierMode(false);
                    const foundCarrier = carriers.find(c => c.id === val);
                    if (foundCarrier) {
                      setCarrierId(foundCarrier.id);
                      setCarrierName(foundCarrier.name);
                      if (foundCarrier.payoutRatePercent) {
                        setFeePercent(foundCarrier.payoutRatePercent);
                      }
                    }
                  }
                }}
              >
                <option value="">-- Auto Sync / Driver Default --</option>
                <option value="INDEPENDENT">🚜 Independent / Standalone Driver</option>
                {carriers.map(c => (
                  <option key={c.id} value={c.id}>
                    🏢 {c.name} ({c.type === 'CARRIER' ? 'Carrier' : 'Owner Op'} • {c.payoutRatePercent || 8}%)
                  </option>
                ))}
                <option value="CUSTOM">➕ Other / Custom Carrier Company...</option>
              </select>
            </div>

            {customCarrierMode && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Custom Carrier Name</label>
                <input
                  type="text"
                  placeholder="e.g. Apex Logistics LLC"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium"
                  value={carrierName}
                  onChange={e => setCarrierName(e.target.value)}
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase">Broker Enterprise</label>
                {brokers.length > 0 && (
                  <span className="text-[10px] text-blue-600 font-semibold">{brokers.length} saved brokers</span>
                )}
              </div>
              <input
                type="text"
                required
                list="broker-list-options"
                placeholder="e.g. TQL, Echo, CHR"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={broker}
                onChange={e => handleBrokerCompanyChange(e.target.value)}
              />
              <datalist id="broker-list-options">
                {brokers.map(b => (
                  <option key={b.id} value={b.companyName}>
                    {b.contactPerson ? `${b.contactPerson} (${b.phone || b.email || ''})` : ''}
                  </option>
                ))}
              </datalist>
            </div>

            {/* Broker Contact Details (Auto-saved & Pre-filled) */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
              <div>
                <label className="block text-[11px] font-bold text-blue-900 mb-1">
                  Broker Contact Person
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={brokerContactPerson}
                  onChange={e => setBrokerContactPerson(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-blue-900 mb-1">
                  Broker Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. (800) 555-0199"
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={brokerPhone}
                  onChange={e => setBrokerPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-blue-900 mb-1">
                  Broker Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. dispatch@broker.com"
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={brokerEmail}
                  onChange={e => setBrokerEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Row 2 */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Pickup Location</label>
              <input
                type="text"
                required
                placeholder="e.g. Chicago, IL"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
                value={pickupLocation}
                onChange={e => setPickupLocation(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Delivery Location</label>
              <input
                type="text"
                required
                placeholder="e.g. Dallas, TX"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
                value={deliveryLocation}
                onChange={e => setDeliveryLocation(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Pickup Date</label>
              <input
                type="date"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
                value={pickupDate}
                onChange={e => setPickupDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Delivery Date</label>
              <input
                type="date"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
                value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
              />
            </div>

            {/* Financial Calculations */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Gross Load Rate ($)</label>
              <input
                type="number"
                required
                min={0}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-850 font-mono font-medium"
                value={loadAmount || ''}
                onChange={e => setLoadAmount(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                Company Fee %
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-850 font-mono font-medium focus:outline-none focus:border-blue-500"
                  value={feePercent}
                  onChange={e => setFeePercent(Number(e.target.value))}
                />
                <span className="absolute right-3.5 top-2.5 text-slate-400 font-semibold text-sm">%</span>
              </div>
            </div>

            {/* Consolidated Advance Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Fuel / Advance ($)</label>
              <input
                type="number"
                min={0}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-mono"
                value={advanceFuel || ''}
                onChange={e => setAdvanceFuel(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Broker Payment status</label>
              <select
                className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium"
                value={paymentStatus}
                onChange={e => setPaymentStatus(e.target.value as 'Paid' | 'Unpaid')}
              >
                <option value="Unpaid">Unpaid / Open Booking</option>
                <option value="Paid">Paid / Cleared</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Cargo Status</label>
              <select
                className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium"
                value={status}
                onChange={e => setStatus(e.target.value as 'Pending' | 'In Transit' | 'Delivered')}
              >
                <option value="Pending">Pending (Not Dispatched)</option>
                <option value="In Transit">In Transit (On the road)</option>
                <option value="Delivered">Delivered (Completed)</option>
              </select>
            </div>
          </div>

          {/* Documents Block with Simulation Trigger & Progress Integration */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-200/60">
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase">Documents Attachment</h4>
                <p className="text-[10px] text-slate-400">Upload PDF/Images to link files directly with this cargo dispatch record</p>
              </div>
              <label className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 hover:border-slate-300 rounded-lg shadow-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={simulateNetworkError}
                  onChange={(e) => setSimulateNetworkError(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span className="text-[10px] font-bold text-slate-650 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                  Simulate Connection Issue (Force Interruption)
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FileUploadBox
                type="pod"
                uploaded={podUploaded}
                fileName={podFileName}
                base64={podBase64}
                onFileSelect={(file) => handleFileChange(file, 'pod', false)}
                onClear={() => {
                  setPodUploaded(false);
                  setPodFileName('');
                  setPodBase64('');
                  setPodError(null);
                }}
                label="POD Proof of Delivery Document"
                isUploading={podUploading}
                progress={podProgress}
                error={podError}
                onClearError={() => setPodError(null)}
              />

              <FileUploadBox
                type="ratecon"
                uploaded={rateConUploaded}
                fileName={rateConFileName}
                base64={rateConBase64}
                onFileSelect={(file) => handleFileChange(file, 'ratecon', false)}
                onClear={() => {
                  setRateConUploaded(false);
                  setRateConFileName('');
                  setRateConBase64('');
                  setRateConError(null);
                }}
                label="Rate Confirmation Proof"
                isUploading={rateConUploading}
                progress={rateConProgress}
                error={rateConError}
                onClearError={() => setRateConError(null)}
              />
            </div>
          </div>

          {/* Quick preview calculation box */}
          {loadAmount > 0 && selectedDriverId && (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                Live Calculation Breakdown
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono text-slate-700">
                <div className="flex flex-col">
                  <span>Gross Load Amount:</span>
                  <strong className="text-slate-900 text-sm mt-0.5">${loadAmount}</strong>
                </div>

                <div className="flex flex-col">
                  <span>Driver Base Share ({100 - feePercent}%):</span>
                  <strong className="text-slate-900 text-sm mt-0.5">${loadAmount * (100 - feePercent) / 100}</strong>
                </div>

                <div className="flex flex-col">
                  <span>Driver Net Payout (Subdeducted):</span>
                  <strong className="text-emerald-600 text-sm font-bold mt-0.5">
                    ${(loadAmount * (100 - feePercent) / 100 - (advanceFuel + cashAdvance + repairDeduction + tollDeduction)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </strong>
                </div>

                <div className="flex flex-col">
                  <span>Owner profit (this load):</span>
                  <strong className="text-indigo-600 text-sm font-bold mt-0.5">
                    ${calculateOwnerNetProfit(loadAmount, feePercent, factoringStatus === 'Factored', myDispatcherId || dispatchers[0]?.id).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Register &amp; Book Load
            </button>
          </div>
        </form>
      )}

      {isImporting && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-lg space-y-6">
          <div className="flex justify-between items-center text-slate-900 border-b border-slate-100 pb-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
              <UploadCloud className="h-4.5 w-4.5 text-blue-600" />
              <span>Bulk Spreadsheet Importer</span>
            </h3>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded uppercase">
              Google Sheets / Excel / CSV
            </span>
          </div>

          {parsedLoads.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Option 1: Paste spreadsheet rows</h4>
                <p className="text-xs text-slate-500">
                  Select and copy cells directly from your Google Sheets or Excel ledger, then paste them below:
                </p>
                <textarea
                  rows={6}
                  placeholder="Paste columns here...&#10;e.g. 7/7/2025	72222	$1,080.00	Robin	Erick	EXPRESS LOGISTICS"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-850 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={importRawText}
                  onChange={e => setImportRawText(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => parseCSVorTSV(importRawText)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-all shadow-sm cursor-pointer"
                >
                  Analyze &amp; Parse Pasted Text
                </button>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Option 2: Upload CSV File</h4>
                <p className="text-xs text-slate-500">
                  Select a CSV file export of your loads board or ledger to parse the values directly:
                </p>
                
                <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-6 hover:border-blue-400 hover:bg-slate-50/50 flex flex-col items-center justify-center text-center cursor-pointer min-h-[160px]">
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleImportFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <UploadCloud className="h-10 w-10 text-slate-400 mb-2" />
                  <p className="text-xs font-semibold text-slate-700">Click to browse your computer</p>
                  <p className="text-[10px] text-slate-400 mt-1">Supports standard Comma (.csv) or Tab (.tsv) separated files</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Extracted Records Review ({parsedLoads.length} Loads Detected)
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Review and map Driver / Dispatcher names before saving to the central Load Board.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setParsedLoads([]); setImportRawText(''); }}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded transition-colors cursor-pointer"
                >
                  Clear &amp; Restart
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-150 rounded-xl max-h-[350px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-150">
                      <th className="p-3">Load #</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Broker</th>
                      <th className="p-3">Gross ($)</th>
                      <th className="p-3">Dispatcher Assignment</th>
                      <th className="p-3">Driver Assignment</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {parsedLoads.map((draft, idx) => {
                      return (
                        <tr key={draft.id} className="hover:bg-slate-50/50">
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={draft.loadNum}
                              onChange={e => {
                                const updated = [...parsedLoads];
                                updated[idx].loadNum = e.target.value;
                                setParsedLoads(updated);
                              }}
                              className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-800 w-24"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="date"
                              value={draft.pickupDate}
                              onChange={e => {
                                const updated = [...parsedLoads];
                                updated[idx].pickupDate = e.target.value;
                                updated[idx].deliveryDate = e.target.value;
                                setParsedLoads(updated);
                              }}
                              className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-800 w-32"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={draft.broker}
                              onChange={e => {
                                const updated = [...parsedLoads];
                                updated[idx].broker = e.target.value;
                                setParsedLoads(updated);
                              }}
                              className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-800 w-32"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              value={draft.loadAmount}
                              onChange={e => {
                                const updated = [...parsedLoads];
                                updated[idx].loadAmount = Number(e.target.value);
                                setParsedLoads(updated);
                              }}
                              className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-bold text-slate-800 w-24"
                            />
                          </td>
                          <td className="p-2.5">
                            <select
                              value={draft.dispatcherId}
                              onChange={e => {
                                const updated = [...parsedLoads];
                                updated[idx].dispatcherId = e.target.value;
                                setParsedLoads(updated);
                              }}
                              className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-800 w-32 font-medium"
                            >
                              <option value="">-- Unassigned Dispatcher --</option>
                              {draft.dispatcherId && draft.dispatcherId.startsWith('create_dispatcher_') && (
                                <option value={draft.dispatcherId}>
                                  ✨ Auto-Create: {draft.dispatcherId.replace('create_dispatcher_', '')}
                                </option>
                              )}
                              {dispatchers.map(disp => (
                                <option key={disp.id} value={disp.id}>{disp.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2.5">
                            <select
                              value={draft.driverId}
                              onChange={e => {
                                const updated = [...parsedLoads];
                                updated[idx].driverId = e.target.value;
                                const drv = drivers.find(d => d.id === e.target.value);
                                if (drv) {
                                  updated[idx].feePercent = drv.defaultPayoutPercent;
                                }
                                setParsedLoads(updated);
                              }}
                              className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-800 w-36 font-medium"
                            >
                              <option value="">-- Unassigned Driver --</option>
                              {draft.driverId && draft.driverId.startsWith('create_driver_') && (
                                <option value={draft.driverId}>
                                  ✨ Auto-Create: {draft.driverId.replace('create_driver_', '')}
                                </option>
                              )}
                              {drivers.map(drv => (
                                <option key={drv.id} value={drv.id}>{drv.name} ({drv.truckNum})</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = parsedLoads.filter(d => d.id !== draft.id);
                                setParsedLoads(updated);
                              }}
                              className="p-1 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded transition-colors cursor-pointer"
                              title="Delete row"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSavingImport}
                  onClick={() => {
                    setParsedLoads([]);
                    setImportRawText('');
                    setIsImporting(false);
                  }}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    isSavingImport 
                      ? 'bg-slate-50 text-slate-400 cursor-not-allowed' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingImport}
                  onClick={handleSaveBulkImport}
                  className={`px-4 py-2 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-md cursor-pointer ${
                    isSavingImport 
                      ? 'bg-emerald-400 cursor-not-allowed' 
                      : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  {isSavingImport ? (
                    <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                  ) : (
                    <PlusCircle className="h-4 w-4" />
                  )}
                  <span>{isSavingImport ? 'Saving...' : `Confirm & Import ${parsedLoads.length} Loads`}</span>
                </button>
              </div>
            </div>
          )}

          {importError && (
            <div className="p-3 bg-rose-50 border border-rose-150 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
              <span>{importError}</span>
            </div>
          )}
        </div>
      )}

      {/* Main ledger list */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        
        {/* Filters Panel */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/40">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search load num, broker, pickup..."
              className="w-full pl-10 pr-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3.5 w-full md:w-auto">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 px-2.5 rounded-xl text-xs text-slate-600">
              <Building className="h-3.5 w-3.5 text-slate-400" />
              <span>Carrier:</span>
              <select
                className="bg-transparent font-semibold text-slate-800 focus:outline-none max-w-[140px] truncate"
                value={carrierFilter}
                onChange={e => setCarrierFilter(e.target.value)}
              >
                <option value="ALL">All Carriers ({loads.length})</option>
                {carriers.map(c => {
                  const count = loads.filter(l => {
                    const drv = drivers.find(d => d.id === l.driverId);
                    return l.carrierId === c.id || l.carrierName === c.name || drv?.carrierId === c.id || drv?.workingUnderName === c.name;
                  }).length;
                  return (
                    <option key={c.id} value={c.id}>
                      🏢 {c.name} ({count})
                    </option>
                  );
                })}
                <option value="INDEPENDENT">🚜 Independent</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 px-2.5 rounded-xl text-xs text-slate-600">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <span>Paid:</span>
              <select
                className="bg-transparent font-semibold text-slate-800 focus:outline-none"
                value={paymentFilter}
                onChange={e => setPaymentFilter(e.target.value as any)}
              >
                <option value="ALL">All Payments</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 px-2.5 rounded-xl text-xs text-slate-600">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Cargo:</span>
              <select
                className="bg-transparent font-semibold text-slate-800 focus:outline-none focus:ring-0"
                value={statusFilter}
                onChange={e => { setSearchTerm(''); setStatusFilter(e.target.value as any); }}
              >
                <option value="ALL">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Transit">In Transit</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 p-1 px-2.5 rounded-xl text-xs text-slate-700">
              <ArrowUpDown className="h-3.5 w-3.5 text-blue-600" />
              <span className="font-medium text-slate-500">Sort:</span>
              <select
                className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
              >
                <option value="NEWEST">Newest Loads First (Aging Sort)</option>
                <option value="OLDEST">Oldest Loads First</option>
                <option value="GROSS_HIGH">Highest Gross Amount ($)</option>
                <option value="STATUS">Cargo Status</option>
              </select>
            </div>

            <span className="text-[11px] text-slate-400 font-mono ml-auto md:ml-0 font-medium">
              Loads: {visibleLoads.length}
            </span>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedLoadIds.length > 0 && (
          <div className="bg-rose-50/70 border-b border-rose-100 px-5 py-3 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-rose-800">
                {selectedLoadIds.length} loads selected for bulk operations
              </span>
              <button
                type="button"
                onClick={() => setSelectedLoadIds([])}
                className="text-[10px] text-slate-500 hover:text-slate-800 underline font-semibold cursor-pointer"
              >
                Clear selection
              </button>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${selectedLoadIds.length} selected loads? This action is permanent and requires Administrator privileges.`)) {
                    selectedLoadIds.forEach(id => onDelete(id));
                    setSelectedLoadIds([]);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-[11px] font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Selected</span>
              </button>
            )}
          </div>
        )}

        {/* Group sortedVisibleLoads by Month */}
        {(() => {
          const formatMonthYearLabel = (dateStr?: string) => {
            if (!dateStr || !dateStr.trim()) return { key: '0000-00', label: 'Unassigned Month / Date' };
            const clean = dateStr.trim();
            const parts = clean.split(/[\/\-]/);
            if (parts.length >= 2) {
              let year = parts[0];
              let month = parts[1];
              if (year.length === 2) year = `20${year}`;
              if (month.length === 1) month = `0${month}`;
              const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
              if (!isNaN(dateObj.getTime())) {
                const monthName = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                return { key: `${year}-${month}`, label: monthName };
              }
            }
            return { key: '0000-00', label: 'Unassigned Month / Date' };
          };

          interface MonthGroup {
            key: string;
            label: string;
            loads: Load[];
            totalGross: number;
            totalNet: number;
          }

          const monthGroupMap: { [key: string]: MonthGroup } = {};
          const monthKeysOrdered: string[] = [];

          sortedVisibleLoads.forEach(l => {
            const dateVal = l.pickupDate || l.deliveryDate || '';
            const { key, label } = formatMonthYearLabel(dateVal);
            if (!monthGroupMap[key]) {
              monthGroupMap[key] = { key, label, loads: [], totalGross: 0, totalNet: 0 };
              monthKeysOrdered.push(key);
            }

            const baseShareRate = (100 - l.feePercent) / 100;
            const baseShareUSD = l.loadAmount * baseShareRate;
            const deductionsAccum = l.advanceFuel + l.cashAdvance + l.repairDeduction + l.tollDeduction;
            const computedDriverPayout = baseShareUSD - deductionsAccum;

            monthGroupMap[key].loads.push(l);
            monthGroupMap[key].totalGross += l.loadAmount;
            monthGroupMap[key].totalNet += computedDriverPayout;
          });

          monthKeysOrdered.sort((a, b) => {
            if (sortBy === 'OLDEST') return a.localeCompare(b);
            return b.localeCompare(a);
          });

          const monthGroups = monthKeysOrdered.map(k => monthGroupMap[k]);

          const toggleMonth = (key: string) => {
            setExpandedMonths(prev => ({
              ...prev,
              [key]: prev[key] === undefined ? false : !prev[key]
            }));
          };

          const isMonthExpanded = (key: string) => {
            if (searchTerm.trim() !== '') return true;
            if (expandedMonths[key] !== undefined) return expandedMonths[key];
            return key === monthKeysOrdered[0];
          };

          const expandAllMonths = () => {
            const map: { [key: string]: boolean } = {};
            monthKeysOrdered.forEach(k => { map[k] = true; });
            setExpandedMonths(map);
          };

          const collapseAllMonths = () => {
            const map: { [key: string]: boolean } = {};
            monthKeysOrdered.forEach(k => { map[k] = false; });
            setExpandedMonths(map);
          };

          return (
            <>
              {/* Month Expand / Collapse Quick Controls Bar */}
              {monthGroups.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-[#001E36] text-white rounded-t-xl text-xs font-semibold border-b border-blue-900 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-400" />
                    <span className="font-extrabold tracking-wide">Monthwise Load Board ({monthGroups.length} Months)</span>
                    <span className="text-[10px] text-blue-200 bg-blue-950 px-2 py-0.5 rounded-full border border-blue-700">
                      Click month rows to expand/collapse
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={expandAllMonths}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs text-[11px]"
                    >
                      <Maximize2 className="h-3 w-3" />
                      <span>Expand All</span>
                    </button>
                    <button
                      type="button"
                      onClick={collapseAllMonths}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs text-[11px] border border-slate-700"
                    >
                      <Minimize2 className="h-3 w-3" />
                      <span>Collapse All</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Ledger Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      <th className="py-3.5 px-5 text-center w-12">
                        <input
                          type="checkbox"
                          checked={isAllVisibleSelected}
                          onChange={handleSelectAllToggle}
                          className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer accent-blue-600"
                        />
                      </th>
                      <th className="py-3.5 px-5">Load / RC Info</th>
                      <th className="py-3.5 px-5">Driver Name</th>
                      <th className="py-3.5 px-5">Broker &amp; Route Details</th>
                      <th className="py-3.5 px-5 text-right">Gross load</th>
                      <th className="py-3.5 px-5 text-right">Driver Net Payout</th>
                      <th className="py-3.5 px-5 text-center">Documents</th>
                      <th className="py-3.5 px-5 text-center">Cargo Status</th>
                      <th className="py-3.5 px-5 text-center">Payment</th>
                      <th className="py-3.5 px-5 text-center">Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                    {monthGroups.map(group => {
                      const isOpen = isMonthExpanded(group.key);
                      return (
                        <React.Fragment key={group.key}>
                          {/* Month Accordion Header Row */}
                          <tr
                            onClick={() => toggleMonth(group.key)}
                            className="bg-[#002B49] hover:bg-[#003B63] text-white font-bold cursor-pointer transition-colors border-y border-blue-900 select-none shadow-xs"
                          >
                            <td colSpan={10} className="py-3 px-5">
                              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-2">
                                  {isOpen ? (
                                    <ChevronDown className="h-4 w-4 text-blue-300 transition-transform" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-blue-300 transition-transform" />
                                  )}
                                  <Calendar className="h-4 w-4 text-amber-400" />
                                  <span className="text-sm tracking-wide font-extrabold text-white">{group.label}</span>
                                  <span className="bg-blue-800/80 text-blue-100 text-[10px] font-mono px-2 py-0.5 rounded-full border border-blue-600">
                                    {group.loads.length} {group.loads.length === 1 ? 'load' : 'loads'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-mono">
                                  <div className="flex items-center gap-1 text-blue-100">
                                    <span className="text-[10px] text-blue-300 uppercase font-semibold">Gross Total:</span>
                                    <span className="font-extrabold text-white">${group.totalGross.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-emerald-300">
                                    <span className="text-[10px] text-emerald-400 uppercase font-semibold">Net Payout:</span>
                                    <span className="font-extrabold text-emerald-200">${group.totalNet.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                  <span className="text-[10px] text-blue-100 bg-blue-900 px-2 py-0.5 rounded border border-blue-700">
                                    {isOpen ? 'Collapse ▲' : 'Open Month ▼'}
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>

                          {/* Render Loads of this Month if Open */}
                          {isOpen && group.loads.map(l => {
                            const isEditing = editingId === l.id;
                            const driverObj = drivers.find(d => d.id === l.driverId);
                            const dispatcherObj = dispatchers.find(dis => dis.id === l.dispatcherId);
                            
                            // Math drivers share
                            const baseShareRate = (100 - l.feePercent) / 100;
                            const baseShareUSD = l.loadAmount * baseShareRate;
                            const deductionsAccum = l.advanceFuel + l.cashAdvance + l.repairDeduction + l.tollDeduction;
                            const computedDriverPayout = baseShareUSD - deductionsAccum;

                if (isEditing) {
                  return (
                    <tr key={l.id} className="bg-blue-50/10">
                      <td colSpan={11} className="p-5">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center text-blue-700 font-bold border-b border-blue-100 pb-2">
                            <span>Inline Editing Load #{l.loadNum}</span>
                            <div className="flex gap-2.5">
                              <button
                                onClick={() => handleSaveEdit(l.id, l.dispatcherId)}
                                className="px-3 py-1 bg-emerald-600 text-white rounded font-semibold hover:bg-emerald-500 text-xs cursor-pointer"
                              >
                                Save Changes
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1 bg-slate-200 text-slate-700 rounded font-semibold hover:bg-slate-350 text-xs cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400">Load Num</label>
                              <input
                                type="text"
                                className="w-full px-2 py-1 mt-1 bg-white border border-slate-200 rounded text-xs text-slate-800"
                                value={editLoadNum}
                                onChange={e => setEditLoadNum(e.target.value)}
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-400">Broker Enterprise</label>
                              <input
                                type="text"
                                list="broker-edit-options"
                                className="w-full px-2 py-1 mt-1 bg-white border border-slate-200 rounded text-xs text-slate-800"
                                value={editBroker}
                                onChange={e => handleEditBrokerCompanyChange(e.target.value)}
                              />
                              <datalist id="broker-edit-options">
                                {brokers.map(b => (
                                  <option key={b.id} value={b.companyName} />
                                ))}
                              </datalist>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-400">Broker Contact</label>
                              <input
                                type="text"
                                placeholder="Person Name"
                                className="w-full px-2 py-1 mt-1 bg-white border border-slate-200 rounded text-xs text-slate-800"
                                value={editBrokerContactPerson}
                                onChange={e => setEditBrokerContactPerson(e.target.value)}
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-400">Broker Phone / Email</label>
                              <div className="grid grid-cols-2 gap-1 mt-1">
                                <input
                                  type="text"
                                  placeholder="Phone"
                                  className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded text-[11px] text-slate-800"
                                  value={editBrokerPhone}
                                  onChange={e => setEditBrokerPhone(e.target.value)}
                                />
                                <input
                                  type="text"
                                  placeholder="Email"
                                  className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded text-[11px] text-slate-800"
                                  value={editBrokerEmail}
                                  onChange={e => setEditBrokerEmail(e.target.value)}
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-400">Gross Rate ($)</label>
                              <input
                                type="number"
                                className="w-full px-2 py-1 mt-1 bg-white border border-slate-200 rounded text-xs text-slate-800 font-mono font-bold"
                                value={editLoadAmount}
                                onChange={e => setEditLoadAmount(Number(e.target.value))}
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-400">Assigned Driver</label>
                              <select
                                className="w-full h-[26px] px-2 py-0.5 mt-1 bg-white border border-slate-200 rounded text-xs text-slate-800"
                                value={editDriverId}
                                onChange={e => {
                                  setEditDriverId(e.target.value);
                                  const drv = drivers.find(d => d.id === e.target.value);
                                  if (drv) {
                                    setEditFeePercent(drv.defaultPayoutPercent);
                                    if (drv.carrierId) {
                                      setEditCarrierId(drv.carrierId);
                                      const c = carriers.find(item => item.id === drv.carrierId);
                                      setEditCarrierName(c?.name || drv.workingUnderName || '');
                                      setEditCustomCarrierMode(false);
                                    } else if (drv.workingUnderName && drv.workingUnderName !== 'Independent') {
                                      setEditCarrierId('');
                                      setEditCarrierName(drv.workingUnderName);
                                      setEditCustomCarrierMode(true);
                                    }
                                  }
                                }}
                              >
                                <option value="">-- Unassigned --</option>
                                {drivers.map(drv => (
                                  <option key={drv.id} value={drv.id}>
                                    {drv.name} (Truck {drv.truckNum})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-400">Carrier Company</label>
                              <select
                                className="w-full h-[26px] px-2 py-0.5 mt-1 bg-white border border-slate-200 rounded text-xs text-slate-800 font-medium"
                                value={editCustomCarrierMode ? 'CUSTOM' : (editCarrierId || (editCarrierName === 'Independent' ? 'INDEPENDENT' : (editCarrierName ? 'CUSTOM' : '')))}
                                onChange={e => {
                                  const val = e.target.value;
                                  if (val === 'CUSTOM') {
                                    setEditCustomCarrierMode(true);
                                    setEditCarrierId('');
                                  } else if (val === 'INDEPENDENT') {
                                    setEditCustomCarrierMode(false);
                                    setEditCarrierId('');
                                    setEditCarrierName('Independent');
                                  } else if (val === '') {
                                    setEditCustomCarrierMode(false);
                                    setEditCarrierId('');
                                    setEditCarrierName('');
                                  } else {
                                    setEditCustomCarrierMode(false);
                                    const c = carriers.find(item => item.id === val);
                                    if (c) {
                                      setEditCarrierId(c.id);
                                      setEditCarrierName(c.name);
                                      if (c.payoutRatePercent) {
                                        setEditFeePercent(c.payoutRatePercent);
                                      }
                                    }
                                  }
                                }}
                              >
                                <option value="">-- Driver Default --</option>
                                <option value="INDEPENDENT">🚜 Independent Driver</option>
                                {carriers.map(c => (
                                  <option key={c.id} value={c.id}>
                                    🏢 {c.name} ({c.payoutRatePercent || 8}%)
                                  </option>
                                ))}
                                <option value="CUSTOM">➕ Custom Carrier...</option>
                              </select>
                            </div>

                            {editCustomCarrierMode && (
                              <div>
                                <label className="text-[10px] font-bold text-slate-400">Custom Carrier Name</label>
                                <input
                                  type="text"
                                  className="w-full px-2 py-1 mt-1 bg-white border border-slate-200 rounded text-xs text-slate-800 font-medium"
                                  value={editCarrierName}
                                  onChange={e => setEditCarrierName(e.target.value)}
                                />
                              </div>
                            )}

                            <div>
                              <label className="text-[10px] font-bold text-slate-400">Dispatcher</label>
                              <select
                                className="w-full h-[26px] px-2 py-0.5 mt-1 bg-white border border-slate-200 rounded text-xs text-slate-800"
                                value={editDispatcherId}
                                onChange={e => setEditDispatcherId(e.target.value)}
                              >
                                <option value="">-- None --</option>
                                {dispatchers.map(disp => (
                                  <option key={disp.id} value={disp.id}>
                                    {disp.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-400">Pickup Location</label>
                              <input
                                type="text"
                                className="w-full px-2 py-1 mt-1 bg-white border border-slate-200 rounded text-xs text-slate-800"
                                value={editPickupLocation}
                                onChange={e => setEditPickupLocation(e.target.value)}
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-400">Delivery Location</label>
                              <input
                                type="text"
                                className="w-full px-2 py-1 mt-1 bg-white border border-slate-200 rounded text-xs text-slate-800"
                                value={editDeliveryLocation}
                                onChange={e => setEditDeliveryLocation(e.target.value)}
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-400">Pickup Date</label>
                              <input
                                type="date"
                                className="w-full px-2 py-1 mt-1 bg-white border border-slate-200 rounded text-xs text-slate-800"
                                value={editPickupDate}
                                onChange={e => setEditPickupDate(e.target.value)}
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-400">Delivery Date</label>
                              <input
                                type="date"
                                className="w-full px-2 py-1 mt-1 bg-white border border-slate-200 rounded text-xs text-slate-800"
                                value={editDeliveryDate}
                                onChange={e => setEditDeliveryDate(e.target.value)}
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-400">Fuel / Advance ($)</label>
                              <input
                                type="number"
                                placeholder="0.00"
                                className="w-full px-2 py-1 mt-1 bg-white border border-slate-200 rounded text-xs text-slate-800 font-mono"
                                value={editAdvanceFuel}
                                onChange={e => setEditAdvanceFuel(Number(e.target.value))}
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-400">Payment</label>
                              <select
                                className="w-full px-2 py-1 mt-1 bg-white border border-slate-200 rounded text-xs text-slate-800"
                                value={editPaymentStatus}
                                onChange={e => setEditPaymentStatus(e.target.value as any)}
                              >
                                <option value="Paid">Paid</option>
                                <option value="Unpaid">Unpaid</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-400">Cargo Status</label>
                              <select
                                className="w-full px-2 py-1 mt-1 bg-white border border-slate-200 rounded text-xs text-slate-800"
                                value={editStatus}
                                onChange={e => setEditStatus(e.target.value as 'Pending' | 'In Transit' | 'Delivered')}
                              >
                                <option value="Pending">Pending</option>
                                <option value="In Transit">In Transit</option>
                                <option value="Delivered">Delivered</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-400">Company Fee %</label>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                step={0.1}
                                className="w-full px-2 py-1 mt-1 bg-white border border-slate-200 rounded text-xs text-slate-850 font-mono"
                                value={editFeePercent}
                                onChange={e => setEditFeePercent(Number(e.target.value))}
                              />
                            </div>

                            <div className="col-span-full pt-4 mt-2 border-t border-slate-150 space-y-3">
                              <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Load Documents Management</span>
                                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={simulateNetworkError}
                                    onChange={(e) => setSimulateNetworkError(e.target.checked)}
                                    className="rounded text-blue-600 focus:ring-blue-500 w-3 h-3"
                                  />
                                  <span className="text-[9px] font-bold text-slate-600">Simulate Upload Failure</span>
                                </label>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FileUploadBox
                                  type="pod"
                                  uploaded={editPodUploaded}
                                  fileName={editPodFileName}
                                  base64={editPodBase64}
                                  onFileSelect={(file) => handleFileChange(file, 'pod', true)}
                                  onClear={() => {
                                    setEditPodUploaded(false);
                                    setEditPodFileName('');
                                    setEditPodBase64('');
                                    setEditPodError(null);
                                  }}
                                  label="Edit POD Proof of Delivery"
                                  isUploading={editPodUploading}
                                  progress={editPodProgress}
                                  error={editPodError}
                                  onClearError={() => setEditPodError(null)}
                                />

                                <FileUploadBox
                                  type="ratecon"
                                  uploaded={editRateConUploaded}
                                  fileName={editRateConFileName}
                                  base64={editRateConBase64}
                                  onFileSelect={(file) => handleFileChange(file, 'ratecon', true)}
                                  onClear={() => {
                                    setEditRateConUploaded(false);
                                    setEditRateConFileName('');
                                    setEditRateConBase64('');
                                    setEditRateConError(null);
                                  }}
                                  label="Edit Rate Confirmation (RC)"
                                  isUploading={editRateConUploading}
                                  progress={editRateConProgress}
                                  error={editRateConError}
                                  onClearError={() => setEditRateConError(null)}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                }

                const isSelected = selectedLoadIds.includes(l.id);
                return (
                  <tr key={l.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-blue-50/20' : ''}`}>
                    <td className="py-4 px-5 text-center w-12">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectRowToggle(l.id)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer accent-blue-600"
                      />
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900 font-display">#{l.loadNum}</div>
                      <div className="mt-1">
                        <AuditInfoBadge
                          createdBy={l.createdBy}
                          createdByName={l.createdByName}
                          createdAt={l.createdAt}
                          lastModifiedBy={l.lastModifiedBy}
                          lastModifiedByName={l.lastModifiedByName}
                          lastModifiedAt={l.lastModifiedAt}
                          compact={true}
                        />
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <div className="font-semibold text-slate-800">{driverObj?.name || 'Unassigned Driver'}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">Truck: {driverObj?.truckNum || 'N/A'}</div>
                      {(() => {
                        const carrierObj = carriers.find(c => c.id === l.carrierId) || (driverObj?.carrierId ? carriers.find(c => c.id === driverObj.carrierId) : null);
                        const carrierNameBadge = l.carrierName || carrierObj?.name || (driverObj?.workingUnderName && driverObj.workingUnderName !== 'Independent' ? driverObj.workingUnderName : null);
                        if (carrierNameBadge) {
                          return (
                            <div className="mt-1">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-150 rounded text-[9.5px] font-bold">
                                <Building className="h-2.5 w-2.5 text-blue-600 shrink-0" />
                                <span className="truncate max-w-[130px]">{carrierNameBadge}</span>
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </td>

                    <td className="py-4 px-5 whitespace-normal max-w-xs">
                      <div className="font-semibold text-slate-800">{l.broker}</div>
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                        <span className="bg-slate-100 text-slate-650 px-1.5 py-0.5 rounded font-medium">{l.pickupLocation}</span>
                        <span>&rarr;</span>
                        <span className="bg-slate-100 text-slate-650 px-1.5 py-0.5 rounded font-medium">{l.deliveryLocation}</span>
                      </div>
                      <div className="text-[10px] text-blue-600 font-semibold mt-1">Booked by: {dispatcherObj?.name || 'Self'}</div>
                    </td>

                    <td className="py-4 px-5 text-right font-mono font-semibold text-slate-800">
                      ${l.loadAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="font-mono font-bold text-emerald-600">
                        ${computedDriverPayout.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      {deductionsAccum > 0 && (
                        <div className="text-[10px] text-red-500 font-mono mt-0.5">
                          - ${deductionsAccum} deducts
                        </div>
                      )}
                      {(() => {
                        const linkedAdv = driverAdvances.filter(a => a.loadId === l.id || (a.loadNum && a.loadNum === l.loadNum));
                        return (
                          <div className="mt-1 flex flex-col items-end gap-1">
                            {linkedAdv.map(adv => (
                              <button
                                key={adv.id}
                                type="button"
                                onClick={() => setSelectedAdvanceProof(adv)}
                                className="inline-flex items-center gap-1 text-[9px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-bold cursor-pointer transition-all shadow-2xs"
                                title={`Sender: ${adv.senderName} ➔ Receiver: ${adv.receiverName} regarding Load #${l.loadNum}. Click to view proof.`}
                              >
                                <Coins className="h-3 w-3 text-emerald-600 shrink-0" />
                                <span>${adv.amount} ({adv.senderName} &rarr; {adv.receiverName})</span>
                                <span className="text-[8.5px] bg-emerald-200 text-emerald-950 px-1 rounded font-mono font-black">Proof 📄</span>
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => handleOpenNewAdvanceModal(l)}
                              className="text-[9px] text-slate-400 hover:text-emerald-600 font-semibold flex items-center gap-0.5 cursor-pointer transition-colors mt-0.5"
                              title="Issue Driver Cash Advance for this Load"
                            >
                              <span>+ Add Cash Advance</span>
                            </button>
                          </div>
                        );
                      })()}
                    </td>

                    <td className="py-4 px-5 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <button
                          type="button"
                          disabled={!l.podUploaded}
                          onClick={() => handleDocumentClick(l, 'pod')}
                          className={`text-[10px] py-1 px-2.5 rounded-lg flex items-center gap-1 transition-all ${
                            l.podUploaded
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold border border-emerald-150 cursor-pointer shadow-sm'
                              : 'bg-slate-50 text-slate-450 border border-slate-100 cursor-not-allowed opacity-60'
                          }`}
                          title={l.podUploaded ? `Click to preview/download ${l.podFileName || 'POD'}` : 'No POD document uploaded'}
                        >
                          <FileText className="h-3 w-3" />
                          <span>POD: {l.podUploaded ? '✓' : '✗'}</span>
                        </button>
                        
                        <button
                          type="button"
                          disabled={!l.rateConUploaded}
                          onClick={() => handleDocumentClick(l, 'ratecon')}
                          className={`text-[10px] py-1 px-2.5 rounded-lg flex items-center gap-1 transition-all ${
                            l.rateConUploaded
                              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold border border-blue-150 cursor-pointer shadow-sm'
                              : 'bg-slate-50 text-slate-450 border border-slate-100 cursor-not-allowed opacity-60'
                          }`}
                          title={l.rateConUploaded ? `Click to preview/download ${l.rateConFileName || 'Rate Confirmation'}` : 'No RC document uploaded'}
                        >
                          <FileCheck className="h-3 w-3" />
                          <span>RC: {l.rateConUploaded ? '✓' : '✗'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveVaultLoad(l)}
                          className="text-[10px] py-1 px-2.5 rounded-lg flex items-center gap-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-150 font-bold cursor-pointer shadow-sm transition-all"
                          title="View custom attachments for this load"
                        >
                          <Folder className="h-3 w-3 text-indigo-600" />
                          <span>Docs: {(l.loadDocuments || []).length}</span>
                        </button>
                      </div>
                    </td>

                    <td className="py-4 px-5 text-center">
                      <select
                        disabled={!isAdmin && !isManager}
                        value={l.status || 'Pending'}
                        onChange={e => onEdit(l.id, { status: e.target.value as 'Pending' | 'In Transit' | 'Delivered' })}
                        className={`px-2.5 py-1 text-xs font-bold rounded-xl border focus:outline-none transition-all shadow-2xs ${
                          (!isAdmin && !isManager) ? 'cursor-not-allowed opacity-75 ' : 'cursor-pointer '
                        }${
                          (l.status || 'Pending') === 'Delivered'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            : (l.status || 'Pending') === 'In Transit'
                            ? 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100'
                            : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </td>

                    <td className="py-4 px-5 text-center">
                      <button
                        disabled={!isAdmin}
                        onClick={() => {
                          if (!isAdmin) {
                            alert("Only an Administrator can toggle payment status.");
                            return;
                          }
                          const toggledStatus = l.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid';
                          onEdit(l.id, { paymentStatus: toggledStatus });
                        }}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all shadow-sm ${
                          !isAdmin ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                        } ${
                          l.paymentStatus === 'Paid'
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-rose-500 hover:bg-rose-600 text-white'
                        }`}
                        title={!isAdmin ? "Locked - Only Administrator can toggle payment status" : "Click to toggle payment status"}
                      >
                        {l.paymentStatus}
                      </button>
                    </td>

                    <td className="py-4 px-5 text-center whitespace-nowrap">
                      <div className="flex justify-center items-center gap-1.5">
                        <button
                          onClick={() => handleStartEdit(l)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs transition-colors cursor-pointer border border-blue-200 shadow-2xs active:scale-95"
                          title="Edit this load"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              if (confirm(`Delete load transaction #${l.loadNum}? This action requires Admin privileges.`)) {
                                onDelete(l.id);
                              }
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer border border-slate-200"
                            title="Delete Load"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}

                {visibleLoads.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-450 italic">
                      <AlertTriangle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <span>No booked load records matched filter criteria.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      );
    })()}
  </div>

      {/* Document Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100 shrink-0">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  {previewFile.name}
                </h3>
                <p className="text-[10px] text-slate-550 font-mono mt-0.5 uppercase">
                  {previewFile.type} DOCUMENT PREVIEW
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadBase64File(previewFile.base64, previewFile.name)}
                  className="p-2 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  title="Download File"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="p-2 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition-colors cursor-pointer"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content Container */}
            <div className="p-6 overflow-y-auto flex-1 flex items-center justify-center bg-slate-100/50">
              {previewFile.base64.startsWith('data:application/pdf') ? (
                <iframe
                  src={previewFile.base64}
                  className="w-full h-[60vh] rounded-lg border border-slate-200 shadow-inner bg-white"
                  title="PDF Viewer"
                />
              ) : previewFile.base64.startsWith('data:image/') ? (
                <div className="max-w-full max-h-[60vh] overflow-auto rounded-lg border border-slate-200 bg-white p-2">
                  <img
                    src={previewFile.base64}
                    alt={previewFile.name}
                    className="max-w-full h-auto mx-auto object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="text-center p-8 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800">Unsupported display format</p>
                    <p className="text-xs text-slate-500">This file cannot be rendered natively inside the browser, but you can download it directly.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadBase64File(previewFile.base64, previewFile.name)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    Download File Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Multi-Document Vault for activeVaultLoad */}
      {activeVaultLoad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200/80 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Folder className="h-4 w-4 text-blue-600" />
                  <span>Document Vault &amp; Attachments</span>
                </h3>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase">
                  LOAD REF: #{activeVaultLoad.loadNum} &bull; BROKER: {activeVaultLoad.broker}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveVaultLoad(null)}
                className="p-2 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition-colors cursor-pointer"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Content list & forms */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Load Documents List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Uploaded Cargo Documents
                  </span>
                  <span className="text-[10px] bg-slate-100 border text-slate-600 font-bold px-2 py-0.5 rounded-full">
                    {(activeVaultLoad.loadDocuments || []).length} Files Attached
                  </span>
                </div>

                {(activeVaultLoad.loadDocuments || []).length === 0 ? (
                  <div className="text-xs text-slate-400 italic bg-slate-50 p-6 rounded-xl border border-dashed border-slate-200 text-center">
                    No custom documents or pictures attached yet. Add cargo paperwork below.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(activeVaultLoad.loadDocuments || []).map(doc => (
                      <div key={doc.id} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs hover:border-blue-200 transition-colors shadow-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 font-sans">
                            <span 
                              onClick={() => {
                                // Trigger preview in standard preview modal
                                setPreviewZoom(1.0);
                                setPreviewRotation(0);
                                setPreviewFilter('standard');
                                setPreviewFile({
                                  base64: doc.base64,
                                  name: doc.name,
                                  type: doc.type === 'POD' ? 'pod' : 'ratecon',
                                  loadId: activeVaultLoad.id
                                });
                              }}
                              className="font-bold text-slate-800 hover:text-blue-600 hover:underline cursor-pointer truncate block"
                              title="Click to preview file"
                            >
                              {doc.name}
                            </span>
                            <div className="text-[9px] text-slate-400 mt-0.5">
                              {doc.type} &bull; {new Date(doc.uploadedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => downloadBase64File(doc.base64, doc.name)}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="Download document"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete ${doc.name}?`)) {
                                const updatedDocs = (activeVaultLoad.loadDocuments || []).filter(d => d.id !== doc.id);
                                onEdit(activeVaultLoad.id, { loadDocuments: updatedDocs });
                                // Also update our current local selection reference so changes show up instantly!
                                setActiveVaultLoad(prev => prev ? { ...prev, loadDocuments: updatedDocs } : null);
                              }
                            }}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                            title="Delete document"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upload Form inside Vault */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
                  Attach New File / Image
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Document Category</label>
                    <select 
                      id={`load_vault_type_select_${activeVaultLoad.id}`}
                      defaultValue="Other"
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:bg-white"
                    >
                      <option value="POD">Proof of Delivery (POD)</option>
                      <option value="RateCon">Rate Confirmation (RC)</option>
                      <option value="LumperReceipt">Lumper Receipt</option>
                      <option value="ScaleTicket">Scale Ticket</option>
                      <option value="FuelTicket">Fuel Ticket / Receipt</option>
                      <option value="Image">Photo Accent / Truck Image</option>
                      <option value="Other">Other Document / Image</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select File</label>
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
                        const selectEl = document.getElementById(`load_vault_type_select_${activeVaultLoad.id}`) as HTMLSelectElement;
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
                          const updatedDocs = [...(activeVaultLoad.loadDocuments || []), newDoc];
                          onEdit(activeVaultLoad.id, { loadDocuments: updatedDocs });
                          setActiveVaultLoad(prev => prev ? { ...prev, loadDocuments: updatedDocs } : null);
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 italic">Supports PDF, Word, Excel, Images, TXT (Max 2MB per file)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* CASH ADVANCES & TRANSFER PROOF VAULT MODAL  */}
      {/* ========================================== */}
      {showAdvancesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in duration-150 my-8">
            
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-lg font-bold font-display tracking-tight text-white">
                    Driver Cash Advances &amp; Transfer Proof Vault
                  </h2>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Record advances from Owner or Broker with image/PDF proof file upload &amp; auto-sync with loads
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAdvancesModal(false);
                  setIsAddingAdvanceForm(false);
                }}
                className="p-2 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-xl">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 font-mono">Total Cash Advances Issued</div>
                  <div className="text-2xl font-black text-emerald-900 mt-1 font-mono">
                    ${driverAdvances.reduce((sum, a) => sum + Number(a.amount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-0.5 font-medium">Auto-deducted from load payouts &amp; driver settlements</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Recorded Advance Transactions</div>
                  <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                    {driverAdvances.length} Records
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-medium">Linked to active loads &amp; drivers</div>
                </div>

                <div className="bg-blue-50/70 border border-blue-200/80 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-blue-800 font-mono">Proof Attachments</div>
                    <div className="text-2xl font-black text-blue-900 mt-1 font-mono">
                      {driverAdvances.filter(a => a.proofFileName || a.proofBase64).length} Files
                    </div>
                    <div className="text-[10px] text-blue-700 mt-0.5 font-medium">PDF &amp; Image receipts vault</div>
                  </div>
                  <ShieldCheck className="h-8 w-8 text-blue-500 opacity-80" />
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by driver, sender (e.g. E & G), load # (e.g. 160884) or notes..."
                    value={advFilterTerm}
                    onChange={e => setAdvFilterTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingAdvanceForm(prev => !prev)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all shadow-sm cursor-pointer shrink-0"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>{isAddingAdvanceForm ? 'Cancel Form' : 'Issue New Cash Advance'}</span>
                </button>
              </div>

              {/* ADD NEW ADVANCE FORM */}
              {isAddingAdvanceForm && (
                <form onSubmit={handleSaveAdvance} className="bg-emerald-50/30 border-2 border-emerald-300 p-5 rounded-2xl space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-emerald-700" />
                      <h3 className="font-bold text-slate-900 text-sm">Issue &amp; Sync Driver Cash Advance / Partial Transfer</h3>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                      Auto-Deducted from Linked Load
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* Sender Name */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Sender Name (Owner / Broker / Company) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. E & G Express"
                        value={advSenderName}
                        onChange={e => setAdvSenderName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-slate-800"
                      />
                    </div>

                    {/* Sender Type */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Sender Category
                      </label>
                      <select
                        value={advSenderType}
                        onChange={e => setAdvSenderType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-slate-800"
                      >
                        <option value="OWNER">OWNER (e.g. E &amp; G)</option>
                        <option value="BROKER">BROKER (e.g. TQL / Landstar)</option>
                        <option value="COMPANY">COMPANY (Dispatch Fee Account)</option>
                      </select>
                    </div>

                    {/* Receiver Driver */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Receiver (Driver Name) <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={advDriverId}
                        onChange={e => {
                          const drvId = e.target.value;
                          setAdvDriverId(drvId);
                          const drv = drivers.find(d => d.id === drvId);
                          if (drv) setAdvReceiverName(drv.name);
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-slate-800"
                      >
                        <option value="">Select Driver or Custom</option>
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>{d.name} (Truck #{d.truckNum})</option>
                        ))}
                      </select>
                    </div>

                    {/* Receiver Manual Text if not dropdown */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Receiver Name Output
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Frederick Lemont"
                        value={advReceiverName}
                        onChange={e => setAdvReceiverName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-slate-800"
                      />
                    </div>

                    {/* Link Reference Load Number */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Reference Load #
                      </label>
                      <select
                        value={advLoadId}
                        onChange={e => {
                          const lId = e.target.value;
                          setAdvLoadId(lId);
                          const matchedL = loads.find(l => l.id === lId);
                          if (matchedL) {
                            setAdvLoadNum(matchedL.loadNum);
                            setAdvBrokerName(matchedL.broker);
                            if (matchedL.driverId) {
                              setAdvDriverId(matchedL.driverId);
                              const drv = drivers.find(d => d.id === matchedL.driverId);
                              if (drv) setAdvReceiverName(drv.name);
                            }
                          }
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-slate-800"
                      >
                        <option value="">Select Load from Board or enter below</option>
                        {loads.map(l => (
                          <option key={l.id} value={l.id}>Load #{l.loadNum} - ${l.loadAmount} ({l.broker})</option>
                        ))}
                      </select>
                    </div>

                    {/* Manual Load # */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Load # (Number String)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 160884"
                        value={advLoadNum}
                        onChange={e => setAdvLoadNum(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    {/* Advance Amount */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Advance Amount ($) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        required
                        value={advAmount}
                        onChange={e => setAdvAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    {/* Transfer Method */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Payment Method
                      </label>
                      <select
                        value={advType}
                        onChange={e => setAdvType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-slate-800"
                      >
                        <option value="ZELLE">ZELLE Transfer</option>
                        <option value="WIRE">WIRE / Bank ACH</option>
                        <option value="CASH">CASH Advance</option>
                        <option value="CHECK">Owner Check</option>
                        <option value="EFS">EFS Fuel Card</option>
                        <option value="COMCHECK">Comcheck</option>
                      </select>
                    </div>

                    {/* Date */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Transfer Date
                      </label>
                      <input
                        type="date"
                        value={advDate}
                        onChange={e => setAdvDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Transfer Notes */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Transfer Reference / Notes
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Zelle ref #ZEL-99120 sent to driver bank account"
                        value={advNotes}
                        onChange={e => setAdvNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    {/* PROOF FILE UPLOAD (Image or PDF) */}
                    <div className="sm:col-span-4 bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-bold text-slate-800">
                          📄 Upload Money Transfer Proof (Image or PDF Proof)
                        </label>
                        {advProofFileName && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            ✓ {advProofFileName} ({advProofFileType.toUpperCase()})
                          </span>
                        )}
                      </div>

                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={handleProofFileUpload}
                        className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                      />
                      <p className="text-[10px] text-slate-400">
                        Upload screenshot of bank transfer, Zelle confirmation receipt, check photo, or signed PDF proof.
                      </p>
                    </div>

                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingAdvanceForm(false)}
                      className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Save &amp; Auto-Sync Deduction with Load</span>
                    </button>
                  </div>
                </form>
              )}

              {/* ADVANCES LIST TABLE */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left font-sans text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] font-mono border-b border-slate-200">
                      <th className="py-3 px-4">Sender &amp; Receiver</th>
                      <th className="py-3 px-4">Regarding Load #</th>
                      <th className="py-3 px-4 text-right">Advance Amount</th>
                      <th className="py-3 px-4">Method &amp; Date</th>
                      <th className="py-3 px-4">Notes &amp; Load Reconciliation</th>
                      <th className="py-3 px-4 text-center">Proof File</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {driverAdvances
                      .filter(a => {
                        if (!advFilterTerm) return true;
                        const term = advFilterTerm.toLowerCase();
                        return (
                          a.senderName.toLowerCase().includes(term) ||
                          a.receiverName.toLowerCase().includes(term) ||
                          (a.loadNum && a.loadNum.toLowerCase().includes(term)) ||
                          (a.notes && a.notes.toLowerCase().includes(term))
                        );
                      })
                      .map(adv => {
                        const matchedLoad = loads.find(l => l.id === adv.loadId || (adv.loadNum && l.loadNum === adv.loadNum));
                        const grossAmt = matchedLoad ? matchedLoad.loadAmount : 0;
                        const feePct = matchedLoad ? (matchedLoad.feePercent || 22) : 22;
                        const drvGrossShare = grossAmt ? Math.round((grossAmt * (100 - feePct)) / 100) : 0;
                        const remainingNet = drvGrossShare ? (drvGrossShare - adv.amount) : 0;

                        return (
                          <tr key={adv.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900 flex items-center gap-1">
                                <span className="text-slate-600">{adv.senderName}</span>
                                <ArrowRight className="h-3 w-3 text-emerald-600 shrink-0" />
                                <span className="text-emerald-800">{adv.receiverName}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                Category: {adv.senderType || 'OWNER'}
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-mono font-bold text-slate-800">
                                #{adv.loadNum || 'N/A'}
                              </div>
                              {matchedLoad && (
                                <div className="text-[10px] text-slate-500 font-sans">
                                  Broker: {matchedLoad.broker}
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                              ${adv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>

                            <td className="py-3 px-4">
                              <span className="inline-block px-2 py-0.5 text-[9.5px] font-bold font-mono bg-emerald-100 text-emerald-900 rounded">
                                {adv.advanceType || 'ZELLE'}
                              </span>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                {adv.date}
                              </div>
                            </td>

                            <td className="py-3 px-4 max-w-xs">
                              <div className="text-slate-800 font-medium text-[11px] truncate">
                                {adv.notes || 'No transfer notes'}
                              </div>
                              {matchedLoad && (
                                <div className="text-[10px] text-emerald-800 font-mono mt-1 font-semibold bg-emerald-50 p-1.5 rounded border border-emerald-150">
                                  Gross: ${grossAmt.toLocaleString()} | Drv Gross (78%): ${drvGrossShare.toLocaleString()} | Less Adv (-${adv.amount.toLocaleString()}) &rarr; <span className="font-black text-emerald-900">Remaining Net: ${remainingNet.toLocaleString()}</span>
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-4 text-center">
                              {adv.proofFileName || adv.proofBase64 ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedAdvanceProof(adv)}
                                  className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors shadow-2xs"
                                >
                                  <FileText className="h-3.5 w-3.5 text-indigo-600" />
                                  <span>View Proof 📄</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedAdvanceProof(adv);
                                  }}
                                  className="inline-flex items-center gap-1 text-[10px] bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 border border-slate-200 px-2 py-1 rounded-lg font-medium cursor-pointer transition-colors"
                                >
                                  <span>+ Receipt</span>
                                </button>
                              )}
                            </td>

                            <td className="py-3 px-4 text-center">
                              {onDeleteAdvance && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Delete advance transaction of $${adv.amount} for ${adv.receiverName}?`)) {
                                      onDeleteAdvance(adv.id);
                                    }
                                  }}
                                  className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                  title="Delete advance"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                    {driverAdvances.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-400 italic">
                          No cash advances recorded yet. Click "Issue New Cash Advance" above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex justify-between items-center text-xs">
              <div className="text-slate-500 font-mono text-[10px]">
                Auto-sync active: All advance payouts are automatically deducted from driver load statements.
              </div>
              <button
                type="button"
                onClick={() => setShowAdvancesModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close Vault
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ADVANCE PROOF RECEIPT CERTIFICATE MODAL    */}
      {/* ========================================== */}
      {selectedAdvanceProof && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div id="print_advance_proof_certificate" className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-150 my-8">
            
            {/* Header */}
            <div className="bg-slate-900 text-white p-6 flex justify-between items-start border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-400" />
                  <span className="font-bold text-sm tracking-wide text-slate-300 font-mono uppercase">E &amp; G Logistics / Company Payout Proof</span>
                </div>
                <h2 className="text-xl font-black font-display text-white mt-1">
                  Driver Cash Advance &amp; Transfer Certificate
                </h2>
                <div className="text-[10px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Verified Financial Record &bull; Ref #{selectedAdvanceProof.id.substring(0, 8).toUpperCase()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAdvanceProof(null)}
                  className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6">
              
              {/* Transfer Details Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                <div>
                  <div className="text-[9.5px] font-mono font-bold uppercase text-slate-400 tracking-wider">Sender Party</div>
                  <div className="font-black text-slate-900 text-sm mt-0.5">{selectedAdvanceProof.senderName}</div>
                  <div className="text-[10px] text-slate-500 font-medium mt-0.5">Category: {selectedAdvanceProof.senderType || 'OWNER'}</div>
                </div>

                <div>
                  <div className="text-[9.5px] font-mono font-bold uppercase text-slate-400 tracking-wider">Receiver Driver</div>
                  <div className="font-black text-emerald-900 text-sm mt-0.5">{selectedAdvanceProof.receiverName}</div>
                  <div className="text-[10px] text-slate-500 font-medium mt-0.5">Driver ID: {selectedAdvanceProof.driverId || 'DRV-RECORD'}</div>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <div className="text-[9.5px] font-mono font-bold uppercase text-slate-400 tracking-wider">Regarding Reference Load #</div>
                  <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">#{selectedAdvanceProof.loadNum || '160884'}</div>
                  {selectedAdvanceProof.brokerName && (
                    <div className="text-[10px] text-slate-500 mt-0.5">Broker: {selectedAdvanceProof.brokerName}</div>
                  )}
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <div className="text-[9.5px] font-mono font-bold uppercase text-slate-400 tracking-wider">Amount Granted</div>
                  <div className="font-mono font-black text-emerald-700 text-lg mt-0.5">
                    ${selectedAdvanceProof.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] font-mono text-slate-600 mt-0.5">
                    Method: {selectedAdvanceProof.advanceType || 'ZELLE'} &bull; Date: {selectedAdvanceProof.date}
                  </div>
                </div>
              </div>

              {/* Transfer Notes */}
              {selectedAdvanceProof.notes && (
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950 font-medium">
                  <span className="font-bold uppercase text-[9.5px] text-emerald-800 font-mono block mb-1">Transfer Notes &amp; Reference</span>
                  {selectedAdvanceProof.notes}
                </div>
              )}

              {/* Load Financial Reconciliation Table */}
              {(() => {
                const matchedLoad = loads.find(l => l.id === selectedAdvanceProof.loadId || (selectedAdvanceProof.loadNum && l.loadNum === selectedAdvanceProof.loadNum));
                if (!matchedLoad) return null;

                const gross = matchedLoad.loadAmount;
                const feePct = matchedLoad.feePercent || 22;
                const companyFee = Math.round((gross * feePct) / 100);
                const drvGrossShare = gross - companyFee;
                const remainingPayout = drvGrossShare - selectedAdvanceProof.amount;

                return (
                  <div className="border border-slate-200 rounded-xl overflow-hidden font-sans text-xs">
                    <div className="bg-slate-100 px-4 py-2 font-bold font-mono text-[10px] text-slate-600 uppercase border-b border-slate-200">
                      Load #{matchedLoad.loadNum} Financial Payout Breakdown
                    </div>
                    <div className="p-4 space-y-2 text-slate-800">
                      <div className="flex justify-between">
                        <span>Gross Load Amount ({matchedLoad.broker}):</span>
                        <span className="font-mono font-bold text-slate-900">${gross.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-blue-900">
                        <span>Less Company Fee ({feePct}%):</span>
                        <span className="font-mono">-${companyFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-900 border-t border-slate-200 pt-2">
                        <span>Driver Gross Share ({100 - feePct}%):</span>
                        <span className="font-mono">${drvGrossShare.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-rose-600 font-bold">
                        <span>Less Advance Transferred ({selectedAdvanceProof.senderName} &rarr; {selectedAdvanceProof.receiverName}):</span>
                        <span className="font-mono">-${selectedAdvanceProof.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-black text-slate-900 text-sm border-t-2 border-slate-300 pt-2 bg-emerald-50 -mx-4 -mb-4 p-4 mt-2">
                        <span>Remaining Driver Net Payout:</span>
                        <span className="font-mono text-emerald-700 text-base font-black">${remainingPayout.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Uploaded Proof File Viewer */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider">
                    Attached Money Transfer Proof File
                  </h4>
                  {selectedAdvanceProof.proofFileName && (
                    <span className="text-[10px] font-mono text-slate-600 font-semibold">
                      {selectedAdvanceProof.proofFileName}
                    </span>
                  )}
                </div>

                {selectedAdvanceProof.proofBase64 ? (
                  <div className="space-y-3">
                    {selectedAdvanceProof.proofFileType === 'image' || selectedAdvanceProof.proofBase64.startsWith('data:image/') ? (
                      <div className="text-center">
                        <img
                          src={selectedAdvanceProof.proofBase64}
                          alt="Money Transfer Proof"
                          className="max-h-80 mx-auto rounded-lg shadow-md border border-slate-300 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="text-center bg-white p-6 rounded-lg border border-slate-200 shadow-inner">
                        <FileText className="h-12 w-12 text-emerald-600 mx-auto mb-2" />
                        <div className="text-xs font-bold text-slate-800">{selectedAdvanceProof.proofFileName || 'Transfer Proof Document.pdf'}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">PDF Document Attachment</div>
                        <a
                          href={selectedAdvanceProof.proofBase64}
                          download={selectedAdvanceProof.proofFileName || `AdvanceProof_Load_${selectedAdvanceProof.loadNum || '160884'}.pdf`}
                          className="inline-flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg mt-3 transition-colors shadow-xs"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download PDF Proof</span>
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-lg border border-dashed border-slate-300 text-center space-y-2">
                    <ShieldCheck className="h-10 w-10 text-emerald-600 mx-auto" />
                    <div className="text-xs font-bold text-slate-800">Verified Direct Bank Transfer / Zelle Digital Confirmation</div>
                    <p className="text-[10px] text-slate-500 max-w-sm mx-auto">
                      Transfer of ${selectedAdvanceProof.amount} was completed on {selectedAdvanceProof.date} by {selectedAdvanceProof.senderName} to driver {selectedAdvanceProof.receiverName}.
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex justify-between items-center print:hidden">
              <span className="text-[10px] text-slate-400 font-mono">Official Company Advance Receipt</span>
              <button
                type="button"
                onClick={() => setSelectedAdvanceProof(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close Certificate
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
