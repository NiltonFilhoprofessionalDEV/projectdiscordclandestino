import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import type { Channel } from "../../../shared/api.ts";
import type { ChannelId, CommunityId } from "../../../shared/community.ts";
import {
  applyExplore,
  applyLeaveVoice,
  applyOpenMember,
  applyPreviewCommunity,
  applySelectText,
  applySelectVoice,
  initialShellNav,
  type ShellNav,
} from "../shell/navigation.ts";

function useNavCommunityActions(setNav: Dispatch<SetStateAction<ShellNav>>) {
  const explore = useCallback(() => {
    setNav(applyExplore);
  }, [setNav]);

  const openCommunity = useCallback((id: CommunityId, select: (id: CommunityId) => void) => {
    select(id);
    setNav(applyOpenMember);
  }, [setNav]);

  const previewCommunity = useCallback((id: CommunityId, select: (id: CommunityId) => void) => {
    select(id);
    setNav(applyPreviewCommunity);
  }, [setNav]);

  const setSidebarOpen = useCallback((open: boolean) => {
    setNav((current) => ({ ...current, sidebarOpen: open }));
  }, [setNav]);

  return { explore, openCommunity, previewCommunity, setSidebarOpen };
}

function useNavChannelActions(setNav: Dispatch<SetStateAction<ShellNav>>) {
  const selectText = useCallback((id: ChannelId) => {
    setNav((current) => applySelectText(current, id));
  }, [setNav]);

  const selectVoice = useCallback((id: ChannelId) => {
    setNav((current) => applySelectVoice(current, id));
  }, [setNav]);

  const leaveVoice = useCallback(() => {
    setNav(applyLeaveVoice);
  }, [setNav]);

  const createdChannel = useCallback((channel: Channel) => {
    if (channel.type === "text") {
      setNav((current) => applySelectText(current, channel.id));
      return;
    }
    setNav((current) => applySelectVoice(current, channel.id));
  }, [setNav]);

  const setActiveTextChannelId = useCallback((id: ChannelId | null) => {
    setNav((current) => ({ ...current, activeTextChannelId: id }));
  }, [setNav]);

  return { selectText, selectVoice, leaveVoice, createdChannel, setActiveTextChannelId };
}

export function useHomeNavigation() {
  const [nav, setNav] = useState(initialShellNav);
  const community = useNavCommunityActions(setNav);
  const channel = useNavChannelActions(setNav);
  return { ...nav, ...community, ...channel };
}
