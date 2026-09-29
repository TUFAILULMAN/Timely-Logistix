/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Lead,
  SalesDailyLog,
  SalesPipelineStatus,
  User,
  CarrierOrOwner,
  TrainingScriptConfig
} from '../../types';
import SalesTrainingModule from './SalesTrainingModule';
import ManagementSalesDashboard from './ManagementSalesDashboard';
import SalesPipelineBoard from './SalesPipelineBoard';
import SalesLeadsTable from './SalesLeadsTable';
import LeadDetailModal from './LeadDetailModal';
import AddLeadModal from './AddLeadModal';
import {
  CANONICAL_PIPELINE_STAGES,
  normalizeLeadStatus,
  getStageConfig
} from './salesConstants';
import {
  Users,
  Kanban,
  Table as TableIcon,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Phone,
  Mail,
  TrendingUp,
  Target,
  Clock,
  Calendar,
  Building2,
  Truck,
  ExternalLink,
  ChevronRight,
  Edit2,
  Trash2,
  FileCheck,
  Award,
  Sparkles,
  BarChart3,
  Check,
  AlertCircle,
  GraduationCap,
  Briefcase,
  Layers,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  UserX,
  X,
  FileText,
  UserPlus
} from 'lucide-react';

interface SalesTeamHubProps {
  leads: Lead[];
  salesDailyLogs: SalesDailyLog[];
  users: User[];
  currentUser: User | null;
  carriers: CarrierOrOwner[];
  onAddLead: (lead: Omit<Lead, 'id'>) => Promise<void>;
  onEditLead: (id: string, updated: Partial<Lead>) => Promise<void>;
  onDeleteLead: (id: string) => Promise<void>;
  onAddSalesDailyLog: (log: Omit<SalesDailyLog, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onEditSalesDailyLog: (id: string, updated: Partial<SalesDailyLog>) => Promise<void>;
  onDeleteSalesDailyLog: (id: string) => Promise<void>;
  onAddCarrier?: (carrier: Omit<CarrierOrOwner, 'id'>) => Promise<void>;
  onAddSalesAgent?: (user: Omit<User, 'id'>) => Promise<any>;
  onRemoveTeamMember?: (userId: string) => Promise<any>;
  trainingScripts?: TrainingScriptConfig;
  onUpdateTrainingScripts?: (scripts: TrainingScriptConfig) => Promise<any>;
}

export default function SalesTeamHub({
  leads = [],
  salesDailyLogs = [],
  users = [],
  currentUser,
  carriers = [],
  onAddLead,
  onEditLead,
  onDeleteLead,
  onAddSalesDailyLog,
  onEditSalesDailyLog,
  onDeleteSalesDailyLog,
  onAddCarrier,
  onAddSalesAgent,
  onRemoveTeamMember,
  trainingScripts,
  onUpdateTrainingScripts
}: SalesTeamHubProps) {
  // Main Tab State: pipeline (CRM) | management (Executive Performance) | dailylogs (Outreach MC# Ranges) | admin_overview | training
  const [activeTab, setActiveTab] = useState<'pipeline' | 'management' | 'dailylogs' | 'admin_overview' | 'training'>('pipeline');
  
  // Pipeline View Mode (Kanban vs Table)
  const [pipelineView, setPipelineView] = useState<'kanban' | 'table'>('kanban');

  // Selected Lead for Detail Modal
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Quick Add Lead Modal
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);

  // Daily Work Log Modal State
  const [isDailyLogModalOpen, setIsDailyLogModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<SalesDailyLog | null>(null);

  // Admin Add Member Modal State
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [memberForm, setMemberForm] = useState<{
    name: string;
    username: string;
    password: string;
    role: 'SALES' | 'DISPATCHER';
    phone: string;
  }>({
    name: '',
    username: '',
    password: '',
    role: 'SALES',
    phone: ''
  });
  const [isSavingMember, setIsSavingMember] = useState(false);

  // Daily Work Log Form State
  const [logForm, setLogForm] = useState<{
    date: string;
    agentId: string;
    agentName: string;
    agentUsername: string;
    emailsSent: number;
    mcRangeStart: string;
    mcRangeEnd: string;
    mcRangeNote: string;
    callsMade: number;
    callsConnected: number;
    newLeadsHunted: number;
    followUpsDone: number;
    targetEmails: number;
    targetCalls: number;
    targetConversions: number;
    conversionsAchieved: number;
    attendanceStatus: 'PRESENT' | 'LATE' | 'HALF_DAY' | 'LEAVE' | 'WORK_FROM_HOME';
    notes: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    agentId: currentUser?.id || 'agent',
    agentName: currentUser?.name || 'Sales Representative',
    agentUsername: currentUser?.username || 'sales',
    emailsSent: 500,
    mcRangeStart: 'MC-1492000',
    mcRangeEnd: 'MC-1492650',
    mcRangeNote: 'Midwest Reefer & Dry Van carriers',
    callsMade: 40,
    callsConnected: 20,
    newLeadsHunted: 5,
    followUpsDone: 10,
    targetEmails: 500,
    targetCalls: 40,
    targetConversions: 2,
    conversionsAchieved: 1,
    attendanceStatus: 'PRESENT',
    notes: ''
  });

