import type { User } from "../types"

const defaults: Record<string, string[]> = {
  admin: [
    "motorcycles.read",
    "motorcycles.write",
    "motorcycles.publish",
    "inventory.manage",
    "brands.manage",
    "categories.manage",
    "leads.manage",
    "promotions.manage",
    "content.manage",
    "users.manage",
    "settings.manage",
  ],

  editor: [
    "motorcycles.read",
    "motorcycles.write",
    "brands.manage",
    "categories.manage",
    "content.manage",
  ],

  marketing: ["motorcycles.read", "promotions.manage", "content.manage"],

  sales: ["leads.manage", "inventory.manage"],
}

// Use effective permissions when the API supplies them; otherwise use its documented initial roles.
// This only controls the UI. Every write still needs authorization on the server.
export function can(user: User | null, permission: string): boolean {
  if (!user) return false
  return user.permissions
    ? user.permissions.includes(permission)
    : !!defaults[user.role]?.includes(permission)
}

export function canReadCatalog(user: User | null) {
  return (
    !!user &&
    ["admin", "editor", "marketing"].includes(user.role) &&
    can(user, "motorcycles.read")
  )
}

export function canDelete(user: User | null, permission: string) {
  return user?.role === "admin" && can(user, permission)
}
