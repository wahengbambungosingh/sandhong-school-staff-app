# Sandhong Upper Primary School — Staff App

Internal staff management app for Sandhong Upper Primary School.

**Phase 1 prototype.** Every screen runs on dummy data only. Nothing is saved,
there is no real login, and no messages are sent automatically. The app is
built mobile-first for staff phones.

## Use it without installing anything

Open the published app link and tap a role. On a phone, use the browser menu
and choose **Add to Home Screen** to get an app icon. After the first load it
also opens offline.

Every push to `main` publishes the app to GitHub Pages automatically
(see `.github/workflows/deploy.yml`). The Pages link appears under the
repository's **Settings → Pages** once the first deploy has run.

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

## What is in Phase 1

Roles: Principal, Teacher, Office Admin, Technical Admin. Principal and the
two admin roles see the management dashboard. Teachers see a simpler
dashboard with attendance first.

Screens:

- Student Register with class filter and a student detail view
- School Setup (academic year, classes, sections, subjects — read-only)
- Teacher Assignments
- Daily Attendance (Present / Absent / Leave / Late per student, not stored)
- Follow-up Needed (3+ absences in 7 days, or 7+ in 30 days)
- Parent Contact Log with a manual "Open WhatsApp" link, shown only when the
  guardian has given consent
- Homework / Classwork
- Assessments & Marks, low marks highlighted
- School Issues with a report form
- Fees Status (Paid / Pending only, no amounts)
- Reports with a print button

## Stack

- [Vite](https://vite.dev) + [React 19](https://react.dev)
- [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/vite`
- [lucide-react](https://lucide.dev) icons

## Layout

```
src/
  main.jsx            entry point
  App.jsx             role state, screen routing, top bar
  theme.js            colour palette and shared field styles
  data/dummy.js       all Phase 1 dummy records
  components/ui.jsx   StatusPill, TopBar, Tile, BigButton, Card, ...
  screens/            one file per screen
```

## Roadmap (from the prototype)

- Phase 2: real login and security, editable school setup
- Phase 5: photo attachments on school issues
- Later: more report types
