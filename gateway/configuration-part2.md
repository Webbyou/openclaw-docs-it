# Configurazione Gateway - Parte 2 (Routing Multi-Agente e Configurazioni Avanzate)

## Routing multi-agente (agents.list + bindings)

Esegui agenti isolati multipli (workspace, agentDir, sessioni separati) dentro un Gateway.
I messaggi in entrata vengono indirizzati a un agente via bindings.

### agents.list[]: override per-agente

- **id:** id agente stabile (richiesto)
- **default:** opzionale; quando multipli sono impostati, il primo vince e viene loggato un avviso. Se nessuno è impostato, la prima voce dell'elenco è l'agente predefinito.
- **name:** nome visualizzato per l'agente
- **workspace:** predefinito ~/.openclaw/workspace- (per main, fallback a agents.defaults.workspace)
- **agentDir:** predefinito ~/.openclaw/agents//agent
- **model:** modello predefinito per-agente, sovrascrive agents.defaults.model per quell'agente
  - forma stringa: "provider/model", sovrascrive solo agents.defaults.model.primary
  - forma oggetto: { primary, fallbacks } (i fallback sovrascrivono agents.defaults.model.fallbacks; [] disabilita i fallback globali per quell'agente)
- **identity:** name/theme/emoji per-agente (usato per pattern menzione + reazioni ack)
- **groupChat:** gating-menzione per-agente (mentionPatterns)
- **sandbox:** config sandbox per-agente (sovrascrive agents.defaults.sandbox)
  - mode: "off" | "non-main" | "all"
  - workspaceAccess: "none" | "ro" | "rw"
  - scope: "session" | "agent" | "shared"
  - workspaceRoot: radice workspace sandbox personalizzata
  - docker: override docker per-agente (es. image, network, env, setupCommand, limits; ignorato quando scope: "shared")
  - browser: override browser sandboxed per-agente (ignorato quando scope: "shared")
  - prune: override pruning sandbox per-agente (ignorato quando scope: "shared")
- **subagents:** predefiniti sub-agente per-agente
  - allowAgents: allowlist di id agente per sessions_spawn da questo agente (["*"] = permetti qualsiasi; predefinito: solo stesso agente)
- **tools:** restrizioni strumenti per-agente (applicate prima della policy strumenti sandbox)
  - profile: profilo strumenti base (applicato prima di allow/deny)
  - allow: array di nomi strumenti consentiti
  - deny: array di nomi strumenti negati (deny vince)

### agents.defaults: predefiniti agente condivisi (modello, workspace, sandbox, ecc.)

### bindings[]: indirizza messaggi in entrata a un agenteId

- **match.channel (richiesto)**
- **match.accountId (opzionale; * = qualsiasi account; omesso = account predefinito)**
- **match.peer (opzionale; { kind: dm|group|channel, id })**
- **match.guildId / match.teamId (opzionale; specifico del canale)**

**Ordine di corrispondenza deterministico:**

1. match.peer
2. match.guildId
3. match.teamId
4. match.accountId (esatto, nessun peer/guild/team)
5. match.accountId: "*" (channel-wide, nessun peer/guild/team)
6. agente predefinito (agents.list[].default, poi prima voce elenco, poi "main")

All'interno di ogni livello di corrispondenza, la prima voce corrispondente in bindings vince.

### Profili accesso per-agente (multi-agente)

Ogni agente può portare la propria policy sandbox + strumenti. Usa questo per mixare livelli
di accesso in un gateway:

- Accesso completo (agente personale)
- Strumenti solo lettura + workspace
- Nessun accesso filesystem (solo strumenti messaging/sessione)

Vedi [Sandbox & Strumenti Multi-Agente](/multi-agent-sandbox-tools) per precedenza ed
esempi aggiuntivi.

**Accesso completo (nessuna sandbox):**
```json
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

**Strumenti solo lettura + workspace solo lettura:**
```json
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "ro",
        },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