  // Top Ribbon Summary Metrics
  const metrics = useMemo(() => {
    const totalLeads = leads.length;
    const newLeads = leads.filter(l => normalizeLeadStatus(l.status) === 'NEW_LEAD').length;
    const inNegotiation = leads.filter(l => ['CALLED', 'INTERESTED', 'DOCS_REQUESTED', 'DOCS_RECEIVED'].includes(normalizeLeadStatus(l.status))).length;
    const onboardedCount = leads.filter(l => ['ONBOARDING', 'ACTIVE'].includes(normalizeLeadStatus(l.status))).length;
    
    // Total logged call history events + logged emails
    const totalCallsCount = leads.reduce((sum, l) => sum + (l.callHistory?.length || 0), 0) + 
      salesDailyLogs.reduce((sum, log) => sum + (log.callsMade || 0), 0);

    const totalEmailsCount = leads.reduce((sum, l) => sum + (l.emailHistory?.length || 0), 0) + 
      salesDailyLogs.reduce((sum, log) => sum + (log.emailsSent || 0), 0);

    return {
      totalLeads,
      newLeads,
      inNegotiation,
      onboardedCount,
      totalCallsCount,
      totalEmailsCount
    };
  }, [leads, salesDailyLogs]);

  // Handle Quick Status Update for Lead
  const handleUpdateLeadStatus = async (leadId: string, newStatus: SalesPipelineStatus) => {
    await onEditLead(leadId, {
      status: newStatus,
      lastContact: new Date().toISOString().split('T')[0],
      lastContactDate: new Date().toISOString().split('T')[0]
    });
  };

