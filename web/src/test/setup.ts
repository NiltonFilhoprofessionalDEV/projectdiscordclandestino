import { vi } from "vitest";

vi.mock("../services/supabase.ts", async () => await import("./supabase.stub.ts"));
