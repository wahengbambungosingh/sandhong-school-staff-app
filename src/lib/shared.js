export const ROLE_LABELS = {
  principal: "Principal",
  teacher: "Teacher",
  office_admin: "Office Admin",
  technical_admin: "Technical Admin",
};

export const ROLE_KEYS = Object.keys(ROLE_LABELS);

export const MANAGEMENT_ROLES = ["principal", "office_admin", "technical_admin"];

/** Today's date as YYYY-MM-DD in the device's local time zone. */
export function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "2026-09-13" -> "13 Sep 2026" */
export function formatDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${String(d).padStart(2, "0")} ${months[m - 1]} ${y}`;
}

/** Turn a thrown value into a short message a staff member can read. */
export function errorMessage(err) {
  if (!err) return "Something went wrong.";
  const msg = err.message || String(err);
  if (/Invalid login credentials/i.test(msg)) return "Wrong email or password.";
  if (/Email not confirmed/i.test(msg)) return "Please confirm your email first. Check your inbox for the link.";
  if (/already registered/i.test(msg)) return "An account with this email already exists. Try signing in.";
  if (/Failed to fetch|NetworkError|network/i.test(msg)) return "No internet connection. Try again when you are online.";
  if (/duplicate key.*admission/i.test(msg)) return "A student with this admission number already exists.";
  return msg.replace(/^.*?exception:\s*/i, "");
}
