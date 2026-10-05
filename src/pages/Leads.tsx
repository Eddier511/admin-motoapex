import { useState } from 'react';
import { Search, MessageSquare, Phone, Mail, Calendar, User } from 'lucide-react';
import { mockLeads } from '../data/mock';
import { Badge } from '../components/ui/Badge';
import type { Lead } from '../types';

const STATUSES: Lead['status'][] = ['new', 'contacted', 'follow_up', 'closed', 'discarded'];

export function Leads() {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState<Lead | null>(null);

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    return (!search || l.name.toLowerCase().includes(q) || l.brand.toLowerCase().includes(q) || l.motorcycle.toLowerCase().includes(q)) &&
      (!filterStatus || l.status === filterStatus);
  });

  const updateStatus = (id: string, status: Lead['status']) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
  };

  const counts: Record<string, number> = {};
  STATUSES.forEach(s => { counts[s] = leads.filter(l => l.status === s).length; });

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* Status cards */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { status: 'new', label: 'Nuevos', color: '#f97316' },
          { status: 'contacted', label: 'Contactados', color: '#38bdf8' },
          { status: 'follow_up', label: 'Seguimiento', color: '#f59e0b' },
          { status: 'closed', label: 'Cerrados', color: '#22c55e' },
          { status: 'discarded', label: 'Descartados', color: '#71717a' },
        ].map(item => (
          <button key={item.status} onClick={() => setFilterStatus(filterStatus === item.status ? '' : item.status)}
            className={`p-3 rounded-xl border text-left transition-all ${filterStatus === item.status ? 'border-orange-500/50' : 'hover:border-zinc-700'}`}
            style={{ background: 'var(--card)', borderColor: filterStatus === item.status ? undefined : 'var(--border)' }}>
            <p className="text-xl font-bold" style={{ fontFamily: 'DM Sans, sans-serif', color: item.color }}>{counts[item.status] ?? 0}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{item.label}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar lead por nombre, marca o moto..."
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border outline-none"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
      </div>

      {/* Table + Detail */}
      <div className="flex gap-4 min-h-0">
        <div className={`rounded-xl border overflow-hidden ${selected ? 'flex-1' : 'w-full'}`} style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                {['Fecha', 'Cliente', 'Motocicleta', 'Tipo', 'Estado', 'Responsable'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {filtered.map(lead => (
                <tr key={lead.id} onClick={() => setSelected(selected?.id === lead.id ? null : lead)}
                  className={`cursor-pointer transition-colors hover:bg-zinc-900/40 ${selected?.id === lead.id ? 'bg-orange-500/5' : ''}`}>
                  <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap mono">{lead.date}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-200 text-sm">{lead.name}</p>
                    <p className="text-xs text-zinc-600">{lead.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-zinc-300">{lead.brand}</p>
                    <p className="text-xs text-zinc-500">{lead.motorcycle}</p>
                  </td>
                  <td className="px-4 py-3"><Badge status={lead.type} /></td>
                  <td className="px-4 py-3">
                    <select value={lead.status} onChange={e => { e.stopPropagation(); updateStatus(lead.id, e.target.value as Lead['status']); }}
                      onClick={e => e.stopPropagation()}
                      className="text-xs bg-transparent border rounded-full px-2 py-0.5 cursor-pointer outline-none"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{lead.assignedTo ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-72 shrink-0 rounded-xl border p-5 space-y-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-black" style={{ background: 'var(--primary)' }}>
                {selected.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <Badge status={selected.status} size="md" />
            </div>
            <div>
              <p className="font-semibold text-zinc-200" style={{ fontFamily: 'DM Sans, sans-serif' }}>{selected.name}</p>
              <p className="text-xs text-zinc-500">{selected.date}</p>
            </div>
            {[{ icon: Phone, text: selected.phone }, { icon: Mail, text: selected.email }, { icon: Calendar, text: selected.brand + ' · ' + selected.motorcycle }].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-xs text-zinc-400">
                <Icon size={13} className="text-zinc-600 shrink-0" />{text}
              </div>
            ))}
            {selected.message && (
              <div className="p-3 rounded-lg text-xs text-zinc-400 leading-relaxed" style={{ background: 'var(--secondary)' }}>
                <div className="flex items-center gap-1.5 text-zinc-600 mb-1.5"><MessageSquare size={11} />Mensaje</div>
                {selected.message}
              </div>
            )}
            <div>
              <label className="text-xs text-zinc-600 mb-1.5 block"><User size={11} className="inline mr-1" />Asignar a</label>
              <select className="w-full text-xs rounded-lg border px-2 py-1.5 outline-none" style={{ background: 'var(--secondary)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                <option>Sin asignar</option>
                <option>Carlos Vega</option>
                <option>María Rodríguez</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-600 mb-1.5 block">Estado</label>
              <div className="grid grid-cols-1 gap-1">
                {STATUSES.map(s => (
                  <button key={s} onClick={() => updateStatus(selected.id, s)}
                    className={`text-xs px-3 py-1.5 rounded-lg text-left transition-colors ${selected.status === s ? 'text-black font-medium' : 'text-zinc-400 hover:bg-zinc-800'}`}
                    style={selected.status === s ? { background: 'var(--primary)' } : {}}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
