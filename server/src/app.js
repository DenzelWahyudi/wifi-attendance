const express = require("express")
const { createHash, randomBytes, timingSafeEqual } = require("node:crypto")
const { rateLimit } = require("express-rate-limit")

const SESSION_MS = 8 * 60 * 60 * 1000
const COOKIE = "attendance_admin"
const studentColumns = 'id, name, identity_number AS "identityNumber", attended_at AS "attendedAt"'
const hash = (value) => createHash("sha256").update(value).digest()
const validIdentity = (value) =>
    typeof value === "string" && /^[A-Za-z0-9-]{1,32}$/.test(value.trim())

function createApp({ pool, adminPassword, secureCookies = false }) {
    const app = express()
    const sessions = new Map()
    const passwordHash = hash(adminPassword)
    const cookieOptions = {
        httpOnly: true,
        sameSite: "strict",
        secure: secureCookies,
        path: "/api"
    }
    app.disable("x-powered-by")
    app.use("/api", (req, res, next) => {
        res.set({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" })
        if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
            if (!req.is("application/json"))
                return res.status(415).json({ error: "Send the request as JSON." })
            const origin = req.get("origin")
            if (origin) {
                try {
                    if (new URL(origin).host !== req.get("host")) {
                        return res
                            .status(403)
                            .json({ error: "This request must come from the attendance website." })
                    }
                } catch {
                    return res.status(403).json({ error: "Invalid request origin." })
                }
            }
        }
        next()
    })
    app.use(express.json({ limit: "4kb" }))
    app.use("/api", (req, res, next) => {
        const now = Date.now()
        for (const [token, expiry] of sessions) if (expiry <= now) sessions.delete(token)
        const cookie = (req.headers.cookie || "")
            .split(";")
            .map((item) => item.trim())
            .find((item) => item.startsWith(`${COOKIE}=`))
        req.sessionToken = cookie?.slice(COOKIE.length + 1)
        req.isAdmin = sessions.has(req.sessionToken)
        next()
    })
    const requireAdmin = (req, res, next) => {
        if (!req.isAdmin) return res.status(401).json({ error: "Please sign in to continue." })
        next()
    }
    // A shared limit also protects the password behind Vite's proxy.
    const loginLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 10,
        skipSuccessfulRequests: true,
        keyGenerator: () => "admin-login",
        standardHeaders: "draft-8",
        legacyHeaders: false,
        message: { error: "Too many sign-in attempts. Please try again in 15 minutes." }
    })
    const attendanceLimiter = rateLimit({
        windowMs: 60 * 1000,
        limit: 600,
        keyGenerator: () => "attendance",
        standardHeaders: "draft-8",
        legacyHeaders: false,
        message: { error: "There are too many check-ins right now. Please try again in a minute." }
    })

    app.get("/api/health", async (req, res) => {
        await pool.query("SELECT 1")
        res.json({ status: "ready" })
    })

    app.get("/api/admin/session", (req, res) => res.json({ authenticated: req.isAdmin }))

    app.post("/api/admin/login", loginLimiter, (req, res) => {
        const password = req.body?.password
        if (typeof password !== "string" || !timingSafeEqual(hash(password), passwordHash)) {
            return res.status(401).json({ error: "That password is incorrect. Please try again." })
        }
        sessions.delete(req.sessionToken)
        if (sessions.size >= 100) sessions.delete(sessions.keys().next().value)
        const token = randomBytes(32).toString("hex")
        sessions.set(token, Date.now() + SESSION_MS)
        res.cookie(COOKIE, token, { ...cookieOptions, maxAge: SESSION_MS })
        res.json({ authenticated: true })
    })

    app.post("/api/admin/logout", (req, res) => {
        sessions.delete(req.sessionToken)
        res.clearCookie(COOKIE, cookieOptions)
        res.json({ authenticated: false })
    })

    app.get("/api/admin/students", requireAdmin, async (req, res) => {
        const { rows } = await pool.query(`
      SELECT started_at AS "startedAt",
        (SELECT COALESCE(json_agg(student_list), '[]'::json)
         FROM (SELECT ${studentColumns} FROM students ORDER BY lower(name), identity_number) student_list) AS students
      FROM attendance_state WHERE id = 1
    `)
        if (!rows[0]) throw new Error("Attendance state is missing.")
        res.json(rows[0])
    })

    app.post("/api/admin/students", requireAdmin, async (req, res) => {
        const name =
            typeof req.body?.name === "string" ? req.body.name.trim().replace(/\s+/g, " ") : ""
        const identity = req.body?.identityNumber
        if (!name || name.length > 100 || /[\x00-\x1f\x7f]/.test(name)) {
            return res
                .status(400)
                .json({ error: "Enter a student name between 1 and 100 characters." })
        }
        if (!validIdentity(identity)) {
            return res
                .status(400)
                .json({ error: "Use 1–32 letters, numbers, or hyphens for the identity number." })
        }
        try {
            const { rows } = await pool.query(
                `INSERT INTO students (name, identity_number) VALUES ($1, $2) RETURNING ${studentColumns}`,
                [name, identity.trim()]
            )
            res.status(201).json({ student: rows[0] })
        } catch (error) {
            if (error.code === "23505")
                return res
                    .status(409)
                    .json({ error: "A student with that identity number already exists." })
            throw error
        }
    })

    app.post("/api/attendance", attendanceLimiter, async (req, res) => {
        const identity = req.body?.identityNumber
        if (!validIdentity(identity)) {
            return res.status(400).json({
                error: "Enter a valid identity number using letters, numbers, or hyphens."
            })
        }
        const client = await pool.connect()
        try {
            await client.query("BEGIN")
            // Reset takes an exclusive lock: an overlapping check-in belongs wholly
            // to either the old session or the new one.
            await client.query("SELECT id FROM attendance_state WHERE id = 1 FOR SHARE")
            const { rows } = await client.query(
                'SELECT name, attended_at AS "attendedAt" FROM students WHERE identity_number = $1 FOR UPDATE',
                [identity.trim()]
            )
            if (!rows[0]) {
                await client.query("ROLLBACK")
                return res.status(404).json({
                    error: "This identity number is not registered. Please contact your administrator."
                })
            }
            const alreadyAttended = rows[0].attendedAt !== null
            let attendedAt = rows[0].attendedAt
            if (!alreadyAttended) {
                const result = await client.query(
                    "UPDATE students SET attended_at = clock_timestamp() WHERE identity_number = $1 RETURNING attended_at",
                    [identity.trim()]
                )
                attendedAt = result.rows[0].attended_at
            }
            await client.query("COMMIT")
            res.json({ name: rows[0].name, attendedAt, alreadyAttended })
        } catch (error) {
            await client.query("ROLLBACK")
            throw error
        } finally {
            client.release()
        }
    })

    app.post("/api/admin/reset", requireAdmin, async (req, res) => {
        if (req.body?.confirm !== true)
            return res.status(400).json({ error: "Please confirm the attendance reset." })
        const client = await pool.connect()
        try {
            await client.query("BEGIN")
            await client.query("SELECT id FROM attendance_state WHERE id = 1 FOR UPDATE")
            await client.query(
                "UPDATE students SET attended_at = NULL WHERE attended_at IS NOT NULL"
            )
            const { rows } = await client.query(
                'UPDATE attendance_state SET started_at = clock_timestamp() WHERE id = 1 RETURNING started_at AS "startedAt"'
            )
            await client.query("COMMIT")
            res.json({ startedAt: rows[0].startedAt })
        } catch (error) {
            await client.query("ROLLBACK")
            throw error
        } finally {
            client.release()
        }
    })

    app.use("/api", (req, res) => res.status(404).json({ error: "This endpoint does not exist." }))

    app.use((error, req, res, next) => {
        if (res.headersSent) return next(error)
        if (error.type === "entity.parse.failed")
            return res.status(400).json({ error: "The request contains invalid JSON." })
        if (error.type === "entity.too.large")
            return res.status(413).json({ error: "The request is too large." })
        console.error("API error:", error.message)
        res.status(503).json({
            error: "The attendance service is unavailable. Please try again shortly."
        })
    })
    return app
}

module.exports = { createApp }
