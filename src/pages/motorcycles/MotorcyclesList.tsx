import { useState, useEffect } from "react"

import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Copy,
  Globe,
  EyeOff,
  Archive,
  Trash2,
  Star,
  ChevronDown,
} from "lucide-react"

import { list, detail, save, remove, errorMessage } from "../../lib/api"

import { useRemote } from "../../lib/useRemote"

import { RemoteState } from "../../components/ui/RemoteState"

import { canDelete } from "../../lib/permissions"

import { Badge } from "../../components/ui/Badge"

import { ConfirmModal } from "../../components/ui/Modal"

import { useApp } from "../../context/AppContext"

import type { Motorcycle } from "../../types"

export function MotorcyclesList() {
  const { navigate, addToast, can, user } = useApp()

  const remote = useRemote(async (signal) => {
    const [motorcycles, brands, categories] = await Promise.all([
      list("motorcycles", signal),
      list("brands", signal),
      list("categories", signal),
    ])
    return { motorcycles, brands, categories }
  })

  const motorcycles = remote.data?.motorcycles ?? []

  const brands = remote.data?.brands ?? []

  const categories = remote.data?.categories ?? []

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const [search, setSearch] = useState("")

  const [filterBrand, setFilterBrand] = useState("")

  const [filterStatus, setFilterStatus] = useState("")

  const [filterCategory, setFilterCategory] = useState("")

  const [selected, setSelected] = useState<string[]>([])

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const [page, setPage] = useState(1)

  const PER_PAGE = 10

  const filtered = motorcycles.filter((m) => {
    const matchSearch =
      !search ||
      m.model.toLowerCase().includes(search.toLowerCase()) ||
      m.brand.toLowerCase().includes(search.toLowerCase())

    const matchBrand = !filterBrand || m.brandId === filterBrand

    const matchStatus = !filterStatus || m.status === filterStatus

    const matchCat = !filterCategory || m.categoryId === filterCategory

    return matchSearch && matchBrand && matchStatus && matchCat
  })

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  const handleDelete = async (id: string) => {
    if (busy || !canDelete(user, "motorcycles.write")) return

    setBusy(true)
    setError("")

    try {
      await remove("motorcycles", id)
      addToast("success", "Motocicleta eliminada")
      setConfirmDelete(null)
      remote.reload()
    } catch (e) {
      setError(errorMessage(e))
      addToast("error", errorMessage(e))
      setConfirmDelete(null)
    } finally {
      setBusy(false)
    }
  }

  const togglePublish = async (id: string) => {
    if (busy || !can("motorcycles.publish")) return

    setBusy(true)
    setError("")

    try {
      const current = await detail("motorcycles", id)
      await save(
        "motorcycles",
        { ...current, published: !current.published },
        id,
      )
      addToast(
        "success",
        current.published ? "Publicación retirada" : "Motocicleta publicada",
      )
      remote.reload()
    } catch (e) {
      setError(errorMessage(e))
      addToast("error", errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  useEffect(
    () => setPage(1),
    [search, filterBrand, filterStatus, filterCategory],
  )

  useEffect(() => setSelected([]), [remote.data])

  if (remote.loading || remote.error)
    return (
      <RemoteState
        loading={remote.loading}
        error={remote.error}
        retry={remote.reload}
      />
    )

  const toggleSelect = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    )

  const toggleAll = () =>
    setSelected(
      selected.length === paginated.length ? [] : paginated.map((m) => m.id),
    )

  const formatPrice = (price: number, currency: "CRC" | "USD") =>
    new Intl.NumberFormat("es-CR", { style: "currency", currency }).format(
      price,
    )

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">
            {filtered.length} motocicletas
          </p>
        </div>
        <button
          disabled={busy || !can("motorcycles.write")}
          onClick={() => navigate("motorcycle-form", { mode: "create" })}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          style={{ background: "var(--primary)", color: "#000" }}
        >
          <Plus size={15} />
          Nueva motocicleta
        </button>
      </div>

      {/* Filters */}
      <div
        className="flex flex-wrap items-center gap-3 p-4 rounded-xl border"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="relative flex-1 min-w-52">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por marca o modelo..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border outline-none"
            style={{
              background: "var(--secondary)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          />
        </div>
        <FilterSelect
          value={filterBrand}
          onChange={setFilterBrand}
          placeholder="Marca"
          options={brands.map((b) => ({ value: b.id, label: b.name }))}
        />
        <FilterSelect
          value={filterCategory}
          onChange={setFilterCategory}
          placeholder="Categoría"
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
        />
        <FilterSelect
          value={filterStatus}
          onChange={setFilterStatus}
          placeholder="Estado"
          options={[
            { value: "available", label: "Disponible" },
            { value: "coming_soon", label: "Próximamente" },

            { value: "reserved", label: "Reservada" },
            { value: "sold_out", label: "Agotada" },
          ]}
        />
        {(search || filterBrand || filterStatus || filterCategory) && (
          <button
            onClick={() => {
              setSearch("")
              setFilterBrand("")
              setFilterStatus("")
              setFilterCategory("")
            }}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-2"
          >
            Limpiar
          </button>
        )}
      </div>

      {error && <RemoteState error={error} />}
      {/* Table */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                <th className="p-4 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selected.length === paginated.length &&
                      paginated.length > 0
                    }
                    onChange={toggleAll}
                    className="accent-orange-500"
                  />
                </th>
                <th className="p-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Imagen
                </th>
                <th className="p-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Modelo
                </th>
                <th className="p-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="p-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Precio
                </th>
                <th className="p-4 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="p-4 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="p-4 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Web
                </th>
                <th className="p-4 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Dest.
                </th>
                <th className="p-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody
              className="divide-y"
              style={{ borderColor: "var(--border)" }}
            >
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="py-16 text-center text-zinc-500 text-sm"
                  >
                    Sin resultados
                  </td>
                </tr>
              ) : (
                paginated.map((moto) => {
                  const primaryImg =
                    moto.colors
                      .flatMap((c) => c.images)
                      .find((i) => i.isPrimary) ??
                    moto.colors.flatMap((c) => c.images)[0]

                  return (
                    <tr
                      key={moto.id}
                      className="hover:bg-zinc-900/40 transition-colors"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selected.includes(moto.id)}
                          onChange={() => toggleSelect(moto.id)}
                          className="accent-orange-500"
                        />
                      </td>
                      <td className="p-4">
                        <div
                          className="w-12 h-9 rounded-lg overflow-hidden flex items-center justify-center"
                          style={{ background: "var(--secondary)" }}
                        >
                          {primaryImg ? (
                            <img
                              src={primaryImg.url}
                              alt={primaryImg.alt}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-zinc-600 text-xs">—</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-semibold text-zinc-200 text-sm">
                            {moto.brand} {moto.model}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {moto.version} · {moto.year} · {moto.displacement}cc
                          </p>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-zinc-400">
                        {moto.category}
                      </td>
                      <td className="p-4 text-right">
                        {moto.promoPrice != null ? (
                          <div>
                            <p className="text-xs line-through text-zinc-600 mono">
                              {formatPrice(moto.price, moto.currency)}
                            </p>
                            <p
                              className="text-sm font-semibold mono"
                              style={{ color: "var(--primary)" }}
                            >
                              {formatPrice(moto.promoPrice, moto.currency)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm font-medium text-zinc-200 mono">
                            {formatPrice(moto.price, moto.currency)}
                          </p>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`text-xs font-medium mono ${
                            moto.inventory === 0
                              ? "text-red-400"
                              : moto.inventory <= 2
                                ? "text-yellow-400"
                                : "text-zinc-300"
                          }`}
                        >
                          {moto.inventory}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <Badge status={moto.status} />
                      </td>
                      <td className="p-4 text-center">
                        <button
                          disabled={busy || !can("motorcycles.publish")}
                          onClick={() => void togglePublish(moto.id)}
                          className="rounded-lg focus-visible:outline-2 focus-visible:outline-primary"
                          aria-label={moto.published ? "Despublicar motocicleta" : "Publicar motocicleta"}
                        >
                          <Badge status={moto.published ? "published" : "draft"} />
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        {moto.featured && (
                          <Star
                            size={13}
                            className="mx-auto"
                            style={{ color: "var(--primary)" }}
                          />
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <ActionBtn
                            icon={Eye}
                            title="Ver"
                            onClick={() =>
                              navigate("motorcycle-form", {
                                id: moto.id,
                                mode: "view",
                              })
                            }
                          />
                          <ActionBtn
                            disabled={busy || !can("motorcycles.write")}
                            icon={Edit}
                            title="Editar"
                            onClick={() =>
                              navigate("motorcycle-form", {
                                id: moto.id,
                                mode: "edit",
                              })
                            }
                          />

                          <ActionBtn
                            disabled={busy || !can("motorcycles.publish")}
                            icon={moto.published ? EyeOff : Globe}
                            title={moto.published ? "Despublicar" : "Publicar"}
                            onClick={() => togglePublish(moto.id)}
                          />
                          <ActionBtn
                            disabled={
                              busy || !canDelete(user, "motorcycles.write")
                            }
                            icon={Trash2}
                            title="Eliminar"
                            danger
                            onClick={() => setConfirmDelete(moto.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3 border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <p className="text-xs text-zinc-500">
              Página {page} de {totalPages}
            </p>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 text-xs rounded-lg transition-colors ${
                    page === i + 1
                      ? "text-black font-semibold"
                      : "text-zinc-400 hover:bg-zinc-800"
                  }`}
                  style={page === i + 1 ? { background: "var(--primary)" } : {}}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!confirmDelete}
        title="¿Archivar motocicleta?"
        message="La motocicleta se moverá al archivo. Podrás restaurarla posteriormente."
        confirmLabel="Eliminar"
        danger
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: { value: string; label: string }[]
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-7 py-2 text-sm rounded-lg border outline-none cursor-pointer"
        style={{
          background: "var(--secondary)",
          borderColor: "var(--border)",
          color: value ? "var(--foreground)" : "#71717a",
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={12}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
      />
    </div>
  )
}

function ActionBtn({
  icon: Icon,
  title,
  onClick,
  danger = false,
  disabled = false,
}: {
  icon: React.ElementType
  title: string
  onClick: () => void
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
        danger
          ? "text-zinc-600 hover:text-red-400 hover:bg-red-500/5"
          : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
      }`}
    >
      <Icon size={13} />
    </button>
  )
}
