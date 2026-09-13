import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { BigButton, ErrorNote, ModeBadge, TextInput } from "../components/ui.jsx";
import { COLORS } from "../theme.js";
import { ROLES } from "../data/dummy.js";
import { api, IS_LIVE } from "../lib/api.js";
import { errorMessage, ROLE_LABELS } from "../lib/shared.js";

const DEMO_ROLE_KEYS = { Principal: "principal", Teacher: "teacher", "Office Admin": "office_admin", "Technical Admin": "technical_admin" };

function Shell({ children }) {
  return (
    <div className="min-h-screen max-w-md mx-auto flex flex-col" style={{ background: COLORS.header }}>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-white text-center">
        <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.12)" }}>
          <ShieldCheck size={40} />
        </div>
        <h1 className="text-2xl font-bold mb-1">{IS_LIVE ? "School Staff App" : "Sandhong Upper Primary School"}</h1>
        <p className="text-white/70 text-sm mb-1">{IS_LIVE ? "Attendance, follow-ups and more" : "Staff App"}</p>
        {!IS_LIVE && <ModeBadge className="mt-2" />}
      </div>
      <div className="bg-white rounded-t-3xl px-6 pt-6 pb-8">{children}</div>
    </div>
  );
}

function DemoLogin() {
  const [role, setRole] = useState("Teacher");
  return (
    <Shell>
      <form onSubmit={(e) => { e.preventDefault(); api.signInDemo(DEMO_ROLE_KEYS[role]); }}>
        <p className="block text-sm font-bold mb-2" style={{ color: COLORS.ink }}>I am logging in as</p>
        <div className="grid grid-cols-2 gap-2 mb-5" role="radiogroup" aria-label="Role">
          {ROLES.map((r) => (
            <button key={r} type="button" role="radio" aria-checked={role === r} onClick={() => setRole(r)}
              className="rounded-xl py-3 text-sm font-bold border-2"
              style={role === r
                ? { background: COLORS.accent, borderColor: COLORS.accent, color: COLORS.ink }
                : { background: "#fff", borderColor: COLORS.border, color: COLORS.ink }}>
              {r}
            </button>
          ))}
        </div>
        <BigButton type="submit">Continue as {role}</BigButton>
        <p className="text-xs text-center mt-3 text-gray-500">Demo only. Nothing you enter is saved.</p>
      </form>
    </Shell>
  );
}

function LiveLogin() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(""); setNotice("");
    try {
      if (mode === "signin") {
        await api.signIn(email, password);
      } else {
        if (password.length < 8) throw new Error("Password must be at least 8 characters.");
        const { needsEmailConfirmation } = await api.signUp(email, password);
        if (needsEmailConfirmation) {
          setNotice("Account created. Check your email for a confirmation link, then sign in here.");
          setMode("signin");
        }
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2 mb-2" role="tablist">
          {[["signin", "Sign in"], ["signup", "Create account"]].map(([m, label]) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setError(""); }}
              className="rounded-xl py-2.5 text-sm font-bold border-2"
              style={mode === m
                ? { background: COLORS.accent, borderColor: COLORS.accent, color: COLORS.ink }
                : { background: "#fff", borderColor: COLORS.border, color: COLORS.ink }}>
              {label}
            </button>
          ))}
        </div>
        <TextInput id="email" label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextInput id="password" label="Password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} required minLength={mode === "signup" ? 8 : undefined} value={password} onChange={(e) => setPassword(e.target.value)} />
        {notice && <p className="text-sm rounded-xl px-3 py-2.5" style={{ background: "#DCEFE1", color: "#1F6B3B" }}>{notice}</p>}
        <ErrorNote message={error} />
        <BigButton type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</BigButton>
        {mode === "signup" && (
          <p className="text-xs text-center text-gray-500">After creating your account you will set up your school or join one with a code from your principal.</p>
        )}
      </form>
    </Shell>
  );
}

export default function LoginScreen() {
  return IS_LIVE ? <LiveLogin /> : <DemoLogin />;
}

export { ROLE_LABELS };
