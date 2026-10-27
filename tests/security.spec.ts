import { test, expect } from "@playwright/test"
import { validApiData } from "../src/lib/responseValidation"
import { validateMotorcycle } from "../src/lib/validation"
import { can, canReadCatalog } from "../src/lib/permissions"

test("auth response validation never turns a limited challenge into a session", () => {
  const expiresAt = "2099-01-01T00:00:00Z"
  const user = {
    id: "7",
    name: "Test",
    email: "test@example.test",
    role: "admin",
    status: "active",
  }
  expect(
    validApiData(
      "/auth/login",
      "POST",
      { token: "disposable", user, expiresAt },
      {},
    ),
  ).toBeTruthy()
  for (const challenge of ["mfa_login", "password_change"])
    expect(
      validApiData(
        "/auth/login",
        "POST",
        { challenge, challengeToken: "disposable", expiresAt },
        {},
      ),
    ).toBeTruthy()
  expect(
    validApiData(
      "/auth/login",
      "POST",
      { token: "disposable", user: { ...user, status: "inactive" }, expiresAt },
      {},
    ),
  ).toBeFalsy()
  for (const data of [
    {},
    { token: "disposable", expiresAt },
    { token: "disposable", user, expiresAt, challenge: "mfa_login" },
    { challenge: "reauth", challengeToken: "disposable", expiresAt },
    { challenge: "mfa_login", challengeToken: "disposable", user, expiresAt },
  ])
    expect(validApiData("/auth/login", "POST", data, {})).toBeFalsy()
})

test("write response validation rejects missing fields, false confirmations and invented codes", () => {
  const sent = { name: "Test", status: "active" }
  expect(
    validApiData("/admin/brands/7", "PUT", { id: "7", ...sent }, sent),
  ).toBeTruthy()
  for (const data of [
    {},
    null,
    { id: "7", name: "Test" },
    { id: "7", name: "Test", status: false },
  ])
    expect(validApiData("/admin/brands/7", "PUT", data, sent)).toBeFalsy()
  expect(
    validApiData("/admin/brands/7", "DELETE", { deleted: true }, undefined),
  ).toBeTruthy()
  expect(
    validApiData("/admin/brands/7", "DELETE", { deleted: false }, undefined),
  ).toBeFalsy()
  expect(
    validApiData(
      "/admin/brands/7",
      "DELETE",
      { deleted: true, id: "8" },
      undefined,
    ),
  ).toBeFalsy()
  expect(
    validApiData(
      "/auth/password/change",
      "POST",
      { changed: false, loginRequired: true },
      {},
    ),
  ).toBeFalsy()
  expect(
    validApiData(
      "/auth/mfa/confirm",
      "POST",
      { enabled: true, loginRequired: true, recoveryCodes: [] },
      {},
    ),
  ).toBeFalsy()
  expect(
    validApiData(
      "/auth/mfa/recovery-codes",
      "POST",
      { recoveryCodes: ["same", "same"] },
      {},
    ),
  ).toBeFalsy()
  expect(
    validApiData(
      "/auth/mfa/enroll",
      "POST",
      { otpauthUri: "https://external.example.test/qr" },
      {},
    ),
  ).toBeFalsy()
})

test("catalog blocks executable and credentialed image URLs before submitting", () => {
  const moto = {
    brandId: "1",
    categoryId: "2",
    model: "Test",
    slug: "test-model",
    year: 2026,
    inventory: 0,
    price: 100,
    displacement: 0,
    hp: 0,
    colors: [
      {
        id: "color",
        name: "Color",
        hex: "#000000",
        status: "active" as const,
        available: true,
        order: 0,
        images: [
          {
            id: "image",
            url: "https://example.test/photo.png",
            label: "",
            alt: "",
            order: 0,
            isPrimary: true,
          },
        ],
      },
    ],
  }
  expect(() => validateMotorcycle(moto)).not.toThrow()
  for (const url of [
    "javascript:alert(1)",
    "data:image/svg+xml,example",
    "https://test:placeholder@example.test/photo.png",
  ])
    expect(() =>
      validateMotorcycle({
        ...moto,
        colors: [
          { ...moto.colors[0], images: [{ ...moto.colors[0].images[0], url }] },
        ],
      }),
    ).toThrow("HTTPS sin credenciales")
})

test("explicit server grants are honored without granting unknown roles by default", () => {
  const user = {
    id: "7",
    name: "Test",
    email: "test@example.test",
    status: "active" as const,
    lastAccess: "",
    role: "delegated",
  }
  expect(can(user, "content.manage")).toBeFalsy()
  expect(
    can({ ...user, permissions: ["content.manage"] }, "content.manage"),
  ).toBeTruthy()
  expect(
    can({ ...user, role: "admin", permissions: [] }, "users.manage"),
  ).toBeFalsy()
  expect(
    canReadCatalog({ ...user, permissions: ["motorcycles.read"] }),
  ).toBeFalsy()
  expect(can({ ...user, role: "editor" }, "inventory.manage")).toBeFalsy()
})

test("received gallery credentials or a mismatched resource ID are rejected", () => {
  const moto = {
    id: "7",
    model: "Test",
    currency: "USD",
    colors: [
      {
        images: [{ url: "https://fixture:placeholder@example.test/image.png" }],
      },
    ],
  }
  expect(
    validApiData("/admin/motorcycles/7", "GET", moto, undefined),
  ).toBeFalsy()
  expect(
    validApiData(
      "/admin/brands/7",
      "PUT",
      { id: "8", name: "Wrong" },
      { name: "Wrong" },
    ),
  ).toBeFalsy()
})
