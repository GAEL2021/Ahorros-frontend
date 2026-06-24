import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { FirebaseService } from '../../config/firebase/firebase.service';
import { CreateTarjetaCreditoDto } from './dto/create-tarjeta-credito.dto';
import { UpdateTarjetaCreditoDto } from './dto/update-tarjeta-credito.dto';
import { PagarTarjetaDto } from './dto/pagar-tarjeta.dto';
import { SimularPagoDto } from './dto/simular-pago.dto';
import { FirebaseUser } from '../../common/guards/firebase-auth.guard';

export interface TarjetaCreditoDocument {
  nombre: string;
  bancoEmisor: string;
  limiteCredito: number;
  fechaCorte: number;
  fechaPago: number;
  saldoUtilizado: number;
  userId: string;
  activa: boolean;
  creadoEn: string;
}

export interface CompraTarjetaDocument {
  tarjetaId: string;
  descripcion: string;
  monto: number;
  fecha: string;
  gastoId?: string;
  checklistItemId?: string;
  metaId?: string;
  cicloFechaCorte: string;
  creadoEn: string;
}

export interface PagoTarjetaDocument {
  tarjetaId: string;
  monto: number;
  fecha: string;
  carteraId: string;
  carteraNombre: string;
  creadoEn: string;
}

@Injectable()
export class TarjetasCreditoService {
  constructor(private readonly firebaseService: FirebaseService) {}

  private getTarjetasCol() {
    return this.firebaseService.firestore.collection('tarjetas-credito');
  }

  private getComprasCol(tarjetaId: string) {
    return this.getTarjetasCol().doc(tarjetaId).collection('compras');
  }

  private getPagosCol(tarjetaId: string) {
    return this.getTarjetasCol().doc(tarjetaId).collection('pagos');
  }

  async create(dto: CreateTarjetaCreditoDto, user: FirebaseUser) {
    const doc: TarjetaCreditoDocument = {
      nombre: dto.nombre,
      bancoEmisor: dto.bancoEmisor,
      limiteCredito: dto.limiteCredito,
      fechaCorte: dto.fechaCorte,
      fechaPago: dto.fechaPago,
      saldoUtilizado: 0,
      userId: user.uid,
      activa: true,
      creadoEn: new Date().toISOString(),
    };
    const ref = await this.getTarjetasCol().add(doc);
    return { id: ref.id, ...doc };
  }

