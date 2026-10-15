import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { toast } from "sonner";
import {
  renderFloatingCallBar,
  type FloatingCallBarProps,
} from "../components/controls/FloatingCallBar.tsx";
import {
  copyStyleSheets,
  getDocumentPictureInPicture,
  preparePictureInPictureDocument,
} from "../voice/pictureInPicture.ts";

const PIP_SIZE = { width: 300, height: 64 } as const;

export function useFloatingCallPanel(controls: FloatingCallBarProps) {
  const [open, setOpen] = useState(false);
  const pipRef = useRef<Window | null>(null);
  const rootRef = useRef<Root | null>(null);
  const controlsRef = useRef(controls);
  controlsRef.current = controls;

  const teardown = useCallback(() => {
    rootRef.current?.unmount();
    rootRef.current = null;
    pipRef.current = null;
    setOpen(false);
  }, []);

  const renderBar = useCallback(() => {
    if (!rootRef.current) {
      return;
    }
    renderFloatingCallBar(rootRef.current, controlsRef.current);
  }, []);

  const toggle = useCallback(async () => {
    const existing = pipRef.current;
    if (existing && !existing.closed) {
      existing.close();
      teardown();
      return;
    }
    const api = getDocumentPictureInPicture();
    if (!api) {
      toast.message("O painel flutuante funciona no Brave, Chrome ou Edge.");
      return;
    }
    try {
      const pip = await api.requestWindow({
        width: PIP_SIZE.width,
        height: PIP_SIZE.height,
        disallowReturnToOpener: true,
      });
      copyStyleSheets(document, pip.document);
      const mount = preparePictureInPictureDocument(pip.document);
      pipRef.current = pip;
      rootRef.current = createRoot(mount);
      setOpen(true);
      renderBar();
      pip.addEventListener("pagehide", teardown);
    } catch {
      teardown();
      toast.error("Não foi possível abrir o painel flutuante.");
    }
  }, [renderBar, teardown]);

  useEffect(() => {
    if (open) {
      renderBar();
    }
  }, [
    open,
    renderBar,
    controls.micOn,
    controls.screenOn,
    controls.canScreenShare,
    controls.outputVolume,
    controls.outputMuted,
  ]);

  useEffect(() => {
    return () => {
      rootRef.current?.unmount();
      rootRef.current = null;
      if (pipRef.current && !pipRef.current.closed) {
        pipRef.current.close();
      }
      pipRef.current = null;
    };
  }, []);

  return { open, toggle };
}
