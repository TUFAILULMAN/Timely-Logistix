/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  Truck,
  Box,
  Layers,
  Maximize2,
  Minimize2,
  Calculator,
  Compass,
  RotateCw,
  Plus,
  Trash2,
  Download,
  Printer,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Fuel,
  DollarSign,
  TrendingUp,
  Clock,
  Navigation,
  Scale,
  Percent,
  Sliders,
  ChevronRight,
  Info,
  Copy,
  RefreshCw,
  Eye,
  FileText
} from 'lucide-react';
import { User, Load, Driver, CarrierOrOwner, CompanySettings } from '../types';

// ==========================================
// TRUCK & CARGO PRESETS
// ==========================================

export interface TruckPreset {
  id: string;
  name: string;
  category: 'BOX_TRUCK' | 'DRY_VAN' | 'REEFER' | 'FLATBED' | 'HOTSHOT' | 'CUSTOM';
  lengthInches: number; // e.g. 53ft = 636"
  widthInches: number;  // e.g. 102" ext, ~98-100" int
  heightInches: number; // e.g. 110" or 102"
  maxWeightLbs: number; // e.g. 45000 lbs
  hasRoof: boolean;
  description: string;
}

export const TRUCK_PRESETS: TruckPreset[] = [
  {
    id: 'box-26',
    name: '26ft Box Truck (Straight Truck)',
    category: 'BOX_TRUCK',
    lengthInches: 312, // 26 ft
    widthInches: 96,   // 8 ft
    heightInches: 96,  // 8 ft
    maxWeightLbs: 10000,
    hasRoof: true,
    description: '26\' × 8\' × 8\' standard commercial straight box truck (Under CDL / Class B)'
  },
  {
    id: 'dry-van-53',
    name: '53ft Dry Van Trailer',
    category: 'DRY_VAN',
    lengthInches: 636, // 53 ft
    widthInches: 99,   // standard internal width (102" exterior)
    heightInches: 110, // standard internal height (9.16 ft)
    maxWeightLbs: 45000,
    hasRoof: true,
    description: '53\' × 8.25\' (99" int) × 9.16\' (110" int) standard full-size dry freight trailer'
  },
  {
    id: 'reefer-53',
    name: '53ft Refrigerated Reefer Trailer',
    category: 'REEFER',
    lengthInches: 630, // 52.5 ft internal due to reefer bulkhead
    widthInches: 97,   // insulated walls internal width
    heightInches: 102, // insulated ceiling & T-duct floor (8.5 ft)
    maxWeightLbs: 43500,
    hasRoof: true,
    description: '53\' × 8.08\' (97" int) × 8.5\' (102" int) insulated refrigerated temperature-controlled'
  },
  {
    id: 'flatbed-53',
    name: '53ft Flatbed / Step Deck',
    category: 'FLATBED',
    lengthInches: 636, // 53 ft
    widthInches: 102,  // 8.5 ft deck width
    heightInches: 102, // legal standard freight height clearance
    maxWeightLbs: 48000,
    hasRoof: false,
    description: '53\' × 8.5\' open deck platform for oversize, crated, pipe, steel or machinery cargo'
  },
  {
    id: 'hotshot-40',
    name: '40ft Hotshot Gooseneck Trailer',
    category: 'HOTSHOT',
    lengthInches: 480, // 40 ft
    widthInches: 102,  // 8.5 ft width
    heightInches: 102, // max legal cargo height
    maxWeightLbs: 16500,
    hasRoof: false,
    description: '40\' × 8.5\' flat hotshot gooseneck trailer for expedited medium & heavy LTL'
  },
  {
    id: 'hotshot-35',
    name: '35ft Hotshot Trailer',
    category: 'HOTSHOT',
    lengthInches: 420, // 35 ft
    widthInches: 102,  // 8.5 ft width
    heightInches: 102, // max legal cargo height
    maxWeightLbs: 14000,
    hasRoof: false,
    description: '35\' × 8.5\' compact hotshot trailer for agile regional and express freight'
  }
];

export interface CargoPreset {
  id: string;
  name: string;
  lengthInches: number;
  widthInches: number;
  heightInches: number;
  weightLbs: number;
  color: string;
  description: string;
}

export const CARGO_PRESETS: CargoPreset[] = [
  {
    id: 'gma-standard',
    name: 'Standard GMA Pallet (48" × 40")',
    lengthInches: 48,
    widthInches: 40,
    heightInches: 48,
    weightLbs: 1200,
    color: '#3B82F6', // Blue
    description: 'Most common North American grocery/general freight pallet'
  },
  {
    id: 'euro-pallet',
    name: 'Euro Pallet (EUR-1 47.2" × 31.5")',
    lengthInches: 47.2,
    widthInches: 31.5,
    heightInches: 50,
    weightLbs: 950,
    color: '#10B981', // Emerald
    description: 'Standard European specification EUR-1 (1200mm × 800mm)'
  },
  {
    id: 'square-industrial',
    name: 'Industrial Square Pallet (48" × 48")',
    lengthInches: 48,
    widthInches: 48,
    heightInches: 52,
    weightLbs: 1500,
    color: '#F59E0B', // Amber
    description: 'Square heavy industrial drums, chemicals, and machinery base'
  },
  {
    id: 'chemical-pallet',
    name: 'Chemical & Beverage Pallet (48" × 42")',
    lengthInches: 48,
    widthInches: 42,
    heightInches: 48,
    weightLbs: 1800,
    color: '#8B5CF6', // Purple
    description: 'Standard chemical drums, paint, and paint-coatings pallet'
  },
  {
    id: 'large-machinery-crate',
    name: 'Large Industrial Crate (72" × 48" × 60")',
    lengthInches: 72,
    widthInches: 48,
    heightInches: 60,
    weightLbs: 3200,
    color: '#EC4899', // Pink
    description: 'Custom wooden crate for machinery, HVAC, motors and generators'
  },
  {
    id: 'half-pallet',
    name: 'Half Pallet / Retail Display (40" × 24")',
    lengthInches: 40,
    widthInches: 24,
    heightInches: 40,
    weightLbs: 450,
    color: '#06B6D4', // Cyan
    description: 'Retail point-of-sale display and compact endcap pallets'
  }
];

export interface CustomCargoItem {
  id: string;
  label: string;
  lengthInches: number;
  widthInches: number;
  heightInches: number;
  weightLbs: number;
  quantity: number;
  isStackable: boolean;
  color: string;
}

interface ToolsSectionProps {
  currentUser: User;
  loads?: Load[];
  drivers?: Driver[];
  carriers?: CarrierOrOwner[];
  companySettings?: CompanySettings;
}

