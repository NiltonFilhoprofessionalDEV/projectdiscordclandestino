import type { ParticipantView } from "../../hooks/useParticipants.ts";
import { MediaTile } from "./MediaTile.tsx";

type VideoGridProps = {
  participants: ParticipantView[];
};

export function VideoGrid({ participants }: VideoGridProps) {
  const withCamera = participants.filter((participant) => participant.cameraPublication);
  if (withCamera.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {withCamera.map((participant) => (
        <MediaTile
          key={participant.identity}
          publication={participant.cameraPublication!}
          label={participant.name}
          muteElement={participant.isLocal}
        />
      ))}
    </div>
  );
}
