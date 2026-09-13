import { Printer } from "lucide-react";
import { BigButton, Card } from "../components/ui.jsx";
import { COLORS } from "../theme.js";
import { ATTENDANCE_TODAY, FOLLOWUP_LIST, ISSUES, STUDENTS } from "../data/dummy.js";

export default function ReportsScreen() {
  const total = STUDENTS.length;
  const presentToday = Object.values(ATTENDANCE_TODAY).filter((v) => v === "Present").length;
  return (
    <div className="p-4 space-y-3">
      <div id="print-area">
        <Card>
          <p className="font-bold mb-2" style={{ color: COLORS.ink }}>Attendance summary — today</p>
          <p className="text-sm">Present: {presentToday} of {total} ({Math.round((presentToday / total) * 100)}%)</p>
        </Card>
        <Card className="mt-3">
          <p className="font-bold mb-2" style={{ color: COLORS.ink }}>Students needing follow-up</p>
          {FOLLOWUP_LIST.map((f) => (
            <p key={f.id} className="text-sm py-1">{f.name} — {f.cls} {f.sec} — {f.absentLast7} absences (7 days)</p>
          ))}
        </Card>
        <Card className="mt-3">
          <p className="font-bold mb-2" style={{ color: COLORS.ink }}>School issues by status</p>
          {["Open", "In Progress", "Resolved"].map((st) => (
            <p key={st} className="text-sm py-1">{st}: {ISSUES.filter((i) => i.status === st).length}</p>
          ))}
        </Card>
      </div>
      <BigButton icon={Printer} onClick={() => window.print()}>Print this report</BigButton>
      <p className="text-xs text-gray-500 px-1">More report types are added in later phases.</p>
    </div>
  );
}
