import React, { type ReactNode } from 'react';
import { CheckSquare, X } from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  onClear: () => void;
  children: ReactNode;
}

const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  totalCount,
  onClear,
  children,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="bulk-action-bar">
      <div className="bulk-action-left">
        <CheckSquare size={16} className="bulk-icon" />
        <span className="bulk-count">
          <strong>{selectedCount}</strong> of {totalCount} selected
        </span>
      </div>
      <div className="bulk-action-right">
        {children}
        <button
          type="button"
          className="btn btn-outline-dark btn-sm bulk-clear-btn"
          onClick={onClear}
          title="Deselect all"
        >
          <X size={14} />
          <span>Deselect</span>
        </button>
      </div>
    </div>
  );
};

export default BulkActionBar;
