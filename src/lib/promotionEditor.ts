import { type Doc, type Field, https } from "./moduleSchemas"
import { type PromotionDates } from "./promotionDates"

// Promotion days follow Costa Rica, independently of the browser timezone.
export function promotionDay(value: string | null): string {
  if (!value) return ""
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

export function promotionPayload(
  body: Doc,
  motorcycles: Doc[],
): Doc & PromotionDates {
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
  const boundary = (
    value: string | null | undefined,
    end: boolean,
  ): string | null => {
    if (value == null || value === "") return null
    // Preserve an existing instant, including its time and explicit zone.
    // Only a newly selected calendar day becomes a Costa Rica day boundary.
    return /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T${end ? "23:59:59" : "00:00:00"}-06:00`
      : value
  }
  return {
    ...body,
    slug:
      body.slug ||
      `promo-${titleSlug || "moto"}-${crypto.randomUUID().slice(0, 8)}`,
    imageUrl: image?.url || "",
    // Safe navigation fallback; the web must implement the linked modal using motorcycleId.
    buttonHref: "/motocicletas",
    startsAt: boundary(body.startsAt, false),
    endsAt: boundary(body.endsAt, true),
  }
}
