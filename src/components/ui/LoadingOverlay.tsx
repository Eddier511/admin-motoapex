import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { LoaderCircle } from "lucide-react"

export function LoadingOverlay() {
  const dialog = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = document.getElementById("root")
    const previousFocus = document.activeElement
    const previousInert = root?.inert ?? false
    const previousOverflow = document.body.style.overflow
    if (root) root.inert = true
    document.body.style.overflow = "hidden"
    dialog.current?.focus()
    return () => {
      if (root) root.inert = previousInert
      document.body.style.overflow = previousOverflow
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus()
    }
  }, [])

  return createPortal(
    <div className="loading-backdrop fixed inset-0 z-[100] flex items-center justify-center p-5">
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="loading-title"
        aria-describedby="loading-description" tabIndex={-1}
        className="loading-popup w-full max-w-[360px] rounded-3xl bg-white p-8 text-center outline-none">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
          <LoaderCircle aria-hidden="true" size={28} className="loading-spinner text-orange-500" />
        </div>
        <div role="status" aria-live="polite">
          <h2 id="loading-title" className="text-xl font-semibold tracking-tight text-[#18181b]">Cargando experiencia</h2>
          <p id="loading-description" className="mt-2 text-sm text-[#868b98]">Un momento, estamos preparando tu panel.</p>
        </div>
        <div role="progressbar" aria-label="Carga en curso" className="relative mt-6 h-1.5 overflow-hidden rounded-full bg-orange-100">
          <div className="loading-progress absolute inset-y-0 w-2/5 rounded-full bg-gradient-to-r from-orange-400 to-orange-600" />
        </div>
      </div>
    </div>,
    document.body,
  )
}
