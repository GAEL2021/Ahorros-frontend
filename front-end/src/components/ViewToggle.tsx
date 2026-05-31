import React from 'react';

interface ViewToggleProps {
  viewMode: 'card' | 'table';
  onToggle: (mode: 'card' | 'table') => void;
}

/** Simple view‑mode switcher (cards ↔ table) */
export const ViewToggle: React.FC<ViewToggleProps> = ({ viewMode, onToggle }) => (
  <div className="flex items-center gap-2 mb-4 animate-fade-in">
    <button
      className={`btn btn-sm ${viewMode === 'card' ? 'btn-primary' : 'btn-outline'}`}
      onClick={() => onToggle('card')}
    >
      Tarjetas
    </button>
    <button
      className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-outline'}`}
      onClick={() => onToggle('table')}
    >
      Tabla
    </button>
  </div>
);
