document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const massSlider = document.getElementById('massSlider');
    const massInput = document.getElementById('massInput');
    const springConstantSlider = document.getElementById('springConstantSlider');
    const springConstantInput = document.getElementById('springConstantInput');
    const GRAVITY = 9.81; // m/s^2

    // Sync slider and input for mass
    massSlider.addEventListener('input', () => {
        massInput.value = massSlider.value;
        update();
    });
    massInput.addEventListener('input', () => {
        massSlider.value = massInput.value;
        update();
    });

    // Sync slider and input for spring constant
    springConstantSlider.addEventListener('input', () => {
        springConstantInput.value = springConstantSlider.value;
        update();
    });
    springConstantInput.addEventListener('input', () => {
        springConstantSlider.value = springConstantInput.value;
        update();
    });

    function update() {
        const mass = parseFloat(massSlider.value);
        const appliedForce = mass * GRAVITY; // F = m * g
        const springConstant = parseFloat(springConstantSlider.value);

        // Calculate displacement: x = F / k
        const displacement = appliedForce / springConstant;

        // Calculate required canvas height
        const topY = 30;
        const restingLength = 150;
        const stretchedLength = restingLength + displacement * 150;
        const massHeight = 40;
        const arrowLength = (appliedForce / 50) * 80;
        const requiredHeight = topY + stretchedLength + massHeight + arrowLength + 50;
        
        // Set canvas height dynamically
        canvas.height = Math.max(500, requiredHeight);

        // Update displayed values
        document.getElementById('massValue').textContent = mass.toFixed(2);
        document.getElementById('forceValue').textContent = appliedForce.toFixed(1);
        document.getElementById('forceValueFormula').textContent = appliedForce.toFixed(1);
        document.getElementById('springConstantValue').textContent = springConstant.toFixed(0);
        document.getElementById('springConstantValueFormula').textContent = springConstant.toFixed(0);
        document.getElementById('displacementValue').textContent = (displacement * 1000).toFixed(1);

        // Draw the visualization
        drawSpring(ctx, canvas, displacement, appliedForce, springConstant);
    }

    function drawSpring(ctx, canvas, displacement, appliedForce, springConstant) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const springX = canvas.width / 2;
        const topY = 30;
        const restingLength = 150;
        const coilRadius = 15;
        const coilCount = 8;

        // Calculate the actual length of the spring based on displacement
        const stretchedLength = restingLength + displacement * 150; // Scale displacement for visibility

        // Draw fixed support at top
        ctx.strokeStyle = '#000';
        ctx.fillStyle = '#000';
        ctx.lineWidth = 2;
        ctx.fillRect(springX - 40, topY - 10, 80, 10);

        // Draw coils of the spring
        const coilSpacing = stretchedLength / coilCount;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;

        for (let i = 0; i < coilCount; i++) {
            const y1 = topY + i * coilSpacing;
            const y2 = topY + (i + 1) * coilSpacing;

            // Alternate coil direction
            const direction = i % 2 === 0 ? 1 : -1;

            // Draw one coil
            ctx.beginPath();
            ctx.moveTo(springX, y1);
            ctx.quadraticCurveTo(springX + direction * coilRadius, (y1 + y2) / 2, springX, y2);
            ctx.stroke();
        }

        // Draw mass (weight) at the bottom
        const massY = topY + stretchedLength;
        const massWidth = 60;
        const massHeight = 40;

        // Mass block
        ctx.fillStyle = '#fff';
        ctx.fillRect(springX - massWidth / 2, massY, massWidth, massHeight);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(springX - massWidth / 2, massY, massWidth, massHeight);

        // Label mass on the block
        ctx.fillStyle = '#000';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${(appliedForce / GRAVITY).toFixed(2)} kg`, springX, massY + massHeight / 2 + 5);
        ctx.textAlign = 'left';

        // Draw force arrow
        const arrowLength = (appliedForce / 50) * 80; // Scale arrow based on force
        const arrowStartX = springX;
        const arrowStartY = massY + massHeight + 10;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(arrowStartX, arrowStartY);
        ctx.lineTo(arrowStartX, arrowStartY + arrowLength);
        ctx.stroke();

        // Draw arrowhead
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.moveTo(arrowStartX, arrowStartY + arrowLength);
        ctx.lineTo(arrowStartX - 6, arrowStartY + arrowLength - 8);
        ctx.lineTo(arrowStartX + 6, arrowStartY + arrowLength - 8);
        ctx.fill();

        // Label force arrow
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.fillText(`F = ${appliedForce.toFixed(1)} N`, arrowStartX + 15, arrowStartY + arrowLength / 2);

        // Draw equilibrium line (dotted)
        const equilibriumY = topY + restingLength;
        ctx.strokeStyle = '#000';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(springX - 120, equilibriumY);
        ctx.lineTo(springX + 120, equilibriumY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Labels
        ctx.fillStyle = '#000';
        ctx.font = '11px Arial';
        ctx.fillText('Equilibrium', springX - 110, equilibriumY - 5);
        ctx.fillText('k = ' + springConstant.toFixed(0) + ' N/m', 10, 20);
        ctx.fillText('x = ' + (displacement * 1000).toFixed(1) + ' mm', 10, 40);

        // Draw displacement indicator
        if (displacement > 0.01) {
            ctx.strokeStyle = '#000';
            ctx.setLineDash([3, 3]);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(springX + 120, equilibriumY);
            ctx.lineTo(springX + 120, massY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Displacement dimension line
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(springX + 115, equilibriumY);
            ctx.lineTo(springX + 125, equilibriumY);
            ctx.moveTo(springX + 120, equilibriumY);
            ctx.lineTo(springX + 120, massY);
            ctx.moveTo(springX + 115, massY);
            ctx.lineTo(springX + 125, massY);
            ctx.stroke();

            ctx.fillStyle = '#000';
            ctx.font = 'bold 12px Arial';
            ctx.fillText('x', springX + 130, (equilibriumY + massY) / 2);
        }
    }

    // Initial update
    update();
});
