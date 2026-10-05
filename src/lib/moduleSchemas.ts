export type Doc = Record<string, any>
export type Field = {
  key: string
  label: string
  type?:
    | "text"
    | "email"
    | "password"
    | "url"
    | "number"
    | "boolean"
    | "date"
    | "textarea"
    | "select"
    | "object"
    | "array"
    | "blocks"
  required?: boolean
  nullable?: boolean
  optional?: boolean
  options?: { value: string; label: string }[]
  reference?: "brands" | "motorcycles" | "pages" | "roles"
  children?: Field[]
  initial?: any
  min?: number
  max?: number
  maxLength?: number
}
export type Schema = {
  kind: string
  title: string
  permission: string
  fields: Field[]
  initial: Doc
  singleton?: boolean
  sensitive?: "users.manage"
}
const text = (
  key: string,
  label: string,
  required = false,
  maxLength = 255,
): Field => ({ key, label, required, maxLength })
const select = (key: string, label: string, values: string[]): Field => ({
  key,
  label,
  type: "select",
  required: true,
  options: values.map((value) => ({
    value,
    label:
      (
        {
          active: "Activo",
          inactive: "Inactivo",
          expired: "Vencido",
          draft: "Borrador",
          published: "Publicado",
          hidden: "Oculto",
          archived: "Archivado",
          text: "Texto plano",
          blocks: "Bloques",
          USD: "USD",
          CRC: "CRC",
        } as Doc
      )[value] || value,
  })),
})
const order: Field = {
  key: "order",
  label: "Orden",
  type: "number",
  min: 0,
  max: 1000000,
  required: true,
}
const image = (key: string, label: string, required = false): Field => ({
  key,
  label,
  type: "url",
  required,
  maxLength: 2048,
})
const status = select("status", "Estado", ["active", "inactive"])
const dates: Field[] = [
  {
    key: "startsAt",
    label: "Inicio (hora local)",
    type: "date",
    nullable: true,
  },
  { key: "endsAt", label: "Fin (hora local)", type: "date", nullable: true },
]
const button = (key: string, label: string): Field => ({
  key,
  label,
  type: "object",
  nullable: true,
  initial: { label: "", href: "" },
  children: [
    text("label", "Texto del botón", true, 100),
    text("href", "Destino (/ruta o HTTPS)", true, 2048),
  ],
})
const brand: Field = {
  key: "brandId",
  label: "Marca",
  type: "select",
  reference: "brands",
  nullable: true,
}
export const schemas: Record<string, Schema> = {
  promotions: {
    kind: "promotions",
    title: "Promociones",
    permission: "promotions.manage",
    initial: {
      title: "",
      slug: "",
      description: "",
      imageUrl: "",
      brandId: null,
      motorcycles: [],
      startsAt: "",
      endsAt: "",
      status: "inactive",
      featured: false,
      showOnHome: false,
      order: 0,
      buttonLabel: "",
      buttonHref: "",
    },
    fields: [
      text("title", "Título", true),
      text("slug", "Slug", true, 191),
      {
        key: "description",
        label: "Descripción",
        type: "textarea",
        maxLength: 20000,
        required: false,
      },
      image("imageUrl", "Imagen HTTPS", true),
      brand,
      {
        key: "motorcycles",
        label: "Motocicletas de la promoción",
        type: "array",
        max: 100,
        initial: {
          motorcycleId: "",
          originalPrice: 0,
          promoPrice: 0,
          currency: "CRC",
        },
        children: [
          {
            key: "motorcycleId",
            label: "Motocicleta",
            type: "select",
            reference: "motorcycles",
            required: true,
          },
          {
            key: "originalPrice",
            label: "Precio original",
            type: "number",
            min: 0,
            max: 1000000000,
            required: true,
          },
          {
            key: "promoPrice",
            label: "Precio promocional",
            type: "number",
            min: 0,
            max: 1000000000,
            required: true,
          },
          select("currency", "Moneda", ["CRC", "USD"]),
        ],
      },
      ...dates.map((f) => ({ ...f, nullable: false, required: true })),
      select("status", "Estado", ["active", "inactive", "expired"]),
      { key: "featured", label: "Destacada", type: "boolean" },
      { key: "showOnHome", label: "Mostrar en inicio", type: "boolean" },
      order,
      text("buttonLabel", "Texto del botón", true, 100),
      text("buttonHref", "Destino del botón (/ruta o HTTPS)", true, 2048),
    ],
  },
  pages: {
    kind: "pages",
    title: "Páginas",
    permission: "content.manage",
    initial: {
      title: "",
      slug: "",
      content: "",
      contentFormat: "text",
      order: 0,
      status: "draft",
      seo: { title: "", description: "" },
    },
    fields: [
      text("title", "Título", true),
      text("slug", "Slug", true, 191),
      select("contentFormat", "Formato del contenido", ["text", "blocks"]),
      { key: "content", label: "Contenido", type: "blocks" },
      order,
      select("status", "Estado", ["draft", "published", "hidden", "archived"]),
      {
        key: "seo",
        label: "SEO",
        type: "object",
        children: [
          text("title", "Título SEO"),
          {
            key: "description",
            label: "Descripción SEO",
            type: "textarea",
            maxLength: 500,
          },
        ],
      },
    ],
  },
  banners: {
    kind: "banners",
    title: "Banners",
    permission: "content.manage",
    initial: {
      title: "",
      subtitle: "",
      imageUrl: "",
      mobileImageUrl: "",
      alt: "",
      brandId: null,
      accentColor: "#F97316",
      ctaPrimary: null,
      ctaSecondary: null,
      placement: "home_hero",
      order: 0,
      status: "inactive",
      startsAt: null,
      endsAt: null,
      pageId: null,
    },
    fields: [
      text("title", "Título", true),
      text("subtitle", "Subtítulo", false, 3000),
      image("imageUrl", "Imagen de escritorio HTTPS", true),
      image("mobileImageUrl", "Imagen móvil HTTPS"),
      text("alt", "Descripción accesible de imagen", true, 500),
      brand,
      text("accentColor", "Color de acento (#RRGGBB)"),
      button("ctaPrimary", "Botón principal"),
      button("ctaSecondary", "Botón secundario"),
      text("placement", "Ubicación", true),
      order,
      status,
      ...dates,
      {
        key: "pageId",
        label: "Página relacionada",
        type: "select",
        reference: "pages",
        nullable: true,
      },
    ],
  },
  contact: {
    kind: "contact",
    title: "Contacto y horarios",
    permission: "content.manage",
    singleton: true,
    initial: {},
    fields: [
      text("businessName", "Nombre comercial", true),
      text("phone", "Teléfono"),
      text("whatsapp", "WhatsApp"),
      { key: "email", label: "Correo electrónico", type: "email" },
      { key: "address", label: "Dirección", type: "textarea", maxLength: 3000 },
      {
        key: "latitude",
        label: "Latitud",
        type: "number",
        min: -90,
        max: 90,
        nullable: true,
      },
      {
        key: "longitude",
        label: "Longitud",
        type: "number",
        min: -180,
        max: 180,
        nullable: true,
      },
      {
        key: "hours",
        label: "Horarios",
        type: "array",
        max: 7,
        initial: { day: 1, closed: false, opens: "08:00", closes: "17:00" },
        children: [
          {
            key: "day",
            label: "Día (1 lunes — 7 domingo)",
            type: "number",
            min: 1,
            max: 7,
            required: true,
          },
          { key: "closed", label: "Cerrado", type: "boolean" },
          { key: "opens", label: "Apertura (HH:MM)", nullable: true },
          { key: "closes", label: "Cierre (HH:MM)", nullable: true },
        ],
      },
      image("logoUrl", "Logo HTTPS"),
      image("faviconUrl", "Favicon HTTPS"),
    ],
  },
  "social-links": {
    kind: "social-links",
    title: "Redes sociales",
    permission: "content.manage",
    initial: {
      platform: "instagram",
      label: "",
      url: "",
      order: 0,
      status: "inactive",
    },
    fields: [
      select("platform", "Plataforma", [
        "facebook",
        "instagram",
        "tiktok",
        "youtube",
        "x",
        "linkedin",
        "whatsapp",
        "other",
      ]),
      text("label", "Nombre", true),
      image("url", "Enlace HTTPS", true),
      order,
      status,
    ],
  },
  users: {
    kind: "users",
    title: "Usuarios",
    permission: "users.manage",
    sensitive: "users.manage",
    initial: {
      name: "",
      email: "",
      phone: "",
      avatarUrl: "",
      role: "sales",
      status: "active",
      password: "",
    },
    fields: [
      text("name", "Nombre", true),
      {
        key: "email",
        label: "Correo electrónico",
        type: "email",
        required: true,
      },
      text("phone", "Teléfono"),
      image("avatarUrl", "Avatar HTTPS"),
      {
        key: "role",
        label: "Rol",
        type: "select",
        reference: "roles",
        required: true,
      },
      status,
    ],
  },
}
export function editable(fields: Field[], doc: Doc): Doc {
  return Object.fromEntries(
    fields
      .filter((f) => !f.optional || doc[f.key] !== undefined)
      .map((f) => {
        const v = doc[f.key]
        return [
          f.key,
          f.type === "object" && v != null
            ? editable(f.children!, v)
            : f.type === "array"
              ? (v || []).map((item: Doc) => editable(f.children!, item))
              : f.type === "date" && typeof v === "string"
                ? v.replace(/\.\d{3}Z$/, "Z")
                : (v ??
                  (f.nullable
                    ? null
                    : f.type === "boolean"
                      ? false
                      : f.type === "number"
                        ? 0
                        : "")),
        ]
      }),
  )
}
export function validateModule(
  kind: string,
  doc: Doc,
  refs: Record<string, Doc[]>,
): string {
  const safeHref = (s: string) =>
    !/[\\\u0000-\u001f]/.test(s) &&
    ((s.startsWith("/") && !s.startsWith("//")) || https(s))
  const scan = (value: any, key = ""): boolean => {
    if (Array.isArray(value)) return value.some((v) => scan(v, key))
    if (value && typeof value === "object")
      return Object.entries(value).some(([k, v]) => scan(v, k))
    if (typeof value !== "string" || ["password", "newPassword"].includes(key))
      return false
    if (/<\/?[a-z][^>]*>/i.test(value)) return true
    if (
      value &&
      /^(imageUrl|mobileImageUrl|logoUrl|faviconUrl|avatarUrl|url)$/.test(
        key,
      ) &&
      !https(value)
    )
      return true
    if (value && /^(href|buttonHref)$/.test(key) && !safeHref(value))
      return true
    return false
  }
  if (scan(doc))
    return "Usa texto sin HTML, imágenes HTTPS sin credenciales y destinos /ruta o HTTPS seguros."
  if (
    doc.startsAt &&
    doc.endsAt &&
    Date.parse(doc.endsAt) < Date.parse(doc.startsAt)
  )
    return "El fin debe ser posterior al inicio."
  if (kind === "promotions") {
    const seen = new Set<string>()
    for (const item of doc.motorcycles) {
      const moto = refs.motorcycles?.find((m) => m.id === item.motorcycleId)
      if (!moto || seen.has(item.motorcycleId))
        return "Selecciona motos existentes sin duplicados."
      seen.add(item.motorcycleId)
      if (item.promoPrice > item.originalPrice)
        return "El precio promocional no puede superar el original."
      if (moto.currency !== item.currency)
        return "La moneda debe coincidir con la motocicleta."
      if (doc.brandId && moto.brandId !== doc.brandId)
        return "Todas las motos deben pertenecer a la marca seleccionada."
    }
  }
  if (kind === "contact") {
    if ((doc.latitude === null) !== (doc.longitude === null))
      return "Introduce ambas coordenadas o deja ambas vacías."
    const days = new Set()
    for (const h of doc.hours) {
      if (days.has(h.day)) return "Cada día debe aparecer una sola vez."
      days.add(h.day)
      if (
        !h.closed &&
        (!/^\d{2}:\d{2}$/.test(h.opens || "") ||
          !/^\d{2}:\d{2}$/.test(h.closes || "") ||
          h.closes <= h.opens)
      )
        return "Revisa los horarios de apertura y cierre."
    }
  }
  if (doc.password || doc.newPassword) {
    const n = new TextEncoder().encode(doc.password || doc.newPassword).length
    if (n < 16 || n > 72) return "La contraseña debe tener entre 16 y 72 bytes."
  }
  return ""
}
export function https(value: string) {
  try {
    const u = new URL(value)
    return u.protocol === "https:" && !u.username && !u.password
  } catch {
    return false
  }
}
