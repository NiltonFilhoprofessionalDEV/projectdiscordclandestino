import { describe, expect, it } from "vitest";
import type { ChannelId } from "../../../shared/community.ts";
import { needsVoiceSwitchConfirm, occupancyWithoutLocalElsewhere } from "./switch.ts";

const warzone = "warzone" as ChannelId;
const estudos = "estudos" as ChannelId;

describe("needsVoiceSwitchConfirm", () => {
  it("asks only when already in a different voice channel", () => {
    expect(needsVoiceSwitchConfirm(null, estudos)).toBe(false);
    expect(needsVoiceSwitchConfirm(estudos, estudos)).toBe(false);
    expect(needsVoiceSwitchConfirm(warzone, estudos)).toBe(true);
  });
});

describe("occupancyWithoutLocalElsewhere", () => {
  it("keeps the local user only in the active voice channel", () => {
    const filtered = occupancyWithoutLocalElsewhere(
      {
        [warzone]: [{ identity: "nilton" }, { identity: "breno" }],
        [estudos]: [{ identity: "nilton" }, { identity: "breno" }],
      },
      "nilton",
      warzone,
    );

    expect(filtered[warzone]?.map((item) => item.identity)).toEqual(["nilton", "breno"]);
    expect(filtered[estudos]?.map((item) => item.identity)).toEqual(["breno"]);
  });

  it("hides the local user from every room when they are not in voice", () => {
    const filtered = occupancyWithoutLocalElsewhere(
      {
        [warzone]: [{ identity: "nilton" }],
      },
      "nilton",
      null,
    );

    expect(filtered[warzone]).toEqual([]);
  });
});
