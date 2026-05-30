import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { FirebaseService } from '../../config/firebase/firebase.service';
import { FirebaseUser } from './firebase-auth.guard';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly firebaseService: FirebaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as FirebaseUser | undefined;

    if (!user?.uid) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    const db = this.firebaseService.firestore;
    const adminDoc = await db.collection('config').doc('admins').get();

    if (!adminDoc.exists) {
      throw new ForbiddenException('No hay administradores configurados');
    }

    const { uids } = adminDoc.data() as { uids: string[] };

    if (!uids?.includes(user.uid)) {
      throw new ForbiddenException('No tienes permisos de administrador');
    }

    return true;
  }
}
