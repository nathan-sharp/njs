/**
 * 3D CAD Model Viewer Controller
 * Safety-Critical Architecture adhering to ISO/IEC 25010 & Power of 10
 */

// Application State
let scene = null;
let camera = null;
let renderer = null;
let controls = null;
let modelGroup = null;
let gridHelper = null;
let axesHelper = null;
let occtInstance = null;

// Telemetry DOM elements
let elFileName = null;
let elFormat = null;
let elFileSize = null;
let elTriangleCount = null;
let elVertexCount = null;
let elStatus = null;
let elCanvas = null;
let elFileInput = null;
let elDropZone = null;
let btnSampleSpecimen = null;
let btnFullscreen = null;

/**
 * Format bytes into human-readable engineering units (SI IEC)
 * @param {number} bytes
 * @returns {string} Formatted size string
 */
function formatBytes(bytes) {
    if (bytes === 0 || !bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
    return `${value} ${sizes[i]}`;
}

/**
 * Update telemetry table values
 * @param {Object} data
 */
function updateTelemetry(data) {
    if (elFileName) elFileName.textContent = data.filename || '—';
    if (elFormat) elFormat.textContent = data.format || '—';
    if (elFileSize) elFileSize.textContent = data.fileSize ? formatBytes(data.fileSize) : '—';
    if (elTriangleCount) elTriangleCount.textContent = data.triangleCount ? data.triangleCount.toLocaleString() : '—';
    if (elVertexCount) elVertexCount.textContent = data.vertexCount ? data.vertexCount.toLocaleString() : '—';
}

/**
 * Set status banner message
 * @param {string} message
 * @param {boolean} isError
 */
function setStatus(message, isError = false) {
    if (!elStatus) return;
    elStatus.textContent = message;
    if (isError) {
        elStatus.className = 'error-text';
    } else {
        elStatus.className = '';
    }
}

/**
 * Clear existing model geometries and materials to prevent memory leaks
 */
function disposeCurrentModel() {
    if (!modelGroup) return;

    while (modelGroup.children.length > 0) {
        const child = modelGroup.children[0];
        modelGroup.remove(child);
        if (child.geometry) {
            child.geometry.dispose();
        }
        if (child.material) {
            if (Array.isArray(child.material)) {
                child.material.forEach((m) => m.dispose());
            } else {
                child.material.dispose();
            }
        }
    }
}

/**
 * Render parsed meshes into the Three.js scene
 * @param {Array<Object>} meshes
 */
function displayMeshes(meshes) {
    disposeCurrentModel();

    const defaultMaterial = new THREE.MeshStandardMaterial({
        color: 0x2b7fff, // High-contrast Swiss blue accent
        roughness: 0.35,
        metalness: 0.15,
        side: THREE.DoubleSide
    });

    const edgeMaterial = new THREE.LineBasicMaterial({
        color: 0x112244,
        linewidth: 1
    });

    const combinedBox = new THREE.Box3();

    for (let i = 0; i < meshes.length; i++) {
        const meshData = meshes[i];
        let geometry = meshData.geometry;

        if (!geometry) {
            geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(meshData.positions, 3));

            if (meshData.normals && meshData.normals.length > 0) {
                geometry.setAttribute('normal', new THREE.BufferAttribute(meshData.normals, 3));
            } else {
                geometry.computeVertexNormals();
            }

            if (meshData.indices && meshData.indices.length > 0) {
                geometry.setIndex(new THREE.BufferAttribute(meshData.indices, 1));
            }
        }

        // Center geometry directly at origin
        geometry.computeBoundingBox();
        geometry.center();
        geometry.computeBoundingBox();
        combinedBox.union(geometry.boundingBox);

        let material = defaultMaterial;
        if (meshData.color && Array.isArray(meshData.color) && meshData.color.length >= 3) {
            material = new THREE.MeshStandardMaterial({
                color: new THREE.Color(meshData.color[0], meshData.color[1], meshData.color[2]),
                roughness: 0.35,
                metalness: 0.15,
                side: THREE.DoubleSide
            });
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Add subtle edge outlines for crisp CAD contours
        try {
            const edges = new THREE.EdgesGeometry(geometry, 28);
            const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
            mesh.add(edgeLines);
        } catch (e) {
            // Ignore edge generation failure on non-indexed geometry
        }

        modelGroup.add(mesh);
    }

    modelGroup.position.set(0, 0, 0);

    // Frame camera based on bounding box
    if (!combinedBox.isEmpty()) {
        const size = new THREE.Vector3();
        combinedBox.getSize(size);

        const maxDim = Math.max(size.x, size.y, size.z);
        const radius = Math.max(maxDim * 0.9, 10);

        // Adjust camera and controls
        camera.position.set(radius * 1.5, radius * 1.2, radius * 1.8);
        camera.near = Math.max(radius * 0.001, 0.1);
        camera.far = Math.max(radius * 100, 10000);
        camera.updateProjectionMatrix();

        controls.target.set(0, 0, 0);
        controls.minDistance = Math.max(radius * 0.05, 0.1);
        controls.maxDistance = Math.max(radius * 20, 500);
        controls.update();

        // Update ground grid size
        if (gridHelper) {
            scene.remove(gridHelper);
            gridHelper.geometry.dispose();
            gridHelper = new THREE.GridHelper(radius * 3, 20, 0x888888, 0xcccccc);
            gridHelper.position.y = -size.y / 2;
            scene.add(gridHelper);
        }
    }
}

/**
 * Determine if ArrayBuffer represents binary STL
 * @param {ArrayBuffer} buffer
 * @returns {boolean}
 */
function isBinarySTL(buffer) {
    if (buffer.byteLength < 84) return false;
    const view = new DataView(buffer);
    const expectedTriangles = view.getUint32(80, true);
    const expectedSize = 84 + expectedTriangles * 50;
    if (expectedSize === buffer.byteLength) return true;

    const reader = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 512));
    for (let i = 0; i < reader.length; i++) {
        if (reader[i] === 0) return true;
    }
    return false;
}

