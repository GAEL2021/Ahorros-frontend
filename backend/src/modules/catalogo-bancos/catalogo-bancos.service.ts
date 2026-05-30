import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseService } from '../../config/firebase/firebase.service';
import { CreateCatalogoBancoDto } from './dto/create-catalogo-banco.dto';
import { UpdateCatalogoBancoDto } from './dto/update-catalogo-banco.dto';

export interface CatalogoBancoDocument {
  nombre: string;
  color: string;
  icono: string;
  creadoEn: string;
}

@Injectable()
export class CatalogoBancosService {
  constructor(private readonly firebaseService: FirebaseService) {}

  async getAll() {
    const db = this.firebaseService.firestore;
    const snapshot = await db
      .collection('catalogo_bancos')
      .orderBy('nombre', 'asc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as CatalogoBancoDocument),
    }));
  }

  async getPublicos() {
    const db = this.firebaseService.firestore;
    const snapshot = await db
      .collection('catalogo_bancos')
      .orderBy('nombre', 'asc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      nombre: (doc.data() as CatalogoBancoDocument).nombre,
    }));
  }

  async create(dto: CreateCatalogoBancoDto) {
    const db = this.firebaseService.firestore;

    const existente = await db
      .collection('catalogo_bancos')
      .where('nombre', '==', dto.nombre.trim())
      .limit(1)
      .get();

    if (!existente.empty) {
      throw new BadRequestException('Ya existe un banco con ese nombre');
    }

    const data: CatalogoBancoDocument = {
      nombre: dto.nombre.trim(),
      color: dto.color ?? '#6b7280',
      icono: dto.icono ?? '',
      creadoEn: new Date().toISOString(),
    };

    const docRef = await db.collection('catalogo_bancos').add(data);
    return { id: docRef.id, ...data };
  }

  async update(id: string, dto: UpdateCatalogoBancoDto) {
    const db = this.firebaseService.firestore;
    const docRef = db.collection('catalogo_bancos').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Banco no encontrado en el catálogo');
    }

    const updates: Record<string, string> = {};
    if (dto.nombre !== undefined) updates.nombre = dto.nombre.trim();
    if (dto.color !== undefined) updates.color = dto.color;
    if (dto.icono !== undefined) updates.icono = dto.icono;

    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('No hay campos para actualizar');
    }

    await docRef.update(updates);
    return { id, ...updates };
  }

  async delete(id: string) {
    const db = this.firebaseService.firestore;
    const docRef = db.collection('catalogo_bancos').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Banco no encontrado en el catálogo');
    }

    await docRef.delete();
    return { message: 'Banco eliminado del catálogo' };
  }
}
