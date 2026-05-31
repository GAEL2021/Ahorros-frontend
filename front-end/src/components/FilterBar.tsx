import React from 'react';

type ViewMode = 'cards' | 'table';

type FilterBarProps = {
  filterText: string;
  setFilterText: (value: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  resultsCount: number;
  typeOptions?: { label: string; value: string }[];
  typeFilter?: string;
  setTypeFilter?: (value: string) => void;
};

export const FilterBar: React.FC<FilterBarProps> = ({
  filterText,
  setFilterText,
  viewMode,
  setViewMode,
  resultsCount,
  typeOptions,
  typeFilter,
  setTypeFilter,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3 p-2 bg-surface-raised border border-border/80 rounded-2xl shadow-sm mb-6 animate-fade-in font-sans">
      {/* Search Input Container */}
      <div className="relative flex-1 min-w-0 flex items-center">
        <svg
          className="absolute left-3.5 h-4 w-4 text-ink-muted pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Filtrar por nombre, descripción o tipo..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm bg-transparent border-0 focus:ring-0 placeholder:text-ink-muted/60 focus:outline-none text-ink"
        />
      </div>

      {/* Controls & Switcher Section */}
      <div className="flex items-center justify-between md:justify-end gap-3 flex-wrap pl-3.5 pr-2 py-1 md:py-0 border-t md:border-t-0 border-border/40">
        {/* Optional Type Dropdown */}
        {typeOptions && setTypeFilter && (
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-auto py-1 px-3 bg-surface border border-border text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-ink-secondary"
          >
            <option value="">Todos</option>
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {/* Results Badge */}
        <span className="inline-flex items-center rounded-xl bg-ink/5 dark:bg-white/5 border border-border/50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-ink-muted select-none">
          {resultsCount} Resultados
        </span>

        {/* Segmented View Switcher Control */}
        <div className="flex items-center bg-ink/5 dark:bg-white/5 p-1 rounded-xl border border-border/40 select-none">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'cards'
                ? 'bg-primary text-white shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Tarjetas
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'table'
                ? 'bg-primary text-white shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Tabla
          </button>
        </div>
      </div>
    </div>
  );
};
