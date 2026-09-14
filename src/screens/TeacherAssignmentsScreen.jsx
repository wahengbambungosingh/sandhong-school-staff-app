import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { BigButton, Card, ErrorNote, Loading, SelectInput } from "../components/ui.jsx";
import { COLORS } from "../theme.js";
import { api } from "../lib/api.js";
import { useAsync } from "../lib/useAsync.js";
import { errorMessage, MANAGEMENT_ROLES, ROLE_LABELS } from "../lib/shared.js";

function AssignForm({ user, staff, onSaved, onCancel }) {
  const { classes, sections, subjects } = user.school;
  const [profileId, setProfileId] = useState(staff[0]?.id || "");
  const [cls, setCls] = useState(classes[0] || "");
  const [sec, setSec] = useState(sections[0] || "");
  const [subject, setSubject] = useState(subjects[0] || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try { await api.addAssignment({ profileId, cls, sec, subject }); onSaved(); }
    catch (err) { setError(/duplicate key/i.test(err.message) ? "That teacher already has this class and subject." : errorMessage(err)); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit}>
      <Card className="space-y-3">
        <SelectInput id="as-teacher" label="Staff member" options={staff.map((s) => [s.id, `${s.fullName} (${ROLE_LABELS[s.role]})`])} value={profileId} onChange={(e) => setProfileId(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <SelectInput id="as-cls" label="Class" options={classes} value={cls} onChange={(e) => setCls(e.target.value)} />
          <SelectInput id="as-sec" label="Section" options={sections.map((s) => [s, `Section ${s}`])} value={sec} onChange={(e) => setSec(e.target.value)} />
        </div>
        <SelectInput id="as-subject" label="Subject" options={subjects} value={subject} onChange={(e) => setSubject(e.target.value)} />
        <ErrorNote message={error} />
        <BigButton type="submit" disabled={busy || !profileId}>{busy ? "Saving…" : "Add assignment"}</BigButton>
        <button type="button" onClick={onCancel} className="w-full text-sm font-semibold text-gray-500 py-2">Cancel</button>
      </Card>
    </form>
  );
}

export default function TeacherAssignmentsScreen({ user }) {
  const canManage = MANAGEMENT_ROLES.includes(user.role);
  const [showForm, setShowForm] = useState(false);
  const [actionError, setActionError] = useState("");
  const list = useAsync(() => api.listAssignments());
  const staff = useAsync(() => api.listStaff());
  const loading = list.loading || staff.loading;
  const error = list.error || staff.error;

  const byTeacher = {};
  (list.data || []).forEach((a) => { (byTeacher[a.profileId] ||= { name: a.teacherName, items: [] }).items.push(a); });
  (staff.data || []).forEach((s) => { byTeacher[s.id] ||= { name: s.fullName, items: [] }; });

  async function remove(a) {
    if (!window.confirm(`Remove ${a.cls} ${a.sec} · ${a.subject} from ${a.teacherName}?`)) return;
    setActionError("");
    try { await api.removeAssignment(a.id); list.reload(); } catch (err) { setActionError(errorMessage(err)); }
  }

  return (
    <div className="p-4 space-y-3">
      {canManage && !showForm && <BigButton icon={Plus} onClick={() => setShowForm(true)}>Assign a class</BigButton>}
      {showForm && <AssignForm user={user} staff={staff.data || []} onCancel={() => setShowForm(false)} onSaved={() => { setShowForm(false); list.reload(); }} />}
      <ErrorNote message={(error && errorMessage(error)) || actionError} onRetry={error ? () => { list.reload(); staff.reload(); } : undefined} />
      {loading && <Loading />}
      {!loading && Object.entries(byTeacher).map(([id, t]) => (
        <Card key={id}>
          <p className="font-bold" style={{ color: COLORS.ink }}>{t.name}</p>
          <div className="mt-2 space-y-1">
            {t.items.length === 0 && <p className="text-sm text-gray-400">No classes assigned.</p>}
            {t.items.map((a) => (
              <div key={a.id} className="flex items-center justify-between">
                <p className="text-sm text-gray-600">{a.cls} {a.sec} · {a.subject}</p>
                {canManage && <button onClick={() => remove(a)} aria-label="Remove assignment" className="p-1 text-gray-400"><Trash2 size={14} /></button>}
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
