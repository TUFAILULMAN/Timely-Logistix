/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SalesPipelineStatus } from '../../types';

export interface PipelineStageConfig {
  key: SalesPipelineStatus;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  headerGradient: string;
  stepNumber: number;
}

export const CANONICAL_PIPELINE_STAGES: PipelineStageConfig[] = [
  {
    key: 'NEW_LEAD',
    label: 'New Lead',
    shortLabel: 'New',
    description: 'Fresh carrier leads harvested from FMCSA / Boards / Outreach',
    color: 'text-sky-600 dark:text-sky-400',
    bgColor: 'bg-sky-50/60 dark:bg-sky-950/20',
    borderColor: 'border-sky-200 dark:border-sky-800',
    badgeBg: 'bg-sky-100 dark:bg-sky-900/60',
    badgeText: 'text-sky-700 dark:text-sky-300',
    headerGradient: 'from-sky-500 to-blue-600',
    stepNumber: 1
  },
  {
    key: 'CALLED',
    label: 'Called',
    shortLabel: 'Called',
    description: 'Initial phone pitch or outreach call placed to carrier',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50/60 dark:bg-indigo-950/20',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-900/60',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    headerGradient: 'from-indigo-500 to-indigo-600',
    stepNumber: 2
  },
  {
    key: 'INTERESTED',
    label: 'Interested',
    shortLabel: 'Interested',
    description: 'Carrier showed strong interest in dispatch rates & lanes',
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-50/60 dark:bg-violet-950/20',
    borderColor: 'border-violet-200 dark:border-violet-800',
    badgeBg: 'bg-violet-100 dark:bg-violet-900/60',
    badgeText: 'text-violet-700 dark:text-violet-300',
    headerGradient: 'from-violet-500 to-purple-600',
    stepNumber: 3
  },
  {
    key: 'DOCUMENTS_REQUESTED',
    label: 'Documents Requested',
    shortLabel: 'Docs Req',
    description: 'Carrier packet, W-9, and COI checklist sent out',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50/60 dark:bg-amber-950/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/60',
    badgeText: 'text-amber-700 dark:text-amber-300',
    headerGradient: 'from-amber-500 to-orange-600',
    stepNumber: 4
  },
  {
    key: 'DOCUMENTS_RECEIVED',
    label: 'Documents Received',
    shortLabel: 'Docs Recv',
    description: 'W-9, COI, NOA, and authority certs received & verified',
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50/60 dark:bg-teal-950/20',
    borderColor: 'border-teal-200 dark:border-teal-800',
    badgeBg: 'bg-teal-100 dark:bg-teal-900/60',
    badgeText: 'text-teal-700 dark:text-teal-300',
    headerGradient: 'from-teal-500 to-emerald-600',
    stepNumber: 5
  },
  {
    key: 'ONBOARDING',
    label: 'Onboarding',
    shortLabel: 'Onboarding',
    description: 'Factoring setup, profile configuration, and dispatcher orientation',
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-50/60 dark:bg-cyan-950/20',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
    badgeBg: 'bg-cyan-100 dark:bg-cyan-900/60',
    badgeText: 'text-cyan-700 dark:text-cyan-300',
    headerGradient: 'from-cyan-500 to-blue-600',
    stepNumber: 6
  },
  {
    key: 'ACTIVE',
    label: 'Active',
    shortLabel: 'Active',
    description: 'Converted carrier actively booking and running dispatch freight',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50/60 dark:bg-emerald-950/20',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/60',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    headerGradient: 'from-emerald-500 to-teal-600',
    stepNumber: 7
  },
  {
    key: 'LOST',
    label: 'Lost',
    shortLabel: 'Lost',
    description: 'Carrier declined, self-dispatches, or marked not interested',
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-50/60 dark:bg-rose-950/20',
    borderColor: 'border-rose-200 dark:border-rose-800',
    badgeBg: 'bg-rose-100 dark:bg-rose-900/60',
    badgeText: 'text-rose-700 dark:text-rose-300',
    headerGradient: 'from-rose-500 to-pink-600',
    stepNumber: 8
  }
];

/**
 * Normalizes any lead status (including legacy values) to canonical 8 stages
 */
export function normalizeLeadStatus(status?: string): SalesPipelineStatus {
  if (!status) return 'NEW_LEAD';
  
  switch (status.toUpperCase()) {
    case 'NEW':
    case 'NEW_LEAD':
      return 'NEW_LEAD';
    case 'CALLED':
    case 'IN_CONTACT':
    case 'CONTACTED':
      return 'CALLED';
    case 'INTERESTED':
    case 'RESPONDED':
      return 'INTERESTED';
    case 'DOCUMENTS_REQUESTED':
      return 'DOCUMENTS_REQUESTED';
    case 'DOCUMENTS_RECEIVED':
      return 'DOCUMENTS_RECEIVED';
    case 'ONBOARDING':
      return 'ONBOARDING';
    case 'ACTIVE':
    case 'ONBOARDED_WORKING':
    case 'SIGNED_UP':
      return 'ACTIVE';
    case 'LOST':
    case 'NOT_INTERESTED':
    case 'FOLLOW_UP_LATER':
      return 'LOST';
    default:
      return 'NEW_LEAD';
  }
}

export function getStageConfig(status?: string): PipelineStageConfig {
  const normalized = normalizeLeadStatus(status);
  return CANONICAL_PIPELINE_STAGES.find(s => s.key === normalized) || CANONICAL_PIPELINE_STAGES[0];
}

export const EQUIPMENT_OPTIONS = [
  '53ft Dry Van',
  '53ft Reefer',
  'Flatbed',
  'Step Deck',
  '26ft Box Truck',
  'Hotshot',
  'Power Only',
  'Conestoga',
  'Lowboy / RGN',
  'Tanker',
  'Straight Truck',
  'Sprinter Van'
];

export const LEAD_SOURCES = [
  'Outreach / Cold Call',
  'DAT Board',
  'Truckstop',
  'FMCSA Directory',
  'Website Form',
  'Cold Email',
  'Referral',
  'LinkedIn',
  'Load Board Posting',
  'Other'
];

export const DISPATCHER_STATUS_OPTIONS = [
  'Looking for Dispatcher',
  'Self-Dispatched',
  'Has In-House Dispatcher',
  'Assigned to Dispatcher',
  'Unassigned',
  'Under Contract'
];
