import nodemailer, { type Transporter } from "nodemailer";
import type SMTPPool from "nodemailer/lib/smtp-pool";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { env } from "./env";

let _transporter: Transporter | null = null;

function resolveSecure(): boolean {
  if (env.SMTP_SECURE !== undefined) return env.SMTP_SECURE;
  return env.SMTP_PORT === 465;
}

export function getTransporter(): Transporter {
  if (_transporter) return _transporter;

  const baseOptions = {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: resolveSecure(),
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000,
    tls: { minVersion: "TLSv1.2" as const },
  };

  if (env.SMTP_POOL) {
    const poolOptions: SMTPPool.Options = { ...baseOptions, pool: true };
    _transporter = nodemailer.createTransport(poolOptions);
  } else {
    const smtpOptions: SMTPTransport.Options = baseOptions;
    _transporter = nodemailer.createTransport(smtpOptions);
  }
  return _transporter;
}

export interface SendArgs {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  attachments: Array<{ filename: string; content: Buffer }>;
}

export async function sendChecklistEmail(
  args: SendArgs,
): Promise<{ messageId: string }> {
  const from = env.EMAIL_FROM ?? env.SMTP_USER;
  const info = await getTransporter().sendMail({
    from,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
    attachments: args.attachments,
  });
  return { messageId: info.messageId };
}

export async function verifyTransport(): Promise<true> {
  await getTransporter().verify();
  return true;
}
