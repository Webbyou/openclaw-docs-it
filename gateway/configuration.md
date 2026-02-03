# Configurazione Gateway - OpenClaw

OpenClaw legge una configurazione JSON5 opzionale da ~/.openclaw/openclaw.json (commenti + virgole finali consentite).
Se il file manca, OpenClaw usa predefiniti sicuri (agente Pi incorporato + sessioni per-mittente + workspace ~/.openclaw/workspace). Di solito hai bisogno di una configurazione solo per:

- limitare chi può attivare il bot (channels.whatsapp.allowFrom, channels.telegram.allowFrom, ecc.)

- controllare allowlist gruppi + comportamento menzione (channels.whatsapp.groups, channels.telegram.groups, channels.discord.guilds, agents.list[].groupChat)

- personalizzare prefissi messaggi (messages)

- impostare il workspace dell'agente (agents.defaults.workspace o agents.list[].workspace)

- regolare i predefiniti dell'agente incorporato (agents.defaults) e il comportamento sessione (session)

- impostare identità per-agente (agents.list[].identity)


## Convalida configurazione rigorosa

OpenClaw accetta solo configurazioni che corrispondono completamente allo schema.
Chiavi sconosciute, tipi malformati o valori invalidi causano il rifiuto di avvio del Gateway per sicurezza.
Quando la convalida fallisce:

- Il Gateway non si avvia.

- Solo comandi diagnostici sono consentiti (ad esempio: openclaw doctor, openclaw logs, openclaw health, openclaw status, openclaw service, openclaw help).

- Esegui openclaw doctor per vedere i problemi esatti.

- Esegui openclaw doctor --fix (o --yes) per applicare migrazioni/riparazioni.

Doctor non scrive mai modifiche a meno che tu non accetti esplicitamente --fix/--yes.

## Schema + suggerimenti UI

Il Gateway espone una rappresentazione JSON Schema della config via config.schema per editor UI.
La Control UI renderizza un modulo da questo schema, con un editor Raw JSON come via di fuga.
Plugin canali ed estensioni possono registrare schema + suggerimenti UI per la loro config, così le impostazioni canale
rimangono guidate dallo schema tra app senza moduli hard-coded.
I suggerimenti (etichette, raggruppamento, campi sensibili) sono forniti insieme allo schema così i client possono renderizzare
moduli migliori senza conoscenza hard-coded della config.

## Applica + riavvia (RPC)

Usa config.apply per convalidare + scrivere l'intera config e riavviare il Gateway in un solo passaggio.
Scrive un sentinella di riavvio e fa ping all'ultima sessione attiva dopo il rientro del Gateway.
**Avviso:** config.apply sostituisce l'intera config. Se vuoi cambiare solo poche chiavi,
usa config.patch o openclaw config set. Tieni un backup di ~/.openclaw/openclaw.json.

**Parametri:**

- raw (stringa) — payload JSON5 per l'intera config

- baseHash (opzionale) — hash config da config.get (richiesto quando una config esiste già)

- sessionKey (opzionale) — chiave sessione attiva per il ping di risveglio

- note (opzionale) — nota da includere nella sentinella di riavvio

- restartDelayMs (opzionale) — ritardo prima del riavvio (predefinito 2000)

**Esempio (via chiamata gateway):**
```bash
openclaw gateway call config.get --params '{}' # cattura payload.hash
openclaw gateway call config.apply --params '{
 "raw": "{\\n agents: { defaults: { workspace: \\"~/.openclaw/workspace\\" } }\\n}\\n",
 "baseHash": "<hash-da-config.get>",
 "sessionKey": "agent:main:whatsapp:dm:+15555550123",
 "restartDelayMs": 1000
}'
```

## Aggiornamenti parziali (RPC)

Usa config.patch per unire un aggiornamento parziale nella config esistente senza sovrascrivere
chiavi non correlate. Applica semantica di patch di unione JSON:

- oggetti si uniscono ricorsivamente

- null elimina una chiave

- array sostituiscono

Come config.apply, convalida, scrive la config, memorizza una sentinella di riavvio, e pianifica
il riavvio del Gateway (con risveglio opzionale quando sessionKey è fornito).

**Parametri:**

