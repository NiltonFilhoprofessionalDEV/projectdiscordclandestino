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
  onOpenPeople: () => void;
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

function HomeTextChat({
  channelId,
  channelName,
}: {
  channelId: ChannelId | null;
  channelName: string;
}) {
  const chat = useChat(channelId);
  return <ChatPanel chat={chat} title={channelName} embedded />;
}

function HomeVoicePane({
  session,
  companionChannelId,
  dialogs,
  onLeaveVoice,
}: {
  session: ReturnType<typeof useHomeVoice>;
  companionChannelId: ChannelId | null;
  dialogs: ReturnType<typeof useHomeDialogState>;
  onLeaveVoice: () => void;
}) {
  const screen = activeScreenShare(session.participants);
  const sharing = Boolean(screen?.screenPublication);
  const localSharing = session.media.screenOn;
  return (
    <div
      className="relative flex min-h-0 flex-1 overflow-hidden bg-night"
      style={{
        ["--chrome-share-inset" as string]: localSharing ? "4rem" : "0px",
      }}
    >
      <div
        className={cn(
          "min-h-0 flex-1 px-3 pt-3 pb-[calc(8.5rem+var(--chrome-share-inset,0px)+env(safe-area-inset-bottom,0px))] sm:px-4 sm:pt-4 sm:pb-[calc(8rem+var(--chrome-share-inset,0px)+env(safe-area-inset-bottom,0px))] lg:px-6 lg:pt-6",
          sharing ? "flex flex-col overflow-hidden" : "overflow-y-auto",
        )}
      >
        <VoiceStage
          error={session.voice.error}
          connectionState={session.voice.connectionState}
          participants={session.participants}
          screen={screen}
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center overflow-visible px-3 pb-[max(1.25rem,calc(1rem+env(safe-area-inset-bottom,0px)+var(--chrome-share-inset,0px)))] sm:px-4 sm:pb-[max(1.5rem,calc(1.25rem+env(safe-area-inset-bottom,0px)+var(--chrome-share-inset,0px)))]">
        <div className="pointer-events-auto flex w-full max-w-lg justify-center overflow-visible sm:w-auto">
          <ControlBar
            micOn={session.media.micOn}
            voiceActivityOn={session.media.voiceActivityOn}
            cameraOn={session.media.cameraOn}
            screenOn={session.media.screenOn}
            canScreenShare={Boolean(navigator.mediaDevices?.getDisplayMedia)}
            onToggleMic={() => void session.media.toggleMic()}
            onToggleVoiceActivity={session.media.toggleVoiceActivity}
            onToggleCamera={() => void session.media.toggleCamera()}
            onToggleScreen={() => {
              if (session.media.screenOn) {
                dialogs.openScreenShare();
                return;
              }
              void session.media.startScreen();
            }}
            onSettings={dialogs.openSettings}
            onLeave={onLeaveVoice}
            outputVolume={session.outputVolume}
            outputMuted={session.outputMuted}
            onOutputVolume={session.setOutputVolume}
            onToggleOutputMute={() => session.setOutputMuted((current) => !current)}
          />
        </div>
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
  channels,
  dialogs,
}: Pick<
  HomeMainProps,
  | "communities"
  | "nav"
  | "selectedCommunity"
  | "session"
  | "query"
  | "onQuery"
  | "companionChannelId"
  | "channels"
  | "dialogs"
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
        <GuestCommunityView
          name={selectedCommunity?.name ?? "Comunidade"}
          avatarUrl={selectedCommunity?.avatarUrl}
        />
      ) : null}
      {nav.surface === "text" ? (
        <HomeTextChat
          channelId={nav.activeTextChannelId}
          channelName={
            channels.text.find((item) => item.id === nav.activeTextChannelId)?.name ?? "geral"
          }
        />
      ) : null}
      {nav.surface === "voice" ? (
        <HomeVoicePane
          session={session}
          companionChannelId={companionChannelId}
          dialogs={dialogs}
          onLeaveVoice={() => {
            void session.voice.leave();
            nav.leaveVoice();
          }}
        />
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
  onOpenPeople,
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
      onOpenPeople={onOpenPeople}
      menuRef={dialogs.menuRef}
    />
  );
}

export function HomeMain(props: HomeMainProps) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-night">
      <HomeShellHeader {...props} />
      <HomeCenter {...props} />
    </div>
  );
}
