import {
  LayoutDashboard, Bike, Tag, Grid3X3, Percent, Package,
  Monitor, Users, Settings, LogOut, ChevronLeft, ChevronRight,
  FileText, Bell
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Page } from '../../types';

const navItems: { id: Page; label: string; icon: React.ElementType; badge?: number }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'motorcycles', label: 'Motocicletas', icon: Bike },
  { id: 'brands', label: 'Marcas', icon: Tag },
  { id: 'categories', label: 'Categorías', icon: Grid3X3 },
  { id: 'promotions', label: 'Promociones', icon: Percent },
  { id: 'inventory', label: 'Inventario', icon: Package },
  { id: 'content', label: 'Contenido web', icon: Monitor },
  { id: 'leads', label: 'Leads', icon: FileText, badge: 4 },
  { id: 'users', label: 'Usuarios', icon: Users },
  { id: 'settings', label: 'Configuración', icon: Settings },
];

export function Sidebar() {
  const { currentPage, navigate, sidebarCollapsed, toggleSidebar, logout } = useApp();

  return (
    <aside
      className="flex flex-col h-full border-r transition-all duration-300 shrink-0"
      style={{
        width: sidebarCollapsed ? '64px' : '220px',
        background: 'var(--card)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: 'var(--border)', minHeight: '64px' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--primary)' }}>
          <Bike size={16} className="text-black" />
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-zinc-100 leading-tight whitespace-nowrap" style={{ fontFamily: 'DM Sans, sans-serif' }}>MotoApex</p>
            <p className="text-xs text-zinc-500 whitespace-nowrap">Admin Panel</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <div key={item.id} className="relative group px-2 mb-0.5">
              <button
                onClick={() => navigate(item.id)}
                title={sidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'text-black'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
                style={isActive ? { background: 'var(--primary)', color: '#000' } : {}}
              >
                <Icon size={16} className="shrink-0" />
                {!sidebarCollapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
                {!sidebarCollapsed && item.badge && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-orange-500 text-black min-w-[18px] text-center">
                    {item.badge}
                  </span>
                )}
              </button>
              {/* Tooltip for collapsed state */}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-xs text-zinc-200 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50"
                  style={{ background: '#18181b', border: '1px solid #27272a', color: '#f4f4f5' }}>
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle + Logout */}
      <div className="border-t p-2 space-y-1" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight size={15} /> : <><ChevronLeft size={15} /><span>Colapsar</span></>}
        </button>
        <button
          onClick={logout}
          title={sidebarCollapsed ? 'Cerrar sesión' : undefined}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-colors"
        >
          <LogOut size={15} className="shrink-0" />
          {!sidebarCollapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
