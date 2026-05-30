import { Injectable, ForbiddenException } from '@nestjs/common';
import { FirebaseService } from '../../config/firebase/firebase.service';
import { FirebaseUser } from '../../common/guards/firebase-auth.guard';

@Injectable()
export class AdminService {
  constructor(private readonly firebaseService: FirebaseService) {}

  async verificarAdmin(user: FirebaseUser) {
    const db = this.firebaseService.firestore;
    const adminDoc = await db.collection('config').doc('admins').get();

    if (!adminDoc.exists) {
      return { esAdmin: false };
    }

    const { uids } = adminDoc.data() as { uids: string[] };
    return { esAdmin: uids?.includes(user.uid) ?? false };
  }

  async getAdmins(user: FirebaseUser) {
    await this.assertAdmin(user);

    const db = this.firebaseService.firestore;
    const adminDoc = await db.collection('config').doc('admins').get();

    if (!adminDoc.exists) {
      return { uids: [] };
    }

    return adminDoc.data() as { uids: string[] };
  }

  async updateAdmins(uids: string[], user: FirebaseUser) {
    await this.assertAdmin(user);

    const db = this.firebaseService.firestore;
    const uniqueUids = [...new Set(uids)];

    await db
      .collection('config')
      .doc('admins')
      .set({
        uids: uniqueUids,
        actualizadoPor: user.uid,
        actualizadoEn: new Date().toISOString(),
      });

    return { uids: uniqueUids };
  }

  private async assertAdmin(user: FirebaseUser) {
    if (!user?.uid) {
      throw new ForbiddenException('No autenticado');
    }

    const db = this.firebaseService.firestore;
    const adminDoc = await db.collection('config').doc('admins').get();

    const uids: string[] = adminDoc.exists
      ? (adminDoc.data() as { uids: string[] }).uids ?? []
      : [];

    if (!uids.includes(user.uid)) {
      throw new ForbiddenException('No tienes permisos de administrador');
    }
  }
}
