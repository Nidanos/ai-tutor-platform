// The "reset your password" email. No name in it: the email provider gets only the address (privacy policy §5).
export function resetEmail(link: string, minutes: number) {
  const subject = "Reset your AI-Tutor password";
  const text = `Hi,

Someone (hopefully you) asked to reset the password of your AI-Tutor account. Choose a new one with this link within ${minutes} minutes:

${link}

If it wasn't you, ignore this email: your password stays the same.

AI-Tutor by Nidanos`;
  const html = `<p>Hi,</p>
<p>Someone (hopefully you) asked to reset the password of your AI-Tutor account. Choose a new one within ${minutes} minutes:</p>
<p><a href="${link}" style="display:inline-block;padding:10px 18px;background:#6d28d9;color:#fff;border-radius:8px;text-decoration:none">Set a new password</a></p>
<p>If it wasn't you, ignore this email: your password stays the same.</p>
<p>AI-Tutor by Nidanos</p>`;
  return { subject, text, html };
}
