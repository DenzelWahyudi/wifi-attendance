import { useEffect, useState, type FormEvent } from "react"
import { Portal, PortalCard } from "../components/Portal"
import { Icon } from "../components/Icons"
import {
    Button,
    ErrorNotice,
    FieldLabel,
    FormIcon,
    IconButton,
    Input,
    InputGroup,
    Spinner
} from "../components/ui"
import { api, errorMessage, post } from "../lib/api"
import Dashboard from "./Dashboard"

export default function AdminPage() {
    const [status, setStatus] = useState<"checking" | "signed-out" | "signed-in">("checking")
    const [password, setPassword] = useState("")
    const [visible, setVisible] = useState(false)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState("")
    useEffect(() => {
        let active = true
        api<{ authenticated: boolean }>("/admin/session")
            .then((data) => {
                if (active) setStatus(data.authenticated ? "signed-in" : "signed-out")
            })
            .catch((failure) => {
                if (active) {
                    setError(errorMessage(failure))
                    setStatus("signed-out")
                }
            })
        return () => {
            active = false
        }
    }, [])

    async function signIn(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (busy) return
        setBusy(true)
        setError("")
        try {
            await post("/admin/login", { password })
            setPassword("")
            setStatus("signed-in")
        } catch (failure) {
            setError(errorMessage(failure))
        } finally {
            setBusy(false)
        }
    }

    if (status === "signed-in") return <Dashboard onSignedOut={() => setStatus("signed-out")} />
    return (
        <Portal admin>
            <PortalCard
                label="ADMINISTRATOR"
                status={
                    <span className="flex items-center gap-1 text-[10px] text-[#95838c]">
                        <Icon name="lock" size={12} />
                        Restricted access
                    </span>
                }
                footer="MORE CLARITY. LESS PAPERWORK."
            >
                <FormIcon name="shield" />
                <h2 className="text-[27px] leading-[1.22] font-semibold tracking-[-.9px] lg:text-[30px]">
                    Welcome back.
                </h2>
                <p className="mt-[13px] max-w-[300px] text-sm leading-[1.9] text-[#87808a]">
                    Sign in to manage your students and keep track of who’s here.
                </p>
                {status === "checking" ? (
                    <div
                        className="flex items-center justify-center gap-[9px] py-[55px] text-sm text-[#8b7984]"
                        role="status"
                    >
                        <Spinner />
                        Checking your session…
                    </div>
                ) : (
                    <form onSubmit={signIn} className="mt-[26px]">
                        <FieldLabel htmlFor="admin-password">Admin password </FieldLabel>
                        <InputGroup>
                            <Icon name="lock" size={18} />
                            <Input
                                id="admin-password"
                                name="password"
                                type={visible ? "text" : "password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                required
                                autoComplete="current-password"
                                maxLength={256}
                                disabled={busy}
                            />
                            <IconButton
                                className="-mr-[5px] text-[#8c858f]"
                                onClick={() => setVisible(!visible)}
                                aria-label={visible ? "Hide password" : "Show password"}
                            >
                                <Icon name={visible ? "eyeOff" : "eye"} size={18} />
                            </IconButton>
                        </InputGroup>
                        {error && <ErrorNotice className="mt-[15px]">{error}</ErrorNotice>}
                        <Button
                            className="mt-[23px] min-h-[47px] w-full px-4 py-3"
                            type="submit"
                            disabled={busy}
                        >
                            {busy ? (
                                <>
                                    <Spinner />
                                    Signing in…
                                </>
                            ) : (
                                <>
                                    Sign in to dashboard
                                    <Icon name="arrow" size={18} className="ml-auto" />
                                </>
                            )}
                        </Button>
                        <p className="mt-[19px] mb-8 flex items-center justify-center gap-1.5 text-[11px] leading-[1.6] text-[#9a8f99]">
                            <Icon name="lock" size={13} />
                            Your session stays signed in for up to 8 hours.
                        </p>
                    </form>
                )}
            </PortalCard>
        </Portal>
    )
}