- raw (stringa) — payload JSON5 contenente solo le chiavi da modificare

- baseHash (richiesto) — hash config da config.get

- sessionKey (opzionale) — chiave sessione attiva per il ping di risveglio

- note (opzionale) — nota da includere nella sentinella di riavvio

- restartDelayMs (opzionale) — ritardo prima del riavvio (predefinito 2000)

**Esempio:**
```bash
openclaw gateway call config.get --params '{}' # cattura payload.hash
openclaw gateway call config.patch --params '{
 "raw": "{\\n channels: { telegram: { groups: { \\"*\\": { requireMention: false } } } }\\n}\\n",
 "baseHash": "<hash-da-config.get>",
 "sessionKey": "agent:main:whatsapp:dm:+15555550123",
 "restartDelayMs": 1000
}'
```

## Config minimale (punto di partenza consigliato)

```json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

Costruisci l'immagine predefinita una volta con:
```bash
scripts/sandbox-setup.sh
```

## Modalità self-chat (consigliata per controllo gruppo)

Per impedire al bot di rispondere a menzioni @ in gruppi WhatsApp (rispondi solo a trigger di testo specifici):

```json
{
  agents: {
    defaults: { workspace: "~/.openclaw/workspace" },
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["@openclaw", "reisponde"] },
      },
    ],
  },
  channels: {
    whatsapp: {
      // L'allowlist è solo per DM; includere il tuo numero abilita la modalità self-chat.
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
}
```

## Include di Config ($include)

Dividi la tua config in file multipli usando la direttiva $include. Questo è utile per:

- Organizzare config grandi (ad esempio, definizioni agente per-cliente)

- Condividere impostazioni comuni tra ambienti

- Tenere config sensibili separate

### Uso base

```json
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },

  // Includi un singolo file (sostituisce il valore della chiave)
  agents: { $include: "./agents.json5" },

  // Includi file multipli (uniti profondamente in ordine)
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}

// ~/.openclaw/agents.json5
{
  defaults: { sandbox: { mode: "all", scope: "session" } },
  list: [{ id: "main", workspace: "~/.openclaw/workspace" }],
}
```

### Comportamento unione

- **Singolo file:** Sostituisce l'oggetto contenente $include

- **Array di file:** Unisce profondamente file in ordine (file successivi sovrascrivono precedenti)

- **Con chiavi sibling:** Le chiavi sibling vengono unite dopo gli include (sovrascrivono valori inclusi)

- **Chiavi sibling + array/primitivi:** Non supportato (il contenuto incluso deve essere un oggetto)

```json
// Le chiavi sibling sovrascrivono valori inclusi
{
  $include: "./base.json5", // { a: 1, b: 2 }
  b: 99, // Risultato: { a: 1, b: 99 }
}
```

### Include annidati

I file inclusi possono contenere loro stessi direttive $include (fino a 10 livelli di profondità):

```json
// clients/mueller.json5
{
  agents: { $include: "./mueller/agents.json5" },
  broadcast: { $include: "./mueller/broadcast.json5" },
}
```

### Risoluzione percorsi

- **Percorsi relativi:** Risolti relativamente al file includente

- **Percorsi assoluti:** Usati così come sono

- **Directory genitori:** I riferimenti ../ funzionano come previsto

```json
{ "$include": "./sub/config.json5" } // relativo
{ "$include": "/etc/openclaw/base.json5" } // assoluto
{ "$include": "../shared/common.json5" } // directory genitore
```

### Gestione errori

- **File mancante:** Errore chiaro con percorso risolto

- **Errore parsing:** Mostra quale file incluso è fallito

- **Include circolari:** Rilevati e segnalati con catena include

### Esempio: Setup legale multi-cliente

```json
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789, auth: { token: "secret" } },

  // Predefiniti agente comuni
  agents: {
    defaults: {
      sandbox: { mode: "all", scope: "session" },
    },
    // Unisci elenchi agente da tutti i clienti
    list: { $include: ["./clients/mueller/agents.json5", "./clients/schmidt/agents.json5"] },
  },

  // Unisci config broadcast
  broadcast: {
    $include: ["./clients/mueller/broadcast.json5", "./clients/schmidt/broadcast.json5"],
  },

  channels: { whatsapp: { groupPolicy: "allowlist" } },
}

