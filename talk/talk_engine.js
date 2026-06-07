const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

/**
 * Compact formant-style phoneme map.
 * type: vocal (voiced), noise (unvoiced), plosive (burst), mixed (voiced + noise), silent
 * Enhanced with more natural frequencies and better durations
 */
const P_MAP = {
    // Vowels - improved formants for better clarity
    AA: { f: [700, 1100, 2500, 3600], b: [18, 14, 14, 14], type: "vocal", dur: 180, gain: 0.34 },
    AE: { f: [660, 1750, 2480, 3600], b: [18, 14, 14, 14], type: "vocal", dur: 175, gain: 0.34 },
    AH: { f: [620, 1200, 2500, 3600], b: [18, 14, 14, 14], type: "vocal", dur: 155, gain: 0.33 },
    AO: { f: [560, 800, 2500, 3600], b: [18, 14, 14, 14], type: "vocal", dur: 180, gain: 0.34 },
    AW: { f: [680, 1350, 2480, 3600], b: [18, 14, 14, 14], type: "vocal", dur: 220, gain: 0.34 },
    AX: { f: [500, 1500, 2600, 3600], b: [16, 12, 12, 12], type: "vocal", dur: 85, gain: 0.28 },
    AY: { f: [680, 1850, 2550, 3600], b: [18, 14, 14, 14], type: "vocal", dur: 220, gain: 0.34 },
    EH: { f: [530, 1880, 2520, 3600], b: [18, 14, 14, 14], type: "vocal", dur: 155, gain: 0.34 },
    EY: { f: [440, 1950, 2480, 3600], b: [18, 14, 14, 14], type: "vocal", dur: 200, gain: 0.34 },
    IH: { f: [370, 2040, 2620, 3600], b: [16, 18, 18, 18], type: "vocal", dur: 135, gain: 0.34 },
    IY: { f: [250, 2350, 3100, 3600], b: [14, 22, 28, 28], type: "vocal", dur: 175, gain: 0.34 },
    OW: { f: [490, 920, 2380, 3500], b: [18, 14, 14, 14], type: "vocal", dur: 205, gain: 0.34 },
    OY: { f: [580, 1350, 2380, 3500], b: [18, 14, 14, 14], type: "vocal", dur: 215, gain: 0.34 },
    UH: { f: [420, 1060, 2320, 3600], b: [18, 14, 14, 14], type: "vocal", dur: 150, gain: 0.34 },
    UW: { f: [280, 900, 2320, 3600], b: [14, 14, 14, 14], type: "vocal", dur: 175, gain: 0.34 },
    ER: { f: [480, 1400, 1750, 3600], b: [18, 16, 16, 16], type: "vocal", dur: 180, gain: 0.34 },

    // Fricatives / noise - refined for reduced harshness
    S: { f: [3800, 4800, 6200, 7600], b: [6, 6, 6, 6], type: "noise", dur: 110, gain: 0.065 },
    SH: { f: [1900, 2900, 3900, 4800], b: [6, 6, 6, 6], type: "noise", dur: 135, gain: 0.105 },
    F: { f: [1400, 2400, 3400, 4400], b: [4, 4, 4, 4], type: "noise", dur: 105, gain: 0.048 },
    TH: { f: [2400, 3400, 4400, 5400], b: [4, 4, 4, 4], type: "noise", dur: 105, gain: 0.048 },
    H: { f: [950, 1450, 2450, 3450], b: [4, 4, 4, 4], type: "noise", dur: 75, gain: 0.05 },

    // Sonorants - richer tone
    M: { f: [300, 950, 2250, 3300], b: [22, 12, 12, 12], type: "vocal", dur: 130, gain: 0.26 },
    N: { f: [300, 1750, 2550, 3300], b: [22, 12, 12, 12], type: "vocal", dur: 130, gain: 0.26 },
    L: { f: [380, 1100, 2650, 3300], b: [12, 12, 12, 12], type: "vocal", dur: 135, gain: 0.30 },
    R: { f: [380, 1150, 1450, 3300], b: [12, 12, 12, 12], type: "vocal", dur: 135, gain: 0.30 },
    W: { f: [330, 700, 2350, 3300], b: [12, 12, 12, 12], type: "vocal", dur: 130, gain: 0.30 },
    Y: { f: [350, 2150, 2850, 3500], b: [12, 12, 12, 12], type: "vocal", dur: 130, gain: 0.28 },

    // Mixed voiced fricatives / affricate approximations - smoother
    V: { f: [320, 1050, 2450, 3500], b: [12, 12, 12, 12], type: "mixed", dur: 115, gain: 0.135 },
    Z: { f: [3400, 4400, 5400, 6400], b: [6, 6, 6, 6], type: "mixed", dur: 120, gain: 0.082 },
    DH: { f: [1750, 2750, 3750, 4750], b: [5, 5, 5, 5], type: "mixed", dur: 105, gain: 0.072 },
    ZH: { f: [1750, 2550, 3350, 4150], b: [6, 6, 6, 6], type: "mixed", dur: 125, gain: 0.082 },
    CH: { f: [2150, 3150, 4150, 5150], b: [6, 6, 6, 6], type: "plosive", dur: 70, gain: 0.165 },

    // Plosives - tighter bursts
    T: { f: [3400, 4800, 6300, 7800], b: [11, 11, 11, 11], type: "plosive", dur: 50, gain: 0.18 },
    K: { f: [1450, 2450, 3450, 4450], b: [11, 11, 11, 11], type: "plosive", dur: 60, gain: 0.18 },
    P: { f: [750, 1450, 2450, 3450], b: [11, 11, 11, 11], type: "plosive", dur: 50, gain: 0.18 },
    D: { f: [330, 1750, 2650, 3600], b: [22, 12, 12, 12], type: "mixed", dur: 60, gain: 0.18 },
    B: { f: [280, 850, 2250, 3600], b: [22, 12, 12, 12], type: "mixed", dur: 60, gain: 0.18 },
    G: { f: [330, 2050, 3050, 4050], b: [22, 12, 12, 12], type: "mixed", dur: 60, gain: 0.18 },

    PAUSE: { dur: 170, type: "silent" }
};

