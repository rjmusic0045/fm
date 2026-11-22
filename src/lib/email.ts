import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { siteConfig } from "@/config/site";

/**
 * Email delivery via SMTP (works with Resend, SendGrid, Postmark, Gmail, Mailtrap...).
 * Set EMAIL_SERVER (smtp URL) and EMAIL_FROM. Without them, emails are printed
 * to the server console so the flows still work in local development.
 */
let transporter: Transporter | null = null;

function getTransport(): Transporter | null {
  if (!process.env.EMAIL_SERVER) return null;
  transporter ??= nodemailer.createTransport(process.env.EMAIL_SERVER);
  return transporter;
}

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailInput) {
  const transport = getTransport();
  if (!transport) {
    if (process.env.NODE_ENV === "production") {
      console.error("[email] EMAIL_SERVER is not configured; email to %s was not sent", to);
    } else {
      console.info(`\n[email:dev] To: ${to}\nSubject: ${subject}\n\n${text}\n`);
    }
    return;
  }
  await transport.sendMail({
    from: process.env.EMAIL_FROM?.trim() || `${siteConfig.name} <no-reply@lumen.fm>`,
    to,
    subject,
    html,
    text,
  });
}

export const appUrl = () => (process.env.NEXTAUTH_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000").replace(/\/$/, "");

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Branded, table-based layout that renders in every major mail client. */
function layout({ heading, body, cta, url, footnote }: { heading: string; body: string; cta: string; url: string; footnote: string }) {
  return `<!doctype html><html><body style="margin:0;background:#0A0A12;font-family:Inter,Segoe UI,Arial,sans-serif;color:#E8E8F0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A12;padding:40px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#14141F;border:1px solid #26263A;border-radius:20px;overflow:hidden">
<tr><td style="height:4px;background:linear-gradient(90deg,#7C3AED,#EC4899,#F59E0B)"></td></tr>
<tr><td style="padding:36px 32px">
<p style="margin:0 0 24px;font-size:18px;font-weight:700;color:#fff">${escapeHtml(siteConfig.shortName)}<span style="color:#EC4899">.fm</span></p>
<h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:#fff">${escapeHtml(heading)}</h1>
<p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#B4B4C8">${body}</p>
<a href="${url}" style="display:inline-block;background:#7C3AED;background:linear-gradient(120deg,#7C3AED,#EC4899);color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:999px">${escapeHtml(cta)}</a>
<p style="margin:28px 0 0;font-size:12px;line-height:1.6;color:#7A7A90">${escapeHtml(footnote)}<br>Or paste this link into your browser:<br><span style="color:#B4B4C8;word-break:break-all">${url}</span></p>
</td></tr></table></td></tr></table></body></html>`;
}

export async function sendPasswordResetEmail(to: string, name: string | null, token: string) {
  const url = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const greeting = name ? `Hi ${escapeHtml(name.split(" ")[0])}, w` : "W";
  await sendEmail({
    to,
    subject: `Reset your ${siteConfig.name} password`,
    html: layout({
      heading: "Reset your password",
      body: `${greeting}e received a request to reset your password. This link expires in 1 hour.`,
      cta: "Choose a new password",
      url,
      footnote: "If you didn't ask for this, you can safely ignore this email. Your password won't change.",
    }),
    text: `Reset your ${siteConfig.name} password (link expires in 1 hour):\n${url}\n\nIf you didn't request this, ignore this email.`,
  });
}

export async function sendVerificationEmail(to: string, name: string | null, token: string) {
  const url = `${appUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  const greeting = name ? `Welcome aboard, ${escapeHtml(name.split(" ")[0])}! ` : "Welcome aboard! ";
  await sendEmail({
    to,
    subject: `Verify your email for ${siteConfig.name}`,
    html: layout({
      heading: "Confirm your email",
      body: `${greeting}Tap the button below to verify your email address. This link expires in 24 hours.`,
      cta: "Verify email",
      url,
      footnote: "If you didn't create an account, you can ignore this email.",
    }),
    text: `Verify your email for ${siteConfig.name} (link expires in 24 hours):\n${url}`,
  });
}
