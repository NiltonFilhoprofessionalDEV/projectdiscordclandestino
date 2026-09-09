type Focusable = { focus: () => void };

export function focusVoiceChatDrawer(
  open: boolean,
  heading: { current: Focusable | null },
  trigger: { current: Focusable | null },
  schedule: (callback: () => void) => void = (callback) => {
    requestAnimationFrame(callback);
  },
) {
  schedule(() => {
    (open ? heading.current : trigger.current)?.focus();
  });
}
