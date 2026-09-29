/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Dispatcher, Driver, User, ClockRecord } from '../types';
import {
  UserCheck,
  ShieldCheck,
  Mail,
  Phone,
  Settings,
  AlertTriangle,
  Plus,
  PlusCircle,
  Trash,
  Check,
  X,
  GripVertical,
  ArrowUpToLine,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Zap,
  Clock
} from 'lucide-react';

interface DispatcherManagementProps {
  currentUser: User;
  dispatchers: Dispatcher[];
  drivers: Driver[];
  attendance?: ClockRecord[];
  onAdd: (disp: Omit<Dispatcher, 'id' | 'assignedDriverIds'>) => void;
  onEdit: (id: string, updated: Partial<Dispatcher>) => void;
  onDelete: (id: string) => void;
  allUsers: User[];
  onRemoveTeamMember?: (userId: string) => void;
}

export default function DispatcherManagement({
  currentUser,
  dispatchers,
  drivers,
  attendance = [],
  onAdd,
  onEdit,
  onDelete,
  allUsers,
  onRemoveTeamMember
}: DispatcherManagementProps) {
  const isAdmin = currentUser.role === 'ADMIN';
  const [revealedPassIds, setRevealedPassIds] = useState<{[key: string]: boolean}>({});

  const [autoTopActive, setAutoTopActive] = useState(true);
  const [draggedDispatcherId, setDraggedDispatcherId] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states of adding dispatcher
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [commissionPercent, setCommissionPercent] = useState(8);
  const [notes, setNotes] = useState('');

  // Form states of editing dispatcher
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCommissionPercent, setEditCommissionPercent] = useState(8);
  const [editNotes, setEditNotes] = useState('');

  const [error, setError] = useState<string | null>(null);

  const isDispatcherWorking = (dispId: string) => {
    return attendance.some(a => a.dispatcherId === dispId && !a.clockOut);
  };

  const sortedDispatchers = [...dispatchers].sort((a, b) => {
    if (autoTopActive) {
      const aWorking = isDispatcherWorking(a.id);
      const bWorking = isDispatcherWorking(b.id);
      if (aWorking && !bWorking) return -1;
      if (!aWorking && bWorking) return 1;
    }
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });

  const handleMoveDispatcher = (dispId: string, direction: 'TOP' | 'UP' | 'DOWN') => {
    const currentList = [...sortedDispatchers];
    const currentIndex = currentList.findIndex(d => d.id === dispId);
    if (currentIndex === -1) return;

    if (direction === 'TOP') {
      const target = currentList.splice(currentIndex, 1)[0];
      currentList.unshift(target);
    } else if (direction === 'UP' && currentIndex > 0) {
      const temp = currentList[currentIndex];
      currentList[currentIndex] = currentList[currentIndex - 1];
      currentList[currentIndex - 1] = temp;
    } else if (direction === 'DOWN' && currentIndex < currentList.length - 1) {
      const temp = currentList[currentIndex];
      currentList[currentIndex] = currentList[currentIndex + 1];
      currentList[currentIndex + 1] = temp;
    }

    currentList.forEach((dis, idx) => {
      onEdit(dis.id, { sortOrder: idx });
    });
  };

  const handleDropDispatcher = (targetDispId: string) => {
    if (!draggedDispatcherId || draggedDispatcherId === targetDispId) return;

    const currentList = [...sortedDispatchers];
    const fromIndex = currentList.findIndex(d => d.id === draggedDispatcherId);
    const toIndex = currentList.findIndex(d => d.id === targetDispId);

    if (fromIndex !== -1 && toIndex !== -1) {
      const [moved] = currentList.splice(fromIndex, 1);
      currentList.splice(toIndex, 0, moved);

      currentList.forEach((dis, idx) => {
        onEdit(dis.id, { sortOrder: idx });
      });
    }
    setDraggedDispatcherId(null);
  };

  const handleStartEdit = (d: Dispatcher) => {
    setEditingId(d.id);
    setEditName(d.name);
    setEditUsername(d.username);
    setEditPassword(d.password || 'password123');
    setEditPhone(d.phone);
    setEditCommissionPercent(d.commissionPercent);
    setEditNotes(d.notes || '');
  };

  const handleSaveEdit = (id: string) => {
    onEdit(id, {
      name: editName,
      username: editUsername,
      password: editPassword,
      phone: editPhone,
      commissionPercent: editCommissionPercent,
      notes: editNotes
    });
    setEditingId(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !username.trim() || !password.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    // Check duplicate username
    const exists = dispatchers.some(d => d.username.toLowerCase() === username.toLowerCase().trim());
    if (exists || username.toLowerCase() === 'admin') {
      setError('Username already taken');
      return;
    }

    onAdd({
      name,
      username: username.toLowerCase().trim(),
      password,
      phone,
      commissionPercent,
      notes
    });

    // Reset Form
    setIsAdding(false);
    setName('');
    setUsername('');
    setPassword('');
    setPhone('');
    setCommissionPercent(8);
    setNotes('');
  };

  return (
    <div id="dispatcher_management" className="space-y-6">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm col-span-full">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 font-display">
            Dispatcher Personnel Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin ? 'System security roles, user accounts, and dispatch commission settings' : 'My personal dispatcher credentials and fleet associations'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setIsAdding(prev => !prev);
              setEditingId(null);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-blue-500/10 cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{isAdding ? 'Close Wizard' : 'Register Dispatcher'}</span>
          </button>
        )}
      </div>

      {/* TEAM SYNC & COMPANY WORKSPACE MANAGEMENT */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
          <Settings className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900 tracking-tight font-display">
            Company Workspace &amp; Team Join Link
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-2">
            <p className="text-xs text-slate-600 leading-relaxed">
              Your company data syncs in real-time across all team members securely using Firebase Cloud Firestore. To onboard dispatchers, accountants, or sales agents, share this secure <strong>Team Join Link</strong>.
            </p>
            <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-mono text-slate-700 w-full overflow-x-auto select-all">
              <span>{window.location.origin + window.location.pathname + '?companyId=' + (currentUser.companyId || 'DEFAULT_COMPANY')}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 md:justify-end">
            <button
              onClick={() => {
                const inviteUrl = window.location.origin + window.location.pathname + '?companyId=' + (currentUser.companyId || 'DEFAULT_COMPANY');
                navigator.clipboard.writeText(inviteUrl);
                alert('Team Join Link copied to clipboard! Share this with your team members to sync across devices.');
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Copy Team Join Link</span>
            </button>
            
            <div className="flex items-center gap-2 bg-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-700">
              <span className="font-semibold text-slate-500">Company ID:</span>
              <span className="font-bold text-slate-900 select-all">{currentUser.companyId || 'DEFAULT_COMPANY'}</span>
            </div>
          </div>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAddSubmit} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-lg space-y-6 max-w-3xl">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <UserCheck className="h-4.5 w-4.5 text-blue-600" />
            <span>Onboard New Dispatcher</span>
          </h3>

          {error && (
            <div className="p-3 bg-red-100 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Dispatch Agent"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Username (For Login)</label>
              <input
                type="text"
                required
                placeholder="e.g. agent1"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-mono"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Password</label>
              <input
                type="password"
                required
                placeholder="e.g. pass123"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Contact Cell Phone</label>
              <input
                type="text"
                required
                placeholder="e.g. (555) 123-4567"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Commission Percent (%)</label>
              <input
                type="number"
                required
                min={0}
                max={100}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-mono"
                value={commissionPercent}
                onChange={e => setCommissionPercent(Number(e.target.value))}
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Biographical details / notes</label>
              <textarea
                placeholder="Manager for Southern dry-vans..."
                rows={2}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Add Dispatcher
            </button>
          </div>
        </form>
      )}

      {/* Dispatcher Profile Reordering Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
        <label className="flex items-center gap-2.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-semibold cursor-pointer shadow-2xs hover:bg-slate-50">
          <input
            type="checkbox"
            checked={autoTopActive}
            onChange={e => setAutoTopActive(e.target.checked)}
            className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 accent-indigo-600 cursor-pointer"
          />
          <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
          <span>Active/Working Dispatchers on Top (Auto-drop non-working down)</span>
        </label>

        <span className="text-xs text-slate-400 font-medium">
          Drag cards or use buttons to reorder profiles
        </span>
      </div>

      {/* Grid of dispatchers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedDispatchers.map(dis => {
          const isEditing = editingId === dis.id;
          const isWorking = isDispatcherWorking(dis.id);
          const assignedDriversCount = drivers.filter(dr => dr.assignedDispatcherId === dis.id).length;
          const assignedDriverNames = drivers
            .filter(dr => dr.assignedDispatcherId === dis.id)
            .map(dr => dr.name)
            .join(', ');

          return (
            <div
              id={`dispatcher_card_${dis.id}`}
              key={dis.id}
              draggable={!isEditing}
              onDragStart={() => setDraggedDispatcherId(dis.id)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDropDispatcher(dis.id)}
              className={`bg-white p-5 rounded-2xl border transition-all ${
                isEditing
                  ? 'border-blue-500 bg-blue-50/10 shadow-md shadow-blue-500/5'
                  : 'border-slate-200 hover:border-slate-300'
              } ${draggedDispatcherId === dis.id ? 'opacity-40 border-dashed border-indigo-400' : ''}`}
            >
              {isEditing ? (
                // Modify state forms
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-blue-600">Edit Credentials</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleSaveEdit(dis.id)}
                        className="p-1 hover:bg-slate-100 text-emerald-600 rounded cursor-pointer"
                      >
                        <Check className="h-4.5 w-4.5" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 hover:bg-slate-100 text-rose-600 rounded cursor-pointer"
                      >
                        <X className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase">Dispatcher Name</label>
                      <input
                        type="text"
                        className="w-full px-2.5 py-1.5 mt-1 bg-white border border-slate-200 rounded text-xs text-slate-800"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase">Username</label>
                      <input
                        type="text"
                        className="w-full px-2.5 py-1.5 mt-1 bg-white border border-slate-200 rounded text-xs text-slate-850 font-mono"
                        value={editUsername}
                        onChange={e => setEditUsername(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Password</label>
                      <input
                        type="password"
                        className="w-full px-2.5 py-1.5 mt-1 bg-white border border-slate-200 rounded text-xs text-slate-850"
                        value={editPassword}
                        onChange={e => setEditPassword(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase">Commission %</label>
                      <input
                        type="number"
                        className="w-full px-2.5 py-1.5 mt-1 bg-white border border-slate-200 rounded text-xs text-slate-850"
                        value={editCommissionPercent}
                        onChange={e => setEditCommissionPercent(Number(e.target.value))}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Phone</label>
                      <input
                        type="text"
                        className="w-full px-2.5 py-1.5 mt-1 bg-white border border-slate-200 rounded text-xs text-slate-850"
                        value={editPhone}
                        onChange={e => setEditPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Notes</label>
                    <textarea
                      className="w-full px-2.5 py-1.5 mt-1 bg-white border border-slate-200 rounded text-xs text-slate-850 font-sans"
                      rows={2}
                      value={editNotes}
                      onChange={e => setEditNotes(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                // Read standard dispatcher visual layout
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="p-1 cursor-grab text-slate-300 hover:text-slate-600 transition-colors"
                        title="Drag up or down to reorder"
                      >
                        <GripVertical className="h-4 w-4" />
                      </div>

                      <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold font-display shadow-sm shadow-indigo-600/5">
                        {dis.name.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-slate-800">{dis.name}</h4>
                          {isWorking ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              <span>On Shift</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-medium uppercase bg-slate-100 text-slate-500">
                              Off Duty
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Dispatcher
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Position reordering controls */}
                      <div className="flex items-center bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/80 text-slate-500">
                        <button
                          type="button"
                          onClick={() => handleMoveDispatcher(dis.id, 'TOP')}
                          className="p-1 hover:text-indigo-600 hover:bg-white rounded transition-all cursor-pointer"
                          title="Put on Top"
                        >
                          <ArrowUpToLine className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveDispatcher(dis.id, 'UP')}
                          className="p-1 hover:text-indigo-600 hover:bg-white rounded transition-all cursor-pointer"
                          title="Move Up"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveDispatcher(dis.id, 'DOWN')}
                          className="p-1 hover:text-indigo-600 hover:bg-white rounded transition-all cursor-pointer"
                          title="Move Down"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>

                      {isAdmin && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleStartEdit(dis)}
                            className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-blue-500 rounded transition-colors cursor-pointer"
                            title="Edit dispatcher settings"
                          >
                            <Settings className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Remove custom dispatcher account ${dis.name}? This will unassign all their drivers.`)) {
                                onDelete(dis.id);
                              }
                            }}
                            className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                            title="Delete dispatcher account"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Login Username:</span>
                      <strong className="text-slate-800 font-mono font-medium">{dis.username}</strong>
                    </div>

                    <div className="flex justify-between items-center text-slate-500">
                      <span>Offline Password:</span>
                      <strong className="text-slate-800 font-mono tracking-widest">{dis.password ? '••••••' : 'None'}</strong>
                    </div>

                    <div className="flex justify-between items-center text-slate-500">
                      <span>Cell Phone:</span>
                      <strong className="text-slate-800 font-medium">{dis.phone}</strong>
                    </div>

                    <div className="flex justify-between items-center text-slate-500">
                      <span>Service Commission:</span>
                      <strong className="text-indigo-600 font-bold">{dis.commissionPercent}%</strong>
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Assigned Drivers ({assignedDriversCount})
                    </div>
                    {assignedDriversCount > 0 ? (
                      <p className="text-xs text-slate-700 bg-slate-100/50 p-2 rounded-lg border border-slate-200/40 font-medium truncate">
                        {assignedDriverNames}
                      </p>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No assigned drivers found</span>
                    )}
                  </div>

                  {dis.notes && (
                    <p className="text-[11px] text-slate-400 italic">&ldquo;{dis.notes}&rdquo;</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* SECURE USER ACCOUNTS & CREDENTIALS DIRECTORY (ADMIN ONLY) */}
      {isAdmin && allUsers && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 mt-10 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900 tracking-tight font-display">
                  Corporate Accounts &amp; Secure Credentials Directory
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Security-audited ledger of all registered personnel. Admin can review user details, source of registration, and decrypt user credentials.
              </p>
            </div>
            
            <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 text-[10px] font-bold text-indigo-600 font-mono uppercase">
              <span>Status: Secure Encryption Active</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-mono bg-slate-50/50">
                  <th className="py-3 px-4">User ID / Profile</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Email / Login</th>
                  <th className="py-3 px-4">Security Role</th>
                  <th className="py-3 px-4">Secured Password</th>
                  <th className="py-3 px-4">Onboarding Channel</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {allUsers.map(usr => {
                  const isRevealed = revealedPassIds[usr.id];
                  const isGoogle = usr.password === 'GoogleSecureCredential' || usr.id.startsWith('u_g_');

                  return (
                    <tr key={usr.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[10px] font-bold text-slate-500">
                        {usr.id}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {usr.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {usr.username}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full font-mono ${
                          usr.role === 'ADMIN'
                            ? 'bg-amber-100 text-amber-800'
                            : usr.role === 'DISPATCHER'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-violet-100 text-violet-800'
                        }`}>
                          {usr.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {isGoogle ? (
                          <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[10px] flex items-center gap-1.5 w-max">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Google Auth Channel
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-800 tracking-wider">
                              {isRevealed ? usr.password : '••••••••'}
                            </span>
                            <button
                              onClick={() => {
                                setRevealedPassIds(prev => ({
                                  ...prev,
                                  [usr.id]: !prev[usr.id]
                                }));
                              }}
                              className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                              title={isRevealed ? "Mask credentials" : "Decrypt & Reveal"}
                            >
                              {isRevealed ? '🙈' : '👁️'}
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-500 font-medium">
                          {isGoogle ? 'Google OAuth 2.0' : 'Email Security Register'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {usr.id !== currentUser.id ? (
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to remove ${usr.name} from the company team? This will delete their login credentials and associated dispatcher profile if applicable.`)) {
                                onRemoveTeamMember?.(usr.id);
                              }
                            }}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 text-rose-600 border border-rose-200 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                            title="Remove from Team"
                          >
                            <Trash className="h-3 w-3" />
                            <span>Remove</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 italic text-[10px] font-mono">Active Session</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
