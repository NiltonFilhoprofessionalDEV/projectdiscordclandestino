import { useRef, type RefObject } from "react";
import { ArrowUpRight, Radio, Search } from "lucide-react";
import type { CommunitySummary } from "../../../../shared/api.ts";
import { filterExploreCommunities } from "../../communities/lists.ts";
import type { LoadStatus } from "../../hooks/useCommunities.ts";
import { cn } from "../../lib/utils.ts";
import { Input } from "../ui/input.tsx";
import { Button } from "../ui/button.tsx";
import { PulseLine } from "../shell/PulseLine.tsx";

const ACCENTS = [
  "from-electric to-[#49b8ff]",
  "from-pulse to-[#c05cff]",
  "from-[#ff8a66] to-coral",
  "from-[#39c6b4] to-electric",
];

type ExploreViewProps = {
  communities: CommunitySummary[];
  query: string;
  onQuery: (value: string) => void;
  onChoose: (community: CommunitySummary) => void;
  status: LoadStatus;
  error: string | null;
  onRetry: () => void;
};

function accentFor(id: string): string {
  let hash = 0;
  for (const char of id) {
    hash = (hash + char.charCodeAt(0)) % ACCENTS.length;
  }
  return ACCENTS[hash] ?? ACCENTS[0];
}

function CommunityCard({
  community,
  onChoose,
}: {
  community: CommunitySummary;
  onChoose: (community: CommunitySummary) => void;
}) {
  const member = community.role !== null;
  const action = member ? "Abrir" : "Ver";
  return (
    <button
      type="button"
      onClick={() => onChoose(community)}
      aria-label={member ? `Abrir ${community.name}` : `Ver ${community.name}, você não é membro`}
      className="focus-ring surface-raised group flex min-h-40 overflow-hidden rounded-[1.35rem] text-left transition hover:-translate-y-0.5 hover:border-electric/30"
    >
      <span
        className={cn("w-2 shrink-0 bg-linear-to-b transition group-hover:w-3", accentFor(community.id))}
        aria-hidden
      />
      <span className="flex flex-1 flex-col p-5">
        <span className="text-[11px] font-semibold tracking-[0.14em] text-haze uppercase">
          {member ? (community.visibility === "private" ? "Sua comunidade privada" : "Você participa") : "Comunidade pública"}
        </span>
        <span className="mt-2 font-display text-xl text-cloud">{community.name}</span>
        <span className="mt-1 text-sm leading-relaxed text-haze">/{community.slug}</span>
        <span className="mt-auto flex items-end justify-end pt-5">
          <span className="flex items-center gap-1 text-sm font-semibold text-[#aab9ff]">
            {action} <ArrowUpRight className="size-4" />
          </span>
        </span>
      </span>
    </button>
  );
}

function EmptyState({
  title,
  detail,
  actionLabel,
  onAction,
}: {
  title: string;
  detail: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="surface rounded-[1.35rem] px-5 py-10 text-center">
      <p className="font-semibold text-cloud">{title}</p>
      <p className="mt-1 text-sm text-haze">{detail}</p>
      <Button type="button" className="mt-5" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}

function ExploreHero() {
  return (
    <section className="surface-raised relative grid overflow-hidden rounded-[1.6rem] p-6 sm:p-8 lg:min-h-56 lg:grid-cols-[1fr_0.7fr] lg:items-center">
      <div className="relative z-10">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-[#aab9ff] uppercase">
          <Radio className="size-4 text-coral" /> Comunidades
        </p>
        <h2 className="mt-4 max-w-xl font-display text-2xl leading-tight text-cloud sm:text-3xl lg:text-4xl">
          Encontre sua próxima conversa.
        </h2>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-haze">
          Entre nas comunidades de que você já faz parte ou descubra espaços públicos.
        </p>
      </div>
      <div className="relative hidden h-24 lg:block" aria-hidden>
        <span className="absolute top-2 right-4 size-20 rounded-[1.4rem] bg-pulse/20 ring-1 ring-pulse/30" />
        <span className="absolute right-24 bottom-0 size-16 rounded-[1.2rem] bg-electric/20 ring-1 ring-electric/30" />
        <PulseLine active className="absolute top-1/2 right-0 w-full" />
      </div>
    </section>
  );
}

function ExploreLists({
  joined,
  discoverable,
  onChoose,
}: {
  joined: CommunitySummary[];
  discoverable: CommunitySummary[];
  onChoose: (community: CommunitySummary) => void;
}) {
  return (
    <>
      {joined.length > 0 ? (
        <section>
          <h3 className="mb-4 text-sm font-semibold text-cloud">Suas comunidades</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {joined.map((community) => (
              <CommunityCard key={community.id} community={community} onChoose={onChoose} />
            ))}
          </div>
        </section>
      ) : null}
      {discoverable.length > 0 ? (
        <section>
          <h3 className="mb-4 text-sm font-semibold text-cloud">Comunidades públicas</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {discoverable.map((community) => (
              <CommunityCard key={community.id} community={community} onChoose={onChoose} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

function ExploreSearch({
  query,
  onQuery,
  searchRef,
}: {
  query: string;
  onQuery: (value: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="flex justify-center lg:justify-end">
      <label className="relative w-full max-w-md" htmlFor="community-search">
        <span className="sr-only">Buscar comunidades</span>
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-haze" />
        <Input
          ref={searchRef}
          id="community-search"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Buscar uma comunidade"
          className="h-11 pl-11"
        />
      </label>
    </div>
  );
}

function ExploreStatus({
  status,
  error,
  isEmpty,
  hasQuery,
  onRetry,
  onQuery,
  searchRef,
}: {
  status: LoadStatus;
  error: string | null;
  isEmpty: boolean;
  hasQuery: boolean;
  onRetry: () => void;
  onQuery: (value: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
}) {
  if (status === "error") {
    return (
      <EmptyState
        title="Não foi possível carregar as comunidades."
        detail={error ?? "Tente novamente em instantes."}
        actionLabel="Tentar de novo"
        onAction={onRetry}
      />
    );
  }
  if (status === "ready" && isEmpty && !hasQuery) {
    return (
      <EmptyState
        title="Nenhuma comunidade por aqui."
        detail="Crie a primeira ou peça um convite."
        actionLabel="Atualizar"
        onAction={onRetry}
      />
    );
  }
  if (status === "ready" && isEmpty && hasQuery) {
    return (
      <EmptyState
        title="Nenhuma comunidade encontrada."
        detail="Limpe a busca ou tente outro nome."
        actionLabel="Limpar busca"
        onAction={() => {
          onQuery("");
          requestAnimationFrame(() => searchRef.current?.focus());
        }}
      />
    );
  }
  return null;
}

export function ExploreView({
  communities,
  query,
  onQuery,
  onChoose,
  status,
  error,
  onRetry,
}: ExploreViewProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const { joined, discoverable } = filterExploreCommunities(communities, query);
  const hasQuery = query.trim().length > 0;
  const isEmpty = joined.length === 0 && discoverable.length === 0;

  return (
    <div className="flex w-full flex-col gap-7">
      <ExploreSearch query={query} onQuery={onQuery} searchRef={searchRef} />
      <ExploreHero />
      <ExploreStatus
        status={status}
        error={error}
        isEmpty={isEmpty}
        hasQuery={hasQuery}
        onRetry={onRetry}
        onQuery={onQuery}
        searchRef={searchRef}
      />
      <ExploreLists joined={joined} discoverable={discoverable} onChoose={onChoose} />
    </div>
  );
}
