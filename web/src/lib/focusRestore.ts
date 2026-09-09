export function pickFocusTarget<T>(
  trigger: T | null,
  fallback: T | null,
  triggerDisplayed: boolean,
): T | null {
  return triggerDisplayed && trigger ? trigger : fallback;
}

export function isDisplayed(element: HTMLElement | null): boolean {
  return Boolean(element && element.getClientRects().length > 0);
}
