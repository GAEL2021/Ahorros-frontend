export type PaymentState = 'PAGADO' | 'PENDIENTE'
export type MedioDePago = 'efectivo' | 'debito' | 'tarjeta_credito'
export type CapacidadPagoEstado = 'cubierto' | 'parcial' | 'insuficiente'
export type UtilizacionColor = 'verde' | 'amarillo' | 'rojo'

export type GoalType = 'individual' | 'shared'

export type GoalStatus = 'active' | 'completed' | 'cancelled'

export type TimelinePace = 'adelantado' | 'a_tiempo' | 'retrasado'

// --- Usuario ---

export interface Usuario {
  uid: string
  email: string
  displayName: string
  photoURL: string | null
}

export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  token: string
}

// --- Cartera (Banco) ---

export interface Cartera {
  id: string
  uid: string
  catalogoBancoId: string
  nombre: string
  color: string
  saldo: number
  descripcion: string
  tipoCuenta: 'debito' | 'credito'
  tipo: 'personal' | 'compartida'
  creadoPor: string
  creadoPorNombre: string
  creadoEn: string
  codigoCompartir: string
  esAhorro?: boolean
  metasDistribucion?: Array<{
    metaId: string
    montoAsignado: number
    nombreMeta: string
    porcentaje: number
  }>
}

export interface CarteraMember {
  id: string
  uid: string
  email: string
  saldoAportado: number
  rol: 'creador' | 'invitado'
}

export interface TransaccionBanco {
  id: string
  carteraId: string
  userId: string
  tipo: 'deposito' | 'retiro' | 'aporte_meta' | 'pago_tarjeta'
  monto: number
  metaId?: string
  descripcion: string
  fecha: string
}

export interface CarteraDetail extends Cartera {
  miembros: CarteraMember[]
  transacciones: TransaccionBanco[]
}

export interface CreateCarteraPayload {
  catalogoBancoId: string
  saldoInicial?: number
  descripcion?: string
  tipoCuenta?: 'debito' | 'credito'
  tipo?: 'personal' | 'compartida'
  invitadosEmails?: string[]
}

export interface UpdateCarteraPayload {
  descripcion?: string
  tipoCuenta?: 'debito' | 'credito'
}

// --- Catálogo de Bancos ---

export interface CatalogoBanco {
  id: string
  nombre: string
  color: string
  icono: string
  creadoEn: string
}

export interface CreateCatalogoBancoPayload {
  nombre: string
  color?: string
  icono?: string
}

export interface UpdateCatalogoBancoPayload {
  nombre?: string
  color?: string
  icono?: string
}

export interface DepositarPayload {
  monto: number
  descripcion?: string
}

export interface RetirarPayload {
  monto: number
  descripcion?: string
}

// --- Programacion ---

export interface Programacion {
  id: string
  userId: string
  carteraId: string
  metaId: string
  tipo: 'fijo' | 'porcentaje'
  monto?: number
  porcentaje?: number
  diaDelMes: number
  activo: boolean
  creadoEn: string
}

export interface CreateProgramacionPayload {
  carteraId: string
  metaId: string
  tipo: 'fijo' | 'porcentaje'
  monto?: number
  porcentaje?: number
  diaDelMes: number
  activo?: boolean
}

export interface UpdateProgramacionPayload {
  tipo?: 'fijo' | 'porcentaje'
  monto?: number
  porcentaje?: number
  diaDelMes?: number
  activo?: boolean
}

// --- Cuota (subcolección control_cuotas, formato del backend) ---

export interface Cuota {
  id: string
  usuarioEmail: string
  anio: number
  mes: number
  cuotaEsperada: number
  fechaInicio: string
  fechaFin: string
  estado: PaymentState
}

// --- Meta (formato del backend Firestore) ---

export interface Meta {
  id: string
  nombre: string
  montoObjetivo: number
  fechaLimite: string
  montoAcumulado: number
  mesesRestantes: number
  estado: 'activo' | 'completado' | 'cancelado'
  creadoPor: string
  creadoEn: string
  codigoCompartir: string
  // Se incluyen cuando se hace GET /goals/:id
  miembros?: MetaMember[]
  controlCuotas?: Cuota[]
  hitos?: Hito[]
  checklist?: ChecklistItem[]
}

export interface MetaMember {
  id: string
  uid: string
  email: string
  cuotaMensual: number
  saldoAportado: number
  rol: 'creador' | 'invitado'
}

export interface Hito {
  id: string
  porcentaje: number
  montoObjetivo: number
  fechaLimiteEsperada: string
  mesesAsignados: number
  estado: 'PENDIENTE' | 'ALCANZADO'
}

// --- Payloads (coinciden con CreateGoalDto del backend) ---

export interface CreateGoalPayload {
  nombre: string
  montoObjetivo: number
  fechaLimite: string
  invitadosEmails?: string[]
  modoAporte?: 'manual' | 'automatico'
  carteraId?: string
  programacionTipo?: 'fijo' | 'porcentaje'
  programacionMonto?: number
  programacionPorcentaje?: number
  programacionDia?: number
}

// --- Participante con estado de pagos (para SharedPaymentCalendar) ---

export interface PaymentStatus {
  month: number
  year: number
  estadoPago: PaymentState
}

export interface Participant {
  uid: string
  displayName: string
  email: string
  photoURL: string | null
  paymentStatuses: PaymentStatus[]
}

// --- Legacy alias (backward compat) ---
export type Goal = Meta

// --- Tarjeta de Crédito ---

