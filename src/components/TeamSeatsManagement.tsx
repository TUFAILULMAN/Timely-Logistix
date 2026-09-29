/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Key, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  Search, 
  Sparkles, 
  Briefcase, 
  AlertCircle,
  X,
  CheckCircle2,
  Lock,
  UserCheck,
  TrendingUp,
  FileSpreadsheet,
  Coins,
  Receipt,
  Folder,
  CalendarRange,
  FolderHeart,
  Clock,
  Shield,
  SlidersHorizontal,
  Layers,
  Zap,
  LayoutDashboard,
  Sliders,
  MessageSquare,
  GraduationCap
} from 'lucide-react';
import { User, Dispatcher, Driver, UserRole, SeatPermissions } from '../types';

interface TeamSeatsManagementProps {
  currentUser: User;
  allUsers: User[];
  dispatchers: Dispatcher[];
  drivers: Driver[];
  onAddDispatcher: (disp: Omit<Dispatcher, 'id' | 'assignedDriverIds'> & { password?: string; permissions?: SeatPermissions }) => void;
  onEditDispatcher: (id: string, updated: Partial<Dispatcher>) => void;
  onDeleteDispatcher: (id: string) => void;
  onAddSalesAgent?: (user: Omit<User, 'id'>) => void;
  onEditUser?: (id: string, updated: Partial<User>) => void;
  onRemoveTeamMember?: (userId: string) => void;
  onChangePassword?: (userId: string, newPass: string) => Promise<{ success: boolean }>;
}

const DEFAULT_ADMIN_PERMISSIONS: SeatPermissions = {
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
  canAccessTraining: true,
  isFullAccess: true
};

const DEFAULT_DISPATCHER_PERMISSIONS: SeatPermissions = {
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
  canAccessTraining: true,
  isFullAccess: false
};

const DEFAULT_SALES_PERMISSIONS: SeatPermissions = {
  canAccessDashboard: true,
  canAccessInvoicing: false,
  canAccessDriverPayout: false,
  canAccessTransactionVault: false,
  canAccessCarrierCRM: false,
  canAccessCorporateReports: false,
  canAccessDailyAssignment: false,
  canAccessDriverIndex: false,
  onlyAssignedDrivers: true,
  canAccessLoadBoard: false,
  onlyAssignedLoads: true,
  canAccessTimeClock: true,
  canAccessTools: true,
  canAccessTeamChat: false,
  canAccessSalesCRM: true,
  canAccessTeamSeats: false,
  canAccessTraining: true,
  isFullAccess: false
};

