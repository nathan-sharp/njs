import { TDMSParser } from './tdms-parser.js';
import { TDMSGenerator } from './tdms-generator.js';
import { TelemetryChart } from './chart.js';

let parser = new TDMSParser();
let chart = null;
let currentTDMSData = null;
let currentBinaryBuffer = null;
let currentFileName = "engine_telemetry_demo.tdms";
let selectedGroupIndex = 0;
let activeChannels = [];
let xChannel = null;

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('telemetry-canvas');
    const tooltip = document.getElementById('chart-tooltip');
    chart = new TelemetryChart(canvas, tooltip);

    setupEventListeners();
    loadDemo('engine');

    requestAnimationFrame(() => {
        if (chart) chart.resize();
    });
});

function setupEventListeners() {
    document.getElementById('btn-demo-engine').addEventListener('click', () => loadDemo('engine'));
    document.getElementById('btn-demo-audio').addEventListener('click', () => loadDemo('audio'));
    document.getElementById('btn-demo-battery').addEventListener('click', () => loadDemo('battery'));

    const fileInput = document.getElementById('file-input');
    const uploadForm = document.getElementById('upload-form');

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    });

    if (uploadForm) {
        uploadForm.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadForm.style.borderColor = 'var(--accent-color)';
        });
        uploadForm.addEventListener('dragleave', () => {
            uploadForm.style.borderColor = 'var(--border-color)';
        });
        uploadForm.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadForm.style.borderColor = 'var(--border-color)';
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFile(e.dataTransfer.files[0]);
            }
        });
    }

    const modeButtons = document.querySelectorAll('.chart-mode-btn');
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            modeButtons.forEach(b => {
                b.classList.remove('active');
                b.classList.add('secondary');
            });
            btn.classList.add('active');
            btn.classList.remove('secondary');
            chart.setMode(btn.dataset.mode);
        });
    });

    document.getElementById('btn-reset-zoom').addEventListener('click', () => {
        if (chart) chart.resetZoom();
    });

    const tabs = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.tab-panel');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => {
                t.classList.remove('active');
                t.classList.add('secondary');
            });
            panels.forEach(p => p.style.display = 'none');
            
            tab.classList.add('active');
            tab.classList.remove('secondary');
            const targetPanel = document.getElementById(`panel-${tab.dataset.tab}`);
            if (targetPanel) targetPanel.style.display = 'block';

            if (tab.dataset.tab === 'chart' && chart) {
                setTimeout(() => chart.resize(), 50);
            }
        });
    });

    document.getElementById('btn-export-csv').addEventListener('click', exportCSV);
    document.getElementById('btn-export-json').addEventListener('click', exportJSON);
    document.getElementById('btn-download-tdms').addEventListener('click', downloadBinaryTDMS);

    const groupSelect = document.getElementById('group-selector');
    groupSelect.addEventListener('change', (e) => {
        selectedGroupIndex = parseInt(e.target.value, 10);
        updateGroupView();
    });

    const xSelect = document.getElementById('xaxis-selector');
    xSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'index') {
            xChannel = null;
        } else {
            xChannel = activeChannels.find(c => c.name === val) || null;
        }
        chart.setChannels(activeChannels, xChannel);
        chart.render();
    });
}

function loadDemo(type) {
    const titles = {
        engine: "Dyno Engine Telemetry Run #409",
        audio: "Stereo Chamber Resonance Test",
        battery: "Li-Ion 21700 Thermal Stress Cycle"
    };
    const filenames = {
        engine: "engine_telemetry_demo.tdms",
        audio: "acoustic_resonance_demo.tdms",
        battery: "battery_thermal_cycle.tdms"
    };

    currentFileName = filenames[type] || "demo.tdms";
    const buffer = TDMSGenerator.generate(type);
    currentBinaryBuffer = buffer;

    const badge = document.getElementById('active-file-badge');
    badge.innerHTML = `Loaded Demo: <strong>${titles[type]}</strong> (${(buffer.byteLength / 1024).toFixed(1)} KB)`;
    badge.style.color = 'var(--accent-color)';

    parseAndRender(buffer);
}

function handleFile(file) {
    currentFileName = file.name;
    const reader = new FileReader();
    
    const badge = document.getElementById('active-file-badge');
    badge.innerHTML = `Reading file: <strong>${file.name}</strong>...`;
    badge.style.color = 'var(--text-muted)';

    reader.onload = (e) => {
        try {
            const buffer = e.target.result;
            currentBinaryBuffer = buffer;
            badge.innerHTML = `Loaded File: <strong>${file.name}</strong> (${(buffer.byteLength / 1024).toFixed(1)} KB)`;
            badge.style.color = 'var(--accent-color)';
            parseAndRender(buffer);
        } catch (err) {
            badge.innerHTML = `Error parsing TDMS: ${err.message}`;
            badge.style.color = '#ff4466';
            console.error(err);
        }
    };

    reader.onerror = () => {
        badge.innerHTML = `Error reading local file.`;
        badge.style.color = '#ff4466';
    };

    reader.readAsArrayBuffer(file);
}

