const path = require("node:path")
const { networkInterfaces } = require("node:os")
const { loadEnvFile } = require("node:process")
const { Pool } = require("pg")
const { renderUnicodeCompact } = require("uqr")
const { createApp } = require("./app")

try {
    loadEnvFile(path.join(__dirname, "../.env"))
} catch (error) {
    if (error.code !== "ENOENT") throw error
}

function getPreferredNetworkIp() {
    const interfaces = networkInterfaces()
    let wifiIp = null
    let ethernetIp = null
    let fallbackIp = null

    for (const [name, addrs] of Object.entries(interfaces)) {
        if (!addrs) continue
        for (const addr of addrs) {
            const isIpv4 = addr.family === "IPv4" || addr.family === 4
            if (!isIpv4 || addr.internal) continue

            const lower = name.toLowerCase()
            const isVirtual =
                /vethernet|wsl|virtual|vbox|docker|tailscale|zerotier|loopback/i.test(lower)

            if (/wi-fi|wlan|wireless|airport/i.test(lower)) {
                wifiIp = addr.address
                break
            } else if (!isVirtual && /ethernet|eth|en\d/i.test(lower) && !ethernetIp) {
                ethernetIp = addr.address
            } else if (!isVirtual && !fallbackIp) {
                fallbackIp = addr.address
            }
        }
        if (wifiIp) break
    }
    return wifiIp || ethernetIp || fallbackIp
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
    const pool = new Pool({ connectionTimeoutMillis: 10000, max: 35 })
    pool.on("error", (error) => console.error("PostgreSQL connection error:", error.message))
    try {
        const { rowCount } = await pool.query("SELECT id FROM attendance_state WHERE id = 1")
        await pool.query("SELECT identity_number, name, attended_at, verified_at, device_id, ip_address FROM students LIMIT 0")
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
    const server = app.listen(port, "0.0.0.0", () => {
        const ip = getPreferredNetworkIp()
        const localUrl = `http://localhost:${port}`
        const networkUrl = ip ? `http://${ip}:${port}` : null

        console.log(`\n  UNTAR Attendance System ready!`)
        console.log(`  > Local:   ${localUrl}`)
        if (networkUrl) {
            console.log(`  > Network: ${networkUrl}`)
            console.log(`\n  📱 Scan on mobile to check in:\n`)
            const qr = renderUnicodeCompact(networkUrl, { border: 2 })
            console.log(qr.split("\n").map((line) => `    ${line}`).join("\n"))
            console.log("")
        }
    })
    server.on("error", (error) => {
        if (error.code === "EADDRINUSE") {
            console.error(
                `Port ${port} is already in use by another process. Please stop existing Node instances.`
            )
        } else {
            console.error(`Server error: ${error.message}`)
        }
        process.exit(1)
    })
    const stop = () => server.close(() => pool.end().then(() => process.exit(0)))
    process.once("SIGINT", stop)
    process.once("SIGTERM", stop)
}

start().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
})
