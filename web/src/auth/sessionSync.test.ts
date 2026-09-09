import { describe, expect, it } from "vitest";
import type { Session, User } from "@supabase/supabase-js";
import { applyAuthSnapshot, type SessionSink } from "./sessionSync.ts";
import type { Profile } from "./types.ts";

function createSink() {
  let session: Session | null = null;
  let user: User | null = null;
  let profile: Profile | null = { id: "stale" } as Profile;
  let error: string | null = "stale";
  let loading = true;
  const sink: SessionSink = {
    isCancelled: () => false,
    setSession: (value) => {
      session = value;
    },
    setUser: (value) => {
      user = value;
    },
    setProfile: (value) => {
      profile = value;
    },
    setError: (value) => {
      error = value;
    },
    setLoading: (value) => {
      loading = value;
    },
  };
  return {
    sink,
    snapshot: () => ({ session, user, profile, error, loading }),
  };
}

describe("applyAuthSnapshot", () => {
  it("clears the user and finishes loading when storage restore has no session", () => {
    const { sink, snapshot } = createSink();
    applyAuthSnapshot(null, sink);
    expect(snapshot()).toMatchObject({
      session: null,
      user: null,
      profile: null,
      error: null,
      loading: false,
    });
  });

  it("keeps loading until the profile fetch when a session is restored", () => {
    const { sink, snapshot } = createSink();
    applyAuthSnapshot(
      {
        access_token: "tok",
        user: { id: "user-1" },
      } as Session,
      sink,
    );
    expect(snapshot().loading).toBe(true);
    expect(snapshot().user?.id).toBe("user-1");
  });
});
