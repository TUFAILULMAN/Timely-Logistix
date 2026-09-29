/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lead, User, SalesPipelineStatus } from '../../types';
import {
  CANONICAL_PIPELINE_STAGES,
  EQUIPMENT_OPTIONS,
  LEAD_SOURCES,
  DISPATCHER_STATUS_OPTIONS
} from './salesConstants';
import {
  X,
  Building2,
  Phone,
  Mail,
  Truck,
  MapPin,
  Calendar,
  UserCheck,
  Plus,
  Hash,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface AddLeadModalProps {
  users: User[];
  currentUser: User | null;
  onClose: () => void;
  onAddLead: (lead: Omit<Lead, 'id'>) => Promise<void>;
}

export default function AddLeadModal({
  users,
  currentUser,
  onClose,
  onAddLead
}: AddLeadModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    company: '',
    mcNumber: '',
    dotNumber: '',
    contact: '',
    phone: '',
    email: '',
    equipment: '53ft Dry Van',
    numberOfTrucks: 1,
    preferredLanes: '',
    currentLocation: '',
    dispatcherStatus: 'Looking for Dispatcher',
    leadSource: 'Outreach / Cold Call',
    assignedAgentId: currentUser?.id || 'sales_agent',
    assignedSalesperson: currentUser?.name || 'Sales Representative',
    status: 'NEW_LEAD' as SalesPipelineStatus,
    dispatchFeeOffered: 8,
    lastContact: new Date().toISOString().split('T')[0],
    nextFollowUp: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company.trim() || !form.phone.trim()) {
      alert('Please fill in Company Name and Phone Number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedUser = users.find(u => u.id === form.assignedAgentId);
      const assignedName = selectedUser?.name || form.assignedSalesperson || currentUser?.name || 'Sales Representative';

      await onAddLead({
        company: form.company.trim(),
        carrierName: form.company.trim(),
        mcNumber: form.mcNumber.trim(),
        dotNumber: form.dotNumber.trim(),
        contact: form.contact.trim(),
        ownerName: form.contact.trim(),
        contactName: form.contact.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        equipment: form.equipment,
        truckType: form.equipment,
        numberOfTrucks: Number(form.numberOfTrucks) || 1,
        truckCount: Number(form.numberOfTrucks) || 1,
        preferredLanes: form.preferredLanes.trim(),
        currentLocation: form.currentLocation.trim(),
        dispatcherStatus: form.dispatcherStatus,
        leadSource: form.leadSource,
        assignedAgentId: form.assignedAgentId,
        assignedSalesperson: assignedName,
        assignedAgentName: assignedName,
        status: form.status,
        dispatchFeeOffered: Number(form.dispatchFeeOffered) || 8,
        lastContact: form.lastContact,
        lastContactDate: form.lastContact,
        nextFollowUp: form.nextFollowUp,
        nextFollowUpDate: form.nextFollowUp,
        notes: form.notes.trim(),
        callHistory: [],
        emailHistory: [],
        createdAt: new Date().toISOString().split('T')[0],
        companyId: 'DEFAULT_COMPANY'
      });
      onClose();
    } catch (err) {
      console.error('Failed to add lead:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold font-display tracking-tight text-white">
                Add New Carrier Sales Lead
              </h2>
              <p className="text-xs text-slate-400">
                Register carrier fleet info, authority numbers, preferred lanes, and assign sales agent.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* Section 1: Carrier & Authority Identifiers */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              <span>Carrier &amp; Authority Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Company / Carrier Name *</label>
                <input
                  type="text"
                  required
                  value={form.company}
                  onChange={e => setForm({ ...form, company: e.target.value })}
                  placeholder="e.g. Apex Freight LLC"
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">MC Number</label>
                <div className="relative">
                  <Hash className="h-3.5 w-3.5 absolute left-3 top-3 text-amber-500" />
                  <input
                    type="text"
                    value={form.mcNumber}
                    onChange={e => setForm({ ...form, mcNumber: e.target.value })}
                    placeholder="MC-1482990"
                    className="w-full pl-8 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">DOT Number</label>
                <div className="relative">
                  <ShieldCheck className="h-3.5 w-3.5 absolute left-3 top-3 text-sky-500" />
                  <input
                    type="text"
                    value={form.dotNumber}
                    onChange={e => setForm({ ...form, dotNumber: e.target.value })}
                    placeholder="3928174"
                    className="w-full pl-8 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Contact Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="h-4 w-4" />
              <span>Contact Person &amp; Communication</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Contact / Owner Name *</label>
                <input
                  type="text"
                  required
                  value={form.contact}
                  onChange={e => setForm({ ...form, contact: e.target.value })}
                  placeholder="e.g. Marcus Miller"
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number *</label>
                <div className="relative">
                  <Phone className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="(555) 000-0000"
                    className="w-full pl-8 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="carrier@example.com"
                    className="w-full pl-8 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Equipment & Fleet Capacity */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="h-4 w-4" />
              <span>Fleet Specifications &amp; Lanes</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Equipment</label>
                <select
                  value={form.equipment}
                  onChange={e => setForm({ ...form, equipment: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                >
                  {EQUIPMENT_OPTIONS.map(eq => (
                    <option key={eq} value={eq}>{eq}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Number of Trucks</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={form.numberOfTrucks}
                  onChange={e => setForm({ ...form, numberOfTrucks: parseInt(e.target.value) || 1 })}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Current Location</label>
                <input
                  type="text"
                  value={form.currentLocation}
                  onChange={e => setForm({ ...form, currentLocation: e.target.value })}
                  placeholder="e.g. Atlanta, GA"
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Dispatcher Status</label>
                <select
                  value={form.dispatcherStatus}
                  onChange={e => setForm({ ...form, dispatcherStatus: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {DISPATCHER_STATUS_OPTIONS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-full">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Preferred Freight Lanes</label>
                <input
                  type="text"
                  value={form.preferredLanes}
                  onChange={e => setForm({ ...form, preferredLanes: e.target.value })}
                  placeholder="e.g. Midwest to Texas, Southeast regional produce lanes"
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Lead Assignment & CRM Stage */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>CRM Assignment &amp; Pipeline Stage</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Lead Source</label>
                <select
                  value={form.leadSource}
                  onChange={e => setForm({ ...form, leadSource: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {LEAD_SOURCES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Assigned Sales Rep</label>
                <select
                  value={form.assignedAgentId}
                  onChange={e => {
                    const sel = users.find(u => u.id === e.target.value);
                    setForm({
                      ...form,
                      assignedAgentId: e.target.value,
                      assignedSalesperson: sel?.name || currentUser?.name || 'Sales Representative'
                    });
                  }}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                >
                  {users.filter(u => u.role === 'SALES' || u.role === 'ADMIN' || u.role === 'DISPATCHER').map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Initial Pipeline Stage</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value as any })}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-bold text-indigo-600 dark:text-indigo-400"
                >
                  {CANONICAL_PIPELINE_STAGES.map(s => (
                    <option key={s.key} value={s.key}>{s.stepNumber}. {s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Dispatch Fee Offered (%)</label>
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={form.dispatchFeeOffered}
                  onChange={e => setForm({ ...form, dispatchFeeOffered: parseFloat(e.target.value) || 8 })}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Next Follow-Up Date</label>
                <input
                  type="date"
                  value={form.nextFollowUp}
                  onChange={e => setForm({ ...form, nextFollowUp: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div className="col-span-full">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Notes &amp; Discussion Points</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Notes from initial outreach, truck preferences, rate expectations..."
                  className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span>{isSubmitting ? 'Creating Lead...' : 'Create Sales Lead'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
