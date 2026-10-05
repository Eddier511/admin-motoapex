import { useState } from 'react';
import { Plus, Edit, Trash2, Globe } from 'lucide-react';
import { mockBrands } from '../data/mock';
import { Badge } from '../components/ui/Badge';
import { useApp } from '../context/AppContext';
import type { Brand } from '../types';

export function Brands() {
  const { addToast } = useApp();
  const [brands, setBrands] = useState<Brand[]>(mockBrands);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Brand>>({ name: '', slug: '', primaryColor: '#f97316', secondaryColor: '#1a1a1a', status: 'active', order: 1, description: '' });

  const openCreate = () => { setEditing(null); setForm({ name: '', slug: '', primaryColor: '#f97316', secondaryColor: '#1a1a1a', status: 'active', order: brands.length + 1, description: '' }); setShowForm(true); };
  const openEdit = (b: Brand) => { setEditing(b); setForm(b); setShowForm(true); };

  const handleSave = () => {
    if (!form.name) return;
    if (editing) {
      setBrands(prev => prev.map(b => b.id === editing.id ? { ...b, ...form } as Brand : b));
      addToast('success', 'Marca actualizada');
    } else {
      setBrands(prev => [...prev, { ...form, id: Math.random().toString(36).slice(2) } as Brand]);
      addToast('success', 'Marca creada');
    }
    setShowForm(false);
  };

  const deleteBrand = (id: string) => {
    setBrands(prev => prev.filter(b => b.id !== id));
    addToast('success', 'Marca eliminada');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">{brands.length} marcas</p>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--primary)', color: '#000' }}>
          <Plus size={15} />Nueva marca
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {brands.map(brand => (
          <div key={brand.id} className="rounded-xl border p-5 hover:border-zinc-700 transition-colors" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg" style={{ background: brand.primaryColor, fontFamily: 'DM Sans, sans-serif' }}>
                {brand.name.slice(0, 2)}
              </div>
              <Badge status={brand.status} />
            </div>
            <h3 className="font-bold text-zinc-100 mb-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>{brand.name}</h3>
            <p className="text-xs text-zinc-500 mb-3">{brand.description}</p>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 rounded-full" style={{ background: brand.primaryColor }} title="Color primario" />
              <div className="w-5 h-5 rounded-full border" style={{ background: brand.secondaryColor, borderColor: 'var(--border)' }} title="Color secundario" />
              <span className="text-xs text-zinc-600 mono">{brand.primaryColor}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => openEdit(brand)} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
                <Edit size={12} />Editar
              </button>
              <button className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
                <Globe size={12} />Ver en web
              </button>
              <button onClick={() => deleteBrand(brand.id)} className="ml-auto text-zinc-600 hover:text-red-400 transition-colors p-1.5">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Form drawer */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-lg rounded-xl border p-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <h2 className="font-bold text-zinc-100 mb-5" style={{ fontFamily: 'DM Sans, sans-serif' }}>{editing ? 'Editar marca' : 'Nueva marca'}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormRow label="Nombre *">
                  <TInput value={form.name ?? ''} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="KTM" />
                </FormRow>
                <FormRow label="Slug">
                  <TInput value={form.slug ?? ''} onChange={v => setForm(p => ({ ...p, slug: v }))} placeholder="ktm" />
                </FormRow>
                <FormRow label="Color primario">
                  <div className="flex gap-2">
                    <input type="color" value={form.primaryColor ?? '#f97316'} onChange={e => setForm(p => ({ ...p, primaryColor: e.target.value }))} className="w-10 h-9 rounded-lg border cursor-pointer" style={{ borderColor: 'var(--border)' }} />
                    <TInput value={form.primaryColor ?? ''} onChange={v => setForm(p => ({ ...p, primaryColor: v }))} placeholder="#F97316" />
                  </div>
                </FormRow>
                <FormRow label="Color secundario">
                  <div className="flex gap-2">
                    <input type="color" value={form.secondaryColor ?? '#1a1a1a'} onChange={e => setForm(p => ({ ...p, secondaryColor: e.target.value }))} className="w-10 h-9 rounded-lg border cursor-pointer" style={{ borderColor: 'var(--border)' }} />
                    <TInput value={form.secondaryColor ?? ''} onChange={v => setForm(p => ({ ...p, secondaryColor: v }))} placeholder="#1A1A1A" />
                  </div>
                </FormRow>
              </div>
              <FormRow label="Descripción">
                <textarea value={form.description ?? ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Descripción de la marca..."
                  className="w-full px-3 py-2 text-sm rounded-lg border outline-none resize-none" style={{ background: 'var(--secondary)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
              </FormRow>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors">Cancelar</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors" style={{ background: 'var(--primary)', color: '#000' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">{label}</label>{children}</div>;
}
function TInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3 py-2 text-sm rounded-lg border outline-none" style={{ background: 'var(--secondary)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />;
}
