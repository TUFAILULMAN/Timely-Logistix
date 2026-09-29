/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Calendar, 
  FileSpreadsheet, 
  Search, 
  Building, 
  CreditCard, 
  GraduationCap, 
  FileText, 
  DollarSign, 
  Trash2, 
  Edit3, 
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  Briefcase,
  Building2
} from 'lucide-react';
import { 
  HRStaffProfile, 
  LeaveRequest, 
  SalarySlip, 
  User as UserType, 
  Dispatcher 
} from '../../types';
import HREmployeeModal from './HREmployeeModal';
import HRLeavesVault from './HRLeavesVault';
import HRSalarySlipsVault from './HRSalarySlipsVault';

interface HRManagementHubProps {
  hrProfiles: HRStaffProfile[];
  leaveRequests: LeaveRequest[];
  salarySlips: SalarySlip[];
  allUsers: UserType[];
  dispatchers: Dispatcher[];
  currentUser: UserType;
  isAdmin: boolean;
  onAddHRProfile: (profile: Partial<HRStaffProfile>) => Promise<void> | void;
  onEditHRProfile: (id: string, updates: Partial<HRStaffProfile>) => Promise<void> | void;
  onDeleteHRProfile: (id: string) => Promise<void> | void;
  onAddLeaveRequest: (req: Omit<LeaveRequest, 'id' | 'appliedAt'>) => Promise<void> | void;
  onUpdateLeaveRequest: (id: string, updates: Partial<LeaveRequest>) => Promise<void> | void;
  onDeleteLeaveRequest?: (id: string) => Promise<void> | void;
  onAddSalarySlip: (slip: Omit<SalarySlip, 'id' | 'createdAt'>) => Promise<void> | void;
  onUpdateSalarySlip?: (id: string, updates: Partial<SalarySlip>) => Promise<void> | void;
  onDeleteSalarySlip?: (id: string) => Promise<void> | void;
}

