export type RequestTicket = {
  isCurrent: () => boolean;
};

export function createRequestGuard() {
  let latest = 0;
  return {
    next(): RequestTicket {
      const id = ++latest;
      return {
        isCurrent: () => id === latest,
      };
    },
  };
}
