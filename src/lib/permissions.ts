import type { User } from "../types"

const defaults: Record<User["role"], string[]> = {
  admin: [
    "motorcycles.read",
    "motorcycles.write",
    "motorcycles.publish",
    "brands.manage",
    "categories.manage",
    "leads.manage",
  ],

  editor: [
    "motorcycles.read",
    "motorcycles.write",
    "brands.manage",
    "categories.manage",
  ],

  marketing: ["motorcycles.read"],

  sales: ["leads.manage"],
}

// Current /auth/me exposes role, not permission grants. Server checks role_permissions.

// If explicit grants become available they narrow the UI; a 403 always remains authoritative.

export function can(user: User | null, permission: string) {
  return (
    !!user &&
    defaults[user.role]?.includes(permission) &&
    (!user.permissions || user.permissions.includes(permission))
  )
}

export function canReadCatalog(user: User | null) {
  return can(user, "motorcycles.read")
}

export function canDelete(user: User | null, permission: string) {
  return user?.role === "admin" && can(user, permission)
}
