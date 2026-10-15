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
import { errorMessage, formatDate, formatTime, post, type AttendanceReceipt } from "../lib/api"
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

    useEffect(() => {
        const handleResize = () => setIsMobile(checkIsMobile())
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    async function attend(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (busy) return
        setError("")
        setBusy(true)
        try {
            setReceipt(
                await post<AttendanceReceipt>("/attendance", {
                    identityNumber: identity.trim(),
                    deviceId: getDeviceId()
                })
            )
        } catch (failure) {
            setError(errorMessage(failure))
        } finally {
            setBusy(false)
        }
    }

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
                                    <AttendanceBadge present />
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
                            }}
                        >
                            Back to check-in
                            <Icon name="arrow" size={18} className="ml-auto" />
                        </Button>
                        <span className="mt-4 block text-center text-[11px] text-[#a1939a]">
                            You’re all set. You can also close this page.
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
