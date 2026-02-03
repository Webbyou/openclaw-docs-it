# Canale WhatsApp - Configurazione Completa

WhatsApp in OpenClaw funziona attraverso il protocollo WhatsApp Web via Baileys. Ecco tutte le opzioni di configurazione disponibili.

## Configurazione Base

```json
{
  channels: {
    whatsapp: {
      enabled: true,
      dmPolicy: "pairing",        // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123"], // allowlist numeri telefono
      groups: {
        "*": { requireMention: true }
      },
      sendReadReceipts: true,     // spunte blu
      textChunkLimit: 4000,       // dimensione chunk testo
      chunkMode: "length",        // length | newline
      mediaMaxMb: 50,             // limite dimensione media
      accounts: {                 // multi-account
        default: {},
        personal: {},
        business: {}
      }
    }
  }
}
```

## Politiche DM (Messaggi Diretti)

### dmPolicy
Controlla come vengono gestiti i messaggi diretti:

- **"pairing"** (predefinito): I mittenti sconosciuti ricevono un codice pairing
- **"allowlist"**: Solo i numeri in `allowFrom` possono scrivere
- **"open"**: Chiunque può scrivere (richiede `allowFrom: ["*"]`)
- **"disabled"**: Nessun DM accettato

```json
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+393481234567", "+15551234567"]
    }
  }
}
```

### Self-Chat Mode
Per abilitare la conversazione con te stesso (stesso numero del bot):

```json
{
  channels: {
    whatsapp: {
      allowFrom: ["+393481234567"], // Il tuo stesso numero
      groups: { "*": { requireMention: true } }
    }
  },
  agents: {
    list: [{
      id: "main",
      groupChat: {
        mentionPatterns: ["reisponde", "@bot"]
      }
    }]
  }
}
```

## Gestione Gruppi

### Politiche Gruppo
```json
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      groupAllowFrom: ["+15551234567"], // ID gruppo o admin
      groups: {
        "*": {                    // Tutti i gruppi
          requireMention: true,    // Richiede menzione
          allowFrom: ["+15551234567"], // Chi può scrivere
          systemPrompt: "Risposte brevi" // Prompt specifico
        },
        "120363023456789012@g.us": { // ID gruppo specifico
          requireMention: false,
          skills: ["search", "docs"]
        }
      }
    }
  }
}
```

### Menzioni e Trigger
```json
{
  agents: {
    list: [{
      id: "main",
      groupChat: {
        mentionPatterns: [
          "@openclaw",
          "openclaw",
          "bot rispondi",
          "\\+393481234567"  // Numero formato internazionale
        ]
      }
    }]
  }
}
```

## Multi-Account WhatsApp

Esegui più account WhatsApp nello stesso gateway:

```json
{
  channels: {
    whatsapp: {
      accounts: {
        default: {
          name: "Account Principale"
        },
        personal: {
          name: "Personale",
          authDir: "~/.openclaw/credentials/whatsapp/personal"
        },
        business: {
          name: "Business",
          authDir: "~/.openclaw/credentials/whatsapp/business"
        }
      }
    }
  },
  bindings: [
    { agentId: "personal", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "business" } }
  ]
}
```

## Opzioni Media e Messaggi

### Gestione Media
```json
{
  channels: {
    whatsapp: {
      mediaMaxMb: 50,              // MB massimi per allegati
      sendReadReceipts: true,      // Spunte blu
      includeMetadata: true,       // Includi metadata media
      
      // Per account specifici
      accounts: {
        business: {
          mediaMaxMb: 100,
          sendReadReceipts: false
        }
      }
    }
  }
}
```

### Formattazione Messaggi
```json
{
  channels: {
    whatsapp: {
      textChunkLimit: 4000,        // Caratteri per chunk
      chunkMode: "length",         // length | newline | paragraph
      messageTemplate: {
        enabled: true,
        variables: {
          header: "🤖 *OpenClaw Bot*",
          footer: "_Powered by AI_"
        }
      }
    }
  }
}
```

## Sicurezza e Privacy

### Allowlist Avanzata
```json
{
  channels: {
    whatsapp: {
      allowFrom: ["+393481234567"],
      
      // Allowlist per gruppi specifici
      groups: {
        "120363023456789012@g.us": {
          allowFrom: ["+393481234567", "+15551234567"],
          adminsOnly: false,
          requireMention: true
        }
      },
      
      // Blocca numeri specifici
      blockFrom: ["+393499999999"],
      
      // Orari di funzionamento
      activeHours: {
        start: "08:00",
        end: "22:00",
        timezone: "Europe/Rome"
      }
    }
  }
}
```

### Rate Limiting
```json
{
  channels: {
    whatsapp: {
      rateLimit: {
        messagesPerMinute: 10,
        burst: 5,
        cooldownMs: 60000
      }
    }
  }
}
```

## Configurazione Avanzata

