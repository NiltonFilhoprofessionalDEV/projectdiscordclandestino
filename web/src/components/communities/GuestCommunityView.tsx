import { initials } from "../../lib/utils.ts";

type GuestCommunityViewProps = {
  name: string;
  avatarUrl?: string | null;
};

export function GuestCommunityView({ name, avatarUrl = null }: GuestCommunityViewProps) {
  return (
    <div className="surface-raised mx-auto max-w-lg rounded-[1.5rem] px-6 py-10 text-center">
      <span className="mx-auto flex size-16 items-center justify-center overflow-hidden rounded-2xl bg-deck text-lg font-semibold text-cloud ring-1 ring-white/10">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          initials(name)
        )}
      </span>
      <h2 className="mt-4 font-display text-2xl text-cloud">{name}</h2>
      <p className="mt-3 text-sm leading-relaxed text-haze">
        Você não é membro desta comunidade. Peça um convite para entrar.
      </p>
    </div>
  );
}
