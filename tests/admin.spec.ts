import { test, expect, type Page } from "@playwright/test"

const BASE = "https://darksalmon-quetzal-730302.hostingersite.com/v1"

const brand = {
  id: "101",
  name: "KTM",
  slug: "ktm",
  description: "Real catalog fixture",
  status: "active",
  order: 1,
  primaryColor: "#FF6600",
  secondaryColor: "#18181B",
  accentLight: "#FFFFFF",
  logo: "",
  heroImageUrl: "https://example.test/hero.jpg",
  tileImageUrl: "",
  tagline: "Ready",
  slogan: "Race",
}

const category = {
  id: "202",
  name: "Naked",
  slug: "naked",
  description: "Street",
  status: "active",
  order: 1,
  brandId: "101",
}

const motorcycle = {
  id: "303",
  brand: "KTM",
  category: "Naked",
  brandId: "101",
  categoryId: "202",
  model: "390 Duke",
  version: "R",
  year: 2026,
  slug: "duke-2026",
  price: 10000,
  promoPrice: 9000,
  currency: "USD",
  sku: "DUKE-26",
  status: "available",
  published: true,
  featured: true,
  isNew: true,
  showPrice: true,
  allowQuote: true,
  displacement: 399,
  hp: 44,
  tagline: "Ready",
  shortDescription: "Street bike",
  description: "Plain text <script>unsafe()</script>",
  inventory: 5,
  specs: [{ group: "Motor", label: "Torque", value: "39 Nm" }],
  colors: [
    {
      id: "404",
      name: "Orange",
      hex: "#FF6600",
      status: "active",
      available: true,
      order: 1,
      images: [
        {
          id: "505",
          url: "https://example.test/image.jpg",
          alt: "Orange motorcycle",
          label: "Front",
          order: 1,
          isPrimary: true,
        },
      ],
    },
  ],
  createdAt: "2026-10-01T12:00:00Z",
  updatedAt: "2026-10-02T12:00:00Z",
  futureField: { keep: true },
}

const lead = {
  id: "606",
  name: "Customer",
  date: "2026-10-04T12:00:00Z",
  phone: "+50688888888",
  email: "customer@example.test",
  brand: "KTM",
  motorcycle: "390 Duke",
  type: "quote",
  status: "new",
  assignedTo: null,
  message: "Quote please",
  notes: [{ note: "Existing note", date: "2026-10-04T12:00:00Z" }],
}

type Call = {
  path: string
  method: string
  body: any
  authorization: string | undefined
}

async function setup(page: Page, role = "admin") {
  const state = {
    brands: [structuredClone(brand)],
    categories: [structuredClone(category)],
    motorcycles: [structuredClone(motorcycle)],
    leads: [structuredClone(lead)],
    calls: [] as Call[],
    error: null as null | { path: string; status: number },
    expired: false,
  }

  await page.route("https://example.test/**", (route) =>
    route.fulfill({ status: 404, body: "" }),
  )

  await page.route(BASE + "/**", async (route) => {
    const req = route.request()
    const path = new URL(req.url()).pathname.replace("/v1", "")
    const method = req.method()
    const body = req.postDataJSON()

    state.calls.push({
      path,
      method,
      body,
      authorization: req.headers().authorization,
    })

    const reply = (data: any, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify({ data }),
      })

    const fail = (status: number) =>
      route.fulfill({
        status,
        contentType: "application/json",
        headers: { "Retry-After": "5", "X-Request-ID": "test-request" },
        body: JSON.stringify({
          error: { code: "TEST_ERROR", message: "Controlled API error" },
        }),
      })

    if (state.error && path === state.error.path && method !== "GET")
      return fail(state.error.status)

    if (path === "/auth/login")
      return reply({
        token: "test-token-only",
        expiresAt: "2026-12-01T00:00:00Z",
        user: {
          id: "7",
          name: "Test Admin",
          email: "admin@example.test",
          role,
          status: "active",
        },
      })

    if (state.expired) return fail(401)

    if (path === "/auth/me")
      return reply({
        id: "7",
        name: "Test Admin",
        email: "admin@example.test",
        role,
        status: "active",
      })

    if (path === "/auth/logout") return reply({ loggedOut: true })

    const parts = path.split("/")
    const kind = parts[2] as "brands" | "categories" | "motorcycles" | "leads"
    const id = parts[3]

    if (!["brands", "categories", "motorcycles", "leads"].includes(kind))
      return fail(404)

    const docs = state[kind] as any[]

    if (method === "GET")
      return reply(id ? docs.find((d) => d.id === id) : docs)

    if (method === "PATCH" && kind === "leads") {
      const doc = docs.find((d) => d.id === id)
      if (body.notes)
        doc.notes.push({ note: body.notes, date: "2026-10-05T00:00:00Z" })

      if ("status" in body) doc.status = body.status
      if ("assignedTo" in body) doc.assignedTo = body.assignedTo || null
      return reply(doc)
    }

    if (method === "DELETE") {
      docs.splice(
        docs.findIndex((d) => d.id === id),
        1,
      )
      return reply({ deleted: true })
    }

    const saved = {
      ...body,
      id: id || "909",
      updatedAt: "2026-10-05T00:00:00Z",
    }

    if (kind === "motorcycles")
      saved.colors = saved.colors.map((c: any, index: number) => ({
        ...c,
        id: c.id.match(/^\d+$/) ? c.id : String(800 + index),
        images: c.images.map((i: any, n: number) => ({
          ...i,
          id: String(900 + n),
        })),
      }))

    if (id)
      docs.splice(
        docs.findIndex((d) => d.id === id),
        1,
        saved,
      )
    else docs.push(saved)
    return reply(saved, id ? 200 : 201)
  })

  await page.goto("/")

  return state
}

