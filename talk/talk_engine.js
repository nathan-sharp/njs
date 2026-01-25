/**
 * WebTalk Engine v7.0 - Enhanced G2P (Grapheme-to-Phoneme) Rules
 * Features: Multi-phoneme expansion, common suffix handling, and double-consonant deduping.
 */

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

/**
 * PHONEME TABLE
 */
const P_MAP = {
    // VOWELS
    "AA": { f: [730, 1090, 2440, 3400], b: [15, 12, 12, 12], type: 'vocal', dur: 200, gain: 0.35 },
    "AE": { f: [660, 1720, 2410, 3500], b: [15, 12, 12, 12], type: 'vocal', dur: 200, gain: 0.35 },
    "AH": { f: [640, 1190, 2390, 3500], b: [15, 12, 12, 12], type: 'vocal', dur: 180, gain: 0.35 },
    "AO": { f: [570, 840, 2410, 3500],  b: [15, 12, 12, 12], type: 'vocal', dur: 200, gain: 0.35 },
    "AW": { f: [700, 1300, 2400, 3500], b: [15, 12, 12, 12], type: 'vocal', dur: 240, gain: 0.35 },
    "AX": { f: [500, 1500, 2500, 3500], b: [15, 12, 12, 12], type: 'vocal', dur: 100, gain: 0.30 }, // Schwa
    "AY": { f: [700, 1800, 2500, 3500], b: [15, 12, 12, 12], type: 'vocal', dur: 240, gain: 0.35 },
    "EH": { f: [530, 1840, 2480, 3500], b: [15, 12, 12, 12], type: 'vocal', dur: 160, gain: 0.35 },
    "EY": { f: [450, 1900, 2400, 3500], b: [15, 12, 12, 12], type: 'vocal', dur: 220, gain: 0.35 },
    "IH": { f: [390, 1990, 2550, 3500], b: [15, 15, 15, 15], type: 'vocal', dur: 140, gain: 0.35 },
    "IY": { f: [270, 2290, 3010, 3500], b: [12, 20, 25, 25], type: 'vocal', dur: 180, gain: 0.35 },
    "OW": { f: [500, 900, 2300, 3400],  b: [15, 12, 12, 12], type: 'vocal', dur: 220, gain: 0.35 },
    "OY": { f: [600, 1300, 2300, 3400], b: [15, 12, 12, 12], type: 'vocal', dur: 240, gain: 0.35 },
    "UH": { f: [440, 1020, 2240, 3500], b: [15, 12, 12, 12], type: 'vocal', dur: 150, gain: 0.35 },
    "UW": { f: [300, 870, 2240, 3500],  b: [12, 12, 12, 12], type: 'vocal', dur: 180, gain: 0.35 },
    "ER": { f: [490, 1350, 1690, 3500], b: [15, 15, 15, 15], type: 'vocal', dur: 200, gain: 0.35 },

    // CONSONANTS
    "S":  { f: [4000, 5000, 6500, 8000], b: [5, 5, 5, 5], type: 'noise', dur: 140, gain: 0.08 },
    "SH": { f: [2000, 3000, 4000, 5000], b: [5, 5, 5, 5], type: 'noise', dur: 160, gain: 0.12 },
    "F":  { f: [1500, 2500, 3500, 4500], b: [3, 3, 3, 3], type: 'noise', dur: 130, gain: 0.05 },
    "TH": { f: [2500, 3500, 4500, 5500], b: [3, 3, 3, 3], type: 'noise', dur: 110, gain: 0.05 },
    "Z":  { f: [3500, 4500, 5500, 6500], b: [5, 5, 5, 5], type: 'mixed', dur: 140, gain: 0.08 },
    "H":  { f: [1000, 1500, 2500, 3500], b: [3, 3, 3, 3], type: 'noise', dur: 100, gain: 0.05 },

    // SONORANTS
    "M":  { f: [280, 900, 2200, 3200], b: [20, 10, 10, 10], type: 'vocal', dur: 140, gain: 0.25 },
    "N":  { f: [280, 1700, 2500, 3200], b: [20, 10, 10, 10], type: 'vocal', dur: 140, gain: 0.25 },
    "L":  { f: [350, 1050, 2600, 3200], b: [10, 10, 10, 10], type: 'vocal', dur: 140, gain: 0.30 },
    "R":  { f: [350, 1100, 1400, 3200], b: [10, 10, 10, 10], type: 'vocal', dur: 150, gain: 0.30 },
    "W":  { f: [300, 650, 2300, 3200],  b: [10, 10, 10, 10], type: 'vocal', dur: 150, gain: 0.30 },

    // PLOSIVES
    "T":  { f: [3500, 5000, 6500, 8000], b: [10, 10, 10, 10], type: 'plosive', dur: 50, gain: 0.2 },
    "K":  { f: [1500, 2500, 3500, 4500], b: [10, 10, 10, 10], type: 'plosive', dur: 60, gain: 0.2 },
    "P":  { f: [800, 1500, 2500, 3500],  b: [10, 10, 10, 10], type: 'plosive', dur: 50, gain: 0.2 },
    "D":  { f: [300, 1700, 2600, 3500],  b: [20, 10, 10, 10], type: 'mixed', dur: 60, gain: 0.2 },
    "B":  { f: [250, 800, 2200, 3500],   b: [20, 10, 10, 10], type: 'mixed', dur: 60, gain: 0.2 },
    "G":  { f: [300, 2000, 3000, 4000],  b: [20, 10, 10, 10], type: 'mixed', dur: 60, gain: 0.2 }, // Added Hard G

    "PAUSE": { dur: 200, type: 'silent' }
};

