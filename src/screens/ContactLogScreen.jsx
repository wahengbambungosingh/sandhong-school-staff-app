import { useState } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { BigButton, Card, ErrorNote, Loading, SelectInput, TextInput } from "../components/ui.jsx";
import { COLORS, fieldClass, fieldStyle } from "../theme.js";
import { api } from "../lib/api.js";
import { useAsync } from "../lib/useAsync.js";
import { errorMessage } from "../lib/shared.js";

const TYPES = ["WhatsApp opened", "Phone call", "Meeting requested", "Home visit", "No response"];

export default function ContactLogScreen({ user }) {
  const students = useAsync(() => api.listStudents());
  const [studentId, setStudentId] = useState("");
  const logs = useAsync(() => api.listContactLogs(studentId || undefined), [studentId]);
  const [type, setType] = useState("Phone call");
  const [outcome, setOutcome] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const list = (students.data || []).filter((s) => s.active);
  const student = list.find((s) => s.id === studentId);
  const waText = student && encodeURIComponent(`Hello, this is regarding ${student.name}'s attendance at ${user.school.name}.`);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await api.addContactLog({ studentId, type, outcome, note });
      setOutcome(""); setNote(""); logs.reload();
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }

  return (
    <div className="p-4 space-y-4">
      {students.loading && <Loading />}
      <ErrorNote message={students.error && errorMessage(students.error)} onRetry={students.reload} />
      {!students.loading && (
        <SelectInput id="cl-student" label="Student" value={studentId} onChange={(e) => setStudentId(e.target.value)}
          options={[["", list.length ? "Choose a student…" : "No students yet"], ...list.map((s) => [s.id, `${s.name} · ${s.cls} ${s.sec}`])]} />
      )}

      {student && (
        <>
          <Card>
            <p className="font-bold mb-1" style={{ color: COLORS.ink }}>{student.name}</p>
            <p className="text-xs text-gray-500 mb-3">Guardian: {student.guardian || "—"} · {student.phone || "no phone"}</p>
            <div className="grid grid-cols-2 gap-2">
              {student.phone ? (
                <a href={`tel:${student.phone}`} className="flex items-center justify-center gap-2 rounded-2xl py-3 font-bold text-sm" style={{ background: COLORS.card, color: COLORS.header }}>
                  <Phone size={18} /> Call
                </a>
              ) : <div />}
              {student.consent && student.phone ? (
                <a href={`https://wa.me/91${student.phone.replace(/\D/g, "").slice(-10)}?text=${waText}`} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-2xl py-3 font-bold text-white text-sm" style={{ background: "#1F6B3B" }}>
                  <MessageCircle size={18} /> WhatsApp
                </a>
              ) : (
                <div className="flex items-center justify-center gap-2 rounded-2xl py-3 font-bold text-sm bg-gray-100 text-gray-400 text-center px-2">
                  <MessageCircle size={18} /> No WhatsApp consent
                </div>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-2 text-center">WhatsApp opens a pre-filled chat. Nothing is sent automatically.</p>
          </Card>

          <form onSubmit={submit}>
            <Card className="space-y-2">
              <p className="font-bold text-sm" style={{ color: COLORS.ink }}>Log this contact</p>
              <SelectInput id="cl-type" label="Type" options={TYPES} value={type} onChange={(e) => setType(e.target.value)} />
              <TextInput id="cl-outcome" label="Outcome" required placeholder="e.g. Spoke to mother, will return Monday" value={outcome} onChange={(e) => setOutcome(e.target.value)} />
              <label className="block" htmlFor="cl-note">
                <span className="block text-xs font-bold mb-1" style={{ color: COLORS.ink }}>Note (optional)</span>
                <textarea id="cl-note" value={note} onChange={(e) => setNote(e.target.value)} className={`w-full ${fieldClass} h-20`} style={fieldStyle} />
              </label>
              <ErrorNote message={error} />
              <BigButton type="submit" disabled={busy}>{busy ? "Saving…" : "Save log entry"}</BigButton>
            </Card>
          </form>
        </>
      )}

      <p className="font-bold text-sm px-1" style={{ color: COLORS.ink }}>{student ? `History for ${student.name}` : "Recent contact history"}</p>
      <ErrorNote message={logs.error && errorMessage(logs.error)} onRetry={logs.reload} />
      {logs.loading && <Loading />}
      {!logs.loading && logs.data?.length === 0 && <p className="text-sm text-gray-500 px-1">No contacts logged yet.</p>}
      {(logs.data || []).map((c) => (
        <Card key={c.id}>
          <div className="flex justify-between items-start">
            <p className="font-bold text-sm">{c.studentName}</p>
            <span className="text-xs text-gray-400">{c.date}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{c.type} · {c.outcome}{c.by ? ` · by ${c.by}` : ""}</p>
          {c.note && <p className="text-sm mt-1">{c.note}</p>}
        </Card>
      ))}
    </div>
  );
}
