import { describe, expect, it } from "vitest";
import { hasMorePages, olderThanFilter, oldestCursor, PAGE_SIZE } from "./cursor.ts";

describe("olderThanFilter", () => {
  it("uses both created_at and id so equal timestamps do not duplicate", () => {
    expect(
      olderThanFilter({ createdAt: "2026-09-09T12:00:00.000Z", id: "msg-2" }),
    ).toBe(
      'created_at.lt."2026-09-09T12:00:00.000Z",and(created_at.eq."2026-09-09T12:00:00.000Z",id.lt.msg-2)',
    );
  });
});

describe("hasMorePages", () => {
  it("is true when a full page of 50 was fetched", () => {
    expect(hasMorePages(PAGE_SIZE)).toBe(true);
    expect(hasMorePages(50)).toBe(true);
  });

  it("is false when fewer than 50 rows remain", () => {
    expect(hasMorePages(49)).toBe(false);
    expect(hasMorePages(0)).toBe(false);
  });
});

describe("oldestCursor", () => {
  it("reads the first rendered (oldest) message as the next page cursor", () => {
    expect(
      oldestCursor([
        { createdAt: "2026-09-09T10:00:00.000Z", id: "old" },
        { createdAt: "2026-09-09T11:00:00.000Z", id: "new" },
      ]),
    ).toEqual({ createdAt: "2026-09-09T10:00:00.000Z", id: "old" });
  });

  it("returns null when history is empty", () => {
    expect(oldestCursor([])).toBeNull();
  });
});
