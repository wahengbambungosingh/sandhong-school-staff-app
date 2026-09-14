import { useEffect, useState } from "react";
import { CheckCircle2, Plus } from "lucide-react";
import { BackLink, BigButton, Card, ErrorNote, Loading, SelectInput, TextInput } from "../components/ui.jsx";
import { COLORS, fieldStyle } from "../theme.js";
import { api } from "../lib/api.js";
import { useAsync } from "../lib/useAsync.js";
import { errorMessage, todayISO } from "../lib/shared.js";

function AssessmentForm({ user, onSaved, onCancel }) {
  const { classes, sections, subjects } = user.school;
  const [form, setForm] = useState({ title: "", cls: classes[0] || "", sec: sections[0] || "", subject: subjects[0] || "", date: todayISO(), max: "50" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const max = Number(form.max);
      if (!(max > 0)) throw new Error("Maximum marks must be more than 0.");
      const a = await api.addAssessment({ ...form, max });
      onSaved(a);
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit}>
      <Card className="space-y-2">
        <TextInput id="as-title" label="Title" required placeholder="e.g. Unit Test 2" value={form.title} onChange={set("title")} />
        <div className="grid grid-cols-2 gap-2">
          <SelectInput id="as-cls" label="Class" options={classes} value={form.cls} onChange={set("cls")} />
          <SelectInput id="as-sec" label="Section" options={sections.map((s) => [s, `Section ${s}`])} value={form.sec} onChange={set("sec")} />
        </div>
        <SelectInput id="as-subject" label="Subject" options={subjects} value={form.subject} onChange={set("subject")} />
        <div className="grid grid-cols-2 gap-2">
          <TextInput id="as-date" label="Date" type="date" required value={form.date} onChange={set("date")} />
          <TextInput id="as-max" label="Maximum marks" type="number" inputMode="decimal" min="1" step="0.5" required value={form.max} onChange={set("max")} />
        </div>
        <ErrorNote message={error} />
        <BigButton type="submit" disabled={busy}>{busy ? "Saving…" : "Create and enter marks"}</BigButton>
        <button type="button" onClick={onCancel} className="w-full text-sm font-semibold text-gray-500 py-2">Cancel</button>
      </Card>
    </form>
  );
}

function MarksEntry({ assessment: a, onBack }) {
  const students = useAsync(() => api.listStudents());
  const existing = useAsync(() => api.getMarks(a.id), [a.id]);
  const [marks, setMarks] = useState({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => { if (existing.data) { setMarks(existing.data); setDirty(false); } }, [existing.data]);

  const list = (students.data || []).filter((s) => s.active && s.cls === a.cls && s.sec === a.sec).sort((x, y) => x.name.localeCompare(y.name));
  const loading = students.loading || existing.loading;

  async function save() {
    setSaving(true); setError("");
    try {
      for (const [, v] of Object.entries(marks)) {
        if (v !== "" && (Number.isNaN(Number(v)) || Number(v) < 0 || Number(v) > a.max)) throw new Error(`Marks must be between 0 and ${a.max}.`);
      }
      await api.saveMarks(a.id, marks);
      setDirty(false); setSavedAt(new Date());
    } catch (err) { setError(errorMessage(err)); } finally { setSaving(false); }
  }

  return (
    <div className="p-4 space-y-3">
      <BackLink onClick={onBack}>Back to assessments</BackLink>
      <Card>
        <p className="font-bold" style={{ color: COLORS.ink }}>{a.title}</p>
        <p className="text-xs text-gray-500 mb-3">{a.cls} {a.sec} · {a.subject} · {a.date} · Max marks {a.max}</p>
        <ErrorNote message={(students.error || existing.error) && errorMessage(students.error || existing.error)} onRetry={() => { students.reload(); existing.reload(); }} />
        {loading && <Loading />}
        {!loading && list.length === 0 && <p className="text-sm text-gray-500">No active students in {a.cls} {a.sec}.</p>}
        {list.map((s) => {
          const v = marks[s.id] ?? "";
          const low = v !== "" && Number(v) / a.max < 0.4;
          return (
            <div key={s.id} className="flex items-center justify-between gap-3 py-2 border-t" style={{ borderColor: "#EEE" }}>
              <label className="text-sm flex-1" htmlFor={`mark-${s.id}`}>{s.name}</label>
              <div className="flex items-center gap-1">
                <input id={`mark-${s.id}`} type="number" inputMode="decimal" min="0" max={a.max} step="0.5" value={v} placeholder="—"
                  onChange={(e) => { setMarks({ ...marks, [s.id]: e.target.value }); setDirty(true); setSavedAt(null); }}
                  className="w-20 rounded-xl border-2 px-2 py-2 text-sm font-bold text-right bg-white" style={{ ...fieldStyle, color: low ? COLORS.alert : COLORS.header }} />
                <span className="text-xs text-gray-400">/ {a.max}</span>
              </div>
            </div>
          );
        })}
      </Card>
      <ErrorNote message={error} />
      {list.length > 0 && (
        <BigButton onClick={save} disabled={saving || !dirty} icon={savedAt ? CheckCircle2 : undefined}>
          {saving ? "Saving…" : savedAt ? "Saved" : "Save marks"}
        </BigButton>
      )}
      <p className="text-xs text-gray-500 px-1">Marks under 40% show in red.</p>
    </div>
  );
}

export default function AssessmentsScreen({ user }) {
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { loading, data, error, reload } = useAsync(() => api.listAssessments());

  if (selected) return <MarksEntry assessment={selected} onBack={() => { setSelected(null); reload(); }} />;

  return (
    <div className="p-4 space-y-3">
      {showForm ? (
        <AssessmentForm user={user} onCancel={() => setShowForm(false)} onSaved={(a) => { setShowForm(false); setSelected(a); }} />
      ) : (
        <BigButton icon={Plus} onClick={() => setShowForm(true)}>New assessment</BigButton>
      )}
      <ErrorNote message={error && errorMessage(error)} onRetry={reload} />
      {loading && <Loading />}
      {!loading && data?.length === 0 && <p className="text-sm text-gray-500 px-1">No assessments yet.</p>}
      {(data || []).map((a) => (
        <button key={a.id} onClick={() => setSelected(a)} className="block w-full text-left">
          <Card>
            <p className="font-bold text-sm" style={{ color: COLORS.ink }}>{a.title}</p>
            <p className="text-xs text-gray-500">{a.cls} {a.sec} · {a.subject} · {a.date} · Max {a.max}</p>
          </Card>
        </button>
      ))}
    </div>
  );
}
