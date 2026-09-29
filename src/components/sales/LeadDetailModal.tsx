/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lead, User, CarrierOrOwner, CallHistoryItem, EmailHistoryItem, SalesPipelineStatus } from '../../types';
import {
  CANONICAL_PIPELINE_STAGES,
  getStageConfig,
  EQUIPMENT_OPTIONS,
  LEAD_SOURCES,
  DISPATCHER_STATUS_OPTIONS,
  normalizeLeadStatus
} from './salesConstants';
import {
  X,
  Phone,
  Mail,
  Building2,
  Truck,
  MapPin,
  Calendar,
  UserCheck,
  FileText,
  Clock,
  Plus,
  Send,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Hash,
  Activity,
  Edit2,
  Trash2,
  ExternalLink,
  MessageSquare,
  Sparkles,
  PhoneCall,
  MailQuestion
} from 'lucide-react';

interface LeadDetailModalProps {
  lead: Lead;
  users: User[];
  currentUser: User | null;
  carriers?: CarrierOrOwner[];
  onClose: () => void;
  onUpdateLead: (id: string, updated: Partial<Lead>) => Promise<void>;
  onDeleteLead: (id: string) => Promise<void>;
  onConvertToCarrier?: (lead: Lead) => Promise<void>;
  onAddCarrier?: (carrier: Omit<CarrierOrOwner, 'id'>) => Promise<void>;
  isConverting?: boolean;
}

