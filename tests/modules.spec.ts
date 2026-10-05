import { test, expect, type Page } from "@playwright/test"
import { schemas, editable } from "../src/lib/moduleSchemas"
import type { Field, Doc } from "../src/lib/moduleSchemas"
const BASE = "https://darksalmon-quetzal-730302.hostingersite.com/v1"
const future = "2099-12-31T23:59:59Z"

test("reset invalid token and reload cannot create a session or retain reset credentials", async ({
  page,
}) => {
  const state = await setup(page)
  await page.goto("/reset-password#token=expired-test")
  state.error = {
    path: "/auth/password/reset",
    method: "POST",
    status: 401,
    code: "INVALID_RESET",
  }
  await page
    .getByLabel("Nueva contraseña", { exact: true })
    .fill("Updated-disposable-password-2026")
  await page
    .getByLabel("Confirmar contraseña")
    .fill("Updated-disposable-password-2026")
  await page.getByRole("button", { name: "Continuar" }).click()
  await expect(page.getByRole("alert")).toContainText("INVALID_RESET")
  await expect(
    page.getByRole("heading", { name: "Restablecer contraseña" }),
  ).toBeVisible()
  await page.reload()
  await page
    .getByLabel("Nueva contraseña", { exact: true })
    .fill("Updated-disposable-password-2026")
  await page
    .getByLabel("Confirmar contraseña")
    .fill("Updated-disposable-password-2026")
  await page.getByRole("button", { name: "Continuar" }).click()
  await expect(page.getByRole("alert")).toContainText(
    "no contiene un token válido",
  )
  expect(
    state.calls.filter((c) => c.path === "/auth/password/reset"),
  ).toHaveLength(1)
  expect(
    state.calls.some(
      (c) => c.path === "/auth/me" || c.path.startsWith("/admin/"),
    ),
  ).toBeFalsy()
})
const password = "Disposable-test-password-2026"
const profile = {
  id: "7",
  name: "Test Admin",
  email: "admin@example.test",
  phone: "",
  avatarUrl: "",
  role: "admin",
  status: "active",
  lastAccess: null,
  mustChangePassword: false,
}
const documents: Record<string, any> = {
  promotions: {
    title: "Internal campaign",
    slug: "internal-campaign",
    description: "Plain text",
    imageUrl: "https://example.test/campaign.png",
    brandId: "1",
    motorcycles: [
      {
        id: "500",
        motorcycleId: "3",
        currency: "USD",
        originalPrice: 100,
        promoPrice: 90,
        motorcycle: { model: "Duke" },
      },
    ],
    startsAt: "2026-10-01T00:00:00Z",
    endsAt: "2026-12-01T00:00:00Z",
    status: "inactive",
    featured: true,
    showOnHome: true,
    order: 2,
    buttonLabel: "Ver",
    buttonHref: "/catalogo",
  },
  pages: {
    title: "About",
    slug: "about",
    content: "Plain text",
    contentFormat: "text",
    order: 2,
    status: "draft",
    seo: { title: "About MotoApex", description: "Description" },
  },
  banners: {
    title: "Hero",
    subtitle: "Sub",
    imageUrl: "https://example.test/hero.png",
    mobileImageUrl: "https://example.test/mobile.png",
    alt: "Hero image",
    brandId: "1",
    accentColor: "#FF6600",
    ctaPrimary: { label: "Ver", href: "/catalogo" },
    ctaSecondary: null,
    placement: "home_hero",
    order: 2,
    status: "inactive",
    startsAt: null,
    endsAt: null,
    pageId: null,
  },
  "social-links": {
    platform: "instagram",
    label: "Instagram",
    url: "https://example.test/social",
    order: 2,
    status: "inactive",
  },
  contact: {
    businessName: "MotoApex",
    phone: "+506 8888-8888",
    whatsapp: "+506 8888-8888",
    email: "info@example.test",
    address: "Costa Rica",
    latitude: null,
    longitude: null,
    hours: [{ day: 1, closed: false, opens: "08:00", closes: "17:00" }],
    logoUrl: "https://example.test/logo.png",
    faviconUrl: "https://example.test/favicon.png",
  },
  users: {
    ...profile,
    id: "8",
    name: "Disposable Sales",
    email: "sales@example.test",
    role: "sales",
    mustChangePassword: true,
  },
}

