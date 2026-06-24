import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { FirebaseService } from '../../config/firebase/firebase.service';
import { CreatePresupuestoDto } from './dto/create-presupuesto.dto';
import { UpdatePresupuestoDto } from './dto/update-presupuesto.dto';
import { CreateGastoDto, UpdateGastoDto } from './dto/create-gasto.dto';
import { FirebaseUser } from '../../common/guards/firebase-auth.guard';
import { TarjetasCreditoService } from '../tarjetas-credito/tarjetas-credito.service';

export interface PresupuestoDocument {
  carteraId: string; tipo: 'mensual' | 'quincenal';
  salarioMensual: number; salarioQ1: number; salarioQ2: number;
  sobranteAnterior: number; efectivoExtra: number;
  metaFijos: number; metaOcio: number; metaAhorro: number;
  fecha: string; year: number; mes: number; controlId: string;
  cerrado: boolean; cerradoEn: string | null;
  cerradoQ1: boolean; cerradoQ1En: string | null;
  cerradoQ2: boolean;
  sobranteQ1: number;
  userId: string; creadoEn: string;
}

export interface GastoDocument {
  descripcion: string; monto: number;
  montoEstimado: number; montoFinal: number;
  estaConciliado: boolean;
  categoria: 'fijos' | 'ocio' | 'ahorro';
  quincena?: 'Q1' | 'Q2'; creadoEn: string;
  esFijo: boolean;
  cuotasRestantes: number;
  cuotasOriginales: number;
  activo: boolean;
  fechaPago?: string;
  fecha?: string;
  esRecurrente?: boolean;
  recurrenciaTipo?: 'quincenal' | 'mensual';
  recurrenciaGrupoId?: string;
  fechaOrigen?: string;
  carteraId?: string;
  medioDePago?: string;
  tarjetaCreditoId?: string;
}

@Injectable()
export class PresupuestosService {
  constructor(
    private readonly firebaseService: FirebaseService,
    @Inject(forwardRef(() => TarjetasCreditoService))
    private readonly tarjetasCreditoService: TarjetasCreditoService,
  ) {}

  private docFromDto(dto: CreatePresupuestoDto, user: FirebaseUser, mes: number, controlId: string): PresupuestoDocument {
    let salarioMensual = dto.salarioMensual ?? 0;
    let salarioQ1 = dto.salarioQ1 ?? 0;
    let salarioQ2 = dto.salarioQ2 ?? 0;
    if (dto.year && dto.tipo === 'quincenal' && dto.salarioQ1 === undefined && dto.salarioQ2 === undefined && dto.salarioMensual === undefined) {
    }
    return {
      carteraId: dto.carteraId ?? '',
      tipo: dto.tipo,
      salarioMensual, salarioQ1, salarioQ2,
      sobranteAnterior: mes === 1 ? dto.sobranteAnterior : 0,
      efectivoExtra: mes === 1 ? dto.efectivoExtra : 0,
      metaFijos: dto.metaFijos ?? 0,
      metaOcio: dto.metaOcio ?? 0,
      metaAhorro: dto.metaAhorro ?? 0,
      fecha: dto.fecha ?? '',
      year: dto.year ?? 0,
      mes,
      controlId,
      cerrado: false,
      cerradoEn: null,
      cerradoQ1: false,
      cerradoQ1En: null,
      cerradoQ2: false,
      sobranteQ1: 0,
      userId: user.uid,
      creadoEn: new Date().toISOString(),
    };
  }

