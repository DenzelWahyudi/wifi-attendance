const STORAGE_KEY = "attendance_device_id"

function generateId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID()
    }
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
        const bytes = new Uint8Array(16)
        crypto.getRandomValues(bytes)
        return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
    }
    return (
        "dev-" +
        Date.now().toString(36) +
        "-" +
        Math.random().toString(36).slice(2, 10) +
        "-" +
        Math.random().toString(36).slice(2, 10)
    )
}

function getCookie(name: string): string | null {
    if (typeof document === "undefined") return null
    const match = document.cookie
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${name}=`))
    return match ? decodeURIComponent(match.slice(name.length + 1)) : null
}

function setCookie(name: string, value: string) {
    if (typeof document === "undefined") return
    // Persist for 1 year across the site
    const maxAge = 365 * 24 * 60 * 60
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`
}

export function getDeviceId(): string {
    if (typeof window === "undefined") return ""

    let deviceId: string | null = null

    try {
        deviceId = localStorage.getItem(STORAGE_KEY)
    } catch {
        // localStorage may be disabled or restricted
    }

    if (!deviceId) {
        deviceId = getCookie(STORAGE_KEY)
    }

    if (!deviceId || !/^[A-Za-z0-9-]{16,64}$/.test(deviceId)) {
        deviceId = generateId()
    }

    try {
        localStorage.setItem(STORAGE_KEY, deviceId)
    } catch {
        // Ignore quota/privacy error
    }

    setCookie(STORAGE_KEY, deviceId)

    return deviceId
}
