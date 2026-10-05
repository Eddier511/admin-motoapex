import { useState, useRef, useCallback } from 'react';
import {
  ChevronLeft, Save, Eye, Globe, Plus, Trash2, GripVertical,
  Upload, X, Star, Check, ArrowLeft, ArrowRight, ChevronDown, Palette
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { mockMotorcycles, mockBrands, mockCategories } from '../../data/mock';
import { Badge } from '../../components/ui/Badge';
import { ConfirmModal } from '../../components/ui/Modal';
import type { MotorcycleColor, MotorcycleImage } from '../../types';

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'specs', label: 'Especificaciones' },
  { id: 'colors', label: 'Colores y Galerías' },
  { id: 'multimedia', label: 'Multimedia' },
  { id: 'seo', label: 'SEO' },
  { id: 'inventory', label: 'Inventario' },
  { id: 'publish', label: 'Publicación' },
];

export function MotorcycleForm() {
  const { navigate, pageParams, addToast } = useApp();
  const mode = pageParams.mode ?? 'create';
  const existingMoto = pageParams.id ? mockMotorcycles.find(m => m.id === pageParams.id) : null;

  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);

  // General
  const [brandId, setBrandId] = useState(existingMoto?.brandId ?? '');
  const [model, setModel] = useState(existingMoto?.model ?? '');
  const [version, setVersion] = useState(existingMoto?.version ?? '');
  const [year, setYear] = useState(existingMoto?.year?.toString() ?? '2025');
  const [categoryId, setCategoryId] = useState(existingMoto?.categoryId ?? '');
  const [displacement, setDisplacement] = useState(existingMoto?.displacement?.toString() ?? '');
  const [price, setPrice] = useState(existingMoto?.price?.toString() ?? '');
  const [promoPrice, setPromoPrice] = useState(existingMoto?.promoPrice?.toString() ?? '');
  const [sku, setSku] = useState(existingMoto?.sku ?? '');
  const [status, setStatus] = useState(existingMoto?.status ?? 'available');
  const [published, setPublished] = useState(existingMoto?.published ?? false);
  const [featured, setFeatured] = useState(existingMoto?.featured ?? false);
  const [isNew, setIsNew] = useState(existingMoto?.isNew ?? false);
  const [showPrice, setShowPrice] = useState(existingMoto?.showPrice ?? true);
  const [allowQuote, setAllowQuote] = useState(existingMoto?.allowQuote ?? true);
  const [shortDesc, setShortDesc] = useState(existingMoto?.shortDescription ?? '');
  const [description, setDescription] = useState(existingMoto?.description ?? '');

  // Colors
  const [colors, setColors] = useState<MotorcycleColor[]>(existingMoto?.colors ?? []);
  const [expandedColor, setExpandedColor] = useState<string | null>(null);
  const [previewColor, setPreviewColor] = useState<string | null>(null);
  const [previewImageIdx, setPreviewImageIdx] = useState(0);

  // SEO
  const [slug, setSlug] = useState(existingMoto?.slug ?? '');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDesc, setMetaDesc] = useState('');
  const [keywords, setKeywords] = useState('');

  // Specs
  const [specs, setSpecs] = useState({
    engine: '', displacement: displacement, cylinders: '', power: '', torque: '', transmission: '',
    cooling: '', weight: '', seatHeight: '', tankCapacity: '', frontSuspension: '', rearSuspension: '',
    frontBrake: '', rearBrake: '', frontTire: '', rearTire: '', abs: false, tractionControl: false,
    ridingModes: '', consumption: '', warranty: '2 años',
  });
  const [customSpecs, setCustomSpecs] = useState<{ id: string; name: string; value: string; unit: string }[]>([]);

  const change = useCallback(() => { setHasChanges(true); setAutoSaved(false); }, []);

  const handleBack = () => {
    if (hasChanges) setShowExitConfirm(true);
    else navigate('motorcycles');
  };

  const handleSave = (publish = false) => {
    addToast('success', publish ? 'Motocicleta publicada correctamente' : 'Borrador guardado correctamente');
    setHasChanges(false);
    setAutoSaved(true);
    if (publish) setPublished(true);
  };

  // Color management
  const addColor = () => {
    const id = Math.random().toString(36).slice(2);
    const newColor: MotorcycleColor = { id, name: 'Color nuevo', hex: '#3b82f6', status: 'active', available: true, order: colors.length + 1, images: [] };
    setColors(prev => [...prev, newColor]);
    setExpandedColor(id);
    change();
  };

  const updateColor = (id: string, updates: Partial<MotorcycleColor>) => {
    setColors(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    change();
  };

  const removeColor = (id: string) => {
    setColors(prev => prev.filter(c => c.id !== id));
    change();
  };

  const addImage = (colorId: string) => {
    const id = Math.random().toString(36).slice(2);
    const newImg: MotorcycleImage = {
      id, url: '', label: `Vista ${(colors.find(c => c.id === colorId)?.images.length ?? 0) + 1}`,
      alt: '', order: (colors.find(c => c.id === colorId)?.images.length ?? 0) + 1, isPrimary: colors.find(c => c.id === colorId)?.images.length === 0,
    };
    setColors(prev => prev.map(c => c.id === colorId ? { ...c, images: [...c.images, newImg] } : c));
    change();
  };

  const updateImage = (colorId: string, imgId: string, updates: Partial<MotorcycleImage>) => {
    setColors(prev => prev.map(c => c.id === colorId ? {
      ...c, images: c.images.map(img => img.id === imgId ? { ...img, ...updates } : img)
    } : c));
    change();
  };

  const removeImage = (colorId: string, imgId: string) => {
    setColors(prev => prev.map(c => c.id === colorId ? { ...c, images: c.images.filter(i => i.id !== imgId) } : c));
    change();
  };

  const setPrimaryImage = (colorId: string, imgId: string) => {
    setColors(prev => prev.map(c => c.id === colorId ? {
      ...c, images: c.images.map(img => ({ ...img, isPrimary: img.id === imgId }))
    } : c));
    change();
  };

  const moveImage = (colorId: string, imgId: string, dir: 'up' | 'down') => {
    setColors(prev => prev.map(c => {
      if (c.id !== colorId) return c;
      const imgs = [...c.images];
      const idx = imgs.findIndex(i => i.id === imgId);
      if (dir === 'up' && idx > 0) [imgs[idx - 1], imgs[idx]] = [imgs[idx], imgs[idx - 1]];
      if (dir === 'down' && idx < imgs.length - 1) [imgs[idx], imgs[idx + 1]] = [imgs[idx + 1], imgs[idx]];
      return { ...c, images: imgs.map((img, i) => ({ ...img, order: i + 1 })) };
    }));
    change();
  };

  const previewColorObj = colors.find(c => c.id === previewColor);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Sub-header */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            <ChevronLeft size={16} />Motocicletas
          </button>
          <div className="w-px h-4 bg-zinc-800" />
          <div>
            <p className="text-sm font-semibold text-zinc-200">
              {mode === 'create' ? 'Nueva motocicleta' : `${existingMoto?.brand} ${existingMoto?.model} ${existingMoto?.version}`}
            </p>
            <p className="text-xs text-zinc-600 flex items-center gap-1.5 mt-0.5">
              {autoSaved ? (
                <><Check size={11} className="text-green-400" /><span className="text-green-400">Guardado</span></>
              ) : hasChanges ? (
                <><span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" /><span className="text-orange-400">Cambios sin guardar</span></>
              ) : <span>Sin cambios</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleSave(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800">
            <Save size={14} />Guardar borrador
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
            <Eye size={14} />Vista previa
          </button>
          <button onClick={() => handleSave(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: 'var(--primary)', color: '#000' }}>
            <Globe size={14} />Publicar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b shrink-0 px-6 overflow-x-auto" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-orange-500 text-orange-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* TAB 1: GENERAL */}
        {activeTab === 'general' && (
          <div className="max-w-3xl space-y-6">
            <Section title="Identificación">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Marca *">
                  <Select value={brandId} onChange={v => { setBrandId(v); change(); }} options={mockBrands.map(b => ({ value: b.id, label: b.name }))} placeholder="Seleccionar marca" />
                </Field>
                <Field label="Modelo *">
                  <Input value={model} onChange={v => { setModel(v); change(); }} placeholder="Duke, Panigale V4..." />
                </Field>
                <Field label="Versión">
                  <Input value={version} onChange={v => { setVersion(v); change(); }} placeholder="S, R, EVO..." />
                </Field>
                <Field label="Año *">
                  <Select value={year} onChange={v => { setYear(v); change(); }} options={[2023, 2024, 2025, 2026].map(y => ({ value: y.toString(), label: y.toString() }))} />
                </Field>
                <Field label="Categoría *">
                  <Select value={categoryId} onChange={v => { setCategoryId(v); change(); }} options={mockCategories.map(c => ({ value: c.id, label: c.name }))} placeholder="Seleccionar categoría" />
                </Field>
                <Field label="Cilindraje (cc)">
                  <Input type="number" value={displacement} onChange={v => { setDisplacement(v); change(); }} placeholder="399" />
                </Field>
                <Field label="SKU">
                  <Input value={sku} onChange={v => { setSku(v); change(); }} placeholder="KTM-390D-25" />
                </Field>
                <Field label="Estado de disponibilidad">
                  <Select value={status} onChange={v => { setStatus(v as any); change(); }} options={[
                    { value: 'available', label: 'Disponible' }, { value: 'coming_soon', label: 'Próximamente' },
                    { value: 'reserved', label: 'Reservada' }, { value: 'sold_out', label: 'Agotada' },
                  ]} />
                </Field>
              </div>
            </Section>

            <Section title="Precios">
              <div className="grid grid-cols-3 gap-4">
                <Field label="Precio *">
                  <Input type="number" value={price} onChange={v => { setPrice(v); change(); }} placeholder="7800000" />
                </Field>
                <Field label="Precio promocional">
                  <Input type="number" value={promoPrice} onChange={v => { setPromoPrice(v); change(); }} placeholder="7200000" />
                </Field>
                <Field label="Moneda">
                  <Select value="CRC" onChange={() => {}} options={[{ value: 'CRC', label: 'Colones (₡)' }, { value: 'USD', label: 'Dólares ($)' }]} />
                </Field>
              </div>
            </Section>

            <Section title="Configuración">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Mostrar en web', value: published, setter: setPublished },
                  { label: 'Destacada en homepage', value: featured, setter: setFeatured },
                  { label: 'Modelo nuevo', value: isNew, setter: setIsNew },
                  { label: 'Mostrar precio', value: showPrice, setter: setShowPrice },
                  { label: 'Permitir cotización', value: allowQuote, setter: setAllowQuote },
                ].map(cfg => (
                  <label key={cfg.label} className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-zinc-800/40 transition-colors"
                    style={{ borderColor: 'var(--border)' }}>
                    <span className="text-sm text-zinc-300">{cfg.label}</span>
                    <button onClick={() => { cfg.setter((v: boolean) => !v); change(); }}
                      className={`w-10 h-5 rounded-full transition-all relative ${cfg.value ? '' : 'bg-zinc-700'}`}
                      style={cfg.value ? { background: 'var(--primary)' } : {}}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${cfg.value ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </label>
                ))}
              </div>
            </Section>

            <Section title="Descripción">
              <Field label="Descripción corta">
                <textarea value={shortDesc} onChange={e => { setShortDesc(e.target.value); change(); }} rows={2}
                  placeholder="Resumen breve para listados y cards..."
                  className="w-full px-3 py-2 text-sm rounded-lg border outline-none resize-none"
                  style={{ background: 'var(--secondary)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
              </Field>
              <Field label="Descripción completa">
                <textarea value={description} onChange={e => { setDescription(e.target.value); change(); }} rows={5}
                  placeholder="Descripción detallada de la motocicleta..."
                  className="w-full px-3 py-2 text-sm rounded-lg border outline-none resize-none"
                  style={{ background: 'var(--secondary)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
              </Field>
            </Section>
          </div>
        )}

        {/* TAB 2: SPECS */}
        {activeTab === 'specs' && (
          <div className="max-w-3xl space-y-6">
            <Section title="Motor y rendimiento">
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Motor', 'engine', 'LC8c, monocilíndrico...'], ['Cilindraje (cc)', 'displacement', '399'],
                  ['Cilindros', 'cylinders', '1'], ['Potencia (CV / kW)', 'power', '46 CV / 34 kW'],
                  ['Torque (Nm)', 'torque', '39 Nm'], ['Transmisión', 'transmission', '6 velocidades'],
                  ['Refrigeración', 'cooling', 'Líquida'], ['Consumo (L/100km)', 'consumption', '3.8'],
                ].map(([label, key, ph]) => (
                  <Field key={key} label={label}>
                    <Input value={(specs as any)[key]} onChange={v => { setSpecs(p => ({ ...p, [key]: v })); change(); }} placeholder={ph} />
                  </Field>
                ))}
              </div>
            </Section>
            <Section title="Dimensiones y chasis">
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Peso (kg)', 'weight', '179'], ['Altura de asiento (mm)', 'seatHeight', '830'],
                  ['Capacidad tanque (L)', 'tankCapacity', '13.4'], ['Suspensión delantera', 'frontSuspension', 'WP Apex 43mm'],
                  ['Suspensión trasera', 'rearSuspension', 'WP Apex monoshock'], ['Freno delantero', 'frontBrake', '320mm disco, pinza Bybre 4P'],
                  ['Freno trasero', 'rearBrake', '230mm disco, pinza 1P'], ['Neumático delantero', 'frontTire', '110/70-17'],
                  ['Neumático trasero', 'rearTire', '150/60-17'], ['Garantía', 'warranty', '2 años'],
                ].map(([label, key, ph]) => (
                  <Field key={key} label={label}>
                    <Input value={(specs as any)[key]} onChange={v => { setSpecs(p => ({ ...p, [key]: v })); change(); }} placeholder={ph} />
                  </Field>
                ))}
              </div>
            </Section>
            <Section title="Equipamiento electrónico">
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[{ label: 'ABS', key: 'abs' }, { label: 'Control de tracción', key: 'tractionControl' }].map(f => (
                  <label key={f.key} className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-zinc-800/40 transition-colors" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-sm text-zinc-300">{f.label}</span>
                    <button onClick={() => { setSpecs(p => ({ ...p, [f.key]: !(p as any)[f.key] })); change(); }}
                      className={`w-10 h-5 rounded-full transition-all relative ${(specs as any)[f.key] ? '' : 'bg-zinc-700'}`}
                      style={(specs as any)[f.key] ? { background: 'var(--primary)' } : {}}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${(specs as any)[f.key] ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </label>
                ))}
              </div>
              <Field label="Modos de conducción">
                <Input value={specs.ridingModes} onChange={v => { setSpecs(p => ({ ...p, ridingModes: v })); change(); }} placeholder="Sport, Street, Rain..." />
              </Field>
            </Section>
            <Section title="Especificaciones personalizadas">
              <div className="space-y-2 mb-3">
                {customSpecs.map(cs => (
                  <div key={cs.id} className="flex items-center gap-2 p-3 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--secondary)' }}>
                    <GripVertical size={14} className="text-zinc-600 cursor-grab" />
                    <input value={cs.name} onChange={e => setCustomSpecs(prev => prev.map(s => s.id === cs.id ? { ...s, name: e.target.value } : s))}
                      placeholder="Nombre" className="flex-1 bg-transparent text-sm text-zinc-300 outline-none" />
                    <span className="text-zinc-700">·</span>
                    <input value={cs.value} onChange={e => setCustomSpecs(prev => prev.map(s => s.id === cs.id ? { ...s, value: e.target.value } : s))}
                      placeholder="Valor" className="flex-1 bg-transparent text-sm text-zinc-300 outline-none" />
                    <input value={cs.unit} onChange={e => setCustomSpecs(prev => prev.map(s => s.id === cs.id ? { ...s, unit: e.target.value } : s))}
                      placeholder="Unidad" className="w-20 bg-transparent text-sm text-zinc-500 outline-none" />
                    <button onClick={() => setCustomSpecs(prev => prev.filter(s => s.id !== cs.id))} className="text-zinc-600 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
              <button onClick={() => { setCustomSpecs(prev => [...prev, { id: Math.random().toString(36).slice(2), name: '', value: '', unit: '' }]); change(); }}
                className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-dashed transition-colors text-zinc-500 hover:text-zinc-300"
                style={{ borderColor: 'var(--border)' }}>
                <Plus size={14} />Agregar especificación
              </button>
            </Section>
          </div>
        )}

        {/* TAB 3: COLORS & GALLERY — MOST IMPORTANT */}
        {activeTab === 'colors' && (
          <div className="max-w-4xl space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">{colors.length} color{colors.length !== 1 ? 'es' : ''} · {colors.reduce((a, c) => a + c.images.length, 0)} imágenes total</p>
              <button onClick={addColor} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: 'var(--primary)', color: '#000' }}>
                <Plus size={14} />Agregar color
              </button>
            </div>

            {colors.length === 0 && (
              <div className="py-20 text-center rounded-xl border border-dashed" style={{ borderColor: 'var(--border)' }}>
                <Palette size={32} className="mx-auto text-zinc-700 mb-3" />
                <p className="text-sm text-zinc-500">Sin colores. Agrega el primer color.</p>
                <button onClick={addColor} className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ background: 'var(--primary)', color: '#000' }}>
                  <Plus size={14} />Agregar color
                </button>
              </div>
            )}

            {colors.map((color, colorIdx) => (
              <div key={color.id} className="rounded-xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                {/* Color Header */}
                <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-zinc-900/40 transition-colors"
                  onClick={() => setExpandedColor(expandedColor === color.id ? null : color.id)}>
                  <div className="w-7 h-7 rounded-full border-2 border-zinc-700 shrink-0" style={{ background: color.hex }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-200">{color.name}</p>
                    <p className="text-xs text-zinc-500">{color.hex} · {color.images.length} imagen{color.images.length !== 1 ? 'es' : ''}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge status={color.available ? 'available' : 'inactive'} />
                    {color.images.length > 0 && (
                      <button onClick={e => { e.stopPropagation(); setPreviewColor(color.id); setPreviewImageIdx(0); }}
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
                        <Eye size={12} />Vista previa
                      </button>
                    )}
                    <button onClick={e => { e.stopPropagation(); removeColor(color.id); }} className="text-zinc-600 hover:text-red-400 transition-colors p-1.5"><Trash2 size={14} /></button>
                    <ChevronDown size={14} className={`text-zinc-500 transition-transform ${expandedColor === color.id ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Color Editor (expanded) */}
                {expandedColor === color.id && (
                  <div className="border-t px-5 py-5 space-y-5" style={{ borderColor: 'var(--border)' }}>
                    {/* Color fields */}
                    <div className="grid grid-cols-3 gap-4">
                      <Field label="Nombre comercial">
                        <Input value={color.name} onChange={v => updateColor(color.id, { name: v })} placeholder="Electronic Orange" />
                      </Field>
                      <Field label="Código HEX">
                        <div className="flex gap-2 items-center">
                          <div className="w-9 h-9 rounded-lg border shrink-0 overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                            <input type="color" value={color.hex} onChange={e => updateColor(color.id, { hex: e.target.value })}
                              className="w-full h-full cursor-pointer border-0 p-0 outline-none" style={{ background: 'none' }} />
                          </div>
                          <Input value={color.hex} onChange={v => updateColor(color.id, { hex: v })} placeholder="#F97316" />
                        </div>
                      </Field>
                      <Field label="Estado">
                        <div className="flex gap-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <button onClick={() => updateColor(color.id, { available: !color.available })}
                              className={`w-10 h-5 rounded-full transition-all relative ${color.available ? '' : 'bg-zinc-700'}`}
                              style={color.available ? { background: 'var(--primary)' } : {}}>
                              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${color.available ? 'left-5' : 'left-0.5'}`} />
                            </button>
                            <span className="text-sm text-zinc-300">Disponible</span>
                          </label>
                        </div>
                      </Field>
                    </div>

                    {/* Images section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-zinc-200">Galería de imágenes — {color.name}</p>
                        <button onClick={() => addImage(color.id)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-zinc-800"
                          style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}>
                          <Plus size={12} />Agregar vista
                        </button>
                      </div>

                      {color.images.length === 0 ? (
                        <div className="py-10 text-center rounded-lg border border-dashed" style={{ borderColor: 'var(--border)' }}>
                          <Upload size={24} className="mx-auto text-zinc-700 mb-2" />
                          <p className="text-xs text-zinc-500">Sin imágenes. Agrega la primera vista.</p>
                          <button onClick={() => addImage(color.id)} className="mt-3 flex items-center gap-1.5 mx-auto text-xs px-3 py-1.5 rounded-lg transition-colors"
                            style={{ background: 'var(--primary)', color: '#000' }}>
                            <Plus size={12} />Agregar vista
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {color.images.map((img, imgIdx) => (
                            <ImageRow key={img.id} img={img} colorId={color.id} imgIdx={imgIdx} totalImgs={color.images.length}
                              onUpdate={(updates) => updateImage(color.id, img.id, updates)}
                              onRemove={() => removeImage(color.id, img.id)}
                              onSetPrimary={() => setPrimaryImage(color.id, img.id)}
                              onMove={(dir) => moveImage(color.id, img.id, dir)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Gallery Preview Modal */}
            {previewColor && previewColorObj && (
              <GalleryPreview
                color={previewColorObj}
                imageIdx={previewImageIdx}
                setImageIdx={setPreviewImageIdx}
                onClose={() => setPreviewColor(null)}
              />
            )}
          </div>
        )}

        {/* TAB 4: MULTIMEDIA */}
        {activeTab === 'multimedia' && (
          <div className="max-w-3xl space-y-6">
            <Section title="Imágenes principales">
              <div className="grid grid-cols-3 gap-4">
                {['Imagen hero (1920×1080)', 'Imagen card (800×600)', 'Imagen móvil (640×960)'].map(label => (
                  <Field key={label} label={label}>
                    <div className="h-28 rounded-lg border border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-zinc-800/30 transition-colors"
                      style={{ borderColor: 'var(--border)' }}>
                      <Upload size={18} className="text-zinc-600" />
                      <span className="text-xs text-zinc-500">Subir imagen</span>
                    </div>
                  </Field>
                ))}
              </div>
            </Section>
            <Section title="Video">
              <div className="grid grid-cols-2 gap-4">
                <Field label="URL de YouTube"><Input value="" onChange={() => {}} placeholder="https://youtube.com/watch?v=..." /></Field>
                <Field label="Video promocional"><Input value="" onChange={() => {}} placeholder="https://..." /></Field>
              </div>
            </Section>
          </div>
        )}

        {/* TAB 5: SEO */}
        {activeTab === 'seo' && (
          <div className="max-w-3xl space-y-6">
            <Section title="URLs y metadatos">
              <Field label="Slug">
                <div className="flex items-center gap-2 p-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border)', background: 'var(--secondary)' }}>
                  <span className="text-zinc-500 text-xs">motoapexcr.com/motocicletas/</span>
                  <input value={slug} onChange={e => { setSlug(e.target.value); change(); }} placeholder="ktm-390-duke-2025"
                    className="flex-1 bg-transparent text-zinc-200 outline-none text-sm" />
                </div>
              </Field>
              <Field label="Meta title (60 caracteres máx)">
                <Input value={metaTitle} onChange={v => { setMetaTitle(v); change(); }} placeholder="KTM 390 Duke 2025 | MotoApex Costa Rica" />
                <p className="text-xs text-zinc-600 mt-1">{metaTitle.length}/60 caracteres</p>
              </Field>
              <Field label="Meta description (160 caracteres máx)">
                <textarea value={metaDesc} onChange={e => { setMetaDesc(e.target.value); change(); }} rows={3}
                  placeholder="Descubre la KTM 390 Duke 2025 en Costa Rica. Motor monocilíndrico 399cc, equipamiento premium. Disponible en MotoApex."
                  className="w-full px-3 py-2 text-sm rounded-lg border outline-none resize-none"
                  style={{ background: 'var(--secondary)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
                <p className="text-xs text-zinc-600 mt-1">{metaDesc.length}/160 caracteres</p>
              </Field>
              <Field label="Keywords">
                <Input value={keywords} onChange={v => { setKeywords(v); change(); }} placeholder="ktm, 390 duke, naked, costa rica, motocicleta" />
              </Field>
            </Section>

            {/* Google Preview */}
            {(slug || metaTitle || metaDesc) && (
              <Section title="Vista previa en Google">
                <div className="p-4 rounded-lg" style={{ background: 'var(--secondary)' }}>
                  <p className="text-xs text-zinc-500 mb-0.5">motoapexcr.com › motocicletas › {slug || 'ktm-390-duke-2025'}</p>
                  <p className="text-base text-blue-400 hover:underline cursor-pointer">{metaTitle || 'KTM 390 Duke 2025 | MotoApex Costa Rica'}</p>
                  <p className="text-xs text-zinc-400 leading-relaxed mt-1">{metaDesc || 'Descubre la KTM 390 Duke 2025 en Costa Rica. Motor monocilíndrico 399cc, equipamiento premium.'}</p>
                </div>
              </Section>
            )}
          </div>
        )}

        {/* TAB 6: INVENTORY */}
        {activeTab === 'inventory' && (
          <div className="max-w-3xl space-y-6">
            <Section title="Control de inventario">
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--secondary)' }}>
                      {['Color', 'SKU', 'Cantidad', 'Estado', 'Actualizado'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {colors.length === 0 ? (
                      <tr><td colSpan={5} className="py-10 text-center text-xs text-zinc-600">Agrega colores primero</td></tr>
                    ) : colors.map(c => (
                      <tr key={c.id} className="hover:bg-zinc-900/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full" style={{ background: c.hex }} />
                            <span className="text-zinc-300">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-500 mono text-xs">{sku}-{c.name.replace(/\s+/g, '').toUpperCase().slice(0, 3)}</td>
                        <td className="px-4 py-3">
                          <input type="number" defaultValue={0} min={0}
                            className="w-16 px-2 py-1 text-sm rounded border outline-none text-center mono"
                            style={{ background: 'var(--secondary)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
                        </td>
                        <td className="px-4 py-3"><Badge status="available" /></td>
                        <td className="px-4 py-3 text-xs text-zinc-600">Nunca</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>
        )}

        {/* TAB 7: PUBLISH */}
        {activeTab === 'publish' && (
          <div className="max-w-xl space-y-6">
            <Section title="Estado de publicación">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'draft', label: 'Borrador', desc: 'No visible en web' },
                  { value: 'published', label: 'Publicado', desc: 'Visible en el sitio' },
                  { value: 'hidden', label: 'Oculto', desc: 'Desactivado temporalmente' },
                  { value: 'archived', label: 'Archivado', desc: 'Movido al archivo' },
                ].map(opt => (
                  <label key={opt.value} className={`p-4 rounded-xl border cursor-pointer transition-all ${published && opt.value === 'published' ? 'border-orange-500/50' : 'hover:border-zinc-700'}`}
                    style={{ borderColor: published && opt.value === 'published' ? undefined : 'var(--border)', background: published && opt.value === 'published' ? 'rgba(249,115,22,0.05)' : 'var(--secondary)' }}>
                    <div className="flex items-start gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${published && opt.value === 'published' ? 'border-orange-500' : 'border-zinc-600'}`}>
                        {published && opt.value === 'published' && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-200">{opt.label}</p>
                        <p className="text-xs text-zinc-500">{opt.desc}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </Section>
            <Section title="Historial">
              <div className="space-y-3">
                {[
                  { label: 'Creado', value: existingMoto?.createdAt ?? 'Hoy', by: 'Eddier Ramírez' },
                  { label: 'Última modificación', value: existingMoto?.updatedAt ?? '—', by: 'Eddier Ramírez' },
                  { label: 'Fecha publicación', value: published ? 'Hoy' : '—', by: '' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-xs text-zinc-500">{item.label}</span>
                    <div className="text-right">
                      <p className="text-xs text-zinc-300">{item.value}</p>
                      {item.by && <p className="text-xs text-zinc-600">{item.by}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
            <div className="flex flex-col gap-3">
              <button onClick={() => handleSave(false)} className="w-full py-2.5 rounded-lg text-sm font-medium text-zinc-400 border hover:bg-zinc-800 transition-colors" style={{ borderColor: 'var(--border)' }}>
                Guardar borrador
              </button>
              <button onClick={() => handleSave(true)} className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors" style={{ background: 'var(--primary)', color: '#000' }}>
                {published ? 'Actualizar publicación' : 'Publicar ahora'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Unsaved changes modal */}
      <ConfirmModal
        open={showExitConfirm}
        title="Cambios sin guardar"
        message="Tienes cambios sin guardar. ¿Deseas salir sin guardar?"
        confirmLabel="Salir"
        danger
        onConfirm={() => navigate('motorcycles')}
        onCancel={() => setShowExitConfirm(false)}
      />
    </div>
  );
}

/* ── Image Row Component ── */
function ImageRow({ img, colorId, imgIdx, totalImgs, onUpdate, onRemove, onSetPrimary, onMove }: {
  img: MotorcycleImage; colorId: string; imgIdx: number; totalImgs: number;
  onUpdate: (u: Partial<MotorcycleImage>) => void; onRemove: () => void;
  onSetPrimary: () => void; onMove: (dir: 'up' | 'down') => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.match(/^image\//)) return;
    if (file.size > 10 * 1024 * 1024) { alert('Imagen demasiado pesada (máx 10MB)'); return; }
    const url = URL.createObjectURL(file);
    onUpdate({ url });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--secondary)' }}>
      {/* Drag handle + order */}
      <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
        <GripVertical size={14} className="text-zinc-600 cursor-grab" />
        <div className="flex flex-col gap-0.5">
          <button onClick={() => onMove('up')} disabled={imgIdx === 0} className="text-zinc-700 hover:text-zinc-400 disabled:opacity-30 transition-colors"><ArrowLeft size={10} className="rotate-90" /></button>
          <button onClick={() => onMove('down')} disabled={imgIdx === totalImgs - 1} className="text-zinc-700 hover:text-zinc-400 disabled:opacity-30 transition-colors"><ArrowRight size={10} className="rotate-90" /></button>
        </div>
      </div>

      {/* Image upload area */}
      <div className={`w-24 h-20 rounded-lg border flex flex-col items-center justify-center shrink-0 overflow-hidden relative cursor-pointer transition-all ${dragging ? 'border-orange-500' : ''}`}
        style={{ borderColor: dragging ? undefined : 'var(--border)', background: 'var(--card)' }}
        onClick={() => !img.url && fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        {img.url ? (
          <>
            <img src={img.url} alt={img.alt} className="w-full h-full" style={{ objectFit: 'contain' }} />
            <button onClick={e => { e.stopPropagation(); onUpdate({ url: '' }); }}
              className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'rgba(0,0,0,0.7)' }}>
              <X size={10} className="text-white" />
            </button>
          </>
        ) : (
          <>
            <Upload size={16} className="text-zinc-600 mb-1" />
            <span className="text-xs text-zinc-600">Subir</span>
          </>
        )}
      </div>

      {/* Fields */}
      <div className="flex-1 grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-zinc-600 mb-1 block">Nombre de vista</label>
          <input value={img.label} onChange={e => onUpdate({ label: e.target.value })} placeholder="Vista frontal"
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
        </div>
        <div>
          <label className="text-xs text-zinc-600 mb-1 block">Texto alternativo (ALT)</label>
          <input value={img.alt} onChange={e => onUpdate({ alt: e.target.value })} placeholder="KTM 390 Duke naranja vista frontal"
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center gap-2 shrink-0 pt-1">
        <button onClick={onSetPrimary} title="Imagen principal"
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${img.isPrimary ? 'text-black' : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800'}`}
          style={img.isPrimary ? { background: 'var(--primary)' } : {}}>
          <Star size={13} />
        </button>
        <button onClick={onRemove} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-500/5 transition-colors">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

/* ── Gallery Preview Component ── */
function GalleryPreview({ color, imageIdx, setImageIdx, onClose }: {
  color: MotorcycleColor; imageIdx: number; setImageIdx: (i: number) => void; onClose: () => void;
}) {
  const images = color.images.filter(i => i.url);
  const current = images[imageIdx];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.92)' }} onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col border"
        style={{ background: '#ffffff', borderColor: 'var(--border)', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full" style={{ background: color.hex }} />
            <span className="text-sm font-medium text-zinc-200">{color.name}</span>
            <span className="text-xs text-zinc-500">{imageIdx + 1} / {images.length}</span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors"><X size={18} /></button>
        </div>

        {/* Main image — object-fit: contain, never crops or stretches */}
        <div className="relative flex-1 flex items-center justify-center" style={{ minHeight: 0, background: '#f8f8f9' }}>
          {current ? (
            <img src={current.url} alt={current.alt}
              style={{ maxWidth: '100%', maxHeight: '400px', width: 'auto', height: 'auto', objectFit: 'contain', display: 'block' }} />
          ) : (
            <p className="text-zinc-600 text-sm">Sin imagen</p>
          )}
          {images.length > 1 && (
            <>
              <button onClick={() => setImageIdx(Math.max(0, imageIdx - 1))} disabled={imageIdx === 0}
                className="absolute left-3 w-9 h-9 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
                style={{ background: color.hex + 'cc' }}>
                <ArrowLeft size={16} className="text-white" />
              </button>
              <button onClick={() => setImageIdx(Math.min(images.length - 1, imageIdx + 1))} disabled={imageIdx === images.length - 1}
                className="absolute right-3 w-9 h-9 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
                style={{ background: color.hex + 'cc' }}>
                <ArrowRight size={16} className="text-white" />
              </button>
            </>
          )}
        </div>

        {/* Image label */}
        {current && (
          <div className="px-5 py-2 text-center shrink-0">
            <p className="text-xs text-zinc-500">{current.label}</p>
          </div>
        )}

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 px-5 py-4 overflow-x-auto shrink-0 border-t" style={{ borderColor: 'var(--border)' }}>
            {images.map((img, i) => (
              <button key={img.id} onClick={() => setImageIdx(i)}
                className={`w-14 h-10 rounded-lg overflow-hidden shrink-0 border-2 transition-all flex items-center justify-center`}
                style={{ borderColor: i === imageIdx ? color.hex : 'transparent', background: '#f4f4f5' }}>
                <img src={img.url} alt={img.alt} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Shared UI components ── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-5" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
      <h3 className="text-sm font-semibold text-zinc-300 mb-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-3 py-2 text-sm rounded-lg border outline-none transition-colors"
      style={{ background: 'var(--secondary)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
  );
}

function Select({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full appearance-none px-3 pr-8 py-2 text-sm rounded-lg border outline-none cursor-pointer"
        style={{ background: 'var(--secondary)', borderColor: 'var(--border)', color: value ? 'var(--foreground)' : '#71717a' }}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
    </div>
  );
}
