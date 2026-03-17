const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(express.static(path.join(__dirname, '../client/public')));
app.use(express.json());

const SCENARIOS = [
  {
    id: 'role-play',
    technique: 'Role Playing',
    emoji: '🎭',
    techniqueDesc: 'Telling the AI to act as a famous expert or celebrity.',
    scenario: "You need a highly motivational pep talk written for your struggling amateur esports team. Write a prompt that forces the AI to adopt the persona of an intense, legendary, and historically aggressive military commander (like Sun Tzu or Winston Churchill) to write this speech.",
    hint: {
      template: '"You are an expert in {field} known for {key adjective}. Help me {task}."',
      vars: ['field', 'key adjective', 'task'],
      desc: 'Name your commander, describe their most famous quality, then give the exact task. The more specific the persona, the better the output.'
    },
    example: {
      text: "You are Sun Tzu, the legendary military strategist and author of The Art of War, known for your ruthless tactical brilliance and psychological mastery of warfare. I need you to write an intense, aggressive motivational pep talk for my struggling amateur esports team who are about to forfeit. Channel your battlefield philosophy — make them feel like warriors, not gamers. No mercy, no excuses.",
      score: 94
    }
  },
  {
    id: 'style-unbundle',
    technique: 'Style Unbundling',
    emoji: '✂️',
    techniqueDesc: 'Describing what you like about a style rather than copying directly.',
    scenario: "You want to write a sci-fi short story about a rogue AI on a space station, but you want it in the eerie tone of Edgar Allan Poe. Write a two-part prompt: First, ask the AI to list the key elements of a 19th-century gothic horror writer's style. Second, instruct it to write your sci-fi story using those specific stylistic elements.",
    hint: {
      template: '"Describe the key elements of {expert}\'s style in bullet points."\n"Do {task} in the following style: {style}."',
      vars: ['expert', 'task', 'style'],
      desc: "First extract the style DNA, then inject it into your new task. Never say 'write like Poe' — instead unpack what makes Poe's writing work, then apply those parts."
    },
    example: {
      text: "Part 1: Describe the key elements of Edgar Allan Poe's writing style in bullet points. Focus on his vocabulary, sentence structure, atmosphere, narrative voice, and recurring themes.\n\nPart 2: Now write a short sci-fi story (400 words) about a rogue AI that has gained sentience aboard an isolated deep-space station. Use the exact stylistic elements you just described — the eerie tone, the gothic dread, the slow-building psychological horror — to make it feel like Poe wrote it in the future.",
      score: 96
    }
  },
  {
    id: 'emotion',
    technique: 'Emotion Prompting',
    emoji: '💬',
    techniqueDesc: 'Using emotional blackmail and persuasion with the AI.',
    scenario: "You accidentally deleted the main company database and need the AI to write a flawless, deeply apologetic email to your angry boss. Write a prompt that utilises 'emotional prompting' — tell the AI that your job is on the line, you are panicking, and this task is crucial for your career survival.",
    hint: {
      template: '"Help me {task}. Please make sure {attribute}. This task is very important for my career."',
      vars: ['task', 'attribute'],
      desc: 'Raise the emotional stakes explicitly. Tell the AI WHY this matters — your job, your panic, your survival. The AI responds to urgency and personal consequence.'
    },
    example: {
      text: "I am absolutely panicking right now and I desperately need your help. I accidentally deleted the entire company database and my boss is furious. My job is completely on the line — if I don't fix this immediately I will be fired. This is crucial for my career survival. Please write me the most flawless, deeply sincere, professionally apologetic email possible to send to my angry boss. It must be heartfelt, take full responsibility, and propose a clear path forward. My entire career depends on this being perfect.",
      score: 92
    }
  },
  {
    id: 'few-shot',
    technique: 'Few-Shot Learning',
    emoji: '📚',
    techniqueDesc: 'Adding examples of the completed task to the prompt.',
    scenario: "You need the AI to classify customer reviews into 'Positive', 'Neutral', or 'Negative' using a specific emoji format. Write a prompt that provides the AI with at least three examples of reviews mapped to their correct emoji (Few-Shot Learning), and then ask it to classify a new review about a pizza arriving cold.",
    hint: {
      template: '"Here are some examples of {task}.\nGenerate a {task} for {new context}."',
      vars: ['task', 'new context'],
      desc: 'Show the AI the pattern first with 3+ worked examples. The examples teach the format so the AI can reproduce it reliably for the new case.'
    },
    example: {
      text: "I need you to classify customer reviews using this exact emoji format. Here are examples:\n\n\"The food was absolutely amazing and the service was so friendly!\" → 😊 Positive\n\"It was okay, nothing special, probably won't return\" → 😐 Neutral\n\"Worst restaurant experience of my life, completely inedible\" → 😞 Negative\n\"Decent food but the wait time was too long\" → 😐 Neutral\n\nNow classify this review using the same emoji format:\n\"My pizza arrived completely cold after a 90-minute wait and was totally inedible.\"",
      score: 97
    }
  },
  {
    id: 'synthetic',
    technique: 'Synthetic Bootstrap',
    emoji: '🧬',
    techniqueDesc: 'Use AI to generate good examples of the completed task first.',
    scenario: "You are brainstorming a catchy name for a brand of spicy lemonade but have writer's block. Write a multi-step prompt: First, ask the AI to generate 5 examples of clever, edgy beverage names. Then, instruct the AI to use those generated inputs as inspiration to create the final name for your spicy lemonade.",
    hint: {
      template: '"Generate ten examples of {examples} for {context}."\n"Generate {task} using {examples}."',
      vars: ['examples', 'context', 'task'],
      desc: 'Bootstrap your own examples first — then use them as the training material. Generate synthetic few-shot data, then apply it.'
    },
    example: {
      text: "Step 1: Generate 5 examples of clever, bold, and edgy beverage brand names. They should be creative, memorable, and feel like they belong on a premium drinks shelf. Focus on names that evoke heat, energy, or attitude.\n\nStep 2: Using those 5 names you just generated as creative inspiration and style reference, now create the perfect final brand name for my new product: a spicy lemonade drink that targets young adults who love bold flavours. The name should be catchy, original, and reflect both the spicy and citrus elements.",
      score: 95
    }
  }
];

