// Demo data source: everything lives in memory and resets on reload.
import { ATTENDANCE_TODAY, FOLLOWUP_LIST, ISSUES, STUDENTS } from "../data/dummy.js";
import { formatDate, todayISO } from "./shared.js";

let user = null;
const listeners = new Set();
const students = STUDENTS.map((s) => ({ ...s, id: String(s.id) }));
const attendance = { [todayISO()]: Object.fromEntries(Object.entries(ATTENDANCE_TODAY).map(([k, v]) => [String(k), v])) };
let nextId = 100;
const issues = ISSUES.map((i) => ({ ...i, id: String(i.id), photoUrl: null }));

const notify = () => listeners.forEach((fn) => fn(user));

export const demoApi = {
  mode: "demo",

  async getUser() { return user; },
  onAuthChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  async signInDemo(role) {
    user = { id: "demo", fullName: "", role, school: { id: "demo", name: "Sandhong Upper Primary School", joinCode: "DEMO1234" } };
    notify();
    return user;
  },
  async signOut() { user = null; notify(); },

  async listStudents() { return students.slice(); },
  async addStudent(fields) {
    const s = { ...fields, id: String(nextId++) };
    students.push(s);
    return s;
  },
  async updateStudent(id, fields) {
    const i = students.findIndex((s) => s.id === id);
    if (i === -1) throw new Error("Student not found.");
    students[i] = { ...students[i], ...fields };
    return students[i];
  },

  async getAttendance(date) { return { ...(attendance[date] || {}) }; },
  async saveAttendance(date, entries) {
    attendance[date] = { ...(attendance[date] || {}), ...entries };
  },

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

  async listIssues() { return issues.slice(); },
  async addIssue({ category, desc, priority, photo }) {
    issues.unshift({
      id: String(nextId++), category, desc: desc.trim(), priority, status: "Open",
      date: formatDate(todayISO()), photoUrl: photo ? URL.createObjectURL(photo) : null,
    });
  },
  async updateIssueStatus(id, status) {
    const i = issues.find((x) => x.id === id);
    if (i) i.status = status;
  },

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
