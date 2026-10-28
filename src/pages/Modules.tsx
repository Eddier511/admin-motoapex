import { useRef, useState } from "react"
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
import { EditorModal } from "../components/ui/EditorModal"

export function ResourceModule({ kind }: { kind: string }) {
  const schema = schemas[kind]
  const { can, addToast, sensitive, user, clearSession, confirmAction } =
    useApp()
  const [form, setForm] = useState<Doc | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [promotionSchedule, setPromotionSchedule] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const editorTrigger = useRef<HTMLElement | null>(null)
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
          ? promotionFields(schema.fields).filter(
              (f) => promotionSchedule || f.type !== "date",
            )
          : schema.fields
  const run = <T,>(fn: (t?: string) => Promise<T>) =>
    schema.sensitive ? sensitive(schema.sensitive, fn) : fn()
  async function edit(id?: string) {
    editorTrigger.current = document.activeElement as HTMLElement | null
    setBusy(true)
    setError("")
    try {
      const d = await request<Doc>(
        `/admin/${kind}${id ? "/" + encodeURIComponent(id) : ""}`,
      )
      const clean = editable(schema.fields, d)
      if (id) clean.id = d.id
      if (kind === "banners") clean.pageId = d.pageId ?? null
      if (kind === "promotions")
        setPromotionSchedule(clean.startsAt !== null || clean.endsAt !== null)
      setForm(clean)
    } catch (e) {
      setError(errorMessage(e))
      addToast("error", errorMessage(e))
    } finally {
      setBusy(false)
    }
  }
  async function togglePromotion(item: Doc) {
    if (busy || !can("promotions.manage")) return
    const next = item.status === "active" ? "inactive" : "active"
    setBusy(true)
    setPendingStatus(item.id)
    setError("")
    try {
      // PUT replaces the entire document: fetch fresh data and whitelist editable
      // fields, preserving images, dates, CTA and all motorcycle price pairs.
      const path = `/admin/promotions/${encodeURIComponent(item.id)}`
      const current = await request<Doc>(path)
      const body = {
        ...editable(schemas.promotions.fields, current),
        status: next,
      }
      const saved = await request<Doc>(path, {
        method: "PUT",
        body: JSON.stringify(body),
      })
      if (saved.status !== next)
        throw new Error("La API no confirmó el cambio de estado.")
      remote.setData((previous) =>
        previous
          ? {
              ...previous,
              items: previous.items.map((row) =>
                row.id === saved.id ? saved : row,
              ),
            }
          : previous,
      )
      addToast(
        "success",
        next === "active" ? "Promoción activada" : "Promoción desactivada",
      )
    } catch (e) {
      setError(errorMessage(e))
      addToast("error", errorMessage(e))
    } finally {
      setBusy(false)
      setPendingStatus(null)
    }
  }
  async function destroy(item: Doc) {
    if (
      busy ||
      !(await confirmAction({
        title: "¿Eliminar registro?",
        message: `Vas a eliminar «${item.title || item.name || item.label}». Se conservará el historial.`,
      }))
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
            editorTrigger.current = document.activeElement as HTMLElement | null
            setError("")
            setPromotionSchedule(false)
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
                  <div className="flex items-center gap-3">
                    {item.status && <Badge status={item.status} />}
                    {kind === "promotions" && (
                      <button
                        type="button"
                        role="switch"
                        aria-checked={item.status === "active"}
                        aria-label={`Estado de ${item.title}`}
                        aria-busy={pendingStatus === item.id}
                        title={
                          item.status === "active"
                            ? "Desactivar promoción"
                            : "Activar promoción"
                        }
                        disabled={busy}
                        onClick={() => void togglePromotion(item)}
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:opacity-50 ${item.status === "active" ? "bg-orange-500" : "bg-zinc-300"}`}
                      >
                        <span
                          aria-hidden="true"
                          className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none ${item.status === "active" ? "translate-x-6" : "translate-x-1"}`}
                        />
                      </button>
                    )}
                  </div>
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
      {form && (
        <EditorModal
          title={`${form.id || schema.singleton ? "Editar" : "Crear"} · ${schema.title}`}
          busy={busy}
          returnFocus={editorTrigger.current}
          onClose={() => {
            setForm(null)
            setError("")
          }}
        >
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
                body.startsAt = form.startsAt ?? null
                body.endsAt = form.endsAt ?? null
                body.pageId = form.pageId ?? null
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
            {kind === "promotions" && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={promotionSchedule}
                  disabled={busy}
                  onChange={(e) => {
                    setPromotionSchedule(e.target.checked)
                    if (!e.target.checked)
                      setForm({ ...form, startsAt: null, endsAt: null })
                  }}
                />
                Programar vigencia (opcional)
              </label>
            )}
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
                promoción no tiene límite de fechas si dejas la vigencia vacía.
                Si eliges una fecha final, termina al finalizar ese día, hora de
                Costa Rica. El botón está asociado a las motocicletas de la
                promoción.
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
        </EditorModal>
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
