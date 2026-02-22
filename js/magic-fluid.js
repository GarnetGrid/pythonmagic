/* ============================================
   🌊 FLUID DYNAMICS SIMULATOR
   Navier-Stokes · Dye Injection · Canvas 2D
   Standalone full-page + embedded support
   ============================================ */

function initFluidSim() {
    const canvas = document.getElementById('fluid-canvas');
    if (!canvas) return;

    // --- Full-page mode detection ---
    const isFullPage = document.body.classList.contains('viz-fullpage');

    // --- Onboarding overlay ---
    const onboarding = document.getElementById('fluid-onboarding');
    if (onboarding) {
        onboarding.addEventListener('click', () => onboarding.classList.add('hidden'));
    }

    // --- Panel toggle ---
    const panelToggle = document.getElementById('fluid-toggle');
    const panel = document.getElementById('fluid-panel');
    if (panelToggle && panel) {
        panelToggle.addEventListener('click', () => {
            panel.classList.toggle('collapsed');
            panelToggle.textContent = panel.classList.contains('collapsed') ? '☰' : '✕';
        });
    }
    const ctx = canvas.getContext('2d');

    // --- Grid config ---
    const N = 128; // Grid resolution
    const size = (N + 2) * (N + 2);
    const iter = 4; // Solver iterations

    // --- State arrays ---
    let u = new Float32Array(size);      // Velocity x
    let v = new Float32Array(size);      // Velocity y
    let u_prev = new Float32Array(size);
    let v_prev = new Float32Array(size);
    let dens = new Float32Array(size);   // Density (dye)
    let dens_prev = new Float32Array(size);

    // Red, green, blue channels for color mixing
    let dR = new Float32Array(size);
    let dG = new Float32Array(size);
    let dB = new Float32Array(size);
    let dR_prev = new Float32Array(size);
    let dG_prev = new Float32Array(size);
    let dB_prev = new Float32Array(size);

    // --- Parameters ---
    let viscosity = 0.0001;
    let diffusion = 0.00001;
    let forceMult = 200;
    let brushRadius = 8;
    let dyeHue = 0;
    let rainbowMode = true;
    let time = 0;

    // --- Mouse state ---
    let mouseX = 0, mouseY = 0;
    let prevMouseX = 0, prevMouseY = 0;
    let mouseDown = false;
    let mouseActive = false;

    // --- Index helper ---
    function IX(x, y) { return x + (N + 2) * y; }

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

    // ==========================================
    //  NAVIER-STOKES SOLVER
    // ==========================================

    function addSource(x, s, dt) {
        for (let i = 0; i < size; i++) x[i] += s[i] * dt;
    }

    function setBoundary(b, x) {
        for (let i = 1; i <= N; i++) {
            x[IX(0, i)] = b === 1 ? -x[IX(1, i)] : x[IX(1, i)];
            x[IX(N + 1, i)] = b === 1 ? -x[IX(N, i)] : x[IX(N, i)];
            x[IX(i, 0)] = b === 2 ? -x[IX(i, 1)] : x[IX(i, 1)];
            x[IX(i, N + 1)] = b === 2 ? -x[IX(i, N)] : x[IX(i, N)];
        }
        x[IX(0, 0)] = 0.5 * (x[IX(1, 0)] + x[IX(0, 1)]);
        x[IX(0, N + 1)] = 0.5 * (x[IX(1, N + 1)] + x[IX(0, N)]);
        x[IX(N + 1, 0)] = 0.5 * (x[IX(N, 0)] + x[IX(N + 1, 1)]);
        x[IX(N + 1, N + 1)] = 0.5 * (x[IX(N, N + 1)] + x[IX(N + 1, N)]);
    }

    function diffuse(b, x, x0, diff, dt) {
        const a = dt * diff * N * N;
        for (let k = 0; k < iter; k++) {
            for (let i = 1; i <= N; i++) {
                for (let j = 1; j <= N; j++) {
                    x[IX(i, j)] = (x0[IX(i, j)] + a * (
                        x[IX(i - 1, j)] + x[IX(i + 1, j)] +
                        x[IX(i, j - 1)] + x[IX(i, j + 1)]
                    )) / (1 + 4 * a);
                }
            }
            setBoundary(b, x);
        }
    }

    function advect(b, d, d0, u, v, dt) {
        const dt0 = dt * N;
        for (let i = 1; i <= N; i++) {
            for (let j = 1; j <= N; j++) {
                let x = i - dt0 * u[IX(i, j)];
                let y = j - dt0 * v[IX(i, j)];
                x = Math.max(0.5, Math.min(N + 0.5, x));
                y = Math.max(0.5, Math.min(N + 0.5, y));
                const i0 = Math.floor(x), i1 = i0 + 1;
                const j0 = Math.floor(y), j1 = j0 + 1;
                const s1 = x - i0, s0 = 1 - s1;
                const t1 = y - j0, t0 = 1 - t1;
                d[IX(i, j)] = s0 * (t0 * d0[IX(i0, j0)] + t1 * d0[IX(i0, j1)]) +
                    s1 * (t0 * d0[IX(i1, j0)] + t1 * d0[IX(i1, j1)]);
            }
        }
        setBoundary(b, d);
    }

    function project(u, v, p, div) {
        for (let i = 1; i <= N; i++) {
            for (let j = 1; j <= N; j++) {
                div[IX(i, j)] = -0.5 * (u[IX(i + 1, j)] - u[IX(i - 1, j)] + v[IX(i, j + 1)] - v[IX(i, j - 1)]) / N;
                p[IX(i, j)] = 0;
            }
        }
        setBoundary(0, div);
        setBoundary(0, p);

        for (let k = 0; k < iter; k++) {
            for (let i = 1; i <= N; i++) {
                for (let j = 1; j <= N; j++) {
                    p[IX(i, j)] = (div[IX(i, j)] + p[IX(i - 1, j)] + p[IX(i + 1, j)] +
                        p[IX(i, j - 1)] + p[IX(i, j + 1)]) / 4;
                }
            }
            setBoundary(0, p);
        }

        for (let i = 1; i <= N; i++) {
            for (let j = 1; j <= N; j++) {
                u[IX(i, j)] -= 0.5 * N * (p[IX(i + 1, j)] - p[IX(i - 1, j)]);
                v[IX(i, j)] -= 0.5 * N * (p[IX(i, j + 1)] - p[IX(i, j - 1)]);
            }
        }
        setBoundary(1, u);
        setBoundary(2, v);
    }

    function velocityStep(dt) {
        addSource(u, u_prev, dt);
        addSource(v, v_prev, dt);

        [u, u_prev] = [u_prev, u]; diffuse(1, u, u_prev, viscosity, dt);
        [v, v_prev] = [v_prev, v]; diffuse(2, v, v_prev, viscosity, dt);

        project(u, v, u_prev, v_prev);

        [u, u_prev] = [u_prev, u];
        [v, v_prev] = [v_prev, v];
        advect(1, u, u_prev, u_prev, v_prev, dt);
        advect(2, v, v_prev, u_prev, v_prev, dt);

        project(u, v, u_prev, v_prev);
    }

    function densityStep(d, d0, dt) {
        addSource(d, d0, dt);
        [d[0], d0[0]] = [d0[0], d[0]];
        // Swap arrays properly
        let temp = new Float32Array(d);
        d.set(d0);
        d0.set(temp);
        diffuse(0, d, d0, diffusion, dt);
        [d[0], d0[0]] = [d0[0], d[0]];
        temp = new Float32Array(d);
        d.set(d0);
        d0.set(temp);
        advect(0, d, d0, u, v, dt);
    }

    // Custom density step that swaps via index
    function stepDensity(dt) {
        // Add sources
        for (let i = 0; i < size; i++) {
            dR[i] += dR_prev[i] * dt;
            dG[i] += dG_prev[i] * dt;
            dB[i] += dB_prev[i] * dt;
        }

        // Diffuse
        let tmpR = new Float32Array(size);
        let tmpG = new Float32Array(size);
        let tmpB = new Float32Array(size);
        tmpR.set(dR); tmpG.set(dG); tmpB.set(dB);
        diffuse(0, dR, tmpR, diffusion, dt);
        diffuse(0, dG, tmpG, diffusion, dt);
        diffuse(0, dB, tmpB, diffusion, dt);

        // Advect
        tmpR.set(dR); tmpG.set(dG); tmpB.set(dB);
        advect(0, dR, tmpR, u, v, dt);
        advect(0, dG, tmpG, u, v, dt);
        advect(0, dB, tmpB, u, v, dt);
    }

    // ==========================================
    //  RENDERING
    // ==========================================
    function render() {
        const img = ctx.createImageData(canvas.width, canvas.height);
        const data = img.data;
        const cw = canvas.width;
        const ch = canvas.height;

        for (let y = 0; y < ch; y++) {
            for (let x = 0; x < cw; x++) {
                const gi = Math.floor((x / cw) * N) + 1;
                const gj = Math.floor((y / ch) * N) + 1;
                const idx = IX(gi, gj);

                const r = Math.min(255, Math.max(0, dR[idx] * 255));
                const g = Math.min(255, Math.max(0, dG[idx] * 255));
                const b = Math.min(255, Math.max(0, dB[idx] * 255));

                const pi = (y * cw + x) * 4;
                data[pi] = r;
                data[pi + 1] = g;
                data[pi + 2] = b;
                data[pi + 3] = 255;
            }
        }

        ctx.putImageData(img, 0, 0);
    }

    // ==========================================
    //  MOUSE → DYE INJECTION / FORCE
    // ==========================================
    function addInteraction() {
        if (!mouseActive) return;

        const cellW = canvas.width / N;
        const cellH = canvas.height / N;
        const gi = Math.floor(mouseX / cellW) + 1;
        const gj = Math.floor(mouseY / cellH) + 1;

        if (gi < 1 || gi > N || gj < 1 || gj > N) return;

        // Add velocity force
        const dx = mouseX - prevMouseX;
        const dy = mouseY - prevMouseY;

        for (let di = -brushRadius; di <= brushRadius; di++) {
            for (let dj = -brushRadius; dj <= brushRadius; dj++) {
                const ci = gi + di;
                const cj = gj + dj;
                if (ci < 1 || ci > N || cj < 1 || cj > N) continue;

                const dist = Math.sqrt(di * di + dj * dj);
                if (dist > brushRadius) continue;

                const falloff = 1 - dist / brushRadius;
                const idx = IX(ci, cj);

                u_prev[idx] += dx * forceMult * falloff;
                v_prev[idx] += dy * forceMult * falloff;

                // Add dye
                const h = rainbowMode ? (dyeHue + time * 2) % 360 : dyeHue;
                const rgb = hslToRgb(h / 360, 1, 0.5);
                dR_prev[idx] += rgb[0] * falloff * 5;
                dG_prev[idx] += rgb[1] * falloff * 5;
                dB_prev[idx] += rgb[2] * falloff * 5;
            }
        }
    }

    // --- HSL to RGB helper ---
    function hslToRgb(h, s, l) {
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
    //  PRESETS
    // ==========================================
    const PRESETS = {
        lava: { viscosity: 0.0005, diffusion: 0.0001, force: 150, brush: 10, rainbow: false, hue: 15 },
        ink: { viscosity: 0.00005, diffusion: 0.000005, force: 250, brush: 6, rainbow: true, hue: 0 },
        aurora: { viscosity: 0.0002, diffusion: 0.00005, force: 200, brush: 12, rainbow: true, hue: 120 },
        smoke: { viscosity: 0.001, diffusion: 0.0005, force: 100, brush: 15, rainbow: false, hue: 0 }
    };

    function applyPreset(name) {
        const p = PRESETS[name];
        if (!p) return;
        viscosity = p.viscosity;
        diffusion = p.diffusion;
        forceMult = p.force;
        brushRadius = p.brush;
        rainbowMode = p.rainbow;
        dyeHue = p.hue;

        // Update UI
        const viscSlider = document.getElementById('fluid-viscosity');
        const diffSlider = document.getElementById('fluid-diffusion');
        const forceSlider = document.getElementById('fluid-force');
        const brushSlider = document.getElementById('fluid-brush');

        if (viscSlider) { viscSlider.value = Math.round(viscosity * 10000); document.getElementById('fluid-visc-val').textContent = viscSlider.value; }
        if (diffSlider) { diffSlider.value = Math.round(diffusion * 100000); document.getElementById('fluid-diff-val').textContent = diffSlider.value; }
        if (forceSlider) { forceSlider.value = forceMult; document.getElementById('fluid-force-val').textContent = forceMult; }
        if (brushSlider) { brushSlider.value = brushRadius; document.getElementById('fluid-brush-val').textContent = brushRadius; }

        const rainBtn = document.getElementById('fluid-rainbow');
        if (rainBtn) rainBtn.classList.toggle('active', rainbowMode);

        document.querySelectorAll('.fluid-preset').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.preset === name);
        });
    }

    // ==========================================
    //  AUTO-MOTION (ambient swirls when idle)
    // ==========================================
    function addAmbientMotion() {
        const t = time * 0.008;
        const cx = N / 2;
        const cy = N / 2;

        // Swirling vortices
        for (let k = 0; k < 3; k++) {
            const angle = t + k * (Math.PI * 2 / 3);
            const px = cx + Math.cos(angle) * N * 0.3;
            const py = cy + Math.sin(angle) * N * 0.3;
            const gi = Math.floor(px);
            const gj = Math.floor(py);

            if (gi > 1 && gi < N && gj > 1 && gj < N) {
                const idx = IX(gi, gj);
                const force = 15;
                u_prev[idx] += Math.cos(angle + Math.PI / 2) * force;
                v_prev[idx] += Math.sin(angle + Math.PI / 2) * force;

                const h = rainbowMode ? (dyeHue + time * 2 + k * 120) % 360 : dyeHue;
                const rgb = hslToRgb(h / 360, 1, 0.5);
                dR_prev[idx] += rgb[0] * 2;
                dG_prev[idx] += rgb[1] * 2;
                dB_prev[idx] += rgb[2] * 2;
            }
        }
    }

    // ==========================================
    //  MAIN LOOP
    // ==========================================
    function animate() {
        requestAnimationFrame(animate);
        time++;

        const dt = 0.1;

        // Clear prev sources
        u_prev.fill(0);
        v_prev.fill(0);
        dR_prev.fill(0);
        dG_prev.fill(0);
        dB_prev.fill(0);

        // Add mouse interaction
        addInteraction();

        // Add ambient swirls
        if (!mouseDown) addAmbientMotion();

        // Step simulation
        velocityStep(dt);
        stepDensity(dt);

        // Render
        render();

        // Slight decay to prevent saturation
        for (let i = 0; i < size; i++) {
            dR[i] *= 0.999;
            dG[i] *= 0.999;
            dB[i] *= 0.999;
        }
    }

    // ==========================================
    //  EVENT LISTENERS
    // ==========================================
    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    }

    canvas.addEventListener('mousedown', (e) => {
        mouseDown = true;
        mouseActive = true;
        const pos = getMousePos(e);
        mouseX = prevMouseX = pos.x;
        mouseY = prevMouseY = pos.y;
    });

    canvas.addEventListener('mousemove', (e) => {
        const pos = getMousePos(e);
        prevMouseX = mouseX;
        prevMouseY = mouseY;
        mouseX = pos.x;
        mouseY = pos.y;
        if (mouseDown) mouseActive = true;
    });

    canvas.addEventListener('mouseup', () => { mouseDown = false; mouseActive = false; });
    canvas.addEventListener('mouseleave', () => { mouseDown = false; mouseActive = false; });

    // Touch support
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        mouseDown = true;
        mouseActive = true;
        const pos = getMousePos(e);
        mouseX = prevMouseX = pos.x;
        mouseY = prevMouseY = pos.y;
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const pos = getMousePos(e);
        prevMouseX = mouseX;
        prevMouseY = mouseY;
        mouseX = pos.x;
        mouseY = pos.y;
        mouseActive = true;
    }, { passive: false });

    canvas.addEventListener('touchend', () => { mouseDown = false; mouseActive = false; });

    // Sliders
    const viscSlider = document.getElementById('fluid-viscosity');
    if (viscSlider) viscSlider.addEventListener('input', () => {
        viscosity = parseFloat(viscSlider.value) / 10000;
        document.getElementById('fluid-visc-val').textContent = viscSlider.value;
    });

    const diffSlider = document.getElementById('fluid-diffusion');
    if (diffSlider) diffSlider.addEventListener('input', () => {
        diffusion = parseFloat(diffSlider.value) / 100000;
        document.getElementById('fluid-diff-val').textContent = diffSlider.value;
    });

    const forceSlider = document.getElementById('fluid-force');
    if (forceSlider) forceSlider.addEventListener('input', () => {
        forceMult = parseFloat(forceSlider.value);
        document.getElementById('fluid-force-val').textContent = forceSlider.value;
    });

    const brushSlider = document.getElementById('fluid-brush');
    if (brushSlider) brushSlider.addEventListener('input', () => {
        brushRadius = parseFloat(brushSlider.value);
        document.getElementById('fluid-brush-val').textContent = brushSlider.value;
    });

    // Rainbow toggle
    const rainBtn = document.getElementById('fluid-rainbow');
    if (rainBtn) rainBtn.addEventListener('click', () => {
        rainbowMode = !rainbowMode;
        rainBtn.classList.toggle('active', rainbowMode);
    });

    // Hue slider
    const hueSlider = document.getElementById('fluid-hue');
    if (hueSlider) hueSlider.addEventListener('input', () => {
        dyeHue = parseFloat(hueSlider.value);
        document.getElementById('fluid-hue-val').textContent = dyeHue + '°';
    });

    // Preset buttons
    document.querySelectorAll('.fluid-preset').forEach(btn => {
        btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
    });

    // Clear button
    const clearBtn = document.getElementById('fluid-clear');
    if (clearBtn) clearBtn.addEventListener('click', () => {
        u.fill(0); v.fill(0); u_prev.fill(0); v_prev.fill(0);
        dR.fill(0); dG.fill(0); dB.fill(0);
        dR_prev.fill(0); dG_prev.fill(0); dB_prev.fill(0);
    });

    // Init
    resize();
    animate();
    window.addEventListener('resize', resize);
}

// --- Auto-init for standalone page ---
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('fluid-canvas')) initFluidSim();
});
