import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FirebaseService } from '../config/firebase/firebase.service';
import { ProgramacionesService, ProgramacionDocument } from '../modules/programaciones/programaciones.service';
import { BancosService, BancoDocument, TransaccionDocument } from '../modules/bancos/bancos.service';
import { GoalsService, GoalMember, ControlCuota } from '../modules/goals/goals.service';

@Injectable()
export class ProgramacionesScheduler {
  private readonly logger = new Logger(ProgramacionesScheduler.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly programacionesService: ProgramacionesService,
    private readonly bancosService: BancosService,
    private readonly goalsService: GoalsService,
  ) {}

  @Cron('5 0 * * *')
  async ejecutarProgramacionesDiarias() {
    const today = new Date();
    const dia = today.getDate();

    if (dia > 28) {
      this.logger.log(`Día ${dia} > 28, sin programaciones que ejecutar hoy`);
      return;
    }

    this.logger.log(`Ejecutando programaciones para el día ${dia}`);

    try {
      const programaciones =
        await this.programacionesService.getProgramacionesActivasDelDia(dia);

      this.logger.log(`Encontradas ${programaciones.length} programaciones activas`);

      for (const prog of programaciones) {
        try {
          await this.ejecutarProgramacion(prog as ProgramacionDocument & { id: string });
        } catch (err) {
          this.logger.error(
            `Error ejecutando programacion ${(prog as any).id} para usuario ${prog.userId}: ${err instanceof Error ? err.message : 'Error desconocido'}`,
          );
        }
      }

      this.logger.log('Ejecucion diaria de programaciones finalizada');
    } catch (err) {
      this.logger.error(
        `Error en la ejecucion diaria: ${err instanceof Error ? err.message : 'Error desconocido'}`,
      );
    }
  }

  private async ejecutarProgramacion(prog: ProgramacionDocument & { id: string }) {
    const db = this.firebaseService.firestore;

    const carteraDoc = await db.collection('bancos').doc(prog.carteraId).get();
    if (!carteraDoc.exists) {
      this.logger.warn(`Cartera ${prog.carteraId} no encontrada, saltando programacion ${prog.id}`);
      return;
    }

    const carteraData = carteraDoc.data() as BancoDocument;

    let montoATransferir: number;
    if (prog.tipo === 'fijo') {
      montoATransferir = prog.monto ?? 0;
    } else {
      const porcentaje = prog.porcentaje ?? 0;
      montoATransferir = Math.floor(carteraData.saldo * (porcentaje / 100));
    }

    if (montoATransferir <= 0) {
      this.logger.warn(
        `Monto a transferir es 0 o negativo para programacion ${prog.id} (tipo=${prog.tipo}, cartera=${carteraData.nombre}, saldo=${carteraData.saldo})`,
      );
      return;
    }

    if (carteraData.saldo < montoATransferir) {
      this.logger.warn(
        `Saldo insuficiente en cartera "${carteraData.nombre}" (${carteraData.saldo}) para transferir ${montoATransferir} a meta ${prog.metaId}`,
      );
      return;
    }

    const goalDoc = await db.collection('metas').doc(prog.metaId).get();
    if (!goalDoc.exists) {
      this.logger.warn(`Meta ${prog.metaId} no encontrada, saltando programacion ${prog.id}`);
      return;
    }

    const goalData = goalDoc.data()!;
    if (goalData['estado'] !== 'activo') {
      this.logger.warn(
        `Meta ${prog.metaId} no esta activa, saltando programacion ${prog.id}`,
      );
      return;
    }

    const miembrosSnapshot = await goalDoc.ref
      .collection('miembros')
      .where('uid', '==', prog.userId)
      .limit(1)
      .get();

    if (miembrosSnapshot.empty) {
      this.logger.warn(
        `Usuario ${prog.userId} no es miembro de la meta ${prog.metaId}, saltando programacion ${prog.id}`,
      );
      return;
    }

    const miembroDoc = miembrosSnapshot.docs[0];
    const miembroData = miembroDoc.data() as GoalMember;

    const now = new Date().toISOString();

    const nuevoSaldoCartera = carteraData.saldo - montoATransferir;
    const nuevoMontoAcumulado = goalData['montoAcumulado'] + montoATransferir;
    const nuevoSaldoMiembro = miembroData.saldoAportado + montoATransferir;

    await carteraDoc.ref.update({ saldo: nuevoSaldoCartera });

    await goalDoc.ref.update({ montoAcumulado: nuevoMontoAcumulado });

    await miembroDoc.ref.update({ saldoAportado: nuevoSaldoMiembro });

    await carteraDoc.ref.collection('transacciones').add({
      carteraId: prog.carteraId,
      userId: prog.userId,
      tipo: 'aporte_meta',
      monto: montoATransferir,
      metaId: prog.metaId,
      descripcion: `Aporte automatico a meta (programacion ${prog.id})`,
      fecha: now,
    } as TransaccionDocument);

    const cuotasSnapshot = await goalDoc.ref
      .collection('control_cuotas')
      .where('usuarioEmail', '==', miembroData.email)
      .where('estado', '==', 'PENDIENTE')
      .get();

    const cuotasOrdenadas = cuotasSnapshot.docs
      .map((cDoc) => ({ ref: cDoc.ref, data: cDoc.data() as ControlCuota }))
      .sort((a, b) => a.data.anio - b.data.anio || a.data.mes - b.data.mes);

    let remaining = montoATransferir;
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

    this.logger.log(
      `Transferencia automatica: $${montoATransferir} de cartera "${carteraData.nombre}" -> meta "${goalData['nombre']}" (programacion ${prog.id})`,
    );
  }
}
