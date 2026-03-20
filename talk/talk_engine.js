const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

/**
 * Compact formant-style phoneme map.
 * type: vocal (voiced), noise (unvoiced), plosive (burst), mixed (voiced + noise), silent
 */
const P_MAP = {
    // Vowels
    AA: { f: [730, 1090, 2440, 3400], b: [15, 12, 12, 12], type: "vocal", dur: 170, gain: 0.33 },
    AE: { f: [660, 1720, 2410, 3500], b: [15, 12, 12, 12], type: "vocal", dur: 165, gain: 0.33 },
    AH: { f: [640, 1190, 2390, 3500], b: [15, 12, 12, 12], type: "vocal", dur: 145, gain: 0.32 },
    AO: { f: [570, 840, 2410, 3500], b: [15, 12, 12, 12], type: "vocal", dur: 170, gain: 0.33 },
    AW: { f: [700, 1300, 2400, 3500], b: [15, 12, 12, 12], type: "vocal", dur: 210, gain: 0.33 },
    AX: { f: [500, 1500, 2500, 3500], b: [15, 12, 12, 12], type: "vocal", dur: 95, gain: 0.28 },
    AY: { f: [700, 1800, 2500, 3500], b: [15, 12, 12, 12], type: "vocal", dur: 210, gain: 0.33 },
    EH: { f: [530, 1840, 2480, 3500], b: [15, 12, 12, 12], type: "vocal", dur: 145, gain: 0.33 },
    EY: { f: [450, 1900, 2400, 3500], b: [15, 12, 12, 12], type: "vocal", dur: 190, gain: 0.33 },
    IH: { f: [390, 1990, 2550, 3500], b: [15, 15, 15, 15], type: "vocal", dur: 125, gain: 0.33 },
    IY: { f: [270, 2290, 3010, 3500], b: [12, 20, 25, 25], type: "vocal", dur: 165, gain: 0.33 },
    OW: { f: [500, 900, 2300, 3400], b: [15, 12, 12, 12], type: "vocal", dur: 195, gain: 0.33 },
    OY: { f: [600, 1300, 2300, 3400], b: [15, 12, 12, 12], type: "vocal", dur: 205, gain: 0.33 },
    UH: { f: [440, 1020, 2240, 3500], b: [15, 12, 12, 12], type: "vocal", dur: 140, gain: 0.33 },
    UW: { f: [300, 870, 2240, 3500], b: [12, 12, 12, 12], type: "vocal", dur: 165, gain: 0.33 },
    ER: { f: [490, 1350, 1690, 3500], b: [15, 15, 15, 15], type: "vocal", dur: 170, gain: 0.33 },

    // Fricatives / noise
    S: { f: [4000, 5000, 6500, 8000], b: [5, 5, 5, 5], type: "noise", dur: 100, gain: 0.07 },
    SH: { f: [2000, 3000, 4000, 5000], b: [5, 5, 5, 5], type: "noise", dur: 125, gain: 0.11 },
    F: { f: [1500, 2500, 3500, 4500], b: [3, 3, 3, 3], type: "noise", dur: 95, gain: 0.05 },
    TH: { f: [2500, 3500, 4500, 5500], b: [3, 3, 3, 3], type: "noise", dur: 95, gain: 0.05 },
    H: { f: [1000, 1500, 2500, 3500], b: [3, 3, 3, 3], type: "noise", dur: 70, gain: 0.05 },

    // Sonorants
    M: { f: [280, 900, 2200, 3200], b: [20, 10, 10, 10], type: "vocal", dur: 120, gain: 0.24 },
    N: { f: [280, 1700, 2500, 3200], b: [20, 10, 10, 10], type: "vocal", dur: 120, gain: 0.24 },
    L: { f: [350, 1050, 2600, 3200], b: [10, 10, 10, 10], type: "vocal", dur: 125, gain: 0.28 },
    R: { f: [350, 1100, 1400, 3200], b: [10, 10, 10, 10], type: "vocal", dur: 125, gain: 0.28 },
    W: { f: [300, 650, 2300, 3200], b: [10, 10, 10, 10], type: "vocal", dur: 120, gain: 0.28 },
    Y: { f: [320, 2100, 2800, 3400], b: [10, 10, 10, 10], type: "vocal", dur: 120, gain: 0.26 },

    // Mixed voiced fricatives / affricate approximations
    V: { f: [300, 1000, 2400, 3400], b: [10, 10, 10, 10], type: "mixed", dur: 105, gain: 0.13 },
    Z: { f: [3500, 4500, 5500, 6500], b: [5, 5, 5, 5], type: "mixed", dur: 110, gain: 0.08 },
    DH: { f: [1800, 2800, 3800, 4800], b: [4, 4, 4, 4], type: "mixed", dur: 95, gain: 0.07 },
    ZH: { f: [1800, 2600, 3400, 4200], b: [5, 5, 5, 5], type: "mixed", dur: 115, gain: 0.08 },
    CH: { f: [2200, 3200, 4200, 5200], b: [5, 5, 5, 5], type: "plosive", dur: 65, gain: 0.16 },

    // Plosives
    T: { f: [3500, 5000, 6500, 8000], b: [10, 10, 10, 10], type: "plosive", dur: 45, gain: 0.18 },
    K: { f: [1500, 2500, 3500, 4500], b: [10, 10, 10, 10], type: "plosive", dur: 55, gain: 0.18 },
    P: { f: [800, 1500, 2500, 3500], b: [10, 10, 10, 10], type: "plosive", dur: 45, gain: 0.18 },
    D: { f: [300, 1700, 2600, 3500], b: [20, 10, 10, 10], type: "mixed", dur: 55, gain: 0.18 },
    B: { f: [250, 800, 2200, 3500], b: [20, 10, 10, 10], type: "mixed", dur: 55, gain: 0.18 },
    G: { f: [300, 2000, 3000, 4000], b: [20, 10, 10, 10], type: "mixed", dur: 55, gain: 0.18 },

    PAUSE: { dur: 170, type: "silent" }
};

