import {
  Bike,
  Tag,
  FileText,
  TrendingUp,
  AlertTriangle,
  Star,
  Plus,
} from "lucide-react"

import { useApp } from "../context/AppContext"

import { list, request } from "../lib/api"

import { useRemote } from "../lib/useRemote"

import { RemoteState } from "../components/ui/RemoteState"

import type { Lead } from "../types"

export function Dashboard() {
  const { user, can, navigate } = useApp()

  const remote = useRemote(
    async (signal) => {
      const [motos, brands, leads] = await Promise.all([
        can("motorcycles.read")
          ? list("motorcycles", signal)
          : Promise.resolve(null),

        can("motorcycles.read")
          ? list("brands", signal)
          : Promise.resolve(null),

        can("leads.manage")
          ? request<Lead[]>("/admin/leads", { signal })
          : Promise.resolve(null),
      ])
      return { motos, brands, leads }
    },
    [user?.id],
  )

  if (remote.loading || remote.error)
    return (
      <RemoteState
        loading={remote.loading}
        error={remote.error}
        retry={remote.reload}
      />
    )

  const { motos, brands, leads } = remote.data!

  const stats = [
    {
      label: "Motos publicadas",
      value: motos?.filter((m) => m.published).length,
      icon: Bike,
    },

    {
      label: "Disponibles",
      value: motos?.filter((m) => m.status === "available").length,
      icon: TrendingUp,
    },

    {
      label: "Marcas activas",
      value: brands?.filter((b) => b.status === "active").length,
      icon: Tag,
    },

    {
      label: "Leads nuevos",
      value: leads?.filter((l) => l.status === "new").length,
      icon: FileText,
    },

    {
      label: "Modelos nuevos",
      value: motos?.filter((m) => m.isNew).length,
      icon: Star,
    },

    {
      label: "Agotadas",
      value: motos?.filter((m) => m.status === "sold_out").length,
      icon: AlertTriangle,
    },

    {
      label: "Bajo inventario",
      value: motos?.filter((m) => m.inventory <= 2).length,
      icon: AlertTriangle,
    },

    {
      label: "Unidades en inventario",
      value: motos?.reduce((s, m) => s + m.inventory, 0),
      icon: Bike,
    },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">
            Bienvenido, {user?.name}
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            {new Intl.DateTimeFormat("es-CR", {
              dateStyle: "full",
              timeZone: "America/Costa_Rica",
            }).format(new Date())}
          </p>
        </div>
        {can("motorcycles.write") && (
          <button
            onClick={() => navigate("motorcycle-form", { mode: "create" })}
            className="flex gap-2 items-center bg-primary rounded-lg px-4 py-2 text-sm"
          >
            <Plus size={15} />
            Nueva motocicleta
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats
          .filter((s) => s.value !== undefined)
          .map((s) => (
            <div
              key={s.label}
              className="rounded-xl border p-4"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                style={{
                  background: "rgba(249,115,22,0.1)",
                  color: "var(--primary)",
                }}
              >
                <s.icon size={16} />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-zinc-500">{s.label}</p>
            </div>
          ))}
      </div>
      {leads && (
        <div className="rounded-xl border p-5 bg-card">
          <h3 className="text-sm font-semibold mb-4">Consultas recientes</h3>
          <p className="text-xs text-zinc-500 mb-4">
            Resumen de las últimas 200 consultas; no representa un histórico
            completo.
          </p>
          {leads.slice(0, 5).map((l) => (
            <button
              key={l.id}
              onClick={() => navigate("leads")}
              className="block w-full text-left border-b py-3 text-sm"
            >
              <span>{l.name}</span>
              <span className="ml-3 text-zinc-500">
                {l.motorcycle} · {l.status}
              </span>
            </button>
          ))}
          {!leads.length && (
            <p className="text-sm text-zinc-500">Sin consultas.</p>
          )}
        </div>
      )}
      <div className="rounded-xl border p-5 bg-card text-sm text-zinc-500">
        Promociones, analítica de visitas e historial de actividad pendientes de
        API.
      </div>
    </div>
  )
}
