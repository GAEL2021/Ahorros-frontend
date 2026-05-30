import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as firebaseAdmin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private firebaseApp!: firebaseAdmin.app.App;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.firebaseApp = firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert({
        projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
        clientEmail: this.configService.get<string>('FIREBASE_CLIENT_EMAIL'),
        privateKey: this.configService
          .get<string>('FIREBASE_PRIVATE_KEY')
          ?.replace(/\\n/g, '\n'),
      }),
      databaseURL: this.configService.get<string>('FIREBASE_DATABASE_URL'),
    });
  }

  get auth(): firebaseAdmin.auth.Auth {
    return firebaseAdmin.auth(this.firebaseApp);
  }

  get firestore(): firebaseAdmin.firestore.Firestore {
    return firebaseAdmin.firestore(this.firebaseApp);
  }
}
