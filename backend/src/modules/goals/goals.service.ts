import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from '../../config/firebase/firebase.service';
import { BancosService } from '../bancos/bancos.service';
import { ProgramacionesService } from '../programaciones/programaciones.service';
import { EmailService } from '../../common/email/email.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { ContribuirDto } from './dto/contribuir.dto';
import { FirebaseUser } from '../../common/guards/firebase-auth.guard';

export interface GoalMember {
  uid: string;
  email: string;
  cuotaMensual: number;
  saldoAportado: number;
  rol: 'creador' | 'invitado';
}

export interface GoalDocument {
  nombre: string;
  montoObjetivo: number;
  fechaLimite: string;
  montoAcumulado: number;
  mesesRestantes: number;
  estado: 'activo' | 'completado' | 'cancelado';
  creadoPor: string;
  creadoEn: string;
  codigoCompartir: string;
}

export interface ControlCuota {
  usuarioEmail: string;
  anio: number;
  mes: number;
  cuotaEsperada: number;
  fechaInicio: string;
  fechaFin: string;
  estado: 'PENDIENTE' | 'PAGADO' | 'PARCIAL';
}

export interface Hito {
  porcentaje: number;
  montoObjetivo: number;
  fechaLimiteEsperada: string;
  mesesAsignados: number;
  estado: 'PENDIENTE' | 'ALCANZADO';
}

export interface ChecklistItem {
  texto: string;
  monto: number;
  completado: boolean;
  orden: number;
  creadoEn: string;
}

const HITO_PORCENTAJES = [25, 50, 75, 100] as const;