function parseAndRender(buffer) {
    parser = new TDMSParser();
    currentTDMSData = parser.parse(buffer);
    selectedGroupIndex = 0;

    populateGroupSelector();
    populateFileProperties();
    populateTreeExplorer();
    updateGroupView();
}

function populateGroupSelector() {
    const select = document.getElementById('group-selector');
    select.innerHTML = '';
    
    currentTDMSData.groups.forEach((g, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = `${g.name} (${g.channels.length} channels)`;
        select.appendChild(opt);
    });
}

function populateFileProperties() {
    const container = document.getElementById('file-properties-list');
    container.innerHTML = '';
    
    const props = currentTDMSData.properties || {};
    const keys = Object.keys(props);
    
    if (keys.length === 0) {
        container.innerHTML = `<div style="color: var(--text-muted);">No root file properties found.</div>`;
        return;
    }

    keys.forEach(k => {
        const div = document.createElement('div');
        div.style = 'padding: 0.5rem 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;';
        div.innerHTML = `<span style="color: var(--text-muted);">${k}:</span> <code style="font-weight: 600;">${props[k]}</code>`;
        container.appendChild(div);
    });
}

function populateTreeExplorer() {
    const tree = document.getElementById('hierarchy-tree');
    tree.innerHTML = '';

    const rootUl = document.createElement('ul');
    rootUl.style = 'list-style: none; padding-left: 0; margin: 0;';

    const fileLi = document.createElement('li');
    fileLi.innerHTML = `<div style="padding: 0.3rem 0; font-weight: 600; color: var(--accent-color);">${currentFileName} <span style="font-weight: normal; color: var(--text-muted); font-size: 0.85rem;">(${currentTDMSData.groups.length} groups)</span></div>`;
    
    const groupUl = document.createElement('ul');
    groupUl.style = 'list-style: none; padding-left: 1.5rem; margin: 0; border-left: 1px solid var(--border-color);';

    currentTDMSData.groups.forEach((g, gIdx) => {
        const groupLi = document.createElement('li');
        groupLi.innerHTML = `<div style="padding: 0.3rem 0; font-weight: 600; color: var(--text-color);">${g.name} <span style="font-weight: normal; color: var(--text-muted); font-size: 0.85rem;">(${g.channels.length} channels)</span></div>`;
        
        const chanUl = document.createElement('ul');
        chanUl.style = 'list-style: none; padding-left: 1.5rem; margin: 0; border-left: 1px solid var(--border-color);';

        g.channels.forEach((c) => {
            const chanLi = document.createElement('li');
            const unitStr = c.properties?.unit_string ? ` [${c.properties.unit_string}]` : '';
            chanLi.innerHTML = `<div style="padding: 0.2rem 0; color: var(--text-color);"><strong>${c.name}</strong><code style="margin-left: 0.4rem; font-size: 0.8rem;">${unitStr}</code> <span style="color: var(--text-muted); font-size: 0.8rem;">(${c.data.length} pts)</span></div>`;
            chanUl.appendChild(chanLi);
        });

        groupLi.appendChild(chanUl);
        groupUl.appendChild(groupLi);
    });

    fileLi.appendChild(groupUl);
    rootUl.appendChild(fileLi);
    tree.appendChild(rootUl);
}

function updateGroupView() {
    const group = currentTDMSData.groups[selectedGroupIndex];
    if (!group) return;

    activeChannels = group.channels.map(c => ({
        name: c.name,
        unit: c.properties?.unit_string || "",
        desc: c.properties?.description || "",
        data: c.data || [],
        stats: c.stats || {}
    }));

    const timeChan = activeChannels.find(c => c.name.toLowerCase().includes('time') || c.name.toLowerCase().includes('date'));
    xChannel = timeChan || null;

    const xSelect = document.getElementById('xaxis-selector');
    xSelect.innerHTML = `<option value="index">Sample Index (0, 1, 2...)</option>`;
    activeChannels.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = `${c.name} (${c.unit || 'no unit'})`;
        if (xChannel && xChannel.name === c.name) opt.selected = true;
        xSelect.appendChild(opt);
    });

    chart.setChannels(activeChannels, xChannel);

    populateChannelToggles();
    populateStatsGrid();
    populateDataTable();

    chart.render();
}

