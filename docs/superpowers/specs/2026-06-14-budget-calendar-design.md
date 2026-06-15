# Budget Calendar - Diseño de Presupuesto con Calendario

## Resumen
Reemplazar la vista actual de tarjetas de control anual en `/presupuestos` por un calendario mensual tipo Google Calendar como vista principal, manteniendo el panel de detalle del control anual como vista secundaria.

## Vista Principal: Calendario Mensual
- Grilla de días del mes (7 columnas, DOM-LUN-MAR-MIE-JUE-VIE-SAB)
- Navegación entre meses con flechas `< >` y botón "Hoy"
- Cada celda del día muestra los gastos de esa fecha (monto + descripción corta)
- Si hay más de 3 gastos en un día, muestra los primeros 3 y "+N más"
- Barra inferior con resumen YTD del control anual: `YTD: $3000 · Gastos: $80 · Balance: $2920`
- Link "Ver control anual 2026 →" que abre el ControlDetail (panel lateral existente)

## Interacciones
- **Click en día vacío:** abre modal "Agregar Gasto" con la fecha pre-seleccionada
- **Click en gasto existente:** abre modal de edición minimalista
- **Drag & drop:** arrastrar gasto entre días actualiza su fecha vía API
  - Si es recurrente, solo se mueve esa ocurrencia (se desvincula del grupo)
  - Tarjeta fantasma sigue al cursor, celda destino se resalta

## Agregar Gasto (modal rediseñado)
- Descripción, Monto, Categoría (Fijos/Ocio/Ahorro)
- Fecha del gasto (pre-cargada desde el calendario)
- Checkbox "¿Es recurrente?"
- Tipo de recurrencia: Semanal | Mensual
- Número de cuotas: 0 = indefinido, >0 = cuotas fijas
- **Recurrencia sin cuotas:** se replica en todos los meses futuros del control
- **Cuotas fijas:** se replica N meses, muestra badge "Cuota 3/12"

## Editar Gasto Recurrente
- Al editar una ocurrencia de un gasto recurrente, preguntar:
  - "¿Aplicar solo a este mes?" → se desvincula del grupo
  - "¿Aplicar a todos los meses?" → actualiza toda la serie

## Modelo de Datos (cambios en Gasto)
```typescript
interface Gasto {
  // ... campos existentes
  fecha: string                    // Fecha exacta YYYY-MM-DD
  esRecurrente: boolean
  recurrenciaTipo?: 'semanal' | 'mensual'
  cuotasOriginales: number         // 0 = indefinido
  cuotasRestantes: number
  recurrenciaGrupoId?: string      // ID del grupo de recurrencia
  fechaOrigen: string              // Fecha original de creación
}
```

## Integración con Control Anual
- El control anual sigue existiendo con su lógica actual
- Al crear un control anual con "gastos fijos recurrentes", aparecen en el calendario en sus días de pago
- Desde el calendario, link "Ver control anual" abre el panel ControlDetail existente
- Los botones "Cerrar Mes" y "Nuevo control anual" se mantienen en el panel de detalle

## Archivos a modificar/crear
| Archivo | Acción |
|---------|--------|
| `PresupuestosPage.tsx` | Reemplazar vista de tarjetas por calendario |
| `CalendarBudget.tsx` (nuevo) | Componente de calendario mensual |
| `AddGastoModal.tsx` | Agregar campos fecha, recurrencia, cuotas |
| `EditGastoModal.tsx` (nuevo) | Modal de edición minimalista |
| `GastoCard.tsx` | Badge de cuotas y badge recurrente |
| Backend `gasto.dto.ts` | Agregar campos al DTO |

## No contemplado en este diseño
- Drag & drop touch en dispositivos móviles (se puede agregar después)
- Vista semanal del calendario
- Notificaciones de gastos próximos