const CONFIG = {
    basePitch: 96, // low monotone, closer to classic hardware TTS
    pace: 1.0,
    wordGapMs: 18,
    sentencePauseMs: 260
};

const EXCEPTIONS = {
    THE: ["DH", "AX"],
    THIS: ["DH", "IH", "S"],
    THAT: ["DH", "AE", "T"],
    WITH: ["W", "IH", "TH"],
    YOU: ["Y", "UW"],
    YOUR: ["Y", "ER"],
    TO: ["T", "UW"],
    OF: ["AX", "V"],
    ARE: ["AA", "R"],
    WAS: ["W", "AA", "Z"],
    WERE: ["W", "ER"],
    HAVE: ["H", "AE", "V"],
    BE: ["B", "IY"]
};

const DIGRAPHS = [
    { k: "TION", v: ["SH", "AH", "N"] },
    { k: "SION", v: ["ZH", "AH", "N"] },
    { k: "SH", v: ["SH"] },
    { k: "CH", v: ["CH"] },
    { k: "TH", v: ["TH"] },
    { k: "PH", v: ["F"] },
    { k: "WH", v: ["W"] },
    { k: "EE", v: ["IY"] },
    { k: "EA", v: ["IY"] },
    { k: "OO", v: ["UW"] },
    { k: "OA", v: ["OW"] },
    { k: "AI", v: ["EY"] },
    { k: "AY", v: ["EY"] },
    { k: "OI", v: ["OY"] },
    { k: "OY", v: ["OY"] },
    { k: "OW", v: ["OW"] },
    { k: "ER", v: ["ER"] },
    { k: "IR", v: ["ER"] },
    { k: "UR", v: ["ER"] },
    { k: "AR", v: ["AA", "R"] },
    { k: "OR", v: ["AO", "R"] },
    { k: "NG", v: ["N"] }
];

const VOWELS = "AEIOUY";

function isVowel(ch) {
    return VOWELS.includes(ch);
}

function mapSingleChar(word, i) {
    const ch = word[i];
    const prev = i > 0 ? word[i - 1] : "";
    const next = i + 1 < word.length ? word[i + 1] : "";

    if (ch === "C") {
        return ["E", "I", "Y"].includes(next) ? ["S"] : ["K"];
    }
    if (ch === "G") {
        return ["E", "I", "Y"].includes(next) ? ["ZH"] : ["G"];
    }
    if (ch === "X") {
        return ["K", "S"];
    }
    if (ch === "Q") {
        return ["K"];
    }
    if (ch === "J") {
        return ["ZH"];
    }
    if (ch === "Y") {
        if (!prev) return ["Y"];
        return isVowel(prev) ? ["IY"] : ["Y"];
    }

    const singles = {
        A: ["AE"],
        B: ["B"],
        D: ["D"],
        E: ["EH"],
        F: ["F"],
        H: ["H"],
        I: ["IH"],
        K: ["K"],
        L: ["L"],
        M: ["M"],
        N: ["N"],
        O: ["AO"],
        P: ["P"],
        R: ["R"],
        S: ["S"],
        T: ["T"],
        U: ["AH"],
        V: ["V"],
        W: ["W"],
        Z: ["Z"]
    };

    return singles[ch] || [];
}

