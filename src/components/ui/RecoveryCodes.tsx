import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
export function RecoveryCodes({
  codes,
  close,
}: {
  codes: string[]
  close: () => void
}) {
  const button = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const root = document.getElementById("root")!
    const prior = root.inert
    const overflow = document.body.style.overflow
    root.inert = true
    document.body.style.overflow = "hidden"
    button.current?.focus()
    return () => {
      root.inert = prior
      document.body.style.overflow = overflow
      root.querySelector<HTMLElement>("input,button")?.focus()
    }
  }, [])
  return createPortal(
    <div className="fixed inset-0 z-[120] bg-zinc-900/45 backdrop-blur-sm flex items-center justify-center p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Códigos de recuperación"
        className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4"
        onKeyDown={(e) => {
          if (e.key === "Tab") {
            e.preventDefault()
            button.current?.focus()
          }
        }}
      >
        <h2 className="font-bold">Códigos de recuperación</h2>
        <p className="text-sm">
          Guárdalos en un lugar privado. Cada código sirve una sola vez y no
          volverá a mostrarse.
        </p>
        <ul className="grid grid-cols-2 gap-2 font-mono text-sm select-all">
          {codes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <button ref={button} className="module-primary" onClick={close}>
          Ya guardé mis códigos
        </button>
      </section>
    </div>,
    document.body,
  )
}