  // Handle Save Daily Log
  const handleSaveDailyLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLog) {
      await onEditSalesDailyLog(editingLog.id, logForm);
    } else {
      await onAddSalesDailyLog(logForm);
    }
    setIsDailyLogModalOpen(false);
    setEditingLog(null);
  };

  // Handle Admin Add Member
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name.trim() || !memberForm.username.trim() || !memberForm.password.trim()) {
      alert('Please fill out all required fields.');
      return;
    }
    if (!onAddSalesAgent) return;
    setIsSavingMember(true);
    try {
      await onAddSalesAgent({
        name: memberForm.name.trim(),
        username: memberForm.username.trim().toLowerCase(),
        password: memberForm.password.trim(),
        role: memberForm.role,
        phone: memberForm.phone.trim(),
        permissions: memberForm.role === 'SALES' ? {
          canAccessDashboard: false,
          canAccessInvoicing: false,
          canAccessDriverPayout: false,
          canAccessTransactionVault: false,
          canAccessCarrierCRM: false,
          canAccessCorporateReports: false,
          canAccessDailyAssignment: false,
          canAccessDriverIndex: false,
          onlyAssignedDrivers: false,
          canAccessLoadBoard: false,
          onlyAssignedLoads: false,
          canAccessTimeClock: true,
          canAccessTools: false,
          canAccessTeamChat: false,
          canAccessSalesCRM: true,
          canAccessTeamSeats: false,
          canAccessTraining: true,
          isFullAccess: false
        } : {
          canAccessDashboard: true,
          canAccessInvoicing: false,
          canAccessDriverPayout: false,
          canAccessTransactionVault: false,
          canAccessCarrierCRM: false,
          canAccessCorporateReports: false,
          canAccessDailyAssignment: true,
          canAccessDriverIndex: true,
          onlyAssignedDrivers: false,
          canAccessLoadBoard: true,
          onlyAssignedLoads: false,
          canAccessTimeClock: true,
          canAccessTools: true,
          canAccessTeamChat: true,
          canAccessSalesCRM: true,
          canAccessTeamSeats: false,
          canAccessTraining: true,
          isFullAccess: false
        }
      });
      setIsAddMemberModalOpen(false);
      setMemberForm({
        name: '',
        username: '',
        password: '',
        role: 'SALES',
        phone: ''
      });
    } catch (err: any) {
      console.error('Failed to add team member:', err);
      alert(err?.message || 'Failed to create team member.');
    } finally {
      setIsSavingMember(false);
    }
  };

  // Check if current user is Admin or Sales
  const isAdmin = currentUser?.role === 'ADMIN';
  const canAccessTraining = isAdmin || currentUser?.permissions?.canAccessTraining !== false;

  const visibleTabs = useMemo(() => {
    const tabs: { key: 'pipeline' | 'management' | 'dailylogs' | 'admin_overview' | 'training'; label: string; icon: any }[] = [
      { key: 'pipeline', label: 'Sales CRM Pipeline (8 Stages)', icon: Kanban },
      { key: 'management', label: 'Management Salesperson Analytics', icon: BarChart3 },
      { key: 'dailylogs', label: 'MC# Hunting Logs', icon: FileText }
    ];
    if (isAdmin) {
      tabs.push({ key: 'admin_overview', label: 'Admin Team Overview', icon: Users });
    }
    if (canAccessTraining) {
      tabs.push({ key: 'training', label: 'Sales Training Academy', icon: GraduationCap });
    }
    return tabs;
  }, [isAdmin, canAccessTraining]);

  return (
    <div id="sales_team_hub" className="space-y-6">
      
      {/* Top Header & Tab Navigation */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-2xl text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <Briefcase className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight">
                Carrier Sales CRM &amp; Pipeline Hub
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                8-stage pipeline workflow: <span className="font-bold text-indigo-600 dark:text-indigo-400">New Lead → Called → Interested → Docs Req → Docs Recv → Onboarding → Active → Lost</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setLogForm({
                date: new Date().toISOString().split('T')[0],
                agentId: currentUser?.id || 'agent',
                agentName: currentUser?.name || 'Sales Representative',
                agentUsername: currentUser?.username || 'sales',
                emailsSent: 500,
                mcRangeStart: 'MC-1492000',
                mcRangeEnd: 'MC-1492650',
                mcRangeNote: '',
                callsMade: 40,
                callsConnected: 20,
                newLeadsHunted: 5,
                followUpsDone: 10,
                targetEmails: 500,
                targetCalls: 40,
                targetConversions: 2,
                conversionsAchieved: 1,
                attendanceStatus: 'PRESENT',
                notes: ''
              });
              setEditingLog(null);
              setIsDailyLogModalOpen(true);
            }}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-2xl cursor-pointer flex items-center gap-2 transition-all"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Log MC# Range</span>
          </button>

          <button
            onClick={() => setIsAddLeadModalOpen(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-extrabold rounded-2xl shadow-md cursor-pointer flex items-center gap-2 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Carrier Lead</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Leads</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
              {metrics.totalLeads}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">carriers</span>
          </div>
          <span className="text-[10px] text-slate-400">All registered records</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">New Inbound Leads</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-sky-600 dark:text-sky-400 font-mono">
              {metrics.newLeads}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">leads</span>
          </div>
          <span className="text-[10px] text-sky-600 font-medium">Stage 1 awaiting call</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">In Active Pitch</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
              {metrics.inNegotiation}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">pitching</span>
          </div>
          <span className="text-[10px] text-indigo-600 font-medium">Calls &amp; doc packets</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Signed &amp; Onboarded</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {metrics.onboardedCount}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">fleets</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">Active dispatch service</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Logged Call Dials</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
              {metrics.totalCallsCount}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">calls</span>
          </div>
          <span className="text-[10px] text-slate-400">Carrier telephone outreach</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Logged Outreach Emails</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 font-mono">
              {metrics.totalEmailsCount.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">sent</span>
          </div>
          <span className="text-[10px] text-slate-400">Pitches &amp; follow-ups</span>
        </div>

      </div>

      {/* Main Hub Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {visibleTabs.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold cursor-pointer transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === 'pipeline' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPipelineView('kanban')}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border ${
                pipelineView === 'kanban'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
            >
              <Kanban className="h-4 w-4" />
              <span>Kanban Board</span>
            </button>
            <button
              onClick={() => setPipelineView('table')}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border ${
                pipelineView === 'table'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
            >
              <TableIcon className="h-4 w-4" />
              <span>Full Data Table</span>
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: 8-STAGE SALES CRM PIPELINE */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          {pipelineView === 'kanban' ? (
            <SalesPipelineBoard
              leads={leads}
              users={users}
              onSelectLead={(lead) => setSelectedLead(lead)}
              onUpdateLeadStatus={handleUpdateLeadStatus}
              onAddNewLead={() => setIsAddLeadModalOpen(true)}
            />
          ) : (
            <SalesLeadsTable
              leads={leads}
              users={users}
              onSelectLead={(lead) => setSelectedLead(lead)}
              onUpdateLeadStatus={handleUpdateLeadStatus}
              onDeleteLead={onDeleteLead}
              onAddNewLead={() => setIsAddLeadModalOpen(true)}
            />
          )}
        </div>
      )}

      {/* TAB 2: MANAGEMENT SALESPERSON PERFORMANCE */}
      {activeTab === 'management' && (
        <ManagementSalesDashboard
          leads={leads}
          salesDailyLogs={salesDailyLogs}
          users={users}
          onSelectLead={(lead) => setSelectedLead(lead)}
        />
      )}

      {/* TAB 3: DAILY WORK & MC# LOGS */}
      {activeTab === 'dailylogs' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white font-display">
                Carrier Outreach History &amp; MC# Hunting Logs
              </h2>
              <p className="text-xs text-slate-500">
                Daily records submitted by sales representatives detailing email outreach batches and phone conversions.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingLog(null);
                setIsDailyLogModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Log New Outreach Batch</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-mono text-[10.5px] uppercase border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 pl-5">Date</th>
                    <th className="p-3.5">Sales Representative</th>
                    <th className="p-3.5">MC# Range Hunted</th>
                    <th className="p-3.5">Emails Sent</th>
                    <th className="p-3.5">Calls Made / Connected</th>
                    <th className="p-3.5">New Leads Hunted</th>
                    <th className="p-3.5">Conversions</th>
                    <th className="p-3.5 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {salesDailyLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-400 italic">
                        No daily work logs submitted yet. Click "Log New Outreach Batch" above to record work.
                      </td>
                    </tr>
                  ) : (
                    salesDailyLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="p-3.5 pl-5 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {log.date}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                          {log.agentName}
                        </td>
                        <td className="p-3.5 font-mono">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                            {log.mcRangeStart} → {log.mcRangeEnd}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {log.emailsSent}
                        </td>
                        <td className="p-3.5 font-mono">
                          {log.callsMade} / <span className="text-emerald-600 dark:text-emerald-400 font-bold">{log.callsConnected}</span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                          +{log.newLeadsHunted}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {log.conversionsAchieved} / {log.targetConversions}
                        </td>
                        <td className="p-3.5 pr-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingLog(log);
                                setLogForm({
                                  date: log.date,
                                  agentId: log.agentId,
                                  agentName: log.agentName,
                                  agentUsername: log.agentUsername || '',
                                  emailsSent: log.emailsSent,
                                  mcRangeStart: log.mcRangeStart,
                                  mcRangeEnd: log.mcRangeEnd,
                                  mcRangeNote: log.mcRangeNote || '',
                                  callsMade: log.callsMade,
                                  callsConnected: log.callsConnected,
                                  newLeadsHunted: log.newLeadsHunted,
                                  followUpsDone: log.followUpsDone || 0,
                                  targetEmails: log.targetEmails,
                                  targetCalls: log.targetCalls,
                                  targetConversions: log.targetConversions,
                                  conversionsAchieved: log.conversionsAchieved,
                                  attendanceStatus: log.attendanceStatus || 'PRESENT',
                                  notes: log.notes || ''
                                });
                                setIsDailyLogModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg cursor-pointer"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(`Delete log for ${log.date} by ${log.agentName}?`)) {
                                  await onDeleteSalesDailyLog(log.id);
                                }
                              }}
                              className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ADMIN SALES OVERVIEW */}
      {activeTab === 'admin_overview' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white font-display">
                Sales &amp; Dispatch Team Administration
              </h2>
              <p className="text-xs text-slate-500">
                Manage user seats, credentials, and track lead distribution across sales representatives.
              </p>
            </div>
            <button
              onClick={() => setIsAddMemberModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-md"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Sales / Dispatch User</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.filter(u => u.role === 'SALES' || u.role === 'ADMIN' || u.role === 'DISPATCHER').map(u => {
              const repLeads = leads.filter(l => l.assignedAgentId === u.id || l.assignedSalesperson === u.name);
              const repConverted = repLeads.filter(l => ['ONBOARDING', 'ACTIVE'].includes(normalizeLeadStatus(l.status))).length;

              return (
                <div
                  key={u.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-sm font-mono border border-indigo-200 dark:border-indigo-800">
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white font-display">
                          {u.name}
                        </h3>
                        <span className="text-xs text-slate-400 font-mono">@{u.username}</span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      {u.role}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-center">
                      <span className="text-[10px] text-slate-400 block">Assigned Leads</span>
                      <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 font-mono">
                        {repLeads.length}
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-center">
                      <span className="text-[10px] text-slate-400 block">Onboarded Fleets</span>
                      <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                        {repConverted}
                      </span>
                    </div>
                  </div>

                  {onRemoveTeamMember && u.id !== currentUser?.id && u.role !== 'ADMIN' && (
                    <button
                      onClick={async () => {
                        if (confirm(`Remove sales member ${u.name}?`)) {
                          await onRemoveTeamMember(u.id);
                        }
                      }}
                      className="w-full py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                    >
                      Remove Seat
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: SALES TRAINING ACADEMY */}
      {activeTab === 'training' && (
        <SalesTrainingModule
          currentUser={currentUser}
          trainingScripts={trainingScripts}
          onUpdateTrainingScripts={onUpdateTrainingScripts}
        />
      )}

      {/* MODAL 1: LEAD DETAIL & CRM ACTION DRAWER */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          users={users}
          currentUser={currentUser}
          carriers={carriers}
          onClose={() => setSelectedLead(null)}
          onUpdateLead={onEditLead}
          onDeleteLead={onDeleteLead}
          onAddCarrier={onAddCarrier}
        />
      )}

      {/* MODAL 2: ADD NEW CARRIER LEAD */}
      {isAddLeadModalOpen && (
        <AddLeadModal
          users={users}
          currentUser={currentUser}
          onClose={() => setIsAddLeadModalOpen(false)}
          onAddLead={onAddLead}
        />
      )}

      {/* MODAL 3: DAILY MC# LOG SUBMISSION */}
      {isDailyLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white font-display flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>{editingLog ? 'Edit Daily Work Log' : 'Submit Carrier Outreach Log'}</span>
              </h3>
              <button
                onClick={() => setIsDailyLogModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDailyLog} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={logForm.date}
                    onChange={e => setLogForm({ ...logForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Sales Rep</label>
                  <select
                    value={logForm.agentId}
                    onChange={e => {
                      const sel = users.find(u => u.id === e.target.value);
                      setLogForm({
                        ...logForm,
                        agentId: e.target.value,
                        agentName: sel?.name || logForm.agentName,
                        agentUsername: sel?.username || logForm.agentUsername
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  >
                    {users.filter(u => u.role === 'SALES' || u.role === 'ADMIN').map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">MC# Range Start</label>
                  <input
                    type="text"
                    required
                    value={logForm.mcRangeStart}
                    onChange={e => setLogForm({ ...logForm, mcRangeStart: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">MC# Range End</label>
                  <input
                    type="text"
                    required
                    value={logForm.mcRangeEnd}
                    onChange={e => setLogForm({ ...logForm, mcRangeEnd: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Emails Sent</label>
                  <input
                    type="number"
                    value={logForm.emailsSent}
                    onChange={e => setLogForm({ ...logForm, emailsSent: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Calls Made</label>
                  <input
                    type="number"
                    value={logForm.callsMade}
                    onChange={e => setLogForm({ ...logForm, callsMade: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Connected</label>
                  <input
                    type="number"
                    value={logForm.callsConnected}
                    onChange={e => setLogForm({ ...logForm, callsConnected: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDailyLogModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-md cursor-pointer"
                >
                  {editingLog ? 'Save Changes' : 'Submit Daily Work Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADMIN ADD TEAM MEMBER */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white font-display flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-600" />
                <span>Add Team Member to Dashboard</span>
              </h3>
              <button
                onClick={() => setIsAddMemberModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Role Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMemberForm({ ...memberForm, role: 'SALES' })}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      memberForm.role === 'SALES'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>Sales Rep</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemberForm({ ...memberForm, role: 'DISPATCHER' })}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      memberForm.role === 'DISPATCHER'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <UserCheck className="h-4 w-4" />
                    <span>Dispatcher</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Miller"
                  value={memberForm.name}
                  onChange={e => setMemberForm({ ...memberForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Username / Login *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. jordan.sales"
                  value={memberForm.username}
                  onChange={e => setMemberForm({ ...memberForm, username: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Login Password *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pass123!"
                  value={memberForm.password}
                  onChange={e => setMemberForm({ ...memberForm, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="e.g. (555) 345-6789"
                  value={memberForm.phone}
                  onChange={e => setMemberForm({ ...memberForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingMember}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSavingMember ? 'Saving...' : 'Add Team Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
