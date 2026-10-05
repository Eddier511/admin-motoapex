import { Search, Bell, ChevronDown, LogOut, User } from "lucide-react"

import { useState } from "react"

import { useApp } from "../../context/AppContext"

const pageTitles: Record<string, string> = {
  dashboard: "Dashboard",
  motorcycles: "Motocicletas",
  "motorcycle-form": "Motocicleta",

  brands: "Marcas",
  categories: "Categorías",
  promotions: "Promociones",

  inventory: "Inventario",
  used: "Usados",
  content: "Contenido Web",

  leads: "Leads",
  users: "Usuarios",
  settings: "Configuración",
}

export function TopBar() {
  const { currentPage, logout, user, loggingOut } = useApp()

  const [profileOpen, setProfileOpen] = useState(false)

  const [notifOpen, setNotifOpen] = useState(false)

  return (
    <header
      className="flex items-center justify-between px-6 border-b shrink-0"
      style={{
        height: "64px",
        background: "var(--card)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-center gap-4">
        <h1
          className="text-base font-semibold text-zinc-100"
          style={{ fontFamily: "DM Sans, sans-serif" }}
        >
          {pageTitles[currentPage] ?? ""}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            disabled
            placeholder="Búsqueda global pendiente"
            className="pl-9 pr-4 py-2 text-sm rounded-lg border outline-none transition-colors w-52 focus:w-64"
            style={{
              background: "var(--secondary)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((o) => !o)
              setProfileOpen(false)
            }}
            className="relative w-9 h-9 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <Bell size={17} />
          </button>
          {notifOpen && (
            <div
              className="absolute right-0 top-12 w-72 rounded-xl border shadow-xl z-50 overflow-hidden"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
              }}
            >
              <div
                className="px-4 py-3 border-b"
                style={{ borderColor: "var(--border)" }}
              >
                <p className="text-sm font-semibold text-zinc-200">
                  Notificaciones
                </p>
              </div>
              <p className="p-4 text-xs text-zinc-500">
                Notificaciones pendientes de API.
              </p>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen((o) => !o)
              setNotifOpen(false)
            }}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-black"
              style={{ background: "var(--primary)" }}
            >
              {user?.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-medium text-zinc-200 leading-tight">
                {user?.name}
              </p>
              <p className="text-xs text-zinc-500">{user?.role}</p>
            </div>
            <ChevronDown size={13} className="text-zinc-500" />
          </button>
          {profileOpen && (
            <div
              className="absolute right-0 top-12 w-48 rounded-xl border shadow-xl z-50 overflow-hidden"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
              }}
            >
              <div
                className="px-4 py-3 border-b"
                style={{ borderColor: "var(--border)" }}
              >
                <p className="text-xs font-semibold text-zinc-200">
                  {user?.name}
                </p>
                <p className="text-xs text-zinc-500">{user?.email}</p>
              </div>
              <button
                disabled
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
              >
                <User size={14} />
                Perfil (pendiente)
              </button>
              <button
                onClick={() => void logout()}
                disabled={loggingOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/5 transition-colors"
              >
                <LogOut size={14} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