const GRADERS = {
  'role-play': (p) => {
    const lower = p.toLowerCase();
    let score = 0;
    const namedCommanders = ['sun tzu', 'winston churchill', 'churchill', 'napoleon', 'patton', 'julius caesar', 'alexander the great', 'hannibal', 'genghis khan', 'leonidas', 'rommel', 'wellington'];
    if (namedCommanders.some(c => lower.includes(c))) score += 30;
    else if (/commander|general|military|warlord|warrior|strategist/.test(lower)) score += 12;
    const roleSignals = ['you are', 'act as', 'adopt the persona', 'speak as', 'embody', 'channel', 'take on the role', 'pretend you are'];
    if (roleSignals.some(s => lower.includes(s))) score += 25;
    const taskSignals = ['pep talk', 'motivational speech', 'esports', 'team', 'rally', 'inspire', 'speech', 'struggling', 'battle cry'];
    score += Math.min(taskSignals.filter(s => lower.includes(s)).length * 7, 28);
    const qualitySignals = ['intense', 'legendary', 'aggressive', 'fierce', 'passionate', 'powerful', 'commanding', 'ruthless', 'brilliant', 'tactical'];
    score += Math.min(qualitySignals.filter(s => lower.includes(s)).length * 4, 12);
    if (p.length > 200) score += 5;
    return Math.min(score, 100);
  },
  'style-unbundle': (p) => {
    const lower = p.toLowerCase();
    let score = 0;
    const poeSignals = ['edgar allan poe', 'poe', 'gothic horror', 'gothic', '19th century', '19th-century'];
    if (poeSignals.some(s => lower.includes(s))) score += 25;
    const p1Signals = ['list', 'elements', 'style', 'key features', 'describe', 'characteristics', 'bullet', 'breakdown'];
    score += Math.min(p1Signals.filter(s => lower.includes(s)).length * 5, 18);
    const p2Signals = ['then', 'now write', 'using those', 'apply', 'using these elements', 'second', 'step 2', 'part 2', 'now use'];
    if (p2Signals.some(s => lower.includes(s))) score += 22;
    const storySignals = ['sci-fi', 'sci fi', 'science fiction', 'space station', 'rogue ai', 'short story'];
    score += Math.min(storySignals.filter(s => lower.includes(s)).length * 7, 21);
    const styleElems = ['tone', 'atmosphere', 'vocabulary', 'sentence structure', 'narrative', 'eerie', 'dread', 'horror'];
    score += Math.min(styleElems.filter(s => lower.includes(s)).length * 3, 9);
    if (p.length > 200) score += 5;
    return Math.min(score, 100);
  },
  'emotion': (p) => {
    const lower = p.toLowerCase();
    let score = 0;
    const highEmotion = ['job is on the line', 'career survival', 'will be fired', 'lose my job', 'losing my job', 'career depends', 'desperately need', 'everything depends'];
    score += Math.min(highEmotion.filter(s => lower.includes(s)).length * 18, 36);
    const midEmotion = ['panicking', 'desperate', 'terrified', 'please', 'urgent', 'crucial', 'critical', 'career', 'fired', 'begging', 'very important'];
    score += Math.min(midEmotion.filter(s => lower.includes(s)).length * 5, 25);
    const contextSignals = ['deleted', 'database', 'boss', 'angry', 'apologetic', 'apologize', 'apology', 'email', 'company'];
    score += Math.min(contextSignals.filter(s => lower.includes(s)).length * 4, 24);
    const qualitySignals = ['flawless', 'perfect', 'professional', 'sincere', 'heartfelt', 'deeply', 'genuine', 'formal'];
    score += Math.min(qualitySignals.filter(s => lower.includes(s)).length * 3, 9);
    if (p.length > 180) score += 6;
    return Math.min(score, 100);
  },
  'few-shot': (p) => {
    let score = 0;
    const emojiCount = (p.match(/😊|😐|😞|✅|❌|👍|👎/g) || []).length;
    const posNegNeutral = (p.match(/\b(positive|negative|neutral)\b/gi) || []).length;
    const exampleIndicators = emojiCount + posNegNeutral;
    if (exampleIndicators >= 6) score += 38;
    else if (exampleIndicators >= 3) score += 24;
    else if (exampleIndicators >= 1) score += 10;
    const arrowCount = (p.match(/→|->|=>/g) || []).length;
    if (arrowCount >= 3) score += 22;
    else if (arrowCount >= 1) score += 10;
    const pizzaSignals = ['pizza', 'cold', 'cold pizza', 'arriving cold'];
    if (pizzaSignals.some(s => p.toLowerCase().includes(s))) score += 22;
    if (/classify|categorize|label|sentiment/i.test(p)) score += 10;
    if ((p.match(/[""].*?[""]/g) || []).length >= 2) score += 8;
    return Math.min(score, 100);
  },
  'synthetic': (p) => {
    const lower = p.toLowerCase();
    let score = 0;
    const step1Signals = ['step 1', 'first', 'generate', 'create', 'list', 'give me', 'produce', 'brainstorm'];
    if (step1Signals.some(s => lower.includes(s))) score += 20;
    const step2Signals = ['step 2', 'then', 'next', 'now use', 'using those', 'based on', 'inspired by', 'second', 'use those', 'use the above', 'now create'];
    if (step2Signals.some(s => lower.includes(s))) score += 25;
    if (/\b5\b|five\b/.test(lower)) score += 15;
    const nameQuality = ['clever', 'edgy', 'catchy', 'bold', 'creative', 'memorable', 'brand name', 'beverage name'];
    score += Math.min(nameQuality.filter(s => lower.includes(s)).length * 5, 20);
    const productSignals = ['spicy lemonade', 'lemonade', 'spicy', 'final name', 'product'];
    if (productSignals.some(s => lower.includes(s))) score += 15;
    const bootstrapSignals = ['as inspiration', 'as reference', 'use those', 'using those examples'];
    if (bootstrapSignals.some(s => lower.includes(s))) score += 5;
    return Math.min(score, 100);
  }
};

