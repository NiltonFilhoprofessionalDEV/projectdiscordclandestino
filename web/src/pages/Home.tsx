import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "../auth/AuthProvider.tsx";
import { useAuth } from "../auth/useAuth.ts";
import { ChannelSidebar } from "../components/channels/ChannelSidebar.tsx";
import { CreateChannelDialog } from "../components/channels/CreateChannelDialog.tsx";
import { ChatPanel } from "../components/chat/ChatPanel.tsx";
import { CommunityRail } from "../components/communities/CommunityRail.tsx";
import { CreateCommunityDialog } from "../components/communities/CreateCommunityDialog.tsx";
import { ControlBar } from "../components/controls/ControlBar.tsx";
import { DeviceSettings } from "../components/controls/DeviceSettings.tsx";
import { ExploreView } from "../components/explore/ExploreView.tsx";
import { MemberPanel } from "../components/members/MemberPanel.tsx";
import { ShellHeader } from "../components/shell/ShellHeader.tsx";
import { VoiceStage } from "../components/voice/VoiceStage.tsx";
import { canManageCommunity } from "../communities/roles.ts";
import { useChannels } from "../hooks/useChannels.ts";
import { useChat } from "../hooks/useChat.ts";
import { useCommunities } from "../hooks/useCommunities.ts";
import { useConnectionQuality } from "../hooks/useConnectionQuality.ts";
import { useHomeNavigation } from "../hooks/useHomeNavigation.ts";
import { useMedia } from "../hooks/useMedia.ts";
import { useMembers } from "../hooks/useMembers.ts";
import { activeScreenShare, useParticipants } from "../hooks/useParticipants.ts";
import { useRoom } from "../hooks/useRoom.ts";
import { centerSurfaceLabel } from "../shell/selection.ts";

type HomeProps = {
  user: User;
  profile: Profile;
};

