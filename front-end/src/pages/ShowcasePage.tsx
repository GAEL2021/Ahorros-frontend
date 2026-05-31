import { useState } from 'react'

export default function ShowcasePage() {
  const [activeTab, setActiveTab] = useState<'all' | 'splash' | 'dashboard' | 'chart'>('all')

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full font-sans">
      {/* Header section */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div>
          <h1 className="text-3xl font-extrabold text-ink tracking-tight">SaveSmart UI Showcase</h1>
          <p className="mt-1 text-sm text-ink-muted">Replica de interfaz de diseño móvil premium (Bento & Radial Charts)</p>
        </div>

        {/* Tab filters */}
        <div className="flex bg-surface-raised p-1 rounded-xl border border-border/80">
          {(['all', 'splash', 'dashboard', 'chart'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                activeTab === tab ? 'bg-primary text-white shadow-sm' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {tab === 'all' ? 'Ver Todas' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Showcase Grid of Phone Mockups */}
      <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 justify-center items-start stagger">
        {/* PANTALLA 1: Splash/Welcome */}
        {(activeTab === 'all' || activeTab === 'splash') && (
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Pantalla 1: Welcome</span>
            {/* Phone Frame */}
            <div className="relative w-[340px] h-[680px] bg-[#11141B] rounded-[3rem] p-3 shadow-2xl border-4 border-zinc-800 overflow-hidden flex flex-col justify-between">
              {/* Notch */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-15 flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full mr-2" />
                <span className="w-8 h-1.5 bg-zinc-900 rounded-full" />
              </div>

              {/* Header Info */}
              <div className="flex justify-between items-center px-4 pt-4 text-[10px] text-zinc-400 font-bold z-10">
                <span>09:41</span>
                <div className="flex items-center gap-1.5">
                  <span>5G</span>
                  <div className="w-4 h-2 bg-zinc-400 rounded-xs" />
                </div>
              </div>

              {/* Upper Background Graphics & mascot */}
              <div className="flex-1 flex flex-col justify-center items-center px-6 relative z-10">
                {/* SVG Mascot (Mascota retro con ojos de estrella) */}
                <div className="w-44 h-44 bg-gradient-to-tr from-[#6336FF] to-[#7043F6] rounded-full flex items-center justify-center relative shadow-lg shadow-purple-500/10 mb-8 border border-white/10 animate-float">
                  <svg className="w-32 h-32 text-white" viewBox="0 0 100 100" fill="none">
                    {/* Star Eyes mascot */}
                    <circle cx="50" cy="50" r="30" fill="#FFC700" />
                    {/* Star left eye */}
                    <path d="M35 42 L38 48 L44 48 L39 52 L41 58 L35 54 L29 58 L31 52 L26 48 L32 48 Z" fill="black" />
                    {/* Star right eye */}
                    <path d="M65 42 L68 48 L74 48 L69 52 L71 58 L65 54 L59 58 L61 52 L56 48 L62 48 Z" fill="black" />
                    {/* Retro mouth */}
                    <path d="M42 66 Q50 72 58 66" stroke="black" strokeWidth="4" strokeLinecap="round" />
                    {/* Blushing cheeks */}
                    <circle cx="28" cy="56" r="4" fill="#F43F5E" opacity="0.6" />
                    <circle cx="72" cy="56" r="4" fill="#F43F5E" opacity="0.6" />
                  </svg>
                  {/* Decorative float elements */}
                  <div className="absolute top-2 right-2 text-xl animate-pulse">✨</div>
                  <div className="absolute bottom-4 left-2 text-xl animate-pulse delay-100">💰</div>
                </div>

                <h2 className="text-3xl font-extrabold text-white tracking-tight text-center">SaveSmart</h2>
                <p className="text-xs text-zinc-400 text-center mt-2 max-w-[200px]">
                  Toma el control de tus finanzas personales y colabora de forma inteligente.
                </p>
              </div>

              {/* Lower Section (White Card style overlay) */}
              <div className="bg-[#FAF8F5] rounded-[2rem] p-6 text-center space-y-4 z-10">
                <div className="flex justify-center gap-1">
                  <span className="w-4 h-1.5 bg-[#FFC700] rounded-full" />
                  <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full" />
                  <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full" />
                </div>

                <p className="text-xs font-semibold text-zinc-600">
                  La forma más fácil y divertida de alcanzar tus objetivos de ahorro grupales.
                </p>

                <button
                  type="button"
                  className="w-full bg-[#FFC700] hover:bg-[#ebd056] text-black font-extrabold text-xs py-3.5 rounded-full shadow-lg shadow-yellow-500/20 active:scale-[0.98] transition-all"
                >
                  Empezar ahora
                </button>
              </div>

              {/* Home indicator */}
              <div className="w-28 h-1 bg-zinc-700 rounded-full mx-auto mb-2 mt-4 z-10" />
            </div>
          </div>
        )}

        {/* PANTALLA 2: Dashboard Bento Grid */}
        {(activeTab === 'all' || activeTab === 'dashboard') && (
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Pantalla 2: Bento Grid</span>
            {/* Phone Frame */}
            <div className="relative w-[340px] h-[680px] bg-[#FAF8F5] rounded-[3rem] p-3 shadow-2xl border-4 border-zinc-800 overflow-hidden flex flex-col justify-between">
              {/* Notch */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-15 flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full mr-2" />
                <span className="w-8 h-1.5 bg-zinc-900 rounded-full" />
              </div>

              {/* Header Info */}
              <div className="flex justify-between items-center px-4 pt-4 text-[10px] text-zinc-600 font-bold z-10">
                <span>09:41</span>
                <div className="flex items-center gap-1.5">
                  <span>5G</span>
                  <div className="w-4 h-2 bg-zinc-600 rounded-xs" />
                </div>
              </div>

              {/* Scrollable Content inside Frame */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {/* User Info Header */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-zinc-200 border-2 border-white shadow-sm flex items-center justify-center font-bold text-xs text-zinc-700">
                      EH
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Bienvenido</p>
                      <h3 className="text-xs font-extrabold text-zinc-800 leading-none mt-0.5">Esther Howard</h3>
                    </div>
                  </div>
                  <button className="h-8 w-8 rounded-full bg-white border border-zinc-200 flex items-center justify-center shadow-xs">
                    🔔
                  </button>
                </div>

                {/* Main balance card */}
                <div className="bg-[#FAF8F5] p-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Balance Total</span>
                  <h1 className="text-3xl font-extrabold text-zinc-900 mt-1 font-mono tracking-tight">$5,560.43</h1>
                </div>

                {/* Double column Income/Spendings card */}
                <div className="bg-[#FFC700] rounded-[2rem] p-4 flex justify-between gap-2 shadow-sm text-black">
                  <div className="flex-1 border-r border-black/10 pr-2">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider opacity-60">Income</span>
                    <p className="text-sm font-extrabold font-mono mt-0.5">+$3,450.00</p>
                  </div>
                  <div className="flex-1 pl-2">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider opacity-60">Spendings</span>
                    <p className="text-sm font-extrabold font-mono mt-0.5">-$1,245.80</p>
                  </div>
                </div>

                {/* Bento Grid layout */}
                <div className="grid grid-cols-5 gap-3">
                  {/* Left Column: Dashed vertical add button */}
                  <div className="col-span-2 rounded-[2rem] border-2 border-dashed border-zinc-300 flex flex-col items-center justify-center p-4 min-h-[140px] hover:bg-zinc-100/50 transition-colors cursor-pointer">
                    <div className="h-10 w-10 rounded-full bg-[#11141B] text-white flex items-center justify-center font-extrabold text-lg shadow-sm">
                      +
                    </div>
                    <span className="text-[10px] font-bold text-zinc-500 mt-2">Agregar</span>
                  </div>

                  {/* Right Column: Double row cards */}
                  <div className="col-span-3 space-y-3">
                    {/* Housing Purple card */}
                    <div className="bg-[#6336FF] text-white p-4 rounded-[2rem] shadow-xs flex flex-col justify-between min-h-[85px]">
                      <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">Housing</span>
                      <p className="text-xs font-bold font-mono mt-1">$453.00</p>
                    </div>

                    {/* Food Cyan card */}
                    <div className="bg-[#00D1FF] text-black p-4 rounded-[2rem] shadow-xs flex flex-col justify-between min-h-[85px]">
                      <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">Food</span>
                      <p className="text-xs font-bold font-mono mt-1">$124.50</p>
                    </div>
                  </div>
                </div>

                {/* Carousel dots */}
                <div className="flex justify-center gap-1.5 py-1">
                  <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full" />
                  <span className="w-4 h-1.5 bg-[#11141B] rounded-full" />
                  <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full" />
                </div>

                {/* Transactions feed section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-extrabold text-zinc-800">Recientes</h4>
                    <span className="text-[10px] text-zinc-400 font-bold hover:underline cursor-pointer">Ver Todos</span>
                  </div>

                  <div className="bg-white border border-zinc-200/60 rounded-[1.5rem] p-3 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                        🛍️
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-zinc-800 leading-tight">Shopping</h5>
                        <p className="text-[9px] text-zinc-400 mt-0.5">Tienda comercial</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-red-500 font-mono">-$85.00</span>
                  </div>
                </div>
              </div>

              {/* Home indicator */}
              <div className="w-28 h-1 bg-zinc-300 rounded-full mx-auto mb-2 mt-4" />
            </div>
          </div>
        )}

        {/* PANTALLA 3: Expenses / Concentric Radial Chart */}
        {(activeTab === 'all' || activeTab === 'chart') && (
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Pantalla 3: Expenses</span>
            {/* Phone Frame */}
            <div className="relative w-[340px] h-[680px] bg-[#11141B] rounded-[3rem] p-3 shadow-2xl border-4 border-zinc-800 overflow-hidden flex flex-col justify-between text-white">
              {/* Notch */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-15 flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full mr-2" />
                <span className="w-8 h-1.5 bg-zinc-900 rounded-full" />
              </div>

              {/* Header Info */}
              <div className="flex justify-between items-center px-4 pt-4 text-[10px] text-zinc-400 font-bold z-10">
                <span>09:41</span>
                <div className="flex items-center gap-1.5">
                  <span>5G</span>
                  <div className="w-4 h-2 bg-zinc-400 rounded-xs" />
                </div>
              </div>

              {/* Scrollable Content inside Frame */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {/* Header title */}
                <div className="flex items-center justify-between pt-2">
                  <h3 className="text-sm font-bold tracking-tight">Gastos</h3>
                  <button className="text-[10px] font-bold text-zinc-400 border border-white/10 rounded-full px-3 py-1 bg-white/5 hover:bg-white/10 transition-colors">
                    Este Mes
                  </button>
                </div>

                {/* SVG Concentric Circular Graph ( Morado, Amarillo, Azul, Violeta ) */}
                <div className="flex items-center justify-between gap-2 bg-white/5 border border-white/10 rounded-[2rem] p-4">
                  <div className="relative w-36 h-36 flex items-center justify-center flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {/* Background circular rails */}
                      <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                      <circle cx="50" cy="50" r="32" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                      <circle cx="50" cy="50" r="24" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                      <circle cx="50" cy="50" r="16" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />

                      {/* Ring 1: Personal Need (Purple #6336FF) - 40% */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#6336FF"
                        strokeWidth="6"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 - 251.2 * 0.4}
                        strokeLinecap="round"
                      />

                      {/* Ring 2: Groceries (Yellow #FFC700) - 31% */}
                      <circle
                        cx="50"
                        cy="50"
                        r="32"
                        fill="none"
                        stroke="#FFC700"
                        strokeWidth="6"
                        strokeDasharray="201"
                        strokeDashoffset={201 - 201 * 0.31}
                        strokeLinecap="round"
                      />

                      {/* Ring 3: Subscription (Cyan #00D1FF) - 30% */}
                      <circle
                        cx="50"
                        cy="50"
                        r="24"
                        fill="none"
                        stroke="#00D1FF"
                        strokeWidth="6"
                        strokeDasharray="150.7"
                        strokeDashoffset={150.7 - 150.7 * 0.3}
                        strokeLinecap="round"
                      />

                      {/* Ring 4: Other (Violet/Pink) - 11% */}
                      <circle
                        cx="50"
                        cy="50"
                        r="16"
                        fill="none"
                        stroke="#EC4899"
                        strokeWidth="6"
                        strokeDasharray="100.5"
                        strokeDashoffset={100.5 - 100.5 * 0.11}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-[9px] text-zinc-400 uppercase tracking-widest leading-none">Total</span>
                      <span className="text-sm font-extrabold font-mono mt-0.5">$650.0</span>
                    </div>
                  </div>

                  {/* Legends list */}
                  <div className="flex-1 space-y-2 text-[9px] text-zinc-400 font-bold pr-1">
                    <div className="flex items-center gap-1.5 justify-between">
                      <div className="flex items-center gap-1 text-white">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#6336FF' }} />
                        <span>Pers. Need</span>
                      </div>
                      <span>40%</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-between">
                      <div className="flex items-center gap-1 text-white">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#FFC700' }} />
                        <span>Groceries</span>
                      </div>
                      <span>31%</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-between">
                      <div className="flex items-center gap-1 text-white">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#00D1FF' }} />
                        <span>Subs</span>
                      </div>
                      <span>30%</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-between">
                      <div className="flex items-center gap-1 text-white">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#EC4899' }} />
                        <span>Other</span>
                      </div>
                      <span>11%</span>
                    </div>
                  </div>
                </div>

                {/* White Bottom Overlay Card */}
                <div className="bg-[#FAF8F5] rounded-[2rem] p-4 text-black space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-zinc-800">Este Mes</h4>
                    <span className="text-[10px] text-zinc-400 font-bold hover:underline cursor-pointer">Ver Todos</span>
                  </div>

                  {/* List of items */}
                  <div className="space-y-2.5">
                    {/* Item 1: Shopping */}
                    <div className="flex items-center justify-between border-b border-zinc-200/50 pb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center text-xs">
                          🛍️
                        </div>
                        <div>
                          <h5 className="text-[11px] font-bold text-zinc-800 leading-tight">Shopping</h5>
                          <p className="text-[9px] text-zinc-400">Ropa y accesorios</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-red-500 font-mono">-$120.00</span>
                    </div>

                    {/* Item 2: Spotify */}
                    <div className="flex items-center justify-between border-b border-zinc-200/50 pb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-[#38BDF8]/15 text-[#38BDF8] flex items-center justify-center text-xs">
                          🎵
                        </div>
                        <div>
                          <h5 className="text-[11px] font-bold text-zinc-800 leading-tight">Spotify Premium</h5>
                          <p className="text-[9px] text-zinc-400">Música streaming</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-red-500 font-mono">-$14.99</span>
                    </div>

                    {/* Item 3: Figma */}
                    <div className="flex items-center justify-between pb-1">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-[#7043F6]/15 text-[#7043F6] flex items-center justify-center text-xs">
                          🎨
                        </div>
                        <div>
                          <h5 className="text-[11px] font-bold text-zinc-800 leading-tight">Figma Professional</h5>
                          <p className="text-[9px] text-zinc-400">Diseño UI/UX</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-red-500 font-mono">-$15.00</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Home indicator */}
              <div className="w-28 h-1 bg-zinc-700 rounded-full mx-auto mb-2 mt-4" />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
