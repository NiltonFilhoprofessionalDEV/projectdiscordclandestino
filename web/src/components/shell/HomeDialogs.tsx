import type { Room } from "livekit-client";
import type {
  ApiResult,
  Channel,
  Community,
  CreateChannelInput,
  CreateCommunityInput,
  UpdateChannelInput,
} from "../../../../shared/api.ts";
import type { ChannelId } from "../../../../shared/community.ts";
import { CreateChannelDialog } from "../channels/CreateChannelDialog.tsx";
import { EditChannelDialog } from "../channels/EditChannelDialog.tsx";
import { CreateCommunityDialog } from "../communities/CreateCommunityDialog.tsx";
import { DeviceSettings } from "../controls/DeviceSettings.tsx";

type HomeDialogsProps = {
  createCommunityOpen: boolean;
  createChannelOpen: boolean;
  settingsOpen: boolean;
  editingChannel: Channel | null;
  room: Room | null;
  onCloseCommunity: () => void;
  onCloseChannel: () => void;
  onCloseSettings: () => void;
  onCloseEditChannel: () => void;
  onCreateCommunity: (input: CreateCommunityInput) => Promise<ApiResult<Community>>;
  onCreateChannel: (input: CreateChannelInput) => Promise<ApiResult<Channel>>;
  onUpdateChannel: (
    channelId: ChannelId,
    input: UpdateChannelInput,
  ) => Promise<ApiResult<Channel>>;
  onCreatedCommunity: (community: Community) => void;
  onCreatedChannel: (channel: Channel) => void;
};

export function HomeDialogs({
  createCommunityOpen,
  createChannelOpen,
  settingsOpen,
  editingChannel,
  room,
  onCloseCommunity,
  onCloseChannel,
  onCloseSettings,
  onCloseEditChannel,
  onCreateCommunity,
  onCreateChannel,
  onUpdateChannel,
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
      <EditChannelDialog
        channel={editingChannel}
        onClose={onCloseEditChannel}
        onUpdate={onUpdateChannel}
        onUpdated={() => undefined}
      />
      {settingsOpen && room ? <DeviceSettings room={room} onClose={onCloseSettings} /> : null}
    </>
  );
}
