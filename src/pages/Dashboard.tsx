import {
  Bike, Tag, Percent, FileText, AlertTriangle, TrendingUp,
  Star, Plus, ArrowUpRight, Clock, DollarSign, Eye
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { leadsChartData, brandConsultations, topMotorcycles, recentActivity } from '../data/mock';
import { useApp } from '../context/AppContext';

const stats = [
  { label: 'Motos publicadas', value: '18', sub: '+3 este mes', icon: Bike, color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  { label: 'Disponibles', value: '12', sub: '8 unidades en stock', icon: TrendingUp, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  { label: 'Marcas activas', value: '4', sub: 'Ducati, KTM, Husqvarna, GASGAS', icon: Tag, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  { label: 'Promociones activas', value: '2', sub: '1 expira en 3 días', icon: Percent, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { label: 'Leads nuevos', value: '4', sub: 'Sin atender', icon: FileText, color: '#38bdf8', bg: 'rgba(56,189,248,0.1)' },
  { label: 'Modelos nuevos', value: '7', sub: 'Lanzamientos 2025', icon: Star, color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  { label: 'Agotadas', value: '2', sub: 'KTM 1290 R, Ducati SF V4', icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  { label: 'Bajo inventario', value: '3', sub: '≤ 2 unidades', icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
];

const activityIcons: Record<string, { icon: React.ElementType; color: string }> = {
  publish: { icon: Bike, color: '#22c55e' },
  price: { icon: DollarSign, color: '#f59e0b' },
  lead: { icon: FileText, color: '#38bdf8' },
  image: { icon: Eye, color: '#a78bfa' },
  inventory: { icon: TrendingUp, color: '#f97316' },
  promo: { icon: Percent, color: '#f97316' },
};

const BRAND_COLORS = ['#f97316', '#ef4444', '#3b82f6', '#22c55e'];

export function Dashboard() {
  const { navigate } = useApp();
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-100" style={{ fontFamily: 'DM Sans, sans-serif' }}>Bienvenido, Eddier</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Sábado, 23 de noviembre 2025</p>
        </div>
        <button onClick={() => navigate('motorcycle-form', { mode: 'create' })}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: 'var(--primary)', color: '#000' }}>
          <Plus size={15} />Nueva motocicleta
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border p-4 hover:border-zinc-700 transition-colors"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: stat.bg }}>
                  <Icon size={16} style={{ color: stat.color }} />
                </div>
                <ArrowUpRight size={14} className="text-zinc-600" />
              </div>
              <p className="text-2xl font-bold text-zinc-100 mb-0.5" style={{ fontFamily: 'DM Sans, sans-serif' }}>{stat.value}</p>
              <p className="text-xs font-medium text-zinc-300 mb-0.5">{stat.label}</p>
              <p className="text-xs text-zinc-600">{stat.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Leads por mes */}
        <div className="lg:col-span-2 rounded-xl border p-5" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-zinc-200" style={{ fontFamily: 'DM Sans, sans-serif' }}>Leads por mes</h3>
              <p className="text-xs text-zinc-500">Mayo — Noviembre 2025</p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316' }}>+22% vs mes anterior</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={leadsChartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '8px', color: '#18181b', fontSize: '12px' }} />
              <Area type="monotone" dataKey="leads" stroke="#f97316" strokeWidth={2} fill="url(#leadGrad)" dot={{ fill: '#f97316', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Consultas por marca */}
        <div className="rounded-xl border p-5" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-semibold text-zinc-200 mb-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>Consultas por marca</h3>
          <p className="text-xs text-zinc-500 mb-5">Último mes</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={brandConsultations} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="brand" type="category" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '8px', color: '#18181b', fontSize: '12px' }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {brandConsultations.map((_, i) => <Cell key={i} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Motos más consultadas */}
        <div className="rounded-xl border p-5" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-200" style={{ fontFamily: 'DM Sans, sans-serif' }}>Motos más consultadas</h3>
            <button onClick={() => navigate('motorcycles')} className="text-xs transition-colors hover:underline" style={{ color: 'var(--primary)' }}>Ver todas</button>
          </div>
          <div className="space-y-3">
            {topMotorcycles.map((moto, i) => (
              <div key={moto.name} className="flex items-center gap-3">
                <span className="text-xs font-bold w-4 text-zinc-600">#{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-zinc-300">{moto.name}</span>
                    <span className="text-xs text-zinc-500 font-medium mono">{moto.views}</span>
                  </div>
                  <div className="h-1 rounded-full" style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${(moto.views / 284) * 100}%`, background: i === 0 ? '#f97316' : '#3f3f46' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="rounded-xl border p-5" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-semibold text-zinc-200 mb-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>Actividad reciente</h3>
          <div className="space-y-3">
            {recentActivity.map(act => {
              const { icon: Icon, color } = activityIcons[act.type] ?? { icon: Clock, color: '#71717a' };
              return (
                <div key={act.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: color + '18' }}>
                    <Icon size={13} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-300 truncate"><span className="font-medium">{act.action}</span> · {act.detail}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">{act.user} · {act.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
