/* ============================================
   PythonMagic — Magic Effects Engine
   Code Rain · Fractals · 8-Ball · Particles
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    initCodeRain();
    initFractal();
    initMagic8Ball();
    initParticleSandbox();
});



/* ===================================================
   🌧️ PYTHON CODE RAIN
   =================================================== */
function initCodeRain() {
    const canvas = document.getElementById('code-rain-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const densityInput = document.getElementById('rain-density');
    const colorSelect = document.getElementById('rain-color');

    const PY_CHARS = 'def class import return lambda yield async with for while try except print self None True False if else elif break continue pass raise from global nonlocal del assert in is not and or 0123456789 () [] {} : = + - * / % ** // == != < > <= >= @ -> # _ . , ;'.split(' ');

    const COLORS = {
        green: { main: '#00ff41', dim: '#003b00', bg: 'rgba(0,8,0,0.05)' },
        blue: { main: '#4B8BBE', dim: '#1a2d40', bg: 'rgba(0,4,15,0.05)' },
        yellow: { main: '#FFD43B', dim: '#3d3200', bg: 'rgba(15,12,0,0.05)' },
        purple: { main: '#b794f4', dim: '#2d1f4e', bg: 'rgba(10,0,20,0.05)' }
    };

    let columns = [];
    let w, h;
    let animId;

    function resize() {
        const wrapper = canvas.parentElement;
        w = canvas.width = wrapper.offsetWidth;
        h = canvas.height = Math.max(350, wrapper.offsetHeight);
        initColumns();
    }

    function initColumns() {
        const fontSize = 14;
        const colCount = Math.floor(w / fontSize);
        columns = [];
        const density = parseInt(densityInput.value) / 100;
        for (let i = 0; i < colCount; i++) {
            if (Math.random() < density) {
                columns.push({
                    x: i * fontSize,
                    y: Math.random() * h,
                    speed: 1 + Math.random() * 3,
                    fontSize: fontSize,
                    chars: []
                });
            }
        }
    }

    function draw() {
        const color = COLORS[colorSelect.value] || COLORS.green;
        ctx.fillStyle = color.bg;
        ctx.fillRect(0, 0, w, h);

        columns.forEach(col => {
            const char = PY_CHARS[Math.floor(Math.random() * PY_CHARS.length)];
            if (char.length <= 2) {
                ctx.font = `${col.fontSize}px JetBrains Mono, monospace`;
                // Leading character is bright
                ctx.fillStyle = color.main;
                ctx.globalAlpha = 1;
                ctx.fillText(char, col.x, col.y);

                // Trail fades
                ctx.fillStyle = color.dim;
                ctx.globalAlpha = 0.4;
                for (let t = 1; t < 5; t++) {
                    const trailChar = PY_CHARS[Math.floor(Math.random() * PY_CHARS.length)];
                    if (trailChar.length <= 2) {
                        ctx.fillText(trailChar, col.x, col.y - t * col.fontSize);
                    }
                }
                ctx.globalAlpha = 1;
            }

            col.y += col.speed * 2;
            if (col.y > h + 100) {
                col.y = -20;
                col.speed = 1 + Math.random() * 3;
            }
        });

        animId = requestAnimationFrame(draw);
    }

    densityInput.addEventListener('input', () => {
        initColumns();
    });

    resize();
    draw();
    window.addEventListener('resize', resize);

    // Mouse interaction — scatter nearby columns
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        columns.forEach(col => {
            const dx = col.x - mx;
            const dy = col.y - my;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 60) {
                col.y -= 20;
            }
        });
    });
}


/* ===================================================
   🌀 FRACTAL GENERATOR (Mandelbrot)
   =================================================== */
