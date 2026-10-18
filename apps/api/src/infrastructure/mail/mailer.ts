import { env } from "../../config/env.js";

export type Mail = { to: string; subject: string; text: string; html: string };

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";
const SENDER_NAME = "AI-Tutor by Nidanos";
const TIMEOUT_MS = 10_000;

// Transactional email through Brevo (ADR-0017). Without a key (only outside production: env.ts requires
// it there) the mail is printed instead, so the flow works locally.
export async function sendMail(mail: Mail) {
  if (!env.BREVO_API_KEY) {
    console.log(`[mail not sent: no BREVO_API_KEY] to ${mail.to}: ${mail.subject}\n${mail.text}`);
    return;
  }
  const res = await fetch(BREVO_URL, {
    method: "POST",
    headers: { "api-key": env.BREVO_API_KEY, "Content-Type": "application/json", accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    body: JSON.stringify({ sender: { name: SENDER_NAME, email: env.MAIL_FROM }, to: [{ email: mail.to }], subject: mail.subject, textContent: mail.text, htmlContent: mail.html }),
  });
  if (!res.ok) throw new Error(`Brevo ${res.status}: ${(await res.text()).slice(0, 300)}`);
}