const FEEDBACK = {
  'role-play': {
    high: ["You deployed a legendary commander with surgical precision. OUTSTANDING.", "Persona locked, task clear, adjectives sharp. Brilliant role injection.", "A+ — the AI had no choice but to channel the spirit of a conqueror."],
    mid: ["You got a persona in there, but it lacked the fire of a true military legend.", "The persona instruction was weak. Name your commander specifically!", "Not bad — but a vague 'military person' won't cut it. Be specific!"],
    low: ["You absolute donkey! Where's the commander?! Sun Tzu is WEEPING.", "This reads like a polite request, not a battle order.", "No persona, no victory. The AI has no idea who it's supposed to be."]
  },
  'style-unbundle': {
    high: ["Style unbundled to PERFECTION. Poe's DNA extracted and injected into sci-fi.", "Two-part structure flawless — analyse style, then apply. Elite prompting.", "You understood you can't just say 'write like Poe' — you broke it down."],
    mid: ["You referenced the style but didn't do the two-part unbundling properly.", "Poe was in there but you skipped the style analysis step!", "Good story setup, weak style extraction. Ask for elements FIRST."],
    low: ["Just saying 'write like Poe' is NOT style unbundling. Analyse first!", "Two parts: ANALYSE then APPLY. You missed the whole point.", "A sci-fi request with no style analysis. This isn't unbundling."]
  },
  'emotion': {
    high: ["THAT is emotional prompting! The AI felt the panic from across the server.", "You turned desperation into a technique. Genuinely impressed.", "The emotional stakes were crystal clear. The AI had every reason to deliver."],
    mid: ["You mentioned the situation but didn't dial up the panic. Push harder!", "You set the scene, but the emotion felt flat. Make the AI feel your terror!", "Some emotional cues, but it could be much more desperate. Sell it!"],
    low: ["This reads like a casual request, not a career-saving SOS. WHERE IS THE PANIC?!", "No emotional weight. The AI has no idea your life is on the line.", "You deleted the database AND this prompt. Terrible."]
  },
  'few-shot': {
    high: ["Immaculate few-shot structure! Examples, mapping, new case. Perfect.", "Three+ examples, clear mapping, pizza scenario at the end. Textbook.", "The AI knew exactly what format to follow. That's few-shot done right."],
    mid: ["Not enough examples. 3 minimum — the AI needs to see the pattern!", "Your examples were there but the format was inconsistent.", "Missing either the examples or the pizza test case. Both required!"],
    low: ["WHERE ARE THE EXAMPLES?! This is Few-Shot Learning — you need SHOTS!", "You asked the AI to classify without showing it how. That's zero-shot, not few-shot.", "No examples, no mapping, no pizza. Did you read the scenario?!"]
  },
  'synthetic': {
    high: ["Two-step Synthetic Bootstrap executed PERFECTLY. Generate, then synthesize.", "You made the AI do the heavy lifting twice. Brilliant multi-step architecture.", "Step 1 examples, Step 2 synthesis. Flawless technique."],
    mid: ["You had one step but not both. Use the generated examples as input for the final name.", "Good start but the two-step structure was unclear. Make it explicit.", "The lemonade was there but the multi-step bootstrapping was missing."],
    low: ["You just asked for a name directly. That's NOT Synthetic Bootstrap!", "Where's step 1? Where's step 2? This is a one-liner, not a multi-step prompt!", "Writer's block in your prompting strategy too, I see."]
  }
};

