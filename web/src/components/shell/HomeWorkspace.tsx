import type { User } from "@supabase/supabase-js";
import type { CommunitySummary } from "../../../../shared/api.ts";
import type { ChannelId } from "../../../../shared/community.ts";
import { useAuth } from "../../auth/useAuth.ts";
import type { Profile } from "../../auth/AuthProvider.tsx";
import { canManageCommunity } from "../../communities/roles.ts";
import { enrichFriendsWithCallPresence, occupancyIdentitySet } from "../../friends/presence.ts";
import { FriendsPanel } from "../friends/FriendsPanel.tsx";
import { MemberPanel } from "../members/MemberPanel.tsx";
import type { useChannels } from "../../hooks/useChannels.ts";
import type { useCommunities } from "../../hooks/useCommunities.ts";
import type { useFriends } from "../../hooks/useFriends.ts";
import type { useHomeDialogState } from "../../hooks/useHomeDialogState.ts";
import type { useHomeNavigation } from "../../hooks/useHomeNavigation.ts";
import type { useHomeVoice } from "../../hooks/useHomeVoice.ts";
import type { useMembers } from "../../hooks/useMembers.ts";
import { useVoiceOccupancy } from "../../hooks/useVoiceOccupancy.ts";
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
  const memberUserIds = new Set(props.members.members.map((item) => item.userId));
  const canInvite = canManageCommunity(props.selectedCommunity?.role ?? null);
  const voiceChannel =
    props.channels.voice.find((item) => item.id === props.nav.activeVoiceChannelId) ?? null;
  const liveIds = new Set(
    props.session.participants
      .filter((participant) => !participant.isLocal)
      .map((participant) => participant.identity),
  );
  const occupancy = useVoiceOccupancy(
    props.member ? (props.selectedCommunity?.id ?? null) : null,
    props.member,
  );
  const friendsForPanel = {
    ...props.friends,
    friends: enrichFriendsWithCallPresence(
      props.friends.friends,
      liveIds,
      voiceChannel?.name ?? null,
      occupancyIdentitySet(occupancy.byChannel),
    ),
  };

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
        voiceOccupancy={occupancy.byChannel}
      />
      <HomeMain {...props} />
      <aside className="surface hidden h-full w-72 shrink-0 flex-col overflow-y-auto border-y-0 border-r-0 xl:flex">
        <FriendsPanel
          friends={friendsForPanel}
          communityId={props.selectedCommunity?.id ?? null}
          communityName={props.selectedCommunity?.name ?? null}
          canInviteToCommunity={canInvite}
          memberUserIds={memberUserIds}
          onInvited={() => void props.members.retry()}
        />
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
  user,
  profile,
  communities,
  nav,
  channels,
  session,
  dialogs,
  selectedCommunity,
}: Pick<
  HomeWorkspaceProps,
  | "user"
  | "profile"
  | "communities"
  | "nav"
  | "channels"
  | "session"
  | "dialogs"
  | "selectedCommunity"
>) {
  const { updateProfile } = useAuth();
  return (
    <HomeDialogs
      createCommunityOpen={dialogs.createCommunityOpen}
      createChannelOpen={dialogs.createChannelOpen}
      inviteOpen={dialogs.inviteOpen}
      profileOpen={dialogs.profileOpen}
      settingsOpen={dialogs.settingsOpen}
      editingChannel={dialogs.editingChannel}
      inviteCommunityId={selectedCommunity?.id ?? null}
      inviteCommunityName={selectedCommunity?.name ?? "comunidade"}
      userId={user.id}
      profile={profile}
      room={session.voice.room}
      onCloseCommunity={dialogs.closeCommunity}
      onCloseChannel={dialogs.closeChannel}
      onCloseInvite={dialogs.closeInvite}
      onCloseProfile={dialogs.closeProfile}
      onCloseSettings={dialogs.closeSettings}
      onCloseEditChannel={dialogs.closeEditChannel}
      onCreateCommunity={communities.create}
      onCreateChannel={channels.create}
      onUpdateChannel={channels.update}
      onSaveProfile={updateProfile}
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
