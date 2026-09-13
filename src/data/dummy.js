// ---------- Dummy data (Phase 1 — no real records) ----------

export const ROLES = ["Principal", "Teacher", "Office Admin", "Technical Admin"];

export const CLASSES = ["Nursery", "LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8"];
export const SECTIONS = ["A", "B"];
export const SUBJECTS = ["English", "Kannada", "Mathematics", "EVS", "Science", "Social Science"];

export const STUDENTS = [
  { id: 1, name: "Ravi Kumar", adm: "SUPS-101", cls: "Class 4", sec: "A", guardian: "Lakshmi Kumar", phone: "9900011111", village: "Sandhong Cross", consent: true, active: true, fee: "Paid" },
  { id: 2, name: "Meena Shetty", adm: "SUPS-102", cls: "Class 4", sec: "A", guardian: "Suresh Shetty", phone: "9900022222", village: "Belur Road", consent: true, active: true, fee: "Pending" },
  { id: 3, name: "Abdul Rahman", adm: "SUPS-103", cls: "Class 4", sec: "A", guardian: "Fathima Rahman", phone: "9900033333", village: "Sandhong Cross", consent: false, active: true, fee: "Pending" },
  { id: 4, name: "Pooja Naik", adm: "SUPS-104", cls: "Class 4", sec: "B", guardian: "Ganesh Naik", phone: "9900044444", village: "Hosalli", consent: true, active: true, fee: "Paid" },
  { id: 5, name: "Kiran Gowda", adm: "SUPS-105", cls: "Class 3", sec: "A", guardian: "Manju Gowda", phone: "9900055555", village: "Sandhong Cross", consent: true, active: true, fee: "Paid" },
  { id: 6, name: "Sneha Patil", adm: "SUPS-106", cls: "Class 3", sec: "A", guardian: "Rekha Patil", phone: "9900066666", village: "Belur Road", consent: true, active: true, fee: "Pending" },
  { id: 7, name: "Yusuf Ali", adm: "SUPS-107", cls: "UKG", sec: "A", guardian: "Zainab Ali", phone: "9900077777", village: "Hosalli", consent: false, active: true, fee: "Paid" },
];

export const ATTENDANCE_TODAY = { 1: "Present", 2: "Present", 3: "Absent", 4: "Late", 5: "Present", 6: "Leave", 7: "Present" };

export const FOLLOWUP_LIST = [
  { id: 3, name: "Abdul Rahman", cls: "Class 4", sec: "A", absentLast7: 3, absentLast30: 5, dates: ["12 Sep", "13 Sep", "14 Sep"] },
  { id: 6, name: "Sneha Patil", cls: "Class 3", sec: "A", absentLast7: 1, absentLast30: 8, dates: ["03 Sep", "06 Sep", "09 Sep", "…"] },
];

export const CONTACT_LOG = [
  { id: 1, student: "Abdul Rahman", type: "Phone call", date: "13 Sep 2026", outcome: "Spoke to mother", note: "Fever, will return Monday" },
  { id: 2, student: "Sneha Patil", type: "WhatsApp opened", date: "10 Sep 2026", outcome: "No response", note: "Message sent, no reply yet" },
];

export const HOMEWORK = [
  { id: 1, cls: "Class 4", sec: "A", subject: "Mathematics", text: "Complete exercise 5.2, questions 1 to 10. Bring notebook tomorrow.", due: "16 Sep 2026" },
  { id: 2, cls: "Class 4", sec: "A", subject: "English", text: "Read chapter 3 aloud at home and write 5 new words with meanings.", due: "17 Sep 2026" },
  { id: 3, cls: "Class 3", sec: "A", subject: "EVS", text: "Draw and label three parts of a plant.", due: "16 Sep 2026" },
];

export const ASSESSMENTS = [
  { id: 1, title: "Unit Test 2 — Mathematics", cls: "Class 4", sec: "A", date: "05 Sep 2026", marks: { "Ravi Kumar": 42, "Meena Shetty": 47, "Abdul Rahman": 30, "Pooja Naik": 44 }, max: 50 },
  { id: 2, title: "Unit Test 2 — English", cls: "Class 4", sec: "A", date: "07 Sep 2026", marks: { "Ravi Kumar": 38, "Meena Shetty": 45, "Abdul Rahman": 28, "Pooja Naik": 40 }, max: 50 },
];

export const ISSUES = [
  { id: 1, category: "Electricity", desc: "Fan not working in Class 4 A", priority: "High", status: "Open", date: "12 Sep 2026" },
  { id: 2, category: "Toilet", desc: "Tap leaking near boys' toilet block", priority: "Medium", status: "In Progress", date: "10 Sep 2026" },
  { id: 3, category: "Furniture", desc: "Two broken desks in Class 3 A", priority: "Low", status: "Resolved", date: "02 Sep 2026" },
];

export const ISSUE_CATEGORIES = ["Water", "Toilet", "Electricity", "Classroom", "Furniture", "Kitchen", "Safety", "Other"];

export const TEACHERS = [
  { id: 1, name: "Anitha Rao", assignments: [{ cls: "Class 4", sec: "A", subject: "Mathematics" }, { cls: "Class 3", sec: "A", subject: "Mathematics" }] },
  { id: 2, name: "Vishwanath Hegde", assignments: [{ cls: "Class 4", sec: "A", subject: "English" }, { cls: "Class 4", sec: "B", subject: "English" }] },
  { id: 3, name: "Farida Sheikh", assignments: [{ cls: "Class 3", sec: "A", subject: "EVS" }, { cls: "UKG", sec: "A", subject: "EVS" }] },
];
