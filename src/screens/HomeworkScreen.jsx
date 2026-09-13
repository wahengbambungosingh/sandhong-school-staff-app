import { useState } from "react";
import { Plus } from "lucide-react";
import { BigButton, Card, SampleBanner } from "../components/ui.jsx";
import { COLORS, fieldClass, fieldStyle } from "../theme.js";
import { CLASSES, HOMEWORK, SECTIONS, SUBJECTS } from "../data/dummy.js";

export default function HomeworkScreen() {
  const [showForm, setShowForm] = useState(false);
  return (
    <div className="p-4 space-y-3">
      <SampleBanner />
      <BigButton icon={Plus} onClick={() => setShowForm(!showForm)}>{showForm ? "Close form" : "Set new homework"}</BigButton>
      {showForm && (
        <Card className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <select aria-label="Class" className={`${fieldClass} bg-white`} style={fieldStyle}>{CLASSES.map((c) => <option key={c}>{c}</option>)}</select>
            <select aria-label="Section" className={`${fieldClass} bg-white`} style={fieldStyle}>{SECTIONS.map((s) => <option key={s}>Section {s}</option>)}</select>
          </div>
          <select aria-label="Subject" className={`w-full ${fieldClass} bg-white`} style={fieldStyle}>{SUBJECTS.map((s) => <option key={s}>{s}</option>)}</select>
          <textarea placeholder="Homework text" className={`w-full ${fieldClass} h-24`} style={fieldStyle} />
          <BigButton>Save (demo — not stored)</BigButton>
        </Card>
      )}
      {HOMEWORK.map((h) => (
        <Card key={h.id}>
          <div className="flex justify-between items-start">
            <p className="font-bold text-sm" style={{ color: COLORS.ink }}>{h.cls} {h.sec} · {h.subject}</p>
            <span className="text-xs text-gray-400">Due {h.due}</span>
          </div>
          <p className="text-sm mt-1 text-gray-700">{h.text}</p>
        </Card>
      ))}
    </div>
  );
}