### WebSocket e Connessione
```json
{
  channels: {
    whatsapp: {
      web: {
        enabled: true,
        heartbeatSeconds: 60,
        reconnect: {
          initialMs: 2000,
          maxMs: 120000,
          factor: 1.4,
          jitter: 0.2,
          maxAttempts: 0 // 0 = illimitato
        }
      }
    }
  }
}
```

### Auth e Credenziali
```json
{
  channels: {
    whatsapp: {
      // Directory credenziali (predefinito: ~/.openclaw/credentials/whatsapp/<account>)
      authDir: "~/.openclaw/credentials/whatsapp/main",
      
      // Multi-auth per account diversi
      accounts: {
        main: {
          authDir: "~/.openclaw/credentials/whatsapp/main"
        },
        backup: {
          authDir: "~/.openclaw/credentials/whatsapp/backup"
        }
      }
    }
  }
}
```

### History e Contesto
```json
{
  channels: {
    whatsapp: {
      // Cronologia DM
      dmHistoryLimit: 30,           // Ultimi 30 messaggi
      
      // Cronologia gruppi
      historyLimit: 50,             // Contesto gruppi
      
      // Per utente specifico
      dms: {
        "393481234567": {
          historyLimit: 100         // Più contesto per utente specifico
        }
      }
    }
  }
}
```

## Esempi Completi

### Configurazione Base Sicura
```json
{
  "channels": {
    "whatsapp": {
      "enabled": true,
      "dmPolicy": "pairing",
      "allowFrom": ["+393481234567"],
      "groups": {
        "*": { "requireMention": true }
      },
      "sendReadReceipts": true,
      "mediaMaxMb": 50
    }
  }
}
```

### Business Multi-Account
```json
{
  "channels": {
    "whatsapp": {
      "enabled": true,
      "accounts": {
        "personal": {
          "name": "Personale",
          "dmPolicy": "allowlist",
          "allowFrom": ["+393481234567", "+393481234568"]
        },
        "business": {
          "name": "Azienda",
          "dmPolicy": "open",
          "allowFrom": ["*"],
          "groups": {
            "*": { "requireMention": false }
          }
        }
      }
    }
  },
  "bindings": [
    { "agentId": "personal", "match": { "channel": "whatsapp", "accountId": "personal" } },
    { "agentId": "business", "match": { "channel": "whatsapp", "accountId": "business" } }
  ]
}
```

### Gruppi con Permessi Specifici
```json
{
  "channels": {
    "whatsapp": {
      "enabled": true,
      "groups": {
        "120363023456789012@g.us": {
          "name": "Team Dev",
          "allow": true,
          "requireMention": true,
          "allowFrom": ["+393481234567", "+15551234567"],
          "adminsOnly": false,
          "skills": ["code", "search"],
          "systemPrompt": "Sei un assistente per sviluppatori. Rispondi in modo conciso."
        },
        "120363098765432109@g.us": {
          "name": "Famiglia",
          "allow": true,
          "requireMention": false,
          "allowFrom": ["*"]
        }
      }
    }
  }
}
```

## Comandi e Gestione

### Setup Iniziale
```bash
# Configura WhatsApp
openclaw configure --section channels.whatsapp

# Login QR Code
openclaw channels login whatsapp

# Verifica stato
openclaw status --deep

# Lista account
openclaw channels list
```

### Debug e Manutenzione
```bash
# Log WhatsApp
openclaw logs --channel whatsapp

# Test connessione
openclaw health

# Resetta credenziali
openclaw channels logout whatsapp
openclaw channels login whatsapp

# Doctor per problemi
openclaw doctor
```

## Troubleshooting Comune

### Problemi di Connessione
```json
{
  "channels": {
    "whatsapp": {
      "web": {
        "enabled": true,
        "heartbeatSeconds": 30,
        "reconnect": {
          "initialMs": 1000,
          "maxMs": 60000,
          "factor": 1.2
        }
      }
    }
  }
}
```

### Errori di Autenticazione
- Verifica che il numero sia in formato E.164 (`+393481234567`)
- Controlla le credenziali in `~/.openclaw/credentials/whatsapp/`
- Usa `openclaw doctor` per diagnostica

### Problemi Media
```json
{
  "channels": {
    "whatsapp": {
      "mediaMaxMb": 100,  // Aumenta limite
      "chunkMode": "newline", // Alterna modalità chunking
      "textChunkLimit": 2000  // Riduci chunk testo
    }
  }
}
```

## Best Practices

1. **Sicurezza**: Usa sempre `dmPolicy: "pairing"` o `allowlist`
2. **Performance**: Imposta `historyLimit` appropriato per evitare overflow di contesto
3. **Multi-account**: Usa account separati per personale/business
4. **Rate limiting**: Implementa limiti per evitare spam
5. **Backup**: Mantieni backup delle credenziali in `~/.openclaw/credentials/`

## Prossimi Passi

- Configura altri canali (Telegram, Discord) per multi-piattaforma
- Imposta routing multi-agente per gestire diversi tipi di conversazioni
- Configura skill specifiche per WhatsApp
- Monitora metriche e performance