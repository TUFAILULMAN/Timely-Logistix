/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Plus, 
  FileText, 
  Download, 
  ShieldCheck, 
  Search,
  Filter,
  UserCheck,
  CalendarCheck,
  HeartPulse,
  Palmtree,
  Trash2
} from 'lucide-react';
import { 
  LeaveRequest, 
  HRStaffProfile, 
  User as UserType 
} from '../../types';

interface HRLeavesVaultProps {
  leaveRequests: LeaveRequest[];
  hrProfiles: HRStaffProfile[];
  currentUser: UserType;
  isAdmin: boolean;
  onAddLeaveRequest: (req: Omit<LeaveRequest, 'id' | 'appliedAt'>) => Promise<void> | void;
  onUpdateLeaveRequest: (id: string, updates: Partial<LeaveRequest>) => Promise<void> | void;
  onDeleteLeaveRequest?: (id: string) => Promise<void> | void;
}

export default function HRLeavesVault({
  leaveRequests,
  hrProfiles,
  currentUser,
  isAdmin,
  onAddLeaveRequest,
  onUpdateLeaveRequest,
  onDeleteLeaveRequest
}: HRLeavesVaultProps) {
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'ALL' | 'VACATION' | 'MEDICAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [targetEmployeeId, setTargetEmployeeId] = useState<string>(() => {
    const matchedProfile = hrProfiles.find(p => p.userId === currentUser.id || p.name.toLowerCase() === currentUser.name.toLowerCase());
    return matchedProfile?.id || (hrProfiles[0]?.id || '');
  });
  const [leaveType, setLeaveType] = useState<'VACATION' | 'MEDICAL'>('VACATION');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [attachmentBase64, setAttachmentBase64] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Review Modal State
  const [reviewingLeave, setReviewingLeave] = useState<LeaveRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // Calculate target employee profile & tenure
  const selectedProfile = useMemo(() => {
    return hrProfiles.find(p => p.id === targetEmployeeId);
  }, [hrProfiles, targetEmployeeId]);

  const tenureDetails = useMemo(() => {
    if (!selectedProfile?.joiningDate) {
      return { days: 0, isEligible: false, joiningDateFormatted: 'Not Specified' };
    }
    const joinDate = new Date(selectedProfile.joiningDate);
    const now = new Date();
    const diffMs = now.getTime() - joinDate.getTime();
    const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    const isEligible = days >= 365;
    return {
      days,
      isEligible,
      joiningDateFormatted: joinDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
  }, [selectedProfile]);

  // Days calculation
  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
    return days > 0 ? days : 1;
  }, [startDate, endDate]);

  // Quota breakdown per employee (Total standard 27 days: 14 Vacation, 13 Medical)
  const quotaStats = useMemo(() => {
    if (!selectedProfile) return { vacationUsed: 0, medicalUsed: 0, totalUsed: 0 };
    const approved = leaveRequests.filter(
      l => (l.employeeId === selectedProfile.id || l.employeeName === selectedProfile.name) && l.status === 'APPROVED'
    );
    const vacationUsed = approved.filter(l => l.leaveType === 'VACATION').reduce((acc, curr) => acc + curr.totalDays, 0);
    const medicalUsed = approved.filter(l => l.leaveType === 'MEDICAL').reduce((acc, curr) => acc + curr.totalDays, 0);
    return {
      vacationUsed,
      medicalUsed,
      totalUsed: vacationUsed + medicalUsed
    };
  }, [selectedProfile, leaveRequests]);

  const filteredRequests = useMemo(() => {
    return leaveRequests.filter(req => {
      if (selectedStatusFilter !== 'ALL' && req.status !== selectedStatusFilter) return false;
      if (selectedTypeFilter !== 'ALL' && req.leaveType !== selectedTypeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          req.employeeName.toLowerCase().includes(q) ||
          req.department.toLowerCase().includes(q) ||
          req.reason.toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
  }, [leaveRequests, selectedStatusFilter, selectedTypeFilter, searchQuery]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) {
      alert('Please select an employee profile.');
      return;
    }
    if (!reason.trim()) {
      alert('Please enter the reason for leave.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onAddLeaveRequest({
        employeeId: selectedProfile.id,
        employeeName: selectedProfile.name,
        employeeEmail: selectedProfile.email,
        department: selectedProfile.department || 'General',
        leaveType,
        startDate,
        endDate,
        totalDays,
        reason,
        attachmentBase64: attachmentBase64 || undefined,
        attachmentName: attachmentName || undefined,
        status: 'PENDING',
        joiningDateAtApplication: selectedProfile.joiningDate,
        isEligibleTenure: tenureDetails.isEligible,
        tenureDays: tenureDetails.days
      });
      setIsApplyModalOpen(false);
      setReason('');
      setAttachmentBase64('');
      setAttachmentName('');
    } catch (err: any) {
      alert(`Application failed: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewAction = async (status: 'APPROVED' | 'REJECTED') => {
    if (!reviewingLeave) return;
    try {
      await onUpdateLeaveRequest(reviewingLeave.id, {
        status,
        reviewNotes: reviewNotes.trim() || undefined,
        reviewedBy: currentUser.name,
        reviewedAt: new Date().toISOString()
      });
      setReviewingLeave(null);
      setReviewNotes('');
    } catch (err: any) {
      alert(`Review failed: ${err.message || err}`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: International Labour Law Protocol (27 Total Days: 14 Vacation + 13 Medical) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-5 rounded-2xl border border-indigo-900/50 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-400/30">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-extrabold tracking-wide uppercase">
                International Labour Law 27-Day Statutory Leave Protocol
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Standard quota: <strong>14 Days Annual Vacation Leave</strong> + <strong>13 Days Medical / Sick Leave</strong> (27 Days Total).
              Under official protocol, employees are entitled to full statutory paid leave <strong>after 1 year of continuous service from joining date</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsApplyModalOpen(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center gap-2 cursor-pointer transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Apply for Leave</span>
            </button>
          </div>
        </div>

        {/* Quota Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-indigo-900/60">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-lg">
              <Palmtree className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono text-slate-400 font-bold">Annual Vacation Quota</div>
              <div className="text-sm font-extrabold text-white">14 Days / Year</div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 bg-rose-500/20 text-rose-300 rounded-lg">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono text-slate-400 font-bold">Annual Medical Quota</div>
              <div className="text-sm font-extrabold text-white">13 Days / Year</div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-300 rounded-lg">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono text-slate-400 font-bold">Eligibility Tenure Anchor</div>
              <div className="text-sm font-extrabold text-white">365 Days (1 Full Year)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-xs">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by staff name, reason..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="VACATION">Vacation (14d)</option>
            <option value="MEDICAL">Medical (13d)</option>
          </select>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="text-xs font-mono font-bold text-slate-500">
          Showing {filteredRequests.length} of {leaveRequests.length} requests
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Dates &amp; Duration</th>
                <th className="py-3 px-4">1-Yr Tenure Protocol</th>
                <th className="py-3 px-4">Reason &amp; Attachment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No leave requests found. Click "Apply for Leave" above.
                  </td>
                </tr>
              ) : (
                filteredRequests.map(req => {
                  const isVacation = req.leaveType === 'VACATION';
                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Employee */}
                      <td className="py-3 px-4">
                        <strong className="font-bold text-slate-800 block text-xs">{req.employeeName}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">{req.department}</span>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold font-mono uppercase ${
                          isVacation 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {isVacation ? <Palmtree className="h-3 w-3" /> : <HeartPulse className="h-3 w-3" />}
                          <span>{req.leaveType}</span>
                        </span>
                      </td>

                      {/* Dates */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-slate-700">
                          {req.startDate} <span className="text-slate-400">to</span> {req.endDate}
                        </div>
                        <span className="text-[10px] font-bold text-blue-600 font-mono">
                          {req.totalDays} {req.totalDays === 1 ? 'Day' : 'Days'}
                        </span>
                      </td>

                      {/* Tenure Protocol Check */}
                      <td className="py-3 px-4">
                        {req.isEligibleTenure ? (
                          <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>1-Yr Protocol Met ({req.tenureDays || 365}d)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-amber-600 font-bold text-[11px]" title="Under 1-year tenure protocol. Standard 27-day quota unlocks after 365 days. Requires Admin approval.">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            <span>Probation / &lt;1 Year ({req.tenureDays || 0}d)</span>
                          </div>
                        )}
                      </td>

                      {/* Reason */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-slate-700 truncate" title={req.reason}>
                          {req.reason}
                        </div>
                        {req.attachmentBase64 && (
                          <a
                            href={req.attachmentBase64}
                            download={req.attachmentName || 'Proof_Document'}
                            className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline font-bold mt-0.5"
                          >
                            <FileText className="h-3 w-3" />
                            <span>{req.attachmentName || 'Attachment'}</span>
                          </a>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase font-mono ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800 animate-pulse'
                        }`}>
                          {req.status === 'APPROVED' && <CheckCircle className="h-3 w-3" />}
                          {req.status === 'REJECTED' && <XCircle className="h-3 w-3" />}
                          {req.status === 'PENDING' && <Clock className="h-3 w-3" />}
                          <span>{req.status}</span>
                        </span>
                        {req.reviewedBy && (
                          <span className="block text-[9px] text-slate-400 mt-0.5">
                            By {req.reviewedBy}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isAdmin && req.status === 'PENDING' && (
                            <button
                              onClick={() => {
                                setReviewingLeave(req);
                                setReviewNotes('');
                              }}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                            >
                              Review
                            </button>
                          )}
                          {isAdmin && req.status !== 'PENDING' && (
                            <button
                              onClick={() => {
                                setReviewingLeave(req);
                                setReviewNotes(req.reviewNotes || '');
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-semibold cursor-pointer"
                            >
                              Details
                            </button>
                          )}
                          {isAdmin && onDeleteLeaveRequest && (
                            <button
                              onClick={() => {
                                if (confirm('Delete this leave request record?')) {
                                  onDeleteLeaveRequest(req.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-red-500 rounded cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
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

      {/* APPLY MODAL */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Calendar className="h-5 w-5 text-blue-400" />
                <h3 className="text-sm font-extrabold">Apply for Leave (27-Day Standard Protocol)</h3>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleApply} className="p-6 space-y-4 text-xs">
              
              {/* Employee Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Team Member Profile *</label>
                <select
                  value={targetEmployeeId}
                  onChange={(e) => setTargetEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {hrProfiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {p.department} ({p.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* 1-Year Tenure Verification Indicator */}
              <div className={`p-3.5 rounded-xl border ${
                tenureDetails.isEligible 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <div className="flex items-center gap-1.5">
                    {tenureDetails.isEligible ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    )}
                    <span>
                      {tenureDetails.isEligible 
                        ? '1-Year Tenure Protocol Satisfied' 
                        : 'Under 1-Year Tenure Protocol (First Year)'}
                    </span>
                  </div>
                  <span className="font-mono text-[10px]">
                    Joined: {tenureDetails.joiningDateFormatted} ({tenureDetails.days} days)
                  </span>
                </div>
                <p className="text-[11px] mt-1 text-slate-600 leading-normal">
                  {tenureDetails.isEligible ? (
                    `Eligible for full 27-day annual statutory leave quota (14 Vacation + 13 Medical). Remaining: ${14 - quotaStats.vacationUsed} Vacation, ${13 - quotaStats.medicalUsed} Medical.`
                  ) : (
                    'Under international labour law protocols, statutory 27-day annual paid leaves unlock after 1 full year from joining date. Leaves applied during this period require special administrative sanction.'
                  )}
                </p>
              </div>

              {/* Leave Type */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLeaveType('VACATION')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    leaveType === 'VACATION'
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Palmtree className="h-4 w-4 text-emerald-600" />
                    <span>Vacation Leave</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    14 Days Annual Statutory Quota
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setLeaveType('MEDICAL')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    leaveType === 'MEDICAL'
                      ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <HeartPulse className="h-4 w-4 text-rose-600" />
                    <span>Medical / Sick Leave</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    13 Days Annual Statutory Quota
                  </span>
                </button>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="text-right text-[11px] font-mono font-bold text-blue-600">
                Total Days Requested: {totalDays} {totalDays === 1 ? 'Day' : 'Days'}
              </div>

              {/* Reason */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Leave *</label>
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain reason for vacation or medical absence..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Proof / Document attachment */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Medical Certificate / Proof (Optional)</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setAttachmentName(file.name);
                    const reader = new FileReader();
                    reader.onload = () => setAttachmentBase64(reader.result as string);
                    reader.readAsDataURL(file);
                  }}
                  className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* REVIEW MODAL (Admin Only) */}
      {reviewingLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-extrabold">Review Leave Request: {reviewingLeave.employeeName}</h3>
              <button onClick={() => setReviewingLeave(null)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <div className="text-slate-500 font-medium">Requested Leave:</div>
                <div className="font-bold text-slate-800 text-sm">
                  {reviewingLeave.leaveType} Leave &bull; {reviewingLeave.totalDays} Days ({reviewingLeave.startDate} to {reviewingLeave.endDate})
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="text-[10px] uppercase font-mono text-slate-400 font-bold">1-Year Tenure Protocol Status:</div>
                <div className={`font-bold ${reviewingLeave.isEligibleTenure ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {reviewingLeave.isEligibleTenure 
                    ? `Eligible (Tenure: ${reviewingLeave.tenureDays || 365}+ days)` 
                    : `Probation / Under 1-Year Tenure (${reviewingLeave.tenureDays || 0} days from joining date)`}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-slate-500 font-medium">Reason Submitted:</div>
                <div className="p-3 bg-slate-50 rounded-xl text-slate-700 font-medium leading-relaxed">
                  "{reviewingLeave.reason}"
                </div>
              </div>

              {reviewingLeave.attachmentBase64 && (
                <div>
                  <a
                    href={reviewingLeave.attachmentBase64}
                    download={reviewingLeave.attachmentName || 'Doctor_Certificate'}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-bold hover:bg-blue-100"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Attached Medical / Supporting Document</span>
                  </a>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Administrative Notes / Feedback</label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g. Approved with pay / Approved as unpaid leave under 1-yr probation rule..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setReviewingLeave(null)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Close
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleReviewAction('REJECTED')}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Reject</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReviewAction('APPROVED')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Approve Leave</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
