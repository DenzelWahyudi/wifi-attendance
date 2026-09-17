const path = require("node:path")
const { loadEnvFile } = require("node:process")
const { Pool } = require("pg")
const { createApp } = require("./app")

try {
    loadEnvFile(path.join(__dirname, "../.env"))
} catch (error) {
    if (error.code !== "ENOENT") throw error
}

async function start() {
    const password = process.env.ADMIN_PASSWORD
    if (
        !password ||
        password.length < 8 ||
        password.length > 256 ||
        password === "replace-with-your-own-password"
    ) {
        throw new Error(
            "Set ADMIN_PASSWORD to your own password of 8–256 characters in server/.env."
        )
    }
    if (!process.env.PGHOST || !process.env.PGDATABASE || !process.env.PGUSER) {
        throw new Error("Fill in the PostgreSQL connection settings in server/.env first.")
    }
    const pool = new Pool({ connectionTimeoutMillis: 5000, max: 10 })
    pool.on("error", (error) => console.error("PostgreSQL connection error:", error.message))
    try {
        const { rowCount } = await pool.query("SELECT id FROM attendance_state WHERE id = 1")
        await pool.query("SELECT identity_number, name, attended_at FROM students LIMIT 0")
        if (rowCount !== 1)
            throw new Error("Attendance state is missing. Run db.sql in your database.")
    } catch (error) {
        await pool.end()
        throw new Error(`Database setup failed: ${error.message} Check server/.env and run db.sql.`)
    }
    const app = createApp({
        pool,
        adminPassword: password,
        secureCookies: process.env.COOKIE_SECURE === "true"
    })
    const port = Number(process.env.PORT || 3000)
    const server = app.listen(port, "localhost", () => {
        console.log(`Attendance API ready at http://localhost:${port}`)
    })
    const stop = () => server.close(() => pool.end().then(() => process.exit(0)))
    process.once("SIGINT", stop)
    process.once("SIGTERM", stop)
}

start().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
})
