import { describe, expect, it } from "vitest";
import { supabase } from "../services/supabase.ts";

describe("supabase test stub", () => {
  it("replaces the browser client so tests never hit the live SDK", async () => {
    const result = await supabase.from("messages").select("*");
    expect(result).toEqual({ data: null, error: null });
  });
});
