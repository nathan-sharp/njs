/**
 * SHARED PHYSICS ENGINE
 * Available to any page that includes this script.
 */
window.PhysicsEngine = {
    defaults: {
        r1: 100, r2: 100,
        m1: 10, m2: 10,
        g: 9.8,
        damping: 1.0,
        dt: 0.1 
    },

    update: function(state, params) {
        // Use provided params or fallback to defaults
        const p = { ...this.defaults, ...params };

        let { a1, a2, a1_v, a2_v } = state;

        // Lagrangian Equations of Motion
        let num1 = -p.g * (2 * p.m1 + p.m2) * Math.sin(a1);
        let num2 = -p.m2 * p.g * Math.sin(a1 - 2 * a2);
        let num3 = -2 * Math.sin(a1 - a2) * p.m2;
        let num4 = a2_v * a2_v * p.r2 + a1_v * a1_v * p.r1 * Math.cos(a1 - a2);
        let den = p.r1 * (2 * p.m1 + p.m2 - p.m2 * Math.cos(2 * a1 - 2 * a2));
        
        let a1_a = (num1 + num2 + num3 * num4) / den;

        let num5 = 2 * Math.sin(a1 - a2);
        let num6 = (a1_v * a1_v * p.r1 * (p.m1 + p.m2));
        let num7 = p.g * (p.m1 + p.m2) * Math.cos(a1);
        let num8 = a2_v * a2_v * p.r2 * p.m2 * Math.cos(a1 - a2);
        let den2 = p.r2 * (2 * p.m1 + p.m2 - p.m2 * Math.cos(2 * a1 - 2 * a2));
        
        let a2_a = (num5 * (num6 + num7 + num8)) / den2;

        // Integration
        a1_v += a1_a * p.dt;
        a2_v += a2_a * p.dt;
        a1 += a1_v * p.dt;
        a2 += a2_v * p.dt;

        // Damping
        a1_v *= p.damping;
        a2_v *= p.damping;

        // Stability Clamp
        const MAX_VEL = 0.5 / p.dt; 
        if (a1_v > MAX_VEL) a1_v = MAX_VEL;
        if (a1_v < -MAX_VEL) a1_v = -MAX_VEL;
        if (a2_v > MAX_VEL) a2_v = MAX_VEL;
        if (a2_v < -MAX_VEL) a2_v = -MAX_VEL;

        // Update State Object
        state.a1 = a1;
        state.a2 = a2;
        state.a1_v = a1_v;
        state.a2_v = a2_v;

        return state;
    }
};

/**
 * MAIN SIMULATION APP (index.html)
 * Wrapped in an IIFE to prevent variable collisions with other pages
 */
