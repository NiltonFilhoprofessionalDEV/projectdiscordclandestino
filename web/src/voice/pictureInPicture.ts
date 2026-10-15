export type DocumentPiPWindowOptions = {
  width?: number;
  height?: number;
  disallowReturnToOpener?: boolean;
  preferInitialWindowPlacement?: boolean;
};

export type DocumentPictureInPicture = {
  window: Window | null;
  requestWindow: (options?: DocumentPiPWindowOptions) => Promise<Window>;
};

export function getDocumentPictureInPicture(): DocumentPictureInPicture | null {
  if (typeof window === "undefined") {
    return null;
  }
  const api = (window as Window & { documentPictureInPicture?: DocumentPictureInPicture })
    .documentPictureInPicture;
  if (!api || typeof api.requestWindow !== "function") {
    return null;
  }
  return api;
}

export function isDocumentPictureInPictureSupported(): boolean {
  return getDocumentPictureInPicture() !== null;
}

export function copyStyleSheets(fromDoc: Document, toDoc: Document): void {
  Array.from(fromDoc.styleSheets).forEach((styleSheet) => {
    try {
      const cssRules = Array.from(styleSheet.cssRules)
        .map((rule) => rule.cssText)
        .join("");
      const style = toDoc.createElement("style");
      style.textContent = cssRules;
      toDoc.head.appendChild(style);
    } catch {
      if (!styleSheet.href) {
        return;
      }
      const link = toDoc.createElement("link");
      link.rel = "stylesheet";
      link.href = styleSheet.href;
      toDoc.head.appendChild(link);
    }
  });
}

export function preparePictureInPictureDocument(pipDocument: Document): HTMLDivElement {
  pipDocument.title = "Controles da chamada";
  pipDocument.documentElement.style.height = "100%";
  pipDocument.documentElement.style.colorScheme = "dark";
  pipDocument.body.style.margin = "0";
  pipDocument.body.style.height = "100%";
  pipDocument.body.style.overflow = "hidden";
  pipDocument.body.style.background = "#0A0B11";
  const mount = pipDocument.createElement("div");
  mount.id = "floating-call-root";
  mount.style.height = "100%";
  pipDocument.body.appendChild(mount);
  return mount;
}
