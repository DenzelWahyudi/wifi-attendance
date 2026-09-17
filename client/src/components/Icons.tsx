import type { ReactNode } from "react"
import { twMerge } from "tailwind-merge"

const paths: Record<string, ReactNode> = {
    arrow: (
        <>
            <path d="M5 12h14m-5-5 5 5-5 5" />
        </>
    ),
    external: (
        <>
            <path d="M7 17 17 7M7 7h10v10" />
        </>
    ),
    users: (
        <>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            <circle cx="9" cy="7" r="4" />
        </>
    ),
    user: (
        <>
            <circle cx="12" cy="8" r="4" />
            <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
        </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    checkCircle: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="m8 12 3 3 5-6" />
        </>
    ),
    clock: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
        </>
    ),
    grid: (
        <>
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </>
    ),
    logout: (
        <>
            <path d="M9 4H4v16h5m1-8h11m-4-4 4 4-4 4" />
        </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    reset: (
        <>
            <path d="M3 10a9 9 0 1 1 2.5 8M3 4v6h6" />
        </>
    ),
    shield: (
        <>
            <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />
            <path d="m8 12 3 3 5-6" />
        </>
    ),
    id: (
        <>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="8" cy="10" r="2" />
            <path d="M5 16a3 3 0 0 1 6 0m3-6h4m-4 4h4" />
        </>
    ),
    calendar: (
        <>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 11h18m-14 5h3m4 0h3" />
        </>
    ),
    search: (
        <>
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 5 5" />
        </>
    ),
    left: <path d="m14 6-6 6 6 6" />,
    right: <path d="m10 6 6 6-6 6" />,
    eye: (
        <>
            <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
        </>
    ),
    eyeOff: (
        <>
            <path d="m3 3 18 18M10 5a12 12 0 0 1 12 7 19 19 0 0 1-3 4M6 6a19 19 0 0 0-4 6s4 7 10 7a12 12 0 0 0 5-1" />
        </>
    ),
    x: <path d="m6 6 12 12M6 18 18 6" />,
    wifi: (
        <>
            <path d="M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0m-11 4a6 6 0 0 1 8 0" />
            <circle cx="12" cy="20" r=".6" fill="currentColor" />
        </>
    ),
    book: (
        <>
            <path d="M12 6C8 3 3 4 3 4v15s5-1 9 2c4-3 9-2 9-2V4s-5-1-9 2Zm0 0v15" />
        </>
    ),
    info: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v6m0-10v.5" />
        </>
    ),
    lock: (
        <>
            <rect x="5" y="10" width="14" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
        </>
    ),
    chart: (
        <>
            <path d="M4 3v17h17M8 15v-4m5 4V6m5 9v-7" />
        </>
    )
}

export function Icon({
    name,
    size = 20,
    className = ""
}: {
    name: string
    size?: number
    className?: string
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.65"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={twMerge("shrink-0", className)}
            aria-hidden="true"
        >
            {paths[name] || paths.info}
        </svg>
    )
}

export function Brand({ compact = false }: { compact?: boolean }) {
    return (
        <span
            className={twMerge(
                "text-wine inline-flex items-center gap-[11px]",
                compact && "gap-2 lg:gap-[11px]"
            )}
        >
            <span
                className={
                    compact
                        ? "block w-7 shrink-0 md:w-[27px] lg:w-[33px]"
                        : "block w-[31px] shrink-0 md:w-[38px]"
                }
            >
                <svg className="h-11 w-full" viewBox="0 0 40 46" fill="none" aria-hidden="true">
                    <path d="m20 2 17 6v20L20 43 3 28V8Z" stroke="currentColor" strokeWidth="1.7" />
                    <path
                        d="M12 13v12a8 8 0 0 0 16 0V13M9 13h6m10 0h6M17 9h6"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <path d="m14 35 6 5 6-5" stroke="currentColor" />
                </svg>
            </span>
            <span>
                <strong
                    className={twMerge(
                        "block leading-[1.08] font-extrabold tracking-[-.9px]",
                        compact ? "text-[25px] lg:text-[28px]" : "text-[26px] md:text-[31px]"
                    )}
                >
                    UNTAR<span className="text-[#b58473]">.</span>
                </strong>
                <span
                    className={twMerge(
                        "block text-[#777078]",
                        compact
                            ? "mt-[7px] text-[9px] tracking-[1.4px] md:text-[8px] lg:text-[10px]"
                            : "mt-1 text-[10px] tracking-[.1px] md:text-xs"
                    )}
                >
                    {compact ? "ATTENDANCE PORTAL" : "Universitas Tarumanagara"}
                </span>
            </span>
        </span>
    )
}