// --- ENHANCED PHONETIC PARSER ---
function getPhoneticSequence(text) {
    let t = text.toUpperCase();
    let seq = [];
    let i = 0;
    
    // Rule structure: key to match, values (array of phonemes)
    // Ordered by length/priority to catch suffixes first
    const rules = [
        // Suffixes (Fixes "Expression", "Action", "Decision")
        {k:"TION", v:["SH", "AH", "N"]},
        {k:"SION", v:["SH", "AH", "N"]},
        {k:"SSION",v:["SH", "AH", "N"]},
        {k:"CIAN", v:["SH", "AH", "N"]},
        {k:"ING",  v:["IH", "N"]}, 
        {k:"OUS",  v:["AX", "S"]},
        
        // Prefixes (Fixes "Expression", "Explain")
        {k:"EX",   v:["EH", "K", "S"]},
        
        // Double Consonants (Dedupe to prevent stutter)
        {k:"SS", v:["S"]}, {k:"LL", v:["L"]}, {k:"TT", v:["T"]}, 
        {k:"MM", v:["M"]}, {k:"NN", v:["N"]}, {k:"PP", v:["P"]}, 
        {k:"DD", v:["D"]}, {k:"FF", v:["F"]}, {k:"GG", v:["G"]},

        // Common Digraphs
        {k:"WH",v:["W"]}, {k:"TH",v:["TH"]}, {k:"SH",v:["SH"]}, {k:"CH",v:["SH"]},
        {k:"PH",v:["F"]}, {k:"GH",v:["F"]}, {k:"CK",v:["K"]}, {k:"QU",v:["K", "W"]},
        {k:"WR",v:["R"]}, {k:"KN",v:["N"]}, {k:"NG",v:["N"]},

        // Vowel Teams
        {k:"EE",v:["IY"]}, {k:"EA",v:["IY"]}, {k:"OO",v:["UW"]}, {k:"OU",v:["AW"]}, 
        {k:"OW",v:["OW"]}, {k:"OA",v:["OW"]}, {k:"AI",v:["EY"]}, {k:"AY",v:["EY"]},
        {k:"IE",v:["AY"]}, {k:"UY",v:["AY"]}, {k:"OI",v:["OY"]}, {k:"OY",v:["OY"]},
        {k:"IGH",v:["AY"]},

        // R-Controlled
        {k:"ER",v:["ER"]}, {k:"IR",v:["ER"]}, {k:"UR",v:["ER"]}, {k:"AR",v:["AA"]},
        {k:"OR",v:["AO"]}, {k:"AU",v:["AO"]}, {k:"AW",v:["AO"]}, {k:"ALL",v:["AO"]}
    ];

    const singles = {
        "A": "AE", "B": "B", "C": "K", "D": "D", "E": "EH", "F": "F", "G": "G", 
        "H": "SH", "I": "IH", "J": "SH", "K": "K", "L": "L", "M": "M", "N": "N", 
        "O": "AA", "P": "P", "Q": "K", "R": "R", "S": "S", "T": "T", "U": "AH", 
        "V": "F", "W": "W", "X": "S", "Y": "IY", "Z": "Z"
    };

    while (i < t.length) {
        let match = false;
        
        // Check multi-character rules
        for (let r of rules) {
            if (t.substring(i, i + r.k.length) === r.k) {
                // Now supports pushing multiple phonemes from one text match
                r.v.forEach(phonemeKey => {
                    if (P_MAP[phonemeKey]) seq.push(P_MAP[phonemeKey]);
                });
                i += r.k.length;
                match = true;
                break;
            }
        }
        
        if (match) continue;

        // Check single character
        let char = t[i];
        if (singles[char]) {
            seq.push(P_MAP[singles[char]]);
        } else if (" .!?,;".includes(char)) {
            seq.push(P_MAP["PAUSE"]);
        }
        i++;
    }
    return seq;
}