/**
 * Parse Binary STL ArrayBuffer
 * @param {ArrayBuffer} buffer
 * @returns {Object}
 */
function parseBinarySTL(buffer) {
    const view = new DataView(buffer);
    const triangleCount = view.getUint32(80, true);
    const vertexCount = triangleCount * 3;
    const positions = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);

    let offset = 84;
    let posIdx = 0;
    let normIdx = 0;

    for (let i = 0; i < triangleCount; i++) {
        if (offset + 50 > buffer.byteLength) break;
        const nx = view.getFloat32(offset, true);
        const ny = view.getFloat32(offset + 4, true);
        const nz = view.getFloat32(offset + 8, true);
        offset += 12;

        for (let v = 0; v < 3; v++) {
            const vx = view.getFloat32(offset, true);
            const vy = view.getFloat32(offset + 4, true);
            const vz = view.getFloat32(offset + 8, true);
            offset += 12;

            positions[posIdx++] = vx;
            positions[posIdx++] = vy;
            positions[posIdx++] = vz;

            normals[normIdx++] = nx;
            normals[normIdx++] = ny;
            normals[normIdx++] = nz;
        }
        offset += 2;
    }

    return {
        meshes: [{
            positions: positions,
            normals: normals,
            indices: null,
            color: null,
            name: 'STL_Solid'
        }],
        triangleCount: triangleCount,
        vertexCount: vertexCount
    };
}

/**
 * Parse ASCII STL ArrayBuffer
 * @param {ArrayBuffer} buffer
 * @returns {Object}
 */
function parseAsciiSTL(buffer) {
    const decoder = new TextDecoder('utf-8');
    const text = decoder.decode(buffer);
    const lines = text.split(/\r?\n/);

    const positionsList = [];
    const normalsList = [];
    let currentNormal = [0, 0, 0];
    let triangleCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('facet normal')) {
            const parts = line.split(/\s+/);
            if (parts.length >= 4) {
                currentNormal = [
                    parseFloat(parts[2]) || 0,
                    parseFloat(parts[3]) || 0,
                    parseFloat(parts[4]) || 0
                ];
            }
        } else if (line.startsWith('vertex')) {
            const parts = line.split(/\s+/);
            if (parts.length >= 4) {
                positionsList.push(
                    parseFloat(parts[1]) || 0,
                    parseFloat(parts[2]) || 0,
                    parseFloat(parts[3]) || 0
                );
                normalsList.push(currentNormal[0], currentNormal[1], currentNormal[2]);
            }
        } else if (line.startsWith('endfacet')) {
            triangleCount++;
        }
    }

    const positions = new Float32Array(positionsList);
    const normals = new Float32Array(normalsList);

    return {
        meshes: [{
            positions: positions,
            normals: normals,
            indices: null,
            color: null,
            name: 'STL_Solid'
        }],
        triangleCount: triangleCount,
        vertexCount: positions.length / 3
    };
}

