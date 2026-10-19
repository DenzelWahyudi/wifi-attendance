import { useState, type FormEvent } from "react"
import { ApiError, errorMessage, post } from "../lib/api"
import { Icon } from "./Icons"
import { Modal } from "./Modal"
import {
    Button,
    ErrorNotice,
    FieldHint,
    FieldLabel,
    Input,
    InputGroup,
    ModalActions,
    Spinner
} from "./ui"

type DialogProps = {
    onClose: () => void
    onSaved: (message: string) => Promise<void>
    onUnauthorized: () => void
}

export function AddStudent({ onClose, onSaved, onUnauthorized }: DialogProps) {
    const [name, setName] = useState("")
    const [identity, setIdentity] = useState("")
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState("")

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (busy) return
        setBusy(true)
        setError("")
        try {
            await post("/admin/students", { name: name.trim(), identityNumber: identity.trim() })
            await onSaved(`${name.trim()} has been added to your students.`)
        } catch (failure) {
            if (failure instanceof ApiError && failure.status === 401) onUnauthorized()
            else setError(errorMessage(failure))
            setBusy(false)
        }
    }

    return (
        <Modal
            title="Add a student"
            description="A name and an identity number. That’s all you need to get started."
            onClose={onClose}
            busy={busy}
        >
            <form onSubmit={submit} className="mt-[26px]">
                <FieldLabel htmlFor="new-name">Full name </FieldLabel>
                <InputGroup>
                    <Icon name="user" size={18} />
                    <Input
                        id="new-name"
                        placeholder="e.g. Alex Wijaya"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        required
                        maxLength={100}
                        autoComplete="off"
                        autoFocus
                        disabled={busy}
                    />
                </InputGroup>
                <div className="mt-5">
                    <FieldLabel htmlFor="new-identity">Student identity number </FieldLabel>
                    <InputGroup>
                        <Icon name="id" size={18} />
                        <Input
                            id="new-identity"
                            placeholder="e.g. 535260001"
                            value={identity}
                            onChange={(event) => setIdentity(event.target.value)}
                            required
                            maxLength={32}
                            pattern="[A-Za-z0-9\-]+"
                            title="Letters, numbers, and hyphens only"
                            autoComplete="off"
                            spellCheck={false}
                            disabled={busy}
                        />
                    </InputGroup>
                </div>
                <FieldHint>Identity numbers must be unique. Leading zeroes are kept.</FieldHint>
                {error && <ErrorNotice className="mt-[17px]">{error}</ErrorNotice>}
                <ModalActions>
                    <Button variant="secondary" onClick={onClose} disabled={busy}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={busy}>
                        {busy ? <Spinner /> : <Icon name="plus" size={17} />}
                        {busy ? "Adding student…" : "Add student"}
                    </Button>
                </ModalActions>
            </form>
        </Modal>
    )
}

export function ResetAttendance({
    count,
    onClose,
    onSaved,
    onUnauthorized
}: DialogProps & { count: number }) {
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState("")

    async function reset() {
        if (busy) return
        setBusy(true)
        setError("")
        try {
            await post("/admin/reset", { confirm: true })
            await onSaved("Attendance reset. A fresh session is ready.")
        } catch (failure) {
            if (failure instanceof ApiError && failure.status === 401) onUnauthorized()
            else setError(errorMessage(failure))
            setBusy(false)
        }
    }

    return (
        <Modal
            title="Reset attendance?"
            description="Start a fresh session for all registered students."
            onClose={onClose}
            busy={busy}
        >
            <div className="my-6 flex items-start gap-[11px] rounded-lg border border-[#f2e5d9] bg-[#fcf5ee] p-[17px] text-[#b08555]">
                <Icon name="info" size={20} />
                <div>
                    <strong className="text-sm font-semibold text-[#946c46]">
                        {count} {count === 1 ? "check-in" : "check-ins"} will be cleared.
                    </strong>
                    <p className="mt-[5px] text-[13px] leading-[1.9] text-[#ad937a]">
                        Every student will return to “Not attended.” Names and identity numbers will
                        stay saved. This cannot be undone.
                    </p>
                </div>
            </div>
            {error && <ErrorNotice>{error}</ErrorNotice>}
            <ModalActions>
                <Button variant="secondary" onClick={onClose} disabled={busy} autoFocus>
                    Keep attendance
                </Button>
                <Button onClick={reset} disabled={busy}>
                    {busy ? <Spinner /> : <Icon name="reset" size={16} />}
                    {busy ? "Resetting…" : "Reset attendance"}
                </Button>
            </ModalActions>
        </Modal>
    )
}

