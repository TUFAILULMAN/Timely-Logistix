/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { User, Dispatcher, Driver, Load, ClockRecord, SystemState, CarrierOrOwner, Lead, SalesDailyLog, ChatMessage, CompanySettings, UserRole, SeatPermissions, DriverSettlement, Invoice, CompanyBroadcast, HRStaffProfile, LeaveRequest, SalarySlip, SalaryStructure, DriverAdvance, FinancialTransaction, PendingDriverPayment, PartialPaymentEntry, DataSnapshot, BrokerContact, DriverDailyPosting, DriverPostingStatus, TrainingScriptConfig } from './types';
import {
  INITIAL_USERS,
  INITIAL_DISPATCHERS,
  INITIAL_DRIVERS,
  INITIAL_LOADS,
  INITIAL_ATTENDANCE,
  INITIAL_CARRIERS,
  INITIAL_LEADS,
  INITIAL_SALES_LOGS,
  INITIAL_ADVANCES,
  INITIAL_TRANSACTIONS,
  INITIAL_PENDING_PAYMENTS,
  INITIAL_INVOICES,
  INITIAL_BROKERS,
  INITIAL_DRIVER_POSTINGS,
  INITIAL_TRAINING_SCRIPTS,
  INITIAL_HR_PROFILES,
  INITIAL_LEAVES,
  INITIAL_SALARY_SLIPS
} from './initialData';
import { db, ensureAuth, auth } from './firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDoc, getDocs } from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { findUserActiveShift, parseTimeToMinutes, parseFullDateTimeToMs, calculateBreakMinutes, normalizeTimestamp } from './utils/timeTracker';

// Mandated Error Handler
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid || 'anonymous_or_agent',
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || false,
      isAnonymous: auth.currentUser?.isAnonymous || false,
      tenantId: auth.currentUser?.tenantId || null,
    },
    operationType,
    path
  };
  console.warn('Firestore Notice (Offline Fallback Active):', JSON.stringify(errInfo));
}

const STORAGE_KEY = 'dispatch_operations_data_v1';
const SNAPSHOTS_KEY = 'dispatch_operations_snapshots_v1';
const CURRENT_USER_SESSION_KEY = 'timely_auth_session_user_v1';
const PERMANENT_USERS_KEY = 'DMS_PERMANENT_USERS_V2';
const PERMANENT_DISPATCHERS_KEY = 'DMS_PERMANENT_DISPATCHERS_V2';

// Strict sample data exclusion for old dummy seed fixtures
const BANNED_SAMPLE_KEYS = new Set([
  'c_today_1', 'c_today_2', 'c_today_3', 'c_today_4', 'c_yest_1', 'c_yest_2', 'c_yest_3'
]);

export function isSampleUserOrDispatcher(id?: string, username?: string, name?: string): boolean {
  if (id && BANNED_SAMPLE_KEYS.has(id.toLowerCase().trim())) {
    return true;
  }
  if (username) {
    const cleanU = username.toLowerCase().trim();
    if (BANNED_SAMPLE_KEYS.has(cleanU)) return true;
  }
  if (name) {
    const cleanN = name.toLowerCase().trim();
    if (BANNED_SAMPLE_KEYS.has(cleanN)) return true;
  }
  return false;
}

export function mergeAttendanceList(localList: ClockRecord[], incomingList: ClockRecord[]): ClockRecord[] {
  const map = new Map<string, ClockRecord>();
  (localList || []).forEach(a => {
    if (a && a.id) {
      const cleanRecord: ClockRecord = {
        ...a,
        clockInTimestamp: normalizeTimestamp(a.clockInTimestamp),
        clockOutTimestamp: normalizeTimestamp(a.clockOutTimestamp)
      };
      map.set(a.id, cleanRecord);
    }
  });
  (incomingList || []).forEach(a => {
    if (a && a.id) {
      const existing = map.get(a.id);
      const incomingInTs = normalizeTimestamp(a.clockInTimestamp);
      const incomingOutTs = normalizeTimestamp(a.clockOutTimestamp);
      const existingInTs = existing ? normalizeTimestamp(existing.clockInTimestamp) : undefined;
      const existingOutTs = existing ? normalizeTimestamp(existing.clockOutTimestamp) : undefined;

      const mergedRecord: ClockRecord = {
        ...existing,
        ...a,
        clockInTimestamp: incomingInTs || existingInTs,
        clockOutTimestamp: incomingOutTs || existingOutTs,
        breaksTaken: a.breaksTaken && a.breaksTaken.length > 0 ? a.breaksTaken : existing?.breaksTaken,
        shortLeavesTaken: a.shortLeavesTaken && a.shortLeavesTaken.length > 0 ? a.shortLeavesTaken : existing?.shortLeavesTaken
      };
      map.set(a.id, mergedRecord);
    }
  });
  return Array.from(map.values());
}

export function mergeUsersList(baseList: User[], incomingList: User[]): User[] {
  const map = new Map<string, User>();
  baseList.forEach(u => {
    if (u && u.id && !isSampleUserOrDispatcher(u.id, u.username, u.name)) {
      map.set(u.id, u);
      if (u.username) map.set(u.username.toLowerCase().trim(), u);
    }
  });
  incomingList.forEach(u => {
    if (u && u.id && !isSampleUserOrDispatcher(u.id, u.username, u.name)) {
      const existing = map.get(u.id) || (u.username ? map.get(u.username.toLowerCase().trim()) : null);
      map.set(u.id, { ...existing, ...u });
      if (u.username) map.set(u.username.toLowerCase().trim(), { ...existing, ...u });
    }
  });
  const unique = new Map<string, User>();
  Array.from(map.values()).forEach(u => {
    if (u && u.id && !isSampleUserOrDispatcher(u.id, u.username, u.name)) unique.set(u.id, u);
  });
  return Array.from(unique.values());
}

export function mergeDispatchersList(baseList: Dispatcher[], incomingList: Dispatcher[]): Dispatcher[] {
  const map = new Map<string, Dispatcher>();
  baseList.forEach(d => {
    if (d && d.id && !isSampleUserOrDispatcher(d.id, d.username, d.name)) {
      map.set(d.id, d);
      if (d.username) map.set(d.username.toLowerCase().trim(), d);
    }
  });
  incomingList.forEach(d => {
    if (d && d.id && !isSampleUserOrDispatcher(d.id, d.username, d.name)) {
      const existing = map.get(d.id) || (d.username ? map.get(d.username.toLowerCase().trim()) : null);
      map.set(d.id, { ...existing, ...d });
      if (d.username) map.set(d.username.toLowerCase().trim(), { ...existing, ...d });
    }
  });
  const unique = new Map<string, Dispatcher>();
  Array.from(map.values()).forEach(d => {
    if (d && d.id && !isSampleUserOrDispatcher(d.id, d.username, d.name)) unique.set(d.id, d);
  });
  return Array.from(unique.values());
}

export function getPermanentUsers(): User[] {
  try {
    const raw = localStorage.getItem(PERMANENT_USERS_KEY);
    if (raw !== null) {
      const parsed: User[] = JSON.parse(raw);
      return parsed.filter(u => !isSampleUserOrDispatcher(u?.id, u?.username, u?.name));
    }
    return INITIAL_USERS;
  } catch (e) {
    return INITIAL_USERS;
  }
}

export function savePermanentUsers(users: User[]): void {
  try {
    const sanitized = (users || []).filter(u => !isSampleUserOrDispatcher(u?.id, u?.username, u?.name));
    safeSetLocalStorage(PERMANENT_USERS_KEY, JSON.stringify(sanitized));
  } catch (e) {
    console.warn('Failed to persist users:', e);
  }
}

export function getPermanentDispatchers(): Dispatcher[] {
  try {
    const raw = localStorage.getItem(PERMANENT_DISPATCHERS_KEY);
    if (raw !== null) {
      const parsed: Dispatcher[] = JSON.parse(raw);
      return parsed.filter(d => !isSampleUserOrDispatcher(d?.id, d?.username, d?.name));
    }
    return INITIAL_DISPATCHERS;
  } catch (e) {
    return INITIAL_DISPATCHERS;
  }
}

export function savePermanentDispatchers(dispatchers: Dispatcher[]): void {
  try {
    const sanitized = (dispatchers || []).filter(d => !isSampleUserOrDispatcher(d?.id, d?.username, d?.name));
    safeSetLocalStorage(PERMANENT_DISPATCHERS_KEY, JSON.stringify(sanitized));
  } catch (e) {
    console.warn('Failed to persist dispatchers:', e);
  }
}

export const ATTENDANCE_PERSIST_KEY = 'DMS_PERMANENT_ATTENDANCE_V2';

export function getPermanentAttendance(): ClockRecord[] {
  try {
    const raw = localStorage.getItem(ATTENDANCE_PERSIST_KEY);
    if (raw !== null) {
      return JSON.parse(raw);
    }
    return INITIAL_ATTENDANCE;
  } catch (e) {
    return INITIAL_ATTENDANCE;
  }
}

export function savePermanentAttendance(attendance: ClockRecord[]): void {
  try {
    safeSetLocalStorage(ATTENDANCE_PERSIST_KEY, JSON.stringify((attendance || []).slice(0, 150)));
  } catch (e) {
    console.warn('Failed to persist attendance:', e);
  }
}

// Dedicated Multi-Tier Permanent Storage Keys for Core Business Records
export const PERMANENT_LOADS_KEY = 'DMS_PERMANENT_LOADS_V2';
export const PERMANENT_DRIVERS_KEY = 'DMS_PERMANENT_DRIVERS_V2';
export const PERMANENT_CARRIERS_KEY = 'DMS_PERMANENT_CARRIERS_V2';
export const PERMANENT_INVOICES_KEY = 'DMS_PERMANENT_INVOICES_V2';
export const PERMANENT_ADVANCES_KEY = 'DMS_PERMANENT_ADVANCES_V2';
export const PERMANENT_BROKERS_KEY = 'DMS_PERMANENT_BROKERS_V2';
export const PERMANENT_SETTLEMENTS_KEY = 'DMS_PERMANENT_SETTLEMENTS_V2';
export const PERMANENT_TRANSACTIONS_KEY = 'DMS_PERMANENT_TRANSACTIONS_V2';
export const PERMANENT_LEADS_KEY = 'DMS_PERMANENT_LEADS_V2';

export function mergeLoadsList(baseList: Load[], incomingList: Load[]): Load[] {
  const map = new Map<string, Load>();
  (baseList || []).forEach(l => {
    if (l && l.id) {
      map.set(l.id, l);
      if (l.loadNum) map.set(`num_${l.loadNum}`, l);
    }
  });
  (incomingList || []).forEach(l => {
    if (l && l.id) {
      const existing = map.get(l.id) || (l.loadNum ? map.get(`num_${l.loadNum}`) : null);
      const merged = { ...existing, ...l };
      map.set(l.id, merged);
      if (l.loadNum) map.set(`num_${l.loadNum}`, merged);
    }
  });
  const unique = new Map<string, Load>();
  Array.from(map.values()).forEach(l => {
    if (l && l.id) unique.set(l.id, l);
  });
  return Array.from(unique.values());
}

export function getPermanentLoads(): Load[] {
  try {
    const raw = localStorage.getItem(PERMANENT_LOADS_KEY);
    if (raw !== null) {
      return JSON.parse(raw);
    }
    return INITIAL_LOADS;
  } catch (e) {
    return INITIAL_LOADS;
  }
}

export function savePermanentLoads(loads: Load[]): void {
  try {
    safeSetLocalStorage(PERMANENT_LOADS_KEY, JSON.stringify(loads || []));
  } catch (e) {
    console.warn('Failed to persist loads:', e);
  }
}

export function mergeDriversList(baseList: Driver[], incomingList: Driver[]): Driver[] {
  const map = new Map<string, Driver>();
  (baseList || []).forEach(d => {
    if (d && d.id) {
      map.set(d.id, d);
      if (d.name) map.set(`name_${d.name.toLowerCase().trim()}`, d);
    }
  });
  (incomingList || []).forEach(d => {
    if (d && d.id) {
      const existing = map.get(d.id) || (d.name ? map.get(`name_${d.name.toLowerCase().trim()}`) : null);
      const merged = { ...existing, ...d };
      map.set(d.id, merged);
      if (d.name) map.set(`name_${d.name.toLowerCase().trim()}`, merged);
    }
  });
  const unique = new Map<string, Driver>();
  Array.from(map.values()).forEach(d => {
    if (d && d.id) unique.set(d.id, d);
  });
  return Array.from(unique.values());
}

export function getPermanentDrivers(): Driver[] {
  try {
    const raw = localStorage.getItem(PERMANENT_DRIVERS_KEY);
    if (raw !== null) {
      return JSON.parse(raw);
    }
    return INITIAL_DRIVERS;
  } catch (e) {
    return INITIAL_DRIVERS;
  }
}

export function savePermanentDrivers(drivers: Driver[]): void {
  try {
    safeSetLocalStorage(PERMANENT_DRIVERS_KEY, JSON.stringify(drivers || []));
  } catch (e) {
    console.warn('Failed to persist drivers:', e);
  }
}

export function mergeCarriersList(baseList: CarrierOrOwner[], incomingList: CarrierOrOwner[]): CarrierOrOwner[] {
  const map = new Map<string, CarrierOrOwner>();
  (baseList || []).forEach(c => {
    if (c && c.id) {
      map.set(c.id, c);
      if (c.name) map.set(`cname_${c.name.toLowerCase().trim()}`, c);
    }
  });
  (incomingList || []).forEach(c => {
    if (c && c.id) {
      const existing = map.get(c.id) || (c.name ? map.get(`cname_${c.name.toLowerCase().trim()}`) : null);
      const merged = { ...existing, ...c };
      map.set(c.id, merged);
      if (c.name) map.set(`cname_${c.name.toLowerCase().trim()}`, merged);
    }
  });
  const unique = new Map<string, CarrierOrOwner>();
  Array.from(map.values()).forEach(c => {
    if (c && c.id) unique.set(c.id, c);
  });
  return Array.from(unique.values());
}

export function getPermanentCarriers(): CarrierOrOwner[] {
  try {
    const raw = localStorage.getItem(PERMANENT_CARRIERS_KEY);
    if (raw !== null) {
      return JSON.parse(raw);
    }
    return INITIAL_CARRIERS;
  } catch (e) {
    return INITIAL_CARRIERS;
  }
}

export function savePermanentCarriers(carriers: CarrierOrOwner[]): void {
  try {
    safeSetLocalStorage(PERMANENT_CARRIERS_KEY, JSON.stringify(carriers || []));
  } catch (e) {
    console.warn('Failed to persist carriers:', e);
  }
}

export function mergeInvoicesList(baseList: Invoice[], incomingList: Invoice[]): Invoice[] {
  const map = new Map<string, Invoice>();
  (baseList || []).forEach(i => {
    if (i && i.id) {
      map.set(i.id, i);
      const invNum = i.invoiceNum || (i as any).invoiceNumber;
      if (invNum) map.set(`inv_${String(invNum).toLowerCase().trim()}`, i);
    }
  });
  (incomingList || []).forEach(i => {
    if (i && i.id) {
      const invNum = i.invoiceNum || (i as any).invoiceNumber;
      const existing = map.get(i.id) || (invNum ? map.get(`inv_${String(invNum).toLowerCase().trim()}`) : null);
      const merged = { ...existing, ...i };
      map.set(i.id, merged);
      if (invNum) map.set(`inv_${String(invNum).toLowerCase().trim()}`, merged);
    }
  });
  const unique = new Map<string, Invoice>();
  Array.from(map.values()).forEach(i => {
    if (i && i.id) unique.set(i.id, i);
  });
  return Array.from(unique.values());
}

export function getPermanentInvoices(): Invoice[] {
  try {
    const raw = localStorage.getItem(PERMANENT_INVOICES_KEY);
    if (raw !== null) {
      return JSON.parse(raw);
    }
    return INITIAL_INVOICES;
  } catch (e) {
    return INITIAL_INVOICES;
  }
}

export function savePermanentInvoices(invoices: Invoice[]): void {
  try {
    safeSetLocalStorage(PERMANENT_INVOICES_KEY, JSON.stringify(invoices || []));
  } catch (e) {
    console.warn('Failed to persist invoices:', e);
  }
}

export function mergeAdvancesList(baseList: DriverAdvance[], incomingList: DriverAdvance[]): DriverAdvance[] {
  const map = new Map<string, DriverAdvance>();
  (baseList || []).forEach(a => {
    if (a && a.id) map.set(a.id, a);
  });
  (incomingList || []).forEach(a => {
    if (a && a.id) {
      const existing = map.get(a.id);
      map.set(a.id, { ...existing, ...a });
    }
  });
  return Array.from(map.values());
}

export function getPermanentAdvances(): DriverAdvance[] {
  try {
    const raw = localStorage.getItem(PERMANENT_ADVANCES_KEY);
    if (raw !== null) {
      return JSON.parse(raw);
    }
    return INITIAL_ADVANCES;
  } catch (e) {
    return INITIAL_ADVANCES;
  }
}

export function savePermanentAdvances(advances: DriverAdvance[]): void {
  try {
    safeSetLocalStorage(PERMANENT_ADVANCES_KEY, JSON.stringify(advances || []));
  } catch (e) {
    console.warn('Failed to persist advances:', e);
  }
}

export function mergeBrokersList(baseList: BrokerContact[], incomingList: BrokerContact[]): BrokerContact[] {
  const map = new Map<string, BrokerContact>();
  (baseList || []).forEach(b => {
    if (b && b.id) {
      map.set(b.id, b);
      if (b.companyName) map.set(`bcomp_${b.companyName.toLowerCase().trim()}`, b);
    }
  });
  (incomingList || []).forEach(b => {
    if (b && b.id) {
      const existing = map.get(b.id) || (b.companyName ? map.get(`bcomp_${b.companyName.toLowerCase().trim()}`) : null);
      const merged = { ...existing, ...b };
      map.set(b.id, merged);
      if (b.companyName) map.set(`bcomp_${b.companyName.toLowerCase().trim()}`, merged);
    }
  });
  const unique = new Map<string, BrokerContact>();
  Array.from(map.values()).forEach(b => {
    if (b && b.id) unique.set(b.id, b);
  });
  return Array.from(unique.values());
}

export function getPermanentBrokers(): BrokerContact[] {
  try {
    const raw = localStorage.getItem(PERMANENT_BROKERS_KEY);
    if (raw !== null) {
      return JSON.parse(raw);
    }
    return INITIAL_BROKERS;
  } catch (e) {
    return INITIAL_BROKERS;
  }
}

export function savePermanentBrokers(brokers: BrokerContact[]): void {
  try {
    safeSetLocalStorage(PERMANENT_BROKERS_KEY, JSON.stringify(brokers || []));
  } catch (e) {
    console.warn('Failed to persist brokers:', e);
  }
}

export function mergeSettlementsList(baseList: DriverSettlement[], incomingList: DriverSettlement[]): DriverSettlement[] {
  const map = new Map<string, DriverSettlement>();
  (baseList || []).forEach(s => {
    if (s && s.id) map.set(s.id, s);
  });
  (incomingList || []).forEach(s => {
    if (s && s.id) {
      const existing = map.get(s.id);
      map.set(s.id, { ...existing, ...s });
    }
  });
  return Array.from(map.values());
}

export function getPermanentSettlements(): DriverSettlement[] {
  try {
    const raw = localStorage.getItem(PERMANENT_SETTLEMENTS_KEY);
    if (raw !== null) {
      return JSON.parse(raw);
    }
    return [];
  } catch (e) {
    return [];
  }
}

export function savePermanentSettlements(settlements: DriverSettlement[]): void {
  try {
    safeSetLocalStorage(PERMANENT_SETTLEMENTS_KEY, JSON.stringify(settlements || []));
  } catch (e) {
    console.warn('Failed to persist settlements:', e);
  }
}

export function mergeTransactionsList(baseList: FinancialTransaction[], incomingList: FinancialTransaction[]): FinancialTransaction[] {
  const map = new Map<string, FinancialTransaction>();
  (baseList || []).forEach(t => {
    if (t && t.id) map.set(t.id, t);
  });
  (incomingList || []).forEach(t => {
    if (t && t.id) {
      const existing = map.get(t.id);
      map.set(t.id, { ...existing, ...t });
    }
  });
  return Array.from(map.values());
}

export function getPermanentTransactions(): FinancialTransaction[] {
  try {
    const raw = localStorage.getItem(PERMANENT_TRANSACTIONS_KEY);
    if (raw !== null) {
      return JSON.parse(raw);
    }
    return INITIAL_TRANSACTIONS;
  } catch (e) {
    return INITIAL_TRANSACTIONS;
  }
}

export function savePermanentTransactions(txns: FinancialTransaction[]): void {
  try {
    safeSetLocalStorage(PERMANENT_TRANSACTIONS_KEY, JSON.stringify(txns || []));
  } catch (e) {
    console.warn('Failed to persist transactions:', e);
  }
}

