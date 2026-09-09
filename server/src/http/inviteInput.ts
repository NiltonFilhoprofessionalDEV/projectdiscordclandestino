import type { CreateInviteInput } from "../../../shared/api.ts";
import { fail } from "../repositories/errors.ts";

const ISO_TIMESTAMP =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

function isIsoTimestamp(value: string): boolean {
  return ISO_TIMESTAMP.test(value) && !Number.isNaN(Date.parse(value));
}

export function parseInviteBody(body: unknown) {
  if (body == null) {
    return { ok: true as const, data: {} satisfies CreateInviteInput };
  }
  if (typeof body !== "object") {
    return fail("VALIDATION", "JSON inválido.");
  }

  const { expiresAt, maxUses } = body as Record<string, unknown>;
  const data: CreateInviteInput = {};

  if (expiresAt !== undefined) {
    if (expiresAt !== null && (typeof expiresAt !== "string" || !isIsoTimestamp(expiresAt))) {
      return fail("VALIDATION", "Data de expiração inválida.");
    }
    data.expiresAt = expiresAt;
  }

  if (maxUses !== undefined) {
    if (maxUses !== null && (!Number.isInteger(maxUses) || (maxUses as number) <= 0)) {
      return fail("VALIDATION", "Limite de usos inválido.");
    }
    data.maxUses = maxUses as number | null;
  }

  return { ok: true as const, data };
}
