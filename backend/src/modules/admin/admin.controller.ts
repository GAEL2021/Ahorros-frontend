import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { FirebaseAuthGuard, FirebaseUser } from '../../common/guards/firebase-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { Request } from 'express';

@Controller('admin')
@UseGuards(FirebaseAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('verificar')
  verificar(@Req() req: Request) {
    return this.adminService.verificarAdmin(req.user as FirebaseUser);
  }

  @Get('uids')
  @UseGuards(AdminGuard)
  getAdmins(@Req() req: Request) {
    return this.adminService.getAdmins(req.user as FirebaseUser);
  }

  @Put('uids')
  @UseGuards(AdminGuard)
  updateAdmins(@Body('uids') uids: string[], @Req() req: Request) {
    return this.adminService.updateAdmins(uids, req.user as FirebaseUser);
  }
}
