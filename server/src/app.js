const path = require("node:path")
const express = require("express")
const compression = require("compression")
const { createHash, randomBytes, timingSafeEqual } = require("node:crypto")
const { rateLimit } = require("express-rate-limit")

const SESSION_MS = 8 * 60 * 60 * 1000
const COOKIE = "attendance_admin"
const studentColumns =
    'id, name, identity_number AS "identityNumber", attended_at AS "attendedAt", verified_at AS "verifiedAt", device_id AS "deviceId", ip_address AS "ipAddress"'
const hash = (value) => createHash("sha256").update(value).digest()
const validIdentity = (value) =>
    typeof value === "string" && /^[A-Za-z0-9-]{1,32}$/.test(value.trim())
const validDeviceId = (value) =>
    typeof value === "string" && /^[A-Za-z0-9-]{16,64}$/.test(value.trim())

function getClientIp(req) {
    let ip = req.ip || req.socket?.remoteAddress || ""
    if (ip.startsWith("::ffff:")) {
        ip = ip.slice(7)
    }
    return ip.trim()
}

const isLoopbackIp = (ip) =>
    !ip || ip === "127.0.0.1" || ip === "::1" || ip === "localhost"

const isMobileUserAgent = (ua) =>
    typeof ua === "string" &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua)

