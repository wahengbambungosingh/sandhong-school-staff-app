import { Card, SampleBanner } from "../components/ui.jsx";
import { COLORS } from "../theme.js";
import { CLASSES, SECTIONS, SUBJECTS } from "../data/dummy.js";

function Chip({ children }) {
  return <span className="text-xs font-semibold rounded-full px-3 py-1.5" style={{ background: COLORS.card }}>{children}</span>;
}

export default function SchoolSetupScreen() {
  return (
    <div className="p-4 space-y-4">
      <SampleBanner />
      <Card>
        <p className="font-bold text-sm mb-1" style={{ color: COLORS.ink }}>Academic year</p>
        <p className="text-sm text-gray-600">2026–2027 (dummy)</p>
      </Card>
      <Card>
        <p className="font-bold text-sm mb-2" style={{ color: COLORS.ink }}>Classes</p>
        <div className="flex flex-wrap gap-2">{CLASSES.map((c) => <Chip key={c}>{c}</Chip>)}</div>
      </Card>
      <Card>
        <p className="font-bold text-sm mb-2" style={{ color: COLORS.ink }}>Sections</p>
        <div className="flex gap-2">{SECTIONS.map((s) => <Chip key={s}>Section {s}</Chip>)}</div>
      </Card>
      <Card>
        <p className="font-bold text-sm mb-2" style={{ color: COLORS.ink }}>Subjects</p>
        <div className="flex flex-wrap gap-2">{SUBJECTS.map((s) => <Chip key={s}>{s}</Chip>)}</div>
      </Card>
      <p className="text-xs text-gray-500 px-1">Editing school setup is added in Phase 2. This screen shows how the data will look.</p>
    </div>
  );
}
