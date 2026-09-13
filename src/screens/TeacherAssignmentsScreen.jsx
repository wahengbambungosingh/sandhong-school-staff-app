import { Card } from "../components/ui.jsx";
import { COLORS } from "../theme.js";
import { TEACHERS } from "../data/dummy.js";

export default function TeacherAssignmentsScreen() {
  return (
    <div className="p-4 space-y-3">
      {TEACHERS.map((t) => (
        <Card key={t.id}>
          <p className="font-bold" style={{ color: COLORS.ink }}>{t.name}</p>
          <div className="mt-2 space-y-1">
            {t.assignments.map((a, i) => (
              <p key={i} className="text-sm text-gray-600">{a.cls} {a.sec} · {a.subject}</p>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