/**
 * Load OpenCASCADE WASM module
 * @returns {Promise<Object>}
 */
async function getOcct() {
    if (occtInstance) return occtInstance;

    if (!window.occtimportjs) {
        throw new Error('OpenCASCADE WebAssembly library not loaded.');
    }

    occtInstance = await window.occtimportjs({
        locateFile: (name) => 'https://cdn.jsdelivr.net/npm/occt-import-js@0.0.22/dist/' + name
    });
    return occtInstance;
}

/**
 * Parse STEP file using OpenCASCADE WebAssembly
 * @param {ArrayBuffer} buffer
 * @returns {Promise<Object>}
 */
async function parseStepFile(buffer) {
    const occt = await getOcct();
    const fileBytes = new Uint8Array(buffer);
    const result = occt.ReadStepFile(fileBytes, null);

    if (!result || !result.success || !result.meshes || result.meshes.length === 0) {
        throw new Error('Failed to parse STEP file: No valid B-Rep solid geometry found.');
    }

    const meshes = [];
    let totalTriangles = 0;
    let totalVertices = 0;

    for (let i = 0; i < result.meshes.length; i++) {
        const srcMesh = result.meshes[i];
        const posArray = srcMesh.attributes.position.array;
        const normArray = srcMesh.attributes.normal ? srcMesh.attributes.normal.array : null;
        const idxArray = srcMesh.index ? srcMesh.index.array : null;

        const positions = new Float32Array(posArray);
        const normals = normArray ? new Float32Array(normArray) : null;
        const indices = idxArray ? (idxArray instanceof Uint32Array ? idxArray : new Uint32Array(idxArray)) : null;

        const triCount = indices ? indices.length / 3 : positions.length / 9;
        const vertCount = positions.length / 3;

        totalTriangles += triCount;
        totalVertices += vertCount;

        meshes.push({
            positions: positions,
            normals: normals,
            indices: indices,
            color: srcMesh.color || null,
            name: srcMesh.name || `STEP_Body_${i + 1}`
        });
    }

    return {
        meshes: meshes,
        triangleCount: Math.round(totalTriangles),
        vertexCount: Math.round(totalVertices)
    };
}

/**
 * Create default ISO Calibration Specimen
 * @returns {Object}
 */
function createSampleModel() {
    const positionsList = [];
    const normalsList = [];

    function addQuad(p1, p2, p3, p4, normal) {
        positionsList.push(...p1, ...p2, ...p3);
        normalsList.push(...normal, ...normal, ...normal);
        positionsList.push(...p1, ...p3, ...p4);
        normalsList.push(...normal, ...normal, ...normal);
    }

    const s = 15;
    const h = 8;

    addQuad([-s, -s, h], [s, -s, h], [s, s, h], [-s, s, h], [0, 0, 1]);
    addQuad([-s, -s, -h], [-s, s, -h], [s, s, -h], [s, -s, -h], [0, 0, -1]);
    addQuad([-s, s, -h], [-s, s, h], [s, s, h], [s, s, -h], [0, 1, 0]);
    addQuad([-s, -s, -h], [s, -s, -h], [s, -s, h], [-s, -s, h], [0, -1, 0]);
    addQuad([s, -s, -h], [s, s, -h], [s, s, h], [s, -s, h], [1, 0, 0]);
    addQuad([-s, -s, -h], [-s, -s, h], [-s, s, h], [-s, s, -h], [-1, 0, 0]);

    const radius = 9;
    const cylHeight = 14;
    const segments = 32;
    const zBase = h;
    const zTop = h + cylHeight;

    for (let i = 0; i < segments; i++) {
        const theta1 = (i / segments) * Math.PI * 2;
        const theta2 = ((i + 1) / segments) * Math.PI * 2;

        const x1 = radius * Math.cos(theta1);
        const y1 = radius * Math.sin(theta1);
        const x2 = radius * Math.cos(theta2);
        const y2 = radius * Math.sin(theta2);

        const nx1 = Math.cos(theta1);
        const ny1 = Math.sin(theta1);
        const nx2 = Math.cos(theta2);
        const ny2 = Math.sin(theta2);

        positionsList.push(x1, y1, zBase, x2, y2, zBase, x2, y2, zTop);
        normalsList.push(nx1, ny1, 0, nx2, ny2, 0, nx2, ny2, 0);

        positionsList.push(x1, y1, zBase, x2, y2, zTop, x1, y1, zTop);
        normalsList.push(nx1, ny1, 0, nx2, ny2, 0, nx1, ny1, 0);

        positionsList.push(0, 0, zTop, x1, y1, zTop, x2, y2, zTop);
        normalsList.push(0, 0, 1, 0, 0, 1, 0, 0, 1);
    }

    const positions = new Float32Array(positionsList);
    const normals = new Float32Array(normalsList);

    return {
        meshes: [{
            positions: positions,
            normals: normals,
            indices: null,
            color: null,
            name: 'Calibration_Specimen'
        }],
        triangleCount: positions.length / 9,
        vertexCount: positions.length / 3
    };
}

