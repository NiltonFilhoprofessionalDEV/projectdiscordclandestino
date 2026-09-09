import { useCallback, useRef, useState } from "react";
import { isDisplayed, pickFocusTarget } from "../lib/focusRestore.ts";

export function useHomeDialogState() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createCommunityOpen, setCreateCommunityOpen] = useState(false);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const createCommunityRef = useRef<HTMLButtonElement>(null);
  const createChannelRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);

  const restoreCommunityFocus = useCallback(() => {
    pickFocusTarget(
      createCommunityRef.current,
      menuRef.current,
      isDisplayed(createCommunityRef.current),
    )?.focus();
  }, []);

  const restoreChannelFocus = useCallback(() => {
    pickFocusTarget(
      createChannelRef.current,
      menuRef.current,
      isDisplayed(createChannelRef.current),
    )?.focus();
  }, []);

  return {
    settingsOpen,
    createCommunityOpen,
    createChannelOpen,
    createCommunityRef,
    createChannelRef,
    menuRef,
    openSettings: () => setSettingsOpen(true),
    openCreateCommunity: () => setCreateCommunityOpen(true),
    openCreateChannel: () => setCreateChannelOpen(true),
    closeSettings: () => setSettingsOpen(false),
    closeCommunity: () => {
      setCreateCommunityOpen(false);
      requestAnimationFrame(restoreCommunityFocus);
    },
    closeChannel: () => {
      setCreateChannelOpen(false);
      requestAnimationFrame(restoreChannelFocus);
    },
  };
}