function initFractal() {
    const canvas = document.getElementById('fractal-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resetBtn = document.getElementById('fractal-reset');
    const paletteSelect = document.getElementById('fractal-palette');
    const zoomEl = document.getElementById('fractal-zoom');

    let w, h;
    let centerX = -0.5, centerY = 0;
    let zoom = 1;
    const MAX_ITER = 200;

    const PALETTES = {
        fire: (t) => {
            const r = Math.min(255, t * 8);
            const g = Math.min(255, Math.max(0, t * 3 - 100));
            const b = Math.min(255, Math.max(0, t * 1.5 - 150));
            return [r, g, b];
        },
        ocean: (t) => {
            const r = Math.min(255, Math.max(0, t * 1.5 - 80));
            const g = Math.min(255, t * 3);
            const b = Math.min(255, t * 6);
            return [r, g, b];
        },
        psychedelic: (t) => {
            const r = Math.sin(t * 0.1) * 127 + 128;
            const g = Math.sin(t * 0.1 + 2) * 127 + 128;
            const b = Math.sin(t * 0.1 + 4) * 127 + 128;
            return [r, g, b];
        },
        mono: (t) => {
            const v = Math.min(255, t * 4);
            return [v, v, v];
        }
    };

    function resize() {
        const wrapper = canvas.parentElement;
        w = canvas.width = Math.min(wrapper.offsetWidth, 800);
        h = canvas.height = Math.min(400, wrapper.offsetHeight || 400);
        render();
    }

    function render() {
        const imageData = ctx.createImageData(w, h);
        const data = imageData.data;
        const palette = PALETTES[paletteSelect.value] || PALETTES.fire;
        const scale = 3.5 / (w * zoom);

        for (let px = 0; px < w; px++) {
            for (let py = 0; py < h; py++) {
                const x0 = centerX + (px - w / 2) * scale;
                const y0 = centerY + (py - h / 2) * scale;
                let x = 0, y = 0, iter = 0;
                while (x * x + y * y <= 4 && iter < MAX_ITER) {
                    const temp = x * x - y * y + x0;
                    y = 2 * x * y + y0;
                    x = temp;
                    iter++;
                }

                const idx = (py * w + px) * 4;
                if (iter === MAX_ITER) {
                    data[idx] = data[idx + 1] = data[idx + 2] = 0;
                } else {
                    const [r, g, b] = palette(iter);
                    data[idx] = r;
                    data[idx + 1] = g;
                    data[idx + 2] = b;
                }
                data[idx + 3] = 255;
            }
        }
        ctx.putImageData(imageData, 0, 0);
        zoomEl.textContent = zoom.toFixed(1) + 'x';
    }

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const scale = 3.5 / (w * zoom);
        centerX += (px - w / 2) * scale;
        centerY += (py - h / 2) * scale;
        zoom *= 2;
        render();
    });

    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        zoom = Math.max(1, zoom / 2);
        render();
    });

    resetBtn.addEventListener('click', () => {
        centerX = -0.5;
        centerY = 0;
        zoom = 1;
        render();
    });

    paletteSelect.addEventListener('change', render);
    resize();
    window.addEventListener('resize', resize);
}


/* ===================================================
   🎱 MAGIC 8-BALL
   =================================================== */
function initMagic8Ball() {
    const ball = document.getElementById('eight-ball');
    const answerEl = document.getElementById('eight-ball-answer');
    const questionInput = document.getElementById('eight-ball-question');
    if (!ball) return;

    const ANSWERS = [
        "import antigravity",
        "True",
        "False",
        "None of the above",
        "raise NotImplementedError",
        "It's in the docs",
        "Have you tried\npip install?",
        "Beautiful is better\nthan ugly",
        "Explicit is better\nthan implicit",
        "Simple is better\nthan complex",
        "Readability counts",
        "There should be\none obvious way",
        "Now is better\nthan never",
        "If the impl is\nhard to explain,\nit's a bad idea",
        "Namespaces are\none honking\ngreat idea",
        "return True",
        "return False",
        "except: pass\n# probably fine",
        "¯\\_(ツ)_/¯\n# no idea",
        "Yes, but use\na context manager",
        "Consult\nStack Overflow",
        "The GIL says no",
        "Use a\nlist comprehension",
        "try:\n  yes\nexcept:\n  no",
        "Ask again after\npip install wisdom"
    ];

    ball.addEventListener('click', () => {
        ball.classList.add('shaking');
        answerEl.classList.remove('visible');
        answerEl.textContent = '...';

        setTimeout(() => {
            ball.classList.remove('shaking');
            const answer = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
            answerEl.textContent = answer;
            answerEl.classList.add('visible');
        }, 600);
    });

    questionInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            ball.click();
        }
    });
}


