import { Check, ExternalLink, Globe, Lock } from "lucide-react";
import type { ActiveVoiceRoom } from "../../../../shared/api.ts";
import { visibleExploreRooms } from "../../../../shared/exploreActivity.ts";
import { cn, initials } from "../../lib/utils.ts";
import { Icon } from "../ui/icon.tsx";

export type CommunityCardKind = "joined" | "private" | "public";

const STATUS = {
  joined: { label: "Você participa", icon: Check },
  private: { label: "Sua comunidade privada", icon: Lock },
  public: { label: "Comunidade pública", icon: Globe },
} as const;

export type CommunityCardProps = {
  title: string;
  slug: string;
  kind: CommunityCardKind;
  image: string;
  avatarUrl?: string | null;
  onlineCount?: number;
  activeRooms?: ActiveVoiceRoom[];
  actionLabel: "Abrir" | "Ver";
  onOpen: () => void;
};

export function communityCardKind(
  member: boolean,
  visibility: "public" | "private",
): CommunityCardKind {
  if (member && visibility === "private") return "private";
  if (member) return "joined";
  return "public";
}

export function CommunityCard({
  title,
  slug,
  kind,
  image,
  avatarUrl = null,
  onlineCount = 0,
  activeRooms = [],
  actionLabel,
  onOpen,
}: CommunityCardProps) {
  const status = STATUS[kind];
  const rooms = visibleExploreRooms(activeRooms);

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={
        actionLabel === "Abrir"
          ? `Abrir ${title}, ${onlineCount} online`
          : `Ver ${title}, você não é membro`
      }
      className={cn(
        "focus-ring group relative flex w-full min-w-0 min-h-[184px] rounded-2xl p-px text-left",
        "bg-[linear-gradient(135deg,rgba(255,255,255,0.22),rgba(168,85,247,0.55)_46%,rgba(6,182,212,0.38))]",
        "shadow-[0_10px_28px_rgba(0,0,0,0.42)]",
        "transition-all duration-300 ease-out",
        "hover:scale-[1.01]",
        "hover:bg-[linear-gradient(135deg,rgba(168,85,247,0.95),rgba(236,72,153,0.72)_52%,rgba(6,182,212,0.7))]",
        "hover:shadow-[0_14px_36px_rgba(0,0,0,0.5),0_0_20px_rgba(168,85,247,0.25)]",
      )}
    >
      <span className="relative flex min-h-[182px] w-full overflow-hidden rounded-[15px] bg-[#0e1017]/80 backdrop-blur-md">
        <span className="relative z-10 flex min-w-0 flex-[1.15] flex-col justify-center px-5 py-5 pr-3">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
            <Icon icon={status.icon} size="sm" className="size-3" />
            {status.label}
          </span>
          <span className="mt-2 flex min-w-0 items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-deck text-xs font-semibold text-cloud ring-1 ring-white/15">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                initials(title)
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 block font-display text-lg font-semibold text-white sm:text-xl">
                {title}
              </span>
              <span className="mt-1 block text-xs text-zinc-500">/{slug}</span>
              <span className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                <span className="inline-flex items-center gap-1.5 text-signal">
                  <span className="size-1.5 shrink-0 rounded-full bg-signal" aria-hidden />
                  {onlineCount} online
                </span>
                {rooms.shown.map((room) => (
                  <span key={`${room.name}-${room.occupantCount}`} className="text-haze">
                    {room.name} · {room.occupantCount}
                  </span>
                ))}
                {rooms.extra > 0 ? <span className="text-haze">e mais {rooms.extra}</span> : null}
              </span>
            </span>
          </span>
        </span>

        <span className="relative w-[42%] min-w-[132px] shrink-0 sm:w-[46%]" aria-hidden>
          <img
            src={image}
            alt=""
            className={cn(
              "absolute inset-0 size-full object-cover",
              avatarUrl ? "object-center" : "object-right",
            )}
          />
          <span className="absolute inset-0 bg-[linear-gradient(90deg,#0e1017_0%,rgba(14,16,23,0.42)_34%,rgba(14,16,23,0.08)_68%,transparent_100%)]" />
        </span>

        <span
          className={cn(
            "absolute right-4 bottom-4 z-20 inline-flex items-center gap-1.5 rounded-full",
            "border border-purple-400/60 bg-[#0e1017]/70 px-3 py-1.5",
            "text-xs font-semibold text-white backdrop-blur-sm",
            "transition-all duration-300 ease-out",
            "group-hover:border-transparent",
            "group-hover:bg-[linear-gradient(135deg,#a855f7,#ec4899)]",
            "group-hover:shadow-[0_8px_18px_rgba(168,85,247,0.28)]",
          )}
        >
          {actionLabel}
          <Icon
            icon={ExternalLink}
            size="sm"
            className="size-3.5 transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </span>
      </span>
    </button>
  );
}
