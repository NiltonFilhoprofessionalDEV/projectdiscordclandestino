type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  mozRequestFullScreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
};

async function requestElementFullscreen(element: FullscreenElement): Promise<boolean> {
  if (typeof element.requestFullscreen === "function") {
    await element.requestFullscreen();
    return true;
  }
  if (typeof element.webkitRequestFullscreen === "function") {
    await element.webkitRequestFullscreen();
    return true;
  }
  if (typeof element.mozRequestFullScreen === "function") {
    await element.mozRequestFullScreen();
    return true;
  }
  if (typeof element.msRequestFullscreen === "function") {
    await element.msRequestFullscreen();
    return true;
  }
  return false;
}

/** Prefer fullscreen on a container; fall back to iOS video fullscreen when needed. */
export async function enterFullscreen(
  element: HTMLElement,
  videoFallback?: HTMLVideoElement | null,
): Promise<void> {
  try {
    if (await requestElementFullscreen(element)) {
      return;
    }
  } catch {
    // Try video-native fullscreen (iOS / restricted documents).
  }

  const video =
    videoFallback ??
    (element instanceof HTMLVideoElement
      ? element
      : element.querySelector("video"));
  if (!video) {
    return;
  }

  try {
    if (await requestElementFullscreen(video)) {
      return;
    }
  } catch {
    // Last resort for iOS Safari.
  }

  (video as FullscreenVideo).webkitEnterFullscreen?.();
}
