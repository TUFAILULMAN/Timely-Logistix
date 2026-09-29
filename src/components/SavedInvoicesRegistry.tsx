import React, { useState } from 'react';
import { Invoice } from '../types';
import { FileSpreadsheet, Printer, Trash2, X, CheckCircle, Clock, AlertCircle, Upload, Image as ImageIcon, Check } from 'lucide-react';

interface SavedInvoicesRegistryProps {
  invoices: Invoice[];
  onLoadInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  onEditInvoice?: (id: string, updated: Partial<Invoice>) => Promise<void> | void;
}

export default function SavedInvoicesRegistry({
  invoices,
  onLoadInvoice,
  onDeleteInvoice,
  onEditInvoice
}: SavedInvoicesRegistryProps) {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedProofInvoice, setSelectedProofInvoice] = useState<Invoice | null>(null);

  const handleStatusChange = async (invId: string, newStatus: 'PAID' | 'UNPAID' | 'PENDING') => {
    if (onEditInvoice) {
      await onEditInvoice(invId, {
        paymentStatus: newStatus,
        paymentDate: newStatus === 'PAID' ? new Date().toISOString().split('T')[0] : undefined
      });
    }
  };

  const handleProofFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, invId: string) => {
    const file = e.target.files?.[0];
    if (!file || !onEditInvoice) return;

    const fileType = file.type.includes('image') ? 'image' : (file.type.includes('pdf') ? 'pdf' : 'other');

    const reader = new FileReader();
    reader.onload = async (event) => {
      if (typeof event.target?.result === 'string') {
        await onEditInvoice(invId, {
          paymentProofFileName: file.name,
          paymentProofFileType: fileType,
          paymentProofBase64: event.target.result,
          paymentStatus: 'PAID',
          paymentDate: new Date().toISOString().split('T')[0]
        });
        alert(`Payment proof uploaded successfully for Invoice! Status updated to PAID.`);
      }
    };
    reader.readAsDataURL(file);
  };

  const filteredInvoices = invoices.filter(inv => {
    if (statusFilter === 'ALL') return true;
    const currentStatus = inv.paymentStatus || 'UNPAID';
    return currentStatus === statusFilter;
  });

  const totalPaid = invoices.filter(i => i.paymentStatus === 'PAID').reduce((sum, i) => sum + i.netAmount, 0);
  const totalUnpaid = invoices.filter(i => (i.paymentStatus || 'UNPAID') === 'UNPAID').reduce((sum, i) => sum + i.netAmount, 0);
  const totalPending = invoices.filter(i => i.paymentStatus === 'PENDING').reduce((sum, i) => sum + i.netAmount, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden no-print space-y-0">
      
      {/* Header & Status Summary Bar */}
      <div className="px-6 py-4 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
          <div>
            <h3 className="font-extrabold text-white text-sm">Carrier Invoices &amp; Dispatch Fee Registry</h3>
            <p className="text-[10px] text-slate-300">Track sequential invoices with status (Paid, Unpaid, Pending) &amp; payment proof attachments.</p>
          </div>
        </div>

        {/* Status Totals Pills */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
          <div className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-3 py-1 rounded-xl">
            <span className="font-bold">PAID:</span> ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="bg-rose-950 text-rose-300 border border-rose-800 px-3 py-1 rounded-xl">
            <span className="font-bold">UNPAID:</span> ${totalUnpaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="bg-amber-950 text-amber-300 border border-amber-800 px-3 py-1 rounded-xl">
            <span className="font-bold">PENDING:</span> ${totalPending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2 font-mono">Status Filter:</span>
          {['ALL', 'UNPAID', 'PENDING', 'PAID'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-1 rounded-full font-mono">
          {filteredInvoices.length} Invoices
        </span>
      </div>

      {/* Table */}
      {filteredInvoices.length > 0 ? (
        <div className="overflow-x-auto max-h-80 scrollbar-thin">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[9px] font-mono tracking-wider">
                <th className="px-5 py-3">Invoice #</th>
                <th className="px-5 py-3">Type &amp; Rate</th>
                <th className="px-5 py-3">Carrier / Client</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Gross Booking</th>
                <th className="px-5 py-3 text-right">Fee / Net Due</th>
                <th className="px-5 py-3 text-center">Payment Status</th>
                <th className="px-5 py-3 text-center">Proof / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => {
                const currentStatus = inv.paymentStatus || 'UNPAID';
                return (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Invoice # */}
                    <td className="px-5 py-3 font-mono font-extrabold text-slate-900">
                      {inv.invoiceNum}
                    </td>

                    {/* Type & Rate */}
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold rounded-md uppercase tracking-wider ${
                        inv.invoiceMode.includes('DISPATCH') 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {inv.invoiceMode.includes('DISPATCH') ? `Dispatch Fee (${inv.dispatchRatePercent || 8}%)` : 'Carrier Freight'}
                      </span>
                    </td>

                    {/* Carrier / Client */}
                    <td className="px-5 py-3 font-bold text-slate-800">
                      {inv.invoiceMode.includes('DISPATCH') ? inv.carrierName : (inv.brokerName || inv.carrierName)}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3 text-slate-500 font-mono text-[11px]">
                      {inv.invoiceDate}
                    </td>

                    {/* Gross */}
                    <td className="px-5 py-3 text-right font-mono text-slate-600">
                      ${inv.grossAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Net & Paid Balance */}
                    <td className="px-5 py-3 text-right font-mono">
                      <div className="font-extrabold text-emerald-800 text-sm font-mono">
                        ${inv.netAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      {(inv.totalAmountPaid !== undefined && inv.totalAmountPaid > 0 && inv.remainingBalance !== undefined && inv.remainingBalance > 0) && (
                        <div className="text-[9px] text-amber-700 font-bold mt-0.5 font-mono">
                          Rec: ${inv.totalAmountPaid.toFixed(0)} | Rem: ${inv.remainingBalance.toFixed(0)}
                        </div>
                      )}
                    </td>

                    {/* Payment Status Dropdown */}
                    <td className="px-5 py-3 text-center">
                      <select
                        value={currentStatus}
                        onChange={(e) => handleStatusChange(inv.id, e.target.value as any)}
                        className={`text-[10px] font-bold font-mono px-2 py-1 rounded-lg border outline-none cursor-pointer ${
                          currentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : currentStatus === 'PARTIAL'
                            ? 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold'
                            : currentStatus === 'PENDING'
                            ? 'bg-sky-100 text-sky-900 border-sky-300'
                            : 'bg-rose-100 text-rose-900 border-rose-300'
                        }`}
                      >
                        <option value="UNPAID">🔴 UNPAID</option>
                        <option value="PARTIAL">⚡ PARTIAL</option>
                        <option value="PENDING">🟡 PENDING</option>
                        <option value="PAID">🟢 PAID</option>
                      </select>
                    </td>

                    {/* Actions & Proof Upload */}
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        
                        {/* Print */}
                        <button
                          type="button"
                          onClick={() => onLoadInvoice(inv)}
                          className="cursor-pointer px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 shadow-xs transition-colors"
                          title="Load & Print Invoice"
                        >
                          <Printer className="h-3 w-3" />
                          <span>Reprint</span>
                        </button>

                        {/* Upload / View Proof */}
                        {inv.paymentProofBase64 ? (
                          <button
                            type="button"
                            onClick={() => setSelectedProofInvoice(inv)}
                            className="cursor-pointer px-2 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-bold text-[10px] flex items-center gap-1"
                            title="View Payment Proof"
                          >
                            <ImageIcon className="h-3 w-3 text-emerald-700" />
                            <span>Proof ✓</span>
                          </button>
                        ) : (
                          <label className="cursor-pointer px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-colors">
                            <Upload className="h-3 w-3 text-slate-500" />
                            <span>+ Proof</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={(e) => handleProofFileUpload(e, inv.id)}
                              className="hidden"
                            />
                          </label>
                        )}

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete Invoice #${inv.invoiceNum}?`)) {
                              onDeleteInvoice(inv.id);
                            }
                          }}
                          className="cursor-pointer p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                          title="Delete invoice"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>

                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center text-slate-400 italic bg-slate-50/20">
          No invoice records found matching status filter "{statusFilter}".
        </div>
      )}

      {/* Proof Lightbox Modal */}
      {selectedProofInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Payment Proof - Invoice #{selectedProofInvoice.invoiceNum}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedProofInvoice(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-center">
              {selectedProofInvoice.paymentProofBase64?.startsWith('data:image/') || selectedProofInvoice.paymentProofFileType === 'image' ? (
                <img
                  src={selectedProofInvoice.paymentProofBase64}
                  alt="Invoice Payment Proof"
                  className="max-h-80 mx-auto rounded-xl border border-slate-200 shadow-md object-contain"
                />
              ) : (
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-xs font-bold text-slate-800">{selectedProofInvoice.paymentProofFileName || 'Payment Proof Document'}</p>
                  <a
                    href={selectedProofInvoice.paymentProofBase64}
                    download={selectedProofInvoice.paymentProofFileName || `Proof_${selectedProofInvoice.invoiceNum}.pdf`}
                    className="inline-block mt-3 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl"
                  >
                    Download Proof PDF
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedProofInvoice(null)}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
