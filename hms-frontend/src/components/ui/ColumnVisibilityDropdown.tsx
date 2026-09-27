import React, { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal } from 'lucide-react';

export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  required?: boolean; // Cannot be hidden (e.g. actions or name)
}

interface ColumnVisibilityDropdownProps {
  columns: ColumnConfig[];
  onChange: (columns: ColumnConfig[]) => void;
}

const ColumnVisibilityDropdown: React.FC<ColumnVisibilityDropdownProps> = ({
  columns,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleColumn = (key: string) => {
    const updated = columns.map(col => {
      if (col.key === key && !col.required) {
        return { ...col, visible: !col.visible };
      }
      return col;
    });
    onChange(updated);
  };

  const selectAll = () => {
    onChange(columns.map(c => ({ ...c, visible: true })));
  };

  const resetAll = () => {
    onChange(columns.map(c => ({ ...c, visible: true })));
  };

  const visibleCount = columns.filter(c => c.visible).length;

  return (
    <div className="column-dropdown-container" ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className={`btn btn-outline-dark btn-sm ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Customize visible columns"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        <SlidersHorizontal size={14} />
        <span>Columns</span>
        <span className="badge badge-vacant" style={{ padding: '1px 6px', fontSize: '0.68rem', marginLeft: 2 }}>
          {visibleCount}/{columns.length}
        </span>
      </button>

      {isOpen && (
        <div className="column-dropdown-menu">
          <div className="column-dropdown-header">
            <span>Toggle Columns</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className="column-text-btn"
                onClick={selectAll}
              >
                All
              </button>
              <button
                type="button"
                className="column-text-btn"
                onClick={resetAll}
              >
                Reset
              </button>
            </div>
          </div>
          <div className="column-dropdown-list">
            {columns.map(col => (
              <label
                key={col.key}
                className={`column-item ${col.required ? 'disabled' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={col.visible}
                  disabled={col.required}
                  onChange={() => toggleColumn(col.key)}
                />
                <span className="column-item-label">{col.label}</span>
                {col.required && <span className="column-required-badge">Locked</span>}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnVisibilityDropdown;
