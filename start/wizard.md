# Wizard di Onboarding - OpenClaw

Il wizard di onboarding è il modo consigliato per configurare OpenClaw su macOS,
Linux o Windows (via WSL2; fortemente consigliato).
Configura un Gateway locale o una connessione Gateway remoto, più canali, skill,
e impostazioni predefinite del workspace in un flusso guidato.

**Punto di ingresso principale:**
```bash
openclaw onboard
```

**Prima chat più veloce:** apri la Control UI (nessuna configurazione canale necessaria). Esegui
```bash
openclaw dashboard
```
e chatta nel browser. Documentazione: [Dashboard](/web/dashboard).

**Riconfigurazione successiva:**
```bash
openclaw configure
```

**Consigliato:** configura una chiave API Brave Search così l'agente può usare web_search
(web_fetch funziona senza chiave). Percorso più facile: 
```bash
openclaw configure --section web
```
che memorizza tools.web.search.apiKey. Documentazione: [Strumenti web](/tools/web).

## QuickStart vs Avanzato

Il wizard inizia con QuickStart (predefiniti) vs Avanzato (controllo completo).
QuickStart mantiene i predefiniti:

- Gateway locale (loopback)

- Workspace predefinito (o workspace esistente)

- Porta Gateway 18789

- Token auth Gateway (auto-generato, anche su loopback)

- Esposizione Tailscale Off

- DM Telegram + WhatsApp predefinito su allowlist (ti verrà chiesto il tuo numero di telefono)

Avanzato espone ogni passaggio (modalità, workspace, gateway, canali, demone, skill).

## Cosa fa il wizard

**Modalità locale (predefinito)** ti guida attraverso:

- Modello/auth (Sottoscrizione OpenAI Code (Codex) OAuth, chiave API Anthropic (consigliata) o setup-token (incolla), più opzioni MiniMax/GLM/Moonshot/AI Gateway)

- Posizione workspace + file bootstrap

- Impostazioni Gateway (porta/bind/auth/tailscale)

- Provider (Telegram, WhatsApp, Discord, Google Chat, Mattermost (plugin), Signal)

- Installazione demone (LaunchAgent / unità utente systemd)

- Controllo salute

- Skill (consigliate)

**Modalità remota** configura solo il client locale per connettersi a un Gateway altrove.
Non esegue installazioni o modifiche remote sul host remoto.

Per aggiungere più agenti isolati (workspace + sessioni + auth separati), usa:
```bash
openclaw agents add <nome>
```

**Suggerimento:** --json non implica modalità non-interattiva. Usa --non-interactive (e --workspace) per script.

## Dettagli flusso (locale)

### Rilevamento configurazione esistente

Se ~/.openclaw/openclaw.json esiste, scegli Mantieni / Modifica / Resetta.

- Rieseguire il wizard non cancella nulla a meno che tu non scelga esplicitamente Reset
(o passi --reset).

- Se la configurazione è invalida o contiene chiavi legacy, il wizard si ferma e chiede
di eseguire openclaw doctor prima di continuare.

- Reset usa trash (mai rm) e offre ambiti:
  - Solo configurazione
  - Configurazione + credenziali + sessioni
  - Reset completo (rimuove anche workspace)

### Modello/Auth

**Chiave API Anthropic (consigliata):** usa ANTHROPIC_API_KEY se presente o chiede una chiave, poi la salva per uso demone.

**OAuth Anthropic (CLI Claude Code):** su macOS il wizard controlla elemento Portachiavi "Claude Code-credentials" (scegli "Consenti Sempre" così gli avvii launchd non bloccano); su Linux/Windows riutilizza ~/.claude/.credentials.json se presente.

**Token Anthropic (incolla setup-token):** esegui claude setup-token su qualsiasi macchina, poi incolla il token (puoi nominarlo; vuoto = predefinito).

**Sottoscrizione OpenAI Code (Codex) (Codex CLI):** se ~/.codex/auth.json esiste, il wizard può riutilizzarlo.

**Sottoscrizione OpenAI Code (Codex) (OAuth):** flusso browser; incolla il codice#stato.

