import { useEffect } from "react";
import { X } from "lucide-react";
import type { CommunityId } from "../../../../shared/community.ts";
import type { CommunityMember } from "../../services/api.ts";
import type { LoadStatus } from "../../hooks/useCommunities.ts";
import type { ParticipantView } from "../../hooks/useParticipants.ts";
import type { useFriends } from "../../hooks/useFriends.ts";
import { FriendsPanel } from "../friends/FriendsPanel.tsx";
import { MemberPanel } from "../members/MemberPanel.tsx";
import { IconButton } from "../ui/button.tsx";
import { Icon } from "../ui/icon.tsx";

type PeopleSheetProps = {
  open: boolean;
  onClose: () => void;
  friends: ReturnType<typeof useFriends>;
  communityId: CommunityId | null;
  communityName: string | null;
  canInviteToCommunity: boolean;
  memberUserIds: Set<string>;
  onInvited: () => void;
  members: CommunityMember[];
  memberStatus: LoadStatus;
  memberError: string | null;
  participants: ParticipantView[];
  voiceActive: boolean;
  onRetryMembers: () => void;
};

export function PeopleSheet({
  open,
  onClose,
  friends,
  communityId,
  communityName,
  canInviteToCommunity,
  memberUserIds,
  onInvited,
  members,
  memberStatus,
  memberError,
  participants,
  voiceActive,
  onRetryMembers,
}: PeopleSheetProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end xl:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-abyss/80 backdrop-blur-sm"
        aria-label="Fechar pessoas"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="people-sheet-title"
        className="relative z-10 flex max-h-[min(82dvh,40rem)] flex-col overflow-hidden rounded-t-[20px] border border-white/[0.08] bg-panel pb-[env(safe-area-inset-bottom)]"
      >
        <header className="flex shrink-0 items-center gap-2 border-b border-white/[0.07] px-4 py-3">
          <h2 id="people-sheet-title" className="min-w-0 flex-1 font-display text-base font-bold text-cloud">
            Pessoas
          </h2>
          <IconButton
            type="button"
            size="iconSm"
            variant="ghost"
            aria-label="Fechar pessoas"
            onClick={onClose}
          >
            <Icon icon={X} size="action" />
          </IconButton>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <FriendsPanel
            friends={friends}
            communityId={communityId}
            communityName={communityName}
            canInviteToCommunity={canInviteToCommunity}
            memberUserIds={memberUserIds}
            onInvited={onInvited}
          />
          <div className="border-t border-white/[0.07] p-5">
            <MemberPanel
              members={members}
              status={memberStatus}
              error={memberError}
              participants={participants}
              voiceActive={voiceActive}
              onRetry={onRetryMembers}
              embedded
            />
          </div>
        </div>
      </section>
    </div>
  );
}
