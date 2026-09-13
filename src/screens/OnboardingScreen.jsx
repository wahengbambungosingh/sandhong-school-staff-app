import { useState } from "react";
import { LogOut, School } from "lucide-react";
import { BigButton, ErrorNote, TextInput } from "../components/ui.jsx";
import { COLORS } from "../theme.js";
import { api } from "../lib/api.js";
import { errorMessage } from "../lib/shared.js";

/** Shown after sign-in when the account is not yet attached to a school. */
export default function OnboardingScreen({ email }) {
  const [mode, setMode] = useState("create");
  const [fullName, setFullName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      if (mode === "create") await api.createSchool(schoolName, fullName);
      else await api.joinSchool(code, fullName);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen max-w-md mx-auto flex flex-col" style={{ background: COLORS.header }}>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-white text-center">
        <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.12)" }}><School size={40} /></div>
        <h1 className="text-2xl font-bold mb-1">Welcome</h1>
        <p className="text-white/70 text-sm">{email}</p>
      </div>
      <form onSubmit={submit} className="bg-white rounded-t-3xl px-6 pt-6 pb-8 space-y-3">
        <div className="grid grid-cols-2 gap-2 mb-2" role="tablist">
          {[["create", "Set up my school"], ["join", "Join with a code"]].map(([m, label]) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setError(""); }}
              className="rounded-xl py-2.5 text-sm font-bold border-2"
              style={mode === m
                ? { background: COLORS.accent, borderColor: COLORS.accent, color: COLORS.ink }
                : { background: "#fff", borderColor: COLORS.border, color: COLORS.ink }}>
              {label}
            </button>
          ))}
        </div>
        <TextInput id="full-name" label="Your name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        {mode === "create" ? (
          <TextInput id="school-name" label="School name" required placeholder="e.g. Sandhong Upper Primary School" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
        ) : (
          <TextInput id="join-code" label="Join code from your principal" required placeholder="8 characters" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        )}
        <ErrorNote message={error} />
        <BigButton type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "create" ? "Create school" : "Join school"}</BigButton>
        <p className="text-xs text-center text-gray-500">
          {mode === "create" ? "You become the principal and can invite staff with a join code." : "You join as a teacher. Your principal can change your role."}
        </p>
        <button type="button" onClick={() => api.signOut()} className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-gray-400 py-2">
          <LogOut size={14} /> Sign out
        </button>
      </form>
    </div>
  );
}
