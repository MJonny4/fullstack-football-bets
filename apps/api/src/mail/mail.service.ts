import { Injectable, Logger } from "@nestjs/common";
import nodemailer, { type Transporter } from "nodemailer";

interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

function booleanSetting(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  return value.trim().toLowerCase() === "true";
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string | null;

  constructor() {
    const user = process.env.SMTP_USER?.trim() || process.env.EMAIL_NAME?.trim();
    const pass = process.env.SMTP_PASS?.trim() || process.env.EMAIL_PASSWORD?.replace(/\s+/g, "");
    const host = process.env.SMTP_HOST?.trim() || (user && pass ? "smtp.gmail.com" : undefined);
    this.from = process.env.SMTP_FROM?.trim() || user || null;

    this.transporter = host && user && pass
      ? nodemailer.createTransport({
          host,
          port: Number(process.env.SMTP_PORT ?? 465),
          secure: booleanSetting(process.env.SMTP_SECURE, true),
          auth: { user, pass },
        })
      : null;
  }

  async send(message: MailMessage): Promise<boolean> {
    if (!this.transporter || !this.from) {
      this.logger.warn("Email delivery is disabled because SMTP settings are incomplete");
      return false;
    }

    try {
      await this.transporter.sendMail({ from: this.from, ...message });
      return true;
    } catch (error) {
      this.logger.error(
        `Email delivery failed: ${error instanceof Error ? error.message : "unknown SMTP error"}`,
      );
      return false;
    }
  }
}
