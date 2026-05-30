import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { FirebaseService } from '../../config/firebase/firebase.service';
import { BancosService } from '../bancos/bancos.service';
import { CreateProgramacionDto } from './dto/create-programacion.dto';
import { UpdateProgramacionDto } from './dto/update-programacion.dto';
import { FirebaseUser } from '../../common/guards/firebase-auth.guard';
import { TransaccionDocument } from '../bancos/bancos.service';

export interface ProgramacionDocument {
  userId: string;
  carteraId: string;
  metaId: string;
  tipo: 'fijo' | 'porcentaje';
  monto?: number;
  porcentaje?: number;
  diaDelMes: number;
  activo: boolean;
  creadoEn: string;
}

@Injectable()
export class ProgramacionesService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly bancosService: BancosService,
  ) {}

  async createProgramacion(
    dto: CreateProgramacionDto,
    user: FirebaseUser,
  ) {
    if (dto.tipo === 'fijo' && !dto.monto) {
      throw new BadRequestException(
        'Debes proporcionar un monto para programación de tipo fijo',
      );
    }
    if (dto.tipo === 'porcentaje' && !dto.porcentaje) {
      throw new BadRequestException(
        'Debes proporcionar un porcentaje para programación de tipo porcentaje',
      );
    }

    const db = this.firebaseService.firestore;

    const carteraDoc = await db.collection('bancos').doc(dto.carteraId).get();
    if (!carteraDoc.exists) {
      throw new NotFoundException('Cartera no encontrada');
    }
    const carteraData = carteraDoc.data()!;
    if (carteraData['uid'] !== user.uid) {
      throw new ForbiddenException('No tienes acceso a esta cartera');
    }

    const metaDoc = await db.collection('metas').doc(dto.metaId).get();
    if (!metaDoc.exists) {
      throw new NotFoundException('Meta no encontrada');
    }
    const metaData = metaDoc.data()!;
    if (metaData['creadoPor'] !== user.uid) {
      const miembroSnap = await metaDoc.ref
        .collection('miembros')
        .where('uid', '==', user.uid)
        .limit(1)
        .get();
      if (miembroSnap.empty) {
        throw new ForbiddenException('No eres miembro de esta meta');
      }
    }

    const now = new Date().toISOString();
    const programacionData: ProgramacionDocument = {
      userId: user.uid,
      carteraId: dto.carteraId,
      metaId: dto.metaId,
      tipo: dto.tipo,
      monto: dto.monto,
      porcentaje: dto.porcentaje,
      diaDelMes: dto.diaDelMes,
      activo: dto.activo ?? true,
      creadoEn: now,
    };

    const docRef = await db.collection('programaciones').add(programacionData);
    return { id: docRef.id, ...programacionData };
  }

  async getUserProgramaciones(user: FirebaseUser) {
    const db = this.firebaseService.firestore;
    const snapshot = await db
      .collection('programaciones')
      .where('userId', '==', user.uid)
      .orderBy('creadoEn', 'asc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as ProgramacionDocument),
    }));
  }

  async updateProgramacion(
    id: string,
    dto: UpdateProgramacionDto,
    user: FirebaseUser,
  ) {
    const db = this.firebaseService.firestore;
    const docRef = db.collection('programaciones').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Programación no encontrada');
    }

    const data = doc.data() as ProgramacionDocument;
    if (data.userId !== user.uid) {
      throw new ForbiddenException('No tienes acceso a esta programación');
    }

    const updates: Record<string, unknown> = {};
    if (dto.tipo !== undefined) updates.tipo = dto.tipo;
    if (dto.monto !== undefined) updates.monto = dto.monto;
    if (dto.porcentaje !== undefined) updates.porcentaje = dto.porcentaje;
    if (dto.diaDelMes !== undefined) updates.diaDelMes = dto.diaDelMes;
    if (dto.activo !== undefined) updates.activo = dto.activo;

    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('No hay campos para actualizar');
    }

    await docRef.update(updates);
    return { id, ...updates };
  }

  async deleteProgramacion(id: string, user: FirebaseUser) {
    const db = this.firebaseService.firestore;
    const docRef = db.collection('programaciones').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Programación no encontrada');
    }

    const data = doc.data() as ProgramacionDocument;
    if (data.userId !== user.uid) {
      throw new ForbiddenException('No tienes acceso a esta programación');
    }

    await docRef.delete();
    return { message: 'Programación eliminada correctamente' };
  }

  async toggleProgramacion(
    id: string,
    user: FirebaseUser,
  ) {
    const db = this.firebaseService.firestore;
    const docRef = db.collection('programaciones').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Programación no encontrada');
    }

    const data = doc.data() as ProgramacionDocument;
    if (data.userId !== user.uid) {
      throw new ForbiddenException('No tienes acceso a esta programación');
    }

    const nuevoEstado = !data.activo;
    await docRef.update({ activo: nuevoEstado });
    return { id, activo: nuevoEstado };
  }

  async getProgramacionesActivasDelDia(dia: number) {
    const db = this.firebaseService.firestore;
    const snapshot = await db
      .collection('programaciones')
      .where('activo', '==', true)
      .where('diaDelMes', '==', dia)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as ProgramacionDocument),
    })) as Array<ProgramacionDocument & { id: string }>;
  }
}
