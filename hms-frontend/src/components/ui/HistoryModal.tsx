import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import Badge from './Badge';
import type { AuditActionType, AuditModule, AuditRecord } from '../../types';
import {
  getAuditHistory,
  clearAuditHistory,
  resetAuditHistory,
} from '../../utils/auditLogger';
import { exportToCSV } from '../../utils/exportCsv';
import { useAuth } from '../../context/AuthContext';
import {
  History,
  Search,
  Download,
  Trash2,
  Clock,
  User as UserIcon,
  ShieldAlert,
  ChevronUp,
  Eye,
  Copy,
  Check,
  RotateCcw,
  List,
  Layers,
  Sparkles,
} from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleName: AuditModule;
  title?: string;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  moduleName,
  title,
}) => {
  const { user, role } = useAuth();
  const isStudent = role === 'student';

  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Student matching parameters
  const studentId = (user?.studentId || '').trim().toLowerCase();
  const studentName = (user?.name || '').trim().toLowerCase();
  const studentUserId = (user?.id || '').trim().toLowerCase();

  const belongsToStudent = (log: AuditRecord): boolean => {
    // 1. Explicit ID matches
    if (log.studentId && studentId && log.studentId.toLowerCase() === studentId) return true;
    if (log.userId && studentUserId && log.userId.toLowerCase() === studentUserId) return true;

    const performedBy = (log.performedBy || '').toLowerCase();
    const entityName = (log.entityName || '').toLowerCase();
    const details = (log.details || '').toLowerCase();

    // 2. Student ID appears anywhere in target, details, or operator
    if (studentId && (entityName.includes(studentId) || details.includes(studentId) || performedBy.includes(studentId))) {
      return true;
    }

    // 3. Match by name
    if (studentName && studentName.length >= 3) {
      if (performedBy.includes(studentName) || entityName.includes(studentName) || details.includes(studentName)) {
        if (log.studentId && studentId && log.studentId.toLowerCase() !== studentId) {
          return false;
        }
        return true;
      }

      // Check first name as fallback
      const firstName = studentName.split(' ')[0];
      if (firstName && firstName.length >= 3) {
        if ((performedBy.includes(firstName) || entityName.includes(firstName) || details.includes(firstName)) &&
            (!log.studentId || log.studentId.toLowerCase() === studentId)) {
          return true;
        }
      }
    }

    return false;
  };

  // Reload history logs whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      const allLogs = getAuditHistory(moduleName);
      const visibleLogs = isStudent ? allLogs.filter(belongsToStudent) : allLogs;
      setLogs(visibleLogs);
      setSearchTerm('');
      setActionFilter('all');
      setShowClearConfirm(false);
      setSelectedLogId(null);
    }
  }, [isOpen, moduleName, isStudent, studentId, studentName]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        log.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.timestamp.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAction =
        actionFilter === 'all' ||
        log.action.toLowerCase() === actionFilter.toLowerCase();

      return matchesSearch && matchesAction;
    });
  }, [logs, searchTerm, actionFilter]);

  const handleCopy = (log: AuditRecord) => {
    const text = `[${log.timestamp}] [${log.action}] ${log.entityName} — By ${log.performedBy}: ${log.details}`;
    navigator.clipboard.writeText(text);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportHistory = () => {
    if (filteredLogs.length === 0) return;
    exportToCSV(
      `${moduleName}_action_history_${Date.now()}`,
      filteredLogs,
      [
        { key: 'timestamp', label: 'Timestamp' },
        { key: 'action', label: 'Action Type' },
        { key: 'entityName', label: 'Target / Record' },
        { key: 'details', label: 'Details / Description' },
        { key: 'performedBy', label: 'Performed By' },
      ]
    );
  };

  const handleClearHistory = () => {
    clearAuditHistory(moduleName);
    setLogs([]);
    setShowClearConfirm(false);
    setSelectedLogId(null);
  };

  const handleResetHistory = () => {
    const defaults = resetAuditHistory(moduleName);
    const visibleLogs = isStudent ? defaults.filter(belongsToStudent) : defaults;
    setLogs(visibleLogs);
    setShowClearConfirm(false);
  };

  const getActionBadgeVariant = (action: AuditActionType): 'active' | 'pending' | 'danger' | 'info' => {
    switch (action) {
      case 'CREATE':
      case 'PAYMENT':
      case 'CHECK_IN':
        return 'active';
      case 'UPDATE':
      case 'ALLOCATE':
      case 'REQUEST':
        return 'info';
      case 'DELETE':
      case 'BULK_DELETE':
        return 'danger';
      case 'STATUS_CHANGE':
      case 'DEALLOCATE':
      case 'CHECK_OUT':
      case 'RESET':
      default:
        return 'pending';
    }
  };

  const moduleDisplayNames: Record<AuditModule, string> = {
    students: isStudent ? 'My Profile & Residency' : 'Students Directory',
    rooms: isStudent ? 'My Room Allotment' : 'Rooms & Bed Allotment',
    fees: isStudent ? 'My Fees & Payments' : 'Fees & Invoicing',
    complaints: isStudent ? 'My Complaints' : 'Maintenance Complaints',
    visitors: isStudent ? 'My Visitors' : 'Visitor Security Log',
    dashboard: isStudent ? 'My Residency Activity' : 'Hostel Overview Activity',
    notices: 'Notice Board Circulars',
  };

  const modalTitle = title || (isStudent ? `${moduleDisplayNames[moduleName]} — My Action History` : `${moduleDisplayNames[moduleName]} — Activity History`);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      maxWidth="1020px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Subtitle & Summary Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            padding: '12px 16px',
            background: 'var(--clr-bg)',
            border: '1px solid var(--clr-border)',
            borderRadius: 'var(--radius-md, 10px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'var(--clr-primary-pale, rgba(99, 102, 241, 0.12))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--clr-primary)',
              flexShrink: 0,
            }}>
              <History size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--clr-text)' }}>
                {isStudent
                  ? 'Personal Timeline & Action Trail'
                  : 'Comprehensive Audit Trail & System Log'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)' }}>
                {isStudent
                  ? 'All changes, room requests, dues paid, and complaint updates linked to your account.'
                  : 'Click any record row to inspect full details, operator credentials, and operational narratives.'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* View Mode Switcher */}
            <div style={{ display: 'flex', gap: 4, background: 'var(--clr-surface-2)', padding: 3, borderRadius: 8, border: '1px solid var(--clr-border)' }}>
              <button
                type="button"
                className={`history-tab-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Table View (Dense & Structured)"
              >
                <List size={14} />
                <span>Table</span>
              </button>
              <button
                type="button"
                className={`history-tab-btn ${viewMode === 'timeline' ? 'active' : ''}`}
                onClick={() => setViewMode('timeline')}
                title="Timeline View (Visual Progression)"
              >
                <Layers size={14} />
                <span>Timeline</span>
              </button>
            </div>

            <span
              style={{
                fontSize: '0.76rem',
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: 999,
                background: 'var(--clr-primary-pale, rgba(99, 102, 241, 0.12))',
                color: 'var(--clr-primary)',
                border: '1px solid var(--clr-primary)',
              }}
            >
              {filteredLogs.length} {filteredLogs.length === 1 ? 'Action' : 'Actions'}
            </span>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--clr-text-muted)',
              }}
            />
            <input
              type="text"
              className="search-input"
              style={{ paddingLeft: 34, width: '100%' }}
              placeholder={isStudent ? 'Search your action history by record, date, or details…' : 'Search by action, record target, operator name, or details…'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--clr-text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                ✕
              </button>
            )}
          </div>

          <select
            className="search-input"
            style={{ width: 170 }}
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
          >
            <option value="all">All Action Types</option>
            <option value="CREATE">Create / Register</option>
            <option value="UPDATE">Update / Edit</option>
            <option value="STATUS_CHANGE">Status Changes</option>
            <option value="ALLOCATE">Bed Allocations</option>
            <option value="DEALLOCATE">Deallocations</option>
            <option value="PAYMENT">Fee Payments</option>
            <option value="CHECK_IN">Check-Ins</option>
            <option value="CHECK_OUT">Check-Outs</option>
            <option value="REQUEST">Student Requests</option>
            <option value="DELETE">Deletions</option>
            <option value="BULK_DELETE">Bulk Deletions</option>
          </select>

          <button
            type="button"
            className="btn btn-outline-dark btn-sm"
            onClick={handleExportHistory}
            disabled={filteredLogs.length === 0}
            title="Export filtered history log to CSV file"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Clear / Reset Confirmation Prompt (Admin only) */}
        {!isStudent && showClearConfirm && (
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md, 8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--clr-danger)' }}>
              <ShieldAlert size={18} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Clear or restore default audit history for this module?
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn btn-outline-dark btn-sm"
                onClick={handleResetHistory}
                title="Restore default sample history records"
              >
                <RotateCcw size={13} />
                <span>Restore Defaults</span>
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleClearHistory}
              >
                Clear All
              </button>
              <button
                type="button"
                className="btn btn-outline-dark btn-sm"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Click Instruction Tip */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.78rem',
          color: 'var(--clr-text-muted)',
          padding: '4px 8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} style={{ color: 'var(--clr-primary)' }} />
            <span>
              <strong>Click any row or entry</strong> below to expand complete action details, operator information, and timestamps.
            </span>
          </div>
          {selectedLogId && (
            <button
              type="button"
              className="btn btn-outline-dark btn-sm"
              style={{ padding: '2px 8px', fontSize: '0.72rem' }}
              onClick={() => setSelectedLogId(null)}
            >
              Collapse Details
            </button>
          )}
        </div>

        {/* MAIN CONTENT AREA */}
        {viewMode === 'table' ? (
          /* Table View */
          <div
            className="table-scroll"
            style={{
              maxHeight: '460px',
              overflowY: 'auto',
              border: '1px solid var(--clr-border)',
              borderRadius: 'var(--radius-md, 10px)',
            }}
          >
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 155 }}>Timestamp</th>
                  <th style={{ width: 120 }}>Action</th>
                  <th style={{ width: 220 }}>Target / Record</th>
                  <th>Action Narrative &amp; Details</th>
                  <th style={{ width: 170 }}>Performed By</th>
                  <th style={{ width: 85, textAlign: 'center' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map(log => {
                    const isExpanded = selectedLogId === log.id;
                    const isCopied = copiedId === log.id;

                    return (
                      <React.Fragment key={log.id}>
                        <tr
                          className={`history-row-clickable ${isExpanded ? 'history-row-selected' : ''}`}
                          onClick={() => setSelectedLogId(prev => prev === log.id ? null : log.id)}
                          title="Click to view full action details"
                        >
                          {/* Timestamp */}
                          <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Clock size={13} style={{ color: 'var(--clr-text-muted)' }} />
                              <span>{log.timestamp}</span>
                            </div>
                          </td>

                          {/* Action Badge */}
                          <td>
                            <Badge variant={getActionBadgeVariant(log.action)}>
                              {log.action.replace('_', ' ')}
                            </Badge>
                          </td>

                          {/* Target / Entity */}
                          <td>
                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--clr-text)' }}>
                              {log.entityName}
                            </span>
                          </td>

                          {/* Details Snippet */}
                          <td>
                            <span style={{
                              fontSize: '0.83rem',
                              color: 'var(--clr-text-secondary)',
                              lineHeight: 1.4,
                              display: '-webkit-box',
                              WebkitLineClamp: isExpanded ? 'none' : 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}>
                              {log.details}
                            </span>
                          </td>

                          {/* Performed By */}
                          <td>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                fontSize: '0.8rem',
                                background: 'var(--clr-bg)',
                                border: '1px solid var(--clr-border)',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-sm, 6px)',
                                maxWidth: '160px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={log.performedBy}
                            >
                              <UserIcon size={12} style={{ color: 'var(--clr-primary)', flexShrink: 0 }} />
                              <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.performedBy}</span>
                            </div>
                          </td>

                          {/* Action button */}
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="history-view-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLogId(prev => prev === log.id ? null : log.id);
                              }}
                              title={isExpanded ? 'Collapse' : 'Expand full details'}
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp size={13} />
                                  <span>Hide</span>
                                </>
                              ) : (
                                <>
                                  <Eye size={13} />
                                  <span>View</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* EXPANDED ROW DETAIL DRAWER */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={6} style={{ padding: 0 }}>
                              <div className="history-detail-drawer">
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                  gap: 16,
                                  marginBottom: 14,
                                }}>
                                  {/* Detail Column 1: Record & Action */}
                                  <div style={{
                                    padding: '12px 14px',
                                    background: 'var(--clr-surface)',
                                    borderRadius: 'var(--radius-sm, 6px)',
                                    border: '1px solid var(--clr-border)',
                                  }}>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--clr-text-muted)', marginBottom: 4 }}>
                                      Target Record / Entity
                                    </div>
                                    <div style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--clr-text)', marginBottom: 8 }}>
                                      {log.entityName}
                                    </div>

                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                      <Badge variant={getActionBadgeVariant(log.action)}>
                                        {log.action.replace('_', ' ')}
                                      </Badge>
                                      {log.studentId && (
                                        <span className="badge badge-light" style={{ fontFamily: 'monospace' }}>
                                          ID: {log.studentId}
                                        </span>
                                      )}
                                      <span className="badge badge-light" style={{ textTransform: 'capitalize' }}>
                                        Module: {log.module}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Detail Column 2: Operator & Time */}
                                  <div style={{
                                    padding: '12px 14px',
                                    background: 'var(--clr-surface)',
                                    borderRadius: 'var(--radius-sm, 6px)',
                                    border: '1px solid var(--clr-border)',
                                  }}>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--clr-text-muted)', marginBottom: 4 }}>
                                      Operator &amp; Execution Timestamp
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 6 }}>
                                      <UserIcon size={14} style={{ color: 'var(--clr-primary)' }} />
                                      <span>{log.performedBy}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                                      <Clock size={13} />
                                      <span>{log.timestamp}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Full Narrative Box */}
                                <div style={{
                                  padding: '12px 14px',
                                  background: 'var(--clr-surface)',
                                  borderRadius: 'var(--radius-sm, 6px)',
                                  border: '1px solid var(--clr-border)',
                                  marginBottom: 12,
                                }}>
                                  <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--clr-text-muted)', marginBottom: 6 }}>
                                    Complete Operation Details &amp; Narrative
                                  </div>
                                  <div style={{ fontSize: '0.88rem', color: 'var(--clr-text)', lineHeight: 1.6 }}>
                                    {log.details}
                                  </div>
                                </div>

                                {/* Bottom Quick Action Buttons */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                                  <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                      type="button"
                                      className="btn btn-outline-dark btn-sm"
                                      onClick={() => handleCopy(log)}
                                      title="Copy record summary to clipboard"
                                    >
                                      {isCopied ? <Check size={13} style={{ color: 'var(--clr-success)' }} /> : <Copy size={13} />}
                                      <span>{isCopied ? 'Copied Summary!' : 'Copy Summary'}</span>
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-outline-dark btn-sm"
                                      onClick={() => setSearchTerm(log.entityName)}
                                      title="Filter history to only show this record"
                                    >
                                      <Search size={13} />
                                      <span>Filter by this Record</span>
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    className="btn btn-outline-dark btn-sm"
                                    onClick={() => setSelectedLogId(null)}
                                  >
                                    Close Inspection ▲
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '44px 20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <History size={36} style={{ color: 'var(--clr-text-muted)', opacity: 0.4 }} />
                        <div style={{ fontWeight: 600, fontSize: '0.98rem', color: 'var(--clr-text)' }}>
                          {isStudent ? 'No personal activity history found for your account' : 'No history records match current filters'}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--clr-text-muted)', maxWidth: 440, lineHeight: 1.5 }}>
                          {searchTerm || actionFilter !== 'all'
                            ? 'Try clearing your search term or selecting "All Action Types".'
                            : isStudent
                            ? 'Your room allocations, maintenance complaints, and payment confirmations will appear here.'
                            : 'All operations on this table are automatically tracked and logged.'}
                        </div>
                        {(searchTerm || actionFilter !== 'all') && (
                          <button
                            type="button"
                            className="btn btn-outline-dark btn-sm"
                            onClick={() => { setSearchTerm(''); setActionFilter('all'); }}
                          >
                            Reset Search &amp; Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Timeline View */
          <div
            style={{
              maxHeight: '460px',
              overflowY: 'auto',
              padding: '12px 16px',
              border: '1px solid var(--clr-border)',
              borderRadius: 'var(--radius-md, 10px)',
              background: 'var(--clr-bg)',
            }}
          >
            {filteredLogs.length > 0 ? (
              <div className="history-timeline">
                {filteredLogs.map(log => {
                  const isExpanded = selectedLogId === log.id;
                  const isCopied = copiedId === log.id;

                  return (
                    <div
                      key={log.id}
                      className="history-timeline-item"
                      onClick={() => setSelectedLogId(prev => prev === log.id ? null : log.id)}
                    >
                      {/* Colored Timeline Dot */}
                      <div
                        className="history-timeline-dot"
                        style={{
                          background:
                            log.action === 'CREATE' || log.action === 'PAYMENT' || log.action === 'CHECK_IN'
                              ? 'var(--clr-success)'
                              : log.action === 'DELETE' || log.action === 'BULK_DELETE'
                              ? 'var(--clr-danger)'
                              : log.action === 'STATUS_CHANGE'
                              ? 'var(--clr-warning)'
                              : 'var(--clr-primary)',
                        }}
                      />

                      {/* Header in Timeline card */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Badge variant={getActionBadgeVariant(log.action)}>
                            {log.action.replace('_', ' ')}
                          </Badge>
                          <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--clr-text)' }}>
                            {log.entityName}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--clr-text-muted)' }}>
                          <Clock size={13} />
                          <span>{log.timestamp}</span>
                        </div>
                      </div>

                      {/* Snippet / Full details */}
                      <div style={{
                        fontSize: '0.85rem',
                        color: 'var(--clr-text-secondary)',
                        lineHeight: 1.5,
                        marginBottom: 8,
                      }}>
                        {log.details}
                      </div>

                      {/* Footer Info */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--clr-text-muted)' }}>
                          <UserIcon size={13} style={{ color: 'var(--clr-primary)' }} />
                          <span>Performed by: <strong>{log.performedBy}</strong></span>
                        </div>

                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            className="history-view-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(log);
                            }}
                            title="Copy to clipboard"
                          >
                            {isCopied ? <Check size={12} style={{ color: 'var(--clr-success)' }} /> : <Copy size={12} />}
                            <span>{isCopied ? 'Copied' : 'Copy'}</span>
                          </button>
                          <button
                            type="button"
                            className="history-view-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLogId(prev => prev === log.id ? null : log.id);
                            }}
                          >
                            {isExpanded ? <ChevronUp size={12} /> : <Eye size={12} />}
                            <span>{isExpanded ? 'Less' : 'Details'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Expanded Section in Timeline */}
                      {isExpanded && (
                        <div style={{
                          marginTop: 12,
                          paddingTop: 12,
                          borderTop: '1px dashed var(--clr-border)',
                          fontSize: '0.82rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}>
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {log.studentId && <div><strong>Resident ID:</strong> {log.studentId}</div>}
                            <div><strong>Module:</strong> {log.module}</div>
                            <div><strong>Record ID:</strong> <span style={{ fontFamily: 'monospace' }}>{log.id}</span></div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--clr-text-muted)' }}>
                No records match current filter.
              </div>
            )}
          </div>
        )}

        {/* Modal Footer Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
            paddingTop: 8,
            borderTop: '1px solid var(--clr-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!isStudent && (
              <button
                type="button"
                className="btn btn-outline-dark btn-sm"
                style={{ color: 'var(--clr-danger)' }}
                onClick={() => setShowClearConfirm(true)}
                title="Clear or restore recorded logs for this table"
              >
                <Trash2 size={13} />
                <span>Manage History Logs</span>
              </button>
            )}
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onClose}
          >
            Close History
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default HistoryModal;
