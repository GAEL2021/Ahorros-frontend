import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from '../../config/firebase/firebase.service';
import { EmailService } from '../../common/email/email.service';
import { CreateBancoDto } from './dto/create-banco.dto';
import { UpdateBancoDto } from './dto/update-banco.dto';
import { DepositarDto } from './dto/depositar.dto';
import { RetirarDto } from './dto/retirar.dto';
import { FirebaseUser } from '../../common/guards/firebase-auth.guard';

export interface BancoDocument {
  uid: string;
  catalogoBancoId: string;
  nombre: string;
  color: string;
  saldo: number;
  descripcion: string;
  tipo: 'personal' | 'compartida';
  creadoPor: string;
  creadoEn: string;
  codigoCompartir: string;
}

export interface BancoMember {
  uid: string;
  email: string;
  saldoAportado: number;
  rol: 'creador' | 'invitado';
}

export interface TransaccionDocument {
  carteraId: string;
  userId: string;
  tipo: 'deposito' | 'retiro' | 'aporte_meta';
  monto: number;
  metaId?: string;
  descripcion: string;
  fecha: string;
}

function generarCodigoUnico(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

@Injectable()
export class BancosService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async createBanco(dto: CreateBancoDto, user: FirebaseUser) {
    const db = this.firebaseService.firestore;

    if (!user.email) {
      throw new BadRequestException(
        'El usuario autenticado no tiene email registrado',
      );
    }

    // Validate no duplicate: same user, same bank catalog
    const existing = await db
      .collection('bancos')
      .where('uid', '==', user.uid)
      .where('catalogoBancoId', '==', dto.catalogoBancoId)
      .limit(1)
      .get();

    if (!existing.empty) {
      const bancoData = existing.docs[0].data() as BancoDocument;
      throw new BadRequestException(
        `Ya tenés una cartera en "${bancoData.nombre}". No podés tener dos carteras del mismo banco.`,
      );
    }

    const catalogoDoc = await db
      .collection('catalogo_bancos')
      .doc(dto.catalogoBancoId)
      .get();

    if (!catalogoDoc.exists) {
      throw new NotFoundException('Banco no encontrado en el catálogo');
    }

    const catalogoData = catalogoDoc.data()!;
    const nombre = catalogoData['nombre'];
    const color = catalogoData['color'] ?? '#6b7280';
    const tipo = dto.tipo ?? 'personal';
    const now = new Date().toISOString();
    const codigoCompartir = generarCodigoUnico();

    const todosLosEmails =
      tipo === 'compartida'
        ? [user.email, ...(dto.invitadosEmails ?? [])]
        : [user.email];
    const emailsUnicos = [...new Set(todosLosEmails)];

    const bancoData: BancoDocument = {
      uid: user.uid,
      catalogoBancoId: dto.catalogoBancoId,
      nombre,
      color,
      saldo: dto.saldoInicial ?? 0,
      descripcion: dto.descripcion ?? '',
      tipo,
      creadoPor: user.uid,
      creadoEn: now,
      codigoCompartir,
    };

    const docRef = await db.collection('bancos').add(bancoData);
    const id = docRef.id;

    for (let i = 0; i < emailsUnicos.length; i++) {
      const email = emailsUnicos[i];
      const miembro: BancoMember = {
        uid: i === 0 ? user.uid : '',
        email,
        saldoAportado: 0,
        rol: i === 0 ? 'creador' : 'invitado',
      };
      await docRef.collection('miembros').doc(email).set(miembro);
    }

    if (bancoData.saldo > 0) {
      await docRef.collection('transacciones').add({
        carteraId: id,
        userId: user.uid,
        tipo: 'deposito',
        monto: bancoData.saldo,
        descripcion: 'Saldo inicial',
        fecha: now,
      } as TransaccionDocument);
    }

    if (tipo === 'compartida' && dto.invitadosEmails) {
      const appUrl = this.configService.get<string>('APP_URL') ?? 'http://localhost:5173';
      const inviterName = user.email?.split('@')[0] ?? 'Alguien';

      for (const invitedEmail of dto.invitadosEmails) {
        this.emailService
          .sendInviteToWallet(invitedEmail, inviterName, nombre, codigoCompartir, appUrl)
          .catch(() => {});
      }
    }

    return { id, ...bancoData };
  }

  async getUserBancos(user: FirebaseUser) {
    const db = this.firebaseService.firestore;

    const propiosSnapshot = await db
      .collection('bancos')
      .where('uid', '==', user.uid)
      .get();

    const bancos: Array<BancoDocument & { id: string }> = [];
    for (const doc of propiosSnapshot.docs) {
      const data = doc.data() as BancoDocument;
      bancos.push({ id: doc.id, ...data });
    }

    if (user.email) {
      const allBancos = await db.collection('bancos').get();
      for (const bancoDoc of allBancos.docs) {
        if (bancos.some((b) => b.id === bancoDoc.id)) continue;

        const miembrosSnapshot = await bancoDoc.ref
          .collection('miembros')
          .where('email', '==', user.email)
          .limit(1)
          .get();

        if (!miembrosSnapshot.empty) {
          const data = bancoDoc.data() as BancoDocument;
          bancos.push({ id: bancoDoc.id, ...data });
        }
      }
    }

    return bancos;
  }

  async getBancoById(bancoId: string, user: FirebaseUser) {
    const db = this.firebaseService.firestore;
    const doc = await db.collection('bancos').doc(bancoId).get();

    if (!doc.exists) return null;

    const data = doc.data() as BancoDocument;

    const miembroSnap = await doc.ref
      .collection('miembros')
      .where('uid', '==', user.uid)
      .limit(1)
      .get();

    if (miembroSnap.empty) {
      throw new ForbiddenException('No tienes acceso a esta cartera');
    }

    const [miembrosSnapshot, transaccionesSnapshot] = await Promise.all([
      doc.ref.collection('miembros').get(),
      doc.ref.collection('transacciones').orderBy('fecha', 'desc').limit(50).get(),
    ]);

    const miembros = miembrosSnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Array<BancoMember & { id: string }>;

    const transacciones = transaccionesSnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Array<TransaccionDocument & { id: string }>;

    return { id: doc.id, ...data, miembros, transacciones };
  }

  async updateBanco(bancoId: string, dto: UpdateBancoDto, user: FirebaseUser) {
    const db = this.firebaseService.firestore;
    const docRef = db.collection('bancos').doc(bancoId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Cartera no encontrada');
    }

    const data = doc.data() as BancoDocument;
    if (data.creadoPor !== user.uid) {
      throw new ForbiddenException('Solo el creador puede editar la cartera');
    }

    const updates: Record<string, string> = {};
    if (dto.descripcion !== undefined) updates.descripcion = dto.descripcion;

    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('No hay campos para actualizar');
    }

    await docRef.update(updates);
    return { id: bancoId, ...updates };
  }

  async deleteBanco(bancoId: string, user: FirebaseUser) {
    const db = this.firebaseService.firestore;
    const docRef = db.collection('bancos').doc(bancoId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Cartera no encontrada');
    }

    const data = doc.data() as BancoDocument;
    if (data.creadoPor !== user.uid) {
      throw new ForbiddenException('Solo el creador puede eliminar la cartera');
    }

    if (data.saldo > 0) {
      throw new BadRequestException(
        'No puedes eliminar una cartera con saldo positivo. Retira el dinero primero.',
      );
    }

    await this.deleteSubcollection(docRef.collection('miembros'));
    await this.deleteSubcollection(docRef.collection('transacciones'));
    await docRef.delete();

    return { message: 'Cartera eliminada correctamente' };
  }

  async deleteAllBancos() {
    const db = this.firebaseService.firestore;
    const snapshot = await db.collection('bancos').get();

    let deleted = 0;
    for (const doc of snapshot.docs) {
      await this.deleteSubcollection(doc.ref.collection('miembros'));
      await this.deleteSubcollection(doc.ref.collection('transacciones'));
      await doc.ref.delete();
      deleted++;
    }

    return { message: `${deleted} cartera(s) eliminada(s) en total` };
  }

  async joinBancoByCode(codigo: string, user: FirebaseUser) {
    const db = this.firebaseService.firestore;

    if (!user.email) {
      throw new BadRequestException(
        'El usuario autenticado no tiene email registrado',
      );
    }

    const bancosSnapshot = await db
      .collection('bancos')
      .where('codigoCompartir', '==', codigo)
      .limit(1)
      .get();

    if (bancosSnapshot.empty) {
      throw new NotFoundException('Cartera no encontrada con ese código');
    }

    const bancoDoc = bancosSnapshot.docs[0];
    const bancoData = bancoDoc.data() as BancoDocument;

    const miembroExistente = await bancoDoc.ref
      .collection('miembros')
      .doc(user.email)
      .get();

    if (miembroExistente.exists) {
      throw new BadRequestException('Ya eres miembro de esta cartera');
    }

    const nuevoMiembro: BancoMember = {
      uid: user.uid,
      email: user.email,
      saldoAportado: 0,
      rol: 'invitado',
    };

    await bancoDoc.ref.collection('miembros').doc(user.email).set(nuevoMiembro);

    const memberEmails = await this.getBancoMemberEmails(bancoDoc.ref);
    const newMemberName = user.email?.split('@')[0] ?? 'Alguien';
    this.emailService
      .notifyWalletMemberJoined(
        memberEmails.filter((e) => e !== user.email),
        user.email!,
        newMemberName,
        bancoData.nombre,
      )
      .catch(() => {});

    return {
      id: bancoDoc.id,
      nombre: bancoData.nombre,
    };
  }

  async depositar(bancoId: string, dto: DepositarDto, user: FirebaseUser) {
    const db = this.firebaseService.firestore;
    const docRef = db.collection('bancos').doc(bancoId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Cartera no encontrada');
    }

    const data = doc.data() as BancoDocument;

    await this.assertMember(docRef, user);

    const nuevoSaldo = data.saldo + dto.monto;
    const now = new Date().toISOString();

    await docRef.update({ saldo: nuevoSaldo });
    await docRef.collection('transacciones').add({
      carteraId: bancoId,
      userId: user.uid,
      tipo: 'deposito',
      monto: dto.monto,
      descripcion: dto.descripcion ?? 'Depósito',
      fecha: now,
    } as TransaccionDocument);

    if (user.email) {
      const miembroRef = docRef.collection('miembros').doc(user.email);
      const miembroDoc = await miembroRef.get();
      if (miembroDoc.exists) {
        const miembroData = miembroDoc.data() as BancoMember;
        await miembroRef.update({
          saldoAportado: miembroData.saldoAportado + dto.monto,
        });
      }
    }

    if (data.tipo === 'compartida') {
      const memberEmails = await this.getBancoMemberEmails(docRef);
      this.emailService
        .notifyWalletDeposit(
          memberEmails,
          user.email!,
          user.email?.split('@')[0] ?? 'Alguien',
          data.nombre,
          dto.monto,
          nuevoSaldo,
        )
        .catch(() => {});
    }

    return { saldoAnterior: data.saldo, nuevoSaldo, monto: dto.monto };
  }

  async retirar(bancoId: string, dto: RetirarDto, user: FirebaseUser) {
    const db = this.firebaseService.firestore;
    const docRef = db.collection('bancos').doc(bancoId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Cartera no encontrada');
    }

    const data = doc.data() as BancoDocument;

    await this.assertMember(docRef, user);

    if (data.saldo < dto.monto) {
      throw new BadRequestException('Saldo insuficiente');
    }

    const nuevoSaldo = data.saldo - dto.monto;
    const now = new Date().toISOString();

    await docRef.update({ saldo: nuevoSaldo });
    await docRef.collection('transacciones').add({
      carteraId: bancoId,
      userId: user.uid,
      tipo: 'retiro',
      monto: dto.monto,
      descripcion: dto.descripcion ?? 'Retiro',
      fecha: now,
    } as TransaccionDocument);

    if (data.tipo === 'compartida') {
      const memberEmails = await this.getBancoMemberEmails(docRef);
      this.emailService
        .notifyWalletWithdraw(
          memberEmails,
          user.email!,
          user.email?.split('@')[0] ?? 'Alguien',
          data.nombre,
          dto.monto,
          nuevoSaldo,
        )
        .catch(() => {});
    }

    return { saldoAnterior: data.saldo, nuevoSaldo, monto: dto.monto };
  }

  async aportarACartera(
    bancoId: string,
    monto: number,
    metaId: string,
    user: FirebaseUser,
  ) {
    const db = this.firebaseService.firestore;
    const docRef = db.collection('bancos').doc(bancoId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Cartera no encontrada');
    }

    const data = doc.data() as BancoDocument;

    await this.assertMember(docRef, user);

    const nuevoSaldo = data.saldo + monto;
    const now = new Date().toISOString();

    await docRef.update({ saldo: nuevoSaldo });
    await docRef.collection('transacciones').add({
      carteraId: bancoId,
      userId: user.uid,
      tipo: 'aporte_meta',
      monto,
      metaId,
      descripcion: `Aporte a meta ${metaId}`,
      fecha: now,
    } as TransaccionDocument);

    return { saldoAnterior: data.saldo, nuevoSaldo };
  }

  private async assertMember(
    docRef: FirebaseFirestore.DocumentReference,
    user: FirebaseUser,
  ) {
    const data = (await docRef.get()).data() as BancoDocument;
    if (data.tipo === 'compartida') {
      if (user.email) {
        const miembroDoc = await docRef
          .collection('miembros')
          .doc(user.email)
          .get();
        if (miembroDoc.exists) return;
      }
      throw new ForbiddenException('No eres miembro de esta cartera compartida');
    }
    if (data.uid !== user.uid) {
      throw new ForbiddenException('No tienes acceso a esta cartera');
    }
  }

  private async getBancoMemberEmails(docRef: FirebaseFirestore.DocumentReference): Promise<string[]> {
    const miembrosSnap = await docRef.collection('miembros').get();
    return miembrosSnap.docs.map((d) => (d.data() as BancoMember).email);
  }

  private async deleteSubcollection(
    collectionRef: FirebaseFirestore.CollectionReference,
  ) {
    const snapshot = await collectionRef.get();
    const batch = this.firebaseService.firestore.batch();
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}
