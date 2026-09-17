import { useEffect, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { twMerge } from "tailwind-merge"
import { api, formatDate } from "../lib/api"
import { Brand, Campus, Icon } from "./Icons"

export function ConnectionStatus() {
    const [state, setState] = useState<"checking" | "online" | "offline">("checking")
    useEffect(() => {
        let active = true
        const check = () =>
            api("/health")
                .then(() => {
                    if (active) setState("online")
                })
                .catch(() => {
                    if (active) setState("offline")
                })
        void check()
        const interval = window.setInterval(check, 15000)
        return () => {
            active = false
            window.clearInterval(interval)
        }
    }, [])
    return (
        <span
            className={twMerge(
                "xs:text-[10px] flex items-center gap-1.5 text-[9px] font-medium whitespace-nowrap",
                state === "online"
                    ? "text-[#658071]"
                    : state === "offline"
                      ? "text-[#a55a42]"
                      : "text-[#888]"
            )}
            role="status"
        >
            <span
                className={twMerge(
                    "size-[5px] shrink-0 rounded-full",
                    state === "online"
                        ? "bg-[#438970]"
                        : state === "offline"
                          ? "bg-[#b97a53]"
                          : "bg-[#aaa]"
                )}
            />
            {state === "online"
                ? "Ready for check-in"
                : state === "offline"
                  ? "Server unavailable"
                  : "Connecting…"}
        </span>
    )
}

export function Portal({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
    return (
        <div className="border-wine bg-cream flex min-h-svh flex-col border-t-4">
            <header className="mx-auto flex w-full items-center justify-between border-b border-[#e7e1db] px-[6%] py-5 md:px-[5%] md:py-[23px] lg:px-[4.3%] lg:py-[27px]">
                <Link
                    to="/"
                    aria-label="UNTAR attendance home"
                    className="rounded focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#bb667d]"
                >
                    <Brand />
                </Link>
                <div className="flex items-center gap-[29px]">
                    <span className="hidden border-r border-[#ded6d6] pr-[29px] text-[11px] font-semibold tracking-[1.9px] text-[#948990] lg:block">
                        ATTENDANCE PORTAL
                    </span>
                    <Link
                        className="hover:text-wine inline-flex touch-manipulation items-center gap-1.5 py-2 text-xs font-semibold text-[#5d4f58] transition-colors focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#bb667d] md:gap-2 md:text-[13px]"
                        to={admin ? "/" : "/admin"}
                    >
                        <Icon
                            name={admin ? "arrow" : "lock"}
                            size={15}
                            className="hidden md:block"
                        />
                        {admin ? "Student check-in" : "Admin access"}
                        <Icon name="external" size={15} />
                    </Link>
                </div>
            </header>
            <main className="xs:w-[88%] mx-auto flex w-[90%] max-w-[480px] flex-1 flex-col items-center gap-[31px] py-9 md:grid md:w-[90%] md:max-w-none md:grid-cols-[1.1fr_1fr] md:gap-[35px] md:py-[47px] lg:w-[88%] lg:gap-[55px] lg:pt-14 lg:pb-12 xl:max-w-[1190px] xl:gap-[100px]">
                <section className="w-full text-center md:pt-2 md:text-left">
                    <div className="text-wine xs:text-[10px] mb-[18px] flex items-center justify-center gap-[11px] text-[9px] font-semibold tracking-[1px] md:mb-[26px] md:justify-start md:gap-[7px] md:text-[9px] md:tracking-[.7px] lg:text-[10px] lg:tracking-[1px] xl:gap-[11px] xl:text-[11px] xl:tracking-[1.5px]">
                        <span className="bg-wine h-px w-[22px] md:w-[13px] lg:w-[22px]" />
                        {admin
                            ? "A LITTLE LESS ADMIN. A LOT MORE CLARITY."
                            : "SHOW UP. CHECK IN. MAKE IT COUNT."}
                    </div>
                    <h1 className="xs:text-[49px] text-[44px] leading-[1.08] font-medium tracking-[-2px] text-[#302930] md:text-[52px] lg:text-[63px] lg:tracking-[-3.3px] xl:text-[clamp(54px,5.3vw,78px)]">
                        {admin ? (
                            <>
                                Every student. <br />
                                Every session.
                                <br />
                            </>
                        ) : (
                            <>
                                Great things <br />
                                start with
                                <br />
                            </>
                        )}
                        <em className="text-wine font-serif font-normal tracking-[-1.7px] md:tracking-[-2px] lg:tracking-[-3px]">
                            {admin ? "All in view." : "being here."}
                        </em>
                    </h1>
                    <p className="mx-auto mt-[17px] max-w-[295px] text-[13px] leading-[1.9] text-[#82747b] md:mx-0 md:mt-[23px] md:max-w-[280px] lg:max-w-[345px] lg:text-sm">
                        {admin
                            ? "A thoughtful space to manage your students and keep every attendance in order."
                            : "Your presence is part of something bigger. Check in and take the next step in your journey."}
                    </p>
                    <div className="relative mt-[15px] hidden max-w-[470px] text-[#ab717a] md:block">
                        <Campus />
                        <div className="flex justify-between px-[17px] pt-1.5 text-[9px] font-semibold tracking-[2px] text-[#ab9195]">
                            <span>JAKARTA, INDONESIA</span>
                            <span>EST. 1959</span>
                        </div>
                    </div>
                </section>
                <section className="w-full justify-self-end md:max-w-[474px]">
                    {children}
                    <div className="mt-[22px] flex items-center justify-center gap-[7px] text-center text-[11px] leading-[1.6] text-[#a2949b]">
                        <Icon name="shield" size={16} />
                        <span>
                            {admin
                                ? "Access is reserved for attendance administrators."
                                : "Your attendance is shared with your administrator."}
                        </span>
                    </div>
                </section>
            </main>
            <footer className="mx-[6%] flex items-center justify-between gap-2.5 border-t border-[#e8e2dc] py-5 text-[10px] text-[#a09499] md:mx-[4.3%] md:gap-5 md:py-[23px] md:text-[11px]">
                <span>© {new Date().getFullYear()} Universitas Tarumanagara</span>
                <span className="hidden tracking-[.3px] text-[#ad9d9f] lg:inline">
                    Integrity. Professionalism. Entrepreneurship.
                </span>
                <span className="flex items-center gap-1 text-[9px] md:gap-[7px] md:text-[11px]">
                    <Icon name="calendar" size={14} className="w-[11px] md:w-3.5" />
                    {formatDate(new Date())}
                </span>
            </footer>
        </div>
    )
}

export function PortalCard({
    label,
    status,
    footer,
    children
}: {
    label: string
    status: ReactNode
    footer: string
    children: ReactNode
}) {
    return (
        <div className="animate-enter shadow-card xs:px-[27px] rounded-xl border border-[#e8e2e3] bg-white px-[21px] pt-6 motion-reduce:animate-none md:rounded-[14px] md:px-[23px] md:pt-[22px] lg:px-7 lg:pt-[27px] xl:px-[35px]">
            <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#f0ebee] pb-5 md:pb-6 lg:flex-nowrap lg:gap-2">
                <span className="xs:text-[10px] text-[9px] font-semibold tracking-[1.5px] text-[#89808b]">
                    {label}
                </span>
                {status}
            </div>
            {children}
            <div className="xs:-mx-[27px] -mx-[21px] flex items-center justify-center gap-[9px] rounded-b-xl border-t border-[#eee9ed] bg-[#fdfbfc] p-[17px] text-[9px] font-semibold tracking-[1.7px] text-[#a08b93] md:-mx-[23px] md:rounded-b-[14px] lg:-mx-7 lg:text-[10px] xl:-mx-[35px]">
                <Icon name="book" size={15} className="text-[#a47787]" />
                {footer}
            </div>
        </div>
    )
}
