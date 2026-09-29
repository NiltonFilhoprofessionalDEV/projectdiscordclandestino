import { useState } from "react";
import { ConnectionState } from "livekit-client";
import type { ParticipantView } from "../../hooks/useParticipants.ts";
import { cn } from "../../lib/utils.ts";
import { resolveFocusedShare } from "../../voice/screenFocus.ts";
import { ParticipantTile } from "../participants/ParticipantTile.tsx";
import { ScreenShareStage } from "./ScreenShareStage.tsx";
import { ScreenShareThumb } from "./ScreenShareThumb.tsx";

type VoiceStageProps = {
  error: string | null;
  connectionState: ConnectionState;
  participants: ParticipantView[];
  screens: ParticipantView[];
};

export function VoiceStage({ error, connectionState, participants, screens }: VoiceStageProps) {
  const [focusedIdentity, setFocusedIdentity] = useState<string | null>(null);
  const focused = resolveFocusedShare(screens, focusedIdentity);
  const otherScreens = focused
    ? screens.filter((screen) => screen.identity !== focused.identity)
    : [];

  return (
    <div className={cn("flex min-h-0 flex-col", focused && "h-full min-h-0 flex-1")}>
      {error ? <p className="mb-3 shrink-0 text-sm text-coral">{error}</p> : null}
      {connectionState === ConnectionState.Connected && participants.length === 0 ? (
        <p className="text-haze">Ninguém mais por aqui ainda.</p>
      ) : null}
      {focused ? (
        <>
          <div className="min-h-0 flex-1">
            <ScreenShareStage key={focused.identity} screen={focused} />
          </div>
          {otherScreens.length > 0 || participants.length > 0 ? (
            <div className="mt-3 flex shrink-0 items-center gap-2 overflow-x-auto pb-1">
              {otherScreens.map((screen) => (
                <ScreenShareThumb
                  key={`screen-${screen.identity}`}
                  screen={screen}
                  onSelect={() => setFocusedIdentity(screen.identity)}
                />
              ))}
              {participants.map((participant) => (
                <ParticipantTile key={participant.identity} participant={participant} compact />
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
          {participants.map((participant) => (
            <ParticipantTile key={participant.identity} participant={participant} />
          ))}
        </div>
      )}
    </div>
  );
}
