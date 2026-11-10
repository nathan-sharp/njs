document.addEventListener("DOMContentLoaded", () => {
    const nominalInput = document.getElementById("nominal-size");
    const preferredFitSelect = document.getElementById("preferred-fit");
    const holeDevSelect = document.getElementById("hole-deviation");
    const holeGradeSelect = document.getElementById("hole-grade");
    const shaftDevSelect = document.getElementById("shaft-deviation");
    const shaftGradeSelect = document.getElementById("shaft-grade");
    const calcBtn = document.getElementById("btn-calculate");
    const resetBtn = document.getElementById("btn-reset");
    const canvas = document.getElementById("fit-canvas");

    // ISO 286-1 Standard Tolerance Grades (IT4 to IT12) in µm across the 13 main nominal size bands (up to 500 mm)
    const IT_TABLE = {
        4:  [3,   4,   4,   5,   6,   7,   8,  10,  12,  14,  16,  18,  20],
        5:  [4,   5,   6,   8,   9,  11,  13,  15,  18,  20,  23,  25,  27],
        6:  [6,   8,   9,  11,  13,  16,  19,  22,  25,  29,  32,  36,  40],
        7:  [10, 12,  15,  18,  21,  25,  30,  35,  40,  46,  52,  57,  63],
        8:  [14, 18,  22,  27,  33,  39,  46,  54,  63,  72,  81,  89,  97],
        9:  [25, 30,  36,  43,  52,  62,  74,  87, 100, 115, 130, 140, 155],
        10: [40, 48,  58,  70,  84, 100, 120, 140, 160, 185, 210, 230, 250],
        11: [60, 75,  90, 110, 130, 160, 190, 220, 250, 290, 320, 360, 400],
        12: [100, 120, 150, 180, 210, 250, 300, 350, 400, 460, 520, 570, 630]
    };

    // 25 sub-steps up to 500 mm for exact fundamental deviations (ISO 286-1 Tables 2 & 3)
    const SIZE_STEPS = [
        { min: 0,   max: 3,   mainBand: 0,  a: -270, b: -140, c: -60,  d: -20,  e: -14,  f: -6,  g: -2,  k47: 0, kOther: 0, m: 2,  n: 4,  p: 6,  r: 10,  s: 14,  t: null, u: 18 },
        { min: 3,   max: 6,   mainBand: 1,  a: -270, b: -140, c: -70,  d: -30,  e: -20,  f: -10, g: -4,  k47: 1, kOther: 0, m: 4,  n: 8,  p: 12, r: 15,  s: 19,  t: null, u: 23 },
        { min: 6,   max: 10,  mainBand: 2,  a: -280, b: -150, c: -80,  d: -40,  e: -25,  f: -13, g: -5,  k47: 1, kOther: 0, m: 6,  n: 10, p: 15, r: 19,  s: 23,  t: null, u: 28 },
        { min: 10,  max: 14,  mainBand: 3,  a: -290, b: -150, c: -95,  d: -50,  e: -32,  f: -16, g: -6,  k47: 1, kOther: 0, m: 7,  n: 12, p: 18, r: 23,  s: 28,  t: null, u: 33 },
        { min: 14,  max: 18,  mainBand: 3,  a: -290, b: -150, c: -95,  d: -50,  e: -32,  f: -16, g: -6,  k47: 1, kOther: 0, m: 7,  n: 12, p: 18, r: 23,  s: 28,  t: null, u: 33 },
        { min: 18,  max: 24,  mainBand: 4,  a: -300, b: -160, c: -110, d: -65,  e: -40,  f: -20, g: -7,  k47: 2, kOther: 0, m: 8,  n: 15, p: 22, r: 28,  s: 35,  t: null, u: 41 },
        { min: 24,  max: 30,  mainBand: 4,  a: -300, b: -160, c: -110, d: -65,  e: -40,  f: -20, g: -7,  k47: 2, kOther: 0, m: 8,  n: 15, p: 22, r: 28,  s: 35,  t: 41,   u: 48 },
        { min: 30,  max: 40,  mainBand: 5,  a: -310, b: -170, c: -120, d: -80,  e: -50,  f: -25, g: -9,  k47: 2, kOther: 0, m: 9,  n: 17, p: 26, r: 34,  s: 43,  t: 48,   u: 60 },
        { min: 40,  max: 50,  mainBand: 5,  a: -320, b: -180, c: -130, d: -80,  e: -50,  f: -25, g: -9,  k47: 2, kOther: 0, m: 9,  n: 17, p: 26, r: 34,  s: 43,  t: 54,   u: 70 },
        { min: 50,  max: 65,  mainBand: 6,  a: -340, b: -190, c: -140, d: -100, e: -60,  f: -30, g: -10, k47: 2, kOther: 0, m: 11, n: 20, p: 32, r: 41,  s: 53,  t: 66,   u: 87 },
        { min: 65,  max: 80,  mainBand: 6,  a: -360, b: -200, c: -150, d: -100, e: -60,  f: -30, g: -10, k47: 2, kOther: 0, m: 11, n: 20, p: 32, r: 43,  s: 59,  t: 75,   u: 102 },
        { min: 80,  max: 100, mainBand: 7,  a: -380, b: -220, c: -170, d: -120, e: -72,  f: -36, g: -12, k47: 3, kOther: 0, m: 13, n: 23, p: 37, r: 51,  s: 71,  t: 91,   u: 124 },
        { min: 100, max: 120, mainBand: 7,  a: -410, b: -240, c: -180, d: -120, e: -72,  f: -36, g: -12, k47: 3, kOther: 0, m: 13, n: 23, p: 37, r: 54,  s: 79,  t: 104,  u: 144 },
        { min: 120, max: 140, mainBand: 8,  a: -460, b: -260, c: -200, d: -145, e: -85,  f: -43, g: -14, k47: 3, kOther: 0, m: 15, n: 27, p: 43, r: 63,  s: 92,  t: 122,  u: 170 },
        { min: 140, max: 160, mainBand: 8,  a: -520, b: -280, c: -210, d: -145, e: -85,  f: -43, g: -14, k47: 3, kOther: 0, m: 15, n: 27, p: 43, r: 65,  s: 100, t: 134,  u: 190 },
        { min: 160, max: 180, mainBand: 8,  a: -580, b: -310, c: -230, d: -145, e: -85,  f: -43, g: -14, k47: 3, kOther: 0, m: 15, n: 27, p: 43, r: 68,  s: 108, t: 146,  u: 210 },
        { min: 180, max: 200, mainBand: 9,  a: -660, b: -340, c: -240, d: -170, e: -100, f: -50, g: -15, k47: 4, kOther: 0, m: 17, n: 31, p: 50, r: 77,  s: 122, t: 166,  u: 236 },
        { min: 200, max: 225, mainBand: 9,  a: -740, b: -380, c: -260, d: -170, e: -100, f: -50, g: -15, k47: 4, kOther: 0, m: 17, n: 31, p: 50, r: 80,  s: 130, t: 180,  u: 258 },
        { min: 225, max: 250, mainBand: 9,  a: -820, b: -420, c: -280, d: -170, e: -100, f: -50, g: -15, k47: 4, kOther: 0, m: 17, n: 31, p: 50, r: 84,  s: 140, t: 196,  u: 284 },
        { min: 250, max: 280, mainBand: 10, a: -920, b: -480, c: -300, d: -190, e: -110, f: -56, g: -17, k47: 4, kOther: 0, m: 20, n: 34, p: 56, r: 94,  s: 158, t: 218,  u: 315 },
        { min: 280, max: 315, mainBand: 10, a: -1050, b: -540, c: -330, d: -190, e: -110, f: -56, g: -17, k47: 4, kOther: 0, m: 20, n: 34, p: 56, r: 98,  s: 170, t: 240,  u: 350 },
        { min: 315, max: 355, mainBand: 11, a: -1200, b: -600, c: -360, d: -210, e: -125, f: -62, g: -18, k47: 4, kOther: 0, m: 21, n: 37, p: 62, r: 108, s: 190, t: 268,  u: 390 },
        { min: 355, max: 400, mainBand: 11, a: -1350, b: -680, c: -400, d: -210, e: -125, f: -62, g: -18, k47: 4, kOther: 0, m: 21, n: 37, p: 62, r: 114, s: 208, t: 294,  u: 435 },
        { min: 400, max: 450, mainBand: 12, a: -1500, b: -760, c: -440, d: -230, e: -135, f: -68, g: -20, k47: 5, kOther: 0, m: 23, n: 40, p: 68, r: 126, s: 232, t: 330,  u: 490 },
        { min: 450, max: 500, mainBand: 12, a: -1650, b: -840, c: -480, d: -230, e: -135, f: -68, g: -20, k47: 5, kOther: 0, m: 23, n: 40, p: 68, r: 132, s: 252, t: 360,  u: 540 }
    ];

    function findStep(diameter) {
        if (diameter <= 0 || diameter > 500 || isNaN(diameter)) return null;
        for (const step of SIZE_STEPS) {
            if (diameter > step.min && diameter <= step.max) {
                return step;
            }
        }
        return null;
    }

    function calculateShaftLimits(step, dev, grade) {
        const tol = IT_TABLE[grade][step.mainBand];
        let es = 0;
        let ei = 0;

        if (dev === "a" || dev === "b" || dev === "c" || dev === "d" || dev === "e" || dev === "f" || dev === "g") {
            es = step[dev];
            ei = es - tol;
        } else if (dev === "h") {
            es = 0;
            ei = -tol;
        } else if (dev === "js") {
            es = tol / 2;
            ei = -tol / 2;
        } else if (dev === "k") {
            ei = (grade >= 4 && grade <= 7) ? step.k47 : step.kOther;
            es = ei + tol;
        } else if (dev === "m" || dev === "n" || dev === "p" || dev === "r" || dev === "s" || dev === "t" || dev === "u") {
            const baseEi = (dev === "t" && step.t === null) ? step.s : step[dev];
            ei = baseEi;
            es = ei + tol;
        }

        return { es, ei, tol };
    }

    function calculateHoleLimits(step, dev, grade) {
        const tol = IT_TABLE[grade][step.mainBand];
        const prevTol = IT_TABLE[grade - 1] ? IT_TABLE[grade - 1][step.mainBand] : tol;
        const delta = tol - prevTol;
        const lowerDev = dev.toLowerCase();
        let ES = 0;
        let EI = 0;

        if (lowerDev === "a" || lowerDev === "b" || lowerDev === "c" || lowerDev === "d" || lowerDev === "e" || lowerDev === "f" || lowerDev === "g") {
            EI = -step[lowerDev];
            ES = EI + tol;
        } else if (lowerDev === "h") {
            EI = 0;
            ES = tol;
        } else if (lowerDev === "js") {
            ES = tol / 2;
            EI = -tol / 2;
        } else if (lowerDev === "k") {
            const shaftEi = (grade <= 8) ? step.k47 : step.kOther;
            const addDelta = (step.max > 3 && grade >= 3 && grade <= 8) ? delta : 0;
            ES = -shaftEi + addDelta;
            EI = ES - tol;
        } else if (lowerDev === "m" || lowerDev === "n") {
            const shaftEi = step[lowerDev];
            const isN9Plus = (lowerDev === "n" && grade >= 9);
            const addDelta = (step.max > 3 && grade >= 3 && grade <= 8 && !isN9Plus) ? delta : 0;
            ES = isN9Plus ? 0 : (-shaftEi + addDelta);
            if (lowerDev === "m" && grade === 6 && step.mainBand === 10) {
                ES = -9;
            }
            EI = ES - tol;
        } else if (lowerDev === "p" || lowerDev === "r" || lowerDev === "s" || lowerDev === "t" || lowerDev === "u") {
            const shaftEi = (lowerDev === "t" && step.t === null) ? step.s : step[lowerDev];
            const addDelta = (step.max > 3 && grade >= 3 && grade <= 7) ? delta : 0;
            ES = -shaftEi + addDelta;
            EI = ES - tol;
        }

        return { ES, EI, tol };
    }

    function formatSignedUm(val) {
        if (val > 0) return `+${ val }`;
        return `${ val }`;
    }

    function formatMmFromUm(um, includeSign = true) {
        const decimals = (um % 1 === 0) ? 3 : 4;
        const mm = (um / 1000).toFixed(decimals);
        if (!includeSign) return mm;
        if (um > 0) return `+${ mm }`;
        return mm;
    }

    function formatDimMm(nominal, offsetUm) {
        const decimals = (offsetUm % 1 === 0) ? 3 : 4;
        return (nominal + offsetUm / 1000).toFixed(decimals);
    }

    function formatDrawingDeviations(nominal, upperUm, lowerUm) {
        if (upperUm === -lowerUm) {
            return `${ nominal } ±${ formatMmFromUm(Math.abs(upperUm), false) } mm`;
        }
        return `${ nominal } ${ formatMmFromUm(upperUm, true) } / ${ formatMmFromUm(lowerUm, true) } mm`;
    }

    function formatDrawingSymmetrical(nominal, upperUm, lowerUm) {
        const meanUm = (upperUm + lowerUm) / 2;
        const halfTolUm = (upperUm - lowerUm) / 2;
        const meanStr = (meanUm === 0) ? `${ nominal }` : formatDimMm(nominal, meanUm);
        const tolStr = formatMmFromUm(halfTolUm, false);
        return `${ meanStr } ±${ tolStr } mm`;
    }

    function syncPresetDropdown() {
        if (!preferredFitSelect) return;
        const currentCombo = `${ holeDevSelect.value }${ holeGradeSelect.value }/${ shaftDevSelect.value }${ shaftGradeSelect.value }`;
        const matchingOption = Array.from(preferredFitSelect.options).find((opt) => opt.value === currentCombo);
        preferredFitSelect.value = matchingOption ? currentCombo : "custom";
    }

    function applyPresetSelection() {
        if (!preferredFitSelect || preferredFitSelect.value === "custom") return;
        const [holePart, shaftPart] = preferredFitSelect.value.split("/");
        const holeMatch = holePart.match(/^([A-Z]+)(\d+)$/);
        const shaftMatch = shaftPart.match(/^([a-z]+)(\d+)$/);
        if (holeMatch && shaftMatch) {
            holeDevSelect.value = holeMatch[1];
            holeGradeSelect.value = holeMatch[2];
            shaftDevSelect.value = shaftMatch[1];
            shaftGradeSelect.value = shaftMatch[2];
            updateCalculator();
        }
    }

    function updateCalculator() {
        const rawNominal = parseFloat(nominalInput.value);
        const nominal = (!isNaN(rawNominal) && rawNominal > 0 && rawNominal <= 500) ? rawNominal : 25;
        const step = findStep(nominal);

        const holeDev = holeDevSelect.value;
        const holeGrade = parseInt(holeGradeSelect.value, 10);
        const shaftDev = shaftDevSelect.value;
        const shaftGrade = parseInt(shaftGradeSelect.value, 10);

        const holeClass = `${ holeDev }${ holeGrade }`;
        const shaftClass = `${ shaftDev }${ shaftGrade }`;

        document.getElementById("res-hole-class").textContent = `${ nominal } ${ holeClass }`;
        document.getElementById("res-shaft-class").textContent = `${ nominal } ${ shaftClass }`;
        document.getElementById("res-fit-designation").textContent = `Ø${ nominal } ${ holeClass }/${ shaftClass }`;

        if (!step) return;

        const hole = calculateHoleLimits(step, holeDev, holeGrade);
        const shaft = calculateShaftLimits(step, shaftDev, shaftGrade);

        const holeMax = nominal + hole.ES / 1000;
        const holeMin = nominal + hole.EI / 1000;
        const shaftMax = nominal + shaft.es / 1000;
        const shaftMin = nominal + shaft.ei / 1000;

        const holeDwgDev = formatDrawingDeviations(nominal, hole.ES, hole.EI);
        const shaftDwgDev = formatDrawingDeviations(nominal, shaft.es, shaft.ei);
        const holeDwgSym = formatDrawingSymmetrical(nominal, hole.ES, hole.EI);
        const shaftDwgSym = formatDrawingSymmetrical(nominal, shaft.es, shaft.ei);

        document.getElementById("res-hole-dwg-dev").textContent = holeDwgDev;
        document.getElementById("res-shaft-dwg-dev").textContent = shaftDwgDev;
        document.getElementById("res-hole-dwg-sym").textContent = holeDwgSym;
        document.getElementById("res-shaft-dwg-sym").textContent = shaftDwgSym;

        document.getElementById("res-hole-es").textContent = `${ formatSignedUm(hole.ES) } µm`;
        document.getElementById("res-hole-ei").textContent = `${ formatSignedUm(hole.EI) } µm`;
        document.getElementById("res-hole-max").textContent = `${ holeMax.toFixed(4) } mm`;
        document.getElementById("res-hole-min").textContent = `${ holeMin.toFixed(4) } mm`;
        document.getElementById("res-hole-tol").textContent = `${ hole.tol } µm`;

        document.getElementById("res-shaft-es").textContent = `${ formatSignedUm(shaft.es) } µm`;
        document.getElementById("res-shaft-ei").textContent = `${ formatSignedUm(shaft.ei) } µm`;
        document.getElementById("res-shaft-max").textContent = `${ shaftMax.toFixed(4) } mm`;
        document.getElementById("res-shaft-min").textContent = `${ shaftMin.toFixed(4) } mm`;
        document.getElementById("res-shaft-tol").textContent = `${ shaft.tol } µm`;

        // Fit clearance/interference in µm
        const maxClearance = hole.ES - shaft.ei;
        const minClearance = hole.EI - shaft.es;
        const meanClearanceUm = (maxClearance + minClearance) / 2;
        const halfFitTolUm = (maxClearance - minClearance) / 2;

        let fitType = "Transition Fit";
        if (minClearance >= 0) {
            fitType = "Clearance Fit";
        } else if (maxClearance <= 0) {
            fitType = "Interference (Press) Fit";
        }

        document.getElementById("res-fit-type").textContent = fitType;
        document.getElementById("res-fit-hole-dwg").textContent = `Ø${ holeDwgSym } (Ø${ holeDwgDev })`;
        document.getElementById("res-fit-shaft-dwg").textContent = `Ø${ shaftDwgSym } (Ø${ shaftDwgDev })`;
        document.getElementById("res-fit-dwg-allowance").textContent = `${ formatMmFromUm(meanClearanceUm, true) } ±${ formatMmFromUm(halfFitTolUm, false) } mm`;
        document.getElementById("res-max-clearance").textContent = `${ formatSignedUm(maxClearance) } µm (${ formatMmFromUm(maxClearance, true) } mm)`;
        document.getElementById("res-min-clearance").textContent = `${ formatSignedUm(minClearance) } µm (${ formatMmFromUm(minClearance, true) } mm)`;

        drawToleranceCanvas(nominal, holeClass, shaftClass, hole, shaft, fitType);
    }

    function drawToleranceCanvas(nominal, holeClass, shaftClass, hole, shaft, fitType) {
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        // Determine vertical scale in µm to fit 0 line, Hole zone, and Shaft zone with padding
        const maxUm = Math.max(0, hole.ES, shaft.es, 20);
        const minUm = Math.min(0, hole.EI, shaft.ei, -20);
        const spanUm = Math.max(maxUm - minUm, 20);
        const padTop = 42;
        const padBottom = 42;
        const usableHeight = h - padTop - padBottom;

        function umToY(um) {
            return padTop + ((maxUm - um) / spanUm) * usableHeight;
        }

        const zeroY = umToY(0);

        // Zero Line (Basic Size)
        ctx.strokeStyle = "#1a1a1a";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(55, zeroY);
        ctx.lineTo(w - 40, zeroY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#555555";
        ctx.font = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillText(`0 Line (Ø${ nominal } mm)`, 60, zeroY - 8);

        // Draw Hole Tolerance Zone
        const holeTopY = umToY(hole.ES);
        const holeBottomY = umToY(hole.EI);
        const holeBoxH = Math.max(holeBottomY - holeTopY, 4);
        const holeX = 230;
        const boxW = 135;

        ctx.fillStyle = "rgba(0, 85, 255, 0.16)";
        ctx.strokeStyle = "#0055ff";
        ctx.lineWidth = 1.5;
        ctx.fillRect(holeX, holeTopY, boxW, holeBoxH);
        ctx.strokeRect(holeX, holeTopY, boxW, holeBoxH);

        ctx.fillStyle = "#0055ff";
        ctx.font = "600 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillText(`Hole (${ holeClass })`, holeX + 8, holeTopY - 8);
        ctx.fillStyle = "#1a1a1a";
        ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillText(`ES: ${ formatSignedUm(hole.ES) } µm`, holeX + boxW + 8, holeTopY + 10);
        ctx.fillText(`EI: ${ formatSignedUm(hole.EI) } µm`, holeX + boxW + 8, holeBottomY);

        // Draw Shaft Tolerance Zone
        const shaftTopY = umToY(shaft.es);
        const shaftBottomY = umToY(shaft.ei);
        const shaftBoxH = Math.max(shaftBottomY - shaftTopY, 4);
        const shaftX = 480;

        ctx.fillStyle = "rgba(26, 26, 26, 0.14)";
        ctx.strokeStyle = "#1a1a1a";
        ctx.lineWidth = 1.5;
        ctx.fillRect(shaftX, shaftTopY, boxW, shaftBoxH);
        ctx.strokeRect(shaftX, shaftTopY, boxW, shaftBoxH);

        ctx.fillStyle = "#1a1a1a";
        ctx.font = "600 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillText(`Shaft (${ shaftClass })`, shaftX + 8, shaftTopY - 8);
        ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillText(`es: ${ formatSignedUm(shaft.es) } µm`, shaftX + boxW + 8, shaftTopY + 10);
        ctx.fillText(`ei: ${ formatSignedUm(shaft.ei) } µm`, shaftX + boxW + 8, shaftBottomY);

        // Fit type & summary footer on canvas
        ctx.fillStyle = "#555555";
        ctx.font = "600 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillText(`Ø${ nominal } ${ holeClass }/${ shaftClass } — ${ fitType }`, 60, h - 14);
    }

    function resetDefaults() {
        nominalInput.value = "25";
        if (preferredFitSelect) preferredFitSelect.value = "H7/g6";
        holeDevSelect.value = "H";
        holeGradeSelect.value = "7";
        shaftDevSelect.value = "g";
        shaftGradeSelect.value = "6";
        updateCalculator();
    }

    calcBtn.addEventListener("click", updateCalculator);
    resetBtn.addEventListener("click", resetDefaults);

    if (preferredFitSelect) {
        preferredFitSelect.addEventListener("change", applyPresetSelection);
    }

    [holeDevSelect, holeGradeSelect, shaftDevSelect, shaftGradeSelect].forEach((el) => {
        el.addEventListener("change", () => {
            syncPresetDropdown();
            updateCalculator();
        });
    });

    nominalInput.addEventListener("change", updateCalculator);
    nominalInput.addEventListener("input", updateCalculator);

    updateCalculator();
});
