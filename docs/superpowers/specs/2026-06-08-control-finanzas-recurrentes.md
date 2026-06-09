# Control de Finanzas - Gastos Fijos Recurrentes

## Resumen
Rediseño del módulo "Control de Finanzas" (antes Presupuestos) para soportar gastos fijos recurrentes que se crean al crear el control y aparecen cada mes automáticamente, y cuotas con número definido de repeticiones.

## Cambios en datos

### CreateGastoDto (backend)
```ts
export class CreateGastoDto {
  descripcion: string;
  monto: number;
  montoEstimado?: number;
  montoFinal?: number;
  estaConciliado?: boolean;
  categoria: 'fijos' | 'ocio' | 'ahorro';
  quincena?: 'Q1' | 'Q2';
  esFijo?: boolean;         // nuevo
  cuotas?: number;          // nuevo (0 = ilimitado, >0 = fijo)
}
```

### GastoDocument (backend)
```ts
export interface GastoDocument {
  descripcion: string;
  monto: number;
  montoEstimado: number;
  montoFinal: number;
  estaConciliado: boolean;
  categoria: 'fijos' | 'ocio' | 'ahorro';
  quincena?: 'Q1' | 'Q2';
  creadoEn: string;
  esFijo: boolean;           // nuevo
  cuotasRestantes: number;    // nuevo
  cuotasOriginales: number;   // nuevo
}
```

### CreatePresupuestoDto (backend)
Se agrega campo `gastosFijos?: CreateGastoDto[]` para crear gastos fijos junto con el control.

## Comportamiento

### Creación del control
1. Usuario ingresa salario total
2. Si es quincenal → se divide automáticamente en Q1 y Q2
3. Usuario agrega gastos fijos en el mismo formulario
4. Cada gasto fijo tiene: descripción, monto, categoría, quincena (si quincenal), cuotas (0=ilimitado)
5. Al guardar: se crea el control + se crean los gastos fijos como documentos en subcolección `gastos`

### Visualización
- Al abrir el detalle de un control, los gastos fijos aparecen listados
- Si el gasto ya fue conciliado en el mes actual, se marca
- Cada gasto fijo puede ser: marcado como pagado, editado su monto real, o eliminado
- Los gastos con cuotas muestran indicador "Cuota X/Y"
- Los gastos sin cuotas son permanentes

### Recurrencia mensual
- Cuando se accede a un control existente, los gastos fijos se presentan como estaban
- El usuario marca conciliado = true cuando paga, y registra montoFinal
- Si un gasto tiene cuotasRestantes > 0 y se concilia → cuotasRestantes se reduce en 1
- Si cuotasRestantes llega a 0 → el gasto se desactiva (no se muestra más)

## Frontend

### CreateModal rediseñado
- Sección "Datos de ingreso": salario, frecuencia, sobrante, efectivo extra, metas
- Sección "Gastos fijos": lista dinámica para agregar gastos fijos
  - Descripción, monto, categoría, quincena (si quincenal), cuotas (opcional)
  - Botón "Agregar gasto fijo" y "+" para agregar filas

### GastoCard actualizado
- Si `esFijo`: mostrar indicador "Fijo" o "Cuota X/Y"
- Checkbox solo disponible si `montoFinal` > 0 (como ya está)

## Backend

### create() actualizado
- Aceptar array `gastosFijos` en el DTO
- Después de crear el control, crear cada gasto fijo en subcolección `gastos`
- Asignar `cuotasRestantes = cuotas` (0 = ilimitado)

### findOne() actualizado
- Ya devuelve todos los gastos de la subcolección (no necesita cambio)

### updateGasto() actualizado
- Si se actualiza `estaConciliado = true` y el gasto tiene `cuotasRestantes > 0`:
  - Reducir `cuotasRestantes` en 1
  - Si `cuotasRestantes === 0` → marcar como inactivo o eliminar

## Archivos a modificar

### Backend
- `backend/src/modules/presupuestos/dto/create-gasto.dto.ts` - agregar esFijo, cuotas
- `backend/src/modules/presupuestos/presupuestos.service.ts` - actualizar interfaces, create(), updateGasto()
- `backend/src/modules/presupuestos/dto/create-presupuesto.dto.ts` - agregar gastosFijos opcional

### Frontend
- `front-end/src/pages/PresupuestosPage.tsx` - rediseñar CreateModal, actualizar GastoCard