// ~/.openclaw/clients/mueller/agents.json5
[
  { id: "mueller-transcribe", workspace: "~/clients/mueller/transcribe" },
  { id: "mueller-docs", workspace: "~/clients/mueller/docs" },
]
```

## Variabili d'ambiente + .env

OpenClaw legge variabili d'ambiente dal processo genitore (shell, launchd/systemd, CI, ecc.).
Inoltre, carica:

- .env dalla directory di lavoro corrente (se presente)

- un fallback .env globale da ~/.openclaw/.env (aka $OPENCLAW_STATE_DIR/.env)

Nessun file .env sovrascrive variabili d'ambiente esistenti.
Puoi anche fornire variabili d'ambiente inline nella config. Queste vengono applicate solo se il
processo env manca la chiave (stessa regola di non-sovrascrittura):

```json
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

Vedi [/environment](/environment) per precedenza completa e fonti.

### env.shellEnv (opzionale)

Comodità opt-in: se abilitato e nessuna delle chiavi attese è ancora impostata, OpenClaw esegue la tua shell di login e importa solo le chiavi attese mancanti (non sovrascrive mai).
Questo effettivamente sorgente il tuo profilo shell.

```json
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

**Equivalente variabile d'ambiente:**

- OPENCLAW_LOAD_SHELL_ENV=1

- OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000

### Sostituzione variabili d'ambiente nella config

Puoi fare riferimento a variabili d'ambiente direttamente in qualsiasi valore stringa config usando
la sintassi ${VAR_NAME}. Le variabili vengono sostituite al caricamento della config, prima della convalida.

```json
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
  gateway: {
    auth: {
      token: "${OPENCLAW_GATEWAY_TOKEN}",
    },
  },
}
```

**Regole:**

- Solo nomi variabili d'ambiente maiuscoli vengono abbinati: [A-Z_][A-Z0-9_]*

- Variabili d'ambiente mancanti o vuote generano un errore al caricamento della config

- Escapa con $${VAR} per ottenere un letterale ${VAR}

- Funziona con $include (i file inclusi ottengono anche sostituzione)

**Sostituzione inline:**
```json
{
  models: {
    providers: {
      custom: {
        baseUrl: "${CUSTOM_API_BASE}/v1", // → "https://api.example.com/v1"
      },
    },
  },
}
```

### Conservazione auth (OAuth + chiavi API)

OpenClaw memorizza profili auth per-agente (OAuth + chiavi API) in:

- /auth-profiles.json (predefinito: ~/.openclaw/agents//agent/auth-profiles.json)

Vedi anche: [/concetti/oauth](/concetti/oauth)

**Importazioni OAuth legacy:**

- ~/.openclaw/credentials/oauth.json (o $OPENCLAW_STATE_DIR/credentials/oauth.json)

L'agente Pi incorporato mantiene una cache runtime su:

- /auth.json (gestito automaticamente; non modificare manualmente)

**Directory agente legacy (pre multi-agente):**

- ~/.openclaw/agent/* (migrato da openclaw doctor in ~/.openclaw/agents//agent/*)

**Override:**

- Directory OAuth (solo importazione legacy): OPENCLAW_OAUTH_DIR

- Directory agente (override radice agente predefinito): OPENCLAW_AGENT_DIR (preferito), PI_CODING_AGENT_DIR (legacy)

Al primo uso, OpenClaw importa voci oauth.json in auth-profiles.json.

### auth

Metadata opzionale per profili auth. Questo non memorizza segreti; mappa
ID profilo a provider + modalità (e email opzionale) e definisce l'ordine di rotazione provider
usato per failover.

```json
{
  auth: {
    profiles: {
      "anthropic:[[email protected]](/cdn-cgi/l/email-protection)": { provider: "anthropic", mode: "oauth", email: "[[email protected]](/cdn-cgi/l/email-protection)" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
    },
    order: {
      anthropic: ["anthropic:[[email protected]](/cdn-cgi/l/email-protection)", "anthropic:work"],
    },
  },
}
```

### agents.list[].identity

Identità per-agente opzionale usata per predefiniti e UX. Questo viene scritto dall'assistente di onboarding macOS.
Se impostato, OpenClaw deriva predefiniti (solo quando non li hai impostati esplicitamente):

- messages.ackReaction dall'emoji identity.emoji dell'agente attivo (fallback a 👀)

- agents.list[].groupChat.mentionPatterns da name/identity.emoji dell'agente (così "@Samantha" funziona nei gruppi su Telegram/Slack/Discord/Google Chat/iMessage/WhatsApp)

- identity.avatar accetta un percorso immagine relativo al workspace o un URL/dati URL remoto. I file locali devono vivere dentro il workspace agente.

**identity.avatar accetta:**

- Percorso relativo al workspace (deve rimanere dentro il workspace agente)

- URL http(s)

- URI data:

```json
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
      },
    ],
  },
}
```

### wizard

Metadata scritto da wizard CLI (onboard, configure, doctor).

```json
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

