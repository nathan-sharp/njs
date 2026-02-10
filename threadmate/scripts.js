document.addEventListener('DOMContentLoaded', function () {
    const typesSelect = document.getElementById('Types');
    const threadClassSelect = document.getElementById('thread-class');
    const metricLabel = document.getElementById('metric-class-label');
    const nptLabel = document.getElementById('npt-class-label');
    const iso7Label = document.getElementById('iso7-class-label');
    const pitchContainer = document.getElementById('pitch-container');
    const tpiContainer = document.getElementById('tpi-container');
    const leContainer = document.getElementById('le-container');
    const nomDiaLabel = document.getElementById('nom-dia-label');
    const diaUnit = document.getElementById('dia-unit');
    const leUnit = document.getElementById('le-unit');
    const nptNote = document.getElementById('npt-note');
    const iso7Note = document.getElementById('iso7-note');
    const btn = document.getElementById('calc-btn');
    
    // Toggle Input Visibility
    function toggleMode() {
        const val = typesSelect.value;
        const isMetric = val === 'Metric';
        const isNPT = val === 'NPT';
        const isISO7 = val === 'ISO7';
        
        // Units
        // ISO 7 uses mm for dimensions in the standard tables
        diaUnit.textContent = (isMetric || isISO7) ? 'mm' : 'in';
        leUnit.textContent = (isMetric || isISO7) ? 'mm' : 'in';

        // Reset all
        pitchContainer.style.display = 'none';
        tpiContainer.style.display = 'none';
        leContainer.style.display = 'block';
        threadClassSelect.style.display = 'none';
        metricLabel.style.display = 'none';
        nptLabel.style.display = 'none';
        iso7Label.style.display = 'none';
        nptNote.style.display = 'none';
        iso7Note.style.display = 'none';

        if (isNPT || isISO7) {
            nomDiaLabel.textContent = "Nominal Pipe Size:";
            document.getElementById('nominal-diameter').placeholder = "e.g. 0.5 for 1/2\"";
            leContainer.style.display = 'none'; // Fixed length for pipe threads

            if(isNPT) {
                nptLabel.style.display = 'inline';
                nptNote.style.display = 'block';
                // NPT uses inches for input even though it's pipe size
                diaUnit.textContent = "in"; 
            } else {
                iso7Label.style.display = 'inline';
                iso7Note.style.display = 'block';
                // ISO 7 input is typically inch based (1/2") but calculation is mm
                // We will ask for decimal inch equivalent for consistency with NPT
                diaUnit.textContent = "in";
            }

        } else {
            nomDiaLabel.textContent = "Nominal Diameter:";
            document.getElementById('nominal-diameter').placeholder = "e.g. 0.250 or 6";

            if (isMetric) {
                pitchContainer.style.display = 'block';
                metricLabel.style.display = 'inline';
            } else {
                tpiContainer.style.display = 'block';
                threadClassSelect.style.display = 'inline-block';
            }
        }
    }

    typesSelect.addEventListener('change', toggleMode);
    toggleMode(); // Init

    btn.addEventListener('click', calculate);

    function calculate() {
        const errorBox = document.getElementById('error-box');
        errorBox.style.display = 'none';
        errorBox.innerText = '';

        try {
            const type = typesSelect.value;
            const D_input = parseFloat(document.getElementById('nominal-diameter').value);
            
            if (isNaN(D_input) || D_input <= 0) throw new Error("Please enter a valid Nominal Size.");
            
            let results = {};

            if (type === 'NPT') {
                results = calculateNPT(D_input);
            } else if (type === 'ISO7') {
                results = calculateISO7(D_input);
            } else if (type === 'UN') {
                const tpi = parseFloat(document.getElementById('threads-per-inch').value);
                if (isNaN(tpi) || tpi <= 0) throw new Error("Please enter valid Threads Per Inch.");
                const P = 1.0 / tpi;
                let LE = parseFloat(document.getElementById('le').value);
                if (isNaN(LE) || LE <= 0) LE = D_input;
                const classNum = parseInt(threadClassSelect.value);
                results = calculateUnified(D_input, P, LE, classNum);
            } else {
                const P = parseFloat(document.getElementById('pitch').value);
                if (isNaN(P) || P <= 0) throw new Error("Please enter a valid Pitch.");
                results = calculateMetric(D_input, P);
            }

            displayResults(results, type);
            
            // Draw Both Diagrams
            const isPipe = (type === 'NPT' || type === 'ISO7');
            drawProfile('thread-diagram-ext', results.ext, type, false, isPipe);
            drawProfile('thread-diagram-int', results.int, type, true, isPipe);

        } catch (e) {
            errorBox.innerText = e.message;
            errorBox.style.display = 'block';
        }
    }

    // ==========================================
    // LOGIC: NPT (ASME B1.20.1)
    // ==========================================
    const nptTable = {
        0.0625: { tpi: 27, od: 0.3125, l1: 0.160 },
        0.125:  { tpi: 27, od: 0.405,  l1: 0.1615 },
        0.25:   { tpi: 18, od: 0.540,  l1: 0.2278 },
        0.375:  { tpi: 18, od: 0.675,  l1: 0.240 },
        0.5:    { tpi: 14, od: 0.840,  l1: 0.320 },
        0.75:   { tpi: 14, od: 1.050,  l1: 0.339 },
        1.0:    { tpi: 11.5, od: 1.315, l1: 0.400 },
        1.25:   { tpi: 11.5, od: 1.660, l1: 0.420 },
        1.5:    { tpi: 11.5, od: 1.900, l1: 0.420 },
        2.0:    { tpi: 11.5, od: 2.375, l1: 0.436 },
        2.5:    { tpi: 8, od: 2.875, l1: 0.682 },
        3.0:    { tpi: 8, od: 3.500, l1: 0.766 },
        3.5:    { tpi: 8, od: 4.000, l1: 0.821 },
        4.0:    { tpi: 8, od: 4.500, l1: 0.844 }
    };

    function calculateNPT(size) {
        const sizes = Object.keys(nptTable).map(parseFloat);
        const closest = sizes.reduce((prev, curr) => {
            return (Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev);
        });

        if (Math.abs(closest - size) > 0.05) {
            throw new Error("Non-standard NPT size. Please use standard pipe sizes (e.g. 0.5, 1.0, 2.0).");
        }

        const data = nptTable[closest];
        const P = 1.0 / data.tpi;
        const OD = data.od; 
        const L1 = data.l1; 
        
        const E0 = OD - (0.05 * OD + 1.1) * P;
        const E1_basic = E0 + (0.0625 * L1);

        const diam_tol = P * 0.0625;
        const PD_Max = E1_basic + diam_tol;
        const PD_Min = E1_basic - diam_tol;

        // NPT h = 0.8P
        const h = 0.8 * P;
        const Maj_Basic = E1_basic + h;
        const Maj_Max = Maj_Basic + diam_tol; 
        const Maj_Min = Maj_Basic - diam_tol;
        const Min_Basic = E1_basic - h;
        const Min_Max = Min_Basic + diam_tol;
        const Min_Min = Min_Basic - diam_tol;

        const common = {
            majMax: Maj_Max, majMin: Maj_Min,
            pdMax: PD_Max, pdMin: PD_Min,
            minMax: Min_Max, minMin: Min_Min,
            classStr: "NPT"
        };
        return { ext: common, int: common };
    }

    // ==========================================
    // LOGIC: ISO 7-1 (R/Rc - BSPT)
    // ==========================================
    // Table values in Metric (mm)
    const iso7Table = {
        0.0625: { P: 0.907, Maj: 7.723,  L1: 4.0 }, // 1/16 (28 tpi)
        0.125:  { P: 0.907, Maj: 9.728,  L1: 4.0 }, // 1/8  (28 tpi)
        0.25:   { P: 1.337, Maj: 13.157, L1: 6.0 }, // 1/4  (19 tpi)
        0.375:  { P: 1.337, Maj: 16.662, L1: 6.4 }, // 3/8  (19 tpi)
        0.5:    { P: 1.814, Maj: 20.955, L1: 8.2 }, // 1/2  (14 tpi)
        0.75:   { P: 1.814, Maj: 26.441, L1: 9.5 }, // 3/4  (14 tpi)
        1.0:    { P: 2.309, Maj: 33.249, L1: 10.4 }, // 1   (11 tpi)
        1.25:   { P: 2.309, Maj: 41.910, L1: 12.7 }, // 1-1/4
        1.5:    { P: 2.309, Maj: 47.803, L1: 12.7 }, // 1-1/2
        2.0:    { P: 2.309, Maj: 59.614, L1: 15.9 }, // 2
        2.5:    { P: 2.309, Maj: 75.184, L1: 17.5 }, // 2-1/2
        3.0:    { P: 2.309, Maj: 87.884, L1: 20.6 }, // 3
        4.0:    { P: 2.309, Maj: 113.030, L1: 25.4 } // 4
    };

    function calculateISO7(size) {
        // Find closest standard size
        const sizes = Object.keys(iso7Table).map(parseFloat);
        const closest = sizes.reduce((prev, curr) => {
            return (Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev);
        });
        if (Math.abs(closest - size) > 0.05) {
            throw new Error("Non-standard Pipe size. Use 0.5, 1.0, etc.");
        }

        const data = iso7Table[closest];
        const P = data.P; 
        const D_basic = data.Maj; // Basic Major Dia at Gauge Plane
        
        // Whitworth Thread Form (55 deg)
        // h = 0.640327 * P
        const h = 0.640327 * P;
        
        // Basic Diameters at Gauge Plane
        const d_maj_basic = D_basic;
        const d_pitch_basic = D_basic - h;
        const d_min_basic = D_basic - (2 * h);

        // Tolerance logic per ISO 7-1
        // Tolerance on gauge length is +/- P (one pitch)
        // Taper is 1:16. 
        // Change in diameter = Change in length / 16
        // Diam Tol = P / 16
        const diam_tol = P / 16.0;

        const Maj_Max = d_maj_basic + diam_tol;
        const Maj_Min = d_maj_basic - diam_tol;
        
        const PD_Max = d_pitch_basic + diam_tol;
        const PD_Min = d_pitch_basic - diam_tol;

        const Min_Max = d_min_basic + diam_tol;
        const Min_Min = d_min_basic - diam_tol;

        const common = {
            majMax: Maj_Max, majMin: Maj_Min,
            pdMax: PD_Max, pdMin: PD_Min,
            minMax: Min_Max, minMin: Min_Min,
            classStr: "ISO 7-1 (R/Rc)"
        };

        return { ext: common, int: common };
    }

    // ==========================================
    // LOGIC: UNIFIED INCH THREADS (ASME B1.1)
    // ==========================================
    function calculateUnified(D, P, LE, classNum) {
        const H = 0.8660254028 * P; 
        const D2_basic = D - (2 * 0.375 * H);
        const D1_basic = D - (2 * 0.625 * H);

        const term1 = 0.0015 * Math.pow(D, 1/3);
        const term2 = 0.0015 * Math.sqrt(LE);
        const term3 = 0.015 * Math.pow(P*P, 1/3);
        let Td2_Class2A = term1 + term2 + term3;

        let Td2_Ext = 0;
        let allowance = 0; 

        if (classNum === 1) { // 1A
            Td2_Ext = 1.500 * Td2_Class2A;
            allowance = 0.300 * Td2_Class2A; 
        } else if (classNum === 2) { // 2A
            Td2_Ext = 1.000 * Td2_Class2A;
            allowance = 0.300 * Td2_Class2A;
        } else { // 3A
            Td2_Ext = 0.750 * Td2_Class2A;
            allowance = 0.0;
        }

        const ext_MajDia_Max = D - allowance;
        const Td_Class2A = 0.090 * Math.pow(P*P, 1/3);
        let Td_Ext = (classNum === 1) ? 1.5 * Td_Class2A : (classNum === 3 ? 0.0 : Td_Class2A); 
        if(classNum === 3) Td_Ext = 0.060 * Math.pow(P*P, 1/3);

        const ext_Maj_Min_Calc = ext_MajDia_Max - Td_Ext;
        const ext_PD_Max = D2_basic - allowance;
        const ext_PD_Min = ext_PD_Max - Td2_Ext;
        const ext_Min_Min = ext_PD_Min - (0.649519 * P); 

        // Internal
        let Td2_Int = 0;
        if (classNum === 1) { Td2_Int = 1.950 * Td2_Class2A; }
        else if (classNum === 2) { Td2_Int = 1.300 * Td2_Class2A; }
        else { Td2_Int = 0.975 * Td2_Class2A; }

        const int_PD_Min = D2_basic;
        const int_PD_Max = int_PD_Min + Td2_Int;
        const int_Maj_Min = D; 
        
        let TD1 = 0.25 * P; 
        if (classNum === 3) TD1 = 0.2 * P;
        const int_Min_Max = D1_basic + TD1;
        const int_Min_Min = D1_basic;

        return {
            ext: {
                majMax: ext_MajDia_Max,
                majMin: ext_Maj_Min_Calc,
                pdMax: ext_PD_Max,
                pdMin: ext_PD_Min,
                minMin: ext_Min_Min,
                classStr: `Class ${classNum}A`
            },
            int: {
                majMin: int_Maj_Min,
                pdMax: int_PD_Max,
                pdMin: int_PD_Min,
                minMax: int_Min_Max,
                minMin: int_Min_Min,
                classStr: `Class ${classNum}B`
            }
        };
    }

    // ==========================================
    // LOGIC: METRIC M SERIES (ISO 965)
    // ==========================================
    function calculateMetric(D, P) {
        const d2_basic = D - 0.649519 * P;
        const d1_basic = D - 1.082532 * P;

        const es_microns = -(15 + 11 * P);
        const es = es_microns / 1000.0; 

        const Td2_microns = 90 * Math.pow(P, 0.4) * Math.pow(D, 0.1);
        const Td2 = Td2_microns / 1000.0;

        const Td_microns = 180 * Math.pow(P, 2/3) - (3.15 / Math.sqrt(P));
        const Td = Td_microns / 1000.0;

        const ext_Maj_Max = D + es;
        const ext_Maj_Min = ext_Maj_Max - Td;
        const ext_PD_Max = d2_basic + es;
        const ext_PD_Min = ext_PD_Max - Td2;
        const ext_Min_Min = ext_PD_Min - (0.6134 * P);

        const EI = 0;
        const TD2 = 1.32 * Td2; 
        
        let TD1_microns = (P <= 0.2) ? 38 : (230 * Math.pow(P, 0.7)); 
        const TD1 = TD1_microns / 1000.0;

        const int_PD_Min = d2_basic + EI;
        const int_PD_Max = int_PD_Min + TD2;
        const int_Min_Min = d1_basic + EI;
        const int_Min_Max = int_Min_Min + TD1;
        const int_Maj_Min = D;

        return {
            ext: {
                majMax: ext_Maj_Max,
                majMin: ext_Maj_Min,
                pdMax: ext_PD_Max,
                pdMin: ext_PD_Min,
                minMin: ext_Min_Min,
                classStr: `6g`
            },
            int: {
                majMin: int_Maj_Min,
                pdMax: int_PD_Max,
                pdMin: int_PD_Min,
                minMax: int_Min_Max,
                minMin: int_Min_Min,
                classStr: `6H`
            }
        };
    }

    function displayResults(data, type) {
        const decimals = (type === 'UN') ? 4 : 3;
        // For NPT and ISO 7, use 4 decimals
        const d = (type === 'NPT' || type === 'ISO7') ? 4 : decimals;
        
        // Internal
        document.getElementById('int-class-display').textContent = data.int.classStr;
        document.getElementById('I-PD_Max').textContent = data.int.pdMax.toFixed(d);
        document.getElementById('I-PD_Min').textContent = data.int.pdMin.toFixed(d);
        document.getElementById('I-Maj_Min').textContent = data.int.majMin.toFixed(d);
        document.getElementById('I-Min_Max').textContent = data.int.minMax.toFixed(d);
        document.getElementById('I-Min_Min').textContent = data.int.minMin.toFixed(d);

        // External
        document.getElementById('ext-class-display').textContent = data.ext.classStr;
        document.getElementById('E-PD_Max').textContent = data.ext.pdMax.toFixed(d);
        document.getElementById('E-PD_Min').textContent = data.ext.pdMin.toFixed(d);
        document.getElementById('E-Maj_Max').textContent = data.ext.majMax.toFixed(d);
        document.getElementById('E-Maj_Min').textContent = data.ext.majMin.toFixed(d);
        document.getElementById('E-Min_Min').textContent = data.ext.minMin.toFixed(d);
    }

    // ==========================================
    // DIAGRAM DRAWING (Schematic)
    // ==========================================
    function drawProfile(canvasId, data, type, isInternal, isPipe) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        const decimals = (type === 'UN') ? 4 : 3;
        const d = (type === 'NPT' || type === 'ISO7') ? 4 : decimals;

        // Clear
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "white";
        ctx.fillRect(0,0,w,h);

        // Settings
        const mx = 50; 
        const my = 40; 
        const profileH = 120;
        const yCenter = h - 40; 

        // Colors
        const colorMaj = "#D32F2F"; // Red
        const colorPitch = "#1976D2"; // Blue
        const colorMin = "#388E3C"; // Green

        // Calculate Visual Y levels 
        const yTop = my; 
        const yBottom = my + profileH;
        const yPitch = my + (profileH / 2);

        let yCrest, yRoot;
        
        if (isInternal) {
            yCrest = yBottom; 
            yRoot = yTop;     
        } else {
            yCrest = yTop;    
            yRoot = yBottom;  
        }

        // Draw Centerline
        ctx.beginPath();
        ctx.setLineDash([15, 10, 5, 10]); 
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.moveTo(0, yCenter);
        ctx.lineTo(w, yCenter);
        ctx.stroke();
        ctx.setLineDash([]); 

        // Create Hatch Pattern
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = 10;
        patternCanvas.height = 10;
        const pCtx = patternCanvas.getContext('2d');
        pCtx.strokeStyle = '#ddd';
        pCtx.lineWidth = 1;
        pCtx.beginPath();
        pCtx.moveTo(0, 10);
        pCtx.lineTo(10, 0);
        pCtx.stroke();
        const hatchPattern = ctx.createPattern(patternCanvas, 'repeat');

        // Define Path
        ctx.beginPath();
        
        const toothW = 80;
        let x = mx;
        const flatW = toothW * 0.125;
        
        // Track path for stroke and fill
        const startX = x - toothW/2;
        let endX;

        // Start of profile
        ctx.moveTo(startX, yRoot); 

        // Draw 4 teeth (profile only)
        for(let i=0; i<4; i++) {
            if(!isInternal) {
                ctx.lineTo(x, yCrest); 
                ctx.lineTo(x + flatW, yCrest);
                ctx.lineTo(x + toothW/2 + flatW/2, yRoot);
            } else {
                ctx.lineTo(x, yCrest);
                ctx.lineTo(x + flatW, yCrest);
                ctx.lineTo(x + toothW/2 + flatW/2, yRoot);
            }
            if(i==3) endX = x + toothW/2 + flatW/2;
            x += toothW;
        }
        
        // Close path for Fill
        if (!isInternal) {
            // EXTERNAL: Fill down to axis
            ctx.lineTo(endX, yCenter);
            ctx.lineTo(startX, yCenter);
            ctx.lineTo(startX, yRoot);
        } else {
            // INTERNAL: Fill up to top edge
            ctx.lineTo(endX, 10);
            ctx.lineTo(startX, 10);
            ctx.lineTo(startX, yRoot);
        }
        
        // Fill with Pattern
        ctx.fillStyle = hatchPattern;
        ctx.fill();

        // Stroke Boundary of Fill (Light)
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Re-Draw Profile Line (Thick)
        ctx.beginPath();
        x = mx;
        ctx.moveTo(startX, yRoot);
        for(let i=0; i<4; i++) {
             if(!isInternal) {
                ctx.lineTo(x, yCrest); 
                ctx.lineTo(x + flatW, yCrest);
                ctx.lineTo(x + toothW/2 + flatW/2, yRoot);
            } else {
                ctx.lineTo(x, yCrest);
                ctx.lineTo(x + flatW, yCrest);
                ctx.lineTo(x + toothW/2 + flatW/2, yRoot);
            }
            x += toothW;
        }
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw Horizontal Extension Lines
        function drawExtension(y, color) {
            ctx.beginPath();
            ctx.strokeStyle = color || "#ccc";
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]); 
            ctx.moveTo(350, y); 
            ctx.lineTo(w - 20, y); 
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        drawExtension(yTop, "#ccc");
        drawExtension(yPitch, "#ccc");
        drawExtension(yBottom, "#ccc");

        // Draw Dimensions
        function drawDim(xPos, yTarget, label, value, color) {
            const dimX = xPos;
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.moveTo(dimX - 8, yTarget); ctx.lineTo(dimX + 8, yTarget);
            ctx.moveTo(dimX - 8, yCenter); ctx.lineTo(dimX + 8, yCenter);
            ctx.moveTo(dimX, yTarget); ctx.lineTo(dimX, yCenter);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.moveTo(dimX, yTarget);
            const dir = (yTarget < yCenter) ? 1 : -1; 
            ctx.lineTo(dimX - 5, yTarget + (10 * dir));
            ctx.lineTo(dimX + 5, yTarget + (10 * dir));
            ctx.moveTo(dimX, yCenter);
            ctx.lineTo(dimX - 5, yCenter - 10);
            ctx.lineTo(dimX + 5, yCenter - 10);
            ctx.fill();

            const textY = yTarget + (yCenter - yTarget)/2;
            ctx.fillStyle = "rgba(255,255,255,0.8)";
            ctx.fillRect(dimX + 10, textY - 25, 200, 50);

            ctx.font = "bold 14px sans-serif";
            ctx.fillStyle = color;
            ctx.textAlign = "left";
            ctx.fillText(label, dimX + 15, textY - 5);
            ctx.font = "14px sans-serif";
            ctx.fillStyle = "#333";
            ctx.fillText(value, dimX + 15, textY + 15);
        }

        const x1 = 450;
        const x2 = 550;
        const x3 = 650;

        const labelSuffix = isPipe ? " @ Gauge" : "";

        if (!isInternal) {
            // EXTERNAL DIMS
            const txtMaj = `${data.majMax.toFixed(d)} / ${data.majMin.toFixed(d)}`;
            drawDim(x1, yCrest, "Major Ø" + labelSuffix, txtMaj, colorMaj);

            const txtPitch = `${data.pdMax.toFixed(d)} / ${data.pdMin.toFixed(d)}`;
            drawDim(x2, yPitch, "Pitch Ø" + labelSuffix, txtPitch, colorPitch);

            const txtMin = `${data.minMin.toFixed(d)} (Ref)`;
            drawDim(x3, yRoot, "Minor Ø" + labelSuffix, txtMin, colorMin);
        } else {
            // INTERNAL DIMS
            const txtMin = `${data.minMax.toFixed(d)} / ${data.minMin.toFixed(d)}`;
            drawDim(x1, yCrest, "Minor Ø" + labelSuffix, txtMin, colorMin); 

            const txtPitch = `${data.pdMax.toFixed(d)} / ${data.pdMin.toFixed(d)}`;
            drawDim(x2, yPitch, "Pitch Ø" + labelSuffix, txtPitch, colorPitch);

            const txtMaj = `${data.majMin.toFixed(d)} (Min)`;
            drawDim(x3, yRoot, "Major Ø" + labelSuffix, txtMaj, colorMaj); 
        }
    }
});