/* ============================================
   🎵 AUDIO-REACTIVE VISUALIZER
   Web Audio API · FFT Analysis · 6 Render Modes
   Standalone full-page + embedded support
   ============================================ */

function initAudioVisualizer() {
    const canvas = document.getElementById('audio-canvas');
    if (!canvas) return;

    // --- Full-page mode detection ---
    const isFullPage = document.body.classList.contains('viz-fullpage');

    // --- Onboarding overlay ---
    const onboarding = document.getElementById('audio-onboarding');
    if (onboarding) {
        onboarding.addEventListener('click', () => onboarding.classList.add('hidden'));
    }

    // --- Panel toggle ---
    const panelToggle = document.getElementById('audio-toggle');
    const panel = document.getElementById('audio-panel');
    if (panelToggle && panel) {
        panelToggle.addEventListener('click', () => {
            panel.classList.toggle('collapsed');
            panelToggle.textContent = panel.classList.contains('collapsed') ? '☰' : '✕';
        });
    }
    const ctx = canvas.getContext('2d');

    // --- Audio State ---
    let audioCtx = null;
    let analyser = null;
    let dataArray = new Uint8Array(256); // Pre-init with empty buffer
    let source = null;
    let micStream = null;
    let isListening = false;
    let currentMode = 'radial';
    let sensitivity = 1.5;
    let reactivity = 0.8;
    let smoothing = 0.8;
    let colorScheme = 'neon';
    let hue = 0;
    let time = 0;
    let frameCount = 0;

    // --- Color Schemes ---
    const COLOR_SCHEMES = {
        neon: { bg: '#000', colors: i => `hsl(${(i * 3 + hue) % 360}, 100%, 60%)`, glow: 'rgba(0,255,200,0.3)' },
        sunset: { bg: '#0a0005', colors: i => `hsl(${(i * 0.8 + 10) % 60}, 100%, ${50 + Math.sin(i * 0.1) * 20}%)`, glow: 'rgba(255,100,0,0.3)' },
        arctic: { bg: '#000a14', colors: i => `hsl(${190 + (i * 0.5 + hue * 0.3) % 40}, 80%, ${55 + Math.sin(i * 0.15) * 25}%)`, glow: 'rgba(100,200,255,0.3)' },
        vapor: { bg: '#0a000a', colors: i => `hsl(${(280 + i * 2 + hue) % 360}, 90%, 65%)`, glow: 'rgba(200,0,255,0.3)' }
    };

    // --- Resize ---
    function resize() {
        if (isFullPage) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        } else {
            const wrapper = canvas.parentElement;
            canvas.width = wrapper.clientWidth;
            canvas.height = wrapper.clientHeight || 500;
        }
    }

    // --- Init Audio Context ---
    async function initAudio() {
        if (audioCtx) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = smoothing;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
    }

    // --- Mic Input ---
    async function startMic() {
        try {
            await initAudio();
            if (micStream) {
                micStream.getTracks().forEach(t => t.stop());
            }
            micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (source) source.disconnect();
            source = audioCtx.createMediaStreamSource(micStream);
            source.connect(analyser);
            isListening = true;
            updateMicButton(true);
        } catch (e) {
            console.warn('Mic access denied:', e);
            // Fallback to demo mode
            startDemoMode();
        }
    }

    function stopMic() {
        if (micStream) {
            micStream.getTracks().forEach(t => t.stop());
            micStream = null;
        }
        if (source) {
            source.disconnect();
            source = null;
        }
        isListening = false;
        updateMicButton(false);
    }

    function updateMicButton(active) {
        const btn = document.getElementById('audio-mic-btn');
        if (btn) {
            btn.classList.toggle('active', active);
            btn.textContent = active ? '🎤 Listening' : '🎤 Mic Off';
        }
    }

    // --- Demo Mode: generate fake audio data for when no mic ---
    let demoMode = false;
    function startDemoMode() {
        demoMode = true;
        isListening = true;
        if (!dataArray) dataArray = new Uint8Array(256);
        updateMicButton(true);
        const btn = document.getElementById('audio-mic-btn');
        if (btn) btn.textContent = '🎤 Demo Mode';
    }

    function generateDemoData() {
        if (!dataArray) return;
        const t = time * 0.02;
        for (let i = 0; i < dataArray.length; i++) {
            const bass = i < 10 ? 180 + Math.sin(t * 2.5 + i * 0.3) * 70 : 0;
            const mid = (i > 10 && i < 80) ? 120 + Math.sin(t * 3.7 + i * 0.15) * 80 : 0;
            const high = i > 80 ? 60 + Math.sin(t * 5.1 + i * 0.08) * 50 : 0;
            const pulse = Math.sin(t * 1.2) * 30;
            dataArray[i] = Math.max(0, Math.min(255, bass + mid + high + pulse + Math.random() * 15));
        }
    }

    // --- Get frequency data ---
    function getFrequencyData() {
        if (demoMode) {
            generateDemoData();
            return;
        }
        if (analyser) {
            analyser.getByteFrequencyData(dataArray);
        }
    }

    // =========================================
    //  RENDER MODE 1: RADIAL SPECTRUM
    // =========================================
    function renderRadial() {
        const scheme = COLOR_SCHEMES[colorScheme];
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const bars = dataArray.length;
        const baseRadius = Math.min(cx, cy) * 0.25;

        // Background pulse with bass
        const bassAvg = dataArray.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
        const pulse = bassAvg / 255 * sensitivity;

        // Draw ring of bars
        for (let i = 0; i < bars; i++) {
            const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
            const val = dataArray[i] / 255 * sensitivity;
            const barHeight = val * Math.min(cx, cy) * 0.55;

            const x1 = cx + Math.cos(angle) * (baseRadius + pulse * 15);
            const y1 = cy + Math.sin(angle) * (baseRadius + pulse * 15);
            const x2 = cx + Math.cos(angle) * (baseRadius + barHeight);
            const y2 = cy + Math.sin(angle) * (baseRadius + barHeight);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = scheme.colors(i);
            ctx.lineWidth = Math.max(1, (canvas.width / bars) * 0.6);
            ctx.shadowColor = scheme.colors(i);
            ctx.shadowBlur = 8 + val * 12;
            ctx.stroke();
        }

        // Center glow
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius + pulse * 20);
        gradient.addColorStop(0, `hsla(${hue}, 100%, 70%, ${0.15 + pulse * 0.2})`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.shadowBlur = 0;
    }

    // =========================================
    //  RENDER MODE 2: WAVEFORM TERRAIN
    // =========================================
    function renderTerrain() {
        const scheme = COLOR_SCHEMES[colorScheme];
        const layers = 12;
        const w = canvas.width;
        const h = canvas.height;

        for (let l = layers - 1; l >= 0; l--) {
            const layerOffset = l * (h / (layers + 2));
            const yBase = h * 0.3 + layerOffset * 0.6;
            const alpha = 0.4 + (1 - l / layers) * 0.6;

            ctx.beginPath();
            ctx.moveTo(0, h);

            for (let i = 0; i < dataArray.length; i++) {
                const x = (i / dataArray.length) * w;
                const val = dataArray[i] / 255 * sensitivity;
                const wave = Math.sin(i * 0.05 + time * 0.01 + l * 0.5) * 20;
                const y = yBase - val * (h * 0.25) * reactivity + wave;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }

            ctx.lineTo(w, h);
            ctx.closePath();

            const grad = ctx.createLinearGradient(0, yBase - h * 0.3, 0, yBase);
            grad.addColorStop(0, `hsla(${(hue + l * 25) % 360}, 80%, 55%, ${alpha})`);
            grad.addColorStop(1, `hsla(${(hue + l * 25 + 30) % 360}, 60%, 20%, ${alpha * 0.3})`);
            ctx.fillStyle = grad;
            ctx.fill();

            ctx.strokeStyle = `hsla(${(hue + l * 25) % 360}, 100%, 70%, ${alpha * 0.6})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }

    // =========================================
    //  RENDER MODE 3: PLASMA ORBS
    // =========================================
    let orbs = [];
    function initOrbs() {
        orbs = [];
        for (let i = 0; i < 24; i++) {
            orbs.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                baseSize: 15 + Math.random() * 40,
                freqBand: Math.floor(Math.random() * dataArray.length),
                speedX: (Math.random() - 0.5) * 1.5,
                speedY: (Math.random() - 0.5) * 1.5,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    function renderOrbs() {
        const scheme = COLOR_SCHEMES[colorScheme];

        orbs.forEach((orb, idx) => {
            const val = (dataArray[orb.freqBand] || 0) / 255 * sensitivity;
            const size = orb.baseSize * (0.5 + val * 1.5) * reactivity;

            orb.x += orb.speedX + Math.sin(time * 0.005 + orb.phase) * 0.5;
            orb.y += orb.speedY + Math.cos(time * 0.005 + orb.phase) * 0.5;

            // Wrap around
            if (orb.x < -size) orb.x = canvas.width + size;
            if (orb.x > canvas.width + size) orb.x = -size;
            if (orb.y < -size) orb.y = canvas.height + size;
            if (orb.y > canvas.height + size) orb.y = -size;

            const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, size);
            gradient.addColorStop(0, `hsla(${(hue + idx * 15) % 360}, 100%, 70%, ${0.6 + val * 0.4})`);
            gradient.addColorStop(0.5, `hsla(${(hue + idx * 15 + 30) % 360}, 80%, 50%, ${0.2 + val * 0.3})`);
            gradient.addColorStop(1, 'transparent');

            ctx.beginPath();
            ctx.arc(orb.x, orb.y, size, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        });
    }

    // =========================================
    //  RENDER MODE 4: STAR FIELD
    // =========================================
    let stars = [];
    function initStars() {
        stars = [];
        for (let i = 0; i < 500; i++) {
            stars.push({
                x: (Math.random() - 0.5) * canvas.width * 3,
                y: (Math.random() - 0.5) * canvas.height * 3,
                z: Math.random() * canvas.width,
                prevX: 0, prevY: 0
            });
        }
    }

    function renderStarField() {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const bassAvg = dataArray.slice(0, 8).reduce((a, b) => a + b, 0) / 8;
        const speed = (bassAvg / 255) * 20 * sensitivity + 2;

        stars.forEach(star => {
            star.prevX = cx + (star.x / star.z) * cx;
            star.prevY = cy + (star.y / star.z) * cy;

            star.z -= speed * reactivity;
            if (star.z <= 0) {
                star.x = (Math.random() - 0.5) * canvas.width * 3;
                star.y = (Math.random() - 0.5) * canvas.height * 3;
                star.z = canvas.width;
            }

            const sx = cx + (star.x / star.z) * cx;
            const sy = cy + (star.y / star.z) * cy;
            const size = Math.max(0.5, (1 - star.z / canvas.width) * 3);
            const brightness = 1 - star.z / canvas.width;

            ctx.beginPath();
            ctx.moveTo(star.prevX, star.prevY);
            ctx.lineTo(sx, sy);
            ctx.strokeStyle = `hsla(${(hue + brightness * 60) % 360}, 80%, ${50 + brightness * 50}%, ${brightness})`;
            ctx.lineWidth = size;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(sx, sy, size * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${(hue + brightness * 60) % 360}, 100%, 80%, ${brightness})`;
            ctx.fill();
        });
    }

    // =========================================
    //  RENDER MODE 5: DNA HELIX
    // =========================================
    function renderDNA() {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const helixWidth = Math.min(canvas.width, canvas.height) * 0.35;
        const points = 80;
        const bassAvg = dataArray.slice(0, 8).reduce((a, b) => a + b, 0) / 8 / 255;

        for (let strand = 0; strand < 2; strand++) {
            const offset = strand * Math.PI;
            ctx.beginPath();
            for (let i = 0; i < points; i++) {
                const t = i / points;
                const angle = t * Math.PI * 4 + time * 0.015 + offset;
                const freqIdx = Math.floor(t * dataArray.length);
                const val = (dataArray[freqIdx] || 0) / 255 * sensitivity;

                const x = cx + Math.cos(angle) * helixWidth * (0.4 + val * 0.6);
                const y = cy - canvas.height * 0.4 + t * canvas.height * 0.8;
                const depth = Math.sin(angle) * 0.5 + 0.5;

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = `hsla(${strand === 0 ? hue : (hue + 120) % 360}, 100%, 60%, 0.8)`;
            ctx.lineWidth = 3;
            ctx.shadowColor = `hsla(${strand === 0 ? hue : (hue + 120) % 360}, 100%, 60%, 0.5)`;
            ctx.shadowBlur = 15;
            ctx.stroke();
        }

        // Cross-bridges
        for (let i = 0; i < points; i += 3) {
            const t = i / points;
            const angle = t * Math.PI * 4 + time * 0.015;
            const val = (dataArray[Math.floor(t * dataArray.length)] || 0) / 255 * sensitivity;

            const x1 = cx + Math.cos(angle) * helixWidth * (0.4 + val * 0.6);
            const x2 = cx + Math.cos(angle + Math.PI) * helixWidth * (0.4 + val * 0.6);
            const y = cy - canvas.height * 0.4 + t * canvas.height * 0.8;

            ctx.beginPath();
            ctx.moveTo(x1, y);
            ctx.lineTo(x2, y);
            ctx.strokeStyle = `hsla(${(hue + t * 120) % 360}, 70%, 50%, ${0.3 + val * 0.4})`;
            ctx.lineWidth = 1 + val * 2;
            ctx.shadowBlur = val * 10;
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
    }

    // =========================================
    //  RENDER MODE 6: NEBULA CLOUD
    // =========================================
    let nebulaParticles = [];
    function initNebula() {
        nebulaParticles = [];
        for (let i = 0; i < 300; i++) {
            nebulaParticles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: 20 + Math.random() * 80,
                freqBand: Math.floor(Math.random() * (dataArray ? dataArray.length : 256)),
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                hueOffset: Math.random() * 120
            });
        }
    }

    function renderNebula() {
        nebulaParticles.forEach(p => {
            const val = (dataArray ? dataArray[p.freqBand] || 0 : 0) / 255 * sensitivity;
            const size = p.size * (0.3 + val * reactivity);

            p.x += p.vx + Math.sin(time * 0.002 + p.hueOffset) * 0.3;
            p.y += p.vy + Math.cos(time * 0.002 + p.hueOffset) * 0.2;

            if (p.x < -p.size) p.x = canvas.width + p.size;
            if (p.x > canvas.width + p.size) p.x = -p.size;
            if (p.y < -p.size) p.y = canvas.height + p.size;
            if (p.y > canvas.height + p.size) p.y = -p.size;

            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size);
            gradient.addColorStop(0, `hsla(${(hue + p.hueOffset) % 360}, 80%, 50%, ${0.05 + val * 0.12})`);
            gradient.addColorStop(0.6, `hsla(${(hue + p.hueOffset + 30) % 360}, 60%, 30%, ${0.02 + val * 0.05})`);
            gradient.addColorStop(1, 'transparent');

            ctx.beginPath();
            ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        });

        // Bright core stars
        for (let i = 0; i < 20; i++) {
            const val = (dataArray ? dataArray[i * 12] || 0 : 0) / 255;
            if (val > 0.3) {
                const x = canvas.width * (0.2 + 0.6 * (i / 20)) + Math.sin(time * 0.01 + i) * 30;
                const y = canvas.height * 0.5 + Math.cos(time * 0.008 + i * 2) * canvas.height * 0.3;
                ctx.beginPath();
                ctx.arc(x, y, 1 + val * 3, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${(hue + i * 20) % 360}, 100%, 90%, ${val})`;
                ctx.shadowColor = `hsla(${(hue + i * 20) % 360}, 100%, 70%, 0.8)`;
                ctx.shadowBlur = 15 + val * 20;
                ctx.fill();
            }
        }
        ctx.shadowBlur = 0;
    }

    // --- Mode Renderers Map ---
    const MODES = {
        radial: { name: 'Radial Spectrum', render: renderRadial, init: null },
        terrain: { name: 'Waveform Terrain', render: renderTerrain, init: null },
        orbs: { name: 'Plasma Orbs', render: renderOrbs, init: initOrbs },
        starfield: { name: 'Star Field', render: renderStarField, init: initStars },
        dna: { name: 'DNA Helix', render: renderDNA, init: null },
        nebula: { name: 'Nebula Cloud', render: renderNebula, init: initNebula }
    };

    function switchMode(mode) {
        currentMode = mode;
        if (MODES[mode].init) MODES[mode].init();
        // Update mode buttons
        document.querySelectorAll('.audio-mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
    }

    // --- Main Animation Loop ---
    function animate() {
        requestAnimationFrame(animate);
        time++;
        hue = (hue + 0.5) % 360;

        const scheme = COLOR_SCHEMES[colorScheme];

        // Fade background
        ctx.fillStyle = scheme.bg + 'e6';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Get audio data
        getFrequencyData();

        // Render current mode
        if (MODES[currentMode]) {
            MODES[currentMode].render();
        }

        // Update displays
        frameCount++;
        if (frameCount % 30 === 0) {
            const fpsEl = document.getElementById('audio-fps');
            if (fpsEl) fpsEl.textContent = '60';
        }
        const bassEl = document.getElementById('audio-bass');
        if (bassEl && dataArray) {
            const bass = Math.round(dataArray.slice(0, 5).reduce((a, b) => a + b, 0) / 5);
            bassEl.textContent = bass;
        }
    }

    // --- Event Listeners ---
    // Mic button
    const micBtn = document.getElementById('audio-mic-btn');
    if (micBtn) {
        micBtn.addEventListener('click', () => {
            if (isListening) stopMic();
            else startMic();
        });
    }

    // Demo button (start without mic)
    const demoBtn = document.getElementById('audio-demo-btn');
    if (demoBtn) {
        demoBtn.addEventListener('click', () => {
            if (demoMode) {
                demoMode = false;
                isListening = false;
                updateMicButton(false);
            } else {
                startDemoMode();
            }
        });
    }

    // Mode buttons
    document.querySelectorAll('.audio-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => switchMode(btn.dataset.mode));
    });

    // Sensitivity slider
    const senSlider = document.getElementById('audio-sensitivity');
    if (senSlider) {
        senSlider.addEventListener('input', () => {
            sensitivity = parseFloat(senSlider.value) / 50;
            const val = document.getElementById('audio-sens-val');
            if (val) val.textContent = senSlider.value;
        });
    }

    // Reactivity slider
    const reactSlider = document.getElementById('audio-reactivity');
    if (reactSlider) {
        reactSlider.addEventListener('input', () => {
            reactivity = parseFloat(reactSlider.value) / 50;
            const val = document.getElementById('audio-react-val');
            if (val) val.textContent = reactSlider.value;
        });
    }

    // Color scheme buttons
    document.querySelectorAll('.audio-color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            colorScheme = btn.dataset.color;
            document.querySelectorAll('.audio-color-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Init
    resize();
    // Auto-start demo mode so dataArray is populated before particle init
    startDemoMode();
    initOrbs();
    initStars();
    initNebula();
    switchMode('radial');
    animate();
    window.addEventListener('resize', resize);
}

// --- Auto-init for standalone page ---
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('audio-canvas')) initAudioVisualizer();
});
