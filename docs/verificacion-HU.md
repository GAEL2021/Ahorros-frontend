# Reporte de Verificación de Historias de Usuario

> **Proyecto:** Equilibra (Ahorro Grupal API)
> **Fecha:** 24/06/2026
> **Alcance:** Backend (NestJS) + Frontend (React)
> **HU analizadas:** HU-06 a HU-16

---

## Resumen Ejecutivo

| HU | Descripción | Backend | Frontend | Estado |
|---|---|---|---|---|
| HU-06 | Registrar medios de pago en gastos | ❌ | ❌ | **No implementado** |
| HU-07 | Administración de tarjetas de crédito | ❌ | ❌ | **No implementado** |
| HU-08 | Acumulación automática de compras con TC | ❌ | ❌ | **No implementado** |
| HU-09 | Cálculo de estado de cuenta por ciclo | ❌ | ❌ | **No implementado** |
| HU-10 | Dashboard de tarjeta de crédito | ❌ | ❌ | **No implementado** |
| HU-11 | Pago de tarjeta de crédito | ❌ | ❌ | **No implementado** |
| HU-12 | Relación metas-gastos-tarjeta | ⚠️ Parcial | ⚠️ Parcial | **Parcialmente implementado** |
| HU-13 | Capacidad de pago de TC | ❌ | ❌ | **No implementado** |
| HU-14 | Pago de tarjeta desde cartera | ❌ | ❌ | **No implementado** |
| HU-15 | Simulación de pago de tarjeta | ❌ | ❌ | **No implementado** |
| HU-16 | Dinero comprometido vs disponible | ❌ | ⚠️ Parcial | **Parcialmente implementado** |

**Total:** 0/11 completamente implementadas | 2/11 parcialmente | 9/11 no implementadas

---

## HU-06 — Registrar medios de pago en los gastos

**Criterios:**
- [ ] Seleccionar: Tarjeta de Crédito, Tarjeta de Débito, Efectivo
- [ ] Medio de pago almacenado en el movimiento
- [ ] Visualización en consultas e historial
- [ ] Filtro por medio de pago

**Backend:** ❌ No implementado
- `GastoDocument` en `backend/src/modules/presupuestos/presupuestos.service.ts:21` no tiene campo `medioDePago`
- `CreateGastoDto` / `UpdateGastoDto` / `PagarGastoDto` no tienen campo de medio de pago
- `pagarGasto()` solo marca `estaConciliado = true`, no almacena medio de pago

**Frontend:** ❌ No implementado
- `Gasto` type en `front-end/src/types/index.ts:297` no tiene `medioDePago`
- `AddGastoModal` (PresupuestosPage.tsx:376) no tiene selector de medio de pago
- `GastoActionModal`, `EditGastoModal` no tienen campo de medio de pago

---

## HU-07 — Administración de tarjetas de crédito

**Criterios:**
- [ ] Registrar: nombre, banco emisor, límite, fecha de corte, fecha límite de pago
- [ ] Editar información
- [ ] Múltiples tarjetas
- [ ] Mostrar crédito disponible

**Backend:** ❌ No implementado
- No existe módulo para tarjetas de crédito
- El único campo relacionado es `tipoCuenta: 'debito' | 'credito'` en `BancoDocument` (bancos.service.ts:19), que es un tipo de cuenta de cartera, no una tarjeta de crédito

**Frontend:** ❌ No implementado
- No existe página ni componente para administrar tarjetas de crédito
- No hay tipos definidos para tarjetas

---

## HU-08 — Acumulación automática de compras con TC

**Criterios:**
- [ ] Gasto con TC suma al saldo utilizado
- [ ] Gasto descuenta del crédito disponible
- [ ] Mostrar: monto utilizado, crédito disponible, cantidad de compras

**Backend:** ❌ No implementado
- No hay relación entre gastos con medio de pago "tarjeta de crédito" y el saldo de la tarjeta
- No existe entidad de tarjeta de crédito donde acumular compras

**Frontend:** ❌ No implementado

---

## HU-09 — Cálculo de estado de cuenta por ciclo de facturación

**Criterios:**
- [ ] Tomar fecha de corte y fecha de pago
- [ ] Agrupar compras dentro del ciclo
- [ ] Mostrar: total a pagar, fecha límite, compras incluidas

**Backend:** ❌ No implementado
- No existe lógica de ciclos de facturación
- No hay fechas de corte/pago asociadas a gastos

**Frontend:** ❌ No implementado

---

## HU-10 — Dashboard de tarjeta de crédito

**Criterios:**
- [ ] Límite total, crédito disponible, crédito utilizado
- [ ] Porcentaje de utilización
- [ ] Próxima fecha de corte y pago
- [ ] Total acumulado del ciclo
- [ ] Historial de compras
- [ ] Indicadores visuales: verde (<30%), amarillo (30-70%), rojo (>70%)

**Backend:** ❌ No implementado
- No hay datos de tarjeta para exponer en dashboard

**Frontend:** ❌ No implementado
- `DashboardPage.tsx` solo muestra carteras, metas y flujo de caja
- No hay sección de tarjeta de crédito

---

## HU-11 — Pago de tarjeta de crédito

**Criterios:**
- [ ] Registrar: fecha, monto, cuenta origen
- [ ] Restar del saldo pendiente
- [ ] Liberar crédito disponible
- [ ] Mantener historial de pagos

**Backend:** ❌ No implementado
- No hay endpoint para registrar pago de tarjeta
- `TransaccionDocument` (bancos.service.ts:35) solo tiene tipos `'deposito' | 'retiro' | 'aporte_meta'`, no `'pago_tarjeta'`

