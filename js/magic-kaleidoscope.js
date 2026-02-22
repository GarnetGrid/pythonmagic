/* ===================================================
   🌈 PSYCHEDELIC KALEIDOSCOPE — Full-Page Engine
   Extracted from magic.js for standalone page use
   =================================================== */

(function () {
    document.addEventListener('DOMContentLoaded', () => {
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

        // --- Onboarding ---
        const onboarding = document.getElementById('kscope-onboarding');
        if (onboarding) {
            onboarding.addEventListener('click', () => {
                onboarding.classList.add('hidden');
                // Auto-start auto-paint for instant gratification
                if (!autoPaint) {
                    autoPaint = true;
                    if (autoPaintBtn) autoPaintBtn.classList.add('active');
                    autoTime = Math.random() * 100;
                }
            });
        }

        // --- Panel toggle ---
        const panelToggle = document.getElementById('kscope-toggle');
        const panel = document.getElementById('kscope-panel');
        if (panelToggle && panel) {
            panelToggle.addEventListener('click', () => {
                panel.classList.toggle('collapsed');
                panelToggle.textContent = panel.classList.contains('collapsed') ? '☰' : '✕';
            });
        }

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

        // --- Resize (full-viewport) ---
        function resize() {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
            cx = w / 2;
            cy = h / 2;
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
            if (symVal) symVal.textContent = symSlider.value;
            if (brushVal) brushVal.textContent = brushSlider.value;
            if (hueVal) hueVal.textContent = hueSlider.value;
            if (trailVal) trailVal.textContent = trailSlider.value;
            if (glowVal) glowVal.textContent = glowSlider.value;
            if (warpVal) warpVal.textContent = warpSlider.value;
        }

        // --- The core: draw a single stroke mirrored across N symmetry axes ---
        function drawSymmetricStroke(x, y, px, py, settings) {
            const { symmetry, brush, glow } = settings;
            const angleStep = (Math.PI * 2) / symmetry;

            const dx = x - cx;
            const dy = y - cy;
            const pdx = px - cx;
            const pdy = py - cy;

            let color;
            if (rainbow) {
                color = `hsl(${hue}, 100%, 60%)`;
            } else {
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
            const settings = getSettings();
            for (let i = 0; i < 60; i++) {
                bursts.push(new BurstParticle(x, y));
            }
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

            // Trail fade
            ctx.globalCompositeOperation = 'source-over';
            const fadeAlpha = 1 - settings.trail;
            if (fadeAlpha > 0.001) {
                ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
                ctx.fillRect(0, 0, w, h);
            }

            // Warp distortion
            if (settings.warp > 0.01) {
                ctx.save();
                ctx.globalAlpha = 0.95;
                ctx.translate(cx, cy);
                ctx.rotate(settings.warp * 0.002);
                ctx.scale(1 - settings.warp * 0.0005, 1 - settings.warp * 0.0005);
                ctx.translate(-cx, -cy);
                ctx.drawImage(canvas, 0, 0);
                ctx.restore();
            }

            // Hue cycle
            hue = (hue + settings.hueSpeed * 0.5) % 360;

            // Auto-paint mode
            if (autoPaint) {
                autoTime += 0.02;
                const ax = cx + Math.sin(autoTime * 1.3) * (w * 0.35) * Math.cos(autoTime * 0.7);
                const ay = cy + Math.cos(autoTime * 0.9) * (h * 0.35) * Math.sin(autoTime * 0.5);

                if (lastX !== null) {
                    drawSymmetricStroke(ax, ay, lastX, lastY, settings);
                }
                lastX = ax;
                lastY = ay;
            }

            // Mouse painting
            if (isMouseDown && !autoPaint) {
                if (lastX !== null) {
                    drawSymmetricStroke(mouseX, mouseY, lastX, lastY, settings);
                }
                lastX = mouseX;
                lastY = mouseY;
            }

            // Bursts
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            bursts = bursts.filter(b => b.life > 0);
            bursts.forEach(b => {
                b.update();
                b.draw(ctx);
            });
            ctx.restore();

            // FPS counter
            frameCount++;
            const now = performance.now();
            if (now - lastFrameTime >= 1000) {
                displayFps = frameCount;
                frameCount = 0;
                lastFrameTime = now;
                if (fpsEl) fpsEl.textContent = displayFps;
            }

            // HUD
            if (hueDisplay) hueDisplay.textContent = Math.round(hue) + '°';
            if (strokesEl) strokesEl.textContent = strokeCount.toLocaleString();

            requestAnimationFrame(animate);
        }

        // --- Event: slider changes ---
        [symSlider, brushSlider, hueSlider, trailSlider, glowSlider, warpSlider].forEach(s => {
            if (s) s.addEventListener('input', updateDisplays);
        });

        // --- Event: mouse ---
        canvas.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            mouseX = e.clientX;
            mouseY = e.clientY;
            lastX = mouseX;
            lastY = mouseY;
        });

        canvas.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
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

        // Double-click burst
        canvas.addEventListener('dblclick', (e) => {
            spawnBurst(e.clientX, e.clientY);
        });

        // Scroll to resize brush
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            let val = parseInt(brushSlider.value);
            val += (e.deltaY > 0 ? -1 : 1);
            val = Math.max(1, Math.min(30, val));
            brushSlider.value = val;
            updateDisplays();
        }, { passive: false });

        // Touch support
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isMouseDown = true;
            const touch = e.touches[0];
            mouseX = touch.clientX;
            mouseY = touch.clientY;
            lastX = mouseX;
            lastY = mouseY;
            // Dismiss onboarding on touch too
            if (onboarding && !onboarding.classList.contains('hidden')) {
                onboarding.classList.add('hidden');
            }
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            mouseX = touch.clientX;
            mouseY = touch.clientY;
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
        if (rainbowBtn) {
            rainbowBtn.addEventListener('click', () => {
                rainbow = !rainbow;
                rainbowBtn.classList.toggle('active', rainbow);
            });
        }

        if (mirrorBtn) {
            mirrorBtn.addEventListener('click', () => {
                mirror = !mirror;
                mirrorBtn.classList.toggle('active', mirror);
            });
        }

        if (autoPaintBtn) {
            autoPaintBtn.addEventListener('click', () => {
                autoPaint = !autoPaint;
                autoPaintBtn.classList.toggle('active', autoPaint);
                if (autoPaint) {
                    lastX = null;
                    lastY = null;
                    autoTime = Math.random() * 100;
                }
            });
        }

        // --- Clear ---
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, w, h);
                strokeCount = 0;
                bursts = [];
                lastX = null;
                lastY = null;
            });
        }

        // --- Fullscreen (native) ---
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => { });
                    fullscreenBtn.textContent = '✕ Exit';
                } else {
                    document.exitFullscreen();
                    fullscreenBtn.textContent = '⛶ Fullscreen';
                }
            });
        }

        // ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (onboarding && !onboarding.classList.contains('hidden')) {
                    onboarding.classList.add('hidden');
                }
            }
        });

        // --- Presets ---
        document.querySelectorAll('[data-preset]').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = PRESETS[btn.dataset.preset];
                if (!preset) return;

                symSlider.value = preset.symmetry;
                brushSlider.value = preset.brush;
                hueSlider.value = preset.hueSpeed;
                trailSlider.value = preset.trail;
                glowSlider.value = preset.glow;
                warpSlider.value = preset.warp;

                rainbow = preset.rainbow;
                mirror = preset.mirror;
                if (rainbowBtn) rainbowBtn.classList.toggle('active', rainbow);
                if (mirrorBtn) mirrorBtn.classList.toggle('active', mirror);

                updateDisplays();

                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, w, h);
                strokeCount = 0;
                lastX = null;
                lastY = null;

                document.querySelectorAll('[data-preset]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                if (!autoPaint) {
                    autoPaint = true;
                    if (autoPaintBtn) autoPaintBtn.classList.add('active');
                    autoTime = Math.random() * 100;
                }
            });
        });

        // --- Init ---
        resize();
        updateDisplays();
        animate();
        window.addEventListener('resize', resize);
    });
})();
