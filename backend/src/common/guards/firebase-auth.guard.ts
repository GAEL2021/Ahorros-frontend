import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { FirebaseService } from '../../config/firebase/firebase.service';

export interface FirebaseUser {
  uid: string;
  email?: string;
  email_verified?: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user: FirebaseUser;
    }
  }
}

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private readonly firebaseService: FirebaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token JWT no proporcionado');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decodedToken = await this.firebaseService.auth.verifyIdToken(token);

      request.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        email_verified: decodedToken.email_verified,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Token JWT inválido o expirado');
    }
  }
}
