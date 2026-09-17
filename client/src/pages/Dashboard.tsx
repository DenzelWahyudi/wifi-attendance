import { useCallback, useEffect, useRef, useState } from "react"
import { AttendanceSummary } from "../components/AttendanceSummary"
import { AttendanceTable } from "../components/AttendanceTable"
import { DashboardLayout } from "../components/DashboardLayout"
import { Icon } from "../components/Icons"
import { AddStudent, ResetAttendance } from "../components/StudentDialogs"
import { Button, ErrorNotice, IconButton } from "../components/ui"
import { api, ApiError, errorMessage, formatTime, post, type AttendanceData } from "../lib/api"

export default function Dashboard({ onSignedOut }: { onSignedOut: () => void }) {
    const [data, setData] = useState<AttendanceData | null>(null)
    const [error, setError] = useState("")
    const [toast, setToast] = useState("")
    const [lastSync, setLastSync] = useState<Date | null>(null)
    const [modal, setModal] = useState<"add" | "reset" | null>(null)
    const [signingOut, setSigningOut] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const requestNumber = useRef(0)

    const refresh = useCallback(
        async (signal?: AbortSignal) => {
            const request = ++requestNumber.current
            try {
                const result = await api<AttendanceData>("/admin/students", { signal })
                if (request !== requestNumber.current || signal?.aborted) return
                setData(result)
                setLastSync(new Date())
                setError("")
            } catch (failure) {
                if (
                    (signal?.aborted && signal.reason?.name !== "TimeoutError") ||
                    request !== requestNumber.current
                )
                    return
                if (failure instanceof ApiError && failure.status === 401) onSignedOut()
                else setError(errorMessage(failure))
            }
        },
        [onSignedOut]
    )

    useEffect(() => {
        const controller = new AbortController()
        let updating = false
        const update = async () => {
            if (updating) return
            updating = true
            await refresh(AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]))
            updating = false
        }
        void update()
        const interval = window.setInterval(() => {
            if (!document.hidden) void update()
        }, 5000)
        const onVisible = () => {
            if (!document.hidden) void update()
        }
        document.addEventListener("visibilitychange", onVisible)
        return () => {
            controller.abort()
            window.clearInterval(interval)
            document.removeEventListener("visibilitychange", onVisible)
        }
    }, [refresh])

    useEffect(() => {
        if (!toast) return
        const timer = window.setTimeout(() => setToast(""), 6000)
        return () => window.clearTimeout(timer)
    }, [toast])

    async function signOut() {
        setSigningOut(true)
        try {
            await post("/admin/logout")
            onSignedOut()
        } catch (failure) {
            setError(errorMessage(failure))
            setSigningOut(false)
        }
    }

    async function manualRefresh() {
        setRefreshing(true)
        await refresh()
        setRefreshing(false)
    }

    async function onSaved(message: string) {
        setModal(null)
        setToast(message)
        await refresh()
    }

    const present = data?.students.filter((student) => student.attendedAt).length ?? 0

    return (
        <>
            <DashboardLayout onSignOut={signOut} signingOut={signingOut}>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-[17px] md:mb-[26px] md:flex-nowrap md:items-start md:gap-5 xl:items-center">
                    <div>
                        <span className="mb-[9px] block text-[9px] font-semibold tracking-[1.8px] text-[#a17b8b] md:text-[10px]">
                            A CONNECTED CAMPUS
                        </span>
                        <h1 className="text-[28px] leading-tight font-semibold tracking-[-.9px] md:text-2xl lg:text-[26px] xl:text-[30px] 2xl:text-[35px]">
                            Attendance overview<span className="text-wine">.</span>
                        </h1>
                        <p className="mt-2 text-xs leading-[1.7] text-[#817287] md:max-w-[235px] md:text-[11px] lg:max-w-none lg:text-[13px]">
                            A clear view of your students. A simpler way to keep track.
                        </p>
                    </div>
                    <div className="flex w-full gap-[9px] md:w-auto md:flex-col-reverse md:gap-1.5 xl:flex-row xl:gap-[9px] xl:pt-[15px]">
                        <Button
                            variant="secondary"
                            className="min-h-[39px] px-3 py-[9px] text-xs md:min-h-[33px] md:px-2.5 md:py-[7px] md:text-[11px] xl:min-h-[39px] xl:px-[13px] xl:py-[9px] xl:text-xs"
                            onClick={() => setModal("reset")}
                            disabled={!data}
                        >
                            <Icon name="reset" size={16} />
                            Reset attendance
                        </Button>
                        <Button
                            className="ml-auto min-h-[39px] px-3 py-[9px] text-xs md:ml-0 md:min-h-[33px] md:px-2.5 md:py-[7px] md:text-[11px] xl:min-h-[39px] xl:px-[13px] xl:py-[9px] xl:text-xs"
                            onClick={() => setModal("add")}
                        >
                            <Icon name="plus" size={18} />
                            Add student
                        </Button>
                    </div>
                </div>
                <AttendanceSummary data={data} />
                {error && (
                    <div className="mb-[18px] flex items-center gap-3.5">
                        <ErrorNotice className="flex-1">
                            {error} {data && "The last saved attendance is shown below."}
                        </ErrorNotice>
                        <Button
                            variant="text"
                            className="shrink-0"
                            onClick={manualRefresh}
                            disabled={refreshing}
                        >
                            Try again
                        </Button>
                    </div>
                )}
                <AttendanceTable
                    data={data}
                    error={error}
                    refreshing={refreshing}
                    onRefresh={manualRefresh}
                    onAdd={() => setModal("add")}
                />
                <div className="mt-[19px] flex flex-col items-center justify-between gap-[9px] text-center text-[9px] text-[#ae9dbc] md:flex-row md:items-start md:gap-[15px] md:text-left lg:items-center lg:text-[10px]">
                    <span className="flex items-center gap-1.5">
                        <Icon name="shield" size={14} />
                        Attendance stays saved until you reset the session.
                    </span>
                    <span className="md:whitespace-nowrap">
                        {lastSync
                            ? `Last updated at ${formatTime(lastSync)}`
                            : "UNTAR · Attendance portal"}
                    </span>
                </div>
            </DashboardLayout>
            {toast && (
                <div
                    className="animate-enter fixed right-4 bottom-[17px] z-40 flex max-w-[min(440px,calc(100%-32px))] items-center gap-[11px] rounded-[9px] border border-[#d7e5db] bg-white px-4 py-[13px] text-[13px] text-[#477a62] shadow-[0_8px_40px_#35283820] motion-reduce:animate-none md:right-7 md:bottom-[25px] md:text-sm"
                    role="status"
                >
                    <Icon name="checkCircle" size={21} />
                    <span className="wrap-anywhere">{toast}</span>
                    <IconButton aria-label="Dismiss notification" onClick={() => setToast("")}>
                        <Icon name="x" size={16} />
                    </IconButton>
                </div>
            )}
            {modal === "add" && (
                <AddStudent
                    onClose={() => setModal(null)}
                    onSaved={onSaved}
                    onUnauthorized={onSignedOut}
                />
            )}
            {modal === "reset" && (
                <ResetAttendance
                    count={present}
                    onClose={() => setModal(null)}
                    onSaved={onSaved}
                    onUnauthorized={onSignedOut}
                />
            )}
        </>
    )
}
