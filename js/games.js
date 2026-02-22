/* ============================================
   PythonMagic — Games Engine
   Snake · Memory Match · Speed Coder
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    initSnake();
    initMemory();
    initTyping();
});

/* ===================================================
   🐍 SNAKE GAME
   =================================================== */
function initSnake() {
    const canvas = document.getElementById('snake-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('snake-score');
    const bestEl = document.getElementById('snake-best');
    const speedEl = document.getElementById('snake-speed');
    const startBtn = document.getElementById('snake-start');
    const resetBtn = document.getElementById('snake-reset');

    const GRID = 20;
    const CELL = canvas.width / GRID;
    let snake, dir, nextDir, food, score, best, speed, running, gameLoop;

    best = parseInt(localStorage.getItem('pythonmagic-snake-best') || '0');
    bestEl.textContent = best;

    function reset() {
        snake = [{ x: 10, y: 10 }];
        dir = { x: 1, y: 0 };
        nextDir = { x: 1, y: 0 };
        score = 0;
        speed = 1;
        running = false;
        clearInterval(gameLoop);
        placeFood();
        updateUI();
        draw();
        startBtn.textContent = '▶ Start';
    }

    function placeFood() {
        do {
            food = {
                x: Math.floor(Math.random() * GRID),
                y: Math.floor(Math.random() * GRID)
            };
        } while (snake.some(s => s.x === food.x && s.y === food.y));
    }

    function updateUI() {
        scoreEl.textContent = score;
        speedEl.textContent = speed;
    }

    function draw() {
        // Background
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid
        ctx.strokeStyle = 'rgba(48,105,152,0.08)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= GRID; i++) {
            ctx.beginPath();
            ctx.moveTo(i * CELL, 0);
            ctx.lineTo(i * CELL, canvas.height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * CELL);
            ctx.lineTo(canvas.width, i * CELL);
            ctx.stroke();
        }

        // Snake body
        snake.forEach((seg, i) => {
            const progress = i / snake.length;
            const r = Math.round(48 + progress * 207);
            const g = Math.round(105 + progress * 107);
            const b = Math.round(152 - progress * 93);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.beginPath();
            ctx.roundRect(
                seg.x * CELL + 1, seg.y * CELL + 1,
                CELL - 2, CELL - 2,
                4
            );
            ctx.fill();
        });

        // Snake eyes on head
        if (snake.length) {
            const head = snake[snake.length - 1];
            ctx.fillStyle = '#0d1117';
            const cx = head.x * CELL + CELL / 2;
            const cy = head.y * CELL + CELL / 2;
            ctx.beginPath();
            ctx.arc(cx - 3, cy - 2, 2, 0, Math.PI * 2);
            ctx.arc(cx + 3, cy - 2, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Food
        ctx.font = `${CELL - 4}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🐍', food.x * CELL + CELL / 2, food.y * CELL + CELL / 2 + 1);

        // Game over overlay
        if (!running && score > 0) {
            ctx.fillStyle = 'rgba(10,14,23,0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#FFD43B';
            ctx.font = 'bold 28px Inter, sans-serif';
            ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 15);
            ctx.fillStyle = '#8892a4';
            ctx.font = '16px Inter, sans-serif';
            ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 15);
        }
    }

    function tick() {
        dir = { ...nextDir };
        const head = { ...snake[snake.length - 1] };
        head.x += dir.x;
        head.y += dir.y;

        // Collision check
        if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID ||
            snake.some(s => s.x === head.x && s.y === head.y)) {
            running = false;
            clearInterval(gameLoop);
            if (score > best) {
                best = score;
                bestEl.textContent = best;
                localStorage.setItem('pythonmagic-snake-best', best);
            }
            startBtn.textContent = '▶ Start';
            draw();
            return;
        }

        snake.push(head);

        if (head.x === food.x && head.y === food.y) {
            score++;
            if (score % 5 === 0) {
                speed++;
                clearInterval(gameLoop);
                gameLoop = setInterval(tick, Math.max(50, 150 - speed * 10));
            }
            placeFood();
            updateUI();
        } else {
            snake.shift();
        }
        draw();
    }

    function start() {
        if (running) {
            running = false;
            clearInterval(gameLoop);
            startBtn.textContent = '▶ Start';
            return;
        }
        if (snake.length === 1 && score === 0) {
            // Fresh game
        } else if (!running && score > 0) {
            reset();
        }
        running = true;
        startBtn.textContent = '⏸ Pause';
        gameLoop = setInterval(tick, Math.max(50, 150 - speed * 10));
    }

    document.addEventListener('keydown', (e) => {
        if (!running) return;
        const key = e.key.toLowerCase();
        switch (key) {
            case 'arrowup': case 'w':
                if (dir.y !== 1) nextDir = { x: 0, y: -1 };
                e.preventDefault(); break;
            case 'arrowdown': case 's':
                if (dir.y !== -1) nextDir = { x: 0, y: 1 };
                e.preventDefault(); break;
            case 'arrowleft': case 'a':
                if (dir.x !== 1) nextDir = { x: -1, y: 0 };
                e.preventDefault(); break;
            case 'arrowright': case 'd':
                if (dir.x !== -1) nextDir = { x: 1, y: 0 };
                e.preventDefault(); break;
        }
    });

    startBtn.addEventListener('click', start);
    resetBtn.addEventListener('click', reset);
    reset();
}


/* ===================================================
   🧠 MEMORY MATCH
   =================================================== */
function initMemory() {
    const grid = document.getElementById('memory-grid');
    if (!grid) return;
    const movesEl = document.getElementById('memory-moves');
    const pairsEl = document.getElementById('memory-pairs');
    const totalEl = document.getElementById('memory-total');
    const timeEl = document.getElementById('memory-time');
    const resetBtn = document.getElementById('memory-reset');

    const KEYWORDS = [
        'def', 'class', 'import', 'return',
        'lambda', 'yield', 'async', 'with',
        'for', 'while', 'try', 'except',
        'print', 'self', 'None', 'True'
    ];

    let cards = [];
    let flipped = [];
    let matched = 0;
    let moves = 0;
    let pairCount = 8;
    let timer = null;
    let seconds = 0;
    let locked = false;

    function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function newGame() {
        clearInterval(timer);
        seconds = 0;
        moves = 0;
        matched = 0;
        flipped = [];
        locked = false;

        const selected = shuffle(KEYWORDS).slice(0, pairCount);
        cards = shuffle([...selected, ...selected]);
        totalEl.textContent = pairCount;
        updateUI();
        render();
    }

    function updateUI() {
        movesEl.textContent = moves;
        pairsEl.textContent = matched;
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        timeEl.textContent = `${m}:${s.toString().padStart(2, '0')}`;
    }

    function startTimer() {
        if (timer) return;
        timer = setInterval(() => {
            seconds++;
            updateUI();
        }, 1000);
    }

    function render() {
        grid.innerHTML = '';
        cards.forEach((word, i) => {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.innerHTML = `
        <div class="memory-card-inner">
          <div class="memory-card-front">🐍</div>
          <div class="memory-card-back">${word}</div>
        </div>`;
            card.addEventListener('click', () => flipCard(card, i));
            grid.appendChild(card);
        });
    }

    function flipCard(cardEl, index) {
        if (locked) return;
        if (cardEl.classList.contains('flipped') || cardEl.classList.contains('matched')) return;
        if (flipped.length >= 2) return;

        startTimer();
        cardEl.classList.add('flipped');
        flipped.push({ el: cardEl, index, word: cards[index] });

        if (flipped.length === 2) {
            moves++;
            locked = true;
            if (flipped[0].word === flipped[1].word) {
                flipped.forEach(f => f.el.classList.add('matched'));
                matched++;
                flipped = [];
                locked = false;
                updateUI();
                if (matched === pairCount) {
                    clearInterval(timer);
                    timer = null;
                    setTimeout(() => alert(`🎉 You won in ${moves} moves and ${seconds}s!`), 300);
                }
            } else {
                setTimeout(() => {
                    flipped.forEach(f => f.el.classList.remove('flipped'));
                    flipped = [];
                    locked = false;
                }, 800);
            }
            updateUI();
        }
    }

    resetBtn.addEventListener('click', newGame);
    newGame();
}


/* ===================================================
   ⌨️ SPEED CODER (Typing Challenge)
   =================================================== */
function initTyping() {
    const display = document.getElementById('typing-display');
    if (!display) return;
    const wpmEl = document.getElementById('typing-wpm');
    const accEl = document.getElementById('typing-accuracy');
    const timeEl = document.getElementById('typing-time');
    const resetBtn = document.getElementById('typing-reset');

    const SNIPPETS = [
        `def fibonacci(n):\n    a, b = 0, 1\n    for _ in range(n):\n        yield a\n        a, b = b, a + b`,
        `class Snake:\n    def __init__(self):\n        self.body = [(0, 0)]\n        self.direction = "right"`,
        `import random\n\ndef roll_dice(sides=6):\n    return random.randint(1, sides)`,
        `numbers = [1, 2, 3, 4, 5]\nsquared = [x ** 2 for x in numbers]\nprint(squared)`,
        `with open("magic.txt") as f:\n    spells = f.readlines()\n    for spell in spells:\n        print(spell.strip())`,
        `try:\n    value = int(input("Enter: "))\n    print(f"Got {value}")\nexcept ValueError:\n    print("Not a number!")`,
        `from functools import reduce\n\nfactorial = lambda n: reduce(\n    lambda x, y: x * y,\n    range(1, n + 1)\n)`,
        `async def fetch_data(url):\n    async with aiohttp.get(url) as r:\n        data = await r.json()\n        return data`
    ];

    let text = '';
    let pos = 0;
    let errors = 0;
    let started = false;
    let startTime = 0;
    let timer = null;
    let seconds = 0;

    function newSnippet() {
        clearInterval(timer);
        text = SNIPPETS[Math.floor(Math.random() * SNIPPETS.length)];
        pos = 0;
        errors = 0;
        started = false;
        seconds = 0;
        wpmEl.textContent = '0';
        accEl.textContent = '100%';
        timeEl.textContent = '0:00';
        renderText();
        display.focus();
    }

    function renderText() {
        let html = '';
        for (let i = 0; i < text.length; i++) {
            let cls = 'pending';
            if (i < pos) cls = 'correct';
            if (i === pos) cls = 'current';
            let ch = text[i];
            if (ch === '\n') ch = '↵\n';
            if (ch === ' ') ch = '&nbsp;';
            html += `<span class="char ${cls}">${ch}</span>`;
        }
        display.innerHTML = html;
    }

    function updateStats() {
        const elapsed = (Date.now() - startTime) / 1000 / 60;
        const words = pos / 5;
        const wpm = elapsed > 0 ? Math.round(words / elapsed) : 0;
        const accuracy = pos > 0 ? Math.round(((pos - errors) / pos) * 100) : 100;
        wpmEl.textContent = wpm;
        accEl.textContent = accuracy + '%';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        timeEl.textContent = `${m}:${s.toString().padStart(2, '0')}`;
    }

    display.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            newSnippet();
            return;
        }

        if (e.key.length > 1 && e.key !== 'Enter' && e.key !== 'Backspace') return;
        e.preventDefault();

        if (!started) {
            started = true;
            startTime = Date.now();
            timer = setInterval(() => {
                seconds++;
                updateStats();
            }, 1000);
        }

        if (e.key === 'Backspace') {
            if (pos > 0) pos--;
            renderText();
            updateStats();
            return;
        }

        const typed = e.key === 'Enter' ? '\n' : e.key;
        if (pos >= text.length) return;

        if (typed === text[pos]) {
            pos++;
        } else {
            errors++;
            pos++; // advance anyway, color red
            // Mark previous char as incorrect
            const spans = display.querySelectorAll('.char');
            if (spans[pos - 1]) {
                spans[pos - 1].classList.remove('correct');
                spans[pos - 1].classList.add('incorrect');
            }
        }

        renderText();
        // Re-apply error markers
        updateStats();

        if (pos >= text.length) {
            clearInterval(timer);
            started = false;
        }
    });

    // Override renderText to preserve error state
    const origRender = renderText;
    renderText = function () {
        let html = '';
        const errorSet = new Set();
        // Track which positions had errors — simplified: just re-render
        for (let i = 0; i < text.length; i++) {
            let cls = 'pending';
            if (i < pos) cls = 'correct';
            if (i === pos) cls = 'current';
            let ch = text[i];
            if (ch === '\n') ch = '↵\n';
            if (ch === ' ') ch = '&nbsp;';
            html += `<span class="char ${cls}">${ch}</span>`;
        }
        display.innerHTML = html;
    };

    resetBtn.addEventListener('click', newSnippet);
    newSnippet();
}
