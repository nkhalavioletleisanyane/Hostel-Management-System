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
import {
  History,
  Search,
  Download,
  Trash2,
  RotateCcw,
  Clock,
  User as UserIcon,
  ShieldAlert,
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
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Reload history logs whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setLogs(getAuditHistory(moduleName));
      setSearchTerm('');
      setActionFilter('all');
      setShowClearConfirm(false);
    }
  }, [isOpen, moduleName]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        log.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.timestamp.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAction =
        actionFilter === 'all' ||
        log.action.toLowerCase() === actionFilter.toLowerCase();

      return matchesSearch && matchesAction;
    });
  }, [logs, searchTerm, actionFilter]);

  const handleExportHistory = () => {
    if (filteredLogs.length === 0) return;
    exportToCSV(
      `${moduleName}_table_action_history_${Date.now()}`,
      filteredLogs,
      [
        { key: 'timestamp', label: 'Timestamp' },
        { key: 'action', label: 'Action' },
        { key: 'entityName', label: 'Target / Record' },
        { key: 'details', label: 'Details / What Was Done' },
        { key: 'performedBy', label: 'Performed By' },
      ]
    );
  };

  const handleClearHistory = () => {
    clearAuditHistory(moduleName);
    setLogs([]);
    setShowClearConfirm(false);
  };

  const handleResetHistory = () => {
    const defaultLogs = resetAuditHistory(moduleName);
    setLogs(defaultLogs);
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
    students: 'Students Directory',
    rooms: 'Rooms & Bed Allotment',
    fees: 'Fees & Invoicing',
    complaints: 'Maintenance Complaints',
    visitors: 'Visitor Security Log',
  };

  const modalTitle = title || `${moduleDisplayNames[moduleName]} — Action History`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      maxWidth="900px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Subtitle & Summary Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
            padding: '10px 14px',
            background: 'var(--clr-bg)',
            border: '1px solid var(--clr-border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <History size={18} style={{ color: 'var(--clr-primary)' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-secondary)' }}>
              Comprehensive audit trail of additions, modifications, status changes, and deletions performed on this table.
            </span>
          </div>
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 999,
              background: 'var(--clr-primary-pale)',
              color: 'var(--clr-primary)',
            }}
          >
            {filteredLogs.length} {filteredLogs.length === 1 ? 'Action Recorded' : 'Actions Recorded'}
          </span>
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
              placeholder="Search action, record name, operator, or details…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="search-input"
            style={{ width: 170 }}
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
          >
            <option value="all">All Action Types</option>
            <option value="CREATE">Create / Add</option>
            <option value="UPDATE">Update / Edit</option>
            <option value="STATUS_CHANGE">Status Changes</option>
            <option value="ALLOCATE">Bed Allocations</option>
            <option value="DEALLOCATE">Deallocations</option>
            <option value="PAYMENT">Fee Payments</option>
            <option value="CHECK_IN">Check-Ins</option>
            <option value="CHECK_OUT">Check-Outs</option>
            <option value="REQUEST">Resident Requests</option>
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

        {/* Clear Confirmation Prompt */}
        {showClearConfirm && (
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--clr-danger)' }}>
              <ShieldAlert size={18} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Are you sure you want to clear all history records for this table?
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleClearHistory}
              >
                Yes, Clear All
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

        {/* Audit Log Table */}
        <div
          className="table-scroll"
          style={{
            maxHeight: '440px',
            overflowY: 'auto',
            border: '1px solid var(--clr-border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 160 }}>Timestamp</th>
                <th style={{ width: 120 }}>Action</th>
                <th style={{ width: 220 }}>Target / Record</th>
                <th>What Was Done / Details</th>
                <th style={{ width: 180 }}>Performed By</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map(log => (
                  <tr key={log.id}>
                    {/* Timestamp */}
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
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
                      <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--clr-text)' }}>
                        {log.entityName}
                      </span>
                    </td>

                    {/* Details */}
                    <td>
                      <span style={{ fontSize: '0.84rem', color: 'var(--clr-text-secondary)', lineHeight: 1.4 }}>
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
                          fontSize: '0.82rem',
                          background: 'var(--clr-bg)',
                          border: '1px solid var(--clr-border)',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <UserIcon size={12} style={{ color: 'var(--clr-primary)' }} />
                        <span style={{ fontWeight: 500 }}>{log.performedBy}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <History size={32} style={{ color: 'var(--clr-text-muted)', opacity: 0.5 }} />
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--clr-text)' }}>
                        No history records found
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--clr-text-muted)' }}>
                        {searchTerm || actionFilter !== 'all'
                          ? 'Try adjusting your search criteria or action filter.'
                          : 'No recorded operations on this table yet.'}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
            <button
              type="button"
              className="btn btn-outline-dark btn-sm"
              onClick={handleResetHistory}
              title="Restore standard sample history entries"
            >
              <RotateCcw size={13} />
              <span>Restore Demo Logs</span>
            </button>
            <button
              type="button"
              className="btn btn-outline-dark btn-sm"
              style={{ color: 'var(--clr-danger)' }}
              onClick={() => setShowClearConfirm(true)}
              title="Clear all recorded logs for this table"
            >
              <Trash2 size={13} />
              <span>Clear History</span>
            </button>
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
