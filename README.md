# Salas de voz

App simples para você e seus amigos: escolhe um nome, clica numa sala, conversa.

Não há cadastro. O nome fica só no navegador.

## Stack

- Frontend: React + Vite + Tailwind
- Mídia: LiveKit Cloud (SFU / WebRTC)
- Backend: Hono — lista de salas, ocupação e JWT temporário

## Setup

1. Crie um projeto em [LiveKit Cloud](https://cloud.livekit.io).
2. Copie `server/.env.example` para `server/.env` e preencha:

```
LIVEKIT_URL=wss://seu-projeto.livekit.cloud
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
APP_ORIGIN=http://localhost:5173
PORT=8787
```

As chaves **nunca** vão no frontend.

3. Instale e rode (dois terminais, no Windows):

```
npm install
npm run dev:server
npm run dev:web
```

Abra `http://localhost:5173`.

## Deploy na Vercel

O erro `FUNCTION_INVOCATION_FAILED` na página inteira acontece se a Vercel sobe o servidor Node em vez do HTML.

Em **Settings → Build and Deployment** (não é a aba General):

| Campo | Valor |
| --- | --- |
| Framework Preset | **Other** |
| Root Directory | **vazio** — se estiver `server` ou `web`, apague |
| Build Command | deixe o do `vercel.json` (ou `npm run build -w @voice/web && node scripts/copy-dist.mjs`) |
| Output Directory | `dist` |

Se o projeto se chama `…-server`, a Vercel está tratando como API. O Root Directory não pode ser a pasta `server`.

Em **Settings → Environment Variables** (Production e Preview):

```
LIVEKIT_URL=wss://seu-projeto.livekit.cloud
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
APP_ORIGIN=https://seu-app.vercel.app
```

Salve e faça **Redeploy** (Deployments → ⋯ → Redeploy). Sem as variáveis do LiveKit o site abre, mas a sala não conecta.

## Testes

```
npm test
```

Áudio/vídeo de verdade exige dois navegadores e as credenciais do LiveKit.
