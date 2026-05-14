# Dark Pawns Browser Client

Browser-based MUD client for Dark Pawns. xterm.js WebSocket terminal served by the Go game server.

## Files

- `client.js` — WebSocket client v2 with status bar, structured message handling
- `client-v1.js` — v1 with client-side character creation (race/class menus, reference)
- `index.html` — Landing page with embedded terminal
- `style.css` — Terminal and status bar styling

## Deploy

Served by the Dark Pawns Go server at darkpawns.labz0rz.com. The Go server's `web/` directory embeds and serves these files.

## Protocol

Communicates with the server via WebSocket JSON messages:
- `login` — authenticate or create character
- `command` — send game command
- `state` — receive room/player state
- `vars` — receive variable updates (HP, mana, etc.)
- `event` — receive game events (combat, movement, etc.)
