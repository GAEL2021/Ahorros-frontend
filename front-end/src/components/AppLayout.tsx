import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useVerificarAdmin } from '@/hooks/useVerificarAdmin'

function LoginScreen() {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, authError } = useAuth()
  const [tab, setTab] = useState<'google' | 'email'>('google')
  const [submitting, setSubmitting] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isRegister, setIsRegister] = useState(false)

  const handleGoogleLogin = async () => {
    setSubmitting(true)
    try { await loginWithGoogle() } finally { setSubmitting(false) }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setSubmitting(true)
    try {
      if (isRegister) {
        await registerWithEmail(email, password, name || email.split('@')[0])
      } else {
        await loginWithEmail(email, password)
      }
    } finally { setSubmitting(false) }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0f2f5] px-4">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-subtle" style={{ animation: 'float 3s ease-in-out infinite' }}>
              <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-ink">Ahorros Colaborativos</h1>
            <p className="mt-2 text-sm text-ink-muted">
              {isRegister ? 'Crea tu cuenta gratis' : 'Inicia sesión para gestionar tus metas'}
            </p>
          </div>

          {authError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
              {authError}
            </div>
          )}

          {/* Tabs */}
          <div className="mb-5 flex rounded-xl border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => { setTab('google'); setIsRegister(false) }}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${tab === 'google' ? 'bg-primary-subtle text-primary-dark' : 'bg-white text-ink-muted hover:bg-surface-raised'}`}
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => setTab('email')}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${tab === 'email' ? 'bg-primary-subtle text-primary-dark' : 'bg-white text-ink-muted hover:bg-surface-raised'}`}
            >
              Email
            </button>
          </div>

          {tab === 'google' ? (
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-ink shadow-sm transition-all hover:bg-surface-raised hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {submitting ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
                  Conectando...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continuar con Google
                </>
              )}
            </button>
          ) : (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold text-ink-secondary">Nombre</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Tu nombre"
                      className="w-full rounded-xl border border-border px-3 py-2.5 text-sm placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                )}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="tu@email.com"
                    className="w-full rounded-xl border border-border px-3 py-2.5 text-sm placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">Contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full rounded-xl border border-border px-3 py-2.5 text-sm placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting || !email || password.length < 6 || (isRegister && !name)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                {submitting ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    {isRegister ? 'Creando cuenta...' : 'Iniciando sesión...'}
                  </>
                ) : (
                  isRegister ? 'Crear cuenta' : 'Iniciar sesión'
                )}
              </button>
              <p className="text-center text-[11px] text-ink-muted">
                {isRegister ? (
                  <>¿Ya tienes cuenta?{' '}<button type="button" onClick={() => setIsRegister(false)} className="font-semibold text-primary hover:underline">Inicia sesión</button></>
                ) : (
                  <>¿No tienes cuenta?{' '}<button type="button" onClick={() => setIsRegister(true)} className="font-semibold text-primary hover:underline">Crear una</button></>
                )}
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0f2f5]">
      <div className="flex flex-col items-center gap-3 animate-fade-in">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-subtle">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        </div>
        <p className="text-sm font-medium text-ink-muted">Cargando sesión...</p>
      </div>
    </div>
  )
}

export default function AppLayout() {
  const { user, loading, logout, authError } = useAuth()
  const { data: adminData } = useVerificarAdmin()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (loading) return <LoadingScreen />
  if (!user) return <LoginScreen />

  const esAdmin = adminData?.esAdmin ?? false

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
      isActive
        ? 'bg-primary-subtle text-primary-dark shadow-sm'
        : 'text-ink-secondary hover:text-ink hover:bg-surface-raised'
    }`

  return (
    <div className="flex min-h-screen bg-[#f9faf7]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-white transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo area */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-subtle flex-shrink-0 transition-all duration-500 hover:shadow-[0_0_12px_rgba(13,124,124,0.3)]">
            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-ink leading-tight">Ahorros<br />Colaborativos</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <NavLink to="/" end className={navLinkClass} onClick={() => setSidebarOpen(false)}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Mis Metas
          </NavLink>
          <NavLink to="/carteras" className={navLinkClass} onClick={() => setSidebarOpen(false)}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Carteras
          </NavLink>
          <NavLink to="/programaciones" className={navLinkClass} onClick={() => setSidebarOpen(false)}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Programaciones
          </NavLink>

          {esAdmin && (
            <>
              <div className="pt-3 mt-3 border-t border-border-light">
                <span className="px-3 text-[9px] font-semibold uppercase tracking-widest text-ink-muted">Administración</span>
              </div>
              <NavLink to="/admin/bancos" className={navLinkClass} onClick={() => setSidebarOpen(false)}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Catálogo Bancos
              </NavLink>
            </>
          )}

          <NavLink to="/calendario" className={navLinkClass} onClick={() => setSidebarOpen(false)}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Calendario
          </NavLink>
        </nav>

        {/* User footer */}
        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center gap-3">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName ?? ''} className="h-8 w-8 rounded-full object-cover ring-2 ring-border" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
                {(user.displayName ?? 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-ink truncate">{user.displayName}</p>
              <p className="text-[10px] text-ink-muted truncate">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-md p-1.5 text-ink-muted hover:bg-surface-raised hover:text-ink transition-colors flex-shrink-0"
              title="Cerrar sesión"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile header bar */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-white/95 backdrop-blur-md px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl p-1.5 text-ink-muted hover:bg-surface-raised hover:text-ink transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-subtle flex-shrink-0">
            <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-ink">Ahorros Colaborativos</span>
        </header>

        {/* Auth error banner */}
        {authError && (
          <div className="border-b border-red-200 bg-red-50 px-4 py-2.5 text-sm text-danger">
            {authError}
          </div>
        )}

        {/* Page content */}
        <Outlet />
      </div>
    </div>
  )
}
