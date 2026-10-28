export type PromotionDates = {
  startsAt: string | null
  endsAt: string | null
}

// API dates require seconds and an explicit zone. Date.parse alone accepts
// impossible calendar days and timestamps without a zone.
export function zonedDate(value: unknown): value is string {
  if (typeof value !== "string") return false
  const match =
    /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(Z|[+-](\d{2}):(\d{2}))$/.exec(
      value,
    )
  if (
    !match ||
    +match[2] > 23 ||
    +match[3] > 59 ||
    +match[4] > 59 ||
    (match[6] !== undefined && (+match[6] > 23 || +match[7] > 59))
  )
    return false
  const day = new Date(`${match[1]}T00:00:00Z`)
  return (
    Number.isFinite(day.getTime()) &&
    day.toISOString().slice(0, 10) === match[1] &&
    Number.isFinite(Date.parse(value))
  )
}

export function promotionDatesValid(value: Record<string, unknown>): boolean {
  return (
    ["startsAt", "endsAt"].every(
      (key) => value[key] === null || zonedDate(value[key]),
    ) &&
    !(
      typeof value.startsAt === "string" &&
      typeof value.endsAt === "string" &&
      Date.parse(value.endsAt) < Date.parse(value.startsAt)
    )
  )
}