/**
 * Load and display the default specimen
 */
function loadDefaultSpecimen() {
    const sample = createSampleModel();
    displayMeshes(sample.meshes);
    updateTelemetry({
        filename: 'ISO_Calibration_Specimen.stl',
        format: 'STL (Parametric Reference)',
        fileSize: sample.meshes[0].positions.byteLength,
        triangleCount: sample.triangleCount,
        vertexCount: sample.vertexCount
    });
    setStatus('Ready. Showing ISO Calibration Specimen.');
}

/**
 * Load a remote STL/STEP file by relative path
 * @param {string} url
 * @param {string} filename
 */
async function loadFileFromUrl(url, filename) {
    try {
        setStatus(`Fetching ${filename}...`);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} fetching ${filename}`);
        }
        const buffer = await response.arrayBuffer();
        await parseAndDisplayBuffer(filename, buffer);
    } catch (err) {
        setStatus(`Failed to fetch ${filename}: ${err.message}. Try selecting the file via the file picker above.`, true);
    }
}

/**
 * Process ArrayBuffer and render
 * @param {string} filename
 * @param {ArrayBuffer} buffer
 */
async function parseAndDisplayBuffer(filename, buffer) {
    const ext = filename.split('.').pop().toLowerCase();
    try {
        setStatus(`Parsing ${filename} (${formatBytes(buffer.byteLength)})...`);

        let parseResult;
        let formatTag;

        if (ext === 'stl') {
            const isBinary = isBinarySTL(buffer);
            formatTag = isBinary ? 'STL (Binary IEEE 754)' : 'STL (ASCII Faceted)';
            parseResult = isBinary ? parseBinarySTL(buffer) : parseAsciiSTL(buffer);
        } else if (ext === 'stp' || ext === 'step') {
            formatTag = 'STEP (ISO 10303-21 B-Rep)';
            parseResult = await parseStepFile(buffer);
        } else {
            throw new Error(`Unsupported 3D file format: .${ext}`);
        }

        displayMeshes(parseResult.meshes);
        updateTelemetry({
            filename: filename,
            format: formatTag,
            fileSize: buffer.byteLength,
            triangleCount: parseResult.triangleCount,
            vertexCount: parseResult.vertexCount
        });
        setStatus(`Loaded ${filename} successfully.`);
    } catch (err) {
        setStatus(`Error loading ${filename}: ${err.message}`, true);
    }
}

/**
 * Handle user file selection
 * @param {File} file
 */
function handleFile(file) {
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'stl' && ext !== 'stp' && ext !== 'step') {
        setStatus(`Unsupported format: .${ext}. Please select a .stl or .stp / .step CAD file.`, true);
        return;
    }

    const reader = new FileReader();
    reader.onload = async function (e) {
        const buffer = e.target.result;
        await parseAndDisplayBuffer(file.name, buffer);
    };
    reader.onerror = function () {
        setStatus(`Error reading file: ${file.name}`, true);
    };
    reader.readAsArrayBuffer(file);
}

/**
 * Handle canvas resize
 */
function onWindowResize() {
    if (!renderer || !camera || !elCanvas) return;
    const container = elCanvas.parentElement;
    const isFullscreen = document.fullscreenElement === container || document.fullscreenElement === elCanvas;

    let width, height;
    if (isFullscreen) {
        width = window.innerWidth;
        height = window.innerHeight;
    } else {
        width = container && container.clientWidth > 0 ? container.clientWidth : 800;
        height = Math.round(width * 0.625);
    }

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height, false);
}

/**
 * Toggle Fullscreen View for Viewport
 */
function toggleFullscreen() {
    if (!elCanvas) return;
    const container = elCanvas.parentElement;
    if (!container) return;

    if (!document.fullscreenElement) {
        if (container.requestFullscreen) {
            container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
            container.webkitRequestFullscreen();
        } else if (container.msRequestFullscreen) {
            container.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
}

/**
 * Update Fullscreen button state
 */
function updateFullscreenButton() {
    if (!btnFullscreen) return;
    const isFullscreen = !!document.fullscreenElement;
    btnFullscreen.textContent = isFullscreen ? '✕ Exit Fullscreen' : '⛶ Fullscreen';
    btnFullscreen.title = isFullscreen ? 'Exit Fullscreen (Esc)' : 'Toggle Fullscreen View';
    setTimeout(onWindowResize, 50);
}

/**
 * Animation loop
 */
function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (renderer && scene && camera) renderer.render(scene, camera);
}

/**
 * Initialize Viewer
 */
function initViewer() {
    if (typeof THREE === 'undefined') {
        console.error('Three.js failed to load from CDN.');
        return;
    }

    elCanvas = document.getElementById('viewer-canvas');
    elFileName = document.getElementById('disp-filename');
    elFormat = document.getElementById('disp-format');
    elFileSize = document.getElementById('disp-filesize');
    elTriangleCount = document.getElementById('disp-triangles');
    elVertexCount = document.getElementById('disp-vertices');
    elStatus = document.getElementById('disp-status');
    elFileInput = document.getElementById('file-input');
    elDropZone = document.getElementById('upload-card');
    btnSampleSpecimen = document.getElementById('btn-sample-specimen');
    btnFullscreen = document.getElementById('btn-fullscreen');

    // 1. Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfcfcfc);

    // 2. Camera setup
    const initialWidth = 800;
    const initialHeight = 500;
    camera = new THREE.PerspectiveCamera(45, initialWidth / initialHeight, 0.1, 2000);
    camera.position.set(40, 30, 45);

    // 3. Renderer setup
    renderer = new THREE.WebGLRenderer({
        canvas: elCanvas,
        antialias: true,
        powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(initialWidth, initialHeight, false);
    renderer.shadowMap.enabled = true;

    // 4. Controls setup
    controls = new THREE.OrbitControls(camera, elCanvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.screenSpacePanning = true;

    // 5. Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
    keyLight.position.set(50, 80, 50);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.7);
    fillLight.position.set(-50, 40, -50);
    scene.add(fillLight);

    const bottomLight = new THREE.DirectionalLight(0xffffff, 0.4);
    bottomLight.position.set(0, -50, 0);
    scene.add(bottomLight);

    // 6. Helpers & Model Group
    gridHelper = new THREE.GridHelper(60, 20, 0x888888, 0xdddddd);
    gridHelper.position.y = -8;
    scene.add(gridHelper);

    axesHelper = new THREE.AxesHelper(15);
    scene.add(axesHelper);

    modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // 7. Event listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('fullscreenchange', updateFullscreenButton);
    document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
    onWindowResize();

    if (btnFullscreen) {
        btnFullscreen.addEventListener('click', toggleFullscreen);
    }

    if (elFileInput) {
        elFileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
        });
    }

    if (btnSampleSpecimen) {
        btnSampleSpecimen.addEventListener('click', () => {
            loadDefaultSpecimen();
        });
    }

    const dropTargets = [elDropZone, elCanvas];
    dropTargets.forEach((target) => {
        if (!target) return;
        target.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        target.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFile(e.dataTransfer.files[0]);
            }
        });
    });

    // Start animation loop
    animate();

    // 8. Load initial specimen
    loadDefaultSpecimen();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initViewer);
} else {
    initViewer();
}

