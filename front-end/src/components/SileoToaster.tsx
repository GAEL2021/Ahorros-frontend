import { useEffect, useState, useRef } from 'react'
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

function TypeIcon({ type }: { type: ToastInstance['type'] }) {
  switch (type) {
    case 'success':
      return (
        <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    case 'error':
      return (
        <svg className="h-4 w-4 text-rose-600" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      )
    case 'warning':
      return (
        <svg className="h-4 w-4 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )
    case 'loading':
      return (
        <div className="h-4 w-4 rounded-full border-2 border-primary/30 border-t-primary sil-spinner" />
      )
    case 'info':
    default:
      return (
        <svg className="h-4 w-4 text-sky-600" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      )
  }
}

function typeColors(type: ToastInstance['type']): { bg: string; border: string; fill: string; dot: string } {
  switch (type) {
    case 'success': return { bg: 'bg-success/10', border: 'border-success/30', fill: '#d1fae5', dot: '#059669' }
    case 'error': return { bg: 'bg-danger/10', border: 'border-danger/30', fill: '#ffe4e6', dot: '#e11d48' }
    case 'warning': return { bg: 'bg-amber-50', border: 'border-amber-200', fill: '#fef3c7', dot: '#d97706' }
    case 'loading': return { bg: 'bg-surface', border: 'border-primary/20', fill: '#ccfbf1', dot: '#0d7c7c' }
    case 'info': return { bg: 'bg-primary/10', border: 'border-primary/20', fill: '#e0f2fe', dot: '#0284c7' }
    case 'action': return { bg: 'bg-violet-50', border: 'border-violet-200', fill: '#ede9fe', dot: '#7c3aed' }
  }
}

function ToastCard({ toast }: { toast: ToastInstance }) {
  const colors = typeColors(toast.type)
  const blobId = useRef(`sil-blob-${toast.id}`).current

  return (
    <div
      className={`sil-toast relative flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-sm transition-all ${colors.bg} ${colors.border} ${toast.exiting ? 'sil-toast-exiting' : ''}`}
      role="alert"
      style={{ maxWidth: 380, minWidth: 280 }}
      onClick={() => { if (!toast.button) sileo.dismiss(toast.id) }}
    >
      {/* Gooey SVG blob behind the toast */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none -z-10 opacity-60"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <filter id={blobId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
        {/* Three morphing circles */}
        <circle cx="20" cy="50" r="18" fill={colors.fill} filter={`url(#${blobId})`}>
          <animate attributeName="cx" values="20;30;15;20" dur="4s" repeatCount="indefinite" />
          <animate attributeName="cy" values="50;40;55;50" dur="5s" repeatCount="indefinite" />
          <animate attributeName="r" values="18;22;16;18" dur="3.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="55" cy="40" r="16" fill={colors.fill} filter={`url(#${blobId})`}>
          <animate attributeName="cx" values="55;45;60;55" dur="3.8s" repeatCount="indefinite" />
          <animate attributeName="cy" values="40;50;35;40" dur="4.2s" repeatCount="indefinite" />
          <animate attributeName="r" values="16;20;14;16" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="80" cy="55" r="20" fill={colors.fill} filter={`url(#${blobId})`}>
          <animate attributeName="cx" values="80;70;85;80" dur="4.5s" repeatCount="indefinite" />
          <animate attributeName="cy" values="55;65;50;55" dur="3.6s" repeatCount="indefinite" />
          <animate attributeName="r" values="20;24;18;20" dur="3.2s" repeatCount="indefinite" />
        </circle>
      </svg>

      {/* Icon badge */}
      <div className="flex-shrink-0 mt-0.5">
        <TypeIcon type={toast.type} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink leading-snug">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-xs text-ink-secondary leading-relaxed">{toast.description}</p>
        )}
        {toast.button && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              toast.button!.onClick()
              sileo.dismiss(toast.id)
            }}
            className="mt-2 inline-flex items-center rounded-lg bg-ink/10 px-3 py-1 text-xs font-semibold text-ink hover:bg-ink/15 transition-colors"
          >
            {toast.button.title}
          </button>
        )}
      </div>

      {/* Close */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          sileo.dismiss(toast.id)
        }}
        className="flex-shrink-0 rounded-md p-0.5 text-ink-muted hover:text-ink transition-colors"
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
