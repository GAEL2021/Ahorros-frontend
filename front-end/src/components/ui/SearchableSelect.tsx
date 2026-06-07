import { useState, useRef, useEffect, useMemo } from 'react'

interface Option { value: string; label: string }

interface SearchableSelectProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
}

export default function SearchableSelect({ options, value, onChange, placeholder = 'Seleccionar...', className = '', disabled = false, required = false }: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = options.find((o) => o.value === value)

  const filtered = useMemo(() => {
    if (!search.trim()) return options
    const q = search.toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, search])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const handleSelect = (opt: Option) => {
    onChange(opt.value)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => { if (!disabled) setOpen(!open) }}
        disabled={disabled}
        className={`w-full flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-left transition-colors focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/30'}`}
      >
        <span className={`flex-1 truncate ${selected ? 'text-ink' : 'text-ink-muted'}`}>{selected?.label ?? placeholder}</span>
        <svg className={`h-4 w-4 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-surface shadow-xl animate-fade-in overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-ink placeholder:text-ink-muted focus:border-primary/50 focus:outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-xs text-ink-muted text-center">Sin resultados</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-primary/10 ${opt.value === value ? 'bg-primary/10 text-primary font-semibold' : 'text-ink'}`}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
      {required && <input type="hidden" value={value} />}
    </div>
  )
}