async function login(page: Page) {
  await page.getByLabel("Correo electrónico").fill("admin@example.test")

  await page
    .getByLabel("Contraseña", { exact: true })
    .fill("test-password-only")

  await page.getByRole("button", { name: "Ingresar", exact: true }).click()

  await expect(page.getByText("Bienvenido, Test Admin")).toBeVisible()
}

async function nav(page: Page, name: string) {
  await page.locator("nav").getByRole("button", { name, exact: true }).click()
}

async function editMoto(page: Page) {
  await nav(page, "Motocicletas")
  await page.getByTitle("Editar", { exact: true }).click()
  await expect(page.getByLabel("Modelo *")).toHaveValue("390 Duke")
}

test("login, identity, memory-only Bearer, logout and 401", async ({
  page,
}) => {
  const state = await setup(page)

  await expect(page.getByLabel("Correo electrónico")).toHaveValue("")
  await expect(page.getByLabel("Contraseña", { exact: true })).toHaveValue("")

  await login(page)
  expect(state.calls.find((c) => c.path === "/auth/me")?.authorization).toBe(
    "Bearer test-token-only",
  )

  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([])
  expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual([])

  await page
    .locator("aside")
    .getByRole("button", { name: "Cerrar sesión", exact: true })
    .click()
  await expect(
    page.getByRole("heading", { name: "Iniciar sesión" }),
  ).toBeVisible()
  expect(state.calls.some((c) => c.path === "/auth/logout")).toBeTruthy()

  await login(page)
  state.expired = true
  await nav(page, "Marcas")
  await expect(
    page.getByRole("heading", { name: "Iniciar sesión" }),
  ).toBeVisible()

  state.expired = false
  await login(page)
  await page.reload()
  await expect(
    page.getByRole("heading", { name: "Iniciar sesión" }),
  ).toBeVisible()
})

