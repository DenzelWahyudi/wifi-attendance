# UNTAR Attendance

A student check-in page and a password-protected administrator dashboard, built with React, TypeScript, Tailwind CSS, Express, and PostgreSQL.

- `/` — enter a registered identity number and press **Attend**.
- `/admin` — sign in, add students, search and filter attendance, and reset the session.
- The dashboard refreshes every five seconds while visible.
- Check-ins are saved in PostgreSQL. Repeated submissions keep the original timestamp.
- **Present** means the student has checked in. **Not attended** means they have not checked in during the current session.
- Sessions continue until an administrator explicitly resets them. Reset clears check-ins and starts a new session; it keeps all registered names and identity numbers. Previous attendance history is not retained.
- Identity numbers are stored as text, preserving leading zeroes. They are case-sensitive and accept 1–32 letters, digits, or hyphens.
- Assets, illustrations, and system fonts are local. Once dependencies are installed, the application does not need an internet connection.

## Database setup

Requirements: Node.js 24 and PostgreSQL. The schema has been checked with PostgreSQL 18.

Open your PostgreSQL terminal:

```powershell
psql -U postgres
```

Create and select the database:

```sql
CREATE DATABASE wifi_attendance;
\connect wifi_attendance
```

Paste the contents of **`db.sql`** into that terminal, or load the file:

```sql
\i 'C:/Users/denze/Downloads/wifi-attendance/db.sql'
```

The SQL creates two tables, `students` and `attendance_state`. Rerunning it preserves existing registrations and attendance. It does not insert sample students or create a database automatically.

## Configuration

Fill in **`server/.env`**. A copy of the placeholders is provided in **`server/.env.example`**.

```dotenv
PGHOST=localhost
PGPORT=5432
PGDATABASE=wifi_attendance
PGUSER=postgres
PGPASSWORD=your-database-password
ADMIN_PASSWORD=replace-with-your-own-password
PORT=3000
COOKIE_SECURE=false
```

Set `ADMIN_PASSWORD` to your own password of 12–256 characters. The placeholder does not enable a login. The password and database settings remain on the server; `.env` is excluded from version control. Restart the API after changing it. Quote values containing `#` or spaces, for example `PGPASSWORD="example#with spaces"`.

Admin sessions use an HTTP-only, SameSite cookie and expire after eight hours. Signing out or restarting the API invalidates them. `COOKIE_SECURE=false` supports local HTTP; use `true` only with HTTPS.

## Run the client and server separately

No combined launcher or router/network setup is included.

Terminal 1, from the project directory:

```powershell
cd server
npm install
npm run dev
```

Terminal 2, from the project directory:

```powershell
cd client
npm install
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`. Open `/admin` to register students first.

The client sends requests to `/api`, which Vite proxies to `http://localhost:3000`. The API binds to `localhost` on the laptop. If you change the API's `PORT`, update the proxy target in `client/vite.config.ts` too. API and client use separate commands, and no PostgreSQL service settings or firewall rules are changed by the application.

If the database is unreachable or the schema has not been installed, the API prints a setup error. The website shows a connection error and allows retrying. Attendance timestamps come from PostgreSQL and are displayed in each browser's local time zone. Nothing resets automatically at midnight.

## Styling

Pages and components use Tailwind CSS utilities, including responsive layouts, focus states, and reduced-motion variants. Shared buttons, fields, and status badges are in `client/src/components/ui.tsx`.

`client/src/index.css` contains only the Tailwind import and theme settings for colors, fonts, breakpoints, shadows, and the entry animation. Change the theme there to adjust the shared design.

## Checks

From `client`:

```powershell
npm run build
npm run lint
```

# wifi-attendance
