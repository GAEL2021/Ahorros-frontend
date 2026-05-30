import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<string>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      this.logger.warn(
        'SMTP no configurado. Los emails de invitación no se enviarán. ' +
        'Configura SMTP_HOST, SMTP_PORT, SMTP_USER y SMTP_PASS en .env',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: Number(port) || 587,
      secure: Number(port) === 465,
      auth: { user, pass },
    });

    this.logger.log(`EmailService configurado con host ${host}:${port}`);
  }

  async sendInviteToWallet(
    toEmail: string,
    inviterName: string,
    walletName: string,
    codigoCompartir: string,
    appUrl: string,
  ) {
    return this.sendMail({
      to: toEmail,
      subject: `${inviterName} te invitó a una cartera compartida en Ahorros Colaborativos`,
      html: `
        <div style="font-family:Inter,system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <div style="background:#f0fdf4;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <div style="font-size:32px;margin-bottom:12px">🏦</div>
            <h1 style="font-size:18px;color:#0d6b46;margin:0 0 4px">Invitación a cartera compartida</h1>
            <p style="font-size:14px;color:#525252;margin:0">
              <strong>${inviterName}</strong> te invitó a formar parte de la cartera<br />
              <span style="color:#0d6b46;font-weight:600;font-size:16px">${walletName}</span>
            </p>
          </div>

          <div style="background:#fafbf9;border:2px dashed #e5e7e4;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
            <p style="font-size:13px;color:#525252;margin:0 0 8px">Usa este código para unirte:</p>
            <div style="font-family:'JetBrains Mono',monospace;font-size:28px;font-weight:700;color:#7c3aed;letter-spacing:0.2em;padding:12px;background:#fff;border-radius:8px;border:1px solid #e5e7e4">
              ${codigoCompartir}
            </div>
          </div>

          <div style="text-align:center">
            <a href="${appUrl}/carteras" style="display:inline-block;background:#0d6b46;color:#fff;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none">
              Ir a la aplicación
            </a>
            <p style="font-size:11px;color:#a3a3a3;margin-top:16px">
              Ingresa a la sección "Carteras" y usa el código para unirte.
            </p>
          </div>
        </div>
      `,
    });
  }

  async sendInviteToGoal(
    toEmail: string,
    inviterName: string,
    goalName: string,
    codigoCompartir: string,
    appUrl: string,
  ) {
    return this.sendMail({
      to: toEmail,
      subject: `${inviterName} te invitó a una meta grupal en Ahorros Colaborativos`,
      html: `
        <div style="font-family:Inter,system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <div style="background:#f0fdf4;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <div style="font-size:32px;margin-bottom:12px">🎯</div>
            <h1 style="font-size:18px;color:#0d6b46;margin:0 0 4px">Invitación a meta grupal</h1>
            <p style="font-size:14px;color:#525252;margin:0">
              <strong>${inviterName}</strong> te invitó a participar en la meta<br />
              <span style="color:#0d6b46;font-weight:600;font-size:16px">${goalName}</span>
            </p>
          </div>
          <div style="background:#fafbf9;border:2px dashed #e5e7e4;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
            <p style="font-size:13px;color:#525252;margin:0 0 8px">Usa este código para unirte:</p>
            <div style="font-family:'JetBrains Mono',monospace;font-size:28px;font-weight:700;color:#059669;letter-spacing:0.2em;padding:12px;background:#fff;border-radius:8px;border:1px solid #e5e7e4">
              ${codigoCompartir}
            </div>
          </div>
          <div style="text-align:center">
            <a href="${appUrl}" style="display:inline-block;background:#0d6b46;color:#fff;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none">
              Ir a la aplicación
            </a>
            <p style="font-size:11px;color:#a3a3a3;margin-top:16px">
              Ve a "Mis Metas" y usa el código "Unirse a una meta con código".
            </p>
          </div>
        </div>
      `,
    });
  }

  // --- Notificaciones de actividad ---

  async notifyGoalContribution(
    emails: string[],
    excludeEmail: string,
    contributorName: string,
    goalName: string,
    monto: number,
    nuevoAcumulado: number,
    montoObjetivo: number,
  ) {
    const pct = Math.min(100, Math.round((nuevoAcumulado / montoObjetivo) * 100));
    for (const email of emails) {
      if (email === excludeEmail) continue;
      this.sendMail({
        to: email,
        subject: `${contributorName} aportó $${monto.toLocaleString()} a "${goalName}"`,
        html: this.cardTemplate('💰', 'Nuevo aporte', `
          <strong>${contributorName}</strong> aportó <strong>$${monto.toLocaleString()}</strong> a la meta<br />
          <span style="color:#0d6b46;font-weight:600;font-size:16px">${goalName}</span>
          <div style="margin-top:16px;background:#fafbf9;border-radius:8px;padding:12px;text-align:center">
            <p style="font-size:12px;color:#525252;margin:0 0 4px">Progreso: <strong>${pct}%</strong></p>
            <div style="background:#e5e7e4;border-radius:4px;height:8px;overflow:hidden">
              <div style="background:#0d6b46;height:8px;width:${pct}%"></div>
            </div>
            <p style="font-size:11px;color:#a3a3a3;margin:4px 0 0">$${nuevoAcumulado.toLocaleString()} de $${montoObjetivo.toLocaleString()}</p>
          </div>
        `).html,
      }).catch(() => {});
    }
  }

  async notifyGoalUpdated(
    emails: string[],
    excludeEmail: string,
    editorName: string,
    goalName: string,
    cambios: string[],
  ) {
    for (const email of emails) {
      if (email === excludeEmail) continue;
      this.sendMail({
        to: email,
        subject: `Meta "${goalName}" actualizada por ${editorName}`,
        html: this.cardTemplate('✏️', 'Meta actualizada', `
          <strong>${editorName}</strong> modificó la meta<br />
          <span style="color:#0d6b46;font-weight:600;font-size:16px">${goalName}</span>
          <div style="margin-top:16px;background:#fafbf9;border-radius:8px;padding:12px">
            <p style="font-size:12px;color:#525252;margin:0">Cambios realizados:</p>
            <ul style="font-size:12px;color:#525252;margin:8px 0 0;padding-left:18px">
              ${cambios.map((c) => `<li>${c}</li>`).join('')}
            </ul>
          </div>
        `).html,
      }).catch(() => {});
    }
  }

  async notifyGoalMemberJoined(
    emails: string[],
    excludeEmail: string,
    newMemberName: string,
    goalName: string,
  ) {
    for (const email of emails) {
      if (email === excludeEmail) continue;
      this.sendMail({
        to: email,
        subject: `${newMemberName} se unió a "${goalName}"`,
        html: this.cardTemplate('👤', 'Nuevo integrante', `
          <strong>${newMemberName}</strong> se unió a la meta<br />
          <span style="color:#0d6b46;font-weight:600;font-size:16px">${goalName}</span>
          <p style="font-size:12px;color:#525252;margin-top:12px">Ahora son más personas colaborando juntas.</p>
        `).html,
      }).catch(() => {});
    }
  }

  async notifyWalletDeposit(
    emails: string[],
    excludeEmail: string,
    depositorName: string,
    walletName: string,
    monto: number,
    nuevoSaldo: number,
  ) {
    for (const email of emails) {
      if (email === excludeEmail) continue;
      this.sendMail({
        to: email,
        subject: `${depositorName} depositó $${monto.toLocaleString()} en "${walletName}"`,
        html: this.cardTemplate('🏦', 'Nuevo depósito', `
          <strong>${depositorName}</strong> depositó <strong>$${monto.toLocaleString()}</strong> en la cartera<br />
          <span style="color:#7c3aed;font-weight:600;font-size:16px">${walletName}</span>
          <div style="margin-top:16px;background:#fafbf9;border-radius:8px;padding:12px;text-align:center">
            <p style="font-size:12px;color:#525252;margin:0">Saldo actual: <strong style="color:#7c3aed">$${nuevoSaldo.toLocaleString()}</strong></p>
          </div>
        `).html,
      }).catch(() => {});
    }
  }

  async notifyWalletWithdraw(
    emails: string[],
    excludeEmail: string,
    withdrawerName: string,
    walletName: string,
    monto: number,
    nuevoSaldo: number,
  ) {
    for (const email of emails) {
      if (email === excludeEmail) continue;
      this.sendMail({
        to: email,
        subject: `${withdrawerName} retiró $${monto.toLocaleString()} de "${walletName}"`,
        html: this.cardTemplate('💸', 'Retiro', `
          <strong>${withdrawerName}</strong> retiró <strong>$${monto.toLocaleString()}</strong> de la cartera<br />
          <span style="color:#7c3aed;font-weight:600;font-size:16px">${walletName}</span>
          <div style="margin-top:16px;background:#fafbf9;border-radius:8px;padding:12px;text-align:center">
            <p style="font-size:12px;color:#525252;margin:0">Saldo actual: <strong style="color:#7c3aed">$${nuevoSaldo.toLocaleString()}</strong></p>
          </div>
        `).html,
      }).catch(() => {});
    }
  }

  async notifyWalletMemberJoined(
    emails: string[],
    excludeEmail: string,
    newMemberName: string,
    walletName: string,
  ) {
    for (const email of emails) {
      if (email === excludeEmail) continue;
      this.sendMail({
        to: email,
        subject: `${newMemberName} se unió a "${walletName}"`,
        html: this.cardTemplate('👤', 'Nuevo integrante', `
          <strong>${newMemberName}</strong> se unió a la cartera compartida<br />
          <span style="color:#7c3aed;font-weight:600;font-size:16px">${walletName}</span>
          <p style="font-size:12px;color:#525252;margin-top:12px">Ahora esta persona puede depositar y retirar de la cartera.</p>
        `).html,
      }).catch(() => {});
    }
  }

  // --- Helpers ---

  private cardTemplate(emoji: string, title: string, body: string) {
    return {
      html: `
        <div style="font-family:Inter,system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <div style="background:#f0fdf4;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <div style="font-size:32px;margin-bottom:12px">${emoji}</div>
            <h1 style="font-size:18px;color:#0d6b46;margin:0">${title}</h1>
          </div>
          <div style="background:#fff;border-radius:12px;padding:20px;border:1px solid #e5e7e4;text-align:center">
            <p style="font-size:14px;color:#525252;margin:0;line-height:1.6">${body}</p>
          </div>
          <p style="font-size:10px;color:#a3a3a3;text-align:center;margin-top:20px">
            Ahorros Colaborativos
          </p>
        </div>
      `,
    };
  }

  private async sendMail(opts: { to: string; subject: string; html: string }) {
    if (!this.transporter) {
      this.logger.warn(
        `Email no enviado a ${opts.to}: SMTP no configurado.`,
      );
      return null;
    }

    const from =
      this.configService.get<string>('EMAIL_FROM') ||
      this.configService.get<string>('SMTP_USER') ||
      'noreply@ahorros.app';

    try {
      const info = await this.transporter.sendMail({
        from: `Ahorros Colaborativos <${from}>`,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      });

      this.logger.log(
        `Email enviado a ${opts.to}: ${info.messageId}`,
      );

      return info;
    } catch (err) {
      this.logger.error(
        `Error enviando email a ${opts.to}: ${err instanceof Error ? err.message : 'Error desconocido'}`,
      );
      return null;
    }
  }
}
