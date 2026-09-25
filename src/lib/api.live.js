// Live data source backed by Supabase. Row-level security in the database
// restricts every query to the signed-in staff member's own school.
import { supabase } from "./supabase.js";
import { formatDate } from "./shared.js";

const BUCKET = "issue-photos";
const HW_BUCKET = "homework-files";
let cachedUser = null;
let recoveryPending = false;
const userListeners = new Set();
const notify = () => userListeners.forEach((fn) => fn(cachedUser));

function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

const rowToStudent = (r) => ({
  id: r.id, name: r.name, adm: r.admission_no, cls: r.class, sec: r.section,
  guardian: r.guardian_name || "", phone: r.guardian_phone || "", village: r.village || "",
  consent: r.whatsapp_consent, active: r.active, fee: r.fee_status,
});
const studentToRow = (s) => ({
  name: s.name.trim(), admission_no: s.adm.trim(), class: s.cls, section: s.sec,
  guardian_name: s.guardian?.trim() || null, guardian_phone: s.phone?.trim() || null, village: s.village?.trim() || null,
  whatsapp_consent: Boolean(s.consent), active: s.active !== false, fee_status: s.fee || "Pending",
});

async function loadUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { cachedUser = null; return null; }
  const profile = unwrap(
    await supabase
      .from("profiles")
      .select("id, full_name, role, email, school:schools(id, name, join_code, academic_year, classes, sections, subjects)")
      .eq("id", session.user.id)
      .maybeSingle()
  );
  const sc = profile?.school;
  cachedUser = {
    id: session.user.id,
    email: session.user.email,
    fullName: profile?.full_name || "",
    role: profile?.role || null,
    school: sc ? {
      id: sc.id, name: sc.name, joinCode: sc.join_code, academicYear: sc.academic_year,
      classes: sc.classes || [], sections: sc.sections || [], subjects: sc.subjects || [],
    } : null,
    needsSchool: !profile,
    needsNewPassword: recoveryPending,
  };
  return cachedUser;
}

const schoolId = () => cachedUser.school.id;

