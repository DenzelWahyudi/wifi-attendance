import { useEffect, useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { ConnectionStatus, Portal, PortalCard } from "../components/Portal"
import { Icon } from "../components/Icons"
import {
    AttendanceBadge,
    Button,
    ErrorNotice,
    FieldHint,
    FieldLabel,
    FormIcon,
    Input,
    InputGroup,
    Spinner
} from "../components/ui"
import {
    api,
    errorMessage,
    formatDate,
    formatTime,
    post,
    type AttendanceReceipt,
    type VerificationState
} from "../lib/api"
import { getDeviceId } from "../lib/device"

function checkIsMobile(): boolean {
    if (typeof window === "undefined") return true
    const ua = navigator.userAgent || ""
    const isMobileUa =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua)
    const hasTouch = navigator.maxTouchPoints > 0
    const isNarrow = window.innerWidth <= 768
    return isMobileUa || (hasTouch && isNarrow)
}

export default function StudentPage() {
    const [identity, setIdentity] = useState("")
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState("")
    const [receipt, setReceipt] = useState<AttendanceReceipt | null>(null)
    const [isMobile, setIsMobile] = useState(checkIsMobile)

    const [verificationState, setVerificationState] = useState<VerificationState | null>(null)
    const [verifying, setVerifying] = useState(false)
    const [verificationPin, setVerificationPin] = useState("")
    const [verificationError, setVerificationError] = useState("")
    const [verifiedCycle, setVerifiedCycle] = useState<number | null>(null)

    useEffect(() => {
        const handleResize = () => setIsMobile(checkIsMobile())
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    useEffect(() => {
        if (!receipt) return

        let active = true
        const check = async () => {
            try {
                const state = await api<VerificationState>("/attendance/verification-state")
                if (active) {
                    setVerificationState(state)
                    if (receipt.verifiedAt && state.cycleCount > 0 && verifiedCycle === null) {
                        setVerifiedCycle(state.cycleCount)
                    }
                }
            } catch {
                // Ignore temporary network disconnects
            }
        }

        void check()
        const timer = window.setInterval(check, 3000)
        const onVisibility = () => {
            if (!document.hidden) void check()
        }
        document.addEventListener("visibilitychange", onVisibility)

        return () => {
            active = false
            window.clearInterval(timer)
            document.removeEventListener("visibilitychange", onVisibility)
        }
    }, [receipt, receipt?.verifiedAt, verifiedCycle])

    async function attend(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (busy) return
        setError("")
        setBusy(true)
        try {
            const res = await post<AttendanceReceipt>("/attendance", {
                identityNumber: identity.trim(),
                deviceId: getDeviceId()
            })
            setReceipt(res)
            if (res.verifiedAt) {
                setVerifiedCycle(verificationState?.cycleCount ?? null)
            }
        } catch (failure) {
            setError(errorMessage(failure))
        } finally {
            setBusy(false)
        }
    }

    async function handleVerify(e?: FormEvent) {
        if (e) e.preventDefault()
        if (verifying || !verificationState?.active) return
        setVerifying(true)
        setVerificationError("")
        try {
            await post("/attendance/verify", {
                identityNumber: identity.trim(),
                deviceId: getDeviceId(),
                pin: verificationPin.trim()
            })
            setVerifiedCycle(verificationState.cycleCount)
            setVerificationPin("")
        } catch (err) {
            setVerificationError(errorMessage(err))
        } finally {
            setVerifying(false)
        }
    }

    const isVerifiedForCurrentCycle =
        Boolean(
            verificationState &&
                verificationState.cycleCount > 0 &&
                verifiedCycle === verificationState.cycleCount
        )

    const isMissedVerification =
        Boolean(
            verificationState &&
                !verificationState.active &&
                verificationState.cycleCount > 0 &&
                verifiedCycle !== verificationState.cycleCount
        )

    const studentStatus: "verified" | "unverified" | "present" =
        isVerifiedForCurrentCycle
            ? "verified"
            : isMissedVerification
              ? "unverified"
              : "present"

    return (
        <Portal>
            <PortalCard
                label="STUDENT CHECK-IN"
                status={<ConnectionStatus />}
                footer={isMobile ? "YOUR PRESENCE MATTERS." : "CAMPUS ATTENDANCE"}
            >
                {!isMobile ? (
                    <div className="py-2" role="status">
                        <FormIcon name="smartphone" />
                        <h2 className="text-[27px] leading-[1.22] font-semibold tracking-[-.9px] lg:text-[30px]">
                            Mobile device
                            <br />required.
                        </h2>
                        <p className="mt-[13px] max-w-[320px] text-sm leading-[1.9] text-[#87808a]">
                            Student check-in can only be accessed from a mobile phone or smartphone connected to the campus Wi-Fi.
                        </p>
                        <div className="my-6 space-y-2.5 rounded-lg border border-[#eee9ed] bg-[#faf9fa] p-[18px] text-[13px] text-[#746979]">
                            <div className="flex items-start gap-2.5">
                                <Icon name="wifi" size={17} className="mt-0.5 text-[#9a80b8]" />
                                <p className="text-xs leading-[1.7]">
                                    Connect your mobile phone to the Wi-Fi network.
                                </p>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <Icon name="smartphone" size={17} className="mt-0.5 text-[#9a80b8]" />
                                <p className="text-xs leading-[1.7]">
                                    Open this URL in your mobile browser to mark attendance.
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 flex flex-col gap-3">
                            <Link
                                to="/admin"
                                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[7px] border border-[#d9d0de] bg-white px-4 py-2.5 text-xs font-semibold text-[#614b68] transition-colors hover:bg-[#faf7fb]"
                            >
                                <Icon name="lock" size={15} className="mr-2 text-[#9a80b8]" />
                                Go to Admin Dashboard
                            </Link>
                        </div>
                    </div>
                ) : receipt ? (
                    <div className="py-7" role="status" aria-live="polite">
                        <div className="mb-[23px] flex size-[66px] items-center justify-center rounded-full border border-[#d9eadf] bg-[#edf6ef] text-[#448163]">
                            <Icon name="check" size={30} />
                        </div>
                        <h2 className="text-[27px] leading-[1.22] font-semibold tracking-[-.9px] lg:text-[30px]">
                            {receipt.alreadyAttended
                                ? "Already checked in."
                                : "You’re on the list."}
                        </h2>
                        <p className="mt-3 text-sm leading-[1.8] text-[#87808a]">
                            {receipt.alreadyAttended
                                ? "Your attendance is already recorded for this session."
                                : "Your attendance has been recorded. Have a great session!"}
                        </p>

                        {/* Active Pop Check-In Alert */}
                        {verificationState?.active && !isVerifiedForCurrentCycle && (
                            <div className="my-5 overflow-hidden rounded-xl border-2 border-[#b54a67] bg-[#fdf5f7] p-4 text-[#5e2235] shadow-md animate-enter">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#9b2a4c]">
                                        <span className="size-2 animate-ping rounded-full bg-[#a32c4e]" />
                                        Pop Check-In Active
                                    </div>
                                    <span className="font-mono text-xs font-semibold text-[#a32c4e] rounded bg-white px-2 py-0.5 border border-[#e5ccd3]">
                                        {verificationState.remainingSeconds ?? 0}s left
                                    </span>
                                </div>

                                <p className="mt-2 text-xs leading-relaxed text-[#733e50]">
                                    {verificationState.type === "pin"
                                        ? "Enter the 4-digit PIN code displayed on the classroom screen to verify your presence."
                                        : "Tap below to confirm you are still connected to campus Wi-Fi."}
                                </p>

                                <form onSubmit={handleVerify} className="mt-3.5 space-y-3">
                                    {verificationState.type === "pin" && (
                                        <div>
                                            <InputGroup className="bg-white border-[#d8b0be]">
                                                <Icon name="lock" size={18} className="text-[#a44264]" />
                                                <Input
                                                    placeholder="Enter 4-digit PIN"
                                                    value={verificationPin}
                                                    onChange={(e) => setVerificationPin(e.target.value)}
                                                    maxLength={6}
                                                    required
                                                    autoFocus
                                                    inputMode="numeric"
                                                    className="font-mono text-base font-bold tracking-widest text-[#5e2235] placeholder:tracking-normal placeholder:font-normal placeholder:text-xs"
                                                    disabled={verifying}
                                                />
                                            </InputGroup>
                                        </div>
                                    )}

                                    {verificationError && (
                                        <ErrorNotice className="text-xs py-2">{verificationError}</ErrorNotice>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full bg-[#8c2343] hover:bg-[#721c36] text-white"
                                        disabled={verifying}
                                    >
                                        {verifying ? (
                                            <>
                                                <Spinner />
                                                Verifying presence…
                                            </>
                                        ) : verificationState.type === "pin" ? (
                                            "Submit PIN"
                                        ) : (
                                            "I'm Still Here (Confirm Presence)"
                                        )}
                                    </Button>
                                </form>
                            </div>
                        )}

                        {/* Verified notification */}
                        {isVerifiedForCurrentCycle && (
                            <div className="my-5 rounded-lg border border-[#cbe4d4] bg-[#edf7f0] p-3.5 text-center text-xs font-semibold text-[#307051]">
                                <div className="flex items-center justify-center gap-2">
                                    <Icon name="checkCircle" size={17} />
                                    <span>Presence verified for current check-in!</span>
                                </div>
                                <p className="mt-1 font-normal text-[11px] text-[#4d7f67]">
                                    Your physical presence on campus Wi-Fi has been recorded.
                                </p>
                            </div>
                        )}

                        {/* Missed check-in warning */}
                        {isMissedVerification && (
                            <div className="my-5 rounded-lg border border-[#f3ccd4] bg-[#fdf2f4] p-3.5 text-xs text-[#9b2a4c]">
                                <div className="flex items-start gap-2">
                                    <Icon name="info" size={16} className="mt-0.5 shrink-0" />
                                    <span>
                                        You missed the recent pop check-in. Your status is now marked as <strong>Unverified / Left Early</strong>.
                                    </span>
                                </div>
                            </div>
                        )}

                        <dl className="my-6 space-y-[15px] rounded-lg border border-[#eee9ed] bg-[#faf9fa] p-[18px] text-[13px]">
                            <div className="flex items-center justify-between gap-[18px]">
                                <dt className="text-[#89828c]">Student</dt>
                                <dd className="text-right font-semibold wrap-anywhere">
                                    {receipt.name}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between gap-[18px]">
                                <dt className="text-[#89828c]">Status</dt>
                                <dd>
                                    <AttendanceBadge status={studentStatus} />
                                </dd>
                            </div>
                            <div className="flex items-center justify-between gap-[18px]">
                                <dt className="text-[#89828c]">Checked in</dt>
                                <dd className="text-right font-semibold">
                                    {formatTime(receipt.attendedAt)} ·{" "}
                                    {formatDate(receipt.attendedAt, true)}
                                </dd>
                            </div>
                        </dl>
                        <Button
                            className="w-full"
                            onClick={() => {
                                setReceipt(null)
                                setIdentity("")
                                setVerifiedCycle(null)
                                setVerificationPin("")
                                setVerificationError("")
                            }}
                        >
                            Back to check-in
                            <Icon name="arrow" size={18} className="ml-auto" />
                        </Button>
                        <span className="mt-4 block text-center text-[11px] text-[#a1939a]">
                            Keep this tab open or revisit it when your instructor announces a pop check-in.
                        </span>
                    </div>
                ) : (
                    <>
                        <FormIcon name="id" />
                        <h2 className="text-[27px] leading-[1.22] font-semibold tracking-[-.9px] lg:text-[30px]">
                            A little check-in.
                            <br />A great start.
                        </h2>
                        <p className="mt-[13px] max-w-[320px] text-sm leading-[1.9] text-[#87808a]">
                            Enter your student identity number to mark your attendance for the
                            current session.
                        </p>
                        <form onSubmit={attend} className="mt-[26px]">
                            <FieldLabel htmlFor="student-identity">
                                Student identity number{" "}
                            </FieldLabel>
                            <InputGroup>
                                <Icon name="id" size={19} />
                                <Input
                                    id="student-identity"
                                    name="identityNumber"
                                    className="text-base"
                                    placeholder="e.g. 535260001"
                                    value={identity}
                                    onChange={(event) => setIdentity(event.target.value)}
                                    required
                                    maxLength={32}
                                    pattern="[A-Za-z0-9\-]+"
                                    title="Letters, numbers, and hyphens only"
                                    autoComplete="off"
                                    spellCheck={false}
                                    aria-describedby="identity-hint"
                                    disabled={busy}
                                />
                            </InputGroup>
                            <FieldHint id="identity-hint">
                                Use the identity number registered by your administrator.
                            </FieldHint>
                            {error && <ErrorNotice className="mt-[15px]">{error}</ErrorNotice>}
                            <Button
                                className="mt-[23px] min-h-[47px] w-full px-4 py-3"
                                type="submit"
                                disabled={busy}
                            >
                                {busy ? (
                                    <>
                                        <Spinner />
                                        Recording attendance…
                                    </>
                                ) : (
                                    <>
                                        Attend
                                        <Icon name="arrow" size={19} className="ml-auto" />
                                    </>
                                )}
                            </Button>
                        </form>
                        <div className="mt-[25px] flex items-start gap-[9px] border-t border-[#eee9ed] pt-[21px] pb-[26px] text-[#9c9199]">
                            <Icon name="info" size={17} className="mt-0.5" />
                            <p className="text-xs leading-[1.8] text-[#89808a]">
                                One check-in is all you need. Your administrator will see your
                                attendance automatically.
                            </p>
                        </div>
                    </>
                )}
            </PortalCard>
        </Portal>
    )
}
