document.addEventListener('DOMContentLoaded', () => {
    const inputs = ['length', 'angle', 'units'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', calculate);
        }
    });

    function calculate() {
        const lengthEl = document.getElementById('length');
        const angleEl = document.getElementById('angle');
        const unitsEl = document.getElementById('units');
        
        const L = parseFloat(lengthEl.value);
        const theta = parseFloat(angleEl.value);
        const unit = unitsEl.value;
        
        const resultEl = document.getElementById('result');
        const resUnitEl = document.getElementById('resUnit');
        const formLEl = document.getElementById('formL');
        const formThetaEl = document.getElementById('formTheta');

        if (isNaN(L) || isNaN(theta)) {
            resultEl.innerText = "---";
            formLEl.innerText = isNaN(L) ? "?" : L;
            formThetaEl.innerText = isNaN(theta) ? "?" : theta;
            return;
        }

        // Calculation
        const rad = theta * (Math.PI / 180);
        const H = L * Math.sin(rad);

        // Formatting
        resultEl.innerText = H.toFixed(4);
        resUnitEl.innerText = unit;
        
        // Update Formula Text
        formLEl.innerText = L.toFixed(4);
        formThetaEl.innerText = theta.toFixed(1);

        updateDiagram(theta);
    }

    function updateDiagram(angle) {
        // Constants for SVG
        const rollerRadius = 18; // Increased from 10
        const surfaceY = 260; // Y coordinate of surface table
        const startX = 50;  // Pivot X (Left Roller Center)
        const startY = surfaceY - rollerRadius; // Pivot Y (Left Roller Center), rests on surface
        const barVisualLen = 260; // Fixed visual length in SVG pixels
        
        // Clamp angle for visual sanity (0 to 85 deg)
        const visAngle = Math.min(Math.max(angle, 0), 85);
        const rad = visAngle * (Math.PI / 180);

        // 1. Rotate the Sine Bar Assembly
        const barGroup = document.getElementById('barAssembly');
        if (barGroup) {
            // SVG rotation is clockwise, so we use negative angle to go up
            barGroup.setAttribute('transform', `translate(${startX}, ${startY}) rotate(-${visAngle})`);
        }

        // 2. Calculate Right Roller Position (Tip) in Global Coords
        // x = pivotX + len * cos(theta)
        // y = pivotY - len * sin(theta) (Minus because SVG Y is down)
        const endX = startX + (barVisualLen * Math.cos(rad));
        const endY = startY - (barVisualLen * Math.sin(rad));

        // 3. Update Gauge Block
        // The block sits under the right roller.
        // Top of gauge block = endY + rollerRadius (Roller Bottom)
        // Bottom of gauge block = surfaceY
        const gaugeTop = endY + rollerRadius;
        const gaugeHeight = surfaceY - gaugeTop;
        
        const gauge = document.getElementById('gaugeRect');
        if (gauge) {
            gauge.setAttribute('x', endX - 20); // Center under roller
            gauge.setAttribute('y', gaugeTop);
            gauge.setAttribute('height', Math.max(0, gaugeHeight));
        }

        // 4. Update H Label
        const hLabel = document.getElementById('hLabel');
        if (hLabel) {
            hLabel.setAttribute('x', endX + 25);
            hLabel.setAttribute('y', gaugeTop + (gaugeHeight / 2) + 5);
            // Hide label if height is near zero
            hLabel.style.display = gaugeHeight < 5 ? 'none' : 'block';
        }

        // 5. Update Angle Arc
        const arcRadius = 70;
        // End point of arc
        const arcEndX = startX + arcRadius * Math.cos(-rad);
        const arcEndY = startY + arcRadius * Math.sin(-rad);
        
        const arcPath = document.getElementById('angleArc');
        const thetaLbl = document.getElementById('thetaLabel');
        
        if (arcPath && thetaLbl) {
            if (visAngle > 1) {
                const d = `M ${startX + arcRadius} ${startY} A ${arcRadius} ${arcRadius} 0 0 0 ${arcEndX} ${arcEndY}`;
                arcPath.setAttribute('d', d);
                arcPath.style.display = 'block';
                
                // Label Position
                const lblRad = arcRadius + 20;
                const lblX = startX + lblRad * Math.cos(-rad/2);
                const lblY = startY + lblRad * Math.sin(-rad/2);
                thetaLbl.setAttribute('x', lblX);
                thetaLbl.setAttribute('y', lblY);
                thetaLbl.style.display = 'block';
            } else {
                arcPath.style.display = 'none';
                thetaLbl.style.display = 'none';
            }
        }
    }

    // Init
    calculate();
});