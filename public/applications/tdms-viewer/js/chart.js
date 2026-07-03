/**
 * Telemetry Chart Renderer
 * High-performance HTML5 Canvas multi-channel chart with Stacked, Normalized, and Shared modes.
 * Designed with standard Swiss Design System aesthetics (light background, crisp lines, no glow effects).
 */

export class TelemetryChart {
    constructor(canvasElement, tooltipElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
        this.tooltip = tooltipElement;
        
        this.channels = [];
        this.xData = null;
        this.xName = "Index";
        this.xUnit = "";
        
        this.mode = 'stacked';
        
        // Curated high-contrast Swiss data-visualization palette for white backgrounds
        this.colors = [
            '#0055ff', // NJS primary blue
            '#008040', // Emerald green
            '#d64000', // Rust orange
            '#b80058', // Magenta
            '#6000c0', // Purple
            '#008080', // Teal
            '#806000', // Ochre gold
            '#333333'  // Charcoal
        ];

        this.zoomMin = 0.0;
        this.zoomMax = 1.0;
        
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragCurrentX = 0;
        this.hoverX = -1;
        this.hoverY = -1;

        this.setupEvents();
        this.resize();
    }

    setChannels(channels, xChannel = null) {
        this.channels = channels.map((c, i) => ({
            ...c,
            color: this.colors[i % this.colors.length],
            visible: true
        }));

        if (xChannel && xChannel.data && xChannel.data.length > 0) {
            this.xData = xChannel.data;
            this.xName = xChannel.name;
            this.xUnit = xChannel.properties?.unit_string || "";
        } else {
            this.xData = null;
            this.xName = "Sample Index";
            this.xUnit = "";
        }

        this.resetZoom();
    }

    setMode(newMode) {
        this.mode = newMode;
        this.render();
    }

    toggleChannel(index, visible) {
        if (this.channels[index]) {
            this.channels[index].visible = visible;
            this.render();
        }
    }

    resetZoom() {
        this.zoomMin = 0.0;
        this.zoomMax = 1.0;
        this.render();
    }