export default function HRManagementHub({
  hrProfiles,
  leaveRequests,
  salarySlips,
  allUsers,
  dispatchers,
  currentUser,
  isAdmin,
  onAddHRProfile,
  onEditHRProfile,
  onDeleteHRProfile,
  onAddLeaveRequest,
  onUpdateLeaveRequest,
  onDeleteLeaveRequest,
  onAddSalarySlip,
  onUpdateSalarySlip,
  onDeleteSalarySlip
}: HRManagementHubProps) {
  const [activeTab, setActiveTab] = useState<'directory' | 'leaves' | 'payroll'>('directory');
  const [selectedProfileForModal, setSelectedProfileForModal] = useState<HRStaffProfile | null>(null);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Available managers list
  const managers = useMemo(() => {
    return allUsers
      .filter(u => u.role === 'ADMIN' || u.role === 'MANAGER')
      .map(u => ({ id: u.id, name: u.name }));
  }, [allUsers]);

  // Filtered staff profiles
  const filteredProfiles = useMemo(() => {
    return hrProfiles.filter(p => {
      if (selectedDeptFilter !== 'ALL' && p.department !== selectedDeptFilter) return false;
      if (selectedStatusFilter !== 'ALL' && p.status !== selectedStatusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          (p.phone && p.phone.toLowerCase().includes(q)) ||
          (p.email && p.email.toLowerCase().includes(q)) ||
          p.department.toLowerCase().includes(q) ||
          p.role.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [hrProfiles, selectedDeptFilter, selectedStatusFilter, searchQuery]);

  const handleSaveProfile = async (profileData: Partial<HRStaffProfile>) => {
    if (selectedProfileForModal) {
      await onEditHRProfile(selectedProfileForModal.id, profileData);
    } else {
      await onAddHRProfile(profileData);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'TRAINING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase font-mono bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="h-3 w-3" />
            <span>Training</span>
          </span>
        );
      case 'HIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase font-mono bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            <span>Hired for Work</span>
          </span>
        );
      case 'PROBATION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase font-mono bg-indigo-100 text-indigo-800 border border-indigo-200">
            <AlertCircle className="h-3 w-3" />
            <span>Probation</span>
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase font-mono bg-blue-100 text-blue-800 border border-blue-200">
            <CheckCircle2 className="h-3 w-3" />
            <span>Active Regular</span>
          </span>
        );
      case 'TERMINATED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase font-mono bg-rose-100 text-rose-800 border border-rose-200">
            <span>Left / Terminated</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase font-mono bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  // Helper to calculate days of tenure
  const calculateTenureDays = (joinDateStr?: string) => {
    if (!joinDateStr) return 0;
    const diff = Date.now() - new Date(joinDateStr).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl shadow-md">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                HR Management &amp; Team Registry
              </h2>
              <span className="text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                Admin Only
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ID Cards, Educational Vault, Letters, Salary Structures &amp; 27-Day Labour Law Protocol
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setSelectedProfileForModal(null);
              setIsEmployeeModalOpen(true);
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 cursor-pointer transition-all"
          >
            <UserPlus className="h-4 w-4" />
            <span>Onboard Team Member</span>
          </button>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('directory')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'directory'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Staff Directory &amp; Records ({hrProfiles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('leaves')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'leaves'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>27-Day Leave Protocol ({leaveRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payroll')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'payroll'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Monthly Salary Slips ({salarySlips.length})</span>
        </button>
      </div>

      {/* TAB 1: Staff Directory & Files */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          
          {/* Filtering Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative w-full max-w-xs">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search staff, phone, email, dept..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="ALL">All Departments</option>
                <option value="Dispatch Department">Dispatch Department</option>
                <option value="Sales Department">Sales Department</option>
                <option value="Accounts & Finance">Accounts &amp; Finance</option>
                <option value="Operations & Safety">Operations &amp; Safety</option>
                <option value="Management">Management</option>
              </select>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="TRAINING">Training</option>
                <option value="HIRED">Hired for Work</option>
                <option value="PROBATION">Probation</option>
                <option value="ACTIVE">Active Regular</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>

            <div className="text-xs font-mono font-bold text-slate-500">
              {filteredProfiles.length} Team Members Registered
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProfiles.length === 0 ? (
              <div className="col-span-full p-12 bg-white rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
                <Users className="h-10 w-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">No team member profiles found</h4>
                <p className="text-xs text-slate-400">
                  Onboard a new member to manage ID card copy, educational files, company letters, and salary structure.
                </p>
                <button
                  onClick={() => {
                    setSelectedProfileForModal(null);
                    setIsEmployeeModalOpen(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Onboard Team Member
                </button>
              </div>
            ) : (
              filteredProfiles.map((p) => {
                const tenure = calculateTenureDays(p.joiningDate);
                const isTenureEligible = tenure >= 365;
                const grossPKR = p.salaryStructure?.grossSalaryPKR || p.baseSalaryPKR || 0;
                const bonus = p.salaryStructure?.bonusPercent || p.bonusPercent || 0;
                const eduCount = p.educationalDocs?.length || 0;
                const lettersCount = p.companyLetters?.length || 0;
                const hasID = !!(p.idCardDoc?.frontBase64 || p.idCardDoc?.base64);

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Top Row: Photo, Name, Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {p.profilePhoto ? (
                            <img
                              src={p.profilePhoto}
                              alt={p.name}
                              className="h-12 w-12 rounded-xl object-cover border border-blue-500/30 shadow-xs"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-900 text-white font-extrabold text-sm flex items-center justify-center font-mono shadow-xs uppercase">
                              {p.name.slice(0, 2)}
                            </div>
                          )}
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 leading-tight">{p.name}</h4>
                            <span className="text-[10px] text-slate-500 font-medium block">{p.role}</span>
                            <div className="text-[10px] text-indigo-600 font-mono font-bold mt-0.5">
                              {p.department}
                            </div>
                          </div>
                        </div>

                        <div>{getStatusBadge(p.status)}</div>
                      </div>

                      {/* Manager Oversight & Tenure */}
                      <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-[9px] uppercase font-mono text-slate-400 block font-bold">Under Manager</span>
                          <span className="font-semibold text-slate-800 truncate block">
                            {p.managerName || 'Admin Management'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-mono text-slate-400 block font-bold">Tenure (1-Yr Rule)</span>
                          <span className={`font-mono font-bold text-[10px] ${
                            isTenureEligible ? 'text-emerald-700' : 'text-amber-700'
                          }`}>
                            {tenure} Days ({isTenureEligible ? 'Eligible' : 'Probation'})
                          </span>
                        </div>
                      </div>

                      {/* Contact & Address */}
                      <div className="mt-2 text-[11px] space-y-1 text-slate-600">
                        {p.phone && <div>📞 {p.phone}</div>}
                        {p.address && <div className="truncate text-slate-500">📍 {p.address}</div>}
                      </div>

                      {/* Salary Structure Synced Block */}
                      <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs font-mono">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">Gross Salary</span>
                          <span className="font-bold text-slate-800">Rs. {grossPKR.toLocaleString()}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">Bonus / Comm.</span>
                          <span className="font-bold text-emerald-600">{bonus}% Target</span>
                        </div>
                      </div>

                      {/* Bank Account Details Badge */}
                      {p.bankDetails?.accountNumber ? (
                        <div className="mt-2 text-[11px] p-2 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-emerald-950 font-bold min-w-0">
                            <Building2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate text-[10.5px]">{p.bankDetails.bankName || 'Bank'}:</span>
                            <span className="font-mono text-[10.5px] text-emerald-800 font-semibold">{p.bankDetails.accountNumber}</span>
                          </div>
                          <span className="text-[9px] uppercase font-mono font-bold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                            Bank Set
                          </span>
                        </div>
                      ) : (
                        <div className="mt-2 text-[11px] p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="text-[10px] font-medium">Bank details not set</span>
                          </div>
                          <span className="text-[9px] uppercase font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                            Pending
                          </span>
                        </div>
                      )}

                      {/* Uploaded Documents Pill Counter */}
                      <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold flex items-center gap-1 ${
                          hasID ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400'
                        }`}>
                          <CreditCard className="h-3 w-3" />
                          <span>ID Card: {hasID ? 'Verified' : 'Missing'}</span>
                        </span>

                        <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          <span>{eduCount} Edu Docs</span>
                        </span>

                        <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          <span>{lettersCount} Letters</span>
                        </span>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setSelectedProfileForModal(p);
                          setIsEmployeeModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Manage Vault &amp; Files</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            if (confirm(`Remove HR profile for ${p.name}?`)) {
                              onDeleteHRProfile(p.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                          title="Delete HR profile"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Leaves & 27-Day Protocol */}
      {activeTab === 'leaves' && (
        <HRLeavesVault
          leaveRequests={leaveRequests}
          hrProfiles={hrProfiles}
          currentUser={currentUser}
          isAdmin={isAdmin}
          onAddLeaveRequest={onAddLeaveRequest}
          onUpdateLeaveRequest={onUpdateLeaveRequest}
          onDeleteLeaveRequest={onDeleteLeaveRequest}
        />
      )}

      {/* TAB 3: Salary Slips Vault */}
      {activeTab === 'payroll' && (
        <HRSalarySlipsVault
          salarySlips={salarySlips}
          hrProfiles={hrProfiles}
          currentUser={currentUser}
          isAdmin={isAdmin}
          onAddSalarySlip={onAddSalarySlip}
          onUpdateSalarySlip={onUpdateSalarySlip}
          onDeleteSalarySlip={onDeleteSalarySlip}
        />
      )}

      {/* EMPLOYEE MODAL (Onboard / Edit / Upload ID & Docs) */}
      <HREmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => {
          setIsEmployeeModalOpen(false);
          setSelectedProfileForModal(null);
        }}
        profile={selectedProfileForModal}
        onSave={handleSaveProfile}
        managers={managers}
        allUsers={allUsers}
      />

    </div>
  );
}