async function fillFields(page: Page, fields: Field[], doc: Doc, prefix = "") {
  const editor = page.locator(".module-editor")
  for (const f of fields) {
    const v = doc[f.key],
      label = prefix + f.label
    if (f.type === "object") {
      if (v != null) {
        if (f.nullable)
          await editor
            .getByLabel("Incluir " + f.label.toLowerCase(), { exact: true })
            .check()
        await fillFields(page, f.children!, v, label + " · ")
      }
    } else if (f.type === "boolean") {
      await editor.getByLabel(f.label, { exact: true }).setChecked(!!v)
    } else if (f.type === "array") {
      for (let i = 0; i < (v || []).length; i++) {
        await editor
          .getByRole("button", {
            name: "Agregar " + f.label.toLowerCase(),
            exact: true,
          })
          .click()
        await fillFields(page, f.children!, v[i], `${label} ${i + 1} · `)
      }
    } else if (f.type === "select")
      await editor.getByLabel(label, { exact: true }).selectOption(v ?? "")
    else if (f.type === "date") {
      if (v)
        await editor.getByLabel(label, { exact: true }).fill(v.replace("Z", ""))
    } else
      await editor
        .getByLabel(label, { exact: true })
        .fill(v == null ? "" : String(v))
  }
}

for (const kind of ["pages", "banners", "social-links"])
  test(`${kind} creation uses returned server ID and safe full payload`, async ({
    page,
  }) => {
    const state = await setup(page)
    await login(page)
    await nav(page, "Contenido web")
    if (kind !== "pages")
      await page
        .getByRole("navigation", { name: "Contenido web" })
        .getByRole("button", { name: schemas[kind].title, exact: true })
        .click()
    await page
      .getByRole("button", { name: "Crear registro", exact: true })
      .click()
    await fillFields(page, schemas[kind].fields, documents[kind])
    await page
      .locator(".module-editor")
      .getByRole("button", { name: "Guardar", exact: true })
      .click()
    await expect
      .poll(() => state.docs[kind].some((d: Doc) => d.id === "9001"))
      .toBeTruthy()
    expect(
      state.calls.find(
        (c) => c.path === `/admin/${kind}` && c.method === "POST",
      ).body,
    ).toEqual(editable(schemas[kind].fields, documents[kind]))
  })

for (const status of [403, 409, 422, 429])
  test(`promotion ${status} retains edited fields, request ID and no success`, async ({
    page,
  }) => {
    const state = await setup(page)
    await login(page)
    await nav(page, "Promociones")
    await page.getByRole("button", { name: "Editar / detalle" }).click()
    await page.getByLabel("Título", { exact: true }).fill("Retain my edit")
    state.error = {
      path: "/admin/promotions/8",
      method: "PUT",
      status,
      code: "CONTROLLED_ERROR",
    }
    await page
      .locator(".module-editor")
      .getByRole("button", { name: "Guardar", exact: true })
      .click()
    await expect(
      page.locator(".module-editor").getByRole("alert"),
    ).toContainText("test-reference")
    if (status === 429)
      await expect(
        page.locator(".module-editor").getByRole("alert"),
      ).toContainText("900 segundos")
    await expect(page.getByLabel("Título", { exact: true })).toHaveValue(
      "Retain my edit",
    )
    await expect(
      page.getByText("Guardado correctamente", { exact: true }),
    ).toHaveCount(0)
  })