export const liveApi = {
  mode: "live",

  // ----- auth -----
  getUser: loadUser,
  onAuthChange(fn) {
    userListeners.add(fn);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") recoveryPending = true;
      loadUser().then(notify).catch(() => { cachedUser = null; notify(); });
    });
    return () => { userListeners.delete(fn); subscription.unsubscribe(); };
  },
  async refreshUser() { await loadUser(); notify(); return cachedUser; },
  async signIn(email, password) {
    unwrap(await supabase.auth.signInWithPassword({ email: email.trim(), password }));
    return loadUser();
  },
  async signUp(email, password) {
    const emailRedirectTo = window.location.origin + window.location.pathname;
    const data = unwrap(await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo } }));
    return { needsEmailConfirmation: !data.session };
  },
  async resetPassword(email) {
    const redirectTo = window.location.origin + window.location.pathname;
    unwrap(await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo }));
  },
  async updatePassword(password) {
    unwrap(await supabase.auth.updateUser({ password }));
    recoveryPending = false;
    await loadUser(); notify();
  },
  async signOut() { unwrap(await supabase.auth.signOut()); cachedUser = null; recoveryPending = false; },
  async createSchool(schoolName, fullName) {
    unwrap(await supabase.rpc("create_school", { school_name: schoolName, full_name: fullName }));
    await loadUser(); notify();
  },
  async joinSchool(code, fullName) {
    unwrap(await supabase.rpc("join_school", { code, full_name: fullName }));
    await loadUser(); notify();
  },

  // ----- school setup -----
  async updateSchoolSettings({ academicYear, classes, sections, subjects }) {
    unwrap(await supabase.from("schools").update({ academic_year: academicYear, classes, sections, subjects }).eq("id", schoolId()));
    await loadUser(); notify();
  },

  // ----- staff -----
  async listStaff() {
    const rows = unwrap(await supabase.from("profiles").select("id, full_name, email, role").order("full_name"));
    return rows.map((r) => ({ id: r.id, fullName: r.full_name, email: r.email || "", role: r.role }));
  },
  async setStaffRole(id, role) { unwrap(await supabase.rpc("set_staff_role", { target: id, new_role: role })); },
  async removeStaff(id) { unwrap(await supabase.rpc("remove_staff", { target: id })); },
  async regenerateJoinCode() {
    const code = unwrap(await supabase.rpc("regenerate_join_code"));
    await loadUser(); notify();
    return code;
  },

  // ----- teacher assignments -----
  async listAssignments() {
    const rows = unwrap(await supabase.from("teacher_assignments").select("id, profile_id, class, section, subject, teacher:profiles(full_name)").order("class").order("section"));
    return rows.map((r) => ({ id: r.id, profileId: r.profile_id, teacherName: r.teacher?.full_name || "Removed staff", cls: r.class, sec: r.section, subject: r.subject }));
  },
  async addAssignment({ profileId, cls, sec, subject }) {
    unwrap(await supabase.from("teacher_assignments").insert({ school_id: schoolId(), profile_id: profileId, class: cls, section: sec, subject }));
  },
  async removeAssignment(id) { unwrap(await supabase.from("teacher_assignments").delete().eq("id", id)); },
  async listMyAssignments() {
    const rows = unwrap(await supabase.from("teacher_assignments").select("id, class, section, subject").eq("profile_id", cachedUser.id).order("class"));
    return rows.map((r) => ({ id: r.id, cls: r.class, sec: r.section, subject: r.subject }));
  },

  // ----- students -----
  async listStudents() {
    const rows = unwrap(await supabase.from("students").select("*").order("name"));
    return rows.map(rowToStudent);
  },
  async addStudent(fields) {
    const row = unwrap(await supabase.from("students").insert({ ...studentToRow(fields), school_id: schoolId() }).select().single());
    return rowToStudent(row);
  },
  async updateStudent(id, fields) {
    const row = unwrap(await supabase.from("students").update(studentToRow(fields)).eq("id", id).select().single());
    return rowToStudent(row);
  },

  // ----- attendance -----
  async getAttendance(date) {
    const rows = unwrap(await supabase.from("attendance").select("student_id, status").eq("date", date));
    return Object.fromEntries(rows.map((r) => [r.student_id, r.status]));
  },
  async saveAttendance(date, entries) {
    const rows = Object.entries(entries).map(([student_id, status]) => ({
      school_id: schoolId(), student_id, date, status, marked_by: cachedUser.id, updated_at: new Date().toISOString(),
    }));
    if (rows.length === 0) return;
    unwrap(await supabase.from("attendance").upsert(rows, { onConflict: "student_id,date" }));
  },
  async listFollowup() {
    const rows = unwrap(
      await supabase.from("followup_students").select("*")
        .order("needs_followup", { ascending: false })
        .order("absent_last_7", { ascending: false })
        .order("absent_last_30", { ascending: false })
    );
    return rows.map((r) => ({
      id: r.id, name: r.name, cls: r.class, sec: r.section,
      absentLast7: Number(r.absent_last_7), absentLast30: Number(r.absent_last_30),
      dates: (r.absent_dates || []).slice(0, 5).map(formatDate),
      needsFollowup: Boolean(r.needs_followup),
    }));
  },

  // ----- parent contact log -----
  async listContactLogs(studentId) {
    let q = supabase.from("contact_logs").select("id, student_id, type, outcome, note, created_at, student:students(name), by:profiles(full_name)").order("created_at", { ascending: false }).limit(50);
    if (studentId) q = q.eq("student_id", studentId);
    const rows = unwrap(await q);
    return rows.map((r) => ({
      id: r.id, studentId: r.student_id, studentName: r.student?.name || "", type: r.type, outcome: r.outcome,
      note: r.note || "", date: formatDate(r.created_at.slice(0, 10)), by: r.by?.full_name || "",
    }));
  },
  async addContactLog({ studentId, type, outcome, note }) {
    unwrap(await supabase.from("contact_logs").insert({ school_id: schoolId(), student_id: studentId, type, outcome: outcome.trim(), note: note?.trim() || null, logged_by: cachedUser.id }));
  },

  // ----- homework -----
  async listHomework() {
    const rows = unwrap(await supabase.from("homework").select("id, class, section, subject, text, due_date, attachment_path, attachment_name, attachment_type, by:profiles(full_name)").order("created_at", { ascending: false }).limit(100));
    const paths = rows.map((r) => r.attachment_path).filter(Boolean);
    const urls = {};
    if (paths.length) {
      const { data } = await supabase.storage.from(HW_BUCKET).createSignedUrls(paths, 60 * 60);
      (data || []).forEach((d, i) => { if (d.signedUrl) urls[paths[i]] = d.signedUrl; });
    }
    return rows.map((r) => ({
      id: r.id, cls: r.class, sec: r.section, subject: r.subject, text: r.text, due: r.due_date ? formatDate(r.due_date) : "", by: r.by?.full_name || "",
      attachment: r.attachment_path && urls[r.attachment_path] ? { url: urls[r.attachment_path], name: r.attachment_name || "Attachment", type: r.attachment_type || "" } : null,
    }));
  },
  async addHomework({ cls, sec, subject, text, due, file }) {
    let attachment = {};
    if (file) {
      const ext = file.type === "application/pdf" ? "pdf" : "jpg";
      const path = `${schoolId()}/${crypto.randomUUID()}.${ext}`;
      unwrap(await supabase.storage.from(HW_BUCKET).upload(path, file.blob, { contentType: file.type, upsert: false }));
      attachment = { attachment_path: path, attachment_name: file.name, attachment_type: file.type };
    }
    unwrap(await supabase.from("homework").insert({ school_id: schoolId(), class: cls, section: sec, subject, text: text.trim(), due_date: due || null, set_by: cachedUser.id, ...attachment }));
  },
  async removeHomework(id) {
    const row = unwrap(await supabase.from("homework").select("attachment_path").eq("id", id).maybeSingle());
    unwrap(await supabase.from("homework").delete().eq("id", id));
    if (row?.attachment_path) await supabase.storage.from(HW_BUCKET).remove([row.attachment_path]).catch(() => {});
  },

  // ----- assessments and marks -----
  async listAssessments() {
    const rows = unwrap(await supabase.from("assessments").select("id, title, class, section, subject, date, max_marks").order("date", { ascending: false }));
    return rows.map((r) => ({ id: r.id, title: r.title, cls: r.class, sec: r.section, subject: r.subject, date: formatDate(r.date), max: Number(r.max_marks) }));
  },
  async addAssessment({ title, cls, sec, subject, date, max }) {
    const row = unwrap(await supabase.from("assessments").insert({ school_id: schoolId(), title: title.trim(), class: cls, section: sec, subject, date, max_marks: max, created_by: cachedUser.id }).select().single());
    return { id: row.id, title: row.title, cls: row.class, sec: row.section, subject: row.subject, date: formatDate(row.date), max: Number(row.max_marks) };
  },
  async getMarks(assessmentId) {
    const rows = unwrap(await supabase.from("marks").select("student_id, marks").eq("assessment_id", assessmentId));
    return Object.fromEntries(rows.map((r) => [r.student_id, r.marks == null ? "" : String(Number(r.marks))]));
  },
  async saveMarks(assessmentId, entries) {
    const rows = Object.entries(entries)
      .filter(([, v]) => v !== "" && v != null)
      .map(([student_id, v]) => ({ school_id: schoolId(), assessment_id: assessmentId, student_id, marks: Number(v), updated_at: new Date().toISOString() }));
    if (rows.length === 0) return;
    unwrap(await supabase.from("marks").upsert(rows, { onConflict: "assessment_id,student_id" }));
  },

  // ----- issues -----
  async listIssues() {
    const rows = unwrap(await supabase.from("issues").select("*").order("created_at", { ascending: false }));
    const paths = rows.map((r) => r.photo_path).filter(Boolean);
    let urls = {};
    if (paths.length) {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 60 * 60);
      (data || []).forEach((d, i) => { if (d.signedUrl) urls[paths[i]] = d.signedUrl; });
    }
    return rows.map((r) => ({
      id: r.id, category: r.category, desc: r.description, priority: r.priority, status: r.status,
      date: formatDate(r.created_at.slice(0, 10)), photoUrl: r.photo_path ? urls[r.photo_path] || null : null,
    }));
  },
  async addIssue({ category, desc, priority, photo }) {
    let photo_path = null;
    if (photo) {
      photo_path = `${schoolId()}/${crypto.randomUUID()}.jpg`;
      unwrap(await supabase.storage.from(BUCKET).upload(photo_path, photo, { contentType: "image/jpeg", upsert: false }));
    }
    unwrap(await supabase.from("issues").insert({ school_id: schoolId(), category, description: desc.trim(), priority, photo_path, reported_by: cachedUser.id }));
  },
  async updateIssueStatus(id, status) {
    unwrap(await supabase.from("issues").update({ status, updated_at: new Date().toISOString() }).eq("id", id));
  },

  // ----- dashboard -----
  async getStats() {
    const today = new Date().toISOString().slice(0, 10);
    const [students, present, followup, issues] = await Promise.all([
      supabase.from("students").select("id", { count: "exact", head: true }).eq("active", true),
      supabase.from("attendance").select("id", { count: "exact", head: true }).eq("date", today).eq("status", "Present"),
      supabase.from("followup_students").select("id", { count: "exact", head: true }).eq("needs_followup", true),
      supabase.from("issues").select("id", { count: "exact", head: true }).neq("status", "Resolved"),
    ]);
    [students, present, followup, issues].forEach((r) => { if (r.error) throw r.error; });
    return { total: students.count || 0, presentToday: present.count || 0, followup: followup.count || 0, openIssues: issues.count || 0 };
  },
};
