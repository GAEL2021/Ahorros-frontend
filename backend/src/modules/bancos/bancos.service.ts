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

  private async getMetasDistribucion(bancoRef: FirebaseFirestore.DocumentReference) {
    const transaccionesSnap = await bancoRef.collection('transacciones').where('tipo', '==', 'aporte_meta').get();
    const db = this.firebaseService.firestore;
    const distribucionMap: Record<string, { metaId: string; montoAsignado: number; nombreMeta: string }> = {};
    let totalAportado = 0;

    for (const doc of transaccionesSnap.docs) {
      const trans = doc.data() as TransaccionDocument;
      if (trans.metaId && trans.monto > 0) {
        totalAportado += trans.monto;
        if (!distribucionMap[trans.metaId]) {
          distribucionMap[trans.metaId] = {
            metaId: trans.metaId,
            montoAsignado: 0,
            nombreMeta: 'Cargando meta...'
          };
        }
        distribucionMap[trans.metaId].montoAsignado += trans.monto;
      }
    }

    const list = Object.values(distribucionMap);

    for (const item of list) {
      const metaDoc = await db.collection('metas').doc(item.metaId).get();
      if (metaDoc.exists) {
        item.nombreMeta = metaDoc.data()?.['nombre'] ?? 'Meta';
      } else {
        item.nombreMeta = 'Meta eliminada';
      }
    }

    return list.map(item => ({
      ...item,
      porcentaje: totalAportado > 0 ? Math.round((item.montoAsignado / totalAportado) * 100) : 0
    }));
  }

  async getUserBancos(user: FirebaseUser) {
    const db = this.firebaseService.firestore;

    const propiosSnapshot = await db
      .collection('bancos')
      .where('uid', '==', user.uid)
      .get();

    const bancos: Array<BancoDocument & { id: string; metasDistribucion?: any[] }> = [];
    for (const doc of propiosSnapshot.docs) {
      const data = doc.data() as BancoDocument;
      const metasDistribucion = await this.getMetasDistribucion(doc.ref);
      bancos.push({ id: doc.id, ...data, metasDistribucion });
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
          const metasDistribucion = await this.getMetasDistribucion(bancoDoc.ref);
          bancos.push({ id: bancoDoc.id, ...data, metasDistribucion });
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

    const [miembrosSnapshot, transaccionesSnapshot, metasDistribucion] = await Promise.all([
      doc.ref.collection('miembros').get(),
      doc.ref.collection('transacciones').orderBy('fecha', 'desc').limit(50).get(),
      this.getMetasDistribucion(doc.ref),
    ]);

    const miembros = miembrosSnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Array<BancoMember & { id: string }>;

    const rawTransacciones = transaccionesSnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Array<TransaccionDocument & { id: string }>;

    const uidToEmailMap: Record<string, string> = {};
    for (const m of miembros) {
      if (m.uid) {
        uidToEmailMap[m.uid] = m.email;
      }
    }

    const resolvedTransacciones = await this.resolveMetaNames(rawTransacciones);
    const transacciones = resolvedTransacciones.map((t) => {
      let usuarioEmail = uidToEmailMap[t.userId];
      if (!usuarioEmail) {
        const creadorMiembro = miembros.find((m) => m.rol === 'creador');
        usuarioEmail = creadorMiembro ? creadorMiembro.email : 'sistema@savesmart.com';
      }
      return {
        ...t,
        usuarioEmail,
        usuarioNombre: usuarioEmail.split('@')[0],
      };
    });

    return { id: doc.id, ...data, miembros, transacciones, metasDistribucion };
  }

  private async resolveMetaNames(transacciones: any[]): Promise<any[]> {
    const db = this.firebaseService.firestore;
    const metaCache: Record<string, string> = {};
    const result: any[] = [];

    for (const t of transacciones) {
      let descripcion = t.descripcion;
      let metaNombre = undefined;

      if (t.metaId) {
        if (!metaCache[t.metaId]) {
          const metaDoc = await db.collection('metas').doc(t.metaId).get();
          metaCache[t.metaId] = metaDoc.exists ? (metaDoc.data()?.['nombre'] ?? 'Meta') : 'Meta eliminada';
        }
        metaNombre = metaCache[t.metaId];
        if (t.tipo === 'aporte_meta') {
          descripcion = `Aporte a meta: ${metaNombre}`;
        }
      }
      result.push({
        ...t,
        descripcion,
        metaNombre,
      });
    }
    return result;
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

    if (data.saldo < monto) {
      throw new BadRequestException('Saldo insuficiente en la cartera');
    }

    const nuevoSaldo = data.saldo - monto;
    const now = new Date().toISOString();

    await docRef.update({ saldo: nuevoSaldo });
    const metaDoc = await db.collection('metas').doc(metaId).get();
    const metaNombre = metaDoc.exists ? (metaDoc.data()?.['nombre'] ?? 'Meta') : 'Meta';

    await docRef.collection('transacciones').add({
      carteraId: bancoId,
      userId: user.uid,
      tipo: 'aporte_meta',
      monto,
      metaId,
      descripcion: `Aporte a meta: ${metaNombre}`,
      fecha: now,
    } as TransaccionDocument);

    return { saldoAnterior: data.saldo, nuevoSaldo };
  }

  async getUserTransactions(user: FirebaseUser) {
    const db = this.firebaseService.firestore;
    const bancos = await this.getUserBancos(user);
    const rawTransacciones: any[] = [];

    for (const banco of bancos) {
      const bancoRef = db.collection('bancos').doc(banco.id);
      const [transSnap, miembrosSnap] = await Promise.all([
        bancoRef.collection('transacciones').get(),
        bancoRef.collection('miembros').get(),
      ]);

      const miembros = miembrosSnap.docs.map((d) => d.data() as BancoMember);
      const uidToEmailMap: Record<string, string> = {};
      for (const m of miembros) {
        if (m.uid) {
          uidToEmailMap[m.uid] = m.email;
        }
      }

      for (const doc of transSnap.docs) {
        const data = doc.data() as TransaccionDocument;
        let usuarioEmail = uidToEmailMap[data.userId];
        if (!usuarioEmail) {
          const creadorMiembro = miembros.find((m) => m.rol === 'creador');
          usuarioEmail = creadorMiembro ? creadorMiembro.email : 'sistema@savesmart.com';
        }

        rawTransacciones.push({
          id: doc.id,
          bancoNombre: banco.nombre,
          bancoColor: banco.color,
          usuarioEmail,
          usuarioNombre: usuarioEmail.split('@')[0],
          ...data,
        });
      }
    }

    const transacciones = await this.resolveMetaNames(rawTransacciones);

    return transacciones.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }

  async debitarChecklist(
    bancoId: string,
    monto: number,
    descripcion: string,
    user: FirebaseUser,
    metaId?: string,
  ) {
    const db = this.firebaseService.firestore;
    const docRef = db.collection('bancos').doc(bancoId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Cartera no encontrada');
    }

    const data = doc.data() as BancoDocument;

    await this.assertMember(docRef, user);

    if (data.saldo < monto) {
      throw new BadRequestException('Saldo insuficiente en la cartera para este gasto');
    }

    const nuevoSaldo = data.saldo - monto;
    const now = new Date().toISOString();

    await docRef.update({ saldo: nuevoSaldo });
    await docRef.collection('transacciones').add({
      carteraId: bancoId,
      userId: user.uid,
      tipo: 'retiro',
      monto,
      descripcion,
      fecha: now,
      esChecklist: true,
      metaId: metaId || null,
    } as any);

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