async function setup(page: Page, mode = "normal", role = "admin") {
  const state = {
    docs: Object.fromEntries(
      Object.entries(documents).map(([k, v]) => [
        k,
        [
          {
            ...structuredClone(v),
            id: "8",
            createdAt: "readonly",
            updatedBy: "readonly",
            brand: { name: "KTM" },
          },
        ],
      ]),
    ),
    calls: [] as any[],
    error: null as null | {
      path: string
      method: string
      status: number
      code: string
    },
    mfa: false,
    used: new Set<string>(),
    tokens: new Map<string, string>(),
    count: 0,
  }
  await page.route(BASE + "/**", async (route) => {
    const req = route.request(),
      path = new URL(req.url()).pathname.replace("/v1", ""),
      method = req.method(),
      body = req.postDataJSON(),
      headers = req.headers()
    state.calls.push({ path, method, body, headers })
    const reply = (data: any, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify({ data }),
      })
    const fail = (status: number, code: string) =>
      route.fulfill({
        status,
        contentType: "application/json",
        headers: {
          "Retry-After": "900",
          "X-Request-ID": "test-reference",
          "Access-Control-Expose-Headers": "Retry-After, X-Request-ID",
        },
        body: JSON.stringify({ error: { code, message: code } }),
      })
    if (state.error?.path === path && state.error.method === method)
      return fail(state.error.status, state.error.code)
    const session = {
      token: "session-only-in-memory",
      expiresAt: future,
      user: { ...profile, role },
    }
    if (path === "/auth/login")
      return reply(
        mode === "normal"
          ? session
          : {
              challenge:
                mode === "both" || mode === "mfa"
                  ? "mfa_login"
                  : "password_change",
              challengeToken: "limited-first",
              expiresAt: future,
            },
      )
    if (path === "/auth/mfa/challenge") {
      if (
        body.challengeToken !== "limited-first" ||
        (body.code !== "123456" && body.recoveryCode !== "recovery-test")
      )
        return fail(401, "INVALID_CHALLENGE")
      return reply(
        mode === "both"
          ? {
              challenge: "password_change",
              challengeToken: "limited-second",
              expiresAt: future,
            }
          : session,
      )
    }
    if (path === "/auth/password/required") {
      if (!["limited-first", "limited-second"].includes(body.challengeToken))
        return fail(401, "INVALID_CHALLENGE")
      return reply(session)
    }
    if (path === "/auth/password/forgot")
      return reply({
        message:
          "Si existe una cuenta activa, recibirás un enlace de recuperación.",
      })
    if (path === "/auth/password/reset")
      return reply({ changed: true, loginRequired: true })
    if (headers.authorization !== "Bearer session-only-in-memory")
      return fail(401, "UNAUTHENTICATED")
    if (path === "/auth/me" || (path === "/auth/profile" && method === "GET"))
      return reply({ ...profile, role })
    if (path === "/auth/mfa/status") return reply({ enabled: state.mfa })
    if (path === "/auth/reauth") {
      if (
        body.password !== password ||
        (state.mfa &&
          body.code !== "123456" &&
          body.recoveryCode !== "recovery-test")
      )
        return fail(401, "INVALID_CREDENTIALS")
      const token = "single-use-" + ++state.count
      state.tokens.set(token, body.action)
      return reply({
        reauthToken: token,
        challenge: "reauth",
        expiresAt: future,
      })
    }
    if (path === "/auth/logout") return reply({ loggedOut: true })
    const purpose = path.startsWith("/admin/users")
      ? "users.manage"
      : path.startsWith("/admin/settings")
        ? "settings.manage"
        : path === "/auth/profile"
          ? "profile.edit"
          : path === "/auth/password/change"
            ? "password.change"
            : path.startsWith("/auth/mfa/")
              ? "mfa.manage"
              : null
    if (method !== "GET" && purpose) {
      const t = headers["x-reauth-token"]
      if (state.used.has(t) || state.tokens.get(t) !== purpose)
        return fail(401, "REAUTH_REQUIRED")
      state.used.add(t)
    }
    if (path === "/auth/profile") return reply({ ...profile, ...body })
    if (path === "/auth/password/change")
      return reply({ changed: true, loginRequired: true })
    if (path === "/auth/mfa/enroll")
      return reply({
        otpauthUri:
          "otpauth://totp/MotoApex:test?secret=JBSWY3DPEHPK3PXP&issuer=MotoApex",
      })
    if (path === "/auth/mfa/confirm" || path === "/auth/mfa/recovery-codes") {
      state.mfa = true
      return reply({
        enabled: true,
        loginRequired: path.endsWith("confirm"),
        recoveryCodes: ["test-recovery-1", "test-recovery-2"],
      })
    }
    if (path === "/auth/mfa/disable") {
      state.mfa = false
      return reply({ enabled: false, loginRequired: true })
    }
    if (path === "/admin/roles")
      return reply(
        ["admin", "sales", "editor", "marketing"].map((code, i) => ({
          id: String(i + 1),
          code,
          name: code,
          permissions: ["reference-only"],
        })),
      )
    if (path === "/admin/lead-assignees")
      return reply([{ id: "7", name: profile.name }])
    if (path === "/admin/settings")
      return reply([
        {
          id: "1",
          key: "default_currency",
          value: "CRC",
          valueType: "string",
          public: true,
        },
        {
          id: "2",
          key: "smtp_password",
          value: "must-not-show",
          public: false,
        },
      ])
    if (path.startsWith("/admin/settings/"))
      return reply({ key: path.split("/").at(-1), value: body.value })
    if (path === "/admin/brands")
      return reply([
        { id: "1", name: "KTM", status: "active", primaryColor: "#FF6600" },
      ])
    if (path === "/admin/categories") return reply([])
    if (path === "/admin/motorcycles")
      return reply([
        {
          id: "3",
          brand: "KTM",
          brandId: "1",
          model: "Duke",
          year: 2026,
          currency: "USD",
          price: 100,
          promoPrice: 90,
          colors: [],
          specs: [],
          inventory: 1,
          status: "available",
        },
      ])
    if (path === "/admin/leads") return reply([])
    const [, , kind, id] = path.split("/"),
      docs = state.docs[kind]
    if (!docs) return fail(404, "NOT_FOUND")
    if (method === "GET")
      return reply(
        kind === "contact"
          ? docs[0]
          : id
            ? docs.find((d: any) => d.id === id)
            : docs,
      )
    if (method === "DELETE") {
      state.docs[kind] = docs.filter((d: any) => d.id !== id)
      return reply({ id, deleted: true })
    }
    const fields = schemas[kind].fields
      .map((f) => f.key)
      .concat(
        kind === "users"
          ? ["password", "newPassword", "mustChangePassword"]
          : [],
      )
    if (Object.keys(body).some((k) => !fields.includes(k)))
      return fail(422, "UNKNOWN_FIELD")
    if (
      [body.startsAt, body.endsAt].some(
        (v) =>
          v != null &&
          !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(v),
      )
    )
      return fail(422, "INVALID_DATE")
    const saved = { ...body, id: id || "9001" }
    state.docs[kind] =
      kind === "contact"
        ? [saved]
        : id
          ? docs.map((d: any) => (d.id === id ? saved : d))
          : [...docs, saved]
    return reply(saved, method === "POST" ? 201 : 200)
  })
  await page.goto("/")
  return state
}
async function login(page: Page) {
  await page
    .getByLabel("Correo electrónico", { exact: true })
    .fill(profile.email)
  await page.getByLabel("Contraseña", { exact: true }).fill(password)
  await page.getByRole("button", { name: "Ingresar", exact: true }).click()
}
async function nav(page: Page, title: string) {
  await page
    .getByRole("navigation", { name: "Menú principal" })
    .getByRole("button", { name: title, exact: true })
    .click()
}
async function reauth(page: Page, mfa = false) {
  const dialog = page.getByRole("dialog", { name: "Confirma tu identidad" })
  await expect(dialog).toBeVisible()
  await dialog.getByLabel("Contraseña actual", { exact: true }).fill(password)
  if (mfa) await dialog.getByLabel("Código MFA", { exact: true }).fill("123456")
  await dialog.getByRole("button", { name: "Confirmar operación" }).click()
}

