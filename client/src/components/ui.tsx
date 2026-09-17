import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from "react"
import { twMerge } from "tailwind-merge"
import { Icon } from "./Icons"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "text"
}

const buttonVariants = {
    primary:
        "border-transparent bg-wine text-white shadow-[0_2px_3px_#68152b0c] enabled:hover:bg-wine-dark enabled:hover:shadow-[0_4px_12px_#68152b25]",
    secondary:
        "border-[#ddd9df] bg-white text-[#514b55] enabled:hover:border-[#bc9ba5] enabled:hover:bg-[#faf7f8]",
    text: "min-h-0 rounded-none border-0 bg-transparent px-0 py-[5px] text-wine enabled:hover:text-wine-dark enabled:hover:underline"
}

export function Button({ variant = "primary", className, type = "button", ...props }: ButtonProps) {
    return (
        <button
            type={type}
            className={twMerge(
                "inline-flex min-h-[42px] cursor-pointer touch-manipulation items-center justify-center gap-[9px] rounded-[7px] border px-[17px] py-[11px] text-sm leading-normal font-semibold whitespace-nowrap transition duration-180 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#bb667d] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
                buttonVariants[variant],
                className
            )}
            {...props}
        />
    )
}

export function IconButton({
    className,
    type = "button",
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            type={type}
            className={twMerge(
                "enabled:hover:text-wine inline-flex size-[30px] shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-[5px] bg-transparent p-0 text-[#827c85] transition-colors focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#bb667d] enabled:hover:bg-[#f1ebee] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
                className
            )}
            {...props}
        />
    )
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            className={twMerge(
                "text-ink min-w-0 flex-1 self-stretch border-0 bg-transparent text-[15px] outline-none placeholder:text-[#a09aa1]",
                className
            )}
            {...props}
        />
    )
}

export function InputGroup({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={twMerge(
                "flex min-h-[49px] items-center gap-[11px] rounded-[7px] border border-[#dedbe1] bg-white px-3.5 text-[#96909a] transition-[box-shadow,border-color] focus-within:border-[#ad6e81] focus-within:shadow-[0_0_0_3px_#861b350b] has-[:disabled]:bg-[#faf9fa] motion-reduce:transition-none",
                className
            )}
            {...props}
        />
    )
}

export function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
    return (
        <label htmlFor={htmlFor} className="mb-[9px] block text-sm font-semibold text-[#48434d]">
            {children}
            <span className="text-wine ml-0.5">*</span>
        </label>
    )
}

export function FieldHint({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p
            className={twMerge("mt-[9px] text-[10.5px] leading-[1.7] text-[#8b8590]", className)}
            {...props}
        />
    )
}

export function FormIcon({ name, className }: { name: string; className?: string }) {
    return (
        <div
            className={twMerge(
                "text-wine mt-6 mb-[18px] flex size-12 items-center justify-center rounded-[10px] border border-[#f1e3e8] bg-[#f7edf0] md:mt-[29px] md:mb-[21px] md:size-[55px] md:rounded-xl",
                className
            )}
        >
            <Icon name={name} size={29} />
        </div>
    )
}

export function AttendanceBadge({ present }: { present: boolean }) {
    return (
        <span
            className={twMerge(
                "inline-flex items-center gap-1.5 rounded-[5px] border px-[7px] py-[5px] text-[10px] font-semibold whitespace-nowrap md:px-[9px] md:text-xs",
                present
                    ? "border-[#dcebe1] bg-[#eaf5ee] text-[#33755d]"
                    : "border-[#f3e9d5] bg-[#fcf5e7] text-[#9a752f]"
            )}
        >
            <span className="size-[5px] rounded-full bg-current" />
            {present ? "Present" : "Not attended"}
        </span>
    )
}

export function Spinner() {
    return (
        <span
            className="inline-block size-[17px] shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
            aria-hidden="true"
        />
    )
}

export function ErrorNotice({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div
            className={twMerge(
                "flex items-start gap-[9px] rounded-md border border-[#f1d6dd] bg-[#fdf0f1] px-[13px] py-[11px] text-sm leading-[1.6] text-[#9a2c42]",
                className
            )}
            role="alert"
        >
            <Icon name="info" size={18} className="mt-px" />
            <span>{children}</span>
        </div>
    )
}

export function ModalActions({ children }: { children: ReactNode }) {
    return (
        <div className="xs:[&_button]:text-[13px] mt-6 flex flex-wrap items-center justify-end gap-[9px] border-t border-[#eee6ef] pt-[21px] [&_button]:text-xs">
            {children}
        </div>
    )
}
