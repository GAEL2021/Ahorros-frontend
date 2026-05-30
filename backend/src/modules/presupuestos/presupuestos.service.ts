import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../../config/firebase/firebase.service';
import { CreatePresupuestoDto } from './dto/create-presupuesto.dto';
import { CreateGastoDto } from './dto/create-gasto.dto';
import { FirebaseUser } from '../../common/guards/firebase-auth.guard';

export interface PresupuestoDocument {
  carteraId: string; tipo: 'mensual' | 'quincenal';
  salarioMensual: number; salarioQ1: number; salarioQ2: number;
  sobranteAnterior: number; efectivoExtra: number;
  metaFijos: number; metaOcio: number; metaAhorro: number;
  userId: string; creadoEn: string;
}

export interface GastoDocument {
  descripcion: string; monto: number;
  categoria: 'fijos' | 'ocio' | 'ahorro';
  quincena?: 'Q1' | 'Q2'; creadoEn: string;
}

@Injectable()
export class PresupuestosService {
  constructor(private readonly firebaseService: FirebaseService) {}

  async create(dto: CreatePresupuestoDto, user: FirebaseUser) {
    const db = this.firebaseService.firestore;
    const carteraDoc = await db.collection('bancos').doc(dto.carteraId).get();
    if (!carteraDoc.exists) throw new NotFoundException('Cartera no encontrada');
    const doc: PresupuestoDocument = {
      carteraId: dto.carteraId, tipo: dto.tipo,
      salarioMensual: dto.salarioMensual ?? 0, salarioQ1: dto.salarioQ1 ?? 0, salarioQ2: dto.salarioQ2 ?? 0,
      sobranteAnterior: dto.sobranteAnterior, efectivoExtra: dto.efectivoExtra,
      metaFijos: dto.metaFijos, metaOcio: dto.metaOcio, metaAhorro: dto.metaAhorro,
      userId: user.uid, creadoEn: new Date().toISOString(),
    };
    const ref = await db.collection('presupuestos').add(doc);
    return { id: ref.id, ...doc };
  }

  async findAll(user: FirebaseUser) {
    const snapshot = await this.firebaseService.firestore
      .collection('presupuestos').where('userId', '==', user.uid).get();
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
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

    const gasto: GastoDocument = {
      descripcion: dto.descripcion, monto: dto.monto, categoria: dto.categoria,
      quincena: dto.quincena, creadoEn: new Date().toISOString(),
    };
    const ref = await pRef.collection('gastos').add(gasto);
    return { id: ref.id, ...gasto };
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
