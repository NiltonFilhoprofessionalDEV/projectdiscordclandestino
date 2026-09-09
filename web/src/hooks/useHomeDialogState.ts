import { useCallback, useRef, useState } from "react";
import type { Channel, CommunitySummary } from "../../../shared/api.ts";
import type { ChannelId } from "../../../shared/community.ts";
import { isDisplayed, pickFocusTarget } from "../lib/focusRestore.ts";

export function useHomeDialogState() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createCommunityOpen, setCreateCommunityOpen] = useState(false);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [editingCommunity, setEditingCommunity] = useState<CommunitySummary | null>(null);
  const [pendingVoiceChannelId, setPendingVoiceChannelId] = useState<ChannelId | null>(null);
  const [screenShareOpen, setScreenShareOpen] = useState(false);
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
    inviteOpen,
    profileOpen,
    editingChannel,
    editingCommunity,
    pendingVoiceChannelId,
    screenShareOpen,
    createCommunityRef,
    createChannelRef,
    menuRef,
    openSettings: () => setSettingsOpen(true),
    openCreateCommunity: () => setCreateCommunityOpen(true),
    openCreateChannel: () => setCreateChannelOpen(true),
    openInvite: () => setInviteOpen(true),
    openProfile: () => setProfileOpen(true),
    openEditChannel: (channel: Channel) => setEditingChannel(channel),
    openEditCommunity: (community: CommunitySummary) => setEditingCommunity(community),
    openSwitchVoice: (id: ChannelId) => setPendingVoiceChannelId(id),
    openScreenShare: () => setScreenShareOpen(true),
    closeSettings: () => setSettingsOpen(false),
    closeCommunity: () => {
      setCreateCommunityOpen(false);
      requestAnimationFrame(restoreCommunityFocus);
    },
    closeChannel: () => {
      setCreateChannelOpen(false);
      requestAnimationFrame(restoreChannelFocus);
    },
    closeInvite: () => setInviteOpen(false),
    closeProfile: () => setProfileOpen(false),
    closeEditChannel: () => setEditingChannel(null),
    closeEditCommunity: () => setEditingCommunity(null),
    closeSwitchVoice: () => setPendingVoiceChannelId(null),
    closeScreenShare: () => setScreenShareOpen(false),
  };
}
