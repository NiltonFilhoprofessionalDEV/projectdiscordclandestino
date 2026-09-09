import type { CommunityMember } from "../../services/api.ts";
import type { LoadStatus } from "../../hooks/useCommunities.ts";
import type { ParticipantView } from "../../hooks/useParticipants.ts";
import { initials } from "../../lib/utils.ts";
import { Button } from "../ui/button.tsx";
import { Loading } from "../ui/loading.tsx";
import { ParticipantList } from "../participants/ParticipantList.tsx";

type MemberPanelProps = {
  members: CommunityMember[];
  status: LoadStatus;
  error: string | null;
  participants?: ParticipantView[];
  voiceActive?: boolean;
  onRetry: () => void;
  embedded?: boolean;
};

function roleLabel(role: CommunityMember["role"]): string {
  if (role === "owner") {
    return "Dono";
  }
  if (role === "admin") {
    return "Admin";
  }
  return "Membro";
}

function MemberRoster({
  status,
  error,
  members,
  onRetry,
}: {
  status: LoadStatus;
  error: string | null;
  members: CommunityMember[];
  onRetry: () => void;
}) {
  if (status === "error") {
    return (
      <div className="mt-3">
        <p className="text-sm text-coral">{error}</p>
        <Button type="button" variant="secondary" className="mt-3 w-full" onClick={onRetry}>
          Tentar de novo
        </Button>
      </div>
    );
  }
  if (status === "idle") {
    return <p className="mt-3 text-sm text-haze">Selecione uma comunidade.</p>;
  }
  if (status === "loading") {
    return <Loading className="mt-3" label="Carregando membros…" />;
  }
  if (members.length === 0) {
    return (
      <p className="mt-3 rounded-xl bg-abyss/55 px-3 py-4 text-sm leading-relaxed text-haze">
        Nenhum membro para exibir.
      </p>
    );
  }
  return (
    <ul className="mt-2 space-y-0.5">
      {members.map((member) => (
        <li
          key={member.userId}
          className="flex min-h-10 items-center gap-3 rounded-xl px-2 py-1.5 transition duration-150 ease-out hover:bg-white/[0.04]"
        >
          <span className="relative flex size-8 items-center justify-center overflow-hidden rounded-full bg-deck text-[11px] font-semibold text-cloud ring-1 ring-white/[0.06]">
            {member.avatarUrl ? (
              <img
                src={member.avatarUrl}
                alt=""
                className="size-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              initials(member.displayName)
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm text-cloud">{member.displayName}</span>
            <span className="text-xs text-haze">{roleLabel(member.role)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function MemberPanel({
  members,
  status,
  error,
  participants = [],
  voiceActive = false,
  onRetry,
  embedded = false,
}: MemberPanelProps) {
  const body = (
    <>
      <div>
        <h2 className="px-1 text-[11px] font-semibold tracking-[0.04em] text-muted uppercase">
          Membros — {status === "ready" ? members.length : "…"}
        </h2>
        <MemberRoster status={status} error={error} members={members} onRetry={onRetry} />
      </div>
      {voiceActive ? (
        <div className="mt-6">
          <h2 className="mb-3 px-1 text-[11px] font-semibold tracking-[0.04em] text-muted uppercase">
            Na chamada — {participants.length}
          </h2>
          {participants.length === 0 ? (
            <p className="rounded-xl bg-abyss/55 px-3 py-4 text-sm leading-relaxed text-haze">
              Conectando à chamada…
            </p>
          ) : (
            <ParticipantList participants={participants} />
          )}
        </div>
      ) : null}
    </>
  );

  if (embedded) {
    return <div className="flex flex-col gap-2">{body}</div>;
  }

  return (
    <aside className="hidden h-full w-72 shrink-0 flex-col gap-6 border-l border-white/[0.07] bg-panel p-5 xl:flex">
      {body}
    </aside>
  );
}