function createApp({ pool, adminPassword, secureCookies = false }) {
    const app = express()
    app.use(compression())
    app.set("trust proxy", true)
    const sessions = new Map()
    const passwordHash = hash(adminPassword)
    const cookieOptions = {
        httpOnly: true,
        sameSite: "strict",
        secure: secureCookies,
        path: "/api"
    }

    let verificationCache = null
    let verificationCacheTime = 0
    const invalidateVerificationCache = () => {
        verificationCache = null
        verificationCacheTime = 0
    }

    const distPath = path.resolve(__dirname, "../../client/dist")
    app.use(
        "/assets",
        express.static(path.join(distPath, "assets"), {
            maxAge: "1y",
            immutable: true
        })
    )
    app.use(
        express.static(distPath, {
            maxAge: "1h",
            index: false
        })
    )
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
        verification_type AS "verificationType",
        verification_pin AS "verificationPin",
        verification_started_at AS "verificationStartedAt",
        verification_expires_at AS "verificationExpiresAt",
        verification_cycle_count AS "verificationCycleCount",
        (verification_expires_at IS NOT NULL AND verification_expires_at > clock_timestamp()) AS "verificationActive",
        GREATEST(0, ROUND(EXTRACT(EPOCH FROM (verification_expires_at - clock_timestamp()))))::integer AS "verificationRemainingSeconds",
        (SELECT COALESCE(json_agg(student_list), '[]'::json)
         FROM (SELECT ${studentColumns} FROM students ORDER BY lower(name), identity_number) student_list) AS students
      FROM attendance_state WHERE id = 1
    `)
        if (!rows[0]) throw new Error("Attendance state is missing.")
        res.json(rows[0])
    })

    app.post("/api/admin/verification/start", requireAdmin, async (req, res) => {
        const type = req.body?.type === "pin" ? "pin" : "tap"
        const durationSeconds = Math.max(30, Math.min(600, Number(req.body?.durationSeconds) || 120))
        let pin = null
        if (type === "pin") {
            pin = Math.floor(1000 + Math.random() * 9000).toString()
        }
        const client = await pool.connect()
        try {
            await client.query("BEGIN")
            // Reset previous cycle's verified_at for a new cycle
            await client.query("UPDATE students SET verified_at = NULL WHERE attended_at IS NOT NULL")
            const { rows } = await client.query(
                `UPDATE attendance_state
                 SET verification_type = $1,
                     verification_pin = $2,
                     verification_started_at = clock_timestamp(),
                     verification_expires_at = clock_timestamp() + ($3 || ' seconds')::interval,
                     verification_cycle_count = verification_cycle_count + 1
                 WHERE id = 1
                 RETURNING verification_type AS "verificationType",
                           verification_pin AS "verificationPin",
                           verification_started_at AS "verificationStartedAt",
                           verification_expires_at AS "verificationExpiresAt",
                           verification_cycle_count AS "verificationCycleCount"`,
                [type, pin, durationSeconds]
            )
            await client.query("COMMIT")
            invalidateVerificationCache()
            res.json({
                ...rows[0],
                verificationActive: true,
                verificationRemainingSeconds: durationSeconds
            })
        } catch (error) {
            await client.query("ROLLBACK")
            throw error
        } finally {
            client.release()
        }
    })

    app.post("/api/admin/verification/stop", requireAdmin, async (req, res) => {
        const { rows } = await pool.query(
            `UPDATE attendance_state
             SET verification_expires_at = clock_timestamp()
             WHERE id = 1
             RETURNING verification_type AS "verificationType",
                       verification_started_at AS "verificationStartedAt",
                       verification_expires_at AS "verificationExpiresAt",
                       verification_cycle_count AS "verificationCycleCount"`
        )
        invalidateVerificationCache()
        res.json({
            ...rows[0],
            verificationActive: false,
            verificationRemainingSeconds: 0
        })
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
        const deviceId = req.body?.deviceId
        if (!validIdentity(identity)) {
            return res.status(400).json({
                error: "Enter a valid identity number using letters, numbers, or hyphens."
            })
        }
        if (!validDeviceId(deviceId)) {
            return res.status(400).json({
                error: "Invalid device identification. Please reload the page."
            })
        }
        const clientIp = getClientIp(req)
        const isLoopback = isLoopbackIp(clientIp)
        const userAgent = req.get("user-agent") || ""
        if (!isMobileUserAgent(userAgent) && !isLoopback) {
            return res.status(403).json({
                error: "Attendance can only be recorded from a mobile device."
            })
        }
        const trimmedIdentity = identity.trim()
        const trimmedDeviceId = deviceId.trim()

        const client = await pool.connect()
        try {
            await client.query("BEGIN")
            // Reset takes an exclusive lock: an overlapping check-in belongs wholly
            // to either the old session or the new one.
            await client.query("SELECT id FROM attendance_state WHERE id = 1 FOR SHARE")
            const { rows } = await client.query(
                'SELECT id, name, attended_at AS "attendedAt", verified_at AS "verifiedAt", device_id AS "deviceId", ip_address AS "ipAddress" FROM students WHERE identity_number = $1 FOR UPDATE',
                [trimmedIdentity]
            )
            if (!rows[0]) {
                await client.query("ROLLBACK")
                return res.status(404).json({
                    error: "This identity number is not registered. Please contact your administrator."
                })
            }
            const alreadyAttended = rows[0].attendedAt !== null
            let attendedAt = rows[0].attendedAt
            let verifiedAt = rows[0].verifiedAt
            if (!alreadyAttended) {
                const conflictQuery = isLoopback
                    ? "SELECT name FROM students WHERE attended_at IS NOT NULL AND device_id = $1 AND identity_number != $2 LIMIT 1"
                    : "SELECT name FROM students WHERE attended_at IS NOT NULL AND (device_id = $1 OR (ip_address IS NOT NULL AND ip_address = $2)) AND identity_number != $3 LIMIT 1"
                const conflictParams = isLoopback
                    ? [trimmedDeviceId, trimmedIdentity]
                    : [trimmedDeviceId, clientIp, trimmedIdentity]

                const conflictCheck = await client.query(conflictQuery, conflictParams)
                if (conflictCheck.rows.length > 0) {
                    await client.query("ROLLBACK")
                    return res.status(409).json({
                        error: "This device has already been used to check in for this session."
                    })
                }

                const result = await client.query(
                    "UPDATE students SET attended_at = clock_timestamp(), device_id = $2, ip_address = $3 WHERE identity_number = $1 RETURNING attended_at, verified_at",
                    [trimmedIdentity, trimmedDeviceId, clientIp || null]
                )
                attendedAt = result.rows[0].attended_at
                verifiedAt = result.rows[0].verified_at
            }
            await client.query("COMMIT")
            invalidateVerificationCache()
            res.json({ name: rows[0].name, attendedAt, verifiedAt, alreadyAttended })
        } catch (error) {
            await client.query("ROLLBACK")
            throw error
        } finally {
            client.release()
        }
    })

    app.get("/api/attendance/verification-state", async (req, res) => {
        const now = Date.now()
        if (verificationCache && now - verificationCacheTime < 1000) {
            return res.json(verificationCache)
        }
        const { rows } = await pool.query(`
            SELECT 
                (verification_expires_at IS NOT NULL AND verification_expires_at > clock_timestamp()) AS "active",
                verification_type AS "type",
                verification_started_at AS "startedAt",
                verification_expires_at AS "expiresAt",
                verification_cycle_count AS "cycleCount",
                GREATEST(0, ROUND(EXTRACT(EPOCH FROM (verification_expires_at - clock_timestamp()))))::integer AS "remainingSeconds"
            FROM attendance_state WHERE id = 1
        `)
        if (!rows[0] || !rows[0].active) {
            verificationCache = {
                active: false,
                cycleCount: rows[0]?.cycleCount ?? 0
            }
        } else {
            const state = rows[0]
            verificationCache = {
                active: true,
                type: state.type,
                startedAt: state.startedAt,
                expiresAt: state.expiresAt,
                remainingSeconds: state.remainingSeconds,
                cycleCount: state.cycleCount
            }
        }
        verificationCacheTime = now
        res.json(verificationCache)
    })

    app.post("/api/attendance/verify", attendanceLimiter, async (req, res) => {
        const identity = req.body?.identityNumber
        const deviceId = req.body?.deviceId
        const pin = typeof req.body?.pin === "string" ? req.body.pin.trim() : ""

        if (!validIdentity(identity)) {
            return res.status(400).json({
                error: "Enter a valid identity number using letters, numbers, or hyphens."
            })
        }
        if (!validDeviceId(deviceId)) {
            return res.status(400).json({
                error: "Invalid device identification. Please reload the page."
            })
        }

        const clientIp = getClientIp(req)
        const isLoopback = isLoopbackIp(clientIp)
        const userAgent = req.get("user-agent") || ""
        if (!isMobileUserAgent(userAgent) && !isLoopback) {
            return res.status(403).json({
                error: "Verification can only be recorded from a mobile device."
            })
        }

        const trimmedIdentity = identity.trim()
        const trimmedDeviceId = deviceId.trim()

        const client = await pool.connect()
        try {
            await client.query("BEGIN")
            const stateRes = await client.query(
                `SELECT verification_type AS "type",
                        verification_pin AS "pin",
                        verification_expires_at AS "expiresAt",
                        (verification_expires_at IS NOT NULL AND verification_expires_at > clock_timestamp()) AS "active"
                 FROM attendance_state WHERE id = 1 FOR SHARE`
            )
            const state = stateRes.rows[0]
            if (!state || !state.active) {
                await client.query("ROLLBACK")
                return res.status(400).json({
                    error: "No pop check-in is currently running, or the verification window has closed."
                })
            }

            if (state.type === "pin") {
                if (!pin || pin !== state.pin) {
                    await client.query("ROLLBACK")
                    return res.status(400).json({
                        error: "The PIN code entered is incorrect."
                    })
                }
            }

            const { rows } = await client.query(
                'SELECT id, name, attended_at AS "attendedAt", verified_at AS "verifiedAt", device_id AS "deviceId", ip_address AS "ipAddress" FROM students WHERE identity_number = $1 FOR UPDATE',
                [trimmedIdentity]
            )
            if (!rows[0]) {
                await client.query("ROLLBACK")
                return res.status(404).json({
                    error: "This identity number is not registered."
                })
            }
            if (!rows[0].attendedAt) {
                await client.query("ROLLBACK")
                return res.status(400).json({
                    error: "You must check in for attendance before verifying presence."
                })
            }

            if (rows[0].deviceId && rows[0].deviceId !== trimmedDeviceId) {
                await client.query("ROLLBACK")
                return res.status(403).json({
                    error: "Verification must be submitted from the device used to check in."
                })
            }

            const result = await client.query(
                "UPDATE students SET verified_at = clock_timestamp(), ip_address = COALESCE($2, ip_address) WHERE identity_number = $1 RETURNING verified_at",
                [trimmedIdentity, clientIp || null]
            )
            await client.query("COMMIT")
            invalidateVerificationCache()
            res.json({
                name: rows[0].name,
                verifiedAt: result.rows[0].verified_at
            })
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
                "UPDATE students SET attended_at = NULL, verified_at = NULL, device_id = NULL, ip_address = NULL WHERE attended_at IS NOT NULL"
            )
            const { rows } = await client.query(
                `UPDATE attendance_state 
                 SET started_at = clock_timestamp(),
                     verification_type = NULL,
                     verification_pin = NULL,
                     verification_started_at = NULL,
                     verification_expires_at = NULL,
                     verification_cycle_count = 0
                 WHERE id = 1 
                 RETURNING started_at AS "startedAt"`
            )
            await client.query("COMMIT")
            invalidateVerificationCache()
            res.json({ startedAt: rows[0].startedAt })
        } catch (error) {
            await client.query("ROLLBACK")
            throw error
        } finally {
            client.release()
        }
    })

    app.use("/api", (req, res) => res.status(404).json({ error: "This endpoint does not exist." }))

    app.use((req, res, next) => {
        if (req.method !== "GET" && req.method !== "HEAD") return next()
        const indexPath = path.join(distPath, "index.html")
        res.sendFile(indexPath, (err) => {
            if (err) next()
        })
    })

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