export default function TeamSeatsManagement({
  currentUser,
  allUsers,
  dispatchers,
  drivers,
  onAddDispatcher,
  onEditDispatcher,
  onDeleteDispatcher,
  onAddSalesAgent,
  onEditUser,
  onRemoveTeamMember,
  onChangePassword
}: TeamSeatsManagementProps) {
  const isAdmin = currentUser.role === 'ADMIN';
  const isAdminOrManager = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER' || currentUser.permissions?.canAccessTeamSeats;

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'DISPATCHER' | 'SALES' | 'MANAGER' | 'ADMIN'>('ALL');

  // Reveal password states: map of userId -> boolean
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // Copy success notification
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals state
  const [isAssigningSeat, setIsAssigningSeat] = useState(false);
  const [editingSeatUser, setEditingSeatUser] = useState<User | null>(null);
  const [revokingSeatUser, setRevokingSeatUser] = useState<User | null>(null);
  const [resettingPasswordUser, setResettingPasswordUser] = useState<User | null>(null);

  // New Seat Form state
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('DISPATCHER');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [commissionPercent, setCommissionPercent] = useState(8);
  const [baseSalaryPKR, setBaseSalaryPKR] = useState(84000);
  const [targetUSD, setTargetUSD] = useState(1200);
  const [bonusPercent, setBonusPercent] = useState(10);
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<SeatPermissions>(DEFAULT_DISPATCHER_PERMISSIONS);

  // Edit Seat Form state
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('DISPATCHER');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editProfilePhoto, setEditProfilePhoto] = useState<string>('');
  const [editCommissionPercent, setEditCommissionPercent] = useState(8);
  const [editBaseSalaryPKR, setEditBaseSalaryPKR] = useState(84000);
  const [editTargetUSD, setEditTargetUSD] = useState(1200);
  const [editBonusPercent, setEditBonusPercent] = useState(10);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [editPermissions, setEditPermissions] = useState<SeatPermissions>(DEFAULT_DISPATCHER_PERMISSIONS);

  // Quick reset password state
  const [quickNewPassword, setQuickNewPassword] = useState('');
  const [showQuickPassword, setShowQuickPassword] = useState(false);
  const [quickPasswordError, setQuickPasswordError] = useState<string | null>(null);

  // Helper to generate secure password
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let res = 'TL#';
    for (let i = 0; i < 7; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  // Toggle reveal password
  const togglePasswordVisibility = (userId: string) => {
    setRevealedPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Copy login credentials to clipboard
  const copyCredentials = (user: User) => {
    const pass = user.password || '••••••••';
    const text = `TL Fleet Console Credentials:\nUsername: ${user.username}\nPassword: ${pass}\nRole: ${user.role}`;
    navigator.clipboard.writeText(text);
    setCopiedId(user.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2500);
  };

  // Switch Role in New Form
  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    if (selectedRole === 'ADMIN' || selectedRole === 'MANAGER') {
      setPermissions({ ...DEFAULT_ADMIN_PERMISSIONS });
    } else if (selectedRole === 'DISPATCHER') {
      setPermissions({ ...DEFAULT_DISPATCHER_PERMISSIONS });
    } else if (selectedRole === 'SALES') {
      setPermissions({ ...DEFAULT_SALES_PERMISSIONS });
    }
  };

  // Switch Role in Edit Form
  const handleEditRoleSelect = (selectedRole: UserRole) => {
    setEditRole(selectedRole);
    if (selectedRole === 'ADMIN' || selectedRole === 'MANAGER') {
      setEditPermissions({ ...DEFAULT_ADMIN_PERMISSIONS });
    } else if (selectedRole === 'DISPATCHER') {
      setEditPermissions({ ...DEFAULT_DISPATCHER_PERMISSIONS });
    } else if (selectedRole === 'SALES') {
      setEditPermissions({ ...DEFAULT_SALES_PERMISSIONS });
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (user: User) => {
    setEditingSeatUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditUsername(user.username);
    setEditPassword(user.password || '');
    setEditPhone(user.phone || '');
    setEditProfilePhoto(user.profilePhoto || '');
    setEditFormError(null);

    // Load existing permissions or set defaults
    if (user.permissions) {
      setEditPermissions({ ...user.permissions });
    } else {
      if (user.role === 'ADMIN' || user.role === 'MANAGER') {
        setEditPermissions({ ...DEFAULT_ADMIN_PERMISSIONS });
      } else if (user.role === 'DISPATCHER') {
        setEditPermissions({ ...DEFAULT_DISPATCHER_PERMISSIONS });
      } else {
        setEditPermissions({ ...DEFAULT_SALES_PERMISSIONS });
      }
    }

    // Find linked dispatcher if any
    const disp = dispatchers.find(d => d.username === user.username || d.id === user.dispatcherId);
    if (disp) {
      setEditCommissionPercent(disp.commissionPercent || 8);
      setEditBaseSalaryPKR(disp.baseSalaryPKR !== undefined ? disp.baseSalaryPKR : (user.baseSalaryPKR || 84000));
      setEditTargetUSD(disp.targetUSD !== undefined ? disp.targetUSD : (user.targetUSD || 1200));
      setEditBonusPercent(disp.bonusPercent !== undefined ? disp.bonusPercent : (user.bonusPercent || 10));
    } else {
      setEditCommissionPercent(8);
      setEditBaseSalaryPKR(user.baseSalaryPKR || 84000);
      setEditTargetUSD(user.targetUSD || 1200);
      setEditBonusPercent(user.bonusPercent || 10);
    }
  };

  // Submit New Seat Form
  const handleAssignSeatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert("⚠️ Access Denied: Team accounts and seats are locked. Only an Administrator can assign new seats.");
      return;
    }
    setFormError(null);

    const cleanUsername = username.toLowerCase().trim();
    if (!name.trim() || !cleanUsername || !password.trim()) {
      setFormError('Name, username/email, and password are required.');
      return;
    }

    // Check duplicate username
    const exists = allUsers.some(u => u.username.toLowerCase() === cleanUsername);
    if (exists) {
      setFormError(`Username "${cleanUsername}" is already taken by an active team member.`);
      return;
    }

    if (role === 'DISPATCHER') {
      onAddDispatcher({
        name: name.trim(),
        username: cleanUsername,
        password: password.trim(),
        phone: phone.trim() || '(555) 000-0000',
        commissionPercent,
        baseSalaryPKR,
        targetUSD,
        bonusPercent,
        notes: `Assigned Seat on ${new Date().toLocaleDateString()}`,
        permissions
      });
    } else {
      if (onAddSalesAgent) {
        onAddSalesAgent({
          name: name.trim(),
          username: cleanUsername,
          password: password.trim(),
          role,
          phone: phone.trim() || '(555) 000-0000',
          baseSalaryPKR,
          targetUSD,
          bonusPercent,
          permissions
        });
      }
    }

    // Reset Form
    setIsAssigningSeat(false);
    setName('');
    setUsername('');
    setPassword('');
    setPhone('');
    setCommissionPercent(8);
    setBaseSalaryPKR(84000);
    setTargetUSD(1200);
    setBonusPercent(10);
    setFormError(null);
  };

  // Submit Edit Seat Form
  const handleEditSeatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert("⚠️ Access Denied: Existing team accounts and login credentials are locked. Only an Administrator can edit seats or change details.");
      return;
    }
    if (!editingSeatUser) return;
    setEditFormError(null);

    const cleanUsername = editUsername.toLowerCase().trim();
    if (!editName.trim() || !cleanUsername) {
      setEditFormError('Name and username cannot be blank.');
      return;
    }

    // Check duplicate username if changed
    const duplicate = allUsers.some(u => u.id !== editingSeatUser.id && u.username.toLowerCase() === cleanUsername);
    if (duplicate) {
      setEditFormError(`Username "${cleanUsername}" is already assigned to another user.`);
      return;
    }

    // Update User record with permissions
    if (onEditUser) {
      onEditUser(editingSeatUser.id, {
        name: editName.trim(),
        username: cleanUsername,
        role: editRole,
        phone: editPhone.trim(),
        profilePhoto: editProfilePhoto,
        password: editPassword.trim() || editingSeatUser.password,
        baseSalaryPKR: editBaseSalaryPKR,
        targetUSD: editTargetUSD,
        bonusPercent: editBonusPercent,
        permissions: editPermissions
      });
    }

    // If there's an associated dispatcher profile, update it as well
    const disp = dispatchers.find(d => d.username === editingSeatUser.username || d.id === editingSeatUser.dispatcherId);
    if (disp) {
      onEditDispatcher(disp.id, {
        name: editName.trim(),
        username: cleanUsername,
        password: editPassword.trim() || disp.password,
        phone: editPhone.trim(),
        profilePhoto: editProfilePhoto || disp.profilePhoto,
        commissionPercent: editCommissionPercent,
        baseSalaryPKR: editBaseSalaryPKR,
        targetUSD: editTargetUSD,
        bonusPercent: editBonusPercent
      });
    }

    setEditingSeatUser(null);
  };

  // Quick Password Reset Submit
  const handleQuickPasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert("⚠️ Access Denied: Login details and passwords are locked. Only an Administrator can change credentials.");
      return;
    }
    if (!resettingPasswordUser) return;
    setQuickPasswordError(null);

    if (!quickNewPassword.trim()) {
      setQuickPasswordError('New password cannot be empty.');
      return;
    }

    if (onChangePassword) {
      const res = await onChangePassword(resettingPasswordUser.id, quickNewPassword.trim());
      if (res.success) {
        setResettingPasswordUser(null);
        setQuickNewPassword('');
      } else {
        setQuickPasswordError('Failed to update password.');
      }
    } else if (onEditUser) {
      onEditUser(resettingPasswordUser.id, { password: quickNewPassword.trim() });
      const disp = dispatchers.find(d => d.username === resettingPasswordUser.username);
      if (disp) {
        onEditDispatcher(disp.id, { password: quickNewPassword.trim() });
      }
      setResettingPasswordUser(null);
      setQuickNewPassword('');
    }
  };

  // Confirm Seat Revocation / Delete Member
  const handleConfirmRevoke = (user: User) => {
    if (!isAdmin) {
      alert("⚠️ Access Denied: Existing seats are locked. Only an Administrator can remove seats.");
      return;
    }
    if (onRemoveTeamMember) {
      onRemoveTeamMember(user.id);
    } else {
      const disp = dispatchers.find(d => d.username === user.username);
      if (disp) {
        onDeleteDispatcher(disp.id);
      }
    }
    setRevokingSeatUser(null);
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => {
      const searchMatch = !searchTerm.trim() || (
        u.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (u.phone || '').toLowerCase().includes(searchTerm.toLowerCase().trim())
      );

      const roleMatch = roleFilter === 'ALL' || u.role === roleFilter;

      return searchMatch && roleMatch;
    });
  }, [allUsers, searchTerm, roleFilter]);

  // Seat Counts
  const totalSeats = allUsers.length;
  const dispatcherSeats = allUsers.filter(u => u.role === 'DISPATCHER').length;
  const salesSeats = allUsers.filter(u => u.role === 'SALES').length;
  const managerSeats = allUsers.filter(u => u.role === 'MANAGER').length;
  const adminSeats = allUsers.filter(u => u.role === 'ADMIN').length;

  return (
    <div id="team_seats_management" className="space-y-6">
      
      {/* HEADER CARD */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 font-display flex items-center gap-2.5">
              <ShieldCheck className="h-6 w-6 text-indigo-600 shrink-0" />
              <span>Team &amp; Seat Access Management</span>
            </h1>
            <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-200 uppercase font-mono tracking-wider">
              {totalSeats} Active Seats
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Assign seat permissions (Full Access or Granular Module Restrictions), configure logins &amp; privacy controls for dispatchers, sales agents, managers, and admins.
          </p>
        </div>

        {isAdmin ? (
          <button
            id="assign_new_seat_btn"
            onClick={() => {
              setIsAssigningSeat(true);
              setRole('DISPATCHER');
              setPermissions({ ...DEFAULT_DISPATCHER_PERMISSIONS });
              setPassword(generatePassword());
              setFormError(null);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            <span>Assign New Team Seat</span>
          </button>
        ) : (
          <div className="px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-2 text-slate-500 text-xs font-semibold shrink-0">
            <Lock className="h-4 w-4 text-slate-400" />
            <span>Seats Locked (Admin Only)</span>
          </div>
        )}
      </div>

      {/* METRICS & SEAT BREAKDOWN SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Seats Assigned */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
              Total Active Seats
            </span>
            <span className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5 block">
              {totalSeats} <span className="text-xs text-slate-400 font-normal">/ Uncapped</span>
            </span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <Users className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* Dispatcher Seats */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
              Dispatcher Seats
            </span>
            <span className="text-2xl font-extrabold text-indigo-700 font-mono mt-0.5 block">
              {dispatcherSeats}
            </span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <UserCheck className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* Sales Agent Seats */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
              Sales Agent Seats
            </span>
            <span className="text-2xl font-extrabold text-emerald-700 font-mono mt-0.5 block">
              {salesSeats}
            </span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <TrendingUp className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* Admin / Manager Seats */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
              Admins &amp; Managers
            </span>
            <span className="text-2xl font-extrabold text-amber-600 font-mono mt-0.5 block">
              {adminSeats + managerSeats}
            </span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <ShieldCheck className="h-5.5 w-5.5" />
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3">
        
        {/* Role Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200 text-xs w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All Seats ({allUsers.length})
          </button>
          <button
            onClick={() => setRoleFilter('DISPATCHER')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === 'DISPATCHER' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Dispatchers ({dispatcherSeats})
          </button>
          <button
            onClick={() => setRoleFilter('SALES')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === 'SALES' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Sales Agents ({salesSeats})
          </button>
          <button
            onClick={() => setRoleFilter('MANAGER')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === 'MANAGER' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Managers ({managerSeats})
          </button>
          <button
            onClick={() => setRoleFilter('ADMIN')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === 'ADMIN' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Admins ({adminSeats})
          </button>
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-72">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, login, phone..."
            className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* TEAM SEATS GRID LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredUsers.map((user) => {
          const isDisp = user.role === 'DISPATCHER';
          const isSales = user.role === 'SALES';
          const isManager = user.role === 'MANAGER';
          const isUserAdmin = user.role === 'ADMIN';

          // Match Dispatcher details if any
          const dispObj = dispatchers.find(d => d.username === user.username || d.id === user.dispatcherId);
          const isPassRevealed = !!revealedPasswords[user.id];

          // Determine permission status
          const perms = user.permissions || (
            isUserAdmin || isManager ? DEFAULT_ADMIN_PERMISSIONS :
            isDisp ? DEFAULT_DISPATCHER_PERMISSIONS : DEFAULT_SALES_PERMISSIONS
          );

          const isFullAccess = perms.isFullAccess || isUserAdmin;

          return (
            <div
              key={user.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
            >
              {/* TOP CARD BAR */}
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {user.profilePhoto ? (
                      <img
                        src={user.profilePhoto}
                        alt={user.name}
                        className="h-11 w-11 rounded-xl object-cover border-2 border-slate-100 shadow-sm shrink-0"
                      />
                    ) : (
                      <div className={`h-11 w-11 rounded-xl text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-sm font-mono ${
                        isUserAdmin ? 'bg-gradient-to-br from-amber-500 to-amber-700' :
                        isManager ? 'bg-gradient-to-br from-violet-500 to-violet-700' :
                        isDisp ? 'bg-gradient-to-br from-indigo-500 to-indigo-700' :
                        'bg-gradient-to-br from-emerald-500 to-emerald-700'
                      }`}>
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 tracking-tight leading-snug">
                        {user.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase font-mono tracking-wider ${
                          isUserAdmin ? 'bg-amber-100 text-amber-900 border border-amber-300 ring-1 ring-amber-400/30' :
                          isManager ? 'bg-violet-100 text-violet-800 border border-violet-200' :
                          isDisp ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                          'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {isUserAdmin ? '👑 Super Admin' : user.role}
                        </span>
                        {isUserAdmin ? (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-300 font-mono">
                            Supreme Clearance
                          </span>
                        ) : isFullAccess ? (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-mono">
                            Full Access
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-mono">
                            Restricted Seat
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Seat Status indicator */}
                  <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono shrink-0 ${
                    isUserAdmin ? 'text-amber-800 bg-amber-50 border border-amber-300' : 'text-emerald-600 bg-emerald-50 border border-emerald-200'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isUserAdmin ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
                    {isUserAdmin ? 'Vault Secured' : 'Active'}
                  </span>
                </div>
              </div>

              {/* MIDDLE CARD: LOGIN CREDENTIALS & PERMISSIONS */}
              <div className="p-5 space-y-3 bg-slate-50/50 flex-grow">
                
                {/* LOGIN CREDENTIALS BOX */}
                <div className="bg-slate-900 text-slate-100 rounded-xl p-3.5 space-y-2 border border-slate-800 shadow-inner">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                      <Key className="h-3.5 w-3.5 text-amber-400" />
                      {isUserAdmin ? 'Super Admin Vault Credentials' : 'Login Credentials'}
                    </span>

                    {(currentUser.role === 'ADMIN' || !isUserAdmin) && (
                      <button
                        onClick={() => copyCredentials(user)}
                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-mono hover:bg-slate-800 px-2 py-0.5 rounded transition-all cursor-pointer"
                        title="Copy credentials to clipboard"
                      >
                        {copiedId === user.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy Info</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Username */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium font-mono text-[11px]">Username / Email:</span>
                    <span className="font-mono font-bold text-white select-all">
                      {isUserAdmin && currentUser.role !== 'ADMIN' ? 'admin@vault.internal' : user.username}
                    </span>
                  </div>

                  {/* Password */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium font-mono text-[11px]">Password:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-amber-300 tracking-wider">
                        {isUserAdmin && currentUser.role !== 'ADMIN'
                          ? '🔒 [Supreme 256-Bit Encrypted]'
                          : isPassRevealed
                          ? (user.password || '123')
                          : '••••••••'}
                      </span>
                      {(currentUser.role === 'ADMIN' || !isUserAdmin) && (
                        <button
                          onClick={() => togglePasswordVisibility(user.id)}
                          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                          title={isPassRevealed ? "Hide Password" : "Reveal Password"}
                        >
                          {isPassRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ACCESS PERMISSIONS SUMMARY */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase font-mono tracking-wider flex items-center gap-1">
                      <Shield className="h-3 w-3 text-indigo-500" />
                      Module Permissions
                    </span>
                    <div className="flex flex-wrap items-center gap-1">
                      {perms.onlyAssignedLoads && (
                        <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-mono">
                          Own Loads
                        </span>
                      )}
                      {perms.onlyAssignedDrivers && (
                        <span className="text-[9px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded font-mono">
                          Own Drivers
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Badges Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px]">
                    <span className={`px-2 py-1 rounded-lg border font-bold flex items-center gap-1 ${
                      perms.canAccessDashboard !== false ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-70'
                    }`}>
                      <LayoutDashboard className="h-3 w-3 shrink-0" />
                      <span>Dashboard</span>
                    </span>

                    <span className={`px-2 py-1 rounded-lg border font-bold flex items-center gap-1 ${
                      perms.canAccessLoadBoard !== false ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-70'
                    }`}>
                      <FolderHeart className="h-3 w-3 shrink-0" />
                      <span>Load Board</span>
                    </span>

                    <span className={`px-2 py-1 rounded-lg border font-bold flex items-center gap-1 ${
                      perms.canAccessDailyAssignment !== false ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-70'
                    }`}>
                      <CalendarRange className="h-3 w-3 shrink-0" />
                      <span>Assignments</span>
                    </span>

                    <span className={`px-2 py-1 rounded-lg border font-bold flex items-center gap-1 ${
                      perms.canAccessTimeClock !== false ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-70'
                    }`}>
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>Time Clock</span>
                    </span>

                    <span className={`px-2 py-1 rounded-lg border font-bold flex items-center gap-1 ${
                      perms.canAccessTools !== false ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-70'
                    }`}>
                      <Sliders className="h-3 w-3 shrink-0" />
                      <span>Tools</span>
                    </span>

                    <span className={`px-2 py-1 rounded-lg border font-bold flex items-center gap-1 ${
                      perms.canAccessTeamChat !== false ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-70'
                    }`}>
                      <MessageSquare className="h-3 w-3 shrink-0" />
                      <span>Team Chat</span>
                    </span>

                    <span className={`px-2 py-1 rounded-lg border font-bold flex items-center gap-1 ${
                      perms.canAccessSalesCRM ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-70'
                    }`}>
                      <TrendingUp className="h-3 w-3 shrink-0" />
                      <span>Sales CRM</span>
                    </span>

                    <span className={`px-2 py-1 rounded-lg border font-bold flex items-center gap-1 ${
                      perms.canAccessInvoicing ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-70'
                    }`}>
                      <FileSpreadsheet className="h-3 w-3 shrink-0" />
                      <span>Invoicing</span>
                    </span>

                    <span className={`px-2 py-1 rounded-lg border font-bold flex items-center gap-1 ${
                      perms.canAccessDriverPayout ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-70'
                    }`}>
                      <Coins className="h-3 w-3 shrink-0" />
                      <span>Payouts Hub</span>
                    </span>

                    <span className={`px-2 py-1 rounded-lg border font-bold flex items-center gap-1 ${
                      perms.canAccessTransactionVault ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-70'
                    }`}>
                      <Receipt className="h-3 w-3 shrink-0" />
                      <span>Vault</span>
                    </span>

                    <span className={`px-2 py-1 rounded-lg border font-bold flex items-center gap-1 ${
                      perms.canAccessCarrierCRM ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-70'
                    }`}>
                      <Briefcase className="h-3 w-3 shrink-0" />
                      <span>Carrier CRM</span>
                    </span>

                    <span className={`px-2 py-1 rounded-lg border font-bold flex items-center gap-1 ${
                      perms.canAccessCorporateReports ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-70'
                    }`}>
                      <Folder className="h-3 w-3 shrink-0" />
                      <span>Reports</span>
                    </span>
                  </div>
                </div>

                {/* FINANCIAL PARAMETERS */}
                <div className="text-xs space-y-1 text-slate-600 font-medium pt-2 border-t border-slate-200/60">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Base Monthly Salary:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {(user.baseSalaryPKR || dispObj?.baseSalaryPKR || 84000).toLocaleString()} PKR
                    </span>
                  </div>
                  {isDisp && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Assigned Fleet:</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {dispObj?.assignedDriverIds?.length || 0} Drivers
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* CARD FOOTER ACTIONS */}
              <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
                {isAdmin ? (
                  <>
                    <button
                      onClick={() => handleOpenEdit(user)}
                      className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200/60"
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Edit Permissions</span>
                    </button>

                    <button
                      onClick={() => {
                        setResettingPasswordUser(user);
                        setQuickNewPassword(generatePassword());
                        setQuickPasswordError(null);
                      }}
                      className="py-1.5 px-3 bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200/60"
                      title="Quick Reset Password"
                    >
                      <Key className="h-3.5 w-3.5 text-amber-600" />
                      <span>Reset</span>
                    </button>

                    {user.id !== currentUser.id && (
                      <button
                        onClick={() => setRevokingSeatUser(user)}
                        className="py-1.5 px-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-bold rounded-xl flex items-center justify-center transition-all cursor-pointer border border-slate-200/60"
                        title="Revoke Seat / Remove User"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                      </button>
                    )}
                  </>
                ) : (
                  <div className="w-full py-1.5 px-3 bg-slate-50 text-slate-500 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 border border-slate-200/60">
                    <Lock className="h-3.5 w-3.5 text-slate-400" />
                    <span>Login &amp; Seat Details Locked (Admin Only)</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <Users className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No team seats match your search</h3>
            <p className="text-xs text-slate-400">Try adjusting your filters or search terms.</p>
          </div>
        )}
      </div>

      {/* ------------------------------------
          MODAL 1: ASSIGN NEW SEAT FORM
          ------------------------------------ */}
      {isAssigningSeat && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden my-8">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UserPlus className="h-5 w-5 text-indigo-400" />
                <h2 className="font-extrabold text-base tracking-tight font-display">
                  Assign New Seat &amp; Access Controls
                </h2>
              </div>
              <button
                onClick={() => setIsAssigningSeat(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAssignSeatSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Role Preset Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  1. Select Role Preset
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('DISPATCHER')}
                    className={`p-3 rounded-xl border text-xs font-extrabold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      role === 'DISPATCHER'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-xs ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <UserCheck className="h-4 w-4 text-indigo-600" />
                    <span>Dispatcher</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleSelect('SALES')}
                    className={`p-3 rounded-xl border text-xs font-extrabold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      role === 'SALES'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <span>Sales Agent</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleSelect('MANAGER')}
                    className={`p-3 rounded-xl border text-xs font-extrabold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      role === 'MANAGER'
                        ? 'bg-violet-50 border-violet-600 text-violet-900 shadow-xs ring-2 ring-violet-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Layers className="h-4 w-4 text-violet-600" />
                    <span>Manager</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleSelect('ADMIN')}
                    className={`p-3 rounded-xl border text-xs font-extrabold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      role === 'ADMIN'
                        ? 'bg-amber-50 border-amber-600 text-amber-900 shadow-xs ring-2 ring-amber-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4 text-amber-600" />
                    <span>Full Admin</span>
                  </button>
                </div>
              </div>

              {/* Basic Info Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Rivera"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Login Username / Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. alex.rivera or alex@timelylogistix.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600 font-mono"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Login Password <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setPassword(generatePassword())}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Auto-Generate Secure Pass</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showFormPassword ? "text" : "password"}
                    required
                    placeholder="Enter or generate password"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600 font-mono tracking-wider"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormPassword(!showFormPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showFormPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Phone & Financial Parameters */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="(555) 123-4567"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Base Salary (PKR)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none"
                    value={baseSalaryPKR}
                    onChange={e => setBaseSalaryPKR(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* GRANULAR PERMISSIONS PANEL */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
                    <Lock className="h-4 w-4 text-indigo-600" />
                    2. Granular Module &amp; Feature Permissions
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPermissions({ ...DEFAULT_ADMIN_PERMISSIONS })}
                      className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Give Full Access
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setPermissions({ ...DEFAULT_DISPATCHER_PERMISSIONS })}
                      className="text-[10px] font-bold text-slate-500 hover:underline cursor-pointer"
                    >
                      Restricted Defaults
                    </button>
                  </div>
                </div>

                {/* Quick Apply Role Presets */}
                <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-indigo-950 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                      Quick Apply Role Presets:
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Auto-configure permissions</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPermissions({
                        ...DEFAULT_ADMIN_PERMISSIONS
                      })}
                      className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg font-bold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-xs"
                    >
                      👑 <span>Full Admin / Manager</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPermissions({
                        ...DEFAULT_DISPATCHER_PERMISSIONS
                      })}
                      className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-900 border border-indigo-300 rounded-lg font-bold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-xs"
                    >
                      🚛 <span>Standard Dispatcher</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPermissions({
                        ...DEFAULT_SALES_PERMISSIONS
                      })}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-900 border border-emerald-300 rounded-lg font-bold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-xs"
                    >
                      💼 <span>Sales Agent</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPermissions({
                        canAccessDashboard: true,
                        canAccessInvoicing: true,
                        canAccessDriverPayout: true,
                        canAccessTransactionVault: true,
                        canAccessCarrierCRM: false,
                        canAccessCorporateReports: true,
                        canAccessDailyAssignment: false,
                        canAccessDriverIndex: false,
                        onlyAssignedDrivers: false,
                        canAccessLoadBoard: false,
                        onlyAssignedLoads: false,
                        canAccessTimeClock: true,
                        canAccessTools: false,
                        canAccessTeamChat: true,
                        canAccessSalesCRM: false,
                        canAccessTeamSeats: false,
                        isFullAccess: false
                      })}
                      className="px-2.5 py-1.5 bg-violet-50 hover:bg-violet-100 active:bg-violet-200 text-violet-900 border border-violet-300 rounded-lg font-bold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-xs"
                    >
                      💵 <span>Billing &amp; Finance</span>
                    </button>
                  </div>
                </div>

                {/* Permissions Toggles Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  
                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4 text-indigo-600 shrink-0" />
                      <span className="font-bold text-slate-800">Dashboard &amp; MTD Performance</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={permissions.canAccessDashboard !== false}
                      onChange={e => setPermissions(p => ({ ...p, canAccessDashboard: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <FolderHeart className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-800">Load Board</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={permissions.canAccessLoadBoard !== false}
                      onChange={e => setPermissions(p => ({ ...p, canAccessLoadBoard: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <CalendarRange className="h-4 w-4 text-purple-600 shrink-0" />
                      <span className="font-bold text-slate-800">Daily Assignment Desk</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={permissions.canAccessDailyAssignment !== false}
                      onChange={e => setPermissions(p => ({ ...p, canAccessDailyAssignment: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600 shrink-0" />
                      <span className="font-bold text-slate-800">Time Clock &amp; Shifts</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={permissions.canAccessTimeClock !== false}
                      onChange={e => setPermissions(p => ({ ...p, canAccessTimeClock: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-amber-600 shrink-0" />
                      <span className="font-bold text-slate-800">Tools (Calculator &amp; Rate Engine)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={permissions.canAccessTools !== false}
                      onChange={e => setPermissions(p => ({ ...p, canAccessTools: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-sky-600 shrink-0" />
                      <span className="font-bold text-slate-800">Team Chat</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={permissions.canAccessTeamChat !== false}
                      onChange={e => setPermissions(p => ({ ...p, canAccessTeamChat: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-indigo-600 shrink-0" />
                      <span className="font-bold text-slate-800">Driver Index</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={permissions.canAccessDriverIndex !== false}
                      onChange={e => setPermissions(p => ({ ...p, canAccessDriverIndex: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-800">Sales CRM</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!permissions.canAccessSalesCRM}
                      onChange={e => setPermissions(p => ({ ...p, canAccessSalesCRM: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-sky-600 shrink-0" />
                      <span className="font-bold text-slate-800">Invoicing System</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!permissions.canAccessInvoicing}
                      onChange={e => setPermissions(p => ({ ...p, canAccessInvoicing: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-yellow-600 shrink-0" />
                      <span className="font-bold text-slate-800">Driver Payouts Hub</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!permissions.canAccessDriverPayout}
                      onChange={e => setPermissions(p => ({ ...p, canAccessDriverPayout: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-800">Transaction Vault</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!permissions.canAccessTransactionVault}
                      onChange={e => setPermissions(p => ({ ...p, canAccessTransactionVault: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-cyan-600 shrink-0" />
                      <span className="font-bold text-slate-800">Carrier CRM</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!permissions.canAccessCarrierCRM}
                      onChange={e => setPermissions(p => ({ ...p, canAccessCarrierCRM: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-teal-600 shrink-0" />
                      <span className="font-bold text-slate-800">Corporate Reports</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!permissions.canAccessCorporateReports}
                      onChange={e => setPermissions(p => ({ ...p, canAccessCorporateReports: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-rose-600 shrink-0" />
                      <span className="font-bold text-slate-800">Team &amp; Seats System</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!permissions.canAccessTeamSeats}
                      onChange={e => setPermissions(p => ({ ...p, canAccessTeamSeats: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-indigo-600 shrink-0" />
                      <span className="font-bold text-slate-800">Training Academy</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={permissions.canAccessTraining !== false}
                      onChange={e => setPermissions(p => ({ ...p, canAccessTraining: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  {/* Load Privacy Setting */}
                  <label className="col-span-1 sm:col-span-2 flex items-center justify-between p-3 bg-amber-50/80 rounded-xl border border-amber-200 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-amber-700 shrink-0" />
                      <div>
                        <span className="font-extrabold text-amber-900 block text-xs">Load Privacy Control</span>
                        <span className="text-[10px] text-amber-700">Only show assigned/booked loads for this seat in Load Board</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!permissions.onlyAssignedLoads}
                      onChange={e => setPermissions(p => ({ ...p, onlyAssignedLoads: e.target.checked }))}
                      className="h-4 w-4 text-amber-600 rounded cursor-pointer"
                    />
                  </label>

                  {/* Driver Privacy Setting */}
                  <label className="col-span-1 sm:col-span-2 flex items-center justify-between p-3 bg-indigo-50/80 rounded-xl border border-indigo-200 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-indigo-700 shrink-0" />
                      <div>
                        <span className="font-extrabold text-indigo-900 block text-xs">Driver Index Privacy Control</span>
                        <span className="text-[10px] text-indigo-700">Only show assigned drivers in Driver Index for this seat</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!permissions.onlyAssignedDrivers}
                      onChange={e => setPermissions(p => ({ ...p, onlyAssignedDrivers: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssigningSeat(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Assign Seat &amp; Save Permissions</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------
          MODAL 2: EDIT SEAT & PERMISSIONS
          ------------------------------------ */}
      {editingSeatUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden my-8">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Edit3 className="h-5 w-5 text-indigo-400" />
                <h2 className="font-extrabold text-base tracking-tight font-display">
                  Edit Seat &amp; Access Controls ({editingSeatUser.name})
                </h2>
              </div>
              <button
                onClick={() => setEditingSeatUser(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleEditSeatSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {editFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{editFormError}</span>
                </div>
              )}

              {/* Role Preset Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Seat Role Preset
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleEditRoleSelect('DISPATCHER')}
                    className={`p-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      editRole === 'DISPATCHER' ? 'bg-indigo-50 border-indigo-600 text-indigo-900 ring-2 ring-indigo-500/20' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>Dispatcher</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditRoleSelect('SALES')}
                    className={`p-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      editRole === 'SALES' ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-500/20' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>Sales Agent</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditRoleSelect('MANAGER')}
                    className={`p-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      editRole === 'MANAGER' ? 'bg-violet-50 border-violet-600 text-violet-900 ring-2 ring-violet-500/20' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>Manager</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditRoleSelect('ADMIN')}
                    className={`p-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      editRole === 'ADMIN' ? 'bg-amber-50 border-amber-600 text-amber-900 ring-2 ring-amber-500/20' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>Admin</span>
                  </button>
                </div>
              </div>

              {/* Profile Photo Uploader */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {editProfilePhoto ? (
                    <img
                      src={editProfilePhoto}
                      alt="Avatar Preview"
                      className="h-12 w-12 rounded-xl object-cover border-2 border-indigo-500 shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-sm shrink-0">
                      {editName ? editName.split(' ').map(n => n[0]).join('').slice(0, 2) : 'Photo'}
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800">Team Profile Picture</h4>
                    <p className="text-[11px] text-slate-500">Upload user avatar to show across system</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-xs">
                    <span>{editProfilePhoto ? 'Change Photo' : 'Upload Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const img = new Image();
                          img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const maxDim = 256;
                            let width = img.width;
                            let height = img.height;
                            if (width > height) {
                              if (width > maxDim) {
                                height = Math.round((height * maxDim) / width);
                                width = maxDim;
                              }
                            } else {
                              if (height > maxDim) {
                                width = Math.round((width * maxDim) / height);
                                height = maxDim;
                              }
                            }
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                              ctx.drawImage(img, 0, 0, width, height);
                              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
                              setEditProfilePhoto(compressedBase64);
                            }
                          };
                          img.src = event.target?.result as string;
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                  {editProfilePhoto && (
                    <button
                      type="button"
                      onClick={() => setEditProfilePhoto('')}
                      className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Login Username / Email
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600 font-mono"
                    value={editUsername}
                    onChange={e => setEditUsername(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Update Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditPassword(generatePassword())}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Generate New Key</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showEditPassword ? "text" : "password"}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600 font-mono tracking-wider"
                    value={editPassword}
                    onChange={e => setEditPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* GRANULAR PERMISSIONS EDIT PANEL */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
                    <Lock className="h-4 w-4 text-indigo-600" />
                    Module Permissions Control
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditPermissions({ ...DEFAULT_ADMIN_PERMISSIONS })}
                      className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Give Full Access
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setEditPermissions({ ...DEFAULT_DISPATCHER_PERMISSIONS })}
                      className="text-[10px] font-bold text-slate-500 hover:underline cursor-pointer"
                    >
                      Restricted Defaults
                    </button>
                  </div>
                </div>

                {/* Quick Apply Role Presets */}
                <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-indigo-950 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                      Quick Apply Role Presets:
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Auto-configure permissions</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditPermissions({
                        ...DEFAULT_ADMIN_PERMISSIONS
                      })}
                      className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg font-bold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-xs"
                    >
                      👑 <span>Full Admin / Manager</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPermissions({
                        ...DEFAULT_DISPATCHER_PERMISSIONS
                      })}
                      className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-900 border border-indigo-300 rounded-lg font-bold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-xs"
                    >
                      🚛 <span>Standard Dispatcher</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPermissions({
                        ...DEFAULT_SALES_PERMISSIONS
                      })}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-900 border border-emerald-300 rounded-lg font-bold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-xs"
                    >
                      💼 <span>Sales Agent</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPermissions({
                        canAccessDashboard: true,
                        canAccessInvoicing: true,
                        canAccessDriverPayout: true,
                        canAccessTransactionVault: true,
                        canAccessCarrierCRM: false,
                        canAccessCorporateReports: true,
                        canAccessDailyAssignment: false,
                        canAccessDriverIndex: false,
                        onlyAssignedDrivers: false,
                        canAccessLoadBoard: false,
                        onlyAssignedLoads: false,
                        canAccessTimeClock: true,
                        canAccessTools: false,
                        canAccessTeamChat: true,
                        canAccessSalesCRM: false,
                        canAccessTeamSeats: false,
                        isFullAccess: false
                      })}
                      className="px-2.5 py-1.5 bg-violet-50 hover:bg-violet-100 active:bg-violet-200 text-violet-900 border border-violet-300 rounded-lg font-bold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-xs"
                    >
                      💵 <span>Billing &amp; Finance</span>
                    </button>
                  </div>
                </div>

                {/* Permissions Toggles Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  
                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4 text-indigo-600 shrink-0" />
                      <span className="font-bold text-slate-800">Dashboard &amp; MTD Performance</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={editPermissions.canAccessDashboard !== false}
                      onChange={e => setEditPermissions(p => ({ ...p, canAccessDashboard: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <FolderHeart className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-800">Load Board</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={editPermissions.canAccessLoadBoard !== false}
                      onChange={e => setEditPermissions(p => ({ ...p, canAccessLoadBoard: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <CalendarRange className="h-4 w-4 text-purple-600 shrink-0" />
                      <span className="font-bold text-slate-800">Daily Assignment Desk</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={editPermissions.canAccessDailyAssignment !== false}
                      onChange={e => setEditPermissions(p => ({ ...p, canAccessDailyAssignment: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600 shrink-0" />
                      <span className="font-bold text-slate-800">Time Clock &amp; Shifts</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={editPermissions.canAccessTimeClock !== false}
                      onChange={e => setEditPermissions(p => ({ ...p, canAccessTimeClock: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-amber-600 shrink-0" />
                      <span className="font-bold text-slate-800">Tools (Calculator &amp; Rate Engine)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={editPermissions.canAccessTools !== false}
                      onChange={e => setEditPermissions(p => ({ ...p, canAccessTools: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-sky-600 shrink-0" />
                      <span className="font-bold text-slate-800">Team Chat</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={editPermissions.canAccessTeamChat !== false}
                      onChange={e => setEditPermissions(p => ({ ...p, canAccessTeamChat: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-indigo-600 shrink-0" />
                      <span className="font-bold text-slate-800">Driver Index</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={editPermissions.canAccessDriverIndex !== false}
                      onChange={e => setEditPermissions(p => ({ ...p, canAccessDriverIndex: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-800">Sales CRM</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!editPermissions.canAccessSalesCRM}
                      onChange={e => setEditPermissions(p => ({ ...p, canAccessSalesCRM: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-sky-600 shrink-0" />
                      <span className="font-bold text-slate-800">Invoicing System</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!editPermissions.canAccessInvoicing}
                      onChange={e => setEditPermissions(p => ({ ...p, canAccessInvoicing: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-yellow-600 shrink-0" />
                      <span className="font-bold text-slate-800">Driver Payouts Hub</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!editPermissions.canAccessDriverPayout}
                      onChange={e => setEditPermissions(p => ({ ...p, canAccessDriverPayout: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-800">Transaction Vault</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!editPermissions.canAccessTransactionVault}
                      onChange={e => setEditPermissions(p => ({ ...p, canAccessTransactionVault: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-cyan-600 shrink-0" />
                      <span className="font-bold text-slate-800">Carrier CRM</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!editPermissions.canAccessCarrierCRM}
                      onChange={e => setEditPermissions(p => ({ ...p, canAccessCarrierCRM: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-teal-600 shrink-0" />
                      <span className="font-bold text-slate-800">Corporate Reports</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!editPermissions.canAccessCorporateReports}
                      onChange={e => setEditPermissions(p => ({ ...p, canAccessCorporateReports: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-rose-600 shrink-0" />
                      <span className="font-bold text-slate-800">Team &amp; Seats System</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!editPermissions.canAccessTeamSeats}
                      onChange={e => setEditPermissions(p => ({ ...p, canAccessTeamSeats: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-indigo-600 shrink-0" />
                      <span className="font-bold text-slate-800">Training Academy</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={editPermissions.canAccessTraining !== false}
                      onChange={e => setEditPermissions(p => ({ ...p, canAccessTraining: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  {/* Load Privacy Setting */}
                  <label className="col-span-1 sm:col-span-2 flex items-center justify-between p-3 bg-amber-50/80 rounded-xl border border-amber-200 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-amber-700 shrink-0" />
                      <div>
                        <span className="font-extrabold text-amber-900 block text-xs">Load Privacy Control</span>
                        <span className="text-[10px] text-amber-700">Only show assigned/booked loads for this seat in Load Board</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!editPermissions.onlyAssignedLoads}
                      onChange={e => setEditPermissions(p => ({ ...p, onlyAssignedLoads: e.target.checked }))}
                      className="h-4 w-4 text-amber-600 rounded cursor-pointer"
                    />
                  </label>

                  {/* Driver Privacy Setting */}
                  <label className="col-span-1 sm:col-span-2 flex items-center justify-between p-3 bg-indigo-50/80 rounded-xl border border-indigo-200 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-indigo-700 shrink-0" />
                      <div>
                        <span className="font-extrabold text-indigo-900 block text-xs">Driver Index Privacy Control</span>
                        <span className="text-[10px] text-indigo-700">Only show assigned drivers in Driver Index for this seat</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!editPermissions.onlyAssignedDrivers}
                      onChange={e => setEditPermissions(p => ({ ...p, onlyAssignedDrivers: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSeatUser(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Update Seat Controls</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------
          MODAL 3: QUICK PASSWORD RESET
          ------------------------------------ */}
      {resettingPasswordUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-amber-400" />
                <h2 className="font-extrabold text-sm tracking-tight font-display">
                  Reset Password for {resettingPasswordUser.name}
                </h2>
              </div>
              <button
                onClick={() => setResettingPasswordUser(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleQuickPasswordResetSubmit} className="p-6 space-y-4">
              {quickPasswordError && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold">
                  {quickPasswordError}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    New Security Key
                  </label>
                  <button
                    type="button"
                    onClick={() => setQuickNewPassword(generatePassword())}
                    className="text-[11px] text-indigo-600 font-bold hover:underline"
                  >
                    Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                  value={quickNewPassword}
                  onChange={e => setQuickNewPassword(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setResettingPasswordUser(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-extrabold rounded-xl shadow-md"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------
          MODAL 4: CONFIRM REVOKE SEAT
          ------------------------------------ */}
      {revokingSeatUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 text-center">
            <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Revoke Seat License?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <span className="font-bold text-slate-800">{revokingSeatUser.name}</span>? Their credentials will be deactivated immediately.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setRevokingSeatUser(null)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmRevoke(revokingSeatUser)}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Revoke &amp; Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
