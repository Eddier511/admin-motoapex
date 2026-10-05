import { useEffect, useState } from "react"
import QRCode from "qrcode"
import { useApp } from "../context/AppContext"
import { request, post, errorMessage } from "../lib/api"
import { useRemote } from "../lib/useRemote"
import { ModuleFields } from "../components/ui/ModuleFields"
import { RemoteState } from "../components/ui/RemoteState"
import { editable, schemas, https, type Doc } from "../lib/moduleSchemas"

const allowedSettings = [
  "site_url",
  "admin_url",
  "api_url",
  "timezone",
  "default_currency",
]
export function SettingsModule() {
  const { can, sensitive, addToast } = useApp()
  const remote = useRemote((signal) =>
    request<Doc[]>("/admin/settings", { signal }),
  )
  const [values, setValues] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  if (!can("settings.manage"))
    return <RemoteState error="No tienes permiso para ajustes." />
  if (remote.loading || remote.error)
    return (
      <RemoteState
        loading={remote.loading}
        error={remote.error}
        retry={remote.reload}
      />
    )
  return (
    <div className="account-module flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
      <h2 className="text-lg font-semibold">Configuración</h2>
      <p className="text-sm text-zinc-500">
        Estas URL son informativas. Contacto, horarios, logos y redes se
        gestionan en Contenido web.
      </p>
      {error && <RemoteState error={error} />}
      {remote.data
        ?.filter((s) => allowedSettings.includes(s.key))
        .map((s) => (
          <form
            key={s.key}
            className="bg-card border rounded-xl p-4 flex flex-wrap gap-3 items-end"
            onSubmit={async (e) => {
              e.preventDefault()
              if (busy) return
              const value = values[s.key] ?? s.value
              if (s.key.endsWith("_url") && !https(value)) {
                setError("La URL debe ser HTTPS sin credenciales.")
                return
              }
              setBusy(true)
              setError("")
              try {
                await sensitive("settings.manage", (token) =>
                  request(`/admin/settings/${s.key}`, {
                    method: "PUT",
                    body: JSON.stringify({ value }),
                    headers: { "X-Reauth-Token": token },
                  }),
                )
                addToast("success", "Ajuste guardado")
                setValues({})
                remote.reload()
              } catch (e) {
                setError(errorMessage(e))
                addToast("error", errorMessage(e))
              } finally {
                setBusy(false)
              }
            }}
          >
            <label className="text-sm grow">
              {s.key}
              {s.key === "default_currency" ? (
                <select
                  aria-label={s.key}
                  className="module-input"
                  disabled={busy}
                  value={values[s.key] ?? s.value}
                  onChange={(e) =>
                    setValues({ ...values, [s.key]: e.target.value })
                  }
                >
                  <option>CRC</option>
                  <option>USD</option>
                </select>
              ) : (
                <input
                  aria-label={s.key}
                  className="module-input"
                  disabled={busy}
                  required
                  type={s.key.endsWith("_url") ? "url" : "text"}
                  value={values[s.key] ?? s.value}
                  onChange={(e) =>
                    setValues({ ...values, [s.key]: e.target.value })
                  }
                />
              )}
            </label>
            <button className="module-primary" disabled={busy}>
              Guardar {s.key}
            </button>
          </form>
        ))}
      {!remote.data?.filter((s) => allowedSettings.includes(s.key)).length && (
        <p className="text-sm">
          No hay ajustes instalados. Comprueba la migración 005 de la API.
        </p>
      )}
    </div>
  )
}

