import { useCallback, useEffect, useState } from "react";
import {
  installLabel,
  readHintDismissed,
  writeHintDismissed,
  type BeforeInstallPromptLike,
} from "./installPrompt.ts";

export function usePwaInstall(storage: Pick<Storage, "getItem" | "setItem"> = localStorage) {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptLike | null>(null);
  const [installed, setInstalled] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(() => readHintDismissed(storage));

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)");
    if (standalone.matches) {
      setInstalled(true);
    }
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptLike);
    };
    const onInstalled = () => {
      setPromptEvent(null);
      setInstalled(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!promptEvent) {
      return;
    }
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  }, [promptEvent]);

  const dismissHint = useCallback(() => {
    writeHintDismissed(storage);
    setHintDismissed(true);
  }, [storage]);

  const canInstall = Boolean(promptEvent) && !installed;
  return {
    canInstall,
    installed,
    showHint: canInstall && !hintDismissed,
    label: installLabel(navigator.userAgent),
    install,
    dismissHint,
  };
}
