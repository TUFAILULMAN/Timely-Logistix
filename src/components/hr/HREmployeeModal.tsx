/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Trash2, 
  Download, 
  User, 
  Phone, 
  MapPin, 
  Briefcase, 
  Building, 
  Calendar, 
  DollarSign, 
  Percent, 
  Award,
  AlertCircle,
  FileCheck,
  CreditCard,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Building2
} from 'lucide-react';
import { 
  HRStaffProfile, 
  HREmployeeStatus, 
  HRDocumentItem, 
  HRCompanyLetter,
  User as UserType 
} from '../../types';

interface HREmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: HRStaffProfile | null;
  onSave: (profile: Partial<HRStaffProfile>) => Promise<void> | void;
  managers: { id: string; name: string }[];
  allUsers: UserType[];
}

export default function HREmployeeModal({
  isOpen,
  onClose,
  profile,
  onSave,
  managers,
  allUsers
}: HREmployeeModalProps) {
  if (!isOpen) return null;

  const [activeSubTab, setActiveSubTab] = useState<'info' | 'idcard' | 'education' | 'letters' | 'salary' | 'bank'>('info');

  // Core Info
  const [name, setName] = useState(profile?.name || '');
  const [userId, setUserId] = useState(profile?.userId || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [profilePhoto, setProfilePhoto] = useState(profile?.profilePhoto || '');
  const [joiningDate, setJoiningDate] = useState(profile?.joiningDate || new Date().toISOString().split('T')[0]);
  const [dateOfBirth, setDateOfBirth] = useState(profile?.dateOfBirth || '');
  const [department, setDepartment] = useState(profile?.department || 'Dispatch Department');
  const [status, setStatus] = useState<HREmployeeStatus>(profile?.status || 'HIRED');
  const [managerName, setManagerName] = useState(profile?.managerName || (managers[0]?.name || 'Admin Management'));
  const [role, setRole] = useState(profile?.role || 'Dispatcher');
  const [emergencyContactName, setEmergencyContactName] = useState(profile?.emergencyContactName || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(profile?.emergencyContactPhone || '');
  const [bio, setBio] = useState(profile?.bio || '');

  // ID Card
  const [idCardNumber, setIdCardNumber] = useState(profile?.idCardNumber || '');
  const [idCardDoc, setIdCardDoc] = useState(profile?.idCardDoc || {
    name: '',
    base64: '',
    uploadedAt: '',
    frontBase64: '',
    backBase64: ''
  });

  // Resume & Educational Docs
  const [resumeName, setResumeName] = useState(profile?.resumeName || '');
  const [resumeBase64, setResumeBase64] = useState(profile?.resumeBase64 || '');
  const [educationalDocs, setEducationalDocs] = useState<HRDocumentItem[]>(profile?.educationalDocs || []);

  // Company Letters
  const [companyLetters, setCompanyLetters] = useState<HRCompanyLetter[]>(profile?.companyLetters || []);
  const [newLetterTitle, setNewLetterTitle] = useState('');
  const [newLetterType, setNewLetterType] = useState<HRCompanyLetter['letterType']>('OFFER_LETTER');
  const [newLetterDate, setNewLetterDate] = useState(new Date().toISOString().split('T')[0]);
  const [newLetterNotes, setNewLetterNotes] = useState('');

  // Salary Structure
  const [grossSalaryPKR, setGrossSalaryPKR] = useState<number>(
    profile?.salaryStructure?.grossSalaryPKR ?? profile?.baseSalaryPKR ?? 85000
  );
  const [bonusPercent, setBonusPercent] = useState<number>(
    profile?.salaryStructure?.bonusPercent ?? profile?.bonusPercent ?? 10
  );
  const [targetUSD, setTargetUSD] = useState<number>(
    profile?.salaryStructure?.targetUSD ?? profile?.targetUSD ?? 1500
  );
  const [allowancesPKR, setAllowancesPKR] = useState<number>(
    profile?.salaryStructure?.allowancesPKR ?? 5000
  );
  const [salaryNotes, setSalaryNotes] = useState(profile?.salaryStructure?.notes || '');

  // Bank Account Details
  const [bankName, setBankName] = useState(profile?.bankDetails?.bankName || '');
  const [accountTitle, setAccountTitle] = useState(profile?.bankDetails?.accountTitle || '');
  const [accountNumber, setAccountNumber] = useState(profile?.bankDetails?.accountNumber || '');
  const [ibanOrRouting, setIbanOrRouting] = useState(profile?.bankDetails?.ibanOrRouting || '');
  const [branchCodeOrSwift, setBranchCodeOrSwift] = useState(profile?.bankDetails?.branchCodeOrSwift || '');

  const [isSaving, setIsSaving] = useState(false);

  // Download helper
  const downloadFile = (base64: string, filename: string) => {
    const link = document.createElement('a');
    link.href = base64;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter staff name.');
      return;
    }
    setIsSaving(true);
    try {
      await onSave({
        name,
        userId: userId || undefined,
        role,
        email,
        phone,
        address,
        profilePhoto,
        joiningDate,
        dateOfBirth,
        department,
        status,
        managerName,
        emergencyContactName,
        emergencyContactPhone,
        bio,
        idCardNumber,
        idCardDoc,
        resumeName,
        resumeBase64,
        educationalDocs,
        companyLetters,
        salaryStructure: {
          grossSalaryPKR: Number(grossSalaryPKR) || 0,
          bonusPercent: Number(bonusPercent) || 0,
          targetUSD: Number(targetUSD) || 0,
          allowancesPKR: Number(allowancesPKR) || 0,
          notes: salaryNotes
        },
        baseSalaryPKR: Number(grossSalaryPKR) || 0,
        bonusPercent: Number(bonusPercent) || 0,
        targetUSD: Number(targetUSD) || 0,
        bankDetails: {
          bankName: bankName.trim(),
          accountTitle: accountTitle.trim() || name.trim(),
          accountNumber: accountNumber.trim(),
          ibanOrRouting: ibanOrRouting.trim(),
          branchCodeOrSwift: branchCodeOrSwift.trim()
        }
      });
      onClose();
    } catch (err: any) {
      alert(`Save failed: ${err.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                {profile ? `Edit HR Profile: ${profile.name}` : 'New Team Member Onboarding'}
              </h3>
              <p className="text-xs text-slate-400">
                Official HR Records, ID Card Scans, Educational Vault, Letters &amp; Salary Sync
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('info')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'info'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Profile &amp; Department</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('idcard')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'idcard'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>ID Card Copy</span>
            {(idCardDoc.frontBase64 || idCardDoc.base64) && (
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('education')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'education'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Resume &amp; Educational Docs ({educationalDocs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('letters')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'letters'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Company Letters ({companyLetters.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('salary')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'salary'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <DollarSign className="h-4 w-4" />
            <span>Salary Structure (Gross + Bonus)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('bank')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'bank'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Bank Account Details</span>
            {accountNumber && (
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            )}
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: Profile & Department */}
          {activeSubTab === 'info' && (
            <div className="space-y-5">
              {/* Photo & Core Header */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="relative group shrink-0">
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="Avatar"
                      className="h-20 w-20 rounded-2xl object-cover border-2 border-blue-500 shadow-md"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-900 text-white font-extrabold text-xl flex items-center justify-center uppercase shadow-md font-mono">
                      {(name || 'HR').slice(0, 2)}
                    </div>
                  )}
                  <label className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow cursor-pointer">
                    <Upload className="h-3.5 w-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 3 * 1024 * 1024) {
                          alert('Please select an image under 3MB');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => setProfilePhoto(reader.result as string);
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                </div>

                <div className="flex-1 space-y-2 w-full text-center sm:text-left">
                  <div className="text-sm font-bold text-slate-800">Employee Profile Picture</div>
                  <p className="text-xs text-slate-500">
                    Upload official headshot for ID badge and directory cards (Max 3MB JPG/PNG).
                  </p>
                  {profilePhoto && (
                    <button
                      type="button"
                      onClick={() => setProfilePhoto('')}
                      className="text-[11px] text-red-600 hover:underline font-semibold"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>

              {/* Input Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Asad Ullah Khan"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Linked Team Seat / User Account</label>
                  <select
                    value={userId}
                    onChange={(e) => {
                      setUserId(e.target.value);
                      const matched = allUsers.find(u => u.id === e.target.value);
                      if (matched) {
                        if (!email) setEmail(matched.username || '');
                        if (matched.phone && !phone) setPhone(matched.phone);
                        if (matched.role === 'SALES') setDepartment('Sales Department');
                        else if (matched.role === 'DISPATCHER') setDepartment('Dispatch Department');
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">-- No Account Linked (Custom Record) --</option>
                    {allUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} (@{u.username}) - {u.role}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                  <div className="relative">
                    <Phone className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+92 300 1234567"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Corporate / Personal Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="employee@freightlogistics.com"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address *</label>
                  <div className="relative">
                    <MapPin className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="House #, Street, Sector, City, Country"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Status and Department Section */}
                <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-2xl sm:col-span-2 space-y-4">
                  <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
                    <Building className="h-4 w-4 text-blue-600" />
                    <span>Department, Status &amp; Managerial Oversight</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="Dispatch Department">Dispatch Department</option>
                        <option value="Sales Department">Sales Department</option>
                        <option value="Accounts & Finance">Accounts &amp; Finance</option>
                        <option value="Operations & Safety">Operations &amp; Safety</option>
                        <option value="Management">Management &amp; Leadership</option>
                        <option value="Other">Other Department</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Employment Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as HREmployeeStatus)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-blue-700 focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="TRAINING">🟡 In Training</option>
                        <option value="HIRED">🟢 Hired for Work</option>
                        <option value="PROBATION">🟠 Probation Period</option>
                        <option value="ACTIVE">🔵 Active Regular</option>
                        <option value="TERMINATED">🔴 Terminated / Left</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Under Manager Name</label>
                      <input
                        type="text"
                        value={managerName}
                        onChange={(e) => setManagerName(e.target.value)}
                        placeholder="e.g. Operations Director"
                        list="managers_datalist"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <datalist id="managers_datalist">
                        {managers.map(m => (
                          <option key={m.id} value={m.name} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Joining Date (Tenure Anchor) *</label>
                  <div className="relative">
                    <Calendar className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="date"
                      required
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Important: 27-day annual leave law protocol is unlocked after 1 full year from this date.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Job Title / Role</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Senior Dispatcher / Sales Executive"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact (Name &amp; Phone)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      placeholder="Contact Name"
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                    <input
                      type="text"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      placeholder="Phone"
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Professional Bio &amp; Notes</label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Key strengths, shift notes, certifications..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ID Card Copy Upload */}
          {activeSubTab === 'idcard' && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    <span>Government ID Card / Passport Verification</span>
                  </h4>
                  <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded font-mono">
                    CNIC / DL / PASSPORT
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Upload high-resolution scans of front and back sides of the team member's official ID card.
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">National ID / Passport Number</label>
                  <input
                    type="text"
                    value={idCardNumber}
                    onChange={(e) => setIdCardNumber(e.target.value)}
                    placeholder="e.g. 61101-1234567-8 / USA DL #..."
                    className="w-full sm:w-1/2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* ID Card Front & Back Scans */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Front Side */}
                <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-white space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                      ID Card Front Side
                    </span>
                    <span className="text-[10px] text-slate-400 block">Contains photo and full name</span>
                  </div>

                  {idCardDoc.frontBase64 ? (
                    <div className="space-y-2">
                      <img
                        src={idCardDoc.frontBase64}
                        alt="ID Front"
                        className="w-full h-44 object-cover rounded-xl border border-slate-200 shadow-xs"
                      />
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => downloadFile(idCardDoc.frontBase64!, `${name || 'Staff'}_ID_Front.png`)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIdCardDoc(prev => ({ ...prev, frontBase64: '' }))}
                          className="px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-6 border border-slate-100 rounded-xl bg-slate-50 hover:bg-blue-50/50 hover:border-blue-200 transition-colors cursor-pointer text-center">
                      <Upload className="h-8 w-8 text-slate-400 mb-2" />
                      <span className="text-xs font-bold text-blue-600">Click to Upload Front Side</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, PDF up to 4MB</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            setIdCardDoc(prev => ({
                              ...prev,
                              frontBase64: reader.result as string,
                              uploadedAt: new Date().toISOString()
                            }));
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Back Side */}
                <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-white space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                      ID Card Back Side
                    </span>
                    <span className="text-[10px] text-slate-400 block">Contains address and family identification</span>
                  </div>

                  {idCardDoc.backBase64 ? (
                    <div className="space-y-2">
                      <img
                        src={idCardDoc.backBase64}
                        alt="ID Back"
                        className="w-full h-44 object-cover rounded-xl border border-slate-200 shadow-xs"
                      />
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => downloadFile(idCardDoc.backBase64!, `${name || 'Staff'}_ID_Back.png`)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIdCardDoc(prev => ({ ...prev, backBase64: '' }))}
                          className="px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-6 border border-slate-100 rounded-xl bg-slate-50 hover:bg-blue-50/50 hover:border-blue-200 transition-colors cursor-pointer text-center">
                      <Upload className="h-8 w-8 text-slate-400 mb-2" />
                      <span className="text-xs font-bold text-blue-600">Click to Upload Back Side</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, PDF up to 4MB</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            setIdCardDoc(prev => ({
                              ...prev,
                              backBase64: reader.result as string,
                              uploadedAt: new Date().toISOString()
                            }));
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Resume & Multiple Educational Docs */}
          {activeSubTab === 'education' && (
            <div className="space-y-5">
              
              {/* Primary Resume CV */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    <span>Master Resume / Curriculum Vitae</span>
                  </span>
                </div>

                {resumeBase64 ? (
                  <div className="p-3 bg-white border border-emerald-200 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                        <FileCheck className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <strong className="text-xs text-slate-800 block truncate">{resumeName || 'Resume.pdf'}</strong>
                        <span className="text-[10px] text-emerald-600 font-bold">Active Resume Uploaded</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => downloadFile(resumeBase64, resumeName || 'Resume.pdf')}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setResumeBase64('');
                          setResumeName('');
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="p-4 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center bg-white hover:bg-indigo-50/40 hover:border-indigo-300 transition-colors cursor-pointer">
                    <Upload className="h-6 w-6 text-slate-400 mb-1.5" />
                    <span className="text-xs font-bold text-indigo-600">Upload Master Resume Document</span>
                    <span className="text-[10px] text-slate-400">PDF, DOCX, DOC under 5MB</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          setResumeName(file.name);
                          setResumeBase64(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Educational Certificates Multiple Uploads */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-blue-600" />
                    <span>Degrees, Transcripts &amp; Educational Certificates</span>
                  </h4>
                  <label className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload Image / Scan</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        files.forEach(file => {
                          const reader = new FileReader();
                          reader.onload = () => {
                            const newDoc: HRDocumentItem = {
                              id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                              name: file.name,
                              type: 'DEGREE',
                              base64: reader.result as string,
                              uploadedAt: new Date().toISOString()
                            };
                            setEducationalDocs(prev => [...prev, newDoc]);
                          };
                          reader.readAsDataURL(file);
                        });
                      }}
                    />
                  </label>
                </div>

                {educationalDocs.length === 0 ? (
                  <div className="p-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center">
                    <GraduationCap className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-600">No educational documents uploaded yet</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Upload multiple scans for degrees, diplomas, matric/inter transcripts, training certificates.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {educationalDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-xs hover:border-blue-200 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {doc.base64.startsWith('data:image') ? (
                            <img
                              src={doc.base64}
                              alt={doc.name}
                              className="h-10 w-10 object-cover rounded-lg border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                              <FileText className="h-5 w-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-800 truncate block" title={doc.name}>
                              {doc.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(doc.uploadedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => downloadFile(doc.base64, doc.name)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg cursor-pointer"
                            title="Download document"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEducationalDocs(prev => prev.filter(d => d.id !== doc.id))}
                            className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg cursor-pointer"
                            title="Delete document"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Company Letters */}
          {activeSubTab === 'letters' && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span>Issue / Upload Official Company Letter</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Upload joining letters, offer letters, salary increment letters, and disciplinary warning letters.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Letter Type</label>
                    <select
                      value={newLetterType}
                      onChange={(e) => setNewLetterType(e.target.value as HRCompanyLetter['letterType'])}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="JOINING_LETTER">Joining Letter</option>
                      <option value="OFFER_LETTER">Offer Letter</option>
                      <option value="INCREMENT_LETTER">Salary Increment Letter</option>
                      <option value="WARNING_LETTER">Warning / Disciplinary Letter</option>
                      <option value="PROMOTION_LETTER">Promotion Letter</option>
                      <option value="OTHER">Other Company Letter</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Letter Title / Subject</label>
                    <input
                      type="text"
                      value={newLetterTitle}
                      onChange={(e) => setNewLetterTitle(e.target.value)}
                      placeholder="e.g. Official Appointment Letter"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Issue Date</label>
                    <input
                      type="date"
                      value={newLetterDate}
                      onChange={(e) => setNewLetterDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                  <input
                    type="text"
                    value={newLetterNotes}
                    onChange={(e) => setNewLetterNotes(e.target.value)}
                    placeholder="Optional reference notes, salary revision details, or warning remarks..."
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                  />

                  <label className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload Signed Letter (PDF/IMG)</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          const letterObj: HRCompanyLetter = {
                            id: `letter_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                            title: newLetterTitle || `${newLetterType.replace('_', ' ')}`,
                            letterType: newLetterType,
                            fileName: file.name,
                            base64: reader.result as string,
                            issuedDate: newLetterDate,
                            uploadedAt: new Date().toISOString(),
                            notes: newLetterNotes
                          };
                          setCompanyLetters(prev => [letterObj, ...prev]);
                          setNewLetterTitle('');
                          setNewLetterNotes('');
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Letter Vault List */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Company Letters Vault ({companyLetters.length})
                </div>

                {companyLetters.length === 0 ? (
                  <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                    No official letters attached yet. Upload joining, offer, increment, or warning letters above.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {companyLetters.map(letter => {
                      const isWarning = letter.letterType === 'WARNING_LETTER';
                      const isIncrement = letter.letterType === 'INCREMENT_LETTER';
                      return (
                        <div
                          key={letter.id}
                          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 shadow-xs ${
                            isWarning 
                              ? 'bg-rose-50/50 border-rose-200' 
                              : isIncrement 
                              ? 'bg-emerald-50/50 border-emerald-200' 
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-2 rounded-lg shrink-0 ${
                              isWarning ? 'bg-rose-100 text-rose-700' : 'bg-blue-50 text-blue-700'
                            }`}>
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <strong className="text-xs text-slate-800 font-bold truncate">
                                  {letter.title}
                                </strong>
                                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase font-mono ${
                                  isWarning
                                    ? 'bg-red-200 text-red-800'
                                    : isIncrement
                                    ? 'bg-emerald-200 text-emerald-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {letter.letterType.replace('_', ' ')}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Issued: {letter.issuedDate} &bull; File: {letter.fileName}
                                {letter.notes && <span className="italic ml-2">"{letter.notes}"</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => downloadFile(letter.base64, letter.fileName)}
                              className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span>Download</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setCompanyLetters(prev => prev.filter(l => l.id !== letter.id))}
                              className="p-1 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: Salary Structure (Gross + Bonus) */}
          {activeSubTab === 'salary' && (
            <div className="space-y-5">
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <span>Salary Structure &amp; Real-Time Seat Synchronization</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Gross base salary and bonus percentages entered here are <strong>automatically synchronized</strong> with 
                  Team Seats, Dispatcher quotas, and User profile accounts in real-time.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gross Fixed Monthly Salary (PKR) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-400">Rs.</span>
                    <input
                      type="number"
                      required
                      value={grossSalaryPKR}
                      onChange={(e) => setGrossSalaryPKR(Number(e.target.value))}
                      placeholder="85000"
                      className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Synced with Dispatcher baseSalaryPKR &amp; team seats
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Performance Bonus Commission (%) *
                  </label>
                  <div className="relative">
                    <Percent className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="number"
                      required
                      value={bonusPercent}
                      onChange={(e) => setBonusPercent(Number(e.target.value))}
                      placeholder="10"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Percentage bonus over target or gross margin
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Monthly Quota / Target (USD $)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      value={targetUSD}
                      onChange={(e) => setTargetUSD(Number(e.target.value))}
                      placeholder="1500"
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Monthly Allowances (PKR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-400">Rs.</span>
                    <input
                      type="number"
                      value={allowancesPKR}
                      onChange={(e) => setAllowancesPKR(Number(e.target.value))}
                      placeholder="5000"
                      className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Fuel, internet, or communications stipend
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Salary Revision Notes</label>
                  <textarea
                    rows={2}
                    value={salaryNotes}
                    onChange={(e) => setSalaryNotes(e.target.value)}
                    placeholder="e.g. Incremented after 6-month probation review. Includes 10% bonus over $1500 target."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Bank Account Details for Payroll & Payouts */}
          {activeSubTab === 'bank' && (
            <div className="space-y-5">
              <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <span>Official Member Bank Account Details</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Provide verified banking credentials for <strong>{name || 'this team member'}</strong> to ensure seamless monthly salary disbursements, performance commissions, and expense reimbursements.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bank Name *
                  </label>
                  <div className="relative">
                    <Building2 className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. Meezan Bank, Chase, HBL, Bank of America"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Full registered name of financial institution
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Account Title / Beneficiary Name *
                  </label>
                  <div className="relative">
                    <User className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={accountTitle}
                      onChange={(e) => setAccountTitle(e.target.value)}
                      placeholder={name || "e.g. Muhammad Ali"}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Must match the account holder name on the bank record
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Account Number *
                  </label>
                  <div className="relative">
                    <CreditCard className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="e.g. 01020304050607"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Primary domestic or direct deposit account number
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    IBAN / Routing Number
                  </label>
                  <input
                    type="text"
                    value={ibanOrRouting}
                    onChange={(e) => setIbanOrRouting(e.target.value)}
                    placeholder="e.g. PK36MEZN0001020304050607 or 021000021"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    24-character IBAN or 9-digit ABA Routing transit number
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Branch Code / SWIFT / BIC Code
                  </label>
                  <input
                    type="text"
                    value={branchCodeOrSwift}
                    onChange={(e) => setBranchCodeOrSwift(e.target.value)}
                    placeholder="e.g. MEZNPKKA or Branch Code 0102 (Blue Area Branch)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Required for wire transfers, international settlements, or branch-specific clearing
                  </span>
                </div>
              </div>

              {/* Preview card if details are filled */}
              {accountNumber && (
                <div className="p-4 bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl border border-blue-900 shadow-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono font-bold text-blue-400 tracking-wider">
                      Verified Member Payroll Account
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full font-bold">
                      Direct Deposit Enabled
                    </span>
                  </div>
                  <div className="text-sm font-bold tracking-wide">
                    {bankName || 'Bank Name Unspecified'}
                  </div>
                  <div className="font-mono text-xs text-blue-200 tracking-wider">
                    {accountNumber}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1 border-t border-white/10">
                    <span>Title: <strong>{accountTitle || name}</strong></span>
                    {ibanOrRouting && <span className="font-mono text-[10px]">IBAN: {ibanOrRouting}</span>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSaving ? 'Saving...' : profile ? 'Save HR Profile' : 'Complete Onboarding'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
