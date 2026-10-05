import { useState } from "react"

import { Plus, Edit, Trash2, Search } from "lucide-react"

import { list, detail, save, remove, errorMessage } from "../lib/api"

import { useRemote } from "../lib/useRemote"

import { canDelete } from "../lib/permissions"

import { useApp } from "../context/AppContext"

import { Badge } from "../components/ui/Badge"

import { RemoteState, Pending } from "../components/ui/RemoteState"

import type { Category } from "../types"

const panel = { background: "var(--card)", borderColor: "var(--border)" }

const input =
  "w-full px-3 py-2 text-sm rounded-lg border bg-secondary text-zinc-200"

export function Categories() {
  const { user, can, addToast } = useApp()

  const remote = useRemote(async (signal) => ({
    categories: await list("categories", signal),
    brands: await list("brands", signal),
  }))

  const [form, setForm] = useState<Partial<Category> | null>(null)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const writable = can("categories.manage")

  async function edit(id: string) {
    setBusy(true)
    setError("")
    try {
      setForm(await detail("categories", id))
    } catch (e) {
      setError(errorMessage(e))
      addToast("error", errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  async function persist(e: React.FormEvent) {
    e.preventDefault()
    if (busy || !form || !writable) return

    setBusy(true)
    setError("")

    try {
      await save("categories", form, form.id)
      addToast("success", "Categoría guardada")
      setForm(null)
      remote.reload()
    } catch (e) {
      setError(errorMessage(e))
      addToast("error", errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  async function destroy(id: string) {
    if (
      busy ||
      !canDelete(user, "categories.manage") ||
      !confirm("¿Eliminar categoría? Las categorías en uso deben desactivarse.")
    )
      return

    setBusy(true)
    setError("")

    try {
      await remove("categories", id)
      addToast("success", "Categoría eliminada")
      remote.reload()
    } catch (e) {
      setError(errorMessage(e))
      addToast("error", errorMessage(e))
    } finally {
      setBusy(false)
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

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      <div className="flex justify-between">
        <p className="text-sm text-zinc-500">
          {remote.data?.categories.length} categorías
        </p>
        <button
          disabled={!writable || busy}
          onClick={() => {
            setError("")
            setForm({
              name: "",
              slug: "",
              description: "",
              brandId: "",
              status: "inactive",
              order: 0,
            })
          }}
          className="flex gap-2 bg-primary px-4 py-2 rounded-lg text-sm"
        >
          <Plus size={15} />
          Nueva categoría
        </button>
      </div>
      {error && <RemoteState error={error} />}
      <div className="rounded-xl border overflow-x-auto" style={panel}>
        <table className="w-full text-sm">
          <thead>
            <tr>
              {["Nombre", "Slug", "Marca", "Estado", "Acciones"].map((h) => (
                <th key={h} className="p-4 text-left text-zinc-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {remote.data?.categories.map((c) => (
              <tr
                key={c.id}
                className="border-t"
                style={{ borderColor: "var(--border)" }}
              >
                <td className="p-4">{c.name}</td>
                <td>{c.slug}</td>
                <td>
                  {remote.data?.brands.find((b) => b.id === c.brandId)?.name ||
                    "General"}
                </td>
                <td>
                  <Badge status={c.status} />
                </td>
                <td>
                  <button
                    aria-label={`Editar ${c.name}`}
                    disabled={!writable || busy}
                    onClick={() => void edit(c.id)}
                    className="p-2"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    aria-label={`Eliminar ${c.name}`}
                    disabled={!canDelete(user, "categories.manage") || busy}
                    onClick={() => void destroy(c.id)}
                    className="p-2"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!remote.data?.categories.length && (
          <p className="p-6 text-sm text-zinc-500">No hay categorías.</p>
        )}
      </div>
      {form && (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
          <form
            onSubmit={persist}
            className="w-full max-w-lg rounded-xl border p-6 space-y-4"
            style={panel}
          >
            <h2 className="font-bold">
              {form.id ? "Editar" : "Nueva"} categoría
            </h2>
            {(["name", "slug", "description"] as const).map((key) => (
              <label key={key} className="block text-sm">
                {
                  { name: "Nombre", slug: "Slug", description: "Descripción" }[
                    key
                  ]
                }
                <input
                  className={input}
                  required={key !== "description"}
                  value={form[key] ?? ""}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </label>
            ))}
            <label className="block text-sm">
              Marca
              <select
                aria-label="Marca"
                className={input}
                value={form.brandId ?? ""}
                onChange={(e) => setForm({ ...form, brandId: e.target.value })}
              >
                <option value="">General</option>
                {remote.data?.brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Estado
              <select
                aria-label="Estado"
                className={input}
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as Category["status"],
                  })
                }
              >
                <option value="active">Activa</option>
                <option value="inactive">Inactiva</option>
              </select>
            </label>
            <label className="block text-sm">
              Orden
              <input
                className={input}
                type="number"
                min="0"
                max="10000"
                required
                value={form.order ?? 0}
                onChange={(e) =>
                  setForm({ ...form, order: Number(e.target.value) })
                }
              />
            </label>
            {error && <RemoteState error={error} />}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => setForm(null)}
              >
                Cancelar
              </button>
              <button
                disabled={busy}
                className="bg-primary px-4 py-2 rounded-lg"
              >
                {busy ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export function Inventory() {
  const { navigate, can } = useApp()

  const remote = useRemote((signal) => list("motorcycles", signal))
  const [search, setSearch] = useState("")

  if (remote.loading || remote.error)
    return (
      <RemoteState
        loading={remote.loading}
        error={remote.error}
        retry={remote.reload}
      />
    )

  const motos = (remote.data ?? []).filter((m) =>
    (m.brand + " " + m.model).toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      <p className="text-sm text-zinc-500">
        Inventario total por motocicleta. Movimientos y existencias por color
        pendientes de API.
      </p>
      <div className="flex items-center gap-2">
        <Search size={15} />
        <input
          aria-label="Buscar inventario"
          className={input}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por marca o modelo…"
        />
      </div>
      <div className="border rounded-xl overflow-x-auto" style={panel}>
        <table className="w-full text-sm">
          <thead>
            <tr>
              {["Moto", "SKU", "Cantidad", "Estado", "Acción"].map((h) => (
                <th key={h} className="p-4 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {motos.map((m) => (
              <tr
                key={m.id}
                className="border-t"
                style={{ borderColor: "var(--border)" }}
              >
                <td className="p-4">
                  {m.brand} {m.model}
                </td>
                <td>{m.sku}</td>
                <td>{m.inventory}</td>
                <td>
                  <Badge status={m.status} />
                </td>
                <td>
                  <button
                    disabled={!can("motorcycles.write")}
                    onClick={() =>
                      navigate("motorcycle-form", {
                        id: m.id,
                        mode: "edit",
                        tab: "inventory",
                      })
                    }
                    className="border rounded-lg px-3 py-1"
                  >
                    Editar ficha
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!motos.length && (
          <p className="p-6 text-sm text-zinc-500">Sin resultados.</p>
        )}
      </div>
    </div>
  )
}

export const Promotions = () => <Pending title="Promociones" />

export const WebContent = () => <Pending title="Contenido web" />

export const Users = () => <Pending title="Usuarios" />

export const Settings = () => (
  <Pending title="Configuración, MFA y recuperación de contraseña" />
)
