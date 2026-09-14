import { useState } from "react";
import { Copy, RefreshCw, UserMinus } from "lucide-react";
import { Card, ErrorNote, Loading } from "../components/ui.jsx";
import { COLORS, fieldStyle } from "../theme.js";
import { api } from "../lib/api.js";
import { useAsync } from "../lib/useAsync.js";
import { errorMessage, ROLE_KEYS, ROLE_LABELS } from "../lib/shared.js";

export default function StaffScreen({ user }) {
  const { loading, data, error, reload } = useAsync(() => api.listStaff());
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const isPrincipal = user.role === "principal";

  async function run(fn) {
    setBusy(true); setActionError("");
    try { await fn(); reload(); } catch (err) { setActionError(errorMessage(err)); } finally { setBusy(false); }
  }

  return (
    <div className="p-4 space-y-3">
      <Card>
        <p className="text-xs text-gray-500 font-semibold">Staff join code</p>
        <div className="flex items-center justify-between gap-2 mt-1">
          <p className="text-2xl font-bold tracking-widest" style={{ color: COLORS.header }}>{user.school.joinCode}</p>
          <div className="flex gap-2">
            <button onClick={() => navigator.clipboard?.writeText(user.school.joinCode)} className="flex items-center gap-1 text-xs font-bold rounded-xl px-3 py-2" style={{ background: COLORS.card, color: COLORS.header }} aria-label="Copy join code">
              <Copy size={14} /> Copy
            </button>
            {isPrincipal && (
              <button disabled={busy} onClick={() => { if (window.confirm("Make a new join code? The old code will stop working.")) run(() => api.regenerateJoinCode()); }}
                className="flex items-center gap-1 text-xs font-bold rounded-xl px-3 py-2" style={{ background: COLORS.card, color: COLORS.header }} aria-label="New join code">
                <RefreshCw size={14} /> New
              </button>
            )}
          </div>
        </div>
        <p className="text-[11px] text-gray-400 mt-1">New staff create an account, then enter this code to join your school as a teacher.</p>
      </Card>

      <ErrorNote message={(error && errorMessage(error)) || actionError} onRetry={error ? reload : undefined} />
      {loading && <Loading />}
      {(data || []).map((s) => {
        const isMe = s.id === user.id;
        return (
          <Card key={s.id}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold truncate" style={{ color: COLORS.ink }}>{s.fullName}{isMe && <span className="text-xs text-gray-400 font-semibold"> (you)</span>}</p>
                <p className="text-xs text-gray-500 truncate">{s.email}</p>
              </div>
              {isPrincipal && !isMe ? (
                <select aria-label={`Role for ${s.fullName}`} value={s.role} disabled={busy} onChange={(e) => run(() => api.setStaffRole(s.id, e.target.value))}
                  className="rounded-full px-2 py-1 text-xs font-bold border-2 bg-white shrink-0" style={fieldStyle}>
                  {ROLE_KEYS.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              ) : (
                <span className="text-xs font-bold rounded-full px-2 py-1 shrink-0" style={{ background: COLORS.card, color: COLORS.header }}>{ROLE_LABELS[s.role]}</span>
              )}
            </div>
            {isPrincipal && !isMe && (
              <button disabled={busy} onClick={() => { if (window.confirm(`Remove ${s.fullName} from ${user.school.name}? They can rejoin later with the join code.`)) run(() => api.removeStaff(s.id)); }}
                className="mt-2 flex items-center gap-1 text-xs font-bold" style={{ color: COLORS.alert }}>
                <UserMinus size={14} /> Remove from school
              </button>
            )}
          </Card>
        );
      })}
      {!isPrincipal && <p className="text-xs text-gray-500 px-1">Only the principal can change roles or remove staff.</p>}
    </div>
  );
}
