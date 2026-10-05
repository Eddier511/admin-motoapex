import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { errorMessage, post, request } from "../../lib/api"

export type SensitiveAction =
  | "users.manage"
  | "settings.manage"
  | "profile.edit"
  | "password.change"
  | "mfa.manage"
export type SensitiveTask = {
  action: SensitiveAction
  run: (token: string) => Promise<unknown>
  resolve: (result: unknown) => void
  reject: (reason: Error) => void
}

export function Reauthenticate({
  task,
  close,
}: {
  task: SensitiveTask
  close: () => void
}) {
  const [password, setPassword] = useState("")
  const [factor, setFactor] = useState("")
  const [recovery, setRecovery] = useState(false)
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLFormElement>(null)
  const load = () => {
    setError("")
    request<{ enabled: boolean }>("/auth/mfa/status")
      .then((r) => setEnabled(r.enabled))
      .catch((e) => setError(errorMessage(e)))
  }
  useEffect(() => {
    load()
    const root = document.getElementById("root")!
    const prior = root.inert
    const focus = document.activeElement
    const overflow = document.body.style.overflow
    root.inert = true
    document.body.style.overflow = "hidden"
    ref.current?.focus()
    return () => {
      root.inert = prior
      document.body.style.overflow = overflow
      if (focus instanceof HTMLElement && focus.isConnected) focus.focus()
    }
  }, [])
  return createPortal(
    <div className="fixed inset-0 z-[110] bg-zinc-900/45 backdrop-blur-sm flex items-center justify-center p-4">
      <form
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reauth-title"
        className="bg-white border rounded-2xl p-6 w-full max-w-md space-y-4"
        onKeyDown={(e) => {
          if (e.key === "Escape" && !busy) {
            task.reject(new Error("Operación cancelada."))
            close()
          }
          if (e.key === "Tab") {
            const nodes = Array.from(
              ref.current!.querySelectorAll<HTMLElement>(
                "input:not(:disabled),button:not(:disabled),select:not(:disabled)",
              ),
            )
            const first = nodes[0],
              last = nodes[nodes.length - 1]
            if (
              e.shiftKey &&
              (document.activeElement === first ||
                document.activeElement === ref.current)
            ) {
              e.preventDefault()
              last?.focus()
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault()
              first?.focus()
            }
          }
        }}
        onSubmit={async (e) => {
          e.preventDefault()
          if (busy || enabled === null) return
          setBusy(true)
          setError("")
          try {
            const r = await post<{ reauthToken: string; expiresAt: string }>(
              "/auth/reauth",
              {
                password,
                action: task.action,
                ...(enabled
                  ? recovery
                    ? { recoveryCode: factor }
                    : { code: factor }
                  : {}),
              },
            )
            if (
              !r.reauthToken ||
              !Number.isFinite(Date.parse(r.expiresAt)) ||
              Date.parse(r.expiresAt) <= Date.now()
            )
              throw new Error("La confirmación venció. Reautentica de nuevo.")
            setPassword("")
            setFactor("")
            const result = await task.run(r.reauthToken)
            task.resolve(result)
            close()
          } catch (e) {
            setError(errorMessage(e))
            setPassword("")
            setFactor("")
          } finally {
            setBusy(false)
          }
        }}
      >
        <h2 id="reauth-title" className="font-semibold text-lg">
          Confirma tu identidad
        </h2>
        <p className="text-sm text-zinc-500">
          Esta operación requiere tu contraseña actual
          {enabled ? " y un código de autenticación nuevo." : "."}
        </p>
        {error && (
          <p role="alert" className="text-red-600 text-sm break-words">
            {error}
          </p>
        )}
        {enabled === null ? (
          <button type="button" onClick={load}>
            Reintentar comprobación MFA
          </button>
        ) : (
          <>
            <label className="block text-sm">
              Contraseña actual
              <input
                className="module-input"
                required
                disabled={busy}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {enabled && (
              <>
                <label className="block text-sm">
                  {recovery ? "Código de recuperación" : "Código MFA"}
                  <input
                    className="module-input"
                    required
                    disabled={busy}
                    autoComplete="one-time-code"
                    value={factor}
                    onChange={(e) => setFactor(e.target.value)}
                    pattern={recovery ? undefined : "[0-9]{6}"}
                  />
                </label>
                <label className="flex gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={recovery}
                    disabled={busy}
                    onChange={(e) => {
                      setRecovery(e.target.checked)
                      setFactor("")
                    }}
                  />
                  Usar código de recuperación
                </label>
              </>
            )}
          </>
        )}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              task.reject(new Error("Operación cancelada."))
              close()
            }}
          >
            Cancelar
          </button>
          <button
            className="module-primary"
            disabled={busy || enabled === null}
          >
            {busy ? "Confirmando…" : "Confirmar operación"}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}
