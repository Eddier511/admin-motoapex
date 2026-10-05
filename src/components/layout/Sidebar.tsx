import motoapexLogo from "../../assets/motoapex-logo.png"
import { LayoutDashboard, Bike, Tag, Grid3X3, Percent, Package, Monitor, Users, Settings, LogOut, FileText } from "lucide-react"
import { useApp } from "../../context/AppContext"
import { canReadCatalog } from "../../lib/permissions"
import type { Page } from "../../types"

const groups: { label: string; items: { id: Page; label: string; icon: React.ElementType }[] }[] = [
  { label: "General", items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  { label: "Gestión", items: [
    { id: "motorcycles", label: "Motocicletas", icon: Bike },
    { id: "brands", label: "Marcas", icon: Tag },
    { id: "categories", label: "Categorías", icon: Grid3X3 },
    { id: "promotions", label: "Promociones", icon: Percent },
  ] },
  { label: "Operación", items: [
    { id: "inventory", label: "Inventario", icon: Package },
    { id: "leads", label: "Leads", icon: FileText },
  ] },
  { label: "Sistema", items: [
    { id: "content", label: "Contenido web", icon: Monitor },
    { id: "users", label: "Usuarios", icon: Users },
    { id: "settings", label: "Configuración", icon: Settings },
  ] },
]

export function Sidebar() {
  const { currentPage, navigate, sidebarCollapsed, logout, user, can, loggingOut } = useApp()
  const visible = (id: Page) =>
    (!["motorcycles", "brands", "categories", "inventory"].includes(id) || canReadCatalog(user)) &&
    (id !== "leads" || can("leads.manage"))
  return (
    <aside aria-label="Barra lateral" data-collapsed={sidebarCollapsed} className="admin-sidebar flex flex-col h-full border-r transition-all duration-300 shrink-0"
      style={{ width: sidebarCollapsed ? 72 : 248, background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="flex items-center justify-center px-2 h-16 shrink-0 border-b" style={{ borderColor: "var(--border)" }}>
        <img src={motoapexLogo} alt="MotoApex Costa Rica" width={52} height={52}
          className="w-[52px] h-[52px] object-contain shrink-0" />
      </div>
      <nav aria-label="Menú principal" className="sidebar-navigation flex-1 overflow-y-auto px-3 py-4">
        {groups.map(group => {
          const items = group.items.filter(item => visible(item.id))
          if (!items.length) return null
          return <div key={group.label} className="mb-5">
            {!sidebarCollapsed && <p className="px-3 mb-2 text-[11px] uppercase font-semibold tracking-wider text-zinc-500">{group.label}</p>}
            {items.map(item => {
              const Icon = item.icon
              const active = currentPage === item.id || (item.id === "motorcycles" && currentPage === "motorcycle-form")
              return <button key={item.id} onClick={() => navigate(item.id)} aria-label={item.label}
                aria-current={active ? "page" : undefined} title={sidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 mb-1 text-sm font-medium transition-colors ${active ? "" : "hover:bg-secondary"}`}
                style={{ background: active ? "var(--primary)" : undefined, color: active ? "#ffffff" : "var(--foreground)" }}>
                <Icon size={21} className="shrink-0" />
                {!sidebarCollapsed && <span className="text-left truncate">{item.label}</span>}
              </button>
            })}
          </div>
        })}
      </nav>
      <div className="border-t p-3 shrink-0" style={{ borderColor: "var(--border)" }}>
        <button onClick={() => void logout()} disabled={loggingOut} aria-label="Cerrar sesión" title={sidebarCollapsed ? "Cerrar sesión" : undefined}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm hover:bg-red-50 hover:text-red-700 transition-colors">
          <LogOut size={21} className="shrink-0" />{!sidebarCollapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  )
}
