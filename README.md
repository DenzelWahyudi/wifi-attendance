# UNTAR Attendance

A local-first student attendance and verification system featuring a mobile student check-in portal and a password-protected administrator dashboard. Built with React 19, TypeScript, Tailwind CSS v4, Express 5, and PostgreSQL.

---

## Key Features

### Student Check-In (`/`)
- **Fast Attendance**: Students enter their registered identity number and tap **Attend**.
- **Mobile-Only Restriction**: Enforces check-in from mobile devices via user-agent, touch, and viewport verification (bypassed on loopback for local development).
- **Anti-Proxy & Device Binding**:
  - Assigns a persistent device identifier stored across `localStorage` and HTTP cookies.
  - Prevents proxy attendance: a device or IP address can only check in for one student per session.
- **Instant Attendance Receipt**: Displays exact submission timestamp and real-time session verification status.

### Pop Check-In & Presence Verification
- **Mid-Session Verification**: Admins can launch timed pop check-ins during lectures to verify that students who checked in are still physically in the room.
- **Two Verification Methods**:
  - **4-Digit PIN**: Generates a random 4-digit code on the admin screen for students to enter on their devices.
  - **One-Tap Confirmation**: Students tap a confirmation button on their device within the active window.
- **Device-Matched Verification**: Verifications must originate from the exact same device that submitted the initial check-in.
- **Configurable Timers**: 60-second, 2-minute, or 3-minute windows with live countdown and early termination controls.
- **Smart Status Categorization**:
  - **Verified**: Checked in and successfully verified during the active cycle.
  - **Unverified / Left Early**: Checked in initially but missed the pop check-in window.
  - **Present**: Checked in (prior to any verification cycles or while a cycle is in progress).
  - **Not attended**: Has not checked in during the current session.

### Administrator Dashboard (`/admin`)
- **Password-Protected & Rate-Limited**: Authenticated using HTTP-only, SameSite cookies with brute-force protection (10 attempts per 15 minutes).
- **Live Sync**: Automatically polls and updates attendance statistics every 5 seconds (pauses when the tab is inactive).
- **Student Roster Management**: Add new students with name and identity number (supports alphanumeric IDs, hyphens, and preserves leading zeroes).
- **Search & Filters**: Filter by status (*All*, *Verified*, *Unverified / Left*, *Not attended*) and live search by name or ID.
- **Session Control**: One-click session reset clears all check-in and verification timestamps while preserving enrolled students.

### Local-First & Offline-Ready
- **Zero External Runtime Dependencies**: All fonts, icons, illustrations, and assets are bundled locally. Once dependencies are installed, the entire system runs on a local Wi-Fi or LAN without requiring an internet connection.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, React Router 7, React Compiler
- **Backend**: Node.js 24, Express 5, `pg` (node-postgres), Express Rate Limit
- **Database**: PostgreSQL (tested on PostgreSQL 18)
- **Launcher**: Concurrently for running client and server simultaneously

---

## Database Setup

### Requirements
- **Node.js 24+** (utilizes native `loadEnvFile` and `node:crypto`)
- **PostgreSQL**

### Initialization

1. Open your PostgreSQL terminal:
   ```powershell
   psql -U postgres
   ```

2. Create and connect to the database:
   ```sql
   CREATE DATABASE wifi_attendance;
   \connect wifi_attendance
   ```

3. Execute the database schema from the project root:
   ```sql
   \i 'db.sql'
   ```
   *(Or copy and paste the contents of `db.sql` directly into your psql terminal).*

The script creates two tables:
- `students`: Stores student names, identity numbers, attendance timestamps, verification timestamps, device IDs, and IP addresses.
- `attendance_state`: Stores the session start time, active verification method, PIN, countdown timestamps, and cycle counter.

---

## Configuration

Copy the example environment file to `server/.env`:

```powershell
Copy-Item server/.env.example server/.env
```

Configure `server/.env` with your PostgreSQL credentials and admin password:

```dotenv
PGHOST=localhost
PGPORT=5432
PGDATABASE=wifi_attendance
PGUSER=postgres
PGPASSWORD=your-database-password

# Set your administrator password (8–256 characters)
ADMIN_PASSWORD=your-secure-password

PORT=3000
# Set to false for local HTTP. Set to true only behind HTTPS.
COOKIE_SECURE=false
```

> **Note**: Quote any values containing spaces or `#`, e.g. `PGPASSWORD="my#password"`.

---

## Running the Application

### 1. Install Dependencies

Install all dependencies for root, server, and client with a single command:

```powershell
npm install
```

### 2. Start the Attendance Server

Build the client bundle and start the unified production server:

```powershell
npm start
```

- **Student Check-In**: `http://localhost:3000` (or your local network IP)
- **Admin Portal**: `http://localhost:3000/admin`
- **Backend API**: `http://localhost:3000/api`

### 3. Local Wi-Fi / Classroom Access

To allow students to access the portal from their mobile devices over the local Wi-Fi network:
1. Ensure the host laptop and student mobile devices are connected to the same Wi-Fi network (a dedicated Wi-Fi router or campus Access Point is recommended for 40+ students).
2. Upon running `npm start`, the server automatically renders a scannable **QR code** in the terminal alongside the resolved **Network URL** (e.g., `http://192.168.1.X:3000`).
3. Students can scan the QR code with their mobile phone cameras to open the check-in portal instantly—no internet connection required.

---

## Scripts & Checks

From the project root:
- `npm start`: Builds the frontend and starts the high-performance unified server on port 3000.
- `npm run dev`: Runs backend watcher and Vite dev server concurrently for development.

From `client`:
- `npm run build`: Type-checks and builds the production bundle (`tsc -b && vite build`).
- `npm run lint`: Runs ESLint across the frontend codebase.

From `server`:
- `npm run dev`: Runs the backend with Node's file watcher (`node --watch src/index.js`).
- `npm start`: Runs the backend in production mode.