  async create(dto: CreatePresupuestoDto, user: FirebaseUser) {
    const db = this.firebaseService.firestore;
    if (dto.carteraId) {
      const carteraDoc = await db.collection('bancos').doc(dto.carteraId).get();
      if (!carteraDoc.exists) throw new NotFoundException('Cartera no encontrada');
    }

    if (dto.year) {
      const controlId = db.collection('presupuestos').doc().id;
      const batch = db.batch();
      const refs: string[] = [];
      const desde = dto.mesDesde ?? 1;
      for (let mes = desde; mes <= 12; mes++) {
        const doc = this.docFromDto(dto, user, mes, controlId);
        const ref = db.collection('presupuestos').doc();
        batch.set(ref, doc);
        refs.push(ref.id);
      }
      await batch.commit();

      if (dto.gastosFijos?.length) {
        const batch2 = db.batch();
        for (const refId of refs) {
          for (const g of dto.gastosFijos) {
            const cuotas = g.cuotas ?? 0;
            batch2.set(db.collection('presupuestos').doc(refId).collection('gastos').doc(), {
              descripcion: g.descripcion, monto: g.monto,
              montoEstimado: g.montoEstimado ?? g.monto,
              montoFinal: g.montoFinal ?? 0,
              estaConciliado: g.estaConciliado ?? false,
              categoria: g.categoria,
              quincena: g.quincena ?? null,
              creadoEn: new Date().toISOString(),
              esFijo: true,
              cuotasRestantes: cuotas,
              cuotasOriginales: cuotas,
              fechaPago: g.fechaPago ?? null,
            });
          }
        }
        await batch2.commit();
      }

      return { controlId, year: dto.year, tipo: dto.tipo, meses: refs.length, desde };
    }

    const doc = this.docFromDto(dto, user, 0, '');
    const ref = await db.collection('presupuestos').add(doc);
    if (dto.gastosFijos?.length) {
      const batch = db.batch();
      for (const g of dto.gastosFijos) {
        const gastoRef = ref.collection('gastos').doc();
        const cuotas = g.cuotas ?? 0;
        batch.set(gastoRef, {
          descripcion: g.descripcion, monto: g.monto,
          montoEstimado: g.montoEstimado ?? g.monto,
          montoFinal: g.montoFinal ?? 0,
          estaConciliado: g.estaConciliado ?? false,
          categoria: g.categoria,
          quincena: g.quincena ?? null,
          creadoEn: new Date().toISOString(),
          esFijo: true,
          cuotasRestantes: cuotas,
          cuotasOriginales: cuotas,
          fechaPago: g.fechaPago ?? null,
        });
      }
      await batch.commit();
    }
    return { id: ref.id, ...doc };
  }

