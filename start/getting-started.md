# Per Iniziare - OpenClaw

## Requisiti di Sistema
Runtime richiesto: Node ≥ 22.

## Installazione Consigliata: Globale (npm/pnpm)

```bash
# Raccomandato: installazione globale (npm/pnpm)
npm install -g openclaw@latest
# oppure: pnpm add -g openclaw@latest

# Onboarding + installa il servizio (servizio utente launchd/systemd)
openclaw onboard --install-daemon

# Associa WhatsApp Web (mostra QR)
openclaw channels login

# Il Gateway viene eseguito via servizio dopo l'onboarding;
# l'esecuzione manuale è ancora possibile:
openclaw gateway --port 18789
```

## Da Sorgente (Sviluppo)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build # installa automaticamente dipendenze UI al primo avvio
pnpm build
openclaw onboard --install-daemon
```

Se non hai ancora un'installazione globale, esegui il passaggio di onboarding via pnpm openclaw ... dal repository.

## Avvio Rapido Multi-Istanza (Opzionale)

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

## Invia un Messaggio di Test

Richiede un Gateway in esecuzione:

```bash
openclaw message send --target +15555550123 --message "Ciao da OpenClaw"
```

## Prossimi Passi

- [Configurazione Gateway](/gateway/configuration)
- [Canali di Comunicazione](/channels)
- [Sicurezza](/gateway/security)