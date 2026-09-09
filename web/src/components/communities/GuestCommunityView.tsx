type GuestCommunityViewProps = {
  name: string;
};

export function GuestCommunityView({ name }: GuestCommunityViewProps) {
  return (
    <div className="surface-raised mx-auto max-w-lg rounded-[1.5rem] px-6 py-10 text-center">
      <h2 className="font-display text-2xl text-cloud">{name}</h2>
      <p className="mt-3 text-sm leading-relaxed text-haze">
        Você não é membro desta comunidade. Peça um convite para entrar.
      </p>
    </div>
  );
}
