import { type Doc, type Field, https } from "./moduleSchemas"

// Promotion days follow Costa Rica, independently of the browser timezone.
export function promotionDay(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) return ""
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)
  const part = (type: string) => parts.find((p) => p.type === type)?.value
  return `${part("year")}-${part("month")}-${part("day")}`
}

export function promotionFields(fields: Field[]): Field[] {
  return fields
    .filter((f) => !["slug", "imageUrl", "buttonHref"].includes(f.key))
    .map((f) =>
      f.type === "date"
        ? {
            ...f,
            calendarOnly: true,
            label:
              f.key === "startsAt"
                ? "Fecha de inicio"
                : "Fecha de finalización",
          }
        : f,
    )
}

export function promotionPayload(body: Doc, motorcycles: Doc[]): Doc {
  const motorcycle = motorcycles.find(
    (m) => String(m.id) === body.motorcycles?.[0]?.motorcycleId,
  )
  const images: Doc[] = (motorcycle?.colors || []).flatMap(
    (c: Doc) => c.images || [],
  )
  const image =
    images.find((i) => i.isPrimary && https(i.url || "")) ||
    images.find((i) => https(i.url || ""))
  const titleSlug = String(body.title || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 160)
    .replace(/-$/g, "")
  const start = promotionDay(body.startsAt || "")
  const end = promotionDay(body.endsAt || "")
  return {
    ...body,
    slug:
      body.slug ||
      `promo-${titleSlug || "moto"}-${crypto.randomUUID().slice(0, 8)}`,
    imageUrl: image?.url || "",
    // Safe navigation fallback; the web must implement the linked modal using motorcycleId.
    buttonHref: "/motocicletas",
    startsAt: start ? `${start}T00:00:00-06:00` : "",
    endsAt: end ? `${end}T23:59:59-06:00` : "",
  }
}
