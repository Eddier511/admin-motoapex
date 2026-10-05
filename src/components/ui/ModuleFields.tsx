import { type Doc, type Field } from "../../lib/moduleSchemas"
import { promotionDay } from "../../lib/promotionEditor"

export function ModuleFields({
  fields,
  value,
  change,
  refs = {},
  disabled = false,
  prefix = "",
}: {
  fields: Field[]
  value: Doc
  change: (v: Doc) => void
  refs?: Record<string, Doc[]>
  disabled?: boolean
  prefix?: string
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        const key = field.key,
          v = value[key],
          label = prefix + field.label
        const set = (next: any) => {
          const doc = { ...value, [key]: next }
          if (key === "contentFormat" && next !== value.contentFormat)
            doc.content = next === "blocks" ? [] : ""
          if (key === "closed" && next) {
            doc.opens = null
            doc.closes = null
          }
          if (key === "motorcycleId") {
            const moto = refs.motorcycles?.find((m) => m.id === next)
            if (moto) {
              doc.currency = moto.currency
              doc.originalPrice = moto.price
              doc.promoPrice = moto.promoPrice ?? moto.price
            }
          }
          change(doc)
        }
        if (field.type === "boolean")
          return (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!v}
                disabled={disabled}
                onChange={(e) => set(e.target.checked)}
              />
              {field.label}
            </label>
          )
        if (field.type === "object")
          return (
            <fieldset
              key={key}
              className="sm:col-span-2 border rounded-xl p-4 space-y-3"
            >
              <legend className="text-sm px-1">{field.label}</legend>
              {field.nullable && (
                <label className="flex gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={v != null}
                    disabled={disabled}
                    onChange={(e) =>
                      set(
                        e.target.checked
                          ? structuredClone(field.initial)
                          : null,
                      )
                    }
                  />
                  Incluir {field.label.toLowerCase()}
                </label>
              )}
              {v != null && (
                <ModuleFields
                  fields={field.children!}
                  value={v}
                  change={set}
                  refs={refs}
                  disabled={disabled}
                  prefix={label + " · "}
                />
              )}
            </fieldset>
          )
        if (
          field.type === "array" ||
          (field.type === "blocks" && value.contentFormat === "blocks")
        ) {
          const blocks = field.type === "blocks",
            items: Doc[] = Array.isArray(v) ? v : []
          return (
            <fieldset
              key={key}
              className="sm:col-span-2 border rounded-xl p-4 space-y-4"
            >
              <legend className="text-sm px-1">{field.label}</legend>
              {!items.length && (
                <p className="text-sm text-zinc-500">Sin elementos.</p>
              )}
              {items.map((item, index) => {
                const children: Field[] = blocks
                  ? [
                      {
                        key: "type",
                        label: "Tipo de bloque",
                        type: "select",
                        options: ["heading", "paragraph", "image", "link"].map(
                          (value) => ({
                            value,
                            label: (
                              {
                                heading: "Título",
                                paragraph: "Párrafo",
                                image: "Imagen",
                                link: "Enlace",
                              } as Doc
                            )[value],
                          }),
                        ),
                      },
                      ...(item.type === "image"
                        ? [
                            {
                              key: "url",
                              label: "Imagen HTTPS",
                              type: "url" as const,
                              required: true,
                            },
                            { key: "alt", label: "Texto alternativo" },
                          ]
                        : [
                            {
                              key: "text",
                              label: "Texto",
                              type: "textarea" as const,
                              required: true,
                            },
                          ]),
                      ...(item.type === "heading"
                        ? [
                            {
                              key: "level",
                              label: "Nivel",
                              type: "number" as const,
                              min: 1,
                              max: 6,
                              required: true,
                            },
                          ]
                        : item.type === "link"
                          ? [
                              {
                                key: "href",
                                label: "Destino (/ruta o HTTPS)",
                                required: true,
                              },
                            ]
                          : []),
                    ]
                  : field.children!
                return (
                  <div
                    key={index}
                    className="bg-secondary rounded-lg p-3 space-y-3"
                  >
                    <ModuleFields
                      fields={children}
                      value={item}
                      refs={refs}
                      disabled={disabled}
                      prefix={`${label} ${index + 1} · `}
                      change={(next) => {
                        const list = [...items]
                        list[index] =
                          blocks && next.type !== item.type
                            ? next.type === "image"
                              ? { type: "image", url: "", alt: "" }
                              : next.type === "heading"
                                ? { type: "heading", text: "", level: 2 }
                                : next.type === "link"
                                  ? { type: "link", text: "", href: "" }
                                  : { type: "paragraph", text: "" }
                            : next
                        set(list)
                      }}
                    />
                    <button
                      type="button"
                      className="text-sm text-red-600"
                      disabled={disabled}
                      onClick={() => set(items.filter((_, i) => i !== index))}
                    >
                      Quitar {field.label.toLowerCase()} {index + 1}
                    </button>
                  </div>
                )
              })}
              <button
                type="button"
                className="module-secondary"
                disabled={disabled || items.length >= (field.max || 100)}
                onClick={() =>
                  set([
                    ...items,
                    structuredClone(
                      blocks ? { type: "paragraph", text: "" } : field.initial,
                    ),
                  ])
                }
              >
                Agregar {field.label.toLowerCase()}
              </button>
            </fieldset>
          )
        }
        const options = field.reference
          ? (refs[field.reference] || []).map((item) => ({
              value: String(item.code ?? item.id),
              label:
                item.name ||
                [item.brand, item.model, item.year].filter(Boolean).join(" ") ||
                item.title,
            }))
          : field.options
        const dateValue =
          field.type === "date" && v
            ? field.calendarOnly
              ? promotionDay(v)
              : localDate(v)
            : (v ?? "")
        return (
          <label
            key={key}
            className={`block text-sm ${["textarea", "blocks"].includes(field.type || "") ? "sm:col-span-2" : ""}`}
          >
            {field.label}
            {field.required && " *"}
            {field.type === "select" ? (
              <select
                aria-label={label}
                className="module-input"
                required={field.required}
                disabled={disabled}
                value={v ?? ""}
                onChange={(e) =>
                  set(e.target.value || (field.nullable ? null : ""))
                }
              >
                <option value="">
                  {field.nullable ? "Sin relación" : "Seleccionar…"}
                </option>
                {options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : ["textarea", "blocks"].includes(field.type || "") ? (
              <textarea
                aria-label={label}
                className="module-input min-h-24"
                disabled={disabled}
                required={field.required}
                maxLength={field.maxLength || 100000}
                value={typeof v === "string" ? v : ""}
                onChange={(e) => set(e.target.value)}
              />
            ) : (
              <input
                aria-label={label}
                className="module-input"
                disabled={
                  disabled ||
                  (value.closed && ["opens", "closes"].includes(key))
                }
                required={field.required}
                type={
                  field.type === "date"
                    ? field.calendarOnly
                      ? "date"
                      : "datetime-local"
                    : field.type || "text"
                }
                autoComplete={
                  field.type === "password" ? "new-password" : undefined
                }
                min={field.min}
                max={field.max}
                maxLength={field.maxLength}
                step={
                  field.type === "number"
                    ? ["order", "day", "level"].includes(key)
                      ? "1"
                      : "any"
                    : field.type === "date" && !field.calendarOnly
                      ? "1"
                      : undefined
                }
                pattern={
                  key === "slug"
                    ? "[a-z0-9]+(?:-[a-z0-9]+)*"
                    : key === "accentColor"
                      ? "#[0-9a-fA-F]{6}"
                      : undefined
                }
                value={dateValue}
                onChange={(e) =>
                  set(
                    field.type === "number"
                      ? e.target.value === "" && field.nullable
                        ? null
                        : e.target.value === ""
                          ? ""
                          : Number(e.target.value)
                      : field.type === "date"
                        ? e.target.value
                          ? field.calendarOnly
                            ? e.target.value
                            : new Date(e.target.value).toISOString()
                          : field.nullable
                            ? null
                            : ""
                        : e.target.value || (field.nullable ? null : ""),
                  )
                }
              />
            )}
          </label>
        )
      })}
    </div>
  )
}
function localDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 19)
}
