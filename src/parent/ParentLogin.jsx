import { useState } from "react";
import { BigButton, ErrorNote, TextInput } from "../components/ui.jsx";
import { COLORS } from "../theme.js";
import { api, IS_LIVE } from "../lib/api.js";
import { errorMessage } from "../lib/shared.js";
import { AuthShell } from "../screens/LoginScreen.jsx";

/** Parent entry: phone number + the child's code from the school. */
export default function ParentLogin({ onBack }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try { await api.signInParent(phone, code); }
    catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }

  return (
    <AuthShell title="Parents" subtitle="See your child's attendance, homework, marks and fees">
      <form onSubmit={submit} className="space-y-3">
        <TextInput id="parent-phone" label="Your mobile number" type="tel" inputMode="numeric" autoComplete="tel" required placeholder="10 digits" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <TextInput id="parent-code" label="Child code from the school" required placeholder={IS_LIVE ? "8 characters" : "Demo: KID00001"} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        <ErrorNote message={error} />
        <BigButton type="submit" disabled={busy}>{busy ? "Please wait…" : "See my child"}</BigButton>
        <p className="text-xs text-center text-gray-500">The school gives you one code per child. The mobile number must be the one the school has on file.</p>
        <button type="button" onClick={onBack} className="w-full text-sm font-semibold py-1" style={{ color: COLORS.header }}>I am school staff</button>
      </form>
    </AuthShell>
  );
}