export function Campus({ className = "" }: { className?: string }) {
    return (
        <svg
            className={twMerge("block w-full shrink-0", className)}
            viewBox="0 0 600 290"
            fill="none"
            aria-hidden="true"
        >
            <circle cx="424" cy="92" r="64" fill="currentColor" opacity=".07" />
            <circle cx="424" cy="92" r="82" stroke="currentColor" opacity=".12" />
            <path d="M10 259h580M48 270h504M90 280h420" stroke="currentColor" opacity=".3" />
            <g stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
                <path
                    d="M112 256V134h134v122M101 134h155v-9H101Z"
                    fill="currentColor"
                    fillOpacity=".035"
                />
                <path d="M120 125v-12h118v12M134 256V147h90v109" opacity=".7" />
                <path
                    d="M263 256V69h137v187M255 69h153V58H255ZM278 58V45h107v13M294 45V33h76v12"
                    fill="currentColor"
                    fillOpacity=".04"
                />
                <path d="M331 33V7m0 1 23 5-23 6" />
                <path d="M279 80h105v156H279ZM313 256v-35a18 18 0 0 1 36 0v35m-18-52v52" />
                <path
                    d="M410 256V155h111v101m-119-101h127v-9H402Z"
                    fill="currentColor"
                    fillOpacity=".035"
                />
                <path d="M423 146v-12h83v12" />
                {[0, 1, 2, 3, 4].map((row) => (
                    <g key={row} opacity=".65">
                        {[0, 1, 2, 3, 4].map((col) => (
                            <rect
                                key={col}
                                x={287 + col * 19}
                                y={89 + row * 22}
                                width="10"
                                height="13"
                            />
                        ))}
                    </g>
                ))}
                {[0, 1, 2, 3].map((row) => (
                    <g key={row} opacity=".55">
                        {[0, 1, 2, 3].map((col) => (
                            <rect
                                key={col}
                                x={142 + col * 21}
                                y={157 + row * 23}
                                width="12"
                                height="14"
                            />
                        ))}
                    </g>
                ))}
                {[0, 1, 2].map((row) => (
                    <g key={row} opacity=".55">
                        {[0, 1, 2, 3].map((col) => (
                            <rect
                                key={col}
                                x={421 + col * 23}
                                y={167 + row * 24}
                                width="12"
                                height="15"
                            />
                        ))}
                    </g>
                ))}
                <path
                    d="M303 248h57v8h-57m-7 0h71v5h-71M60 257v-60m-12 21 12 11 12-15m-12-26c-30-1-29 37-12 37-23 16 10 29 15 12 22 18 42-13 19-23 9-19-4-30-22-26ZM551 259v-47m-11 15 11 10 10-14m-10-18c-22-1-30 27-13 34-12 23 20 29 25 10 26 5 25-26 8-28 1-14-9-20-20-16Z"
                    fill="currentColor"
                    fillOpacity=".05"
                />
                <path
                    d="M223 85q9-10 18 0 9-10 18 0M77 92q7-8 14 0 7-8 14 0M451 43q7-8 14 0 7-8 14 0"
                    opacity=".5"
                />
            </g>
        </svg>
    )
}
