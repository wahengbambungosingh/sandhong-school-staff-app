import { useState } from "react";
import { BigButton, Card } from "../components/ui.jsx";
import { COLORS, fieldStyle } from "../theme.js";
import { ATTENDANCE_TODAY, CLASSES, SECTIONS, STUDENTS } from "../data/dummy.js";

const OPTIONS = ["Present", "Absent", "Leave", "Late"];

export default function AttendanceScreen() {
  const [cls, setCls] = useState("Class 4");
  const [sec, setSec] = useState("A");
  const [marks, setMarks] = useState(ATTENDANCE_TODAY);
  const list = STUDENTS.filter((s) => s.cls === cls && s.sec === sec);

  return (
    <div className="p-4 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <select aria-label="Class" value={cls} onChange={(e) => setCls(e.target.value)} className="rounded-xl border-2 px-3 py-3 text-sm font-semibold bg-white" style={fieldStyle}>
          {CLASSES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select aria-label="Section" value={sec} onChange={(e) => setSec(e.target.value)} className="rounded-xl border-2 px-3 py-3 text-sm font-semibold bg-white" style={fieldStyle}>
          {SECTIONS.map((s) => <option key={s} value={s}>Section {s}</option>)}
        </select>
      </div>
      {list.length === 0 && <p className="text-sm text-gray-500 px-1">No dummy students set up for this class/section combination yet.</p>}
      {list.map((s) => (
        <Card key={s.id}>
          <p className="font-bold mb-2" style={{ color: COLORS.ink }}>{s.name}</p>
          <div className="grid grid-cols-4 gap-2">
            {OPTIONS.map((o) => (
              <button
                key={o}
                onClick={() => setMarks({ ...marks, [s.id]: o })}
                aria-pressed={marks[s.id] === o}
                className="rounded-xl py-2.5 text-xs font-bold border-2"
                style={
                  marks[s.id] === o
                    ? { background: COLORS.header, borderColor: COLORS.header, color: "#fff" }
                    : { background: "#fff", borderColor: COLORS.border, color: COLORS.ink }
                }
              >
                {o}
              </button>
            ))}
          </div>
        </Card>
      ))}
      <BigButton>Save attendance (demo — not stored)</BigButton>
    </div>
  );
}