@Injectable()
export class GoalsService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly bancosService: BancosService,
    private readonly programacionesService: ProgramacionesService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async createGoal(
    dto: CreateGoalDto,
    user: FirebaseUser,
  ): Promise<{ id: string; meta: GoalDocument }> {
    const db = this.firebaseService.firestore;

    if (!user.email) {
      throw new BadRequestException(
        'El usuario autenticado no tiene email registrado',
      );
    }

    const fechaLimite = new Date(dto.fechaLimite);
    const ahora = new Date();

    if (fechaLimite <= ahora) {
      throw new BadRequestException('La fecha límite debe ser futura');
    }

    const todosLosEmails = [user.email, ...(dto.invitadosEmails ?? [])];
    const emailsUnicos = [...new Set(todosLosEmails)];
    const totalParticipantes = emailsUnicos.length;

    const mesesRestantes = this.calcularMeses(ahora, fechaLimite);
    const cuotaPorMiembro = Math.ceil(
      dto.montoObjetivo / totalParticipantes / mesesRestantes,
    );

    const goalId = db.collection('metas').doc().id;
    const codigoCompartir = this.generarCodigoUnico();

    try {
      const result = await db.runTransaction(async (transaction) => {
        const miembros: GoalMember[] = emailsUnicos.map((email, index) => ({
          uid: index === 0 ? user.uid : '',
          email,
          cuotaMensual: cuotaPorMiembro,
          saldoAportado: 0,
          rol: index === 0 ? 'creador' : 'invitado',
        }));

        const goalRef = db.collection('metas').doc(goalId);
        const goalData: GoalDocument = {
          nombre: dto.nombre,
          montoObjetivo: dto.montoObjetivo,
          fechaLimite: dto.fechaLimite,
          montoAcumulado: 0,
          mesesRestantes,
          estado: 'activo',
          creadoPor: user.uid,
          creadoEn: ahora.toISOString(),
          codigoCompartir,
        };

        transaction.set(goalRef, goalData);

        const miembrosCollection = goalRef.collection('miembros');
        miembros.forEach((m) => {
          transaction.set(miembrosCollection.doc(m.email), m);
        });

        const cuotasCollection = goalRef.collection('control_cuotas');
        for (const miembro of miembros) {
          for (let i = 0; i < mesesRestantes; i++) {
            const inicioMes = new Date(
              ahora.getFullYear(),
              ahora.getMonth() + i,
              1,
            );
            const finMes = new Date(
              ahora.getFullYear(),
              ahora.getMonth() + i + 1,
              0,
            );

            const docId = `${miembro.email}_${inicioMes.getFullYear()}_${inicioMes.getMonth() + 1}`;
            const cuota: ControlCuota = {
              usuarioEmail: miembro.email,
              anio: inicioMes.getFullYear(),
              mes: inicioMes.getMonth() + 1,
              cuotaEsperada: cuotaPorMiembro,
              fechaInicio: inicioMes.toISOString(),
              fechaFin: finMes.toISOString(),
              estado: 'PENDIENTE',
            };

            transaction.set(cuotasCollection.doc(docId), cuota);
          }
        }

        const hitosCollection = goalRef.collection('hitos');
        for (const porcentaje of HITO_PORCENTAJES) {
          const mesesAsignados = Math.max(
            1,
            Math.ceil(mesesRestantes * (porcentaje / 100)),
          );
          const fechaHito = new Date(
            ahora.getFullYear(),
            ahora.getMonth() + mesesAsignados,
            0,
          );
          const montoHito = Math.ceil(
            dto.montoObjetivo * (porcentaje / 100),
          );

          const hito: Hito = {
            porcentaje,
            montoObjetivo: montoHito,
            fechaLimiteEsperada: fechaHito.toISOString(),
            mesesAsignados,
            estado: 'PENDIENTE',
          };

          transaction.set(hitosCollection.doc(`hito_${porcentaje}`), hito);
        }

        return { id: goalId, meta: goalData };
      });

      if (dto.modoAporte === 'automatico' && dto.carteraId) {
        await this.programacionesService.createProgramacion(
          {
            carteraId: dto.carteraId,
            metaId: goalId,
            tipo: dto.programacionTipo ?? 'fijo',
            monto: dto.programacionMonto,
            porcentaje: dto.programacionPorcentaje,
            diaDelMes: dto.programacionDia ?? 1,
            activo: true,
          },
          user,
        );
      }

      if (dto.invitadosEmails && dto.invitadosEmails.length > 0) {
        const appUrl = this.configService.get<string>('APP_URL') ?? 'http://localhost:5173';
        const inviterName = user.email?.split('@')[0] ?? 'Alguien';

        for (const invitedEmail of dto.invitadosEmails) {
          this.emailService
            .sendInviteToGoal(invitedEmail, inviterName, dto.nombre, codigoCompartir, appUrl)
            .catch(() => {});
        }
      }

      return result;
    } catch (error) {
      throw new BadRequestException(
        `Error al crear la meta: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }

  async getUserGoals(user: FirebaseUser) {
    const db = this.firebaseService.firestore;

    const creadosSnapshot = await db
      .collection('metas')
      .where('creadoPor', '==', user.uid)
      .get();

    const goals: Array<GoalDocument & { id: string }> = [];

    for (const doc of creadosSnapshot.docs) {
      const data = doc.data() as GoalDocument;
      goals.push({ id: doc.id, ...data });
    }

    // Also find goals where user is an invited member (by email)
    if (user.email) {
      const allMetas = await db.collection('metas').get();
      for (const metaDoc of allMetas.docs) {
        if (goals.some((g) => g.id === metaDoc.id)) continue;

        const miembrosSnapshot = await metaDoc.ref
          .collection('miembros')
          .where('email', '==', user.email)
          .limit(1)
          .get();

        if (!miembrosSnapshot.empty) {
          const data = metaDoc.data() as GoalDocument;
          goals.push({ id: metaDoc.id, ...data });
        }
      }
    }

    return goals;
  }

  async getGoalById(goalId: string) {
    const db = this.firebaseService.firestore;
    const goalDoc = await db.collection('metas').doc(goalId).get();

    if (!goalDoc.exists) return null;

    const goalData = goalDoc.data() as GoalDocument;

    const [miembrosSnapshot, cuotasSnapshot, hitosSnapshot, checklistSnapshot] =
      await Promise.all([
        goalDoc.ref.collection('miembros').get(),
        goalDoc.ref.collection('control_cuotas').get(),
        goalDoc.ref.collection('hitos').get(),
        goalDoc.ref.collection('checklist').orderBy('orden', 'asc').get(),
      ]);

    return {
      id: goalDoc.id,
      ...goalData,
      miembros: miembrosSnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Array<GoalMember & { id: string }>,
      controlCuotas: cuotasSnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Array<ControlCuota & { id: string }>,
      hitos: hitosSnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Array<Hito & { id: string }>,
      checklist: checklistSnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Array<ChecklistItem & { id: string }>,
    };
  }

  async getGoalControlCuotas(goalId: string) {
    const db = this.firebaseService.firestore;
    const goalDoc = await db.collection('metas').doc(goalId).get();

    if (!goalDoc.exists) return null;

    const cuotasSnapshot = await goalDoc.ref
      .collection('control_cuotas')
      .get();

    return cuotasSnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Array<ControlCuota & { id: string }>;
  }

  async joinGoalByCode(codigo: string, user: FirebaseUser) {
    const db = this.firebaseService.firestore;

    if (!user.email) {
      throw new BadRequestException(
        'El usuario autenticado no tiene email registrado',
      );
    }

    const metasSnapshot = await db
      .collection('metas')
      .where('codigoCompartir', '==', codigo)
      .limit(1)
      .get();

    if (metasSnapshot.empty) {
      throw new NotFoundException(
        'Código inválido. No se encontró ninguna meta con ese código.',
      );
    }

    const goalDoc = metasSnapshot.docs[0];
    const goalData = goalDoc.data() as GoalDocument;

    // Check if already a member
    const miembroExistente = await goalDoc.ref
      .collection('miembros')
      .doc(user.email)
      .get();

    if (miembroExistente.exists) {
      throw new BadRequestException('Ya eres miembro de esta meta.');
    }

    const ahora = new Date();
    const cuotaPorMiembro = Math.ceil(
      goalData.montoObjetivo /
        (1 + (await goalDoc.ref.collection('miembros').get()).size) /
        goalData.mesesRestantes,
    );

    const nuevoMiembro: GoalMember = {
      uid: user.uid,
      email: user.email,
      cuotaMensual: cuotaPorMiembro,
      saldoAportado: 0,
      rol: 'invitado',
    };

    await goalDoc.ref.collection('miembros').doc(user.email).set(nuevoMiembro);

    // Create control_cuotas for remaining months
    const cuotasBatch = db.batch();
    for (let i = 0; i < goalData.mesesRestantes; i++) {
      const inicioMes = new Date(
        ahora.getFullYear(),
        ahora.getMonth() + i,
        1,
      );
      const finMes = new Date(
        ahora.getFullYear(),
        ahora.getMonth() + i + 1,
        0,
      );

      const docId = `${user.email}_${inicioMes.getFullYear()}_${inicioMes.getMonth() + 1}`;
      const cuota: ControlCuota = {
        usuarioEmail: user.email,
        anio: inicioMes.getFullYear(),
        mes: inicioMes.getMonth() + 1,
        cuotaEsperada: cuotaPorMiembro,
        fechaInicio: inicioMes.toISOString(),
        fechaFin: finMes.toISOString(),
        estado: 'PENDIENTE',
      };

      cuotasBatch.set(
        goalDoc.ref.collection('control_cuotas').doc(docId),
        cuota,
      );
    }

    await cuotasBatch.commit();

    const memberEmails = await this.getGoalMemberEmails(goalDoc.ref);
    const newMemberName = user.email?.split('@')[0] ?? 'Alguien';
    this.emailService
      .notifyGoalMemberJoined(
        memberEmails.filter((e) => e !== user.email),
        user.email!,
        newMemberName,
        goalData.nombre,
      )
      .catch(() => {});

    return {
      id: goalDoc.id,
      nombre: goalData.nombre,
      montoObjetivo: goalData.montoObjetivo,
    };
  }

  async deleteGoal(goalId: string, user: FirebaseUser) {
    const db = this.firebaseService.firestore;
    const goalRef = db.collection('metas').doc(goalId);
    const goalDoc = await goalRef.get();

    if (!goalDoc.exists) {
      throw new NotFoundException('Meta no encontrada');
    }

    const goalData = goalDoc.data() as GoalDocument;

    if (goalData.creadoPor !== user.uid) {
      throw new ForbiddenException('Solo el creador puede eliminar la meta');
    }

    // Delete all subcollections
    await this.deleteSubcollection(goalRef.collection('miembros'));
    await this.deleteSubcollection(goalRef.collection('control_cuotas'));
    await this.deleteSubcollection(goalRef.collection('hitos'));
    await this.deleteSubcollection(goalRef.collection('checklist'));

    await goalRef.delete();

    return { message: 'Meta eliminada correctamente' };
  }

  async updateGoal(goalId: string, dto: UpdateGoalDto, user: FirebaseUser) {
    const db = this.firebaseService.firestore;
    const goalRef = db.collection('metas').doc(goalId);
    const goalDoc = await goalRef.get();

    if (!goalDoc.exists) {
      throw new NotFoundException('Meta no encontrada');
    }

    const goalData = goalDoc.data() as GoalDocument;

    if (goalData.creadoPor !== user.uid) {
      throw new ForbiddenException('Solo el creador puede editar la meta');
    }

    const updates: Partial<GoalDocument> = {};

    if (dto.nombre !== undefined) updates.nombre = dto.nombre;
    if (dto.montoObjetivo !== undefined) updates.montoObjetivo = dto.montoObjetivo;
    if (dto.fechaLimite !== undefined) updates.fechaLimite = dto.fechaLimite;

    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('No hay campos para actualizar');
    }

    await goalRef.update(updates);

    const cambios: string[] = [];
    if (dto.nombre !== undefined) cambios.push(`Nombre cambiado a "${dto.nombre}"`);
    if (dto.montoObjetivo !== undefined) cambios.push(`Monto objetivo: $${dto.montoObjetivo.toLocaleString()}`);
    if (dto.fechaLimite !== undefined) cambios.push(`Fecha límite: ${dto.fechaLimite}`);

    if (cambios.length > 0) {
      const memberEmails = await this.getGoalMemberEmails(goalRef);
      this.emailService
        .notifyGoalUpdated(
          memberEmails,
          user.email!,
          user.email?.split('@')[0] ?? 'Alguien',
          goalData.nombre,
          cambios,
        )
        .catch(() => {});
    }

    return { id: goalId, ...updates };
  }

  async contributeToGoal(
    goalId: string,
    dto: ContribuirDto,
    user: FirebaseUser,
  ) {
    const db = this.firebaseService.firestore;

    if (!user.email) {
      throw new BadRequestException(
        'El usuario autenticado no tiene email registrado',
      );
    }

    const goalRef = db.collection('metas').doc(goalId);
    const goalDoc = await goalRef.get();

    if (!goalDoc.exists) {
      throw new NotFoundException('Meta no encontrada');
    }

    const goalData = goalDoc.data() as GoalDocument;

    if (goalData.estado !== 'activo') {
      throw new BadRequestException('Solo se puede aportar a metas activas');
    }

    const miembroRef = goalRef.collection('miembros').doc(user.email);
    const miembroDoc = await miembroRef.get();

    if (!miembroDoc.exists) {
      throw new BadRequestException('No eres miembro de esta meta');
    }

    const miembroData = miembroDoc.data() as GoalMember;

    if (dto.carteraId) {
      await this.bancosService.deducirDeCartera(
        dto.carteraId,
        dto.monto,
        goalId,
        user,
      );
    }

    const nuevoSaldo = miembroData.saldoAportado + dto.monto;
    const nuevoAcumulado = goalData.montoAcumulado + dto.monto;

    await goalRef.update({ montoAcumulado: nuevoAcumulado });
    await miembroRef.update({ saldoAportado: nuevoSaldo });

    // Mark control_cuotas as PAGADO/PARCIAL for this member
    const cuotasSnapshot = await goalRef
      .collection('control_cuotas')
      .where('usuarioEmail', '==', user.email)
      .where('estado', '==', 'PENDIENTE')
      .get();

    // Sort in memory to avoid Firestore composite index requirement
    const cuotasOrdenadas = cuotasSnapshot.docs
      .map((doc) => ({ ref: doc.ref, data: doc.data() as ControlCuota }))
      .sort((a, b) => a.data.anio - b.data.anio || a.data.mes - b.data.mes);

    let remaining = dto.monto;
    const batch = db.batch();

    for (const cuota of cuotasOrdenadas) {
      if (remaining <= 0) break;

      if (remaining >= cuota.data.cuotaEsperada) {
        batch.update(cuota.ref, { estado: 'PAGADO' });
        remaining -= cuota.data.cuotaEsperada;
      } else {
        batch.update(cuota.ref, { estado: 'PARCIAL' });
        remaining = 0;
      }
    }

    if (cuotasOrdenadas.length > 0) {
      await batch.commit();
    }

    // Also update any previously PARCIAL cuotas if remaining covers them
    if (remaining > 0) {
      const parcialSnapshot = await goalRef
        .collection('control_cuotas')
        .where('usuarioEmail', '==', user.email)
        .where('estado', '==', 'PARCIAL')
        .get();

      const parcialesOrdenadas = parcialSnapshot.docs
        .map((doc) => ({ ref: doc.ref, data: doc.data() as ControlCuota }))
        .sort((a, b) => a.data.anio - b.data.anio || a.data.mes - b.data.mes);

      const batch2 = db.batch();
      for (const cuota of parcialesOrdenadas) {
        if (remaining <= 0) break;
        batch2.update(cuota.ref, { estado: 'PAGADO' });
        remaining -= cuota.data.cuotaEsperada;
      }
      if (parcialesOrdenadas.length > 0) {
        await batch2.commit();
      }
    }

    const memberEmails = await this.getGoalMemberEmails(goalRef);
    this.emailService
      .notifyGoalContribution(
        memberEmails,
        user.email!,
        user.email?.split('@')[0] ?? 'Alguien',
        goalData.nombre,
        dto.monto,
        nuevoAcumulado,
        goalData.montoObjetivo,
      )
      .catch(() => {});

    return {
      nuevoSaldoAportado: nuevoSaldo,
      nuevoMontoAcumulado: nuevoAcumulado,
      metaMontoObjetivo: goalData.montoObjetivo,
    };
  }

  async getGoalChecklist(goalId: string) {
    const db = this.firebaseService.firestore;
    const goalRef = db.collection('metas').doc(goalId);
    const goalDoc = await goalRef.get();

    if (!goalDoc.exists) return null;

    const snapshot = await goalRef
      .collection('checklist')
      .orderBy('orden', 'asc')
      .get();

    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Array<ChecklistItem & { id: string }>;
  }

  async addChecklistItem(goalId: string, texto: string, monto: number, user: FirebaseUser) {
    const db = this.firebaseService.firestore;
    const goalRef = db.collection('metas').doc(goalId);
    const goalDoc = await goalRef.get();

    if (!goalDoc.exists) {
      throw new NotFoundException('Meta no encontrada');
    }

    const goalData = goalDoc.data() as GoalDocument;

    const checklistRef = goalRef.collection('checklist');
    const existing = await checklistRef.get();
    const existingTotal = existing.docs.reduce((sum, d) => {
      const item = d.data() as ChecklistItem;
      return sum + (item.monto ?? 0);
    }, 0);

    if (existingTotal + monto > goalData.montoObjetivo) {
      throw new BadRequestException(
        `El total de los ítems ($${(existingTotal + monto).toLocaleString()}) supera el monto objetivo de la meta ($${goalData.montoObjetivo.toLocaleString()})`,
      );
    }

    const snapshot = await checklistRef.orderBy('orden', 'desc').limit(1).get();
    const nextOrden = snapshot.empty ? 0 : (snapshot.docs[0].data() as ChecklistItem).orden + 1;

    const item: ChecklistItem = {
      texto,
      monto,
      completado: false,
      orden: nextOrden,
      creadoEn: new Date().toISOString(),
    };

    const docRef = await checklistRef.add(item);
    return { id: docRef.id, ...item };
  }

  async toggleChecklistItem(goalId: string, itemId: string) {
    const db = this.firebaseService.firestore;
    const itemRef = db
      .collection('metas')
      .doc(goalId)
      .collection('checklist')
      .doc(itemId);

    const itemDoc = await itemRef.get();
    if (!itemDoc.exists) {
      throw new NotFoundException('Ítem no encontrado');
    }

    const data = itemDoc.data() as ChecklistItem;
    await itemRef.update({ completado: !data.completado });
    return { id: itemId, completado: !data.completado };
  }

  async updateChecklistItem(goalId: string, itemId: string, dto: { texto?: string; completado?: boolean; montoReal?: number }) {
    const db = this.firebaseService.firestore;
    const itemRef = db
      .collection('metas')
      .doc(goalId)
      .collection('checklist')
      .doc(itemId);

    const itemDoc = await itemRef.get();
    if (!itemDoc.exists) {
      throw new NotFoundException('Ítem no encontrado');
    }

    const updates: Record<string, unknown> = {};
    if (dto.texto !== undefined) updates.texto = dto.texto;
    if (dto.completado !== undefined) updates.completado = dto.completado;
    if (dto.montoReal !== undefined) updates.montoReal = dto.montoReal;

    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('No hay campos para actualizar');
    }

    await itemRef.update(updates);
    return { id: itemId, ...updates };
  }

  async deleteChecklistItem(goalId: string, itemId: string) {
    const db = this.firebaseService.firestore;
    const itemRef = db
      .collection('metas')
      .doc(goalId)
      .collection('checklist')
      .doc(itemId);

    const itemDoc = await itemRef.get();
    if (!itemDoc.exists) {
      throw new NotFoundException('Ítem no encontrado');
    }

    await itemRef.delete();
    return { message: 'Ítem eliminado correctamente' };
  }

  private async getGoalMemberEmails(goalRef: FirebaseFirestore.DocumentReference): Promise<string[]> {
    const miembrosSnap = await goalRef.collection('miembros').get();
    return miembrosSnap.docs.map((d) => (d.data() as GoalMember).email);
  }

  private async deleteSubcollection(
    collectionRef: FirebaseFirestore.CollectionReference,
  ) {
    const snapshot = await collectionRef.get();
    const batch = this.firebaseService.firestore.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  private generarCodigoUnico(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private calcularMeses(desde: Date, hasta: Date): number {
    const diffAnios = hasta.getFullYear() - desde.getFullYear();
    const diffMeses = hasta.getMonth() - desde.getMonth();
    const total = diffAnios * 12 + diffMeses;
    return Math.max(1, total);
  }
}
