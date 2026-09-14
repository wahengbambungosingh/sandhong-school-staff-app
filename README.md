# Sandhong Upper Primary School — Staff App

Internal staff management app for Sandhong Upper Primary School.

Mobile-first web app for staff phones. Staff sign in with email and
password, each school has its own private space, and everything is saved
to a Supabase database.

A separate **demo build** runs entirely on sample data with no login.

## Use it without installing anything

Open the published app link and tap a role. On a phone, use the browser menu
and choose **Add to Home Screen** to get an app icon. After the first load it
also opens offline.

Every push to `main` builds the app and publishes it to the `gh-pages`
branch (see `.github/workflows/deploy.yml`), which GitHub Pages serves at
https://wahengbambungosingh.github.io/sandhong-school-staff-app/

## Run it on a computer

```bash
npm install
npm run dev
```

Open the printed URL (normally http://localhost:5173). Pick a role on the
login screen and tap **Continue**. Staff ID and password are disabled in the
prototype.

Other scripts:

| Command           | What it does                              |
| ----------------- | ----------------------------------------- |
| `npm run build`   | Production build into `dist/`             |
| `npm run preview` | Serve the production build locally        |
| `npm run lint`    | ESLint over the source                    |

## One-time database setup

1. Create a project at https://supabase.com.
2. Open **SQL Editor → New query**, paste the contents of
   `supabase/schema.sql`, and click **Run**. Safe to run again later.
3. Under **Authentication → URL Configuration**, set **Site URL** to the
   address where the app is published and add the same address under
   **Redirect URLs**. Email confirmation links then return people to the
   app, signed in. Keep "Confirm email" on under Providers → Email.
4. Put the project's URL and `anon` key in `src/config.js` (or in a
   `.env` file, see `.env.example`).

The first person to create an account sets up the school and becomes
its principal. The **Staff** screen shows a **join code** that other staff
enter when they create their accounts; the principal can change roles,
remove staff, and issue a new code. "Forgot password?" on the sign-in
screen emails a reset link that returns to the app.

## What is saved

- Staff accounts, schools, roles, join codes, password reset
- School Setup: academic year, classes, sections, subjects (feed every
  class/section/subject picker in the app)
- Teacher Assignments: which staff member teaches which class and subject;
  teachers see their own list on the dashboard
- Student Register: add, edit, class filter, detail view, WhatsApp consent,
  fee status, active/inactive
- Daily Attendance by date, class and section (Present / Absent / Leave / Late)
- Follow-up Needed: every student with recent absences; flagged at 3+ in
  7 days or 7+ in 30 days
- Parent Contact Log per student: call and WhatsApp buttons (WhatsApp only
  with consent), logged contacts with type, outcome and note
- Homework by class, section and subject with due date
- Assessments & Marks: create an assessment, enter marks per student,
  marks under 40% highlighted
- School Issues: report with category, priority and an optional photo
  (camera or gallery, shrunk on the phone before upload, stored in a
  private Supabase Storage bucket); management roles change the status
- Fees Status (Paid / Pending per student)
- Dashboard counts and the Reports summary

## Stack

- [Vite](https://vite.dev) + [React 19](https://react.dev)
- [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/vite`
- [lucide-react](https://lucide.dev) icons
- [Supabase](https://supabase.com) for accounts and data (Postgres with
  row-level security; see `supabase/schema.sql`)

## Layout

```
src/
  main.jsx            entry point
  App.jsx             role state, screen routing, top bar
  theme.js            colour palette and shared field styles
  config.js           Supabase URL and anon key; demo-mode switch
  lib/api.js          picks the live (Supabase) or demo (in-memory) data layer
  lib/shared.js       role labels, date helpers, friendly error messages
  data/dummy.js       sample records used by the demo and by unconverted screens
  components/ui.jsx   StatusPill, TopBar, Tile, BigButton, Card, ...
  screens/            one file per screen
```

## Roadmap

- Custom email sender (Supabase's built-in one is rate-limited)
- Own domain, privacy policy and terms, pricing page, new-school sign-up
- Backups, more report types
