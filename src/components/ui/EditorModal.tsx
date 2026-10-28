import { useEffect, useId, useRef, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

export function EditorModal({
  title,
  busy,
  onClose,
  children,
  returnFocus,
}: {
  title: string
  busy: boolean
  onClose: () => void
  children: ReactNode
  returnFocus?: HTMLElement | null
}) {
  const titleId = useId()
  const panel = useRef<HTMLElement>(null)
  useEffect(() => {
    const root = document.getElementById("root")
    const priorInert = root?.inert ?? false
    const overflow = document.body.style.overflow
    const previousFocus = returnFocus || document.activeElement
    if (root) root.inert = true
    document.body.style.overflow = "hidden"
    panel.current?.focus()
    // A sensitive edit can open reauthentication above this editor. Suspend
    // the underlying form while that dialog owns keyboard/mouse interaction.
    const syncTopDialog = () => {
      if (!panel.current) return
      const blocked = Array.from(
        document.querySelectorAll<HTMLElement>('[aria-modal="true"]'),
      ).some(
        (node) =>
          node !== panel.current &&
          !root?.contains(node) &&
          !panel.current?.contains(node) &&
          node.getClientRects().length > 0,
      )
      const wasBlocked = panel.current.inert
      panel.current.inert = blocked
      if (wasBlocked && !blocked) panel.current.focus()
    }
    const observer = new MutationObserver(syncTopDialog)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      if (root) root.inert = priorInert
      document.body.style.overflow = overflow
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus()
    }
  }, [])
  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-zinc-900/45 backdrop-blur-sm p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose()
      }}
    >
      <section
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={busy}
        className="module-editor flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl outline-none"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault()
            if (!busy) onClose()
          }
          if (e.key === "Tab") {
            const nodes = Array.from(
              panel.current!.querySelectorAll<HTMLElement>(
                'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href], [tabindex="0"]',
              ),
            ).filter((node) => node.getClientRects().length > 0)
            const first = nodes[0],
              last = nodes.at(-1)
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
              last?.focus()
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
        <header className="flex shrink-0 items-center justify-between gap-4 border-b px-5 py-4 sm:px-6">
          <h3 id={titleId} className="font-semibold text-lg">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Cerrar editor"
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </header>
        <div className="overflow-y-auto overscroll-contain p-5 sm:p-6">
          {children}
        </div>
      </section>
    </div>,
    document.body,
  )
}
