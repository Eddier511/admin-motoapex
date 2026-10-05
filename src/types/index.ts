export type Page = "dashboard" | "motorcycles" | "motorcycle-form" | "brands" | "categories" | "promotions" | "inventory" | "used" | "content" | "leads" | "users" | "settings" | "login"

export interface User {
  id: string

  name: string

  email: string

  role: "admin" | "sales" | "marketing" | "editor"

  status: "active" | "inactive"

  lastAccess: string

  avatar?: string

  permissions?: string[]
}

export interface Brand {
  id: string

  name: string

  slug: string

  logo?: string

  accentLight?: string

  heroImageUrl?: string

  tileImageUrl?: string

  tagline?: string

  slogan?: string

  primaryColor: string

  secondaryColor: string

  description?: string

  status: "active" | "inactive"

  order: number
}

export interface Category {
  id: string

  name: string

  slug: string

  description?: string

  brandId?: string

  order: number

  status: "active" | "inactive"
}

export interface MotorcycleImage {
  id: string

  url: string

  label: string

  alt: string

  order: number

  isPrimary: boolean
}

export interface MotorcycleColor {
  id: string

  name: string

  hex: string

  status: "active" | "inactive"

  available: boolean

  order: number

  images: MotorcycleImage[]
}

export interface Specification {
  group: string
  label: string
  value: string
}

export interface Motorcycle {
  specs: Specification[]

  hp: number

  tagline: string

  id: string

  brand: string

  brandId: string

  model: string

  version: string

  year: number

  category: string

  categoryId: string

  displacement: number

  price: number

  promoPrice?: number | null

  currency: "CRC" | "USD"

  sku: string

  status: "available" | "coming_soon" | "reserved" | "sold_out"

  published: boolean

  featured: boolean

  isNew: boolean

  showPrice: boolean

  allowQuote: boolean

  shortDescription: string

  description: string

  colors: MotorcycleColor[]

  inventory: number

  createdAt: string

  updatedAt: string

  slug: string
}

export interface Lead {
  id: string

  date: string

  name: string

  phone: string

  email: string

  brand: string

  motorcycle: string

  type: "quote" | "availability" | "test_ride" | "contact" | "whatsapp"

  status: "new" | "contacted" | "follow_up" | "closed" | "discarded"

  assignedTo?: string

  message?: string

  notes?: { note: string; date: string }[]
}

export interface Promotion {
  id: string

  title: string

  description: string

  image?: string

  brand: string

  model: string

  originalPrice: number

  promoPrice: number

  startDate: string

  endDate: string

  status: "active" | "inactive" | "expired"

  featured: boolean

  showOnHome: boolean
}

export interface Toast {
  id: string

  type: "success" | "error" | "warning" | "info"

  message: string
}
