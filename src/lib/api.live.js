// Live data source backed by Supabase. Row-level security in the database
// restricts every query to the signed-in staff member's own school.
import { supabase } from "./supabase.js";
import { formatDate } from "./shared.js";

const rowToStudent = (r) => ({
  id: r.id,
  name: r.name,
  adm: r.admission_no,
  cls: r.class,
  sec: r.section,
  guardian: r.guardian_name || "",
  phone: r.guardian_phone || "",
  village: r.village || "",
  consent: r.whatsapp_consent,
  active: r.active,
  fee: r.fee_status,
});

const studentToRow = (s) => ({
  name: s.name.trim(),
  admission_no: s.adm.trim(),
  class: s.cls,
  section: s.sec,
  guardian_name: s.guardian?.trim() || null,
  guardian_phone: s.phone?.trim() || null,
  village: s.village?.trim() || null,
  whatsapp_consent: Boolean(s.consent),
  active: s.active !== false,
  fee_status: s.fee || "Pending",
});

function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

let cachedUser = null;

async function loadUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { cachedUser = null; return null; }
  const profile = unwrap(
    await supabase
      .from("profiles")
      .select("id, full_name, role, school:schools(id, name, join_code)")
      .eq("id", session.user.id)
      .maybeSingle()
  );
  cachedUser = {
    id: session.user.id,
    email: session.user.email,
    fullName: profile?.full_name || "",
    role: profile?.role || null,
    school: profile?.school
      ? { id: profile.school.id, name: profile.school.name, joinCode: profile.school.join_code }
      : null,
    needsSchool: !profile,
  };
  return cachedUser;
}

export const liveApi = {
  mode: "live",

  getUser: loadUser,
  onAuthChange(fn) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUser().then(fn).catch(() => fn(null));
    });
    return () => subscription.unsubscribe();
  },
  async signIn(email, password) {
    unwrap(await supabase.auth.signInWithPassword({ email: email.trim(), password }));
    return loadUser();
  },
  async signUp(email, password) {
    // Send the confirmation link back to this app, so the person lands here signed in.
    const emailRedirectTo = window.location.origin + window.location.pathname;
    const data = unwrap(await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo } }));
    // When email confirmation is on, there is no session yet.
    return { needsEmailConfirmation: !data.session };
  },
  async signOut() { unwrap(await supabase.auth.signOut()); cachedUser = null; },
  async createSchool(schoolName, fullName) {
    unwrap(await supabase.rpc("create_school", { school_name: schoolName, full_name: fullName }));
    return loadUser();
  },
  async joinSchool(code, fullName) {
    unwrap(await supabase.rpc("join_school", { code, full_name: fullName }));
    return loadUser();
  },

  async listStudents() {
    const rows = unwrap(await supabase.from("students").select("*").order("name"));
    return rows.map(rowToStudent);
  },
  async addStudent(fields) {
    const row = unwrap(
      await supabase.from("students").insert({ ...studentToRow(fields), school_id: cachedUser.school.id }).select().single()
    );
    return rowToStudent(row);
  },
  async updateStudent(id, fields) {
    const row = unwrap(await supabase.from("students").update(studentToRow(fields)).eq("id", id).select().single());
    return rowToStudent(row);
  },

  async getAttendance(date) {
    const rows = unwrap(await supabase.from("attendance").select("student_id, status").eq("date", date));
    return Object.fromEntries(rows.map((r) => [r.student_id, r.status]));
  },
  async saveAttendance(date, entries) {
    const rows = Object.entries(entries).map(([student_id, status]) => ({
      school_id: cachedUser.school.id,
      student_id,
      date,
      status,
      marked_by: cachedUser.id,
      updated_at: new Date().toISOString(),
    }));
    if (rows.length === 0) return;
    unwrap(await supabase.from("attendance").upsert(rows, { onConflict: "student_id,date" }));
  },

  async listFollowup() {
    const rows = unwrap(await supabase.from("followup_students").select("*").order("absent_last_7", { ascending: false }));
    return rows.map((r) => ({
      id: r.id, name: r.name, cls: r.class, sec: r.section,
      absentLast7: Number(r.absent_last_7), absentLast30: Number(r.absent_last_30),
      dates: (r.absent_dates || []).slice(0, 5).map(formatDate),
    }));
  },

  async getStats() {
    const today = new Date().toISOString().slice(0, 10);
    const [students, present, followup] = await Promise.all([
      supabase.from("students").select("id", { count: "exact", head: true }).eq("active", true),
      supabase.from("attendance").select("id", { count: "exact", head: true }).eq("date", today).eq("status", "Present"),
      supabase.from("followup_students").select("id", { count: "exact", head: true }),
    ]);
    [students, present, followup].forEach((r) => { if (r.error) throw r.error; });
    return { total: students.count || 0, presentToday: present.count || 0, followup: followup.count || 0 };
  },
};