test("full PUT preserves publication, prices, currency, specs, galleries and server IDs", async ({
  page,
}) => {
  const state = await setup(page)
  await login(page)
  await editMoto(page)

  await page.getByLabel("Modelo *").fill("390 Duke Updated")

  await page.getByRole("button", { name: "Guardar ficha", exact: true }).click()
  await expect(
    page.getByText("Motocicleta guardada", { exact: true }),
  ).toBeVisible()

  const put = state.calls.find(
    (c) => c.method === "PUT" && c.path === "/admin/motorcycles/303",
  )!

  expect(put.body).toMatchObject({
    model: "390 Duke Updated",
    currency: "USD",
    price: 10000,
    promoPrice: 9000,
    published: true,
    inventory: 5,
    specs: motorcycle.specs,
    futureField: { keep: true },
  })
  expect(put.body.colors[0].images[0].url).toBe(
    motorcycle.colors[0].images[0].url,
  )

  await page
    .getByRole("button", { name: "Colores y Galerías", exact: true })
    .click()
  await page.getByRole("button", { name: "Agregar color", exact: true }).click()

  await page.getByLabel("Nombre comercial").fill("Black")
  await page
    .getByRole("button", { name: "Agregar vista", exact: true })
    .last()
    .click()

  await page.getByLabel("Enlace HTTPS").last().fill("http://unsafe.test/a.jpg")

  const count = state.calls.filter((c) => c.method === "PUT").length
  await page.getByRole("button", { name: "Guardar ficha", exact: true }).click()
  await expect(page.getByRole("alert")).toContainText("HTTPS")
  expect(state.calls.filter((c) => c.method === "PUT")).toHaveLength(count)

  await page
    .getByLabel("Enlace HTTPS")
    .last()
    .fill("https://example.test/black.jpg")
  await page.getByRole("button", { name: "Guardar ficha", exact: true }).click()

  await expect.poll(() => state.motorcycles[0].colors.length).toBe(2)

  await page
    .getByRole("button", { name: "Inventario", exact: true })
    .last()
    .click()
  await page.getByLabel("Cantidad total").fill("9")
  await page.getByRole("button", { name: "Guardar ficha", exact: true }).click()
  await expect.poll(() => state.motorcycles[0].inventory).toBe(9)

  const last = state.calls.filter((c) => c.method === "PUT").at(-1)!
  expect(last.body.colors[1].id).toBe("801")
  expect(last.body.colors[1].images[0].id).toBe("900")
})

test("brand/category CRUD uses server IDs and preserves presentation fields", async ({
  page,
}) => {
  const state = await setup(page)
  await login(page)
  await nav(page, "Marcas")
  await page.getByRole("button", { name: "Editar", exact: true }).click()
  await page.getByLabel("Nombre *").fill("KTM Updated")
  await page.getByRole("button", { name: "Guardar", exact: true }).click()

  await expect.poll(() => state.brands[0].name).toBe("KTM Updated")
  expect(
    state.calls.find(
      (c) => c.method === "PUT" && c.path === "/admin/brands/101",
    )?.body.heroImageUrl,
  ).toBe(brand.heroImageUrl)

  await nav(page, "Categorías")
  await page
    .getByRole("button", { name: "Nueva categoría", exact: true })
    .click()
  await page.getByLabel("Nombre", { exact: true }).fill("Adventure")
  await page.getByLabel("Slug", { exact: true }).fill("adventure")
  await page.getByLabel("Marca", { exact: true }).selectOption("101")
  await page.getByRole("button", { name: "Guardar", exact: true }).click()

  await expect(
    page.getByRole("cell", { name: "Adventure", exact: true }),
  ).toBeVisible()
  expect(
    state.calls.find(
      (c) => c.method === "POST" && c.path === "/admin/categories",
    )?.body.brandId,
  ).toBe("101")

  await page
    .getByRole("button", { name: "Editar Adventure", exact: true })
    .click()
  await page.getByLabel("Descripción", { exact: true }).fill("Updated category")
  await page.getByRole("button", { name: "Guardar", exact: true }).click()
  await expect
    .poll(() => state.categories.find((c) => c.id === "909")?.description)
    .toBe("Updated category")

  page.on("dialog", (d) => d.accept())
  await page
    .getByRole("button", { name: "Eliminar Adventure", exact: true })
    .click()
  await expect(
    page.getByRole("cell", { name: "Adventure", exact: true }),
  ).toHaveCount(0)
})

test("lead notes append and assignment is a user ID; sales cannot access catalog", async ({
  page,
}) => {
  const state = await setup(page, "sales")
  await login(page)
  await expect(
    page
      .locator("nav")
      .getByRole("button", { name: "Motocicletas", exact: true }),
  ).toHaveCount(0)

  await nav(page, "Leads")
  await page
    .getByRole("cell", { name: "Customer customer@example.test" })
    .click()
  await page.getByLabel("Nueva nota").fill("Second note")
  await page.getByRole("button", { name: "Agregar nota", exact: true }).click()
  await expect(page.getByText("Second note", { exact: true })).toBeVisible()
  expect(state.leads[0].notes).toHaveLength(2)

  await page.getByLabel("ID del responsable").fill("7")
  await page
    .getByRole("button", { name: "Guardar asignación", exact: true })
    .click()
  await expect.poll(() => state.leads[0].assignedTo).toBe("7")

  expect(state.calls.filter((c) => c.method === "PATCH").at(-1)?.body).toEqual({
    assignedTo: "7",
  })
  expect(state.calls.some((c) => c.path === "/admin/users")).toBeFalsy()
})

