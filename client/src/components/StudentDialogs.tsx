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
