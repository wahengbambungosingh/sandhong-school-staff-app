import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { BigButton, ErrorNote, ModeBadge, TextInput } from "../components/ui.jsx";
import { COLORS } from "../theme.js";
import { ROLES } from "../data/dummy.js";
import { api, IS_LIVE } from "../lib/api.js";
import { errorMessage } from "../lib/shared.js";

const DEMO_ROLE_KEYS = { Principal: "principal", Teacher: "teacher", "Office Admin": "office_admin", "Technical Admin": "technical_admin" };

export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen max-w-md mx-auto flex flex-col" style={{ background: COLORS.header }}>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-white text-center">
        <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.12)" }}>
          <ShieldCheck size={40} />
        </div>
        <h1 className="text-2xl font-bold mb-1">{title}</h1>
        <p className="text-white/70 text-sm mb-1">{subtitle}</p>
        {!IS_LIVE && <ModeBadge className="mt-2" />}
      </div>
      <div className="bg-white rounded-t-3xl px-6 pt-6 pb-8">{children}</div>
    </div>
  );
}

export function TabButtons({ tabs, value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2 mb-2" role="tablist">
      {tabs.map(([m, label]) => (
        <button key={m} type="button" role="tab" aria-selected={value === m} onClick={() => onChange(m)}
          className="rounded-xl py-2.5 text-sm font-bold border-2"
          style={value === m
            ? { background: COLORS.accent, borderColor: COLORS.accent, color: COLORS.ink }
            : { background: "#fff", borderColor: COLORS.border, color: COLORS.ink }}>
          {label}
        </button>
      ))}
    </div>
  );
}

function ParentLink({ onParent }) {
  return (
    <button type="button" onClick={onParent} className="w-full text-sm font-semibold py-2 mt-1" style={{ color: COLORS.header }}>I am a parent</button>
  );
}

function DemoLogin({ onParent }) {
  const [role, setRole] = useState("Teacher");
  return (
    <AuthShell title="Sandhong Upper Primary School" subtitle="Staff App">
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
        <ParentLink onParent={onParent} />
      </form>
    </AuthShell>
  );
}

function LiveLogin({ onParent }) {
  const [mode, setMode] = useState("signin"); // signin | signup | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function switchMode(m) { setMode(m); setError(""); setNotice(""); }

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(""); setNotice("");
    try {
      if (mode === "signin") {
        await api.signIn(email, password);
      } else if (mode === "signup") {
        if (password.length < 8) throw new Error("Password must be at least 8 characters.");
        const { needsEmailConfirmation } = await api.signUp(email, password);
        if (needsEmailConfirmation) {
          setNotice("Account created. Open the confirmation link we emailed you. It brings you back here, signed in.");
          setMode("signin");
        }
      } else {
        await api.resetPassword(email);
        setNotice("If an account exists for that email, a reset link is on its way. Open it on this phone to choose a new password.");
        setMode("signin");
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const buttonLabel = { signin: "Sign in", signup: "Create account", forgot: "Send reset link" }[mode];

  return (
    <AuthShell title="School Staff App" subtitle="Attendance, follow-ups and more">
      <form onSubmit={submit} className="space-y-3">
        {mode === "forgot" ? (
          <p className="text-sm font-bold" style={{ color: COLORS.ink }}>Reset your password</p>
        ) : (
          <TabButtons tabs={[["signin", "Sign in"], ["signup", "Create account"]]} value={mode} onChange={switchMode} />
        )}
        <TextInput id="email" label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        {mode !== "forgot" && (
          <TextInput id="password" label="Password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} required minLength={mode === "signup" ? 8 : undefined} value={password} onChange={(e) => setPassword(e.target.value)} />
        )}
        {notice && <p className="text-sm rounded-xl px-3 py-2.5" style={{ background: "#DCEFE1", color: "#1F6B3B" }}>{notice}</p>}
        <ErrorNote message={error} />
        <BigButton type="submit" disabled={busy}>{busy ? "Please wait…" : buttonLabel}</BigButton>
        {mode === "signin" && (
          <button type="button" onClick={() => switchMode("forgot")} className="w-full text-sm font-semibold py-1" style={{ color: COLORS.header }}>Forgot password?</button>
        )}
        {mode === "forgot" && (
          <button type="button" onClick={() => switchMode("signin")} className="w-full text-sm font-semibold py-1 text-gray-500">Back to sign in</button>
        )}
        {mode === "signup" && (
          <p className="text-xs text-center text-gray-500">After creating your account you will set up your school or join one with a code from your principal.</p>
        )}
        <ParentLink onParent={onParent} />
      </form>
    </AuthShell>
  );
}

export default function LoginScreen({ onParent }) {
  return IS_LIVE ? <LiveLogin onParent={onParent} /> : <DemoLogin onParent={onParent} />;
}
