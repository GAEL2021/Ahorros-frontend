# Diseño: Tarjetas de Crédito, Medios de Pago y Dashboard Financiero

> **HU cubiertas:** HU-06, HU-07, HU-08, HU-09, HU-10, HU-11, HU-12, HU-13, HU-14, HU-15, HU-16
> **Proyecto:** Equilibra (Ahorro Grupal API)
> **Fecha:** 2026-06-24

---

## 1. Resumen

Implementar el dominio completo de tarjetas de crédito y medios de pago en la aplicación Equilibra. Esto incluye:

- Medio de pago (`efectivo`, `débito`, `tarjeta de crédito`) en gastos y checklist de metas
- Módulo completo de tarjetas de crédito con CRUD, acumulación de compras, ciclos de facturación
- Dashboard de tarjeta con indicadores visuales de utilización
- Pago de tarjeta desde carteras con liberación de crédito
- Capacidad de pago y simulación
- Dinero comprometido vs disponible en dashboard general

---

## 2. Backend

### 2.1 Nuevo módulo: `tarjetas-credito`

```text
backend/src/modules/tarjetas-credito/
├── tarjetas-credito.controller.ts
├── tarjetas-credito.service.ts
├── tarjetas-credito.module.ts
└── dto/
    ├── create-tarjeta-credito.dto.ts
    ├── update-tarjeta-credito.dto.ts
    ├── pagar-tarjeta.dto.ts
    └── simular-pago.dto.ts
```

#### 2.1.1 Interfaces (`tarjetas-credito.service.ts`)

```typescript
export interface TarjetaCreditoDocument {
  nombre: string;            // "BAC Cash Back"
  bancoEmisor: string;       // "BAC"
  limiteCredito: number;     // 3300
  fechaCorte: number;        // día del mes (1-31)
  fechaPago: number;         // día del mes (1-31)
  saldoUtilizado: number;
  userId: string;
  activa: boolean;
  creadoEn: string;
}

export interface CompraTarjetaDocument {
  tarjetaId: string;
  descripcion: string;
  monto: number;
  fecha: string;
  gastoId?: string;
  checklistItemId?: string;
  metaId?: string;
  cicloFechaCorte: string;  // ISO date de la fecha de corte a la que pertenece
  creadoEn: string;
}

export interface PagoTarjetaDocument {
  tarjetaId: string;
  monto: number;
  fecha: string;
  carteraId: string;
  carteraNombre: string;
  creadoEn: string;
}
```

#### 2.1.2 Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/tarjetas-credito` | Crear tarjeta |
| GET | `/tarjetas-credito` | Listar tarjetas del usuario |
| GET | `/tarjetas-credito/:id` | Detalle de tarjeta + compras ciclo actual |
| PATCH | `/tarjetas-credito/:id` | Editar tarjeta |
| DELETE | `/tarjetas-credito/:id` | Eliminar tarjeta |
| POST | `/tarjetas-credito/:id/acumular` | Acumular compra (usado internamente) |
| POST | `/tarjetas-credito/:id/pagar` | Pagar tarjeta desde cartera |
| GET | `/tarjetas-credito/:id/dashboard` | Dashboard con indicadores |
| GET | `/tarjetas-credito/:id/capacidad-pago` | Capacidad de pago |
| POST | `/tarjetas-credito/:id/simular` | Simular pago (no afecta datos) |
| GET | `/tarjetas-credito/:id/ciclo-actual` | Compras del ciclo actual |

#### 2.1.3 Lógica clave

**Acumular compra (`acumularCompra`)**:
1. Busca la tarjeta por ID
2. Valida que `saldoUtilizado + monto <= limiteCredito`
3. Incrementa `saldoUtilizado += monto`
4. Crea documento en subcolección `compras`
5. Calcula `cicloFechaCorte` basado en `fechaCorte` de la tarjeta

**Ciclo de facturación**:
- Si hoy es después de `fechaCorte`, el ciclo actual va desde la última fecha de corte hasta la próxima
- Las compras se agrupan por `cicloFechaCorte` para mostrar el total del estado de cuenta