for (const mode of ["password", "mfa", "both"])
  test(`login ${mode} never authorizes admin before all challenges`, async ({
    page,
  }) => {
    const state = await setup(page, mode)
    await login(page)
    expect(state.calls.some((c) => c.path.startsWith("/admin/"))).toBeFalsy()
    if (mode !== "password") {
      await page.getByLabel("Código MFA", { exact: true }).fill("123456")
      await page.getByRole("button", { name: "Continuar" }).click()
    }
    if (mode !== "mfa") {
      await expect(
        page.getByRole("heading", { name: "Cambia tu contraseña" }),
      ).toBeVisible()
      expect(state.calls.some((c) => c.path.startsWith("/admin/"))).toBeFalsy()
      await page
        .getByLabel("Nueva contraseña", { exact: true })
        .fill("Updated-disposable-password-2026")
      await page
        .getByLabel("Confirmar contraseña")
        .fill("Updated-disposable-password-2026")
      await page.getByRole("button", { name: "Continuar" }).click()
    }
    await expect(
      page.getByRole("heading", { name: "Dashboard", exact: true }),
    ).toBeVisible()
    expect(
      state.calls.find((c) => c.path === "/auth/me").headers.authorization,
    ).toBe("Bearer session-only-in-memory")
    expect(
      await page.evaluate(() => [
        Object.keys(localStorage),
        Object.keys(sessionStorage),
      ]),
    ).toEqual([[], []])
  })
