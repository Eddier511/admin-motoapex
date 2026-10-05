import { X } from "lucide-react"
import { Confirmation } from "./Confirmation"

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  danger = false,
  onConfirm,
  onCancel,
  busy,
}: ConfirmModalProps) {
  return open ? (
    <Confirmation
      title={title}
      message={message}
      confirmLabel={confirmLabel}
      danger={danger}
      onConfirm={onConfirm}
      onCancel={onCancel}
      busy={busy}
    />
  ) : null
}

interface DrawerProps {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
  width?: string
}

export function Drawer({
  open,
  title,
  onClose,
  children,
  width = "max-w-xl",
}: DrawerProps) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className={`w-full ${width} h-full flex flex-col border-l overflow-y-auto`}
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="font-semibold text-zinc-100">{title}</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}
