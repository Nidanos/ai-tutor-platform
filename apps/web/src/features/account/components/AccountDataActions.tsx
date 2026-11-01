import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { downloadMyData, requestAccountDeletion } from "../api";
import { ApiError } from "@/lib/api/client";

type Props = { enabled: boolean; onDeleted: () => void };

export default function AccountDataActions({ enabled, onDeleted }: Props) {
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");

  async function exportData() {
    setBusy(true); setNotice("");
    try { await downloadMyData(); setNotice("Your data export has started."); }
    catch (cause) { setNotice(cause instanceof ApiError ? cause.body.message : "Couldn't export your data."); }
    finally { setBusy(false); }
  }

  async function deleteAccount(event: React.FormEvent) {
    event.preventDefault();
    if (!window.confirm("Your account will be deleted after 7 days. Log in before then to cancel. Your name, email and code will be erased. Continue?")) return;
    setBusy(true); setNotice("");
    try {
      const { eraseAfter } = await requestAccountDeletion(password);
      setNotice(`Deletion scheduled for ${new Date(eraseAfter).toLocaleDateString()}. Logging in before then cancels it.`);
      setPassword(""); window.setTimeout(onDeleted, 1800);
    } catch (cause) { setNotice(cause instanceof ApiError ? cause.body.message : "Couldn't request account deletion."); }
    finally { setBusy(false); }
  }

  return <section className="rounded-2xl border border-rose-400/20 bg-rose-950/20 p-5 sm:p-6">
    <h2 className="text-xl font-bold">Your data and account</h2>
    <button type="button" disabled={!enabled || busy} onClick={() => void exportData()} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 px-4 py-3 text-sm disabled:opacity-50"><Download size={16} />Export my data</button>
    <form onSubmit={deleteAccount} className="mt-6 border-t border-rose-300/10 pt-5">
      <h3 className="font-semibold text-rose-100">Request account deletion</h3>
      <p className="mt-1 text-sm text-rose-200/70">Enter your password to verify this request.</p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={!enabled} placeholder="Account password" className="min-w-0 flex-1 rounded-xl border border-rose-300/20 bg-[#180f25] p-3 text-sm text-white" /><button disabled={!enabled || busy || !password} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300/30 px-4 py-3 text-sm text-rose-100 disabled:opacity-50"><Trash2 size={16} />Request deletion</button></div>
    </form>
    {notice && <p role="status" className="mt-3 text-sm text-indigo-100">{notice}</p>}
  </section>;
}
