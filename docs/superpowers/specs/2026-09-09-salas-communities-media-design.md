# Salas — Comunidades, canais e mídia

## Objetivo

Evoluir o Salas de quatro salas fixas com chat efêmero para uma plataforma
persistente de comunidades, com contas, canais de texto e voz, controles
completos de transmissão e feedback sonoro. A experiência final será entregue
em uma única release, construída e verificada por subsistemas.

## Decisões aprovadas

- Supabase local nesta fase; nenhum projeto remoto será criado.
- Supabase Auth com e-mail/senha e fluxo preparado para Google OAuth.
- PostgreSQL, RLS e Supabase Realtime para dados persistentes.
- LiveKit exclusivamente para voz, câmera e screen share.
- Comunidades permanentes, públicas ou privadas.
- Papéis `owner`, `admin` e `member`.
- Vários canais `text` e `voice` por comunidade.
- Mensagens permanentes até exclusão administrativa.
- Entrada em comunidades privadas por convite revogável.
- Sons originais discretos para ações locais e eventos de participantes.
- Volume e mute para transmissão e para cada participante.
- Chat de canal de voz fechado por padrão, lembrando a preferência local.

## Estado atual

- `shared/rooms.ts` define quatro `RoomId` em compile time.
- `/api/rooms` lista apenas essas salas; `/api/token` aceita um `RoomId`.
- `useChat` transmite mensagens por LiveKit Data e apaga o estado ao sair.
- `useRoom` anexa áudio remoto globalmente, impedindo volume individual.
- `MediaTile` suporta vídeo, mas não fullscreen ou áudio controlado.
- A identidade é apenas um nome em `localStorage`, sem autenticação.
- O shell usa largura máxima e margem externa em desktop.

## Arquitetura

### Responsabilidades

- **Supabase Auth:** identidade, sessão, e-mail/senha e Google OAuth.
- **PostgreSQL + RLS:** comunidades, membros, canais, mensagens e convites.
- **Supabase Realtime:** novas mensagens e atualizações de presença textual.
- **Hono:** validação de JWT, operações privilegiadas, consumo de convite,
  rate limiting e emissão de token LiveKit.
- **LiveKit:** áudio, câmera, screen share e presença no canal de voz.
- **React:** estado de navegação, mídia local, controles, preferências e UI.

O frontend nunca recebe service role/secret. O servidor nunca confia em
`communityId`, `channelId`, papel ou identidade enviados pelo cliente sem
consultar o banco.

## Modelo de dados

### `profiles`

- `id uuid primary key references auth.users`
- `display_name text not null`
- `avatar_url text null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

### `communities`

- `id uuid primary key`
- `owner_id uuid not null references profiles`
- `name text not null`
- `slug text not null unique`
- `visibility community_visibility not null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

`community_visibility`: `public | private`.

### `community_members`

- `community_id uuid references communities`
- `user_id uuid references profiles`
- `role community_role not null`
- `joined_at timestamptz not null`
- primary key `(community_id, user_id)`

`community_role`: `owner | admin | member`. Deve existir exatamente um owner
por comunidade.

### `channels`

- `id uuid primary key`
- `community_id uuid not null references communities`
- `name text not null`
- `type channel_type not null`
- `position integer not null`
- `companion_text_channel_id uuid null references channels`
- `created_by uuid not null references profiles`
- `created_at timestamptz not null`
- unique `(community_id, type, name)`

`channel_type`: `text | voice`. Toda comunidade nasce transacionalmente com os
canais de texto `geral` e de voz `Geral`. Cada canal de voz recebe um canal de
texto companion e guarda sua referência em `companion_text_channel_id`.

### `messages`

- `id uuid primary key`
- `channel_id uuid not null references channels`
- `author_id uuid not null references profiles`
- `content text not null`
- `created_at timestamptz not null`
- `edited_at timestamptz null`
- `deleted_at timestamptz null`

Somente canais `text` aceitam mensagens persistentes. O chat associado a um
canal de voz usa exclusivamente seu `companion_text_channel_id`.

### `invites`

- `id uuid primary key`
- `community_id uuid not null references communities`
- `created_by uuid not null references profiles`
- `token_hash text not null unique`
- `expires_at timestamptz null`
- `max_uses integer null`
- `use_count integer not null default 0`
- `revoked_at timestamptz null`
- `created_at timestamptz not null`

O token bruto aparece apenas no link devolvido no momento da criação. O banco
armazena SHA-256; consumo usa transação para impedir ultrapassar `max_uses`.

## Autorização