test("invalid MFA consumes challenge and recovery code alternative works", async ({
  page,
}) => {
  const state = await setup(page, "mfa")
  await login(page)
  await page.getByLabel("Código MFA", { exact: true }).fill("000000")
  await page.getByRole("button", { name: "Continuar" }).click()
  await expect(
    page.getByRole("heading", { name: "Iniciar sesión" }),
  ).toBeVisible()
  expect(state.calls.some((c) => c.path.startsWith("/admin/"))).toBeFalsy()
  await login(page)
  await page.getByLabel("Usar código de recuperación").check()
  await page
    .getByLabel("Código de recuperación", { exact: true })
    .fill("recovery-test")
  await page.getByRole("button", { name: "Continuar" }).click()
  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true }),
  ).toBeVisible()
})
for (const kind of ["promotions", "pages", "banners", "social-links", "users"])
  test(`${kind} full editable PUT, real IDs and logical delete`, async ({
    page,
  }) => {
    const state = await setup(page)
    await login(page)
    await nav(
      page,
      kind === "promotions"
        ? "Promociones"
        : kind === "users"
          ? "Usuarios"
          : "Contenido web",
    )
    if (!["promotions", "users", "pages"].includes(kind))
      await page
        .getByRole("navigation", { name: "Contenido web" })
        .getByRole("button", { name: schemas[kind].title })
        .click()
    await page.getByRole("button", { name: "Editar / detalle" }).click()
    await page
      .locator(".module-editor")
      .getByRole("button", { name: "Guardar", exact: true })
      .click()
    if (kind === "users") await reauth(page)
    await expect(
      page.getByText("Guardado correctamente", { exact: true }),
    ).toBeVisible()
    const put = state.calls.find(
      (c) => c.path === `/admin/${kind}/8` && c.method === "PUT",
    )
    expect(put.body).toEqual(editable(schemas[kind].fields, documents[kind]))
    expect(put.body.id).toBeUndefined()
    expect(put.body.createdAt).toBeUndefined()
    page.on("dialog", (d) => d.accept())
    await page.getByRole("button", { name: "Eliminar", exact: true }).click()
    if (kind === "users") await reauth(page)
    await expect.poll(() => state.docs[kind].length).toBe(0)
    const del = state.calls.find(
      (c) => c.path === `/admin/${kind}/8` && c.method === "DELETE",
    )
    expect(del).toBeTruthy()
    if (kind === "users")
      expect(del.headers["x-reauth-token"]).not.toBe(
        put.headers["x-reauth-token"],
      )
  })
test("banners have no schedule controls and clear an existing schedule on save", async ({
  page,
}) => {
  const state = await setup(page)
  state.docs.banners[0].startsAt = "2026-10-05T05:39:38Z"
  state.docs.banners[0].endsAt = "2026-10-08T05:40:55Z"
  await login(page)
  await nav(page, "Contenido web")
  await page.getByRole("button", { name: "Banners", exact: true }).click()
  await page.getByRole("button", { name: "Editar / detalle" }).click()
  const editor = page.locator(".module-editor")
  await expect(editor.locator('input[type="datetime-local"]')).toHaveCount(0)
  await editor.getByLabel("Estado", { exact: true }).selectOption("active")
  await editor.getByRole("button", { name: "Guardar", exact: true }).click()
  await expect(
    page.getByText("Guardado correctamente", { exact: true }),
  ).toBeVisible()
  const put = state.calls.find(
    (c) => c.path === "/admin/banners/8" && c.method === "PUT",
  )
  expect(put.body).toMatchObject({
    startsAt: null,
    endsAt: null,
    status: "active",
  })
})

