import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { FirebaseModule } from './config/firebase/firebase.module';
import { EmailModule } from './common/email/email.module';
import { GoalsModule } from './modules/goals/goals.module';
import { BancosModule } from './modules/bancos/bancos.module';
import { ProgramacionesModule } from './modules/programaciones/programaciones.module';
import { CatalogoBancosModule } from './modules/catalogo-bancos/catalogo-bancos.module';
import { AdminModule } from './modules/admin/admin.module';
import { PresupuestosModule } from './modules/presupuestos/presupuestos.module';
import { TarjetasCreditoModule } from './modules/tarjetas-credito/tarjetas-credito.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    FirebaseModule,
    EmailModule,
    GoalsModule,
    BancosModule,
    ProgramacionesModule,
    CatalogoBancosModule,
    AdminModule,
    PresupuestosModule,
    TarjetasCreditoModule,
    SchedulerModule,
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}
