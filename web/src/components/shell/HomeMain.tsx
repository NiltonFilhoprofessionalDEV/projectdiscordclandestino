import type { User } from "@supabase/supabase-js";
import type { CommunitySummary } from "../../../../shared/api.ts";
import type { ChannelId } from "../../../../shared/community.ts";
import type { Profile } from "../../auth/AuthProvider.tsx";
import { ChatPanel } from "../chat/ChatPanel.tsx";
import { VoiceChatDrawer } from "../chat/VoiceChatDrawer.tsx";
import { GuestCommunityView } from "../communities/GuestCommunityView.tsx";
import { ControlBar } from "../controls/ControlBar.tsx";
import { ExploreView } from "../explore/ExploreView.tsx";
import { VoiceStage } from "../voice/VoiceStage.tsx";
import { isMemberShell } from "../../communities/roles.ts";
import { useChat } from "../../hooks/useChat.ts";
import type { useChannels } from "../../hooks/useChannels.ts";
import type { useCommunities } from "../../hooks/useCommunities.ts";
import type { useHomeDialogState } from "../../hooks/useHomeDialogState.ts";
import type { useHomeNavigation } from "../../hooks/useHomeNavigation.ts";
import type { useHomeVoice } from "../../hooks/useHomeVoice.ts";
import { activeScreenShare } from "../../hooks/useParticipants.ts";
import { cn } from "../../lib/utils.ts";
import { centerSurfaceLabel } from "../../shell/selection.ts";
import { ShellHeader } from "./ShellHeader.tsx";

type HomeMainProps = {
  user: User;
  profile: Profile;
  communities: ReturnType<typeof useCommunities>;
  nav: ReturnType<typeof useHomeNavigation>;
  selectedCommunity: CommunitySummary | null;
  channels: ReturnType<typeof useChannels>;
  session: ReturnType<typeof useHomeVoice>;
  dialogs: ReturnType<typeof useHomeDialogState>;
  query: string;
  onQuery: (value: string) => void;
  companionChannelId: ChannelId | null;
  onSignOut: () => void;
};

function chooseCommunity(
  community: CommunitySummary,
  nav: ReturnType<typeof useHomeNavigation>,
  select: (id: CommunitySummary["id"]) => void,
) {
  if (isMemberShell(community)) {
    nav.openCommunity(community.id, select);
    return;
  }
  nav.previewCommunity(community.id, select);
}

function HomeTextChat({ channelId }: { channelId: ChannelId | null }) {
  const chat = useChat(channelId);
  return <ChatPanel chat={chat} />;
}

function HomeVoicePane({
  session,
  companionChannelId,
}: {
  session: ReturnType<typeof useHomeVoice>;
  companionChannelId: ChannelId | null;
}) {
  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
        <VoiceStage
          error={session.voice.error}
          connectionState={session.voice.connectionState}
          participants={session.participants}
          screen={activeScreenShare(session.participants)}
        />
      </div>
      <VoiceChatDrawer channelId={companionChannelId} />
    </div>
  );
}

function HomeCenter({
  communities,
  nav,
  selectedCommunity,
  session,
  query,
  onQuery,
  companionChannelId,
}: Pick<
  HomeMainProps,
  "communities" | "nav" | "selectedCommunity" | "session" | "query" | "onQuery" | "companionChannelId"
>) {
  const padded = nav.surface === "explore" || nav.surface === "preview";
  return (
    <main
      className={cn(
        "relative flex min-h-0 flex-1 flex-col",
        padded ? "overflow-y-auto p-4 lg:p-6" : "overflow-hidden",
      )}
    >
      {nav.surface === "explore" ? (
        <ExploreView
          communities={communities.communities}
          query={query}
          onQuery={onQuery}
          onChoose={(community) => chooseCommunity(community, nav, communities.select)}
          status={communities.status}
          error={communities.error}
          onRetry={() => void communities.retry()}
        />
      ) : null}
      {nav.surface === "preview" ? (
        <GuestCommunityView name={selectedCommunity?.name ?? "Comunidade"} />
      ) : null}
      {nav.surface === "text" ? <HomeTextChat channelId={nav.activeTextChannelId} /> : null}
      {nav.surface === "voice" ? (
        <HomeVoicePane session={session} companionChannelId={companionChannelId} />
      ) : null}
    </main>
  );
}

function HomeShellHeader({
  nav,
  selectedCommunity,
  channels,
  session,
  dialogs,
}: Omit<HomeMainProps, "communities" | "query" | "onQuery" | "companionChannelId" | "user" | "profile" | "onSignOut">) {
  return (
    <ShellHeader
      communityName={selectedCommunity?.name ?? "Comunidades"}
      surfaceLabel={centerSurfaceLabel({
        surface: nav.surface,
        textChannel: channels.text.find((item) => item.id === nav.activeTextChannelId),
        voiceChannel: channels.voice.find((item) => item.id === nav.activeVoiceChannelId),
      })}
      voiceActive={nav.activeVoiceChannelId !== null}
      connectionState={session.voice.connectionState}
      quality={session.quality}
      rttMs={session.rttMs}
      onOpenSidebar={() => nav.setSidebarOpen(true)}
      menuRef={dialogs.menuRef}
    />
  );
}

function HomeCallBar({
  nav,
  session,
  dialogs,
}: Pick<HomeMainProps, "nav" | "session" | "dialogs">) {
  if (!nav.activeVoiceChannelId) {
    return null;
  }
  return (
    <ControlBar
      micOn={session.media.micOn}
      voiceActivityOn={session.media.voiceActivityOn}
      cameraOn={session.media.cameraOn}
      screenOn={session.media.screenOn}
      canScreenShare={Boolean(navigator.mediaDevices?.getDisplayMedia)}
      onToggleMic={() => void session.media.toggleMic()}
      onToggleVoiceActivity={session.media.toggleVoiceActivity}
      onToggleCamera={() => void session.media.toggleCamera()}
      onToggleScreen={() => void session.media.toggleScreen()}
      onSettings={dialogs.openSettings}
      onLeave={() => {
        void session.voice.leave();
        nav.leaveVoice();
      }}
      outputVolume={session.outputVolume}
      outputMuted={session.outputMuted}
      onOutputVolume={session.setOutputVolume}
      onToggleOutputMute={() => session.setOutputMuted((current) => !current)}
    />
  );
}

export function HomeMain(props: HomeMainProps) {
  return (
    <div className="flex min-w-0 flex-col">
      <HomeShellHeader {...props} />
      <HomeCenter {...props} />
      <HomeCallBar {...props} />
    </div>
  );
}