for (const role of ["editor", "marketing"])
  test(`${role} publication and deletion restrictions`, async ({ page }) => {
    await setup(page, role)
    await login(page)

    if (role === "marketing") {
      await nav(page, "Motocicletas")
      await page.getByTitle("Ver", { exact: true }).click()
      await expect(page.getByLabel("Modelo *")).toHaveValue("390 Duke")
    } else {
      await editMoto(page)
    }

    await expect(
      page.getByRole("button", { name: "Publicar", exact: true }),
    ).toBeDisabled()
    await expect(
      page.getByRole("button", { name: "Mostrar en web", exact: true }),
    ).toBeDisabled()

    if (role === "marketing")
      await expect(
        page.getByRole("button", { name: "Guardar ficha", exact: true }),
      ).toBeDisabled()
  })

for (const status of [403, 409, 422, 429])
  test(`API ${status}: keep input, no false save confirmation`, async ({
    page,
  }) => {
    const state = await setup(page)
    await login(page)
    await editMoto(page)
    state.error = { path: "/admin/motorcycles/303", status }
    await page.getByLabel("Modelo *").fill("Unsaved value")
    await page
      .getByRole("button", { name: "Guardar ficha", exact: true })
      .click()

    await expect(page.getByRole("alert")).toContainText("Controlled API error")
    await expect(page.getByLabel("Modelo *")).toHaveValue("Unsaved value")
    await expect(
      page.getByText("Motocicleta guardada", { exact: true }),
    ).toHaveCount(0)
    expect(state.motorcycles[0].model).toBe("390 Duke")
  })

test("empty catalog and unavailable API show explicit states, no silent fallback", async ({
  page,
}) => {
  const state = await setup(page)
  state.brands = []
  state.motorcycles = []
  state.categories = []
  await login(page)
  await nav(page, "Motocicletas")
  await expect(page.getByText("Sin resultados", { exact: true })).toBeVisible()

  await page.route(BASE + "/admin/brands", (route) => route.abort("failed"))
  await nav(page, "Marcas")
  await expect(page.getByRole("alert")).toContainText("No se pudo conectar")
  await expect(
    page.getByRole("button", { name: "Reintentar", exact: true }),
  ).toBeVisible()
})

test("create motorcycle, edit specs, then delete uses returned ID", async ({
  page,
}) => {
  const state = await setup(page)
  await login(page)
  await nav(page, "Motocicletas")
  await page
    .getByRole("button", { name: "Nueva motocicleta", exact: true })
    .click()

  await page.getByLabel("Marca *", { exact: false }).selectOption("101")
  await page.getByLabel("Modelo *").fill("New Model")
  await page.getByLabel("Categoría *", { exact: false }).selectOption("202")
  await page.getByLabel("Slug *").fill("new-model-2026")
  await page.getByLabel("Precio *", { exact: true }).fill("3000")

  await page.getByRole("button", { name: "Guardar ficha", exact: true }).click()
  await expect
    .poll(() => state.motorcycles.some((m) => m.id === "909"))
    .toBeTruthy()

  await page
    .getByRole("button", { name: "Especificaciones", exact: true })
    .click()
  await page
    .getByRole("button", { name: "Agregar especificación", exact: true })
    .click()
  await page.getByPlaceholder("Potencia", { exact: true }).fill("ABS")
  await page.getByPlaceholder("44 hp", { exact: true }).fill("Sí")
  await page.getByRole("button", { name: "Guardar ficha", exact: true }).click()

  await expect
    .poll(() => state.motorcycles.find((m) => m.id === "909")?.specs)
    .toEqual([{ group: "General", label: "ABS", value: "Sí" }])
  expect(
    state.calls.some(
      (c) => c.path === "/admin/motorcycles/909" && c.method === "PUT",
    ),
  ).toBeTruthy()

  await nav(page, "Motocicletas")
  await page
    .getByRole("row")
    .filter({ hasText: "New Model" })
    .getByTitle("Eliminar", { exact: true })
    .click()
  await page.getByRole("button", { name: "Eliminar", exact: true }).last().click()
  await expect
    .poll(() => state.motorcycles.some((m) => m.id === "909"))
    .toBeFalsy()
})