export function mergeLeadsList(baseList: Lead[], incomingList: Lead[]): Lead[] {
  const map = new Map<string, Lead>();
  (baseList || []).forEach(l => {
    if (l && l.id) map.set(l.id, l);
  });
  (incomingList || []).forEach(l => {
    if (l && l.id) {
      const existing = map.get(l.id);
      map.set(l.id, { ...existing, ...l });
    }
  });
  return Array.from(map.values());
}

export function getPermanentLeads(): Lead[] {
  try {
    const raw = localStorage.getItem(PERMANENT_LEADS_KEY);
    if (raw !== null) {
      return JSON.parse(raw);
    }
    return INITIAL_LEADS;
  } catch (e) {
    return INITIAL_LEADS;
  }
}

export function savePermanentLeads(leads: Lead[]): void {
  try {
    safeSetLocalStorage(PERMANENT_LEADS_KEY, JSON.stringify(leads || []));
  } catch (e) {
    console.warn('Failed to persist leads:', e);
  }
}

export const PERMANENT_HR_KEY = 'DMS_PERMANENT_HR_V2';
export const PERMANENT_LEAVES_KEY = 'DMS_PERMANENT_LEAVES_V2';
export const PERMANENT_SALARY_SLIPS_KEY = 'DMS_PERMANENT_SALARY_SLIPS_V2';

export function mergeHRList(baseList: HRStaffProfile[], incomingList: HRStaffProfile[]): HRStaffProfile[] {
  const map = new Map<string, HRStaffProfile>();
  (baseList || []).forEach(h => {
    if (h && h.id) map.set(h.id, h);
  });
  (incomingList || []).forEach(h => {
    if (h && h.id) {
      const existing = map.get(h.id);
      map.set(h.id, { ...existing, ...h });
    }
  });
  return Array.from(map.values());
}

export function getPermanentHR(): HRStaffProfile[] {
  try {
    const raw = localStorage.getItem(PERMANENT_HR_KEY);
    if (raw !== null) {
      return JSON.parse(raw);
    }
    return INITIAL_HR_PROFILES;
  } catch (e) {
    return INITIAL_HR_PROFILES;
  }
}

export function savePermanentHR(profiles: HRStaffProfile[]): void {
  try {
    safeSetLocalStorage(PERMANENT_HR_KEY, JSON.stringify(profiles || []));
  } catch (e) {
    console.warn('Failed to persist HR profiles:', e);
  }
}

export function mergeLeavesList(baseList: LeaveRequest[], incomingList: LeaveRequest[]): LeaveRequest[] {
  const map = new Map<string, LeaveRequest>();
  (baseList || []).forEach(l => {
    if (l && l.id) map.set(l.id, l);
  });
  (incomingList || []).forEach(l => {
    if (l && l.id) {
      const existing = map.get(l.id);
      map.set(l.id, { ...existing, ...l });
    }
  });
  return Array.from(map.values());
}

export function getPermanentLeaves(): LeaveRequest[] {
  try {
    const raw = localStorage.getItem(PERMANENT_LEAVES_KEY);
    if (raw !== null) {
      return JSON.parse(raw);
    }
    return INITIAL_LEAVES;
  } catch (e) {
    return INITIAL_LEAVES;
  }
}

export function savePermanentLeaves(leaves: LeaveRequest[]): void {
  try {
    safeSetLocalStorage(PERMANENT_LEAVES_KEY, JSON.stringify(leaves || []));
  } catch (e) {
    console.warn('Failed to persist leaves:', e);
  }
}

export function mergeSalarySlipsList(baseList: SalarySlip[], incomingList: SalarySlip[]): SalarySlip[] {
  const map = new Map<string, SalarySlip>();
  (baseList || []).forEach(s => {
    if (s && s.id) map.set(s.id, s);
  });
  (incomingList || []).forEach(s => {
    if (s && s.id) {
      const existing = map.get(s.id);
      map.set(s.id, { ...existing, ...s });
    }
  });
  return Array.from(map.values());
}

export function getPermanentSalarySlips(): SalarySlip[] {
  try {
    const raw = localStorage.getItem(PERMANENT_SALARY_SLIPS_KEY);
    if (raw !== null) {
      return JSON.parse(raw);
    }
    return INITIAL_SALARY_SLIPS;
  } catch (e) {
    return INITIAL_SALARY_SLIPS;
  }
}

export function savePermanentSalarySlips(slips: SalarySlip[]): void {
  try {
    safeSetLocalStorage(PERMANENT_SALARY_SLIPS_KEY, JSON.stringify(slips || []));
  } catch (e) {
    console.warn('Failed to persist salary slips:', e);
  }
}

export const PERMANENT_DRIVER_POSTINGS_KEY = 'DMS_PERMANENT_DRIVER_POSTINGS_V2';
export const PERMANENT_SALES_LOGS_KEY = 'DMS_PERMANENT_SALES_LOGS_V2';

export function mergeDriverPostingsList(baseList: DriverDailyPosting[], incomingList: DriverDailyPosting[]): DriverDailyPosting[] {
  const map = new Map<string, DriverDailyPosting>();
  (baseList || []).forEach(p => {
    if (p && (p.id || p.driverId)) {
      map.set(p.id || p.driverId, p);
      if (p.driverId) map.set(`drv_${p.driverId}`, p);
    }
  });
  (incomingList || []).forEach(p => {
    if (p && (p.id || p.driverId)) {
      const existing = map.get(p.id) || (p.driverId ? map.get(`drv_${p.driverId}`) : null);
      const merged = { ...existing, ...p };
      map.set(p.id || p.driverId, merged);
      if (p.driverId) map.set(`drv_${p.driverId}`, merged);
    }
  });
  const unique = new Map<string, DriverDailyPosting>();
  Array.from(map.values()).forEach(p => {
    if (p && (p.id || p.driverId)) unique.set(p.id || p.driverId, p);
  });
  return Array.from(unique.values());
}

export function getPermanentDriverPostings(): DriverDailyPosting[] {
  try {
    const raw = localStorage.getItem(PERMANENT_DRIVER_POSTINGS_KEY);
    if (raw !== null) {
      return JSON.parse(raw);
    }
    return INITIAL_DRIVER_POSTINGS;
  } catch (e) {
    return INITIAL_DRIVER_POSTINGS;
  }
}

export function savePermanentDriverPostings(postings: DriverDailyPosting[]): void {
  try {
    safeSetLocalStorage(PERMANENT_DRIVER_POSTINGS_KEY, JSON.stringify(postings || []));
  } catch (e) {
    console.warn('Failed to persist driver postings:', e);
  }
}

export function mergeSalesLogsList(baseList: SalesDailyLog[], incomingList: SalesDailyLog[]): SalesDailyLog[] {
  const map = new Map<string, SalesDailyLog>();
  (baseList || []).forEach(l => {
    if (l && l.id) map.set(l.id, l);
  });
  (incomingList || []).forEach(l => {
    if (l && l.id) {
      const existing = map.get(l.id);
      map.set(l.id, { ...existing, ...l });
    }
  });
  return Array.from(map.values());
}

export function getPermanentSalesLogs(): SalesDailyLog[] {
  try {
    const raw = localStorage.getItem(PERMANENT_SALES_LOGS_KEY);
    if (raw !== null) {
      return JSON.parse(raw);
    }
    return INITIAL_SALES_LOGS;
  } catch (e) {
    return INITIAL_SALES_LOGS;
  }
}

export function savePermanentSalesLogs(logs: SalesDailyLog[]): void {
  try {
    safeSetLocalStorage(PERMANENT_SALES_LOGS_KEY, JSON.stringify(logs || []));
  } catch (e) {
    console.warn('Failed to persist sales logs:', e);
  }
}

export function safeSetLocalStorage(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn(`LocalStorage quota reached when setting "${key}". Pruning local storage snapshots to free space...`, e);
    try {
      const snapshotsRaw = localStorage.getItem(SNAPSHOTS_KEY);
      if (snapshotsRaw) {
        const parsedSnapshots: DataSnapshot[] = JSON.parse(snapshotsRaw);
        if (parsedSnapshots.length > 2) {
          localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(parsedSnapshots.slice(0, 2)));
        } else {
          localStorage.removeItem(SNAPSHOTS_KEY);
        }
      }
    } catch (cleanErr) {
      console.warn("Failed to prune snapshots key:", cleanErr);
      try {
        localStorage.removeItem(SNAPSHOTS_KEY);
      } catch (err2) {}
    }

    try {
      localStorage.setItem(key, value);
      return true;
    } catch (retryErr) {
      console.warn(`LocalStorage write still exceeded quota for "${key}". Session state remains active in React state & Firestore.`, retryErr);
      return false;
    }
  }
}

