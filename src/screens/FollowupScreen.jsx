import { Card, ErrorNote, Loading } from "../components/ui.jsx";
import { COLORS } from "../theme.js";
import { api } from "../lib/api.js";
import { useAsync } from "../lib/useAsync.js";
import { errorMessage } from "../lib/shared.js";

export default function FollowupScreen() {
  const { loading, data, error, reload } = useAsync(() => api.listFollowup());
  return (
    <div className="p-4 space-y-3">
      <Card style={{ background: "#FBE4E1", borderColor: "#F3C9C3" }}>
        <p className="text-sm font-semibold" style={{ color: COLORS.alert }}>
          Rule: 3+ absences in the last 7 days, or 7+ absences in the last 30 days.
        </p>
      </Card>
      <ErrorNote message={error && errorMessage(error)} onRetry={reload} />
      {loading && <Loading />}
      {!loading && !error && data?.length === 0 && <p className="text-sm text-gray-500 px-1">No students need a follow-up right now.</p>}
      {(data || []).map((f) => (
        <Card key={f.id}>
          <p className="font-bold" style={{ color: COLORS.ink }}>{f.name}</p>
          <p className="text-xs text-gray-500 mb-2">{f.cls} · Section {f.sec}</p>
          <div className="flex gap-4 text-sm mb-2">
            <span><span className="font-bold">{f.absentLast7}</span> absent (7 days)</span>
            <span><span className="font-bold">{f.absentLast30}</span> absent (30 days)</span>
          </div>
          <p className="text-xs text-gray-500">Dates: {f.dates.join(", ")}</p>
        </Card>
      ))}
    </div>
  );
}