export interface TarjetaCredito {
  id: string
  nombre: string
  bancoEmisor: string
  limiteCredito: number
  fechaCorte: number
  fechaPago: number
  saldoUtilizado: number
  activa: boolean
  creadoEn: string
}

export interface CreateTarjetaCreditoPayload {
  nombre: string
  bancoEmisor: string
  limiteCredito: number
  fechaCorte: number
  fechaPago: number
}

export interface UpdateTarjetaCreditoPayload {
  nombre?: string
  bancoEmisor?: string
  limiteCredito?: number
  fechaCorte?: number
  fechaPago?: number
}

export interface CompraTarjeta {
  id: string
  descripcion: string
  monto: number
  fecha: string
  gastoId?: string
  checklistItemId?: string
  metaId?: string
  cicloFechaCorte: string
  creadoEn: string
}

export interface PagoTarjeta {
  id: string
  monto: number
  fecha: string
  carteraId: string
  carteraNombre: string
  creadoEn: string
}

export interface DashboardTarjeta {
  tarjeta: TarjetaCredito
  creditDisponible: number
  porcentajeUtilizacion: number
  colorUtilizacion: UtilizacionColor
  proximoCorte: string
  proximoPago: string
  totalCicloActual: number
  comprasCicloActual: CompraTarjeta[]
  historialCompras: CompraTarjeta[]
  historialPagos: PagoTarjeta[]
}

export interface CapacidadPago {
  saldoPendiente: number
  totalCarteras: number
  dineroComprometido: number
  dineroLibre: number
  porcentajeCubierto: number
  estado: CapacidadPagoEstado
}

export interface SimulacionPago {
  montoSimulado: number
  saldoRestanteTarjeta: number
  nuevoSaldoUtilizado: number
  carteraOrigen?: string
  saldoCarteraRestante?: number
}

export interface ResumenBancos {
  totalCarteras: number
  dineroComprometido: number
  dineroLibre: number
}

// --- Checklist ---

export interface ChecklistItem {
  id: string
  texto: string
  monto: number
  montoReal?: number
  fechaReal?: string
  comprobante?: string
  completado: boolean
  orden: number
  creadoEn: string
  medioDePago?: MedioDePago
  tarjetaCreditoId?: string
}

export interface CreateChecklistItemPayload {
  texto: string
  monto: number
  ignorarExceso?: boolean
}

export interface UpdateChecklistItemPayload {
  texto?: string
  monto?: number
  completado?: boolean
  montoReal?: number
  comprobante?: string
  ignorarExceso?: boolean
  medioDePago?: MedioDePago
  tarjetaCreditoId?: string
}

// --- Presupuesto ---

export interface Presupuesto {
  id: string
  carteraId: string
  tipo: 'mensual' | 'quincenal'
  salarioMensual: number
  salarioQ1: number
  salarioQ2: number
  sobranteAnterior: number
  efectivoExtra: number
  metaFijos: number
  metaOcio: number
  metaAhorro: number
  userId: string
  creadoEn: string
  fecha?: string
  year: number
  mes: number
  controlId: string
  cerrado: boolean
  cerradoEn: string | null
  cerradoQ1: boolean
  cerradoQ1En: string | null
  cerradoQ2: boolean
  sobranteQ1: number
  gastos?: Gasto[]
}

export interface Gasto {
  id: string
  descripcion: string
  monto: number
  montoEstimado: number
  montoFinal: number
  estaConciliado: boolean
  categoria: 'fijos' | 'ocio' | 'ahorro'
  quincena?: 'Q1' | 'Q2'
  creadoEn: string
  esFijo: boolean
  cuotasRestantes: number
  cuotasOriginales: number
  activo: boolean
  fechaPago?: string
  fecha?: string
  esRecurrente?: boolean
  recurrenciaTipo?: 'quincenal' | 'mensual'
  recurrenciaGrupoId?: string
  fechaOrigen?: string
  carteraId?: string
  medioDePago?: MedioDePago
  tarjetaCreditoId?: string
}

export interface CreatePresupuestoPayload {
  carteraId?: string
  tipo: 'mensual' | 'quincenal'
  salarioMensual?: number
  salarioQ1?: number
  salarioQ2?: number
  sobranteAnterior: number
  efectivoExtra: number
  metaFijos?: number
  metaOcio?: number
  metaAhorro?: number
  fecha?: string
  year?: number
  mesDesde?: number
  gastosFijos?: Array<{
    descripcion: string
    monto: number
    categoria: 'fijos' | 'ocio' | 'ahorro'
    esFijo: boolean
    cuotas: number
    quincena?: 'Q1' | 'Q2'
    fechaPago?: string
  }>
}

export interface CreateGastoPayload {
  descripcion: string
  monto: number
  montoEstimado?: number
  categoria: 'fijos' | 'ocio' | 'ahorro'
  quincena?: 'Q1' | 'Q2'
  fecha?: string
  esRecurrente?: boolean
  recurrenciaTipo?: 'quincenal' | 'mensual'
  cuotas?: number
  fechaOrigen?: string
  carteraId?: string
  medioDePago?: MedioDePago
  tarjetaCreditoId?: string
}

export interface UpdatePresupuestoPayload {
  salarioMensual?: number
  salarioQ1?: number
  salarioQ2?: number
  sobranteAnterior?: number
  efectivoExtra?: number
  metaFijos?: number
  metaOcio?: number
  metaAhorro?: number
}

export interface UpdateGastoPayload {
  monto?: number
  montoEstimado?: number
  montoFinal?: number
  estaConciliado?: boolean
  descripcion?: string
  categoria?: 'fijos' | 'ocio' | 'ahorro'
  medioDePago?: MedioDePago
  tarjetaCreditoId?: string
}


