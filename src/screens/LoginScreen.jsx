import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { BigButton, DemoBadge } from "../components/ui.jsx";
import { ROLES } from "../data/dummy.js";
import { COLORS } from "../theme.js";

export default function LoginScreen({ onLogin }) {
  const [role, setRole] = useState("Teacher");
  return (
    <div className="min-h-screen max-w-md mx-auto flex flex-col" style={{ background: COLORS.header }}>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-white text-center">
        <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.12)" }}>
          <ShieldCheck size={40} />
        </div>
        <h1 className="text-2xl font-bold mb-1">Sandhong Upper Primary School</h1>
        <p className="text-white/70 text-sm mb-1">Staff App</p>
        <DemoBadge className="mt-2" />
      </div>
      <form
        className="bg-white rounded-t-3xl px-6 pt-6 pb-8"
        onSubmit={(e) => {
          e.preventDefault();
          onLogin(role);
        }}
      >
        <p className="block text-sm font-bold mb-2" style={{ color: COLORS.ink }}>I am logging in as</p>
        <div className="grid grid-cols-2 gap-2 mb-5" role="radiogroup" aria-label="Role">
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={role === r}
              onClick={() => setRole(r)}
              className="rounded-xl py-3 text-sm font-bold border-2"
              style={
                role === r
                  ? { background: COLORS.accent, borderColor: COLORS.accent, color: COLORS.ink }
                  : { background: "#fff", borderColor: COLORS.border, color: COLORS.ink }
              }
            >
              {r}
            </button>
          ))}
        </div>
        <label className="block text-sm font-bold mb-1" style={{ color: COLORS.ink }} htmlFor="staff-id">Staff ID</label>
        <input id="staff-id" disabled placeholder="demo.staff (disabled in prototype)" className="w-full mb-3 rounded-xl border-2 px-4 py-3 text-sm bg-gray-50" style={{ borderColor: COLORS.border }} />
        <label className="block text-sm font-bold mb-1" style={{ color: COLORS.ink }} htmlFor="password">Password</label>
        <input id="password" type="password" disabled placeholder="••••••••• (disabled in prototype)" className="w-full mb-5 rounded-xl border-2 px-4 py-3 text-sm bg-gray-50" style={{ borderColor: COLORS.border }} />
        <BigButton type="submit">Continue as {role}</BigButton>
        <p className="text-xs text-center mt-3 text-gray-500">Real login and security arrive in Phase 2.</p>
      </form>
    </div>
  );
}
