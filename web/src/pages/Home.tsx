import { useMemo, useState } from "react";
import { ConnectionState } from "livekit-client";
import { Menu } from "lucide-react";
import { parseDisplayName } from "../../../shared/displayName.ts";
import { getRoomLabel, type RoomId } from "../../../shared/rooms.ts";
import { ChatPanel } from "../components/chat/ChatPanel.tsx";
import { ControlBar } from "../components/controls/ControlBar.tsx";
import { ConnectionBadge } from "../components/controls/ConnectionBadge.tsx";
import { DeviceSettings } from "../components/controls/DeviceSettings.tsx";
import { ExploreView } from "../components/explore/ExploreView.tsx";
import { MediaTile } from "../components/participants/MediaTile.tsx";
import { ParticipantList } from "../components/participants/ParticipantList.tsx";
import { VideoGrid } from "../components/participants/VideoGrid.tsx";
import { NavigationPanel } from "../components/shell/NavigationPanel.tsx";
import { ProfilePanel } from "../components/shell/ProfilePanel.tsx";
import { ServerRail } from "../components/shell/ServerRail.tsx";
import { Button } from "../components/ui/button.tsx";
import { useChat } from "../hooks/useChat.ts";
import { useConnectionQuality } from "../hooks/useConnectionQuality.ts";
import { useMedia } from "../hooks/useMedia.ts";
import { activeScreenShare, useParticipants } from "../hooks/useParticipants.ts";
import { useOccupancy } from "../hooks/useOccupancy.ts";
import { useRoom } from "../hooks/useRoom.ts";

type HomeProps = {
  displayName: string;
  onRename: (name: string) => void;
};

export function Home({ displayName, onRename }: HomeProps) {
  const { rooms, error: occupancyError } = useOccupancy();
  const [activeRoomId, setActiveRoomId] = useState<RoomId | null>(null);
  const [draftName, setDraftName] = useState(displayName);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const { room, connectionState, error, leave, findScreenOwner } = useRoom(
    displayName,
    activeRoomId,
  );
  const participants = useParticipants(room).map((participant) =>
    participant.isLocal
      ? { ...participant, name: participant.name || displayName }
      : participant,
  );
  const media = useMedia(room, findScreenOwner);
  const { messages, send } = useChat(room, displayName);
  const { quality, rttMs } = useConnectionQuality(room);
  const screen = activeScreenShare(participants);
  const canScreenShare = Boolean(navigator.mediaDevices?.getDisplayMedia);
  const liveRooms = useMemo(
    () => rooms.filter((item) => item.occupantCount > 0).slice(0, 4),
    [rooms],
  );

  function selectRoom(id: RoomId) {
    setActiveRoomId(id);
    setSidebarOpen(false);
  }

  async function handleLeave() {
    await leave();
    setActiveRoomId(null);
  }

  function commitRename() {
    const parsed = parseDisplayName(draftName);
    if (parsed.ok) {
      onRename(parsed.value);
    }
  }

  const navigation = (
    <NavigationPanel
      rooms={rooms}
      activeRoomId={activeRoomId}
      draftName={draftName}
      occupancyError={occupancyError}
      onExplore={() => {
        setActiveRoomId(null);
        setSidebarOpen(false);
      }}
      onSelect={selectRoom}
      onDraftName={setDraftName}
      onCommitName={commitRename}
    />
  );

  return (
    <div className="min-h-dvh bg-night text-cloud md:p-3">
      <div className="mx-auto flex min-h-dvh max-w-[1600px] overflow-hidden bg-night md:min-h-[calc(100dvh-1.5rem)] md:rounded-[1.75rem] md:border md:border-white/8 md:shadow-glow">
        <ServerRail
          rooms={rooms}
          activeRoomId={activeRoomId}
          displayName={displayName}
          onExplore={() => setActiveRoomId(null)}
          onSelect={selectRoom}
        />
        <div className="hidden md:flex">{navigation}</div>
        {sidebarOpen ? (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <button
              type="button"
              className="flex-1 bg-abyss/80 backdrop-blur-sm"
              aria-label="Fechar salas"
              onClick={() => setSidebarOpen(false)}
            />
            {navigation}
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="glass-bar flex min-h-16 items-center gap-3 border-x-0 border-t-0 px-4 lg:px-6">
          <Button
            type="button"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir salas"
          >
            <Menu className="size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl">
              {activeRoomId ? getRoomLabel(activeRoomId) : "Explore"}
            </h1>
            {activeRoomId ? (
              <ConnectionBadge state={connectionState} quality={quality} rttMs={rttMs} />
            ) : (
              <p className="text-xs text-haze">Encontre sua próxima conversa</p>
            )}
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <main className="relative min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
            {!activeRoomId ? (
              <ExploreView
                rooms={rooms}
                query={query}
                onQuery={setQuery}
                onSelect={selectRoom}
                occupancyError={occupancyError}
              />
            ) : (
              <>
                {error ? <p className="mb-3 text-sm text-rose-300">{error}</p> : null}
                {connectionState === ConnectionState.Connected && participants.length === 0 ? (
                  <p className="text-mist">Ninguém mais por aqui ainda.</p>
                ) : null}
                {screen?.screenPublication ? (
                  <div className="mb-4">
                    <p className="mb-2 text-sm text-copper">
                      {screen.name} está compartilhando a tela
                    </p>
                    <MediaTile
                      publication={screen.screenPublication}
                      label={screen.name}
                      large
                      muteElement={screen.isLocal}
                    />
                  </div>
                ) : null}
                <VideoGrid participants={participants} />
                <div className="mt-6 xl:hidden">
                  <h2 className="mb-2 text-xs tracking-wide text-mist uppercase">Participantes</h2>
                  <ParticipantList participants={participants} />
                </div>
              </>
            )}
          </main>
          {activeRoomId ? (
            <div className="w-full p-4 pt-0 lg:w-80 lg:p-0">
              <ChatPanel messages={messages} onSend={send} />
            </div>
          ) : null}
        </div>

        {activeRoomId ? (
          <ControlBar
            micOn={media.micOn}
            cameraOn={media.cameraOn}
            screenOn={media.screenOn}
            canScreenShare={canScreenShare}
            onToggleMic={() => void media.toggleMic()}
            onToggleCamera={() => void media.toggleCamera()}
            onToggleScreen={() => void media.toggleScreen()}
            onSettings={() => setSettingsOpen(true)}
            onLeave={() => void handleLeave()}
          />
        ) : null}
      </div>

      <ProfilePanel
        displayName={displayName}
        activeRoomId={activeRoomId}
        participants={participants}
        liveRooms={liveRooms}
        onSelect={selectRoom}
      />

      {settingsOpen && room ? (
        <DeviceSettings room={room} onClose={() => setSettingsOpen(false)} />
      ) : null}
      </div>
    </div>
  );
}
