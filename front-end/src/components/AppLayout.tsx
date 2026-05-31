import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useVerificarAdmin } from '@/hooks/useVerificarAdmin'
import { useTheme } from '@/contexts/ThemeContext'
/* eslint-disable react-hooks/rules-of-hooks */

function LoginScreen() {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, authError } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isRegister, setIsRegister] = useState(false)

  const handleGoogleLogin = async () => { setSubmitting(true); try { await loginWithGoogle() } finally { setSubmitting(false) } }
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); if (!email || !password) return; setSubmitting(true); try { if (isRegister) await registerWithEmail(email, password, name || email.split('@')[0]); else await loginWithEmail(email, password) } finally { setSubmitting(false) } }

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <div className="flex flex-col lg:flex-row w-full">
        <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 lg:py-0">
          <div className="max-w-lg mx-auto lg:mx-0 animate-slide-up">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-subtle border border-primary/20" style={{ animation: 'float 3s ease-in-out infinite' }}>
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h1 className="text-2xl lg:text-3xl font-semibold text-ink tracking-tight">Ahorros<br />Colaborativos</h1>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-ink leading-tight mb-4">Tu bóveda digital para <span className="text-shimmer">ahorrar en grupo</span></h2>
            <p className="text-base text-ink-muted mb-10 leading-relaxed">La forma más inteligente de alcanzar metas financieras juntos. Creá metas, invitá a otros, automatizá aportes y ganá medallas mientras ahorrás.</p>
            <div className="space-y-4 mb-10">
              {[{ icon: '🎯', title: 'Metas colaborativas', desc: 'Ahorrá en grupo con amigos y familia. Cada uno aporta su parte.' }, { icon: '🏦', title: 'Carteras inteligentes', desc: 'Conectá tus cuentas y automatizá aportes mensuales.' }, { icon: '🏆', title: 'Logros y medallas', desc: 'Desbloqueá insignias mientras cumplís tus objetivos.' }].map((f, i) => (
                <div key={i} className="flex gap-4 items-start animate-reveal" style={{ animationDelay: `${0.2 + i * 0.15}s` }}>
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-surface border border-border text-xl">{f.icon}</div>
                  <div><h3 className="text-sm font-semibold text-ink">{f.title}</h3><p className="text-xs text-ink-muted mt-0.5">{f.desc}</p></div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-ink-muted">Más de 1,000 personas ya están ahorrando con Ahorros Colaborativos.</p>
          </div>
        </div>
        <div className="flex items-center justify-center px-6 py-8 lg:w-[480px] lg:border-l lg:border-border lg:bg-[var(--bg-sidebar)]/50">
          <div className="w-full max-w-sm animate-slide-up">
            <div className="glass rounded-2xl p-8">
              <div className="mb-6"><h2 className="text-xl font-semibold text-ink">{isRegister ? 'Creá tu bóveda' : 'Abrí tu bóveda'}</h2><p className="text-sm text-ink-muted mt-1">{isRegister ? 'Empezá a ahorrar en grupo hoy.' : 'Continuá donde lo dejaste.'}</p></div>
              {authError && <div className="mb-5 rounded-xl border border-danger/30 bg-danger-subtle px-4 py-3 text-sm text-danger">{authError}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                {isRegister && <div><label className="mb-1.5 block text-xs font-semibold text-ink-secondary">Nombre</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Tu nombre completo" className="w-full rounded-xl border border-border bg-[var(--bg-input)] px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors" /></div>}
                <div><label className="mb-1.5 block text-xs font-semibold text-ink-secondary">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tu@email.com" className="w-full rounded-xl border border-border bg-[var(--bg-input)] px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors" /></div>
                <div><label className="mb-1.5 block text-xs font-semibold text-ink-secondary">Contraseña</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Mínimo 6 caracteres" className="w-full rounded-xl border border-border bg-[var(--bg-input)] px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors" /></div>
                <button type="submit" disabled={submitting || !email || password.length < 6 || (isRegister && !name)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-[var(--bg)] shadow-lg shadow-primary/20 transition-all hover:bg-primary-light active:scale-[0.98] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {submitting ? <div className="flex items-center gap-2"><div className="h-5 w-5 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />{isRegister ? 'Creando bóveda...' : 'Abriendo...'}</div> : isRegister ? 'Crear bóveda' : 'Abrir bóveda'}
                </button>
              </form>
              <div className="my-5 flex items-center gap-3"><div className="h-px flex-1 bg-border" /><span className="text-xs text-ink-muted">o continúa con</span><div className="h-px flex-1 bg-border" /></div>
              <button type="button" onClick={handleGoogleLogin} disabled={submitting} className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-ink transition-all hover:border-primary/30 hover:bg-surface-raised active:scale-[0.98] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/30">
                {submitting ? <><div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />Conectando...</> : <><svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>Continuar con Google</>}
              </button>
              <p className="text-center text-xs text-ink-muted mt-5">{isRegister ? <span>¿Ya tienes bóveda? <button type="button" onClick={() => setIsRegister(false)} className="font-semibold text-primary hover:underline">Entrar</button></span> : <span>¿Primera vez? <button type="button" onClick={() => setIsRegister(true)} className="font-semibold text-primary hover:underline">Crear bóveda</button></span>}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)]">
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <div className="relative flex h-28 w-28 items-center justify-center">
          {/* Glowing background aura */}
          <div className="absolute inset-0 rounded-full bg-primary/25 blur-xl animate-vault-glow" />
          
          {/* Vault Door SVG */}
          <svg className="relative h-24 w-24 text-primary drop-shadow-[0_0_15px_rgba(201,168,76,0.35)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer heavy circular frame */}
            <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="4" className="opacity-20" />
            <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" className="opacity-40 animate-[spin_60s_linear_infinite]" />
            
            {/* Middle lock dial with notches */}
            <circle cx="50" cy="50" r="34" stroke="currentColor" strokeWidth="3" className="opacity-30" />
            <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" className="opacity-60" />
            
            {/* Lock dial numbers index indicators */}
            <circle cx="50" cy="50" r="26" stroke="currentColor" strokeWidth="1" strokeDasharray="1 8" className="opacity-50" />
            
            {/* Animated Vault Wheel/Handle Spokes */}
            <g className="animate-dial-turn origin-[50px_50px]">
              {/* Outer wheel ring of the handle */}
              <circle cx="50" cy="50" r="18" stroke="currentColor" strokeWidth="3" className="drop-shadow-[0_0_4px_rgba(201,168,76,0.5)]" />
              
              {/* 3 Heavy spokes */}
              <line x1="50" y1="50" x2="50" y2="14" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
              <line x1="50" y1="50" x2="19" y2="68" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
              <line x1="50" y1="50" x2="81" y2="68" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
              
              {/* Handle Knobs at the end of spokes */}
              <circle cx="50" cy="14" r="5" fill="currentColor" className="text-primary-light" />
              <circle cx="19" cy="68" r="5" fill="currentColor" className="text-primary-light" />
              <circle cx="81" cy="68" r="5" fill="currentColor" className="text-primary-light" />
              
              {/* Central hub cover */}
              <circle cx="50" cy="50" r="8" fill="currentColor" stroke="var(--bg)" strokeWidth="2" />
              <circle cx="50" cy="50" r="4" fill="var(--bg)" />
            </g>
          </svg>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-base font-semibold text-shimmer tracking-wider">Abriendo bóveda...</p>
          <span className="h-1 w-12 rounded-full bg-primary/10 overflow-hidden relative">
            <span className="absolute inset-y-0 left-0 bg-primary w-1/2 rounded-full animate-[shimmer_1.5s_infinite_linear]" style={{ backgroundSize: '200% 100%' }} />
          </span>
        </div>
      </div>
    </div>
  )
}

export default function AppLayout() {
  const { user, loading, logout, authError } = useAuth()
  const { data: adminData } = useVerificarAdmin()
  const { theme, toggle: toggleTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (loading) return <LoadingScreen />
  if (!user) return <LoginScreen />

  const esAdmin = adminData?.esAdmin ?? false
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
      isActive ? 'bg-primary/10 text-primary' : 'text-ink-muted hover:text-ink hover:bg-surface'
    }`

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-[var(--bg-sidebar)] transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-subtle border border-primary/20 flex-shrink-0 transition-all duration-500 hover:shadow-[0_0_16px_rgba(201,168,76,0.25)]">
            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <span className="text-sm font-semibold text-ink leading-tight">Ahorros<br />Colaborativos</span>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <NavLink to="/" end className={navLinkClass} onClick={() => setSidebarOpen(false)}><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>Dashboard</NavLink>
          <NavLink to="/metas" className={navLinkClass} onClick={() => setSidebarOpen(false)}><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>Mis Metas</NavLink>
          <NavLink to="/carteras" className={navLinkClass} onClick={() => setSidebarOpen(false)}><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>Carteras</NavLink>
          <NavLink to="/programaciones" className={navLinkClass} onClick={() => setSidebarOpen(false)}><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Programaciones</NavLink>
          {/* <NavLink to="/presupuestos" className={navLinkClass} onClick={() => setSidebarOpen(false)}><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>Presupuestos</NavLink> */}
          <NavLink to="/logros" className={navLinkClass} onClick={() => setSidebarOpen(false)}><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>Logros</NavLink>
          <NavLink to="/showcase" className={navLinkClass} onClick={() => setSidebarOpen(false)}><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>Showcase UI</NavLink>
          {esAdmin && <><div className="pt-3 mt-3 border-t border-border"><span className="px-3 text-[9px] font-semibold uppercase tracking-widest text-ink-muted">Admin</span></div><NavLink to="/admin/bancos" className={navLinkClass} onClick={() => setSidebarOpen(false)}><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>Catálogo</NavLink></>}
          <NavLink to="/calendario" className={navLinkClass} onClick={() => setSidebarOpen(false)}><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>Calendario</NavLink>
        </nav>
        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center gap-3">
            {user.photoURL ? <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-border" /> : <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">{(user.displayName ?? 'U').charAt(0).toUpperCase()}</div>}
            <div className="flex-1 min-w-0"><p className="text-xs font-medium text-ink truncate">{user.displayName}</p><p className="text-[10px] text-ink-muted truncate">{user.email}</p></div>
            <button type="button" onClick={toggleTheme} className="rounded-lg p-1 text-ink-muted hover:bg-surface hover:text-ink transition-colors" title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
              {theme === 'dark' ? <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
            </button>
            <button type="button" onClick={logout} className="rounded-lg p-1 text-ink-muted hover:bg-surface hover:text-ink transition-colors" title="Cerrar sesión">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </aside>
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-[var(--bg-sidebar)]/95 backdrop-blur-md px-4 py-3 lg:hidden">
          <button type="button" onClick={() => setSidebarOpen(true)} className="rounded-xl p-1.5 text-ink-muted hover:bg-surface hover:text-ink transition-colors"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg></button>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-subtle border border-primary/20 flex-shrink-0"><svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
          <span className="text-sm font-semibold text-ink">Ahorros Colaborativos</span>
          <div className="flex-1" />
          <button type="button" onClick={toggleTheme} className="rounded-xl p-1.5 text-ink-muted hover:bg-surface hover:text-ink transition-colors">
            {theme === 'dark' ? <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
          </button>
        </header>
        {authError && <div className="border-b border-danger/30 bg-danger-subtle px-4 py-2.5 text-sm text-danger">{authError}</div>}
        <Outlet />
      </div>
    </div>
  )
}
