import type { CommunitySummary } from "../../../../shared/api.ts";
import type { Channel } from "../../../../shared/api.ts";
import type { ChannelId } from "../../../../shared/community.ts";
import type { ParticipantView } from "../../hooks/useParticipants.ts";
import { ChannelSidebar } from "../channels/ChannelSidebar.tsx";
import { CommunityRail } from "../communities/CommunityRail.tsx";
import { canManageCommunity } from "../../communities/roles.ts";
import type { useChannels } from "../../hooks/useChannels.ts";
import type { useCommunities } from "../../hooks/useCommunities.ts";
import type { useHomeDialogState } from "../../hooks/useHomeDialogState.ts";
import type { useHomeNavigation } from "../../hooks/useHomeNavigation.ts";
import type { VoiceOccupant } from "../../services/api.ts";
import { needsVoiceSwitchConfirm } from "../../voice/switch.ts";
import { ShellNavColumns } from "./ShellNavColumns.tsx";

type HomeNavProps = {
  communities: ReturnType<typeof useCommunities>;
  nav: ReturnType<typeof useHomeNavigation>;
  selectedCommunity: CommunitySummary | null;
  member: boolean;
  channels: ReturnType<typeof useChannels>;
  dialogs: ReturnType<typeof useHomeDialogState>;
  displayName: string;
  avatarUrl: string | null;
  accountTitle: string;
  onSignOut: () => void;
  onEditChannel: (channel: Channel) => void;
  voiceParticipants: ParticipantView[];
  voiceOccupancy: Record<string, VoiceOccupant[]>;
};

function HomeRail({
  communities,
  nav,
  dialogs,
}: Pick<HomeNavProps, "communities" | "nav" | "dialogs">) {
  return (
    <CommunityRail
      communities={communities.communities}
      selectedId={communities.selectedId}
      exploring={nav.surface === "explore"}
      voiceActive={nav.activeVoiceChannelId !== null}
      onExplore={nav.explore}
      onSelect={(id) => nav.openCommunity(id, communities.select)}
      onCreate={dialogs.openCreateCommunity}
      createRef={dialogs.createCommunityRef}
    />
  );
}

function HomeSidebar({
  nav,
  selectedCommunity,
  member,
  channels,
  dialogs,
  displayName,
  avatarUrl,
  accountTitle,
  onSignOut,
  onEditChannel,
  voiceParticipants,
  voiceOccupancy,
}: Omit<HomeNavProps, "communities">) {
  return (
    <ChannelSidebar
      community={selectedCommunity}
      isMember={member}
      text={channels.text}
      voice={channels.voice}
      activeTextChannelId={nav.activeTextChannelId}
      activeVoiceChannelId={nav.activeVoiceChannelId}
      voiceParticipants={voiceParticipants}
      voiceOccupancy={voiceOccupancy}
      canManage={canManageCommunity(selectedCommunity?.role ?? null)}
      status={channels.status}
      error={channels.error}
      onSelectText={nav.selectText}
      onSelectVoice={(id: ChannelId) => {
        if (needsVoiceSwitchConfirm(nav.activeVoiceChannelId, id)) {
          dialogs.openSwitchVoice(id);
          return;
        }
        nav.selectVoice(id);
      }}
      onCreate={dialogs.openCreateChannel}
      onInvite={dialogs.openInvite}
      onEdit={onEditChannel}
      onEditCommunity={
        selectedCommunity?.role === "owner"
          ? () => dialogs.openEditCommunity(selectedCommunity)
          : undefined
      }
      onRetry={() => void channels.retry()}
      createRef={dialogs.createChannelRef}
      displayName={displayName}
      avatarUrl={avatarUrl}
      accountTitle={accountTitle}
      onSignOut={onSignOut}
      onOpenProfile={dialogs.openProfile}
      onOpenSettings={dialogs.openSettings}
    />
  );
}

export function HomeNav(props: HomeNavProps) {
  return (
    <ShellNavColumns
      open={props.nav.sidebarOpen}
      onClose={() => props.nav.setSidebarOpen(false)}
      rail={<HomeRail {...props} />}
      sidebar={<HomeSidebar {...props} />}
    />
  );
}
