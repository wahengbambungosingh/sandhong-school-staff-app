import { useState } from "react";
import { BigButton, ErrorNote, TextInput } from "../components/ui.jsx";
import { COLORS } from "../theme.js";
import { api } from "../lib/api.js";
import { errorMessage } from "../lib/shared.js";
import { AuthShell } from "./LoginScreen.jsx";

/** Shown after the person opens a password-reset link. */
export default function SetPasswordScreen({ email }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("The two passwords do not match.");
    setBusy(true);
    try { await api.updatePassword(password); }
    catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }

  return (
    <AuthShell title="Choose a new password" subtitle={email}>
      <form onSubmit={submit} className="space-y-3">
        <TextInput id="new-password" label="New password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        <TextInput id="confirm-password" label="Type it again" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <ErrorNote message={error} />
        <BigButton type="submit" disabled={busy}>{busy ? "Saving…" : "Save new password"}</BigButton>
        <button type="button" onClick={() => api.signOut()} className="w-full text-sm font-semibold py-1 text-gray-500" style={{ color: COLORS.header }}>Cancel and sign out</button>
      </form>
    </AuthShell>
  );
}
