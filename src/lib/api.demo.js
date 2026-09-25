// Demo data source: everything lives in memory and resets on reload.
import { ASSESSMENTS, ATTENDANCE_TODAY, CLASSES, CONTACT_LOG, FOLLOWUP_LIST, HOMEWORK, ISSUES, SECTIONS, STUDENTS, SUBJECTS, TEACHERS } from "../data/dummy.js";
import { formatDate, todayISO } from "./shared.js";

let user = null;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn(user));
let nextId = 100;
const nid = () => String(nextId++);

const school = { id: "demo", name: "Sandhong Upper Primary School", joinCode: "DEMO1234", academicYear: "2026–2027", classes: [...CLASSES], sections: [...SECTIONS], subjects: [...SUBJECTS] };
const students = STUDENTS.map((s) => ({ ...s, id: String(s.id), parentCode: `KID${String(s.id).padStart(5, "0")}` }));
const corrections = [];
const enquiries = [{ id: "e1", childName: "Arjun Rao", childAge: "4", classWanted: "LKG", parentName: "Sunita Rao", phone: "9900088888", note: "Moving to Sandhong in June", status: "New", date: "12 Sep 2026" }];
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
    user = { kind: "staff", id: "demo", fullName: "", email: "you@example.com", role, school };
    staff[0].role = role;
    notify();
    return user;
  },
  async signInParent(phone, code) {
    const s = students.find((x) => x.parentCode === code.toUpperCase().trim());
    if (!s) throw new Error("That child code was not found. In the demo, use KID00001 or KID00005.");
    const digits = phone.replace(/\D/g, "").slice(-10);
    if (digits.length < 10) throw new Error("Please enter a 10-digit mobile number.");
    const child = { ...s, schoolId: "demo", schoolName: school.name };
    user = user?.kind === "parent" ? { ...user, children: [...user.children.filter((c) => c.id !== s.id), child] } : { kind: "parent", id: "parent-demo", children: [child] };
    notify();
  },
  async addChild(phone, code) { return this.signInParent(phone, code); },
  async removeChild(id) { user = { ...user, children: user.children.filter((c) => c.id !== id) }; notify(); },
  async getChildAttendance(studentId, from, to) {
    const out = {};
    Object.entries(attendance).forEach(([d, m]) => { if (d >= from && d <= to && m[studentId]) out[d] = m[studentId]; });
    // a little history so the month view has something to show
    const base = new Date(from + "T00:00:00");
    for (let i = 1; i <= 12; i++) { const d = new Date(base); d.setDate(d.getDate() + i); const iso = d.toISOString().slice(0, 10); if (iso < todayISO() && !out[iso] && d.getDay() !== 0) out[iso] = i % 5 === 0 ? "Absent" : "Present"; }
    return out;
  },
  async listChildHomework(child) { return homework.filter((h) => h.cls === child.cls && h.sec === child.sec); },
  async listChildMarks(child) {
    return assessments.filter((a) => a.cls === child.cls && a.sec === child.sec).map((a) => ({ id: a.id, title: a.title, subject: a.subject, date: a.date, max: a.max, mark: marks[a.id]?.[child.id] == null ? null : Number(marks[a.id][child.id]) }));
  },
  async submitCorrection(child, message) { corrections.unshift({ id: nid(), studentId: child.id, studentName: child.name, cls: child.cls, sec: child.sec, message, status: "New", date: formatDate(todayISO()) }); },
  async listMyCorrections() { return corrections.slice(); },
  async getEnquirySchoolName() { return school.name; },
  async submitEnquiry(schoolId, f) { enquiries.unshift({ id: nid(), childName: f.childName, childAge: f.childAge || "", classWanted: f.classWanted || "", parentName: f.parentName, phone: f.phone, note: f.note || "", status: "New", date: formatDate(todayISO()) }); },
  async regenerateParentCode(id) { const s = students.find((x) => x.id === id); s.parentCode = "KID" + Math.random().toString(36).slice(2, 7).toUpperCase(); return s.parentCode; },
  async listCorrections() { return corrections.slice(); },
  async setCorrectionStatus(id, status) { const c = corrections.find((x) => x.id === id); if (c) c.status = status; },
  async listEnquiries() { return enquiries.slice(); },
  async setEnquiryStatus(id, status) { const e = enquiries.find((x) => x.id === id); if (e) e.status = status; },
  async resetPassword() {},
  async refreshUserSilently() {},
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