/* ===================================================
   ✨ PARTICLE SANDBOX
   =================================================== */
function initParticleSandbox() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const gravityInput = document.getElementById('particle-gravity');
    const clearBtn = document.getElementById('particle-clear');

    let particles = [];
    let w, h;
    let mouseDown = false;
    let mouseX = 0, mouseY = 0;

    function resize() {
        const wrapper = canvas.parentElement;
        w = canvas.width = wrapper.offsetWidth;
        h = canvas.height = Math.max(400, wrapper.offsetHeight || 400);
    }

    class Particle {
        constructor(x, y, vx, vy, color) {
            this.x = x;
            this.y = y;
            this.vx = vx || (Math.random() - 0.5) * 6;
            this.vy = vy || (Math.random() - 0.5) * 6;
            this.life = 1;
            this.decay = 0.003 + Math.random() * 0.005;
            this.size = 2 + Math.random() * 4;
            this.color = color || this.randomColor();
            this.trail = [];
        }

        randomColor() {
            const colors = [
                [48, 105, 152],   // Python blue
                [255, 212, 59],   // Python yellow
                [183, 148, 244],  // Purple
                [72, 199, 116],   // Green
                [255, 107, 107],  // Red
                [78, 205, 196],   // Teal
            ];
            return colors[Math.floor(Math.random() * colors.length)];
        }

        update(gravity) {
            this.vy += gravity * 0.01;
            this.x += this.vx;
            this.y += this.vy;

            // Bounce off edges
            if (this.x < 0 || this.x > w) {
                this.vx *= -0.7;
                this.x = Math.max(0, Math.min(w, this.x));
            }
            if (this.y > h) {
                this.vy *= -0.6;
                this.y = h;
                this.vx *= 0.98;
            }
            if (this.y < 0) {
                this.vy *= -0.5;
                this.y = 0;
            }

            this.life -= this.decay;

            // Store trail
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > 8) this.trail.shift();
        }

        draw(ctx) {
            // Trail
            for (let i = 0; i < this.trail.length; i++) {
                const t = this.trail[i];
                const alpha = (i / this.trail.length) * this.life * 0.3;
                ctx.beginPath();
                ctx.arc(t.x, t.y, this.size * 0.5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${this.color[0]},${this.color[1]},${this.color[2]},${alpha})`;
                ctx.fill();
            }

            // Main dot with glow
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color[0]},${this.color[1]},${this.color[2]},${this.life})`;
            ctx.fill();

            // Glow
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 2.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color[0]},${this.color[1]},${this.color[2]},${this.life * 0.1})`;
            ctx.fill();
        }
    }

    function spawnParticles(x, y, count = 3, spread = 3) {
        for (let i = 0; i < count; i++) {
            const vx = (Math.random() - 0.5) * spread * 2;
            const vy = (Math.random() - 0.5) * spread * 2 - 1;
            particles.push(new Particle(x, y, vx, vy));
        }
    }

    function explode(x, y) {
        const count = 40 + Math.floor(Math.random() * 30);
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            const speed = 3 + Math.random() * 8;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            particles.push(new Particle(x, y, vx, vy));
        }
    }

    function animate() {
        const gravity = parseInt(gravityInput.value);

        ctx.fillStyle = 'rgba(10, 14, 23, 0.15)';
        ctx.fillRect(0, 0, w, h);

        if (mouseDown) {
            spawnParticles(mouseX, mouseY, 2, 4);
        }

        particles = particles.filter(p => p.life > 0);
        particles.forEach(p => {
            p.update(gravity);
            p.draw(ctx);
        });

        // Limit particles for performance
        if (particles.length > 1500) {
            particles = particles.slice(-1500);
        }

        requestAnimationFrame(animate);
    }

    canvas.addEventListener('mousedown', (e) => {
        mouseDown = true;
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });

    canvas.addEventListener('mouseup', () => { mouseDown = false; });
    canvas.addEventListener('mouseleave', () => { mouseDown = false; });

    canvas.addEventListener('dblclick', (e) => {
        const rect = canvas.getBoundingClientRect();
        explode(e.clientX - rect.left, e.clientY - rect.top);
    });

    // Touch support
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        mouseDown = true;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        mouseX = touch.clientX - rect.left;
        mouseY = touch.clientY - rect.top;
    });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        mouseX = touch.clientX - rect.left;
        mouseY = touch.clientY - rect.top;
    });

    canvas.addEventListener('touchend', () => { mouseDown = false; });

    clearBtn.addEventListener('click', () => {
        particles = [];
        ctx.clearRect(0, 0, w, h);
    });

    resize();
    animate();
    window.addEventListener('resize', resize);
}


/* ===================================================
   🌈 PSYCHEDELIC KALEIDOSCOPE
   =================================================== */
function initKaleidoscope() {
    const canvas = document.getElementById('kaleidoscope-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // --- DOM refs ---
    const symSlider = document.getElementById('kscope-symmetry');
    const brushSlider = document.getElementById('kscope-brush');
    const hueSlider = document.getElementById('kscope-hue-speed');
    const trailSlider = document.getElementById('kscope-trail');
    const glowSlider = document.getElementById('kscope-glow');
    const warpSlider = document.getElementById('kscope-warp');

    const symVal = document.getElementById('kscope-sym-val');
    const brushVal = document.getElementById('kscope-brush-val');
    const hueVal = document.getElementById('kscope-hue-val');
    const trailVal = document.getElementById('kscope-trail-val');
    const glowVal = document.getElementById('kscope-glow-val');
    const warpVal = document.getElementById('kscope-warp-val');

    const fpsEl = document.getElementById('kscope-fps');
    const hueDisplay = document.getElementById('kscope-hue-display');
    const strokesEl = document.getElementById('kscope-strokes');

    const clearBtn = document.getElementById('kscope-clear');
    const fullscreenBtn = document.getElementById('kscope-fullscreen');
    const rainbowBtn = document.getElementById('kscope-rainbow');
    const mirrorBtn = document.getElementById('kscope-mirror');
    const autoPaintBtn = document.getElementById('kscope-auto-paint');

    // --- State ---
    let w, h, cx, cy;
    let hue = 0;
    let strokeCount = 0;
    let isMouseDown = false;
    let mouseX = 0, mouseY = 0;
    let lastX = null, lastY = null;
    let rainbow = true;
    let mirror = false;
    let autoPaint = false;
    let autoTime = 0;
    let isFullscreen = false;
    let lastFrameTime = performance.now();
    let frameCount = 0;
    let displayFps = 60;

    // Burst particles for double-click
    let bursts = [];

    // --- Presets ---
    const PRESETS = {
        acid: {
            symmetry: 16, brush: 6, hueSpeed: 8, trail: 96, glow: 40, warp: 50,
            rainbow: true, mirror: false
        },
        space: {
            symmetry: 6, brush: 2, hueSpeed: 1, trail: 99, glow: 30, warp: 10,
            rainbow: true, mirror: true
        },
        neon: {
            symmetry: 12, brush: 8, hueSpeed: 15, trail: 85, glow: 55, warp: 30,
            rainbow: true, mirror: false
        },
        gold: {
            symmetry: 8, brush: 5, hueSpeed: 0, trail: 90, glow: 25, warp: 0,
            rainbow: false, mirror: true
        },
        ocean: {
            symmetry: 10, brush: 3, hueSpeed: 3, trail: 94, glow: 20, warp: 60,
            rainbow: true, mirror: false
        }
    };

    // --- Resize ---
    function resize() {
        const wrapper = canvas.parentElement;
        w = canvas.width = wrapper.offsetWidth;
        h = canvas.height = Math.max(550, wrapper.offsetHeight || 550);
        cx = w / 2;
        cy = h / 2;
        // Fill black
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
    }

    // --- Get settings ---
    function getSettings() {
        return {
            symmetry: parseInt(symSlider.value),
            brush: parseInt(brushSlider.value),
            hueSpeed: parseInt(hueSlider.value),
            trail: parseInt(trailSlider.value) / 100,
            glow: parseInt(glowSlider.value),
            warp: parseInt(warpSlider.value) / 100
        };
    }

    // --- Update value displays ---
    function updateDisplays() {
        symVal.textContent = symSlider.value;
        brushVal.textContent = brushSlider.value;
        hueVal.textContent = hueSlider.value;
        trailVal.textContent = trailSlider.value;
        glowVal.textContent = glowSlider.value;
        warpVal.textContent = warpSlider.value;
    }

    // --- The core: draw a single stroke mirrored across N symmetry axes ---
    function drawSymmetricStroke(x, y, px, py, settings) {
        const { symmetry, brush, glow } = settings;
        const angleStep = (Math.PI * 2) / symmetry;

        // Offset from center
        const dx = x - cx;
        const dy = y - cy;
        const pdx = px - cx;
        const pdy = py - cy;

        // Color
        let color;
        if (rainbow) {
            color = `hsl(${hue}, 100%, 60%)`;
        } else {
            // Gold fixed mode
            color = `hsl(45, 100%, 55%)`;
        }

        ctx.save();
        if (glow > 0) {
            ctx.shadowColor = color;
            ctx.shadowBlur = glow;
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = brush;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 0; i < symmetry; i++) {
            const angle = angleStep * i;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle);

            ctx.beginPath();
            ctx.moveTo(pdx, pdy);
            ctx.lineTo(dx, dy);
            ctx.stroke();

            // Mirror mode — reflect across the axis
            if (mirror) {
                ctx.save();
                ctx.scale(1, -1);
                ctx.beginPath();
                ctx.moveTo(pdx, pdy);
                ctx.lineTo(dx, dy);
                ctx.stroke();
                ctx.restore();
            }

            ctx.restore();
        }

        ctx.restore();
        strokeCount++;
    }

    // --- Burst effect for double-click ---
    class BurstParticle {
        constructor(x, y) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 6;
            this.x = x;
            this.y = y;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.life = 1;
            this.decay = 0.015 + Math.random() * 0.02;
            this.size = 1 + Math.random() * 3;
            this.hue = hue + Math.random() * 60;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= 0.98;
            this.vy *= 0.98;
            this.life -= this.decay;
        }
        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${this.hue}, 100%, 65%, ${this.life})`;
            ctx.shadowColor = `hsla(${this.hue}, 100%, 65%, 0.8)`;
            ctx.shadowBlur = 15;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    function spawnBurst(x, y) {
        // Also draw a kaleidoscopic burst
        const settings = getSettings();
        for (let i = 0; i < 60; i++) {
            bursts.push(new BurstParticle(x, y));
        }
        // Draw radial lines from center
        const { symmetry } = settings;
        const angleStep = (Math.PI * 2) / symmetry;
        ctx.save();
        ctx.globalAlpha = 0.7;
        for (let i = 0; i < symmetry; i++) {
            const angle = angleStep * i;
            const len = 40 + Math.random() * 80;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(
                cx + Math.cos(angle) * len,
                cy + Math.sin(angle) * len
            );
            ctx.strokeStyle = `hsl(${hue + i * 15}, 100%, 60%)`;
            ctx.lineWidth = 2;
            ctx.shadowColor = `hsl(${hue + i * 15}, 100%, 60%)`;
            ctx.shadowBlur = 20;
            ctx.stroke();
        }
        ctx.restore();
    }

    // --- Main animation loop ---
    function animate() {
        const settings = getSettings();

        // --- Trail fade ---
        ctx.globalCompositeOperation = 'source-over';
        const fadeAlpha = 1 - settings.trail;
        if (fadeAlpha > 0.001) {
            ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
            ctx.fillRect(0, 0, w, h);
        }

        // --- Warp distortion ---
        if (settings.warp > 0.01) {
            const warpAmount = settings.warp * 3;
            // Use a small pixel shift to create a swirl effect
            ctx.save();
            ctx.globalAlpha = 0.95;
            ctx.translate(cx, cy);
            ctx.rotate(settings.warp * 0.002);
            ctx.scale(1 - settings.warp * 0.0005, 1 - settings.warp * 0.0005);
            ctx.translate(-cx, -cy);
            ctx.drawImage(canvas, 0, 0);
            ctx.restore();
        }

        // --- Hue cycle ---
        hue = (hue + settings.hueSpeed * 0.5) % 360;

        // --- Auto-paint mode ---
        if (autoPaint) {
            autoTime += 0.02;
            // Lissajous curve for trippy patterns
            const ax = cx + Math.sin(autoTime * 1.3) * (w * 0.35) * Math.cos(autoTime * 0.7);
            const ay = cy + Math.cos(autoTime * 0.9) * (h * 0.35) * Math.sin(autoTime * 0.5);

            if (lastX !== null) {
                drawSymmetricStroke(ax, ay, lastX, lastY, settings);
            }
            lastX = ax;
            lastY = ay;
        }

        // --- Mouse painting ---
        if (isMouseDown && !autoPaint) {
            if (lastX !== null) {
                drawSymmetricStroke(mouseX, mouseY, lastX, lastY, settings);
            }
            lastX = mouseX;
            lastY = mouseY;
        }

        // --- Update & draw bursts ---
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        bursts = bursts.filter(b => b.life > 0);
        bursts.forEach(b => {
            b.update();
            b.draw(ctx);
        });
        ctx.restore();

        // --- FPS counter ---
        frameCount++;
        const now = performance.now();
        if (now - lastFrameTime >= 1000) {
            displayFps = frameCount;
            frameCount = 0;
            lastFrameTime = now;
            fpsEl.textContent = displayFps;
        }

        // --- HUD ---
        hueDisplay.textContent = Math.round(hue) + '°';
        strokesEl.textContent = strokeCount.toLocaleString();

        requestAnimationFrame(animate);
    }

    // --- Event: slider changes ---
    [symSlider, brushSlider, hueSlider, trailSlider, glowSlider, warpSlider].forEach(s => {
        s.addEventListener('input', updateDisplays);
    });

    // --- Event: mouse ---
    canvas.addEventListener('mousedown', (e) => {
        isMouseDown = true;
        const rect = canvas.getBoundingClientRect();
        mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
        mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
        lastX = mouseX;
        lastY = mouseY;
    });

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
        mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

        // If mouse is moving and pressed, draw
        if (isMouseDown && lastX !== null && !autoPaint) {
            drawSymmetricStroke(mouseX, mouseY, lastX, lastY, getSettings());
            lastX = mouseX;
            lastY = mouseY;
        }
    });

    canvas.addEventListener('mouseup', () => {
        isMouseDown = false;
        lastX = null;
        lastY = null;
    });

    canvas.addEventListener('mouseleave', () => {
        isMouseDown = false;
        lastX = null;
        lastY = null;
    });

    // --- Event: double-click burst ---
    canvas.addEventListener('dblclick', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);
        spawnBurst(x, y);
    });

    // --- Event: scroll to resize brush ---
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        let val = parseInt(brushSlider.value);
        val += (e.deltaY > 0 ? -1 : 1);
        val = Math.max(1, Math.min(30, val));
        brushSlider.value = val;
        updateDisplays();
    }, { passive: false });

    // --- Event: touch support ---
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isMouseDown = true;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        mouseX = (touch.clientX - rect.left) * (canvas.width / rect.width);
        mouseY = (touch.clientY - rect.top) * (canvas.height / rect.height);
        lastX = mouseX;
        lastY = mouseY;
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        mouseX = (touch.clientX - rect.left) * (canvas.width / rect.width);
        mouseY = (touch.clientY - rect.top) * (canvas.height / rect.height);
        if (lastX !== null && !autoPaint) {
            drawSymmetricStroke(mouseX, mouseY, lastX, lastY, getSettings());
            lastX = mouseX;
            lastY = mouseY;
        }
    }, { passive: false });

    canvas.addEventListener('touchend', () => {
        isMouseDown = false;
        lastX = null;
        lastY = null;
    });

    // --- Toggles ---
    rainbowBtn.addEventListener('click', () => {
        rainbow = !rainbow;
        rainbowBtn.classList.toggle('active', rainbow);
    });

    mirrorBtn.addEventListener('click', () => {
        mirror = !mirror;
        mirrorBtn.classList.toggle('active', mirror);
    });

    autoPaintBtn.addEventListener('click', () => {
        autoPaint = !autoPaint;
        autoPaintBtn.classList.toggle('active', autoPaint);
        if (autoPaint) {
            lastX = null;
            lastY = null;
            autoTime = Math.random() * 100; // Random start for variety
        }
    });

    // --- Clear ---
    clearBtn.addEventListener('click', () => {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
        strokeCount = 0;
        bursts = [];
        lastX = null;
        lastY = null;
    });

    // --- Fullscreen ---
    fullscreenBtn.addEventListener('click', () => {
        const wrapper = canvas.parentElement;
        isFullscreen = !isFullscreen;
        wrapper.classList.toggle('kscope-fullscreen-active', isFullscreen);
        fullscreenBtn.textContent = isFullscreen ? '✕ Exit' : '⛶ Expand';

        // Need to re-measure after layout change
        setTimeout(() => {
            resize();
        }, 100);
    });

    // ESC to exit fullscreen
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isFullscreen) {
            isFullscreen = false;
            const wrapper = canvas.parentElement;
            wrapper.classList.remove('kscope-fullscreen-active');
            fullscreenBtn.textContent = '⛶ Expand';
            setTimeout(resize, 100);
        }
    });

    // --- Presets ---
    document.querySelectorAll('.kscope-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = PRESETS[btn.dataset.preset];
            if (!preset) return;

            // Apply values
            symSlider.value = preset.symmetry;
            brushSlider.value = preset.brush;
            hueSlider.value = preset.hueSpeed;
            trailSlider.value = preset.trail;
            glowSlider.value = preset.glow;
            warpSlider.value = preset.warp;

            rainbow = preset.rainbow;
            mirror = preset.mirror;
            rainbowBtn.classList.toggle('active', rainbow);
            mirrorBtn.classList.toggle('active', mirror);

            updateDisplays();

            // Clear canvas for fresh preset experience
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, w, h);
            strokeCount = 0;
            lastX = null;
            lastY = null;

            // Highlight active preset
            document.querySelectorAll('.kscope-preset').forEach(b => b.classList.remove('active-preset'));
            btn.classList.add('active-preset');

            // Auto-enable auto-paint for instant gratification
            if (!autoPaint) {
                autoPaint = true;
                autoPaintBtn.classList.add('active');
                autoTime = Math.random() * 100;
            }
        });
    });

    // --- Init ---
    resize();
    updateDisplays();
    animate();
    window.addEventListener('resize', resize);
}
