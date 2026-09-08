import { useMemo, useState } from "react";
import { ConnectionState } from "livekit-client";
import { Home as HomeIcon, Menu } from "lucide-react";
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
import { RoomList } from "../components/rooms/RoomList.tsx";
import { ProfilePanel } from "../components/shell/ProfilePanel.tsx";
import { ServerRail } from "../components/shell/ServerRail.tsx";
import { Button } from "../components/ui/button.tsx";
import { Input } from "../components/ui/input.tsx";
import { useChat } from "../hooks/useChat.ts";
import { useConnectionQuality } from "../hooks/useConnectionQuality.ts";
import { useMedia } from "../hooks/useMedia.ts";
import { activeScreenShare, useParticipants } from "../hooks/useParticipants.ts";
import { useOccupancy } from "../hooks/useOccupancy.ts";
import { useRoom } from "../hooks/useRoom.ts";
import { cn } from "../lib/utils.ts";

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

  const sidebar = (
    <aside className="glass flex h-full w-64 shrink-0 flex-col rounded-r-[1.5rem] md:rounded-[1.5rem]">
      <div className="px-5 py-5">
        <p className="font-display text-xs tracking-[0.28em] text-copper uppercase">Salas</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <button
          type="button"
          onClick={() => {
            setActiveRoomId(null);
            setSidebarOpen(false);
          }}
          className={cn(
            "mx-3 mb-1 flex min-h-11 w-[calc(100%-1.5rem)] items-center gap-3 rounded-2xl px-3 text-left text-sm",
            activeRoomId === null ? "bg-white/8 text-fog" : "text-mist hover:bg-white/5 hover:text-fog",
          )}
        >
          <HomeIcon className="size-4" />
          Explorar
        </button>
        <RoomList rooms={rooms} activeId={activeRoomId} onSelect={selectRoom} />
        {occupancyError ? <p className="px-4 text-xs text-rose-300">{occupancyError}</p> : null}
      </div>
      <div className="border-t border-white/8 p-3">
        <label className="text-xs text-mist" htmlFor="rename">
          Seu nome
        </label>
        <Input
          id="rename"
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          onBlur={commitRename}
          className="mt-1 h-10 rounded-full"
        />
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-dvh text-fog">
      <ServerRail
        rooms={rooms}
        activeRoomId={activeRoomId}
        displayName={displayName}
        onExplore={() => setActiveRoomId(null)}
        onSelect={selectRoom}
      />
      <div className="hidden py-3 pr-1 md:flex">{sidebar}</div>
      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <button
            type="button"
            className="flex-1 bg-void/70"
            aria-label="Fechar salas"
            onClick={() => setSidebarOpen(false)}
          />
          {sidebar}
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col py-3 pr-3">
        <header className="glass mb-3 flex items-center gap-3 rounded-[1.25rem] px-4 py-3">
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
              <p className="text-xs text-mist">Clique para entrar na hora</p>
            )}
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <main className="relative min-h-0 flex-1 overflow-y-auto px-1 pb-4">
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
  );
}
