interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  loading?: boolean
}

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  danger = false,
  loading = false,
}: ConfirmModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface shadow-xl animate-scale-in">
        <div className="px-6 py-5 text-center space-y-4">
          <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${danger ? 'bg-danger/15' : 'bg-primary-subtle'}`}>
            {danger ? (
              <svg className="h-6 w-6 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            ) : (
              <svg className="h-6 w-6 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>

          <div>
            <h3 className="text-base font-semibold text-ink">{title}</h3>
            <p className="mt-1 text-sm text-ink-muted">{message}</p>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-raised transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 ${
                danger
                  ? 'bg-danger hover:bg-red-600 focus:ring-red-500/30'
                  : 'bg-primary hover:bg-primary-dark focus:ring-green-500/30'
              }`}
            >
              {loading ? 'Procesando...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
