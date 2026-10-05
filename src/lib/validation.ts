import type { Motorcycle } from "../types"

export function validateMotorcycle(m: Partial<Motorcycle>) {
  if (!m.model?.trim() || !m.brandId || !m.categoryId || !m.slug?.trim())
    throw new Error("Marca, modelo, categoría y slug son obligatorios.")

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(m.slug) || /^\d+$/.test(m.slug))
    throw new Error("Slug inválido: usa letras minúsculas, números y guiones.")

  const limits: Record<string, number> = {
    price: 1e9,
    inventory: 1e9,
    displacement: 999999,
    hp: 999999,
  }

  for (const [key, limit] of Object.entries(limits)) {
    const value = m[(key as keyof Motorcycle)]

    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > limit
    )
      throw new Error(`Valor inválido: ${key}.`)
  }

  if (!Number.isInteger(m.inventory))
    throw new Error("Inventario debe ser un entero no negativo.")

  if (!Number.isInteger(m.year) || m.year! < 1900 || m.year! > 2100)
    throw new Error("Año debe estar entre 1900 y 2100.")

  if (
    m.promoPrice != null &&
    (!Number.isFinite(m.promoPrice) ||
      m.promoPrice < 0 ||
      m.promoPrice > m.price!)
  )
    throw new Error("Precio promocional inválido.")

  if ((m.colors?.length ?? 0) > 30 || (m.specs?.length ?? 0) > 100)
    throw new Error("Máximo 30 colores y 100 especificaciones por ficha.")

  const ids = new Set<string>()

  for (const c of m.colors ?? []) {
    if (!c.id || ids.has(c.id))
      throw new Error("Identificador de color repetido.")
    ids.add(c.id)

    if (!c.name.trim() || !/^#[0-9a-f]{6}$/i.test(c.hex))
      throw new Error("Cada color requiere nombre y HEX válido.")

    if (c.images.length > 30 || c.images.filter((i) => i.isPrimary).length > 1)
      throw new Error("Máximo 30 fotos y una principal por color.")

    const imageIds = new Set<string>()

    for (const i of c.images) {
      if (!i.id || imageIds.has(i.id))
        throw new Error("Identificador de foto repetido.")
      imageIds.add(i.id)

      try {
        if (new URL(i.url).protocol !== "https:") throw new Error()
      } catch {
        throw new Error("Todas las imágenes requieren un enlace HTTPS válido.")
      }
    }
  }

  for (const s of m.specs ?? [])
    if (!s.group.trim() || !s.label.trim() || !s.value.trim())
      throw new Error("Completa grupo, nombre y valor de cada especificación.")

  if (new TextEncoder().encode(JSON.stringify(m)).length > 256 * 1024)
    throw new Error("La ficha supera el límite de 256 KiB.")
}

export function replaceDocument<T extends object>(
  current: T,
  changes: Partial<T>,
): T {
  return { ...current, ...changes }
}
