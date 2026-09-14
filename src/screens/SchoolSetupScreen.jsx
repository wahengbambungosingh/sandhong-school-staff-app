import { useState } from "react";
import { Plus, X } from "lucide-react";
import { BigButton, Card, ErrorNote, TextInput } from "../components/ui.jsx";
import { COLORS, fieldClass, fieldStyle } from "../theme.js";
import { api } from "../lib/api.js";
import { errorMessage, MANAGEMENT_ROLES } from "../lib/shared.js";

function ChipList({ label, items, onChange, editable, placeholder, idPrefix }) {
  const [draft, setDraft] = useState("");
  function add() {
    const v = draft.trim();
    if (!v || items.includes(v)) { setDraft(""); return; }
    onChange([...items, v]); setDraft("");
  }
  return (
    <Card>
      <p className="font-bold text-sm mb-2" style={{ color: COLORS.ink }}>{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((c) => (
          <span key={c} className="inline-flex items-center gap-1 text-xs font-semibold rounded-full pl-3 pr-2 py-1.5" style={{ background: COLORS.card }}>
            {c}
            {editable && (
              <button type="button" onClick={() => onChange(items.filter((x) => x !== c))} aria-label={`Remove ${c}`} className="rounded-full p-0.5 hover:bg-black/10"><X size={12} /></button>
            )}
          </span>
        ))}
        {items.length === 0 && <span className="text-xs text-gray-400">None yet.</span>}
      </div>
      {editable && (
        <div className="flex gap-2 mt-3">
          <input id={`${idPrefix}-new`} aria-label={`Add to ${label}`} value={draft} placeholder={placeholder} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
            className={`flex-1 ${fieldClass} bg-white`} style={fieldStyle} />
          <button type="button" onClick={add} className="flex items-center gap-1 rounded-xl px-3 text-sm font-bold" style={{ background: COLORS.card, color: COLORS.header }}><Plus size={16} /> Add</button>
        </div>
      )}
    </Card>
  );
}

export default function SchoolSetupScreen({ user }) {
  const editable = MANAGEMENT_ROLES.includes(user.role);
  const [form, setForm] = useState({
    academicYear: user.school.academicYear || "", classes: user.school.classes || [], sections: user.school.sections || [], subjects: user.school.subjects || [],
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const set = (k) => (v) => { setForm({ ...form, [k]: v }); setSaved(false); };

  async function save(e) {
    e.preventDefault();
    setBusy(true); setError(""); setSaved(false);
    try { await api.updateSchoolSettings(form); setSaved(true); }
    catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={save} className="p-4 space-y-4">
      <Card>
        <p className="font-bold text-sm mb-1" style={{ color: COLORS.ink }}>School</p>
        <p className="text-sm text-gray-600">{user.school.name}</p>
      </Card>
      <Card>
        {editable ? (
          <TextInput id="academic-year" label="Academic year" value={form.academicYear} onChange={(e) => set("academicYear")(e.target.value)} placeholder="e.g. 2026–2027" />
        ) : (
          <><p className="font-bold text-sm mb-1" style={{ color: COLORS.ink }}>Academic year</p><p className="text-sm text-gray-600">{form.academicYear || "—"}</p></>
        )}
      </Card>
      <ChipList idPrefix="class" label="Classes" items={form.classes} onChange={set("classes")} editable={editable} placeholder="e.g. Class 9" />
      <ChipList idPrefix="section" label="Sections" items={form.sections} onChange={set("sections")} editable={editable} placeholder="e.g. C" />
      <ChipList idPrefix="subject" label="Subjects" items={form.subjects} onChange={set("subjects")} editable={editable} placeholder="e.g. Hindi" />
      <ErrorNote message={error} />
      {editable ? (
        <BigButton type="submit" disabled={busy}>{busy ? "Saving…" : saved ? "Saved" : "Save school setup"}</BigButton>
      ) : (
        <p className="text-xs text-gray-500 px-1">Only the principal or office staff can change these.</p>
      )}
      <p className="text-xs text-gray-500 px-1">These lists fill the class, section and subject choices across the app.</p>
    </form>
  );
}
