/* ============================================
   🎨 GENERATIVE ART STUDIO
   Flow Fields · Strange Attractors ·
   Reaction-Diffusion · L-Systems · PNG Export
   Standalone full-page + embedded support
   ============================================ */

function initGenerativeArt() {
    const canvas = document.getElementById('genart-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // --- Full-page mode detection ---
    const isFullPage = document.body.classList.contains('viz-fullpage');

    // --- Onboarding overlay ---
    const onboarding = document.getElementById('genart-onboarding');
    if (onboarding) {
        onboarding.addEventListener('click', () => onboarding.classList.add('hidden'));
    }

    // --- Panel toggle ---
    const panelToggle = document.getElementById('genart-toggle');
    const panel = document.getElementById('genart-panel');
    if (panelToggle && panel) {
        panelToggle.addEventListener('click', () => {
            panel.classList.toggle('collapsed');
            panelToggle.textContent = panel.classList.contains('collapsed') ? '☰' : '✕';
        });
    }

    let currentAlgo = 'flowfield';
    let animId = null;
    let time = 0;
    let hue = 0;
    let isRunning = false;

    // --- Resize ---
    function resize() {
        if (isFullPage) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        } else {
            const wrapper = canvas.parentElement;
            canvas.width = wrapper.clientWidth;
            canvas.height = wrapper.clientHeight || 550;
        }
    }

    // ==========================================
    //  1. FLOW FIELDS (Perlin Noise)
    // ==========================================

    // Simplex-like noise (simplified Perlin)
    const PERM = new Uint8Array(512);
    (function initPerm() {
        const p = [];
        for (let i = 0; i < 256; i++) p[i] = i;
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [p[i], p[j]] = [p[j], p[i]];
        }
        for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
    })();

    function noise2D(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const xf = x - Math.floor(x);
        const yf = y - Math.floor(y);
        const u = xf * xf * (3 - 2 * xf);
        const v = yf * yf * (3 - 2 * yf);

        const aa = PERM[PERM[X] + Y];
        const ab = PERM[PERM[X] + Y + 1];
        const ba = PERM[PERM[X + 1] + Y];
        const bb = PERM[PERM[X + 1] + Y + 1];

        const g = (hash, x, y) => {
            const h = hash & 3;
            return (h === 0 ? x + y : h === 1 ? -x + y : h === 2 ? x - y : -x - y);
        };

        const lerp = (a, b, t) => a + t * (b - a);
        return lerp(
            lerp(g(aa, xf, yf), g(ba, xf - 1, yf), u),
            lerp(g(ab, xf, yf - 1), g(bb, xf - 1, yf - 1), u),
            v
        );
    }

    let ffParticles = [];
    let ffNoiseScale = 0.005;
    let ffParticleCount = 2000;
    let ffSpeed = 2;

    function initFlowField() {
        ffParticles = [];
        for (let i = 0; i < ffParticleCount; i++) {
            ffParticles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                prevX: 0,
                prevY: 0,
                life: Math.random() * 200 + 100,
                hue: Math.random() * 60
            });
        }
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function renderFlowField() {
        // Subtle fade for trails
        ctx.fillStyle = 'rgba(0, 0, 0, 0.01)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ffParticles.forEach(p => {
            p.prevX = p.x;
            p.prevY = p.y;

            const angle = noise2D(p.x * ffNoiseScale, p.y * ffNoiseScale + time * 0.0005) * Math.PI * 4;
            p.x += Math.cos(angle) * ffSpeed;
            p.y += Math.sin(angle) * ffSpeed;
            p.life--;

            if (p.life <= 0 || p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
                p.x = Math.random() * canvas.width;
                p.y = Math.random() * canvas.height;
                p.prevX = p.x;
                p.prevY = p.y;
                p.life = Math.random() * 200 + 100;
                p.hue = Math.random() * 60;
            }

            ctx.beginPath();
            ctx.moveTo(p.prevX, p.prevY);
            ctx.lineTo(p.x, p.y);
            ctx.strokeStyle = `hsla(${(hue + p.hue) % 360}, 80%, 60%, 0.15)`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
        });
    }

    // ==========================================
    //  2. STRANGE ATTRACTORS
    // ==========================================
    let attractorType = 'lorenz';
    let attractorPoints = [];
    let attX = 0.1, attY = 0, attZ = 0;
    let attractorSpeed = 1;
    let attractorTrailLen = 5000;

    const ATTRACTORS = {
        lorenz: {
            name: 'Lorenz',
            step: (x, y, z, dt) => ({
                dx: 10 * (y - x) * dt,
                dy: (x * (28 - z) - y) * dt,
                dz: (x * y - 8 / 3 * z) * dt
            }),
            scale: 9,
            init: () => ({ x: 0.1, y: 0, z: 0 })
        },
        aizawa: {
            name: 'Aizawa',
            step: (x, y, z, dt) => ({
                dx: ((z - 0.7) * x - 3.5 * y) * dt,
                dy: (3.5 * x + (z - 0.7) * y) * dt,
                dz: (0.6 + 0.95 * z - z * z * z / 3 - (x * x + y * y) * (1 + 0.25 * z) + 0.1 * z * x * x * x) * dt
            }),
            scale: 180,
            init: () => ({ x: 0.1, y: 0, z: 0 })
        },
        thomas: {
            name: 'Thomas',
            step: (x, y, z, dt) => ({
                dx: (Math.sin(y) - 0.208186 * x) * dt,
                dy: (Math.sin(z) - 0.208186 * y) * dt,
                dz: (Math.sin(x) - 0.208186 * z) * dt
            }),
            scale: 100,
            init: () => ({ x: 0.1, y: 0, z: 0 })
        },
        halvorsen: {
            name: 'Halvorsen',
            step: (x, y, z, dt) => ({
                dx: (-1.89 * x - 4 * y - 4 * z - y * y) * dt,
                dy: (-1.89 * y - 4 * z - 4 * x - z * z) * dt,
                dz: (-1.89 * z - 4 * x - 4 * y - x * x) * dt
            }),
            scale: 18,
            init: () => ({ x: -1.48, y: -1.51, z: 2.04 })
        }
    };

    function initAttractor() {
        const att = ATTRACTORS[attractorType];
        const init = att.init();
        attX = init.x;
        attY = init.y;
        attZ = init.z;
        attractorPoints = [];
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function renderAttractor() {
        const att = ATTRACTORS[attractorType];
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const dt = 0.005 * attractorSpeed;

        // Compute many points per frame for density
        for (let i = 0; i < 50; i++) {
            const d = att.step(attX, attY, attZ, dt);
            attX += d.dx;
            attY += d.dy;
            attZ += d.dz;

            // Project 3D to 2D with slight rotation
            const rotAngle = time * 0.0002;
            const px = attX * Math.cos(rotAngle) - attZ * Math.sin(rotAngle);
            const py = attY;

            attractorPoints.push({
                x: cx + px * att.scale,
                y: cy + py * att.scale,
                z: attZ
            });
        }

        // Keep trail length
        while (attractorPoints.length > attractorTrailLen) {
            attractorPoints.shift();
        }

        // Fade
        ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw points
        attractorPoints.forEach((p, i) => {
            const t = i / attractorPoints.length;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 0.8, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${(hue + t * 120 + p.z * 5) % 360}, 90%, ${50 + t * 30}%, ${0.3 + t * 0.5})`;
            ctx.fill();
        });
    }

    // ==========================================
    //  3. REACTION-DIFFUSION (Gray-Scott)
    // ==========================================
    const RD_W = 200;
    const RD_H = 200;
    let gridA, gridB, nextA, nextB;
    let rdFeed = 0.055;
    let rdKill = 0.062;
    let rdDA = 1.0;
    let rdDB = 0.5;

    function initReactionDiffusion() {
        gridA = new Float32Array(RD_W * RD_H).fill(1);
        gridB = new Float32Array(RD_W * RD_H).fill(0);
        nextA = new Float32Array(RD_W * RD_H);
        nextB = new Float32Array(RD_W * RD_H);

        // Seed with random spots of chemical B
        for (let k = 0; k < 20; k++) {
            const sx = Math.floor(Math.random() * (RD_W - 20)) + 10;
            const sy = Math.floor(Math.random() * (RD_H - 20)) + 10;
            for (let di = -5; di <= 5; di++) {
                for (let dj = -5; dj <= 5; dj++) {
                    const idx = (sy + dj) * RD_W + (sx + di);
                    if (idx >= 0 && idx < RD_W * RD_H) {
                        gridB[idx] = 1;
                    }
                }
            }
        }
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function renderReactionDiffusion() {
        // Simulate multiple steps per frame
        for (let step = 0; step < 8; step++) {
            for (let y = 1; y < RD_H - 1; y++) {
                for (let x = 1; x < RD_W - 1; x++) {
                    const idx = y * RD_W + x;
                    const a = gridA[idx];
                    const b = gridB[idx];

                    // Laplacian
                    const lapA = gridA[idx - 1] + gridA[idx + 1] + gridA[idx - RD_W] + gridA[idx + RD_W]
                        - 4 * a;
                    const lapB = gridB[idx - 1] + gridB[idx + 1] + gridB[idx - RD_W] + gridB[idx + RD_W]
                        - 4 * b;

                    const reaction = a * b * b;
                    nextA[idx] = a + (rdDA * lapA - reaction + rdFeed * (1 - a)) * 0.9;
                    nextB[idx] = b + (rdDB * lapB + reaction - (rdKill + rdFeed) * b) * 0.9;

                    nextA[idx] = Math.max(0, Math.min(1, nextA[idx]));
                    nextB[idx] = Math.max(0, Math.min(1, nextB[idx]));
                }
            }

            // Swap
            [gridA, nextA] = [nextA, gridA];
            [gridB, nextB] = [nextB, gridB];
        }

        // Render
        const img = ctx.createImageData(canvas.width, canvas.height);
        const data = img.data;
        const cw = canvas.width;
        const ch = canvas.height;

        for (let py = 0; py < ch; py++) {
            for (let px = 0; px < cw; px++) {
                const gx = Math.floor((px / cw) * RD_W);
                const gy = Math.floor((py / ch) * RD_H);
                const idx = gy * RD_W + gx;
                const val = gridA[idx] - gridB[idx];
                const v = Math.max(0, Math.min(1, val));

                const pi = (py * cw + px) * 4;

                // Color mapping
                const h = (hue + v * 120) % 360;
                const s = 0.8;
                const l = v * 0.6 + 0.1;
                const rgb = hslToRgbGenart(h / 360, s, l);
                data[pi] = rgb[0] * 255;
                data[pi + 1] = rgb[1] * 255;
                data[pi + 2] = rgb[2] * 255;
                data[pi + 3] = 255;
            }
        }
        ctx.putImageData(img, 0, 0);
    }

    function hslToRgbGenart(h, s, l) {
        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        return [r, g, b];
    }

    // ==========================================
    //  4. L-SYSTEMS (Fractal Trees/Plants)
    // ==========================================
    let lsIterations = 5;
    let lsAngle = 25;
    let lsAxiom = 'F';
    let lsRules = { 'F': 'F[+F]F[-F]F' };
    let lsString = '';

    const LS_PRESETS = {
        tree: { axiom: 'F', rules: { 'F': 'FF+[+F-F-F]-[-F+F+F]' }, angle: 22, iter: 4 },
        bush: { axiom: 'F', rules: { 'F': 'F[+F]F[-F]F' }, angle: 25.7, iter: 5 },
        fern: { axiom: 'X', rules: { 'X': 'F+[[X]-X]-F[-FX]+X', 'F': 'FF' }, angle: 25, iter: 6 },
        snowflake: { axiom: 'F++F++F', rules: { 'F': 'F-F++F-F' }, angle: 60, iter: 4 }
    };

    function generateLSystem() {
        lsString = lsAxiom;
        for (let i = 0; i < lsIterations; i++) {
            let next = '';
            for (const ch of lsString) {
                next += lsRules[ch] || ch;
            }
            lsString = next;
        }
    }

    function renderLSystem() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        generateLSystem();

        // Calculate bounds first for auto-scaling
        let minX = 0, maxX = 0, minY = 0, maxY = 0;
        let x = 0, y = 0, angle = -90;
        const stack = [];

        for (const ch of lsString) {
            if (ch === 'F') {
                const nx = x + Math.cos(angle * Math.PI / 180);
                const ny = y + Math.sin(angle * Math.PI / 180);
                x = nx; y = ny;
                minX = Math.min(minX, x); maxX = Math.max(maxX, x);
                minY = Math.min(minY, y); maxY = Math.max(maxY, y);
            } else if (ch === '+') angle += lsAngle;
            else if (ch === '-') angle -= lsAngle;
            else if (ch === '[') stack.push({ x, y, angle });
            else if (ch === ']') { const s = stack.pop(); x = s.x; y = s.y; angle = s.angle; }
        }

        const boundsW = maxX - minX || 1;
        const boundsH = maxY - minY || 1;
        const scale = Math.min(canvas.width * 0.85 / boundsW, canvas.height * 0.85 / boundsH);
        const offsetX = canvas.width / 2 - ((minX + maxX) / 2) * scale;
        const offsetY = canvas.height / 2 - ((minY + maxY) / 2) * scale;

        // Draw
        x = 0; y = 0; angle = -90;
        stack.length = 0;
        let steps = 0;
        const totalSteps = lsString.replace(/[^F]/g, '').length || 1;

        ctx.lineCap = 'round';

        for (const ch of lsString) {
            if (ch === 'F') {
                const nx = x + Math.cos(angle * Math.PI / 180);
                const ny = y + Math.sin(angle * Math.PI / 180);

                ctx.beginPath();
                ctx.moveTo(x * scale + offsetX, y * scale + offsetY);
                ctx.lineTo(nx * scale + offsetX, ny * scale + offsetY);

                const t = steps / totalSteps;
                const depth = stack.length;
                ctx.strokeStyle = `hsl(${(hue + t * 150) % 360}, ${70 + depth * 5}%, ${40 + t * 30}%)`;
                ctx.lineWidth = Math.max(0.5, 3 - depth * 0.4);
                ctx.shadowColor = `hsla(${(hue + t * 150) % 360}, 100%, 60%, 0.4)`;
                ctx.shadowBlur = 5;
                ctx.stroke();

                x = nx; y = ny;
                steps++;
            } else if (ch === '+') angle += lsAngle + (Math.random() - 0.5) * 5;
            else if (ch === '-') angle -= lsAngle + (Math.random() - 0.5) * 5;
            else if (ch === '[') stack.push({ x, y, angle });
            else if (ch === ']') { const s = stack.pop(); x = s.x; y = s.y; angle = s.angle; }
        }
        ctx.shadowBlur = 0;
    }

    // ==========================================
    //  ALGORITHM MAP
    // ==========================================
    const ALGOS = {
        flowfield: { name: 'Flow Fields', init: initFlowField, render: renderFlowField, animated: true },
        attractor: { name: 'Strange Attractors', init: initAttractor, render: renderAttractor, animated: true },
        reaction: { name: 'Reaction-Diffusion', init: initReactionDiffusion, render: renderReactionDiffusion, animated: true },
        lsystem: { name: 'L-Systems', init: () => { }, render: renderLSystem, animated: false }
    };

    function switchAlgorithm(algo) {
        currentAlgo = algo;
        if (animId) cancelAnimationFrame(animId);

        // Update tab buttons
        document.querySelectorAll('.genart-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.algo === algo);
        });

        // Show correct control group
        document.querySelectorAll('.genart-algo-controls').forEach(el => el.style.display = 'none');
        const controls = document.getElementById(`genart-controls-${algo}`);
        if (controls) controls.style.display = 'flex';

        ALGOS[algo].init();
        if (ALGOS[algo].animated) {
            isRunning = true;
            animate();
        } else {
            isRunning = false;
            ALGOS[algo].render();
        }
    }

    // ==========================================
    //  ANIMATION LOOP
    // ==========================================
    function animate() {
        if (!isRunning) return;
        animId = requestAnimationFrame(animate);
        time++;
        hue = (hue + 0.3) % 360;
        ALGOS[currentAlgo].render();
    }

    // ==========================================
    //  PNG EXPORT
    // ==========================================
    function exportPNG() {
        const link = document.createElement('a');
        link.download = `pythonmagic-${currentAlgo}-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    // ==========================================
    //  EVENT LISTENERS
    // ==========================================

    // Tab buttons
    document.querySelectorAll('.genart-tab').forEach(btn => {
        btn.addEventListener('click', () => switchAlgorithm(btn.dataset.algo));
    });

    // Export button
    const exportBtn = document.getElementById('genart-export');
    if (exportBtn) exportBtn.addEventListener('click', exportPNG);

    // Randomize button
    const randBtn = document.getElementById('genart-randomize');
    if (randBtn) {
        randBtn.addEventListener('click', () => {
            hue = Math.random() * 360;
            // Re-init noise for flow fields
            for (let i = 255; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [PERM[i], PERM[j]] = [PERM[j], PERM[i]];
            }
            for (let i = 256; i < 512; i++) PERM[i] = PERM[i & 255];

            ALGOS[currentAlgo].init();
            if (!ALGOS[currentAlgo].animated) {
                ALGOS[currentAlgo].render();
            }
        });
    }

    // --- Flow Field Controls ---
    const ffScaleSlider = document.getElementById('genart-ff-scale');
    if (ffScaleSlider) ffScaleSlider.addEventListener('input', () => {
        ffNoiseScale = parseFloat(ffScaleSlider.value) / 1000;
        document.getElementById('genart-ff-scale-val').textContent = ffScaleSlider.value;
    });

    const ffCountSlider = document.getElementById('genart-ff-count');
    if (ffCountSlider) ffCountSlider.addEventListener('input', () => {
        ffParticleCount = parseInt(ffCountSlider.value);
        document.getElementById('genart-ff-count-val').textContent = ffCountSlider.value;
        initFlowField();
    });

    const ffSpeedSlider = document.getElementById('genart-ff-speed');
    if (ffSpeedSlider) ffSpeedSlider.addEventListener('input', () => {
        ffSpeed = parseFloat(ffSpeedSlider.value) / 10;
        document.getElementById('genart-ff-speed-val').textContent = ffSpeedSlider.value;
    });

    // --- Attractor Controls ---
    document.querySelectorAll('.genart-attractor-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            attractorType = btn.dataset.type;
            document.querySelectorAll('.genart-attractor-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            initAttractor();
        });
    });

    const attSpeedSlider = document.getElementById('genart-att-speed');
    if (attSpeedSlider) attSpeedSlider.addEventListener('input', () => {
        attractorSpeed = parseFloat(attSpeedSlider.value) / 10;
        document.getElementById('genart-att-speed-val').textContent = attSpeedSlider.value;
    });

    const attTrailSlider = document.getElementById('genart-att-trail');
    if (attTrailSlider) attTrailSlider.addEventListener('input', () => {
        attractorTrailLen = parseInt(attTrailSlider.value);
        document.getElementById('genart-att-trail-val').textContent = attTrailSlider.value;
    });

    // --- Reaction-Diffusion Controls ---
    const rdFeedSlider = document.getElementById('genart-rd-feed');
    if (rdFeedSlider) rdFeedSlider.addEventListener('input', () => {
        rdFeed = parseFloat(rdFeedSlider.value) / 1000;
        document.getElementById('genart-rd-feed-val').textContent = rdFeedSlider.value;
    });

    const rdKillSlider = document.getElementById('genart-rd-kill');
    if (rdKillSlider) rdKillSlider.addEventListener('input', () => {
        rdKill = parseFloat(rdKillSlider.value) / 1000;
        document.getElementById('genart-rd-kill-val').textContent = rdKillSlider.value;
    });

    // Reaction-diffusion presets
    document.querySelectorAll('.genart-rd-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            const presets = {
                mitosis: { feed: 0.0367, kill: 0.0649 },
                coral: { feed: 0.0545, kill: 0.062 },
                maze: { feed: 0.029, kill: 0.057 },
                spots: { feed: 0.034, kill: 0.0618 }
            };
            const p = presets[btn.dataset.rdpreset];
            if (!p) return;
            rdFeed = p.feed;
            rdKill = p.kill;
            if (rdFeedSlider) { rdFeedSlider.value = Math.round(rdFeed * 1000); document.getElementById('genart-rd-feed-val').textContent = rdFeedSlider.value; }
            if (rdKillSlider) { rdKillSlider.value = Math.round(rdKill * 1000); document.getElementById('genart-rd-kill-val').textContent = rdKillSlider.value; }
            document.querySelectorAll('.genart-rd-preset').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            initReactionDiffusion();
        });
    });

    // --- L-System Controls ---
    document.querySelectorAll('.genart-ls-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            const p = LS_PRESETS[btn.dataset.lspreset];
            if (!p) return;
            lsAxiom = p.axiom;
            lsRules = { ...p.rules };
            lsAngle = p.angle;
            lsIterations = p.iter;

            document.querySelectorAll('.genart-ls-preset').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const angleSlider = document.getElementById('genart-ls-angle');
            if (angleSlider) { angleSlider.value = lsAngle; document.getElementById('genart-ls-angle-val').textContent = lsAngle; }
            const iterSlider = document.getElementById('genart-ls-iter');
            if (iterSlider) { iterSlider.value = lsIterations; document.getElementById('genart-ls-iter-val').textContent = lsIterations; }

            renderLSystem();
        });
    });

    const lsAngleSlider = document.getElementById('genart-ls-angle');
    if (lsAngleSlider) lsAngleSlider.addEventListener('input', () => {
        lsAngle = parseFloat(lsAngleSlider.value);
        document.getElementById('genart-ls-angle-val').textContent = lsAngle;
        renderLSystem();
    });

    const lsIterSlider = document.getElementById('genart-ls-iter');
    if (lsIterSlider) lsIterSlider.addEventListener('input', () => {
        lsIterations = parseInt(lsIterSlider.value);
        document.getElementById('genart-ls-iter-val').textContent = lsIterations;
        renderLSystem();
    });

    // Init
    resize();
    switchAlgorithm('flowfield');
    window.addEventListener('resize', () => {
        resize();
        if (!ALGOS[currentAlgo].animated) {
            ALGOS[currentAlgo].init();
            ALGOS[currentAlgo].render();
        }
    });
}

// --- Auto-init for standalone page ---
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('genart-canvas')) initGenerativeArt();
});
