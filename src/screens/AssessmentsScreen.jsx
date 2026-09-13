import { useState } from "react";
import { BackLink, Card, SampleBanner } from "../components/ui.jsx";
import { COLORS } from "../theme.js";
import { ASSESSMENTS } from "../data/dummy.js";

export default function AssessmentsScreen() {
  const [selected, setSelected] = useState(null);
  if (selected) {
    const a = selected;
    return (
      <div className="p-4 space-y-3">
      <SampleBanner />
        <BackLink onClick={() => setSelected(null)}>Back to assessments</BackLink>
        <Card>
          <p className="font-bold" style={{ color: COLORS.ink }}>{a.title}</p>
          <p className="text-xs text-gray-500 mb-3">{a.cls} {a.sec} · {a.date} · Max marks {a.max}</p>
          {Object.entries(a.marks).map(([name, mark]) => (
            <div key={name} className="flex items-center justify-between py-2 border-t" style={{ borderColor: "#EEE" }}>
              <span className="text-sm">{name}</span>
              <span className="font-bold text-sm" style={{ color: mark / a.max < 0.4 ? COLORS.alert : COLORS.header }}>{mark}/{a.max}</span>
            </div>
          ))}
        </Card>
      </div>
    );
  }
  return (
    <div className="p-4 space-y-3">
      <SampleBanner />
      {ASSESSMENTS.map((a) => (
        <button key={a.id} onClick={() => setSelected(a)} className="block w-full text-left">
          <Card>
            <p className="font-bold text-sm" style={{ color: COLORS.ink }}>{a.title}</p>
            <p className="text-xs text-gray-500">{a.cls} {a.sec} · {a.date}</p>
          </Card>
        </button>
      ))}
    </div>
  );
}
