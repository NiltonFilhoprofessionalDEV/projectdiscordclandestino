import { useCallback, useState } from "react";
import type { Channel } from "../../../shared/api.ts";
import type { ChannelId, CommunityId } from "../../../shared/community.ts";
import type { CenterSurface } from "../shell/selection.ts";

export function useHomeNavigation() {
  const [surface, setSurface] = useState<CenterSurface>("explore");
  const [activeVoiceChannelId, setActiveVoiceChannelId] = useState<ChannelId | null>(null);
  const [activeTextChannelId, setActiveTextChannelId] = useState<ChannelId | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const explore = useCallback(() => {
    setSurface("explore");
    setSidebarOpen(false);
  }, []);

  const openCommunity = useCallback((id: CommunityId, select: (id: CommunityId) => void) => {
    select(id);
    setSurface("text");
    setSidebarOpen(false);
  }, []);

  const selectText = useCallback((id: ChannelId) => {
    setActiveTextChannelId(id);
    setSurface("text");
    setSidebarOpen(false);
  }, []);

  const selectVoice = useCallback((id: ChannelId) => {
    setActiveVoiceChannelId(id);
    setSurface("voice");
    setSidebarOpen(false);
  }, []);

  const leaveVoice = useCallback(() => {
    setActiveVoiceChannelId(null);
    setSurface((current) => (current === "voice" ? "text" : current));
  }, []);

  const createdChannel = useCallback((channel: Channel) => {
    if (channel.type === "text") {
      selectText(channel.id);
      return;
    }
    selectVoice(channel.id);
  }, [selectText, selectVoice]);

  return {
    surface,
    activeVoiceChannelId,
    activeTextChannelId,
    setActiveTextChannelId,
    sidebarOpen,
    setSidebarOpen,
    explore,
    openCommunity,
    selectText,
    selectVoice,
    leaveVoice,
    createdChannel,
  };
}
