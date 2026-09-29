/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Driver, Dispatcher, User, CarrierOrOwner, Load, DriverDocumentInfo } from '../types';
import { AuditInfoBadge } from './AuditInfoBadge';
import {
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  ShieldAlert,
  Award,
  Phone,
  Truck,
  Folder,
  Camera,
  Upload,
  FileSpreadsheet,
  PlusCircle,
  GripVertical,
  ArrowUpToLine,
  ChevronUp,
  ChevronDown,
  Zap,
  FileText,
  Ruler,
  Wrench,
  ShieldCheck,
  FileCheck,
  ExternalLink,
  TrendingUp,
  Target,
  DollarSign,
  Download,
  Eye,
  CheckSquare,
  Layers,
  Box,
  Key,
  Building,
  Briefcase
} from 'lucide-react';

interface DriverManagementProps {
  currentUser: User;
  drivers: Driver[];
  dispatchers: Dispatcher[];
  carriers: CarrierOrOwner[];
  loads?: Load[];
  onAdd: (driver: Omit<Driver, 'id'>) => void;
  onEdit: (id: string, updated: Partial<Driver>) => void;
  onDelete: (id: string) => void;
  onAddDispatcher?: (disp: any) => Promise<any> | any;
  onAddCarrier?: (carrier: any) => Promise<any> | any;
  onAddDriversBulk?: (drivers: (Omit<Driver, 'id'> & { id?: string })[]) => Promise<void> | void;
}