export default function LeadDetailModal({
  lead,
  users,
  currentUser,
  carriers = [],
  onClose,
  onUpdateLead,
  onDeleteLead,
  onConvertToCarrier,
  onAddCarrier,
  isConverting = false
}: LeadDetailModalProps) {
  const [activeSubTab, setActiveSubTab] = useState<'details' | 'calls' | 'emails' | 'edit'>('details');
  const [isSaving, setIsSaving] = useState(false);

  // Edit Lead Form State
  const [editForm, setEditForm] = useState({
    company: lead.company || lead.carrierName || '',
    carrierName: lead.carrierName || lead.company || '',
    mcNumber: lead.mcNumber || '',
    dotNumber: lead.dotNumber || '',
    contact: lead.contact || lead.contactName || lead.ownerName || '',
    ownerName: lead.ownerName || lead.contact || lead.contactName || '',
    contactName: lead.contactName || lead.contact || lead.ownerName || '',
    phone: lead.phone || '',
    email: lead.email || '',
    equipment: lead.equipment || lead.truckType || '53ft Dry Van',
    truckType: lead.truckType || lead.equipment || '53ft Dry Van',
    numberOfTrucks: lead.numberOfTrucks || lead.truckCount || 1,
    truckCount: lead.truckCount || lead.numberOfTrucks || 1,
    preferredLanes: lead.preferredLanes || '',
    currentLocation: lead.currentLocation || '',
    dispatcherStatus: lead.dispatcherStatus || 'Looking for Dispatcher',
    leadSource: lead.leadSource || 'Outreach / Cold Call',
    assignedSalesperson: lead.assignedSalesperson || lead.assignedAgentName || currentUser?.name || 'Sales Representative',
    assignedAgentId: lead.assignedAgentId || currentUser?.id || 'sales_agent',
    assignedAgentName: lead.assignedAgentName || lead.assignedSalesperson || currentUser?.name || 'Sales Representative',
    lastContact: lead.lastContact || lead.lastContactDate || new Date().toISOString().split('T')[0],
    lastContactDate: lead.lastContactDate || lead.lastContact || new Date().toISOString().split('T')[0],
    nextFollowUp: lead.nextFollowUp || lead.nextFollowUpDate || '',
    nextFollowUpDate: lead.nextFollowUpDate || lead.nextFollowUp || '',
    dispatchFeeOffered: lead.dispatchFeeOffered || 8,
    status: normalizeLeadStatus(lead.status),
    notes: lead.notes || ''
  });

  // New Call Log Form State
  const [showAddCall, setShowAddCall] = useState(false);
  const [callForm, setCallForm] = useState<{
    durationMinutes: number;
    outcome: CallHistoryItem['outcome'];
    notes: string;
    phoneCalled: string;
  }>({
    durationMinutes: 5,
    outcome: 'Connected',
    notes: '',
    phoneCalled: lead.phone || ''
  });

  // New Email Log Form State
  const [showAddEmail, setShowAddEmail] = useState(false);
  const [emailForm, setEmailForm] = useState<{
    subject: string;
    body: string;
    status: 'SENT' | 'OPENED' | 'REPLIED';
    recipientEmail: string;
  }>({
    subject: `Timely Dispatch Freight Services - ${lead.company || lead.carrierName}`,
    body: `Hi ${lead.contact || lead.ownerName || 'Carrier Partner'},\n\nThank you for taking the time to speak with us. As discussed, our dedicated dispatch team specializes in keeping ${lead.equipment || lead.truckType || 'freight'} units loaded with top market RPM.\n\nLet us know if you would like us to review available loads for your lanes.\n\nBest regards,\n${currentUser?.name || 'Sales Team'}\nTimely Logistics`,
    status: 'SENT',
    recipientEmail: lead.email || ''
  });

  const currentStageConfig = getStageConfig(lead.status);

  // Handle stage direct transition
  const handleStageChange = async (newStage: SalesPipelineStatus) => {
    setIsSaving(true);
    try {
      await onUpdateLead(lead.id, {
        status: newStage,
        lastContact: new Date().toISOString().split('T')[0],
        lastContactDate: new Date().toISOString().split('T')[0]
      });
      setEditForm(prev => ({ ...prev, status: newStage }));
    } finally {
      setIsSaving(false);
    }
  };

  // Handle saving general edit form
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateLead(lead.id, {
        ...editForm,
        carrierName: editForm.company || editForm.carrierName,
        company: editForm.company || editForm.carrierName,
        ownerName: editForm.contact || editForm.ownerName,
        contact: editForm.contact || editForm.ownerName,
        contactName: editForm.contact || editForm.contactName,
        truckType: editForm.equipment || editForm.truckType,
        equipment: editForm.equipment || editForm.truckType,
        truckCount: Number(editForm.numberOfTrucks) || 1,
        numberOfTrucks: Number(editForm.numberOfTrucks) || 1,
        lastContactDate: editForm.lastContact,
        nextFollowUpDate: editForm.nextFollowUp
      });
      setActiveSubTab('details');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle adding a Call to Call History
  const handleAddCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callForm.notes.trim()) {
      alert('Please add notes describing the call discussion.');
      return;
    }
    const newCallItem: CallHistoryItem = {
      id: `call_${Date.now()}`,
      date: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }),
      salesperson: currentUser?.name || lead.assignedSalesperson || 'Sales Representative',
      salespersonId: currentUser?.id || lead.assignedAgentId || 'sales_agent',
      durationMinutes: Number(callForm.durationMinutes) || 1,
      outcome: callForm.outcome,
      notes: callForm.notes.trim(),
      phoneCalled: callForm.phoneCalled || lead.phone
    };

    const updatedCallHistory = [newCallItem, ...(lead.callHistory || [])];
    
    // Auto-advance stage if agreed & requested docs or interested
    let newStatus = lead.status;
    if (callForm.outcome === 'Agreed & Requested Docs' && normalizeLeadStatus(lead.status) === 'CALLED') {
      newStatus = 'DOCUMENTS_REQUESTED';
    } else if (callForm.outcome === 'Interested' && normalizeLeadStatus(lead.status) === 'NEW_LEAD') {
      newStatus = 'INTERESTED';
    } else if (normalizeLeadStatus(lead.status) === 'NEW_LEAD') {
      newStatus = 'CALLED';
    }

    setIsSaving(true);
    try {
      await onUpdateLead(lead.id, {
        callHistory: updatedCallHistory,
        lastContact: new Date().toISOString().split('T')[0],
        lastContactDate: new Date().toISOString().split('T')[0],
        status: newStatus
      });
      setShowAddCall(false);
      setCallForm({
        durationMinutes: 5,
        outcome: 'Connected',
        notes: '',
        phoneCalled: lead.phone || ''
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle adding an Email to Email History
  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForm.subject.trim() || !emailForm.body.trim()) {
      alert('Please fill out email subject and message.');
      return;
    }
    const newEmailItem: EmailHistoryItem = {
      id: `em_${Date.now()}`,
      date: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }),
      salesperson: currentUser?.name || lead.assignedSalesperson || 'Sales Representative',
      salespersonId: currentUser?.id || lead.assignedAgentId || 'sales_agent',
      subject: emailForm.subject.trim(),
      body: emailForm.body.trim(),
      status: emailForm.status,
      recipientEmail: emailForm.recipientEmail || lead.email
    };

    const updatedEmailHistory = [newEmailItem, ...(lead.emailHistory || [])];

    setIsSaving(true);
    try {
      await onUpdateLead(lead.id, {
        emailHistory: updatedEmailHistory,
        lastContact: new Date().toISOString().split('T')[0],
        lastContactDate: new Date().toISOString().split('T')[0]
      });
      setShowAddEmail(false);
      setEmailForm({
        subject: `Timely Dispatch Freight Services - ${lead.company || lead.carrierName}`,
        body: '',
        status: 'SENT',
        recipientEmail: lead.email || ''
      });
    } finally {
      setIsSaving(false);
    }
  };

  const currentStageIndex = CANONICAL_PIPELINE_STAGES.findIndex(s => s.key === normalizeLeadStatus(lead.status));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* TOP HEADER */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30 shrink-0">
                <Building2 className="h-5 w-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold font-display tracking-tight text-white truncate">
                {lead.company || lead.carrierName || 'Unnamed Carrier'}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${currentStageConfig.badgeBg} ${currentStageConfig.badgeText} ${currentStageConfig.borderColor}`}>
                {currentStageConfig.label}
              </span>
            </div>

            {/* Sub-identifiers */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-mono">
              {lead.mcNumber && (
                <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700">
                  <Hash className="h-3.5 w-3.5 text-amber-400" />
                  <strong>{lead.mcNumber}</strong>
                </span>
              )}
              {lead.dotNumber && (
                <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700">
                  <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
                  <span>DOT: {lead.dotNumber}</span>
                </span>
              )}
              <span className="text-slate-400">
                Contact: <strong className="text-white">{lead.contact || lead.ownerName || '—'}</strong>
              </span>
              <span className="text-slate-400">
                Assigned: <strong className="text-indigo-300">{lead.assignedSalesperson || lead.assignedAgentName || currentUser?.name || 'Sales Representative'}</strong>
              </span>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onConvertToCarrier && (
              <button
                onClick={() => onConvertToCarrier(lead)}
                disabled={isConverting}
                className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-all disabled:opacity-50"
                title="Convert this lead into an active Carrier in Carrier Registry"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{isConverting ? 'Converting...' : 'Convert to Carrier'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 8-STAGE PIPELINE STEPPER BAR */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 sm:px-6 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[700px] gap-1">
            {CANONICAL_PIPELINE_STAGES.map((stage, idx) => {
              const isCurrent = stage.key === normalizeLeadStatus(lead.status);
              const isPast = idx < currentStageIndex;

              return (
                <button
                  key={stage.key}
                  onClick={() => handleStageChange(stage.key)}
                  disabled={isSaving}
                  className={`flex-1 flex flex-col items-center p-1.5 rounded-xl text-center transition-all cursor-pointer group relative ${
                    isCurrent
                      ? 'bg-white dark:bg-slate-900 shadow-sm border-2 border-indigo-600 dark:border-indigo-400'
                      : isPast
                      ? 'hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'
                  }`}
                  title={`Click to set stage to ${stage.label}`}
                >
                  <div className="flex items-center gap-1">
                    <span
                      className={`h-5 w-5 rounded-full text-[10px] font-mono font-bold flex items-center justify-center ${
                        isCurrent
                          ? 'bg-indigo-600 text-white'
                          : isPast
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {isPast ? '✓' : stage.stepNumber}
                    </span>
                    <span
                      className={`text-[11px] font-bold truncate max-w-[80px] ${
                        isCurrent ? 'text-slate-900 dark:text-white font-extrabold' : ''
                      }`}
                    >
                      {stage.shortLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* SUB-TABS NAVIGATION */}
        <div className="flex items-center justify-between px-6 pt-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('details')}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
                activeSubTab === 'details'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>Lead Details</span>
            </button>

            <button
              onClick={() => setActiveSubTab('calls')}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
                activeSubTab === 'calls'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Phone className="h-4 w-4" />
              <span>Call History ({lead.callHistory?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('emails')}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
                activeSubTab === 'emails'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Mail className="h-4 w-4" />
              <span>Email History ({lead.emailHistory?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('edit')}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
                activeSubTab === 'edit'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Edit2 className="h-4 w-4" />
              <span>Edit Lead Profile</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <button
              onClick={() => {
                setActiveSubTab('calls');
                setShowAddCall(true);
              }}
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 cursor-pointer flex items-center gap-1"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              <span>Log Call</span>
            </button>

            <button
              onClick={() => {
                setActiveSubTab('emails');
                setShowAddEmail(true);
              }}
              className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-xl border border-blue-200 dark:border-blue-800 cursor-pointer flex items-center gap-1"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Draft Email</span>
            </button>
          </div>
        </div>

        {/* TAB 1: FULL LEAD DETAILS VIEW */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeSubTab === 'details' && (
            <div className="space-y-6">
              {/* Primary 4-Box Grid for Core Lead Attributes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Panel 1: Carrier & Fleet Specifications */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider font-mono">
                    <Truck className="h-4 w-4" />
                    <span>Carrier Fleet &amp; Equipment</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Company</span>
                      <strong className="text-slate-900 dark:text-white">{lead.company || lead.carrierName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Equipment Type</span>
                      <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 inline-block mt-0.5">
                        {lead.equipment || lead.truckType || '53ft Dry Van'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Number of Trucks</span>
                      <strong className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">
                        {lead.numberOfTrucks || lead.truckCount || 1} Units
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Dispatcher Status</span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-medium text-[11px] border border-amber-200 dark:border-amber-800 inline-block mt-0.5">
                        {lead.dispatcherStatus || 'Looking for Dispatcher'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Current Location</span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-rose-500" />
                        <span>{lead.currentLocation || 'Not specified'}</span>
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Preferred Lanes</span>
                      <p className="text-slate-700 dark:text-slate-300 font-medium bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 mt-0.5">
                        {lead.preferredLanes || 'Open to all freight lanes nationwide'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Panel 2: Contact & Lead Management */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider font-mono">
                    <UserCheck className="h-4 w-4" />
                    <span>Contact Person &amp; Lead Source</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Contact Person</span>
                      <strong className="text-slate-900 dark:text-white text-sm">
                        {lead.contact || lead.contactName || lead.ownerName || '—'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Lead Source</span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold text-[11px] border border-blue-200 dark:border-blue-800 inline-block mt-0.5">
                        {lead.leadSource || 'Outreach / Cold Call'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Phone Number</span>
                      <a
                        href={`tel:${lead.phone}`}
                        className="text-indigo-600 dark:text-indigo-400 font-bold font-mono hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span>{lead.phone}</span>
                      </a>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Email Address</span>
                      {lead.email ? (
                        <a
                          href={`mailto:${lead.email}`}
                          className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 truncate mt-0.5"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          <span className="truncate">{lead.email}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400">No email registered</span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Assigned Salesperson</span>
                      <strong className="text-slate-900 dark:text-white">
                        {lead.assignedSalesperson || lead.assignedAgentName || currentUser?.name || 'Sales Representative'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Dispatch Fee Offered</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                        {lead.dispatchFeeOffered || 8}%
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Last Contact Date</span>
                      <strong className="text-slate-700 dark:text-slate-300 font-mono">
                        {lead.lastContact || lead.lastContactDate || lead.createdAt}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Next Follow-Up</span>
                      <span className="text-amber-600 dark:text-amber-400 font-mono font-bold">
                        {lead.nextFollowUp || lead.nextFollowUpDate || 'None scheduled'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Notes & Strategic Context */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono block">
                  Carrier Notes &amp; Follow-up Context
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {lead.notes || 'No specific notes recorded yet.'}
                </p>
              </div>

              {/* Recent Call & Email History Previews */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Call History Card */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold font-display uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Phone className="h-4 w-4 text-indigo-600" />
                      <span>Latest Call Activity</span>
                    </h4>
                    <button
                      onClick={() => {
                        setActiveSubTab('calls');
                        setShowAddCall(true);
                      }}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      + Log Call
                    </button>
                  </div>

                  {(!lead.callHistory || lead.callHistory.length === 0) ? (
                    <p className="text-xs text-slate-400 italic py-4 text-center">
                      No calls logged yet. Click "+ Log Call" to record outreach.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {lead.callHistory.slice(0, 2).map((call) => (
                        <div key={call.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{call.salesperson}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{call.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                              {call.outcome}
                            </span>
                            <span className="text-slate-400 text-[10px]">({call.durationMinutes} mins)</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 text-[11px]">{call.notes}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Email History Card */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold font-display uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span>Latest Email Activity</span>
                    </h4>
                    <button
                      onClick={() => {
                        setActiveSubTab('emails');
                        setShowAddEmail(true);
                      }}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      + Draft Email
                    </button>
                  </div>

                  {(!lead.emailHistory || lead.emailHistory.length === 0) ? (
                    <p className="text-xs text-slate-400 italic py-4 text-center">
                      No emails logged yet. Click "+ Draft Email" to send outreach.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {lead.emailHistory.slice(0, 2).map((em) => (
                        <div key={em.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <strong className="text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{em.subject}</strong>
                            <span className="text-[10px] text-slate-400 font-mono">{em.date}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[9.5px] font-bold font-mono">
                              {em.status || 'SENT'}
                            </span>
                            <span className="text-[10px] text-slate-400">By {em.salesperson}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 text-[11px] line-clamp-2">{em.body}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: CALL HISTORY FULL LOG */}
          {activeSubTab === 'calls' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                    Carrier Call Logs &amp; Phone Outreach
                  </h3>
                  <p className="text-xs text-slate-500">
                    Track all phone dials, pitches, voicemail drops, and rate negotiations with {lead.company || lead.carrierName}.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddCall(!showAddCall)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>{showAddCall ? 'Cancel' : 'Log New Call'}</span>
                </button>
              </div>

              {/* Log Call Form */}
              {showAddCall && (
                <form onSubmit={handleAddCall} className="bg-indigo-50/50 dark:bg-indigo-950/30 p-5 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-4">
                  <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <PhoneCall className="h-4 w-4" />
                    <span>Record Outbound / Inbound Call</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Phone Dialed</label>
                      <input
                        type="text"
                        value={callForm.phoneCalled}
                        onChange={e => setCallForm({ ...callForm, phoneCalled: e.target.value })}
                        className="w-full p-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                        placeholder="(555) 000-0000"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Duration (Minutes)</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={callForm.durationMinutes}
                        onChange={e => setCallForm({ ...callForm, durationMinutes: parseInt(e.target.value) || 1 })}
                        className="w-full p-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Call Outcome</label>
                      <select
                        value={callForm.outcome}
                        onChange={e => setCallForm({ ...callForm, outcome: e.target.value as any })}
                        className="w-full p-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
                      >
                        <option value="Connected">Connected - Discussed Rates</option>
                        <option value="Interested">Interested - Requesting Details</option>
                        <option value="Agreed & Requested Docs">Agreed &amp; Requested Docs</option>
                        <option value="Left Voicemail">Left Voicemail</option>
                        <option value="Busy / No Answer">Busy / No Answer</option>
                        <option value="Call Back Later">Call Back Later</option>
                        <option value="Not Interested">Not Interested</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Call Notes &amp; Action Items *</label>
                    <textarea
                      rows={3}
                      required
                      value={callForm.notes}
                      onChange={e => setCallForm({ ...callForm, notes: e.target.value })}
                      placeholder="e.g. Discussed 7% rate for 3 reefers running Midwest to Southeast. Owner requested follow-up email with onboarding packet."
                      className="w-full p-3 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddCall(false)}
                      className="px-4 py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                    >
                      Save Call Log
                    </button>
                  </div>
                </form>
              )}

              {/* Call History Timeline List */}
              <div className="space-y-3">
                {(!lead.callHistory || lead.callHistory.length === 0) ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                    No phone calls logged for this carrier yet.
                  </div>
                ) : (
                  lead.callHistory.map(call => (
                    <div key={call.id} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 rounded-lg">
                            <Phone className="h-4 w-4" />
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white text-xs">{call.salesperson}</span>
                          {call.phoneCalled && (
                            <span className="text-[10px] text-slate-400 font-mono">({call.phoneCalled})</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                            {call.durationMinutes} mins
                          </span>
                          <span className="text-slate-400 text-[10px]">{call.date}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold ${
                          call.outcome === 'Agreed & Requested Docs'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200'
                            : call.outcome === 'Interested'
                            ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400 border border-violet-200'
                            : call.outcome === 'Not Interested'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200'
                            : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200'
                        }`}>
                          {call.outcome}
                        </span>
                      </div>

                      <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed pl-1">
                        {call.notes}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: EMAIL HISTORY FULL LOG */}
          {activeSubTab === 'emails' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                    Carrier Email History &amp; Outreach
                  </h3>
                  <p className="text-xs text-slate-500">
                    Track email pitch letters, document checklists, and dispatch agreements sent to {lead.email || lead.company}.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddEmail(!showAddEmail)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>{showAddEmail ? 'Cancel' : 'Draft / Send Email'}</span>
                </button>
              </div>

              {/* Draft Email Form */}
              {showAddEmail && (
                <form onSubmit={handleAddEmail} className="bg-blue-50/50 dark:bg-blue-950/30 p-5 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-4">
                  <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Send className="h-4 w-4" />
                    <span>Compose &amp; Record Email Outreach</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Recipient Email</label>
                      <input
                        type="email"
                        required
                        value={emailForm.recipientEmail}
                        onChange={e => setEmailForm({ ...emailForm, recipientEmail: e.target.value })}
                        className="w-full p-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                        placeholder="carrier@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Status</label>
                      <select
                        value={emailForm.status}
                        onChange={e => setEmailForm({ ...emailForm, status: e.target.value as any })}
                        className="w-full p-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
                      >
                        <option value="SENT">Sent</option>
                        <option value="OPENED">Opened</option>
                        <option value="REPLIED">Replied</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Subject *</label>
                    <input
                      type="text"
                      required
                      value={emailForm.subject}
                      onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })}
                      className="w-full p-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
                    />
                  </div>

                  {/* Quick Templates */}
                  <div className="flex flex-wrap items-center gap-2 text-[10px]">
                    <span className="text-slate-400 font-mono">Templates:</span>
                    <button
                      type="button"
                      onClick={() => setEmailForm(prev => ({
                        ...prev,
                        subject: `Timely Logistics - High RPM Freight for ${lead.company || 'Your Fleet'}`,
                        body: `Hi ${lead.contact || 'Partner'},\n\nWe have high-paying spot and dedicated lanes across ${lead.preferredLanes || 'your preferred regions'}. Our dispatch fee is ${lead.dispatchFeeOffered || 8}% with 24/7 coverage.\n\nLet us know your current location to book your next run!\n\nBest,\n${currentUser?.name || 'Sales Representative'}`
                      }))}
                      className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 cursor-pointer font-medium"
                    >
                      Intro Pitch
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmailForm(prev => ({
                        ...prev,
                        subject: `Carrier Onboarding Checklist - ${lead.company || 'Carrier Packet'}`,
                        body: `Hello ${lead.contact || 'Carrier'},\n\nExcited to partner! Please send us the following documents to activate your account:\n1. Carrier Packet (Signed)\n2. W-9 Form\n3. Certificate of Insurance ($1M Auto / $100K Cargo)\n4. Notice of Assignment (NOA for Factoring)\n\nThanks,\n${currentUser?.name || 'Sales Representative'}`
                      }))}
                      className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 cursor-pointer font-medium"
                    >
                      Documents Checklist
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Message Body *</label>
                    <textarea
                      rows={5}
                      required
                      value={emailForm.body}
                      onChange={e => setEmailForm({ ...emailForm, body: e.target.value })}
                      className="w-full p-3 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddEmail(false)}
                      className="px-4 py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                    >
                      Save Email Record
                    </button>
                  </div>
                </form>
              )}

              {/* Email History List */}
              <div className="space-y-3">
                {(!lead.emailHistory || lead.emailHistory.length === 0) ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                    No emails logged for this carrier yet.
                  </div>
                ) : (
                  lead.emailHistory.map(em => (
                    <div key={em.id} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-lg">
                            <Mail className="h-4 w-4" />
                          </span>
                          <strong className="text-slate-900 dark:text-white text-xs">{em.subject}</strong>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{em.date}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 text-[10px] font-bold font-mono">
                          {em.status || 'SENT'}
                        </span>
                        <span className="text-slate-500 text-[11px]">To: <strong className="text-slate-700 dark:text-slate-300">{em.recipientEmail}</strong></span>
                        <span className="text-slate-400 text-[10px]">By {em.salesperson}</span>
                      </div>

                      <p className="text-slate-600 dark:text-slate-400 text-xs whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        {em.body}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: EDIT LEAD PROFILE FORM */}
          {activeSubTab === 'edit' && (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                  Update Complete Lead Profile
                </h3>
                <span className="text-xs text-slate-400 font-mono">ID: {lead.id}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.company}
                    onChange={e => setEditForm({ ...editForm, company: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">MC Number</label>
                  <input
                    type="text"
                    value={editForm.mcNumber}
                    onChange={e => setEditForm({ ...editForm, mcNumber: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold"
                    placeholder="MC-1482000"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">DOT Number</label>
                  <input
                    type="text"
                    value={editForm.dotNumber}
                    onChange={e => setEditForm({ ...editForm, dotNumber: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
                    placeholder="3928174"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={editForm.contact}
                    onChange={e => setEditForm({ ...editForm, contact: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Equipment Type</label>
                  <select
                    value={editForm.equipment}
                    onChange={e => setEditForm({ ...editForm, equipment: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                  >
                    {EQUIPMENT_OPTIONS.map(eq => (
                      <option key={eq} value={eq}>{eq}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Number of Trucks</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={editForm.numberOfTrucks}
                    onChange={e => setEditForm({ ...editForm, numberOfTrucks: parseInt(e.target.value) || 1 })}
                    className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Current Location</label>
                  <input
                    type="text"
                    value={editForm.currentLocation}
                    onChange={e => setEditForm({ ...editForm, currentLocation: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                    placeholder="e.g. Dallas, TX"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Dispatcher Status</label>
                  <select
                    value={editForm.dispatcherStatus}
                    onChange={e => setEditForm({ ...editForm, dispatcherStatus: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                  >
                    {DISPATCHER_STATUS_OPTIONS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Lead Source</label>
                  <select
                    value={editForm.leadSource}
                    onChange={e => setEditForm({ ...editForm, leadSource: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                  >
                    {LEAD_SOURCES.map(ls => (
                      <option key={ls} value={ls}>{ls}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Assigned Salesperson</label>
                  <select
                    value={editForm.assignedAgentId}
                    onChange={e => {
                      const selectedUser = users.find(u => u.id === e.target.value);
                      setEditForm({
                        ...editForm,
                        assignedAgentId: e.target.value,
                        assignedSalesperson: selectedUser?.name || 'Sales Representative',
                        assignedAgentName: selectedUser?.name || 'Sales Representative'
                      });
                    }}
                    className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
                  >
                    {users.filter(u => u.role === 'SALES' || u.role === 'ADMIN' || u.role === 'DISPATCHER').map(u => (
                      <option key={u.id} value={u.id}>{u.name} (@{u.username})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Pipeline Stage</label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-indigo-600 dark:text-indigo-400"
                  >
                    {CANONICAL_PIPELINE_STAGES.map(s => (
                      <option key={s.key} value={s.key}>{s.stepNumber}. {s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Dispatch Fee Offered (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="25"
                    value={editForm.dispatchFeeOffered}
                    onChange={e => setEditForm({ ...editForm, dispatchFeeOffered: parseFloat(e.target.value) || 8 })}
                    className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Next Follow-Up Date</label>
                  <input
                    type="date"
                    value={editForm.nextFollowUp}
                    onChange={e => setEditForm({ ...editForm, nextFollowUp: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
                  />
                </div>

                <div className="col-span-full">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Preferred Lanes</label>
                  <input
                    type="text"
                    value={editForm.preferredLanes}
                    onChange={e => setEditForm({ ...editForm, preferredLanes: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                    placeholder="e.g. Midwest to Texas, Southeast regional produce lanes"
                  />
                </div>

                <div className="col-span-full">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Notes &amp; Discussion Points</label>
                  <textarea
                    rows={4}
                    value={editForm.notes}
                    onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full p-3 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                    placeholder="Key objections, rate expectations, truck details, dispatcher assignments..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm(`Are you sure you want to delete lead "${lead.company || lead.carrierName}"? This action cannot be undone.`)) {
                      await onDeleteLead(lead.id);
                      onClose();
                    }
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Lead</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('details')}
                    className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Lead Changes'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* BOTTOM FOOTER */}
        <div className="p-4 px-6 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Created: <strong className="font-mono text-slate-700 dark:text-slate-300">{lead.createdAt}</strong></span>
            <span>•</span>
            <span>Last Contact: <strong className="font-mono text-slate-700 dark:text-slate-300">{lead.lastContact || lead.lastContactDate || '—'}</strong></span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
