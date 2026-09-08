# Salas — Command Lounge

## Objetivo

Reformular a identidade visual do Salas como um produto social de voz premium
para comunidades pequenas. A interface deve tornar simples descobrir uma sala,
entender quem está presente e conversar, sem alterar o backend, os contratos de
LiveKit ou os fluxos existentes.

## Direção

O conceito combina a estrutura social da primeira referência com a disciplina
visual e os widgets sólidos da segunda. O resultado é chamado **Command
Lounge**: uma central noturna, compacta e acolhedora, com detalhes que remetem
a áudio e presença.

O azul-marinho é a superfície dominante. Violeta indica descoberta e
identidade; coral indica presença, chamadas e ações importantes. Glows aparecem
apenas em elementos ativos.

## Design system

### Cores

- `Night #171B3A`: fundo do app.
- `Abyss #10142E`: áreas profundas, inputs e mídia sem vídeo.
- `Deck #20264C`: painéis, cards e navegação.
- `Electric #5D7CFF`: foco, conexão e controles primários.
- `Pulse #8A4DFF`: descoberta, marca e gradientes.
- `Coral #FF5D73`: presença ao vivo, alertas e encerrar chamada.
- `Cloud #F4F6FF`: texto principal.
- `Haze #9BA5CA`: texto secundário.

O contraste mínimo deve atender WCAG AA. Transparências nunca substituem uma
cor-base legível.

### Tipografia

- **Syne 700**: marca, títulos de tela e números de destaque.
- **Figtree 400/500/600**: interface, mensagens, rótulos e dados.
- Títulos usam espaçamento compacto; labels utilitários usam Figtree 600, não
  caixa alta com tracking excessivo.

### Forma e profundidade

- Radius de 18–24 px em painéis; 12–16 px em controles internos.
- Bordas claras de baixa opacidade para separar superfícies próximas.
- Sombras azuladas e curtas; glow reservado para foco, fala e sala ativa.
- Glassmorphism apenas na barra superior e controles flutuantes. Cards e
  sidebars usam superfícies sólidas para melhorar legibilidade e performance.

## Estrutura

```text
┌──────┬────────────┬────────────────────────┬──────────────┐
│ rail │ navegação  │ palco / descoberta     │ presença     │
│      │ contextual │                        │ e atividade  │
│      │            │                        │              │
│ user │ identidade │ controles da chamada  │ chat/sala    │
└──────┴────────────┴────────────────────────┴──────────────┘
```

- **Rail:** marca, atalhos de salas e identidade compacta do usuário.
- **Navegação:** Explorar, lista de salas, ocupação e edição do nome.
- **Palco:** conteúdo de descoberta ou mídia da sala ativa.
- **Painel direito:** identidade, participantes/atividade e chat quando houver
  espaço.
- **Mobile:** rail e navegação tornam-se drawer; o painel direito é incorporado
  ao fluxo; controles permanecem fixos e acessíveis.

## Elemento de assinatura

Uma **pulse line** atravessa discretamente o shell e termina no indicador do
usuário. Ela remete a uma forma de onda e muda de intensidade quando há uma sala
ativa. Em `prefers-reduced-motion`, permanece estática.

Esse é o único gesto visual expressivo persistente. Outros efeitos devem ser
funcionais, evitando uma interface coberta por glows.

## Superfícies

### Entrada

- Marca Salas e uma frase curta orientada à ação.
- Campo de nome e CTA primário claramente agrupados.
- Preview abstrato do pulse line no fundo, sem imagens genéricas.
- Erro de validação permanece próximo ao campo.

### Explorar

- Barra superior compacta com busca.
- Hero editorial menor que o atual, deixando salas visíveis no primeiro
  viewport.
- Cards de sala com identidade visual própria derivada da categoria, status de
  ocupação e ação explícita “Entrar”.
- Seções: “Ao vivo agora” e “Todas as salas”; sem conteúdo fictício.
- Estado vazio explica como limpar ou alterar a busca.

### Sala ativa

- Nome, status de conexão e ocupação no topo.
- Mídia ocupa o palco; ausência de vídeo apresenta um estado de conversa, não
  uma área vazia.
- Participantes e chat compartilham o painel direito em desktop.
- Barra de chamada usa Electric para controles ativos e Coral para encerrar.
- Estado de fala usa pulse visível sem depender apenas da cor.

### Dispositivos

- Modal sólido sobre backdrop escuro.
- Labels, selects e foco com contraste consistente.
- Fechar permanece ação secundária; não usa a mesma ênfase de entrar na sala.

## Conteúdo

O texto deve ser direto e orientado à tarefa:

- “Encontre sua próxima conversa.”
- “Entre na sala.”
- “Ninguém entrou ainda. Comece a conversa.”
- “Nenhuma sala encontrada. Limpe a busca ou tente outro nome.”

Não serão adicionados moderadores, estatísticas ou usuários fictícios. Dados
visíveis vêm exclusivamente dos hooks atuais.

## Componentes e limites

- Tokens globais e utilitários visuais em `web/src/index.css`.
- Shell dividido entre rail, navegação, palco e painel direito.
- `ExploreView` concentra busca, hero e coleções de salas.
- Componentes de chat, participantes, mídia e controles mantêm suas interfaces.
- `Home` apenas compõe estado e superfícies; lógica de LiveKit não muda.
- Arquivos com lógica devem permanecer abaixo de 300 linhas e funções abaixo
  de 50 linhas.

## Estados e acessibilidade

- Estados de carregamento, erro, vazio, conexão e reconexão permanecem visíveis.
- Foco de teclado usa Electric com offset perceptível.
- Botões apenas com ícone mantêm `aria-label` e `title`.
- Áreas interativas têm pelo menos 44 px.
- Movimento respeita `prefers-reduced-motion`.
- Layout deve funcionar em 360 px, 768 px, 1280 px e 1440 px.

## Verificação

- Executar o build TypeScript/Vite.
- Verificar entrada, Explore, busca, entrada e saída de sala, chat, controles e
  modal de dispositivos.
- Inspecionar desktop e mobile no browser.
- Confirmar ausência de regressões de console, exceto recursos externos já
  conhecidos.
- Validar contraste, foco, clipping, overflow e redução de movimento.

## Fora do escopo

- Alterações no servidor, API ou LiveKit.
- Novas salas ou persistência.
- Avatares reais, uploads ou conteúdo gerado.
- Moderadores, ranking, gamificação ou métricas fictícias.
- Mudança do nome “Salas”.
