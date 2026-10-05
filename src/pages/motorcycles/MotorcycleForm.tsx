import { useState, useCallback, useEffect } from "react"

import {
  ChevronLeft,
  Save,
  Eye,
  Globe,
  Plus,
  Trash2,
  GripVertical,
  Upload,
  X,
  Star,
  Check,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Palette,
} from "lucide-react"

import { useApp } from "../../context/AppContext"

import { list, detail, save, errorMessage } from "../../lib/api"

import { useRemote } from "../../lib/useRemote"

import { validateMotorcycle, replaceDocument } from "../../lib/validation"

import { RemoteState, Pending } from "../../components/ui/RemoteState"

import { Badge } from "../../components/ui/Badge"

import { ConfirmModal } from "../../components/ui/Modal"

import type {
  Brand,
  Category,
  Motorcycle,
  Specification,
  MotorcycleColor,
  MotorcycleImage,
} from "../../types"

const TABS = [
  { id: "general", label: "General" },

  { id: "specs", label: "Especificaciones" },

  { id: "colors", label: "Colores y Galerías" },

  { id: "multimedia", label: "Multimedia" },

  { id: "seo", label: "SEO" },

  { id: "inventory", label: "Inventario" },

  { id: "publish", label: "Publicación" },
]

export function MotorcycleForm() {
  const { pageParams } = useApp()

  const remote = useRemote(
    async (signal) => {
      const [brands, categories, motorcycle] = await Promise.all([
        list("brands", signal),
        list("categories", signal),
        pageParams.id
          ? detail("motorcycles", pageParams.id, signal)
          : Promise.resolve(null),
      ])

      return { brands, categories, motorcycle }
    },
    [pageParams.id],
  )

  const [saved, setSaved] = useState(0)

  if (remote.loading || remote.error)
    return (
      <RemoteState
        loading={remote.loading}
        error={remote.error}
        retry={remote.reload}
      />
    )

  if (!remote.data) return null

  return (
    <MotorcycleEditor
      key={`${pageParams.id || "new"}-${saved}`}
      brands={remote.data.brands}
      categories={remote.data.categories}
      existingMoto={remote.data.motorcycle}
      onSaved={(m) => {
        remote.setData({ ...remote.data!, motorcycle: m })
        setSaved((v) => v + 1)
      }}
    />
  )
}