- Usuários autenticados podem listar comunidades públicas.
- Membros podem ler sua comunidade privada, canais, membros e mensagens.
- Membros podem publicar mensagens e entrar em canais de voz da comunidade.
- Owner e admin podem criar, renomear, ordenar e excluir canais.
- Apenas owner pode alterar papéis, transferir propriedade ou excluir a
  comunidade.
- Convites podem ser criados/revogados por owner e admin.
- Usuário não membro entra em comunidade privada apenas por convite válido.
- O servidor verifica associação antes de emitir token LiveKit.
- A room key LiveKit é derivada no servidor de `communityId:voiceChannelId`;
  o cliente nunca fornece uma room key arbitrária.

Todas as tabelas terão RLS habilitado. Funções `security definer` serão
mínimas, com `search_path` fixo e grants explícitos.

## Auth

- E-mail/senha inclui cadastro, login, logout, restauração de sessão e feedback
  de erro.
- Perfil é criado por trigger idempotente após `auth.users`.
- Google usa Authorization Code/PKCE pelo Supabase.
- Google OAuth ficará implementado, mas sua validação real depende de
  `client_id`, `client_secret` e redirect URLs configurados fora do código.
- Rotas autenticadas não renderizam dados protegidos antes da sessão ser
  resolvida.

## APIs

### Públicas/autenticadas

- `GET /api/communities`
- `POST /api/communities`
- `GET /api/communities/:id`
- `POST /api/communities/:id/channels`
- `PATCH /api/channels/:id`
- `DELETE /api/channels/:id`
- `POST /api/communities/:id/invites`
- `DELETE /api/invites/:id`
- `POST /api/invites/:token/accept`
- `POST /api/livekit/token`

Entradas serão validadas em runtime. Erros esperados usam payload discriminado:

```ts
type ApiResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code:
          | "UNAUTHENTICATED"
          | "FORBIDDEN"
          | "NOT_FOUND"
          | "VALIDATION"
          | "CONFLICT"
          | "RATE_LIMITED";
        message: string;
      };
    };
```

Sem stack traces, tokens, e-mails ou PII nos logs de produção.

## Chat persistente

- Mensagens são gravadas diretamente no Supabase sob RLS.
- A lista inicial usa paginação cursor-based por `(created_at, id)`.
- Realtime adiciona mensagens posteriores; deduplicação usa `message.id`.
- Envio otimista possui estado `sending | sent | failed`.
- Falha permite tentar novamente sem gerar mensagem duplicada.
- Conteúdo mantém o limite atual de 500 caracteres e é renderizado como texto.
- O cliente não usa HTML fornecido pelo usuário.

`useChat` deixa de depender de LiveKit e passa a receber `textChannelId`.

## Navegação e layout

O app ocupa `100dvw × 100dvh`, sem `max-width`, margem externa ou moldura
central.

```text
┌────────┬────────────────┬─────────────────────────┬──────────────┐
│ marcas │ comunidade e  │ texto ou palco de voz  │ membros/chat │
│        │ canais        │                         │ recolhível   │
└────────┴────────────────┴─────────────────────────┴──────────────┘
```

- Rail: comunidades, Explorar e Criar comunidade.
- Sidebar: comunidade selecionada, canais de texto e voz.
- Centro: chat completo para texto; participantes/mídia para voz.
- Direita: membros; no canal de voz pode mostrar chat companion.
- `activeVoiceChannelId` é independente de `activeTextChannelId`.
- O usuário pode continuar em voz enquanto navega por chats.
- Em mobile, rail/sidebar usam drawer; painel direito usa drawer separado.

Criação de comunidade/canal usa dialogs acessíveis, com validação de nome,
visibilidade e tipo. Dados visíveis sempre vêm do banco ou LiveKit.

## Chat recolhível

- Em canal de voz, chat inicia fechado.
- A escolha é persistida em `localStorage` por dispositivo.
- Botão mostra label, estado expandido e contador de mensagens não lidas.
- `aria-expanded` e `aria-controls` vinculam controle e painel.
- Ao abrir, o foco vai para o heading; ao fechar, retorna ao botão.
- Em canal de texto, o chat é conteúdo principal e não pode ser recolhido.

## Áudio remoto

O attach global em `useRoom` será removido.

- Cada microphone track remoto monta um `<audio>` dedicado.
- Volume individual: `0..1`, padrão `1`.
- Mute individual não altera publicação nem estado dos outros usuários.
- Preferências são indexadas por identidade LiveKit e armazenadas localmente.
- Screen share audio usa elemento separado dentro do player de transmissão.
- Tracks são anexadas/desanexadas no lifecycle do componente.
- Reconexão reaplica volume e mute sem criar elementos duplicados.

## Player de transmissão

