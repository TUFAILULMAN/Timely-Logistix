/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Lead, User, SalesPipelineStatus } from '../../types';
import {
  CANONICAL_PIPELINE_STAGES,
  getStageConfig,
  normalizeLeadStatus,
  EQUIPMENT_OPTIONS,
  LEAD_SOURCES
} from './salesConstants';
import {
  Search,
  Filter,
  Download,
  Building2,
  Phone,
  Mail,
  Truck,
  MapPin,
  Calendar,
  UserCheck,
  ChevronRight,
  Plus,
  Trash2,
  ExternalLink,
  PhoneCall,
  Clock,
  Send,
  CheckCircle2
} from 'lucide-react';

interface SalesLeadsTableProps {
  leads: Lead[];
  users: User[];
  onSelectLead: (lead: Lead) => void;
  onUpdateLeadStatus: (leadId: string, newStatus: SalesPipelineStatus) => Promise<void>;
  onDeleteLead: (leadId: string) => Promise<void>;
  onAddNewLead: () => void;
}

export default function SalesLeadsTable({
  leads,
  users,
  onSelectLead,
  onUpdateLeadStatus,
  onDeleteLead,
  onAddNewLead
}: SalesLeadsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [salespersonFilter, setSalespersonFilter] = useState<string>('ALL');
  const [equipmentFilter, setEquipmentFilter] = useState<string>('ALL');

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        (lead.company || '').toLowerCase().includes(q) ||
        (lead.carrierName || '').toLowerCase().includes(q) ||
        (lead.mcNumber || '').toLowerCase().includes(q) ||
        (lead.dotNumber || '').toLowerCase().includes(q) ||
        (lead.contact || '').toLowerCase().includes(q) ||
        (lead.ownerName || '').toLowerCase().includes(q) ||
        (lead.phone || '').toLowerCase().includes(q) ||
        (lead.email || '').toLowerCase().includes(q) ||
        (lead.currentLocation || '').toLowerCase().includes(q);

      const matchesStage = stageFilter === 'ALL' || normalizeLeadStatus(lead.status) === stageFilter;
      
      const repId = lead.assignedAgentId || '';
      const repName = lead.assignedSalesperson || lead.assignedAgentName || '';
      const matchesSalesperson =
        salespersonFilter === 'ALL' ||
        repId === salespersonFilter ||
        repName === salespersonFilter;

      const equip = lead.equipment || lead.truckType || '';
      const matchesEquipment = equipmentFilter === 'ALL' || equip === equipmentFilter;

      return matchesSearch && matchesStage && matchesSalesperson && matchesEquipment;
    });
  }, [leads, searchTerm, stageFilter, salespersonFilter, equipmentFilter]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Company',
      'MC Number',
      'DOT Number',
      'Contact',
      'Phone',
      'Email',
      'Equipment',
      'Trucks',
      'Preferred Lanes',
      'Current Location',
      'Dispatcher Status',
      'Lead Source',
      'Assigned Salesperson',
      'Stage',
      'Dispatch Fee (%)',
      'Last Contact',
      'Next Follow-Up',
      'Notes'
    ];

    const rows = filteredLeads.map(l => [
      l.id,
      `"${(l.company || l.carrierName || '').replace(/"/g, '""')}"`,
      `"${l.mcNumber || ''}"`,
      `"${l.dotNumber || ''}"`,
      `"${(l.contact || l.ownerName || '').replace(/"/g, '""')}"`,
      `"${l.phone || ''}"`,
      `"${l.email || ''}"`,
      `"${l.equipment || l.truckType || ''}"`,
      l.numberOfTrucks || l.truckCount || 1,
      `"${(l.preferredLanes || '').replace(/"/g, '""')}"`,
      `"${(l.currentLocation || '').replace(/"/g, '""')}"`,
      `"${l.dispatcherStatus || ''}"`,
      `"${l.leadSource || ''}"`,
      `"${l.assignedSalesperson || l.assignedAgentName || ''}"`,
      getStageConfig(l.status).label,
      l.dispatchFeeOffered || 8,
      l.lastContact || l.lastContactDate || '',
      l.nextFollowUp || l.nextFollowUpDate || '',
      `"${(l.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sales_CRM_Leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      
      {/* FILTER CONTROLS BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by Company, MC#, Contact, Phone, Lanes..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Stage Filter */}
          <select
            value={stageFilter}
            onChange={e => setStageFilter(e.target.value)}
            className="p-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold"
          >
            <option value="ALL">All Stages ({leads.length})</option>
            {CANONICAL_PIPELINE_STAGES.map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>

          {/* Salesperson Filter */}
          <select
            value={salespersonFilter}
            onChange={e => setSalespersonFilter(e.target.value)}
            className="p-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All Sales Reps</option>
            {users.filter(u => u.role === 'SALES' || u.role === 'ADMIN').map(u => (
              <option key={u.id} value={u.name}>{u.name}</option>
            ))}
          </select>

          {/* Equipment Filter */}
          <select
            value={equipmentFilter}
            onChange={e => setEquipmentFilter(e.target.value)}
            className="p-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All Equipment</option>
            {EQUIPMENT_OPTIONS.map(eq => (
              <option key={eq} value={eq}>{eq}</option>
            ))}
          </select>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors"
            title="Export filtered leads to CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span>CSV</span>
          </button>
        </div>

      </div>

      {/* COMPREHENSIVE DATA TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-mono text-[10.5px] uppercase border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5 pl-5">Company / Carrier</th>
                <th className="p-3.5">MC / DOT</th>
                <th className="p-3.5">Contact / Phone</th>
                <th className="p-3.5">Equipment / Fleet</th>
                <th className="p-3.5">Location &amp; Lanes</th>
                <th className="p-3.5">Dispatcher Status</th>
                <th className="p-3.5">Sales Rep</th>
                <th className="p-3.5">Pipeline Stage</th>
                <th className="p-3.5">Next Follow-Up</th>
                <th className="p-3.5 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-400 italic">
                    No sales leads found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const stageConfig = getStageConfig(lead.status);
                  const isFollowUpDue = lead.nextFollowUp && new Date(lead.nextFollowUp) <= new Date();

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => onSelectLead(lead)}
                      className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 cursor-pointer transition-colors group"
                    >
                      {/* Company & Source */}
                      <td className="p-3.5 pl-5">
                        <div className="space-y-0.5">
                          <strong className="text-slate-900 dark:text-white font-extrabold font-display group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors block">
                            {lead.company || lead.carrierName}
                          </strong>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {lead.leadSource || 'Outreach'}
                          </span>
                        </div>
                      </td>

                      {/* MC & DOT */}
                      <td className="p-3.5 font-mono text-[11px]">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">
                            {lead.mcNumber || '—'}
                          </span>
                          {lead.dotNumber && (
                            <span className="text-[10px] text-slate-400 block">
                              DOT: {lead.dotNumber}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Contact & Phone */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[140px]">
                            {lead.contact || lead.ownerName || '—'}
                          </span>
                          <span className="text-slate-500 font-mono text-[10.5px] block">
                            {lead.phone}
                          </span>
                        </div>
                      </td>

                      {/* Equipment & Fleet */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 text-[10.5px] inline-block">
                            {lead.equipment || lead.truckType || '53ft Dry Van'}
                          </span>
                          <span className="text-slate-400 text-[10.5px] font-mono block">
                            {lead.numberOfTrucks || lead.truckCount || 1} Trucks ({lead.dispatchFeeOffered || 8}%)
                          </span>
                        </div>
                      </td>

                      {/* Location & Lanes */}
                      <td className="p-3.5 max-w-[160px]">
                        <div className="space-y-0.5 truncate">
                          <span className="font-medium text-slate-800 dark:text-slate-200 block truncate flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-rose-500 shrink-0" />
                            <span className="truncate">{lead.currentLocation || 'Anywhere'}</span>
                          </span>
                          <span className="text-slate-400 text-[10px] block truncate">
                            {lead.preferredLanes || 'Nationwide'}
                          </span>
                        </div>
                      </td>

                      {/* Dispatcher Status */}
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10.5px] font-medium border border-amber-200 dark:border-amber-800/60 whitespace-nowrap">
                          {lead.dispatcherStatus || 'Looking for Dispatcher'}
                        </span>
                      </td>

                      {/* Sales Rep */}
                      <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">
                        {lead.assignedSalesperson || lead.assignedAgentName || 'Alex'}
                      </td>

                      {/* Stage Selector Inline */}
                      <td className="p-3.5" onClick={e => e.stopPropagation()}>
                        <select
                          value={normalizeLeadStatus(lead.status)}
                          onChange={async (e) => {
                            await onUpdateLeadStatus(lead.id, e.target.value as SalesPipelineStatus);
                          }}
                          className={`px-2 py-1 rounded-xl text-xs font-bold border cursor-pointer ${stageConfig.badgeBg} ${stageConfig.badgeText} ${stageConfig.borderColor}`}
                        >
                          {CANONICAL_PIPELINE_STAGES.map(s => (
                            <option key={s.key} value={s.key}>
                              {s.stepNumber}. {s.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Next Follow Up */}
                      <td className="p-3.5 font-mono text-[11px]">
                        {lead.nextFollowUp ? (
                          <span className={`flex items-center gap-1 ${
                            isFollowUpDue ? 'text-rose-600 font-bold' : 'text-slate-600 dark:text-slate-400'
                          }`}>
                            <Clock className="h-3 w-3" />
                            <span>{lead.nextFollowUp}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 pr-5 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectLead(lead)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                            title="View / Edit Details"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>

                          <button
                            onClick={async () => {
                              if (confirm(`Delete lead "${lead.company || lead.carrierName}"?`)) {
                                await onDeleteLead(lead.id);
                              }
                            }}
                            className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg cursor-pointer transition-colors"
                            title="Delete Lead"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
