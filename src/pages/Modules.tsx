import { useState } from "react"
import { useApp } from "../context/AppContext"
import { request, errorMessage } from "../lib/api"
import { useRemote } from "../lib/useRemote"
import {
  schemas,
  editable,
  validateModule,
  type Doc,
} from "../lib/moduleSchemas"
import { ModuleFields } from "../components/ui/ModuleFields"
import { RemoteState } from "../components/ui/RemoteState"
import { Badge } from "../components/ui/Badge"
import { promotionFields, promotionPayload } from "../lib/promotionEditor"

export function ResourceModule({ kind }: { kind: string }) {
  const schema = schemas[kind]
  const { can, addToast, sensitive, user, clearSession } = useApp()
  const [form, setForm] = useState<Doc | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const remote = useRemote(
    async (signal) => {
      const items = await request<Doc[] | Doc>(`/admin/${kind}`, { signal })
      const refs: Record<string, Doc[]> = {}
      const names = new Set(
        schema.fields
          .flatMap((f) => [
            f.reference,
            ...(f.children || []).map((c) => c.reference),
          ])
          .filter(Boolean) as string[],
      )
      await Promise.all(
        [...names].map(async (name) => {
          refs[name] = await request<Doc[]>(`/admin/${name}`, { signal })
        }),
      )
      return {
        items: schema.singleton ? [items as Doc] : (items as Doc[]),
        refs,
      }
    },
    [kind],
  )
  if (!can(schema.permission))
    return <RemoteState error="No tienes permiso para este módulo." />
  if (remote.loading || remote.error)
    return (
      <RemoteState
        loading={remote.loading}
        error={remote.error}
        retry={remote.reload}
      />
    )
  const fields =
    kind === "users"
      ? [
          ...schema.fields,
          ...(form?.id
            ? [
                {
                  key: "newPassword",
                  label:
                    "Nueva contraseña (opcional, impone cambio obligatorio)",
                  type: "password" as const,
                  optional: true,
                },
                {
                  key: "mustChangePassword",
                  label: "Exigir cambio de contraseña",
                  type: "boolean" as const,
                  optional: true,
                },
              ]
            : [
                {
                  key: "password",
                  label: "Contraseña inicial (16–72 bytes)",
                  type: "password" as const,
                  required: true,
                },
              ]),
        ]
      : kind === "banners"
        ? schema.fields.filter((f) => f.type !== "date")
        : kind === "promotions"
          ? promotionFields(schema.fields)
          : schema.fields
  const run = <T,>(fn: (t?: string) => Promise<T>) =>
    schema.sensitive ? sensitive(schema.sensitive, fn) : fn()
  async function edit(id?: string) {
    setBusy(true)
    setError("")
    try {
      const d = await request<Doc>(
        `/admin/${kind}${id ? "/" + encodeURIComponent(id) : ""}`,
      )
      const clean = editable(schema.fields, d)
      if (id) clean.id = d.id
      setForm(clean)
    } catch (e) {
      setError(errorMessage(e))
      addToast("error", errorMessage(e))
    } finally {
      setBusy(false)
    }
  }
  async function destroy(item: Doc) {
    if (
      busy ||
      !confirm(
        `¿Eliminar ${item.title || item.name || item.label}? Se conservará el historial.`,
      )
    )
      return
    setBusy(true)
    setError("")
    try {
      await run((t) =>
        request(`/admin/${kind}/${encodeURIComponent(item.id)}`, {
          method: "DELETE",
          headers: t ? { "X-Reauth-Token": t } : {},
        }),
      )
      addToast("success", "Registro eliminado")
      if (kind === "users" && item.id === user?.id) clearSession()
      else remote.reload()
    } catch (e) {
      setError(errorMessage(e))
      addToast("error", errorMessage(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="resource-module flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-lg">{schema.title}</h2>
        <button
          className="module-primary"
          disabled={busy}
          onClick={() => {
            setError("")
            schema.singleton
              ? void edit()
              : setForm(structuredClone(schema.initial))
          }}
        >
          {schema.singleton ? "Editar contacto" : "Crear registro"}
        </button>
      </div>
      {error && <RemoteState error={error} />}
      <div className="border rounded-xl bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {["Nombre", "Estado", "Acciones"].map((s) => (
                <th className="p-4 text-left" key={s}>
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {remote.data?.items.map((item, i) => (
              <tr className="border-t" key={item.id || i}>
                <td className="p-4">
                  <p>
                    {item.title || item.name || item.label || item.businessName}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {item.email || item.slug || item.platform || ""}
                  </p>
                  {kind === "users" && item.mustChangePassword && (
                    <p className="text-xs text-orange-600">
                      Cambio de contraseña obligatorio
                    </p>
                  )}
                </td>
                <td className="p-4">
                  {item.status && <Badge status={item.status} />}
                </td>
                <td className="p-4">
                  <div className="flex gap-3">
                    <button
                      disabled={busy}
                      onClick={() =>
                        void edit(schema.singleton ? undefined : item.id)
                      }
                    >
                      Editar / detalle
                    </button>
                    {!schema.singleton && (
                      <button
                        className="text-red-600"
                        disabled={busy}
                        onClick={() => void destroy(item)}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!remote.data?.items.length && (
          <p className="p-6 text-sm text-zinc-500">
            No hay registros. Crea el primero.
          </p>
        )}
      </div>
      {kind === "users" && (
        <div className="text-sm text-zinc-500 space-y-2">
          <p>
            Los usuarios nuevos deben cambiar su contraseña al ingresar. Roles y
            permisos de referencia:
          </p>
          {remote.data?.refs.roles?.map((r) => (
            <p key={r.code}>
              {r.name || r.code}:{" "}
              {(r.permissions || [])
                .map((p: any) => (typeof p === "string" ? p : p.code))
                .join(", ")}
            </p>
          ))}
        </div>
      )}
      {form && (
        <section className="module-editor border rounded-xl bg-card p-4 sm:p-6 space-y-5">
          <h3 className="font-semibold">
            {form.id || schema.singleton ? "Editar" : "Crear"} · {schema.title}
          </h3>
          <form
            className="space-y-5"
            onSubmit={async (e) => {
              e.preventDefault()
              if (busy) return
              let body = editable(
                kind === "promotions" ? schema.fields : fields,
                form,
              )
              if (kind === "promotions")
                body = promotionPayload(
                  body,
                  remote.data!.refs.motorcycles || [],
                )
              if (kind === "banners") {
                body.startsAt = null
                body.endsAt = null
                body.pageId = null
              }
              if (kind === "users") {
                if (!body.newPassword) delete body.newPassword
                if (body.mustChangePassword !== true)
                  delete body.mustChangePassword
              }
              if (kind === "contact")
                body.hours = body.hours.map((h: Doc) =>
                  h.closed ? { ...h, opens: null, closes: null } : h,
                )
              if (kind === "pages" && body.contentFormat === "blocks")
                body.content = body.content.map((b: Doc) =>
                  Object.fromEntries(
                    Object.entries(b).filter(([key]) =>
                      (
                        ({
                          heading: ["type", "text", "level"],
                          paragraph: ["type", "text"],
                          image: ["type", "url", "alt"],
                          link: ["type", "text", "href"],
                        }) as Doc
                      )[b.type]?.includes(key),
                    ),
                  ),
                )
              const validation = validateModule(kind, body, remote.data!.refs)
              if (validation) {
                setError(validation)
                addToast("warning", validation)
                return
              }
              setBusy(true)
              setError("")
              try {
                await run((t) =>
                  request<Doc>(
                    `/admin/${kind}${form.id ? "/" + encodeURIComponent(form.id) : ""}`,
                    {
                      method: form.id || schema.singleton ? "PUT" : "POST",
                      body: JSON.stringify(body),
                      headers: t ? { "X-Reauth-Token": t } : {},
                    },
                  ),
                )
                addToast("success", "Guardado correctamente")
                if (
                  kind === "users" &&
                  user &&
                  form.id === user.id &&
                  (form.email !== user.email ||
                    form.role !== user.role ||
                    form.status !== "active" ||
                    body.newPassword ||
                    body.mustChangePassword)
                )
                  clearSession()
                else {
                  setForm(null)
                  remote.reload()
                }
              } catch (e) {
                setError(errorMessage(e))
                addToast("error", errorMessage(e))
              } finally {
                setBusy(false)
              }
            }}
          >
            <ModuleFields
              fields={fields}
              value={form}
              change={setForm}
              refs={remote.data!.refs}
              disabled={busy}
            />
            {kind === "promotions" && (
              <p className="text-sm text-zinc-500 sm:col-span-2">
                La imagen se toma de la primera motocicleta seleccionada. La
                promoción termina al finalizar el día indicado, hora de Costa
                Rica. El botón está asociado a las motocicletas de la promoción.
              </p>
            )}
            {error && (
              <p role="alert" className="text-sm text-red-600 break-words">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="module-secondary"
                disabled={busy}
                onClick={() => {
                  setForm(null)
                  setError("")
                }}
              >
                Cancelar
              </button>
              <button className="module-primary" disabled={busy}>
                {busy ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  )
}
export function WebContentModule() {
  const [tab, setTab] = useState("banners")
  const { can } = useApp()
  if (!can("content.manage"))
    return <RemoteState error="No tienes permiso para contenido web." />
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <nav
        aria-label="Contenido web"
        className="flex flex-wrap gap-2 p-4 border-b"
      >
        {["banners", "contact", "social-links"].map((kind) => (
          <button
            key={kind}
            onClick={() => setTab(kind)}
            className={tab === kind ? "module-primary" : "module-secondary"}
          >
            {schemas[kind].title}
          </button>
        ))}
      </nav>
      <ResourceModule key={tab} kind={tab} />
    </div>
  )
}