// --- AUDIO GENERATION ---

function createKlattPulse() {
    const size = 512;
    const real = new Float32Array(size);
    const imag = new Float32Array(size);
    for (let n = 1; n < size; n++) {
        imag[n] = 1.0 / n; 
    }
    return audioCtx.createPeriodicWave(real, imag);
}
const klattPulse = createKlattPulse();

function createNoise() {
    const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.5, audioCtx.sampleRate);
    const d = buffer.getChannelData(0);
    for(let i=0; i<d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.7;
    return buffer;
}
const noiseBuffer = createNoise();

let lastP = null;

function playPhoneme(p, t) {
    const dur = p.dur / 1000;
    const tEnd = t + dur;
    const transition = 0.04;

    if (p.type === 'silent') {
        lastP = null;
        return tEnd;
    }

    if (p.type === 'vocal' || p.type === 'mixed') {
        const osc = audioCtx.createOscillator();
        osc.setPeriodicWave(klattPulse);
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(110, tEnd);

        p.f.forEach((freq, i) => {
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            const startF = (lastP && lastP.f && lastP.f[i]) ? lastP.f[i] : freq;
            filter.frequency.setValueAtTime(startF, t);
            filter.frequency.exponentialRampToValueAtTime(freq, t + transition);
            filter.Q.setValueAtTime(p.b[i] || 10, t);

            const gain = audioCtx.createGain();
            const bandGain = (p.gain || 0.2) * (1.0 / (i + 1)); 
            
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(bandGain, t + 0.02);
            gain.gain.linearRampToValueAtTime(bandGain, tEnd - 0.02);
            gain.gain.linearRampToValueAtTime(0, tEnd);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(audioCtx.destination);
        });
        osc.start(t);
        osc.stop(tEnd);
    }

    if (p.type === 'noise' || p.type === 'mixed' || p.type === 'plosive') {
        const src = audioCtx.createBufferSource();
        src.buffer = noiseBuffer;
        const filter = audioCtx.createBiquadFilter();
        
        if (p.type === 'plosive') {
             filter.type = 'lowpass';
             filter.frequency.setValueAtTime(p.f[2], t);
        } else {
             filter.type = 'highpass';
             filter.frequency.setValueAtTime(p.f[0] || 2000, t);
        }

        const gain = audioCtx.createGain();
        const vol = p.gain || 0.1;

        gain.gain.setValueAtTime(0, t);
        if (p.type === 'plosive') {
            gain.gain.linearRampToValueAtTime(vol, t + 0.005);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03); 
        } else {
            gain.gain.linearRampToValueAtTime(vol, t + 0.02);
            gain.gain.linearRampToValueAtTime(vol, tEnd - 0.02);
            gain.gain.linearRampToValueAtTime(0, tEnd);
        }

        src.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        src.start(t);
        src.stop(tEnd);
    }

    lastP = p;
    return tEnd;
}

function speak() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const textInput = document.getElementById('textInput');
    const statusLine = document.getElementById('statusLine');
    if (!textInput) return;

    const text = textInput.value;
    const seq = getPhoneticSequence(text);
    
    let t = audioCtx.currentTime + 0.1;
    lastP = null;

    if (statusLine) statusLine.innerText = "Synthesizing...";
    seq.forEach(p => { t = playPhoneme(p, t); });
    setTimeout(() => { if (statusLine) statusLine.innerText = "Idle"; }, (t - audioCtx.currentTime) * 1000);
}

document.getElementById('playBtn')?.addEventListener('click', speak);
document.getElementById('stopBtn')?.addEventListener('click', () => window.location.reload());
