import { useState } from "react"
import { twMerge } from "tailwind-merge"
import { formatDate, formatTime, type AttendanceData } from "../lib/api"
import { Icon } from "./Icons"
import { AttendanceBadge, Button, IconButton, Input, InputGroup, Spinner } from "./ui"

type Filter = "all" | "present" | "pending"
const PAGE_SIZE = 8
const avatars = [
    "bg-[#f4e9ef] text-[#a3758a]",
    "bg-[#edf1f9] text-[#7e8fac]",
    "bg-[#f7f2e6] text-[#ae956b]",
    "bg-[#f0ecf9] text-[#8381ac]",
    "bg-[#edf5f0] text-[#729c8b]"
]
const headingCell =
    "px-[13px] py-3 text-[8px] font-semibold tracking-[.4px] whitespace-nowrap text-[#857091] md:px-[18px] md:text-[9px] md:tracking-[.8px] 2xl:text-[11px]"
const bodyCell =
    "h-[65px] border-b border-[#f2eef5] px-[13px] py-[13px] text-[13px] md:px-[18px] 2xl:h-[74px]"

type AttendanceTableProps = {
    data: AttendanceData | null
    error: string
    refreshing: boolean
    onRefresh: () => void
    onAdd: () => void
}

export function AttendanceTable({
    data,
    error,
    refreshing,
    onRefresh,
    onAdd
}: AttendanceTableProps) {
    const [filter, setFilter] = useState<Filter>("all")
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const students = data?.students ?? []
    const present = students.filter((student) => student.attendedAt).length
    const filtered = students.filter((student) => {
        const matchesStatus =
            filter === "all" || (filter === "present" ? !!student.attendedAt : !student.attendedAt)
        const query = search.trim().toLowerCase()
        return (
            matchesStatus &&
            (student.name.toLowerCase().includes(query) ||
                student.identityNumber.toLowerCase().includes(query))
        )
    })
    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const currentPage = Math.min(page, pages)
    const first = (currentPage - 1) * PAGE_SIZE
    const currentStudents = filtered.slice(first, first + PAGE_SIZE)
    const tabs = [
        { value: "all", label: "All students", count: students.length },
        { value: "present", label: "Present", count: present },
        { value: "pending", label: "Not attended", count: students.length - present }
    ] as const
    const emptyTitle = !data
        ? "Let’s reconnect."
        : !students.length
          ? "Your first student starts here."
          : search
            ? "No matching students."
            : filter === "pending"
              ? "Everyone is here."
              : "No check-ins yet."
    const emptyDescription = !data
        ? "Attendance will appear when the server is available."
        : !students.length
          ? "Add a student to start building your attendance list."
          : search
            ? "Try a different name or identity number."
            : filter === "pending"
              ? "All registered students have attended this session."
              : "Students will appear here as they check in."

    return (
        <section
            className="border-line overflow-hidden rounded-[9px] border bg-white"
            aria-label="Student attendance"
        >
            <div className="flex items-center justify-between gap-[15px] px-4 py-[18px] md:px-[17px] md:pt-[22px] md:pb-[19px] lg:px-[23px]">
                <div>
                    <h2 className="flex items-center gap-[9px] text-sm font-semibold tracking-[-.2px] xl:text-base">
                        Student attendance{" "}
                        <span className="rounded-[5px] border border-[#eae2ef] bg-[#f4f0f6] px-[7px] py-[3px] text-[11px] font-medium tracking-normal text-[#9988a5]">
                            {data ? students.length : "—"}
                        </span>
                    </h2>
                    <p className="mt-[5px] text-[11px] text-[#887692] lg:text-xs">
                        All your students, one place.
                    </p>
                </div>
                <div
                    className={twMerge(
                        "flex items-center gap-1 text-[9px] md:gap-1.5 lg:text-[10px]",
                        error ? "text-[#aa7650]" : "text-[#9c93a3]"
                    )}
                >
                    <span
                        className={twMerge(
                            "size-[5px] shrink-0 rounded-full",
                            error ? "bg-[#c79861]" : "bg-[#438970]"
                        )}
                    />
                    <span className="sr-only md:not-sr-only">
                        {error ? "Sync paused" : data ? "Updates every 5 seconds" : "Connecting…"}
                    </span>
                    <IconButton
                        className="w-6 md:ml-1 md:w-[30px]"
                        onClick={onRefresh}
                        disabled={refreshing}
                        aria-label="Refresh attendance"
                    >
                        <Icon
                            name="reset"
                            size={15}
                            className={refreshing ? "animate-spin motion-reduce:animate-none" : ""}
                        />
                    </IconButton>
                </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-[13px] px-4 pb-4 md:gap-3.5 md:px-[17px] md:pb-[19px] lg:px-[23px] xl:flex-nowrap">
                <div
                    className="flex w-full shrink-0 items-center justify-between rounded-md border border-[#eeeaf0] bg-[#f6f4f7] p-[3px] md:w-auto"
                    role="group"
                    aria-label="Filter by attendance status"
                >
                    {tabs.map((tab) => (
                        <button
                            key={tab.value}
                            className={twMerge(
                                "hover:text-wine flex flex-1 cursor-pointer touch-manipulation items-center justify-center gap-[7px] rounded border border-transparent bg-transparent p-[7px] text-[11px] font-medium whitespace-nowrap text-[#93859d] transition-colors focus-visible:outline-3 focus-visible:outline-[#bb667d] md:flex-none md:py-1.5 xl:px-2.5",
                                filter === tab.value &&
                                    "text-wine border-[#e5dde7] bg-white shadow-[0_1px_3px_#40314508]"
                            )}
                            aria-pressed={filter === tab.value}
                            onClick={() => {
                                setFilter(tab.value)
                                setPage(1)
                            }}
                        >
                            {tab.label}
                            <span
                                className={twMerge(
                                    "text-[10px] text-[#ae9db8]",
                                    filter === tab.value &&
                                        "rounded-[3px] bg-[#f5eaef] px-1 py-px text-[#a57087]"
                                )}
                            >
                                {data ? tab.count : "—"}
                            </span>
                        </button>
                    ))}
                </div>
                <InputGroup className="min-h-[39px] w-full gap-2 rounded-md border-[#e6e0ea] px-[11px] text-[#a89ab2] md:min-h-[35px] md:min-w-[200px] md:flex-1 lg:w-[38%] lg:max-w-[280px]">
                    <Icon name="search" size={17} />
                    <Input
                        className="text-xs placeholder:text-[#b0a1b9] md:text-[11px]"
                        aria-label="Search students"
                        placeholder="Search name or identity number…"
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value)
                            setPage(1)
                        }}
                    />
                    {search && (
                        <IconButton
                            className="-mr-[5px] size-[27px]"
                            aria-label="Clear search"
                            onClick={() => {
                                setSearch("")
                                setPage(1)
                            }}
                        >
                            <Icon name="x" size={15} />
                        </IconButton>
                    )}
                </InputGroup>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full table-fixed border-collapse text-left md:min-w-[670px] md:table-auto">
                    <caption className="sr-only">
                        Students and their attendance for the current session
                    </caption>
                    <thead className="border-y border-[#eeeaf2] bg-[#faf9fb]">
                        <tr>
                            <th
                                className={twMerge(
                                    headingCell,
                                    "hidden w-[58px] text-center md:table-cell md:pr-2 md:pl-[15px]"
                                )}
                            >
                                NO.
                            </th>
                            <th className={twMerge(headingCell, "w-[63%] md:w-auto")}>
                                STUDENT NAME
                            </th>
                            <th className={twMerge(headingCell, "hidden md:table-cell")}>
                                IDENTITY NUMBER
                            </th>
                            <th className={headingCell}>ATTENDANCE STATUS</th>
                            <th className={twMerge(headingCell, "hidden md:table-cell")}>
                                CHECK-IN TIME
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentStudents.map((student, index) => (
                            <tr
                                key={student.id}
                                className="hover:bg-[#fdfbfc] last:[&>td]:border-b-0"
                            >
                                <td
                                    className={twMerge(
                                        bodyCell,
                                        "hidden w-[58px] text-center text-[11px] text-[#b1a3bb] tabular-nums md:table-cell md:pr-2 md:pl-[15px]"
                                    )}
                                >
                                    {String(first + index + 1).padStart(2, "0")}
                                </td>
                                <td className={bodyCell}>
                                    <div className="flex items-center gap-[9px] md:gap-[11px]">
                                        <span
                                            className={twMerge(
                                                "flex size-[31px] shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                                                avatars[student.id % avatars.length]
                                            )}
                                        >
                                            {student.name
                                                .split(" ")
                                                .filter(Boolean)
                                                .slice(0, 2)
                                                .map((part) => part[0])
                                                .join("")
                                                .toUpperCase()}
                                        </span>
                                        <span className="min-w-0">
                                            <strong className="block max-w-[270px] text-[11px] leading-normal font-medium wrap-anywhere text-[#65546f] md:text-xs 2xl:text-sm">
                                                {student.name}
                                            </strong>
                                            <small className="mt-[3px] block text-[9px] wrap-anywhere text-[#897792] md:hidden">
                                                {student.identityNumber}
                                            </small>
                                        </span>
                                    </div>
                                </td>
                                <td
                                    className={twMerge(
                                        bodyCell,
                                        "hidden text-xs tracking-[.5px] text-[#796786] tabular-nums md:table-cell 2xl:text-sm"
                                    )}
                                >
                                    {student.identityNumber}
                                </td>
                                <td className={bodyCell}>
                                    <AttendanceBadge present={!!student.attendedAt} />
                                </td>
                                <td className={twMerge(bodyCell, "hidden md:table-cell")}>
                                    {student.attendedAt ? (
                                        <div>
                                            <span className="flex items-center gap-1.5 text-xs text-[#94839f]">
                                                <Icon
                                                    name="clock"
                                                    size={13}
                                                    className="text-[#b5a6bd]"
                                                />
                                                {formatTime(student.attendedAt)}
                                            </span>
                                            <small className="mt-1 block pl-[19px] text-[9px] text-[#b2a3ba]">
                                                {formatDate(student.attendedAt, true)}
                                            </small>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-[#c7baca]">—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {(!data || !currentStudents.length) && (
                <div
                    className="flex min-h-[225px] flex-col items-center justify-center px-4 py-[30px] text-center text-[#b4a0b6] md:min-h-[220px] md:px-5 md:py-[35px]"
                    role={!data ? "status" : undefined}
                >
                    {!data && !error ? (
                        <>
                            <Spinner />
                            <p className="mt-[7px] text-xs leading-[1.8] text-[#ac98b4]">
                                Loading your students…
                            </p>
                        </>
                    ) : (
                        <>
                            {!students.length && data ? (
                                <span className="flex size-[53px] items-center justify-center rounded-xl border border-[#f0e6ed] bg-[#f8f3f6] text-[#aa7c93]">
                                    <Icon name="users" size={25} />
                                </span>
                            ) : (
                                <Icon
                                    name={!data ? "wifi" : search ? "search" : "checkCircle"}
                                    size={27}
                                />
                            )}
                            <h3 className="mt-4 text-[15px] font-medium text-[#776180]">
                                {emptyTitle}
                            </h3>
                            <p className="mt-[7px] text-xs leading-[1.8] text-[#ac98b4]">
                                {emptyDescription}
                            </p>
                            {data &&
                                (!students.length ? (
                                    <Button
                                        variant="secondary"
                                        className="mt-[19px] min-h-[34px] px-3 py-[7px] text-xs"
                                        onClick={onAdd}
                                    >
                                        <Icon name="plus" size={16} />
                                        Add your first student
                                    </Button>
                                ) : (
                                    <Button
                                        variant="text"
                                        className="mt-3.5 text-xs"
                                        onClick={() => {
                                            setSearch("")
                                            setFilter("all")
                                            setPage(1)
                                        }}
                                    >
                                        View all students
                                        <Icon name="arrow" size={15} />
                                    </Button>
                                ))}
                        </>
                    )}
                </div>
            )}
            <div className="flex min-h-[53px] items-center justify-between gap-[15px] border-t border-[#eee8f1] px-[15px] py-3 text-[9px] text-[#ad9db8] md:px-[23px] md:py-[11px] md:text-[10px]">
                <span>
                    {filtered.length ? (
                        <>
                            Showing{" "}
                            <strong className="font-medium text-[#8b769a]">
                                {first + 1}–{Math.min(first + PAGE_SIZE, filtered.length)}
                            </strong>{" "}
                            of{" "}
                            <strong className="font-medium text-[#8b769a]">
                                {filtered.length}
                            </strong>{" "}
                            students
                        </>
                    ) : (
                        "No students to display"
                    )}
                </span>
                <div className="flex items-center gap-[7px] md:gap-[11px]">
                    <IconButton
                        className="size-[25px] border border-[#e9e0ed] bg-white text-[#a48bb6] disabled:opacity-35"
                        aria-label="Previous page"
                        disabled={currentPage <= 1}
                        onClick={() => setPage(currentPage - 1)}
                    >
                        <Icon name="left" size={17} />
                    </IconButton>
                    <span>
                        Page <strong className="font-medium text-[#8b769a]">{currentPage}</strong>{" "}
                        of {pages}
                    </span>
                    <IconButton
                        className="size-[25px] border border-[#e9e0ed] bg-white text-[#a48bb6] disabled:opacity-35"
                        aria-label="Next page"
                        disabled={currentPage >= pages}
                        onClick={() => setPage(currentPage + 1)}
                    >
                        <Icon name="right" size={17} />
                    </IconButton>
                </div>
            </div>
        </section>
    )
}
