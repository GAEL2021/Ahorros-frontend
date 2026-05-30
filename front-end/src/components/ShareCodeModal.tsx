import { useState } from 'react'

interface ShareCodeModalProps {
  open: boolean
  onClose: () => void
  codigo: string
  metaNombre: string
}

function CopyIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

function CopiedIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

export default function ShareCodeModal({
  open,
  onClose,
  codigo,
  metaNombre,
}: ShareCodeModalProps) {
  const [copied, setCopied] = useState(false)

  if (!open) return null

  const shareText = encodeURIComponent(
    `¡Únete a mi meta de ahorro "${metaNombre}" en Ahorros Colaborativos! Usa el código: ${codigo}`
  )

  const whatsappUrl = `https://wa.me/?text=${shareText}`
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?quote=${shareText}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      const input = document.getElementById('share-code-input') as HTMLInputElement
      input?.select()
      input?.setSelectionRange(0, 999)
    }
  }

  const handleShare = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface shadow-xl animate-scale-in">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-base font-semibold text-ink">Compartir meta</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-ink-muted hover:bg-surface-raised hover:text-ink transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-6 space-y-5">
          <p className="text-sm text-ink-muted text-center">
            Invita a tus amigos a unirse a{' '}
            <span className="font-semibold text-ink">{metaNombre}</span>
          </p>

          {/* Code display */}
          <div className="rounded-lg border-2 border-dashed border-primary/20 bg-primary-subtle/50 px-4 py-4">
            <p className="text-center text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-2">
              Código de invitación
            </p>
            <input
              id="share-code-input"
              readOnly
              value={codigo}
              className="w-full bg-transparent text-center text-3xl font-bold tracking-[0.35em] text-primary outline-none select-all"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            />
          </div>

          {/* Share buttons */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* WhatsApp */}
            <button
              type="button"
              onClick={() => handleShare(whatsappUrl)}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-success/30 bg-success/10 px-3 py-3 text-success transition-all hover:bg-success/15 hover:border-success/40 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-success/20"
            >
              <WhatsAppIcon />
              <span className="text-[11px] font-semibold">WhatsApp</span>
            </button>

            {/* Facebook */}
            <button
              type="button"
              onClick={() => handleShare(facebookUrl)}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-primary/20 bg-primary-subtle/50 px-3 py-3 text-primary-dark transition-all hover:bg-primary-subtle hover:border-primary/50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <FacebookIcon />
              <span className="text-[11px] font-semibold">Facebook</span>
            </button>

            {/* Copy */}
            <button
              type="button"
              onClick={handleCopy}
              className={`flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 transition-all hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                copied
                  ? 'border-emerald-300 bg-success/10 text-emerald-700'
                  : 'border-primary/20 bg-primary-subtle text-primary hover:bg-primary-subtle hover:border-primary/50'
              }`}
            >
              {copied ? <CopiedIcon /> : <CopyIcon />}
              <span className="text-[11px] font-semibold">{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>

          <p className="text-[11px] text-ink-muted text-center">
            Tus amigos deben usar este código en la sección "Unirse a una meta" del dashboard.
          </p>
        </div>
      </div>
    </div>
  )
}