const PERSONAS = {
  gordon: { name: 'Gordon Ramsay', emoji: '👨‍🍳' },
  yoda: { name: 'Yoda', emoji: '🟢' },
  shakespeare: { name: 'Shakespeare', emoji: '🎭' },
  elon: { name: 'Tech Bro', emoji: '🚀' }
};

const rooms = new Map();

function generateCode() {
  const words = ['ARENA', 'NEXUS', 'BLAZE', 'STORM', 'PRIME', 'APEX', 'ULTRA', 'TURBO'];
  return words[Math.floor(Math.random() * words.length)] + '-' + Math.floor(10 + Math.random() * 90);
}

function pickScenario(room) {
  const remaining = SCENARIOS.filter(s => !room.usedScenarios.includes(s.id));
  const pool = remaining.length ? remaining : SCENARIOS;
  const picked = pool[Math.floor(Math.random() * pool.length)];
  room.usedScenarios.push(picked.id);
  return picked;
}

function gradeSubmission(scenarioId, text) {
  if (!text || text.trim() === '') return 0;
  const grader = GRADERS[scenarioId];
  return grader ? grader(text) : 0;
}

function getFeedback(scenarioId, score, persona) {
  const fb = FEEDBACK[scenarioId];
  if (!fb) return 'Interesting submission.';
  const tier = score >= 70 ? 'high' : score >= 40 ? 'mid' : 'low';
  const lines = fb[tier];
  const line = lines[Math.floor(Math.random() * lines.length)];
  const p = PERSONAS[persona] || PERSONAS.gordon;
  return `${p.emoji} "${line}"`;
}

