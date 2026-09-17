import { twMerge } from "tailwind-merge"
import { formatDate, formatTime, type AttendanceData } from "../lib/api"
import { Campus, Icon } from "./Icons"

const tones = {
    purple: { background: "bg-[#f4eff9]", color: "text-[#9a80b8]" },
    green: { background: "bg-[#edf7f0]", color: "text-[#659981]" },
    amber: { background: "bg-[#fcf5e8]", color: "text-[#bd9b5c]" }
}

function StatCard({
    icon,
    tone,
    label,
    value,
    description
}: {
    icon: string
    tone: keyof typeof tones
    label: string
    value: number | null
    description: string
}) {
    return (
        <div className="border-line xs:px-[11px] xs:py-3 rounded-[7px] border bg-white px-[9px] py-2.5 shadow-[0_2px_3px_#24203202] md:rounded-[9px] md:px-3 md:py-[13px] lg:p-4 xl:px-5 xl:pt-[18px] xl:pb-4 2xl:px-[25px] 2xl:py-[22px]">
            <div className="xs:text-[11px] relative flex items-center justify-between text-[10px] font-medium text-[#83778c] xl:text-xs 2xl:text-sm">
                {label}
                <span
                    className={twMerge(
                        "xs:size-[22px] flex size-[19px] shrink-0 items-center justify-center rounded-[7px] md:size-[25px] lg:size-8",
                        tones[tone].background,
                        tones[tone].color
                    )}
                >
                    <Icon name={icon} size={20} className="w-3.5 md:w-[17px] lg:w-5" />
                </span>
            </div>
            <div className="mt-[5px] flex items-baseline gap-[9px] text-[29px] leading-tight font-semibold tracking-[-.9px] text-[#423749] tabular-nums md:mt-1.5 md:gap-1.5 lg:-mt-0.5 lg:gap-[9px] lg:text-[31px] 2xl:text-4xl">
                {value ?? "—"}
                <span className="hidden text-[11px] font-normal tracking-normal text-[#897792] md:inline">
                    students
                </span>
            </div>
            <p className="xs:text-[9px] mt-[5px] flex items-start gap-1.5 text-[8px] leading-[1.7] text-[#a398aa] md:mt-2.5 lg:items-center xl:text-[10px]">
                <span
                    className={twMerge(
                        "mt-1 size-1 shrink-0 rounded-full bg-current lg:mt-0",
                        tones[tone].color
                    )}
                />
                {description}
            </p>
        </div>
    )
}

export function AttendanceSummary({ data }: { data: AttendanceData | null }) {
    const students = data?.students ?? []
    const present = students.filter((student) => student.attendedAt).length
    const percentage = students.length ? Math.round((present / students.length) * 100) : 0
    return (
        <>
            <section
                className="relative flex min-h-[186px] justify-between overflow-hidden rounded-[9px] bg-[linear-gradient(110deg,#79182f,#68182e)] text-white md:min-h-[202px] md:rounded-[11px] 2xl:min-h-[228px]"
                aria-label="Current attendance session"
            >
                <div className="xs:px-5 z-1 py-[22px] pr-2 pl-[15px] md:py-[26px] lg:px-[25px] lg:py-[27px] xl:px-[30px] 2xl:px-9 2xl:py-[33px]">
                    <span className="flex items-center gap-[7px] text-[9px] font-semibold tracking-[1.8px] text-[#e1b6c1]">
                        <span className="size-[5px] rounded-full bg-[#d4a8b6]" />
                        CURRENT SESSION
                    </span>
                    <h2 className="xs:text-[25px] mt-3.5 text-[22px] leading-[1.23] font-[450] tracking-[-.5px] md:text-[23px] lg:text-[26px] xl:text-[28px] 2xl:text-[32px]">
                        Every presence
                        <br />
                        <em className="font-serif font-normal text-[#f0d1d6]">
                            makes a difference.
                        </em>
                    </h2>
                    <div className="xs:gap-[5px] xs:text-[9px] mt-[19px] flex items-center gap-[3px] text-[8px] text-[#d4a8b6] md:mt-5 md:gap-[7px] md:text-[10px]">
                        <Icon
                            name="calendar"
                            size={15}
                            className="xs:block hidden w-3 md:w-[15px]"
                        />
                        {data ? (
                            <>
                                Started {formatDate(data.startedAt, true)}
                                <span className="mx-0.5">·</span>
                                {formatTime(data.startedAt)}
                            </>
                        ) : (
                            "Loading session details…"
                        )}
                    </div>
                </div>
                <Campus className="absolute -bottom-2 left-[13%] w-[60%] text-[#e9becb] opacity-20 md:left-[21%] md:w-[54%] md:opacity-[.38] lg:left-[30%] lg:w-[42%] xl:left-[28%] xl:w-[46%]" />
                <div className="xs:w-[148px] xs:px-4 relative z-1 my-[17px] w-[125px] shrink-0 border-l border-white/10 bg-white/[.035] px-3 py-[18px] md:my-5 md:w-[177px] md:px-[17px] md:py-[25px] lg:w-[207px] lg:px-[23px] lg:py-7 xl:w-[247px] xl:px-[27px] 2xl:w-[300px] 2xl:px-[35px] 2xl:py-[30px]">
                    <div className="flex items-center justify-between text-[10px] text-[#e6becb] md:text-[11px]">
                        <span>Attendance rate</span>
                        <Icon name="chart" size={17} className="w-3.5 text-[#c88c9f] md:w-[17px]" />
                    </div>
                    <div className="mt-[15px] mb-4 text-[37px] leading-none font-medium tracking-[-1.5px] tabular-nums md:mt-[13px] md:text-[41px]">
                        {data ? percentage : "—"}
                        <span className="ml-[3px] text-[21px] font-normal text-[#deb0bf]">%</span>
                    </div>
                    <progress
                        value={percentage}
                        max={100}
                        aria-label="Attendance rate"
                        className="block h-1 w-full appearance-none overflow-hidden rounded-[3px] border-0 bg-white/12 [&::-moz-progress-bar]:rounded-[3px] [&::-moz-progress-bar]:bg-[#efc7d2] [&::-webkit-progress-bar]:rounded-[3px] [&::-webkit-progress-bar]:bg-white/12 [&::-webkit-progress-value]:rounded-[3px] [&::-webkit-progress-value]:bg-[#efc7d2]"
                    />
                    <p className="mt-[9px] text-[9px] leading-[1.7] text-[#cea6b6] md:text-[10px]">
                        {data ? (
                            <>
                                <strong className="font-medium text-[#f6dce5]">{present}</strong> of{" "}
                                {students.length} students checked in
                            </>
                        ) : (
                            "Waiting for attendance data"
                        )}
                    </p>
                </div>
            </section>
            <section
                className="my-[17px] grid grid-cols-3 gap-[9px] md:my-[23px] md:gap-3 xl:gap-[17px]"
                aria-label="Attendance totals"
            >
                <StatCard
                    icon="users"
                    tone="purple"
                    label="Total students"
                    value={data ? students.length : null}
                    description="Registered in your workspace"
                />
                <StatCard
                    icon="checkCircle"
                    tone="green"
                    label="Present"
                    value={data ? present : null}
                    description="Checked in this session"
                />
                <StatCard
                    icon="clock"
                    tone="amber"
                    label="Not attended"
                    value={data ? students.length - present : null}
                    description="Still waiting to check in"
                />
            </section>
        </>
    )
}
