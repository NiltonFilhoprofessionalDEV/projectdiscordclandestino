import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { X } from "lucide-react";
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
import { IconButton } from "../components/ui/button.tsx";
import { Icon } from "../components/ui/icon.tsx";

type HomeProps = {
  user: User;
  profile: Profile;
};

function InviteToast({
  status,
  message,
  onDismiss,
}: {
  status: "accepting" | "done" | "error";
  message: string | null;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (status !== "done" && status !== "error") {
      return;
    }
    const timer = window.setTimeout(onDismiss, 4000);
    return () => window.clearTimeout(timer);
  }, [status, onDismiss]);

  return (
    <div
      className="fixed top-[max(0.75rem,env(safe-area-inset-top))] right-3 left-3 z-40 mx-auto flex max-w-md items-start gap-3 rounded-xl border border-haze/15 bg-deck px-4 py-3 text-sm shadow-lg sm:left-auto"
      role={status === "error" ? "alert" : "status"}
    >
      <div className="min-w-0 flex-1">
        {status === "accepting" ? (
          <p className="text-haze">Entrando na comunidade pelo convite…</p>
        ) : null}
        {status === "done" ? <p className="text-cloud">{message}</p> : null}
        {status === "error" ? <p className="text-coral">{message}</p> : null}
      </div>
      {status !== "accepting" ? (
        <IconButton
          type="button"
          size="iconSm"
          variant="ghost"
          className="shrink-0"
          aria-label="Fechar aviso"
          onClick={onDismiss}
        >
          <Icon icon={X} size="action" />
        </IconButton>
      ) : null}
    </div>
  );
}

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
  const [inviteHidden, setInviteHidden] = useState(false);
  const dismissInvite = useCallback(() => setInviteHidden(true), []);

  useEffect(() => {
    if (invite.status === "accepting" || invite.status === "done" || invite.status === "error") {
      setInviteHidden(false);
    }
  }, [invite.status]);

  const selectedCommunity =
    communities.communities.find((item) => item.id === communities.selectedId) ?? null;
  const member = isMemberShell(selectedCommunity);
  const memberCommunityId = member ? communities.selectedId : null;
  const channels = useChannels(memberCommunityId);
  const members = useMembers(memberCommunityId);
  const voiceChannel = channels.voice.find((item) => item.id === nav.activeVoiceChannelId) ?? null;
  const avatarByIdentity = Object.fromEntries(
    members.members.map((member) => [member.userId, member.avatarUrl]),
  );
  const session = useHomeVoice(
    nav.activeVoiceChannelId,
    profile.display_name,
    profile.avatar_url,
    avatarByIdentity,
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

  const showInviteToast =
    !inviteHidden &&
    (invite.status === "accepting" || invite.status === "error" || invite.status === "done");

  return (
    <>
      {showInviteToast && invite.status !== "idle" ? (
        <InviteToast
          status={invite.status}
          message={invite.message}
          onDismiss={dismissInvite}
        />
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
