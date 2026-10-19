import { env } from "../../../config/env.js";

// The "your account will be deleted" email. No name in it: the email provider gets only the address (privacy policy §5).
export function deletionEmail(eraseAfter: Date, timeZone: string) {
  // In the learner's own time zone, named: "26 October 2026 at 10:52 pm IST".
  const when = eraseAfter.toLocaleString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", timeZone, timeZoneName: "short" });
  const link = `${env.WEB_ORIGIN}/login`;
  const subject = "Your AI-Tutor account will be deleted";
  const text = `Hi,

We got a request to delete your AI-Tutor account. It will be deleted after ${when}.

Changed your mind? Log in before then and nothing is deleted:

${link}

If it wasn't you, log in now and change your password.

Deleting erases your name, email, password and code. Your progress goes too, unless you opted in to research or AI training: then only anonymous numbers stay.

AI-Tutor by Nidanos`;
  const html = `<p>Hi,</p>
<p>We got a request to delete your AI-Tutor account. It will be deleted after <strong>${when}</strong>.</p>
<p>Changed your mind? Log in before then and nothing is deleted:</p>
<p><a href="${link}" style="display:inline-block;padding:10px 18px;background:#6d28d9;color:#fff;border-radius:8px;text-decoration:none">Log in to keep my account</a></p>
<p>If it wasn't you, log in now and change your password.</p>
<p>Deleting erases your name, email, password and code. Your progress goes too, unless you opted in to research or AI training: then only anonymous numbers stay.</p>
<p>AI-Tutor by Nidanos</p>`;
  return { subject, text, html };
}