### logging

- **File log predefinito:** /tmp/openclaw/openclaw-YYYY-MM-DD.log

- Se vuoi un percorso stabile, imposta logging.file su /tmp/openclaw/openclaw.log.

- L'output console può essere regolato separatamente via:
  - logging.consoleLevel (predefinito a info, aumenta a debug con --verbose)
  - logging.consoleStyle (pretty | compact | json)

- I riepiloghi strumenti possono essere redatti per evitare perdite di segreti:
  - logging.redactSensitive (off | tools, predefinito: tools)
  - logging.redactPatterns (array di stringhe regex; sovrascrive predefiniti)

```json
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty",
    redactSensitive: "tools",
    redactPatterns: [
      // Esempio: sovrascrivi predefiniti con le tue regole.
      "\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1",
      "/\\bsk-[A-Za-z0-9_-]{8,}\\b/gi",
    ],
  },
}
```

### channels.whatsapp.dmPolicy

Controlla come vengono gestite le chat dirette WhatsApp (DM):

- **"pairing" (predefinito):** mittenti sconosciuti ottengono un codice pairing; il proprietario deve approvare

- **"allowlist":** permetti solo mittenti in channels.whatsapp.allowFrom (o archivio allow abbinato)

- **"open":** permetti tutti i DM in entrata (richiede channels.whatsapp.allowFrom includere "*")

- **"disabled":** ignora tutti i DM in entrata

I codici pairing scadono dopo 1 ora; il bot invia un codice pairing solo quando viene creata una nuova richiesta. Le richieste pairing DM in sospeso sono limitate a 3 per canale per impostazione predefinita.

**Approvazioni pairing:**

- openclaw pairing list whatsapp
- openclaw pairing approve whatsapp

### channels.whatsapp.allowFrom

Allowlist di numeri di telefono E.164 che possono attivare risposte automatiche WhatsApp (solo DM).
Se vuoto e channels.whatsapp.dmPolicy="pairing", i mittenti sconosciuti riceveranno un codice pairing.
Per i gruppi, usa channels.whatsapp.groupPolicy + channels.whatsapp.groupAllowFrom.

```json
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000, // dimensione chunk in uscita opzionale (caratteri)
      chunkMode: "length", // modalità chunking opzionale (length | newline)
      mediaMaxMb: 50, // limite media in entrata opzionale (MB)
    },
  },
}
```

### channels.whatsapp.sendReadReceipts

Controlla se i messaggi WhatsApp in entrata sono contrassegnati come letti (spunte blu). Predefinito: true.
La modalità self-chat salta sempre le ricevute di lettura, anche quando abilitate.
**Override per-account:** channels.whatsapp.accounts.<id>.sendReadReceipts.

```json
{
  channels: {
    whatsapp: { sendReadReceipts: false },
  },
}
```

### channels.whatsapp.accounts (multi-account)

Esegui account WhatsApp multipli in un gateway:

