/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { BrokerContact, User } from '../types';
import {
  Building2,
  UserCheck,
  Phone,
  Mail,
  Search,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  FileSpreadsheet,
  Download,
  Star,
  ShieldCheck,
  FileText,
  Upload,
  ExternalLink,
  Sparkles,
  Filter,
  CheckSquare,
  Square,
  RefreshCw,
  PhoneCall
} from 'lucide-react';

interface BrokerManagementProps {
  currentUser: User;
  brokers: BrokerContact[];
  onAddBroker: (broker: Omit<BrokerContact, 'id'>) => void;
  onEditBroker: (id: string, updatedFields: Partial<BrokerContact>) => void;
  onDeleteBroker: (id: string) => void;
  onAddBrokersBulk: (newBrokers: Omit<BrokerContact, 'id'>[]) => void;
}

export default function BrokerManagement({
  currentUser,
  brokers,
  onAddBroker,
  onEditBroker,
  onDeleteBroker,
  onAddBrokersBulk
}: BrokerManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedType, setCopiedType] = useState<'EMAILS' | 'PHONES' | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBroker, setEditingBroker] = useState<BrokerContact | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State for Add / Edit
  const [formCompany, setFormCompany] = useState('');
  const [formPerson, setFormPerson] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMc, setFormMc] = useState('');
  const [formTerms, setFormTerms] = useState('QuickPay 2% / Net 30');
  const [formRating, setFormRating] = useState<number>(5);
  const [formNotes, setFormNotes] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered list
  const filteredBrokers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return brokers;
    return brokers.filter(b => 
      b.companyName.toLowerCase().includes(q) ||
      b.contactPerson.toLowerCase().includes(q) ||
      b.phone.toLowerCase().includes(q) ||
      b.email.toLowerCase().includes(q) ||
      (b.mcNumber && b.mcNumber.toLowerCase().includes(q)) ||
      (b.notes && b.notes.toLowerCase().includes(q))
    );
  }, [brokers, searchQuery]);

  // Select all handler
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredBrokers.length && filteredBrokers.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredBrokers.map(b => b.id));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // --- 1-CLICK COPY ALL EMAILS ---
  const handleCopyEmails = (onlySelected: boolean = false) => {
    const list = onlySelected && selectedIds.length > 0
      ? filteredBrokers.filter(b => selectedIds.includes(b.id))
      : filteredBrokers;

    const emails = list
      .map(b => b.email.trim())
      .filter(e => e && e.includes('@'));

    if (emails.length === 0) {
      showToast('No valid email addresses found.');
      return;
    }

    const emailString = Array.from(new Set(emails)).join(', ');
    navigator.clipboard.writeText(emailString);
    setCopiedType('EMAILS');
    showToast(`Copied ${emails.length} broker emails to clipboard!`);
    setTimeout(() => setCopiedType(null), 2500);
  };

  // --- 1-CLICK CSV PHONE NUMBERS LIST EXPORT ---
  const handleExportPhoneListCSV = (onlySelected: boolean = false) => {
    const list = onlySelected && selectedIds.length > 0
      ? filteredBrokers.filter(b => selectedIds.includes(b.id))
      : filteredBrokers;

    if (list.length === 0) {
      showToast('No broker phone records to export.');
      return;
    }

    const headers = ['Company Name', 'Contact Person', 'Phone Number', 'Email', 'MC Number', 'Payment Terms'];
    const rows = list.map(b => [
      `"${b.companyName.replace(/"/g, '""')}"`,
      `"${b.contactPerson.replace(/"/g, '""')}"`,
      `"${b.phone.replace(/"/g, '""')}"`,
      `"${b.email.replace(/"/g, '""')}"`,
      `"${b.mcNumber || ''}"`,
      `"${b.paymentTerms || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Broker_Phone_List_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${list.length} broker phone contacts as CSV!`);
  };

  // Modal Open Handlers
  const handleOpenAddModal = () => {
    setEditingBroker(null);
    setFormCompany('');
    setFormPerson('');
    setFormPhone('');
    setFormEmail('');
    setFormMc('');
    setFormTerms('QuickPay 2% / Net 30');
    setFormRating(5);
    setFormNotes('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (b: BrokerContact) => {
    setEditingBroker(b);
    setFormCompany(b.companyName);
    setFormPerson(b.contactPerson);
    setFormPhone(b.phone);
    setFormEmail(b.email);
    setFormMc(b.mcNumber || '');
    setFormTerms(b.paymentTerms || 'QuickPay 2% / Net 30');
    setFormRating(b.rating || 5);
    setFormNotes(b.notes || '');
    setIsAddModalOpen(true);
  };

  const handleSaveBrokerForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCompany.trim()) return;

    if (editingBroker) {
      onEditBroker(editingBroker.id, {
        companyName: formCompany.trim(),
        contactPerson: formPerson.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        mcNumber: formMc.trim(),
        paymentTerms: formTerms.trim(),
        rating: formRating,
        notes: formNotes.trim()
      });
      showToast(`Broker "${formCompany}" updated successfully!`);
    } else {
      onAddBroker({
        companyName: formCompany.trim(),
        contactPerson: formPerson.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        mcNumber: formMc.trim(),
        paymentTerms: formTerms.trim(),
        rating: formRating,
        notes: formNotes.trim(),
        createdAt: new Date().toISOString().split('T')[0]
      });
      showToast(`Broker "${formCompany}" added and saved!`);
    }

    setIsAddModalOpen(false);
  };

  // Parse Bulk Text
  const handleProcessBulkImport = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    const parsed: Omit<BrokerContact, 'id'>[] = [];

    lines.forEach(line => {
      // Split by tab, comma, or pipe
      const parts = line.split(/[,\t|]/).map(p => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length >= 2) {
        parsed.push({
          companyName: parts[0] || 'Freight Brokerage',
          contactPerson: parts[1] || 'Representative',
          phone: parts[2] || '',
          email: parts[3] || '',
          mcNumber: parts[4] || '',
          paymentTerms: parts[5] || 'QuickPay 2% / Net 30',
          rating: 5,
          createdAt: new Date().toISOString().split('T')[0]
        });
      }
    });

    if (parsed.length > 0) {
      onAddBrokersBulk(parsed);
      showToast(`Successfully imported and saved ${parsed.length} brokers!`);
      setIsBulkModalOpen(false);
      setBulkText('');
    } else {
      showToast('Could not parse brokers. Ensure columns are: Company, Contact Person, Phone, Email');
    }
  };

  return (
    <div id="broker_management_section" className="space-y-6">

      {/* Toast notification banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-blue-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-blue-400 flex items-center gap-2.5 animate-in slide-in-from-top duration-200">
          <Sparkles className="h-4 w-4 text-blue-300" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* ================= SECTION HEADER ================= */}
      <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider rounded-md flex items-center gap-1">
                <Building2 className="h-3 w-3 text-blue-600" />
                <span>Broker &amp; Shipper Directory</span>
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wider rounded-md flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                <span>Auto-Saved to Cloud &amp; Load Board</span>
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display mt-1 flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                <Building2 className="h-5 w-5" />
              </div>
              <span>Brokers Contact Data &amp; Communications Hub</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Centralized repository for broker contacts, direct phone lines, and email blasts. All entries auto-sync directly with the Load Board dispatch creation form.
            </p>
          </div>

          {/* Top Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Bulk Import</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Broker</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-2xl">
            <div className="text-[10px] font-extrabold uppercase text-blue-600">Total Brokers</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{brokers.length}</div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-150 rounded-2xl">
            <div className="text-[10px] font-extrabold uppercase text-slate-500">With Email Address</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{brokers.filter(b => b.email).length}</div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-150 rounded-2xl">
            <div className="text-[10px] font-extrabold uppercase text-slate-500">Direct Phone Numbers</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{brokers.filter(b => b.phone).length}</div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-150 rounded-2xl">
            <div className="text-[10px] font-extrabold uppercase text-slate-500">5-Star Verified</div>
            <div className="text-xl font-black text-amber-600 mt-0.5">{brokers.filter(b => (b.rating || 5) >= 5).length}</div>
          </div>
        </div>
      </div>

      {/* ================= SEARCH & 1-CLICK ACTION CONTROLS BAR ================= */}
      <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search company, contact person, phone, email, MC#..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-blue-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              &times;
            </button>
          )}
        </div>

        {/* 1-Click Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Select All Checkbox */}
          <button
            onClick={handleToggleSelectAll}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            {selectedIds.length > 0 && selectedIds.length === filteredBrokers.length ? (
              <CheckSquare className="h-4 w-4 text-blue-600" />
            ) : (
              <Square className="h-4 w-4 text-slate-400" />
            )}
            <span>{selectedIds.length > 0 ? `Selected (${selectedIds.length})` : 'Select All'}</span>
          </button>

          {/* 1-CLICK COPY ALL EMAILS BUTTON */}
          <button
            onClick={() => handleCopyEmails(selectedIds.length > 0)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-2 transition-all"
            title="Copies all or selected broker emails to clipboard for mass email outreach"
          >
            {copiedType === 'EMAILS' ? (
              <>
                <Check className="h-4 w-4 text-emerald-300" />
                <span>Copied Emails!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy {selectedIds.length > 0 ? `${selectedIds.length} ` : 'All '}Emails (1-Click)</span>
              </>
            )}
          </button>

          {/* 1-CLICK PHONE CSV EXPORT BUTTON */}
          <button
            onClick={() => handleExportPhoneListCSV(selectedIds.length > 0)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-2 transition-all"
            title="Exports phone numbers list in CSV format"
          >
            <Download className="h-4 w-4" />
            <span>Make Phone CSV List (1-Click)</span>
          </button>
        </div>
      </div>

      {/* ================= BROKER DATA TABLE / ROW-BASED VIEW ================= */}
      <div className="bg-white rounded-3xl border border-blue-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="text-xs font-black text-slate-800 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-600" />
            <span>Broker Contact Directory ({filteredBrokers.length} brokers)</span>
          </div>
          {selectedIds.length > 0 && (
            <div className="text-xs font-bold text-blue-700 bg-blue-100/60 px-3 py-1 rounded-full">
              {selectedIds.length} brokers selected for batch action
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead>
              <tr className="border-b border-slate-150 text-slate-600 font-bold uppercase tracking-wider bg-blue-50/40">
                <th className="py-3.5 px-4 w-10 text-center">
                  <button
                    onClick={handleToggleSelectAll}
                    className="cursor-pointer text-slate-500 hover:text-blue-600"
                  >
                    {selectedIds.length > 0 && selectedIds.length === filteredBrokers.length ? (
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">Company Name</th>
                <th className="py-3.5 px-4">Contact Person</th>
                <th className="py-3.5 px-4">Phone Number</th>
                <th className="py-3.5 px-4">Email Address</th>
                <th className="py-3.5 px-4">MC / DOT</th>
                <th className="py-3.5 px-4">Payment Terms</th>
                <th className="py-3.5 px-4 text-center">Rating</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredBrokers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Building2 className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600">No brokers found matching your criteria</p>
                    <p className="text-[11px] text-slate-400 mt-1">Click "Add New Broker" above to start your directory.</p>
                  </td>
                </tr>
              ) : (
                filteredBrokers.map(b => {
                  const isSelected = selectedIds.includes(b.id);
                  return (
                    <tr
                      key={b.id}
                      className={`hover:bg-blue-50/30 transition-colors ${
                        isSelected ? 'bg-blue-50/60' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleSelectRow(b.id)}
                          className="cursor-pointer text-slate-400 hover:text-blue-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-300" />
                          )}
                        </button>
                      </td>

                      {/* Company Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-black text-slate-900 text-[13px] flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          <span>{b.companyName}</span>
                        </div>
                        {b.notes && (
                          <div className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                            {b.notes}
                          </div>
                        )}
                      </td>

                      {/* Contact Person */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <UserCheck className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          <span>{b.contactPerson || 'Dispatch Rep'}</span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4">
                        {b.phone ? (
                          <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-800">
                            <Phone className="h-3 w-3 text-emerald-600 shrink-0" />
                            <a
                              href={`tel:${b.phone}`}
                              className="hover:text-blue-600 hover:underline"
                              title="Click to Call"
                            >
                              {b.phone}
                            </a>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(b.phone);
                                showToast(`Copied phone: ${b.phone}`);
                              }}
                              className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                              title="Copy Phone"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4">
                        {b.email ? (
                          <div className="flex items-center gap-1.5 font-mono text-slate-800 font-medium">
                            <Mail className="h-3 w-3 text-blue-500 shrink-0" />
                            <a
                              href={`mailto:${b.email}`}
                              className="hover:text-blue-600 hover:underline truncate max-w-[160px]"
                              title={b.email}
                            >
                              {b.email}
                            </a>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(b.email);
                                showToast(`Copied email: ${b.email}`);
                              }}
                              className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                              title="Copy Email"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      {/* MC / DOT */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                        {b.mcNumber || '-'}
                      </td>

                      {/* Payment Terms */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-md text-[10px]">
                          {b.paymentTerms || 'Net 30'}
                        </span>
                      </td>

                      {/* Rating */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-0.5 text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < (b.rating || 5) ? 'fill-amber-400' : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(b)}
                            className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                            title="Edit Broker Details"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete broker "${b.companyName}"?`)) {
                                onDeleteBroker(b.id);
                                showToast(`Deleted broker "${b.companyName}"`);
                              }
                            }}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete Broker"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

      {/* ================= ADD / EDIT BROKER MODAL ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-blue-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-600 text-white">
                  <Building2 className="h-4 w-4" />
                </div>
                <h3 className="text-base font-black text-slate-900 font-display">
                  {editingBroker ? 'Edit Broker Contact' : 'Add New Broker to Directory'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveBrokerForm} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                  Broker Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. C.H. Robinson, TQL, Coyote Logistics"
                  value={formCompany}
                  onChange={e => setFormCompany(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Jenkins"
                    value={formPerson}
                    onChange={e => setFormPerson(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                    MC / DOT Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MC-123456"
                    value={formMc}
                    onChange={e => setFormMc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                    Direct Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 800-555-0199"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                    Email Address (For Rate Cons / Bids)
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. loads@brokerage.com"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. QuickPay 2% / Net 30"
                    value={formTerms}
                    onChange={e => setFormTerms(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                    Reliability Rating (1-5)
                  </label>
                  <select
                    value={formRating}
                    onChange={e => setFormRating(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-blue-500"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 Stars - Top Tier)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 Stars - Good)</option>
                    <option value={3}>⭐⭐⭐ (3 Stars - Average)</option>
                    <option value={2}>⭐⭐ (2 Stars - Slow Pay)</option>
                    <option value={1}>⭐ (1 Star - Caution)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                  Internal Notes &amp; Dispatch Tips
                </label>
                <textarea
                  rows={2}
                  placeholder="Special instructions, after-hours extension, factoring notes..."
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  {editingBroker ? 'Save Changes' : 'Save Broker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= BULK IMPORT MODAL ================= */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-blue-200 shadow-2xl max-w-xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-600 text-white">
                  <Upload className="h-4 w-4" />
                </div>
                <h3 className="text-base font-black text-slate-900 font-display">
                  Bulk Import Brokers (CSV / Tab Delimited)
                </h3>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                Paste your broker lines below. Supported format:
              </p>
              <div className="bg-slate-100 p-2.5 rounded-xl font-mono text-[11px] text-slate-800 border border-slate-200">
                Company Name, Contact Person, Phone, Email, MC Number
              </div>
            </div>

            <textarea
              rows={6}
              placeholder="e.g.&#10;C.H. Robinson, Sarah Jenkins, 800-555-0199, sarah@chrobinson.com, MC-123456&#10;TQL Freight, Mike Ross, 800-555-0122, mike@tql.com, MC-654321"
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-900 focus:outline-blue-500"
            />

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessBulkImport}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-md shadow-blue-500/20 cursor-pointer text-xs"
              >
                Import Brokers
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
