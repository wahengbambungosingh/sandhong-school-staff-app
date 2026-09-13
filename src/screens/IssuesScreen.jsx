import { useState } from "react";
import { Plus } from "lucide-react";
import { BigButton, Card, SampleBanner, StatusPill } from "../components/ui.jsx";
import { COLORS, fieldClass, fieldStyle } from "../theme.js";
import { ISSUE_CATEGORIES, ISSUES } from "../data/dummy.js";

export default function IssuesScreen() {
  const [showForm, setShowForm] = useState(false);
  return (
    <div className="p-4 space-y-3">
      <SampleBanner />
      <BigButton icon={Plus} onClick={() => setShowForm(!showForm)}>{showForm ? "Close form" : "Report an issue"}</BigButton>
      {showForm && (
        <Card className="space-y-2">
          <select aria-label="Category" className={`w-full ${fieldClass} bg-white`} style={fieldStyle}>
            {ISSUE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <textarea placeholder="Describe the issue" className={`w-full ${fieldClass} h-20`} style={fieldStyle} />
          <select aria-label="Priority" className={`w-full ${fieldClass} bg-white`} style={fieldStyle}>
            <option>Priority: Low</option><option>Priority: Medium</option><option>Priority: High</option>
          </select>
          <div className="rounded-xl border-2 border-dashed px-3 py-4 text-center text-sm text-gray-400" style={fieldStyle}>
            + Attach facility photo (optional, added in Phase 5)
          </div>
          <BigButton>Submit (demo — not stored)</BigButton>
        </Card>
      )}
      {ISSUES.map((i) => (
        <Card key={i.id}>
          <div className="flex justify-between items-start">
            <p className="font-bold text-sm" style={{ color: COLORS.ink }}>{i.category}</p>
            <StatusPill status={i.status} />
          </div>
          <p className="text-sm text-gray-700 mt-1">{i.desc}</p>
          <div className="flex items-center justify-between mt-2">
            <StatusPill status={i.priority} />
            <span className="text-xs text-gray-400">{i.date}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
