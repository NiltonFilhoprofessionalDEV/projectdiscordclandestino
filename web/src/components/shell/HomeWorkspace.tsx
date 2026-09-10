import type { User } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import type { CommunitySummary } from "../../../../shared/api.ts";
import type { ChannelId } from "../../../../shared/community.ts";
import { useAuth } from "../../auth/useAuth.ts";
import type { Profile } from "../../auth/AuthProvider.tsx";
import { canManageCommunity } from "../../communities/roles.ts";
import { enrichFriendsWithCallPresence, occupancyIdentitySet } from "../../friends/presence.ts";
import { occupancyWithoutLocalElsewhere } from "../../voice/switch.ts";
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
import { ProfilePeekProvider } from "../../profile/ProfilePeek.tsx";
import { HomeDialogs } from "./HomeDialogs.tsx";
import { HomeMain } from "./HomeMain.tsx";
import { HomeNav } from "./HomeNav.tsx";
import { PeopleSheet } from "./PeopleSheet.tsx";

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
  const [peopleOpen, setPeopleOpen] = useState(false);
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
  const previousVoiceChannelId = useRef(props.nav.activeVoiceChannelId);
  useEffect(() => {
    if (previousVoiceChannelId.current === props.nav.activeVoiceChannelId) {
      return;
    }
    previousVoiceChannelId.current = props.nav.activeVoiceChannelId;
    void occupancy.reload();
  }, [props.nav.activeVoiceChannelId, occupancy.reload]);
  const avatarByIdentity = Object.fromEntries(
    props.members.members.map((member) => [member.userId, member.avatarUrl]),
  );
  const visibleOccupancy = occupancyWithoutLocalElsewhere(
    occupancy.byChannel,
    props.user.id,
    props.nav.activeVoiceChannelId,
  );
  const voiceOccupancy = Object.fromEntries(
    Object.entries(visibleOccupancy).map(([channelId, occupants]) => [
      channelId,
      occupants.map((occupant) => ({
        ...occupant,
        avatarUrl: occupant.avatarUrl || avatarByIdentity[occupant.identity] || null,
      })),
    ]),
  );
  const friendsForPanel = {
    ...props.friends,
    friends: enrichFriendsWithCallPresence(
      props.friends.friends,
      liveIds,
      voiceChannel?.name ?? null,
      occupancyIdentitySet(visibleOccupancy),
    ),
  };

  return (
    <div className="grid h-dvh w-dvw overflow-hidden bg-night pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] text-cloud md:grid-cols-[68px_256px_minmax(0,1fr)] xl:grid-cols-[68px_256px_minmax(0,1fr)_288px]">
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
        voiceOccupancy={voiceOccupancy}
      />
      <HomeMain {...props} onOpenPeople={() => setPeopleOpen(true)} />
      <PeopleSheet
        open={peopleOpen}
        onClose={() => setPeopleOpen(false)}
        friends={friendsForPanel}
        communityId={props.selectedCommunity?.id ?? null}
        communityName={props.selectedCommunity?.name ?? null}
        canInviteToCommunity={canInvite}
        memberUserIds={memberUserIds}
        onInvited={() => void props.members.retry()}
        members={props.members.members}
        memberStatus={props.members.status}
        memberError={props.members.error}
        participants={props.session.participants}
        voiceActive={props.nav.activeVoiceChannelId !== null}
        onRetryMembers={() => void props.members.retry()}
      />
      <aside className="hidden h-full w-72 shrink-0 flex-col overflow-hidden border-l border-white/[0.07] bg-panel xl:flex">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <FriendsPanel
            friends={friendsForPanel}
            communityId={props.selectedCommunity?.id ?? null}
            communityName={props.selectedCommunity?.name ?? null}
            canInviteToCommunity={canInvite}
            memberUserIds={memberUserIds}
            onInvited={() => void props.members.retry()}
          />
          <div className="border-t border-white/[0.07] p-5">
            <MemberPanel
              members={props.members.members}
              status={props.members.status}
              error={props.members.error}
              participants={props.session.participants}
              voiceActive={props.nav.activeVoiceChannelId !== null}
              friends={friendsForPanel}
              onRetry={() => void props.members.retry()}
              embedded
            />
          </div>
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
  const pendingVoiceId = dialogs.pendingVoiceChannelId;
  const pendingVoiceToName =
    channels.voice.find((item) => item.id === pendingVoiceId)?.name ?? "esta sala";
  const pendingVoiceFromName =
    channels.voice.find((item) => item.id === nav.activeVoiceChannelId)?.name ?? "a sala atual";
  const screenOn = session.media.screenOn;

  useEffect(() => {
    if (!screenOn) {
      dialogs.closeScreenShare();
    }
  }, [screenOn]);

  return (
    <HomeDialogs
      createCommunityOpen={dialogs.createCommunityOpen}
      createChannelOpen={dialogs.createChannelOpen}
      inviteOpen={dialogs.inviteOpen}
      profileOpen={dialogs.profileOpen}
      settingsOpen={dialogs.settingsOpen}
      editingChannel={dialogs.editingChannel}
      editingCommunity={dialogs.editingCommunity}
      pendingVoiceOpen={pendingVoiceId !== null}
      pendingVoiceFromName={pendingVoiceFromName}
      pendingVoiceToName={pendingVoiceToName}
      screenShareOpen={dialogs.screenShareOpen && screenOn}
      screenShareConfig={session.media.screenConfig}
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
      onCloseEditCommunity={dialogs.closeEditCommunity}
      onCancelSwitchVoice={dialogs.closeSwitchVoice}
      onCloseScreenShare={dialogs.closeScreenShare}
      onChangeScreenShare={session.media.replaceScreen}
      onStopScreenShare={session.media.stopScreen}
      onAcceptSwitchVoice={() => {
        if (pendingVoiceId) {
          nav.selectVoice(pendingVoiceId);
        }
        dialogs.closeSwitchVoice();
      }}
      onCreateCommunity={communities.create}
      onCreateChannel={channels.create}
      onUpdateChannel={channels.update}
      onDeleteChannel={channels.remove}
      onUpdateCommunity={communities.update}
      onDeleteCommunity={communities.remove}
      onSaveProfile={updateProfile}
      onCreatedCommunity={(community) => {
        void communities.retry().then(() => {
          nav.openCommunity(community.id, communities.select);
        });
      }}
      onCreatedChannel={nav.createdChannel}
    />
  );
}

export function HomeWorkspace(props: HomeWorkspaceProps) {
  return (
    <ProfilePeekProvider onEditSelf={props.dialogs.openProfile}>
      <HomeGrid {...props} />
      <HomeDialogHost {...props} />
    </ProfilePeekProvider>
  );
}
