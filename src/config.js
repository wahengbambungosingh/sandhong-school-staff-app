// Supabase connection for the live app.
// Both values are safe to publish: the anon key only allows what the
// database's row-level security policies permit.
// Leave both empty and the app runs in demo mode with sample data.

const DEFAULTS = {
  url: "https://xusbhhpgpgghwsucpjsk.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1c2JoaHBncGdnaHdzdWNwanNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMjYxOTksImV4cCI6MjEwNDkwMjE5OX0.m7Bpqj_f0_WDrKmnyllc78rc6Fq9Wqheo4jlZU0lRi8",
};

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || DEFAULTS.url;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULTS.anonKey;
// Set VITE_DEMO_MODE=true at build time to force the sample-data demo.
export const IS_LIVE = import.meta.env.VITE_DEMO_MODE !== "true" && Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
