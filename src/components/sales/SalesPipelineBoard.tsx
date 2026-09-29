/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Lead, User, SalesPipelineStatus } from '../../types';
import {
  CANONICAL_PIPELINE_STAGES,
  normalizeLeadStatus,
  getStageConfig
} from './salesConstants';
import {
  Building2,
  Phone,
  Mail,
  Truck,
  MapPin,
  Calendar,
  UserCheck,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Plus,
  Hash,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface SalesPipelineBoardProps {
  leads: Lead[];
  users: User[];
  onSelectLead: (lead: Lead) => void;
  onUpdateLeadStatus: (leadId: string, newStatus: SalesPipelineStatus) => Promise<void>;
  onAddNewLead: () => void;
}

export default function SalesPipelineBoard({
  leads,
  users,
  onSelectLead,
  onUpdateLeadStatus,
  onAddNewLead
}: SalesPipelineBoardProps) {

  // Move lead to next stage in the 8-stage sequence
  const handleAdvanceStage = async (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    const currentStatus = normalizeLeadStatus(lead.status);
    const currentIndex = CANONICAL_PIPELINE_STAGES.findIndex(s => s.key === currentStatus);
    if (currentIndex >= 0 && currentIndex < CANONICAL_PIPELINE_STAGES.length - 2) {
      const nextStage = CANONICAL_PIPELINE_STAGES[currentIndex + 1].key;
      await onUpdateLeadStatus(lead.id, nextStage);
    } else if (currentStatus === 'ONBOARDING') {
      await onUpdateLeadStatus(lead.id, 'ACTIVE');
    }
  };

  // Move lead to previous stage in the 8-stage sequence
  const handleRegressStage = async (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    const currentStatus = normalizeLeadStatus(lead.status);
    const currentIndex = CANONICAL_PIPELINE_STAGES.findIndex(s => s.key === currentStatus);
    if (currentIndex > 0) {
      const prevStage = CANONICAL_PIPELINE_STAGES[currentIndex - 1].key;
      await onUpdateLeadStatus(lead.id, prevStage);
    }
  };

  // Mark Lost
  const handleMarkLost = async (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    await onUpdateLeadStatus(lead.id, 'LOST');
  };

  return (
    <div className="overflow-x-auto pb-4 pt-1">
      <div className="flex gap-4 min-w-[1720px] items-start">
        {CANONICAL_PIPELINE_STAGES.map((stage, stageIdx) => {
          const stageLeads = leads.filter(l => normalizeLeadStatus(l.status) === stage.key);
          const totalTrucksInStage = stageLeads.reduce((acc, l) => acc + (l.numberOfTrucks || l.truckCount || 1), 0);

          return (
            <div
              key={stage.key}
              className={`w-[260px] shrink-0 rounded-3xl border flex flex-col max-h-[calc(100vh-250px)] bg-slate-50/80 dark:bg-slate-900/60 ${stage.borderColor} shadow-xs`}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-6 w-6 rounded-full text-xs font-mono font-bold flex items-center justify-center bg-gradient-to-br ${stage.headerGradient} text-white shadow-xs`}>
                    {stage.stepNumber}
                  </span>
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 dark:text-white font-display">
                      {stage.label}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {totalTrucksInStage} Trucks
                    </span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${stage.badgeBg} ${stage.badgeText}`}>
                  {stageLeads.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="p-2.5 space-y-2.5 overflow-y-auto flex-1">
                {stageLeads.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs italic border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    No leads in this stage
                  </div>
                ) : (
                  stageLeads.map((lead) => {
                    const isFollowUpDue = lead.nextFollowUp && new Date(lead.nextFollowUp) <= new Date();

                    return (
                      <div
                        key={lead.id}
                        onClick={() => onSelectLead(lead)}
                        className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer space-y-2.5 group relative"
                      >
                        {/* Company & MC# */}
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-1.5">
                            <strong className="text-xs font-extrabold text-slate-900 dark:text-white font-display line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {lead.company || lead.carrierName}
                            </strong>
                            {lead.mcNumber && (
                              <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                                {lead.mcNumber}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                            <UserCheck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{lead.contact || lead.ownerName || 'Contact'}</span>
                          </div>
                        </div>

                        {/* Equipment & Trucks Badge */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-100 dark:border-indigo-900/40">
                            {lead.equipment || lead.truckType || 'Dry Van'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold">
                            {lead.numberOfTrucks || lead.truckCount || 1} {Number(lead.numberOfTrucks || lead.truckCount || 1) === 1 ? 'Truck' : 'Trucks'}
                          </span>
                          {lead.dispatchFeeOffered && (
                            <span className="px-1.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                              {lead.dispatchFeeOffered}%
                            </span>
                          )}
                        </div>

                        {/* Location / Lanes */}
                        {lead.currentLocation && (
                          <div className="flex items-center gap-1 text-[10.5px] text-slate-500 truncate">
                            <MapPin className="h-3 w-3 text-rose-500 shrink-0" />
                            <span className="truncate">{lead.currentLocation}</span>
                          </div>
                        )}

                        {/* Follow up & Salesperson */}
                        <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 truncate">
                            {lead.assignedSalesperson || lead.assignedAgentName || 'Alex'}
                          </span>
                          {lead.nextFollowUp && (
                            <span className={`flex items-center gap-1 font-mono ${
                              isFollowUpDue ? 'text-rose-600 font-bold' : 'text-slate-400'
                            }`}>
                              <Clock className="h-3 w-3" />
                              <span>{lead.nextFollowUp}</span>
                            </span>
                          )}
                        </div>

                        {/* Call/Email Activity Counts */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-0.5" title="Logged Calls">
                              <Phone className="h-3 w-3 text-indigo-400" />
                              <span>{lead.callHistory?.length || 0}</span>
                            </span>
                            <span className="flex items-center gap-0.5" title="Logged Emails">
                              <Mail className="h-3 w-3 text-blue-400" />
                              <span>{lead.emailHistory?.length || 0}</span>
                            </span>
                          </div>

                          {/* Stage Transition Quick Action Buttons */}
                          <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                            {stageIdx > 0 && stage.key !== 'LOST' && (
                              <button
                                onClick={(e) => handleRegressStage(e, lead)}
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                title="Move back 1 stage"
                              >
                                <ArrowLeft className="h-3 w-3" />
                              </button>
                            )}

                            {stageIdx < CANONICAL_PIPELINE_STAGES.length - 2 && stage.key !== 'LOST' && (
                              <button
                                onClick={(e) => handleAdvanceStage(e, lead)}
                                className="p-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-400 rounded-md cursor-pointer flex items-center gap-0.5 font-bold text-[9.5px]"
                                title="Advance to next stage"
                              >
                                <span>Next</span>
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            )}

                            {stage.key === 'ONBOARDING' && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await onUpdateLeadStatus(lead.id, 'ACTIVE');
                                }}
                                className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-md cursor-pointer font-bold text-[9.5px]"
                                title="Mark as Active Carrier"
                              >
                                Activate
                              </button>
                            )}

                            {stage.key !== 'LOST' && stage.key !== 'ACTIVE' && (
                              <button
                                onClick={(e) => handleMarkLost(e, lead)}
                                className="p-1 text-slate-300 hover:text-rose-500 rounded-md cursor-pointer"
                                title="Mark as Lost"
                              >
                                <XCircle className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
