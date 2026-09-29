import { Driver, Load, FinancialTransaction, DriverAdvance, DriverSettlement, PendingDriverPayment } from '../types';

/**
 * Returns drivers sorted by usage frequency (most-used drivers at the top).
 */
export function getSortedDriversByFrequency(
  drivers: Driver[] = [],
  loads: Load[] = [],
  transactions: FinancialTransaction[] = [],
  advances: DriverAdvance[] = [],
  settlements: DriverSettlement[] = [],
  pendingPayments: PendingDriverPayment[] = []
): Driver[] {
  if (!drivers || drivers.length === 0) return [];

  const frequencyMap: Record<string, number> = {};

  // Count in loads
  loads.forEach(l => {
    if (l.driverId) {
      frequencyMap[l.driverId] = (frequencyMap[l.driverId] || 0) + 1;
    }
  });

  // Count in advances
  advances.forEach(a => {
    if (a.driverId) {
      frequencyMap[a.driverId] = (frequencyMap[a.driverId] || 0) + 1;
    }
  });

  // Count in settlements
  settlements.forEach(s => {
    if (s.driverId) {
      frequencyMap[s.driverId] = (frequencyMap[s.driverId] || 0) + 1;
    }
  });

  // Count in pending payments
  pendingPayments.forEach(p => {
    if (p.driverId) {
      frequencyMap[p.driverId] = (frequencyMap[p.driverId] || 0) + 1;
    }
  });

  // Count in transactions (by name or receiver)
  transactions.forEach(t => {
    drivers.forEach(d => {
      if (t.receiverName && t.receiverName.toLowerCase().includes(d.name.toLowerCase())) {
        frequencyMap[d.id] = (frequencyMap[d.id] || 0) + 1;
      }
    });
  });

  return [...drivers].sort((a, b) => {
    const freqA = frequencyMap[a.id] || 0;
    const freqB = frequencyMap[b.id] || 0;
    if (freqB !== freqA) {
      return freqB - freqA; // Higher frequency first
    }
    return a.name.localeCompare(b.name);
  });
}