export default function DriverManagement({
  currentUser,
  drivers,
  dispatchers,
  carriers = [],
  loads = [],
  onAdd,
  onEdit,
  onDelete,
  onAddDispatcher,
  onAddCarrier,
  onAddDriversBulk
}: DriverManagementProps) {
  const isAdmin = currentUser.role === 'ADMIN';
  const isManager = currentUser.role === 'MANAGER';
  const onlyAssigned = currentUser.permissions?.onlyAssignedDrivers === true || (!isAdmin && !isManager && currentUser.permissions?.onlyAssignedDrivers !== false);
  const myDispatcher = dispatchers.find(d => d.username === currentUser.username || d.id === currentUser.dispatcherId);
  const myDispatcherId = myDispatcher?.id || '';

  // Grid/List State
  const [searchTerm, setSearchTerm] = useState('');
  const [carrierFilter, setCarrierFilter] = useState<string>('ALL');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [docModalDriver, setDocModalDriver] = useState<Driver | null>(null);

  // Bulk Importer States
  const [isImporting, setIsImporting] = useState(false);
  const [importRawText, setImportRawText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [parsedDrivers, setParsedDrivers] = useState<any[]>([]);

  // Form states of adding driver
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [truckNum, setTruckNum] = useState('');
  const [truckType, setTruckType] = useState('26ft Box truck');
  const [defaultPayoutPercent, setDefaultPayoutPercent] = useState<number>(8);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | 'TERMINATED'>('ACTIVE');
  const [assignedDispatcherId, setAssignedDispatcherId] = useState('');
  const [carrierId, setCarrierId] = useState('');
  const [customCarrierMode, setCustomCarrierMode] = useState<boolean>(false);
  const [editCustomCarrierMode, setEditCustomCarrierMode] = useState<boolean>(false);
  const [driverType, setDriverType] = useState<'OWNER_OPERATOR' | 'COMPANY_DRIVER'>('OWNER_OPERATOR');
  const [workingUnderName, setWorkingUnderName] = useState('');
  const [notes, setNotes] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');

  // Equipment & Specs (Add)
  const [truckSpecCategory, setTruckSpecCategory] = useState<'REGULAR' | 'BUSINESS' | 'COMMERCIAL'>('BUSINESS');
  const [insideHeight, setInsideHeight] = useState('102"');
  const [insideLength, setInsideLength] = useState('26 ft');
  const [insideWidth, setInsideWidth] = useState('102"');
  const [doorClearanceHeight, setDoorClearanceHeight] = useState('98"');
  const [doorClearanceWidth, setDoorClearanceWidth] = useState('92"');
  const [floorMaterial, setFloorMaterial] = useState<'WOOD_FLOOR' | 'ALUMINUM_FLOOR' | 'STEEL_FLOOR' | 'COMPOSITE'>('ALUMINUM_FLOOR');

  // Tools & Accessories (Add)
  const [hasLiftgate, setHasLiftgate] = useState(true);
  const [liftgateType, setLiftgateType] = useState('Tuckaway');
  const [hasPalletJack, setHasPalletJack] = useState(true);
  const [palletJackType, setPalletJackType] = useState<'MANUAL' | 'ELECTRIC' | 'BOTH' | 'NONE'>('ELECTRIC');
  const [hasETracks, setHasETracks] = useState(true);
  const [eTrackDetails, setETrackDetails] = useState('2 Rows Full Length');
  const [hasRatchetStraps, setHasRatchetStraps] = useState(true);
  const [ratchetStrapsCount, setRatchetStrapsCount] = useState<number>(10);
  const [hasLoadBars, setHasLoadBars] = useState(false);
  const [loadBarsCount, setLoadBarsCount] = useState<number>(2);
  const [hasMovingBlankets, setHasMovingBlankets] = useState(false);
  const [movingBlanketsCount, setMovingBlanketsCount] = useState<number>(20);

  // Vehicle ID & Ownership (Add)
  const [vinNumber, setVinNumber] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [ownershipType, setOwnershipType] = useState<'OWNED' | 'RENTAL_LEASED'>('RENTAL_LEASED');
  const [rentalCompany, setRentalCompany] = useState('Ryder');
  const [rentalLeaseDoc, setRentalLeaseDoc] = useState<DriverDocumentInfo | undefined>(undefined);
  const [registrationDoc, setRegistrationDoc] = useState<DriverDocumentInfo | undefined>(undefined);

  // Performance Goals (Add)
  const [dailyTargetUSD, setDailyTargetUSD] = useState<number>(600);
  const [weeklyTargetUSD, setWeeklyTargetUSD] = useState<number>(3500);
  const [monthlyTargetUSD, setMonthlyTargetUSD] = useState<number>(14000);
  const [targetRPM, setTargetRPM] = useState<number>(2.50);

  // Form states of editing driver
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editTruckNum, setEditTruckNum] = useState('');
  const [editTruckType, setEditTruckType] = useState('');
  const [editDefaultPayoutPercent, setEditDefaultPayoutPercent] = useState<number>(8);
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE' | 'TERMINATED'>('ACTIVE');
  const [editAssignedDispatcherId, setEditAssignedDispatcherId] = useState('');
  const [editCarrierId, setEditCarrierId] = useState('');
  const [editDriverType, setEditDriverType] = useState<'OWNER_OPERATOR' | 'COMPANY_DRIVER'>('OWNER_OPERATOR');
  const [editWorkingUnderName, setEditWorkingUnderName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editProfilePhoto, setEditProfilePhoto] = useState('');

  // Equipment & Specs (Edit)
  const [editTruckSpecCategory, setEditTruckSpecCategory] = useState<'REGULAR' | 'BUSINESS' | 'COMMERCIAL'>('REGULAR');
  const [editInsideHeight, setEditInsideHeight] = useState('102"');
  const [editInsideLength, setEditInsideLength] = useState('26 ft');
  const [editInsideWidth, setEditInsideWidth] = useState('102"');
  const [editDoorClearanceHeight, setEditDoorClearanceHeight] = useState('98"');
  const [editDoorClearanceWidth, setEditDoorClearanceWidth] = useState('92"');
  const [editFloorMaterial, setEditFloorMaterial] = useState<'WOOD_FLOOR' | 'ALUMINUM_FLOOR' | 'STEEL_FLOOR' | 'COMPOSITE'>('WOOD_FLOOR');

  // Tools & Accessories (Edit)
  const [editHasLiftgate, setEditHasLiftgate] = useState(false);
  const [editLiftgateType, setEditLiftgateType] = useState('Tuckaway');
  const [editHasPalletJack, setEditHasPalletJack] = useState(false);
  const [editPalletJackType, setEditPalletJackType] = useState<'MANUAL' | 'ELECTRIC' | 'BOTH' | 'NONE'>('MANUAL');
  const [editHasETracks, setEditHasETracks] = useState(false);
  const [editETrackDetails, setEditETrackDetails] = useState('2 Rows Full Length');
  const [editHasRatchetStraps, setEditHasRatchetStraps] = useState(false);
  const [editRatchetStrapsCount, setEditRatchetStrapsCount] = useState<number>(10);
  const [editHasLoadBars, setEditHasLoadBars] = useState(false);
  const [editLoadBarsCount, setEditLoadBarsCount] = useState<number>(2);
  const [editHasMovingBlankets, setEditHasMovingBlankets] = useState(false);
  const [editMovingBlanketsCount, setEditMovingBlanketsCount] = useState<number>(20);

  // Vehicle ID & Ownership (Edit)
  const [editVinNumber, setEditVinNumber] = useState('');
  const [editLicensePlate, setEditLicensePlate] = useState('');
  const [editOwnershipType, setEditOwnershipType] = useState<'OWNED' | 'RENTAL_LEASED'>('OWNED');
  const [editRentalCompany, setEditRentalCompany] = useState('');
  const [editRentalLeaseDoc, setEditRentalLeaseDoc] = useState<DriverDocumentInfo | undefined>(undefined);
  const [editRegistrationDoc, setEditRegistrationDoc] = useState<DriverDocumentInfo | undefined>(undefined);

  // Performance Goals (Edit)
  const [editDailyTargetUSD, setEditDailyTargetUSD] = useState<number>(600);
  const [editWeeklyTargetUSD, setEditWeeklyTargetUSD] = useState<number>(3500);
  const [editMonthlyTargetUSD, setEditMonthlyTargetUSD] = useState<number>(14000);
  const [editTargetRPM, setEditTargetRPM] = useState<number>(2.50);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) {
          setEditProfilePhoto(reader.result as string);
        } else {
          setProfilePhoto(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    docType: 'REGISTRATION' | 'RENTAL_LEASE',
    isEdit: boolean
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const docData: DriverDocumentInfo = {
        name: file.name,
        base64: reader.result as string,
        uploadedAt: new Date().toISOString().split('T')[0]
      };
      if (isEdit) {
        if (docType === 'REGISTRATION') setEditRegistrationDoc(docData);
        else setEditRentalLeaseDoc(docData);
      } else {
        if (docType === 'REGISTRATION') setRegistrationDoc(docData);
        else setRentalLeaseDoc(docData);
      }
    };
    reader.readAsDataURL(file);
  };

  // Quick Preset Applicator
  const applyPreset = (preset: '26ft_REGULAR' | '26ft_BUSINESS' | '53ft_DRYVAN' | '53ft_REEFER', isEdit: boolean) => {
    if (preset === '26ft_REGULAR') {
      if (isEdit) {
        setEditTruckType('26ft Box truck');
        setEditTruckSpecCategory('REGULAR');
        setEditInsideLength('26 ft');
        setEditInsideHeight('96"');
        setEditInsideWidth('96"');
        setEditDoorClearanceHeight('92"');
        setEditDoorClearanceWidth('88"');
        setEditFloorMaterial('WOOD_FLOOR');
        setEditHasLiftgate(true);
        setEditLiftgateType('Tuckaway');
        setEditHasPalletJack(true);
        setEditPalletJackType('MANUAL');
        setEditHasETracks(true);
        setEditETrackDetails('2 Rows Full Length');
        setEditHasRatchetStraps(true);
        setEditRatchetStrapsCount(10);
      } else {
        setTruckType('26ft Box truck');
        setTruckSpecCategory('REGULAR');
        setInsideLength('26 ft');
        setInsideHeight('96"');
        setInsideWidth('96"');
        setDoorClearanceHeight('92"');
        setDoorClearanceWidth('88"');
        setFloorMaterial('WOOD_FLOOR');
        setHasLiftgate(true);
        setLiftgateType('Tuckaway');
        setHasPalletJack(true);
        setPalletJackType('MANUAL');
        setHasETracks(true);
        setETrackDetails('2 Rows Full Length');
        setHasRatchetStraps(true);
        setRatchetStrapsCount(10);
      }
    } else if (preset === '26ft_BUSINESS') {
      if (isEdit) {
        setEditTruckType('26ft Box truck');
        setEditTruckSpecCategory('BUSINESS');
        setEditInsideLength('26 ft');
        setEditInsideHeight('102"');
        setEditInsideWidth('102"');
        setEditDoorClearanceHeight('98"');
        setEditDoorClearanceWidth('94"');
        setEditFloorMaterial('ALUMINUM_FLOOR');
        setEditHasLiftgate(true);
        setEditLiftgateType('Railgate');
        setEditHasPalletJack(true);
        setEditPalletJackType('ELECTRIC');
        setEditHasETracks(true);
        setEditETrackDetails('2 Rows Heavy Duty');
        setEditHasRatchetStraps(true);
        setEditRatchetStrapsCount(12);
      } else {
        setTruckType('26ft Box truck');
        setTruckSpecCategory('BUSINESS');
        setInsideLength('26 ft');
        setInsideHeight('102"');
        setInsideWidth('102"');
        setDoorClearanceHeight('98"');
        setDoorClearanceWidth('94"');
        setFloorMaterial('ALUMINUM_FLOOR');
        setHasLiftgate(true);
        setLiftgateType('Railgate');
        setHasPalletJack(true);
        setPalletJackType('ELECTRIC');
        setHasETracks(true);
        setETrackDetails('2 Rows Heavy Duty');
        setHasRatchetStraps(true);
        setRatchetStrapsCount(12);
      }
    } else if (preset === '53ft_DRYVAN') {
      if (isEdit) {
        setEditTruckType('53ft dry van');
        setEditTruckSpecCategory('COMMERCIAL');
        setEditInsideLength('53 ft');
        setEditInsideHeight('110"');
        setEditInsideWidth('102"');
        setEditDoorClearanceHeight('108"');
        setEditDoorClearanceWidth('98"');
        setEditFloorMaterial('WOOD_FLOOR');
        setEditHasLiftgate(false);
        setEditHasPalletJack(false);
        setEditHasETracks(true);
        setEditHasLoadBars(true);
        setEditLoadBarsCount(4);
        setEditHasRatchetStraps(true);
        setEditRatchetStrapsCount(16);
      } else {
        setTruckType('53ft dry van');
        setTruckSpecCategory('COMMERCIAL');
        setInsideLength('53 ft');
        setInsideHeight('110"');
        setInsideWidth('102"');
        setDoorClearanceHeight('108"');
        setDoorClearanceWidth('98"');
        setFloorMaterial('WOOD_FLOOR');
        setHasLiftgate(false);
        setHasPalletJack(false);
        setHasETracks(true);
        setHasLoadBars(true);
        setLoadBarsCount(4);
        setHasRatchetStraps(true);
        setRatchetStrapsCount(16);
      }
    } else if (preset === '53ft_REEFER') {
      if (isEdit) {
        setEditTruckType('Reefer');
        setEditTruckSpecCategory('COMMERCIAL');
        setEditInsideLength('53 ft');
        setEditInsideHeight('104"');
        setEditInsideWidth('100"');
        setEditDoorClearanceHeight('102"');
        setEditDoorClearanceWidth('96"');
        setEditFloorMaterial('ALUMINUM_FLOOR');
        setEditHasLiftgate(false);
        setEditHasPalletJack(false);
        setEditHasETracks(true);
        setEditHasLoadBars(true);
        setEditLoadBarsCount(4);
      } else {
        setTruckType('Reefer');
        setTruckSpecCategory('COMMERCIAL');
        setInsideLength('53 ft');
        setInsideHeight('104"');
        setInsideWidth('100"');
        setDoorClearanceHeight('102"');
        setDoorClearanceWidth('96"');
        setFloorMaterial('ALUMINUM_FLOOR');
        setHasLiftgate(false);
        setHasPalletJack(false);
        setHasETracks(true);
        setHasLoadBars(true);
        setLoadBarsCount(4);
      }
    }
  };

  const [autoTopActive, setAutoTopActive] = useState(true);
  const [draggedDriverId, setDraggedDriverId] = useState<string | null>(null);

  // Helper to calculate real-time driver performance
  const calculateDriverPerformance = (driverId: string) => {
    if (!loads || loads.length === 0) {
      return { todayGross: 0, weekGross: 0, monthGross: 0, totalLoadsCount: 0 };
    }
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

    const driverLoads = loads.filter(l => l.driverId === driverId);

    let todayGross = 0;
    let weekGross = 0;
    let monthGross = 0;

    driverLoads.forEach(l => {
      const loadDate = l.pickupDate || l.deliveryDate || '';
      if (loadDate === todayStr) {
        todayGross += l.loadAmount || 0;
      }
      if (loadDate >= startOfWeekStr && loadDate <= todayStr) {
        weekGross += l.loadAmount || 0;
      }
      if (loadDate.startsWith(currentMonthStr)) {
        monthGross += l.loadAmount || 0;
      }
    });

    return {
      todayGross,
      weekGross,
      monthGross,
      totalLoadsCount: driverLoads.length
    };
  };

  // Filter list
  const filteredDrivers = drivers.filter(d => {
    if (onlyAssigned && myDispatcherId && d.assignedDispatcherId !== myDispatcherId) {
      return false;
    }

    if (carrierFilter !== 'ALL') {
      if (carrierFilter === 'INDEPENDENT') {
        if (d.carrierId || (d.workingUnderName && d.workingUnderName.toLowerCase() !== 'independent' && d.workingUnderName.trim() !== '')) {
          return false;
        }
      } else {
        const matchesCarrier = d.carrierId === carrierFilter || (d.workingUnderName && d.workingUnderName.toLowerCase() === carrierFilter.toLowerCase());
        if (!matchesCarrier) return false;
      }
    }

    const carrierObj = carriers.find(c => c.id === d.carrierId);
    const carrierNameStr = carrierObj?.name || d.workingUnderName || '';

    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.truckNum.includes(searchTerm) ||
      d.truckType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      carrierNameStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.vinNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.licensePlate || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const sortedDrivers = [...filteredDrivers].sort((a, b) => {
    if (autoTopActive) {
      if (a.status === 'ACTIVE' && b.status === 'INACTIVE') return -1;
      if (a.status === 'INACTIVE' && b.status === 'ACTIVE') return 1;
    }
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });

  const handleMoveDriver = (driverId: string, direction: 'TOP' | 'UP' | 'DOWN') => {
    const currentList = [...sortedDrivers];
    const currentIndex = currentList.findIndex(d => d.id === driverId);
    if (currentIndex === -1) return;

    if (direction === 'TOP') {
      const target = currentList.splice(currentIndex, 1)[0];
      currentList.unshift(target);
    } else if (direction === 'UP' && currentIndex > 0) {
      const temp = currentList[currentIndex];
      currentList[currentIndex] = currentList[currentIndex - 1];
      currentList[currentIndex - 1] = temp;
    } else if (direction === 'DOWN' && currentIndex < currentList.length - 1) {
      const temp = currentList[currentIndex];
      currentList[currentIndex] = currentList[currentIndex + 1];
      currentList[currentIndex + 1] = temp;
    }

    currentList.forEach((dr, idx) => {
      onEdit(dr.id, { sortOrder: idx });
    });
  };

  const handleDropDriver = (targetDriverId: string) => {
    if (!draggedDriverId || draggedDriverId === targetDriverId) return;

    const currentList = [...sortedDrivers];
    const fromIndex = currentList.findIndex(d => d.id === draggedDriverId);
    const toIndex = currentList.findIndex(d => d.id === targetDriverId);

    if (fromIndex !== -1 && toIndex !== -1) {
      const [moved] = currentList.splice(fromIndex, 1);
      currentList.splice(toIndex, 0, moved);

      currentList.forEach((dr, idx) => {
        onEdit(dr.id, { sortOrder: idx });
      });
    }
    setDraggedDriverId(null);
  };

  const handleStartEdit = (d: Driver) => {
    setEditingId(d.id);
    setEditName(d.name);
    setEditPhone(d.phone);
    setEditTruckNum(d.truckNum);
    setEditTruckType(d.truckType);
    setEditDefaultPayoutPercent(d.defaultPayoutPercent);
    setEditStatus(d.status);
    setEditAssignedDispatcherId(d.assignedDispatcherId);
    setEditCarrierId(d.carrierId || '');
    setEditCustomCarrierMode(!d.carrierId && Boolean(d.workingUnderName && d.workingUnderName !== 'Independent'));
    setEditDriverType(d.driverType || 'OWNER_OPERATOR');
    setEditWorkingUnderName(d.workingUnderName || '');
    setEditNotes(d.notes || '');
    setEditProfilePhoto(d.profilePhoto || '');

    // Equipment Specs
    setEditTruckSpecCategory(d.truckSpecCategory || 'REGULAR');
    setEditInsideHeight(d.insideHeight || '102"');
    setEditInsideLength(d.insideLength || '26 ft');
    setEditInsideWidth(d.insideWidth || '102"');
    setEditDoorClearanceHeight(d.doorClearanceHeight || '98"');
    setEditDoorClearanceWidth(d.doorClearanceWidth || '92"');
    setEditFloorMaterial(d.floorMaterial || 'WOOD_FLOOR');

    // Tools
    setEditHasLiftgate(d.hasLiftgate ?? false);
    setEditLiftgateType(d.liftgateType || 'Tuckaway');
    setEditHasPalletJack(d.hasPalletJack ?? false);
    setEditPalletJackType(d.palletJackType || 'MANUAL');
    setEditHasETracks(d.hasETracks ?? false);
    setEditETrackDetails(d.eTrackDetails || '2 Rows Full Length');
    setEditHasRatchetStraps(d.hasRatchetStraps ?? false);
    setEditRatchetStrapsCount(d.ratchetStrapsCount ?? 10);
    setEditHasLoadBars(d.hasLoadBars ?? false);
    setEditLoadBarsCount(d.loadBarsCount ?? 2);
    setEditHasMovingBlankets(d.hasMovingBlankets ?? false);
    setEditMovingBlanketsCount(d.movingBlanketsCount ?? 20);

    // Vehicle ID & Ownership
    setEditVinNumber(d.vinNumber || '');
    setEditLicensePlate(d.licensePlate || '');
    setEditOwnershipType(d.ownershipType || 'OWNED');
    setEditRentalCompany(d.rentalCompany || '');
    setEditRentalLeaseDoc(d.rentalLeaseDoc);
    setEditRegistrationDoc(d.registrationDoc);

    // Performance Goals
    setEditDailyTargetUSD(d.dailyTargetUSD ?? 600);
    setEditWeeklyTargetUSD(d.weeklyTargetUSD ?? 3500);
    setEditMonthlyTargetUSD(d.monthlyTargetUSD ?? 14000);
    setEditTargetRPM(d.targetRPM ?? 2.50);
  };

  const handleSaveEdit = (id: string) => {
    onEdit(id, {
      name: editName,
      phone: editPhone,
      truckNum: editTruckNum,
      truckType: editTruckType,
      defaultPayoutPercent: editDefaultPayoutPercent,
      status: editStatus,
      assignedDispatcherId: editAssignedDispatcherId,
      carrierId: editCarrierId || undefined,
      driverType: editDriverType,
      workingUnderName: editWorkingUnderName,
      notes: editNotes,
      profilePhoto: editProfilePhoto,

      // Equipment Specs
      truckSpecCategory: editTruckSpecCategory,
      insideHeight: editInsideHeight,
      insideLength: editInsideLength,
      insideWidth: editInsideWidth,
      doorClearanceHeight: editDoorClearanceHeight,
      doorClearanceWidth: editDoorClearanceWidth,
      floorMaterial: editFloorMaterial,

      // Tools
      hasLiftgate: editHasLiftgate,
      liftgateType: editLiftgateType,
      hasPalletJack: editHasPalletJack,
      palletJackType: editPalletJackType,
      hasETracks: editHasETracks,
      eTrackDetails: editETrackDetails,
      hasRatchetStraps: editHasRatchetStraps,
      ratchetStrapsCount: editRatchetStrapsCount,
      hasLoadBars: editHasLoadBars,
      loadBarsCount: editLoadBarsCount,
      hasMovingBlankets: editHasMovingBlankets,
      movingBlanketsCount: editMovingBlanketsCount,

      // Vehicle ID & Ownership
      vinNumber: editVinNumber,
      licensePlate: editLicensePlate,
      ownershipType: editOwnershipType,
      rentalCompany: editRentalCompany,
      rentalLeaseDoc: editRentalLeaseDoc,
      registrationDoc: editRegistrationDoc,

      // Goals
      dailyTargetUSD: editDailyTargetUSD,
      weeklyTargetUSD: editWeeklyTargetUSD,
      monthlyTargetUSD: editMonthlyTargetUSD,
      targetRPM: editTargetRPM
    });
    setEditingId(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const dispatcherId = isAdmin ? assignedDispatcherId : myDispatcherId;

    onAdd({
      name,
      phone,
      truckNum,
      truckType,
      defaultPayoutPercent,
      status,
      assignedDispatcherId: dispatcherId,
      carrierId: carrierId || undefined,
      driverType,
      workingUnderName,
      notes,
      profilePhoto,

      // Equipment Specs
      truckSpecCategory,
      insideHeight,
      insideLength,
      insideWidth,
      doorClearanceHeight,
      doorClearanceWidth,
      floorMaterial,

      // Tools
      hasLiftgate,
      liftgateType,
      hasPalletJack,
      palletJackType,
      hasETracks,
      eTrackDetails,
      hasRatchetStraps,
      ratchetStrapsCount,
      hasLoadBars,
      loadBarsCount,
      hasMovingBlankets,
      movingBlanketsCount,

      // Vehicle ID & Ownership
      vinNumber,
      licensePlate,
      ownershipType,
      rentalCompany,
      rentalLeaseDoc,
      registrationDoc,

      // Goals
      dailyTargetUSD,
      weeklyTargetUSD,
      monthlyTargetUSD,
      targetRPM
    });

    // Reset Form
    setIsAdding(false);
    setName('');
    setPhone('');
    setTruckNum('');
    setTruckType('26ft Box truck');
    setDefaultPayoutPercent(8);
    setNotes('');
    setProfilePhoto('');
    setVinNumber('');
    setLicensePlate('');
  };

  const parseDriversCSVorTSV = (text: string) => {
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
        setImportError("No parseable rows found.");
        return;
      }

      const firstRow = parsedRows[0];
      let hasHeader = false;
      let nameColIdx = -1;
      let phoneColIdx = -1;
      let truckNumColIdx = -1;
      let truckTypeColIdx = -1;
      let payoutColIdx = -1;
      let typeColIdx = -1;
      let statusColIdx = -1;

      firstRow.forEach((col, idx) => {
        const val = col.toLowerCase().replace(/[\s#_]/g, '');
        if (val.includes('name') || val.includes('drivername') || val.includes('fullname')) {
          nameColIdx = idx;
          hasHeader = true;
        } else if (val.includes('phone') || val.includes('mobile') || val.includes('contact') || val.includes('cell')) {
          phoneColIdx = idx;
          hasHeader = true;
        } else if (val.includes('trucknum') || val.includes('trucknumber') || val.includes('truck#') || val.includes('vehicle')) {
          truckNumColIdx = idx;
          hasHeader = true;
        } else if (val.includes('trucktype') || val.includes('equipment') || val.includes('trailertype')) {
          truckTypeColIdx = idx;
          hasHeader = true;
        } else if (val.includes('payout') || val.includes('rate') || val.includes('fee') || val.includes('percent')) {
          payoutColIdx = idx;
          hasHeader = true;
        } else if (val.includes('drivertype') || val.includes('type') || val.includes('category')) {
          typeColIdx = idx;
          hasHeader = true;
        } else if (val.includes('status') || val.includes('active')) {
          statusColIdx = idx;
          hasHeader = true;
        }
      });

      const dataRows = hasHeader ? parsedRows.slice(1) : parsedRows;
      const drafts: any[] = [];
      dataRows.forEach((row) => {
        const rawName = nameColIdx !== -1 && row[nameColIdx] ? row[nameColIdx].trim() : '';
        if (!rawName) return;

        const rawPhone = phoneColIdx !== -1 && row[phoneColIdx] ? row[phoneColIdx].trim() : '(555) 555-5555';
        const rawTruck = truckNumColIdx !== -1 && row[truckNumColIdx] ? row[truckNumColIdx].trim() : 'TBD';
        const rawTruckType = truckTypeColIdx !== -1 && row[truckTypeColIdx] ? row[truckTypeColIdx].trim() : '26ft Box truck';
        const rawPayout = payoutColIdx !== -1 && row[payoutColIdx] ? row[payoutColIdx].replace(/[\$%]/g, '').trim() : '8';
        const rawType = typeColIdx !== -1 && row[typeColIdx] ? row[typeColIdx].trim().toUpperCase() : 'OWNER_OPERATOR';
        const rawStatus = statusColIdx !== -1 && row[statusColIdx] ? row[statusColIdx].trim().toUpperCase() : 'ACTIVE';

        drafts.push({
          name: rawName,
          phone: rawPhone,
          truckNum: rawTruck,
          truckType: rawTruckType,
          defaultPayoutPercent: parseFloat(rawPayout) || 8,
          driverType: rawType === 'COMPANY_DRIVER' ? 'COMPANY_DRIVER' : 'OWNER_OPERATOR',
          status: rawStatus === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
          assignedDispatcherId: myDispatcherId || dispatchers[0]?.id || '',
          carrierId: '',
          workingUnderName: '',
          notes: 'Imported via CSV spreadsheet.'
        });
      });

      setParsedDrivers(drafts);
    } catch (err: any) {
      setImportError(`CSV Parse Error: ${err.message}`);
    }
  };

  const handleDriversFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseDriversCSVorTSV(text);
    };
    reader.onerror = () => {
      setImportError("Failed to read selected file.");
    };
    reader.readAsText(file);
  };

  const handleSaveDriversBulkImport = async () => {
    if (parsedDrivers.length === 0) return;
    if (onAddDriversBulk) {
      await onAddDriversBulk(parsedDrivers);
    } else {
      for (const draft of parsedDrivers) {
        await onAdd(draft);
      }
    }
    setParsedDrivers([]);
    setImportRawText('');
    setIsImporting(false);
  };

  return (
    <div id="driver_management" className="space-y-6">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 font-display flex items-center gap-2">
            <Truck className="h-6 w-6 text-blue-600" />
            <span>Driver Fleet &amp; Equipment Command Console</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete vehicle spec management, 26ft Box Truck dims (Regular vs Business), tools vault, lease &amp; registration cards, and multi-seat goals syncing.
          </p>
        </div>

        {/* Action Triggers */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setIsImporting(prev => !prev);
              setIsAdding(false);
              setEditingId(null);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-all border border-slate-200 cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>{isImporting ? 'Close Importer' : 'Import Drivers (CSV)'}</span>
          </button>
          <button
            onClick={() => {
              setIsAdding(prev => !prev);
              setIsImporting(false);
              setEditingId(null);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-blue-500/10 cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>{isAdding ? 'Close Wizard' : 'Add New Driver & Truck'}</span>
          </button>
        </div>
      </div>

      {/* Bulk Importer */}
      {isImporting && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-lg space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>Bulk Drivers Spreadsheet Importer</span>
            </h3>
            <button
              onClick={() => {
                setIsImporting(false);
                setParsedDrivers([]);
                setImportRawText('');
              }}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Option 1: Paste spreadsheet rows</h4>
              <textarea
                rows={6}
                placeholder="Paste columns here...&#10;e.g. Chris Owens	(312) 555-0192	101	26ft Box truck	8%	OWNER_OPERATOR	ACTIVE"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-850 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={importRawText}
                onChange={e => setImportRawText(e.target.value)}
              />
              <button
                type="button"
                onClick={() => parseDriversCSVorTSV(importRawText)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-all shadow-sm cursor-pointer"
              >
                Analyze &amp; Parse Pasted Text
              </button>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Option 2: Upload CSV File</h4>
              <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-6 hover:border-blue-400 hover:bg-slate-50/50 flex flex-col items-center justify-center text-center cursor-pointer min-h-[160px]">
                <input
                  type="file"
                  accept=".csv,.txt,.tsv"
                  onChange={handleDriversFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="h-8 w-8 text-slate-400 mb-2" />
                <span className="text-xs font-semibold text-slate-600">Click or drag CSV file here</span>
              </div>
            </div>
          </div>

          {importError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          {parsedDrivers.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Parsed Preview ({parsedDrivers.length} Drivers Found)
                </span>
                <button
                  type="button"
                  onClick={handleSaveDriversBulkImport}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Confirm &amp; Import {parsedDrivers.length} Drivers</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Creation Wizard Form */}
      {isAdding && (
        <form onSubmit={handleAddSubmit} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-lg space-y-6 max-w-4xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              <span>Onboard New Driver &amp; Truck Specs</span>
            </h3>

            {/* Presets Bar */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Quick Presets:</span>
              <button
                type="button"
                onClick={() => applyPreset('26ft_REGULAR', false)}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
              >
                🚚 26ft Regular
              </button>
              <button
                type="button"
                onClick={() => applyPreset('26ft_BUSINESS', false)}
                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
              >
                🏬 26ft Business Spec
              </button>
              <button
                type="button"
                onClick={() => applyPreset('53ft_DRYVAN', false)}
                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
              >
                🏢 53ft Dry Van
              </button>
              <button
                type="button"
                onClick={() => applyPreset('53ft_REEFER', false)}
                className="px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-200 rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
              >
                ❄️ 53ft Reefer
              </button>
            </div>
          </div>

          {/* Section 1: Basic Profile */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
              <UserPlus className="h-3.5 w-3.5 text-blue-600" />
              <span>1. Basic Profile &amp; Contact</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Driver Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chris Owens"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. (312) 555-0192"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Truck # *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 101"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                  value={truckNum}
                  onChange={e => setTruckNum(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Equipment Category</label>
                <select
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                  value={truckType}
                  onChange={e => setTruckType(e.target.value)}
                >
                  <option value="26ft Box truck">26ft Box truck</option>
                  <option value="53ft dry van">53ft dry van</option>
                  <option value="Dry Van">Dry Van</option>
                  <option value="Reefer">Reefer</option>
                  <option value="Flatbed">Flatbed</option>
                  <option value="Power Only">Power Only</option>
                  <option value="Hot Shot">Hot Shot</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Company Dispatch Fee %</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800 font-mono"
                    value={defaultPayoutPercent}
                    onChange={e => setDefaultPayoutPercent(Number(e.target.value))}
                  />
                  <span className="absolute right-3.5 top-2 text-slate-400 font-semibold text-xs">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Driver Role / Type</label>
                <select
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                  value={driverType}
                  onChange={e => setDriverType(e.target.value as 'OWNER_OPERATOR' | 'COMPANY_DRIVER')}
                >
                  <option value="OWNER_OPERATOR">Owner Operator (Owns truck)</option>
                  <option value="COMPANY_DRIVER">Company Driver (Working under)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Carrier Company / Authority</label>
                <select
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800 font-medium"
                  value={customCarrierMode ? 'CUSTOM' : (carrierId || (workingUnderName === 'Independent' ? 'INDEPENDENT' : (workingUnderName ? 'CUSTOM' : 'INDEPENDENT')))}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === 'CUSTOM') {
                      setCustomCarrierMode(true);
                      setCarrierId('');
                    } else if (val === 'INDEPENDENT') {
                      setCustomCarrierMode(false);
                      setCarrierId('');
                      setWorkingUnderName('Independent');
                    } else {
                      setCustomCarrierMode(false);
                      const c = carriers.find(item => item.id === val);
                      if (c) {
                        setCarrierId(c.id);
                        setWorkingUnderName(c.name);
                        if (c.payoutRatePercent) {
                          setDefaultPayoutPercent(c.payoutRatePercent);
                        }
                      }
                    }
                  }}
                >
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
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Custom Carrier Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Logistics LLC"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800 font-semibold"
                    value={workingUnderName}
                    onChange={e => setWorkingUnderName(e.target.value)}
                  />
                </div>
              )}

              {isAdmin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Assigned Dispatcher</label>
                  <select
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                    value={assignedDispatcherId}
                    onChange={e => setAssignedDispatcherId(e.target.value)}
                  >
                    <option value="">-- Select Dispatcher --</option>
                    {dispatchers.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.username})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Dimensions & Floor Material */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
              <Ruler className="h-3.5 w-3.5 text-indigo-600" />
              <span>2. Dimensions, Spec Category &amp; Floor Material</span>
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Truck Spec Grade</label>
                <select
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-indigo-900"
                  value={truckSpecCategory}
                  onChange={e => setTruckSpecCategory(e.target.value as any)}
                >
                  <option value="REGULAR">Regular Standard Spec</option>
                  <option value="BUSINESS">Business / Commercial Spec</option>
                  <option value="COMMERCIAL">Heavy Commercial Spec</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Floor Material</label>
                <select
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                  value={floorMaterial}
                  onChange={e => setFloorMaterial(e.target.value as any)}
                >
                  <option value="WOOD_FLOOR">🪵 Wood Floor (Smooth/Hardwood)</option>
                  <option value="ALUMINUM_FLOOR">⚡ Aluminum Floor (Heavy Duty)</option>
                  <option value="STEEL_FLOOR">⚙️ Steel Tread Floor</option>
                  <option value="COMPOSITE">🧱 Composite Reinforced</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Inside Clearance Height</label>
                <input
                  type="text"
                  placeholder='e.g. 102"'
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                  value={insideHeight}
                  onChange={e => setInsideHeight(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Between Doors Clearance</label>
                <input
                  type="text"
                  placeholder='e.g. 98" H x 92" W'
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                  value={doorClearanceHeight}
                  onChange={e => setDoorClearanceHeight(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Inside Length</label>
                <input
                  type="text"
                  placeholder='e.g. 26 ft'
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                  value={insideLength}
                  onChange={e => setInsideLength(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Inside Width</label>
                <input
                  type="text"
                  placeholder='e.g. 102"'
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                  value={insideWidth}
                  onChange={e => setInsideWidth(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Tools & Necessary Equipment */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
              <Wrench className="h-3.5 w-3.5 text-amber-600" />
              <span>3. Necessary Tools &amp; Onboard Equipment Vault</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Liftgate */}
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-amber-950">
                  <input
                    type="checkbox"
                    checked={hasLiftgate}
                    onChange={e => setHasLiftgate(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4 accent-amber-600 cursor-pointer"
                  />
                  <span>⚡ Liftgate Included</span>
                </label>
                {hasLiftgate && (
                  <select
                    className="w-full px-2.5 py-1 bg-white border border-amber-200 rounded-lg text-xs font-semibold text-amber-900"
                    value={liftgateType}
                    onChange={e => setLiftgateType(e.target.value)}
                  >
                    <option value="Tuckaway">Tuckaway Liftgate (3,000 lbs)</option>
                    <option value="Railgate">Railgate Liftgate (4,000 lbs)</option>
                    <option value="Cantilever">Cantilever Liftgate</option>
                    <option value="Hydraulic">Hydraulic Heavy Duty</option>
                  </select>
                )}
              </div>

              {/* Pallet Jack */}
              <div className="p-3 bg-violet-50/50 rounded-xl border border-violet-200/80 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-violet-950">
                  <input
                    type="checkbox"
                    checked={hasPalletJack}
                    onChange={e => setHasPalletJack(e.target.checked)}
                    className="rounded text-violet-600 focus:ring-violet-500 h-4 w-4 accent-violet-600 cursor-pointer"
                  />
                  <span>📦 Pallet Jack Included</span>
                </label>
                {hasPalletJack && (
                  <select
                    className="w-full px-2.5 py-1 bg-white border border-violet-200 rounded-lg text-xs font-semibold text-violet-900"
                    value={palletJackType}
                    onChange={e => setPalletJackType(e.target.value as any)}
                  >
                    <option value="ELECTRIC">⚡ Electric Pallet Jack</option>
                    <option value="MANUAL">🖐️ Manual Pallet Jack</option>
                    <option value="BOTH">🔥 Both Manual &amp; Electric</option>
                  </select>
                )}
              </div>

              {/* E-Tracks & Ratchet Straps */}
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-emerald-950">
                  <input
                    type="checkbox"
                    checked={hasETracks}
                    onChange={e => setHasETracks(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 accent-emerald-600 cursor-pointer"
                  />
                  <span>🛤️ E-Tracks Included</span>
                </label>
                {hasETracks && (
                  <input
                    type="text"
                    placeholder="e.g. 2 Rows Full Length"
                    className="w-full px-2.5 py-1 bg-white border border-emerald-200 rounded-lg text-xs text-emerald-900"
                    value={eTrackDetails}
                    onChange={e => setETrackDetails(e.target.value)}
                  />
                )}
              </div>

              {/* Straps, Load Bars & Blankets */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 col-span-full grid grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hasRatchetStraps}
                    onChange={e => setHasRatchetStraps(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 accent-blue-600 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-700">Ratchet Straps:</span>
                  <input
                    type="number"
                    min={0}
                    className="w-16 px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-mono"
                    value={ratchetStrapsCount}
                    onChange={e => setRatchetStrapsCount(Number(e.target.value))}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hasLoadBars}
                    onChange={e => setHasLoadBars(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 accent-blue-600 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-700">Load / Shoring Bars:</span>
                  <input
                    type="number"
                    min={0}
                    className="w-16 px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-mono"
                    value={loadBarsCount}
                    onChange={e => setLoadBarsCount(Number(e.target.value))}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hasMovingBlankets}
                    onChange={e => setHasMovingBlankets(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 accent-blue-600 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-700">Furniture Blankets:</span>
                  <input
                    type="number"
                    min={0}
                    className="w-16 px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-mono"
                    value={movingBlanketsCount}
                    onChange={e => setMovingBlanketsCount(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: VIN, License & Lease Agreement Documents */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              <span>4. Vehicle Identification, License &amp; Lease Agreement Vault</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Truck VIN #</label>
                <input
                  type="text"
                  placeholder="e.g. 1FT8W3BT9RED12345"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500 text-slate-800 uppercase"
                  value={vinNumber}
                  onChange={e => setVinNumber(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">License Plate # &amp; State</label>
                <input
                  type="text"
                  placeholder="e.g. TX-98214"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500 text-slate-800 uppercase"
                  value={licensePlate}
                  onChange={e => setLicensePlate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Ownership Type</label>
                <select
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  value={ownershipType}
                  onChange={e => setOwnershipType(e.target.value as any)}
                >
                  <option value="OWNED">🔑 Owned Truck</option>
                  <option value="RENTAL_LEASED">🏢 Rental / Leased Truck</option>
                </select>
              </div>

              {ownershipType === 'RENTAL_LEASED' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Rental Company</label>
                  <input
                    type="text"
                    placeholder="e.g. Ryder / Penske / Enterprise"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                    value={rentalCompany}
                    onChange={e => setRentalCompany(e.target.value)}
                  />
                </div>
              )}

              {/* Upload Lease Document */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Upload Rental Lease Agreement / Registration Card
                </label>
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-xl border border-dashed border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Registration Card:</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      id="registration_upload_add"
                      className="hidden"
                      onChange={e => handleDocUpload(e, 'REGISTRATION', false)}
                    />
                    <label
                      htmlFor="registration_upload_add"
                      className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 transition"
                    >
                      <Upload className="h-3.5 w-3.5 text-blue-600" />
                      <span>{registrationDoc ? '✓ Card Uploaded' : 'Upload Card'}</span>
                    </label>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Lease Agreement:</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      id="lease_upload_add"
                      className="hidden"
                      onChange={e => handleDocUpload(e, 'RENTAL_LEASE', false)}
                    />
                    <label
                      htmlFor="lease_upload_add"
                      className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 transition"
                    >
                      <Upload className="h-3.5 w-3.5 text-indigo-600" />
                      <span>{rentalLeaseDoc ? '✓ Lease Uploaded' : 'Upload Lease'}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Performance Goals */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
              <Target className="h-3.5 w-3.5 text-emerald-600" />
              <span>5. Performance Targets &amp; KPI Benchmarks</span>
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100">
              <div>
                <label className="block text-[11px] font-bold text-emerald-900 uppercase mb-1">Daily Target ($)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-emerald-600 font-bold">$</span>
                  <input
                    type="number"
                    min={0}
                    className="w-full pl-6 pr-2.5 py-1 bg-white border border-emerald-200 rounded-lg text-xs font-mono font-bold text-emerald-950"
                    value={dailyTargetUSD}
                    onChange={e => setDailyTargetUSD(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-emerald-900 uppercase mb-1">Weekly Target ($)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-emerald-600 font-bold">$</span>
                  <input
                    type="number"
                    min={0}
                    className="w-full pl-6 pr-2.5 py-1 bg-white border border-emerald-200 rounded-lg text-xs font-mono font-bold text-emerald-950"
                    value={weeklyTargetUSD}
                    onChange={e => setWeeklyTargetUSD(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-emerald-900 uppercase mb-1">Monthly Target ($)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-emerald-600 font-bold">$</span>
                  <input
                    type="number"
                    min={0}
                    className="w-full pl-6 pr-2.5 py-1 bg-white border border-emerald-200 rounded-lg text-xs font-mono font-bold text-emerald-950"
                    value={monthlyTargetUSD}
                    onChange={e => setMonthlyTargetUSD(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-emerald-900 uppercase mb-1">Target RPM ($/mi)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-emerald-600 font-bold">$</span>
                  <input
                    type="number"
                    step={0.01}
                    min={0}
                    className="w-full pl-6 pr-2.5 py-1 bg-white border border-emerald-200 rounded-lg text-xs font-mono font-bold text-emerald-950"
                    value={targetRPM}
                    onChange={e => setTargetRPM(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-md"
            >
              Save &amp; Onboard Driver
            </button>
          </div>
        </form>
      )}

      {/* Main Drivers Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        
        {/* Search board */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by name, truck, carrier, VIN..."
                className="w-full pl-10 pr-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-700"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="relative">
              <select
                value={carrierFilter}
                onChange={e => setCarrierFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">🏢 All Carriers ({drivers.length})</option>
                {carriers.map(c => {
                  const count = drivers.filter(dr => dr.carrierId === c.id || dr.workingUnderName === c.name).length;
                  return (
                    <option key={c.id} value={c.id}>
                      🏢 {c.name} ({count})
                    </option>
                  );
                })}
                <option value="INDEPENDENT">🚜 Independent ({drivers.filter(dr => !dr.carrierId && (!dr.workingUnderName || dr.workingUnderName === 'Independent')).length})</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-semibold cursor-pointer shadow-2xs hover:bg-slate-50">
              <input
                type="checkbox"
                checked={autoTopActive}
                onChange={e => setAutoTopActive(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 accent-blue-600 cursor-pointer"
              />
              <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span>Active/Working Drivers on Top</span>
            </label>

            <span className="text-xs font-medium text-slate-400">
              Showing {sortedDrivers.length} of {drivers.length} drivers
            </span>
          </div>
        </div>

        {/* Drivers Grid view */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 p-5">
          {sortedDrivers.map((d) => {
            const isEditing = editingId === d.id;
            const assignedDispatcherName = dispatchers.find(dis => dis.id === d.assignedDispatcherId)?.name || 'Unassigned';
            const perf = calculateDriverPerformance(d.id);

            const dailyPercent = Math.min(100, Math.round((perf.todayGross / (d.dailyTargetUSD || 600)) * 100));
            const weeklyPercent = Math.min(100, Math.round((perf.weekGross / (d.weeklyTargetUSD || 3500)) * 100));
            const monthlyPercent = Math.min(100, Math.round((perf.monthGross / (d.monthlyTargetUSD || 14000)) * 100));

            return (
              <div
                id={`driver_card_${d.id}`}
                key={d.id}
                draggable={!isEditing}
                onDragStart={() => setDraggedDriverId(d.id)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDropDriver(d.id)}
                className={`p-5 rounded-2xl border transition-all ${
                  isEditing
                    ? 'border-blue-500 bg-blue-50/10 shadow-md shadow-blue-500/5'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md hover:shadow-slate-200/50'
                } ${draggedDriverId === d.id ? 'opacity-40 border-dashed border-blue-400' : ''}`}
              >
                {isEditing ? (
                  /* Edit Form */
                  <div className="space-y-4 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-blue-600">Editing {d.name}</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(d.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <Check className="h-3.5 w-3.5" /> Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Driver Name</label>
                        <input
                          type="text"
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Phone</label>
                        <input
                          type="text"
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                          value={editPhone}
                          onChange={e => setEditPhone(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Truck #</label>
                        <input
                          type="text"
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                          value={editTruckNum}
                          onChange={e => setEditTruckNum(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Equipment</label>
                        <select
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                          value={editTruckType}
                          onChange={e => setEditTruckType(e.target.value)}
                        >
                          <option value="26ft Box truck">26ft Box truck</option>
                          <option value="53ft dry van">53ft dry van</option>
                          <option value="Dry Van">Dry Van</option>
                          <option value="Reefer">Reefer</option>
                          <option value="Flatbed">Flatbed</option>
                          <option value="Power Only">Power Only</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Spec Category</label>
                        <select
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-indigo-900"
                          value={editTruckSpecCategory}
                          onChange={e => setEditTruckSpecCategory(e.target.value as any)}
                        >
                          <option value="REGULAR">Regular Spec</option>
                          <option value="BUSINESS">Business Spec</option>
                          <option value="COMMERCIAL">Commercial Spec</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Inside Height</label>
                        <input
                          type="text"
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                          value={editInsideHeight}
                          onChange={e => setEditInsideHeight(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Door Clearance H</label>
                        <input
                          type="text"
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                          value={editDoorClearanceHeight}
                          onChange={e => setEditDoorClearanceHeight(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Floor Material</label>
                        <select
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                          value={editFloorMaterial}
                          onChange={e => setEditFloorMaterial(e.target.value as any)}
                        >
                          <option value="WOOD_FLOOR">Wood Floor</option>
                          <option value="ALUMINUM_FLOOR">Aluminum Floor</option>
                          <option value="STEEL_FLOOR">Steel Floor</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Carrier Company</label>
                        <select
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium"
                          value={editCustomCarrierMode ? 'CUSTOM' : (editCarrierId || (editWorkingUnderName === 'Independent' ? 'INDEPENDENT' : (editWorkingUnderName ? 'CUSTOM' : 'INDEPENDENT')))}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === 'CUSTOM') {
                              setEditCustomCarrierMode(true);
                              setEditCarrierId('');
                            } else if (val === 'INDEPENDENT') {
                              setEditCustomCarrierMode(false);
                              setEditCarrierId('');
                              setEditWorkingUnderName('Independent');
                            } else {
                              setEditCustomCarrierMode(false);
                              const c = carriers.find(item => item.id === val);
                              if (c) {
                                setEditCarrierId(c.id);
                                setEditWorkingUnderName(c.name);
                                if (c.payoutRatePercent) {
                                  setEditDefaultPayoutPercent(c.payoutRatePercent);
                                }
                              }
                            }
                          }}
                        >
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
                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Custom Carrier Name</label>
                          <input
                            type="text"
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold"
                            value={editWorkingUnderName}
                            onChange={e => setEditWorkingUnderName(e.target.value)}
                          />
                        </div>
                      )}

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Dispatch Fee %</label>
                        <input
                          type="number"
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                          value={editDefaultPayoutPercent}
                          onChange={e => setEditDefaultPayoutPercent(Number(e.target.value))}
                        />
                      </div>

                      {/* Tool toggles */}
                      <div className="col-span-2 grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[11px]">
                          <input
                            type="checkbox"
                            checked={editHasLiftgate}
                            onChange={e => setEditHasLiftgate(e.target.checked)}
                          />
                          <span>⚡ Liftgate</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[11px]">
                          <input
                            type="checkbox"
                            checked={editHasPalletJack}
                            onChange={e => setEditHasPalletJack(e.target.checked)}
                          />
                          <span>📦 Pallet Jack</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[11px]">
                          <input
                            type="checkbox"
                            checked={editHasETracks}
                            onChange={e => setEditHasETracks(e.target.checked)}
                          />
                          <span>🛤️ E-Tracks</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[11px]">
                          <input
                            type="checkbox"
                            checked={editHasRatchetStraps}
                            onChange={e => setEditHasRatchetStraps(e.target.checked)}
                          />
                          <span>🪢 Ratchet Straps</span>
                        </label>
                      </div>

                      {/* VIN & Plate */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">VIN #</label>
                        <input
                          type="text"
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono uppercase"
                          value={editVinNumber}
                          onChange={e => setEditVinNumber(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Plate #</label>
                        <input
                          type="text"
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono uppercase"
                          value={editLicensePlate}
                          onChange={e => setEditLicensePlate(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Read Mode Card */
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1 cursor-grab text-slate-300 hover:text-slate-600 transition-colors">
                          <GripVertical className="h-4 w-4" />
                        </div>

                        {d.profilePhoto ? (
                          <img
                            src={d.profilePhoto}
                            className="h-11 w-11 rounded-xl object-cover shadow-sm border border-slate-200 shrink-0"
                            alt={d.name}
                          />
                        ) : (
                          <div className="h-11 w-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold font-display shadow-sm shrink-0">
                            {d.truckNum}
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{d.name}</span>
                            {d.truckSpecCategory === 'BUSINESS' && (
                              <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded text-[9.5px] font-extrabold uppercase tracking-wide">
                                Business Spec
                              </span>
                            )}
                          </h4>
                          <span className="text-[11px] text-slate-400 font-medium font-mono">
                            Truck #{d.truckNum} • {d.truckType}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1">
                            {d.carrierId || (d.workingUnderName && d.workingUnderName.toLowerCase() !== 'independent' && d.workingUnderName.trim() !== '') ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200/80 rounded-md text-[10.5px] font-bold">
                                <Building className="h-3 w-3 text-blue-600 shrink-0" />
                                <span>{carriers.find(c => c.id === d.carrierId)?.name || d.workingUnderName}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10.5px] font-medium">
                                <Truck className="h-3 w-3 text-slate-400 shrink-0" />
                                <span>Independent Driver</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-slate-500">
                          <button
                            type="button"
                            onClick={() => handleMoveDriver(d.id, 'TOP')}
                            className="p-1 hover:text-blue-600 rounded transition cursor-pointer"
                            title="Put on Top"
                          >
                            <ArrowUpToLine className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveDriver(d.id, 'UP')}
                            className="p-1 hover:text-blue-600 rounded transition cursor-pointer"
                            title="Move Up"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveDriver(d.id, 'DOWN')}
                            className="p-1 hover:text-blue-600 rounded transition cursor-pointer"
                            title="Move Down"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            d.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {d.status}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEdit(d)}
                            className="p-1 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded transition cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            title={`Delete Driver ${d.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Are you sure you want to delete driver "${d.name}"?`)) {
                                onDelete(d.id);
                              }
                            }}
                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Equipment & Dimensions Badge Ribbon */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-2 text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded font-semibold text-[11px] flex items-center gap-1 shadow-2xs">
                          <Ruler className="h-3 w-3 text-indigo-500" />
                          <span>Dims: {d.insideLength || '26 ft'} x {d.insideHeight || '102"'}H x {d.insideWidth || '102"'}W</span>
                        </span>

                        {d.doorClearanceHeight && (
                          <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded font-semibold text-[11px] flex items-center gap-1 shadow-2xs">
                            <Box className="h-3 w-3 text-amber-500" />
                            <span>Door Clearance: {d.doorClearanceHeight}</span>
                          </span>
                        )}

                        <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded font-semibold text-[11px] flex items-center gap-1 shadow-2xs">
                          <span>{d.floorMaterial === 'ALUMINUM_FLOOR' ? '⚡ Aluminum Floor' : '🪵 Wood Floor'}</span>
                        </span>
                      </div>

                      {/* Onboard Necessary Tools Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/60">
                        {d.hasLiftgate ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-extrabold rounded-md text-[10.5px] flex items-center gap-1">
                            <Zap className="h-3 w-3 text-amber-600 fill-amber-500" />
                            <span>Liftgate ({d.liftgateType || 'Tuckaway'})</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-200/60 text-slate-400 rounded text-[10px] line-through">
                            No Liftgate
                          </span>
                        )}

                        {d.hasPalletJack ? (
                          <span className="px-2 py-0.5 bg-violet-100 text-violet-900 font-extrabold rounded-md text-[10.5px] flex items-center gap-1">
                            <span>📦 Pallet Jack ({d.palletJackType || 'Manual'})</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-200/60 text-slate-400 rounded text-[10px] line-through">
                            No Pallet Jack
                          </span>
                        )}

                        {d.hasETracks && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-extrabold rounded-md text-[10.5px]">
                            🛤️ E-Tracks
                          </span>
                        )}

                        {d.hasRatchetStraps && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-bold rounded-md text-[10.5px]">
                            🪢 {d.ratchetStrapsCount || 10} Straps
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Vehicle Identification & Rental Vault Bar */}
                    <div className="flex items-center justify-between text-xs bg-slate-50/80 px-3 py-2 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2">
                        <Key className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-mono text-[11px] font-bold text-slate-700">
                          {d.vinNumber ? `VIN: ${d.vinNumber}` : 'VIN: Unspecified'}
                        </span>
                        {d.licensePlate && (
                          <span className="px-1.5 py-0.5 bg-slate-200 rounded text-[10px] font-mono font-bold text-slate-800">
                            {d.licensePlate}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                          d.ownershipType === 'RENTAL_LEASED' ? 'bg-indigo-100 text-indigo-900' : 'bg-emerald-100 text-emerald-900'
                        }`}>
                          {d.ownershipType === 'RENTAL_LEASED' ? `Rental (${d.rentalCompany || 'Leased'})` : 'Owned'}
                        </span>

                        <button
                          type="button"
                          onClick={() => setDocModalDriver(d)}
                          className="p-1 hover:bg-slate-200 text-slate-600 rounded transition cursor-pointer"
                          title="View Vehicle Vault Documents"
                        >
                          <Eye className="h-3.5 w-3.5 text-blue-600" />
                        </button>
                      </div>
                    </div>

                    {/* Performance Goals Progress Widget */}
                    <div className="bg-emerald-50/30 p-3 rounded-xl border border-emerald-100/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-emerald-950 uppercase tracking-wide flex items-center gap-1">
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Performance Goals:</span>
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold font-mono">
                          Goal RPM: ${d.targetRPM || 2.50}/mi
                        </span>
                      </div>

                      {/* Daily Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10.5px] font-medium text-slate-600">
                          <span>Today: <strong>${perf.todayGross.toLocaleString()}</strong> / ${d.dailyTargetUSD || 600}</span>
                          <span className="font-bold text-emerald-700">{dailyPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${dailyPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Weekly Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10.5px] font-medium text-slate-600">
                          <span>This Week: <strong>${perf.weekGross.toLocaleString()}</strong> / ${d.weeklyTargetUSD || 3500}</span>
                          <span className="font-bold text-indigo-700">{weeklyPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${weeklyPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contact & Dispatcher Footer */}
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1 font-semibold text-slate-700">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span>{d.phone}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Disp: <strong className="text-slate-700">{assignedDispatcherName}</strong>
                      </span>
                    </div>

                    {/* Team Attribution / Audit Badge */}
                    <AuditInfoBadge
                      createdBy={d.createdBy}
                      createdByName={d.createdByName}
                      createdAt={d.createdAt}
                      lastModifiedBy={d.lastModifiedBy}
                      lastModifiedByName={d.lastModifiedByName}
                      lastModifiedAt={d.lastModifiedAt}
                      compact={true}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Vehicle Documents Modal */}
      {docModalDriver && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                <span>Vehicle Vault Documents — {docModalDriver.name}</span>
              </h3>
              <button
                onClick={() => setDocModalDriver(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Registration Card Doc */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <FileCheck className="h-4 w-4 text-emerald-600" />
                    <span>Vehicle Registration Card</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {docModalDriver.registrationDoc?.uploadedAt ? `Uploaded: ${docModalDriver.registrationDoc.uploadedAt}` : 'No document uploaded'}
                  </span>
                </div>
                {docModalDriver.registrationDoc ? (
                  <div className="flex items-center justify-between pt-2">
                    <span className="truncate max-w-[200px] text-slate-600 font-mono">
                      {docModalDriver.registrationDoc.name}
                    </span>
                    <a
                      href={docModalDriver.registrationDoc.base64}
                      download={docModalDriver.registrationDoc.name}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition shadow-xs"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                ) : (
                  <p className="text-slate-400 text-[11px] italic">No vehicle registration card attached yet.</p>
                )}
              </div>

              {/* Rental / Lease Agreement Doc */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    <span>Rental / Lease Agreement</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {docModalDriver.rentalLeaseDoc?.uploadedAt ? `Uploaded: ${docModalDriver.rentalLeaseDoc.uploadedAt}` : 'No document uploaded'}
                  </span>
                </div>
                {docModalDriver.rentalLeaseDoc ? (
                  <div className="flex items-center justify-between pt-2">
                    <span className="truncate max-w-[200px] text-slate-600 font-mono">
                      {docModalDriver.rentalLeaseDoc.name}
                    </span>
                    <a
                      href={docModalDriver.rentalLeaseDoc.base64}
                      download={docModalDriver.rentalLeaseDoc.name}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition shadow-xs"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download Lease</span>
                    </a>
                  </div>
                ) : (
                  <p className="text-slate-400 text-[11px] italic">No lease agreement uploaded for this vehicle.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDocModalDriver(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close Vault
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
