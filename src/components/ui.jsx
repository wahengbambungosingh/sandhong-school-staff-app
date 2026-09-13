import { CheckCircle2, ChevronLeft, Circle, Clock, XCircle } from "lucide-react";
import { COLORS } from "../theme.js";

const PILL_STYLES = {
  Present: { bg: "#DCEFE1", fg: "#1F6B3B", Icon: CheckCircle2 },
  Absent: { bg: "#FBE4E1", fg: "#B23A2B", Icon: XCircle },
  Late: { bg: "#FCEFD9", fg: "#93650F", Icon: Clock },
  Leave: { bg: "#E6E9F5", fg: "#38408A", Icon: Circle },
  Open: { bg: "#FBE4E1", fg: "#B23A2B", Icon: Circle },
  "In Progress": { bg: "#FCEFD9", fg: "#93650F", Icon: Clock },
  Resolved: { bg: "#DCEFE1", fg: "#1F6B3B", Icon: CheckCircle2 },
  High: { bg: "#FBE4E1", fg: "#B23A2B", Icon: null },
  Medium: { bg: "#FCEFD9", fg: "#93650F", Icon: null },
  Low: { bg: "#E6E9F5", fg: "#38408A", Icon: null },
  Paid: { bg: "#DCEFE1", fg: "#1F6B3B", Icon: CheckCircle2 },
  Pending: { bg: "#FCEFD9", fg: "#93650F", Icon: Clock },
};

export function StatusPill({ status }) {
  const s = PILL_STYLES[status] || { bg: "#eee", fg: "#333", Icon: null };
  const Icon = s.Icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold"
      style={{ background: s.bg, color: s.fg }}
    >
      {Icon && <Icon size={14} />}
      {status}
    </span>
  );
}

export function DemoBadge({ className = "" }) {
  return (
    <span className={`text-[11px] font-bold tracking-wide bg-white/15 rounded px-2 py-0.5 ${className}`}>
      DEMO MODE — dummy data only
    </span>
  );
}

export function TopBar({ title, onBack, role }) {
  return (
    <div style={{ background: COLORS.header }} className="text-white sticky top-0 z-10 print:hidden">
      <div className="flex items-center justify-between px-4 pt-3">
        <DemoBadge />
        {role && <span className="text-[11px] text-white/70">{role}</span>}
      </div>
      <div className="flex items-center gap-2 px-2 pb-3 pt-2">
        {onBack ? (
          <button onClick={onBack} className="p-2 -ml-1 rounded-full active:bg-white/10" aria-label="Back">
            <ChevronLeft size={24} />
          </button>
        ) : (
          <div className="w-10" />
        )}
        <h1 className="text-lg font-bold">{title}</h1>
      </div>
    </div>
  );
}

export function Tile({ icon: Icon, label, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-3 rounded-2xl p-4 text-left active:scale-[0.98] transition-transform"
      style={{ background: COLORS.card }}
    >
      <div className="flex items-center justify-between w-full">
        <div className="rounded-xl p-2.5" style={{ background: COLORS.header }}>
          <Icon size={22} color="#fff" />
        </div>
        {badge != null && (
          <span className="text-xs font-bold rounded-full px-2 py-1" style={{ background: COLORS.alert, color: "#fff" }}>
            {badge}
          </span>
        )}
      </div>
      <span className="font-bold text-[15px] leading-snug" style={{ color: COLORS.ink }}>{label}</span>
    </button>
  );
}

export function BigButton({ children, onClick, icon: Icon, variant = "primary", type = "button" }) {
  const styles =
    variant === "primary"
      ? { background: COLORS.accent, color: COLORS.ink }
      : { background: COLORS.header, color: "#fff" };
  return (
    <button
      type={type}
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold active:scale-[0.98] transition-transform"
      style={styles}
    >
      {Icon && <Icon size={20} />}
      {children}
    </button>
  );
}

export function Card({ children, className = "", style = {} }) {
  return (
    <div className={`rounded-2xl bg-white border p-4 ${className}`} style={{ borderColor: COLORS.border, ...style }}>
      {children}
    </div>
  );
}

export function BackLink({ onClick, children }) {
  return (
    <button onClick={onClick} className="text-sm font-semibold flex items-center gap-1" style={{ color: COLORS.header }}>
      <ChevronLeft size={16} /> {children}
    </button>
  );
}
