import { Printer } from "lucide-react";
import { BigButton, Card, ErrorNote, Loading } from "../components/ui.jsx";
import { COLORS } from "../theme.js";
import { api } from "../lib/api.js";
import { useAsync } from "../lib/useAsync.js";
import { errorMessage, formatDate, todayISO } from "../lib/shared.js";

export default function ReportsScreen({ user }) {
  const { loading, data, error, reload } = useAsync(async () => {
    const [stats, followup, issues] = await Promise.all([api.getStats(), api.listFollowup(), api.listIssues()]);
    return { stats, followup, issues };
  });
  const pct = data && data.stats.total ? Math.round((data.stats.presentToday / data.stats.total) * 100) : 0;
  return (
    <div className="p-4 space-y-3">
      <ErrorNote message={error && errorMessage(error)} onRetry={reload} />
      {loading && <Loading />}
      {data && (
        <div id="print-area">
          <p className="text-xs text-gray-500 mb-2 px-1">{user?.school?.name} · {formatDate(todayISO())}</p>
          <Card>
            <p className="font-bold mb-2" style={{ color: COLORS.ink }}>Attendance summary — today</p>
            <p className="text-sm">Present: {data.stats.presentToday} of {data.stats.total} ({pct}%)</p>
          </Card>
          <Card className="mt-3">
            <p className="font-bold mb-2" style={{ color: COLORS.ink }}>Students needing follow-up</p>
            {data.followup.length === 0 && <p className="text-sm text-gray-500">None.</p>}
            {data.followup.map((f) => (
              <p key={f.id} className="text-sm py-1">{f.name} — {f.cls} {f.sec} — {f.absentLast7} absences (7 days), {f.absentLast30} (30 days)</p>
            ))}
          </Card>
          <Card className="mt-3">
            <p className="font-bold mb-2" style={{ color: COLORS.ink }}>School issues by status</p>
            {["Open", "In Progress", "Resolved"].map((st) => (
              <p key={st} className="text-sm py-1">{st}: {data.issues.filter((i) => i.status === st).length}</p>
            ))}
          </Card>
        </div>
      )}
      <BigButton icon={Printer} onClick={() => window.print()}>Print this report</BigButton>
      <p className="text-xs text-gray-500 px-1">More report types are added in later phases.</p>
    </div>
  );
}