const CONFIG = {
    basePitch: 100, // more natural male voice pitch
    pace: 1.0,
    wordGapMs: 20,
    sentencePauseMs: 280
};

const EXCEPTIONS = {
    // Common function words with special pronunciations
    THE: ["DH", "AX"],
    THIS: ["DH", "IH", "S"],
    THAT: ["DH", "AE", "T"],
    THERE: ["DH", "ER"],
    THESE: ["DH", "IY", "Z"],
    THOSE: ["DH", "OW", "Z"],
    THOUGH: ["DH", "OW"],
    THROUGH: ["TH", "R", "UW"],
    THOROUGH: ["TH", "ER", "AH"],
    WITH: ["W", "IH", "TH"],
    YOU: ["Y", "UW"],
    YOUR: ["Y", "ER"],
    YOURS: ["Y", "ER", "Z"],
    TO: ["T", "UW"],
    TOO: ["T", "UW"],
    TWO: ["T", "UW"],
    OF: ["AX", "V"],
    OR: ["AO", "R"],
    ARE: ["AA", "R"],
    WAS: ["W", "AA", "Z"],
    WERE: ["W", "ER"],
    BE: ["B", "IY"],
    BEEN: ["B", "IH", "N"],
    HAVE: ["H", "AE", "V"],
    HAS: ["H", "AE", "Z"],
    HAD: ["H", "AE", "D"],
    DO: ["D", "UW"],
    DOES: ["D", "AX", "Z"],
    DID: ["D", "IH", "D"],
    WHAT: ["W", "AA", "T"],
    WHEN: ["W", "EH", "N"],
    WHERE: ["W", "ER"],
    WHY: ["W", "AY"],
    WHO: ["H", "UW"],
    WHOM: ["H", "UW", "M"],
    WHICH: ["W", "IH", "CH"],
    HOW: ["H", "AW"],
    CAN: ["K", "AE", "N"],
    COULD: ["K", "UH", "D"],
    WOULD: ["W", "UH", "D"],
    SHOULD: ["SH", "UH", "D"],
    WILL: ["W", "IH", "L"],
    SHALL: ["SH", "AE", "L"],
    MAY: ["M", "EY"],
    MIGHT: ["M", "AY", "T"],
    MUST: ["M", "AH", "S", "T"],
    AND: ["AE", "N", "D"],
    OR: ["AO", "R"],
    BUT: ["B", "AH", "T"],
    NOT: ["N", "AA", "T"],
    NO: ["N", "OW"],
    YES: ["Y", "EH", "S"],
    FOR: ["F", "ER"],
    FROM: ["F", "R", "AH", "M"],
    ABOUT: ["AX", "B", "AW", "T"],
    AFTER: ["AE", "F", "T", "ER"],
    BECAUSE: ["B", "IH", "K", "AA", "Z"],
    BEFORE: ["B", "IH", "F", "ER"],
    BETWEEN: ["B", "IH", "T", "W", "IY", "N"],
    OVER: ["OW", "V", "ER"],
    UNDER: ["AH", "N", "D", "ER"],
    THROUGH: ["TH", "R", "UW"],
    JUST: ["ZH", "AH", "S", "T"],
    ONLY: ["OW", "N", "L", "IY"],
    VERY: ["V", "EH", "R", "IY"],
    ALSO: ["AO", "L", "S", "OW"],
    SOME: ["S", "AH", "M"],
    ANY: ["AE", "N", "IY"],
    ALL: ["AO", "L"],
    EACH: ["IY", "CH"],
    EVERY: ["EH", "V", "R", "IY"],
    MOST: ["M", "OW", "S", "T"],
    MUCH: ["M", "AH", "CH"],
    MANY: ["M", "EH", "N", "IY"],
    MORE: ["M", "ER"],
    LESS: ["L", "EH", "S"],
    SAME: ["S", "EY", "M"],
    OTHER: ["AH", "DH", "ER"],
    ANOTHER: ["AX", "N", "AH", "DH", "ER"],
    SUCH: ["S", "AH", "CH"],
    PEOPLE: ["P", "IY", "P", "AX", "L"],
    PERSON: ["P", "ER", "S", "AX", "N"],
    YEAR: ["Y", "IH", "R"],
    SAID: ["S", "EH", "D"],
    WELL: ["W", "EH", "L"],
    GOOD: ["G", "UH", "D"],
    RIGHT: ["R", "AY", "T"],
    THINK: ["TH", "IH", "NG", "K"],
    KNOW: ["N", "OW"],
    GET: ["G", "EH", "T"],
    GIVE: ["G", "IH", "V"],
    MAKE: ["M", "EY", "K"],
    COME: ["K", "AH", "M"],
    GO: ["G", "OW"],
    TAKE: ["T", "EY", "K"],
    SEE: ["S", "IY"],
    LOOK: ["L", "UH", "K"],
    FIND: ["F", "AY", "N", "D"],
    USE: ["Y", "UW", "Z"],
    TELL: ["T", "EH", "L"],
    WORK: ["W", "ER", "K"],
    CALL: ["K", "AO", "L"],
    TRY: ["T", "R", "AY"],
    ASK: ["AE", "S", "K"],
    NEED: ["N", "IY", "D"],
    FEEL: ["F", "IY", "L"],
    BECOME: ["B", "IH", "K", "AH", "M"],
    LEAVE: ["L", "IY", "V"],
    PUT: ["P", "UH", "T"],
    MEAN: ["M", "IY", "N"],
    KEEP: ["K", "IY", "P"],
    LET: ["L", "EH", "T"],
    BEGIN: ["B", "IH", "G", "IH", "N"],
    SEEM: ["S", "IY", "M"],
    HELP: ["H", "EH", "L", "P"],
    TALK: ["T", "AO", "K"],
    TURN: ["T", "ER", "N"],
    START: ["S", "T", "AA", "R", "T"],
    SHOW: ["SH", "OW"],
    HEAR: ["H", "IH", "R"],
    LET: ["L", "EH", "T"],
    HAND: ["H", "AE", "N", "D"],
    HIGH: ["H", "AY"],
    EVERY: ["EH", "V", "R", "IY"],
    TELL: ["T", "EH", "L"],
};

