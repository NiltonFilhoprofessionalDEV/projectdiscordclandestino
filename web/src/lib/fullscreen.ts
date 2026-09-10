type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  mozRequestFullScreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  mozCancelFullScreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
};

type FullscreenVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
  webkitDisplayingFullscreen?: boolean;
  webkitExitFullscreen?: () => void;
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

export function getFullscreenElement(): Element | null {
  const doc = document as FullscreenDocument;
  return (
    document.fullscreenElement ??
    doc.webkitFullscreenElement ??
    doc.mozFullScreenElement ??
    doc.msFullscreenElement ??
    null
  );
}

export function isFullscreenActive(element?: HTMLElement | null): boolean {
  const active = getFullscreenElement();
  if (!active) {
    return false;
  }
  if (!element) {
    return true;
  }
  return active === element || element.contains(active) || active.contains(element);
}

export async function exitFullscreen(videoFallback?: HTMLVideoElement | null): Promise<void> {
  const doc = document as FullscreenDocument;
  if (getFullscreenElement()) {
    if (typeof document.exitFullscreen === "function") {
      await document.exitFullscreen();
      return;
    }
    if (typeof doc.webkitExitFullscreen === "function") {
      await doc.webkitExitFullscreen();
      return;
    }
    if (typeof doc.mozCancelFullScreen === "function") {
      await doc.mozCancelFullScreen();
      return;
    }
    if (typeof doc.msExitFullscreen === "function") {
      await doc.msExitFullscreen();
      return;
    }
  }
  const video = videoFallback as FullscreenVideo | null | undefined;
  if (video?.webkitDisplayingFullscreen) {
    video.webkitExitFullscreen?.();
  }
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

/** Same control enters and leaves fullscreen. */
export async function toggleFullscreen(
  element: HTMLElement,
  videoFallback?: HTMLVideoElement | null,
): Promise<void> {
  if (isFullscreenActive(element)) {
    await exitFullscreen(videoFallback);
    return;
  }
  await enterFullscreen(element, videoFallback);
}