**Pagar tarjeta (`pagarTarjeta`)**:
1. Recibe `carteraId` y `monto`
2. Verifica que la cartera tenga saldo suficiente
3. Descuenta de la cartera (`retirar`)
4. Crea transacción con `tipo: 'pago_tarjeta'`
5. Crea documento en subcolección `pagos`
6. Disminuye `saldoUtilizado -= monto`

**Capacidad de pago (`calcularCapacidadPago`)**:
1. Obtiene saldo pendiente = `saldoUtilizado` de la tarjeta
2. Obtiene todas las carteras del usuario, suma `saldo` (dinero disponible)
3. Obtiene metas activas, suma `montoAcumulado` (dinero comprometido)
4. `dineroLibre = sumaCarteras - dineroComprometido`
5. Retorna: `saldoPendiente`, `totalCarteras`, `dineroComprometido`, `dineroLibre`, `porcentajeCubierto`, `estado` (cubierto/parcial/insuficiente)

**Simular pago**:
- Calcula impacto sin modificar datos reales
- Recibe `montoSimulado`, `carteraId` opcional
- Retorna: saldoResultante, nuevoSaldoUtilizado, impactoEnCartera, impactoEnMetas

### 2.2 Modificaciones a `presupuestos` (HU-06)

#### 2.2.1 `GastoDocument`
Agregar campos:
```typescript
medioDePago?: 'efectivo' | 'debito' | 'tarjeta_credito';
tarjetaCreditoId?: string;
```

#### 2.2.2 `CreateGastoDto` / `UpdateGastoDto`
Agregar campos con validación:
```typescript
@IsOptional()
@IsEnum(['efectivo', 'debito', 'tarjeta_credito'])
medioDePago?: string;

@IsOptional()
@IsString()
tarjetaCreditoId?: string;
```

#### 2.2.3 `addGasto` en `presupuestos.service.ts`
Después de crear el gasto, si `medioDePago === 'tarjeta_credito'` y `tarjetaCreditoId`, llamar a:
```typescript
this.tarjetasCreditoService.acumularCompra(tarjetaCreditoId, {
  descripcion: gasto.descripcion,
  monto: gasto.monto,
  fecha: gasto.fecha || new Date().toISOString(),
  gastoId: gastoId,
});
```

### 2.3 Modificaciones a `goals` (HU-12)

#### 2.3.1 `ChecklistItem`
Agregar campos:
```typescript
medioDePago?: 'efectivo' | 'debito' | 'tarjeta_credito';
tarjetaCreditoId?: string;
```

#### 2.3.2 `UpdateChecklistItemDto`
Agregar `medioDePago` y `tarjetaCreditoId` opcionales.

#### 2.3.3 `updateChecklistItem` en `goals.service.ts`
Al completar item (`completado: true`):
- Si `medioDePago === 'tarjeta_credito'` y `tarjetaCreditoId`, llamar a `tarjetasCreditoService.acumularCompra()`
- Si es efectivo/débito (o no hay TC), solo registrar el gasto (comportamiento actual con `debitarChecklist`)

### 2.4 Modificaciones a `bancos` (HU-14, HU-16)

#### 2.4.1 `TransaccionDocument`
Agregar `'pago_tarjeta'` al enum `tipo`:
```typescript
tipo: 'deposito' | 'retiro' | 'aporte_meta' | 'pago_tarjeta';
```

#### 2.4.2 Nuevo endpoint: `GET /bancos/resumen`
Calcula y retorna:
```typescript
{
  totalCarteras: number;
  dineroComprometido: number;   // suma metas activas montoAcumulado
  dineroLibre: number;          // totalCarteras - dineroComprometido
}
```

### 2.5 Registro en `app.module.ts`

```typescript
import { TarjetasCreditoModule } from './modules/tarjetas-credito/tarjetas-credito.module';

@Module({
  imports: [
    // ... existing modules
    TarjetasCreditoModule,
  ],
})
```

Inyectar `TarjetasCreditoService` en `PresupuestosService` y `GoalsService`.

---

## 3. Frontend

### 3.1 Tipos nuevos (`src/types/index.ts`)

