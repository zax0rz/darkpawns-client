(function () {
  'use strict';

  // --- Real Dark Pawns GREETINGS from src/config.c ---
  const GREETINGS =
    '\r\n\r\n' +
    '         (_____)           (_)    (_____)\r\n' +
    '   _     /  __ \\           | |    |  __ \\                            _\r\n' +
    '  ;*;   /| |  | | __ _ _ __| | __ | |__) |_ _(_      _)_ __ (___)   ;*;\r\n' +
    '   =    /| |  | |/ _` | \'__| |/ / |  ___/ _` \\ \\ /\\ / / \'_ \\/ __|    =\r\n' +
    ' .***.  /| |__| | (_| | |  |   <  | |  | (_| |\\ V  V /| | | \\__ \\  .***.\r\n' +
    ' ~~~~~  /|_____/ \\__,_|_|  |_|\\_\\ |||   \\__,_| \\_/\\_/ |_| |_|___/  ~~~~~\r\n' +
    '                                  |||\r\n' +
    '                                  |||\r\n' +
    '                                  `.\'\r\n' +
    '\r\n' +
    '             Based on CircleMUD 3.0 created by J. Elson and\r\n' +
    '            DikuMUD Gamma 0.0 created by K. Nyboe, T. Madsen,\r\n' +
    '                H. Staerfeldt, M. Seifert, and S. Hammer\r\n' +
    '\r\n';

  const RACE_MENU =
    '\r\n' +
    'Choose a race:\r\n' +
    '  [H]uman        [E]lven       [D]warven      [K]enderkin\r\n' +
    '  [M]inotaur     [R]akshasan   [S]sauran\r\n' +
    '\r\n';

  // Class menu shown to Humans (from src/class.c human_class_menu)
  const HUMAN_CLASS_MENU =
    '\r\n' +
    'Select a class:\r\n' +
    '  [C]leric     - Healers and warriors of the gods\r\n' +
    '  [T]hief      - Stealthy, quick-fingered, lock-picking back-stabbers\r\n' +
    '  [W]arrior    - Fierce, battle-trained fighters\r\n' +
    '  [M]agic-user - Spell-casters trained in the art of magick\r\n' +
    '  [N]inja      - Stealthy, magick-endowed warriors from the orient\r\n' +
    '  Ps[i]onic    - Fighters endowed with the powers of the mind\r\n';

  // Class menu for non-Humans (from src/class.c class_menu)
  const DEFAULT_CLASS_MENU =
    '\r\n' +
    'Select a class:\r\n' +
    '  [C]leric     - Healers and warriors of the gods\r\n' +
    '  [T]hief      - Stealthy, quick-fingered, lock-picking back-stabbers\r\n' +
    '  [W]arrior    - Fierce, battle-trained fighters\r\n' +
    '  [M]agic-user - Spell-casters trained in the art of magick\r\n' +
    '  Ps[i]onic    - Fighters endowed with the powers of the mind\r\n';

  // --- Race/Class key mappings matching C source ---
  const RACES = [
    { key: 'h', name: 'Human', id: 0 },
    { key: 'e', name: 'Elven', id: 1 },
    { key: 'd', name: 'Dwarven', id: 2 },
    { key: 'k', name: 'Kenderkin', id: 3 },
    { key: 'm', name: 'Minotaur', id: 4 },
    { key: 'r', name: 'Rakshasan', id: 5 },
    { key: 's', name: 'Ssauran', id: 6 },
  ];

  // Go side: CLASS_MAGIC_USER=0, CLASS_CLERIC=1, CLASS_THIEF=2, CLASS_WARRIOR=3
  // CLASS_NINJA=6, CLASS_PSIONIC=9
  const CLASSES = [
    { key: 'm', name: 'Magic-user', id: 0 },
    { key: 'c', name: 'Cleric', id: 1 },
    { key: 't', name: 'Thief', id: 2 },
    { key: 'w', name: 'Warrior', id: 3 },
    { key: 'n', name: 'Ninja', id: 6 },
    { key: 'i', name: 'Psionic', id: 9 },
  ];

  // --- Terminal setup ---
  const params = new URLSearchParams(location.search);
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = params.get('host') || `${proto}//${location.host}/ws`;

  const term = new Terminal({
    cursorBlink: true,
    fontSize: 15,
    fontFamily: '"IM Fell English", "Courier New", monospace',
    theme: {
      background: '#0a0908',
      foreground: '#c8b896',
      cursor: '#8b0000',
      selectionBackground: '#3a2a1a',
    },
  });
  const fitAddon = new FitAddon.FitAddon();
  term.loadAddon(fitAddon);
  term.open(document.getElementById('terminal'));
  fitAddon.fit();
  window.addEventListener('resize', () => fitAddon.fit());

  const statusEl = document.querySelector('.conn-status');
  const reconnectBtn = document.getElementById('reconnect-btn');

  let ws;
  let inputBuffer = '';
  let prompt = '';

  // Creation state: 'name' → 'confirm_name' → 'race' → 'class' → 'playing'
  let inputState = 'name';
  let pendingName = '';
  let selectedRace = 0;

  function setStatus(state) {
    statusEl.className = 'conn-status ' + state;
    const label = state === 'connected' ? 'Connected' : 'Disconnected';
    statusEl.querySelector('span').textContent = label;
    reconnectBtn.classList.toggle('visible', state === 'disconnected');
  }

  function setPrompt(p) {
    term.write(p);
    prompt = p;
  }

  // --- Room/event rendering ---

  function renderRoom(data) {
    const room = data.room || {};
    term.writeln('\r\n\x1b[1;37m' + room.name + '\x1b[0m');
    if (room.description) {
      const desc = room.description
        .replace(/\n\s*/g, '\n')
        .replace(/^\s+/, '');
      desc.split('\n').forEach(line => {
        if (line.trim()) term.writeln(line);
      });
    }
    if (room.exits && room.exits.length > 0) {
      term.writeln('\x1b[33mExits: ' + room.exits.join(', ') + '\x1b[0m');
    }
    if (room.items && room.items.length > 0) {
      room.items.forEach(item => term.writeln(item));
    }
    if (room.players && room.players.length > 0) {
      room.players.forEach(p => term.writeln('\x1b[36m' + p + ' is here.\x1b[0m'));
    }
    term.writeln('');
  }

  function handleServerMessage(evt) {
    let msg;
    try {
      msg = JSON.parse(evt.data);
    } catch {
      term.writeln(evt.data);
      return;
    }

    switch (msg.type) {
      case 'state': {
        const data = msg.data || {};
        const player = data.player || {};
        // First state = login complete, show room
        renderRoom(data);
        setPrompt('> ');
        break;
      }
      case 'event': {
        const data = msg.data || {};
        const text = (data.text || '').trimEnd();
        if (!text) return;
        // Filter mob movement spam
        const lower = text.toLowerCase();
        if (lower.match(/\b(has arrived|leaves (north|south|east|west|up|down))\b/)) return;
        if (data.type === 'combat') {
          term.writeln('\x1b[31m' + text + '\x1b[0m');
        } else {
          term.writeln(text);
        }
        break;
      }
      case 'text': {
        const data = msg.data || {};
        if (data.text) term.writeln(data.text.trimEnd());
        break;
      }
      case 'error': {
        const data = msg.data || {};
        term.writeln('\x1b[31m' + (data.message || 'Error') + '\x1b[0m');
        break;
      }
      default: {
        const d = msg.data || {};
        if (typeof d === 'string') term.writeln(d);
        else if (d.text) term.writeln(d.text);
      }
    }
  }

  // --- Connection ---

  function connect() {
    setStatus('disconnected');
    inputState = 'name';
    pendingName = '';
    inputBuffer = '';
    prompt = '';
    try {
      ws = new WebSocket(wsUrl);
    } catch (e) {
      term.writeln('\x1b[31mConnection failed: ' + e.message + '\x1b[0m');
      return;
    }

    ws.onopen = function () {
      setStatus('connected');
      // Show real Dark Pawns greeting
      term.writeln(GREETINGS);
      // Real login prompt from src/ident.c:240
      setPrompt('By what name do you wish to be known? ');
    };

    ws.onmessage = handleServerMessage;
    ws.onclose = function () {
      setStatus('disconnected');
      term.writeln('\r\n\x1b[31m--- Connection lost ---\x1b[0m');
    };
    ws.onerror = function () {
      term.writeln('\x1b[31mConnection error.\x1b[0m');
    };
  }

  // --- Input handling (matches C interpreter.c CON states) ---

  term.onData(function (data) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    if (data === '\r' || data === '\n') {
      term.writeln('');
      const input = inputBuffer.trim();
      inputBuffer = '';

      switch (inputState) {
        case 'name':
          if (!input) {
            // Empty name = disconnect (matches C: close_socket(d))
            ws.close();
            return;
          }
          pendingName = input;
          // C: "Please remember to choose an appropriate fantasy-oriented name."
          // "Did I get that right, <name> (Y/N)? "
          term.writeln('Please remember to choose an appropriate fantasy-oriented name.');
          setPrompt('Did I get that right, ' + pendingName + ' (Y/N)? ');
          inputState = 'confirm_name';
          break;

        case 'confirm_name':
          if (input.toLowerCase() === 'y') {
            // C: "New character." → password. We skip password (no DB) and go straight to ANSI/sex/race.
            term.writeln('New character.');
            // C: "Do you want ANSI color (Y/N)? " — we assume yes for web client
            // C: "What is your sex (M/F)? "
            term.writeln('\x1b[1mANSI color enabled.\x1b[0m');
            setPrompt('What is your sex (M/F)? ');
            inputState = 'sex';
          } else if (input.toLowerCase() === 'n') {
            term.writeln('Okay, what IS it, then? ');
            setPrompt('By what name do you wish to be known? ');
            inputState = 'name';
          } else {
            term.writeln('Please type Yes or No.');
            setPrompt('Did I get that right, ' + pendingName + ' (Y/N)? ');
          }
          break;

        case 'sex':
          if (input === 'm' || input === 'M' || input === 'f' || input === 'F') {
            // Show race menu (from C: CON_QSEX → race_menu)
            term.writeln(RACE_MENU);
            setPrompt('Race: ');
            inputState = 'race';
          } else {
            term.writeln('That is not a sex..');
            setPrompt('What is your sex (M/F)? ');
          }
          break;

        case 'race': {
          const race = RACES.find(r => r.key === input.toLowerCase());
          if (race) {
            selectedRace = race.id;
            // Show class menu (different for Humans vs others, matching C)
            if (race.id === 0) {
              term.writeln(HUMAN_CLASS_MENU);
            } else {
              term.writeln(DEFAULT_CLASS_MENU);
            }
            setPrompt('Class: ');
            inputState = 'class';
          } else {
            term.writeln('That is not a race..');
            term.writeln(RACE_MENU);
            setPrompt('Race: ');
          }
          break;
        }

        case 'class': {
          const cls = CLASSES.find(c => c.key === input.toLowerCase());
          if (cls) {
            // Send login to server with all creation data
            ws.send(JSON.stringify({
              type: 'login',
              data: {
                player_name: pendingName,
                new_char: true,
                race: selectedRace,
                class: cls.id,
              },
            }));
            // Game server will respond with 'state' message → renderRoom + prompt
            inputState = 'playing';
            prompt = '';
          } else {
            term.writeln('That is not a class..');
            setPrompt('Class: ');
          }
          break;
        }

        case 'playing':
          if (input) {
            ws.send(JSON.stringify({ type: 'command', data: { command: input } }));
          }
          setPrompt('> ');
          break;
      }
    } else if (data === '\x7f' || data === '\b') {
      if (inputBuffer.length > 0) {
        inputBuffer = inputBuffer.slice(0, -1);
        term.write('\b \b');
      }
    } else if (data >= ' ') {
      inputBuffer += data;
      term.write(data);
    }
  });

  reconnectBtn.addEventListener('click', function () {
    if (ws) ws.close();
    connect();
  });

  connect();
})();
