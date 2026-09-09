import type { User } from "@supabase/supabase-js";
import type { CommunitySummary } from "../../../../shared/api.ts";
import type { Profile } from "../../auth/AuthProvider.tsx";
import { MemberPanel } from "../members/MemberPanel.tsx";
import type { useChannels } from "../../hooks/useChannels.ts";
import type { useCommunities } from "../../hooks/useCommunities.ts";
import type { useHomeDialogState } from "../../hooks/useHomeDialogState.ts";
import type { useHomeNavigation } from "../../hooks/useHomeNavigation.ts";
import type { useHomeVoice } from "../../hooks/useHomeVoice.ts";
import type { useMembers } from "../../hooks/useMembers.ts";
import { HomeDialogs } from "./HomeDialogs.tsx";
import { HomeMain } from "./HomeMain.tsx";
import { HomeNav } from "./HomeNav.tsx";

type HomeWorkspaceProps = {
  user: User;
  profile: Profile;
  communities: ReturnType<typeof useCommunities>;
  nav: ReturnType<typeof useHomeNavigation>;
  selectedCommunity: CommunitySummary | null;
  member: boolean;
  channels: ReturnType<typeof useChannels>;
  members: ReturnType<typeof useMembers>;
  session: ReturnType<typeof useHomeVoice>;
  dialogs: ReturnType<typeof useHomeDialogState>;
  query: string;
  onQuery: (value: string) => void;
  onSignOut: () => void;
};

function HomeGrid(props: HomeWorkspaceProps) {
  return (
    <div className="grid h-dvh w-dvw overflow-hidden bg-night text-cloud md:grid-cols-[76px_256px_minmax(0,1fr)] xl:grid-cols-[76px_256px_minmax(0,1fr)_288px]">
      <HomeNav
        communities={props.communities}
        nav={props.nav}
        selectedCommunity={props.selectedCommunity}
        member={props.member}
        channels={props.channels}
        dialogs={props.dialogs}
        displayName={props.profile.display_name}
      />
      <HomeMain {...props} />
      <MemberPanel
        members={props.members.members}
        status={props.members.status}
        error={props.members.error}
        participants={props.session.participants}
        voiceActive={props.nav.activeVoiceChannelId !== null}
        onRetry={() => void props.members.retry()}
      />
    </div>
  );
}

function HomeDialogHost({
  communities,
  nav,
  channels,
  session,
  dialogs,
}: Pick<HomeWorkspaceProps, "communities" | "nav" | "channels" | "session" | "dialogs">) {
  return (
    <HomeDialogs
      createCommunityOpen={dialogs.createCommunityOpen}
      createChannelOpen={dialogs.createChannelOpen}
      settingsOpen={dialogs.settingsOpen}
      room={session.voice.room}
      onCloseCommunity={dialogs.closeCommunity}
      onCloseChannel={dialogs.closeChannel}
      onCloseSettings={dialogs.closeSettings}
      onCreateCommunity={communities.create}
      onCreateChannel={channels.create}
      onCreatedCommunity={(community) => nav.openCommunity(community.id, communities.select)}
      onCreatedChannel={nav.createdChannel}
    />
  );
}

export function HomeWorkspace(props: HomeWorkspaceProps) {
  return (
    <>
      <HomeGrid {...props} />
      <HomeDialogHost {...props} />
    </>
  );
}