function wordToPhones(rawWord) {
    const word = rawWord.toUpperCase().replace(/[^A-Z']/g, "");
    if (!word) return [];

    if (EXCEPTIONS[word]) {
        return EXCEPTIONS[word].map((k) => P_MAP[k]).filter(Boolean);
    }

    const seq = [];
    let i = 0;

    while (i < word.length) {
        const rem = word.substring(i);
        let matched = false;

        for (const rule of DIGRAPHS) {
            if (rem.startsWith(rule.k)) {
                for (const k of rule.v) {
                    if (P_MAP[k]) seq.push(P_MAP[k]);
                }
                i += rule.k.length;
                matched = true;
                break;
            }
        }
        if (matched) continue;

        // Basic final silent E rule: "make" -> M AE K
        if (word[i] === "E" && i === word.length - 1 && word.length > 2 && !isVowel(word[i - 1])) {
            i += 1;
            continue;
        }

        const mapped = mapSingleChar(word, i);
        for (const k of mapped) {
            if (P_MAP[k]) seq.push(P_MAP[k]);
        }
        i += 1;
    }

    return seq;
}

function getPhoneticSequence(text) {
    const tokens = String(text || "").match(/[A-Za-z']+|[.,!?;:]/g) || [];
    const seq = [];

    for (const token of tokens) {
        if (/^[.,!?;:]$/.test(token)) {
            const pause = { ...P_MAP.PAUSE };
            if (token === "." || token === "!" || token === "?") {
                pause.dur = CONFIG.sentencePauseMs;
            } else {
                pause.dur = 180;
            }
            seq.push(pause);
            continue;
        }

        const w = wordToPhones(token);
        seq.push(...w);
        seq.push({ ...P_MAP.PAUSE, dur: CONFIG.wordGapMs });
    }

    return seq;
}

function createKlattPulse() {
    const size = 512;
    const real = new Float32Array(size);
    const imag = new Float32Array(size);
    for (let n = 1; n < size; n++) imag[n] = 1.0 / n;
    return audioCtx.createPeriodicWave(real, imag);
}

function createNoise() {
    const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.5, audioCtx.sampleRate);
    const d = buffer.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
        d[i] = (Math.random() * 2 - 1) * 0.65;
    }
    return buffer;
}

const klattPulse = createKlattPulse();
const noiseBuffer = createNoise();

const masterGain = audioCtx.createGain();
masterGain.gain.value = 0.9;
masterGain.connect(audioCtx.destination);

let stopToken = 0;
let stopTimeoutId = null;
let lastP = null;
const activeNodes = new Set();

function isVoiced(p) {
    return p && (p.type === "vocal" || p.type === "mixed");
}

function trackNode(node, endAt) {
    activeNodes.add(node);
    try {
        node.onended = () => activeNodes.delete(node);
        if (typeof node.stop === "function") node.stop(endAt);
    } catch {
        activeNodes.delete(node);
    }
}

function setStatus(msg) {
    const statusLine = document.getElementById("statusLine");
    if (statusLine) statusLine.innerText = msg;
}

function computePitchAt(position) {
    // Slight downward contour for phrase naturalness while staying machine-flat.
    const start = CONFIG.basePitch + 3;
    const end = CONFIG.basePitch - 6;
    return start + (end - start) * position;
}

function playPhoneme(p, nextP, t, f0, token) {
    if (token !== stopToken) return t;

    const linguisticDur = (p.dur / 1000) / CONFIG.pace;
    let audioDur = linguisticDur;

    let overlap = 0.0;
    if (nextP && isVoiced(p) && isVoiced(nextP)) {
        overlap = 0.035;
        audioDur += overlap;
    }

    const tEnd = t + audioDur;
    const nextStart = t + linguisticDur;

    if (p.type === "silent") {
        lastP = null;
        return nextStart;
    }

    if (isVoiced(p)) {
        const osc = audioCtx.createOscillator();
        osc.setPeriodicWave(klattPulse);
        osc.frequency.setValueAtTime(Math.max(70, f0), t);
        osc.frequency.linearRampToValueAtTime(Math.max(66, f0 - 1.5), tEnd);

        p.f.forEach((freq, i) => {
            const filter = audioCtx.createBiquadFilter();
            filter.type = "bandpass";
            const startF = lastP && lastP.f && lastP.f[i] ? lastP.f[i] : freq;
            filter.frequency.setValueAtTime(startF, t);
            filter.frequency.exponentialRampToValueAtTime(freq, t + Math.min(0.04, linguisticDur));
            filter.Q.setValueAtTime(p.b[i] || 10, t);

            const gain = audioCtx.createGain();
            const bandGain = (p.gain || 0.2) * (1 / (i + 1));

            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, bandGain), t + 0.015);
            gain.gain.setValueAtTime(Math.max(0.0002, bandGain), nextStart);
            gain.gain.exponentialRampToValueAtTime(0.0001, tEnd);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(masterGain);
        });

        osc.start(t);
        trackNode(osc, tEnd + 0.08);
    }

    if (p.type === "noise" || p.type === "mixed" || p.type === "plosive") {
        const src = audioCtx.createBufferSource();
        src.buffer = noiseBuffer;

        const filter = audioCtx.createBiquadFilter();
        if (p.type === "plosive") {
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(p.f[2], t);
        } else {
            // Bandpass is less hissy than pure highpass for tiny synths.
            filter.type = "bandpass";
            filter.frequency.setValueAtTime(p.f[0] || 2200, t);
            filter.Q.setValueAtTime(0.9, t);
        }

        const gain = audioCtx.createGain();
        const prevVoiced = isVoiced(lastP);
        const nextVoiced = isVoiced(nextP);
        const voicedBridge = prevVoiced && nextVoiced;
        const baseVol = p.gain || 0.1;
        const vol = p.type === "mixed" ? baseVol * (voicedBridge ? 0.33 : 0.55) : baseVol;

        gain.gain.setValueAtTime(0.0001, t);
        if (p.type === "plosive") {
            gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.004);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.038);
        } else if (p.type === "mixed") {
            // Mixed consonants get a short noisy edge, not a full-duration hiss.
            const burstEnd = Math.min(t + (voicedBridge ? 0.02 : 0.035), nextStart);
            gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.007);
            gain.gain.exponentialRampToValueAtTime(0.0001, burstEnd);
        } else {
            gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.015);
            gain.gain.setValueAtTime(Math.max(0.0002, vol * 0.85), Math.max(t + 0.016, nextStart - 0.02));
            gain.gain.exponentialRampToValueAtTime(0.0001, nextStart);
        }

        src.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        src.start(t);
        trackNode(src, tEnd);
    }

    lastP = p;
    return nextStart;
}

