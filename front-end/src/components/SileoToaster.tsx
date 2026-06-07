import { useEffect, useState } from 'react'
import {
  subscribe,
  setDefaultPosition,
  sileo,
  type ToastInstance,
  type SileoPosition,
} from '@/lib/sileo'

interface ToasterProps {
  position?: SileoPosition
}

function getPositionClasses(pos: SileoPosition) {
  const containerY = pos.startsWith('top') ? 'sil-container-top' : 'sil-container-bottom'
  switch (pos) {
    case 'top-left': return `top-4 left-4 items-start ${containerY}`
    case 'top-center': return `top-4 left-1/2 -translate-x-1/2 items-center ${containerY}`
    case 'top-right': return `top-4 right-4 items-end ${containerY}`
    case 'bottom-left': return `bottom-4 left-4 items-start ${containerY}`
    case 'bottom-center': return `bottom-4 left-1/2 -translate-x-1/2 items-center ${containerY}`
    case 'bottom-right': return `bottom-4 right-4 items-end ${containerY}`
  }
}

function typeColors(type: ToastInstance['type']): { card: string; icon: string } {
  switch (type) {
    case 'success': return { card: 'bg-emerald-600', icon: 'text-white' }
    case 'error': return { card: 'bg-red-600', icon: 'text-white' }
    case 'warning': return { card: 'bg-amber-500', icon: 'text-white' }
    case 'loading': return { card: 'bg-surface border border-border', icon: 'text-primary' }
    case 'info': return { card: 'bg-primary', icon: 'text-[var(--bg)]' }
    case 'action': return { card: 'bg-purple-600', icon: 'text-white' }
  }
}

function ToastCard({ toast }: { toast: ToastInstance }) {
  const colors = typeColors(toast.type)

  return (
    <div
      className={`sil-toast flex items-start gap-3 rounded-xl px-4 py-3 shadow-xl transition-all ${colors.card} ${toast.exiting ? 'sil-toast-exiting' : ''}`}
      role="alert"
      style={{ maxWidth: 380, minWidth: 280 }}
      onClick={() => { if (!toast.button) sileo.dismiss(toast.id) }}
    >
      <div className={`flex-shrink-0 mt-0.5 ${colors.icon}`}>
        {toast.type === 'success' && (
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )}
        {toast.type === 'error' && (
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )}
        {toast.type === 'warning' && (
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )}
        {toast.type === 'loading' && (
          <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white sil-spinner" />
        )}
        {toast.type === 'info' && (
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-snug">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-xs text-white/80 leading-relaxed">{toast.description}</p>
        )}
        {toast.button && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              toast.button!.onClick()
              sileo.dismiss(toast.id)
            }}
            className="mt-2 inline-flex items-center rounded-lg bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30 transition-colors"
          >
            {toast.button.title}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          sileo.dismiss(toast.id)
        }}
        className="flex-shrink-0 rounded-md p-0.5 text-white/70 hover:text-white transition-colors"
        aria-label="Cerrar"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export default function SileoToaster({ position = 'bottom-right' }: ToasterProps) {
  const [toasts, setToasts] = useState<ToastInstance[]>([])

  useEffect(() => {
    setDefaultPosition(position)
  }, [position])

  useEffect(() => {
    const unsub = subscribe((updated) => {
      setToasts(updated.filter((t) => t.position === position))
    })
    return unsub
  }, [position])

  const posClasses = getPositionClasses(position)

  return (
    <div
      aria-live="polite"
      className={`fixed z-[100] flex flex-col gap-2 pointer-events-none ${posClasses}`}
      style={{ margin: 0 }}
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastCard toast={t} />
        </div>
      ))}
    </div>
  )
}
