import { useCallback, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { CommunityId } from "../../../shared/community.ts";
import type { Profile } from "../auth/AuthProvider.tsx";
import { useAuth } from "../auth/useAuth.ts";
import { companionChatChannelId } from "../chat/channel.ts";
import { HomeWorkspace } from "../components/shell/HomeWorkspace.tsx";
import { isMemberShell } from "../communities/roles.ts";
import { useAcceptPendingInvite } from "../hooks/useAcceptPendingInvite.ts";
import { useChannels } from "../hooks/useChannels.ts";
import { useCommunities } from "../hooks/useCommunities.ts";
import { useFriends } from "../hooks/useFriends.ts";
import { useHomeDialogState } from "../hooks/useHomeDialogState.ts";
import { useHomeNavigation } from "../hooks/useHomeNavigation.ts";
import { useHomeVoice } from "../hooks/useHomeVoice.ts";
import { useMembers } from "../hooks/useMembers.ts";
import { useSyncActiveTextChannel } from "../hooks/useSyncActiveTextChannel.ts";

type HomeProps = {
  user: User;
  profile: Profile;
};

export function Home({ user, profile }: HomeProps) {
  const { signOut } = useAuth();
  const communities = useCommunities();
  const nav = useHomeNavigation();
  const onJoinedCommunity = useCallback(
    (communityId: CommunityId) => {
      void communities.retry().then(() => {
        nav.openCommunity(communityId, communities.select);
      });
    },
    [communities, nav],
  );
  const invite = useAcceptPendingInvite(onJoinedCommunity);
  const selectedCommunity =
    communities.communities.find((item) => item.id === communities.selectedId) ?? null;
  const member = isMemberShell(selectedCommunity);
  const memberCommunityId = member ? communities.selectedId : null;
  const channels = useChannels(memberCommunityId);
  const members = useMembers(memberCommunityId);
  const voiceChannel = channels.voice.find((item) => item.id === nav.activeVoiceChannelId) ?? null;
  const session = useHomeVoice(
    nav.activeVoiceChannelId,
    profile.display_name,
    profile.avatar_url,
  );
  const friends = useFriends(
    user.id,
    voiceChannel ? `Em voz: ${voiceChannel.name}` : null,
  );
  const dialogs = useHomeDialogState();
  const [query, setQuery] = useState("");
  const companionChannelId = companionChatChannelId("voice", null, voiceChannel);
  useSyncActiveTextChannel(
    channels.status,
    channels.text,
    nav.activeTextChannelId,
    nav.setActiveTextChannelId,
  );

  return (
    <>
      {invite.status === "accepting" || invite.status === "error" || invite.status === "done" ? (
        <div
          className="fixed top-3 right-3 left-3 z-40 mx-auto max-w-md rounded-xl border border-haze/15 bg-deck px-4 py-3 text-sm shadow-lg sm:left-auto"
          role="status"
        >
          {invite.status === "accepting" ? (
            <p className="text-haze">Entrando na comunidade pelo convite…</p>
          ) : null}
          {invite.status === "done" ? <p className="text-cloud">{invite.message}</p> : null}
          {invite.status === "error" ? (
            <p className="text-coral" role="alert">
              {invite.message}
            </p>
          ) : null}
        </div>
      ) : null}
      <HomeWorkspace
        user={user}
        profile={profile}
        communities={communities}
        nav={nav}
        selectedCommunity={selectedCommunity}
        member={member}
        channels={channels}
        members={members}
        friends={friends}
        session={session}
        dialogs={dialogs}
        query={query}
        onQuery={setQuery}
        companionChannelId={companionChannelId}
        onSignOut={() => void signOut()}
      />
    </>
  );
}