function stop() {
    stopToken += 1;
    if (stopTimeoutId) {
        clearTimeout(stopTimeoutId);
        stopTimeoutId = null;
    }

    for (const node of activeNodes) {
        try {
            if (typeof node.stop === "function") node.stop(0);
            if (typeof node.disconnect === "function") node.disconnect();
        } catch {
            // no-op
        }
    }
    activeNodes.clear();
    lastP = null;
    setStatus("Idle");
}

function speak(inputText) {
    stop();
    const token = stopToken;

    if (audioCtx.state === "suspended") audioCtx.resume();

    const textInput = document.getElementById("textInput");
    const text = typeof inputText === "string" ? inputText : textInput ? textInput.value : "";
    const seq = getPhoneticSequence(text);

    if (!seq.length) {
        setStatus("Idle");
        return;
    }

    let t = audioCtx.currentTime + 0.08;
    lastP = null;
    setStatus("Synthesizing...");

    const voicedTotal = seq.reduce((n, p) => n + (isVoiced(p) ? 1 : 0), 0);
    let voicedSeen = 0;

    for (let i = 0; i < seq.length; i++) {
        const currentP = seq[i];
        const nextP = seq[i + 1] || null;
        if (token !== stopToken) break;

        if (isVoiced(currentP)) voicedSeen += 1;
        const pos = voicedTotal > 0 ? voicedSeen / voicedTotal : 0;
        const f0 = computePitchAt(pos);

        t = playPhoneme(currentP, nextP, t, f0, token);
    }

    const ms = Math.max(0, (t - audioCtx.currentTime) * 1000);
    stopTimeoutId = setTimeout(() => {
        if (token === stopToken) setStatus("Idle");
    }, ms);
}

// Public API so this file can be dropped into any page and called directly.
window.WebTalk = {
    speak,
    stop,
    getPhoneticSequence,
    configure(partial = {}) {
        Object.assign(CONFIG, partial || {});
    }
};

document.getElementById("playBtn")?.addEventListener("click", () => speak());
document.getElementById("stopBtn")?.addEventListener("click", stop);
