type EnterKeyEvent = {
  key: string;
  shiftKey: boolean;
};

export function shouldSubmitOnEnter(
  event: EnterKeyEvent,
  matchMedia: typeof globalThis.matchMedia | undefined = globalThis.matchMedia,
): boolean {
  if (event.key !== "Enter" || event.shiftKey) {
    return false;
  }
  try {
    if (typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches) {
      return false;
    }
  } catch {
    return true;
  }
  return true;
}
