export class ApiError extends Error {
    status: number
    constructor(message: string, status: number) {
        super(message)
        this.status = status
    }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
    let response: Response
    try {
        response = await fetch(`/api${path}`, {
            ...options,
            credentials: "same-origin",
            headers: { "Content-Type": "application/json", ...options.headers },
            signal: options.signal ?? AbortSignal.timeout(10000)
        })
    } catch (error) {
        if (options.signal?.aborted) throw error
        throw new ApiError("Could not reach the attendance server. Please try again.", 0)
    }
    const data = await response.json().catch(() => null)
    if (!response.ok || !data) {
        throw new ApiError(
            data?.error || "The attendance service is unavailable. Please try again shortly.",
            response.status
        )
    }
    return data as T
}

export const post = <T>(path: string, data: unknown = {}) =>
    api<T>(path, { method: "POST", body: JSON.stringify(data) })
export const errorMessage = (error: unknown) =>
    error instanceof Error ? error.message : "Something went wrong. Please try again."

export type Student = {
    id: number
    name: string
    identityNumber: string
    attendedAt: string | null
}
export type AttendanceData = { startedAt: string; students: Student[] }
export type AttendanceReceipt = { name: string; attendedAt: string; alreadyAttended: boolean }

export const formatDate = (date: string | Date, short = false) =>
    new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: short ? "short" : "long",
        year: "numeric"
    }).format(new Date(date))
export const formatTime = (date: string | Date) =>
    new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    }).format(new Date(date))
