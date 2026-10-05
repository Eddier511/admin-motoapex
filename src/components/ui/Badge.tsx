interface BadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { label: string; className: string }> = {
  available: { label: 'Disponible', className: 'bg-green-500/10 text-green-400 border-green-500/20' },
  coming_soon: { label: 'Próximamente', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  reserved: { label: 'Reservada', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  sold_out: { label: 'Agotada', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  active: { label: 'Activo', className: 'bg-green-500/10 text-green-400 border-green-500/20' },
  inactive: { label: 'Inactivo', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  published: { label: 'Publicado', className: 'bg-green-500/10 text-green-400 border-green-500/20' },
  draft: { label: 'Borrador', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  expired: { label: 'Expirada', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  new: { label: 'Nuevo', className: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  contacted: { label: 'Contactado', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  follow_up: { label: 'Seguimiento', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  closed: { label: 'Cerrado', className: 'bg-green-500/10 text-green-400 border-green-500/20' },
  discarded: { label: 'Descartado', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  admin: { label: 'Administrador', className: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  sales: { label: 'Ventas', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  marketing: { label: 'Marketing', className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  editor: { label: 'Editor', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  quote: { label: 'Cotización', className: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  availability: { label: 'Disponibilidad', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  test_ride: { label: 'Prueba', className: 'bg-green-500/10 text-green-400 border-green-500/20' },
  contact: { label: 'Contacto', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  whatsapp: { label: 'WhatsApp', className: 'bg-green-500/10 text-green-400 border-green-500/20' },
};

const palettes = {
  green: { background: "#f0faf4", borderColor: "#a7efc3", color: "#327a59", dot: "#58b687" },
  blue: { background: "#eff6ff", borderColor: "#bfdbfe", color: "#2563a3", dot: "#60a5fa" },
  yellow: { background: "#fffbeb", borderColor: "#fde68a", color: "#946200", dot: "#e9b52e" },
  red: { background: "#fff1f2", borderColor: "#fecdd3", color: "#b52e46", dot: "#ee6d83" },
  orange: { background: "#fff8ef", borderColor: "#fbd3a2", color: "#bd491b", dot: "#ed7a32" },
  purple: { background: "#fdf2f8", borderColor: "#f6c6e7", color: "#b82c69", dot: "#dc5395" },
  zinc: { background: "#f6f6f7", borderColor: "#dedee3", color: "#62626d", dot: "#9898a3" },
}

export function statusStyle(status: string) {
  const config = statusConfig[status]
  const tone = Object.keys(palettes).find(key => config?.className.includes(`bg-${key}-`)) as keyof typeof palettes | undefined
  return palettes[tone || "zinc"]
}

export function statusLabel(status: string) {
  return statusConfig[status]?.label ?? status
}

export function Badge({ status, size = 'sm' }: BadgeProps) {
  const { dot, ...style } = statusStyle(status)
  return (
    <div data-status={status} className={`inline-flex items-center gap-2 border rounded-lg font-medium whitespace-nowrap ${size === 'sm' ? 'text-xs px-2.5 py-1' : 'text-sm px-3 py-1.5'}`} style={style}>
      <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dot }} />
      {statusLabel(status)}
    </div>
  )
}