```typescript
type MedioDePago = 'efectivo' | 'debito' | 'tarjeta_credito';
type CapacidadPagoEstado = 'cubierto' | 'parcial' | 'insuficiente';
type UtilizacionColor = 'verde' | 'amarillo' | 'rojo';

interface TarjetaCredito {
  id: string;
  nombre: string;
  bancoEmisor: string;
  limiteCredito: number;
  fechaCorte: number;
  fechaPago: number;
  saldoUtilizado: number;
  activa: boolean;
  creadoEn: string;
}

interface CreateTarjetaCreditoPayload {
  nombre: string;
  bancoEmisor: string;
  limiteCredito: number;
  fechaCorte: number;
  fechaPago: number;
}

interface CompraTarjeta {
  id: string;
  descripcion: string;
  monto: number;
  fecha: string;
  gastoId?: string;
  checklistItemId?: string;
  metaId?: string;
  cicloFechaCorte: string;
}

interface PagoTarjeta {
  id: string;
  monto: number;
  fecha: string;
  carteraId: string;
  carteraNombre: string;
}

interface DashboardTarjeta {
  tarjeta: TarjetaCredito;
  creditDisponible: number;
  porcentajeUtilizacion: number;
  colorUtilizacion: UtilizacionColor;
  proximoCorte: string;
  proximoPago: string;
  totalCicloActual: number;
  comprasCicloActual: CompraTarjeta[];
  historialCompras: CompraTarjeta[];
  historialPagos: PagoTarjeta[];
}

interface CapacidadPago {
  saldoPendiente: number;
  totalCarteras: number;
  dineroComprometido: number;
  dineroLibre: number;
  porcentajeCubierto: number;
  estado: CapacidadPagoEstado;
}

interface SimulacionPago {
  montoSimulado: number;
  saldoRestanteTarjeta: number;
  nuevoSaldoUtilizado: number;
  carteraOrigen?: string;
  saldoCarteraRestante?: number;
}

interface ResumenBancos {
  totalCarteras: number;
  dineroComprometido: number;
  dineroLibre: number;
}
```

#### Modificar tipos existentes:

```typescript
// Gasto (línea 297)
interface Gasto {
  // ...existing
  medioDePago?: MedioDePago;
  tarjetaCreditoId?: string;
}

// CreateGastoPayload / UpdateGastoPayload
// Agregar medioDePago?: MedioDePago y tarjetaCreditoId?: string

// ChecklistItem
interface ChecklistItem {
  // ...existing
  medioDePago?: MedioDePago;
  tarjetaCreditoId?: string;
}
```

### 3.2 Nueva página: `TarjetasCreditoPage`

**Ruta:** `/tarjetas`

**Secciones:**

1. **Lista de tarjetas** — Cards con nombre, banco, límite, barra de utilización (verde/amarillo/rojo), crédito disponible
2. **Botón "Nueva tarjeta"** — Modal con formulario: nombre, banco, límite, fecha corte, fecha pago
3. **Al hacer clic en una tarjeta** — Slide-over drawer (como `CarteraMovimientosDrawer`) con:
   - Dashboard: límite, disponible, utilizado, % utilización, próxima corte, próxima pago
   - Indicador visual de color
   - Total acumulado del ciclo actual
   - Lista de compras del ciclo (con descripción, monto, fecha, origen)
   - Botón "Pagar tarjeta" → modal con selector de cartera y monto
   - Botón "Simular pago" → modal con input de monto y preview de impacto
   - Sección "Capacidad de pago" con indicador ✅/⚠️/❌
   - Historial de pagos
   - Historial completo de compras

### 3.3 Modificaciones a componentes existentes

#### `AddGastoModal` (PresupuestosPage.tsx)
Agregar después del campo de categoría:
- Selector de medio de pago: 3 botones/radio: Efectivo, Débito, Tarjeta de Crédito
- Si selecciona "Tarjeta de Crédito": mostrar selector de tarjetas registradas (usando `useFetchTarjetas`)

#### `EditGastoModal`
Igual que AddGastoModal: selector de medio de pago + selector de tarjeta si aplica.

#### `GastoActionModal` (marcar como pagado)
Agregar selector de medio de pago en el modal de pago.

#### `PresupuestosPage` — Filtros
Agregar filtro por medio de pago en la sección de gastos.

#### `ChecklistPanel.tsx` (GoalDetailPanel)
Al completar item, agregar:
- Selector de medio de pago (efectivo/débito/tarjeta)
- Si tarjeta: selector de tarjeta y acumulación automática