```json
{
  channels: {
    whatsapp: {
      accounts: {
        default: {}, // opzionale; mantiene l'id predefinito stabile
        personal: {},
        biz: {
          // Override opzionale. Predefinito: ~/.openclaw/credentials/whatsapp/biz
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

**Note:**

- I comandi in uscita predefiniti usano l'account default se presente; altrimenti il primo id account configurato (ordinato).

- La directory auth Baileys single-account legacy viene migrata da openclaw doctor in whatsapp/default.

### channels.telegram.accounts / channels.discord.accounts / channels.googlechat.accounts / channels.slack.accounts / channels.mattermost.accounts / channels.signal.accounts / channels.imessage.accounts

Esegui account multipli per canale (ogni account ha il proprio accountId e nome opzionale):

```json
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Bot primario",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Bot avvisi",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

**Note:**

- default viene usato quando accountId è omesso (CLI + routing).

- I token env si applicano solo all'account predefinito.

- Le impostazioni canale base (policy gruppo, gating menzione, ecc.) si applicano a tutti gli account a meno di override per-account.

- Usa bindings[].match.accountId per indirizzare ogni account a un agents.defaults diverso.

### Gating menzione chat di gruppo (agents.list[].groupChat + messages.groupChat)

I messaggi di gruppo predefinito richiedono menzione (menzioni metadata o pattern regex). Si applica a WhatsApp, Telegram, Discord, Google Chat e chat di gruppo iMessage.

**Tipi di menzione:**

- **Menzioni metadata:** Menzioni native piattaforma (es. WhatsApp tap-to-mention). Ignorate nella modalità self-chat WhatsApp (vedi channels.whatsapp.allowFrom).

- **Pattern testo:** Pattern regex definiti in agents.list[].groupChat.mentionPatterns. Sempre controllati indipendentemente dalla modalità self-chat.

- **Il gating menzione è applicato solo quando il rilevamento menzione è possibile** (menzioni native o almeno un mentionPattern).

```json
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

messages.groupChat.historyLimit imposta il predefinito globale per il contesto cronologia gruppi. I canali possono override con channels.<channel>.historyLimit (o channels.<channel>.accounts.*.historyLimit per multi-account). Imposta 0 per disabilitare il wrapping cronologia.

#### Limiti cronologia DM

Le conversazioni DM usano la cronologia basata su sessione gestita dall'agente. Puoi limitare il numero di turni utente mantenuti per sessione DM:

```json
{
  channels: {
    telegram: {
      dmHistoryLimit: 30, // limita sessioni DM a 30 turni utente
      dms: {
        "123456789": { historyLimit: 50 }, // override per-utente (ID utente)
      },
    },
  },
}
```

**Ordine risoluzione:**

1. Override per-DM: channels..dms[userId].historyLimit
2. Predefinito provider: channels..dmHistoryLimit
3. Nessun limite (tutta la cronologia mantenuta)

**Provider supportati:** telegram, whatsapp, discord, slack, signal, imessage, msteams.

**Override per-agente** (prende precedenza quando impostato, anche []):

```json
{
  agents: {
    list: [
      { id: "work", groupChat: { mentionPatterns: ["@workbot", "\\+15555550123"] } },
      { id: "personal", groupChat: { mentionPatterns: ["@homebot", "\\+15555550999"] } },
    ],
  },
}
```

### Policy gruppo (per canale)

Usa channels.*.groupPolicy per controllare se i messaggi gruppo/camera sono accettati affatto:

```json
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["tg:123456789", "@alice"],
    },
    signal: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["[[email protected]](/cdn-cgi/l/email-protection)"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: {
          channels: { help: { allow: true } },
        },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
    },
  },
}
```

**Note:**

- **"open":** i gruppi bypassano le allowlist; il gating-menzione si applica ancora.
- **"disabled":** blocca tutti i messaggi gruppo/camera.
- **"allowlist":** permetti solo gruppi/camera che corrispondono all'allowlist configurata.
- channels.defaults.groupPolicy imposta il predefinito quando groupPolicy di un provider è non impostato.
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams usano groupAllowFrom (fallback: allowFrom esplicito).
- Discord/Slack usano allowlist canali (channels.discord.guilds.*.channels, channels.slack.channels).
- I DM di gruppo (Discord/Slack) sono ancora controllati da dm.groupEnabled + dm.groupChannels.
- Il predefinito è groupPolicy: "allowlist" (a meno di override da channels.defaults.groupPolicy); se nessuna allowlist è configurata, i messaggi di gruppo sono bloccati.
```