export function Account() {
  const {
    sensitive,
    clearSession,
    updateUser,
    addToast,
    revealCodes,
    confirmAction,
  } = useApp()
  const remote = useRemote(async (signal) => {
    const [profile, mfa] = await Promise.all([
      request<Doc>("/auth/profile", { signal }),
      request<{ enabled: boolean }>("/auth/mfa/status", { signal }),
    ])
    return { profile, mfa }
  })
  const [profile, setProfile] = useState<Doc | null>(null)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [uri, setUri] = useState("")
  const [qr, setQr] = useState("")
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  useEffect(() => {
    let alive = true
    if (uri)
      QRCode.toDataURL(uri, { margin: 2, width: 220 })
        .then((data) => {
          if (alive) setQr(data)
        })
        .catch(() => {
          if (alive) setError("No se pudo generar el QR local.")
        })
    else setQr("")
    return () => {
      alive = false
    }
  }, [uri])
  async function perform(fn: () => Promise<void>) {
    if (busy) return
    setBusy(true)
    setError("")
    try {
      await fn()
    } catch (e) {
      setError(errorMessage(e))
      addToast("error", errorMessage(e))
    } finally {
      setBusy(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmation("")
      setCode("")
    }
  }
  if (remote.loading || remote.error)
    return (
      <RemoteState
        loading={remote.loading}
        error={remote.error}
        retry={remote.reload}
      />
    )
  const fields = schemas.users.fields.filter((f) =>
    ["name", "email", "phone", "avatarUrl"].includes(f.key),
  )
  return (
    <div className="account-module flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
      <h2 className="text-lg font-semibold">Mi cuenta</h2>
      {error && <RemoteState error={error} />}
      <form
        className="bg-card border rounded-xl p-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          void perform(async () => {
            const doc = editable(fields, profile || remote.data!.profile)
            if (doc.avatarUrl && !https(doc.avatarUrl))
              throw new Error("El avatar debe usar HTTPS sin credenciales.")
            const result = await sensitive("profile.edit", (token) =>
              request<any>("/auth/profile", {
                method: "PUT",
                body: JSON.stringify(doc),
                headers: { "X-Reauth-Token": token },
              }),
            )
            addToast("success", "Perfil guardado")
            if (
              result.loginRequired ||
              doc.email !== remote.data!.profile.email
            )
              clearSession()
            else {
              updateUser(result)
              setProfile(null)
              remote.reload()
            }
          })
        }}
      >
        <h3 className="font-semibold">Perfil</h3>
        <ModuleFields
          fields={fields}
          value={profile || remote.data!.profile}
          change={setProfile}
          disabled={busy}
        />
        <button className="module-primary" disabled={busy}>
          Guardar perfil
        </button>
      </form>
      <form
        className="bg-card border rounded-xl p-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          void perform(async () => {
            const n = new TextEncoder().encode(newPassword).length
            if (n < 16 || n > 72 || newPassword !== confirmation)
              throw new Error(
                "La contraseña debe tener 16–72 bytes y coincidir con la confirmación.",
              )
            await sensitive("password.change", (token) =>
              post(
                "/auth/password/change",
                { currentPassword, newPassword },
                token,
              ),
            )
            addToast(
              "success",
              "Contraseña actualizada. Inicia sesión de nuevo.",
            )
            clearSession()
          })
        }}
      >
        <h3 className="font-semibold">Cambiar contraseña</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              label: "Contraseña actual",
              value: currentPassword,
              set: setCurrentPassword,
            },
            {
              label: "Nueva contraseña",
              value: newPassword,
              set: setNewPassword,
            },
            {
              label: "Confirmar nueva contraseña",
              value: confirmation,
              set: setConfirmation,
            },
          ].map((f) => (
            <label className="text-sm" key={f.label}>
              {f.label}
              <input
                aria-label={f.label}
                className="module-input"
                type="password"
                autoComplete={
                  f.label === "Contraseña actual"
                    ? "current-password"
                    : "new-password"
                }
                disabled={busy}
                required
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
              />
            </label>
          ))}
        </div>
        <button className="module-primary" disabled={busy}>
          Cambiar contraseña
        </button>
      </form>
      <section className="bg-card border rounded-xl p-5 space-y-4">
        <h3 className="font-semibold">Autenticación de dos factores</h3>
        <p className="text-sm">
          MFA: {remote.data!.mfa.enabled ? "activado" : "desactivado"}
        </p>
        {!remote.data!.mfa.enabled ? (
          <>
            <button
              className="module-primary"
              disabled={busy}
              onClick={() =>
                void perform(async () => {
                  setUri("")
                  const result = await sensitive("mfa.manage", (t) =>
                    post<{ otpauthUri: string }>("/auth/mfa/enroll", {}, t),
                  )
                  setUri(result.otpauthUri)
                  addToast(
                    "success",
                    "Alta preparada. Confirma el código para activar MFA.",
                  )
                })
              }
            >
              Preparar MFA
            </button>
            {uri && (
              <div className="space-y-3">
                <p className="text-sm">
                  Escanea el QR con tu autenticador. Se genera localmente.
                </p>
                {qr && (
                  <img
                    src={qr}
                    alt="QR para configurar el autenticador"
                    width={220}
                    height={220}
                  />
                )}
                <details>
                  <summary className="text-sm">Configuración manual</summary>
                  <p className="text-xs break-all select-all">{uri}</p>
                </details>
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault()
                    void perform(async () => {
                      const result = await sensitive("mfa.manage", (t) =>
                        post<{ recoveryCodes: string[] }>(
                          "/auth/mfa/confirm",
                          { code },
                          t,
                        ),
                      )
                      setUri("")
                      revealCodes(result.recoveryCodes)
                      clearSession()
                    })
                  }}
                >
                  <label className="text-sm">
                    Código de alta
                    <input
                      className="module-input"
                      autoComplete="one-time-code"
                      required
                      pattern="[0-9]{6}"
                      disabled={busy}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                    />
                  </label>
                  <button className="module-primary" disabled={busy}>
                    Confirmar MFA
                  </button>
                </form>
                <button
                  className="text-sm"
                  disabled={busy}
                  onClick={() => setUri("")}
                >
                  Ocultar configuración
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-wrap gap-3">
            <button
              className="module-secondary"
              disabled={busy}
              onClick={() =>
                void perform(async () => {
                  const result = await sensitive("mfa.manage", (t) =>
                    post<{ recoveryCodes: string[] }>(
                      "/auth/mfa/recovery-codes",
                      {},
                      t,
                    ),
                  )
                  revealCodes(result.recoveryCodes)
                  addToast(
                    "success",
                    "Códigos rotados; los anteriores ya no sirven.",
                  )
                })
              }
            >
              Rotar códigos de recuperación
            </button>
            <button
              className="module-secondary text-red-600"
              disabled={busy}
              onClick={async () => {
                if (
                  await confirmAction({
                    title: "¿Desactivar MFA?",
                    message:
                      "Se revocarán todas las sesiones. Tendrás que iniciar sesión de nuevo.",
                    confirmLabel: "Desactivar MFA",
                  })
                )
                  void perform(async () => {
                    await sensitive("mfa.manage", (t) =>
                      post("/auth/mfa/disable", {}, t),
                    )
                    addToast(
                      "success",
                      "MFA desactivado. Inicia sesión de nuevo.",
                    )
                    clearSession()
                  })
              }}
            >
              Desactivar MFA
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
