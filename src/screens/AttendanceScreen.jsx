import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { BigButton, Card, ErrorNote, Loading } from "../components/ui.jsx";
import { COLORS, fieldStyle } from "../theme.js";
import { CLASSES, SECTIONS } from "../data/dummy.js";
import { api } from "../lib/api.js";
import { useAsync } from "../lib/useAsync.js";
import { errorMessage, todayISO } from "../lib/shared.js";

const OPTIONS = ["Present", "Absent", "Leave", "Late"];

export default function AttendanceScreen() {
  const [date, setDate] = useState(todayISO());
  const [cls, setCls] = useState("Class 4");
  const [sec, setSec] = useState("A");
  const [marks, setMarks] = useState({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedAt, setSavedAt] = useState(null);

  const students = useAsync(() => api.listStudents());
  const existing = useAsync(() => api.getAttendance(date), [date]);

  useEffect(() => {
    if (existing.data) { setMarks(existing.data); setDirty(false); setSavedAt(null); }
  }, [existing.data]);

  const list = (students.data || []).filter((s) => s.active && s.cls === cls && s.sec === sec);
  const loading = students.loading || existing.loading;
  const error = students.error || existing.error;

  function mark(id, status) {
    setMarks({ ...marks, [id]: status });
    setDirty(true);
    setSavedAt(null);
  }
  function markAll(status) {
    const next = { ...marks };
    list.forEach((s) => { next[s.id] = status; });
    setMarks(next); setDirty(true); setSavedAt(null);
  }

  async function save() {
    setSaving(true); setSaveError("");
    try {
      const entries = {};
      list.forEach((s) => { if (marks[s.id]) entries[s.id] = marks[s.id]; });
      await api.saveAttendance(date, entries);
      setDirty(false); setSavedAt(new Date());
    } catch (err) {
      setSaveError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const unmarked = list.filter((s) => !marks[s.id]).length;

  return (
    <div className="p-4 space-y-3">
      <input type="date" aria-label="Date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)}
        className="w-full rounded-xl border-2 px-3 py-3 text-sm font-semibold bg-white" style={fieldStyle} />
      <div className="grid grid-cols-2 gap-2">
        <select aria-label="Class" value={cls} onChange={(e) => setCls(e.target.value)} className="rounded-xl border-2 px-3 py-3 text-sm font-semibold bg-white" style={fieldStyle}>
          {CLASSES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select aria-label="Section" value={sec} onChange={(e) => setSec(e.target.value)} className="rounded-xl border-2 px-3 py-3 text-sm font-semibold bg-white" style={fieldStyle}>
          {SECTIONS.map((s) => <option key={s} value={s}>Section {s}</option>)}
        </select>
      </div>
      <ErrorNote message={error && errorMessage(error)} onRetry={() => { students.reload(); existing.reload(); }} />
      {loading && <Loading />}
      {!loading && !error && list.length === 0 && (
        <p className="text-sm text-gray-500 px-1">No active students in this class and section.</p>
      )}
      {!loading && list.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-gray-500">{list.length} students · {unmarked} not marked</span>
          <button onClick={() => markAll("Present")} className="text-xs font-bold" style={{ color: COLORS.header }}>Mark all present</button>
        </div>
      )}
      {list.map((s) => (
        <Card key={s.id}>
          <p className="font-bold mb-2" style={{ color: COLORS.ink }}>{s.name}</p>
          <div className="grid grid-cols-4 gap-2">
            {OPTIONS.map((o) => (
              <button key={o} onClick={() => mark(s.id, o)} aria-pressed={marks[s.id] === o}
                className="rounded-xl py-2.5 text-xs font-bold border-2"
                style={marks[s.id] === o
                  ? { background: COLORS.header, borderColor: COLORS.header, color: "#fff" }
                  : { background: "#fff", borderColor: COLORS.border, color: COLORS.ink }}>
                {o}
              </button>
            ))}
          </div>
        </Card>
      ))}
      <ErrorNote message={saveError} />
      {list.length > 0 && (
        <BigButton onClick={save} disabled={saving || !dirty} icon={savedAt ? CheckCircle2 : undefined}>
          {saving ? "Saving…" : savedAt ? "Saved" : api.mode === "demo" ? "Save attendance (demo — not stored)" : "Save attendance"}
        </BigButton>
      )}
    </div>
  );
}
