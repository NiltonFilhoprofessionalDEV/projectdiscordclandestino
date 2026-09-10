export const PWA_HINT_KEY = "pwaInstallHintDismissed";

export type BeforeInstallPromptLike = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function isStandaloneDisplay(media: Pick<MediaQueryList, "matches"> | null): boolean {
  return Boolean(media?.matches);
}

export function installLabel(userAgent: string): string {
  return /windows/i.test(userAgent) ? "Instalar no Windows" : "Instalar app";
}

export function readHintDismissed(storage: Pick<Storage, "getItem">): boolean {
  return storage.getItem(PWA_HINT_KEY) === "true";
}

export function writeHintDismissed(storage: Pick<Storage, "setItem">): void {
  storage.setItem(PWA_HINT_KEY, "true");
}
