import { MessageCircle } from "lucide-react";
import { BigButton, Card, SampleBanner } from "../components/ui.jsx";
import { COLORS, fieldClass, fieldStyle } from "../theme.js";
import { CONTACT_LOG, STUDENTS } from "../data/dummy.js";

export default function ContactLogScreen() {
  const student = STUDENTS.find((s) => s.id === 3);
  const waText = encodeURIComponent(`Hello, this is regarding ${student.name}'s attendance at Sandhong Upper Primary School.`);
  return (
    <div className="p-4 space-y-4">
      <SampleBanner />
      <Card>
        <p className="font-bold mb-1" style={{ color: COLORS.ink }}>{student.name}</p>
        <p className="text-xs text-gray-500 mb-3">Guardian: {student.guardian} · {student.phone}</p>
        {student.consent ? (
          <a
            href={`https://wa.me/91${student.phone}?text=${waText}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl py-3 font-bold text-white text-sm"
            style={{ background: "#1F6B3B" }}
          >
            <MessageCircle size={18} /> Open WhatsApp (manual send only)
          </a>
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-2xl py-3 font-bold text-sm bg-gray-100 text-gray-400">
            <MessageCircle size={18} /> No WhatsApp consent on file
          </div>
        )}
        <p className="text-[11px] text-gray-400 mt-2 text-center">Opens a pre-filled chat. No message is sent automatically.</p>
      </Card>

      <Card className="space-y-2">
        <p className="font-bold text-sm" style={{ color: COLORS.ink }}>Log this contact</p>
        <select disabled className={`w-full ${fieldClass} bg-gray-50`} style={fieldStyle}>
          <option>WhatsApp opened / Phone call / Meeting requested / No response</option>
        </select>
        <select disabled className={`w-full ${fieldClass} bg-gray-50`} style={fieldStyle}>
          <option>Outcome</option>
        </select>
        <textarea disabled placeholder="Short note (disabled in prototype)" className={`w-full ${fieldClass} bg-gray-50 h-20`} style={fieldStyle} />
        <BigButton>Save log entry (demo — not stored)</BigButton>
      </Card>

      <p className="font-bold text-sm px-1" style={{ color: COLORS.ink }}>Recent contact history</p>
      {CONTACT_LOG.map((c) => (
        <Card key={c.id}>
          <div className="flex justify-between items-start">
            <p className="font-bold text-sm">{c.student}</p>
            <span className="text-xs text-gray-400">{c.date}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{c.type} · {c.outcome}</p>
          <p className="text-sm mt-1">{c.note}</p>
        </Card>
      ))}
    </div>
  );
}
