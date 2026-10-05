import { useState } from "react"

import {
  Search,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  User,
} from "lucide-react"

import { request, patchLead, errorMessage } from "../lib/api"

import { useRemote } from "../lib/useRemote"

import { useApp } from "../context/AppContext"

import { RemoteState } from "../components/ui/RemoteState"

import { Badge, statusStyle, statusLabel } from "../components/ui/Badge"

import type { Lead } from "../types"

const STATUSES: Lead["status"][] = [
  "new",
  "contacted",
  "follow_up",
  "closed",
  "discarded",
]

export function Leads() {
  const { addToast, can } = useApp()

  const remote = useRemote((signal) =>
    request<Lead[]>("/admin/leads", { signal }),
  )

  const leads = remote.data ?? []
  const assignees = useRemote((signal) =>
    request<{ id: string; name: string }[]>("/admin/lead-assignees", {
      signal,
    }),
  )

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const [note, setNote] = useState("")
  const [assignedTo, setAssignedTo] = useState("")

  const [search, setSearch] = useState("")

  const [filterStatus, setFilterStatus] = useState("")

  const [selected, setSelected] = useState<Lead | null>(null)

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase()

    return (
      (!search ||
        l.name.toLowerCase().includes(q) ||
        l.brand.toLowerCase().includes(q) ||
        l.motorcycle.toLowerCase().includes(q)) &&
      (!filterStatus || l.status === filterStatus)
    )
  })

  const updateLead = async (
    id: string,
    fields: { status?: Lead["status"]; notes?: string; assignedTo?: string },
  ) => {
    if (busy || !can("leads.manage")) return

    setBusy(true)
    setError("")

    try {
      const updated = await patchLead(id, fields)

      remote.setData(
        (prev) => prev?.map((l) => (l.id === id ? updated : l)) ?? [],
      )

      if (selected?.id === id) {
        setSelected(updated)
        setAssignedTo(updated.assignedTo ?? "")
      }

      if (fields.notes) setNote("")

      addToast("success", "Lead actualizado")
    } catch (e) {
      setError(errorMessage(e))
      addToast("error", errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const updateStatus = (id: string, status: Lead["status"]) =>
    void updateLead(id, { status })

  if (remote.loading || remote.error)
    return (
      <RemoteState
        loading={remote.loading}
        error={remote.error}
        retry={remote.reload}
      />
    )

  const counts: Record<string, number> = {}

  STATUSES.forEach((s) => {
    counts[s] = leads.filter((l) => l.status === s).length
  })

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      <p className="text-xs text-zinc-500">
        Últimas 200 consultas. Las notas se agregan al historial.
      </p>
      {error && <RemoteState error={error} />}
      {/* Status cards */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { status: "new", label: "Nuevos", color: "#f97316" },

          { status: "contacted", label: "Contactados", color: "#38bdf8" },

          { status: "follow_up", label: "Seguimiento", color: "#f59e0b" },

          { status: "closed", label: "Cerrados", color: "#22c55e" },

          { status: "discarded", label: "Descartados", color: "#71717a" },
        ].map((item) => (
          <button
            key={item.status}
            onClick={() =>
              setFilterStatus(filterStatus === item.status ? "" : item.status)
            }
            className={`p-3 rounded-xl border text-left transition-all ${
              filterStatus === item.status
                ? "border-orange-500/50"
                : "hover:border-zinc-700"
            }`}
            style={{
              background: "var(--card)",
              borderColor:
                filterStatus === item.status ? undefined : "var(--border)",
            }}
          >
            <p
              className="text-xl font-bold"
              style={{ fontFamily: "DM Sans, sans-serif", color: item.color }}
            >
              {counts[item.status] ?? 0}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">{item.label}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar lead por nombre, marca o moto..."
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border outline-none"
          style={{
            background: "var(--card)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
        />
      </div>

      {/* Table + Detail */}
      <div className="flex gap-4 min-h-0">
        <div
          className={`rounded-xl border overflow-hidden ${
            selected ? "flex-1" : "w-full"
          }`}
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                {[
                  "Fecha",
                  "Cliente",
                  "Motocicleta",
                  "Tipo",
                  "Estado",
                  "Responsable",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody
              className="divide-y"
              style={{ borderColor: "var(--border)" }}
            >
              {!filtered.length && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">
                    No hay leads.
                  </td>
                </tr>
              )}
              {filtered.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => {
                    if (busy) return
                    setSelected(selected?.id === lead.id ? null : lead)
                    setAssignedTo(lead.assignedTo ?? "")
                    setNote("")
                    setError("")
                  }}
                  className={`cursor-pointer transition-colors hover:bg-zinc-900/40 ${
                    selected?.id === lead.id ? "bg-orange-500/5" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap mono">
                    {lead.date}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-200 text-sm">
                      {lead.name}
                    </p>
                    <p className="text-xs text-zinc-600">{lead.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-zinc-300">{lead.brand}</p>
                    <p className="text-xs text-zinc-500">{lead.motorcycle}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge status={lead.type} />
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="inline-flex items-center gap-2 px-2.5 py-1 border rounded-lg"
                      style={statusStyle(lead.status)}
                    >
                      <span
                        aria-hidden="true"
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: statusStyle(lead.status).dot }}
                      />
                      <select
                        aria-label={`Estado de ${lead.name}`}
                        disabled={busy}
                        value={lead.status}
                        onChange={(e) => {
                          e.stopPropagation()
                          updateStatus(
                            lead.id,
                            e.target.value as Lead["status"],
                          )
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-medium bg-transparent cursor-pointer outline-none"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {statusLabel(s)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {assignees.data?.find((u) => u.id === lead.assignedTo)
                      ?.name ||
                      lead.assignedTo ||
                      "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {selected && (
          <div
            className="w-80 shrink-0 rounded-xl border p-5 space-y-4"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <div className="flex items-start justify-between">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-black"
                style={{ background: "var(--primary)" }}
              >
                {selected.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <Badge status={selected.status} size="md" />
            </div>
            <div>
              <p
                className="font-semibold text-zinc-200"
                style={{ fontFamily: "DM Sans, sans-serif" }}
              >
                {selected.name}
              </p>
              <p className="text-xs text-zinc-500">{selected.date}</p>
            </div>
            {[
              { icon: Phone, text: selected.phone },
              { icon: Mail, text: selected.email },
              {
                icon: Calendar,
                text: selected.brand + " · " + selected.motorcycle,
              },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2 text-xs text-zinc-400"
              >
                <Icon size={13} className="text-zinc-600 shrink-0" />
                {text}
              </div>
            ))}
            {selected.message && (
              <div
                className="p-3 rounded-lg text-xs text-zinc-400 leading-relaxed"
                style={{ background: "var(--secondary)" }}
              >
                <div className="flex items-center gap-1.5 text-zinc-600 mb-1.5">
                  <MessageSquare size={11} />
                  Mensaje
                </div>
                {selected.message}
              </div>
            )}
            <div>
              <label className="text-xs text-zinc-600 mb-1.5 block">
                <User size={11} className="inline mr-1" />
                Asignar a
              </label>
              <label className="text-xs text-zinc-500">
                Responsable
                <select
                  aria-label="Responsable"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  disabled={busy || assignees.loading || !!assignees.error}
                  className="w-full mt-1 text-sm border rounded-lg p-2"
                >
                  <option value="">Sin asignar</option>
                  {assignedTo &&
                    !assignees.data?.some((u) => u.id === assignedTo) && (
                      <option value={assignedTo}>
                        Usuario no asignable ({assignedTo})
                      </option>
                    )}
                  {assignees.data?.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </label>
              {assignees.loading && (
                <p className="text-xs text-zinc-500 mt-2">
                  Cargando responsables…
                </p>
              )}
              {assignees.error && (
                <RemoteState error={assignees.error} retry={assignees.reload} />
              )}
              {!assignees.loading &&
                !assignees.error &&
                !assignees.data?.length && (
                  <p className="text-xs text-zinc-500 mt-2">
                    No hay responsables activos.
                  </p>
                )}
              <button
                disabled={
                  busy ||
                  assignees.loading ||
                  !!assignees.error ||
                  (assignedTo !== "" &&
                    !assignees.data?.some((u) => u.id === assignedTo))
                }
                onClick={() => void updateLead(selected.id, { assignedTo })}
                className="mt-2 border rounded-lg px-3 py-1 text-sm"
              >
                Guardar asignación
              </button>
            </div>
            <div>
              <label className="text-xs text-zinc-600 mb-1.5 block">
                Estado
              </label>
              <div className="grid grid-cols-1 gap-1">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    disabled={busy}
                    onClick={() => updateStatus(selected.id, s)}
                    className={`text-xs px-3 py-1.5 rounded-lg text-left transition-colors ${
                      selected.status === s
                        ? "text-black font-medium"
                        : "text-zinc-400 hover:bg-zinc-800"
                    }`}
                    style={
                      selected.status === s
                        ? { background: "var(--primary)" }
                        : {}
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Notas</h3>
              {selected.notes?.map((n, i) => (
                <div key={i} className="text-xs border rounded-lg p-2">
                  <p>{n.note}</p>
                  <p className="text-zinc-500">{n.date}</p>
                </div>
              ))}
              {!selected.notes?.length && (
                <p className="text-xs text-zinc-500">Sin notas.</p>
              )}
              <textarea
                aria-label="Nueva nota"
                disabled={busy}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={5000}
                className="w-full border rounded-lg p-2 text-sm"
                placeholder="Agregar una nota…"
              />
              <button
                disabled={busy || !note.trim()}
                onClick={() => void updateLead(selected.id, { notes: note })}
                className="border rounded-lg px-3 py-1 text-sm"
              >
                Agregar nota
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
