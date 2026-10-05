import { useState } from 'react';
import { Plus, Edit, Trash2, Search, Upload, Globe, Phone, Mail, MapPin } from 'lucide-react';
import { mockCategories, mockPromotions, mockMotorcycles, mockUsers } from '../data/mock';
import { Badge } from '../components/ui/Badge';
import { useApp } from '../context/AppContext';
import type { Promotion, User } from '../types';

/* ── CATEGORIES ── */
export function Categories() {
  const { addToast } = useApp();
  const [cats, setCats] = useState(mockCategories);
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">{cats.length} categorías</p>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--primary)', color: '#000' }}>
          <Plus size={15} />Nueva categoría
        </button>
      </div>
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
              {['#', 'Nombre', 'Slug', 'Estado', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {cats.map((cat, i) => (
              <tr key={cat.id} className="hover:bg-zinc-900/30 transition-colors">
                <td className="px-4 py-3 text-xs text-zinc-600">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-zinc-200">{cat.name}</td>
                <td className="px-4 py-3 text-xs text-zinc-500 mono">{cat.slug}</td>
                <td className="px-4 py-3"><Badge status={cat.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"><Edit size={13} /></button>
                    <button onClick={() => { setCats(p => p.filter(c => c.id !== cat.id)); addToast('success', 'Categoría eliminada'); }}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-500/5 transition-colors"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── PROMOTIONS ── */
export function Promotions() {
  const { addToast } = useApp();
  const [promos, setPromos] = useState<Promotion[]>(mockPromotions);
  const fmt = (n: number) => `₡${n.toLocaleString('es-CR')}`;
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">{promos.length} promociones</p>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--primary)', color: '#000' }}>
          <Plus size={15} />Nueva promoción
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {promos.map(promo => (
          <div key={promo.id} className="rounded-xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="h-28 flex items-center justify-center" style={{ background: 'var(--secondary)' }}>
              <Upload size={24} className="text-zinc-700" />
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-zinc-200 text-sm">{promo.title}</p>
                  <p className="text-xs text-zinc-500">{promo.brand} · {promo.model}</p>
                </div>
                <Badge status={promo.status} />
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <p className="text-base font-bold" style={{ color: 'var(--primary)', fontFamily: 'DM Sans' }}>{fmt(promo.promoPrice)}</p>
                <p className="text-xs line-through text-zinc-600">{fmt(promo.originalPrice)}</p>
              </div>
              <div className="text-xs text-zinc-600 mb-3">{promo.startDate} — {promo.endDate}</div>
              <div className="flex gap-2">
                <button className="flex-1 text-xs py-1.5 rounded-lg border text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors" style={{ borderColor: 'var(--border)' }}>Editar</button>
                <button onClick={() => { setPromos(p => p.filter(pr => pr.id !== promo.id)); addToast('success', 'Promoción eliminada'); }}
                  className="text-xs py-1.5 px-3 rounded-lg text-red-400 hover:bg-red-500/5 transition-colors">Eliminar</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── INVENTORY ── */
export function Inventory() {
  const [search, setSearch] = useState('');
  const motos = mockMotorcycles.filter(m => !search || m.model.toLowerCase().includes(search.toLowerCase()) || m.brand.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por marca o modelo..."
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border outline-none"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
      </div>
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
              {['Marca', 'Modelo', 'Año', 'SKU', 'Cantidad', 'Estado', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {motos.map(m => (
              <tr key={m.id} className="hover:bg-zinc-900/30 transition-colors">
                <td className="px-4 py-3 text-sm text-zinc-300">{m.brand}</td>
                <td className="px-4 py-3"><p className="font-medium text-zinc-200">{m.model} {m.version}</p></td>
                <td className="px-4 py-3 text-zinc-500 mono text-xs">{m.year}</td>
                <td className="px-4 py-3 text-zinc-500 mono text-xs">{m.sku}</td>
                <td className="px-4 py-3">
                  <input type="number" defaultValue={m.inventory} min={0}
                    className={`w-16 px-2 py-1 text-sm rounded border outline-none text-center mono ${m.inventory === 0 ? 'text-red-400' : m.inventory <= 2 ? 'text-yellow-400' : 'text-zinc-200'}`}
                    style={{ background: 'var(--secondary)', borderColor: 'var(--border)' }} />
                </td>
                <td className="px-4 py-3"><Badge status={m.status} /></td>
                <td className="px-4 py-3">
                  <button className="text-xs px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">Historial</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── USED MOTORCYCLES ── */
export function UsedMotorcycles() {
  const { navigate } = useApp();
  const used = [
    { id: 'u1', brand: 'KTM', model: '390 Duke', year: 2022, km: 12500, price: 5200000, condition: 'Bueno', owners: 1 },
    { id: 'u2', brand: 'Ducati', model: 'Monster 821', year: 2020, km: 22000, price: 18500000, condition: 'Muy bueno', owners: 1 },
    { id: 'u3', brand: 'KTM', model: '1290 Super Duke R', year: 2021, km: 8900, price: 24000000, condition: 'Excelente', owners: 1 },
  ];
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">{used.length} usados</p>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--primary)', color: '#000' }}>
          <Plus size={15} />Agregar usado
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {used.map(m => (
          <div key={m.id} className="rounded-xl border p-5 hover:border-zinc-700 transition-colors" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="h-24 rounded-lg mb-4 flex items-center justify-center" style={{ background: 'var(--secondary)' }}>
              <Upload size={20} className="text-zinc-700" />
            </div>
            <p className="font-bold text-zinc-200 mb-1" style={{ fontFamily: 'DM Sans' }}>{m.brand} {m.model}</p>
            <p className="text-xs text-zinc-500 mb-3">{m.year} · {m.km.toLocaleString()} km · {m.owners} dueño · {m.condition}</p>
            <p className="text-base font-bold mb-3" style={{ color: 'var(--primary)', fontFamily: 'DM Sans' }}>₡{m.price.toLocaleString('es-CR')}</p>
            <div className="flex gap-2">
              <button className="flex-1 text-xs py-1.5 rounded-lg border text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors" style={{ borderColor: 'var(--border)' }}>Editar</button>
              <button className="text-xs py-1.5 px-3 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors border" style={{ borderColor: 'var(--border)' }}>
                <Globe size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── WEB CONTENT ── */
export function WebContent() {
  const { addToast } = useApp();
  const [contact, setContact] = useState({ whatsapp: '+506 8888-0000', phone: '+506 2222-0000', email: 'info@motoapexcr.com', address: 'San José, Costa Rica' });
  const [social, setSocial] = useState({ instagram: '@motoapexcr', facebook: 'MotoApexCostaRica', youtube: 'MotoApex CR' });
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Hero */}
      <div className="rounded-xl border p-5" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <h3 className="text-sm font-semibold text-zinc-200 mb-4" style={{ fontFamily: 'DM Sans' }}>Hero principal</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-xs text-zinc-500 mb-1.5 block">Título hero</label><input defaultValue="Ready to Race" className="w-full px-3 py-2 text-sm rounded-lg border outline-none" style={{ background: 'var(--secondary)', borderColor: 'var(--border)', color: 'var(--foreground)' }} /></div>
          <div><label className="text-xs text-zinc-500 mb-1.5 block">Subtítulo</label><input defaultValue="Las mejores marcas del mundo en Costa Rica" className="w-full px-3 py-2 text-sm rounded-lg border outline-none" style={{ background: 'var(--secondary)', borderColor: 'var(--border)', color: 'var(--foreground)' }} /></div>
          <div className="col-span-2">
            <label className="text-xs text-zinc-500 mb-1.5 block">Imagen hero</label>
            <div className="h-24 rounded-lg border border-dashed flex items-center justify-center cursor-pointer hover:bg-zinc-800/30 transition-colors" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2 text-zinc-500 text-xs"><Upload size={14} />Subir imagen hero (1920×1080)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="rounded-xl border p-5" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <h3 className="text-sm font-semibold text-zinc-200 mb-4" style={{ fontFamily: 'DM Sans' }}>Información de contacto</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: Phone, label: 'WhatsApp', key: 'whatsapp' as const },
            { icon: Phone, label: 'Teléfono', key: 'phone' as const },
            { icon: Mail, label: 'Email', key: 'email' as const },
            { icon: MapPin, label: 'Dirección', key: 'address' as const },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs text-zinc-500 mb-1.5 flex items-center gap-1.5 block"><f.icon size={11} />{f.label}</label>
              <input value={contact[f.key]} onChange={e => setContact(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border outline-none" style={{ background: 'var(--secondary)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Social */}
      <div className="rounded-xl border p-5" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <h3 className="text-sm font-semibold text-zinc-200 mb-4" style={{ fontFamily: 'DM Sans' }}>Redes sociales</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Phone, label: 'Instagram', key: 'instagram' as const },
            { icon: Globe, label: 'Facebook', key: 'facebook' as const },
            { icon: Mail, label: 'YouTube', key: 'youtube' as const },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs text-zinc-500 mb-1.5 flex items-center gap-1.5 block"><f.icon size={11} />{f.label}</label>
              <input value={social[f.key]} onChange={e => setSocial(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border outline-none" style={{ background: 'var(--secondary)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => addToast('success', 'Contenido web guardado')} className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors" style={{ background: 'var(--primary)', color: '#000' }}>
        Guardar cambios
      </button>
    </div>
  );
}

/* ── USERS ── */
export function Users() {
  const { addToast } = useApp();
  const [users, setUsers] = useState<User[]>(mockUsers);
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">{users.length} usuarios</p>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--primary)', color: '#000' }}>
          <Plus size={15} />Nuevo usuario
        </button>
      </div>
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
              {['Usuario', 'Email', 'Rol', 'Estado', 'Último acceso', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {users.map(user => (
              <tr key={user.id} className="hover:bg-zinc-900/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-black shrink-0" style={{ background: 'var(--primary)' }}>
                      {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <span className="font-medium text-zinc-200">{user.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">{user.email}</td>
                <td className="px-4 py-3"><Badge status={user.role} /></td>
                <td className="px-4 py-3"><Badge status={user.status} /></td>
                <td className="px-4 py-3 text-xs text-zinc-500 mono">{user.lastAccess}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"><Edit size={13} /></button>
                    <button onClick={() => { setUsers(p => p.filter(u => u.id !== user.id)); addToast('success', 'Usuario eliminado'); }}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-500/5 transition-colors"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── SETTINGS ── */
export function Settings() {
  const { addToast } = useApp();
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-2xl">
      <div className="rounded-xl border p-5" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <h3 className="text-sm font-semibold text-zinc-200 mb-4" style={{ fontFamily: 'DM Sans' }}>General</h3>
        <div className="space-y-4">
          {[{ label: 'Nombre del sitio', val: 'MotoApex Costa Rica' }, { label: 'URL del sitio', val: 'https://motoapexcr.com' }, { label: 'URL de la API', val: 'https://api.motoapexcr.com' }].map(f => (
            <div key={f.label}><label className="text-xs text-zinc-500 mb-1.5 block">{f.label}</label>
              <input defaultValue={f.val} className="w-full px-3 py-2 text-sm rounded-lg border outline-none" style={{ background: 'var(--secondary)', borderColor: 'var(--border)', color: 'var(--foreground)' }} /></div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border p-5" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <h3 className="text-sm font-semibold text-zinc-200 mb-4" style={{ fontFamily: 'DM Sans' }}>Seguridad</h3>
        <div className="space-y-3">
          {[{ label: 'Autenticación de dos factores (2FA)', sub: 'Próximamente disponible', enabled: false },
            { label: 'Sesiones activas', sub: 'Gestionar sesiones abiertas', enabled: true }].map(opt => (
            <div key={opt.label} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: 'var(--border)' }}>
              <div><p className="text-sm text-zinc-300">{opt.label}</p><p className="text-xs text-zinc-600">{opt.sub}</p></div>
              <button disabled={!opt.enabled} className={`w-10 h-5 rounded-full relative ${opt.enabled ? '' : 'bg-zinc-800 opacity-50 cursor-not-allowed'}`}
                style={opt.enabled ? { background: 'var(--primary)' } : {}}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${opt.enabled ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <button onClick={() => addToast('success', 'Configuración guardada')} className="px-6 py-2.5 rounded-lg text-sm font-semibold" style={{ background: 'var(--primary)', color: '#000' }}>
        Guardar configuración
      </button>
    </div>
  );
}
