import type { Room } from "livekit-client";
import type {
  ApiResult,
  Channel,
  Community,
  CommunitySummary,
  CreateChannelInput,
  CreateCommunityInput,
  UpdateChannelInput,
  UpdateCommunityInput,
} from "../../../../shared/api.ts";
import type { ChannelId, CommunityId } from "../../../../shared/community.ts";
import type { Profile } from "../../auth/types.ts";
import type { ScreenShareConfig } from "../../voice/screenShare.ts";
import { CreateChannelDialog } from "../channels/CreateChannelDialog.tsx";
import { EditChannelDialog } from "../channels/EditChannelDialog.tsx";
import { SwitchVoiceDialog } from "../channels/SwitchVoiceDialog.tsx";
import { CreateCommunityDialog } from "../communities/CreateCommunityDialog.tsx";
import { EditCommunityDialog } from "../communities/EditCommunityDialog.tsx";
import { InviteDialog } from "../invites/InviteDialog.tsx";
import { EditProfileDialog } from "../profile/EditProfileDialog.tsx";
import { DeviceSettings } from "../controls/DeviceSettings.tsx";
import { ScreenShareSettings } from "../controls/ScreenShareSettings.tsx";

type HomeDialogsProps = {
  createCommunityOpen: boolean;
  createChannelOpen: boolean;
  inviteOpen: boolean;
  profileOpen: boolean;
  settingsOpen: boolean;
  editingChannel: Channel | null;
  editingCommunity: CommunitySummary | null;
  pendingVoiceFromName: string;
  pendingVoiceToName: string;
  pendingVoiceOpen: boolean;
  screenShareOpen: boolean;
  screenShareConfig: ScreenShareConfig;
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
  onCloseEditCommunity: () => void;
  onCancelSwitchVoice: () => void;
  onAcceptSwitchVoice: () => void;
  onCloseScreenShare: () => void;
  onChangeScreenShare: (config: ScreenShareConfig) => Promise<void> | void;
  onStopScreenShare: () => Promise<void> | void;
  onCreateCommunity: (input: CreateCommunityInput) => Promise<ApiResult<Community>>;
  onCreateChannel: (input: CreateChannelInput) => Promise<ApiResult<Channel>>;
  onUpdateChannel: (
    channelId: ChannelId,
    input: UpdateChannelInput,
  ) => Promise<ApiResult<Channel>>;
  onDeleteChannel: (channelId: ChannelId) => Promise<ApiResult<{ id: ChannelId }>>;
  onUpdateCommunity: (
    communityId: CommunityId,
    input: UpdateCommunityInput,
  ) => Promise<ApiResult<Community>>;
  onDeleteCommunity: (communityId: CommunityId) => Promise<ApiResult<{ id: CommunityId }>>;
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
  editingCommunity,
  pendingVoiceFromName,
  pendingVoiceToName,
  pendingVoiceOpen,
  screenShareOpen,
  screenShareConfig,
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
  onCloseEditCommunity,
  onCancelSwitchVoice,
  onAcceptSwitchVoice,
  onCloseScreenShare,
  onChangeScreenShare,
  onStopScreenShare,
  onCreateCommunity,
  onCreateChannel,
  onUpdateChannel,
  onDeleteChannel,
  onUpdateCommunity,
  onDeleteCommunity,
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
      <EditCommunityDialog
        community={editingCommunity}
        onClose={onCloseEditCommunity}
        onUpdate={onUpdateCommunity}
        onDelete={onDeleteCommunity}
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
        onDelete={onDeleteChannel}
        onUpdated={() => undefined}
      />
      <SwitchVoiceDialog
        open={pendingVoiceOpen}
        fromName={pendingVoiceFromName}
        toName={pendingVoiceToName}
        onCancel={onCancelSwitchVoice}
        onAccept={onAcceptSwitchVoice}
      />
      {settingsOpen && room ? <DeviceSettings room={room} onClose={onCloseSettings} /> : null}
      <ScreenShareSettings
        open={screenShareOpen}
        config={screenShareConfig}
        onClose={onCloseScreenShare}
        onChangeWindow={onChangeScreenShare}
        onStop={onStopScreenShare}
      />
    </>
  );
}
