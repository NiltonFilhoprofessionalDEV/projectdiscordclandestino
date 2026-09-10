type FullscreenVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
};

export async function enterFullscreen(element: HTMLElement): Promise<void> {
  if (element.requestFullscreen) {
    await element.requestFullscreen();
    return;
  }
  const video = element as FullscreenVideo;
  video.webkitEnterFullscreen?.();
}