const DIGRAPHS = [
    // Three-letter combinations first (most specific)
    { k: "TION", v: ["SH", "AX", "N"] },
    { k: "SION", v: ["ZH", "AX", "N"] },
    { k: "OUGH", v: ["OW"] },
    
    // Two-letter combinations
    { k: "SH", v: ["SH"] },
    { k: "CH", v: ["CH"] },
    { k: "TH", v: ["TH"] },
    { k: "PH", v: ["F"] },
    { k: "WH", v: ["W"] },
    { k: "GH", v: [] }, // silent in most cases
    
    // Vowel digraphs
    { k: "EE", v: ["IY"] },
    { k: "EA", v: ["IY"] },
    { k: "OO", v: ["UW"] },
    { k: "OA", v: ["OW"] },
    { k: "AI", v: ["EY"] },
    { k: "AY", v: ["EY"] },
    { k: "EI", v: ["EY"] },
    { k: "OI", v: ["OY"] },
    { k: "OY", v: ["OY"] },
    { k: "OW", v: ["OW"] },
    { k: "AU", v: ["AO"] },
    
    // R-colored vowels
    { k: "ER", v: ["ER"] },
    { k: "IR", v: ["ER"] },
    { k: "UR", v: ["ER"] },
    { k: "OR", v: ["AO", "R"] },
    { k: "AR", v: ["AA", "R"] },
    
    // Consonant combinations
    { k: "NG", v: ["N"] },
    { k: "TCH", v: ["CH"] },
    { k: "DGE", v: ["ZH"] },
    { k: "CK", v: ["K"] }
];

