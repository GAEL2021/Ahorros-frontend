import 'dotenv/config';
import * as nodemailer from 'nodemailer';

async function testEmail() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || user;
  const to = process.argv[2] || user;

  if (!host || !user || !pass) {
    console.error('ERROR: SMTP_HOST, SMTP_USER y SMTP_PASS deben estar configurados en .env');
    console.log('\nValores actuales:');
    console.log(`  SMTP_HOST=${host || '(vacío)'}`);
    console.log(`  SMTP_PORT=${port}`);
    console.log(`  SMTP_USER=${user || '(vacío)'}`);
    console.log(`  SMTP_PASS=${pass ? '(configurado)' : '(vacío)'}`);
    process.exit(1);
  }

  console.log(`Conectando a ${host}:${port} como ${user}...`);
  console.log(`Enviando test a: ${to}`);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  try {
    const info = await transporter.sendMail({
      from: `Ahorros Colaborativos <${from}>`,
      to,
      subject: 'Test de configuración SMTP - Ahorros Colaborativos',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#0d6b46">Configuración exitosa</h2>
          <p>Si ves este correo, el SMTP está funcionando correctamente.</p>
          <p>Los correos de invitación a carteras y metas ya se enviarán automáticamente.</p>
        </div>
      `,
    });

    console.log(`Email enviado correctamente!`);
    console.log(`  MessageId: ${info.messageId}`);
    console.log(`  Aceptado por: ${info.accepted}`);
  } catch (err) {
    console.error(`ERROR al enviar: ${err instanceof Error ? err.message : err}`);
    if (err instanceof Error && err.message.includes('Invalid login')) {
      console.error('\nCredenciales incorrectas. Si usás Gmail, necesitás una contraseña de aplicación:');
      console.error('  1. Andá a https://myaccount.google.com/apppasswords');
      console.error('  2. Generá una contraseña para "Correo"');
      console.error('  3. Pegá esos 16 dígitos en SMTP_PASS (no uses tu contraseña normal)');
    }
    process.exit(1);
  }
}

testEmail();
