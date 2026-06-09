import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../../config/firebase/firebase.service';
import { CreatePresupuestoDto } from './dto/create-presupuesto.dto';
import { CreateGastoDto, UpdateGastoDto } from './dto/create-gasto.dto';
import { FirebaseUser } from '../../common/guards/firebase-auth.guard';

export interface PresupuestoDocument {
  carteraId: string; tipo: 'mensual' | 'quincenal';
  salarioMensual: number; salarioQ1: number; salarioQ2: number;
  sobranteAnterior: number; efectivoExtra: number;
  metaFijos: number; metaOcio: number; metaAhorro: number;
  fecha: string; year: number; mes: number; controlId: string;
  cerrado: boolean; cerradoEn: string | null;
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
}

@Injectable()
export class PresupuestosService {
  constructor(private readonly firebaseService: FirebaseService) {}

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
    const controles = Object.entries(grouped).map(([controlId, presupuestos]) => {
      const first = presupuestos[0];
      presupuestos.sort((a: any, b: any) => a.mes - b.mes);
      return {
        controlId, year: first.year, tipo: first.tipo, presupuestos,
        totalPresupuestos: presupuestos.length,
        cerrados: presupuestos.filter((p: any) => p.cerrado).length,
      };
    });
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

    const carteraRef = db.collection('bancos').doc(p.carteraId);
    const carteraDoc = await carteraRef.get();
    if (carteraDoc.exists) {
      const cd = carteraDoc.data() as { saldo: number };
      await carteraRef.update({ saldo: Math.max(0, (cd.saldo ?? 0) - dto.monto) });
      await carteraRef.collection('transacciones').add({
        tipo: 'retiro', monto: dto.monto, descripcion: `Presupuesto: ${dto.descripcion}`,
        fecha: new Date().toISOString(), presupuestoId, userId: user.uid,
      });
    }

    const cuotas = dto.cuotas ?? 0;
    const gasto = {
      descripcion: dto.descripcion, monto: dto.monto,
      montoEstimado: dto.montoEstimado ?? dto.monto,
      montoFinal: dto.montoFinal ?? 0,
      estaConciliado: dto.estaConciliado ?? false,
      categoria: dto.categoria,
      quincena: dto.quincena ?? null,
      creadoEn: new Date().toISOString(),
      esFijo: dto.esFijo ?? false,
      cuotasRestantes: cuotas,
      cuotasOriginales: cuotas,
      fechaPago: dto.fechaPago ?? null,
    };
    const ref = await pRef.collection('gastos').add(gasto);

    if (dto.esFijo && p.controlId) {
      await this.propagateGastoFijo(p.controlId, p.mes, gasto);
    }

    return { id: ref.id, ...gasto };
  }

  private async propagateGastoFijo(controlId: string, desdeMes: number, gasto: any) {
    const db = this.firebaseService.firestore;
    const snapshot = await db.collection('presupuestos')
      .where('controlId', '==', controlId)
      .where('mes', '>', desdeMes)
      .get();
    if (snapshot.empty) return;
    const batch = db.batch();
    for (const doc of snapshot.docs) {
      batch.set(doc.ref.collection('gastos').doc(), { ...gasto });
    }
    await batch.commit();
  }

  async cerrarMes(presupuestoId: string) {
    const db = this.firebaseService.firestore;
    const pRef = db.collection('presupuestos').doc(presupuestoId);
    const pDoc = await pRef.get();
    if (!pDoc.exists) throw new NotFoundException('Presupuesto no encontrado');
    const p = pDoc.data() as PresupuestoDocument;
    if (p.cerrado) throw new Error('Mes ya cerrado');

    const gastosSnap = await pRef.collection('gastos').get();
    const totalGastos = gastosSnap.docs.reduce((sum, d) => sum + ((d.data() as any).montoFinal ?? 0), 0);
    const ingresos = p.sobranteAnterior + p.efectivoExtra + (p.tipo === 'mensual' ? p.salarioMensual : p.salarioQ1 + p.salarioQ2);
    const remainder = ingresos - totalGastos;

    await pRef.update({ cerrado: true, cerradoEn: new Date().toISOString() });

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
}