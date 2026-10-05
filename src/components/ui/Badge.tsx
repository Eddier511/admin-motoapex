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

export function Badge({ status, size = 'sm' }: BadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' };
  return (
    <span className={`inline-flex items-center border rounded-full font-medium ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'} ${config.className}`}>
      {config.label}
    </span>
  );
}
