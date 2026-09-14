import { useState } from "react";
import { MapPin, Pencil, Phone, Plus } from "lucide-react";
import { BackLink, BigButton, Card, ErrorNote, Loading, SelectInput, StatusPill, TextInput, Toggle } from "../components/ui.jsx";
import { COLORS, fieldStyle } from "../theme.js";
import { api } from "../lib/api.js";
import { useAsync } from "../lib/useAsync.js";
import { errorMessage } from "../lib/shared.js";

const emptyStudent = (school) => ({ name: "", adm: "", cls: school.classes[0] || "", sec: school.sections[0] || "", guardian: "", phone: "", village: "", consent: false, active: true, fee: "Pending" });

function StudentForm({ initial, onSaved, onCancel, school }) {
  const [form, setForm] = useState(initial || emptyStudent(school));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const saved = initial?.id ? await api.updateStudent(initial.id, form) : await api.addStudent(form);
      onSaved(saved);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <Card className="space-y-3">
        <p className="font-bold" style={{ color: COLORS.ink }}>{initial?.id ? "Edit student" : "Add student"}</p>
        <TextInput id="st-name" label="Student name" required value={form.name} onChange={set("name")} />
        <TextInput id="st-adm" label="Admission number" required placeholder="e.g. SUPS-108" value={form.adm} onChange={set("adm")} />
        <div className="grid grid-cols-2 gap-2">
          <SelectInput id="st-cls" label="Class" options={school.classes} value={form.cls} onChange={set("cls")} />
          <SelectInput id="st-sec" label="Section" options={school.sections.map((s) => [s, `Section ${s}`])} value={form.sec} onChange={set("sec")} />
        </div>
        <TextInput id="st-guardian" label="Guardian name" value={form.guardian} onChange={set("guardian")} />
        <TextInput id="st-phone" label="Guardian phone" type="tel" inputMode="numeric" placeholder="10 digits" value={form.phone} onChange={set("phone")} />
        <TextInput id="st-village" label="Village / area" value={form.village} onChange={set("village")} />
        <SelectInput id="st-fee" label="Fees" options={["Pending", "Paid"]} value={form.fee} onChange={set("fee")} />
        <Toggle id="st-consent" label="Guardian agreed to WhatsApp contact" checked={form.consent} onChange={(v) => setForm({ ...form, consent: v })} />
        {initial?.id && <Toggle id="st-active" label="Active student" checked={form.active} onChange={(v) => setForm({ ...form, active: v })} />}
        <ErrorNote message={error} />
        <BigButton type="submit" disabled={busy}>{busy ? "Saving…" : "Save student"}</BigButton>
        <button type="button" onClick={onCancel} className="w-full text-sm font-semibold text-gray-500 py-2">Cancel</button>
      </Card>
    </form>
  );
}

function StudentDetail({ student: s, onBack, onEdit }) {
  return (
    <div className="p-4 space-y-3">
      <BackLink onClick={onBack}>Back to list</BackLink>
      <Card className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xl font-bold" style={{ color: COLORS.ink }}>{s.name}</p>
            <p className="text-sm text-gray-500">Admission No. {s.adm}</p>
          </div>
          <button onClick={onEdit} className="flex items-center gap-1 text-sm font-bold rounded-xl px-3 py-2" style={{ background: COLORS.card, color: COLORS.header }} aria-label="Edit student">
            <Pencil size={14} /> Edit
          </button>
        </div>
        <p className="text-sm">{s.cls} · Section {s.sec}</p>
        <div className="h-px bg-gray-100 my-2" />
        <p className="text-sm"><span className="text-gray-500">Guardian:</span> {s.guardian || "—"}</p>
        <p className="text-sm flex items-center gap-1"><Phone size={14} className="text-gray-500" /> {s.phone || "—"}</p>
        <p className="text-sm flex items-center gap-1"><MapPin size={14} className="text-gray-500" /> {s.village || "—"}</p>
        <p className="text-sm">
          WhatsApp consent: <StatusPill status={s.consent ? "Present" : "Absent"} />{" "}
          <span className="text-xs text-gray-400">({s.consent ? "Yes" : "No"})</span>
        </p>
        <p className="text-sm">Fees: <StatusPill status={s.fee} /></p>
        <p className="text-sm">Status: <span className={`font-semibold ${s.active ? "text-green-700" : "text-gray-500"}`}>{s.active ? "Active" : "Inactive"}</span></p>
      </Card>
    </div>
  );
}

export default function StudentRegisterScreen({ user }) {
  const CLASSES = user.school.classes;
  const [filterCls, setFilterCls] = useState("All");
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null); // null | "new" | student
  const { loading, data: students, error, reload } = useAsync(() => api.listStudents());

  if (editing) {
    return (
      <div className="p-4 space-y-3">
        <StudentForm
          school={user.school}
          initial={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSaved={(saved) => { setEditing(null); setSelected(saved); reload(); }}
        />
      </div>
    );
  }
  if (selected) {
    return <StudentDetail student={selected} onBack={() => setSelected(null)} onEdit={() => setEditing(selected)} />;
  }

  const list = (students || [])
    .filter((s) => filterCls === "All" || s.cls === filterCls)
    .sort((a, b) => CLASSES.indexOf(a.cls) - CLASSES.indexOf(b.cls) || a.sec.localeCompare(b.sec) || a.name.localeCompare(b.name));

  return (
    <div className="p-4 space-y-3">
      <BigButton icon={Plus} onClick={() => setEditing("new")}>Add student</BigButton>
      <select aria-label="Filter by class" value={filterCls} onChange={(e) => setFilterCls(e.target.value)}
        className="w-full rounded-xl border-2 px-4 py-3 text-sm font-semibold bg-white" style={fieldStyle}>
        <option>All</option>
        {CLASSES.map((c) => <option key={c}>{c}</option>)}
      </select>
      <ErrorNote message={error && errorMessage(error)} onRetry={reload} />
      {loading && <Loading />}
      {!loading && !error && list.length === 0 && (
        <p className="text-sm text-gray-500 px-1">{students?.length ? "No students in this class." : "No students yet. Tap Add student to begin."}</p>
      )}
      {list.map((s) => (
        <Card key={s.id} className="flex items-center justify-between gap-2">
          <button onClick={() => setSelected(s)} className="text-left flex-1">
            <p className="font-bold" style={{ color: COLORS.ink }}>{s.name}{!s.active && <span className="ml-2 text-[10px] font-bold text-gray-400 border rounded px-1.5 py-0.5">Inactive</span>}</p>
            <p className="text-xs text-gray-500">{s.adm} · {s.cls} {s.sec}</p>
          </button>
          {!s.consent && <span className="text-[10px] font-bold text-gray-400 border rounded px-2 py-1 shrink-0">No WA consent</span>}
        </Card>
      ))}
    </div>
  );
}