export function getLocalSnapshots(): DataSnapshot[] {
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveSnapshotToStorage(label: string, stateToSave: SystemState): DataSnapshot {
  const existing = getLocalSnapshots();
  const snapshot: DataSnapshot = {
    id: `snap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    label,
    data: stateToSave,
    itemCounts: {
      loads: stateToSave.loads?.length || 0,
      drivers: stateToSave.drivers?.length || 0,
      dispatchers: stateToSave.dispatchers?.length || 0,
      invoices: stateToSave.invoices?.length || 0,
      transactions: stateToSave.financialTransactions?.length || 0,
      driverAdvances: stateToSave.driverAdvances?.length || 0,
      pendingDriverPayments: stateToSave.pendingDriverPayments?.length || 0
    }
  };
  const updated = [snapshot, ...existing].slice(0, 5);
  safeSetLocalStorage(SNAPSHOTS_KEY, JSON.stringify(updated));
  return snapshot;
}

const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  name: "Timely Logistix",
  tagline: "Commercial Fleet Console",
  address: "Timely Logistix Inc.\n100 Freight Way, Suite A\nChicago, IL 60601",
  phone: "(555) 123-4567",
  email: "dispatch@timelylogistix.com",
  logoUrl: ""
};

export function useSystemState() {
  const [state, setState] = useState<SystemState>(() => {
    let savedUser: User | null = null;
    try {
      const userRaw = localStorage.getItem(CURRENT_USER_SESSION_KEY);
      if (userRaw) {
        savedUser = JSON.parse(userRaw);
      }
    } catch (e) {
      console.warn('Failed to parse auth user session:', e);
    }

    const permanentUsers = getPermanentUsers();
    const permanentDispatchers = getPermanentDispatchers();
    const permanentAttendance = getPermanentAttendance();
    const permanentLoads = getPermanentLoads();
    const permanentDrivers = getPermanentDrivers();
    const permanentCarriers = getPermanentCarriers();
    const permanentInvoices = getPermanentInvoices();
    const permanentAdvances = getPermanentAdvances();
    const permanentBrokers = getPermanentBrokers();
    const permanentSettlements = getPermanentSettlements();
    const permanentTxns = getPermanentTransactions();
    const permanentLeads = getPermanentLeads();
    const permanentHR = getPermanentHR();
    const permanentLeaves = getPermanentLeaves();
    const permanentSalarySlips = getPermanentSalarySlips();
    const permanentDriverPostings = getPermanentDriverPostings();
    const permanentSalesLogs = getPermanentSalesLogs();

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const userObj = savedUser || parsed.currentUser || null;
        const initialAttendance = mergeAttendanceList(permanentAttendance, parsed.attendance || []);
        const activeClock = findUserActiveShift(initialAttendance, userObj) || (parsed.currentClockRecord && !parsed.currentClockRecord.clockOut ? parsed.currentClockRecord : null);
        const initialLoads = mergeLoadsList(permanentLoads, parsed.loads || []);

        return {
          users: mergeUsersList(permanentUsers, parsed.users || []),
          dispatchers: mergeDispatchersList(permanentDispatchers.length > 0 ? permanentDispatchers : INITIAL_DISPATCHERS, parsed.dispatchers || []),
          drivers: mergeDriversList(permanentDrivers, parsed.drivers || []),
          carriers: mergeCarriersList(permanentCarriers, parsed.carriers || []),
          loads: initialLoads,
          attendance: initialAttendance,
          leads: mergeLeadsList(permanentLeads, parsed.leads || []),
          salesDailyLogs: mergeSalesLogsList(permanentSalesLogs, parsed.salesDailyLogs || []),
          currentUser: userObj,
          currentClockRecord: activeClock,
          factoringRatePercent: parsed.factoringRatePercent !== undefined ? parsed.factoringRatePercent : 3.25,
          messages: parsed.messages || [],
          companySettings: parsed.companySettings || DEFAULT_COMPANY_SETTINGS,
          driverSettlements: mergeSettlementsList(permanentSettlements, parsed.driverSettlements || []),
          invoices: mergeInvoicesList(permanentInvoices, parsed.invoices || []),
          broadcasts: parsed.broadcasts || [],
          hrProfiles: mergeHRList(permanentHR, parsed.hrProfiles || []),
          leaveRequests: mergeLeavesList(permanentLeaves, parsed.leaveRequests || []),
          salarySlips: mergeSalarySlipsList(permanentSalarySlips, parsed.salarySlips || []),
          driverAdvances: mergeAdvancesList(permanentAdvances, parsed.driverAdvances || []),
          financialTransactions: mergeTransactionsList(permanentTxns, parsed.financialTransactions || []),
          pendingDriverPayments: parsed.pendingDriverPayments || INITIAL_PENDING_PAYMENTS,
          brokers: mergeBrokersList(permanentBrokers, parsed.brokers || []),
          driverPostings: mergeDriverPostingsList(permanentDriverPostings, parsed.driverPostings || []),
          trainingScripts: parsed.trainingScripts || INITIAL_TRAINING_SCRIPTS
        };
      }
    } catch (e) {
      console.error('Failed to load local storage data', e);
    }

    const initialAttendance = permanentAttendance;
    const activeClock = findUserActiveShift(initialAttendance, savedUser) || null;

    return {
      users: permanentUsers,
      dispatchers: permanentDispatchers.length > 0 ? permanentDispatchers : INITIAL_DISPATCHERS,
      drivers: permanentDrivers,
      carriers: permanentCarriers,
      loads: permanentLoads,
      attendance: initialAttendance,
      leads: permanentLeads,
      salesDailyLogs: permanentSalesLogs,
      currentUser: savedUser || null,
      currentClockRecord: activeClock,
      factoringRatePercent: 3.25,
      messages: [],
      companySettings: DEFAULT_COMPANY_SETTINGS,
      driverSettlements: permanentSettlements,
      invoices: permanentInvoices,
      broadcasts: [],
      hrProfiles: permanentHR,
      leaveRequests: permanentLeaves,
      salarySlips: permanentSalarySlips,
      driverAdvances: permanentAdvances,
      financialTransactions: permanentTxns,
      pendingDriverPayments: INITIAL_PENDING_PAYMENTS,
      brokers: permanentBrokers,
      driverPostings: permanentDriverPostings,
      trainingScripts: INITIAL_TRAINING_SCRIPTS
    };
  });

  // Local storage backup fallback
  useEffect(() => {
    safeSetLocalStorage(STORAGE_KEY, JSON.stringify(state));
    savePermanentUsers(state.users);
    savePermanentDispatchers(state.dispatchers);
    savePermanentAttendance(state.attendance);
    savePermanentLoads(state.loads);
    savePermanentDrivers(state.drivers);
    savePermanentCarriers(state.carriers);
    savePermanentInvoices(state.invoices || []);
    savePermanentAdvances(state.driverAdvances || []);
    savePermanentBrokers(state.brokers || []);
    savePermanentSettlements(state.driverSettlements || []);
    savePermanentTransactions(state.financialTransactions || []);
    savePermanentLeads(state.leads || []);
    savePermanentHR(state.hrProfiles || []);
    savePermanentLeaves(state.leaveRequests || []);
    savePermanentSalarySlips(state.salarySlips || []);
    savePermanentDriverPostings(state.driverPostings || []);
    savePermanentSalesLogs(state.salesDailyLogs || []);
  }, [state]);

  // Dedicated persistent user auth session
  useEffect(() => {
    if (state.currentUser) {
      try {
        localStorage.setItem(CURRENT_USER_SESSION_KEY, JSON.stringify(state.currentUser));
      } catch (e) {
        console.warn("Could not save persistent auth session", e);
      }
    }
  }, [state.currentUser]);

  const [syncStatus, setSyncStatus] = useState<'Syncing...' | 'Cloud Connected' | 'Offline Mode'>(
    navigator.onLine ? 'Cloud Connected' : 'Offline Mode'
  );

  useEffect(() => {
    const handleOnline = () => setSyncStatus('Cloud Connected');
    const handleOffline = () => setSyncStatus('Offline Mode');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen to Firebase Auth state change to persist session & maintain user profile details
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const userData = snap.data() as User;
            if (!userData.companyId) {
              userData.companyId = 'DEFAULT_COMPANY';
            }
            setState(prev => {
              const activeShift = findUserActiveShift(prev.attendance, userData);
              return {
                ...prev,
                currentUser: userData,
                currentClockRecord: activeShift
              };
            });
          } else {
            const email = firebaseUser.email;
            if (email) {
              setState(prev => {
                const matchedUser = prev.users.find(u => u.username.toLowerCase() === email.toLowerCase());
                if (matchedUser) {
                  const migratedUser: User = {
                    ...matchedUser,
                    id: firebaseUser.uid,
                    companyId: matchedUser.companyId || 'DEFAULT_COMPANY'
                  };
                  setDoc(doc(db, 'users', firebaseUser.uid), migratedUser).catch(e => console.warn(e));
                  return {
                    ...prev,
                    currentUser: migratedUser,
                    currentClockRecord: findUserActiveShift(prev.attendance, migratedUser),
                    users: prev.users.map(u => u.username.toLowerCase() === email.toLowerCase() ? migratedUser : u)
                  };
                } else if (email.toLowerCase() === 'jackrehan690@gmail.com') {
                  const adminUser: User = {
                    id: firebaseUser.uid,
                    username: email.toLowerCase(),
                    name: 'Timely Logistix Owner',
                    role: 'ADMIN',
                    password: '@TL855866!!',
                    companyId: 'DEFAULT_COMPANY'
                  };
                  setDoc(doc(db, 'users', firebaseUser.uid), adminUser).catch(e => console.warn(e));
                  return {
                    ...prev,
                    currentUser: adminUser,
                    currentClockRecord: findUserActiveShift(prev.attendance, adminUser),
                    users: [adminUser, ...prev.users.filter(u => u.username.toLowerCase() !== email.toLowerCase())]
                  };
                }
                return prev;
              });
            }
          }
        } catch (e) {
          console.warn("onAuthStateChanged Profile Fetch Notice:", e);
        }
      }
    });

    return () => unsubAuth();
  }, []);

  // Firestore Snapshot realtime link
  useEffect(() => {
    let unsubscribed = false;
    const unsubscribes: (() => void)[] = [];

    async function initFirestoreSync() {
      try {
        await ensureAuth();
        if (unsubscribed) return;
        setSyncStatus('Cloud Connected');

        const currentCompId = state.currentUser?.companyId || 'DEFAULT_COMPANY';

        const seededCollections = new Set<string>();

        // Strictly disabled mock initial seeding to respect user constraint (no new sample data injected)
        const seedInitialDataOnce = async (_collectionName: string, _firestoreItems: any[], _initialData: any[]) => {
          return;
        };

        // Sync USERS
        const unsubUsers = onSnapshot(collection(db, 'users'), async (snapshot) => {
          const usersList: User[] = [];
          snapshot.forEach(doc => {
            const u = doc.data() as User;
            if (isSampleUserOrDispatcher(doc.id, u?.username, u?.name)) {
              removeFromFirestore('users', doc.id).catch(() => {});
            } else {
              usersList.push(u);
            }
          });

          setState(prev => {
            const compId = prev.currentUser?.companyId;
            const filtered = compId ? usersList.filter(u => !u.companyId || u.companyId === 'DEFAULT_COMPANY' || u.companyId === compId) : usersList;
            const merged = mergeUsersList(prev.users.length > 0 ? prev.users : getPermanentUsers(), filtered);
            savePermanentUsers(merged);
            merged.forEach(u => {
              if (u && u.id && !usersList.some(item => item.id === u.id)) {
                syncToFirestore('users', u.id, u).catch(() => {});
              }
            });
            return { ...prev, users: merged };
          });
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'users');
        });
        unsubscribes.push(unsubUsers);

        // Sync DISPATCHERS
        const unsubDispatchers = onSnapshot(collection(db, 'dispatchers'), async (snapshot) => {
          const list: Dispatcher[] = [];
          snapshot.forEach(doc => {
            const d = doc.data() as Dispatcher;
            if (isSampleUserOrDispatcher(doc.id, d?.username, d?.name)) {
              removeFromFirestore('dispatchers', doc.id).catch(() => {});
            } else {
              list.push(d);
            }
          });

          setState(prev => {
            const compId = prev.currentUser?.companyId;
            const filtered = compId ? list.filter(d => !d.companyId || d.companyId === 'DEFAULT_COMPANY' || d.companyId === compId) : list;
            const merged = mergeDispatchersList(prev.dispatchers.length > 0 ? prev.dispatchers : getPermanentDispatchers(), filtered);
            savePermanentDispatchers(merged);
            merged.forEach(d => {
              if (d && d.id && !list.some(item => item.id === d.id)) {
                syncToFirestore('dispatchers', d.id, d).catch(() => {});
              }
            });
            return { ...prev, dispatchers: merged };
          });
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'dispatchers');
        });
        unsubscribes.push(unsubDispatchers);

        // Sync DRIVERS
        const unsubDrivers = onSnapshot(collection(db, 'drivers'), async (snapshot) => {
          const list: Driver[] = [];
          snapshot.forEach(doc => {
            list.push(doc.data() as Driver);
          });

          setState(prev => {
            const compId = prev.currentUser?.companyId;
            const filtered = compId ? list.filter(d => !d.companyId || d.companyId === 'DEFAULT_COMPANY' || d.companyId === compId) : list;
            const merged = mergeDriversList(prev.drivers.length > 0 ? prev.drivers : getPermanentDrivers(), filtered);
            savePermanentDrivers(merged);
            merged.forEach(d => {
              if (d && d.id && !list.some(item => item.id === d.id)) {
                syncToFirestore('drivers', d.id, d).catch(() => {});
              }
            });
            return { ...prev, drivers: merged };
          });
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'drivers');
        });
        unsubscribes.push(unsubDrivers);

        // Sync CARRIERS
        const unsubCarriers = onSnapshot(collection(db, 'carriers'), async (snapshot) => {
          const list: CarrierOrOwner[] = [];
          snapshot.forEach(doc => {
            list.push(doc.data() as CarrierOrOwner);
          });

          setState(prev => {
            const compId = prev.currentUser?.companyId;
            const filtered = compId ? list.filter(c => !c.companyId || c.companyId === 'DEFAULT_COMPANY' || c.companyId === compId) : list;
            const merged = mergeCarriersList(prev.carriers.length > 0 ? prev.carriers : getPermanentCarriers(), filtered);
            savePermanentCarriers(merged);
            merged.forEach(c => {
              if (c && c.id && !list.some(item => item.id === c.id)) {
                syncToFirestore('carriers', c.id, c).catch(() => {});
              }
            });
            return { ...prev, carriers: merged };
          });
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'carriers');
        });
        unsubscribes.push(unsubCarriers);

        // Sync LOADS with a dedicated fresh Firestore listener and real-time local caching
        const unsubLoads = onSnapshot(collection(db, 'loads'), (snapshot) => {
          const list: Load[] = [];
          snapshot.forEach(doc => {
            const data = doc.data() as Load;
            if (data) {
              list.push({ ...data, id: data.id || doc.id });
            }
          });

          setState(prev => {
            const compId = prev.currentUser?.companyId;
            const filtered = compId ? list.filter(l => !l.companyId || l.companyId === 'DEFAULT_COMPANY' || l.companyId === compId) : list;
            const baseLoads = prev.loads.length > 0 ? prev.loads : getPermanentLoads();
            const merged = mergeLoadsList(baseLoads, filtered);
            
            // Persist to permanent local storage cache to guarantee instant availability on refresh
            savePermanentLoads(merged);
            merged.forEach(l => {
              if (l && l.id && !list.some(item => item.id === l.id)) {
                syncToFirestore('loads', l.id, l).catch(() => {});
              }
            });
            return { ...prev, loads: merged };
          });
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'loads');
        });
        unsubscribes.push(unsubLoads);

        // Sync ATTENDANCE
        const unsubAttendance = onSnapshot(collection(db, 'attendance'), async (snapshot) => {
          const list: ClockRecord[] = [];
          snapshot.forEach(doc => {
            list.push(doc.data() as ClockRecord);
          });

          setState(prev => {
            const compId = prev.currentUser?.companyId;
            const filtered = compId ? list.filter(a => !a.companyId || a.companyId === 'DEFAULT_COMPANY' || a.companyId === compId) : list;
            const merged = mergeAttendanceList(prev.attendance.length > 0 ? prev.attendance : getPermanentAttendance(), filtered);
            merged.sort((a, b) => new Date(b.date || b.clockInTimestamp || 0).getTime() - new Date(a.date || a.clockInTimestamp || 0).getTime());

            // Dynamically synchronize current user's active shift
            const myActiveShift = findUserActiveShift(merged, prev.currentUser);

            savePermanentAttendance(merged);

            return { 
              ...prev, 
              attendance: merged,
              currentClockRecord: myActiveShift || (prev.currentClockRecord && !prev.currentClockRecord.clockOut ? prev.currentClockRecord : null)
            };
          });
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'attendance');
        });
        unsubscribes.push(unsubAttendance);

        // Sync LEADS
        const unsubLeads = onSnapshot(collection(db, 'leads'), async (snapshot) => {
          const list: Lead[] = [];
          snapshot.forEach(doc => {
            list.push(doc.data() as Lead);
          });

          setState(prev => {
            const compId = prev.currentUser?.companyId;
            const filtered = compId ? list.filter(l => !l.companyId || l.companyId === 'DEFAULT_COMPANY' || l.companyId === compId) : list;
            const merged = mergeLeadsList(prev.leads.length > 0 ? prev.leads : getPermanentLeads(), filtered);
            savePermanentLeads(merged);
            merged.forEach(l => {
              if (l && l.id && !list.some(item => item.id === l.id)) {
                syncToFirestore('leads', l.id, l).catch(() => {});
              }
            });
            return { ...prev, leads: merged };
          });
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'leads');
        });
        unsubscribes.push(unsubLeads);

        // Sync CHAT MESSAGES in real-time
        const unsubMessages = onSnapshot(collection(db, 'messages'), async (snapshot) => {
          const list: ChatMessage[] = [];
          snapshot.forEach(doc => {
            list.push(doc.data() as ChatMessage);
          });

          // Sort chronologically
          list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(a.createdAt).getTime());
          setState(prev => {
            const compId = prev.currentUser?.companyId || 'DEFAULT_COMPANY';
            const filtered = list.filter(m => (m.companyId || 'DEFAULT_COMPANY') === compId);
            return { ...prev, messages: filtered };
          });
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'messages');
        });
        unsubscribes.push(unsubMessages);

        // Sync COMPANY SETTINGS in real-time scoped by companyId
        const unsubCompany = onSnapshot(doc(db, 'settings', currentCompId), async (snapshot) => {
          if (snapshot.exists()) {
            setState(prev => ({ ...prev, companySettings: snapshot.data() as CompanySettings }));
          } else {
            const savedData = localStorage.getItem(STORAGE_KEY);
            let localSettings = DEFAULT_COMPANY_SETTINGS;
            if (savedData) {
              try {
                const parsed = JSON.parse(savedData);
                if (parsed.companySettings) {
                  localSettings = parsed.companySettings;
                }
              } catch (e) {}
            }
            const defaultSettingsWithId = { ...localSettings, companyId: currentCompId };
            await setDoc(doc(db, 'settings', currentCompId), defaultSettingsWithId);
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, `settings/${currentCompId}`);
        });
        unsubscribes.push(unsubCompany);

        // Sync DRIVER SETTLEMENTS in real-time
        const unsubSettlements = onSnapshot(collection(db, 'driverSettlements'), async (snapshot) => {
          const list: DriverSettlement[] = [];
          snapshot.forEach(doc => {
            list.push(doc.data() as DriverSettlement);
          });

          setState(prev => {
            const compId = prev.currentUser?.companyId;
            const filtered = compId ? list.filter(s => !s.companyId || s.companyId === 'DEFAULT_COMPANY' || s.companyId === compId) : list;
            const merged = mergeSettlementsList(prev.driverSettlements.length > 0 ? prev.driverSettlements : getPermanentSettlements(), filtered);
            savePermanentSettlements(merged);
            merged.forEach(s => {
              if (s && s.id && !list.some(item => item.id === s.id)) {
                syncToFirestore('driverSettlements', s.id, s).catch(() => {});
              }
            });
            return { ...prev, driverSettlements: merged };
          });
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'driverSettlements');
        });
        unsubscribes.push(unsubSettlements);

        // Sync INVOICES in real-time
        const unsubInvoices = onSnapshot(collection(db, 'invoices'), async (snapshot) => {
          const list: Invoice[] = [];
          snapshot.forEach(doc => {
            list.push(doc.data() as Invoice);
          });

          setState(prev => {
            const compId = prev.currentUser?.companyId;
            const filtered = compId ? list.filter(i => !i.companyId || i.companyId === 'DEFAULT_COMPANY' || i.companyId === compId) : list;
            const merged = mergeInvoicesList(prev.invoices.length > 0 ? prev.invoices : getPermanentInvoices(), filtered);
            savePermanentInvoices(merged);
            merged.forEach(i => {
              if (i && i.id && !list.some(item => item.id === i.id)) {
                syncToFirestore('invoices', i.id, i).catch(() => {});
              }
            });
            return { ...prev, invoices: merged };
          });
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'invoices');
        });
        unsubscribes.push(unsubInvoices);

        // Sync BROADCASTS / POPUP ALERTS in real-time
        const unsubBroadcasts = onSnapshot(collection(db, 'broadcasts'), async (snapshot) => {
          const list: CompanyBroadcast[] = [];
          snapshot.forEach(doc => {
            list.push(doc.data() as CompanyBroadcast);
          });

          setState(prev => {
            const compId = prev.currentUser?.companyId || 'DEFAULT_COMPANY';
            const filtered = list.filter(b => (b.companyId || 'DEFAULT_COMPANY') === compId && b.active);
            filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return { ...prev, broadcasts: filtered };
          });
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'broadcasts');
        });
        unsubscribes.push(unsubBroadcasts);

        // Sync HR PROFILES in real-time
        const unsubHRProfiles = onSnapshot(collection(db, 'hrProfiles'), async (snapshot) => {
          const list: HRStaffProfile[] = [];
          snapshot.forEach(doc => {
            list.push(doc.data() as HRStaffProfile);
          });

          setState(prev => {
            const compId = prev.currentUser?.companyId;
            const filtered = compId ? list.filter(hr => !hr.companyId || hr.companyId === 'DEFAULT_COMPANY' || hr.companyId === compId) : list;
            const merged = mergeHRList(prev.hrProfiles.length > 0 ? prev.hrProfiles : getPermanentHR(), filtered);
            savePermanentHR(merged);
            merged.forEach(hr => {
              if (hr && hr.id && !list.some(item => item.id === hr.id)) {
                syncToFirestore('hrProfiles', hr.id, hr).catch(() => {});
              }
            });
            return { ...prev, hrProfiles: merged };
          });
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'hrProfiles');
        });
        unsubscribes.push(unsubHRProfiles);

        // Sync LEAVE REQUESTS in real-time
        const unsubLeaves = onSnapshot(collection(db, 'leaveRequests'), async (snapshot) => {
          const list: LeaveRequest[] = [];
          snapshot.forEach(doc => {
            list.push(doc.data() as LeaveRequest);
          });

          setState(prev => {
            const compId = prev.currentUser?.companyId;
            const filtered = compId ? list.filter(l => !l.companyId || l.companyId === 'DEFAULT_COMPANY' || l.companyId === compId) : list;
            const merged = mergeLeavesList(prev.leaveRequests.length > 0 ? prev.leaveRequests : getPermanentLeaves(), filtered);
            savePermanentLeaves(merged);
            merged.forEach(l => {
              if (l && l.id && !list.some(item => item.id === l.id)) {
                syncToFirestore('leaveRequests', l.id, l).catch(() => {});
              }
            });
            return { ...prev, leaveRequests: merged };
          });
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'leaveRequests');
        });
        unsubscribes.push(unsubLeaves);

        // Sync SALARY SLIPS in real-time
        const unsubSalarySlips = onSnapshot(collection(db, 'salarySlips'), async (snapshot) => {
          const list: SalarySlip[] = [];
          snapshot.forEach(doc => {
            list.push(doc.data() as SalarySlip);
          });

          setState(prev => {
            const compId = prev.currentUser?.companyId;
            const filtered = compId ? list.filter(s => !s.companyId || s.companyId === 'DEFAULT_COMPANY' || s.companyId === compId) : list;
            const merged = mergeSalarySlipsList(prev.salarySlips.length > 0 ? prev.salarySlips : getPermanentSalarySlips(), filtered);
            savePermanentSalarySlips(merged);
            merged.forEach(s => {
              if (s && s.id && !list.some(item => item.id === s.id)) {
                syncToFirestore('salarySlips', s.id, s).catch(() => {});
              }
            });
            return { ...prev, salarySlips: merged };
          });
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'salarySlips');
        });
        unsubscribes.push(unsubSalarySlips);

        // Sync DRIVER ADVANCES in real-time
        const unsubAdvances = onSnapshot(collection(db, 'driverAdvances'), async (snapshot) => {
          const list: DriverAdvance[] = [];
          snapshot.forEach(doc => {
            list.push(doc.data() as DriverAdvance);
          });

          setState(prev => {
            const compId = prev.currentUser?.companyId;
            const filtered = compId ? list.filter(adv => !adv.companyId || adv.companyId === 'DEFAULT_COMPANY' || adv.companyId === compId) : list;
            const merged = mergeAdvancesList(prev.driverAdvances.length > 0 ? prev.driverAdvances : getPermanentAdvances(), filtered);
            savePermanentAdvances(merged);
            merged.forEach(a => {
              if (a && a.id && !list.some(item => item.id === a.id)) {
                syncToFirestore('driverAdvances', a.id, a).catch(() => {});
              }
            });
            return { ...prev, driverAdvances: merged };
          });
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'driverAdvances');
        });
        unsubscribes.push(unsubAdvances);

        // Sync FINANCIAL TRANSACTIONS in real-time
        const unsubTxns = onSnapshot(collection(db, 'financialTransactions'), async (snapshot) => {
          const list: FinancialTransaction[] = [];
          snapshot.forEach(doc => {
            list.push(doc.data() as FinancialTransaction);
          });

          setState(prev => {
            const compId = prev.currentUser?.companyId;
            const filtered = compId ? list.filter(tx => !tx.companyId || tx.companyId === 'DEFAULT_COMPANY' || tx.companyId === compId) : list;
            const merged = mergeTransactionsList(prev.financialTransactions.length > 0 ? prev.financialTransactions : getPermanentTransactions(), filtered);
            savePermanentTransactions(merged);
            merged.forEach(t => {
              if (t && t.id && !list.some(item => item.id === t.id)) {
                syncToFirestore('financialTransactions', t.id, t).catch(() => {});
              }
            });
            return { ...prev, financialTransactions: merged };
          });
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'financialTransactions');
        });
        unsubscribes.push(unsubTxns);

        // Sync BROKERS in real-time
        const unsubBrokers = onSnapshot(collection(db, 'brokers'), async (snapshot) => {
          const list: BrokerContact[] = [];
          snapshot.forEach(doc => {
            list.push(doc.data() as BrokerContact);
          });

          setState(prev => {
            const compId = prev.currentUser?.companyId;
            const filtered = compId ? list.filter(b => !b.companyId || b.companyId === 'DEFAULT_COMPANY' || b.companyId === compId) : list;
            const merged = mergeBrokersList(prev.brokers.length > 0 ? prev.brokers : getPermanentBrokers(), filtered);
            savePermanentBrokers(merged);
            merged.forEach(b => {
              if (b && b.id && !list.some(item => item.id === b.id)) {
                syncToFirestore('brokers', b.id, b).catch(() => {});
              }
            });
            return { ...prev, brokers: merged };
          });
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'brokers');
        });
        unsubscribes.push(unsubBrokers);

        // Sync DRIVER POSTINGS / DAILY AVAILABILITY in real-time
        const unsubDriverPostings = onSnapshot(collection(db, 'driverPostings'), async (snapshot) => {
          const list: DriverDailyPosting[] = [];
          snapshot.forEach(doc => {
            list.push(doc.data() as DriverDailyPosting);
          });

          setState(prev => {
            const compId = prev.currentUser?.companyId;
            const filtered = compId ? list.filter(p => !p.companyId || p.companyId === 'DEFAULT_COMPANY' || p.companyId === compId) : list;
            const merged = mergeDriverPostingsList(prev.driverPostings.length > 0 ? prev.driverPostings : getPermanentDriverPostings(), filtered);
            savePermanentDriverPostings(merged);
            merged.forEach(p => {
              if (p && p.id && !list.some(item => item.id === p.id)) {
                syncToFirestore('driverPostings', p.id, p).catch(() => {});
              }
            });
            return { ...prev, driverPostings: merged };
          });
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'driverPostings');
        });
        unsubscribes.push(unsubDriverPostings);

        // Sync SALES DAILY LOGS in real-time
        const unsubSalesDailyLogs = onSnapshot(collection(db, 'salesDailyLogs'), async (snapshot) => {
          const list: SalesDailyLog[] = [];
          snapshot.forEach(doc => {
            list.push(doc.data() as SalesDailyLog);
          });
          await seedInitialDataOnce('salesDailyLogs', list, INITIAL_SALES_LOGS);

          setState(prev => {
            const compId = prev.currentUser?.companyId;
            const filtered = compId ? list.filter(s => !s.companyId || s.companyId === 'DEFAULT_COMPANY' || s.companyId === compId) : list;
            const merged = mergeSalesLogsList(prev.salesDailyLogs.length > 0 ? prev.salesDailyLogs : getPermanentSalesLogs(), filtered);
            savePermanentSalesLogs(merged);
            merged.forEach(s => {
              if (s && s.id && !list.some(item => item.id === s.id)) {
                syncToFirestore('salesDailyLogs', s.id, s).catch(() => {});
              }
            });
            return { ...prev, salesDailyLogs: merged };
          });
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'salesDailyLogs');
        });
        unsubscribes.push(unsubSalesDailyLogs);

        // Sync TRAINING SCRIPTS in real-time
        const unsubTrainingScripts = onSnapshot(collection(db, 'trainingScripts'), async (snapshot) => {
          if (!snapshot.empty) {
            snapshot.forEach(docSnap => {
              const data = docSnap.data() as TrainingScriptConfig;
              if (data && data.coldCallScript) {
                setState(prev => ({ ...prev, trainingScripts: data }));
              }
            });
          } else {
            try {
              await setDoc(doc(db, 'trainingScripts', 'config'), cleanFirestoreData(INITIAL_TRAINING_SCRIPTS));
              setState(prev => ({ ...prev, trainingScripts: INITIAL_TRAINING_SCRIPTS }));
            } catch (e) {
              console.warn("Could not seed training scripts to firestore", e);
            }
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'trainingScripts');
        });
        unsubscribes.push(unsubTrainingScripts);

      } catch (e: any) {
        console.warn("Could not connect to online Cloud Firestore. Operating in local-only sandbox mode.", e);
      }
    }

    initFirestoreSync();

    return () => {
      unsubscribed = true;
      unsubscribes.forEach(unsub => unsub());
    };
  }, [state.currentUser?.id, state.currentUser?.companyId]);

  // Recursively sanitize objects so Firestore never rejects with "Unsupported field value: undefined"
  const cleanFirestoreData = (obj: any): any => {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj)) {
      return obj.map(item => cleanFirestoreData(item));
    }
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = cleanFirestoreData(value);
        }
      }
      return cleaned;
    }
    return obj;
  };

  // Sync state mutations directly to Cloud Firestore of active devices!
  const syncToFirestore = async (collectionName: string, id: string, data: any) => {
    if (!navigator.onLine) {
      setSyncStatus('Offline Mode');
    } else {
      setSyncStatus('Syncing...');
    }
    try {
      await ensureAuth();
      const sanitized = cleanFirestoreData(data);
      await setDoc(doc(db, collectionName, id), sanitized);
      if (navigator.onLine) {
        setSyncStatus('Cloud Connected');
      } else {
        setSyncStatus('Offline Mode');
      }
    } catch (e: any) {
      if (e?.message?.toLowerCase().includes('permission') || e?.code === 'permission-denied') {
        handleFirestoreError(e, OperationType.WRITE, `${collectionName}/${id}`);
      } else {
        console.warn(`Firestore Offline/Direct-Error: Skipping client synchronization to cloud for ${collectionName}.`, e);
        setSyncStatus('Offline Mode');
      }
    }
  };

  const removeFromFirestore = async (collectionName: string, id: string) => {
    if (!navigator.onLine) {
      setSyncStatus('Offline Mode');
    } else {
      setSyncStatus('Syncing...');
    }
    try {
      await ensureAuth();
      await deleteDoc(doc(db, collectionName, id));
      if (navigator.onLine) {
        setSyncStatus('Cloud Connected');
      } else {
        setSyncStatus('Offline Mode');
      }
    } catch (e: any) {
      if (e?.message?.toLowerCase().includes('permission') || e?.code === 'permission-denied') {
        handleFirestoreError(e, OperationType.DELETE, `${collectionName}/${id}`);
      } else {
        console.warn(`Firestore Offline/Direct-Error: Skipping client deletion for ${collectionName}.`, e);
        setSyncStatus('Offline Mode');
      }
    }
  };

  // Actions
  const login = async (username: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const cleanUsername = username.toLowerCase().trim();
    const cleanPass = pass.trim();

    if (!cleanUsername || !pass) {
      return { success: false, error: 'Please enter both your email/username and password.' };
    }

    try {
      await ensureAuth();

      // Step 1: Check in-memory local state first
      let matchedUser: User | null = null;
      let matchedDispatcher: Dispatcher | null = null;

      // Find in existing state.users
      matchedUser = (state.users || []).find(u => 
        (u.username && u.username.toLowerCase().trim() === cleanUsername) ||
        (u.username && u.username.includes('@') && u.username.split('@')[0].toLowerCase().trim() === cleanUsername) ||
        (u.phone && u.phone.replace(/\D/g, '') === cleanUsername.replace(/\D/g, '') && cleanUsername.replace(/\D/g, '').length >= 7) ||
        (u.name && u.name.toLowerCase().trim() === cleanUsername)
      ) || null;

      // Find in existing state.dispatchers
      if (!matchedUser) {
        matchedDispatcher = (state.dispatchers || []).find(d => 
          (d.username && d.username.toLowerCase().trim() === cleanUsername) ||
          (d.username && d.username.includes('@') && d.username.split('@')[0].toLowerCase().trim() === cleanUsername) ||
          (d.phone && d.phone.replace(/\D/g, '') === cleanUsername.replace(/\D/g, '') && cleanUsername.replace(/\D/g, '').length >= 7) ||
          (d.name && d.name.toLowerCase().trim() === cleanUsername)
        ) || null;
      }

      // Step 2: If not found in local memory, query Firestore directly across all users and dispatchers!
      // This is crucial when opening the app on a new or different device.
      if (!matchedUser || !matchedDispatcher) {
        try {
          const [usersSnap, dispatchersSnap] = await Promise.all([
            getDocs(collection(db, 'users')).catch(() => null),
            getDocs(collection(db, 'dispatchers')).catch(() => null)
          ]);

          if (usersSnap && !usersSnap.empty) {
            usersSnap.forEach(docSnap => {
              const u = docSnap.data() as User;
              if (u) {
                const uName = (u.username || '').toLowerCase().trim();
                const uEmailPrefix = uName.includes('@') ? uName.split('@')[0] : uName;
                const uPhone = (u.phone || '').replace(/\D/g, '');
                const cleanPhone = cleanUsername.replace(/\D/g, '');
                const uFullName = (u.name || '').toLowerCase().trim();

                if (!matchedUser && (
                  uName === cleanUsername ||
                  uEmailPrefix === cleanUsername ||
                  (cleanPhone.length >= 7 && uPhone === cleanPhone) ||
                  uFullName === cleanUsername ||
                  docSnap.id.toLowerCase() === cleanUsername
                )) {
                  matchedUser = { ...u, id: u.id || docSnap.id };
                }
              }
            });
          }

          if (dispatchersSnap && !dispatchersSnap.empty) {
            dispatchersSnap.forEach(docSnap => {
              const d = docSnap.data() as Dispatcher;
              if (d) {
                const dName = (d.username || '').toLowerCase().trim();
                const dEmailPrefix = dName.includes('@') ? dName.split('@')[0] : dName;
                const dPhone = (d.phone || '').replace(/\D/g, '');
                const cleanPhone = cleanUsername.replace(/\D/g, '');
                const dFullName = (d.name || '').toLowerCase().trim();

                if (!matchedDispatcher && (
                  dName === cleanUsername ||
                  dEmailPrefix === cleanUsername ||
                  (cleanPhone.length >= 7 && dPhone === cleanPhone) ||
                  dFullName === cleanUsername ||
                  docSnap.id.toLowerCase() === cleanUsername
                )) {
                  matchedDispatcher = { ...d, id: d.id || docSnap.id };
                }
              }
            });
          }
        } catch (fetchErr) {
          console.warn("Direct Firestore auth lookup notice:", fetchErr);
        }
      }

      // Step 3: Check INITIAL_USERS and INITIAL_DISPATCHERS fallback
      if (!matchedUser && !matchedDispatcher) {
        matchedUser = INITIAL_USERS.find(u => 
          (u.username && u.username.toLowerCase().trim() === cleanUsername) ||
          (u.username && u.username.includes('@') && u.username.split('@')[0].toLowerCase().trim() === cleanUsername)
        ) || null;
      }
      if (!matchedUser && !matchedDispatcher) {
        matchedDispatcher = INITIAL_DISPATCHERS.find(d => 
          (d.username && d.username.toLowerCase().trim() === cleanUsername) ||
          (d.username && d.username.includes('@') && d.username.split('@')[0].toLowerCase().trim() === cleanUsername)
        ) || null;
      }

      // Step 4: Special check for Owner / SuperAdmin
      if (cleanUsername === 'jackrehan690@gmail.com' || cleanUsername === 'admin') {
        if (cleanUsername === 'jackrehan690@gmail.com' && pass !== '@TL855866!!') {
          return { success: false, error: 'Incorrect owner password credentials.' };
        }
        const adminUser: User = {
          id: matchedUser?.id || 'admin_owner_primary',
          username: 'jackrehan690@gmail.com',
          name: 'Jack Rehan',
          role: 'ADMIN',
          password: '@TL855866!!',
          companyId: matchedUser?.companyId || 'DEFAULT_COMPANY'
        };
        setState(prev => {
          const activeShift = findUserActiveShift(prev.attendance, adminUser);
          return {
            ...prev,
            currentUser: adminUser,
            currentClockRecord: activeShift
          };
        });
        safeSetLocalStorage(CURRENT_USER_SESSION_KEY, JSON.stringify(adminUser));
        return { success: true };
      }

      // Step 5: Synthesize User from Dispatcher if found as dispatcher
      if (!matchedUser && matchedDispatcher) {
        matchedUser = {
          id: `u_${matchedDispatcher.id}`,
          username: matchedDispatcher.username,
          name: matchedDispatcher.name,
          role: 'DISPATCHER',
          phone: matchedDispatcher.phone,
          password: matchedDispatcher.password || '123',
          dispatcherId: matchedDispatcher.id,
          companyId: matchedDispatcher.companyId || 'DEFAULT_COMPANY',
          permissions: {
            canAccessDashboard: true,
            canAccessInvoicing: false,
            canAccessDriverPayout: false,
            canAccessTransactionVault: false,
            canAccessCarrierCRM: false,
            canAccessCorporateReports: false,
            canAccessDailyAssignment: true,
            canAccessDriverIndex: true,
            onlyAssignedDrivers: true,
            canAccessLoadBoard: true,
            onlyAssignedLoads: true,
            canAccessTimeClock: true,
            canAccessTools: true,
            canAccessTeamChat: true,
            canAccessSalesCRM: false,
            canAccessTeamSeats: false,
            isFullAccess: false
          }
        };
        // Auto-save to Firestore so future queries are instant
        setDoc(doc(db, 'users', matchedUser.id), matchedUser).catch(() => {});
      }

      // Step 6: If user is found, verify password
      if (matchedUser) {
        const storedPass = matchedUser.password;
        // Verify credentials
        const passwordMatches = 
          !storedPass || 
          storedPass === pass || 
          storedPass.trim() === cleanPass ||
          (cleanPass === '123' && (!storedPass || storedPass === '123'));

        if (!passwordMatches) {
          // If direct password comparison failed, check if Firebase Auth has the user
          const emailForAuth = cleanUsername.includes('@') ? cleanUsername : `${cleanUsername}@timelylogistix.com`;
          try {
            await signInWithEmailAndPassword(auth, emailForAuth, pass);
          } catch (e) {
            return { success: false, error: 'Incorrect password. Please verify your credentials.' };
          }
        }

        const userToSet: User = {
          ...matchedUser,
          companyId: matchedUser.companyId || 'DEFAULT_COMPANY'
        };

        const activeShift = findUserActiveShift(state.attendance, userToSet);

        setState(prev => ({
          ...prev,
          currentUser: userToSet,
          currentClockRecord: activeShift,
          users: prev.users.some(u => u.id === userToSet.id) ? prev.users.map(u => u.id === userToSet.id ? userToSet : u) : [...prev.users, userToSet]
        }));

        safeSetLocalStorage(CURRENT_USER_SESSION_KEY, JSON.stringify(userToSet));

        // Background Firebase Auth link (non-blocking)
        const emailForAuth = userToSet.username.includes('@') ? userToSet.username : `${userToSet.username}@timelylogistix.com`;
        signInWithEmailAndPassword(auth, emailForAuth, pass).catch(() => {
          createUserWithEmailAndPassword(auth, emailForAuth, pass).catch(() => {});
        });

        return { success: true };
      }

      // Step 7: Direct Firebase Auth fallback attempt
      const emailForAuth = cleanUsername.includes('@') ? cleanUsername : `${cleanUsername}@timelylogistix.com`;
      try {
        const userCredential = await signInWithEmailAndPassword(auth, emailForAuth, pass);
        if (userCredential) {
          const userRef = doc(db, 'users', userCredential.user.uid);
          const snap = await getDoc(userRef);
          let userData: User;
          if (snap.exists()) {
            userData = snap.data() as User;
          } else {
            userData = {
              id: userCredential.user.uid,
              username: emailForAuth,
              name: cleanUsername.split('@')[0],
              role: 'DISPATCHER',
              companyId: 'DEFAULT_COMPANY'
            };
            setDoc(userRef, userData).catch(() => {});
          }
          if (!userData.companyId) {
            userData.companyId = 'DEFAULT_COMPANY';
          }
          setState(prev => ({
            ...prev,
            currentUser: userData,
            currentClockRecord: findUserActiveShift(prev.attendance, userData)
          }));
          safeSetLocalStorage(CURRENT_USER_SESSION_KEY, JSON.stringify(userData));
          return { success: true };
        }
      } catch (fbAuthErr: any) {
        console.warn("Direct Firebase Auth fallback notice:", fbAuthErr?.message || fbAuthErr);
      }

      return { 
        success: false, 
        error: 'No account found matching this email or username. Please check your credentials or register.' 
      };

    } catch (e: any) {
      console.error("Login exception:", e);
      return { success: false, error: e.message || 'An error occurred during login. Please try again.' };
    }
  };

  const registerUser = async (
    name: string,
    email: string,
    pass: string,
    role: string,
    phone: string,
    joinCompanyId?: string,
    newCompanyName?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.toLowerCase().trim();
    if (state.users.some(u => u.username.toLowerCase() === cleanEmail) || cleanEmail === 'jackrehan690@gmail.com') {
      return { success: false, error: 'An account with this email already exists.' };
    }

    try {
      let userId = `u_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      try {
        // Attempt to create account in Firebase Auth if available
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
        if (userCredential?.user?.uid) {
          userId = userCredential.user.uid;
        }
      } catch (authError: any) {
        console.warn("Firebase Auth register fallback to Firestore storage:", authError?.message || authError);
      }

      // Determine company ID and final role
      let compId = 'DEFAULT_COMPANY';
      let userRole: UserRole = role as UserRole;

      if (newCompanyName && newCompanyName.trim() !== '') {
        // Create a new company workspace. User is Admin/Owner.
        compId = `comp_${Date.now()}`;
        userRole = 'ADMIN';

        // Write the custom company settings in Firestore immediately
        const newSettings: CompanySettings = {
          name: newCompanyName.trim(),
          tagline: 'Custom Fleet Console',
          address: 'Update your corporate headquarters address',
          phone: phone,
          email: cleanEmail,
          logoUrl: '',
          companyId: compId
        };
        await setDoc(doc(db, 'settings', compId), newSettings).catch(() => {});
      } else if (joinCompanyId && joinCompanyId.trim() !== '') {
        compId = joinCompanyId.trim();
      }

      const defaultPerms: SeatPermissions = (
        userRole === 'ADMIN' || userRole === 'MANAGER'
          ? {
              canAccessDashboard: true,
              canAccessInvoicing: true,
              canAccessDriverPayout: true,
              canAccessTransactionVault: true,
              canAccessCarrierCRM: true,
              canAccessCorporateReports: true,
              canAccessDailyAssignment: true,
              canAccessDriverIndex: true,
              onlyAssignedDrivers: false,
              canAccessLoadBoard: true,
              onlyAssignedLoads: false,
              canAccessTimeClock: true,
              canAccessTools: true,
              canAccessTeamChat: true,
              canAccessSalesCRM: true,
              canAccessTeamSeats: true,
              isFullAccess: true
            }
          : {
              canAccessDashboard: true,
              canAccessInvoicing: false,
              canAccessDriverPayout: false,
              canAccessTransactionVault: false,
              canAccessCarrierCRM: false,
              canAccessCorporateReports: false,
              canAccessDailyAssignment: true,
              canAccessDriverIndex: true,
              onlyAssignedDrivers: true,
              canAccessLoadBoard: true,
              onlyAssignedLoads: true,
              canAccessTimeClock: true,
              canAccessTools: true,
              canAccessTeamChat: true,
              canAccessSalesCRM: userRole === 'SALES',
              canAccessTeamSeats: false,
              isFullAccess: false
            }
      );

      const newUser: User = {
        id: userId,
        username: cleanEmail,
        name,
        role: userRole,
        phone,
        password: pass,
        companyId: compId,
        permissions: defaultPerms
      };

      let newDisp: Dispatcher | null = null;
      if (userRole === 'DISPATCHER' || userRole === 'ADMIN') {
        const dispId = `disp_${Date.now()}`;
        newUser.dispatcherId = dispId;

        newDisp = {
          id: dispId,
          name,
          username: cleanEmail,
          password: pass,
          phone,
          assignedDriverIds: [],
          commissionPercent: 8,
          notes: 'Onboarded via secure register.',
          companyId: compId
        };
        
        setState(prev => ({
          ...prev,
          users: [...prev.users, newUser],
          dispatchers: [...prev.dispatchers, newDisp!]
        }));
        await syncToFirestore('dispatchers', dispId, newDisp);
      } else {
        newUser.dispatcherId = `sales_${Date.now()}`;
        setState(prev => ({
          ...prev,
          users: [...prev.users, newUser]
        }));
      }

      // ALWAYS write directly to Firestore users collection so all devices worldwide can find and authenticate this account
      await syncToFirestore('users', userId, newUser);
      await setDoc(doc(db, 'users', userId), newUser).catch(() => {});
      if (newDisp) {
        await setDoc(doc(db, 'dispatchers', newDisp.id), newDisp).catch(() => {});
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Registration failed.' };
    }
  };

  const googleSignIn = async (email: string, name: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.toLowerCase().trim();
    const securePass = 'GoogleSecureCredential';

    try {
      // Intercept if they try to sign in with admin's Google email
      if (cleanEmail === 'jackrehan690@gmail.com') {
        return login(cleanEmail, '@TL855866!!');
      }

      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, cleanEmail, securePass);
      } catch (authError: any) {
        if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') {
          userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, securePass);
        } else {
          return { success: false, error: authError.message || 'Google Auth failed.' };
        }
      }

      const userId = userCredential.user.uid;
      const userRef = doc(db, 'users', userId);
      const snap = await getDoc(userRef);

      let user: User;
      if (!snap.exists()) {
        const dispId = `disp_g_${Date.now()}`;
        user = {
          id: userId,
          username: cleanEmail,
          name,
          role: 'DISPATCHER',
          phone: '(555) 999-9999',
          dispatcherId: dispId,
          password: securePass,
          companyId: 'DEFAULT_COMPANY'
        };

        const newDisp: Dispatcher = {
          id: dispId,
          name,
          username: cleanEmail,
          password: securePass,
          phone: '(555) 999-9999',
          assignedDriverIds: [],
          commissionPercent: 8,
          notes: 'Onboarded securely via Google Sign-In portal.'
        };

        setState(prev => ({
          ...prev,
          users: [...prev.users, user],
          dispatchers: [...prev.dispatchers, newDisp]
        }));
        await syncToFirestore('dispatchers', dispId, newDisp);
        await syncToFirestore('users', userId, user);
      } else {
        user = snap.data() as User;
      }

      setState(prev => ({
        ...prev,
        currentUser: user,
        currentClockRecord: findUserActiveShift(prev.attendance, user)
      }));

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'An error occurred during Google Sign-In.' };
    }
  };

  const updateCompanySettings = async (settings: Partial<CompanySettings>) => {
    const compId = state.currentUser?.companyId || 'DEFAULT_COMPANY';
    const merged = { ...state.companySettings, ...settings, companyId: compId };
    setState(prev => ({
      ...prev,
      companySettings: merged
    }));
    await syncToFirestore('settings', compId, merged);
  };

  const logout = async () => {
    try {
      localStorage.removeItem(CURRENT_USER_SESSION_KEY);
    } catch (e) {}
    try {
      await signOut(auth);
      setState(prev => ({
        ...prev,
        currentUser: null,
        currentClockRecord: null
      }));
    } catch (e) {
      console.error("Signout Error:", e);
    }
  };

  const changePassword = async (userId: string, newPass: string): Promise<{ success: boolean }> => {
    if (state.currentUser?.role !== 'ADMIN' && state.currentUser?.id !== userId) {
      alert("⚠️ Access Denied: Team accounts and login credentials are locked. Only an Administrator can change another user's password.");
      return { success: false };
    }

    const user = state.users.find(u => u.id === userId);
    if (!user) return { success: false };

    const updatedUser = { ...user, password: newPass };

    // Update locally immediately
    setState(prev => {
      const nextUsers = prev.users.map(u => u.id === userId ? updatedUser : u);
      savePermanentUsers(nextUsers);
      return {
        ...prev,
        users: nextUsers,
        // Also update currently logged-in user if they updated theirs
        currentUser: prev.currentUser?.id === userId ? updatedUser : prev.currentUser
      };
    });

    // If they are a dispatcher, update dispatcher's password too
    if (user.role === 'DISPATCHER') {
      const matchDisp = state.dispatchers.find(d => d.username === user.username || (user.dispatcherId && d.id === user.dispatcherId));
      if (matchDisp) {
        const updatedDisp = { ...matchDisp, password: newPass };
        setState(prev => {
          const nextDisp = prev.dispatchers.map(d => d.id === matchDisp.id ? updatedDisp : d);
          savePermanentDispatchers(nextDisp);
          return {
            ...prev,
            dispatchers: nextDisp
          };
        });
        await syncToFirestore('dispatchers', matchDisp.id, updatedDisp);
      }
    }

    await syncToFirestore('users', userId, updatedUser);
    return { success: true };
  };

  // Drivers Actions
  const addDriver = async (driver: Omit<Driver, 'id'> & { id?: string }) => {
    const currentUserName = state.currentUser?.name || state.currentUser?.username || 'Team Member';
    const currentUserId = state.currentUser?.id || 'sys';
    const nowIso = new Date().toISOString();

    const newDriver: Driver = {
      ...driver,
      id: driver.id || `drv_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      companyId: state.currentUser?.companyId || 'DEFAULT_COMPANY',
      createdBy: driver.createdBy || currentUserId,
      createdByName: driver.createdByName || currentUserName,
      createdAt: driver.createdAt || nowIso,
      lastModifiedBy: currentUserId,
      lastModifiedByName: currentUserName,
      lastModifiedAt: nowIso
    };

    // Update state locally
    setState(prev => {
      const updatedDispatchers = prev.dispatchers.map(d => {
        if (d.id === driver.assignedDispatcherId) {
          return {
            ...d,
            assignedDriverIds: [...d.assignedDriverIds, newDriver.id]
          };
        }
        return d;
      });

      return {
        ...prev,
        drivers: [...prev.drivers, newDriver],
        dispatchers: updatedDispatchers
      };
    });

    // Write to Firestore
    await syncToFirestore('drivers', newDriver.id, newDriver);
    if (driver.assignedDispatcherId) {
      const dispObj = state.dispatchers.find(d => d.id === driver.assignedDispatcherId);
      if (dispObj) {
        await syncToFirestore('dispatchers', dispObj.id, {
          ...dispObj,
          assignedDriverIds: [...dispObj.assignedDriverIds, newDriver.id]
        });
      }
    }
  };

  const addDriversBulk = async (driversList: (Omit<Driver, 'id'> & { id?: string })[]) => {
    const currentUserName = state.currentUser?.name || state.currentUser?.username || 'Team Member';
    const currentUserId = state.currentUser?.id || 'sys';
    const nowIso = new Date().toISOString();

    const newDrivers: Driver[] = driversList.map(driver => ({
      ...driver,
      id: driver.id || `drv_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      companyId: state.currentUser?.companyId || 'DEFAULT_COMPANY',
      createdBy: driver.createdBy || currentUserId,
      createdByName: driver.createdByName || currentUserName,
      createdAt: driver.createdAt || nowIso,
      lastModifiedBy: currentUserId,
      lastModifiedByName: currentUserName,
      lastModifiedAt: nowIso
    }));

    setState(prev => {
      // Map dispatchers to include assigned driver IDs
      const updatedDispatchers = prev.dispatchers.map(d => {
        const newlyAssignedIds = newDrivers
          .filter(drv => drv.assignedDispatcherId === d.id)
          .map(drv => drv.id);
        
        if (newlyAssignedIds.length > 0) {
          return {
            ...d,
            assignedDriverIds: [...d.assignedDriverIds, ...newlyAssignedIds]
          };
        }
        return d;
      });

      return {
        ...prev,
        drivers: [...prev.drivers, ...newDrivers],
        dispatchers: updatedDispatchers
      };
    });

    for (const d of newDrivers) {
      await syncToFirestore('drivers', d.id, d);
      if (d.assignedDispatcherId) {
        const dispObj = state.dispatchers.find(disp => disp.id === d.assignedDispatcherId);
        if (dispObj) {
          await syncToFirestore('dispatchers', dispObj.id, {
            ...dispObj,
            assignedDriverIds: [...dispObj.assignedDriverIds, d.id]
          });
        }
      }
    }
  };

  const editDriver = async (id: string, updated: Partial<Driver>) => {
    const oldDriver = state.drivers.find(d => d.id === id);
    if (!oldDriver) return;

    const currentUserName = state.currentUser?.name || state.currentUser?.username || 'Team Member';
    const currentUserId = state.currentUser?.id || 'sys';
    const nowIso = new Date().toISOString();

    const mergedDriver = {
      ...oldDriver,
      ...updated,
      lastModifiedBy: currentUserId,
      lastModifiedByName: currentUserName,
      lastModifiedAt: nowIso
    };

    setState(prev => {
      let updatedDispatchers = prev.dispatchers;

      // Handle dispatcher change
      if (updated.assignedDispatcherId && oldDriver.assignedDispatcherId !== updated.assignedDispatcherId) {
        updatedDispatchers = prev.dispatchers.map(d => {
          let dIds = d.assignedDriverIds;
          if (d.id === oldDriver.assignedDispatcherId) {
            dIds = dIds.filter(did => did !== id);
          }
          if (d.id === updated.assignedDispatcherId) {
            dIds = [...dIds.filter(did => did !== id), id];
          }
          return { ...d, assignedDriverIds: dIds };
        });
      }

      return {
        ...prev,
        drivers: prev.drivers.map(d => (d.id === id ? mergedDriver : d)),
        dispatchers: updatedDispatchers
      };
    });

    await syncToFirestore('drivers', id, mergedDriver);

    // Sync changed dispatchers too if changed
    if (updated.assignedDispatcherId && oldDriver.assignedDispatcherId !== updated.assignedDispatcherId) {
      const oldDisp = state.dispatchers.find(d => d.id === oldDriver.assignedDispatcherId);
      if (oldDisp) {
        await syncToFirestore('dispatchers', oldDisp.id, {
          ...oldDisp,
          assignedDriverIds: oldDisp.assignedDriverIds.filter(did => did !== id)
        });
      }
      const newDisp = state.dispatchers.find(d => d.id === updated.assignedDispatcherId);
      if (newDisp) {
        await syncToFirestore('dispatchers', newDisp.id, {
          ...newDisp,
          assignedDriverIds: [...newDisp.assignedDriverIds.filter(did => did !== id), id]
        });
      }
    }
  };

  const deleteDriver = async (id: string) => {
    if (state.currentUser?.role !== 'ADMIN') {
      alert("⚠️ Access Denied: Driver records are locked and protected. Only an Administrator can remove drivers.");
      return;
    }
    const affectedDispatchers = state.dispatchers.filter(d => d.assignedDriverIds && d.assignedDriverIds.includes(id));

    setState(prev => {
      const nextDrivers = prev.drivers.filter(d => d.id !== id);
      savePermanentDrivers(nextDrivers);
      return {
        ...prev,
        drivers: nextDrivers,
        dispatchers: prev.dispatchers.map(d => ({
          ...d,
          assignedDriverIds: (d.assignedDriverIds || []).filter(did => did !== id)
        })),
        loads: prev.loads.filter(l => l.driverId !== id)
      };
    });

    await removeFromFirestore('drivers', id);

    for (const disp of affectedDispatchers) {
      const updatedAssigned = (disp.assignedDriverIds || []).filter(did => did !== id);
      await syncToFirestore('dispatchers', disp.id, {
        ...disp,
        assignedDriverIds: updatedAssigned
      });
    }
  };

  // Dispatchers Actions (including Sales agents if added)
  const addDispatcher = async (disp: Omit<Dispatcher, 'id' | 'assignedDriverIds'> & { id?: string; permissions?: SeatPermissions }) => {
    if (state.currentUser?.role !== 'ADMIN') {
      alert("⚠️ Access Denied: Team seats are locked. Only an Administrator can add new seats.");
      return;
    }

    const id = disp.id || `disp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newDisp: Dispatcher = {
      ...disp,
      id,
      assignedDriverIds: [],
      companyId: state.currentUser?.companyId || 'DEFAULT_COMPANY'
    };

    const defaultPerms: SeatPermissions = disp.permissions || {
      canAccessDashboard: true,
      canAccessInvoicing: false,
      canAccessDriverPayout: false,
      canAccessTransactionVault: false,
      canAccessCarrierCRM: false,
      canAccessCorporateReports: false,
      canAccessDailyAssignment: true,
      canAccessDriverIndex: true,
      onlyAssignedDrivers: true,
      canAccessLoadBoard: true,
      onlyAssignedLoads: true,
      canAccessTimeClock: true,
      canAccessTools: true,
      canAccessTeamChat: true,
      canAccessSalesCRM: false,
      canAccessTeamSeats: false,
      isFullAccess: false
    };

    // Corresponding user account for login
    const newUser: User = {
      id: `u_${Date.now()}`,
      username: disp.username,
      name: disp.name,
      role: 'DISPATCHER',
      phone: disp.phone,
      dispatcherId: id,
      password: disp.password || '123',
      companyId: state.currentUser?.companyId || 'DEFAULT_COMPANY',
      permissions: defaultPerms
    };

    setState(prev => {
      const nextDispatchers = [...prev.dispatchers, newDisp];
      const nextUsers = [...prev.users, newUser];
      savePermanentDispatchers(nextDispatchers);
      savePermanentUsers(nextUsers);
      return {
        ...prev,
        dispatchers: nextDispatchers,
        users: nextUsers
      };
    });

    await syncToFirestore('dispatchers', newDisp.id, newDisp);
    await syncToFirestore('users', newUser.id, newUser);
  };

  const editDispatcher = async (id: string, updated: Partial<Dispatcher>) => {
    if (state.currentUser?.role !== 'ADMIN') {
      alert("⚠️ Access Denied: Team seats are locked. Only an Administrator can modify seat settings.");
      return;
    }

    const dispObj = state.dispatchers.find(d => d.id === id);
    if (!dispObj) return;

    const mergedDisp = { ...dispObj, ...updated };

    let updatedUserToSync: User | null = null;

    setState(prev => {
      const updatedUserList = prev.users.map(u => {
        if (u.username === dispObj.username || u.dispatcherId === id) {
          const updatedUser: User = {
            ...u,
            username: updated.username !== undefined ? updated.username : u.username,
            name: updated.name !== undefined ? updated.name : u.name,
            phone: updated.phone !== undefined ? updated.phone : u.phone,
            password: updated.password !== undefined ? updated.password : u.password,
            baseSalaryPKR: updated.baseSalaryPKR !== undefined ? updated.baseSalaryPKR : u.baseSalaryPKR,
            targetUSD: updated.targetUSD !== undefined ? updated.targetUSD : u.targetUSD,
            bonusPercent: updated.bonusPercent !== undefined ? updated.bonusPercent : u.bonusPercent,
          };
          updatedUserToSync = updatedUser;
          return updatedUser;
        }
        return u;
      });

      const nextDispatchers = prev.dispatchers.map(d => (d.id === id ? mergedDisp : d));
      savePermanentDispatchers(nextDispatchers);
      savePermanentUsers(updatedUserList);

      return {
        ...prev,
        dispatchers: nextDispatchers,
        users: updatedUserList
      };
    });

    await syncToFirestore('dispatchers', id, mergedDisp);

    if (updatedUserToSync) {
      await syncToFirestore('users', (updatedUserToSync as User).id, updatedUserToSync);
    }
  };

  const deleteDispatcher = async (id: string) => {
    if (state.currentUser?.role !== 'ADMIN') {
      alert("⚠️ Access Denied: Team seats are locked. Only an Administrator can remove seats.");
      return;
    }

    const dispObj = state.dispatchers.find(d => d.id === id);
    if (!dispObj) return;

    setState(prev => {
      const updatedDrivers = prev.drivers.map(drv => {
        if (drv.assignedDispatcherId === id) {
          return { ...drv, assignedDispatcherId: '' };
        }
        return drv;
      });

      const nextDispatchers = prev.dispatchers.filter(d => d.id !== id);
      const nextUsers = prev.users.filter(u => u.username !== dispObj.username && u.dispatcherId !== id);
      savePermanentDispatchers(nextDispatchers);
      savePermanentUsers(nextUsers);

      return {
        ...prev,
        dispatchers: nextDispatchers,
        users: nextUsers,
        drivers: updatedDrivers
      };
    });

    await removeFromFirestore('dispatchers', id);
    const relUser = state.users.find(u => u.username === dispObj.username);
    if (relUser) {
      await removeFromFirestore('users', relUser.id);
    }
  };

  // Loads Actions
  const addLoad = async (load: Omit<Load, 'id'> & { id?: string }) => {
    const currentUserName = state.currentUser?.name || state.currentUser?.username || 'Team Member';
    const currentUserId = state.currentUser?.id || 'sys';
    const nowIso = new Date().toISOString();

    const newLoad: Load = {
      ...load,
      id: load.id || `ld_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      companyId: state.currentUser?.companyId || 'DEFAULT_COMPANY',
      createdBy: load.createdBy || currentUserId,
      createdByName: load.createdByName || currentUserName,
      createdAt: load.createdAt || nowIso,
      lastModifiedBy: currentUserId,
      lastModifiedByName: currentUserName,
      lastModifiedAt: nowIso
    };

    setState(prev => {
      // Auto-update driver posting status if assigned
      let updatedPostings = prev.driverPostings || [];
      if (newLoad.driverId) {
        const targetPost = updatedPostings.find(p => p.driverId === newLoad.driverId);
        if (targetPost) {
          const isPartial = (newLoad.loadAmount || 0) < 800 || Boolean(newLoad.notes && newLoad.notes.toLowerCase().includes('partial'));
          const newStatus: DriverPostingStatus = isPartial ? 'PARTIAL' : 'BOOKED';
          const mergedPost: DriverDailyPosting = {
            ...targetPost,
            status: newStatus,
            currentLoadId: newLoad.id,
            currentLoadNum: newLoad.loadNum,
            updatedAt: new Date().toISOString(),
            lastModifiedBy: currentUserId,
            lastModifiedByName: currentUserName,
            lastModifiedAt: nowIso
          };
          updatedPostings = updatedPostings.map(p => p.id === targetPost.id ? mergedPost : p);
          syncToFirestore('driverPostings', targetPost.id, mergedPost);
        }
      }

      return {
        ...prev,
        loads: [...prev.loads, newLoad],
        driverPostings: updatedPostings
      };
    });

    await syncToFirestore('loads', newLoad.id, newLoad);

    // Auto-save broker to directory if broker name is provided
    if (newLoad.broker && newLoad.broker.trim()) {
      autoSaveBroker({
        companyName: newLoad.broker.trim(),
        contactPerson: newLoad.brokerContact,
        phone: newLoad.brokerPhone,
        email: newLoad.brokerEmail,
        mcNumber: newLoad.brokerMC,
        paymentTerms: newLoad.brokerPaymentTerms
      });
    }
  };

  const addLoadsBulk = async (loadsList: (Omit<Load, 'id'> & { id?: string })[]) => {
    const currentUserName = state.currentUser?.name || state.currentUser?.username || 'Team Member';
    const currentUserId = state.currentUser?.id || 'sys';
    const nowIso = new Date().toISOString();

    const newLoads: Load[] = loadsList.map(load => ({
      ...load,
      id: load.id || `ld_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      companyId: state.currentUser?.companyId || 'DEFAULT_COMPANY',
      createdBy: load.createdBy || currentUserId,
      createdByName: load.createdByName || currentUserName,
      createdAt: load.createdAt || nowIso,
      lastModifiedBy: currentUserId,
      lastModifiedByName: currentUserName,
      lastModifiedAt: nowIso
    }));

    setState(prev => ({
      ...prev,
      loads: [...prev.loads, ...newLoads]
    }));

    for (const l of newLoads) {
      await syncToFirestore('loads', l.id, l);
      if (l.broker && l.broker.trim()) {
        autoSaveBroker({
          companyName: l.broker.trim(),
          contactPerson: l.brokerContact,
          phone: l.brokerPhone,
          email: l.brokerEmail,
          mcNumber: l.brokerMC,
          paymentTerms: l.brokerPaymentTerms
        });
      }
    }
  };

  const editLoad = async (id: string, updated: Partial<Load>) => {
    const oldLoad = state.loads.find(l => l.id === id);
    if (!oldLoad) return;

    const currentUserName = state.currentUser?.name || state.currentUser?.username || 'Team Member';
    const currentUserId = state.currentUser?.id || 'sys';
    const nowIso = new Date().toISOString();

    const merged = {
      ...oldLoad,
      ...updated,
      lastModifiedBy: currentUserId,
      lastModifiedByName: currentUserName,
      lastModifiedAt: nowIso
    };

    setState(prev => {
      let updatedPostings = prev.driverPostings || [];
      if (merged.driverId) {
        const targetPost = updatedPostings.find(p => p.driverId === merged.driverId);
        if (targetPost) {
          const isDelivered = merged.status === 'Delivered' || (merged.status as string) === 'DELIVERED' || (merged.status as string) === 'PAID';
          const newStatus: DriverPostingStatus = isDelivered ? 'NEEDS_LOAD' : 'BOOKED';
          const mergedPost: DriverDailyPosting = {
            ...targetPost,
            status: newStatus,
            currentLoadId: isDelivered ? undefined : merged.id,
            currentLoadNum: isDelivered ? undefined : merged.loadNum,
            updatedAt: new Date().toISOString(),
            lastModifiedBy: currentUserId,
            lastModifiedByName: currentUserName,
            lastModifiedAt: nowIso
          };
          updatedPostings = updatedPostings.map(p => p.id === targetPost.id ? mergedPost : p);
          syncToFirestore('driverPostings', targetPost.id, mergedPost);
        }
      }

      return {
        ...prev,
        loads: prev.loads.map(l => (l.id === id ? merged : l)),
        driverPostings: updatedPostings
      };
    });

    await syncToFirestore('loads', id, merged);

    if (merged.broker && merged.broker.trim()) {
      autoSaveBroker({
        companyName: merged.broker.trim(),
        contactPerson: merged.brokerContact,
        phone: merged.brokerPhone,
        email: merged.brokerEmail,
        mcNumber: merged.brokerMC,
        paymentTerms: merged.brokerPaymentTerms
      });
    }
  };

  const deleteLoad = async (id: string) => {
    if (state.currentUser?.role !== 'ADMIN') {
      alert("⚠️ Access Denied: Loads are locked and protected. Only an Administrator can remove load records.");
      return;
    }

    setState(prev => {
      const nextLoads = prev.loads.filter(l => l.id !== id);
      savePermanentLoads(nextLoads);
      return {
        ...prev,
        loads: nextLoads
      };
    });

    await removeFromFirestore('loads', id);
  };

  const addDriverSettlement = async (settlement: Omit<DriverSettlement, 'id'>) => {
    const id = `SET-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newSettlement: DriverSettlement = {
      ...settlement,
      id,
      companyId: state.currentUser?.companyId || 'DEFAULT_COMPANY'
    };

    setState(prev => ({
      ...prev,
      driverSettlements: [...prev.driverSettlements, newSettlement]
    }));

    await syncToFirestore('driverSettlements', id, newSettlement);
  };

  const editDriverSettlement = async (id: string, updated: Partial<DriverSettlement>) => {
    const oldSettlement = state.driverSettlements.find(s => s.id === id);
    if (!oldSettlement) return;
    const merged = { ...oldSettlement, ...updated };

    setState(prev => ({
      ...prev,
      driverSettlements: prev.driverSettlements.map(s => (s.id === id ? merged : s))
    }));

    await syncToFirestore('driverSettlements', id, merged);
  };

  const deleteDriverSettlement = async (id: string) => {
    if (state.currentUser?.role !== 'ADMIN') {
      alert("⚠️ Access Denied: Settlements are locked and protected. Only an Administrator can remove settlements.");
      return;
    }

    setState(prev => {
      const nextSettlements = prev.driverSettlements.filter(s => s.id !== id);
      savePermanentSettlements(nextSettlements);
      return {
        ...prev,
        driverSettlements: nextSettlements
      };
    });

    await removeFromFirestore('driverSettlements', id);
  };

  const addInvoice = async (invoice: Omit<Invoice, 'id'>) => {
    const id = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newInvoice: Invoice = {
      ...invoice,
      id,
      companyId: state.currentUser?.companyId || 'DEFAULT_COMPANY'
    };

    setState(prev => ({
      ...prev,
      invoices: [...(prev.invoices || []), newInvoice]
    }));

    await syncToFirestore('invoices', id, newInvoice);
  };

  const editInvoice = async (id: string, updated: Partial<Invoice>) => {
    const oldInvoice = state.invoices?.find(i => i.id === id);
    if (!oldInvoice) return;
    const merged = { ...oldInvoice, ...updated };

    setState(prev => ({
      ...prev,
      invoices: (prev.invoices || []).map(i => (i.id === id ? merged : i))
    }));

    await syncToFirestore('invoices', id, merged);
  };

  const deleteInvoice = async (id: string) => {
    setState(prev => {
      const nextInvoices = (prev.invoices || []).filter(i => i.id !== id);
      savePermanentInvoices(nextInvoices);
      return {
        ...prev,
        invoices: nextInvoices
      };
    });

    await removeFromFirestore('invoices', id);
  };

  // Clock Actions (accepts generic userId to cover both dispatchers & sales team)
  const clockIn = (userId: string, customTime?: string, customDate?: string): { success: boolean; record: ClockRecord } => {
    const today = customDate || new Date().toISOString().split('T')[0];
    const now = new Date();
    
    let timeStr = customTime;
    if (!timeStr) {
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      timeStr = `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    }

    let userTimeZone = 'Asia/Karachi';
    try {
      userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Karachi';
    } catch {
      userTimeZone = 'Asia/Karachi';
    }

    let isLate = false;
    let lateMinutes = 0;
    try {
      const [hPart, mPartAndAmpm] = timeStr.split(':');
      const [mPart, ampmPart] = mPartAndAmpm.split(' ');
      let h = parseInt(hPart);
      const m = parseInt(mPart);
      const ampm = (ampmPart || 'AM').toUpperCase();
      if (ampm === 'PM' && h !== 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      const totalMins = h * 60 + m;

      // Shift 1: Pakistan Standard Time 5:00 PM (17:00 = 1020 mins)
      // Shift 2: US Eastern Time 9:00 AM (09:00 = 540 mins)
      const isPktShift = userTimeZone.includes('Karachi') || userTimeZone.includes('Asia') || totalMins >= 720 || totalMins < 240;
      if (isPktShift) {
        // Shift start is 5:00 PM (1020 mins). Grace period 5 mins (1025).
        if (totalMins > 1025) {
          isLate = true;
          lateMinutes = totalMins - 1020;
        } else if (totalMins < 1020 && totalMins >= 120) {
          // If clocked in after midnight (e.g. 12:30 AM = 30 mins) during 5 PM - 2 AM shift
          if (totalMins < 120) {
            isLate = true;
            lateMinutes = (1440 - 1020) + totalMins;
          }
        }
      } else {
        // US Eastern 9:00 AM (540 mins). Grace period 5 mins (545).
        if (totalMins > 545 && totalMins < 1020) {
          isLate = true;
          lateMinutes = totalMins - 540;
        }
      }
    } catch (e) {
      console.error('Time parsing error', e);
    }

    const effectiveUserId = userId || state.currentUser?.dispatcherId || state.currentUser?.id || 'sys';
    const effectiveDispName = state.currentUser?.name || 
      state.users.find(u => u.id === effectiveUserId || u.dispatcherId === effectiveUserId || u.username === effectiveUserId)?.name ||
      state.dispatchers.find(d => d.id === effectiveUserId || d.username === effectiveUserId)?.name ||
      state.currentUser?.username || 'Team Member';

    const clockInTimestamp = customTime ? parseFullDateTimeToMs(today, timeStr) : Date.now();
    const newRecord: ClockRecord = {
      id: `clk_${Date.now()}`,
      dispatcherId: effectiveUserId,
      dispatcherName: effectiveDispName,
      date: today,
      clockIn: timeStr,
      clockInTimestamp,
      isLate,
      lateMinutes: isLate ? lateMinutes : 0,
      notes: isLate ? `Clocked in ${lateMinutes}m past shift start.` : '',
      breaksTaken: [],
      shortLeavesTaken: [],
      totalShortLeaveMinutes: 0,
      totalOverBreakMinutes: 0,
      timeZone: userTimeZone,
      companyId: state.currentUser?.companyId || 'DEFAULT_COMPANY'
    };

    setState(prev => {
      const nextAttendance = [...prev.attendance, newRecord];
      savePermanentAttendance(nextAttendance);
      return {
        ...prev,
        attendance: nextAttendance,
        currentClockRecord: newRecord
      };
    });

    syncToFirestore('attendance', newRecord.id, newRecord);

    return { success: true, record: newRecord };
  };

  const clockOut = async (recordId: string, customTime?: string) => {
    let targetRecord: ClockRecord | null = null;

    setState(prev => {
      let record = prev.attendance.find(c => c.id === recordId) ||
        (prev.currentClockRecord?.id === recordId ? prev.currentClockRecord : null);

      if (!record && prev.currentUser) {
        record = findUserActiveShift(prev.attendance, prev.currentUser);
      }
      if (!record) return prev;

      const now = new Date();
      const clockOutTimestamp = Date.now();
      let outStr = customTime;
      if (!outStr) {
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        outStr = `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
      }

      let minutesWorked = 480;
      try {
        const startMs = record.clockInTimestamp || parseFullDateTimeToMs(record.date, record.clockIn);
        const endMs = customTime ? parseFullDateTimeToMs(record.date, customTime) : clockOutTimestamp;
        minutesWorked = Math.max(1, Math.round((endMs - startMs) / 60000));
      } catch (e) {
        console.error('Failed to parse clock-out elapsed minutes', e);
      }

      // Auto-complete any still active breaks or short leaves
      const finalizedBreaks = (record.breaksTaken || []).map(b => {
        if (b.status === 'ACTIVE') {
          const dur = calculateBreakMinutes(b.takenAt, outStr, b.startedAtTimestamp, clockOutTimestamp);
          const allocated = b.allocatedMinutes || (b.label.includes('Meal') ? 20 : 10);
          return {
            ...b,
            status: 'COMPLETED' as const,
            completedAt: outStr,
            completedAtTimestamp: clockOutTimestamp,
            durationMinutes: dur,
            overBreakMinutes: Math.max(0, dur - allocated)
          };
        }
        return b;
      });

      const finalizedShortLeaves = (record.shortLeavesTaken || []).map(sl => {
        if (sl.status === 'ACTIVE') {
          const dur = calculateBreakMinutes(sl.startedAt, outStr, sl.startedAtTimestamp, clockOutTimestamp);
          return {
            ...sl,
            status: 'COMPLETED' as const,
            completedAt: outStr,
            completedAtTimestamp: clockOutTimestamp,
            durationMinutes: dur
          };
        }
        return sl;
      });

      const totalOverBreaks = finalizedBreaks.reduce((acc, b) => acc + (b.overBreakMinutes || 0), 0);
      const totalShortLeaves = finalizedShortLeaves.reduce((acc, sl) => acc + (sl.durationMinutes || 0), 0);

      const updatedRecord: ClockRecord = {
        ...record,
        clockOut: outStr,
        clockOutTimestamp,
        workMinutes: minutesWorked,
        breaksTaken: finalizedBreaks,
        shortLeavesTaken: finalizedShortLeaves,
        totalOverBreakMinutes: totalOverBreaks,
        totalShortLeaveMinutes: totalShortLeaves
      };

      targetRecord = updatedRecord;

      const recordIndex = prev.attendance.findIndex(c => c.id === record.id);
      const newAttendance = [...prev.attendance];
      if (recordIndex !== -1) {
        newAttendance[recordIndex] = updatedRecord;
      } else {
        newAttendance.push(updatedRecord);
      }

      savePermanentAttendance(newAttendance);

      return {
        ...prev,
        attendance: newAttendance,
        currentClockRecord: null
      };
    });

    if (targetRecord) {
      await syncToFirestore('attendance', (targetRecord as ClockRecord).id, targetRecord);
    }
  };

  const updateClockRecord = async (recordId: string, updatedFields: Partial<ClockRecord>) => {
    let recordToSync: ClockRecord | null = null;

    setState(prev => {
      let record = prev.attendance.find(c => c.id === recordId) ||
        (prev.currentClockRecord?.id === recordId ? prev.currentClockRecord : null);

      if (!record && prev.currentUser) {
        record = findUserActiveShift(prev.attendance, prev.currentUser);
      }
      if (!record) return prev;

      const merged: ClockRecord = { ...record, ...updatedFields };

      // Automatically recalculate over-breaks and short-leaves if breaksTaken or shortLeavesTaken changed
      if (merged.breaksTaken) {
        merged.totalOverBreakMinutes = merged.breaksTaken.reduce((sum, b) => sum + (b.overBreakMinutes || 0), 0);
      }
      if (merged.shortLeavesTaken) {
        merged.totalShortLeaveMinutes = merged.shortLeavesTaken.reduce((sum, sl) => sum + (sl.durationMinutes || 0), 0);
      }

      recordToSync = merged;

      const idx = prev.attendance.findIndex(c => c.id === record.id);
      const newAttendance = [...prev.attendance];
      if (idx !== -1) {
        newAttendance[idx] = merged;
      } else {
        newAttendance.push(merged);
      }

      savePermanentAttendance(newAttendance);

      return {
        ...prev,
        attendance: newAttendance,
        currentClockRecord: prev.currentClockRecord?.id === record.id ? merged : (prev.currentClockRecord && !prev.currentClockRecord.clockOut ? prev.currentClockRecord : null)
      };
    });

    if (recordToSync) {
      await syncToFirestore('attendance', (recordToSync as ClockRecord).id, recordToSync);
    }
  };

  // Global Config
  const setFactoringRate = (rate: number) => {
    setState(prev => ({
      ...prev,
      factoringRatePercent: rate
    }));
  };

  // Carrier & Owner Operators Actions
  const addCarrier = async (carrier: Omit<CarrierOrOwner, 'id'>) => {
    const newCarrier: CarrierOrOwner = {
      ...carrier,
      id: `carr_${Date.now()}`,
      companyId: state.currentUser?.companyId || 'DEFAULT_COMPANY'
    };
    setState(prev => ({
      ...prev,
      carriers: [...prev.carriers, newCarrier]
    }));
    await syncToFirestore('carriers', newCarrier.id, newCarrier);
  };

  const addCarriersBulk = async (carriersList: (Omit<CarrierOrOwner, 'id'> & { id?: string })[]) => {
    const newCarriers: CarrierOrOwner[] = carriersList.map(carrier => ({
      ...carrier,
      id: carrier.id || `carr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      companyId: state.currentUser?.companyId || 'DEFAULT_COMPANY'
    }));

    setState(prev => ({
      ...prev,
      carriers: [...prev.carriers, ...newCarriers]
    }));

    for (const c of newCarriers) {
      await syncToFirestore('carriers', c.id, c);
    }
  };

  const editCarrier = async (id: string, updated: Partial<CarrierOrOwner>) => {
    const oldCarr = state.carriers.find(c => c.id === id);
    if (!oldCarr) return;
    const merged = { ...oldCarr, ...updated };

    setState(prev => ({
      ...prev,
      carriers: prev.carriers.map(c => (c.id === id ? merged : c))
    }));
    await syncToFirestore('carriers', id, merged);
  };

  const deleteCarrier = async (id: string) => {
    if (state.currentUser?.role !== 'ADMIN') {
      alert("⚠️ Access Denied: Carriers are locked and protected. Only an Administrator can remove carrier records.");
      return;
    }

    setState(prev => {
      const nextCarriers = prev.carriers.filter(c => c.id !== id);
      savePermanentCarriers(nextCarriers);
      return {
        ...prev,
        carriers: nextCarriers,
        drivers: prev.drivers.map(d => (d.carrierId === id ? { ...d, carrierId: undefined } : d))
      };
    });
    await removeFromFirestore('carriers', id);
  };

  // Leads tracking actions (Sales representative)
  const addLead = async (lead: Omit<Lead, 'id'> & { id?: string }) => {
    const id = lead.id || `led_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newLead: Lead = {
      ...lead,
      id,
      createdAt: lead.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
      companyId: state.currentUser?.companyId || 'DEFAULT_COMPANY'
    };
    setState(prev => ({
      ...prev,
      leads: [newLead, ...(prev.leads || []).filter(l => l.id !== id)]
    }));
    await syncToFirestore('leads', id, newLead);
  };

  const editLead = async (id: string, updated: Partial<Lead>) => {
    const oldLead = state.leads.find(l => l.id === id);
    if (!oldLead) return;
    const merged: Lead = { 
      ...oldLead, 
      ...updated,
      updatedAt: new Date().toISOString(),
      companyId: state.currentUser?.companyId || 'DEFAULT_COMPANY'
    };

    setState(prev => ({
      ...prev,
      leads: prev.leads.map(l => (l.id === id ? merged : l))
    }));
    await syncToFirestore('leads', id, merged);
  };

  const deleteLead = async (id: string) => {
    setState(prev => ({
      ...prev,
      leads: prev.leads.filter(l => l.id !== id)
    }));
    await removeFromFirestore('leads', id);
  };

  // Sales Daily Work Logs (Performance & Targets Tracking)
  const addSalesDailyLog = async (log: Omit<SalesDailyLog, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    const id = log.id || `slog_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newLog: SalesDailyLog = {
      ...log,
      id,
      companyId: state.currentUser?.companyId || 'DEFAULT_COMPANY',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      salesDailyLogs: [newLog, ...(prev.salesDailyLogs || []).filter(l => l.id !== id)]
    }));

    await syncToFirestore('salesDailyLogs', id, newLog);
  };

  const editSalesDailyLog = async (id: string, updated: Partial<SalesDailyLog>) => {
    const oldLog = (state.salesDailyLogs || []).find(l => l.id === id);
    if (!oldLog) return;
    const merged: SalesDailyLog = {
      ...oldLog,
      ...updated,
      updatedAt: new Date().toISOString(),
      companyId: state.currentUser?.companyId || 'DEFAULT_COMPANY'
    };

    setState(prev => ({
      ...prev,
      salesDailyLogs: (prev.salesDailyLogs || []).map(l => l.id === id ? merged : l)
    }));

    await syncToFirestore('salesDailyLogs', id, merged);
  };

  const deleteSalesDailyLog = async (id: string) => {
    setState(prev => ({
      ...prev,
      salesDailyLogs: (prev.salesDailyLogs || []).filter(l => l.id !== id)
    }));
    await removeFromFirestore('salesDailyLogs', id);
  };

  // Broker Directory Actions
  const addBroker = async (broker: Omit<BrokerContact, 'id'> & { id?: string }) => {
    const id = broker.id || `brk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newBroker: BrokerContact = {
      ...broker,
      id,
      companyId: state.currentUser?.companyId || 'DEFAULT_COMPANY',
      createdAt: broker.createdAt || new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      brokers: [newBroker, ...(prev.brokers || []).filter(b => b.id !== id)]
    }));

    await syncToFirestore('brokers', id, newBroker);
    return newBroker;
  };

  const editBroker = async (id: string, updated: Partial<BrokerContact>) => {
    const oldBroker = (state.brokers || INITIAL_BROKERS).find(b => b.id === id);
    if (!oldBroker) return;
    const merged = { ...oldBroker, ...updated };

    setState(prev => ({
      ...prev,
      brokers: (prev.brokers || INITIAL_BROKERS).map(b => (b.id === id ? merged : b))
    }));

    await syncToFirestore('brokers', id, merged);
  };

  const deleteBroker = async (id: string) => {
    setState(prev => ({
      ...prev,
      brokers: (prev.brokers || INITIAL_BROKERS).filter(b => b.id !== id)
    }));

    await removeFromFirestore('brokers', id);
  };

  const addBrokersBulk = async (brokersList: (Omit<BrokerContact, 'id'> & { id?: string })[]) => {
    const newBrokers: BrokerContact[] = brokersList.map(broker => ({
      ...broker,
      id: broker.id || `brk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      companyId: state.currentUser?.companyId || 'DEFAULT_COMPANY',
      createdAt: broker.createdAt || new Date().toISOString()
    }));

    setState(prev => ({
      ...prev,
      brokers: [...newBrokers, ...(prev.brokers || [])]
    }));

    for (const b of newBrokers) {
      await syncToFirestore('brokers', b.id, b);
    }
  };

  // Auto-save or update broker from Load Board addition
  const autoSaveBroker = async (data: { companyName: string; contactPerson?: string; phone?: string; email?: string; mcNumber?: string; paymentTerms?: string }) => {
    if (!data.companyName || !data.companyName.trim()) return null;
    const trimmedComp = data.companyName.trim();
    const existing = (state.brokers || INITIAL_BROKERS).find(
      b => b.companyName.trim().toLowerCase() === trimmedComp.toLowerCase()
    );

    if (existing) {
      // If new info is provided that wasn't there before or was updated
      const needsUpdate = (data.contactPerson && data.contactPerson !== existing.contactPerson) ||
                          (data.phone && data.phone !== existing.phone) ||
                          (data.email && data.email !== existing.email) ||
                          (data.mcNumber && data.mcNumber !== existing.mcNumber);
      if (needsUpdate) {
        const updated = {
          ...existing,
          contactPerson: data.contactPerson || existing.contactPerson,
          phone: data.phone || existing.phone,
          email: data.email || existing.email,
          mcNumber: data.mcNumber || existing.mcNumber,
          paymentTerms: data.paymentTerms || existing.paymentTerms
        };
        await editBroker(existing.id, updated);
        return updated;
      }
      return existing;
    } else {
      const newBroker = await addBroker({
        companyName: trimmedComp,
        contactPerson: data.contactPerson || '',
        phone: data.phone || '',
        email: data.email || '',
        mcNumber: data.mcNumber || '',
        paymentTerms: data.paymentTerms || 'Standard Terms',
        rating: 5,
        notes: 'Auto-saved from Load Board booking'
      });
      return newBroker;
    }
  };

  // Daily instant dispatcher assignment action
  const assignDriverDaily = async (driverId: string, dispatcherId: string) => {
    const drv = state.drivers.find(d => d.id === driverId);
    if (!drv) return;
    const mergedDrv = { ...drv, assignedDispatcherId: dispatcherId };

    setState(prev => {
      const updatedDrivers = prev.drivers.map(d => {
        if (d.id === driverId) {
          return mergedDrv;
        }
        return d;
      });

      const updatedDispatchers = prev.dispatchers.map(disp => {
        let dIds = disp.assignedDriverIds.filter(did => did !== driverId);
        if (disp.id === dispatcherId) {
          dIds = [...dIds, driverId];
        }
        return { ...disp, assignedDriverIds: dIds };
      });

      return {
        ...prev,
        drivers: updatedDrivers,
        dispatchers: updatedDispatchers
      };
    });

    await syncToFirestore('drivers', driverId, mergedDrv);

    const oldDisp = state.dispatchers.find(disp => disp.assignedDriverIds.includes(driverId) && disp.id !== dispatcherId);
    if (oldDisp) {
      await syncToFirestore('dispatchers', oldDisp.id, {
        ...oldDisp,
        assignedDriverIds: oldDisp.assignedDriverIds.filter(did => did !== driverId)
      });
    }
    const newDisp = state.dispatchers.find(disp => disp.id === dispatcherId);
    if (newDisp) {
      await syncToFirestore('dispatchers', newDisp.id, {
        ...newDisp,
        assignedDriverIds: [...newDisp.assignedDriverIds.filter(did => did !== driverId), driverId]
      });
    }
  };

  // Driver Daily Postings / Capacity Actions
  const addDriverPosting = async (posting: Omit<DriverDailyPosting, 'id' | 'updatedAt'> & { id?: string }) => {
    const currentUserName = state.currentUser?.name || state.currentUser?.username || 'Team Member';
    const currentUserId = state.currentUser?.id || 'sys';
    const nowIso = new Date().toISOString();

    const id = posting.id && !posting.id.startsWith('virtual_') 
      ? posting.id 
      : `post_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newPosting: DriverDailyPosting = {
      ...posting,
      id,
      updatedAt: nowIso,
      companyId: state.currentUser?.companyId || 'DEFAULT_COMPANY',
      createdBy: posting.createdBy || currentUserId,
      createdByName: posting.createdByName || currentUserName,
      createdAt: posting.createdAt || nowIso,
      lastModifiedBy: currentUserId,
      lastModifiedByName: currentUserName,
      lastModifiedAt: nowIso
    };

    setState(prev => ({
      ...prev,
      driverPostings: [newPosting, ...(prev.driverPostings || []).filter(p => p.id !== id && p.driverId !== posting.driverId)]
    }));

    await syncToFirestore('driverPostings', id, newPosting);
    return newPosting;
  };

  const editDriverPosting = async (id: string, updated: Partial<DriverDailyPosting>) => {
    let old = (state.driverPostings || []).find(p => p.id === id);
    let targetId = id;
    const currentUserName = state.currentUser?.name || state.currentUser?.username || 'Team Member';
    const currentUserId = state.currentUser?.id || 'sys';
    const nowIso = new Date().toISOString();

    if (!old && id.startsWith('virtual_')) {
      const driverId = id.replace('virtual_', '');
      const drv = (state.drivers || []).find(d => d.id === driverId);
      const disp = (state.dispatchers || []).find(d => d.id === drv?.assignedDispatcherId);
      targetId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      old = {
        id: targetId,
        driverId: driverId,
        driverName: drv?.name || updated.driverName || 'Driver',
        driverPhone: drv?.phone || updated.driverPhone || '',
        truckNum: drv?.truckNum || updated.truckNum || 'T-100',
        truckType: drv?.truckType || updated.truckType || '26ft Box Truck',
        assignedDispatcherId: drv?.assignedDispatcherId || updated.assignedDispatcherId || '',
        assignedDispatcherName: disp?.name || updated.assignedDispatcherName || 'Unassigned',
        origin: drv?.currentLocation || updated.origin || 'Market Base',
        destinationPreference: updated.destinationPreference || 'Anywhere / Open',
        emptyLocation: drv?.currentLocation || updated.emptyLocation || 'Available Now',
        emptyDate: updated.emptyDate || nowIso.split('T')[0],
        emptyTime: updated.emptyTime || '08:00 AM',
        routeType: updated.routeType || 'OTR',
        status: updated.status || 'NEEDS_LOAD',
        maxWeight: drv?.maxWeight || updated.maxWeight || 9500,
        maxPallets: drv?.maxPallets || updated.maxPallets || 12,
        notes: drv?.notes || updated.notes || '',
        updatedAt: nowIso,
        companyId: state.currentUser?.companyId || 'DEFAULT_COMPANY',
        createdBy: currentUserId,
        createdByName: currentUserName,
        createdAt: nowIso,
        lastModifiedBy: currentUserId,
        lastModifiedByName: currentUserName,
        lastModifiedAt: nowIso
      };
    }

    if (!old) {
      targetId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      old = {
        id: targetId,
        driverId: updated.driverId || '',
        driverName: updated.driverName || 'Driver',
        truckNum: updated.truckNum || 'T-100',
        truckType: updated.truckType || '26ft Box Truck',
        destinationPreference: updated.destinationPreference || 'Anywhere / Open',
        emptyDate: updated.emptyDate || nowIso.split('T')[0],
        routeType: updated.routeType || 'OTR',
        status: updated.status || 'NEEDS_LOAD',
        updatedAt: nowIso,
        companyId: state.currentUser?.companyId || 'DEFAULT_COMPANY',
        createdBy: currentUserId,
        createdByName: currentUserName,
        createdAt: nowIso,
        lastModifiedBy: currentUserId,
        lastModifiedByName: currentUserName,
        lastModifiedAt: nowIso
      };
    }

    const realId = targetId.startsWith('virtual_') ? `post_${Date.now()}_${Math.random().toString(36).substr(2, 4)}` : targetId;
    const merged: DriverDailyPosting = {
      ...old,
      ...updated,
      id: realId,
      updatedAt: nowIso,
      companyId: state.currentUser?.companyId || 'DEFAULT_COMPANY',
      lastModifiedBy: currentUserId,
      lastModifiedByName: currentUserName,
      lastModifiedAt: nowIso
    };

    setState(prev => ({
      ...prev,
      driverPostings: [
        merged,
        ...(prev.driverPostings || []).filter(p => p.id !== id && p.id !== realId && p.driverId !== merged.driverId)
      ]
    }));

    await syncToFirestore('driverPostings', realId, merged);
  };

  const deleteDriverPosting = async (id: string) => {
    let driverIdToRemove = '';
    if (id.startsWith('virtual_')) {
      driverIdToRemove = id.replace('virtual_', '');
    } else {
      const match = (state.driverPostings || []).find(p => p.id === id);
      if (match) driverIdToRemove = match.driverId;
    }

    setState(prev => ({
      ...prev,
      driverPostings: (prev.driverPostings || []).filter(p => p.id !== id && (!driverIdToRemove || p.driverId !== driverIdToRemove))
    }));

    if (!id.startsWith('virtual_')) {
      await removeFromFirestore('driverPostings', id);
    }
  };

  const quickSetPostingStatus = async (id: string, status: DriverPostingStatus, currentLoadNum?: string) => {
    let old = (state.driverPostings || []).find(p => p.id === id);
    let targetId = id;

    if (!old && id.startsWith('virtual_')) {
      const driverId = id.replace('virtual_', '');
      const drv = (state.drivers || []).find(d => d.id === driverId);
      const disp = (state.dispatchers || []).find(d => d.id === drv?.assignedDispatcherId);
      targetId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      old = {
        id: targetId,
        driverId: driverId,
        driverName: drv?.name || 'Driver',
        driverPhone: drv?.phone || '',
        truckNum: drv?.truckNum || 'T-100',
        truckType: drv?.truckType || '26ft Box Truck',
        assignedDispatcherId: drv?.assignedDispatcherId || '',
        assignedDispatcherName: disp?.name || 'Unassigned',
        origin: drv?.currentLocation || 'Market Base',
        destinationPreference: 'Anywhere / Open',
        emptyLocation: drv?.currentLocation || 'Available Now',
        emptyDate: new Date().toISOString().split('T')[0],
        emptyTime: '08:00 AM',
        routeType: 'OTR',
        status: status,
        maxWeight: drv?.maxWeight || 9500,
        maxPallets: drv?.maxPallets || 12,
        notes: drv?.notes || '',
        updatedAt: new Date().toISOString(),
        companyId: state.currentUser?.companyId || 'DEFAULT_COMPANY'
      };
    }

    if (!old) return;

    const realId = old.id.startsWith('virtual_') ? `post_${Date.now()}_${Math.random().toString(36).substr(2, 4)}` : old.id;
    const merged: DriverDailyPosting = {
      ...old,
      id: realId,
      status,
      currentLoadNum: status === 'BOOKED' ? (currentLoadNum || old.currentLoadNum || 'Assigned') : (status === 'NEEDS_LOAD' ? undefined : old.currentLoadNum),
      updatedAt: new Date().toISOString(),
      companyId: state.currentUser?.companyId || 'DEFAULT_COMPANY'
    };

    setState(prev => ({
      ...prev,
      driverPostings: [
        merged,
        ...(prev.driverPostings || []).filter(p => p.id !== id && p.id !== realId && p.driverId !== merged.driverId)
      ]
    }));

    await syncToFirestore('driverPostings', realId, merged);
  };

  // Backup, Snapshots, and Restore Engine
  const [snapshots, setSnapshots] = useState<DataSnapshot[]>(() => getLocalSnapshots());

  const createSnapshot = (label?: string): DataSnapshot => {
    const snapLabel = label || `Snapshot - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const snap = saveSnapshotToStorage(snapLabel, state);
    setSnapshots(getLocalSnapshots());
    return snap;
  };

  const deleteSnapshot = (snapshotId: string) => {
    const existing = getLocalSnapshots().filter(s => s.id !== snapshotId);
    try {
      localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(existing));
    } catch (e) {
      console.warn("Could not delete snapshot from local storage", e);
    }
    setSnapshots(existing);
  };

  const restoreSnapshot = async (snapshotId: string): Promise<{ success: boolean; error?: string }> => {
    const existing = getLocalSnapshots();
    const match = existing.find(s => s.id === snapshotId);
    if (!match) return { success: false, error: 'Target snapshot not found in local history.' };

    // Auto-create a rollback safety snapshot of current state before restoring
    saveSnapshotToStorage(`Pre-Rollback Backup (${new Date().toLocaleTimeString()})`, state);

    return importBackupJSON(JSON.stringify(match.data));
  };

  const exportBackupJSON = (): string => {
    return JSON.stringify(state, null, 2);
  };

  const importBackupJSON = async (jsonString: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.drivers || !parsed.dispatchers || !parsed.loads) {
        return { success: false, error: 'Invalid backup structure. Missing drivers, dispatchers, or loads collections.' };
      }

      const verifiedState: SystemState = {
        users: parsed.users || INITIAL_USERS,
        dispatchers: parsed.dispatchers || [],
        drivers: parsed.drivers || [],
        carriers: parsed.carriers || INITIAL_CARRIERS,
        loads: parsed.loads || [],
        attendance: parsed.attendance || [],
        leads: parsed.leads || INITIAL_LEADS,
        hrProfiles: parsed.hrProfiles || [],
        currentUser: state.currentUser || parsed.currentUser || null,
        currentClockRecord: state.currentClockRecord || parsed.currentClockRecord || null,
        factoringRatePercent: parsed.factoringRatePercent !== undefined ? parsed.factoringRatePercent : 3.25,
        messages: parsed.messages || [],
        companySettings: parsed.companySettings || DEFAULT_COMPANY_SETTINGS,
        driverSettlements: parsed.driverSettlements || [],
        invoices: parsed.invoices || [],
        broadcasts: parsed.broadcasts || [],
        driverAdvances: parsed.driverAdvances || INITIAL_ADVANCES,
        financialTransactions: parsed.financialTransactions || INITIAL_TRANSACTIONS,
        pendingDriverPayments: parsed.pendingDriverPayments || INITIAL_PENDING_PAYMENTS
      };

      setState(verifiedState);

      // Take a safety snapshot of the imported state
      saveSnapshotToStorage(`Restored / Imported Data Snapshot (${new Date().toLocaleTimeString()})`, verifiedState);
      setSnapshots(getLocalSnapshots());

      // Write back all collections to Firestore so all connected devices sync instantaneously
      verifiedState.users.forEach(async u => await syncToFirestore('users', u.id, u));
      verifiedState.dispatchers.forEach(async d => await syncToFirestore('dispatchers', d.id, d));
      verifiedState.drivers.forEach(async d => await syncToFirestore('drivers', d.id, d));
      verifiedState.carriers.forEach(async c => await syncToFirestore('carriers', c.id, c));
      verifiedState.loads.forEach(async l => await syncToFirestore('loads', l.id, l));
      verifiedState.attendance.forEach(async a => await syncToFirestore('attendance', a.id, a));
      verifiedState.leads.forEach(async l => await syncToFirestore('leads', l.id, l));
      (verifiedState.driverAdvances || []).forEach(async adv => await syncToFirestore('driverAdvances', adv.id, adv));
      (verifiedState.financialTransactions || []).forEach(async tx => await syncToFirestore('financialTransactions', tx.id, tx));
      (verifiedState.pendingDriverPayments || []).forEach(async p => await syncToFirestore('pendingDriverPayments', p.id, p));
      (verifiedState.driverSettlements || []).forEach(async s => await syncToFirestore('driverSettlements', s.id, s));
      (verifiedState.invoices || []).forEach(async inv => await syncToFirestore('invoices', inv.id, inv));
      (verifiedState.hrProfiles || []).forEach(async hr => await syncToFirestore('hrProfiles', hr.id, hr));

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Malformed backup file.' };
    }
  };

  const resetToFactoryDefaults = async () => {
    // Preserve current state in snapshot before factory reset
    saveSnapshotToStorage(`Pre-Factory Reset Backup (${new Date().toLocaleTimeString()})`, state);

    const verifiedState: SystemState = {
      users: INITIAL_USERS,
      dispatchers: INITIAL_DISPATCHERS,
      drivers: INITIAL_DRIVERS,
      carriers: INITIAL_CARRIERS,
      loads: INITIAL_LOADS,
      attendance: INITIAL_ATTENDANCE,
      leads: INITIAL_LEADS,
      hrProfiles: [],
      currentUser: state.currentUser,
      currentClockRecord: state.currentClockRecord,
      factoringRatePercent: 3.25,
      messages: [],
      companySettings: DEFAULT_COMPANY_SETTINGS,
      driverSettlements: [],
      invoices: INITIAL_INVOICES,
      broadcasts: [],
      driverAdvances: INITIAL_ADVANCES,
      financialTransactions: INITIAL_TRANSACTIONS,
      pendingDriverPayments: INITIAL_PENDING_PAYMENTS
    };
    setState(verifiedState);

    // Sync reset to Firestore
    try {
      state.users.forEach(async (u) => await removeFromFirestore('users', u.id));
      state.dispatchers.forEach(async (d) => await removeFromFirestore('dispatchers', d.id));
      state.drivers.forEach(async (dr) => await removeFromFirestore('drivers', dr.id));
      state.carriers.forEach(async (c) => await removeFromFirestore('carriers', c.id));
      state.loads.forEach(async (l) => await removeFromFirestore('loads', l.id));
      state.attendance.forEach(async (a) => await removeFromFirestore('attendance', a.id));
      state.leads.forEach(async (ld) => await removeFromFirestore('leads', ld.id));

      INITIAL_USERS.forEach(async (u) => await syncToFirestore('users', u.id, u));
      INITIAL_DISPATCHERS.forEach(async (d) => await syncToFirestore('dispatchers', d.id, d));
      INITIAL_DRIVERS.forEach(async (dr) => await syncToFirestore('drivers', dr.id, dr));
      INITIAL_CARRIERS.forEach(async (c) => await syncToFirestore('carriers', c.id, c));
      INITIAL_LOADS.forEach(async (l) => await syncToFirestore('loads', l.id, l));
      INITIAL_ATTENDANCE.forEach(async (a) => await syncToFirestore('attendance', a.id, a));
      INITIAL_LEADS.forEach(async (ld) => await syncToFirestore('leads', ld.id, ld));
    } catch (e) {
      console.warn("Could not synchronize factory reset with external Firestore.", e);
    }

    setSnapshots(getLocalSnapshots());
  };

  // Chat & Photo updates
  const sendMessage = async (content: string, replyTo?: { id: string; senderName: string; content: string }) => {
    if (!state.currentUser) return;
    const msg: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: state.currentUser.id,
      senderName: state.currentUser.name,
      senderRole: state.currentUser.role,
      senderPhoto: state.currentUser.profilePhoto,
      content,
      createdAt: new Date().toISOString(),
      companyId: state.currentUser.companyId || 'DEFAULT_COMPANY',
      reactions: {},
      replyTo: replyTo || undefined
    };
    setState(prev => ({
      ...prev,
      messages: [...(prev.messages || []), msg]
    }));
    await syncToFirestore('messages', msg.id, msg);
  };

  const reactToMessage = async (messageId: string, emoji: string) => {
    if (!state.currentUser) return;
    const userName = state.currentUser.name;

    let updatedMsgToSync: ChatMessage | null = null;

    setState(prev => {
      const updatedMessages = (prev.messages || []).map(m => {
        if (m.id === messageId) {
          const currentReactions: Record<string, string[]> = { ...(m.reactions || {}) };
          const usersForEmoji = currentReactions[emoji] ? [...currentReactions[emoji]] : [];
          
          const userIdx = usersForEmoji.indexOf(userName);
          if (userIdx > -1) {
            // Remove user reaction if already clicked (toggle off)
            usersForEmoji.splice(userIdx, 1);
          } else {
            // Add user reaction
            usersForEmoji.push(userName);
          }

          if (usersForEmoji.length === 0) {
            delete currentReactions[emoji];
          } else {
            currentReactions[emoji] = usersForEmoji;
          }

          const updated = { ...m, reactions: currentReactions };
          updatedMsgToSync = updated;
          return updated;
        }
        return m;
      });

      return {
        ...prev,
        messages: updatedMessages
      };
    });

    if (updatedMsgToSync) {
      await syncToFirestore('messages', messageId, updatedMsgToSync);
    }
  };

  const updateProfilePhoto = async (userId: string, photoBase64: string) => {
    const user = state.users.find(u => u.id === userId);
    if (!user) return;
    const updatedUser = { ...user, profilePhoto: photoBase64 };

    let updatedDispToSync: Dispatcher | null = null;

    setState(prev => {
      const matchDisp = prev.dispatchers.find(d => d.username === user.username || (user.dispatcherId && d.id === user.dispatcherId));
      let updatedDispatchers = prev.dispatchers;
      if (matchDisp) {
        const updatedDisp = { ...matchDisp, profilePhoto: photoBase64 };
        updatedDispToSync = updatedDisp;
        updatedDispatchers = prev.dispatchers.map(d => d.id === matchDisp.id ? updatedDisp : d);
      }

      return {
        ...prev,
        users: prev.users.map(u => u.id === userId ? updatedUser : u),
        dispatchers: updatedDispatchers,
        currentUser: prev.currentUser?.id === userId ? updatedUser : prev.currentUser
      };
    });

    await syncToFirestore('users', userId, updatedUser);
    if (updatedDispToSync) {
      await syncToFirestore('dispatchers', (updatedDispToSync as Dispatcher).id, updatedDispToSync);
    }
  };

  const addSalesAgent = async (user: Omit<User, 'id'>) => {
    const id = `u_${Date.now()}`;
    const defaultPerms: SeatPermissions = user.permissions || (
      user.role === 'ADMIN' || user.role === 'MANAGER'
        ? {
            canAccessDashboard: true,
            canAccessInvoicing: true,
            canAccessDriverPayout: true,
            canAccessTransactionVault: true,
            canAccessCarrierCRM: true,
            canAccessCorporateReports: true,
            canAccessDailyAssignment: true,
            canAccessDriverIndex: true,
            onlyAssignedDrivers: false,
            canAccessLoadBoard: true,
            onlyAssignedLoads: false,
            canAccessTimeClock: true,
            canAccessTools: true,
            canAccessTeamChat: true,
            canAccessSalesCRM: true,
            canAccessTeamSeats: true,
            isFullAccess: true
          }
        : {
            canAccessDashboard: true,
            canAccessInvoicing: false,
            canAccessDriverPayout: false,
            canAccessTransactionVault: false,
            canAccessCarrierCRM: false,
            canAccessCorporateReports: false,
            canAccessDailyAssignment: true,
            canAccessDriverIndex: true,
            onlyAssignedDrivers: true,
            canAccessLoadBoard: true,
            onlyAssignedLoads: true,
            canAccessTimeClock: true,
            canAccessTools: true,
            canAccessTeamChat: true,
            canAccessSalesCRM: true,
            canAccessTeamSeats: false,
            isFullAccess: false
          }
    );

    const newUser: User = {
      ...user,
      id,
      companyId: state.currentUser?.companyId || 'DEFAULT_COMPANY',
      permissions: defaultPerms
    };

    setState(prev => {
      const nextUsers = [...prev.users, newUser];
      savePermanentUsers(nextUsers);
      return {
        ...prev,
        users: nextUsers
      };
    });

    await syncToFirestore('users', id, newUser);
  };

  const editUser = async (id: string, updated: Partial<User>) => {
    if (state.currentUser?.role !== 'ADMIN' && state.currentUser?.id !== id) {
      alert("⚠️ Access Denied: Team accounts and login credentials are locked. Only an Administrator can modify team accounts.");
      return;
    }

    const userObj = state.users.find(u => u.id === id);
    if (!userObj) return;

    const merged = { ...userObj, ...updated };
    let updatedDispToSync: Dispatcher | null = null;

    setState(prev => {
      const matchDisp = prev.dispatchers.find(d => d.username === userObj.username || (userObj.dispatcherId && d.id === userObj.dispatcherId));
      let updatedDispatchers = prev.dispatchers;
      if (matchDisp) {
        const mergedDisp: Dispatcher = {
          ...matchDisp,
          name: merged.name,
          username: merged.username,
          phone: merged.phone || matchDisp.phone,
          password: merged.password || matchDisp.password,
          baseSalaryPKR: merged.baseSalaryPKR !== undefined ? merged.baseSalaryPKR : matchDisp.baseSalaryPKR,
          targetUSD: merged.targetUSD !== undefined ? merged.targetUSD : matchDisp.targetUSD,
          bonusPercent: merged.bonusPercent !== undefined ? merged.bonusPercent : matchDisp.bonusPercent,
        };
        updatedDispToSync = mergedDisp;
        updatedDispatchers = prev.dispatchers.map(d => d.id === matchDisp.id ? mergedDisp : d);
      }

      // Two-way sync with HR profile
      let updatedHRProfiles = prev.hrProfiles;
      const matchHR = prev.hrProfiles.find(h => h.userId === id || h.id === id || h.name.toLowerCase() === userObj.name.toLowerCase());
      if (matchHR) {
        const grossVal = merged.baseSalaryPKR !== undefined ? merged.baseSalaryPKR : (matchHR.salaryStructure?.grossSalaryPKR ?? matchHR.baseSalaryPKR ?? 0);
        const bonusVal = merged.bonusPercent !== undefined ? merged.bonusPercent : (matchHR.salaryStructure?.bonusPercent ?? matchHR.bonusPercent ?? 0);
        const targetVal = merged.targetUSD !== undefined ? merged.targetUSD : (matchHR.salaryStructure?.targetUSD ?? matchHR.targetUSD);
        const mergedHR: HRStaffProfile = {
          ...matchHR,
          name: merged.name || matchHR.name,
          phone: merged.phone || matchHR.phone,
          baseSalaryPKR: grossVal,
          bonusPercent: bonusVal,
          targetUSD: targetVal,
          salaryStructure: {
            grossSalaryPKR: grossVal,
            bonusPercent: bonusVal,
            targetUSD: targetVal,
            allowancesPKR: matchHR.salaryStructure?.allowancesPKR || 0,
            notes: matchHR.salaryStructure?.notes
          }
        };
        updatedHRProfiles = prev.hrProfiles.map(h => h.id === matchHR.id ? mergedHR : h);
        savePermanentHR(updatedHRProfiles);
        syncToFirestore('hrProfiles', matchHR.id, mergedHR);
      }

      const nextUsers = prev.users.map(u => (u.id === id ? merged : u));
      savePermanentUsers(nextUsers);
      savePermanentDispatchers(updatedDispatchers);

      return {
        ...prev,
        users: nextUsers,
        dispatchers: updatedDispatchers,
        hrProfiles: updatedHRProfiles,
        currentUser: prev.currentUser?.id === id ? { ...prev.currentUser, ...merged } : prev.currentUser
      };
    });

    await syncToFirestore('users', id, merged);
    if (updatedDispToSync) {
      await syncToFirestore('dispatchers', (updatedDispToSync as Dispatcher).id, updatedDispToSync);
    }
  };

  const removeTeamMember = async (userId: string) => {
    if (state.currentUser?.role !== 'ADMIN') {
      alert("⚠️ Access Denied: Team seats and accounts are locked. Only an Administrator can remove team members.");
      return;
    }

    const user = state.users.find(u => u.id === userId);
    if (!user) return;

    const disp = state.dispatchers.find(d => d.username === user.username);
    if (disp) {
      await deleteDispatcher(disp.id);
    } else {
      setState(prev => {
        const nextUsers = prev.users.filter(u => u.id !== userId);
        savePermanentUsers(nextUsers);
        return {
          ...prev,
          users: nextUsers
        };
      });
      await removeFromFirestore('users', userId);
    }
  };

  const sendBroadcast = async (title: string, message: string, type: 'INFO' | 'WARNING' | 'ALERT') => {
    const compId = state.currentUser?.companyId || 'DEFAULT_COMPANY';
    const sender = state.currentUser?.name || 'Administrator';
    const newBroadcast: CompanyBroadcast = {
      id: `bc_${Date.now()}`,
      title,
      message,
      senderName: sender,
      createdAt: new Date().toISOString(),
      type,
      companyId: compId,
      active: true
    };

    setState(prev => ({
      ...prev,
      broadcasts: [newBroadcast, ...prev.broadcasts]
    }));

    await syncToFirestore('broadcasts', newBroadcast.id, newBroadcast);
  };

  const dismissBroadcast = async (broadcastId: string) => {
    setState(prev => ({
      ...prev,
      broadcasts: prev.broadcasts.filter(b => b.id !== broadcastId)
    }));
    await removeFromFirestore('broadcasts', broadcastId);
  };

  const addHRProfile = async (profile: Omit<HRStaffProfile, 'id'> & { id?: string }) => {
    const newProfile: HRStaffProfile = {
      ...profile,
      id: profile.id || `hr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      companyId: state.currentUser?.companyId || 'DEFAULT_COMPANY'
    };

    // If salary is defined, sync with team seats / user profile
    const grossPKR = newProfile.salaryStructure?.grossSalaryPKR ?? newProfile.baseSalaryPKR;
    const bonusPct = newProfile.salaryStructure?.bonusPercent ?? newProfile.bonusPercent;
    const targetUSD = newProfile.salaryStructure?.targetUSD ?? newProfile.targetUSD;

    setState(prev => {
      const nextHR = [...prev.hrProfiles, newProfile];
      savePermanentHR(nextHR);

      let nextUsers = prev.users;
      let nextDispatchers = prev.dispatchers;

      const matchUser = prev.users.find(u => (newProfile.userId && u.id === newProfile.userId) || u.id === newProfile.id || u.name.toLowerCase() === newProfile.name.toLowerCase());
      if (matchUser && (grossPKR !== undefined || bonusPct !== undefined || targetUSD !== undefined || newProfile.phone)) {
        const updatedUser: User = {
          ...matchUser,
          phone: newProfile.phone || matchUser.phone,
          baseSalaryPKR: grossPKR !== undefined ? grossPKR : matchUser.baseSalaryPKR,
          bonusPercent: bonusPct !== undefined ? bonusPct : matchUser.bonusPercent,
          targetUSD: targetUSD !== undefined ? targetUSD : matchUser.targetUSD
        };
        nextUsers = prev.users.map(u => u.id === matchUser.id ? updatedUser : u);
        savePermanentUsers(nextUsers);
        syncToFirestore('users', matchUser.id, updatedUser);

        const matchDisp = prev.dispatchers.find(d => d.username === matchUser.username || (matchUser.dispatcherId && d.id === matchUser.dispatcherId));
        if (matchDisp) {
          const updatedDisp: Dispatcher = {
            ...matchDisp,
            phone: newProfile.phone || matchDisp.phone,
            baseSalaryPKR: grossPKR !== undefined ? grossPKR : matchDisp.baseSalaryPKR,
            bonusPercent: bonusPct !== undefined ? bonusPct : matchDisp.bonusPercent,
            targetUSD: targetUSD !== undefined ? targetUSD : matchDisp.targetUSD
          };
          nextDispatchers = prev.dispatchers.map(d => d.id === matchDisp.id ? updatedDisp : d);
          savePermanentDispatchers(nextDispatchers);
          syncToFirestore('dispatchers', matchDisp.id, updatedDisp);
        }
      }

      return {
        ...prev,
        hrProfiles: nextHR,
        users: nextUsers,
        dispatchers: nextDispatchers
      };
    });

    await syncToFirestore('hrProfiles', newProfile.id, newProfile);
  };

  const editHRProfile = async (id: string, updated: Partial<HRStaffProfile>) => {
    const oldProfile = state.hrProfiles.find(p => p.id === id);
    const merged = oldProfile ? { ...oldProfile, ...updated } : { id, ...updated, companyId: state.currentUser?.companyId || 'DEFAULT_COMPANY' } as HRStaffProfile;

    const grossPKR = merged.salaryStructure?.grossSalaryPKR ?? merged.baseSalaryPKR;
    const bonusPct = merged.salaryStructure?.bonusPercent ?? merged.bonusPercent;
    const targetUSD = merged.salaryStructure?.targetUSD ?? merged.targetUSD;

    setState(prev => {
      const nextHR = prev.hrProfiles.map(p => (p.id === id ? merged : p));
      savePermanentHR(nextHR);

      let nextUsers = prev.users;
      let nextDispatchers = prev.dispatchers;

      const matchUser = prev.users.find(u => (merged.userId && u.id === merged.userId) || u.id === merged.id || u.name.toLowerCase() === merged.name.toLowerCase());
      if (matchUser && (grossPKR !== undefined || bonusPct !== undefined || targetUSD !== undefined || merged.phone)) {
        const updatedUser: User = {
          ...matchUser,
          phone: merged.phone || matchUser.phone,
          baseSalaryPKR: grossPKR !== undefined ? grossPKR : matchUser.baseSalaryPKR,
          bonusPercent: bonusPct !== undefined ? bonusPct : matchUser.bonusPercent,
          targetUSD: targetUSD !== undefined ? targetUSD : matchUser.targetUSD
        };
        nextUsers = prev.users.map(u => u.id === matchUser.id ? updatedUser : u);
        savePermanentUsers(nextUsers);
        syncToFirestore('users', matchUser.id, updatedUser);

        const matchDisp = prev.dispatchers.find(d => d.username === matchUser.username || (matchUser.dispatcherId && d.id === matchUser.dispatcherId));
        if (matchDisp) {
          const updatedDisp: Dispatcher = {
            ...matchDisp,
            phone: merged.phone || matchDisp.phone,
            baseSalaryPKR: grossPKR !== undefined ? grossPKR : matchDisp.baseSalaryPKR,
            bonusPercent: bonusPct !== undefined ? bonusPct : matchDisp.bonusPercent,
            targetUSD: targetUSD !== undefined ? targetUSD : matchDisp.targetUSD
          };
          nextDispatchers = prev.dispatchers.map(d => d.id === matchDisp.id ? updatedDisp : d);
          savePermanentDispatchers(nextDispatchers);
          syncToFirestore('dispatchers', matchDisp.id, updatedDisp);
        }
      }

      return {
        ...prev,
        hrProfiles: nextHR,
        users: nextUsers,
        dispatchers: nextDispatchers
      };
    });

    await syncToFirestore('hrProfiles', id, merged);
  };

  const deleteHRProfile = async (id: string) => {
    setState(prev => {
      const nextHR = prev.hrProfiles.filter(p => p.id !== id);
      savePermanentHR(nextHR);
      return {
        ...prev,
        hrProfiles: nextHR
      };
    });

    await removeFromFirestore('hrProfiles', id);
  };

  const addLeaveRequest = async (request: Omit<LeaveRequest, 'id' | 'appliedAt'>) => {
    const hrProfile = state.hrProfiles.find(h => h.id === request.employeeId || h.userId === request.employeeId || h.name.toLowerCase() === request.employeeName.toLowerCase());
    const joiningDate = request.joiningDateAtApplication || hrProfile?.joiningDate || '2025-01-01';
    
    // Check 1-year tenure protocol (365 days from joining date)
    const joinMs = new Date(joiningDate).getTime();
    const nowMs = Date.now();
    const tenureDays = isNaN(joinMs) ? 0 : Math.max(0, Math.floor((nowMs - joinMs) / (1000 * 60 * 60 * 24)));
    const isEligibleTenure = tenureDays >= 365;

    const newRequest: LeaveRequest = {
      ...request,
      id: `leave_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      appliedAt: new Date().toISOString(),
      joiningDateAtApplication: joiningDate,
      tenureDays,
      isEligibleTenure,
      companyId: state.currentUser?.companyId || 'DEFAULT_COMPANY'
    };

    setState(prev => {
      const nextLeaves = [newRequest, ...(prev.leaveRequests || [])];
      savePermanentLeaves(nextLeaves);
      return {
        ...prev,
        leaveRequests: nextLeaves
      };
    });

    await syncToFirestore('leaveRequests', newRequest.id, newRequest);
  };

  const updateLeaveRequest = async (id: string, updated: Partial<LeaveRequest>) => {
    setState(prev => {
      const nextLeaves = (prev.leaveRequests || []).map(l => l.id === id ? { ...l, ...updated } : l);
      savePermanentLeaves(nextLeaves);
      return {
        ...prev,
        leaveRequests: nextLeaves
      };
    });

    const target = (state.leaveRequests || []).find(l => l.id === id);
    if (target) {
      await syncToFirestore('leaveRequests', id, { ...target, ...updated });
    }
  };

  const deleteLeaveRequest = async (id: string) => {
    setState(prev => {
      const nextLeaves = (prev.leaveRequests || []).filter(l => l.id !== id);
      savePermanentLeaves(nextLeaves);
      return {
        ...prev,
        leaveRequests: nextLeaves
      };
    });

    await removeFromFirestore('leaveRequests', id);
  };

  const addSalarySlip = async (slip: Omit<SalarySlip, 'id' | 'createdAt'>) => {
    const cleanMonth = slip.month.replace(/[^0-9]/g, '');
    const randCode = Math.floor(100 + Math.random() * 900);
    const slipNumber = slip.slipNumber || `SLIP-${cleanMonth || '2026'}-${randCode}`;

    const newSlip: SalarySlip = {
      ...slip,
      id: `slip_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      slipNumber,
      createdAt: new Date().toISOString(),
      companyId: state.currentUser?.companyId || 'DEFAULT_COMPANY'
    };

    setState(prev => {
      const nextSlips = [newSlip, ...(prev.salarySlips || [])];
      savePermanentSalarySlips(nextSlips);
      return {
        ...prev,
        salarySlips: nextSlips
      };
    });

    await syncToFirestore('salarySlips', newSlip.id, newSlip);
  };

  const updateSalarySlip = async (id: string, updated: Partial<SalarySlip>) => {
    setState(prev => {
      const nextSlips = (prev.salarySlips || []).map(s => s.id === id ? { ...s, ...updated } : s);
      savePermanentSalarySlips(nextSlips);
      return {
        ...prev,
        salarySlips: nextSlips
      };
    });

    const target = (state.salarySlips || []).find(s => s.id === id);
    if (target) {
      await syncToFirestore('salarySlips', id, { ...target, ...updated });
    }
  };

  const deleteSalarySlip = async (id: string) => {
    setState(prev => {
      const nextSlips = (prev.salarySlips || []).filter(s => s.id !== id);
      savePermanentSalarySlips(nextSlips);
      return {
        ...prev,
        salarySlips: nextSlips
      };
    });

    await removeFromFirestore('salarySlips', id);
  };

  const addDriverAdvance = async (adv: Omit<DriverAdvance, 'id'>) => {
    const id = `ADV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newAdv: DriverAdvance = {
      ...adv,
      id,
      companyId: state.currentUser?.companyId || 'DEFAULT_COMPANY'
    };

    let targetLoadId = newAdv.loadId;
    if (!targetLoadId && newAdv.loadNum) {
      const matchLoad = state.loads.find(l => l.loadNum.trim().toLowerCase() === newAdv.loadNum?.trim().toLowerCase());
      if (matchLoad) targetLoadId = matchLoad.id;
    }

    setState(prev => {
      const currentAdvances = [...(prev.driverAdvances || []), newAdv];
      let updatedLoads = prev.loads;

      if (targetLoadId) {
        const totalAdv = currentAdvances
          .filter(a => a.loadId === targetLoadId || (a.loadNum && prev.loads.find(l => l.id === targetLoadId)?.loadNum === a.loadNum))
          .reduce((sum, a) => sum + Number(a.amount || 0), 0);

        updatedLoads = prev.loads.map(l => l.id === targetLoadId ? { ...l, cashAdvance: totalAdv } : l);
      }

      return {
        ...prev,
        driverAdvances: currentAdvances,
        loads: updatedLoads
      };
    });

    await syncToFirestore('driverAdvances', id, newAdv);

    if (targetLoadId) {
      const targetLoad = state.loads.find(l => l.id === targetLoadId);
      if (targetLoad) {
        const allAdv = [...(state.driverAdvances || []), newAdv];
        const totalAdv = allAdv
          .filter(a => a.loadId === targetLoadId || (a.loadNum && targetLoad.loadNum === a.loadNum))
          .reduce((sum, a) => sum + Number(a.amount || 0), 0);

        await syncToFirestore('loads', targetLoadId, { ...targetLoad, cashAdvance: totalAdv });
      }
    }
  };

  const editDriverAdvance = async (id: string, updated: Partial<DriverAdvance>) => {
    const oldAdv = state.driverAdvances?.find(a => a.id === id);
    if (!oldAdv) return;
    const merged = { ...oldAdv, ...updated };

    setState(prev => {
      const updatedAdvances = (prev.driverAdvances || []).map(a => a.id === id ? merged : a);
      let updatedLoads = prev.loads;

      if (merged.loadId) {
        const totalAdv = updatedAdvances
          .filter(a => a.loadId === merged.loadId)
          .reduce((sum, a) => sum + Number(a.amount || 0), 0);

        updatedLoads = prev.loads.map(l => l.id === merged.loadId ? { ...l, cashAdvance: totalAdv } : l);
      }

      return {
        ...prev,
        driverAdvances: updatedAdvances,
        loads: updatedLoads
      };
    });

    await syncToFirestore('driverAdvances', id, merged);

    if (merged.loadId) {
      const targetLoad = state.loads.find(l => l.id === merged.loadId);
      if (targetLoad) {
        const allAdv = (state.driverAdvances || []).map(a => a.id === id ? merged : a);
        const totalAdv = allAdv
          .filter(a => a.loadId === merged.loadId)
          .reduce((sum, a) => sum + Number(a.amount || 0), 0);

        await syncToFirestore('loads', merged.loadId, { ...targetLoad, cashAdvance: totalAdv });
      }
    }
  };

  const deleteDriverAdvance = async (id: string) => {
    if (state.currentUser?.role !== 'ADMIN') {
      alert("⚠️ Access Denied: Advances are locked and protected. Only an Administrator can remove advance records.");
      return;
    }

    const oldAdv = state.driverAdvances?.find(a => a.id === id);

    setState(prev => {
      const updatedAdvances = (prev.driverAdvances || []).filter(a => a.id !== id);
      savePermanentAdvances(updatedAdvances);
      let updatedLoads = prev.loads;

      if (oldAdv?.loadId) {
        const totalAdv = updatedAdvances
          .filter(a => a.loadId === oldAdv.loadId)
          .reduce((sum, a) => sum + Number(a.amount || 0), 0);

        updatedLoads = prev.loads.map(l => l.id === oldAdv.loadId ? { ...l, cashAdvance: totalAdv } : l);
        savePermanentLoads(updatedLoads);
      }

      return {
        ...prev,
        driverAdvances: updatedAdvances,
        loads: updatedLoads
      };
    });

    await removeFromFirestore('driverAdvances', id);

    if (oldAdv?.loadId) {
      const targetLoad = state.loads.find(l => l.id === oldAdv.loadId);
      if (targetLoad) {
        const remainingAdv = (state.driverAdvances || []).filter(a => a.id !== id);
        const totalAdv = remainingAdv
          .filter(a => a.loadId === oldAdv.loadId)
          .reduce((sum, a) => sum + Number(a.amount || 0), 0);

        await syncToFirestore('loads', oldAdv.loadId, { ...targetLoad, cashAdvance: totalAdv });
      }
    }
  };

  const addFinancialTransaction = async (tx: Omit<FinancialTransaction, 'id' | 'transactionNum' | 'createdAt'>) => {
    const id = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const txCount = (state.financialTransactions || []).length + 1001;
    const transactionNum = `TXN-${txCount}`;
    const newTx: FinancialTransaction = {
      ...tx,
      id,
      transactionNum,
      createdAt: new Date().toISOString(),
      companyId: state.currentUser?.companyId || 'DEFAULT_COMPANY'
    };

    setState(prev => ({
      ...prev,
      financialTransactions: [newTx, ...(prev.financialTransactions || [])]
    }));

    await syncToFirestore('financialTransactions', id, newTx);
  };

  const editFinancialTransaction = async (id: string, updated: Partial<FinancialTransaction>) => {
    const oldTx = state.financialTransactions?.find(t => t.id === id);
    if (!oldTx) return;
    const merged = { ...oldTx, ...updated };

    setState(prev => ({
      ...prev,
      financialTransactions: (prev.financialTransactions || []).map(t => t.id === id ? merged : t)
    }));

    await syncToFirestore('financialTransactions', id, merged);
  };

  const deleteFinancialTransaction = async (id: string) => {
    if (state.currentUser?.role !== 'ADMIN') {
      alert("⚠️ Access Denied: Financial transactions are locked and protected. Only an Administrator can remove transaction records.");
      return;
    }

    setState(prev => {
      const nextTxns = (prev.financialTransactions || []).filter(t => t.id !== id);
      savePermanentTransactions(nextTxns);
      return {
        ...prev,
        financialTransactions: nextTxns
      };
    });

    await removeFromFirestore('financialTransactions', id);
  };

  const addPendingDriverPayment = async (payment: Omit<PendingDriverPayment, 'id' | 'paymentNum' | 'createdAt'>) => {
    const id = 'pend_' + Date.now();
    const paymentNum = 'PEND-' + Math.floor(1000 + Math.random() * 9000);
    const newPayment: PendingDriverPayment = {
      ...payment,
      id,
      paymentNum,
      createdAt: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      pendingDriverPayments: [newPayment, ...(prev.pendingDriverPayments || [])]
    }));

    await syncToFirestore('pendingDriverPayments', id, newPayment);
  };

  const editPendingDriverPayment = async (id: string, updated: Partial<PendingDriverPayment>) => {
    const old = state.pendingDriverPayments?.find(p => p.id === id);
    if (!old) return;
    const merged = { ...old, ...updated };

    setState(prev => ({
      ...prev,
      pendingDriverPayments: (prev.pendingDriverPayments || []).map(p => p.id === id ? merged : p)
    }));

    await syncToFirestore('pendingDriverPayments', id, merged);
  };

  const deletePendingDriverPayment = async (id: string) => {
    setState(prev => ({
      ...prev,
      pendingDriverPayments: (prev.pendingDriverPayments || []).filter(p => p.id !== id)
    }));

    await removeFromFirestore('pendingDriverPayments', id);
  };

  const recordPartialPayment = async (pendingId: string, partial: Omit<PartialPaymentEntry, 'id'>) => {
    const target = state.pendingDriverPayments?.find(p => p.id === pendingId);
    if (!target) return;

    const partialId = 'pt_' + Date.now();
    const newPartialEntry: PartialPaymentEntry = {
      ...partial,
      id: partialId
    };

    const updatedHistory = [...(target.partialHistory || []), newPartialEntry];
    const newTotalPaid = updatedHistory.reduce((sum, h) => sum + h.amount, 0);
    const newRemaining = Math.max(0, target.totalDriverPayoutOwed - newTotalPaid);
    const newStatus = newRemaining === 0 ? 'COMPLETED' : 'PARTIAL';

    const updatedPayment: PendingDriverPayment = {
      ...target,
      partialHistory: updatedHistory,
      totalPartialPaid: newTotalPaid,
      remainingBalanceOwed: newRemaining,
      status: newStatus
    };

    // Also record a financial transaction record for ledger
    const newTx: Omit<FinancialTransaction, 'id' | 'createdAt' | 'transactionNum'> = {
      date: partial.date,
      category: 'DRIVER_ADVANCE',
      amount: partial.amount,
      senderName: 'Owner / Company',
      senderType: 'OWNER',
      receiverName: `${target.driverName} (Driver)`,
      receiverRole: 'Driver',
      loadNum: target.loadNums.join(', '),
      paymentMethod: partial.paymentMethod,
      status: 'COMPLETED',
      notes: `Partial payment for Pending #${target.paymentNum}. ${partial.notes || ''}`,
      proofFileName: partial.proofFileName,
      proofFileType: partial.proofFileType,
      proofBase64: partial.proofBase64
    };
    await addFinancialTransaction(newTx);

    if (newStatus === 'COMPLETED') {
      await completePendingPayment(pendingId);
    } else {
      await editPendingDriverPayment(pendingId, updatedPayment);
    }
  };

  const completePendingPayment = async (pendingId: string) => {
    const target = state.pendingDriverPayments?.find(p => p.id === pendingId);
    if (!target) return;

    const completedPayment: PendingDriverPayment = {
      ...target,
      status: 'COMPLETED',
      remainingBalanceOwed: 0
    };
    await editPendingDriverPayment(pendingId, completedPayment);

    const todayStr = new Date().toISOString().split('T')[0];
    const newSettlement: Omit<DriverSettlement, 'id'> = {
      driverId: target.driverId,
      driverName: target.driverName,
      settlementDate: todayStr,
      startDate: todayStr,
      endDate: todayStr,
      grossEarnings: target.totalGrossAmount,
      deductions: target.totalPartialPaid,
      netPayout: target.totalDriverPayoutOwed,
      paymentStatus: 'Paid',
      loadIds: target.loadIds,
      isManual: false,
      payoutRate: target.driverPayoutPercent,
      notes: `Auto-shifted from Pending Payment #${target.paymentNum}. Loads: ${target.loadNums.join(', ')}`
    };
    await addDriverSettlement(newSettlement);
  };

  const updateTrainingScripts = async (scripts: TrainingScriptConfig) => {
    setState(prev => ({ ...prev, trainingScripts: scripts }));
    try {
      await ensureAuth();
      await setDoc(doc(db, 'trainingScripts', 'config'), cleanFirestoreData(scripts));
      return { success: true };
    } catch (e: any) {
      console.warn("Failed to sync training scripts to firestore:", e);
      return { success: false, error: e.message };
    }
  };

  return {
    state,
    syncStatus,
    login,
    logout,
    changePassword,
    addDriver,
    editDriver,
    deleteDriver,
    addDispatcher,
    editDispatcher,
    deleteDispatcher,
    addLoad,
    editLoad,
    deleteLoad,
    clockIn,
    clockOut,
    addCarrier,
    editCarrier,
    deleteCarrier,
    addLead,
    editLead,
    deleteLead,
    addSalesDailyLog,
    editSalesDailyLog,
    deleteSalesDailyLog,
    assignDriverDaily,
    setFactoringRate,
    exportBackupJSON,
    importBackupJSON,
    resetToFactoryDefaults,
    snapshots,
    createSnapshot,
    restoreSnapshot,
    deleteSnapshot,
    sendMessage,
    reactToMessage,
    updateProfilePhoto,
    registerUser,
    addSalesAgent,
    editUser,
    googleSignIn,
    updateCompanySettings,
    addDriverSettlement,
    editDriverSettlement,
    deleteDriverSettlement,
    addInvoice,
    editInvoice,
    deleteInvoice,
    removeTeamMember,
    sendBroadcast,
    dismissBroadcast,
    addHRProfile,
    editHRProfile,
    deleteHRProfile,
    addLeaveRequest,
    updateLeaveRequest,
    deleteLeaveRequest,
    addSalarySlip,
    updateSalarySlip,
    deleteSalarySlip,
    updateClockRecord,
    addDriversBulk,
    addLoadsBulk,
    addCarriersBulk,
    addBroker,
    editBroker,
    deleteBroker,
    addBrokersBulk,
    autoSaveBroker,
    addDriverPosting,
    editDriverPosting,
    deleteDriverPosting,
    quickSetPostingStatus,
    addDriverAdvance,
    editDriverAdvance,
    deleteDriverAdvance,
    addFinancialTransaction,
    editFinancialTransaction,
    deleteFinancialTransaction,
    addPendingDriverPayment,
    editPendingDriverPayment,
    deletePendingDriverPayment,
    recordPartialPayment,
    completePendingPayment,
    updateTrainingScripts
  };
}