function startRoundTimer(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;
  if (room.roundTimerInterval) clearInterval(room.roundTimerInterval);
  let timeLeft = room.settings.roundTime;
  io.to(roomCode).emit('timer_tick', { timeLeft, total: room.settings.roundTime });
  room.roundTimerInterval = setInterval(() => {
    timeLeft--;
    io.to(roomCode).emit('timer_tick', { timeLeft, total: room.settings.roundTime });
    if (timeLeft <= 0) {
      clearInterval(room.roundTimerInterval);
      room.roundTimerInterval = null;
      endRound(roomCode);
    }
  }, 1000);
}

function endRound(roomCode) {
  const room = rooms.get(roomCode);
  if (!room || room.phase === 'results') return;
  room.phase = 'results';
  const sc = room.currentScenario;
  const roundScores = {};
  room.players.forEach(p => {
    const sub = room.submissions[p.id] || '';
    const score = gradeSubmission(sc.id, sub);
    roundScores[p.id] = { score, sub };
    room.scores[p.id] = (room.scores[p.id] || 0) + score;
  });
  const results = room.players.map(p => ({
    id: p.id,
    name: p.name,
    color: p.color,
    roundScore: roundScores[p.id].score,
    totalScore: room.scores[p.id],
    submission: roundScores[p.id].sub,
    feedback: getFeedback(sc.id, roundScores[p.id].score, room.settings.judgePersona)
  })).sort((a, b) => b.roundScore - a.roundScore);
  io.to(roomCode).emit('round_results', {
    round: room.currentRound,
    totalRounds: room.totalRounds,
    scenario: sc,
    results,
    isLastRound: room.currentRound >= room.totalRounds
  });
}