test("contact singleton only PUT; closing a day sends null hours", async ({
  page,
}) => {
  const state = await setup(page)
  await login(page)
  await nav(page, "Contenido web")
  await page
    .getByRole("button", { name: "Contacto y horarios", exact: true })
    .click()
  await page.getByRole("button", { name: "Editar contacto" }).click()
  await page
    .locator(".module-editor")
    .getByLabel("Cerrado", { exact: true })
    .check()
  await page
    .locator(".module-editor")
    .getByRole("button", { name: "Guardar", exact: true })
    .click()
  await expect(
    page.getByText("Guardado correctamente", { exact: true }),
  ).toBeVisible()
  const put = state.calls.find(
    (c) => c.path === "/admin/contact" && c.method === "PUT",
  )
  expect(put.body.hours[0]).toEqual({
    day: 1,
    closed: true,
    opens: null,
    closes: null,
  })
  expect(
    state.calls.filter(
      (c) =>
        c.path === "/admin/contact" && ["POST", "DELETE"].includes(c.method),
    ),
  ).toHaveLength(0)
})
test("create user requires explicit password and purpose scoped reauth; LAST_ADMIN remains visible", async ({
  page,
}) => {
  const state = await setup(page)
  await login(page)
  await nav(page, "Usuarios")
  await page.getByRole("button", { name: "Crear registro" }).click()
  await page.getByLabel("Nombre", { exact: true }).fill("Disposable")
  await page
    .locator(".module-editor")
    .getByLabel("Correo electrónico", { exact: true })
    .fill("disposable@example.test")
  await page.getByLabel("Contraseña inicial (16–72 bytes)").fill(password)
  await page
    .locator(".module-editor")
    .getByRole("button", { name: "Guardar", exact: true })
    .click()
  expect(
    state.calls.some((c) => c.path === "/admin/users" && c.method === "POST"),
  ).toBeFalsy()
  await reauth(page)
  await expect.poll(() => state.docs.users.length).toBe(2)
  expect(
    state.calls.find((c) => c.path === "/admin/users" && c.method === "POST")
      .body.password,
  ).toBe(password)
  state.error = {
    path: "/admin/users/8",
    method: "DELETE",
    status: 409,
    code: "LAST_ADMIN",
  }
  page.on("dialog", (d) => d.accept())
  await page
    .getByRole("button", { name: "Eliminar", exact: true })
    .first()
    .click()
  await reauth(page)
  await expect(
    page
      .getByRole("dialog", { name: "Confirma tu identidad" })
      .getByRole("alert"),
  ).toContainText("Debes conservar al menos un administrador activo")
  expect(state.docs.users.length).toBe(2)
  await page.getByRole("button", { name: "Cancelar", exact: true }).click()
})
test("promotion validates prices and currency without writes and can POST valid campaign", async ({
  page,
}) => {
  const state = await setup(page)
  await login(page)
  await nav(page, "Promociones")
  await page.getByRole("button", { name: "Editar / detalle" }).click()
  await page
    .getByLabel("Motocicletas de la promoción 1 · Precio promocional")
    .fill("101")
  await page
    .locator(".module-editor")
    .getByRole("button", { name: "Guardar", exact: true })
    .click()
  await expect(page.locator(".module-editor").getByRole("alert")).toContainText(
    "no puede superar",
  )
  expect(state.calls.some((c) => c.method === "PUT")).toBeFalsy()
  await page
    .getByLabel("Motocicletas de la promoción 1 · Precio promocional")
    .fill("90")
  await page
    .getByLabel("Motocicletas de la promoción 1 · Moneda")
    .selectOption("CRC")
  await page
    .locator(".module-editor")
    .getByRole("button", { name: "Guardar", exact: true })
    .click()
  await expect(page.locator(".module-editor").getByRole("alert")).toContainText(
    "moneda debe coincidir",
  )
  await page
    .locator(".module-editor")
    .getByRole("button", { name: "Cancelar", exact: true })
    .click()
  await page.getByRole("button", { name: "Crear registro" }).click()
  for (const [label, val] of Object.entries({
    Título: "Disposable campaign",
    Slug: "disposable-campaign",
    Descripción: "Test",
    "Imagen HTTPS": "https://example.test/p.png",
    "Texto del botón": "Ver",
    "Destino del botón (/ruta o HTTPS)": "/catalogo",
    "Inicio (hora local)": "2026-10-01T00:00",
    "Fin (hora local)": "2026-12-01T00:00",
  }))
    await page.getByLabel(label, { exact: true }).fill(val)
  await page
    .locator(".module-editor")
    .getByRole("button", { name: "Guardar", exact: true })
    .click()
  await expect
    .poll(() => state.docs.promotions.some((d: any) => d.id === "9001"))
    .toBeTruthy()
})
test("structured pages render safe fields and reject raw HTML", async ({
  page,
}) => {
  const state = await setup(page)
  await login(page)
  await nav(page, "Contenido web")
  await page.getByRole("button", { name: "Editar / detalle" }).click()
  await page.getByLabel("Formato del contenido").selectOption("blocks")
  await page.getByRole("button", { name: "Agregar contenido" }).click()
  await page.getByLabel("Contenido 1 · Texto").fill("<script>alert(1)</script>")
  await page
    .locator(".module-editor")
    .getByRole("button", { name: "Guardar", exact: true })
    .click()
  await expect(page.locator(".module-editor").getByRole("alert")).toContainText(
    "sin HTML",
  )
  expect(state.calls.some((c) => c.method === "PUT")).toBeFalsy()
  await page.getByLabel("Contenido 1 · Texto").fill("Safe paragraph")
  await page
    .locator(".module-editor")
    .getByRole("button", { name: "Guardar", exact: true })
    .click()
  await expect
    .poll(() => state.docs.pages[0].content)
    .toEqual([{ type: "paragraph", text: "Safe paragraph" }])
})
test("settings whitelist and single use reauth; profile email and password changes return to login", async ({
  page,
}) => {
  const state = await setup(page)
  await login(page)
  await nav(page, "Configuración")
  await expect(page.getByText("must-not-show")).toHaveCount(0)
  await page.getByLabel("default_currency").selectOption("USD")
  await page.getByRole("button", { name: "Guardar default_currency" }).click()
  await reauth(page)
  await expect(page.getByText("Ajuste guardado", { exact: true })).toBeVisible()
  expect(state.calls.find((c) => c.path === "/auth/reauth").body.action).toBe(
    "settings.manage",
  )
  expect(
    state.calls.find((c) => c.path === "/admin/settings/default_currency").body,
  ).toEqual({ value: "USD" })
  await nav(page, "Mi cuenta")
  await page
    .getByLabel("Correo electrónico", { exact: true })
    .fill("changed@example.test")
  await page.getByRole("button", { name: "Guardar perfil" }).click()
  await reauth(page)
  await expect(
    page.getByRole("heading", { name: "Iniciar sesión" }),
  ).toBeVisible()
  await login(page)
  await nav(page, "Mi cuenta")
  await page.getByLabel("Contraseña actual", { exact: true }).fill(password)
  await page
    .getByLabel("Nueva contraseña", { exact: true })
    .fill("Updated-disposable-password-2026")
  await page
    .getByLabel("Confirmar nueva contraseña")
    .fill("Updated-disposable-password-2026")
  await page
    .getByRole("button", { name: "Cambiar contraseña", exact: true })
    .click()
  await reauth(page)
  await expect(
    page.getByRole("heading", { name: "Iniciar sesión" }),
  ).toBeVisible()
})
test("MFA enrollment QR is local, confirm revokes session and codes only exist in memory", async ({
  page,
}) => {
  const state = await setup(page)
  const external: string[] = []
  page.on("request", (r) => {
    if (
      !r.url().startsWith(BASE) &&
      !r.url().startsWith("http://127.0.0.1") &&
      !r.url().startsWith("data:")
    )
      external.push(r.url())
  })
  await login(page)
  await nav(page, "Mi cuenta")
  await page.getByRole("button", { name: "Preparar MFA" }).click()
  await reauth(page)
  await expect(
    page.getByRole("img", { name: "QR para configurar el autenticador" }),
  ).toHaveAttribute("src", /^data:image\/png;base64,/)
  await page.getByLabel("Código de alta").fill("123456")
  await page.getByRole("button", { name: "Confirmar MFA", exact: true }).click()
  await reauth(page)
  await expect(
    page.getByRole("dialog", { name: "Códigos de recuperación" }),
  ).toBeVisible()
  expect(state.calls.filter((c) => c.path === "/auth/reauth")).toHaveLength(2)
  expect(
    external.some((url) => url.includes("otpauth") || url.includes("secret=")),
  ).toBeFalsy()
  expect(
    await page.evaluate(() => [
      Object.keys(localStorage),
      Object.keys(sessionStorage),
    ]),
  ).toEqual([[], []])
  await page.getByRole("button", { name: "Ya guardé mis códigos" }).click()
  await expect(
    page.getByRole("heading", { name: "Iniciar sesión" }),
  ).toBeVisible()
  await page.reload()
  await expect(page.getByText("test-recovery-1")).toHaveCount(0)
})
test("MFA rotation and disable require factor and different fresh tokens", async ({
  page,
}) => {
  const state = await setup(page)
  state.mfa = true
  await login(page)
  await nav(page, "Mi cuenta")
  await page
    .getByRole("button", { name: "Rotar códigos de recuperación" })
    .click()
  await reauth(page, true)
  await page.getByRole("button", { name: "Ya guardé mis códigos" }).click()
  page.on("dialog", (d) => d.accept())
  await page
    .getByRole("button", { name: "Desactivar MFA", exact: true })
    .click()
  await reauth(page, true)
  await expect(
    page.getByRole("heading", { name: "Iniciar sesión" }),
  ).toBeVisible()
  const tokens = state.calls
    .filter((c) =>
      ["/auth/mfa/recovery-codes", "/auth/mfa/disable"].includes(c.path),
    )
    .map((c) => c.headers["x-reauth-token"])
  expect(new Set(tokens).size).toBe(2)
})
test("forgot is generic, SMTP installation failure is explicit, reset strips fragment before requests", async ({
  page,
}) => {
  const state = await setup(page)
  await page.getByRole("button", { name: "¿Olvidaste tu contraseña?" }).click()
  await page
    .getByLabel("Correo electrónico", { exact: true })
    .fill("nonexistent@example.test")
  state.error = {
    path: "/auth/password/forgot",
    method: "POST",
    status: 503,
    code: "SMTP_NOT_CONFIGURED",
  }
  await page.getByRole("button", { name: "Enviar enlace" }).click()
  await expect(page.getByRole("alert")).toContainText("SMTP_NOT_CONFIGURED")
  state.error = null
  await page.getByRole("button", { name: "Enviar enlace" }).click()
  await expect(page.getByRole("status")).toContainText(
    "Si existe una cuenta activa",
  )
  await page.goto("/reset-password#token=disposable-reset")
  await expect.poll(() => new URL(page.url()).hash).toBe("")
  await page
    .getByLabel("Nueva contraseña", { exact: true })
    .fill("Updated-disposable-password-2026")
  await page
    .getByLabel("Confirmar contraseña")
    .fill("Updated-disposable-password-2026")
  await page.getByRole("button", { name: "Continuar" }).click()
  await expect(page.getByRole("status")).toContainText(
    "Contraseña restablecida",
  )
  expect(
    state.calls.find((c) => c.path === "/auth/password/reset").body,
  ).toEqual({
    token: "disposable-reset",
    newPassword: "Updated-disposable-password-2026",
  })
  expect(
    await page.evaluate(() => [
      Object.keys(localStorage),
      Object.keys(sessionStorage),
    ]),
  ).toEqual([[], []])
})
for (const role of ["sales", "editor", "marketing"])
  test(`${role} module permissions filter menu`, async ({ page }) => {
    await setup(page, "normal", role)
    await login(page)
    const menu = page.getByRole("navigation", { name: "Menú principal" })
    await expect(
      menu.getByRole("button", { name: "Usuarios", exact: true }),
    ).toHaveCount(0)
    await expect(
      menu.getByRole("button", { name: "Configuración", exact: true }),
    ).toHaveCount(0)
    await expect(
      menu.getByRole("button", { name: "Promociones", exact: true }),
    ).toHaveCount(role === "marketing" ? 1 : 0)
    await expect(
      menu.getByRole("button", { name: "Contenido web", exact: true }),
    ).toHaveCount(role === "sales" ? 0 : 1)
    await expect(
      menu.getByRole("button", { name: "Mi cuenta", exact: true }),
    ).toBeVisible()
  })
for (const width of [390, 1440])
  test(`new module layout has no horizontal overflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await setup(page)
    await login(page)
    if (width === 390)
      await page
        .getByRole("button", {
          name: "Mostrar/ocultar barra lateral",
          exact: true,
        })
        .click()
    await nav(page, "Promociones")
    await page.getByRole("button", { name: "Editar / detalle" }).click()
    await expect(page.locator(".module-editor")).toBeVisible()
    await page.screenshot({
      path: `test-results/modules-${width}.png`,
      fullPage: true,
    })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy()
  })
