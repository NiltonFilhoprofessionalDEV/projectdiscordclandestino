import { describe, expect, it, vi } from "vitest";
import { requireUser } from "./supabase.ts";

const ACCESS_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJlbWFpbCI6Im5pbHRvbkBleGFtcGxlLnRlc3QifQ.signature";

const verifiedUser = {
  id: "user-1",
  email: "nilton@example.test",
};

function mockAuthClient(
  result: { data: { user: typeof verifiedUser | null }; error: { message: string } | null },
) {
  const getUser = vi.fn().mockResolvedValue(result);
  return { auth: { getUser } };
}

describe("requireUser", () => {
  it("rejects a missing bearer without calling getUser", async () => {
    const client = mockAuthClient({ data: { user: verifiedUser }, error: null });

    await expect(requireUser(undefined, client)).resolves.toEqual({
      ok: false,
      error: { code: "UNAUTHENTICATED", message: "Sessão inválida ou expirada." },
    });
    expect(client.auth.getUser).not.toHaveBeenCalled();
  });

  it("rejects a malformed bearer without calling getUser", async () => {
    const client = mockAuthClient({ data: { user: verifiedUser }, error: null });

    for (const header of ["Bearer", "Basic abc", "bearer", "Bearer token extra", "Token " + ACCESS_TOKEN]) {
      await expect(requireUser(header, client)).resolves.toEqual({
        ok: false,
        error: { code: "UNAUTHENTICATED", message: "Sessão inválida ou expirada." },
      });
    }
    expect(client.auth.getUser).not.toHaveBeenCalled();
  });

  it("rejects an invalid token after getUser fails", async () => {
    const client = mockAuthClient({
      data: { user: null },
      error: { message: "invalid JWT" },
    });

    await expect(requireUser(`Bearer ${ACCESS_TOKEN}`, client)).resolves.toEqual({
      ok: false,
      error: { code: "UNAUTHENTICATED", message: "Sessão inválida ou expirada." },
    });
    expect(client.auth.getUser).toHaveBeenCalledOnce();
    expect(client.auth.getUser).toHaveBeenCalledWith(ACCESS_TOKEN);
  });

  it("returns the verified user from getUser, not a decoded JWT payload", async () => {
    const client = mockAuthClient({ data: { user: verifiedUser }, error: null });

    await expect(requireUser(`Bearer ${ACCESS_TOKEN}`, client)).resolves.toEqual({
      ok: true,
      user: verifiedUser,
    });
    expect(client.auth.getUser).toHaveBeenCalledOnce();
    expect(client.auth.getUser).toHaveBeenCalledWith(ACCESS_TOKEN);
    expect(client.auth.getUser).not.toHaveBeenCalledWith(
      expect.objectContaining({ sub: "user-1" }),
    );
  });
});
