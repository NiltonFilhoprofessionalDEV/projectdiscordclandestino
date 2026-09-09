import type { CommunitySummary } from "../../../../shared/api.ts";
import { ChannelSidebar } from "../channels/ChannelSidebar.tsx";
import { CommunityRail } from "../communities/CommunityRail.tsx";
import { canManageCommunity } from "../../communities/roles.ts";
import type { useChannels } from "../../hooks/useChannels.ts";
import type { useCommunities } from "../../hooks/useCommunities.ts";
import type { useHomeDialogState } from "../../hooks/useHomeDialogState.ts";
import type { useHomeNavigation } from "../../hooks/useHomeNavigation.ts";
import { ShellNavColumns } from "./ShellNavColumns.tsx";

type HomeNavProps = {
  communities: ReturnType<typeof useCommunities>;
  nav: ReturnType<typeof useHomeNavigation>;
  selectedCommunity: CommunitySummary | null;
  member: boolean;
  channels: ReturnType<typeof useChannels>;
  dialogs: ReturnType<typeof useHomeDialogState>;
  displayName: string;
};

function HomeRail({
  communities,
  nav,
  dialogs,
  displayName,
}: Pick<HomeNavProps, "communities" | "nav" | "dialogs" | "displayName">) {
  return (
    <CommunityRail
      communities={communities.communities}
      selectedId={communities.selectedId}
      exploring={nav.surface === "explore"}
      displayName={displayName}
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
}: Omit<HomeNavProps, "displayName" | "communities">) {
  return (
    <ChannelSidebar
      community={selectedCommunity}
      isMember={member}
      text={channels.text}
      voice={channels.voice}
      activeTextChannelId={nav.activeTextChannelId}
      activeVoiceChannelId={nav.activeVoiceChannelId}
      canManage={canManageCommunity(selectedCommunity?.role ?? null)}
      status={channels.status}
      error={channels.error}
      onSelectText={nav.selectText}
      onSelectVoice={nav.selectVoice}
      onCreate={dialogs.openCreateChannel}
      onRetry={() => void channels.retry()}
      createRef={dialogs.createChannelRef}
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
