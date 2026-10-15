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

const PIP_DOCUMENT_CSS = `
html, body, #floating-call-root {
  margin: 0;
  width: 100%;
  height: 100%;
  background: transparent !important;
}
html {
  color-scheme: dark;
}
body {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  user-select: none;
}
`;

export function preparePictureInPictureDocument(pipDocument: Document): HTMLDivElement {
  pipDocument.title = "Controles da chamada";
  pipDocument.documentElement.style.background = "transparent";
  pipDocument.body.style.background = "transparent";
  const style = pipDocument.createElement("style");
  style.textContent = PIP_DOCUMENT_CSS;
  pipDocument.head.appendChild(style);
  const mount = pipDocument.createElement("div");
  mount.id = "floating-call-root";
  pipDocument.body.appendChild(mount);
  return mount;
}