(function() {
    // Only run this logic if we are on the main simulation page
    const simCanvas = document.getElementById('simCanvas');
    // Check for a unique element that only exists in index.html controls
    // to distinguish it from graph_viewer which also has a graphCanvas
    const isMainPage = document.getElementById('angle1Graph'); 

    if (!simCanvas || !isMainPage) return;

    const simCtx = simCanvas.getContext('2d');
    const angle1GraphCanvas = document.getElementById('angle1Graph');
    const angle1Ctx = angle1GraphCanvas.getContext('2d');
    const angle2GraphCanvas = document.getElementById('angle2Graph');
    const angle2Ctx = angle2GraphCanvas.getContext('2d');
    const configGraphCanvas = document.getElementById('configGraph');
    const configCtx = configGraphCanvas.getContext('2d');

    // --- Configuration & State ---
    const CONFIG = {
        baseSimWidth: 600,
        baseSimHeight: 400,
        graphHeight: 180, 
        historySize: 300,
        r1: 100,
        r2: 100,
        m1: 10,
        m2: 10,
        g: 9.8,
        friction: 0,
        traceLength: 150
    };

    let state = {
        a1: Math.PI / 2,
        a2: Math.PI / 2,
        a1_v: 0,
        a2_v: 0,
        path: [],
        history: [],
        paused: false,
        scale: 1 
    };

    // Inputs
    const inputs = {
        m1: document.getElementById('inp-m1'),
        m2: document.getElementById('inp-m2'),
        r1: document.getElementById('inp-r1'),
        r2: document.getElementById('inp-r2'),
        g: document.getElementById('inp-g'),
        friction: document.getElementById('inp-friction'),
        trace: document.getElementById('inp-trace'),
        sa1: document.getElementById('inp-sa1'),
        sa2: document.getElementById('inp-sa2'),
        random: document.getElementById('inp-random')
    };

    const displays = {
        m1: document.getElementById('disp-m1'),
        m2: document.getElementById('disp-m2'),
        r1: document.getElementById('disp-r1'),
        r2: document.getElementById('disp-r2'),
        g: document.getElementById('disp-g'),
        friction: document.getElementById('disp-friction'),
        trace: document.getElementById('disp-trace'),
        sa1: document.getElementById('disp-sa1'),
        sa2: document.getElementById('disp-sa2')
    };

    function init() {
        resize();
        setupListeners();
        resetSim();
        animate();
    }

    function setupListeners() {
        const bind = (key, configKey) => {
            if(!inputs[key]) return;
            inputs[key].addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                CONFIG[configKey] = val;
                if(displays[key]) displays[key].innerText = val;
            });
        };

        bind('m1', 'm1');
        bind('m2', 'm2');
        bind('r1', 'r1');
        bind('r2', 'r2');
        bind('g', 'g');
        bind('friction', 'friction');
        
        if(inputs.trace) {
            inputs.trace.addEventListener('input', (e) => {
                CONFIG.traceLength = parseInt(e.target.value);
                displays.trace.innerText = CONFIG.traceLength;
            });
        }

        if(inputs.sa1) inputs.sa1.addEventListener('input', (e) => displays.sa1.innerText = e.target.value);
        if(inputs.sa2) inputs.sa2.addEventListener('input', (e) => displays.sa2.innerText = e.target.value);
        
        if(inputs.random) {
            inputs.random.addEventListener('change', (e) => {
                inputs.sa1.disabled = e.target.checked;
                inputs.sa2.disabled = e.target.checked;
                inputs.sa1.parentElement.style.opacity = e.target.checked ? 0.5 : 1;
                inputs.sa2.parentElement.style.opacity = e.target.checked ? 0.5 : 1;
            });
            inputs.random.dispatchEvent(new Event('change'));
        }
    }

    window.resetSim = function() { // Exposed for button click
        if (inputs.random && inputs.random.checked) {
            state.a1 = Math.PI / 2 + (Math.random() * 1 - 0.5);
            state.a2 = Math.PI / 2 + (Math.random() * 1 - 0.5);
        } else {
            state.a1 = parseFloat(inputs.sa1.value) * (Math.PI / 180);
            state.a2 = parseFloat(inputs.sa2.value) * (Math.PI / 180);
        }
        state.a1_v = 0;
        state.a2_v = 0;
        state.path = [];
        state.history = [];
        configCtx.clearRect(0, 0, configGraphCanvas.width, configGraphCanvas.height);
    }

    window.togglePause = function() { // Exposed for button click
        state.paused = !state.paused;
        const btn = document.getElementById('btn-pause');
        if(btn) btn.innerText = state.paused ? "Resume" : "Pause";
    }

    window.clearTrails = function() { // Exposed for button click
        state.path = [];
        state.history = [];
        configCtx.clearRect(0, 0, configGraphCanvas.width, configGraphCanvas.height);
    }

    function updatePhysics() {
        if (state.paused) return;

        // Calculate Damping Factor from Friction %
        // 0% Friction = 1.0 Damping
        // 100% Friction = 0.990 Damping (example scale)
        let dampFactor = 1.0 - (CONFIG.friction / 5000);

        // Use Shared Physics Engine
        window.PhysicsEngine.update(state, {
            r1: CONFIG.r1,
            r2: CONFIG.r2,
            m1: CONFIG.m1,
            m2: CONFIG.m2,
            g: CONFIG.g,
            damping: dampFactor,
            dt: 0.2 // Tuning for visual speed on main chart
        });
    }

    function drawSimulation() {
        const w = simCanvas.width;
        const h = simCanvas.height;
        const cx = w / 2;
        const cy = h / 3;

        simCtx.clearRect(0, 0, w, h);

        simCtx.save();
        if (w < 600) {
            const scaleFactor = w / 600;
            simCtx.translate(cx, cy);
            simCtx.scale(scaleFactor, scaleFactor);
            simCtx.translate(-cx, -cy);
        }

        let x1 = CONFIG.r1 * Math.sin(state.a1);
        let y1 = CONFIG.r1 * Math.cos(state.a1);
        let x2 = x1 + CONFIG.r2 * Math.sin(state.a2);
        let y2 = y1 + CONFIG.r2 * Math.cos(state.a2);

        if (!state.paused) {
            state.path.push({x: cx + x2, y: cy + y2});
            if (state.path.length > CONFIG.traceLength) state.path.shift();
        }

        if (state.path.length > 1) {
            simCtx.beginPath();
            simCtx.strokeStyle = "rgba(0, 85, 255, 0.25)";
            simCtx.lineWidth = 2;
            for (let i = 0; i < state.path.length - 1; i++) {
                simCtx.moveTo(state.path[i].x, state.path[i].y);
                simCtx.lineTo(state.path[i+1].x, state.path[i+1].y);
            }
            simCtx.stroke();
        }

        simCtx.strokeStyle = '#333';
        simCtx.lineWidth = 3;
        simCtx.beginPath();
        simCtx.moveTo(cx, cy);
        simCtx.lineTo(cx + x1, cy + y1);
        simCtx.lineTo(cx + x2, cy + y2);
        simCtx.stroke();

        const drawBob = (x, y, m, color) => {
            simCtx.fillStyle = color;
            simCtx.beginPath();
            simCtx.arc(x, y, Math.sqrt(m) * 3, 0, 2 * Math.PI);
            simCtx.fill();
        };

        drawBob(cx + x1, cy + y1, CONFIG.m1, '#FF5722');
        drawBob(cx + x2, cy + y2, CONFIG.m2, '#03A9F4');
        
        simCtx.fillStyle = '#333';
        simCtx.beginPath();
        simCtx.arc(cx, cy, 6, 0, 2 * Math.PI);
        simCtx.fill();

        simCtx.restore();
    }

    function drawAngleGraphs() {
        drawSingleAngleGraph(angle1Ctx, angle1GraphCanvas, 'a1', '#FF5722');
        drawSingleAngleGraph(angle2Ctx, angle2GraphCanvas, 'a2', '#03A9F4');
    }

    function drawSingleAngleGraph(ctx, canvas, prop, color) {
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#e0e0e0';
        
        ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); ctx.stroke();

        ctx.fillStyle = '#777';
        ctx.font = '10px sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText('0', 5, h/2 - 8);
        ctx.fillText('+π', 5, 10);
        ctx.fillText('-π', 5, h - 10);

        if (state.history.length < 2) return;

        const getX = (i) => (i / CONFIG.historySize) * w;
        const scaleY = h / (2 * Math.PI); 
        const getY = (val) => h/2 - (val * scaleY);

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        
        let twoPi = 2 * Math.PI;

        for(let i=0; i<state.history.length; i++) {
            let raw = state.history[i][prop];
            let val = (raw % twoPi + twoPi) % twoPi;
            if (val > Math.PI) val -= twoPi;

            let x = getX(i);
            let y = getY(val);
            
            if(i===0) {
                ctx.moveTo(x, y);
            } else {
                let prevRaw = state.history[i-1][prop];
                let prevVal = (prevRaw % twoPi + twoPi) % twoPi;
                if (prevVal > Math.PI) prevVal -= twoPi;
                
                if (Math.abs(val - prevVal) > Math.PI) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    }

    function drawConfigGraph() {
        const w = configGraphCanvas.width;
        const h = configGraphCanvas.height;
        const ctx = configCtx;

        ctx.clearRect(0, 0, w, h);

        ctx.save();
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        
        ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h); ctx.stroke();

        ctx.fillStyle = '#777';
        ctx.font = '10px sans-serif';
        ctx.fillText('θ2', w/2 + 5, 12);
        ctx.fillText('θ1', w - 20, h/2 - 5);
        ctx.restore();

        if (state.history.length < 1) return;
        
        let twoPi = 2 * Math.PI;

        for (let i = 0; i < state.history.length; i++) {
            const pt = state.history[i];
            let a1Wrapped = (pt.a1 % twoPi + twoPi) % twoPi;
            if (a1Wrapped > Math.PI) a1Wrapped -= twoPi;
            
            let a2Wrapped = (pt.a2 % twoPi + twoPi) % twoPi;
            if (a2Wrapped > Math.PI) a2Wrapped -= twoPi;
            
            const x = (a1Wrapped / twoPi) * w + w / 2;
            const y = (a2Wrapped / twoPi) * h + h / 2;

            const age = state.history.length - 1 - i;
            if (age === 0) {
                // Latest head: slightly larger bright blue point
                ctx.fillStyle = '#0055ff';
                ctx.fillRect(x - 1, y - 1, 4, 4);
            } else if (age < 40) {
                // Short recent trail fading smoothly from bright blue to slate gray
                const ratio = age / 40;
                const r = Math.round(0 + (108 - 0) * ratio);
                const g = Math.round(85 + (117 - 85) * ratio);
                const b = Math.round(255 + (125 - 255) * ratio);
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.fillRect(x, y, 2, 2);
            } else {
                // Permanent history dots: darker slate gray (#6c757d) so they stand out clearly in light mode
                ctx.fillStyle = '#6c757d';
                ctx.fillRect(x, y, 2, 2);
            }
        }
    }

    function animate() {
        updatePhysics();
        
        if (!state.paused) {
            state.history.push({
                a1: state.a1,
                a2: state.a2,
                v2: state.a2_v
            });
            if (state.history.length > CONFIG.historySize) state.history.shift();
        }

        drawSimulation();
        drawAngleGraphs();
        drawConfigGraph();

        requestAnimationFrame(animate);
    }

    function resize() {
        const mainContainer = document.querySelector('.main-view');
        if(!mainContainer) return;
        const mainW = mainContainer.clientWidth - 20; 
        simCanvas.width = mainW;
        simCanvas.height = Math.min(400, mainW * 0.8);

        const angle1Container = angle1GraphCanvas.parentElement;
        const angleW = angle1Container.clientWidth - 20;
        angle1GraphCanvas.width = angleW;
        angle1GraphCanvas.height = CONFIG.graphHeight;
        angle2GraphCanvas.width = angleW;
        angle2GraphCanvas.height = CONFIG.graphHeight;
        
        const configContainer = configGraphCanvas.parentElement;
        const configW = configContainer.clientWidth - 20;
        configGraphCanvas.width = configW;
        configGraphCanvas.height = configW;
    }

    window.addEventListener('resize', resize);
    init();
})();
