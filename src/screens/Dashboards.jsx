import {
  AlertTriangle, BookOpen, CalendarCheck, ClipboardList, Copy, FileText, IndianRupee,
  MessageCircle, Settings, UserCog, Users, Wrench,
} from "lucide-react";
import { BigButton, Card, ErrorNote, Tile } from "../components/ui.jsx";
import { COLORS } from "../theme.js";
import { CLASSES, TEACHERS } from "../data/dummy.js";
import { api, IS_LIVE } from "../lib/api.js";
import { useAsync } from "../lib/useAsync.js";
import { errorMessage } from "../lib/shared.js";

function Stat({ label, value, color }) {
  return (
    <Card>
      <p className="text-xs text-gray-500 font-semibold">{label}</p>
      <p className="text-3xl font-bold" style={{ color }}>{value ?? "…"}</p>
    </Card>
  );
}

function JoinCodeCard({ user }) {
  if (!IS_LIVE || user.role !== "principal" || !user.school?.joinCode) return null;
  const code = user.school.joinCode;
  return (
    <Card className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs text-gray-500 font-semibold">Staff join code</p>
        <p className="text-lg font-bold tracking-widest" style={{ color: COLORS.header }}>{code}</p>
        <p className="text-[11px] text-gray-400">Share with teachers so they can join your school.</p>
      </div>
      <button onClick={() => navigator.clipboard?.writeText(code)} className="flex items-center gap-1 text-xs font-bold rounded-xl px-3 py-2" style={{ background: COLORS.card, color: COLORS.header }} aria-label="Copy join code">
        <Copy size={14} /> Copy
      </button>
    </Card>
  );
}

export function PrincipalDashboard({ nav, user }) {
  const { data, error, reload } = useAsync(() => api.getStats());
  return (
    <div className="p-4 space-y-4">
      <ErrorNote message={error && errorMessage(error)} onRetry={reload} />
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Total students" value={data?.total} color={COLORS.header} />
        <Stat label="Present today" value={data ? `${data.presentToday}/${data.total}` : undefined} color={COLORS.header} />
        <Stat label="Follow-up needed" value={data?.followup} color={COLORS.alert} />
        <Stat label="Open issues" value={data?.openIssues} color={COLORS.alert} />
      </div>
      <JoinCodeCard user={user} />
      <p className="font-bold text-sm px-1" style={{ color: COLORS.ink }}>School management</p>
      <div className="grid grid-cols-2 gap-3">
        <Tile icon={Users} label="Student Register" onClick={() => nav("students")} />
        <Tile icon={CalendarCheck} label="Daily Attendance" onClick={() => nav("attendance")} />
        <Tile icon={AlertTriangle} label="Follow-up Needed" onClick={() => nav("followup")} badge={data?.followup || undefined} />
        <Tile icon={IndianRupee} label="Fees Status" onClick={() => nav("fees")} />
        <Tile icon={UserCog} label="Teacher Assignments" onClick={() => nav("assignments")} />
        <Tile icon={Settings} label="School Setup" onClick={() => nav("setup")} />
        <Tile icon={MessageCircle} label="Parent Contact Log" onClick={() => nav("contact")} />
        <Tile icon={BookOpen} label="Homework" onClick={() => nav("homework")} />
        <Tile icon={ClipboardList} label="Assessments & Marks" onClick={() => nav("assessments")} />
        <Tile icon={Wrench} label="School Issues" onClick={() => nav("issues")} badge={data?.openIssues || undefined} />
        <Tile icon={FileText} label="Reports" onClick={() => nav("reports")} />
      </div>
    </div>
  );
}

export function TeacherDashboard({ nav }) {
  const stats = useAsync(() => api.getStats());
  const students = useAsync(() => api.listStudents());
  const liveClasses = [...new Set((students.data || []).filter((s) => s.active).map((s) => `${s.cls} ${s.sec}`))]
    .sort((a, b) => CLASSES.indexOf(a.split(" ").slice(0, -1).join(" ")) - CLASSES.indexOf(b.split(" ").slice(0, -1).join(" ")) || a.localeCompare(b));
  return (
    <div className="p-4 space-y-4">
      <BigButton icon={CalendarCheck} onClick={() => nav("attendance")}>Mark Attendance</BigButton>
      <Card>
        <p className="font-bold text-sm mb-2" style={{ color: COLORS.ink }}>{IS_LIVE ? "Classes with students" : "My classes today"}</p>
        {IS_LIVE
          ? (liveClasses.length ? liveClasses : ["No students added yet"]).map((c) => (
              <div key={c} className="py-2 border-t first:border-t-0 text-sm" style={{ borderColor: "#EEE" }}>{c}</div>
            ))
          : TEACHERS[0].assignments.map((a, i) => (
              <div key={i} className="py-2 border-t first:border-t-0 text-sm" style={{ borderColor: "#EEE" }}>{a.cls} {a.sec} · {a.subject}</div>
            ))}
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Tile icon={AlertTriangle} label="Follow-up Needed" onClick={() => nav("followup")} badge={stats.data?.followup || undefined} />
        <Tile icon={Users} label="Student Register" onClick={() => nav("students")} />
        <Tile icon={MessageCircle} label="Parent Contact Log" onClick={() => nav("contact")} />
        <Tile icon={BookOpen} label="Set Homework" onClick={() => nav("homework")} />
        <Tile icon={ClipboardList} label="Assessments & Marks" onClick={() => nav("assessments")} />
        <Tile icon={Wrench} label="Report an Issue" onClick={() => nav("issues")} />
      </div>
    </div>
  );
}