function populateChannelToggles() {
    const container = document.getElementById('channel-toggles-list');
    container.innerHTML = '';

    chart.channels.forEach((c, idx) => {
        const item = document.createElement('div');
        item.style = 'display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; background: var(--bg-color); padding: 0.4rem 0.75rem; border: 1px solid var(--border-color); border-radius: 4px;';
        item.innerHTML = `
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.875rem; font-weight: 500; color: var(--text-color); margin: 0;">
                <input type="checkbox" checked data-idx="${idx}" style="margin: 0; width: auto;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: ${c.color}; display: inline-block;"></span>
                <span>${c.name}</span>
            </label>
            <code style="font-size: 0.75rem; color: var(--text-muted);">${c.unit || '-'}</code>
        `;

        const cb = item.querySelector('input');
        cb.addEventListener('change', (e) => {
            chart.toggleChannel(idx, e.target.checked);
        });

        container.appendChild(item);
    });
}

function populateStatsGrid() {
    const grid = document.getElementById('stats-grid');
    grid.innerHTML = '';

    chart.channels.forEach(c => {
        const s = c.stats || {};
        const card = document.createElement('div');
        card.style = `background: var(--ad-bg); border: 1px solid var(--border-color); border-left: 4px solid ${c.color}; border-radius: 4px; padding: 0.85rem 1rem;`;
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.4rem;">
                <strong style="color: var(--text-color); font-size: 0.95rem;">${c.name}</strong>
                <code style="font-size: 0.75rem; color: var(--text-muted);">${c.unit || ''}</code>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem; font-size: 0.85rem;">
                <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-muted);">Max:</span> <code style="color: var(--text-color); font-weight: 600;">${s.max !== undefined ? s.max : '-'}</code></div>
                <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-muted);">Min:</span> <code style="color: var(--text-color); font-weight: 600;">${s.min !== undefined ? s.min : '-'}</code></div>
                <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-muted);">Mean:</span> <code style="color: var(--text-color); font-weight: 600;">${s.mean !== undefined ? s.mean : '-'}</code></div>
                <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-muted);">Std Dev:</span> <code style="color: var(--text-color); font-weight: 600;">${s.stdDev !== undefined ? s.stdDev : '-'}</code></div>
                <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-muted);">RMS:</span> <code style="color: var(--text-color); font-weight: 600;">${s.rms !== undefined ? s.rms : '-'}</code></div>
                <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-muted);">Count:</span> <code style="color: var(--text-color); font-weight: 600;">${s.count !== undefined ? s.count : 0} pts</code></div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function populateDataTable() {
    const tableHead = document.querySelector('#data-table thead tr');
    const tableBody = document.querySelector('#data-table tbody');
    
    tableHead.innerHTML = `<th>Index</th>`;
    activeChannels.forEach(c => {
        tableHead.innerHTML += `<th>${c.name} ${c.unit ? `(${c.unit})` : ''}</th>`;
    });

    tableBody.innerHTML = '';
    
    const maxRows = Math.min(200, activeChannels[0]?.data.length || 0);
    const fragments = document.createDocumentFragment();

    for (let i = 0; i < maxRows; i++) {
        const tr = document.createElement('tr');
        let rowHtml = `<td><code>${i}</code></td>`;
        activeChannels.forEach(c => {
            const val = c.data[i];
            rowHtml += `<td>${typeof val === 'number' ? val.toFixed(4) : val}</td>`;
        });
        tr.innerHTML = rowHtml;
        fragments.appendChild(tr);
    }

    tableBody.appendChild(fragments);
    
    const footerInfo = document.getElementById('table-footer-info');
    const totalPts = activeChannels[0]?.data.length || 0;
    if (totalPts > 200) {
        footerInfo.textContent = `Showing first 200 of ${totalPts} samples for performance. Use CSV export for full dataset.`;
    } else {
        footerInfo.textContent = `Showing all ${totalPts} samples.`;
    }
}

function exportCSV() {
    if (!activeChannels || activeChannels.length === 0) return;

    const numPoints = activeChannels[0].data.length;
    let csv = `Sample Index,` + activeChannels.map(c => `"${c.name} ${c.unit ? `(${c.unit})` : ''}"`).join(',') + `\r\n`;

    for (let i = 0; i < numPoints; i++) {
        const row = [i, ...activeChannels.map(c => {
            const val = c.data[i];
            return typeof val === 'number' ? val : `"${val}"`;
        })];
        csv += row.join(',') + `\r\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentFileName.replace(/\.tdms$/i, '')}_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportJSON() {
    if (!currentTDMSData) return;

    const report = {
        file: currentFileName,
        exportedAt: new Date().toISOString(),
        properties: currentTDMSData.properties,
        groups: currentTDMSData.groups.map(g => ({
            name: g.name,
            path: g.path,
            properties: g.properties,
            channels: g.channels.map(c => ({
                name: c.name,
                path: c.path,
                properties: c.properties,
                stats: c.stats
            }))
        }))
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentFileName.replace(/\.tdms$/i, '')}_metadata.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function downloadBinaryTDMS() {
    if (!currentBinaryBuffer) return;

    const blob = new Blob([currentBinaryBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFileName;
    a.click();
    URL.revokeObjectURL(url);
}