test("new brand POST and delete, pending modules never call undocumented endpoints", async ({
  page,
}) => {
  const state = await setup(page)
  await login(page)
  await nav(page, "Marcas")
  await page.getByRole("button", { name: "Nueva marca", exact: true }).click()
  await page.getByLabel("Nombre *").fill("New Brand")
  await page.getByLabel("Slug", { exact: true }).fill("new-brand")
  await page.getByRole("button", { name: "Guardar", exact: true }).click()
  await expect.poll(() => state.brands.some((b) => b.id === "909")).toBeTruthy()
  page.on("dialog", (d) => d.accept())
  await page
    .getByRole("button", { name: "Eliminar New Brand", exact: true })
    .click()
  await expect.poll(() => state.brands.some((b) => b.id === "909")).toBeFalsy()

  for (const name of [
    "Promociones",
    "Contenido web",
    "Usuarios",
    "Configuración",
  ]) {
    await nav(page, name)
    await expect(
      page.getByText("Pendiente: la API v1 todavía no ofrece esta función.", {
        exact: true,
      }),
    ).toBeVisible()
  }

  expect(
    state.calls.some((c) =>
      /^\/admin\/(promotions|content|users|settings)/.test(c.path),
    ),
  ).toBeFalsy()
})


test("grouped sidebar, icon tooltip and keyboard collapse preserve navigation", async ({ page }) => {
  await setup(page)
  await login(page)
  const sidebar = page.getByRole("complementary", { name: "Barra lateral" })
  for (const label of ["General", "Gestión", "Operación", "Sistema"])
    await expect(sidebar.getByText(label, { exact: true })).toBeVisible()
  const toggle = page.getByRole("button", { name: "Mostrar/ocultar barra lateral", exact: true })
  await expect(toggle).toHaveText("")
  await toggle.hover()
  await expect(page.getByRole("tooltip")).toHaveCSS("opacity", "1")
  await toggle.click()
  await expect(toggle).toHaveAttribute("aria-expanded", "false")
  await expect(sidebar).toHaveCSS("width", "72px")
  await nav(page, "Motocicletas")
  await expect(page.locator('[data-status="available"]')).toHaveText("Disponible")
  await page.keyboard.press("Control+Shift+S")
  await expect(toggle).toHaveAttribute("aria-expanded", "true")
  await expect(sidebar).toHaveCSS("width", "248px")
  await expect(page.locator('nav [aria-current="page"]')).toHaveAttribute("aria-label", "Motocicletas")
  await page.mouse.move(900, 900)
  await page.screenshot({ path: "test-results/admin-ui-catalog.png", fullPage: true })
})

test("Sonner announces confirmed saves and errors; status boxes include colored dots", async ({ page }) => {
  const state = await setup(page)
  await login(page)
  await nav(page, "Motocicletas")
  const badge = page.locator('[data-status="available"]')
  await expect(badge).toHaveCSS("border-radius", "10px")
  await expect(badge).toHaveCSS("background-color", "rgb(240, 250, 244)")
  await expect(badge.locator('[aria-hidden="true"]')).toHaveCount(1)
  await editMoto(page)
  await page.getByRole("button", { name: "Guardar ficha", exact: true }).click()
  await expect(page.locator('[data-sonner-toast][data-type="success"]').filter({ hasText: "Motocicleta guardada" })).toBeVisible()
  state.error = { path: "/admin/motorcycles/303", status: 422 }
  await page.getByLabel("Modelo *").fill("Rejected change")
  await page.getByRole("button", { name: "Guardar ficha", exact: true }).click()
  await expect(page.locator('[data-sonner-toast][data-type="error"]').filter({ hasText: "Controlled API error" })).toBeVisible()
  await expect(page.getByLabel("Modelo *")).toHaveValue("Rejected change")
  await page.screenshot({ path: "test-results/admin-ui-toast.png", fullPage: true })
})