#### `DashboardPage.tsx`
Agregar secciones:
- **Comprometido vs Disponible** — Barras: "Total Carteras", "Comprometido en Metas", "Disponible Libre"
- **Resumen Tarjetas** — Si hay tarjetas, mostrar cards pequeñas con indicador de color

### 3.4 Nuevos componentes

#### `CreditCardDashboard.tsx`
- Indicador circular de utilización (Recharts PieChart o RadialBarChart)
- Color dinámico: verde (<30%), amarillo (30-70%), rojo (>70%)
- Cards: Límite, Disponible, Utilizado, Próximo Corte, Próximo Pago
- Total ciclo actual

#### `CreditCardPaymentModal.tsx`
- Selector de cartera (solo débito/efectivo, no tarjetas de crédito)
- Input de monto
- Preview del nuevo saldo
- Al confirmar: llama a `POST /tarjetas-credito/:id/pagar`

#### `CreditCardSimulationModal.tsx`
- Input de monto a simular
- Selector de cartera (opcional)
- Preview de: nuevo saldo tarjeta, impacto en cartera, impacto en metas
- Botón de cerrar (no modifica datos)

### 3.5 Nuevos hooks

| Hook | Archivo | Endpoint |
|------|---------|----------|
| `useFetchTarjetas()` | `useFetchTarjetas.ts` | GET /tarjetas-credito |
| `useTarjetaDetail(id)` | `useTarjetaDetail.ts` | GET /tarjetas-credito/:id |
| `useCreateTarjeta()` | `useCreateTarjeta.ts` | POST /tarjetas-credito |
| `useUpdateTarjeta()` | `useUpdateTarjeta.ts` | PATCH /tarjetas-credito/:id |
| `useDeleteTarjeta()` | `useDeleteTarjeta.ts` | DELETE /tarjetas-credito/:id |
| `usePagarTarjeta()` | `usePagarTarjeta.ts` | POST /tarjetas-credito/:id/pagar |
| `useDashboardTarjeta(id)` | `useDashboardTarjeta.ts` | GET /tarjetas-credito/:id/dashboard |
| `useCapacidadPago(id)` | `useCapacidadPago.ts` | GET /tarjetas-credito/:id/capacidad-pago |
| `useSimularPago(id)` | `useSimularPago.ts` | POST /tarjetas-credito/:id/simular |
| `useResumenBancos()` | `useResumenBancos.ts` | GET /bancos/resumen |
| `useCicloActual(id)` | `useCicloActual.ts` | GET /tarjetas-credito/:id/ciclo-actual |

### 3.6 Routing (`App.tsx`)

```typescript
<Route path="/tarjetas" element={<TarjetasCreditoPage />} />
```

### 3.7 Navegación (`AppLayout.tsx`)

Agregar link en sidebar:
```typescript
{ label: 'Tarjetas', path: '/tarjetas', icon: CreditCardIcon }
```

---

## 4. Firestore Structure

```
/users/{userId}/
  /tarjetas-credito/{tarjetaId}/
    /compras/{compraId}
    /pagos/{pagoId}

/presupuestos/{presupuestoId}/
  /gastos/{gastoId}        ← medioDePago, tarjetaCreditoId agregados

/goals/{goalId}/
  /checklist/{itemId}      ← medioDePago, tarjetaCreditoId agregados
```

---

## 5. Secuencia de Implementación

Dado que el usuario eligió "todo en paralelo", implementaré en este orden lógico dentro de un solo esfuerzo:

1. **Tipos compartidos** — front-end types, backend interfaces
2. **Backend: módulo tarjetas-credito** — interfaces, DTOs, service, controller
3. **Backend: modificar presupuestos** — medioDePago en gastos
4. **Backend: modificar goals** — medioDePago en checklist
5. **Backend: modificar bancos** — transacción pago_tarjeta, endpoint resumen
6. **Frontend: hooks** — todos los hooks nuevos
7. **Frontend: TarjetasCreditoPage** — página completa
8. **Frontend: modificar PresupuestosPage** — selector medio de pago
9. **Frontend: modificar ChecklistPanel** — selector medio de pago
10. **Frontend: modificar DashboardPage** — comprometido vs disponible
11. **Frontend: navegación** — AppLayout + App.tsx
12. **Verificación** — revisar que compile y funcione
