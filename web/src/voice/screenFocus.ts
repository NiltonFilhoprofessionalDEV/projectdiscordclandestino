type ShareRef = { identity: string; isLocal: boolean };

/**
 * Transmissão que ocupa o palco. Mantém a escolha do usuário enquanto ela existir;
 * sem escolha válida, prefere a de outra pessoa — assistir a própria tela é raro.
 */
export function resolveFocusedShare<T extends ShareRef>(
  shares: readonly T[],
  preferredIdentity: string | null,
): T | null {
  const preferred = shares.find((share) => share.identity === preferredIdentity);
  if (preferred) {
    return preferred;
  }
  return shares.find((share) => !share.isLocal) ?? shares[0] ?? null;
}