    setupEvents() {
        window.addEventListener('resize', () => this.resize());
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.hoverX = e.clientX - rect.left;
            this.hoverY = e.clientY - rect.top;

            if (this.isDragging) {
                this.dragCurrentX = this.hoverX;
            }

            this.updateTooltip();
            this.render();
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.hoverX = -1;
            this.hoverY = -1;
            if (this.tooltip) this.tooltip.style.opacity = '0';
            this.render();
        });

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                const rect = this.canvas.getBoundingClientRect();
                this.isDragging = true;
                this.dragStartX = e.clientX - rect.left;
                this.dragCurrentX = this.dragStartX;
            }
        });

        window.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                if (Math.abs(this.dragCurrentX - this.dragStartX) > 10) {
                    this.applyZoomSelection();
                }
                this.render();
            }
        });

        this.canvas.addEventListener('dblclick', () => {
            this.resetZoom();
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const plotLeft = 60;
            const plotWidth = rect.width - plotLeft - 20;

            if (mouseX >= plotLeft && mouseX <= plotLeft + plotWidth) {
                const normX = (mouseX - plotLeft) / plotWidth;
                const span = this.zoomMax - this.zoomMin;
                const factor = e.deltaY > 0 ? 1.2 : 0.8;
                
                let newSpan = Math.min(1.0, Math.max(0.01, span * factor));
                let center = this.zoomMin + normX * span;
                
                let newMin = Math.max(0.0, center - normX * newSpan);
                let newMax = Math.min(1.0, newMin + newSpan);
                if (newMax === 1.0) newMin = Math.max(0.0, 1.0 - newSpan);

                this.zoomMin = newMin;
                this.zoomMax = newMax;
                this.render();
            }
        }, { passive: false });
    }

    applyZoomSelection() {
        const rect = this.canvas.getBoundingClientRect();
        const plotLeft = 60;
        const plotWidth = rect.width - plotLeft - 20;

        let startX = Math.min(this.dragStartX, this.dragCurrentX);
        let endX = Math.max(this.dragStartX, this.dragCurrentX);

        startX = Math.max(plotLeft, Math.min(plotLeft + plotWidth, startX));
        endX = Math.max(plotLeft, Math.min(plotLeft + plotWidth, endX));

        if (endX - startX < 5) return;

        const startNorm = (startX - plotLeft) / plotWidth;
        const endNorm = (endX - plotLeft) / plotWidth;

        const currentSpan = this.zoomMax - this.zoomMin;
        const newMin = this.zoomMin + startNorm * currentSpan;
        const newMax = this.zoomMin + endNorm * currentSpan;

        this.zoomMin = newMin;
        this.zoomMax = newMax;
    }

    resize() {
        this.render();
    }

    render() {
        const visibleChannels = this.channels.filter(c => c.visible);
        const numPlots = visibleChannels.length;

        let requiredHeight = 600;
        if (this.mode === 'stacked' && numPlots > 0) {
            const slotHeight = 115;
            const slotGap = 16;
            requiredHeight = 20 + numPlots * (slotHeight + slotGap) - slotGap + 40;
        }
        if (this.canvas.style.height !== `${requiredHeight}px`) {
            this.canvas.style.height = `${requiredHeight}px`;
        }

        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const targetWidth = Math.round(rect.width * dpr);
        const targetHeight = Math.round(rect.height * dpr);

        if (this.canvas.width !== targetWidth || this.canvas.height !== targetHeight) {
            this.canvas.width = targetWidth;
            this.canvas.height = targetHeight;
            this.ctx.scale(dpr, dpr);
        }

        const width = rect.width;
        const height = rect.height;

        this.ctx.clearRect(0, 0, width, height);

        // Background (Standard white)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, width, height);

        if (visibleChannels.length === 0) {
            this.drawEmptyState("No channels selected for plotting.");
            return;
        }

        const maxPoints = visibleChannels[0].data.length;
        if (maxPoints === 0) {
            this.drawEmptyState("Selected channels contain no data points.");
            return;
        }

        const startIdx = Math.floor(this.zoomMin * (maxPoints - 1));
        const endIdx = Math.max(startIdx + 1, Math.ceil(this.zoomMax * (maxPoints - 1)));

        const plotLeft = 65;
        const plotRight = width - 20;
        const plotTop = 20;
        const plotBottom = height - 40;
        const plotWidth = plotRight - plotLeft;
        const plotHeight = plotBottom - plotTop;

        // Draw X Axis Grid & Labels
        this.drawXAxis(plotLeft, plotRight, plotTop, plotBottom, startIdx, endIdx);

        if (this.mode === 'stacked') {
            const slotGap = 16;
            const slotHeight = 115;
            const headerHeight = 22;
            const boxHeight = slotHeight - headerHeight;

            visibleChannels.forEach((chan, idx) => {
                const slotTop = plotTop + idx * (slotHeight + slotGap);
                const boxTop = slotTop + headerHeight;
                const boxBottom = slotTop + slotHeight;

                // Draw channel badge in the header space above the actual plot box
                this.drawChannelBadge(chan.name, plotLeft, slotTop, chan.color, chan.unit);

                // Draw lane background & border below the header in the actual plot box
                this.ctx.fillStyle = '#f8f9fa';
                this.ctx.fillRect(plotLeft, boxTop, plotWidth, boxHeight);
                this.ctx.strokeStyle = '#e5e5e5';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(plotLeft, boxTop, plotWidth, boxHeight);

                let min = Infinity, max = -Infinity;
                for (let i = startIdx; i <= endIdx; i++) {
                    const val = chan.data[i];
                    if (val < min) min = val;
                    if (val > max) max = val;
                }
                if (min === max) { min -= 1; max += 1; }
                const pad = (max - min) * 0.08;
                min -= pad; max += pad;

                this.drawYLabels(min, max, boxTop, boxBottom, plotLeft, chan.color, chan.unit);
                this.drawTrace(chan.data, startIdx, endIdx, min, max, plotLeft, plotWidth, boxTop, boxHeight, chan.color);
            });
        } else if (this.mode === 'normalized') {
            this.ctx.fillStyle = '#f8f9fa';
            this.ctx.fillRect(plotLeft, plotTop, plotWidth, plotHeight);
            this.ctx.strokeStyle = '#e5e5e5';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(plotLeft, plotTop, plotWidth, plotHeight);

            this.drawYLabels(0, 100, plotTop, plotBottom, plotLeft, '#555555', "%");

            visibleChannels.forEach((chan) => {
                let min = Infinity, max = -Infinity;
                for (let i = startIdx; i <= endIdx; i++) {
                    const val = chan.data[i];
                    if (val < min) min = val;
                    if (val > max) max = val;
                }
                if (min === max) { min -= 1; max += 1; }

                this.drawTrace(chan.data, startIdx, endIdx, min, max, plotLeft, plotWidth, plotTop, plotHeight, chan.color);
            });
        } else { // shared
            this.ctx.fillStyle = '#f8f9fa';
            this.ctx.fillRect(plotLeft, plotTop, plotWidth, plotHeight);
            this.ctx.strokeStyle = '#e5e5e5';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(plotLeft, plotTop, plotWidth, plotHeight);

            let globalMin = Infinity, globalMax = -Infinity;
            visibleChannels.forEach(chan => {
                for (let i = startIdx; i <= endIdx; i++) {
                    const val = chan.data[i];
                    if (val < globalMin) globalMin = val;
                    if (val > globalMax) globalMax = val;
                }
            });
            if (globalMin === globalMax) { globalMin -= 1; globalMax += 1; }
            const pad = (globalMax - globalMin) * 0.08;
            globalMin -= pad; globalMax += pad;

            this.drawYLabels(globalMin, globalMax, plotTop, plotBottom, plotLeft, '#555555', visibleChannels[0].unit);

            visibleChannels.forEach((chan) => {
                this.drawTrace(chan.data, startIdx, endIdx, globalMin, globalMax, plotLeft, plotWidth, plotTop, plotHeight, chan.color);
            });
        }

        // Draw zoom selection box if dragging
        if (this.isDragging && Math.abs(this.dragCurrentX - this.dragStartX) > 2) {
            const startX = Math.max(plotLeft, Math.min(plotRight, Math.min(this.dragStartX, this.dragCurrentX)));
            const endX = Math.max(plotLeft, Math.min(plotRight, Math.max(this.dragStartX, this.dragCurrentX)));
            
            this.ctx.fillStyle = 'rgba(0, 85, 255, 0.1)';
            this.ctx.fillRect(startX, plotTop, endX - startX, plotHeight);
            this.ctx.strokeStyle = 'rgba(0, 85, 255, 0.6)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(startX, plotTop, endX - startX, plotHeight);
        }

        // Draw crosshair line
        if (this.hoverX >= plotLeft && this.hoverX <= plotRight && this.hoverY >= plotTop && this.hoverY <= plotBottom) {
            this.ctx.strokeStyle = '#555555';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([4, 4]);
            this.ctx.beginPath();
            this.ctx.moveTo(this.hoverX, plotTop);
            this.ctx.lineTo(this.hoverX, plotBottom);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
    }

    drawTrace(data, startIdx, endIdx, minVal, maxVal, plotLeft, plotWidth, plotTop, plotHeight, color) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1.8;
        this.ctx.lineJoin = 'round';
        this.ctx.beginPath();

        const numPoints = endIdx - startIdx + 1;
        const valRange = maxVal - minVal;

        const step = Math.max(1, Math.floor(numPoints / (plotWidth * 2)));

        for (let i = startIdx; i <= endIdx; i += step) {
            const normX = (i - startIdx) / (numPoints - 1 || 1);
            const x = plotLeft + normX * plotWidth;

            let val = data[i];
            const normY = valRange === 0 ? 0.5 : (val - minVal) / valRange;
            const y = plotTop + plotHeight - normY * plotHeight;

            if (i === startIdx) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.stroke();
    }

    drawXAxis(plotLeft, plotRight, plotTop, plotBottom, startIdx, endIdx) {
        const plotWidth = plotRight - plotLeft;
        const numTicks = 6;
        
        this.ctx.strokeStyle = '#e8e8e8';
        this.ctx.fillStyle = '#555555';
        this.ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.lineWidth = 1;

        for (let i = 0; i <= numTicks; i++) {
            const norm = i / numTicks;
            const x = plotLeft + norm * plotWidth;
            const dataIdx = Math.round(startIdx + norm * (endIdx - startIdx));

            // Grid line
            this.ctx.beginPath();
            this.ctx.moveTo(x, plotTop);
            this.ctx.lineTo(x, plotBottom);
            this.ctx.stroke();

            // Label
            let labelText = `${dataIdx}`;
            if (this.xData && this.xData[dataIdx] !== undefined) {
                const val = this.xData[dataIdx];
                labelText = typeof val === 'number' ? val.toFixed(2) : String(val);
            }

            this.ctx.fillText(labelText, x, plotBottom + 16);
        }

        // X Axis Title
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const xTitle = `${this.xName}${this.xUnit ? ` (${this.xUnit})` : ''}`;
        this.ctx.fillText(xTitle, plotLeft + plotWidth / 2, plotBottom + 34);
    }

    drawYLabels(minVal, maxVal, top, bottom, plotLeft, color, unit) {
        this.ctx.fillStyle = color;
        this.ctx.font = '11px monospace';
        this.ctx.textAlign = 'right';

        const height = bottom - top;
        const ticks = [maxVal, (maxVal + minVal) / 2, minVal];
        const yPos = [top + 12, top + height / 2 + 4, bottom - 4];

        ticks.forEach((val, i) => {
            const str = typeof val === 'number' ? val.toFixed(1) : val;
            this.ctx.fillText(str, plotLeft - 8, yPos[i]);
        });
    }

    drawChannelBadge(name, x, y, color, unit = "") {
        const text = (unit && !name.includes(`(${unit})`)) ? `${name} (${unit})` : name;
        this.ctx.fillStyle = color;
        this.ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(text, x, y + 15);
    }

    drawEmptyState(message) {
        const rect = this.canvas.getBoundingClientRect();
        this.ctx.fillStyle = '#555555';
        this.ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(message, rect.width / 2, rect.height / 2);
    }

    updateTooltip() {
        if (!this.tooltip) return;

        const rect = this.canvas.getBoundingClientRect();
        const plotLeft = 65;
        const plotRight = rect.width - 20;

        if (this.hoverX < plotLeft || this.hoverX > plotRight || this.hoverY < 20 || this.hoverY > rect.height - 40) {
            this.tooltip.style.opacity = '0';
            return;
        }

        const visibleChannels = this.channels.filter(c => c.visible);
        if (visibleChannels.length === 0) return;

        const maxPoints = visibleChannels[0].data.length;
        const startIdx = Math.floor(this.zoomMin * (maxPoints - 1));
        const endIdx = Math.max(startIdx + 1, Math.ceil(this.zoomMax * (maxPoints - 1)));

        const normX = (this.hoverX - plotLeft) / (plotRight - plotLeft);
        const dataIdx = Math.round(startIdx + normX * (endIdx - startIdx));

        if (dataIdx < 0 || dataIdx >= maxPoints) return;

        let xValStr = `${dataIdx}`;
        if (this.xData && this.xData[dataIdx] !== undefined) {
            const val = this.xData[dataIdx];
            xValStr = typeof val === 'number' ? val.toFixed(4) + (this.xUnit ? ` ${this.xUnit}` : '') : String(val);
        }

        let html = `<div style="border-bottom: 1px solid #e5e5e5; padding-bottom: 0.35rem; margin-bottom: 0.35rem; font-size: 0.85rem;"><strong style="color: #1a1a1a;">${this.xName}:</strong> ${xValStr} <span style="color: #555555; font-size: 0.75rem;">(idx: ${dataIdx})</span></div>`;
        html += `<div style="display: flex; flex-direction: column; gap: 0.25rem;">`;
        
        visibleChannels.forEach(c => {
            const val = c.data[dataIdx];
            const valStr = typeof val === 'number' ? val.toFixed(4) : val;
            html += `<div style="display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; font-size: 0.8rem;">
                <span style="display: flex; align-items: center; gap: 0.35rem;">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background:${c.color}; display: inline-block;"></span>
                    <span style="color: #555555;">${c.name}:</span>
                </span>
                <strong style="color: #1a1a1a;">${valStr} ${c.unit || ''}</strong>
            </div>`;
        });
        html += `</div>`;

        this.tooltip.innerHTML = html;
        this.tooltip.style.opacity = '1';

        let left = this.hoverX + 15;
        let top = this.hoverY + 15;
        if (left + 220 > rect.width) left = this.hoverX - 230;
        if (top + 160 > rect.height || (rect.top + top + 160 > window.innerHeight)) {
            top = this.hoverY - 160;
        }

        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${top}px`;
    }
}
