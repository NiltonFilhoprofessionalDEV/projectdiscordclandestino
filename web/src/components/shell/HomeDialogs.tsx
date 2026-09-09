import type { Room } from "livekit-client";
import type { ApiResult, Channel, Community, CreateChannelInput, CreateCommunityInput } from "../../../../shared/api.ts";
import { CreateChannelDialog } from "../channels/CreateChannelDialog.tsx";
import { CreateCommunityDialog } from "../communities/CreateCommunityDialog.tsx";
import { DeviceSettings } from "../controls/DeviceSettings.tsx";

type HomeDialogsProps = {
  createCommunityOpen: boolean;
  createChannelOpen: boolean;
  settingsOpen: boolean;
  room: Room | null;
  onCloseCommunity: () => void;
  onCloseChannel: () => void;
  onCloseSettings: () => void;
  onCreateCommunity: (input: CreateCommunityInput) => Promise<ApiResult<Community>>;
  onCreateChannel: (input: CreateChannelInput) => Promise<ApiResult<Channel>>;
  onCreatedCommunity: (community: Community) => void;
  onCreatedChannel: (channel: Channel) => void;
};

export function HomeDialogs({
  createCommunityOpen,
  createChannelOpen,
  settingsOpen,
  room,
  onCloseCommunity,
  onCloseChannel,
  onCloseSettings,
  onCreateCommunity,
  onCreateChannel,
  onCreatedCommunity,
  onCreatedChannel,
}: HomeDialogsProps) {
  return (
    <>
      <CreateCommunityDialog
        open={createCommunityOpen}
        onClose={onCloseCommunity}
        onCreate={onCreateCommunity}
        onCreated={onCreatedCommunity}
      />
      <CreateChannelDialog
        open={createChannelOpen}
        onClose={onCloseChannel}
        onCreate={onCreateChannel}
        onCreated={onCreatedChannel}
      />
      {settingsOpen && room ? <DeviceSettings room={room} onClose={onCloseSettings} /> : null}
    </>
  );
}
