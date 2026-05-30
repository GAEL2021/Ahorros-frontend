export type SileoPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
export type SileoType = 'success' | 'error' | 'warning' | 'info' | 'action' | 'loading'

export interface SileoButton {
  title: string
  onClick: () => void
}

export interface SileoOptions {
  title?: string
  description?: string
  position?: SileoPosition
  duration?: number | null
  type?: SileoType
  button?: SileoButton
}

export interface SileoPromiseOptions<T = unknown> {
  loading: SileoOptions
  success: SileoOptions | ((data: T) => SileoOptions)
  error: SileoOptions | ((err: unknown) => SileoOptions)
  position?: SileoPosition
}

export interface ToastInstance {
  id: string
  title: string
  description?: string
  type: SileoType
  position: SileoPosition
  duration: number | null
  createdAt: number
  button?: SileoButton
  exiting?: boolean
}

type Listener = (toasts: ToastInstance[]) => void

let toasts: ToastInstance[] = []
let listeners: Listener[] = []
let defaultPosition: SileoPosition = 'bottom-right'

function notify() {
  const snapshot = [...toasts]
  listeners.forEach((fn) => fn(snapshot))
}

function add(toast: ToastInstance) {
  toasts = [...toasts, toast]
  notify()
  if (toast.duration !== null) {
    const ms = toast.duration ?? 6000
    setTimeout(() => dismiss(toast.id), ms)
  }
}

function dismiss(id: string) {
  toasts = toasts.map((t) => (t.id === id ? { ...t, exiting: true } : t))
  notify()
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    notify()
  }, 400)
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function fire(title: string, opts?: SileoOptions): string {
  const id = uid()
  add({
    id,
    title,
    description: opts?.description,
    type: opts?.type ?? 'success',
    position: opts?.position ?? defaultPosition,
    duration: opts?.duration ?? 6000,
    createdAt: Date.now(),
    button: opts?.button,
  })
  return id
}

export function subscribe(fn: Listener) {
  listeners.push(fn)
  return () => {
    listeners = listeners.filter((l) => l !== fn)
  }
}

export function setDefaultPosition(pos: SileoPosition) {
  defaultPosition = pos
}

export const sileo = {
  success(title: string, opts?: Omit<SileoOptions, 'type'>): string {
    return fire(title, { ...opts, type: 'success' })
  },

  error(title: string, opts?: Omit<SileoOptions, 'type'>): string {
    return fire(title, { ...opts, type: 'error', duration: opts?.duration ?? 8000 })
  },

  warning(title: string, opts?: Omit<SileoOptions, 'type'>): string {
    return fire(title, { ...opts, type: 'warning' })
  },

  info(title: string, opts?: Omit<SileoOptions, 'type'>): string {
    return fire(title, { ...opts, type: 'info' })
  },

  show(title: string, opts?: SileoOptions): string {
    return fire(title, { ...opts })
  },

  action(title: string, opts?: Omit<SileoOptions, 'type'> & { button: SileoButton }): string {
    return fire(title, { ...opts, type: 'action', button: opts?.button })
  },

  loading(title: string, opts?: Omit<SileoOptions, 'type'>): string {
    return fire(title, { ...opts, type: 'loading', duration: null })
  },

  dismiss(id: string): void {
    dismiss(id)
  },

  clear(position?: SileoPosition): void {
    if (position) {
      toasts.forEach((t) => {
        if (t.position === position) dismiss(t.id)
      })
    } else {
      toasts.forEach((t) => dismiss(t.id))
    }
  },

  async promise<T>(promise: Promise<T>, opts: SileoPromiseOptions<T>): Promise<T> {
    const id = fire(opts.loading.title ?? 'Cargando...', {
      ...opts.loading,
      type: 'loading',
      duration: null,
      position: opts.position,
    })
    try {
      const data = await promise
      dismiss(id)
      const successOpts = typeof opts.success === 'function' ? opts.success(data) : opts.success
      fire(successOpts.title ?? 'Completado', { ...successOpts, type: 'success', position: opts.position })
      return data
    } catch (err) {
      dismiss(id)
      const errorOpts = typeof opts.error === 'function' ? opts.error(err) : opts.error
      fire(errorOpts.title ?? 'Error', { ...errorOpts, type: 'error', duration: 8000, position: opts.position })
      throw err
    }
  },
}
