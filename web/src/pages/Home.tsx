import { useState } from "react";
import { ConnectionState } from "livekit-client";
import { Menu } from "lucide-react";
import { parseDisplayName } from "../../../shared/displayName.ts";
import { getRoomLabel, type RoomId } from "../../../shared/rooms.ts";
import { ChatPanel } from "../components/chat/ChatPanel.tsx";
import { ControlBar } from "../components/controls/ControlBar.tsx";
import { ConnectionBadge } from "../components/controls/ConnectionBadge.tsx";
import { DeviceSettings } from "../components/controls/DeviceSettings.tsx";
import { MediaTile } from "../components/participants/MediaTile.tsx";
import { ParticipantList } from "../components/participants/ParticipantList.tsx";
import { VideoGrid } from "../components/participants/VideoGrid.tsx";
import { RoomList } from "../components/rooms/RoomList.tsx";
import { Button } from "../components/ui/button.tsx";
import { Input } from "../components/ui/input.tsx";
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

  const sidebar = (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-white/8 bg-panel">
      <div className="px-4 py-5">
        <p className="font-display text-xs tracking-[0.25em] text-copper uppercase">Salas</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <RoomList rooms={rooms} activeId={activeRoomId} onSelect={selectRoom} />
        {occupancyError ? (
          <p className="px-4 text-xs text-rose-300">{occupancyError}</p>
        ) : null}
      </div>
      <div className="border-t border-white/8 p-3">
        <label className="text-xs text-mist" htmlFor="rename">
          Seu nome
        </label>
        <div className="mt-1 flex gap-2">
          <Input
            id="rename"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            onBlur={commitRename}
            className="h-10"
          />
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-dvh bg-ink text-fog">
      <div className="hidden md:flex">{sidebar}</div>
      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <button
            type="button"
            className="flex-1 bg-black/50"
            aria-label="Fechar salas"
            onClick={() => setSidebarOpen(false)}
          />
          {sidebar}
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
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
              {activeRoomId ? getRoomLabel(activeRoomId) : "Escolha uma sala"}
            </h1>
            {activeRoomId ? (
              <ConnectionBadge state={connectionState} quality={quality} rttMs={rttMs} />
            ) : (
              <p className="text-xs text-mist">Clique para entrar na hora</p>
            )}
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <main className="min-h-0 flex-1 overflow-y-auto p-4">
            {!activeRoomId ? (
              <p className="text-mist">As salas já existem. É só entrar.</p>
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
                <div className="mt-6">
                  <h2 className="mb-2 text-xs tracking-wide text-mist uppercase">
                    Participantes
                  </h2>
                  <ParticipantList participants={participants} />
                </div>
              </>
            )}
          </main>
          {activeRoomId ? (
            <div className="w-full lg:w-80">
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

      {settingsOpen && room ? (
        <DeviceSettings room={room} onClose={() => setSettingsOpen(false)} />
      ) : null}
    </div>
  );
}
