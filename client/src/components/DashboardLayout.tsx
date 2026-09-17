import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { twMerge } from "tailwind-merge"
import { formatDate } from "../lib/api"
import { Brand, Icon } from "./Icons"
import { IconButton, Spinner } from "./ui"

const navigation =
    "mb-0 flex items-center gap-[7px] rounded-md px-[9px] py-[9px] text-[10px] text-[#8b7f8d] transition-colors hover:bg-[#f8f4f6] hover:text-wine focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#bb667d] xs:gap-[11px] xs:px-3 xs:text-xs md:mb-[7px] md:gap-[7px] md:px-2.5 md:py-3 md:text-[10px] lg:gap-2 lg:text-[11px] xl:gap-[11px] xl:px-3 xl:py-[13px] xl:text-xs"

function AdminAvatar({ small = false }: { small?: boolean }) {
    return (
        <span
            className={twMerge(
                "flex size-[35px] shrink-0 items-center justify-center rounded-full border border-[#e5d4db] bg-[#f1e6e9] text-xs font-semibold text-[#98546a]",
                small && "size-[30px] text-[11px]"
            )}
        >
            AD
        </span>
    )
}

export function DashboardLayout({
    children,
    onSignOut,
    signingOut
}: {
    children: ReactNode
    onSignOut: () => void
    signingOut: boolean
}) {
    return (
        <div className="flex min-h-svh flex-col md:flex-row">
            <aside className="border-line relative z-20 grid w-full grid-cols-[1fr_auto] border-b bg-white md:fixed md:inset-y-0 md:left-0 md:flex md:w-[185px] md:flex-col md:border-r md:border-b-0 lg:w-52 xl:w-[234px]">
                <Link
                    to="/admin"
                    className="block px-[22px] pt-[17px] pb-[13px] focus-visible:outline-3 focus-visible:outline-offset-[-4px] focus-visible:outline-[#bb667d] md:px-[19px] md:py-[25px] lg:px-[23px] lg:pt-[29px] lg:pb-[30px] xl:px-[27px]"
                    aria-label="UNTAR attendance dashboard"
                >
                    <Brand compact />
                </Link>
                <div className="mx-[13px] mb-8 hidden items-center gap-1.5 rounded-[7px] border border-[#ece8ed] px-[7px] py-2.5 md:flex lg:gap-[9px] lg:px-2.5 lg:py-3 xl:mx-[18px]">
                    <span className="flex h-[34px] w-[31px] shrink-0 items-center justify-center rounded-[5px] bg-[#f6f2f4] text-[#8e6074]">
                        <Icon name="book" size={17} />
                    </span>
                    <div>
                        <strong className="block text-[10px] font-semibold text-[#645862] lg:text-xs">
                            Academic workspace
                        </strong>
                        <span className="mt-[3px] block text-[9px] text-[#a69aa6] lg:text-[10px]">
                            Attendance management
                        </span>
                    </div>
                </div>
                <div className="mx-[27px] mb-[11px] hidden text-[10px] font-semibold tracking-[1.5px] text-[#b1a6b2] md:block">
                    WORKSPACE
                </div>
                <nav
                    className="xs:gap-2 xs:px-[18px] col-span-full row-start-2 flex gap-1 px-3.5 pb-3 md:block md:px-2.5 md:pb-0 xl:px-3.5"
                    aria-label="Main navigation"
                >
                    <Link
                        to="/admin"
                        aria-current="page"
                        className={twMerge(navigation, "text-wine bg-[#f7edef] font-semibold")}
                    >
                        <Icon name="grid" size={19} className="w-4 lg:w-[19px]" />
                        <span className="flex-1">Attendance overview</span>
                        <span className="bg-wine hidden size-[5px] rounded-full md:block" />
                    </Link>
                    <Link to="/" className={navigation}>
                        <Icon name="id" size={19} className="w-4 lg:w-[19px]" />
                        <span className="flex-1">Student check-in</span>
                        <Icon name="external" size={15} className="hidden md:block" />
                    </Link>
                </nav>
                <div className="col-start-2 row-start-1 my-auto mr-2.5 md:mt-auto md:mr-0 md:mb-0">
                    <div className="relative mx-3 my-5 hidden overflow-hidden rounded-lg border border-[#f0e8e4] bg-[#faf7f5] px-[11px] py-[15px] after:absolute after:-top-[35px] after:-right-[50px] after:size-[100px] after:rounded-full after:border after:border-[#eddde1] after:shadow-[0_0_0_14px_#eddde128,0_0_0_29px_#eddde118] after:content-[''] md:block lg:mx-[19px] lg:my-[25px] lg:px-4 lg:py-[19px]">
                        <Icon name="book" size={22} className="mb-[15px] text-[#946777]" />
                        <h3 className="font-serif text-sm font-normal text-[#6d424f] lg:text-[15px]">
                            Every presence counts.
                        </h3>
                        <p className="mt-2 text-[11px] leading-[1.8] text-[#a18f98]">
                            A little less paperwork.
                            <br />
                            More room for learning.
                        </p>
                        <span className="mt-5 block text-[8px] tracking-[1.6px] text-[#ac96a0]">
                            UNTAR ATTENDANCE
                        </span>
                    </div>
                    <div className="md:border-line flex items-center gap-1.5 p-3 md:border-t md:px-2.5 md:py-[13px] lg:gap-[9px] lg:p-[18px]">
                        <span className="hidden md:block">
                            <AdminAvatar />
                        </span>
                        <div className="hidden flex-1 md:block">
                            <strong className="block text-[11px] font-semibold text-[#594d5a] lg:text-xs">
                                Administrator
                            </strong>
                            <span className="mt-[3px] block text-[9px] text-[#a89ba8] lg:text-[10px]">
                                Workspace admin
                            </span>
                        </div>
                        <IconButton
                            className="size-[34px] border border-[#e7dfe9] md:size-[30px] md:border-0"
                            onClick={onSignOut}
                            disabled={signingOut}
                            aria-label="Sign out"
                        >
                            {signingOut ? <Spinner /> : <Icon name="logout" size={18} />}
                        </IconButton>
                    </div>
                </div>
            </aside>
            <div className="w-full md:ml-[185px] md:w-[calc(100%-185px)] lg:ml-52 lg:w-[calc(100%-208px)] xl:ml-[234px] xl:w-[calc(100%-234px)]">
                <header className="border-line flex h-[47px] items-center justify-between border-b bg-[#fbfafc] px-[22px] md:h-[68px] md:bg-white md:px-5 lg:h-[76px] lg:px-[25px] xl:px-9">
                    <div className="flex items-center gap-2 text-[10px] text-[#a398a7] md:gap-3.5 md:text-xs">
                        <span>Workspace</span>
                        <Icon name="right" size={13} />
                        <strong className="font-medium text-[#6c606f]">Attendance overview</strong>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <span className="flex items-center gap-[5px] text-[10px] text-[#8d818f] md:gap-2 md:text-xs">
                            <Icon
                                name="calendar"
                                size={16}
                                className="w-[13px] text-[#a499a8] md:w-4"
                            />
                            {formatDate(new Date(), true)}
                        </span>
                        <span className="mx-2.5 hidden h-[22px] w-px bg-[#ece7ed] md:block" />
                        <span className="hidden md:block">
                            <AdminAvatar small />
                        </span>
                        <span className="hidden text-xs font-medium text-[#6d6171] md:inline">
                            Admin
                        </span>
                    </div>
                </header>
                <main className="mx-auto max-w-[1570px] px-[18px] pt-[25px] pb-[22px] md:px-5 md:pb-5 lg:px-[25px] lg:pt-[29px] xl:px-9 xl:pt-[34px] xl:pb-[22px] 2xl:px-[49px] 2xl:pt-[43px] 2xl:pb-[25px]">
                    {children}
                </main>
            </div>
        </div>
    )
}