**Nessun accesso filesystem (abilitati strumenti messaging/sessione):**
```json
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "none",
        },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

**Esempio: due account WhatsApp → due agenti:**
```json
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
  channels: {
    whatsapp: {
      accounts: {
        personal: {},
        biz: {},
      },
    },
  },
}
```

### tools.agentToAgent (opzionale)

La messaggistica agente-ad-agente è opt-in:

```json
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

## Coda messaggi (messages.queue)

Controlla come si comportano i messaggi in entrata quando un'esecuzione agente è già attiva.

```json
{
  messages: {
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog (steer+backlog ok) | interrupt (queue=steer legacy)
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
        discord: "collect",
        imessage: "collect",
        webchat: "collect",
      },
    },
  },
}
```

## Debounce messaggi in entrata (messages.inbound)

Debounce messaggi in entrata rapidi dallo stesso mittente così che messaggi multipli consecutivi
diventino un singolo turno agente. Il debouncing è ambito per canale + conversazione
e usa il messaggio più recente per threading/ID risposta.

```json
{
  messages: {
    inbound: {
      debounceMs: 2000, // 0 disabilita
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

**Note:**

- Debounce raggruppa messaggi solo testo; media/allegati svuotano immediatamente.

- I comandi di controllo (es. /queue, /new) bypassano il debouncing così rimangono standalone.

## Comandi (gestione comandi chat)

Controlla come i comandi chat sono abilitati tra i connettori.

```json
{
  commands: {
    native: "auto", // registra comandi nativi quando supportato (auto)
    text: true, // analizza comandi slash nei messaggi chat
    bash: false, // permetti ! (alias: /bash) (solo host; richiede allowlist tools.elevated)
    bashForegroundMs: 2000, // finestra foreground bash (0 background immediato)
    config: false, // permetti /config (scrive su disco)
    debug: false, // permetti /debug (override solo runtime)
    restart: false, // permetti /restart + azione riavvio gateway
    useAccessGroups: true, // applica policy/allowlist gruppi-accesso per comandi
  },
}
```

**Note:**

- I comandi testo devono essere inviati come messaggio standalone e usare il / iniziale (nessun alias testo semplice).

- commands.text: false disabilita l'analisi messaggi chat per comandi.

- commands.native: "auto" (predefinito) attiva comandi nativi per Discord/Telegram e lascia Slack spento; i canali non supportati rimangono solo testo.

- Imposta commands.native: true|false per forzare tutti, o fai override per canale con channels.discord.commands.native, channels.telegram.commands.native, channels.slack.commands.native (bool o "auto"). false cancella comandi precedentemente registrati su Discord/Telegram all'avvio; i comandi Slack sono gestiti nell'app Slack.

- channels.telegram.customCommands aggiunge voci extra menu bot Telegram. I nomi sono normalizzati; i conflitti con comandi nativi sono ignorati.

- commands.bash: true abilita ! per eseguire comandi shell host (/bash funziona anche come alias). Richiede tools.elevated.enabled e allowlist del mittente in tools.elevated.allowFrom..

- commands.bashForegroundMs controlla quanto bash attende prima di mandare in background. Mentre un lavoro bash è in esecuzione, nuove richieste ! sono rifiutate (uno alla volta).

- commands.config: true abilita /config (legge/scrive openclaw.json).

- channels..configWrites controlla le mutazioni config avviate da quel canale (predefinito: true). Si applica a /config set|unset più migrazioni provider-specifiche automatiche (cambi ID supergruppo Telegram, cambi ID canale Slack).

- commands.debug: true abilita /debug (override solo runtime).

- commands.restart: true abilita /restart e l'azione riavvio strumento gateway.

- commands.useAccessGroups: false permette ai comandi di bypassare le policy/allowlist gruppi-accesso.

- I comandi slash e le direttive sono onorati solo per mittenti autorizzati. L'autorizzazione deriva da
allowlist/pairing canale più commands.useAccessGroups.

## Modalità Talk (talk)

Predefiniti per la modalità Talk (macOS/iOS/Android). Gli ID voce fallback su ELEVENLABS_VOICE_ID o SAG_VOICE_ID quando non impostati.
La apiKey fallback su ELEVENLABS_API_KEY (o il profilo shell del gateway) quando non impostata.
Gli voiceAliases permettono alle direttive Talk di usare nomi amichevoli (es. "voice":"Clawd").

```json
{
  talk: {
    voiceId: "elevenlabs_voice_id",
    voiceAliases: {
      Clawd: "EXAVITQu4vr4xnSDxMaL",
      Roger: "CwhRBWXzGAHq8TQ4Fs17",
    },
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    interruptOnSpeech: true,
  },
}
```

## Agenti Predefiniti (agents.defaults)

Controlla il runtime dell'agente incorporato (modello/pensiero/verbose/timeout).
agents.defaults.models definisce il catalogo modello configurato (e agisce come allowlist per /model).
agents.defaults.model.primary imposta il modello predefinito; agents.defaults.model.fallbacks sono failover globali.
agents.defaults.imageModel è opzionale e viene usato solo se il modello primario manca di input immagine.

Ogni voce agents.defaults.models può includere:

- **alias** (scorciatoia modello opzionale, es. /opus)
- **params** (parametri API provider-specifici opzionali passati attraverso alla richiesta modello)

I params vengono applicati anche alle esecuzioni streaming (agente incorporato + compattazione). Chiavi supportate oggi: temperature, maxTokens. Questi si uniscono con le opzioni al momento della chiamata; i valori forniti dal chiamante vincono. La temperature è una manopola avanzata—lascia non impostata a meno che tu non conosca i predefiniti del modello e necessiti un cambiamento.

**Esempio:**
```json
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-sonnet-4-5-20250929": {
          params: { temperature: 0.6 },
        },
        "openai/gpt-5.2": {
          params: { maxTokens: 8192 },
        },
      },
    },
  },
}
```

I modelli Z.AI GLM-4.x abilitano automaticamente la modalità thinking a meno che tu non:

- imposti --thinking off, o
- definisca agents.defaults.models["zai/"].params.thinking te stesso.

OpenClaw fornisce anche alcune scorciatoie alias built-in. I predefiniti si applicano solo quando il modello
è già presente in agents.defaults.models:

- **opus** -> anthropic/claude-opus-4-5
- **sonnet** -> anthropic/claude-sonnet-4-5
- **gpt** -> openai/gpt-5.2
- **gpt-mini** -> openai/gpt-5-mini
- **gemini** -> google/gemini-3-pro-preview
- **gemini-flash** -> google/gemini-3-flash-preview

Se configuri lo stesso nome alias (case-insensitive) tu stesso, il tuo valore vince (i predefiniti non sovrascrivono mai).

**Esempio: Primario Opus 4.5 con fallback Sonnet 4.5:**
```json
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-5",
        fallbacks: ["anthropic/claude-sonnet-4-5"],
      },
    },
  },
}
```

**Esempio: Disabilita i fallback globali per un agente specifico:**
```json
{
  agents: {
    list: [
      {
        id: "work",
        model: {
          primary: "anthropic/claude-sonnet-4-5",
          fallbacks: [], // nessun fallback per questo agente
        },
      },
    ],
  },
}
```

## Prossimi Passi

La configurazione gateway è molto estesa. Le sezioni rimanenti includono:

- Configurazioni specifiche per ogni canale (WhatsApp, Telegram, Discord, ecc.)
- Sandbox e sicurezza
- Webhook e automazione
- Provider di modelli AI
- E molto altro

Per una configurazione completa, consulta la documentazione originale o utilizza:
```bash
openclaw gateway call config.schema
```

per ottenere lo schema JSON completo.