export function TriggerVerificationModal({
    presentCount,
    onClose,
    onSaved,
    onUnauthorized
}: DialogProps & { presentCount: number }) {
    const [type, setType] = useState<"tap" | "pin">("pin")
    const [durationSeconds, setDurationSeconds] = useState(120)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState("")

    async function start() {
        if (busy) return
        setBusy(true)
        setError("")
        try {
            await post("/admin/verification/start", { type, durationSeconds })
            await onSaved(
                `Pop check-in launched (${type === "pin" ? "PIN code" : "One-tap"}). Students have ${Math.round(durationSeconds / 60)} minutes to verify.`
            )
        } catch (failure) {
            if (failure instanceof ApiError && failure.status === 401) onUnauthorized()
            else setError(errorMessage(failure))
            setBusy(false)
        }
    }

    return (
        <Modal
            title="Launch pop check-in"
            description="Verify that students who checked in are still physically present on the Wi-Fi."
            onClose={onClose}
            busy={busy}
        >
            <div className="mt-5 space-y-4">
                <div>
                    <label className="mb-2 block text-xs font-semibold text-[#514b55]">
                        Verification method
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                        <button
                            type="button"
                            onClick={() => setType("pin")}
                            className={`flex flex-col items-start gap-1 rounded-lg border p-3.5 text-left transition-all ${
                                type === "pin"
                                    ? "border-[#b55874] bg-[#fbf5f7] shadow-sm"
                                    : "border-[#e5dde5] bg-white hover:bg-[#faf9fa]"
                            }`}
                        >
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#483c4f]">
                                <Icon name="lock" size={14} className="text-[#994762]" />
                                4-Digit PIN
                            </span>
                            <span className="text-[11px] leading-relaxed text-[#8a7a92]">
                                Displays a code on your screen for students to type in.
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setType("tap")}
                            className={`flex flex-col items-start gap-1 rounded-lg border p-3.5 text-left transition-all ${
                                type === "tap"
                                    ? "border-[#b55874] bg-[#fbf5f7] shadow-sm"
                                    : "border-[#e5dde5] bg-white hover:bg-[#faf9fa]"
                            }`}
                        >
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#483c4f]">
                                <Icon name="smartphone" size={14} className="text-[#994762]" />
                                One-Tap Button
                            </span>
                            <span className="text-[11px] leading-relaxed text-[#8a7a92]">
                                Students simply tap &ldquo;I&rsquo;m Still Here&rdquo; on their phone.
                            </span>
                        </button>
                    </div>
                </div>

                <div>
                    <label className="mb-2 block text-xs font-semibold text-[#514b55]">
                        Time window
                    </label>
                    <div className="flex gap-2">
                        {[
                            { label: "60 seconds", value: 60 },
                            { label: "2 minutes", value: 120 },
                            { label: "3 minutes", value: 180 }
                        ].map((item) => (
                            <button
                                key={item.value}
                                type="button"
                                onClick={() => setDurationSeconds(item.value)}
                                className={`flex-1 rounded-[6px] border py-2 text-xs font-medium transition-colors ${
                                    durationSeconds === item.value
                                        ? "border-[#b55874] bg-[#fbf5f7] font-semibold text-[#8b3550]"
                                        : "border-[#e2dcde] bg-white text-[#716477] hover:bg-[#faf8f9]"
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="rounded-lg border border-[#eee8ed] bg-[#faf8fa] p-3.5 text-xs text-[#7d6f83]">
                    <p className="flex items-start gap-2">
                        <Icon name="info" size={15} className="mt-0.5 shrink-0 text-[#a3758a]" />
                        <span>
                            Currently <strong>{presentCount}</strong> students have checked in. Students who fail to verify before the timer runs out will be marked as <strong>Unverified / Left Early</strong>.
                        </span>
                    </p>
                </div>
            </div>

            {error && <ErrorNotice className="mt-4">{error}</ErrorNotice>}

            <ModalActions>
                <Button variant="secondary" onClick={onClose} disabled={busy}>
                    Cancel
                </Button>
                <Button onClick={start} disabled={busy || presentCount === 0}>
                    {busy ? <Spinner /> : <Icon name="checkCircle" size={16} />}
                    {busy ? "Starting…" : "Start check-in now"}
                </Button>
            </ModalActions>
        </Modal>
    )
}
