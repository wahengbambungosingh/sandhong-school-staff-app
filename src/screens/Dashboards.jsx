import {
  AlertTriangle, BookOpen, CalendarCheck, ClipboardList, FileText, IndianRupee,
  MessageCircle, Settings, UserCog, Users, Wrench,
} from "lucide-react";
import { BigButton, Card, Tile } from "../components/ui.jsx";
import { COLORS } from "../theme.js";
import { ATTENDANCE_TODAY, FOLLOWUP_LIST, ISSUES, STUDENTS, TEACHERS } from "../data/dummy.js";

function Stat({ label, value, color }) {
  return (
    <Card>
      <p className="text-xs text-gray-500 font-semibold">{label}</p>
      <p className="text-3xl font-bold" style={{ color }}>{value}</p>
    </Card>
  );
}

export function PrincipalDashboard({ nav }) {
  const total = STUDENTS.length;
  const presentToday = Object.values(ATTENDANCE_TODAY).filter((v) => v === "Present").length;
  const openIssues = ISSUES.filter((i) => i.status !== "Resolved").length;
  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Total students" value={total} color={COLORS.header} />
        <Stat label="Present today" value={`${presentToday}/${total}`} color={COLORS.header} />
        <Stat label="Follow-up needed" value={FOLLOWUP_LIST.length} color={COLORS.alert} />
        <Stat label="Open issues" value={openIssues} color={COLORS.alert} />
      </div>
      <p className="font-bold text-sm px-1" style={{ color: COLORS.ink }}>School management</p>
      <div className="grid grid-cols-2 gap-3">
        <Tile icon={Users} label="Student Register" onClick={() => nav("students")} />
        <Tile icon={UserCog} label="Teacher Assignments" onClick={() => nav("assignments")} />
        <Tile icon={Settings} label="School Setup" onClick={() => nav("setup")} />
        <Tile icon={CalendarCheck} label="Daily Attendance" onClick={() => nav("attendance")} />
        <Tile icon={AlertTriangle} label="Follow-up Needed" onClick={() => nav("followup")} badge={FOLLOWUP_LIST.length} />
        <Tile icon={MessageCircle} label="Parent Contact Log" onClick={() => nav("contact")} />
        <Tile icon={BookOpen} label="Homework" onClick={() => nav("homework")} />
        <Tile icon={ClipboardList} label="Assessments & Marks" onClick={() => nav("assessments")} />
        <Tile icon={Wrench} label="School Issues" onClick={() => nav("issues")} badge={openIssues} />
        <Tile icon={IndianRupee} label="Fees Status" onClick={() => nav("fees")} />
        <Tile icon={FileText} label="Reports" onClick={() => nav("reports")} />
      </div>
    </div>
  );
}

export function TeacherDashboard({ nav }) {
  const myClasses = TEACHERS[0].assignments;
  return (
    <div className="p-4 space-y-4">
      <BigButton icon={CalendarCheck} onClick={() => nav("attendance")}>Mark Attendance</BigButton>
      <Card>
        <p className="font-bold text-sm mb-2" style={{ color: COLORS.ink }}>My classes today</p>
        {myClasses.map((a, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-t first:border-t-0" style={{ borderColor: "#EEE" }}>
            <span className="text-sm">{a.cls} {a.sec} · {a.subject}</span>
          </div>
        ))}
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Tile icon={AlertTriangle} label="Follow-up Needed" onClick={() => nav("followup")} badge={FOLLOWUP_LIST.length} />
        <Tile icon={MessageCircle} label="Parent Contact Log" onClick={() => nav("contact")} />
        <Tile icon={BookOpen} label="Set Homework" onClick={() => nav("homework")} />
        <Tile icon={ClipboardList} label="Assessments & Marks" onClick={() => nav("assessments")} />
        <Tile icon={Users} label="Student Register" onClick={() => nav("students")} />
        <Tile icon={Wrench} label="Report an Issue" onClick={() => nav("issues")} />
      </div>
    </div>
  );
}
