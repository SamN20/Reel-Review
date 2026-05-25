import { describe, expect, it } from "vitest";

import {
  formatEasternDate,
  getDateOnlyYear,
  isDateBeforeEasternToday,
  parseDateOnlyUTC,
  toEasternDateString,
} from "./dateUtils";

describe("Eastern date utilities", () => {
  it("keeps late Sunday UTC time on the Eastern Sunday calendar date", () => {
    const sundayEveningEastern = new Date("2026-05-25T03:30:00Z");

    expect(formatEasternDate(sundayEveningEastern)).toBe("2026-05-24");
    expect(isDateBeforeEasternToday("2026-05-24", sundayEveningEastern)).toBe(false);
  });

  it("treats the drop as ended after Monday midnight Eastern", () => {
    const mondayEastern = new Date("2026-05-25T04:01:00Z");

    expect(formatEasternDate(mondayEastern)).toBe("2026-05-25");
    expect(isDateBeforeEasternToday("2026-05-24", mondayEastern)).toBe(true);
  });

  it("parses date-only strings without local timezone drift", () => {
    expect(parseDateOnlyUTC("2026-05-24").toISOString()).toBe("2026-05-24T00:00:00.000Z");
  });

  it("converts timestamps to Eastern calendar dates for filtering", () => {
    expect(toEasternDateString("2026-05-25T03:30:00Z")).toBe("2026-05-24");
  });

  it("reads years directly from date-only strings", () => {
    expect(getDateOnlyYear("2026-01-01")).toBe(2026);
  });
});
