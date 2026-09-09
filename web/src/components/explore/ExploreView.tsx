import { useEffect, useRef, type RefObject } from "react";
import { Search } from "lucide-react";
import type { CommunitySummary } from "../../../../shared/api.ts";
import { filterExploreCommunities } from "../../communities/lists.ts";
import type { LoadStatus } from "../../hooks/useCommunities.ts";
import { Input } from "../ui/input.tsx";
import { Button } from "../ui/button.tsx";
import { Icon } from "../ui/icon.tsx";
import { Loading } from "../ui/loading.tsx";
import { CommunityCard, communityCardKind } from "./CommunityCard.tsx";
import { communityCoverFor } from "./communityCovers.ts";

type ExploreViewProps = {
  communities: CommunitySummary[];
  query: string;
  onQuery: (value: string) => void;
  onChoose: (community: CommunitySummary) => void;
  status: LoadStatus;
  error: string | null;
  onRetry: () => void;
};

function ExploreCommunityCard({
  community,
  onChoose,
}: {
  community: CommunitySummary;
  onChoose: (community: CommunitySummary) => void;
}) {
  const member = community.role !== null;
  return (
    <CommunityCard
      title={community.name}
      slug={community.slug}
      kind={communityCardKind(member, community.visibility)}
      image={communityCoverFor(community.id, community.avatarUrl)}
      avatarUrl={community.avatarUrl}
      onlineCount={community.onlineCount}
      activeRooms={community.activeRooms}
      actionLabel={member ? "Abrir" : "Ver"}
      onOpen={() => onChoose(community)}
    />
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
    <div className="surface neon-edge rounded-2xl px-5 py-10 text-center">
      <p className="font-display text-lg font-semibold text-cloud">{title}</p>
      <p className="mt-1 text-sm text-haze">{detail}</p>
      <Button type="button" variant="primary" className="mt-5" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
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
          <h3 className="mb-4 font-display text-sm font-semibold tracking-wide text-cloud">
            Suas comunidades
          </h3>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {joined.map((community) => (
              <ExploreCommunityCard key={community.id} community={community} onChoose={onChoose} />
            ))}
          </div>
        </section>
      ) : null}
      {discoverable.length > 0 ? (
        <section>
          <h3 className="mb-4 font-display text-sm font-semibold tracking-wide text-cloud">
            Comunidades públicas
          </h3>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {discoverable.map((community) => (
              <ExploreCommunityCard key={community.id} community={community} onChoose={onChoose} />
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
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 className="font-display text-2xl font-semibold text-cloud">Explorar</h2>
        <p className="mt-1 text-sm text-haze">Entre nas suas comunidades ou descubra espaços públicos.</p>
      </div>
      <label className="relative w-full sm:max-w-md" htmlFor="community-search">
        <span className="sr-only">Buscar comunidades</span>
        <Icon
          icon={Search}
          size="action"
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-haze"
        />
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

type ExploreStatusProps = {
  status: LoadStatus;
  error: string | null;
  isEmpty: boolean;
  hasQuery: boolean;
  onRetry: () => void;
  onQuery: (value: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
};

function ExploreStatus({
  status,
  error,
  isEmpty,
  hasQuery,
  onRetry,
  onQuery,
  searchRef,
}: ExploreStatusProps) {
  if (status === "loading" || status === "idle") {
    return <Loading label="Carregando comunidades…" />;
  }
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

const EXPLORE_POLL_MS = 12_000;

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
  const retryRef = useRef(onRetry);
  retryRef.current = onRetry;
  const { joined, discoverable } = filterExploreCommunities(communities, query);
  const hasQuery = query.trim().length > 0;
  const isEmpty = joined.length === 0 && discoverable.length === 0;

  useEffect(() => {
    const timer = window.setInterval(() => retryRef.current(), EXPLORE_POLL_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex w-full flex-col gap-6">
      <ExploreSearch query={query} onQuery={onQuery} searchRef={searchRef} />
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
