export const PAGE_SIZE = 50;

export type MessageCursor = {
  createdAt: string;
  id: string;
};

export function olderThanFilter(cursor: MessageCursor): string {
  const createdAt = `"${cursor.createdAt}"`;
  return `created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${cursor.id})`;
}

export function hasMorePages(fetchedCount: number, pageSize = PAGE_SIZE): boolean {
  return fetchedCount >= pageSize;
}

export function oldestCursor(
  messages: ReadonlyArray<{ createdAt: string; id: string }>,
): MessageCursor | null {
  const oldest = messages[0];
  if (!oldest) {
    return null;
  }
  return { createdAt: oldest.createdAt, id: oldest.id };
}