  async findAll(user: FirebaseUser) {
    const snapshot = await this.getTarjetasCol()
      .where('userId', '==', user.uid)
      .get();
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async findOne(id: string, user: FirebaseUser) {
    const doc = await this.getTarjetasCol().doc(id).get();
    if (!doc.exists) throw new NotFoundException('Tarjeta no encontrada');
    const data = doc.data() as TarjetaCreditoDocument;
    if (data.userId !== user.uid) throw new NotFoundException('Tarjeta no encontrada');
    const comprasSnap = await this.getComprasCol(id).orderBy('fecha', 'desc').limit(50).get();
    const compras = comprasSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const pagosSnap = await this.getPagosCol(id).orderBy('fecha', 'desc').limit(50).get();
    const pagos = pagosSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return { id: doc.id, ...data, compras, pagos };
  }

  async update(id: string, dto: UpdateTarjetaCreditoDto, user: FirebaseUser) {
    const doc = await this.getTarjetasCol().doc(id).get();
    if (!doc.exists) throw new NotFoundException('Tarjeta no encontrada');
    const data = doc.data() as TarjetaCreditoDocument;
    if (data.userId !== user.uid) throw new NotFoundException('Tarjeta no encontrada');
    const updateData: Record<string, unknown> = {};
    if (dto.nombre !== undefined) updateData.nombre = dto.nombre;
    if (dto.bancoEmisor !== undefined) updateData.bancoEmisor = dto.bancoEmisor;
    if (dto.limiteCredito !== undefined) updateData.limiteCredito = dto.limiteCredito;
    if (dto.fechaCorte !== undefined) updateData.fechaCorte = dto.fechaCorte;
    if (dto.fechaPago !== undefined) updateData.fechaPago = dto.fechaPago;
    if (Object.keys(updateData).length > 0) {
      await doc.ref.update(updateData);
    }
    const updated = await doc.ref.get();
    return { id: updated.id, ...updated.data() };
  }

  async delete(id: string, user: FirebaseUser) {
    const doc = await this.getTarjetasCol().doc(id).get();
    if (!doc.exists) throw new NotFoundException('Tarjeta no encontrada');
    const data = doc.data() as TarjetaCreditoDocument;
    if (data.userId !== user.uid) throw new NotFoundException('Tarjeta no encontrada');
    await doc.ref.delete();
    return { message: 'Tarjeta eliminada' };
  }

  async acumularCompra(
    tarjetaId: string,
    params: {
      descripcion: string;
      monto: number;
      fecha: string;
      gastoId?: string;
      checklistItemId?: string;
      metaId?: string;
    },
    user: FirebaseUser,
  ) {
    const doc = await this.getTarjetasCol().doc(tarjetaId).get();
    if (!doc.exists) throw new NotFoundException('Tarjeta no encontrada');
    const data = doc.data() as TarjetaCreditoDocument;
    if (data.userId !== user.uid) throw new NotFoundException('Tarjeta no encontrada');

    if (data.saldoUtilizado + params.monto > data.limiteCredito) {
      throw new BadRequestException(
        `La compra de $${params.monto} excede el límite disponible de $${data.limiteCredito - data.saldoUtilizado}`,
      );
    }

    const cicloFechaCorte = this.calcularCicloFechaCorte(data.fechaCorte, params.fecha);

    await doc.ref.update({ saldoUtilizado: data.saldoUtilizado + params.monto });
    await this.getComprasCol(tarjetaId).add({
      tarjetaId,
      descripcion: params.descripcion,
      monto: params.monto,
      fecha: params.fecha,
      gastoId: params.gastoId || null,
      checklistItemId: params.checklistItemId || null,
      metaId: params.metaId || null,
      cicloFechaCorte,
      creadoEn: new Date().toISOString(),
    } as CompraTarjetaDocument);

    return { message: 'Compra acumulada en tarjeta', nuevoSaldo: data.saldoUtilizado + params.monto };
  }

  async pagarTarjeta(id: string, dto: PagarTarjetaDto, user: FirebaseUser) {
    const db = this.firebaseService.firestore;
    const doc = await this.getTarjetasCol().doc(id).get();
    if (!doc.exists) throw new NotFoundException('Tarjeta no encontrada');
    const data = doc.data() as TarjetaCreditoDocument;
    if (data.userId !== user.uid) throw new NotFoundException('Tarjeta no encontrada');

    // Verificar cartera
    const carteraRef = db.collection('bancos').doc(dto.carteraId);
    const carteraDoc = await carteraRef.get();
    if (!carteraDoc.exists) throw new NotFoundException('Cartera no encontrada');
    const carteraData = carteraDoc.data() as any;
    if (carteraData.saldo < dto.monto) {
      throw new BadRequestException('Saldo insuficiente en la cartera');
    }

    if (dto.monto > data.saldoUtilizado) {
      throw new BadRequestException('El monto del pago excede el saldo utilizado de la tarjeta');
    }

    const now = new Date().toISOString();

    // Descontar de cartera
    await carteraRef.update({ saldo: carteraData.saldo - dto.monto });
    await carteraRef.collection('transacciones').add({
      carteraId: dto.carteraId,
      userId: user.uid,
      tipo: 'pago_tarjeta',
      monto: dto.monto,
      descripcion: `Pago tarjeta: ${data.nombre}`,
      fecha: now,
    });

    // Liberar crédito
    await doc.ref.update({ saldoUtilizado: data.saldoUtilizado - dto.monto });
    await this.getPagosCol(id).add({
      tarjetaId: id,
      monto: dto.monto,
      fecha: now,
      carteraId: dto.carteraId,
      carteraNombre: carteraData.nombre || 'Cartera',
      creadoEn: now,
    } as PagoTarjetaDocument);

    return {
      message: 'Pago registrado',
      saldoUtilizadoAnterior: data.saldoUtilizado,
      nuevoSaldoUtilizado: data.saldoUtilizado - dto.monto,
    };
  }

  async getDashboard(id: string, user: FirebaseUser) {
    const tarjeta = await this.findOne(id, user);
    const data = tarjeta as any;
    const limite = data.limiteCredito;
    const utilizado = data.saldoUtilizado;
    const disponible = limite - utilizado;
    const porcentaje = limite > 0 ? Math.round((utilizado / limite) * 100) : 0;
    const color = porcentaje < 30 ? 'verde' : porcentaje <= 70 ? 'amarillo' : 'rojo';

    const { proximoCorte, proximoPago } = this.calcularProximasFechas(data.fechaCorte, data.fechaPago);
    const comprasCiclo = (data.compras || []).filter(
      (c: any) => c.cicloFechaCorte === this.getCicloLabel(data.fechaCorte),
    );
    const totalCiclo = comprasCiclo.reduce((s: number, c: any) => s + c.monto, 0);

    return {
      tarjeta: { id, ...data },
      creditDisponible: disponible,
      porcentajeUtilizacion: porcentaje,
      colorUtilizacion: color,
      proximoCorte,
      proximoPago,
      totalCicloActual: totalCiclo,
      comprasCicloActual: comprasCiclo,
      historialCompras: data.compras || [],
      historialPagos: data.pagos || [],
    };
  }

  async getCapacidadPago(id: string, user: FirebaseUser) {
    const doc = await this.getTarjetasCol().doc(id).get();
    if (!doc.exists) throw new NotFoundException('Tarjeta no encontrada');
    const data = doc.data() as TarjetaCreditoDocument;
    if (data.userId !== user.uid) throw new NotFoundException('Tarjeta no encontrada');

    const saldoPendiente = data.saldoUtilizado;

    // Sumar saldo de carteras
    const carterasSnap = await this.firebaseService.firestore
      .collection('bancos')
      .where('uid', '==', user.uid)
      .get();
    const totalCarteras = carterasSnap.docs.reduce((s, d) => s + ((d.data() as any).saldo || 0), 0);

    // Sumar metas activas
    const metasSnap = await this.firebaseService.firestore
      .collection('metas')
      .where('creadoPor', '==', user.uid)
      .where('estado', '==', 'activo')
      .get();
    const dineroComprometido = metasSnap.docs.reduce((s, d) => s + ((d.data() as any).montoAcumulado || 0), 0);

    const dineroLibre = Math.max(0, totalCarteras - dineroComprometido);
    const porcentajeCubierto = saldoPendiente > 0 ? Math.min(100, Math.round((dineroLibre / saldoPendiente) * 100)) : 100;
    const estado = porcentajeCubierto >= 100 ? 'cubierto' : porcentajeCubierto > 0 ? 'parcial' : 'insuficiente';

    return { saldoPendiente, totalCarteras, dineroComprometido, dineroLibre, porcentajeCubierto, estado };
  }

  async simularPago(id: string, dto: SimularPagoDto, user: FirebaseUser) {
    const doc = await this.getTarjetasCol().doc(id).get();
    if (!doc.exists) throw new NotFoundException('Tarjeta no encontrada');
    const data = doc.data() as TarjetaCreditoDocument;
    if (data.userId !== user.uid) throw new NotFoundException('Tarjeta no encontrada');

    if (dto.monto > data.saldoUtilizado) {
      throw new BadRequestException('El monto simulado excede el saldo utilizado');
    }

    const result: any = {
      montoSimulado: dto.monto,
      saldoRestanteTarjeta: data.saldoUtilizado - dto.monto,
      nuevoSaldoUtilizado: data.saldoUtilizado - dto.monto,
    };

    if (dto.carteraId) {
      const carteraDoc = await this.firebaseService.firestore.collection('bancos').doc(dto.carteraId).get();
      if (carteraDoc.exists) {
        const carteraData = carteraDoc.data() as any;
        result.carteraOrigen = carteraData.nombre;
        result.saldoCarteraRestante = carteraData.saldo - dto.monto;
      }
    }

    return result;
  }

  async getCicloActual(id: string, user: FirebaseUser) {
    const doc = await this.getTarjetasCol().doc(id).get();
    if (!doc.exists) throw new NotFoundException('Tarjeta no encontrada');
    const data = doc.data() as TarjetaCreditoDocument;
    if (data.userId !== user.uid) throw new NotFoundException('Tarjeta no encontrada');

    const cicloLabel = this.getCicloLabel(data.fechaCorte);
    const comprasSnap = await this.getComprasCol(id)
      .where('cicloFechaCorte', '==', cicloLabel)
      .orderBy('fecha', 'desc')
      .get();
    const compras = comprasSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const total = compras.reduce((s: number, c: any) => s + c.monto, 0);

    const { proximoCorte, proximoPago } = this.calcularProximasFechas(data.fechaCorte, data.fechaPago);

    return { compras, total, cicloLabel, proximoCorte, proximoPago };
  }

  async getResumen(user: FirebaseUser) {
    const carterasSnap = await this.firebaseService.firestore
      .collection('bancos')
      .where('uid', '==', user.uid)
      .get();
    const totalCarteras = carterasSnap.docs.reduce((s, d) => s + ((d.data() as any).saldo || 0), 0);

    const metasSnap = await this.firebaseService.firestore
      .collection('metas')
      .where('creadoPor', '==', user.uid)
      .where('estado', '==', 'activo')
      .get();
    const dineroComprometido = metasSnap.docs.reduce((s, d) => s + ((d.data() as any).montoAcumulado || 0), 0);

    return { totalCarteras, dineroComprometido, dineroLibre: Math.max(0, totalCarteras - dineroComprometido) };
  }

  private calcularCicloFechaCorte(diaCorte: number, fechaStr: string): string {
    const fecha = new Date(fechaStr);
    const dia = fecha.getDate();
    const mes = fecha.getMonth();
    const anio = fecha.getFullYear();
    if (dia <= diaCorte) {
      return `${anio}-${String(mes + 1).padStart(2, '0')}-${String(diaCorte).padStart(2, '0')}`;
    }
    const nextMonth = new Date(anio, mes + 1, diaCorte);
    return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-${String(diaCorte).padStart(2, '0')}`;
  }

  private getCicloLabel(diaCorte: number): string {
    const now = new Date();
    return this.calcularCicloFechaCorte(diaCorte, now.toISOString());
  }

  private calcularProximasFechas(diaCorte: number, diaPago: number) {
    const now = new Date();
    const hoy = now.getDate();
    const mesActual = now.getMonth();
    const anioActual = now.getFullYear();

    let corteMes = mesActual;
    let corteAnio = anioActual;
    if (hoy > diaCorte) {
      corteMes = mesActual + 1;
      if (corteMes > 11) { corteMes = 0; corteAnio++; }
    }

    let pagoMes = mesActual;
    let pagoAnio = anioActual;
    if (hoy > diaPago) {
      pagoMes = mesActual + 1;
      if (pagoMes > 11) { pagoMes = 0; pagoAnio++; }
    }

    const proximoCorte = new Date(corteAnio, corteMes, diaCorte).toISOString().split('T')[0];
    const proximoPago = new Date(pagoAnio, pagoMes, diaPago).toISOString().split('T')[0];
    return { proximoCorte, proximoPago };
  }
}