function MotorcycleEditor({
  brands,
  categories,
  existingMoto,
  onSaved,
}: {
  brands: Brand[]
  categories: Category[]
  existingMoto: Motorcycle | null
  onSaved: (m: Motorcycle) => void
}) {
  const { navigate, pageParams, addToast, can } = useApp()

  const mode = pageParams.mode ?? "create"

  const readonly = mode === "view" || !can("motorcycles.write")

  const [busy, setBusy] = useState(false)

  const [error, setError] = useState("")

  const [activeTab, setActiveTab] = useState(pageParams.tab || "general")

  const [hasChanges, setHasChanges] = useState(false)

  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const [autoSaved, setAutoSaved] = useState(false)

  // General

  const [brandId, setBrandId] = useState(existingMoto?.brandId ?? "")

  const [model, setModel] = useState(existingMoto?.model ?? "")

  const [version, setVersion] = useState(existingMoto?.version ?? "")

  const [year, setYear] = useState(
    existingMoto?.year?.toString() ?? new Date().getFullYear().toString(),
  )

  const [categoryId, setCategoryId] = useState(existingMoto?.categoryId ?? "")

  const [displacement, setDisplacement] = useState(
    existingMoto?.displacement?.toString() ?? "",
  )

  const [currency, setCurrency] = useState<"CRC" | "USD">(
    existingMoto?.currency ?? "CRC",
  )

  const [inventory, setInventory] = useState(
    existingMoto?.inventory?.toString() ?? "0",
  )

  const [hp, setHp] = useState(existingMoto?.hp?.toString() ?? "0")

  const [tagline, setTagline] = useState(existingMoto?.tagline ?? "")

  const [specRows, setSpecRows] = useState<Specification[]>(
    existingMoto?.specs ?? [],
  )

  const [price, setPrice] = useState(existingMoto?.price?.toString() ?? "")

  const [promoPrice, setPromoPrice] = useState(
    existingMoto?.promoPrice?.toString() ?? "",
  )

  const [sku, setSku] = useState(existingMoto?.sku ?? "")

  const [status, setStatus] = useState(existingMoto?.status ?? "available")

  const [published, setPublished] = useState(existingMoto?.published ?? false)

  const [featured, setFeatured] = useState(existingMoto?.featured ?? false)

  const [isNew, setIsNew] = useState(existingMoto?.isNew ?? false)

  const [showPrice, setShowPrice] = useState(existingMoto?.showPrice ?? true)

  const [allowQuote, setAllowQuote] = useState(existingMoto?.allowQuote ?? true)

  const [shortDesc, setShortDesc] = useState(
    existingMoto?.shortDescription ?? "",
  )

  const [description, setDescription] = useState(
    existingMoto?.description ?? "",
  )

  // Colors

  const [colors, setColors] = useState<MotorcycleColor[]>(
    existingMoto?.colors ?? [],
  )

  const [expandedColor, setExpandedColor] = useState<string | null>(null)

  const [previewColor, setPreviewColor] = useState<string | null>(null)

  const [previewImageIdx, setPreviewImageIdx] = useState(0)

  const [slug, setSlug] = useState(existingMoto?.slug ?? "")

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [hasChanges])

  const change = useCallback(() => {
    setHasChanges(true)
    setAutoSaved(false)
  }, [])

  const handleBack = () => {
    if (hasChanges) setShowExitConfirm(true)
    else navigate("motorcycles")
  }

  const handleSave = async (publish?: boolean) => {
    if (busy || readonly) return

    const document = replaceDocument(existingMoto ?? {} as Motorcycle, {
      brandId,
      model,
      version,
      year: Number(year),
      categoryId,
      displacement: Number(displacement),

      price: Number(price),
      promoPrice: promoPrice.trim() === "" ? null : Number(promoPrice),
      currency,

      inventory: Number(inventory),
      hp: Number(hp),
      tagline,
      sku,
      status: status as Motorcycle["status"],

      published: publish ?? published,
      featured,
      isNew,
      showPrice,
      allowQuote,

      shortDescription: shortDesc,
      description,
      colors,
      specs: specRows,
      slug,
    })

    setError("")

    try {
      if (
        document.published !== (existingMoto?.published ?? false) &&
        !can("motorcycles.publish")
      )
        throw new Error(
          "Publicar o retirar publicación requiere motorcycles.publish.",
        )

      if (!price.trim() || !year.trim() || !inventory.trim())
        throw new Error("Completa año, precio e inventario.")

      validateMotorcycle(document)
      setBusy(true)

      const result = await save("motorcycles", document, existingMoto?.id)

      addToast("success", "Motocicleta guardada")
      setHasChanges(false)
      setAutoSaved(true)
      onSaved(result)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  // Color management

  const addColor = () => {
    if (colors.length >= 30) {
      setError("Máximo 30 colores por ficha.")
      return
    }

    const id = crypto.randomUUID()

    const newColor: MotorcycleColor = {
      id,
      name: "Color nuevo",
      hex: "#3b82f6",
      status: "active",
      available: true,
      order: colors.length + 1,
      images: [],
    }

    setColors((prev) => [...prev, newColor])

    setExpandedColor(id)

    change()
  }

  const updateColor = (id: string, updates: Partial<MotorcycleColor>) => {
    setColors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    )

    change()
  }

  const removeColor = (id: string) => {
    setColors((prev) => prev.filter((c) => c.id !== id))

    change()
  }

  const addImage = (colorId: string) => {
    if ((colors.find((c) => c.id === colorId)?.images.length ?? 0) >= 30) {
      setError("Máximo 30 imágenes por color.")
      return
    }

    const id = crypto.randomUUID()

    const newImg: MotorcycleImage = {
      id,
      url: "",
      label: `Vista ${(colors.find((c) => c.id === colorId)?.images.length ?? 0) + 1}`,

      alt: "",
      order: (colors.find((c) => c.id === colorId)?.images.length ?? 0) + 1,
      isPrimary: colors.find((c) => c.id === colorId)?.images.length === 0,
    }

    setColors((prev) =>
      prev.map((c) =>
        c.id === colorId ? { ...c, images: [...c.images, newImg] } : c,
      ),
    )

    change()
  }

  const updateImage = (
    colorId: string,
    imgId: string,
    updates: Partial<MotorcycleImage>,
  ) => {
    setColors((prev) =>
      prev.map((c) =>
        c.id === colorId
          ? {
              ...c,
              images: c.images.map((img) =>
                img.id === imgId ? { ...img, ...updates } : img,
              ),
            }
          : c,
      ),
    )

    change()
  }

  const removeImage = (colorId: string, imgId: string) => {
    setColors((prev) =>
      prev.map((c) =>
        c.id === colorId
          ? { ...c, images: c.images.filter((i) => i.id !== imgId) }
          : c,
      ),
    )

    change()
  }

  const setPrimaryImage = (colorId: string, imgId: string) => {
    setColors((prev) =>
      prev.map((c) =>
        c.id === colorId
          ? {
              ...c,
              images: c.images.map((img) => ({
                ...img,
                isPrimary: img.id === imgId,
              })),
            }
          : c,
      ),
    )

    change()
  }

  const moveImage = (colorId: string, imgId: string, dir: "up" | "down") => {
    setColors((prev) =>
      prev.map((c) => {
        if (c.id !== colorId) return c

        const imgs = [...c.images]

        const idx = imgs.findIndex((i) => i.id === imgId)

        if (dir === "up" && idx > 0)
          [imgs[idx - 1], imgs[idx]] = [imgs[idx], imgs[idx - 1]]

        if (dir === "down" && idx < imgs.length - 1)
          [imgs[idx], imgs[idx + 1]] = [imgs[idx + 1], imgs[idx]]

        return {
          ...c,
          images: imgs.map((img, i) => ({ ...img, order: i + 1 })),
        }
      }),
    )

    change()
  }

  const previewColorObj = colors.find((c) => c.id === previewColor)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Sub-header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b shrink-0"
        style={{ borderColor: "var(--border)", background: "var(--card)" }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ChevronLeft size={16} />
            Motocicletas
          </button>
          <div className="w-px h-4 bg-zinc-800" />
          <div>
            <p className="text-sm font-semibold text-zinc-200">
              {mode === "create"
                ? "Nueva motocicleta"
                : `${existingMoto?.brand} ${existingMoto?.model} ${existingMoto?.version}`}
            </p>
            <p className="text-xs text-zinc-600 flex items-center gap-1.5 mt-0.5">
              {autoSaved ? (
                <>
                  <Check size={11} className="text-green-400" />
                  <span className="text-green-400">Guardado</span>
                </>
              ) : hasChanges ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
                  <span className="text-orange-400">Cambios sin guardar</span>
                </>
              ) : (
                <span>Sin cambios</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={busy || readonly}
            onClick={() => void handleSave()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          >
            <Save size={14} />
            Guardar ficha
          </button>
          <button
            disabled={busy || readonly || !can("motorcycles.publish")}
            onClick={() => void handleSave(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: "var(--primary)", color: "#000" }}
          >
            <Globe size={14} />
            Publicar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex border-b shrink-0 px-6 overflow-x-auto"
        style={{ borderColor: "var(--border)", background: "var(--card)" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <RemoteState error={error} />}
      {busy && (
        <p role="status" className="px-6 text-sm text-zinc-500">
          Guardando…
        </p>
      )}
      {readonly && <p className="px-6 text-sm text-zinc-500">Solo lectura</p>}
      {/* Content */}
      <fieldset
        disabled={readonly || busy}
        className="flex-1 min-h-0 overflow-y-auto p-6"
      >
        {/* TAB 1: GENERAL */}
        {activeTab === "general" && (
          <div className="max-w-3xl space-y-6">
            <Section title="Identificación">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Marca *">
                  <Select
                    value={brandId}
                    onChange={(v) => {
                      setBrandId(v)
                      if (
                        categories.find((c) => c.id === categoryId)?.brandId &&
                        categories.find((c) => c.id === categoryId)?.brandId !==
                          v
                      )
                        setCategoryId("")
                      change()
                    }}
                    options={brands.map((b) => ({
                      value: b.id,
                      label: b.name,
                    }))}
                    placeholder="Seleccionar marca"
                  />
                </Field>
                <Field label="Modelo *">
                  <Input
                    value={model}
                    onChange={(v) => {
                      setModel(v)
                      change()
                    }}
                    placeholder="Duke, Panigale V4..."
                  />
                </Field>
                <Field label="Versión">
                  <Input
                    value={version}
                    onChange={(v) => {
                      setVersion(v)
                      change()
                    }}
                    placeholder="S, R, EVO..."
                  />
                </Field>
                <Field label="Año *">
                  <Input
                    value={year}
                    onChange={(v) => {
                      setYear(v)
                      change()
                    }}
                    type="number"
                  />
                </Field>
                <Field label="Categoría *">
                  <Select
                    value={categoryId}
                    onChange={(v) => {
                      setCategoryId(v)
                      change()
                    }}
                    options={categories
                      .filter((c) => !c.brandId || c.brandId === brandId)
                      .map((c) => ({ value: c.id, label: c.name }))}
                    placeholder="Seleccionar categoría"
                  />
                </Field>
                <Field label="Slug *">
                  <Input
                    value={slug}
                    onChange={(v) => {
                      setSlug(v)
                      change()
                    }}
                    placeholder="ktm-390-duke-2026"
                  />
                </Field>
                <Field label="Potencia (hp)">
                  <Input
                    value={hp}
                    type="number"
                    onChange={(v) => {
                      setHp(v)
                      change()
                    }}
                  />
                </Field>
                <Field label="Tagline">
                  <Input
                    value={tagline}
                    onChange={(v) => {
                      setTagline(v)
                      change()
                    }}
                  />
                </Field>
                <Field label="Cilindraje (cc)">
                  <Input
                    type="number"
                    value={displacement}
                    onChange={(v) => {
                      setDisplacement(v)
                      change()
                    }}
                    placeholder="399"
                  />
                </Field>
                <Field label="SKU">
                  <Input
                    value={sku}
                    onChange={(v) => {
                      setSku(v)
                      change()
                    }}
                    placeholder="KTM-390D-25"
                  />
                </Field>
                <Field label="Estado de disponibilidad">
                  <Select
                    value={status}
                    onChange={(v) => {
                      setStatus(v as any)
                      change()
                    }}
                    options={[
                      { value: "available", label: "Disponible" },
                      { value: "coming_soon", label: "Próximamente" },

                      { value: "reserved", label: "Reservada" },
                      { value: "sold_out", label: "Agotada" },
                    ]}
                  />
                </Field>
              </div>
            </Section>

            <Section title="Precios">
              <div className="grid grid-cols-3 gap-4">
                <Field label="Precio *">
                  <Input
                    type="number"
                    value={price}
                    onChange={(v) => {
                      setPrice(v)
                      change()
                    }}
                    placeholder="7800000"
                  />
                </Field>
                <Field label="Precio promocional">
                  <Input
                    type="number"
                    value={promoPrice}
                    onChange={(v) => {
                      setPromoPrice(v)
                      change()
                    }}
                    placeholder="7200000"
                  />
                </Field>
                <Field label="Moneda">
                  <Select
                    value={currency}
                    onChange={(v) => {
                      setCurrency(v as "CRC" | "USD")
                      change()
                    }}
                    options={[
                      { value: "CRC", label: "Colones (₡)" },
                      { value: "USD", label: "Dólares ($)" },
                    ]}
                  />
                </Field>
              </div>
            </Section>

            <Section title="Configuración">
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Mostrar en web",
                    value: published,
                    setter: setPublished,
                  },

                  {
                    label: "Destacada en homepage",
                    value: featured,
                    setter: setFeatured,
                  },

                  { label: "Modelo nuevo", value: isNew, setter: setIsNew },

                  {
                    label: "Mostrar precio",
                    value: showPrice,
                    setter: setShowPrice,
                  },

                  {
                    label: "Permitir cotización",
                    value: allowQuote,
                    setter: setAllowQuote,
                  },
                ].map((cfg) => (
                  <label
                    key={cfg.label}
                    className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-zinc-800/40 transition-colors"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <span className="text-sm text-zinc-300">{cfg.label}</span>
                    <button
                      aria-label={cfg.label}
                      disabled={
                        cfg.setter === setPublished &&
                        !can("motorcycles.publish")
                      }
                      onClick={() => {
                        cfg.setter((v: boolean) => !v)
                        change()
                      }}
                      className={`w-10 h-5 rounded-full transition-all relative ${
                        cfg.value ? "" : "bg-zinc-700"
                      }`}
                      style={cfg.value ? { background: "var(--primary)" } : {}}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                          cfg.value ? "left-5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </label>
                ))}
              </div>
            </Section>

            <Section title="Descripción">
              <Field label="Descripción corta">
                <textarea
                  value={shortDesc}
                  onChange={(e) => {
                    setShortDesc(e.target.value)
                    change()
                  }}
                  rows={2}
                  placeholder="Resumen breve para listados y cards..."
                  className="w-full px-3 py-2 text-sm rounded-lg border outline-none resize-none"
                  style={{
                    background: "var(--secondary)",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                  }}
                />
              </Field>
              <Field label="Descripción completa">
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)
                    change()
                  }}
                  rows={5}
                  placeholder="Descripción detallada de la motocicleta..."
                  className="w-full px-3 py-2 text-sm rounded-lg border outline-none resize-none"
                  style={{
                    background: "var(--secondary)",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                  }}
                />
              </Field>
            </Section>
          </div>
        )}

        {/* TAB 2: SPECS */}
        {activeTab === "specs" && (
          <div className="max-w-3xl space-y-6">
            <Section title="Especificaciones técnicas y personalizadas">
              <p className="text-xs text-zinc-500 mb-4">
                Grupo, nombre y valor. Hasta 100 especificaciones.
              </p>
              <div className="space-y-3">
                {specRows.map((row, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      value={row.group}
                      placeholder="Motor"
                      onChange={(v) => {
                        setSpecRows((prev) =>
                          prev.map((s, n) =>
                            n === i ? { ...s, group: v } : s,
                          ),
                        )
                        change()
                      }}
                    />
                    <Input
                      value={row.label}
                      placeholder="Potencia"
                      onChange={(v) => {
                        setSpecRows((prev) =>
                          prev.map((s, n) =>
                            n === i ? { ...s, label: v } : s,
                          ),
                        )
                        change()
                      }}
                    />
                    <Input
                      value={row.value}
                      placeholder="44 hp"
                      onChange={(v) => {
                        setSpecRows((prev) =>
                          prev.map((s, n) =>
                            n === i ? { ...s, value: v } : s,
                          ),
                        )
                        change()
                      }}
                    />
                    <button
                      aria-label="Eliminar especificación"
                      onClick={() => {
                        setSpecRows((prev) => prev.filter((_, n) => n !== i))
                        change()
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                disabled={specRows.length >= 100}
                onClick={() => {
                  setSpecRows((prev) => [
                    ...prev,
                    { group: "General", label: "", value: "" },
                  ])
                  change()
                }}
                className="mt-4 flex items-center gap-2 border border-dashed rounded-lg p-3 text-sm"
              >
                <Plus size={14} />
                Agregar especificación
              </button>
            </Section>
          </div>
        )}

        {/* TAB 3: COLORS & GALLERY — MOST IMPORTANT */}
        {activeTab === "colors" && (
          <div className="max-w-4xl space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">
                {colors.length} color{colors.length !== 1 ? "es" : ""} ·{" "}
                {colors.reduce((a, c) => a + c.images.length, 0)} imágenes total
              </p>
              <button
                onClick={addColor}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: "var(--primary)", color: "#000" }}
              >
                <Plus size={14} />
                Agregar color
              </button>
            </div>

            {colors.length === 0 && (
              <div
                className="py-20 text-center rounded-xl border border-dashed"
                style={{ borderColor: "var(--border)" }}
              >
                <Palette size={32} className="mx-auto text-zinc-700 mb-3" />
                <p className="text-sm text-zinc-500">
                  Sin colores. Agrega el primer color.
                </p>
                <button
                  onClick={addColor}
                  className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ background: "var(--primary)", color: "#000" }}
                >
                  <Plus size={14} />
                  Agregar color
                </button>
              </div>
            )}

            {colors.map((color, colorIdx) => (
              <div
                key={color.id}
                className="rounded-xl border overflow-hidden"
                style={{
                  background: "var(--card)",
                  borderColor: "var(--border)",
                }}
              >
                {/* Color Header */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-zinc-900/40 transition-colors"
                  onClick={() =>
                    setExpandedColor(
                      expandedColor === color.id ? null : color.id,
                    )
                  }
                >
                  <div
                    className="w-7 h-7 rounded-full border-2 border-zinc-700 shrink-0"
                    style={{ background: color.hex }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-200">
                      {color.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {color.hex} · {color.images.length} imagen
                      {color.images.length !== 1 ? "es" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      status={color.available ? "available" : "inactive"}
                    />
                    {color.images.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setPreviewColor(color.id)
                          setPreviewImageIdx(0)
                        }}
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                      >
                        <Eye size={12} />
                        Vista previa
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeColor(color.id)
                      }}
                      className="text-zinc-600 hover:text-red-400 transition-colors p-1.5"
                    >
                      <Trash2 size={14} />
                    </button>
                    <ChevronDown
                      size={14}
                      className={`text-zinc-500 transition-transform ${
                        expandedColor === color.id ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>

                {/* Color Editor (expanded) */}
                {expandedColor === color.id && (
                  <div
                    className="border-t px-5 py-5 space-y-5"
                    style={{ borderColor: "var(--border)" }}
                  >
                    {/* Color fields */}
                    <div className="grid grid-cols-3 gap-4">
                      <Field label="Nombre comercial">
                        <Input
                          value={color.name}
                          onChange={(v) => updateColor(color.id, { name: v })}
                          placeholder="Electronic Orange"
                        />
                      </Field>
                      <Field label="Código HEX">
                        <div className="flex gap-2 items-center">
                          <div
                            className="w-9 h-9 rounded-lg border shrink-0 overflow-hidden"
                            style={{ borderColor: "var(--border)" }}
                          >
                            <input
                              type="color"
                              value={color.hex}
                              onChange={(e) =>
                                updateColor(color.id, { hex: e.target.value })
                              }
                              className="w-full h-full cursor-pointer border-0 p-0 outline-none"
                              style={{ background: "none" }}
                            />
                          </div>
                          <Input
                            value={color.hex}
                            onChange={(v) => updateColor(color.id, { hex: v })}
                            placeholder="#F97316"
                          />
                        </div>
                      </Field>
                      <Field label="Estado">
                        <div className="flex gap-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <button
                              onClick={() =>
                                updateColor(color.id, {
                                  available: !color.available,
                                })
                              }
                              className={`w-10 h-5 rounded-full transition-all relative ${
                                color.available ? "" : "bg-zinc-700"
                              }`}
                              style={
                                color.available
                                  ? { background: "var(--primary)" }
                                  : {}
                              }
                            >
                              <span
                                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                                  color.available ? "left-5" : "left-0.5"
                                }`}
                              />
                            </button>
                            <span className="text-sm text-zinc-300">
                              Disponible
                            </span>
                          </label>
                        </div>
                      </Field>
                    </div>

                    {/* Images section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-zinc-200">
                          Galería de imágenes — {color.name}
                        </p>
                        <button
                          onClick={() => addImage(color.id)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-zinc-800"
                          style={{
                            borderColor: "var(--border)",
                            color: "var(--primary)",
                          }}
                        >
                          <Plus size={12} />
                          Agregar vista
                        </button>
                      </div>

                      {color.images.length === 0 ? (
                        <div
                          className="py-10 text-center rounded-lg border border-dashed"
                          style={{ borderColor: "var(--border)" }}
                        >
                          <Upload
                            size={24}
                            className="mx-auto text-zinc-700 mb-2"
                          />
                          <p className="text-xs text-zinc-500">
                            Sin imágenes. Agrega la primera vista.
                          </p>
                          <button
                            onClick={() => addImage(color.id)}
                            className="mt-3 flex items-center gap-1.5 mx-auto text-xs px-3 py-1.5 rounded-lg transition-colors"
                            style={{
                              background: "var(--primary)",
                              color: "#000",
                            }}
                          >
                            <Plus size={12} />
                            Agregar vista
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {color.images.map((img, imgIdx) => (
                            <ImageRow
                              key={img.id}
                              img={img}
                              colorId={color.id}
                              imgIdx={imgIdx}
                              totalImgs={color.images.length}
                              onUpdate={(updates) =>
                                updateImage(color.id, img.id, updates)
                              }
                              onRemove={() => removeImage(color.id, img.id)}
                              onSetPrimary={() =>
                                setPrimaryImage(color.id, img.id)
                              }
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

        {activeTab === "multimedia" && (
          <Pending title="Hero, card, móvil y videos; utiliza galerías por color para las fotos" />
        )}
        {activeTab === "seo" && (
          <div className="max-w-3xl">
            <Section title="URL de la motocicleta">
              <Field label="Slug">
                <Input
                  value={slug}
                  onChange={(v) => {
                    setSlug(v)
                    change()
                  }}
                />
              </Field>
              <p className="mt-4 text-sm text-zinc-500">
                Meta title, meta description y keywords pendientes de API. Se
                conservan los campos devueltos por el servidor.
              </p>
            </Section>
          </div>
        )}
        {activeTab === "inventory" && (
          <div className="max-w-3xl">
            <Section title="Control de inventario">
              <Field label="Cantidad total">
                <Input
                  type="number"
                  value={inventory}
                  onChange={(v) => {
                    setInventory(v)
                    change()
                  }}
                />
              </Field>
              <p className="mt-4 text-sm text-zinc-500">
                La API v1 guarda el total por moto. Inventario distribuido por
                color, reservas y movimientos requieren endpoints adicionales;
                el servidor rechazará ajustes incompatibles.
              </p>
            </Section>
          </div>
        )}
        {activeTab === "publish" && (
          <div className="max-w-xl space-y-6">
            <Section title="Estado de publicación">
              <label className="flex gap-3 text-sm">
                <input
                  type="checkbox"
                  disabled={!can("motorcycles.publish")}
                  checked={published}
                  onChange={(e) => {
                    setPublished(e.target.checked)
                    change()
                  }}
                />
                Publicada en web
              </label>
              <p className="mt-3 text-xs text-zinc-500">
                Cambiar publicación requiere motorcycles.publish. Una ficha
                guardada conserva su estado.
              </p>
            </Section>
            <Section title="Historial">
              <p className="text-sm text-zinc-500">
                Creada: {existingMoto?.createdAt || "Sin guardar"}
              </p>
              <p className="text-sm text-zinc-500">
                Actualizada: {existingMoto?.updatedAt || "Sin guardar"}
              </p>
            </Section>
          </div>
        )}
      </fieldset>

      {/* Unsaved changes modal */}
      <ConfirmModal
        open={showExitConfirm}
        title="Cambios sin guardar"
        message="Tienes cambios sin guardar. ¿Deseas salir sin guardar?"
        confirmLabel="Salir"
        danger
        onConfirm={() => navigate("motorcycles")}
        onCancel={() => setShowExitConfirm(false)}
      />
    </div>
  )
}

/* ── Image Row Component ── */

function ImageRow({
  img,
  colorId,
  imgIdx,
  totalImgs,
  onUpdate,
  onRemove,
  onSetPrimary,
  onMove,
}: {
  img: MotorcycleImage
  colorId: string
  imgIdx: number
  totalImgs: number

  onUpdate: (u: Partial<MotorcycleImage>) => void
  onRemove: () => void

  onSetPrimary: () => void
  onMove: (dir: "up" | "down") => void
}) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl border"
      style={{ borderColor: "var(--border)", background: "var(--secondary)" }}
    >
      <div className="flex flex-col gap-2">
        <button
          aria-label="Subir foto"
          disabled={imgIdx === 0}
          onClick={() => onMove("up")}
        >
          <ArrowLeft size={14} />
        </button>
        <button
          aria-label="Bajar foto"
          disabled={imgIdx === totalImgs - 1}
          onClick={() => onMove("down")}
        >
          <ArrowRight size={14} />
        </button>
      </div>
      <div className="w-24 h-20 rounded-lg overflow-hidden bg-card">
        {img.url.startsWith("https://") && (
          <img
            src={img.url}
            alt={img.alt}
            className="w-full h-full object-contain"
          />
        )}
      </div>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
        <Field label="Enlace HTTPS">
          <Input
            value={img.url}
            onChange={(v) => onUpdate({ url: v })}
            placeholder="https://…"
          />
        </Field>
        <Field label="Nombre de vista">
          <Input value={img.label} onChange={(v) => onUpdate({ label: v })} />
        </Field>
        <Field label="Texto alternativo">
          <Input value={img.alt} onChange={(v) => onUpdate({ alt: v })} />
        </Field>
      </div>
      <div className="flex flex-col gap-3">
        <button
          aria-label="Imagen principal"
          title="Imagen principal"
          onClick={onSetPrimary}
          style={{
            color: img.isPrimary ? "var(--primary)" : "var(--muted-foreground)",
          }}
        >
          <Star size={16} />
        </button>
        <button aria-label="Eliminar foto" onClick={onRemove}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

/* ── Gallery Preview Component ── */

function GalleryPreview({
  color,
  imageIdx,
  setImageIdx,
  onClose,
}: {
  color: MotorcycleColor
  imageIdx: number
  setImageIdx: (i: number) => void
  onClose: () => void
}) {
  const images = color.images.filter((i) => i.url)

  const current = images[imageIdx]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.92)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col border"
        style={{
          background: "#ffffff",
          borderColor: "var(--border)",
          maxHeight: "90vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-5 h-5 rounded-full"
              style={{ background: color.hex }}
            />
            <span className="text-sm font-medium text-zinc-200">
              {color.name}
            </span>
            <span className="text-xs text-zinc-500">
              {imageIdx + 1} / {images.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Main image — object-fit: contain, never crops or stretches */}
        <div
          className="relative flex-1 flex items-center justify-center"
          style={{ minHeight: 0, background: "#f8f8f9" }}
        >
          {current ? (
            <img
              src={current.url}
              alt={current.alt}
              style={{
                maxWidth: "100%",
                maxHeight: "400px",
                width: "auto",
                height: "auto",
                objectFit: "contain",
                display: "block",
              }}
            />
          ) : (
            <p className="text-zinc-600 text-sm">Sin imagen</p>
          )}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setImageIdx(Math.max(0, imageIdx - 1))}
                disabled={imageIdx === 0}
                className="absolute left-3 w-9 h-9 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
                style={{ background: color.hex + "cc" }}
              >
                <ArrowLeft size={16} className="text-white" />
              </button>
              <button
                onClick={() =>
                  setImageIdx(Math.min(images.length - 1, imageIdx + 1))
                }
                disabled={imageIdx === images.length - 1}
                className="absolute right-3 w-9 h-9 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
                style={{ background: color.hex + "cc" }}
              >
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
          <div
            className="flex gap-2 px-5 py-4 overflow-x-auto shrink-0 border-t"
            style={{ borderColor: "var(--border)" }}
          >
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setImageIdx(i)}
                className={`w-14 h-10 rounded-lg overflow-hidden shrink-0 border-2 transition-all flex items-center justify-center`}
                style={{
                  borderColor: i === imageIdx ? color.hex : "transparent",
                  background: "#f4f4f5",
                }}
              >
                <img
                  src={img.url}
                  alt={img.alt}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Shared UI components ── */

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <h3
        className="text-sm font-semibold text-zinc-300 mb-4"
        style={{ fontFamily: "DM Sans, sans-serif" }}
      >
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-500 mb-1.5">
        <span className="block mb-1.5">{label}</span>
        {children}
      </label>
    </div>
  )
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm rounded-lg border outline-none transition-colors"
      style={{
        background: "var(--secondary)",
        borderColor: "var(--border)",
        color: "var(--foreground)",
      }}
    />
  )
}

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none px-3 pr-8 py-2 text-sm rounded-lg border outline-none cursor-pointer"
        style={{
          background: "var(--secondary)",
          borderColor: "var(--border)",
          color: value ? "var(--foreground)" : "#71717a",
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={13}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
      />
    </div>
  )
}
