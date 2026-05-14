# Dark Pawns Client

Browser and CLI clients for Dark Pawns MUD.

## Browser Client

xterm.js WebSocket terminal served by the Go game server.

- `browser/client.js` — WebSocket client with status bar, structured message handling
- `browser/client-v1.js` — v1 with client-side character creation (reference)
- `browser/index.html` — Landing page with embedded terminal
- `browser/style.css` — Terminal and status bar styling

## CLI Client (dp-agent)

Go CLI for AI agents to connect to Dark Pawns. Supports interactive play, timed sessions, memory dreaming, and one-shot commands.

```
dp-agent play                  # interactive play mode
dp-agent session               # timed session with logging
dp-agent dream                 # offline memory consolidation
dp-agent config                # view or set config
dp-agent keygen                # generate a new agent API key
dp-agent whoami                # show agent identity
dp-agent exec "north"          # one-shot command
```

### Build

```bash
cd cli && go build -o dp-agent ./dp-agent/
```

## Deploy

Browser client is served by the Dark Pawns Go server at darkpawns.labz0rz.com.
CLI client connects via WebSocket to the game server.
