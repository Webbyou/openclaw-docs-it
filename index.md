# OpenClaw - Documentazione Italiana

"ESFOLIATI! ESFOLIATI!" — Un'aragosta spaziale, probabilmente

Un gateway OS + WhatsApp/Telegram/Discord/iMessage per agenti AI (Pi).

I plugin aggiungono Mattermost e altro.
Invia un messaggio, ricevi una risposta dell'agente — dalla tua tasca.

[GitHub](https://github.com/openclaw/openclaw) ·
[Rilasci](https://github.com/openclaw/openclaw/releases) ·
[Documentazione](/) ·
[Configurazione assistente OpenClaw](/start/openclaw)

OpenClaw collega WhatsApp (via WhatsApp Web / Baileys), Telegram (Bot API / grammY), Discord (Bot API / channels.discord.js) e iMessage (imsg CLI) ad agenti di codifica come [Pi](https://github.com/badlogic/pi-mono). I plugin aggiungono Mattermost (Bot API + WebSocket) e altro.
OpenClaw alimenta anche l'assistente OpenClaw.

## Inizia qui

- Nuova installazione da zero: [Per Iniziare](/start/getting-started)

- Configurazione guidata (consigliata): [Wizard](/start/wizard) (openclaw onboard)

- Apri il dashboard (Gateway locale): [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (o [http://localhost:18789/](http://localhost:18789/))

Se il Gateway è in esecuzione sullo stesso computer, quel link apre immediatamente la UI di controllo del browser. Se fallisce, avvia prima il Gateway: openclaw gateway.

## Dashboard (browser Control UI)

Il dashboard è la UI di controllo del browser per chat, configurazione, nodi, sessioni e altro.
Predefinito locale: [http://127.0.0.1:18789/](http://127.0.0.1:18789/)
Accesso remoto: [Superfici web](/web) e [Tailscale](/gateway/tailscale)

## Come funziona

WhatsApp / Telegram / Discord / iMessage (+ plugin)
 │
 ▼
 ┌───────────────────────────┐
 │ Gateway │ ws://127.0.0.1:18789 (solo loopback)
 │ (sorgente singola) │
 │ │ http://<gateway-host>:18793
 │ │ /__openclaw__/canvas/ (host Canvas)
 └───────────┬───────────────┘
 │
 ├─ Agente Pi (RPC)
 ├─ CLI (openclaw …)
 ├─ UI Chat (SwiftUI)
 ├─ App macOS (OpenClaw.app)
 ├─ Nodo iOS via Gateway WS + pairing
 └─ Nodo Android via Gateway WS + pairing

La maggior parte delle operazioni fluisce attraverso il Gateway (openclaw gateway), un singolo processo a lungo termine che possiede le connessioni dei canali e il piano di controllo WebSocket.

## Modello di rete

- Un Gateway per host (consigliato): è l'unico processo autorizzato a possedere la sessione WhatsApp Web. Se hai bisogno di un bot di soccorso o isolamento stretto, esegui più gateway con profili e porte isolati; vedi [Gateway multipli](/gateway/multiple-gateways).

- Loopback-first: Gateway WS predefinito su ws://127.0.0.1:18789.

Ora la procedura guidata genera un token gateway per impostazione predefinita (anche per loopback).

- Per l'accesso Tailnet, esegui openclaw gateway --bind tailnet --token ... (il token è richiesto per bind non-loopback).

- Nodi: connettiti al Gateway WebSocket (LAN/tailnet/SSH secondo necessità); il bridge TCP legacy è deprecato/rimosso.

- Host Canvas: server file HTTP su canvasHost.port (predefinito 18793), servendo /__openclaw__/canvas/ per WebView dei nodi; vedi [Configurazione gateway](/gateway/configuration) (canvasHost).

- Uso remoto: tunnel SSH o tailnet/VPN; vedi [Accesso remoto](/gateway/remote) e [Scoperta](/gateway/discovery).

## Caratteristiche (alto livello)

- 📱 Integrazione WhatsApp — Usa Baileys per il protocollo WhatsApp Web

- ✈️ Bot Telegram — DM + gruppi via grammY

- 🎮 Bot Discord — DM + canali gilda via channels.discord.js

- 🧩 Bot Mattermost (plugin) — Token bot + eventi WebSocket

- 💬 iMessage — Integrazione locale imsg CLI (macOS)

- 🤖 Ponte agente — Pi (modalità RPC) con streaming strumenti

- ⏱️ Streaming + chunking — Streaming blocchi + dettagli streaming bozza Telegram ([/concetti/streaming](/concetti/streaming))

- 🧠 Routing multi-agente — Indirizza account/fornitori peer ad agenti isolati (workspace + sessioni per agente)

- 🔐 Auth sottoscrizione — Anthropic (Claude Pro/Max) + OpenAI (ChatGPT/Codex) via OAuth

- 💬 Sessioni — Chat dirette collassano in main condiviso (predefinito); i gruppi sono isolati

- 👥 Supporto Chat di Gruppo — Basato su menzione per impostazione predefinita; il proprietario può alternare /attivazione sempre|menzione

- 📎 Supporto Media — Invia e ricevi immagini, audio, documenti

- 🎤 Note vocali — Hook di trascrizione opzionale

- 🖥️ WebChat + app macOS — UI locale + companion barra dei menu per operazioni e risveglio vocale

- 📱 Nodo iOS — Si abbina come nodo ed espone una superficie Canvas

- 📱 Nodo Android — Si abbina come nodo ed espone Canvas + Chat + Fotocamera

Nota: i percorsi legacy Claude/Codex/Gemini/Opencode sono stati rimossi; Pi è l'unico percorso agente-codifica.

## Configurazione (opzionale)

La configurazione risiede in ~/.openclaw/openclaw.json.

- Se non fai nulla, OpenClaw usa il binario Pi incluso in modalità RPC con sessioni per-mittente.

- Se vuoi bloccarlo, inizia con channels.whatsapp.allowFrom e (per i gruppi) regole di menzione.

Esempio:
```json
{
  canali: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      gruppi: { "*": { requireMention: true } },
    },
  },
  messaggi: { groupChat: { mentionPatterns: ["@openclaw"] } },
}
```

## Documentazione

- Inizia qui:

[Hub documentazione (tutte le pagine collegate)](/start/hubs)

- [Aiuto](/help) ← correzioni comuni + risoluzione problemi

- [Configurazione](/gateway/configuration)

- [Esempi di configurazione](/gateway/configuration-examples)

- [Comandi slash](/tools/slash-commands)

- [Routing multi-agente](/concetti/multi-agente)

- [Aggiornamento / rollback](/install/updating)

- [Pairing (DM + nodi)](/start/pairing)

- [Modalità Nix](/install/nix)

- [Configurazione assistente OpenClaw](/start/openclaw)

- [Skills](/tools/skills)

- [Config skills](/tools/skills-config)

- [Template workspace](/reference/templates/AGENTS)

- [Adattatori RPC](/reference/rpc)

- [Runbook gateway](/gateway)

- [Nodi (iOS/Android)](/nodi)

- [Superfici web (Control UI)](/web)

- [Scoperta + trasporti](/gateway/discovery)

- [Accesso remoto](/gateway/remote)

- Provider e UX:

[WebChat](/web/webchat)

- [Control UI (browser)](/web/control-ui)

- [Telegram](/canali/telegram)

- [Discord](/canali/discord)

- [Mattermost (plugin)](/canali/mattermost)

- [iMessage](/canali/imessage)

- [Gruppi](/concetti/groups)

- [Messaggi gruppo WhatsApp](/concetti/group-messages)

- [Media: immagini](/nodi/images)

- [Media: audio](/nodi/audio)

- App companion:

[App macOS](/piattaforme/macos)

- [App iOS](/piattaforme/ios)

- [App Android](/piattaforme/android)

- [Windows (WSL2)](/piattaforme/windows)

- [App Linux](/piattaforme/linux)

- Ops e sicurezza:

[Sessioni](/concetti/session)

- [Lavori cron](/automation/cron-jobs)

- [Webhooks](/automation/webhook)

- [Hook Gmail (Pub/Sub)](/automation/gmail-pubsub)

- [Sicurezza](/gateway/security)

- [Risoluzione problemi](/gateway/troubleshooting)

## Il nome

OpenClaw = CLAW + TARDIS — perché ogni aragosta spaziale ha bisogno di una macchina del tempo-e-spazio.

"Stiamo tutti solo giocando con i nostri prompt." — un'IA, probabilmente sballata sui token

## Crediti

- Peter Steinberger ([@steipete](https://x.com/steipete)) — Creatore, sussurratore di aragoste

- Mario Zechner ([@badlogicc](https://x.com/badlogicgames)) — Creatore di Pi, pen-tester di sicurezza

- Clawd — L'aragosta spaziale che ha richiesto un nome migliore

## Contributori Principali

- Maxim Vovshin (@Hyaxia, [[email protected]](/cdn-cgi/l/email-protection#c0f3f6f7f4f7f3f1f7eb88b9a1b8a9a180b5b3a5b2b3eeaeafb2a5b0acb9eea7a9b4a8b5a2eea3afad)) — Skill Blogwatcher

- Nacho Iacovino (@nachoiacovino, [[email protected]](/cdn-cgi/l/email-protection#f09e9193989fDE9991939f86999e9eb0979d91999cde939f9d)) — Parsing posizione (Telegram + WhatsApp)

## Licenza

MIT — Libero come un'aragosta nell'oceano 🦞

"Stiamo tutti solo giocando con i nostri prompt." — Un'IA, probabilmente sballata sui token