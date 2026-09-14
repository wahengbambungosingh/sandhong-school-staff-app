import { AlertTriangle } from "lucide-react";
import { Card, ErrorNote, Loading } from "../components/ui.jsx";
import { COLORS } from "../theme.js";
import { api } from "../lib/api.js";
import { useAsync } from "../lib/useAsync.js";
import { errorMessage } from "../lib/shared.js";

function StudentRow({ f, flagged }) {
  return (
    <Card style={flagged ? { borderColor: "#F3C9C3" } : undefined}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold" style={{ color: COLORS.ink }}>{f.name}</p>
          <p className="text-xs text-gray-500">{f.cls} · Section {f.sec}</p>
        </div>
        {flagged && (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold" style={{ background: "#FBE4E1", color: COLORS.alert }}>
            <AlertTriangle size={12} /> Follow up
          </span>
        )}
      </div>
      <div className="flex gap-4 text-sm mt-2">
        <span><span className="font-bold">{f.absentLast7}</span> absent (7 days)</span>
        <span><span className="font-bold">{f.absentLast30}</span> absent (30 days)</span>
      </div>
      {f.dates.length > 0 && <p className="text-xs text-gray-500 mt-1">Dates: {f.dates.join(", ")}</p>}
    </Card>
  );
}

export default function FollowupScreen() {
  const { loading, data, error, reload } = useAsync(() => api.listFollowup());
  const rows = data || [];
  const flagged = rows.filter((f) => f.needsFollowup);
  const watching = rows.filter((f) => !f.needsFollowup && f.absentLast30 > 0);

  return (
    <div className="p-4 space-y-3">
      <Card style={{ background: "#FBE4E1", borderColor: "#F3C9C3" }}>
        <p className="text-sm font-semibold" style={{ color: COLORS.alert }}>
          A student is flagged after 3+ absences in the last 7 days, or 7+ absences in the last 30 days.
        </p>
        <p className="text-xs mt-1" style={{ color: COLORS.alert }}>Counts come from the attendance you save each day.</p>
      </Card>
      <ErrorNote message={error && errorMessage(error)} onRetry={reload} />
      {loading && <Loading />}
      {!loading && !error && (
        <>
          <p className="font-bold text-sm px-1" style={{ color: COLORS.ink }}>Needs follow-up ({flagged.length})</p>
          {flagged.length === 0 && <p className="text-sm text-gray-500 px-1">No student has reached the limit yet.</p>}
          {flagged.map((f) => <StudentRow key={f.id} f={f} flagged />)}

          <p className="font-bold text-sm px-1 pt-2" style={{ color: COLORS.ink }}>Absent recently, below the limit ({watching.length})</p>
          {watching.length === 0 && (
            <p className="text-sm text-gray-500 px-1">
              {rows.length === 0 ? "No students yet. Add students and mark attendance to start." : "No absences recorded in the last 30 days."}
            </p>
          )}
          {watching.map((f) => <StudentRow key={f.id} f={f} />)}
        </>
      )}
    </div>
  );
}