  async findAll(user: FirebaseUser) {
    const snapshot = await this.firebaseService.firestore
      .collection('presupuestos').where('userId', '==', user.uid).get();
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async findControles(user: FirebaseUser) {
    const all = await this.findAll(user);
    const grouped: Record<string, any[]> = {};
    for (const p of all as any[]) {
      if (p.controlId) {
        if (!grouped[p.controlId]) grouped[p.controlId] = [];
        grouped[p.controlId].push(p);
      }
    }
    const controles = await Promise.all(Object.entries(grouped).map(async ([controlId, presupuestos]) => {
      const first = presupuestos[0];
      presupuestos.sort((a: any, b: any) => a.mes - b.mes);
      const presupuestosConGastos = await Promise.all(presupuestos.map(async (p: any) => {
        const { id } = p;
        const gastosSnap = await this.firebaseService.firestore
          .collection('presupuestos').doc(id).collection('gastos')
          .orderBy('creadoEn', 'desc').get();
        return { ...p, gastos: gastosSnap.docs.map((d) => ({ id: d.id, ...d.data() })) };
      }));
      return {
        controlId, year: first.year, tipo: first.tipo, presupuestos: presupuestosConGastos,
        totalPresupuestos: presupuestos.length,
        cerrados: presupuestos.filter((p: any) => p.cerrado).length,
      };
    }));
    controles.sort((a, b) => b.year - a.year);
    return controles;
  }

  async carryToNewYear(controlId: string, user: FirebaseUser) {
    const db = this.firebaseService.firestore;
    const snapshot = await db.collection('presupuestos')
      .where('controlId', '==', controlId).where('userId', '==', user.uid).get();
    if (snapshot.empty) throw new NotFoundException('Control no encontrado');

    const presupuestos = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    const todosCerrados = presupuestos.every((p) => p.cerrado);
    if (!todosCerrados) throw new Error('No todos los meses están cerrados');

    const diciembre = presupuestos.find((p) => p.mes === 12);
    if (!diciembre) throw new Error('Diciembre no encontrado');

    const gastosSnap = await db.collection('presupuestos').doc(diciembre.id).collection('gastos').get();
    const totalGastos = gastosSnap.docs.reduce((s, d) => s + ((d.data() as any).montoFinal ?? 0), 0);
    const ingresosDiciembre = (diciembre.tipo === 'mensual' ? diciembre.salarioMensual : diciembre.salarioQ1 + diciembre.salarioQ2) + diciembre.sobranteAnterior + diciembre.efectivoExtra;
    const remainder = ingresosDiciembre - totalGastos;

    const first = presupuestos[0];
    const nextYear = first.year + 1;
    const newControlId = db.collection('presupuestos').doc().id;
    const batch = db.batch();
    for (let mes = 1; mes <= 12; mes++) {
      const doc: PresupuestoDocument = {
        carteraId: first.carteraId ?? '',
        tipo: first.tipo,
        salarioMensual: first.salarioMensual, salarioQ1: first.salarioQ1, salarioQ2: first.salarioQ2,
        sobranteAnterior: mes === 1 ? remainder : 0,
        efectivoExtra: 0,
        metaFijos: first.metaFijos, metaOcio: first.metaOcio, metaAhorro: first.metaAhorro,
        fecha: '', year: nextYear, mes, controlId: newControlId,
        cerrado: false, cerradoEn: null,
        cerradoQ1: false, cerradoQ1En: null, cerradoQ2: false, sobranteQ1: 0,
        userId: user.uid, creadoEn: new Date().toISOString(),
      };
      batch.set(db.collection('presupuestos').doc(), doc);
    }
    await batch.commit();

    return { controlId: newControlId, year: nextYear, sobranteInicial: remainder };
  }

  async findOne(id: string) {
    const doc = await this.firebaseService.firestore.collection('presupuestos').doc(id).get();
    if (!doc.exists) return null;
    const gastosSnap = await doc.ref.collection('gastos').orderBy('creadoEn', 'desc').get();
    return { id: doc.id, ...doc.data(), gastos: gastosSnap.docs.map((d) => ({ id: d.id, ...d.data() })) };
  }

  async addGasto(presupuestoId: string, dto: CreateGastoDto, user: FirebaseUser) {
    const db = this.firebaseService.firestore;
    const pRef = db.collection('presupuestos').doc(presupuestoId);
    const pDoc = await pRef.get();
    if (!pDoc.exists) throw new NotFoundException('Presupuesto no encontrado');
    const p = pDoc.data() as PresupuestoDocument;

    const cuotas = dto.cuotas ?? 0;
    const fecha = dto.fecha ?? new Date(p.year, p.mes - 1, 1).toISOString().split('T')[0];
    const recurrenciaGrupoId = dto.esRecurrente ? (dto.recurrenciaGrupoId ?? db.collection('_').doc().id) : '';
    let quincena = dto.quincena ?? null;
    if (!quincena && p.tipo === 'quincenal' && fecha) {
      const dia = parseInt(fecha.split('-')[2], 10);
      quincena = dia <= 15 ? 'Q2' : 'Q1';
    }
    const gasto = {
      descripcion: dto.descripcion, monto: dto.monto,
      montoEstimado: dto.montoEstimado ?? dto.monto,
      montoFinal: dto.montoFinal ?? 0,
      estaConciliado: dto.estaConciliado ?? false,
      categoria: dto.categoria,
      quincena,
      creadoEn: new Date().toISOString(),
      esFijo: dto.esFijo ?? false,
      cuotasRestantes: cuotas,
      cuotasOriginales: cuotas,
      fechaPago: dto.fechaPago ?? null,
      fecha,
      esRecurrente: dto.esRecurrente ?? false,
      recurrenciaTipo: dto.recurrenciaTipo ?? null,
      recurrenciaGrupoId: dto.esRecurrente ? recurrenciaGrupoId : null,
      fechaOrigen: dto.fechaOrigen ?? fecha,
      carteraId: dto.carteraId || null,
      medioDePago: dto.medioDePago || null,
      tarjetaCreditoId: dto.tarjetaCreditoId || null,
    };
    const ref = await pRef.collection('gastos').add(gasto);

    if (dto.esFijo && p.controlId) {
      await this.propagateGastoFijo(p.controlId, p.mes, gasto);
    }

    if (dto.esRecurrente && p.controlId && cuotas !== 1) {
      await this.propagateGastoRecurrente(p.controlId, p.mes, gasto, cuotas, dto.recurrenciaTipo ?? 'mensual');
    }

    if (dto.categoria === 'ahorro' && dto.monto > 0) {
      await this.depositarAhorro(user.uid, user.email ?? '', dto.monto, dto.descripcion);
    }

    if (dto.medioDePago === 'tarjeta_credito' && dto.tarjetaCreditoId) {
      try {
        await this.tarjetasCreditoService.acumularCompra(
          dto.tarjetaCreditoId,
          { descripcion: dto.descripcion, monto: dto.monto, fecha: fecha, gastoId: ref.id },
          user,
        );
      } catch (e: any) {
        // No bloquear el registro del gasto si falla la acumulación en TC
        console.error('Error acumulando compra en tarjeta:', e.message);
      }
    }

    return { id: ref.id, ...gasto };
  }

  private async depositarAhorro(uid: string, email: string, monto: number, descripcion: string) {
    const db = this.firebaseService.firestore;
    const existing = await db.collection('bancos')
      .where('uid', '==', uid)
      .where('esAhorro', '==', true)
      .limit(1)
      .get();

    const now = new Date().toISOString();
    if (existing.empty) {
      const ref = db.collection('bancos').doc();
      await ref.set({
        uid, catalogoBancoId: '', nombre: 'Ahorros', color: '#10B981',
        saldo: monto, descripcion: 'Cartera de ahorros automática',
        tipoCuenta: 'debito', tipo: 'personal', esAhorro: true,
        creadoPor: uid, creadoPorNombre: email?.split('@')[0] || 'Usuario',
        creadoEn: now, codigoCompartir: '',
      });
      await ref.collection('miembros').doc(email).set({
        uid, email, saldoAportado: monto, rol: 'creador',
      });
      await ref.collection('transacciones').add({
        carteraId: ref.id, userId: uid, tipo: 'deposito',
        monto, descripcion: `Ahorro: ${descripcion}`, fecha: now,
      });
    } else {
      const doc = existing.docs[0];
      const data = doc.data() as any;
      await doc.ref.update({ saldo: (data.saldo || 0) + monto });
      await doc.ref.collection('transacciones').add({
        carteraId: doc.id, userId: uid, tipo: 'deposito',
        monto, descripcion: `Ahorro: ${descripcion}`, fecha: now,
      });
      const miembroRef = doc.ref.collection('miembros').doc(email);
      if ((await miembroRef.get()).exists) {
        const m = (await miembroRef.get()).data() as any;
        await miembroRef.update({ saldoAportado: (m.saldoAportado || 0) + monto });
      }
    }
  }

  private async propagateGastoRecurrente(controlId: string, desdeMes: number, gasto: any, cuotas: number, tipo: 'quincenal' | 'mensual') {
    const db = this.firebaseService.firestore;
    const allSnap = await db.collection('presupuestos').where('controlId', '==', controlId).get();
    const futures = allSnap.docs
      .map((d) => ({ id: d.id, mes: (d.data() as any).mes as number }))
      .filter((x) => x.mes > desdeMes)
      .sort((a, b) => a.mes - b.mes);
    if (futures.length === 0) return;
    const batch = db.batch();
    let count = 0;
    for (const f of futures) {
      if (cuotas > 0 && count >= cuotas - 1) break;
      const newFecha = (gasto.fecha as string).replace(/^\d{4}-\d{2}/, `${gasto.fechaOrigen?.slice(0, 4) ?? ''}-${String(f.mes).padStart(2, '0')}`);
      batch.set(db.collection('presupuestos').doc(f.id).collection('gastos').doc(), {
        ...gasto,
        fecha: newFecha,
        cuotasRestantes: cuotas > 0 ? cuotas - 1 - count : 0,
      });
      count++;
    }
    await batch.commit();
  }

  private async propagateGastoFijo(controlId: string, desdeMes: number, gasto: any) {
    const db = this.firebaseService.firestore;
    const allSnap = await db.collection('presupuestos').where('controlId', '==', controlId).get();
    const futures = allSnap.docs
      .map((d) => ({ id: d.id, mes: (d.data() as any).mes as number }))
      .filter((x) => x.mes > desdeMes);
    if (futures.length === 0) return;
    const batch = db.batch();
    for (const f of futures) {
      batch.set(db.collection('presupuestos').doc(f.id).collection('gastos').doc(), { ...gasto });
    }
    await batch.commit();
  }

  async cerrarMes(presupuestoId: string, userId?: string, quincena?: 'Q1' | 'Q2') {
    const db = this.firebaseService.firestore;
    const pRef = db.collection('presupuestos').doc(presupuestoId);
    const pDoc = await pRef.get();
    if (!pDoc.exists) throw new NotFoundException('Presupuesto no encontrado');
    const p = pDoc.data() as PresupuestoDocument;

    if (quincena && p.tipo === 'quincenal') {
      if (quincena === 'Q1' && p.cerradoQ1) throw new Error('Q1 ya cerrado');
      if (quincena === 'Q2' && p.cerradoQ2) throw new Error('Q2 ya cerrado');
    } else {
      if (p.cerrado) throw new Error('Mes ya cerrado');
    }

    const gastosSnap = await pRef.collection('gastos').get();
    const gastosData = gastosSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    const sinAhorro = (g: any) => g.categoria !== 'ahorro';
    const montoGasto = (g: any) => g.montoFinal ?? g.monto;

    if (quincena === 'Q1' && p.tipo === 'quincenal') {
      const q1Gastos = gastosData.filter((g: any) => (g.quincena === 'Q1' || !g.quincena) && sinAhorro(g)).reduce((s, g) => s + montoGasto(g), 0);
      const remainder = p.sobranteAnterior + p.salarioQ1 - q1Gastos;
      await pRef.update({ cerradoQ1: true, cerradoQ1En: new Date().toISOString(), sobranteQ1: remainder });
      return { remainder, cerradoQ1: true, mes: p.mes, quincena: 'Q1' };
    }

    if (quincena === 'Q2' && p.tipo === 'quincenal') {
      const q2Gastos = gastosData.filter((g: any) => (g.quincena === 'Q2' || !g.quincena) && sinAhorro(g)).reduce((s, g) => s + montoGasto(g), 0);
      const remainder = (p.cerradoQ1 ? p.sobranteQ1 : p.sobranteAnterior) + p.salarioQ2 - q2Gastos;
      await pRef.update({ cerrado: true, cerradoEn: new Date().toISOString(), cerradoQ2: true });

      const nextMes = p.mes + 1;
      if (nextMes <= 12 && p.controlId) {
        const nextSnapshot = await db.collection('presupuestos')
          .where('controlId', '==', p.controlId)
          .where('mes', '==', nextMes)
          .limit(1)
          .get();
        if (!nextSnapshot.empty) {
          await nextSnapshot.docs[0].ref.update({ sobranteAnterior: remainder });
        }
      }

      return { remainder, cerrado: true, cerradoQ2: true, mes: p.mes, quincena: 'Q2' };
    }

    if (p.cerrado) throw new Error('Mes ya cerrado');

    const totalGastos = gastosData.filter(sinAhorro).reduce((s, g) => s + montoGasto(g), 0);
    const ingresos = p.sobranteAnterior + p.efectivoExtra + (p.tipo === 'mensual' ? p.salarioMensual : p.salarioQ1 + p.salarioQ2);
    const remainder = ingresos - totalGastos;

    await pRef.update({ cerrado: true, cerradoEn: new Date().toISOString(), cerradoQ1: true, cerradoQ2: true });

    const nextMes = p.mes + 1;
    if (nextMes <= 12 && p.controlId) {
      const nextSnapshot = await db.collection('presupuestos')
        .where('controlId', '==', p.controlId)
        .where('mes', '==', nextMes)
        .limit(1)
        .get();
      if (!nextSnapshot.empty) {
        await nextSnapshot.docs[0].ref.update({ sobranteAnterior: remainder });
      }
    }

    return { remainder, cerrado: true, mes: p.mes };
  }

  async updateGasto(presupuestoId: string, gastoId: string, dto: UpdateGastoDto) {
    const ref = this.firebaseService.firestore.collection('presupuestos').doc(presupuestoId).collection('gastos').doc(gastoId);
    const doc = await ref.get();
    if (!doc.exists) throw new NotFoundException('Gasto no encontrado');

    const updateData: Record<string, unknown> = {};
    if (dto.descripcion !== undefined) updateData.descripcion = dto.descripcion;
    if (dto.monto !== undefined) updateData.monto = dto.monto;
    if (dto.montoEstimado !== undefined) updateData.montoEstimado = dto.montoEstimado;
    if (dto.montoFinal !== undefined) updateData.montoFinal = dto.montoFinal;
    if (dto.estaConciliado !== undefined) updateData.estaConciliado = dto.estaConciliado;
    if (dto.categoria !== undefined) updateData.categoria = dto.categoria;
    if (dto.cuotasRestantes !== undefined) updateData.cuotasRestantes = dto.cuotasRestantes;

    if (dto.estaConciliado === true && doc.data()?.cuotasRestantes > 0) {
      const nuevasCuotas = (doc.data()?.cuotasRestantes ?? 1) - 1;
      updateData.cuotasRestantes = nuevasCuotas;
      if (nuevasCuotas === 0) {
        updateData.activo = false;
      }
    }

    if (Object.keys(updateData).length > 0) {
      await ref.update(updateData);
    }
    const updated = await ref.get();
    return { id: updated.id, ...updated.data() };
  }

  async updateGastoFecha(presupuestoId: string, gastoId: string, fecha: string) {
    const ref = this.firebaseService.firestore.collection('presupuestos').doc(presupuestoId).collection('gastos').doc(gastoId);
    const doc = await ref.get();
    if (!doc.exists) throw new NotFoundException('Gasto no encontrado');
    await ref.update({ fecha, recurrenciaGrupoId: null });
    const updated = await ref.get();
    return { id: updated.id, ...updated.data() };
  }

  async updatePresupuesto(id: string, dto: UpdatePresupuestoDto) {
    const ref = this.firebaseService.firestore.collection('presupuestos').doc(id);
    const doc = await ref.get();
    if (!doc.exists) throw new NotFoundException('Presupuesto no encontrado');

    const updateData: Record<string, unknown> = {};
    if (dto.salarioMensual !== undefined) updateData.salarioMensual = dto.salarioMensual;
    if (dto.salarioQ1 !== undefined) updateData.salarioQ1 = dto.salarioQ1;
    if (dto.salarioQ2 !== undefined) updateData.salarioQ2 = dto.salarioQ2;
    if (dto.sobranteAnterior !== undefined) updateData.sobranteAnterior = dto.sobranteAnterior;
    if (dto.efectivoExtra !== undefined) updateData.efectivoExtra = dto.efectivoExtra;
    if (dto.metaFijos !== undefined) updateData.metaFijos = dto.metaFijos;
    if (dto.metaOcio !== undefined) updateData.metaOcio = dto.metaOcio;
    if (dto.metaAhorro !== undefined) updateData.metaAhorro = dto.metaAhorro;

    if (Object.keys(updateData).length > 0) {
      await ref.update(updateData);
    }
    const updated = await ref.get();
    return { id: updated.id, ...updated.data() };
  }

  async pagarGasto(
    presupuestoId: string,
    gastoId: string,
    _user: FirebaseUser,
    montoReal?: number,
    _carteraIdOverride?: string,
    medioDePago?: string,
    tarjetaCreditoId?: string,
  ) {
    const ref = this.firebaseService.firestore.collection('presupuestos').doc(presupuestoId).collection('gastos').doc(gastoId);
    const doc = await ref.get();
    if (!doc.exists) throw new NotFoundException('Gasto no encontrado');
    const data = doc.data() as GastoDocument;
    const montoUsar = montoReal ?? data.monto;

    const updateData: Record<string, unknown> = { estaConciliado: true };
    if (montoReal !== undefined) updateData.montoFinal = montoReal;
    if (medioDePago !== undefined) updateData.medioDePago = medioDePago;
    if (tarjetaCreditoId !== undefined) updateData.tarjetaCreditoId = tarjetaCreditoId;
    await ref.update(updateData);

    if (medioDePago === 'tarjeta_credito' && tarjetaCreditoId) {
      try {
        await this.tarjetasCreditoService.acumularCompra(
          tarjetaCreditoId,
          { descripcion: data.descripcion, monto: montoUsar, fecha: data.fecha || new Date().toISOString(), gastoId },
          _user,
        );
      } catch (e: any) {
        console.error('Error acumulando compra en tarjeta:', e.message);
      }
    }

    return { message: 'Gasto pagado', gastoId, montoUsar };
  }

  async deleteGasto(presupuestoId: string, gastoId: string) {
    const ref = this.firebaseService.firestore.collection('presupuestos').doc(presupuestoId).collection('gastos').doc(gastoId);
    const doc = await ref.get();
    if (!doc.exists) throw new NotFoundException('Gasto no encontrado');
    await ref.delete();
    return { message: 'Gasto eliminado' };
  }

  async delete(id: string) {
    const ref = this.firebaseService.firestore.collection('presupuestos').doc(id);
    const doc = await ref.get();
    if (!doc.exists) throw new NotFoundException('No encontrado');
    const gastosSnap = await ref.collection('gastos').get();
    const batch = this.firebaseService.firestore.batch();
    gastosSnap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    await ref.delete();
    return { message: 'Eliminado' };
  }

  async deleteControl(controlId: string, user: FirebaseUser) {
    const db = this.firebaseService.firestore;
    const snapshot = await db.collection('presupuestos')
      .where('controlId', '==', controlId).where('userId', '==', user.uid).get();
    if (snapshot.empty) throw new NotFoundException('Control no encontrado');

    for (const doc of snapshot.docs) {
      const gastosSnap = await doc.ref.collection('gastos').get();
      const batch = db.batch();
      gastosSnap.docs.forEach((g) => batch.delete(g.ref));
      batch.delete(doc.ref);
      await batch.commit();
    }
    return { message: 'Control eliminado' };
  }
}