import { useEffect, useId, useRef } from "react"
import { createPortal } from "react-dom"
import { Trash2, ShieldAlert, X } from "lucide-react"

export type ConfirmationOptions = {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
}

export function Confirmation({
  title,
  message,
  confirmLabel = "Eliminar",
  danger = true,
  onConfirm,
  onCancel,
  busy = false,
}: ConfirmationOptions & {
  onConfirm: () => void
  onCancel: () => void
  busy?: boolean
}) {
  const titleId = useId(),
    descriptionId = useId()
  const panel = useRef<HTMLDivElement>(null)
  const cancel = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const root = document.getElementById("root")
    const prior = root?.inert
    const focus = document.activeElement
    const overflow = document.body.style.overflow
    if (root) root.inert = true
    document.body.style.overflow = "hidden"
    cancel.current?.focus()
    return () => {
      if (root) root.inert = prior || false
      document.body.style.overflow = overflow
      if (focus instanceof HTMLElement && focus.isConnected) focus.focus()
    }
  }, [])
  const Icon = confirmLabel === "Eliminar" ? Trash2 : ShieldAlert
  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-zinc-900/45 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel()
      }}
    >
      <div
        ref={panel}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={busy}
        className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-2xl"
        style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
        onKeyDown={(e) => {
          if (e.key === "Escape" && !busy) {
            e.preventDefault()
            onCancel()
          }
          if (e.key === "Tab") {
            const nodes = Array.from(
              panel.current!.querySelectorAll<HTMLButtonElement>(
                "button:not(:disabled)",
              ),
            )
            const first = nodes[0],
              last = nodes[nodes.length - 1]
            if (!first) {
              e.preventDefault()
              return
            }
            if (
              e.shiftKey &&
              (document.activeElement === first ||
                document.activeElement === panel.current)
            ) {
              e.preventDefault()
              last.focus()
            } else if (
              !e.shiftKey &&
              (document.activeElement === last ||
                document.activeElement === panel.current)
            ) {
              e.preventDefault()
              first.focus()
            }
          }
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${danger ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600"}`}
          >
            <Icon size={24} />
          </div>
          <button
            type="button"
            aria-label="Cerrar confirmación"
            disabled={busy}
            onClick={onCancel}
            className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100"
          >
            <X size={20} />
          </button>
        </div>
        <h2 id={titleId} className="text-xl font-semibold mb-2 break-words">
          {title}
        </h2>
        <p
          id={descriptionId}
          className="text-sm text-zinc-500 leading-relaxed break-words"
        >
          {message}
        </p>
        <div className="flex justify-end gap-3 mt-7">
          <button
            ref={cancel}
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="module-secondary"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 ${danger ? "bg-red-600 hover:bg-red-700" : "bg-orange-600 hover:bg-orange-700"}`}
          >
            {busy ? "Procesando…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
