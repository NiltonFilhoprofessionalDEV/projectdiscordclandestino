// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import {
  copyStyleSheets,
  isDocumentPictureInPictureSupported,
  preparePictureInPictureDocument,
} from "./pictureInPicture.ts";

describe("pictureInPicture", () => {
  it("reports unsupported when the API is missing", () => {
    expect(isDocumentPictureInPictureSupported()).toBe(false);
  });

  it("reports supported when requestWindow exists", () => {
    Object.defineProperty(window, "documentPictureInPicture", {
      configurable: true,
      value: { window: null, requestWindow: () => Promise.resolve(window) },
    });
    expect(isDocumentPictureInPictureSupported()).toBe(true);
    Reflect.deleteProperty(window, "documentPictureInPicture");
  });

  it("copies accessible stylesheet rules into the target document", () => {
    const style = document.createElement("style");
    style.textContent = ".pip-test { color: rgb(1, 2, 3); }";
    document.head.appendChild(style);
    const target = document.implementation.createHTMLDocument("pip");
    copyStyleSheets(document, target);
    expect(target.head.querySelector("style")?.textContent).toContain(".pip-test");
  });

  it("prepares a full-size mount node in the pip document", () => {
    const target = document.implementation.createHTMLDocument("pip");
    const mount = preparePictureInPictureDocument(target);
    expect(mount.id).toBe("floating-call-root");
    expect(target.body.contains(mount)).toBe(true);
    expect(target.title).toBe("Controles da chamada");
    expect(target.documentElement.style.background).toBe("transparent");
    expect(target.body.style.background).toBe("transparent");
    expect(target.head.textContent).toContain("background: transparent");
  });
});
