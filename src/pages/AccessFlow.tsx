import { useState } from "react"
import { useApp } from "../context/AppContext"
import { ApiError, errorMessage, post } from "../lib/api"
import logo from "../assets/motoapex-logo.png"

// Capture once, before rendering/analytics. Never persist the reset credential.
let resetToken =
  location.pathname === "/reset-password"
    ? new URLSearchParams(location.hash.slice(1)).get("token") || ""
    : ""
if (location.pathname === "/reset-password")
  history.replaceState(null, "", location.pathname + location.search)
export const isResetRoute = () => location.pathname === "/reset-password"
export function AccessFlow({
  mode,
  back,
}: {
  mode: "challenge" | "forgot" | "reset"
  back?: () => void
}) {
  const { challenge, completeChallenge, clearSession } = useApp()
  const [value, setValue] = useState("")
  const [confirm, setConfirm] = useState("")
  const [recovery, setRecovery] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const mfa = mode === "challenge" && challenge?.challenge === "mfa_login"
  const password = mode === "reset" || (mode === "challenge" && !mfa)
  const title =
    mode === "forgot"
      ? "Recuperar contraseña"
      : mode === "reset"
        ? "Restablecer contraseña"
        : mfa
          ? "Verifica tu identidad"
          : "Cambia tu contraseña"
  return (
    <main className="login-screen min-h-svh flex items-center justify-center p-4">
      <section className="login-card w-full max-w-[520px] rounded-[20px] p-6 sm:p-9 space-y-5">
        <img
          src={logo}
          alt="MotoApex Costa Rica"
          className="w-28 h-28 object-contain mx-auto"
        />
        <h1 className="text-2xl font-bold text-center">{title}</h1>
        {error && (
          <p role="alert" className="text-red-600 text-sm break-words">
            {error}
          </p>
        )}
        {message ? (
          <p role="status" className="text-sm">
            {message}
          </p>
        ) : (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault()
              if (busy) return
              setError("")
              if (
                password &&
                (new TextEncoder().encode(value).length < 16 ||
                  new TextEncoder().encode(value).length > 72 ||
                  value !== confirm)
              ) {
                setError(
                  "La contraseña debe tener entre 16 y 72 bytes y coincidir con la confirmación.",
                )
                return
              }
              setBusy(true)
              try {
                if (mode === "forgot") {
                  const r = await post<{ message: string }>(
                    "/auth/password/forgot",
                    { email: value },
                  )
                  setMessage(r.message)
                } else if (mode === "reset") {
                  if (!resetToken)
                    throw new Error(
                      "El enlace no contiene un token válido. Solicita uno nuevo.",
                    )
                  await post("/auth/password/reset", {
                    token: resetToken,
                    newPassword: value,
                  })
                  resetToken = ""
                  clearSession()
                  setMessage(
                    "Contraseña restablecida. Vuelve a iniciar sesión.",
                  )
                } else {
                  await completeChallenge(
                    mfa
                      ? recovery
                        ? { recoveryCode: value }
                        : { code: value }
                      : { newPassword: value },
                  )
                }
                setValue("")
                setConfirm("")
              } catch (e) {
                setError(errorMessage(e))
                if (
                  mode === "reset" &&
                  e instanceof ApiError &&
                  e.status === 401
                )
                  resetToken = ""
              } finally {
                setBusy(false)
              }
            }}
          >
            <label className="block text-sm">
              {mode === "forgot"
                ? "Correo electrónico"
                : mfa
                  ? recovery
                    ? "Código de recuperación"
                    : "Código MFA"
                  : "Nueva contraseña"}
              <input
                className="module-input"
                required
                disabled={busy}
                type={
                  mode === "forgot" ? "email" : password ? "password" : "text"
                }
                autoComplete={
                  password ? "new-password" : mfa ? "one-time-code" : "email"
                }
                pattern={mfa && !recovery ? "[0-9]{6}" : undefined}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </label>
            {password && (
              <label className="block text-sm">
                Confirmar contraseña
                <input
                  className="module-input"
                  required
                  disabled={busy}
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </label>
            )}
            {mfa && (
              <label className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={recovery}
                  disabled={busy}
                  onChange={(e) => {
                    setRecovery(e.target.checked)
                    setValue("")
                  }}
                />
                Usar código de recuperación
              </label>
            )}
            <button className="module-primary w-full" disabled={busy}>
              {busy
                ? "Procesando…"
                : mode === "forgot"
                  ? "Enviar enlace"
                  : "Continuar"}
            </button>
          </form>
        )}
        <button
          className="text-sm text-zinc-500"
          disabled={busy}
          onClick={() => {
            resetToken = ""
            clearSession()
            if (mode === "reset") {
              history.replaceState(null, "", "/")
              location.reload()
            } else back?.()
          }}
        >
          Volver al inicio de sesión
        </button>
        <p className="text-xs text-center text-zinc-400">MotoApex Costa Rica</p>
      </section>
    </main>
  )
}
