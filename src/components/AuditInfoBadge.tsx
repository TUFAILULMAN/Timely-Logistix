import React from 'react';
import { UserCheck, Edit3, Clock, Calendar } from 'lucide-react';

interface AuditInfoBadgeProps {
  createdBy?: string;
  createdByName?: string;
  createdAt?: string;
  lastModifiedBy?: string;
  lastModifiedByName?: string;
  lastModifiedAt?: string;
  compact?: boolean;
  align?: 'left' | 'right' | 'center';
}

export const AuditInfoBadge: React.FC<AuditInfoBadgeProps> = ({
  createdBy,
  createdByName,
  createdAt,
  lastModifiedBy,
  lastModifiedByName,
  lastModifiedAt,
  compact = false,
  align = 'left'
}) => {
  const hasCreated = Boolean(createdBy || createdByName || createdAt);
  const hasModified = Boolean(lastModifiedBy || lastModifiedByName || lastModifiedAt);

  if (!hasCreated && !hasModified) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      if (dateStr.includes('T')) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const creatorDisplay = createdByName || createdBy || 'System';
  const editorDisplay = lastModifiedByName || lastModifiedBy || creatorDisplay;

  if (compact) {
    return (
      <div 
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[10px] text-slate-600 font-mono ${
          align === 'right' ? 'ml-auto' : ''
        }`}
        title={`Created by: ${creatorDisplay} ${createdAt ? `(${formatDate(createdAt)})` : ''}${
          hasModified ? ` | Last modified by: ${editorDisplay} ${lastModifiedAt ? `(${formatDate(lastModifiedAt)})` : ''}` : ''
        }`}
      >
        <UserCheck className="h-3 w-3 text-indigo-500 shrink-0" />
        <span className="font-semibold text-slate-700 truncate max-w-[120px]">{editorDisplay}</span>
        {lastModifiedAt || createdAt ? (
          <span className="text-slate-400">· {formatDate(lastModifiedAt || createdAt)}</span>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-mono py-1 px-2 bg-slate-50/80 rounded-lg border border-slate-200/80 ${
      align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'
    }`}>
      {hasCreated && (
        <div className="flex items-center gap-1">
          <UserCheck className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
          <span className="text-slate-400">Created:</span>
          <span className="font-bold text-slate-700">{creatorDisplay}</span>
          {createdAt && <span className="text-slate-400">({formatDate(createdAt)})</span>}
        </div>
      )}

      {hasCreated && hasModified && <span className="text-slate-300">|</span>}

      {hasModified && (
        <div className="flex items-center gap-1">
          <Edit3 className="h-3 w-3 text-amber-500 shrink-0" />
          <span className="text-slate-400">Edited:</span>
          <span className="font-bold text-slate-700">{editorDisplay}</span>
          {lastModifiedAt && <span className="text-slate-400">({formatDate(lastModifiedAt)})</span>}
        </div>
      )}
    </div>
  );
};