- Vídeo responsivo com nome de quem transmite.
- Botão fullscreen usa `requestFullscreen()` no container.
- `fullscreenchange` sincroniza estado e label.
- Slider de volume usa `min=0`, `max=100`, step `1`.
- Botão mute preserva o último volume diferente de zero.
- Estado “Esta transmissão não contém áudio” aparece quando não há
  ScreenShareAudio.
- Escape sai do fullscreen pelo comportamento nativo.
- Falhas retornam mensagem clara e não quebram a transmissão.

## SoundEngine

Um singleton local usa Web Audio API, sem dependências ou arquivos externos.

- `unlock()` ocorre após ação explícita do usuário.
- `play("selfJoin" | "selfLeave" | "participantJoin" |
  "participantLeave" | "screenShareStart")`.
- Tons têm duração máxima de 400 ms e gain limitado para evitar picos.
- Volume de efeitos e mute são persistidos localmente.
- Participantes presentes no primeiro snapshot não disparam sons de entrada.
- Reconexões são deduplicadas por identidade e janela temporal.
- A ação local não toca novamente ao receber o evento remoto correspondente.
- Se Web Audio não estiver disponível, a operação é no-op.

## Estados e erros

- Auth: carregando, credencial inválida, e-mail já usado e OAuth indisponível.
- Comunidade: carregando, vazia, privada, convite inválido/expirado/revogado.
- Canal: removido durante uso, sem permissão ou conflito de nome.
- Chat: carregando histórico, offline, falha de envio e retry.
- LiveKit: conectando, reconectando, permissão de microfone/câmera e falha de
  fullscreen.
- Supabase indisponível não deve desconectar uma chamada LiveKit já ativa.

## Rate limiting

- Cadastro/login: responsabilidade primária do Supabase Auth.
- Comunidades: limite por usuário e janela.
- Canais: limite por comunidade/usuário.
- Mensagens: limite por usuário/canal.
- Convites: limite por comunidade/usuário.
- Tokens LiveKit: limite por usuário/canal/IP.

Respostas usam `429` e não revelam se recursos privados existem.

## Supabase local

- Migrations e seed ficam versionados em `supabase/`.
- Desenvolvimento usa Supabase CLI/Docker.
- Frontend recebe apenas URL local e publishable/anon key.
- Backend recebe URL e secret/service role por ambiente.
- `.env` não será sobrescrito ou commitado.
- Tipos TypeScript são gerados após migrations.
- Nenhum projeto remoto é criado nesta fase.

## Dependências

A única dependência de runtime prevista é o SDK oficial
`@supabase/supabase-js`, após verificação de versão, vulnerabilidades, tipos,
licença e compatibilidade. APIs nativas cobrem fullscreen, Web Audio e volume.

## Testes

- Parser/validação de nomes de comunidade, canal e mensagem.
- Policies RLS por papel e visibilidade.
- Criação transacional de comunidade e canais padrão.
- Convite válido, expirado, revogado e esgotado.
- Autorização do token LiveKit.
- Paginação, deduplicação e retry de mensagens.
- SoundEngine: unlock, mute, volume e deduplicação.
- Áudio por participante: attach, volume, mute e cleanup.
- Player: fullscreen, slider, mute e ausência de áudio.
- Browser: Auth, criação, convite, canais, voz, chat e drawers.
- Viewports: 360, 768, 1280 e 1440 px.

## Critérios de aceite

- App ocupa todo o viewport sem margem externa.
- Usuário cria conta por e-mail/senha e mantém sessão.
- Fluxo Google está implementado e aguarda credenciais externas para validação.
- Usuário cria comunidade pública/privada e canais text/voice.
- Papéis e RLS impedem operações não autorizadas.
- Mensagens persistem após reload e usam Realtime.
- Usuário permanece no canal de voz ao navegar em texto.
- Chat de voz expande/recolhe e lembra preferência.
- Entrada, saída e início de transmissão produzem sons discretos configuráveis.
- Screen share abre em fullscreen e possui volume/mute.
- Cada participante remoto possui volume/mute local.
- Build, testes e browser QA passam sem erros novos.

## Migração

As quatro salas atuais não permanecem hardcoded no runtime. O seed local cria
uma comunidade pública “Salas” com canais equivalentes, usando IDs UUID. O
frontend passa a consumir dados persistidos. A migração não inventa membros,
mensagens ou atividade.

## Fora do escopo

- Projeto Supabase remoto e deploy das migrations.
- Credenciais Google OAuth ou sua validação real.
- Upload de arquivos, imagens, GIFs, reactions, threads e busca de mensagens.
- Bots, webhooks, screen recording, streaming externo e moderação automática.
- Criptografia ponta a ponta adicional à fornecida pelos transportes.