**Frontend:** ❌ No implementado

---

## HU-12 — Relación metas, gastos y tarjeta de crédito

**Criterios:**
- [ ] Al marcar elemento como comprado → solicitar medio de pago
- [ ] Si TC → actualizar deuda de la tarjeta
- [ ] Si efectivo/débito → solo registrar gasto
- [ ] Dashboard de meta refleja el gasto

**Backend:** ⚠️ Parcialmente implementado
- ✅ `ChecklistItem` (goals.service.ts:56) existe con `texto`, `monto`, `montoReal`, `completado`, `comprobante`
- ✅ `debitarChecklist()` (goals.service.ts:696) deduce de cartera al completar item
- ❌ `ChecklistItem` no tiene campo `medioDePago`
- ❌ No hay lógica para actualizar deuda de TC si el medio es tarjeta de crédito

**Frontend:** ⚠️ Parcialmente implementado
- ✅ `ChecklistPanel.tsx` permite marcar items como comprados y seleccionar cartera
- ❌ No hay selector de medio de pago (efectivo/débito/tarjeta)
- ❌ No se actualiza deuda de tarjeta

---

## HU-13 — Capacidad de pago de tarjeta de crédito

**Criterios:**
- [ ] Calcular: saldo pendiente, dinero disponible en carteras, dinero comprometido en metas, dinero libre
- [ ] Mostrar: monto pendiente, capacidad de pago, porcentaje cubierto
- [ ] Indicadores: ✅ cubierto, ⚠️ parcial, ❌ insuficiente

**Backend:** ❌ No implementado
- No hay endpoint de capacidad de pago
- No se calcula saldo pendiente de TC vs disponible

**Frontend:** ❌ No implementado
- No hay componente de capacidad de pago

---

## HU-14 — Pago de tarjeta desde una cartera

**Criterios:**
- [ ] Seleccionar cartera (NIU, BAC, MultiMoney, Efectivo)
- [ ] Descontar monto de la cartera
- [ ] Disminuir saldo pendiente de la tarjeta
- [ ] Generar movimiento financiero

**Backend:** ❌ No implementado
- No existe endpoint para pagar tarjeta desde cartera
- No existe relación cartera ↔ tarjeta de crédito

**Frontend:** ❌ No implementado

---

## HU-15 — Simulación de pago de tarjeta

**Criterios:**
- [ ] Mostrar: saldo actual, pago simulado, saldo restante
- [ ] Impacto en carteras y metas de ahorro
- [ ] No afectar datos reales

**Backend:** ❌ No implementado
- No existe endpoint de simulación
- No hay lógica de "what-if"

**Frontend:** ❌ No implementado

---

## HU-16 — Dinero comprometido vs dinero disponible

**Criterios:**
- [ ] Calcular automáticamente: dinero total, comprometido, libre
- [ ] Mostrar en Dashboard General

**Backend:** ❌ No implementado
- No existe endpoint que calcule dinero comprometido vs disponible
- El backend no expone este cálculo

**Frontend:** ⚠️ Parcialmente implementado
- ✅ `DashboardPage.tsx:296-313` muestra "Asignado a Metas" y "Disponible" (`totalBalance - goalsAcumulado`)
- ❌ El cálculo es local en el frontend, no vía API
- ❌ No incluye dinero comprometido en checklist items comprados
- ❌ No hay endpoint backend que lo compute

---

## Hallazgos Adicionales

### Backend
1. **`pagarGasto()`** (presupuestos.service.ts:488) recibe `_carteraIdOverride` pero **nunca lo usa**
2. **`TransaccionDocument`** (bancos.service.ts:35) solo tiene 3 tipos de transacción, faltan `'gasto'`, `'pago_tarjeta'`
3. **No hay módulo de tarjetas de crédito** — todo el dominio de TC (HU-07 a HU-15) está por construir
4. **El campo `carteraId` en `GastoDocument`** existe pero no se usa en `pagarGasto()`

### Frontend
1. **`PresupuestosPage.tsx`** tiene `// @ts-nocheck` al inicio, lo que desactiva type checking
2. **No hay ruta/página para tarjetas de crédito** en `App.tsx`
3. **El cálculo de Disponible en DashboardPage** es local y no considera todos los factores (checklist items comprometidos, deudas de TC)

---

## Recomendaciones

### Prioridad Inmediata (HU-06 + HU-07)
1. Crear módulo `tarjetas-credito` en backend con CRUD de tarjetas (nombre, banco, límite, fecha corte, fecha pago)
2. Agregar campo `medioDePago: 'efectivo' | 'debito' | 'credito' | 'tarjeta_credito'` a `GastoDocument` y DTOs
3. Agregar selector de medio de pago en frontend (`AddGastoModal`, `EditGastoModal`, `GastoActionModal`)

### Prioridad Media (HU-08, HU-09, HU-10, HU-11)
4. Implementar acumulación automática de compras en tarjeta de crédito
5. Implementar ciclo de facturación con fechas de corte/pago
6. Crear dashboard de tarjeta con indicadores visuales
7. Implementar pago de tarjeta con liberación de crédito

### Prioridad Baja (HU-12 a HU-15)
8. Agregar medio de pago a checklist items de metas
9. Implementar cálculo de capacidad de pago
10. Implementar simulación de pago
11. Crear endpoint backend para dinero comprometido vs disponible

---

*Reporte generado automáticamente mediante análisis de código fuente.*