export default function ToolsSection({
  currentUser,
  loads = [],
  drivers = [],
  carriers = [],
  companySettings
}: ToolsSectionProps) {
  // Active Tool Sub-Tab
  const [activeToolTab, setActiveToolTab] = useState<
    'FITMENT' | 'RPM_CALCULATOR' | 'SALARY_CALCULATOR' | 'DETENTION_CALC' | 'HOS_PLANNER'
  >('FITMENT');

  // ==========================================
  // STATE: CARGO & PALLET FITMENT TOOL
  // ==========================================
  const [selectedTruckPresetId, setSelectedTruckPresetId] = useState<string>('dry-van-53');
  
  // Custom Truck Dimensions (initialized from preset)
  const [truckLengthFt, setTruckLengthFt] = useState<number>(53);
  const [truckWidthInches, setTruckWidthInches] = useState<number>(99);
  const [truckHeightInches, setTruckHeightInches] = useState<number>(110);
  const [truckMaxWeightLbs, setTruckMaxWeightLbs] = useState<number>(45000);
  const [truckHasRoof, setTruckHasRoof] = useState<boolean>(true);
  const [truckName, setTruckName] = useState<string>('53ft Dry Van Trailer');

  // Loading Strategy
  const [loadingPattern, setLoadingPattern] = useState<'AUTO_OPTIMAL' | 'STRAIGHT' | 'TURNED' | 'PINWHEEL'>('AUTO_OPTIMAL');
  const [allowDoubleStack, setAllowDoubleStack] = useState<boolean>(true);
  const [cargoSpacingInches, setCargoSpacingInches] = useState<number>(1); // margin between pallets

  // Visual Display Mode
  const [viewMode, setViewMode] = useState<'2D_TOP' | '3D_ISO' | 'SIDE_ELEVATION'>('2D_TOP');
  const [isoAngle, setIsoAngle] = useState<number>(35); // 3D tilt
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Cargo List (Multi-item support)
  const [cargoList, setCargoList] = useState<CustomCargoItem[]>([
    {
      id: 'item-1',
      label: 'Standard Pallets',
      lengthInches: 48,
      widthInches: 40,
      heightInches: 48,
      weightLbs: 1250,
      quantity: 26,
      isStackable: true,
      color: '#2563EB'
    }
  ]);

  // Handle Truck Preset Selection
  const handleSelectTruckPreset = (presetId: string) => {
    setSelectedTruckPresetId(presetId);
    const p = TRUCK_PRESETS.find(x => x.id === presetId);
    if (p) {
      setTruckLengthFt(Math.round((p.lengthInches / 12) * 10) / 10);
      setTruckWidthInches(p.widthInches);
      setTruckHeightInches(p.heightInches);
      setTruckMaxWeightLbs(p.maxWeightLbs);
      setTruckHasRoof(p.hasRoof);
      setTruckName(p.name);
    }
  };

  // Add Item to Cargo List
  const handleAddCargoItem = (preset?: CargoPreset) => {
    const newItem: CustomCargoItem = preset
      ? {
          id: `cargo-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          label: preset.name.split('(')[0].trim(),
          lengthInches: preset.lengthInches,
          widthInches: preset.widthInches,
          heightInches: preset.heightInches,
          weightLbs: preset.weightLbs,
          quantity: 4,
          isStackable: true,
          color: preset.color
        }
      : {
          id: `cargo-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          label: `Cargo Lot #${cargoList.length + 1}`,
          lengthInches: 48,
          widthInches: 40,
          heightInches: 48,
          weightLbs: 1000,
          quantity: 2,
          isStackable: true,
          color: '#10B981'
        };
    setCargoList(prev => [...prev, newItem]);
  };

  const handleUpdateCargoItem = (id: string, updates: Partial<CustomCargoItem>) => {
    setCargoList(prev => prev.map(item => (item.id === id ? { ...item, ...updates } : item)));
  };

  const handleRemoveCargoItem = (id: string) => {
    setCargoList(prev => prev.filter(item => item.id !== id));
  };

  // ==========================================
  // FITMENT MATHEMATICAL ENGINE & SIMULATION
  // ==========================================
  const fitmentAnalysis = useMemo(() => {
    const trailerLengthInches = truckLengthFt * 12;
    const trailerWidthInches = truckWidthInches;
    const trailerHeightInches = truckHeightInches;
    const trailerVolumeCuFt = (trailerLengthInches * trailerWidthInches * trailerHeightInches) / 1728;

    // Expand cargo items by individual units
    interface PlacedPallet {
      uid: string;
      itemId: string;
      label: string;
      length: number;
      width: number;
      height: number;
      weight: number;
      color: string;
      xInches: number; // distance from front/nose
      yInches: number; // distance from left wall
      zInches: number; // tier height (0 for floor, >0 for double stack)
      isStacked: boolean;
      tier: number; // 1 = floor, 2 = top
      rotated: boolean;
    }

    const placedUnits: PlacedPallet[] = [];
    let currentX = 0; // cursor from nose to rear
    let totalWeight = 0;
    let totalCargoVolumeCuFt = 0;

    // Flatten cargo items
    const unitsToPlace: Array<{
      itemId: string;
      label: string;
      length: number;
      width: number;
      height: number;
      weight: number;
      color: string;
      isStackable: boolean;
    }> = [];

    cargoList.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        unitsToPlace.push({
          itemId: item.id,
          label: `${item.label} #${i + 1}`,
          length: item.lengthInches,
          width: item.widthInches,
          height: item.heightInches,
          weight: item.weightLbs,
          color: item.color,
          isStackable: item.isStackable
        });
      }
    });

    // Placement Algorithm: Row by Row from Nose (x=0) to Rear (x=trailerLength)
    let idx = 0;
    while (idx < unitsToPlace.length) {
      const u = unitsToPlace[idx];
      
      // Determine orientation based on loadingPattern and width
      let itemLen = u.length;
      let itemWid = u.width;
      let isRotated = false;

      if (loadingPattern === 'TURNED') {
        // Turned: width becomes length
        itemLen = u.width;
        itemWid = u.length;
        isRotated = true;
      } else if (loadingPattern === 'AUTO_OPTIMAL') {
        // Test if turning fits more side-by-side
        const straightCount = Math.floor(trailerWidthInches / (u.width + cargoSpacingInches));
        const turnedCount = Math.floor(trailerWidthInches / (u.length + cargoSpacingInches));
        
        if (turnedCount > straightCount && (u.length <= trailerWidthInches)) {
          itemLen = u.width;
          itemWid = u.length;
          isRotated = true;
        }
      }

      // How many fit side-by-side across trailer width?
      const sideBySide = Math.max(1, Math.floor(trailerWidthInches / (itemWid + cargoSpacingInches)));
      const actualSideCount = Math.min(sideBySide, unitsToPlace.length - idx);

      // Check height stacking
      const canStack = allowDoubleStack && u.isStackable && (u.height * 2 <= trailerHeightInches);
      const stackMultiplier = canStack ? 2 : 1;

      // Spacing across width
      const totalRowWidth = actualSideCount * itemWid + (actualSideCount - 1) * cargoSpacingInches;
      const leftMargin = Math.max(0, (trailerWidthInches - totalRowWidth) / 2);

      // Place floor pallets
      for (let col = 0; col < actualSideCount; col++) {
        if (idx >= unitsToPlace.length) break;
        const currentUnit = unitsToPlace[idx];
        const posX = currentX;
        const posY = leftMargin + col * (itemWid + cargoSpacingInches);

        // Floor unit
        placedUnits.push({
          uid: `pallet-${placedUnits.length}`,
          itemId: currentUnit.itemId,
          label: currentUnit.label,
          length: itemLen,
          width: itemWid,
          height: currentUnit.height,
          weight: currentUnit.weight,
          color: currentUnit.color,
          xInches: posX,
          yInches: posY,
          zInches: 0,
          isStacked: false,
          tier: 1,
          rotated: isRotated
        });

        totalWeight += currentUnit.weight;
        totalCargoVolumeCuFt += (itemLen * itemWid * currentUnit.height) / 1728;
        idx++;

        // If stacking is allowed and next unit matches stackable criteria, place top unit
        if (canStack && idx < unitsToPlace.length) {
          const topUnit = unitsToPlace[idx];
          if (topUnit.isStackable && topUnit.height + currentUnit.height <= trailerHeightInches) {
            placedUnits.push({
              uid: `pallet-${placedUnits.length}`,
              itemId: topUnit.itemId,
              label: `${topUnit.label} (Top)`,
              length: itemLen,
              width: itemWid,
              height: topUnit.height,
              weight: topUnit.weight,
              color: topUnit.color,
              xInches: posX,
              yInches: posY,
              zInches: currentUnit.height,
              isStacked: true,
              tier: 2,
              rotated: isRotated
            });
            totalWeight += topUnit.weight;
            totalCargoVolumeCuFt += (itemLen * itemWid * topUnit.height) / 1728;
            idx++;
          }
        }
      }

      currentX += itemLen + cargoSpacingInches;
    }

    // Linear feet used
    const usedLinearFeet = Math.min(truckLengthFt, Math.round((currentX / 12) * 10) / 10);
    const remainingLinearFeet = Math.max(0, Math.round((truckLengthFt - usedLinearFeet) * 10) / 10);
    const linearPercentUsed = Math.min(100, Math.round((usedLinearFeet / truckLengthFt) * 100));

    // Weight capacity
    const weightPercentUsed = Math.round((totalWeight / truckMaxWeightLbs) * 100);
    const isWeightOverloaded = totalWeight > truckMaxWeightLbs;
    const isLengthOverloaded = currentX > trailerLengthInches;

    // Volume capacity
    const volumePercentUsed = Math.min(100, Math.round((totalCargoVolumeCuFt / trailerVolumeCuFt) * 100));

    // Standard GMA Pallet Capacity for this truck dimensions
    // Straight 48x40 (2 wide = 40+40=80" in 99" width)
    const straightRows = Math.floor(trailerLengthInches / 48);
    const straightSingleCapacity = straightRows * 2;
    // Turned 40x48 (2 wide = 48+48=96" in 99" width)
    const turnedRows = Math.floor(trailerLengthInches / 40);
    const turnedSingleCapacity = turnedRows * 2;
    // Pinwheel capacity (alternating straight and turned)
    const optimalSingleCapacity = Math.max(straightSingleCapacity, turnedSingleCapacity);
    const optimalDoubleCapacity = (trailerHeightInches >= 96) ? optimalSingleCapacity * 2 : optimalSingleCapacity;

    // Weight distribution & Center of Gravity estimation (0 = Front Nose, 100 = Rear Door)
    let weightDistanceProduct = 0;
    placedUnits.forEach(p => {
      const centerDist = p.xInches + p.length / 2;
      weightDistanceProduct += p.weight * centerDist;
    });
    const centerOfGravityInches = totalWeight > 0 ? weightDistanceProduct / totalWeight : trailerLengthInches / 2;
    const centerOfGravityPercent = Math.round((centerOfGravityInches / trailerLengthInches) * 100);

    return {
      placedUnits,
      totalUnitsPlaced: placedUnits.length,
      totalUnitsRequested: unitsToPlace.length,
      unplacedCount: Math.max(0, unitsToPlace.length - placedUnits.length),
      usedLinearFeet,
      remainingLinearFeet,
      linearPercentUsed,
      totalWeight,
      weightPercentUsed,
      isWeightOverloaded,
      isLengthOverloaded,
      totalCargoVolumeCuFt: Math.round(totalCargoVolumeCuFt),
      trailerVolumeCuFt: Math.round(trailerVolumeCuFt),
      volumePercentUsed,
      optimalSingleCapacity,
      optimalDoubleCapacity,
      straightSingleCapacity,
      turnedSingleCapacity,
      centerOfGravityPercent
    };
  }, [
    truckLengthFt,
    truckWidthInches,
    truckHeightInches,
    truckMaxWeightLbs,
    cargoList,
    loadingPattern,
    allowDoubleStack,
    cargoSpacingInches
  ]);

  // ==========================================
  // STATE: RPM & RATE MATRIX CALCULATOR
  // ==========================================
  const [rpmGrossRate, setRpmGrossRate] = useState<number>(3400);
  const [rpmLoadedMiles, setRpmLoadedMiles] = useState<number>(1150);
  const [rpmDeadheadMiles, setRpmDeadheadMiles] = useState<number>(120);
  const [rpmFuelPrice, setRpmFuelPrice] = useState<number>(3.85);
  const [rpmTruckMpg, setRpmTruckMpg] = useState<number>(6.5);
  const [rpmTollsEstimate, setRpmTollsEstimate] = useState<number>(85);
  const [rpmDispatchFeePercent, setRpmDispatchFeePercent] = useState<number>(10);
  const [rpmFactoringPercent, setRpmFactoringPercent] = useState<number>(2.5);

  const rpmAnalysis = useMemo(() => {
    const totalMiles = rpmLoadedMiles + rpmDeadheadMiles;
    if (totalMiles === 0) return null;

    const grossRpm = Math.round((rpmGrossRate / totalMiles) * 100) / 100;
    const loadedRpm = rpmLoadedMiles > 0 ? Math.round((rpmGrossRate / rpmLoadedMiles) * 100) / 100 : 0;
    
    // Fuel Cost
    const gallonsNeeded = totalMiles / rpmTruckMpg;
    const totalFuelCost = Math.round(gallonsNeeded * rpmFuelPrice);
    const fuelCostPerMile = Math.round((totalFuelCost / totalMiles) * 100) / 100;

    // Fees
    const dispatchFee = Math.round((rpmGrossRate * rpmDispatchFeePercent) / 100);
    const factoringFee = Math.round((rpmGrossRate * rpmFactoringPercent) / 100);
    const otherExpenses = rpmTollsEstimate;

    const totalTripExpenses = totalFuelCost + dispatchFee + factoringFee + otherExpenses;
    const netCarrierProfit = rpmGrossRate - totalTripExpenses;
    const netProfitRpm = Math.round((netCarrierProfit / totalMiles) * 100) / 100;
    const breakevenGross = totalTripExpenses;
    const breakevenRpm = Math.round((breakevenGross / totalMiles) * 100) / 100;

    return {
      totalMiles,
      grossRpm,
      loadedRpm,
      totalFuelCost,
      fuelCostPerMile,
      dispatchFee,
      factoringFee,
      totalTripExpenses,
      netCarrierProfit,
      netProfitRpm,
      breakevenGross,
      breakevenRpm
    };
  }, [
    rpmGrossRate,
    rpmLoadedMiles,
    rpmDeadheadMiles,
    rpmFuelPrice,
    rpmTruckMpg,
    rpmTollsEstimate,
    rpmDispatchFeePercent,
    rpmFactoringPercent
  ]);

  // ==========================================
  // STATE: DISPATCHER SALARY & COMMISSION CALCULATOR
  // ==========================================
  const [salBaseSalaryPKR, setSalBaseSalaryPKR] = useState<number>(75000);
  const [salExchangeRate, setSalExchangeRate] = useState<number>(278); // USD to PKR
  const [salMonthlyGrossUSD, setSalMonthlyGrossUSD] = useState<number>(42000);
  const [salDispatchFeeRate, setSalDispatchFeeRate] = useState<number>(10); // Company collects 10%
  const [salCommissionRate, setSalCommissionRate] = useState<number>(15); // Dispatcher gets 15% of dispatch fee
  const [salBonusUSD, setSalBonusUSD] = useState<number>(150);

  const salaryAnalysis = useMemo(() => {
    const totalDispatchFeeUSD = (salMonthlyGrossUSD * salDispatchFeeRate) / 100;
    const commissionEarnedUSD = (totalDispatchFeeUSD * salCommissionRate) / 100;
    const baseSalaryUSD = Math.round((salBaseSalaryPKR / salExchangeRate) * 100) / 100;
    const totalEarningsUSD = baseSalaryUSD + commissionEarnedUSD + salBonusUSD;
    const totalEarningsPKR = Math.round(totalEarningsUSD * salExchangeRate);

    return {
      totalDispatchFeeUSD: Math.round(totalDispatchFeeUSD),
      commissionEarnedUSD: Math.round(commissionEarnedUSD),
      baseSalaryUSD,
      totalEarningsUSD: Math.round(totalEarningsUSD),
      totalEarningsPKR
    };
  }, [
    salBaseSalaryPKR,
    salExchangeRate,
    salMonthlyGrossUSD,
    salDispatchFeeRate,
    salCommissionRate,
    salBonusUSD
  ]);

  // ==========================================
  // STATE: DETENTION & LAYOVER CALCULATOR
  // ==========================================
  const [detArrivalTime, setDetArrivalTime] = useState<string>('08:00');
  const [detDepartureTime, setDetDepartureTime] = useState<string>('14:30');
  const [detFreeHours, setDetFreeHours] = useState<number>(2); // Industry standard 2 hrs
  const [detHourlyRate, setDetHourlyRate] = useState<number>(75); // $75/hr
  const [detLayoverDays, setDetLayoverDays] = useState<number>(0);
  const [detLayoverRate, setDetLayoverRate] = useState<number>(250); // $250/day

  const detentionAnalysis = useMemo(() => {
    const [arrH, arrM] = detArrivalTime.split(':').map(Number);
    const [depH, depM] = detDepartureTime.split(':').map(Number);
    const startMins = arrH * 60 + arrM;
    let endMins = depH * 60 + depM;
    if (endMins < startMins) endMins += 24 * 60; // next day crossing

    const totalMinutes = Math.max(0, endMins - startMins);
    const totalHours = Math.round((totalMinutes / 60) * 100) / 100;
    const billableHours = Math.max(0, Math.round((totalHours - detFreeHours) * 100) / 100);
    const detentionCharges = Math.round(billableHours * detHourlyRate);
    const layoverCharges = detLayoverDays * detLayoverRate;
    const totalAccessorial = detentionCharges + layoverCharges;

    return {
      totalHours,
      billableHours,
      detentionCharges,
      layoverCharges,
      totalAccessorial
    };
  }, [
    detArrivalTime,
    detDepartureTime,
    detFreeHours,
    detHourlyRate,
    detLayoverDays,
    detLayoverRate
  ]);

  // ==========================================
  // STATE: TRANSIT TIME & HOS PLANNER
  // ==========================================
  const [hosDistanceMiles, setHosDistanceMiles] = useState<number>(1450);
  const [hosAvgSpeedMph, setHosAvgSpeedMph] = useState<number>(55);
  const [hosDepartureDate, setHosDepartureDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [hosDepartureHour, setHosDepartureHour] = useState<string>('06:00');

  const hosAnalysis = useMemo(() => {
    if (hosDistanceMiles <= 0 || hosAvgSpeedMph <= 0) return null;

    const totalDrivingHours = hosDistanceMiles / hosAvgSpeedMph;
    // 11-hour driving limit per 14-hour duty day followed by 10-hour rest break
    const cyclesNeeded = Math.floor(totalDrivingHours / 11);
    const restBreakHours = cyclesNeeded * 10;
    // 30 min required break every 8 hours
    const intermediateBreaksHours = Math.floor(totalDrivingHours / 8) * 0.5;
    const totalElapsedTransitHours = totalDrivingHours + restBreakHours + intermediateBreaksHours;

    // Calculate Estimated Arrival Time
    const startDateTime = new Date(`${hosDepartureDate}T${hosDepartureHour}:00`);
    const arrivalDateTime = new Date(startDateTime.getTime() + totalElapsedTransitHours * 3600 * 1000);

    return {
      totalDrivingHours: Math.round(totalDrivingHours * 10) / 10,
      cyclesNeeded,
      restBreakHours,
      intermediateBreaksHours,
      totalElapsedTransitHours: Math.round(totalElapsedTransitHours * 10) / 10,
      estimatedArrivalFormatted: arrivalDateTime.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    };
  }, [hosDistanceMiles, hosAvgSpeedMph, hosDepartureDate, hosDepartureHour]);

  // Print Load Fitment Manifest
  const handlePrintManifest = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER BAR */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 p-6 rounded-3xl border border-blue-800/60 shadow-xl text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-blue-500/20 border border-blue-400/30 rounded-2xl text-blue-300 shadow-inner">
                <Sliders className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-black tracking-tight font-display text-white">
                Dispatch Tools &amp; Cargo Engineering
              </h1>
            </div>
            <p className="text-xs text-blue-200/80 max-w-2xl font-sans">
              Interactive 2D/3D pallet fitment visualizer, truck dimensions simulator, RPM profit analyzer, dispatcher salary calculator, and HOS trip planning tools.
            </p>
          </div>

          {/* Sub-tools Quick Navigation Pills */}
          <div className="flex flex-wrap gap-2 pt-2 md:pt-0">
            <button
              onClick={() => setActiveToolTab('FITMENT')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all ${
                activeToolTab === 'FITMENT'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/40'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              <Box className="h-3.5 w-3.5 text-blue-300" />
              <span>Cargo &amp; Pallet Fitment</span>
            </button>

            <button
              onClick={() => setActiveToolTab('RPM_CALCULATOR')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all ${
                activeToolTab === 'RPM_CALCULATOR'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-400/40'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />
              <span>RPM &amp; Rate Matrix</span>
            </button>

            <button
              onClick={() => setActiveToolTab('SALARY_CALCULATOR')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all ${
                activeToolTab === 'SALARY_CALCULATOR'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              <DollarSign className="h-3.5 w-3.5 text-purple-300" />
              <span>Dispatcher Salary</span>
            </button>

            <button
              onClick={() => setActiveToolTab('DETENTION_CALC')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all ${
                activeToolTab === 'DETENTION_CALC'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 border border-amber-400/40'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              <Clock className="h-3.5 w-3.5 text-amber-300" />
              <span>Detention &amp; Layover</span>
            </button>

            <button
              onClick={() => setActiveToolTab('HOS_PLANNER')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all ${
                activeToolTab === 'HOS_PLANNER'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30 border border-teal-400/40'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              <Navigation className="h-3.5 w-3.5 text-teal-300" />
              <span>HOS Transit Planner</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TOOL 1: 2D & 3D PALLET / CARGO FITMENT CALCULATOR & VISUALIZER */}
      {/* ========================================================================= */}
      {activeToolTab === 'FITMENT' && (
        <div className="space-y-6">
          {/* TRUCK TYPE SELECTION PRESET BAR */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <Truck className="h-4 w-4 text-blue-400" />
                <span>Select Equipment / Truck Type</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                Click any preset or fine-tune exact dimensions below
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {TRUCK_PRESETS.map(preset => {
                const isSelected = selectedTruckPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectTruckPreset(preset.id)}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-md ring-1 ring-blue-400'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-800 text-blue-300">
                        {Math.round(preset.lengthInches / 12)} FT
                      </span>
                      {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />}
                    </div>
                    <p className="text-xs font-extrabold truncate">{preset.name.split('(')[0]}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">
                      {preset.widthInches}" W × {preset.heightInches}" H
                    </p>
                  </button>
                );
              })}
            </div>

            {/* FINE-TUNE TRUCK SPECIFICATIONS */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-800/80 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 font-mono uppercase font-bold">Length (Feet)</label>
                <input
                  type="number"
                  value={truckLengthFt}
                  onChange={e => {
                    setTruckLengthFt(Math.max(10, Math.min(65, Number(e.target.value))));
                    setSelectedTruckPresetId('custom');
                  }}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-mono uppercase font-bold">Width (Inches)</label>
                <input
                  type="number"
                  value={truckWidthInches}
                  onChange={e => {
                    setTruckWidthInches(Math.max(48, Math.min(120, Number(e.target.value))));
                    setSelectedTruckPresetId('custom');
                  }}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-mono uppercase font-bold">Height (Inches)</label>
                <input
                  type="number"
                  value={truckHeightInches}
                  onChange={e => {
                    setTruckHeightInches(Math.max(48, Math.min(144, Number(e.target.value))));
                    setSelectedTruckPresetId('custom');
                  }}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-mono uppercase font-bold">Max Weight (Lbs)</label>
                <input
                  type="number"
                  value={truckMaxWeightLbs}
                  onChange={e => {
                    setTruckMaxWeightLbs(Math.max(1000, Number(e.target.value)));
                    setSelectedTruckPresetId('custom');
                  }}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-mono uppercase font-bold">Loading Pattern</label>
                <select
                  value={loadingPattern}
                  onChange={e => setLoadingPattern(e.target.value as any)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold focus:border-blue-500 outline-none"
                >
                  <option value="AUTO_OPTIMAL">Optimal (Turned / Straight)</option>
                  <option value="STRAIGHT">Straight Loading (48" length)</option>
                  <option value="TURNED">Turned Loading (40" length)</option>
                </select>
              </div>
            </div>
          </div>

          {/* MAIN FITMENT WORKSPACE (CARGO BUILDER + 2D/3D VISUALIZER) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: CARGO LOTS & PALLET LIST (5 COLS) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                      <Box className="h-4 w-4 text-emerald-400" />
                      <span>Cargo Lots &amp; Dimensions</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">Add standard or custom pallets, skids, and crates</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                      <input
                        type="checkbox"
                        checked={allowDoubleStack}
                        onChange={e => setAllowDoubleStack(e.target.checked)}
                        className="rounded text-blue-500 focus:ring-0"
                      />
                      <span className="text-[11px]">Double Stack</span>
                    </label>
                  </div>
                </div>

                {/* Quick Add Presets Palette */}
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-500">Quick Preset Adds:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {CARGO_PRESETS.map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => handleAddCargoItem(preset)}
                        className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg text-[10.5px] font-medium flex items-center gap-1.5 cursor-pointer transition"
                      >
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: preset.color }} />
                        <span>{preset.name.split('(')[0].trim()}</span>
                        <span className="text-[9.5px] text-slate-500 font-mono">{preset.lengthInches}×{preset.widthInches}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cargo Lots List */}
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {cargoList.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-slate-950 border border-slate-800/90 rounded-2xl space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: item.color }}
                          />
                          <input
                            type="text"
                            value={item.label}
                            onChange={e => handleUpdateCargoItem(item.id, { label: e.target.value })}
                            className="bg-transparent text-xs font-bold text-white border-b border-transparent hover:border-slate-700 focus:border-blue-500 focus:outline-none px-1"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRemoveCargoItem(item.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition"
                            title="Remove cargo lot"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Item Dimensions & Quantity Grid */}
                      <div className="grid grid-cols-4 gap-2 text-xs font-mono">
                        <div>
                          <label className="text-[9.5px] text-slate-400">L (in)</label>
                          <input
                            type="number"
                            value={item.lengthInches}
                            onChange={e => handleUpdateCargoItem(item.id, { lengthInches: Number(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white font-bold text-center"
                          />
                        </div>

                        <div>
                          <label className="text-[9.5px] text-slate-400">W (in)</label>
                          <input
                            type="number"
                            value={item.widthInches}
                            onChange={e => handleUpdateCargoItem(item.id, { widthInches: Number(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white font-bold text-center"
                          />
                        </div>

                        <div>
                          <label className="text-[9.5px] text-slate-400">H (in)</label>
                          <input
                            type="number"
                            value={item.heightInches}
                            onChange={e => handleUpdateCargoItem(item.id, { heightInches: Number(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white font-bold text-center"
                          />
                        </div>

                        <div>
                          <label className="text-[9.5px] text-slate-400">Weight (lb)</label>
                          <input
                            type="number"
                            value={item.weightLbs}
                            onChange={e => handleUpdateCargoItem(item.id, { weightLbs: Number(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-emerald-400 font-bold text-center"
                          />
                        </div>
                      </div>

                      {/* Quantity & Stackable toggle */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-mono uppercase">Qty Pallets:</span>
                          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg">
                            <button
                              type="button"
                              onClick={() => handleUpdateCargoItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                              className="px-2 py-0.5 text-slate-400 hover:text-white font-bold"
                            >
                              -
                            </button>
                            <span className="px-2 font-mono font-bold text-white text-xs">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateCargoItem(item.id, { quantity: item.quantity + 1 })}
                              className="px-2 py-0.5 text-slate-400 hover:text-white font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.isStackable}
                            onChange={e => handleUpdateCargoItem(item.id, { isStackable: e.target.checked })}
                            className="rounded text-blue-500 focus:ring-0"
                          />
                          <span>Stackable</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleAddCargoItem()}
                  className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-blue-400 border border-blue-500/30 hover:border-blue-500/60 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition"
                >
                  <Plus className="h-4 w-4" /> Add Custom Pallet / Crate Lot
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: 2D/3D LOAD DIAGRAM & CAPACITY METRICS (7 COLS) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* CAPACITY KPI TILES */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Pallets Loaded</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xl font-black text-white font-mono">
                      {fitmentAnalysis.totalUnitsPlaced}
                      <span className="text-xs text-slate-400 font-normal"> / {fitmentAnalysis.totalUnitsRequested}</span>
                    </span>
                    <span className="text-[10px] font-mono text-blue-400 font-bold">
                      {fitmentAnalysis.optimalSingleCapacity} (Single) • {fitmentAnalysis.optimalDoubleCapacity} (Dbl)
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Linear Feet</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xl font-black text-emerald-400 font-mono">
                      {fitmentAnalysis.usedLinearFeet} ft
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {fitmentAnalysis.remainingLinearFeet} ft rem
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full ${fitmentAnalysis.isLengthOverloaded ? 'bg-rose-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, fitmentAnalysis.linearPercentUsed)}%` }}
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Cargo Weight</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className={`text-xl font-black font-mono ${fitmentAnalysis.isWeightOverloaded ? 'text-rose-400' : 'text-purple-400'}`}>
                      {fitmentAnalysis.totalWeight.toLocaleString()} lb
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {fitmentAnalysis.weightPercentUsed}% max
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full ${fitmentAnalysis.isWeightOverloaded ? 'bg-rose-500' : 'bg-purple-500'}`}
                      style={{ width: `${Math.min(100, fitmentAnalysis.weightPercentUsed)}%` }}
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Cube Volume</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xl font-black text-amber-400 font-mono">
                      {fitmentAnalysis.volumePercentUsed}%
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {fitmentAnalysis.totalCargoVolumeCuFt} cu.ft
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${fitmentAnalysis.volumePercentUsed}%` }} />
                  </div>
                </div>
              </div>

              {/* OVERLOAD WARNING ALERTS */}
              {fitmentAnalysis.isWeightOverloaded && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 flex items-center gap-3 text-xs">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
                  <div>
                    <span className="font-bold">Weight Limit Exceeded: </span>
                    <span>Total weight ({fitmentAnalysis.totalWeight.toLocaleString()} lbs) exceeds max payload ({truckMaxWeightLbs.toLocaleString()} lbs) by {(fitmentAnalysis.totalWeight - truckMaxWeightLbs).toLocaleString()} lbs!</span>
                  </div>
                </div>
              )}

              {fitmentAnalysis.isLengthOverloaded && (
                <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-amber-300 flex items-center gap-3 text-xs">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
                  <div>
                    <span className="font-bold">Floor Space Exceeded: </span>
                    <span>Cargo exceeds trailer length by {Math.round((fitmentAnalysis.usedLinearFeet - truckLengthFt) * 10) / 10} feet. Turn pallets or double stack to fit.</span>
                  </div>
                </div>
              )}

              {/* INTERACTIVE DIAGRAM VIEW CONTAINER */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
                
                {/* View Controls Switcher */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono uppercase">Load Diagram</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                      {truckName} ({truckLengthFt}' × {truckWidthInches}" × {truckHeightInches}")
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => setViewMode('2D_TOP')}
                        className={`px-3 py-1 rounded-lg font-bold transition ${
                          viewMode === '2D_TOP' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        2D Floor Plan
                      </button>

                      <button
                        type="button"
                        onClick={() => setViewMode('3D_ISO')}
                        className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                          viewMode === '3D_ISO' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Sparkles className="h-3 w-3" />
                        3D Perspective
                      </button>

                      <button
                        type="button"
                        onClick={() => setViewMode('SIDE_ELEVATION')}
                        className={`px-3 py-1 rounded-lg font-bold transition ${
                          viewMode === 'SIDE_ELEVATION' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Elevation
                      </button>
                    </div>

                    <button
                      onClick={handlePrintManifest}
                      className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl"
                      title="Print Cargo Fitment Manifest"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* ========================================================= */}
                {/* 2D TOP-DOWN FLOOR PLAN SVG DIAGRAM */}
                {/* ========================================================= */}
                {viewMode === '2D_TOP' && (
                  <div className="relative bg-slate-950 rounded-2xl p-4 border border-slate-800/80 overflow-x-auto">
                    
                    {/* Direction Indicators */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-2 px-2">
                      <span className="flex items-center gap-1">
                        <Truck className="h-3.5 w-3.5 text-blue-400" /> FRONT (Nose / Cab Bulkhead)
                      </span>
                      <span>CENTER OF GRAVITY: {fitmentAnalysis.centerOfGravityPercent}%</span>
                      <span>REAR (Doors / Loading Ramp)</span>
                    </div>

                    {/* Interactive Floor Canvas */}
                    <svg
                      viewBox={`-20 -20 ${(truckLengthFt * 12) + 40} ${truckWidthInches + 40}`}
                      className="w-full h-auto max-h-[380px] select-none"
                    >
                      {/* Trailer Wall Outline */}
                      <rect
                        x="0"
                        y="0"
                        width={truckLengthFt * 12}
                        height={truckWidthInches}
                        fill="#0F172A"
                        stroke="#334155"
                        strokeWidth="3"
                        rx="4"
                      />

                      {/* Floor Plank Texture Lines */}
                      {Array.from({ length: Math.floor((truckLengthFt * 12) / 24) }).map((_, i) => (
                        <line
                          key={`plank-${i}`}
                          x1={i * 24}
                          y1="0"
                          x2={i * 24}
                          y2={truckWidthInches}
                          stroke="#1E293B"
                          strokeWidth="1"
                          strokeDasharray="2 2"
                        />
                      ))}

                      {/* 10-ft Marker Guides */}
                      {Array.from({ length: Math.floor(truckLengthFt / 10) }).map((_, i) => (
                        <g key={`marker-${i}`}>
                          <line
                            x1={(i + 1) * 120}
                            y1="-10"
                            x2={(i + 1) * 120}
                            y2={truckWidthInches + 10}
                            stroke="#475569"
                            strokeWidth="1.5"
                            strokeDasharray="4 4"
                          />
                          <text
                            x={(i + 1) * 120}
                            y="-12"
                            fill="#94A3B8"
                            fontSize="8"
                            textAnchor="middle"
                            fontFamily="monospace"
                          >
                            {(i + 1) * 10} FT
                          </text>
                        </g>
                      ))}

                      {/* Cab / Nose Marker */}
                      <path
                        d={`M 0 0 L -12 ${truckWidthInches / 2} L 0 ${truckWidthInches} Z`}
                        fill="#3B82F6"
                        opacity="0.8"
                      />

                      {/* Rear Roll/Swing Door Indicator */}
                      <line
                        x1={truckLengthFt * 12}
                        y1="4"
                        x2={truckLengthFt * 12}
                        y2={truckWidthInches - 4}
                        stroke="#E2E8F0"
                        strokeWidth="4"
                      />

                      {/* Placed Pallets on Floor */}
                      {fitmentAnalysis.placedUnits
                        .filter(p => p.tier === 1) // Only floor units in 2D top view
                        .map(p => {
                          const hasDoubleStack = fitmentAnalysis.placedUnits.some(
                            top => top.xInches === p.xInches && top.yInches === p.yInches && top.tier === 2
                          );

                          return (
                            <g key={p.uid} className="cursor-pointer group">
                              {/* Pallet Base Box */}
                              <rect
                                x={p.xInches}
                                y={p.yInches}
                                width={p.length}
                                height={p.width}
                                fill={p.color}
                                fillOpacity="0.8"
                                stroke="#FFFFFF"
                                strokeWidth="1.2"
                                rx="2"
                              />

                              {/* Double stack indicator badge */}
                              {hasDoubleStack && (
                                <circle
                                  cx={p.xInches + p.length - 8}
                                  cy={p.yInches + 8}
                                  r="5"
                                  fill="#FFFFFF"
                                />
                              )}
                              {hasDoubleStack && (
                                <text
                                  x={p.xInches + p.length - 8}
                                  y={p.yInches + 10}
                                  fill="#0F172A"
                                  fontSize="6"
                                  fontWeight="bold"
                                  textAnchor="middle"
                                >
                                  2x
                                </text>
                              )}

                              {/* Pallet Dimension & Label Text */}
                              <text
                                x={p.xInches + p.length / 2}
                                y={p.yInches + p.width / 2 - 2}
                                fill="#FFFFFF"
                                fontSize="7.5"
                                fontWeight="bold"
                                textAnchor="middle"
                                fontFamily="sans-serif"
                              >
                                {p.length}"×{p.width}"
                              </text>
                              <text
                                x={p.xInches + p.length / 2}
                                y={p.yInches + p.width / 2 + 7}
                                fill="#E2E8F0"
                                fontSize="6.5"
                                textAnchor="middle"
                                fontFamily="monospace"
                              >
                                {p.weight} lb
                              </text>
                            </g>
                          );
                        })}

                      {/* Center of Gravity Marker */}
                      {fitmentAnalysis.totalWeight > 0 && (
                        <g>
                          <line
                            x1={(truckLengthFt * 12 * fitmentAnalysis.centerOfGravityPercent) / 100}
                            y1="0"
                            x2={(truckLengthFt * 12 * fitmentAnalysis.centerOfGravityPercent) / 100}
                            y2={truckWidthInches}
                            stroke="#F59E0B"
                            strokeWidth="2"
                            strokeDasharray="3 3"
                          />
                          <circle
                            cx={(truckLengthFt * 12 * fitmentAnalysis.centerOfGravityPercent) / 100}
                            cy={truckWidthInches / 2}
                            r="6"
                            fill="#F59E0B"
                          />
                        </g>
                      )}
                    </svg>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-3 pt-2 border-t border-slate-900">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded bg-blue-500 inline-block" /> Loaded Cargo
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-white inline-block border border-slate-900 text-slate-950 text-[7px] font-bold flex items-center justify-center">2x</span> Double Stacked
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" /> Center of Gravity
                        </span>
                      </div>
                      <span>Total Placed: {fitmentAnalysis.totalUnitsPlaced} Units</span>
                    </div>
                  </div>
                )}

                {/* ========================================================= */}
                {/* 3D ISOMETRIC PERSPECTIVE VIEW SIMULATION */}
                {/* ========================================================= */}
                {viewMode === '3D_ISO' && (
                  <div className="relative bg-slate-950 rounded-2xl p-4 border border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono text-[11px]">Isometric 3D Spatial Wireframe</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono">Tilt Angle:</span>
                        <input
                          type="range"
                          min="20"
                          max="60"
                          value={isoAngle}
                          onChange={e => setIsoAngle(Number(e.target.value))}
                          className="w-24 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="w-full h-80 flex items-center justify-center overflow-hidden">
                      <svg viewBox="0 0 900 480" className="w-full h-full">
                        <defs>
                          <linearGradient id="wallGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#1E293B" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#0F172A" stopOpacity="0.8" />
                          </linearGradient>
                          <linearGradient id="floorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#0F172A" />
                            <stop offset="100%" stopColor="#020617" />
                          </linearGradient>
                        </defs>

                        {/* Isometric Math Coordinate Projection */}
                        {/* Origin (0,0,0) located at top-left nose of trailer */}
                        {(() => {
                          const scale = 1.1;
                          const originX = 140;
                          const originY = 220;
                          const cosA = Math.cos((isoAngle * Math.PI) / 180);
                          const sinA = Math.sin((isoAngle * Math.PI) / 180);

                          const projectIso = (x: number, y: number, z: number) => {
                            // x: length (0 to trailerLength)
                            // y: width (0 to trailerWidth)
                            // z: height (0 to trailerHeight)
                            const px = originX + x * 0.95 * cosA + y * 0.95 * cosA;
                            const py = originY + x * 0.45 * sinA - y * 0.45 * sinA - z * 0.95;
                            return { px, py };
                          };

                          const p000 = projectIso(0, 0, 0);
                          const pL00 = projectIso(truckLengthFt * 12, 0, 0);
                          const pLW0 = projectIso(truckLengthFt * 12, truckWidthInches, 0);
                          const p0W0 = projectIso(0, truckWidthInches, 0);

                          const p00H = projectIso(0, 0, truckHeightInches);
                          const pL0H = projectIso(truckLengthFt * 12, 0, truckHeightInches);
                          const pLWH = projectIso(truckLengthFt * 12, truckWidthInches, truckHeightInches);
                          const p0WH = projectIso(0, truckWidthInches, truckHeightInches);

                          return (
                            <g>
                              {/* Trailer Floor Polygon */}
                              <polygon
                                points={`${p000.px},${p000.py} ${pL00.px},${pL00.py} ${pLW0.px},${pLW0.py} ${p0W0.px},${p0W0.py}`}
                                fill="url(#floorGrad)"
                                stroke="#334155"
                                strokeWidth="2"
                              />

                              {/* Back Left Wall */}
                              <polygon
                                points={`${p0W0.px},${p0W0.py} ${pLW0.px},${pLW0.py} ${pLWH.px},${pLWH.py} ${p0WH.px},${p0WH.py}`}
                                fill="url(#wallGrad)"
                                stroke="#1E293B"
                                strokeWidth="1"
                              />

                              {/* Front Nose Bulkhead */}
                              <polygon
                                points={`${p000.px},${p000.py} ${p0W0.px},${p0W0.py} ${p0WH.px},${p0WH.py} ${p00H.px},${p00H.py}`}
                                fill="#1E293B"
                                stroke="#3B82F6"
                                strokeWidth="2"
                              />

                              {/* 3D Cargo Pallets Box Rendering */}
                              {fitmentAnalysis.placedUnits.map(p => {
                                const c000 = projectIso(p.xInches, p.yInches, p.zInches);
                                const cL00 = projectIso(p.xInches + p.length, p.yInches, p.zInches);
                                const cLW0 = projectIso(p.xInches + p.length, p.yInches + p.width, p.zInches);
                                const c0W0 = projectIso(p.xInches, p.yInches + p.width, p.zInches);

                                const c00H = projectIso(p.xInches, p.yInches, p.zInches + p.height);
                                const cL0H = projectIso(p.xInches + p.length, p.yInches, p.zInches + p.height);
                                const cLWH = projectIso(p.xInches + p.length, p.yInches + p.width, p.zInches + p.height);
                                const c0WH = projectIso(p.xInches, p.yInches + p.width, p.zInches + p.height);

                                return (
                                  <g key={`3d-${p.uid}`}>
                                    {/* Top Face */}
                                    <polygon
                                      points={`${c00H.px},${c00H.py} ${cL0H.px},${cL0H.py} ${cLWH.px},${cLWH.py} ${c0WH.px},${c0WH.py}`}
                                      fill={p.color}
                                      stroke="#FFFFFF"
                                      strokeWidth="0.8"
                                      opacity="0.95"
                                    />
                                    {/* Right / Front Face */}
                                    <polygon
                                      points={`${cL00.px},${cL00.py} ${cLW0.px},${cLW0.py} ${cLWH.px},${cLWH.py} ${cL0H.px},${cL0H.py}`}
                                      fill={p.color}
                                      filter="brightness(0.85)"
                                      stroke="#FFFFFF"
                                      strokeWidth="0.8"
                                      opacity="0.9"
                                    />
                                    {/* Left / Side Face */}
                                    <polygon
                                      points={`${c000.px},${c000.py} ${cL00.px},${cL00.py} ${cL0H.px},${cL0H.py} ${c00H.px},${c00H.py}`}
                                      fill={p.color}
                                      filter="brightness(0.7)"
                                      stroke="#FFFFFF"
                                      strokeWidth="0.8"
                                      opacity="0.9"
                                    />
                                  </g>
                                );
                              })}

                              {/* Outer Wireframe Box Frame */}
                              <line x1={p000.px} y1={p000.py} x2={p00H.px} y2={p00H.py} stroke="#64748B" strokeWidth="1.5" />
                              <line x1={pL00.px} y1={pL00.py} x2={pL0H.px} y2={pL0H.py} stroke="#64748B" strokeWidth="1.5" />
                              <line x1={pLW0.px} y1={pLW0.py} x2={pLWH.px} y2={pLWH.py} stroke="#64748B" strokeWidth="1.5" />
                              <line x1={p0W0.px} y1={p0W0.py} x2={p0WH.px} y2={p0WH.py} stroke="#64748B" strokeWidth="1.5" />
                              <line x1={p00H.px} y1={p00H.py} x2={pL0H.px} y2={pL0H.py} stroke="#64748B" strokeWidth="1.5" strokeDasharray="3 3" />
                              <line x1={pL0H.px} y1={pL0H.py} x2={pLWH.px} y2={pLWH.py} stroke="#64748B" strokeWidth="1.5" strokeDasharray="3 3" />
                              <line x1={pLWH.px} y1={pLWH.py} x2={p0WH.px} y2={p0WH.py} stroke="#64748B" strokeWidth="1.5" strokeDasharray="3 3" />
                              <line x1={p0WH.px} y1={p0WH.py} x2={p00H.px} y2={p00H.py} stroke="#64748B" strokeWidth="1.5" strokeDasharray="3 3" />
                            </g>
                          );
                        })()}
                      </svg>
                    </div>
                  </div>
                )}

                {/* ========================================================= */}
                {/* SIDE PROFILE ELEVATION VIEW */}
                {/* ========================================================= */}
                {viewMode === 'SIDE_ELEVATION' && (
                  <div className="relative bg-slate-950 rounded-2xl p-4 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                      <span>NOSE (Front)</span>
                      <span>HEIGHT CLEARANCE PROFILE (Roof Limit: {truckHeightInches}")</span>
                      <span>REAR (Back)</span>
                    </div>

                    <svg
                      viewBox={`-20 -20 ${(truckLengthFt * 12) + 40} ${truckHeightInches + 40}`}
                      className="w-full h-auto max-h-[300px]"
                    >
                      {/* Trailer Side Profile Box */}
                      <rect
                        x="0"
                        y="0"
                        width={truckLengthFt * 12}
                        height={truckHeightInches}
                        fill="#0F172A"
                        stroke="#334155"
                        strokeWidth="2"
                      />

                      {/* Roof Line */}
                      <line
                        x1="0"
                        y1="0"
                        x2={truckLengthFt * 12}
                        y2="0"
                        stroke="#94A3B8"
                        strokeWidth="3"
                      />

                      {/* Pallets in Elevation (Side profile) */}
                      {fitmentAnalysis.placedUnits.map(p => {
                        // y in SVG is from roof (0) down to floor (truckHeightInches)
                        const bottomY = truckHeightInches - p.zInches;
                        const topY = bottomY - p.height;

                        return (
                          <rect
                            key={`side-${p.uid}`}
                            x={p.xInches}
                            y={topY}
                            width={p.length}
                            height={p.height}
                            fill={p.color}
                            stroke="#FFFFFF"
                            strokeWidth="1"
                            opacity="0.85"
                          />
                        );
                      })}
                    </svg>
                  </div>
                )}

                {/* PRINTABLE CARGO MANIFEST SUMMARY */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-2 font-mono">
                  <div className="flex items-center justify-between text-slate-300 font-bold border-b border-slate-900 pb-2">
                    <span>LOAD FITMENT SPECIFICATION</span>
                    <span className="text-emerald-400">PASSED DIMS CHECK</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400">
                    <div>
                      <span className="text-slate-500 block text-[9.5px]">EQUIPMENT</span>
                      <span className="text-white font-bold">{truckLengthFt}' {truckName.split(' ')[1] || 'Trailer'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9.5px]">TOTAL PIECES</span>
                      <span className="text-white font-bold">{fitmentAnalysis.totalUnitsPlaced} Units</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9.5px]">GROSS WEIGHT</span>
                      <span className="text-purple-300 font-bold">{fitmentAnalysis.totalWeight.toLocaleString()} lbs</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9.5px]">FLOOR UTILIZATION</span>
                      <span className="text-emerald-400 font-bold">{fitmentAnalysis.linearPercentUsed}%</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOOL 2: RPM & RATE MATRIX PROFIT CALCULATOR */}
      {/* ========================================================================= */}
      {activeToolTab === 'RPM_CALCULATOR' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              <span>Rate Per Mile (RPM) &amp; Trip Profit Matrix</span>
            </h2>
            <p className="text-xs text-slate-400">
              Calculate driver break-even RPM, net profit per mile after fuel and factoring, and deadhead cost impact.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Input Variables */}
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 text-xs font-mono">
              <h3 className="font-extrabold text-sm text-slate-200 uppercase font-sans">Trip Parameters</h3>

              <div>
                <label className="text-slate-400 block mb-1">Gross Load Rate ($)</label>
                <input
                  type="number"
                  value={rpmGrossRate}
                  onChange={e => setRpmGrossRate(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-bold text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Loaded Miles</label>
                  <input
                    type="number"
                    value={rpmLoadedMiles}
                    onChange={e => setRpmLoadedMiles(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Deadhead Miles</label>
                  <input
                    type="number"
                    value={rpmDeadheadMiles}
                    onChange={e => setRpmDeadheadMiles(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Fuel ($/gal)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={rpmFuelPrice}
                    onChange={e => setRpmFuelPrice(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Truck MPG</label>
                  <input
                    type="number"
                    step="0.1"
                    value={rpmTruckMpg}
                    onChange={e => setRpmTruckMpg(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Dispatch Fee (%)</label>
                  <input
                    type="number"
                    value={rpmDispatchFeePercent}
                    onChange={e => setRpmDispatchFeePercent(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-purple-300 font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Factoring Fee (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={rpmFactoringPercent}
                    onChange={e => setRpmFactoringPercent(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Tolls &amp; Scales ($)</label>
                <input
                  type="number"
                  value={rpmTollsEstimate}
                  onChange={e => setRpmTollsEstimate(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            {/* Results Display */}
            {rpmAnalysis && (
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-mono uppercase">Gross RPM (All Miles)</span>
                    <p className="text-2xl font-black text-white font-mono mt-1">${rpmAnalysis.grossRpm}/mi</p>
                    <span className="text-[10px] text-slate-500 font-mono">{rpmAnalysis.totalMiles} total miles</span>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-mono uppercase">Loaded RPM Only</span>
                    <p className="text-2xl font-black text-blue-400 font-mono mt-1">${rpmAnalysis.loadedRpm}/mi</p>
                    <span className="text-[10px] text-slate-500 font-mono">{rpmLoadedMiles} loaded miles</span>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-mono uppercase">Net Profit RPM</span>
                    <p className="text-2xl font-black text-emerald-400 font-mono mt-1">${rpmAnalysis.netProfitRpm}/mi</p>
                    <span className="text-[10px] text-emerald-500 font-mono">After all expenses</span>
                  </div>
                </div>

                {/* Financial Breakdown Table */}
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 font-mono text-xs">
                  <h4 className="font-extrabold text-sm text-slate-200 font-sans border-b border-slate-900 pb-2">
                    Estimated Trip Financial Statement
                  </h4>

                  <div className="flex justify-between py-1 text-slate-300">
                    <span>Total Gross Revenue:</span>
                    <span className="font-bold text-white">${rpmGrossRate.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between py-1 text-slate-400">
                    <span>Estimated Fuel Expense ({rpmTruckMpg} MPG @ ${rpmFuelPrice}/gal):</span>
                    <span className="text-rose-400">-${rpmAnalysis.totalFuelCost.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between py-1 text-slate-400">
                    <span>Dispatch Fee ({rpmDispatchFeePercent}%):</span>
                    <span className="text-purple-400">-${rpmAnalysis.dispatchFee.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between py-1 text-slate-400">
                    <span>Factoring Fee ({rpmFactoringPercent}%):</span>
                    <span className="text-rose-400">-${rpmAnalysis.factoringFee.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between py-1 text-slate-400">
                    <span>Tolls &amp; Weigh Stations:</span>
                    <span className="text-rose-400">-${rpmTollsEstimate.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between pt-3 border-t border-slate-800 text-sm font-bold">
                    <span className="text-white">Net Carrier Take-Home:</span>
                    <span className="text-emerald-400 text-base">${rpmAnalysis.netCarrierProfit.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                    <span>Breakeven Rate Threshold:</span>
                    <span>${rpmAnalysis.breakevenGross.toLocaleString()} (${rpmAnalysis.breakevenRpm}/mi)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOOL 3: DISPATCHER SALARY & COMMISSION CALCULATOR */}
      {/* ========================================================================= */}
      {activeToolTab === 'SALARY_CALCULATOR' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-400" />
              <span>Dispatcher Salary &amp; Commission Estimator</span>
            </h2>
            <p className="text-xs text-slate-400">
              Calculate dispatcher earnings from monthly booked gross freight, dispatch fee splits, and local currency conversions (PKR/USD).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 text-xs font-mono">
              <h3 className="font-extrabold text-sm text-slate-200 font-sans">Commission Parameters</h3>

              <div>
                <label className="text-slate-400 block mb-1">Monthly Booked Freight Gross ($)</label>
                <input
                  type="number"
                  value={salMonthlyGrossUSD}
                  onChange={e => setSalMonthlyGrossUSD(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Company Dispatch Fee (%)</label>
                  <input
                    type="number"
                    value={salDispatchFeeRate}
                    onChange={e => setSalDispatchFeeRate(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-purple-300 font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Dispatcher Share (%)</label>
                  <input
                    type="number"
                    value={salCommissionRate}
                    onChange={e => setSalCommissionRate(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Base Monthly Salary (PKR)</label>
                  <input
                    type="number"
                    value={salBaseSalaryPKR}
                    onChange={e => setSalBaseSalaryPKR(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">USD/PKR Rate</label>
                  <input
                    type="number"
                    value={salExchangeRate}
                    onChange={e => setSalExchangeRate(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Performance Bonus ($)</label>
                <input
                  type="number"
                  value={salBonusUSD}
                  onChange={e => setSalBonusUSD(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            {/* Payout Projection Summary */}
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 font-mono text-xs">
              <h3 className="font-extrabold text-sm text-purple-400 font-sans border-b border-slate-900 pb-2">
                Projected Monthly Compensation
              </h3>

              <div className="space-y-2.5 text-slate-300">
                <div className="flex justify-between">
                  <span>Gross Dispatch Fees Collected:</span>
                  <span className="font-bold text-white">${salaryAnalysis.totalDispatchFeeUSD.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dispatcher Commission ({salCommissionRate}% of fees):</span>
                  <span className="font-bold text-emerald-400">${salaryAnalysis.commissionEarnedUSD.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Base Salary Equivalent:</span>
                  <span className="font-bold text-white">${salaryAnalysis.baseSalaryUSD} ({salBaseSalaryPKR.toLocaleString()} PKR)</span>
                </div>
                <div className="flex justify-between">
                  <span>Performance Target Bonus:</span>
                  <span className="font-bold text-white">${salBonusUSD}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2 mt-4">
                <span className="text-[10px] uppercase text-slate-400">Total Estimated Monthly Take-Home:</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-emerald-400">${salaryAnalysis.totalEarningsUSD.toLocaleString()} USD</span>
                  <span className="text-base font-bold text-purple-300">{salaryAnalysis.totalEarningsPKR.toLocaleString()} PKR</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOOL 4: DETENTION & LAYOVER ACCESSORIAL CALCULATOR */}
      {/* ========================================================================= */}
      {activeToolTab === 'DETENTION_CALC' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-400" />
              <span>Detention &amp; Layover Billing Calculator</span>
            </h2>
            <p className="text-xs text-slate-400">
              Calculate facility wait time detention invoices and driver layover compensation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Arrival Time</label>
                  <input
                    type="time"
                    value={detArrivalTime}
                    onChange={e => setDetArrivalTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Departure Time</label>
                  <input
                    type="time"
                    value={detDepartureTime}
                    onChange={e => setDetDepartureTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Free Time Allowance (Hrs)</label>
                  <input
                    type="number"
                    value={detFreeHours}
                    onChange={e => setDetFreeHours(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Detention Rate ($/hr)</label>
                  <input
                    type="number"
                    value={detHourlyRate}
                    onChange={e => setDetHourlyRate(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Layover Days</label>
                  <input
                    type="number"
                    value={detLayoverDays}
                    onChange={e => setDetLayoverDays(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Layover Rate ($/day)</label>
                  <input
                    type="number"
                    value={detLayoverRate}
                    onChange={e => setDetLayoverRate(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 font-mono text-xs">
              <h3 className="font-extrabold text-sm text-amber-400 font-sans border-b border-slate-900 pb-2">
                Accessorial Charges Invoice
              </h3>

              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between">
                  <span>Total Time at Facility:</span>
                  <span className="font-bold text-white">{detentionAnalysis.totalHours} Hours</span>
                </div>
                <div className="flex justify-between">
                  <span>Billable Detention Hours:</span>
                  <span className="font-bold text-amber-400">{detentionAnalysis.billableHours} Hours</span>
                </div>
                <div className="flex justify-between">
                  <span>Detention Amount:</span>
                  <span className="font-bold text-white">${detentionAnalysis.detentionCharges}</span>
                </div>
                <div className="flex justify-between">
                  <span>Layover Amount:</span>
                  <span className="font-bold text-white">${detentionAnalysis.layoverCharges}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-1 mt-4">
                <span className="text-[10px] uppercase text-slate-400">Total Accessorial Due:</span>
                <p className="text-2xl font-black text-amber-400 font-mono">${detentionAnalysis.totalAccessorial}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOOL 5: TRANSIT TIME & HOS DRIVING PLANNER */}
      {/* ========================================================================= */}
      {activeToolTab === 'HOS_PLANNER' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Navigation className="h-5 w-5 text-teal-400" />
              <span>Hours of Service (HOS) &amp; Trip Transit Planner</span>
            </h2>
            <p className="text-xs text-slate-400">
              Calculate DOT compliant delivery ETA accounting for 11-hour driving limits, 10-hour rest periods, and mandatory 30-min breaks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Total Trip Distance (Miles)</label>
                <input
                  type="number"
                  value={hosDistanceMiles}
                  onChange={e => setHosDistanceMiles(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold text-base"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Average Highway Speed (MPH)</label>
                <input
                  type="number"
                  value={hosAvgSpeedMph}
                  onChange={e => setHosAvgSpeedMph(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Departure Date</label>
                  <input
                    type="date"
                    value={hosDepartureDate}
                    onChange={e => setHosDepartureDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Departure Time</label>
                  <input
                    type="time"
                    value={hosDepartureHour}
                    onChange={e => setHosDepartureHour(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>
            </div>

            {hosAnalysis && (
              <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 font-mono text-xs">
                <h3 className="font-extrabold text-sm text-teal-400 font-sans border-b border-slate-900 pb-2">
                  Trip Schedule &amp; ETA Projection
                </h3>

                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between">
                    <span>Pure Driving Time:</span>
                    <span className="font-bold text-white">{hosAnalysis.totalDrivingHours} Hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Required 10-Hr Rest Breaks:</span>
                    <span className="font-bold text-amber-400">{hosAnalysis.cyclesNeeded} Breaks ({hosAnalysis.restBreakHours} Hrs)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mandatory 30-Min Rest Breaks:</span>
                    <span className="font-bold text-slate-400">{hosAnalysis.intermediateBreaksHours} Hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Elapsed Transit Time:</span>
                    <span className="font-bold text-teal-300">{hosAnalysis.totalElapsedTransitHours} Hours</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-1 mt-4">
                  <span className="text-[10px] uppercase text-slate-400">Estimated Delivery Arrival (ETA):</span>
                  <p className="text-lg font-black text-teal-400 font-sans">{hosAnalysis.estimatedArrivalFormatted}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
