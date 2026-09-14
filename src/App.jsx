import { useEffect, useRef, useState } from "react";
import { LogOut } from "lucide-react";
import { Loading, TopBar } from "./components/ui.jsx";
import { COLORS } from "./theme.js";
import { api, IS_LIVE } from "./lib/api.js";
import { MANAGEMENT_ROLES, ROLE_LABELS } from "./lib/shared.js";
import LoginScreen from "./screens/LoginScreen.jsx";
import OnboardingScreen from "./screens/OnboardingScreen.jsx";
import SetPasswordScreen from "./screens/SetPasswordScreen.jsx";
import StaffScreen from "./screens/StaffScreen.jsx";
import { PrincipalDashboard, TeacherDashboard } from "./screens/Dashboards.jsx";
import StudentRegisterScreen from "./screens/StudentRegisterScreen.jsx";
import SchoolSetupScreen from "./screens/SchoolSetupScreen.jsx";
import TeacherAssignmentsScreen from "./screens/TeacherAssignmentsScreen.jsx";
import AttendanceScreen from "./screens/AttendanceScreen.jsx";
import FollowupScreen from "./screens/FollowupScreen.jsx";
import ContactLogScreen from "./screens/ContactLogScreen.jsx";
import HomeworkScreen from "./screens/HomeworkScreen.jsx";
import AssessmentsScreen from "./screens/AssessmentsScreen.jsx";
import IssuesScreen from "./screens/IssuesScreen.jsx";
import FeesScreen from "./screens/FeesScreen.jsx";
import ReportsScreen from "./screens/ReportsScreen.jsx";

const SCREENS = {
  students: { title: "Student Register", Component: StudentRegisterScreen },
  staff: { title: "Staff", Component: StaffScreen },
  setup: { title: "School Setup", Component: SchoolSetupScreen },
  assignments: { title: "Teacher Assignments", Component: TeacherAssignmentsScreen },
  attendance: { title: "Daily Attendance", Component: AttendanceScreen },
  followup: { title: "Follow-up Needed", Component: FollowupScreen },
  contact: { title: "Parent Contact Log", Component: ContactLogScreen },
  homework: { title: "Homework / Classwork", Component: HomeworkScreen },
  assessments: { title: "Assessments & Marks", Component: AssessmentsScreen },
  issues: { title: "School Issues", Component: IssuesScreen },
  fees: { title: "Fees Status", Component: FeesScreen },
  reports: { title: "Reports", Component: ReportsScreen },
};

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!IS_LIVE);
  const [screen, setScreen] = useState("dashboard");
  const lastUserId = useRef(null);

  useEffect(() => {
    let active = true;
    api.getUser().then((u) => { if (active) { lastUserId.current = u?.id || null; setUser(u); setReady(true); } }).catch(() => { if (active) setReady(true); });
    const unsubscribe = api.onAuthChange((u) => {
      if (!active) return;
      setUser(u);
      // Go home only when someone signs in or out, not when their details refresh.
      const id = u?.id || null;
      if (id !== lastUserId.current) { lastUserId.current = id; setScreen("dashboard"); }
    });
    return () => { active = false; unsubscribe(); };
  }, []);

  if (!ready) {
    return <div className="min-h-screen max-w-md mx-auto" style={{ background: COLORS.bg }}><Loading label="Starting…" /></div>;
  }
  if (!user) return <LoginScreen />;
  if (user.needsNewPassword) return <SetPasswordScreen email={user.email} />;
  if (user.needsSchool) return <OnboardingScreen email={user.email} />;

  const nav = (s) => { setScreen(s); window.scrollTo(0, 0); };
  const goHome = () => nav("dashboard");
  const roleLabel = ROLE_LABELS[user.role] || user.role;
  const firstName = user.fullName ? user.fullName.split(" ")[0] : roleLabel;

  const current = SCREENS[screen];
  let body;
  if (current) {
    const { Component } = current;
    body = <Component nav={nav} user={user} />;
  } else {
    body = MANAGEMENT_ROLES.includes(user.role) ? <PrincipalDashboard nav={nav} user={user} /> : <TeacherDashboard nav={nav} user={user} />;
  }

  return (
    <div className="min-h-screen max-w-md mx-auto" style={{ background: COLORS.bg }}>
      <TopBar
        title={current ? current.title : `Hello, ${firstName}`}
        onBack={current ? goHome : null}
        role={roleLabel}
        schoolName={user.school?.name}
      />
      {body}
      <div className="p-4 pt-0 print:hidden">
        <button onClick={() => api.signOut()} className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-gray-400 py-3">
          <LogOut size={14} /> {IS_LIVE ? "Sign out" : "Log out of demo"}
        </button>
      </div>
    </div>
  );
}