Imposta agents.defaults.model su openai-codex/gpt-5.2 quando il modello è non impostato o openai/*.

**Chiave API OpenAI:** usa OPENAI_API_KEY se presente o chiede una chiave, poi la salva in ~/.openclaw/.env così launchd può leggerla.

**Zen OpenCode (proxy multi-modello):** chiede OPENCODE_API_KEY (o OPENCODE_ZEN_API_KEY, ottienilo su [https://opencode.ai/auth](https://opencode.ai/auth)).

**Chiave API:** memorizza la chiave per te.

**Gateway AI Vercel (proxy multi-modello):** chiede AI_GATEWAY_API_KEY.

Più dettagli: [Gateway AI Vercel](/providers/vercel-ai-gateway)

**MiniMax M2.1:** la configurazione viene scritta automaticamente.

Più dettagli: [MiniMax](/providers/minimax)

**Sintetico (compatibile Anthropic):** chiede SYNTHETIC_API_KEY.

Più dettagli: [Sintetico](/providers/synthetic)

**Moonshot (Kimi K2):** la configurazione viene scritta automaticamente.

**Kimi Coding:** la configurazione viene scritta automaticamente.

Più dettagli: [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)

**Salta:** nessun auth configurato ancora.

Scegli un modello predefinito dalle opzioni rilevate (o inserisci provider/modello manualmente).

Il wizard esegue un controllo modello e avvisa se il modello configurato è sconosciuto o manca auth.

Le credenziali OAuth vivono in ~/.openclaw/credentials/oauth.json; i profili auth vivono in ~/.openclaw/agents//agent/auth-profiles.json (chiavi API + OAuth).

Più dettagli: [/concetti/oauth](/concetti/oauth)

### Workspace

Predefinito ~/.openclaw/workspace (configurabile).

- Seminar i file workspace necessari per il rituale bootstrap dell'agente.

- Guida layout workspace completo + backup: [Workspace agente](/concetti/agent-workspace)

### Gateway

Porta, bind, modalità auth, esposizione tailscale.

**Raccomandazione auth:** mantieni Token anche per loopback così i client WS locali devono autenticarsi.

**Disabilita auth solo se ti fidi completamente di ogni processo locale.**

**I bind non-loopback richiedono ancora auth.**

### Canali

[WhatsApp](/canali/whatsapp): login QR opzionale.

[Telegram](/canali/telegram): token bot.

[Discord](/canali/discord): token bot.

[Google Chat](/canali/googlechat): JSON service account + pubblico webhook.

[Mattermost](/canali/mattermost) (plugin): token bot + URL base.

[Signal](/canali/signal): installazione signal-cli opzionale + config account.

[iMessage](/canali/imessage): percorso imsg CLI locale + accesso DB.

**Sicurezza DM:** predefinito è pairing. Primo DM invia un codice; approva via openclaw pairing approve o usa allowlist.

### Installazione demone

**macOS: LaunchAgent**

Richiede una sessione utente con login; per headless, usa un LaunchDaemon personalizzato (non fornito).

**Linux (e Windows via WSL2): unità utente systemd**

Il wizard tenta di abilitare il lingering via loginctl enable-linger così il Gateway rimane attivo dopo il logout.

- Può chiedere sudo (scrive /var/lib/systemd/linger); prova prima senza sudo.

**Selezione runtime:** Node (consigliato; richiesto per WhatsApp/Telegram). Bun non è consigliato.

### Controllo salute

Avvia il Gateway (se necessario) ed esegue openclaw health.

**Suggerimento:** openclaw status --deep aggiunge sonde salute gateway all'output stato (richiede un gateway raggiungibile).

### Skill (consigliate)

Legge le skill disponibili e controlla i requisiti.

- Ti permette di scegliere un gestore nodi: npm / pnpm (bun non consigliato).

- Installa dipendenze opzionali (alcuni usano Homebrew su macOS).

### Fine

Riepilogo + prossimi passi, incluse app iOS/Android/macOS per funzionalità extra.

- Se non viene rilevata alcuna GUI, il wizard stampa istruzioni port-forward SSH per la Control UI invece di aprire un browser.

- Se mancano asset Control UI, il wizard tenta di costruirli; fallback è pnpm ui:build (installa automaticamente dipendenze UI).

## Modalità remota

La modalità remota configura un client locale per connettersi a un Gateway altrove.
Ciò che configurerai:

- URL Gateway remoto (ws://...)

- Token se il Gateway remoto richiede auth (consigliato)

**Note:**

- Nessuna installazione remota o modifica demone vengono eseguite.

- Se il Gateway è solo-loopback, usa tunnel SSH o tailnet.

**Suggerimenti scoperta:**

- macOS: Bonjour (dns-sd)
- Linux: Avahi (avahi-browse)

## Aggiungi un altro agente

Usa openclaw agents add <nome> per creare un agente separato con proprio workspace,
sessioni, e profili auth. Eseguire senza --workspace lancia il wizard.
Ciò che configura:

- agents.list[].name

- agents.list[].workspace

- agents.list[].agentDir

**Note:**

- I workspace predefiniti seguono ~/.openclaw/workspace-.

- Aggiungi binding per indirizzare messaggi in entrata (il wizard può farlo).

- Flag non-interattivi: --model, --agent-dir, --bind, --non-interactive.

## Modalità non-interattiva

Usa --non-interactive per automatizzare o scriptare l'onboarding:

```bash
openclaw onboard --non-interactive \
 --mode local \
 --auth-choice apiKey \
 --anthropic-api-key "$ANTHROPIC_API_KEY" \
 --gateway-port 18789 \
 --gateway-bind loopback \
 --install-daemon \
 --daemon-runtime node \
 --skip-skills
```

Aggiungi --json per un riepilogo leggibile da macchina.

**Esempio Gemini:**
```bash
openclaw onboard --non-interactive \
 --auth-choice gemini-api-key \
 --gemini-api-key "$GEMINI_API_KEY" \
 --gateway-port 18789 \
 --gateway-bind loopback
```

**Esempio Z.AI:**
```bash
openclaw onboard --non-interactive \
 --auth-choice zai-api-key \
 --zai-api-key "$ZAI_API_KEY" \
 --gateway-port 18789 \
 --gateway-bind loopback
```

**Esempio Gateway AI Vercel:**
```bash
openclaw onboard --non-interactive \
 --auth-choice ai-gateway-api-key \
 --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
 --gateway-port 18789 \
 --gateway-bind loopback
```

**Esempio Moonshot:**
```bash
openclaw onboard --non-interactive \
 --auth-choice moonshot-api-key \
 --moonshot-api-key "$MOONSHOT_API_KEY" \
 --gateway-port 18789 \
 --gateway-bind loopback
```

**Esempio Sintetico:**
```bash
openclaw onboard --non-interactive \
 --auth-choice synthetic-api-key \
 --synthetic-api-key "$SYNTHETIC_API_KEY" \
 --gateway-port 18789 \
 --gateway-bind loopback
```

**Esempio OpenCode Zen:**
```bash
openclaw onboard --non-interactive \
 --auth-choice opencode-zen \
 --opencode-zen-api-key "$OPENCODE_API_KEY" \
 --gateway-port 18789 \
 --gateway-bind loopback
```

**Esempio aggiunta agente (non-interattivo):**
```bash
openclaw agents add work \
 --workspace ~/.openclaw/workspace-work \
 --model openai/gpt-5.2 \
 --bind whatsapp:biz \
 --non-interactive \
 --json
```

## RPC wizard Gateway

Il Gateway espone il flusso wizard su RPC (wizard.start, wizard.next, wizard.cancel, wizard.status).
I client (app macOS, Control UI) possono renderizzare passaggi senza reimplementare la logica di onboarding.

## Configurazione Signal (signal-cli)

Il wizard può installare signal-cli dai rilasci GitHub:

- Scarica l'asset di rilascio appropriato.

- Lo memorizza sotto ~/.openclaw/tools/signal-cli//.

- Scrive channels.signal.cliPath alla tua config.

**Note:**

- Le build JVM richiedono Java 21.

- Le build native vengono usate quando disponibili.

- Windows usa WSL2; l'installazione signal-cli segue il flusso Linux dentro WSL.

## Cosa scrive il wizard

Campi tipici in ~/.openclaw/openclaw.json:

- agents.defaults.workspace

- agents.defaults.model / models.providers (se scelto Minimax)

- gateway.* (modalità, bind, auth, tailscale)

- channels.telegram.botToken, channels.discord.token, channels.signal.*, channels.imessage.*

- Allowlist canali (Slack/Discord/Matrix/Microsoft Teams) quando accetti durante i prompt (i nomi si risolvono in ID quando possibile).

- skills.install.nodeManager

- wizard.lastRunAt

- wizard.lastRunVersion

- wizard.lastRunCommit

- wizard.lastRunCommand

- wizard.lastRunMode

openclaw agents add scrive agents.list[] e binding opzionali.
Le credenziali WhatsApp vanno sotto ~/.openclaw/credentials/whatsapp/<accountId>/.
Le sessioni sono memorizzate sotto ~/.openclaw/agents/<agentId>/sessions/.
Alcuni canali vengono forniti come plugin. Quando ne scegli uno durante l'onboarding, il wizard
ti chiederà di installarlo (npm o percorso locale) prima che possa essere configurato.

- Onboarding app macOS: [Onboarding](/start/onboarding)

- Riferimento config: [Configurazione gateway](/gateway/configuration)

- Provider: [WhatsApp](/canali/whatsapp), [Telegram](/canali/telegram), [Discord](/canali/discord), [Google Chat](/canali/googlechat), [Signal](/canali/signal), [iMessage](/canali/imessage)

- Skill: [Skill](/tools/skills), [Config skill](/tools/skills-config)