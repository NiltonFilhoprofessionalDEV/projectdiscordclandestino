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

## Testes

```
npm test
```

Áudio/vídeo de verdade exige dois navegadores e as credenciais do LiveKit.
