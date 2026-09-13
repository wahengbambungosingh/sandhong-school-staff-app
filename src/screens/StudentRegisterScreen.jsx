import { useState } from "react";
import { MapPin, Phone } from "lucide-react";
import { BackLink, Card, StatusPill } from "../components/ui.jsx";
import { COLORS, fieldStyle } from "../theme.js";
import { CLASSES, STUDENTS } from "../data/dummy.js";

export default function StudentRegisterScreen() {
  const [filterCls, setFilterCls] = useState("All");
  const [selected, setSelected] = useState(null);
  const list = STUDENTS.filter((s) => filterCls === "All" || s.cls === filterCls);

  if (selected) {
    const s = selected;
    return (
      <div className="p-4 space-y-3">
        <BackLink onClick={() => setSelected(null)}>Back to list</BackLink>
        <Card className="space-y-2">
          <p className="text-xl font-bold" style={{ color: COLORS.ink }}>{s.name}</p>
          <p className="text-sm text-gray-500">Admission No. {s.adm}</p>
          <p className="text-sm">{s.cls} · Section {s.sec}</p>
          <div className="h-px bg-gray-100 my-2" />
          <p className="text-sm"><span className="text-gray-500">Guardian:</span> {s.guardian}</p>
          <p className="text-sm flex items-center gap-1"><Phone size={14} className="text-gray-500" /> {s.phone}</p>
          <p className="text-sm flex items-center gap-1"><MapPin size={14} className="text-gray-500" /> {s.village}</p>
          <p className="text-sm">
            WhatsApp consent: <StatusPill status={s.consent ? "Present" : "Absent"} />{" "}
            <span className="text-xs text-gray-400">({s.consent ? "Yes" : "No"})</span>
          </p>
          <p className="text-sm">Fees: <StatusPill status={s.fee} /></p>
          <p className="text-sm">Status: <span className="font-semibold text-green-700">{s.active ? "Active" : "Inactive"}</span></p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <select
        aria-label="Filter by class"
        value={filterCls}
        onChange={(e) => setFilterCls(e.target.value)}
        className="w-full rounded-xl border-2 px-4 py-3 text-sm font-semibold bg-white"
        style={fieldStyle}
      >
        <option>All</option>
        {CLASSES.map((c) => <option key={c}>{c}</option>)}
      </select>
      {list.length === 0 && <p className="text-sm text-gray-500 px-1">No dummy students in this class yet.</p>}
      {list.map((s) => (
        <Card key={s.id} className="flex items-center justify-between">
          <button onClick={() => setSelected(s)} className="text-left flex-1">
            <p className="font-bold" style={{ color: COLORS.ink }}>{s.name}</p>
            <p className="text-xs text-gray-500">{s.adm} · {s.cls} {s.sec}</p>
          </button>
          {!s.consent && <span className="text-[10px] font-bold text-gray-400 border rounded px-2 py-1">No WA consent</span>}
        </Card>
      ))}
    </div>
  );
}