export function Home({ user, profile }: HomeProps) {
  const { signOut } = useAuth();
  const communities = useCommunities();
  const channels = useChannels(communities.selectedId);
  const members = useMembers(communities.selectedId);
  const nav = useHomeNavigation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [createCommunityOpen, setCreateCommunityOpen] = useState(false);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const createCommunityRef = useRef<HTMLButtonElement>(null);
  const createChannelRef = useRef<HTMLButtonElement>(null);
  const { room, connectionState, error, leave, findScreenOwner } = useRoom(nav.activeVoiceChannelId);
  const participants = useParticipants(room).map((participant) =>
    participant.isLocal
      ? { ...participant, name: participant.name || profile.display_name }
      : participant,
  );
  const media = useMedia(room, findScreenOwner);
  const chat = useChat(room, profile.display_name);
  const { quality, rttMs } = useConnectionQuality(room);
  const selectedCommunity =
    communities.communities.find((item) => item.id === communities.selectedId) ?? null;

  useEffect(() => {
    const belongs = channels.text.some((item) => item.id === nav.activeTextChannelId);
    if (!belongs) {
      nav.setActiveTextChannelId(channels.text[0]?.id ?? null);
    }
  }, [channels.text, nav.activeTextChannelId, nav.setActiveTextChannelId]);

  const closeCreateCommunity = useCallback(() => {
    setCreateCommunityOpen(false);
    requestAnimationFrame(() => createCommunityRef.current?.focus());
  }, []);
  const closeCreateChannel = useCallback(() => {
    setCreateChannelOpen(false);
    requestAnimationFrame(() => createChannelRef.current?.focus());
  }, []);

  const rail = (
    <CommunityRail
      communities={communities.communities}
      selectedId={communities.selectedId}
      exploring={nav.surface === "explore"}
      displayName={profile.display_name}
      voiceActive={nav.activeVoiceChannelId !== null}
      onExplore={nav.explore}
      onSelect={(id) => nav.openCommunity(id, communities.select)}
      onCreate={() => setCreateCommunityOpen(true)}
      createRef={createCommunityRef}
    />
  );
  const sidebar = (
    <ChannelSidebar
      community={selectedCommunity}
      text={channels.text}
      voice={channels.voice}
      activeTextChannelId={nav.activeTextChannelId}
      activeVoiceChannelId={nav.activeVoiceChannelId}
      canManage={canManageCommunity(selectedCommunity?.role ?? null)}
      status={channels.status}
      error={channels.error}
      onSelectText={nav.selectText}
      onSelectVoice={nav.selectVoice}
      onCreate={() => setCreateChannelOpen(true)}
      onRetry={() => void channels.retry()}
      createRef={createChannelRef}
    />
  );

  return (
    <>
      <div className="grid h-dvh w-dvw overflow-hidden bg-night text-cloud md:grid-cols-[76px_256px_minmax(0,1fr)] xl:grid-cols-[76px_256px_minmax(0,1fr)_288px]">
        <div className="hidden md:flex">{rail}</div>
        <div className="hidden md:flex">{sidebar}</div>
        <div className="flex min-w-0 flex-col">
          <ShellHeader
            communityName={selectedCommunity?.name ?? "Comunidades"}
            surfaceLabel={centerSurfaceLabel({
              surface: nav.surface,
              textChannel: channels.text.find((item) => item.id === nav.activeTextChannelId),
              voiceChannel: channels.voice.find((item) => item.id === nav.activeVoiceChannelId),
            })}
            voiceActive={nav.activeVoiceChannelId !== null}
            connectionState={connectionState}
            quality={quality}
            rttMs={rttMs}
            accountTitle={user.email ?? profile.display_name}
            onOpenSidebar={() => nav.setSidebarOpen(true)}
            onSignOut={() => void signOut()}
          />
          <main className="relative min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
            {nav.surface === "explore" ? (
              <ExploreView
                communities={communities.communities}
                query={query}
                onQuery={setQuery}
                onSelect={(id) => nav.openCommunity(id, communities.select)}
                status={communities.status}
                error={communities.error}
                onRetry={() => void communities.retry()}
              />
            ) : null}
            {nav.surface === "text" ? (
              <ChatPanel messages={chat.messages} onSend={chat.send} />
            ) : null}
            {nav.surface === "voice" ? (
              <VoiceStage
                error={error}
                connectionState={connectionState}
                participants={participants}
                screen={activeScreenShare(participants)}
              />
            ) : null}
          </main>
          {nav.activeVoiceChannelId ? (
            <ControlBar
              micOn={media.micOn}
              cameraOn={media.cameraOn}
              screenOn={media.screenOn}
              canScreenShare={Boolean(navigator.mediaDevices?.getDisplayMedia)}
              onToggleMic={() => void media.toggleMic()}
              onToggleCamera={() => void media.toggleCamera()}
              onToggleScreen={() => void media.toggleScreen()}
              onSettings={() => setSettingsOpen(true)}
              onLeave={() => {
                void leave();
                nav.leaveVoice();
              }}
            />
          ) : null}
        </div>
        <MemberPanel
          members={members.members}
          status={members.status}
          error={members.error}
          participants={participants}
          voiceActive={nav.activeVoiceChannelId !== null}
          onRetry={() => void members.retry()}
        />
      </div>
      {nav.sidebarOpen ? (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="flex h-full">
            {rail}
            {sidebar}
          </div>
          <button
            type="button"
            className="flex-1 bg-abyss/80 backdrop-blur-sm"
            aria-label="Fechar menu"
            onClick={() => nav.setSidebarOpen(false)}
          />
        </div>
      ) : null}
      <CreateCommunityDialog
        open={createCommunityOpen}
        onClose={closeCreateCommunity}
        onCreate={communities.create}
        onCreated={(community) => nav.openCommunity(community.id, communities.select)}
      />
      <CreateChannelDialog
        open={createChannelOpen}
        onClose={closeCreateChannel}
        onCreate={channels.create}
        onCreated={nav.createdChannel}
      />
      {settingsOpen && room ? (
        <DeviceSettings room={room} onClose={() => setSettingsOpen(false)} />
      ) : null}
    </>
  );
}
