# Sandhong Upper Primary School — Staff App

Internal staff management app for Sandhong Upper Primary School.

Mobile-first web app for staff phones. Staff sign in with email and
password, each school has its own private space, and students and daily
attendance are saved to a Supabase database. Screens not yet connected to
the database show sample data and say so.

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
3. Under **Authentication → Providers → Email**, turn off
   "Confirm email" if you want staff to sign in immediately after
   creating an account. Leave it on to require an email confirmation.
4. Put the project's URL and `anon` key in `src/config.js` (or in a
   `.env` file, see `.env.example`).

The first person to create an account sets up the school and becomes
its principal. The principal's dashboard shows a **join code** that other
staff enter when they create their accounts.

## What is saved today

Roles: Principal, Teacher, Office Admin, Technical Admin. Principal and the
two admin roles see the management dashboard. Teachers see a simpler
dashboard with attendance first.

Saved to the database:

- Staff accounts, schools, roles, join codes
- Student Register: add, edit, class filter, detail view, WhatsApp consent,
  fee status, active/inactive
- Daily Attendance by date, class and section (Present / Absent / Leave / Late)
- Follow-up Needed (3+ absences in 7 days, or 7+ in 30 days), computed from
  real attendance
- Fees Status (Paid / Pending per student)
- Dashboard counts and the Reports summary

Still sample data (next stage):

- School Setup (academic year, classes, sections, subjects)
- School Setup (academic year, classes, sections, subjects — read-only)
- Teacher Assignments
- Parent Contact Log with a manual "Open WhatsApp" link, shown only when the
  guardian has given consent
- Homework / Classwork
- Assessments & Marks
- School Issues

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

- Next: editable school setup, teacher assignments, parent contact log,
  homework, marks and school issues saved to the database
- Then: principal can change staff roles, new-school sign-up page,
  pricing and privacy pages on the public website
- Later: photo attachments on issues, more report types
