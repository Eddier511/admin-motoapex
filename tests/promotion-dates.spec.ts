import { test, expect } from "@playwright/test"
import { promotionDatesValid } from "../src/lib/promotionDates"
import { promotionPayload, promotionDay } from "../src/lib/promotionEditor"
import { validApiData } from "../src/lib/responseValidation"

test("optional promotion dates follow all four API combinations without inventing limits", () => {
  for (const [startsAt, endsAt] of [
    [null, null],
    ["2026-10-28T12:34:56Z", null],
    [null, "2026-10-30T20:00:00-06:00"],
    ["2026-10-28T12:34:56Z", "2026-10-30T20:00:00-06:00"],
  ]) {
    const dates = { startsAt, endsAt }
    expect(promotionDatesValid(dates)).toBeTruthy()
    expect(promotionPayload(dates, [])).toMatchObject(dates)
    expect(
      validApiData(
        "/admin/promotions",
        "GET",
        [{ id: "8", title: "Oferta", ...dates }],
        undefined,
      ),
    ).toBeTruthy()
    expect(
      validApiData(
        "/admin/promotions/8",
        "PUT",
        { id: "8", title: "Oferta", ...dates },
        dates,
      ),
    ).toBeTruthy()
  }
  expect(promotionDay(null)).toBe("")
  expect(promotionPayload({ startsAt: "", endsAt: "" }, [])).toMatchObject({
    startsAt: null,
    endsAt: null,
  })
  expect(
    promotionPayload({ startsAt: "2026-10-28", endsAt: "2026-10-30" }, []),
  ).toMatchObject({
    startsAt: "2026-10-28T00:00:00-06:00",
    endsAt: "2026-10-30T23:59:59-06:00",
  })
})

test("promotion responses reject omitted, unzoned, impossible and reversed dates", () => {
  for (const dates of [
    {},
    { startsAt: null },
    { endsAt: null },
    ...[
      "",
      "null",
      false,
      123,
      "2026-10-28T12:00:00",
      "2026-02-30T00:00:00Z",
      "2026-10-28T24:01:00Z",
      "2026-10-28T12:00:00+25:00",
    ].map((startsAt) => ({ startsAt, endsAt: null })),
    { startsAt: "2026-10-29T00:00:00Z", endsAt: "2026-10-28T00:00:00Z" },
  ]) {
    expect(promotionDatesValid(dates)).toBeFalsy()
    expect(
      validApiData(
        "/admin/promotions/8",
        "GET",
        { id: "8", title: "Oferta", ...dates },
        undefined,
      ),
    ).toBeFalsy()
  }
  // Compare instants, not the written dates or zone offsets; equal bounds are valid.
  expect(
    promotionDatesValid({
      startsAt: "2026-10-28T23:00:00-06:00",
      endsAt: "2026-10-29T04:00:00Z",
    }),
  ).toBeFalsy()
  expect(
    promotionDatesValid({
      startsAt: "2026-10-28T23:00:00-06:00",
      endsAt: "2026-10-29T05:00:00Z",
    }),
  ).toBeTruthy()
})
