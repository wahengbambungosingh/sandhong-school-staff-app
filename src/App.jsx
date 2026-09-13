import { useState } from "react";
import { LogOut } from "lucide-react";
import { TopBar } from "./components/ui.jsx";
import { COLORS } from "./theme.js";
import LoginScreen from "./screens/LoginScreen.jsx";
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

const MANAGEMENT_ROLES = ["Principal", "Office Admin", "Technical Admin"];

export default function App() {
  const [role, setRole] = useState(null);
  const [screen, setScreen] = useState("dashboard");

  if (!role) {
    return (
      <LoginScreen
        onLogin={(r) => {
          setRole(r);
          setScreen("dashboard");
        }}
      />
    );
  }

  const nav = (s) => {
    setScreen(s);
    window.scrollTo(0, 0);
  };
  const goHome = () => nav("dashboard");

  const current = SCREENS[screen];
  let body;
  if (current) {
    const { Component } = current;
    body = <Component nav={nav} />;
  } else {
    body = MANAGEMENT_ROLES.includes(role) ? <PrincipalDashboard nav={nav} /> : <TeacherDashboard nav={nav} />;
  }

  return (
    <div className="min-h-screen max-w-md mx-auto" style={{ background: COLORS.bg }}>
      <TopBar
        title={current ? current.title : `Hello, ${role}`}
        onBack={current ? goHome : null}
        role={role}
      />
      {body}
      <div className="p-4 pt-0 print:hidden">
        <button onClick={() => setRole(null)} className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-gray-400 py-3">
          <LogOut size={14} /> Log out of demo
        </button>
      </div>
    </div>
  );
}
