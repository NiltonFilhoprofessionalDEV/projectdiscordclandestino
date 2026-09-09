import type { ApiErrorCode, ApiResult } from "../../../shared/api.ts";

export function fail(code: ApiErrorCode, message: string): ApiResult<never> {
  return { ok: false, error: { code, message } };
}

export function mapRepositoryError(error: {
  code?: string;
  message?: string;
} | null): ApiResult<never> {
  const code = error?.code;
  if (code === "23505") {
    return fail("CONFLICT", "Já existe um recurso com esse nome.");
  }
  if (code === "23514" || code === "23502") {
    return fail("VALIDATION", "Dados inválidos.");
  }
  if (code === "42501") {
    return fail("FORBIDDEN", "Sem permissão.");
  }
  if (code === "P0002") {
    return fail("NOT_FOUND", "Convite inválido.");
  }
  if (code === "P0001") {
    return fail("VALIDATION", "Convite inválido ou expirado.");
  }
  console.error("repository error", { code });
  return fail("INTERNAL", "Não foi possível concluir a operação.");
}