const VOWELS = "AEIOUY";

function isVowel(ch) {
    return VOWELS.includes(ch);
}

function mapSingleChar(word, i) {
    const ch = word[i];
    const prev = i > 0 ? word[i - 1] : "";
    const next = i + 1 < word.length ? word[i + 1] : "";
    const next2 = i + 2 < word.length ? word[i + 2] : "";

    // Soft C and G rules
    if (ch === "C") {
        // C is soft (S sound) before E, I, Y
        if (["E", "I", "Y"].includes(next)) return ["S"];
        // C is hard (K sound) otherwise
        return ["K"];
    }
    
    if (ch === "G") {
        // G is soft (Z sound - ZH actually) before E, I, Y
        if (["E", "I", "Y"].includes(next)) return ["ZH"];
        // G is hard otherwise
        return ["G"];
    }
    
    if (ch === "X") {
        // X is usually KS sound
        return ["K", "S"];
    }
    
    if (ch === "Q") {
        // Q is always K sound (followed by U usually, which is silent)
        return ["K"];
    }
    
    if (ch === "J") {
        // J is ZH sound
        return ["ZH"];
    }
    
    if (ch === "Y") {
        // Y as consonant (at start or after consonant)
        if (!prev || !isVowel(prev)) return ["Y"];
        // Y as vowel (IY sound)
        return ["IY"];
    }
    
    if (ch === "S") {
        // S is usually S sound, but Z between vowels
        if (prev && next && isVowel(prev) && isVowel(next)) {
            return ["Z"];
        }
        return ["S"];
    }

    // Standard single character mappings
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

function computePitchAt(position, isQuestion = false) {
    // More natural intonation contour
    // Falls through the utterance, with slight rise at the end if it's a question
    let pitch;
    
    if (position < 0.3) {
        // Initial rise at start of utterance
        pitch = CONFIG.basePitch + 8 - (position / 0.3) * 4;
    } else if (position < 0.7) {
        // Steady fall through middle
        const mid = (position - 0.3) / 0.4;
        pitch = CONFIG.basePitch + 4 - (mid * 8);
    } else {
        // Final portion - either fall or rise depending on sentence type
        const end = (position - 0.7) / 0.3;
        if (isQuestion) {
            // Question intonation: rise at end
            pitch = CONFIG.basePitch - 4 + (end * 12);
        } else {
            // Statement intonation: continued fall
            pitch = CONFIG.basePitch - 4 - (end * 6);
        }
    }
    
    return Math.max(65, Math.min(pitch, 140));
}

function playPhoneme(p, nextP, t, f0, token) {
    if (token !== stopToken) return t;

    const linguisticDur = (p.dur / 1000) / CONFIG.pace;
    let audioDur = linguisticDur;

    let overlap = 0.0;
    if (nextP && isVoiced(p) && isVoiced(nextP)) {
        overlap = 0.045; // slightly longer overlap for smoother transitions
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
        osc.frequency.linearRampToValueAtTime(Math.max(66, f0 - 2), tEnd);

        p.f.forEach((freq, i) => {
            const filter = audioCtx.createBiquadFilter();
            filter.type = "bandpass";
            
            // Better coarticulation: start from previous formant if available
            const startF = lastP && lastP.f && lastP.f[i] ? lastP.f[i] : freq;
            filter.frequency.setValueAtTime(startF, t);
            
            // Smoother, longer transition (80ms instead of 40ms)
            const transitionTime = Math.min(0.08, linguisticDur * 0.6);
            filter.frequency.exponentialRampToValueAtTime(freq, t + transitionTime);
            filter.Q.setValueAtTime(p.b[i] || 10, t);

            const gain = audioCtx.createGain();
            const bandGain = (p.gain || 0.2) * (1 / (i + 1));

            gain.gain.setValueAtTime(0.00015, t);
            gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, bandGain), t + 0.02);
            gain.gain.setValueAtTime(Math.max(0.0002, bandGain), nextStart);
            gain.gain.exponentialRampToValueAtTime(0.00015, tEnd);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(masterGain);
        });

        osc.start(t);
        trackNode(osc, tEnd + 0.1);
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
            filter.Q.setValueAtTime(0.85, t);
        }

        const gain = audioCtx.createGain();
        const prevVoiced = isVoiced(lastP);
        const nextVoiced = isVoiced(nextP);
        const voicedBridge = prevVoiced && nextVoiced;
        const baseVol = p.gain || 0.1;
        const vol = p.type === "mixed" ? baseVol * (voicedBridge ? 0.35 : 0.58) : baseVol;

        gain.gain.setValueAtTime(0.00015, t);
        if (p.type === "plosive") {
            gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.004);
            gain.gain.exponentialRampToValueAtTime(0.00015, t + 0.04);
        } else if (p.type === "mixed") {
            // Mixed consonants get a short noisy edge, not a full-duration hiss
            const burstEnd = Math.min(t + (voicedBridge ? 0.022 : 0.04), nextStart);
            gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.008);
            gain.gain.exponentialRampToValueAtTime(0.00015, burstEnd);
        } else {
            gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.018);
            gain.gain.setValueAtTime(Math.max(0.0002, vol * 0.82), Math.max(t + 0.018, nextStart - 0.024));
            gain.gain.exponentialRampToValueAtTime(0.00015, nextStart);
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
    setStatus("Speaking...");

    const voicedTotal = seq.reduce((n, p) => n + (isVoiced(p) ? 1 : 0), 0);
    let voicedSeen = 0;
    
    // Detect if text ends with question mark for intonation
    const isQuestion = /\?\s*$/.test(text.trim());

    for (let i = 0; i < seq.length; i++) {
        const currentP = seq[i];
        const nextP = seq[i + 1] || null;
        if (token !== stopToken) break;

        if (isVoiced(currentP)) voicedSeen += 1;
        const pos = voicedTotal > 0 ? voicedSeen / voicedTotal : 0;
        const f0 = computePitchAt(pos, isQuestion);

        t = playPhoneme(currentP, nextP, t, f0, token);
    }

    const ms = Math.max(0, (t - audioCtx.currentTime) * 1000) + 100;
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
