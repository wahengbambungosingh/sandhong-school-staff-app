// Demo data source: everything lives in memory and resets on reload.
import { ASSESSMENTS, ATTENDANCE_TODAY, CLASSES, CONTACT_LOG, FOLLOWUP_LIST, HOMEWORK, ISSUES, SECTIONS, STUDENTS, SUBJECTS, TEACHERS } from "../data/dummy.js";
import { formatDate, todayISO } from "./shared.js";

let user = null;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn(user));
let nextId = 100;
const nid = () => String(nextId++);

const school = { id: "demo", name: "Sandhong Upper Primary School", joinCode: "DEMO1234", academicYear: "2026–2027", classes: [...CLASSES], sections: [...SECTIONS], subjects: [...SUBJECTS] };
const students = STUDENTS.map((s) => ({ ...s, id: String(s.id) }));
const attendance = { [todayISO()]: Object.fromEntries(Object.entries(ATTENDANCE_TODAY).map(([k, v]) => [String(k), v])) };
const issues = ISSUES.map((i) => ({ ...i, id: String(i.id), photoUrl: null }));
const staff = [
  { id: "demo", fullName: "", email: "you@example.com", role: "principal" },
  ...TEACHERS.map((t) => ({ id: `t${t.id}`, fullName: t.name, email: `${t.name.split(" ")[0].toLowerCase()}@example.com`, role: "teacher" })),
];
const assignments = TEACHERS.flatMap((t) => t.assignments.map((a) => ({ id: nid(), profileId: `t${t.id}`, teacherName: t.name, cls: a.cls, sec: a.sec, subject: a.subject })));
const nameToId = (name) => students.find((s) => s.name === name)?.id;
const contactLogs = CONTACT_LOG.map((c) => ({ id: String(c.id), studentId: nameToId(c.student), studentName: c.student, type: c.type, outcome: c.outcome, note: c.note, date: c.date, by: "Anitha Rao" }));
const homework = HOMEWORK.map((h) => ({ id: String(h.id), cls: h.cls, sec: h.sec, subject: h.subject, text: h.text, due: h.due, by: "Anitha Rao", attachment: null }));
const assessments = ASSESSMENTS.map((a) => ({ id: String(a.id), title: a.title, cls: a.cls, sec: a.sec, subject: a.title.split("— ")[1] || "", date: a.date, max: a.max }));
const marks = Object.fromEntries(ASSESSMENTS.map((a) => [String(a.id), Object.fromEntries(Object.entries(a.marks).map(([name, m]) => [nameToId(name), String(m)]))]));

export const demoApi = {
  mode: "demo",

  async getUser() { return user; },
  onAuthChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  async refreshUser() { notify(); return user; },
  async signInDemo(role) {
    user = { id: "demo", fullName: "", email: "you@example.com", role, school };
    staff[0].role = role;
    notify();
    return user;
  },
  async resetPassword() {},
  async updatePassword() {},
  async signOut() { user = null; notify(); },

  async updateSchoolSettings({ academicYear, classes, sections, subjects }) {
    Object.assign(school, { academicYear, classes, sections, subjects });
    notify();
  },

  async listStaff() { return staff.map((s) => ({ ...s, fullName: s.fullName || "Demo Principal" })); },
  async setStaffRole(id, role) { const s = staff.find((x) => x.id === id); if (s) s.role = role; },
  async removeStaff(id) { const i = staff.findIndex((x) => x.id === id); if (i > 0) staff.splice(i, 1); },
  async regenerateJoinCode() { school.joinCode = Math.random().toString(36).slice(2, 10).toUpperCase(); notify(); return school.joinCode; },

  async listAssignments() { return assignments.slice(); },
  async addAssignment({ profileId, cls, sec, subject }) {
    const t = staff.find((s) => s.id === profileId);
    assignments.push({ id: nid(), profileId, teacherName: t?.fullName || "Demo Principal", cls, sec, subject });
  },
  async removeAssignment(id) { const i = assignments.findIndex((a) => a.id === id); if (i >= 0) assignments.splice(i, 1); },
  async listMyAssignments() { return TEACHERS[0].assignments.map((a, i) => ({ id: String(i), ...a })); },

  async listStudents() { return students.slice(); },
  async addStudent(fields) { const s = { ...fields, id: nid() }; students.push(s); return s; },
  async updateStudent(id, fields) {
    const i = students.findIndex((s) => s.id === id);
    if (i === -1) throw new Error("Student not found.");
    students[i] = { ...students[i], ...fields };
    return students[i];
  },

  async getAttendance(date) { return { ...(attendance[date] || {}) }; },
  async saveAttendance(date, entries) { attendance[date] = { ...(attendance[date] || {}), ...entries }; },
  async listFollowup() {
    const flagged = FOLLOWUP_LIST.map((f) => ({
      id: String(f.id), name: f.name, cls: f.cls, sec: f.sec,
      absentLast7: f.absentLast7, absentLast30: f.absentLast30, dates: f.dates, needsFollowup: true,
    }));
    const today = attendance[todayISO()] || {};
    const others = students
      .filter((s) => s.active && today[s.id] === "Absent" && !flagged.some((f) => f.id === s.id))
      .map((s) => ({ id: s.id, name: s.name, cls: s.cls, sec: s.sec, absentLast7: 1, absentLast30: 1, dates: [formatDate(todayISO())], needsFollowup: false }));
    return [...flagged, ...others];
  },

  async listContactLogs(studentId) { return contactLogs.filter((c) => !studentId || c.studentId === studentId); },
  async addContactLog({ studentId, type, outcome, note }) {
    const s = students.find((x) => x.id === studentId);
    contactLogs.unshift({ id: nid(), studentId, studentName: s?.name || "", type, outcome, note, date: formatDate(todayISO()), by: "You" });
  },

  async listHomework() { return homework.slice(); },
  async addHomework({ cls, sec, subject, text, due, file }) {
    homework.unshift({ id: nid(), cls, sec, subject, text, due: due ? formatDate(due) : "", by: "You", attachment: file ? { url: file.url, name: file.name, type: file.type } : null });
  },
  async getHomeworkShareUrl(h) { return h.attachment?.url || null; },
  async removeHomework(id) { const i = homework.findIndex((h) => h.id === id); if (i >= 0) homework.splice(i, 1); },

  async listAssessments() { return assessments.slice(); },
  async addAssessment(a) { const row = { id: nid(), ...a, date: formatDate(a.date), max: Number(a.max) }; assessments.unshift(row); marks[row.id] = {}; return row; },
  async getMarks(id) { return { ...(marks[id] || {}) }; },
  async saveMarks(id, entries) { marks[id] = { ...(marks[id] || {}), ...entries }; },

  async listIssues() { return issues.slice(); },
  async addIssue({ category, desc, priority, photo }) {
    issues.unshift({ id: nid(), category, desc: desc.trim(), priority, status: "Open", date: formatDate(todayISO()), photoUrl: photo ? URL.createObjectURL(photo) : null });
  },
  async updateIssueStatus(id, status) { const i = issues.find((x) => x.id === id); if (i) i.status = status; },

  async getStats() {
    const today = attendance[todayISO()] || {};
    return {
      total: students.filter((s) => s.active).length,
      presentToday: Object.values(today).filter((v) => v === "Present").length,
      followup: FOLLOWUP_LIST.length,
      openIssues: issues.filter((i) => i.status !== "Resolved").length,
    };
  },
};