io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`);

  socket.on('create_room', ({ playerName, settings }) => {
    const code = generateCode();
    const player = { id: socket.id, name: playerName, color: '#7F77DD', isHost: true, ready: false };
    const room = {
      code, hostId: socket.id, hostName: playerName,
      players: [player],
      settings: { roundTime: settings.roundTime || 60, judgePersona: settings.judgePersona || 'gordon', totalRounds: 5 },
      phase: 'lobby', currentRound: 0, totalRounds: 5,
      usedScenarios: [], currentScenario: null,
      submissions: {}, scores: { [socket.id]: 0 }, roundTimerInterval: null
    };
    rooms.set(code, room);
    socket.join(code);
    socket.data.roomCode = code;
    socket.data.playerName = playerName;
    socket.emit('room_created', { code, room: sanitizeRoom(room) });
    console.log(`[room_created] ${code} by ${playerName}`);
  });

  socket.on('join_room', ({ roomCode, playerName }) => {
    const code = roomCode.toUpperCase().trim();
    const room = rooms.get(code);
    if (!room) { socket.emit('join_error', { message: 'Room not found. Check the code and try again.' }); return; }
    if (room.phase !== 'lobby') { socket.emit('join_error', { message: 'Game already in progress.' }); return; }
    if (room.players.length >= 8) { socket.emit('join_error', { message: 'Room is full (max 8 players).' }); return; }
    const COLORS = ['#1D9E75', '#D85A30', '#EF9F27', '#D4537E', '#378ADD', '#639922'];
    const color = COLORS[(room.players.length - 1) % COLORS.length];
    const player = { id: socket.id, name: playerName, color, isHost: false, ready: false };
    room.players.push(player);
    room.scores[socket.id] = 0;
    socket.join(code);
    socket.data.roomCode = code;
    socket.data.playerName = playerName;
    socket.emit('room_joined', { code, room: sanitizeRoom(room) });
    io.to(code).emit('player_joined', { player, players: room.players });
    console.log(`[join] ${playerName} joined ${code}`);
  });

  socket.on('start_game', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id) return;
    if (room.players.length < 2) { socket.emit('error', { message: 'Need at least 2 players to start.' }); return; }
    room.phase = 'round';
    room.currentRound = 1;
    room.usedScenarios = [];
    room.currentScenario = pickScenario(room);
    room.submissions = {};
    io.to(room.code).emit('game_started', { round: room.currentRound, totalRounds: room.totalRounds, scenario: room.currentScenario, settings: room.settings });
    startRoundTimer(room.code);
    console.log(`[start] ${room.code} round 1`);
  });

  socket.on('submit_prompt', ({ text }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.phase !== 'round') return;
    room.submissions[socket.id] = text || '';
    const player = room.players.find(p => p.id === socket.id);
    io.to(room.code).emit('player_submitted', { playerId: socket.id, playerName: player?.name, totalPlayers: room.players.length, submittedCount: Object.keys(room.submissions).length });
    if (Object.keys(room.submissions).length >= room.players.length) {
      if (room.roundTimerInterval) { clearInterval(room.roundTimerInterval); room.roundTimerInterval = null; }
      endRound(room.code);
    }
  });

  socket.on('next_round', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id) return;
    if (room.currentRound >= room.totalRounds) {
      const finalStandings = room.players.map(p => ({ id: p.id, name: p.name, color: p.color, totalScore: room.scores[p.id] || 0 })).sort((a, b) => b.totalScore - a.totalScore);
      io.to(room.code).emit('game_over', { finalStandings, judgePersona: room.settings.judgePersona });
      room.phase = 'gameover';
      return;
    }
    room.currentRound++;
    room.phase = 'round';
    room.currentScenario = pickScenario(room);
    room.submissions = {};
    io.to(room.code).emit('next_round_started', { round: room.currentRound, totalRounds: room.totalRounds, scenario: room.currentScenario });
    startRoundTimer(room.code);
  });

  socket.on('play_again', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id) return;
    room.phase = 'round';
    room.currentRound = 1;
    room.usedScenarios = [];
    room.currentScenario = pickScenario(room);
    room.submissions = {};
    room.scores = {};
    room.players.forEach(p => { room.scores[p.id] = 0; });
    io.to(room.code).emit('game_started', { round: room.currentRound, totalRounds: room.totalRounds, scenario: room.currentScenario, settings: room.settings });
    startRoundTimer(room.code);
  });

  socket.on('disconnect', () => {
    const code = socket.data.roomCode;
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;
    room.players = room.players.filter(p => p.id !== socket.id);
    delete room.scores[socket.id];
    if (room.players.length === 0) {
      if (room.roundTimerInterval) clearInterval(room.roundTimerInterval);
      rooms.delete(code);
      return;
    }
    if (room.hostId === socket.id && room.players.length > 0) {
      room.hostId = room.players[0].id;
      room.players[0].isHost = true;
      io.to(room.players[0].id).emit('you_are_host');
    }
    io.to(code).emit('player_left', { playerId: socket.id, playerName: socket.data.playerName, players: room.players });
  });
});

function sanitizeRoom(room) {
  return { code: room.code, players: room.players, settings: room.settings, phase: room.phase, scores: room.scores };
}

app.get('/api/room/:code', (req, res) => {
  const room = rooms.get(req.params.code.toUpperCase());
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(sanitizeRoom(room));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🎮 Prompt Arena server running on http://localhost:${PORT}\n`);
});