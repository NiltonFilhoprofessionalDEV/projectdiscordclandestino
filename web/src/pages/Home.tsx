import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "../auth/AuthProvider.tsx";
import { useAuth } from "../auth/useAuth.ts";
import { companionChatChannelId } from "../chat/channel.ts";
import { HomeWorkspace } from "../components/shell/HomeWorkspace.tsx";
import { isMemberShell } from "../communities/roles.ts";
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
  useSyncActiveTextChannel(channels.status, channels.text, nav.activeTextChannelId, nav.setActiveTextChannelId);

  return (
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
  );
}
