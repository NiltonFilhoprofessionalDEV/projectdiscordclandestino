import { createClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

const keys = vi.hoisted(() => ({
  SUPABASE_URL: "http://127.0.0.1:54321",
  SUPABASE_SECRET_KEY: "service-role-secret-key",
  SUPABASE_PUBLISHABLE_KEY: "",
}));

vi.mock("./config.ts", () => keys);
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ auth: {} })),
}));

const { createUserClient } = await import("./supabase.ts");

describe("createUserClient", () => {
  beforeEach(() => {
    keys.SUPABASE_PUBLISHABLE_KEY = "";
    vi.mocked(createClient).mockClear();
  });

  it("fails closed without a publishable key and never uses the secret key", () => {
    expect(() => createUserClient("user-access-token")).toThrow(
      "Supabase público do servidor não configurado.",
    );
    expect(createClient).not.toHaveBeenCalled();
  });

  it("builds the user client with the publishable key and the caller JWT", () => {
    keys.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_anon";

    createUserClient("user-access-token");

    expect(createClient).toHaveBeenCalledOnce();
    expect(createClient).toHaveBeenCalledWith(
      "http://127.0.0.1:54321",
      "sb_publishable_anon",
      expect.objectContaining({
        global: { headers: { Authorization: "Bearer user-access-token" } },
      }),
    );
    expect(createClient).not.toHaveBeenCalledWith(
      expect.anything(),
      "service-role-secret-key",
      expect.anything(),
    );
  });
});
