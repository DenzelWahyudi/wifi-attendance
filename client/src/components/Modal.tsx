import { useEffect, useId, useRef, type ReactNode } from "react"
import { Icon } from "./Icons"
import { FormIcon, IconButton } from "./ui"

export function Modal({
    title,
    description,
    onClose,
    busy = false,
    children
}: {
    title: string
    description: string
    onClose: () => void
    busy?: boolean
    children: ReactNode
}) {
    const ref = useRef<HTMLDialogElement>(null)
    const titleId = useId()
    const descriptionId = useId()
    useEffect(() => {
        const dialog = ref.current
        dialog?.showModal()
        return () => {
            dialog?.close()
        }
    }, [])
    return (
        <dialog
            ref={ref}
            className="open:animate-enter m-auto max-h-[calc(100svh-40px)] w-[min(455px,calc(100%-32px))] overflow-y-auto rounded-[14px] border border-[#e7dfe5] bg-white p-0 text-[#3b303d] shadow-[0_30px_100px_#1e0c2333] backdrop:bg-[#2b1a345c] backdrop:backdrop-blur-[3px] motion-reduce:animate-none"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            onCancel={(event) => {
                event.preventDefault()
                if (!busy) onClose()
            }}
            onClick={(event) => {
                if (event.target === event.currentTarget && !busy) onClose()
            }}
        >
            <div className="relative p-[26px] md:p-[30px]">
                <IconButton
                    className="absolute top-3.5 right-3.5"
                    aria-label="Close dialog"
                    onClick={onClose}
                    disabled={busy}
                >
                    <Icon name="x" size={20} />
                </IconButton>
                <FormIcon
                    name={title.startsWith("Reset") ? "reset" : "users"}
                    className="mt-0 mb-5 md:mt-0 md:mb-5"
                />
                <h2 id={titleId} className="text-2xl font-semibold tracking-[-.6px] md:text-[25px]">
                    {title}
                </h2>
                <p className="mt-[9px] text-sm leading-[1.8] text-[#978799]" id={descriptionId}>
                    {description}
                </p>
                {children}
            </div>
        </dialog>
    )
}
