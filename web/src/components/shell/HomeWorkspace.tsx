import type { User } from "@supabase/supabase-js";
import type { CommunitySummary } from "../../../../shared/api.ts";
import type { ChannelId } from "../../../../shared/community.ts";
import type { Profile } from "../../auth/AuthProvider.tsx";
import { FriendsPanel } from "../friends/FriendsPanel.tsx";
import { MemberPanel } from "../members/MemberPanel.tsx";
import type { useChannels } from "../../hooks/useChannels.ts";
import type { useCommunities } from "../../hooks/useCommunities.ts";
import type { useFriends } from "../../hooks/useFriends.ts";
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
  friends: ReturnType<typeof useFriends>;
  session: ReturnType<typeof useHomeVoice>;
  dialogs: ReturnType<typeof useHomeDialogState>;
  query: string;
  onQuery: (value: string) => void;
  companionChannelId: ChannelId | null;
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
        avatarUrl={props.profile.avatar_url}
        accountTitle={props.user.email ?? props.profile.display_name}
        onSignOut={props.onSignOut}
        onEditChannel={props.dialogs.openEditChannel}
        voiceParticipants={props.session.participants}
      />
      <HomeMain {...props} />
      <aside className="surface hidden h-full w-72 shrink-0 flex-col overflow-y-auto border-y-0 border-r-0 xl:flex">
        <FriendsPanel friends={props.friends} />
        <div className="border-t border-haze/10 p-5">
          <MemberPanel
            members={props.members.members}
            status={props.members.status}
            error={props.members.error}
            participants={props.session.participants}
            voiceActive={props.nav.activeVoiceChannelId !== null}
            onRetry={() => void props.members.retry()}
            embedded
          />
        </div>
      </aside>
    </div>
  );
}

function HomeDialogHost({
  communities,
  nav,
  channels,
  session,
  dialogs,
  selectedCommunity,
}: Pick<
  HomeWorkspaceProps,
  "communities" | "nav" | "channels" | "session" | "dialogs" | "selectedCommunity"
>) {
  return (
    <HomeDialogs
      createCommunityOpen={dialogs.createCommunityOpen}
      createChannelOpen={dialogs.createChannelOpen}
      inviteOpen={dialogs.inviteOpen}
      settingsOpen={dialogs.settingsOpen}
      editingChannel={dialogs.editingChannel}
      inviteCommunityId={selectedCommunity?.id ?? null}
      inviteCommunityName={selectedCommunity?.name ?? "comunidade"}
      room={session.voice.room}
      onCloseCommunity={dialogs.closeCommunity}
      onCloseChannel={dialogs.closeChannel}
      onCloseInvite={dialogs.closeInvite}
      onCloseSettings={dialogs.closeSettings}
      onCloseEditChannel={dialogs.closeEditChannel}
      onCreateCommunity={communities.create}
      onCreateChannel={channels.create}
      onUpdateChannel={channels.update}
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
