import type { Room } from "livekit-client";
import type {
  ApiResult,
  Channel,
  Community,
  CreateChannelInput,
  CreateCommunityInput,
  UpdateChannelInput,
} from "../../../../shared/api.ts";
import type { ChannelId, CommunityId } from "../../../../shared/community.ts";
import type { Profile } from "../../auth/types.ts";
import { CreateChannelDialog } from "../channels/CreateChannelDialog.tsx";
import { EditChannelDialog } from "../channels/EditChannelDialog.tsx";
import { CreateCommunityDialog } from "../communities/CreateCommunityDialog.tsx";
import { InviteDialog } from "../invites/InviteDialog.tsx";
import { EditProfileDialog } from "../profile/EditProfileDialog.tsx";
import { DeviceSettings } from "../controls/DeviceSettings.tsx";

type HomeDialogsProps = {
  createCommunityOpen: boolean;
  createChannelOpen: boolean;
  inviteOpen: boolean;
  profileOpen: boolean;
  settingsOpen: boolean;
  editingChannel: Channel | null;
  inviteCommunityId: CommunityId | null;
  inviteCommunityName: string;
  userId: string;
  profile: Profile;
  room: Room | null;
  onCloseCommunity: () => void;
  onCloseChannel: () => void;
  onCloseInvite: () => void;
  onCloseProfile: () => void;
  onCloseSettings: () => void;
  onCloseEditChannel: () => void;
  onCreateCommunity: (input: CreateCommunityInput) => Promise<ApiResult<Community>>;
  onCreateChannel: (input: CreateChannelInput) => Promise<ApiResult<Channel>>;
  onUpdateChannel: (
    channelId: ChannelId,
    input: UpdateChannelInput,
  ) => Promise<ApiResult<Channel>>;
  onSaveProfile: (input: {
    displayName: string;
    avatarUrl: string | null;
  }) => Promise<string | null>;
  onCreatedCommunity: (community: Community) => void;
  onCreatedChannel: (channel: Channel) => void;
};

export function HomeDialogs({
  createCommunityOpen,
  createChannelOpen,
  inviteOpen,
  profileOpen,
  settingsOpen,
  editingChannel,
  inviteCommunityId,
  inviteCommunityName,
  userId,
  profile,
  room,
  onCloseCommunity,
  onCloseChannel,
  onCloseInvite,
  onCloseProfile,
  onCloseSettings,
  onCloseEditChannel,
  onCreateCommunity,
  onCreateChannel,
  onUpdateChannel,
  onSaveProfile,
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
      <InviteDialog
        open={inviteOpen}
        communityId={inviteCommunityId}
        communityName={inviteCommunityName}
        onClose={onCloseInvite}
      />
      <EditProfileDialog
        open={profileOpen}
        userId={userId}
        profile={profile}
        onClose={onCloseProfile}
        onSave={onSaveProfile}
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
