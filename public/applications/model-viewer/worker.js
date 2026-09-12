/**
 * Web Worker for Off-Thread 3D Model Parsing (STL and STEP)
 * ISO/IEC 25010: High Reliability, Performance Efficiency, and Responsiveness
 */

// Cached OpenCASCADE instance
let occtInstance = null;
let occtLoadingPromise = null;

/**
 * Initialize OpenCASCADE WebAssembly module
 * @returns {Promise<Object>} OCCT module instance
 */
async function getOcct() {
    if (occtInstance) {
        return occtInstance;
    }
    if (!occtLoadingPromise) {
        occtLoadingPromise = (async () => {
            importScripts('https://cdn.jsdelivr.net/npm/occt-import-js@0.0.22/dist/occt-import-js.js');
            const occt = await occtimportjs({
                locateFile: (name) => 'https://cdn.jsdelivr.net/npm/occt-import-js@0.0.22/dist/' + name
            });
            occtInstance = occt;
            return occt;
        })();
    }
    return occtLoadingPromise;
}

/**
 * Determine if ArrayBuffer represents binary or ASCII STL
 * @param {ArrayBuffer} buffer
 * @returns {boolean} True if binary
 */
function isBinarySTL(buffer) {
    if (buffer.byteLength < 84) {
        return false;
    }
    const view = new DataView(buffer);
    const expectedTriangles = view.getUint32(80, true);
    const expectedSize = 84 + expectedTriangles * 50;
    if (expectedSize === buffer.byteLength) {
        return true;
    }
    const reader = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 512));
    for (let i = 0; i < reader.length; i++) {
        if (reader[i] === 0) {
            return true;
        }
    }
    return false;
}

/**
 * Parse Binary STL ArrayBuffer into typed arrays
 * @param {ArrayBuffer} buffer
 * @returns {Object} Mesh data
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
        if (offset + 50 > buffer.byteLength) {
            break;
        }
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
        offset += 2; // Skip 2-byte attribute byte count
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
 * Parse ASCII STL ArrayBuffer into typed arrays
 * @param {ArrayBuffer} buffer
 * @returns {Object} Mesh data
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
 * Parse STEP file using OpenCASCADE WASM
 * @param {ArrayBuffer} buffer
 * @returns {Promise<Object>} Mesh data
 */
async function parseStepFile(buffer) {
    const occt = await getOcct();
    const fileBytes = new Uint8Array(buffer);
    const result = occt.ReadStepFile(fileBytes, null);

    if (!result || !result.success || !result.meshes || result.meshes.length === 0) {
        throw new Error('Failed to parse STEP file: No valid B-Rep solid or mesh geometry found.');
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
 * Build default engineering sample model (ISO Stepped Specimen)
 * @returns {Object} Mesh data
 */
function createSampleModel() {
    // Generate a precision calibration test specimen: Stepped base and cylinder boss
    const positionsList = [];
    const normalsList = [];

    function addQuad(p1, p2, p3, p4, normal) {
        // Triangle 1: p1, p2, p3
        positionsList.push(...p1, ...p2, ...p3);
        normalsList.push(...normal, ...normal, ...normal);
        // Triangle 2: p1, p3, p4
        positionsList.push(...p1, ...p3, ...p4);
        normalsList.push(...normal, ...normal, ...normal);
    }

    const s = 15; // 30mm base cube
    const h = 8;  // Base height 16mm

    // Base Box (-s..s, -s..s, -h..h)
    // Top (+Z)
    addQuad([-s, -s, h], [s, -s, h], [s, s, h], [-s, s, h], [0, 0, 1]);
    // Bottom (-Z)
    addQuad([-s, -s, -h], [-s, s, -h], [s, s, -h], [s, -s, -h], [0, 0, -1]);
    // Front (+Y)
    addQuad([-s, s, -h], [-s, s, h], [s, s, h], [s, s, -h], [0, 1, 0]);
    // Back (-Y)
    addQuad([-s, -s, -h], [s, -s, -h], [s, -s, h], [-s, -s, h], [0, -1, 0]);
    // Right (+X)
    addQuad([s, -s, -h], [s, s, -h], [s, s, h], [s, -s, h], [1, 0, 0]);
    // Left (-X)
    addQuad([-s, -s, -h], [-s, -s, h], [-s, s, h], [-s, s, -h], [-1, 0, 0]);

    // Add Cylindrical Boss on top (+Z from h to h + 14)
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

        // Cylinder side
        const nx1 = Math.cos(theta1);
        const ny1 = Math.sin(theta1);
        const nx2 = Math.cos(theta2);
        const ny2 = Math.sin(theta2);

        // Tri 1
        positionsList.push(x1, y1, zBase, x2, y2, zBase, x2, y2, zTop);
        normalsList.push(nx1, ny1, 0, nx2, ny2, 0, nx2, ny2, 0);

        // Tri 2
        positionsList.push(x1, y1, zBase, x2, y2, zTop, x1, y1, zTop);
        normalsList.push(nx1, ny1, 0, nx2, ny2, 0, nx1, ny1, 0);

        // Top Cap
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
 * Message Handler
 */
self.onmessage = async function (e) {
    const data = e.data;

    if (data.type === 'loadSample') {
        const sampleData = createSampleModel();
        const transferables = [];
        for (const mesh of sampleData.meshes) {
            transferables.push(mesh.positions.buffer);
            if (mesh.normals) transferables.push(mesh.normals.buffer);
            if (mesh.indices) transferables.push(mesh.indices.buffer);
        }

        self.postMessage({
            success: true,
            filename: 'ISO_Calibration_Specimen.stl',
            format: 'STL (Parametric Reference)',
            fileSize: sampleData.positions ? sampleData.positions.byteLength : 3200,
            triangleCount: sampleData.triangleCount,
            vertexCount: sampleData.vertexCount,
            meshes: sampleData.meshes
        }, transferables);
        return;
    }

    if (data.type === 'parse') {
        const { filename, buffer } = data;
        const ext = filename.split('.').pop().toLowerCase();

        try {
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
                throw new Error(`Unsupported 3D file format: .${ext}. Supported formats are .stl and .stp / .step.`);
            }

            const transferables = [];
            for (const mesh of parseResult.meshes) {
                if (mesh.positions) transferables.push(mesh.positions.buffer);
                if (mesh.normals) transferables.push(mesh.normals.buffer);
                if (mesh.indices) transferables.push(mesh.indices.buffer);
            }

            self.postMessage({
                success: true,
                filename: filename,
                format: formatTag,
                fileSize: buffer.byteLength,
                triangleCount: parseResult.triangleCount,
                vertexCount: parseResult.vertexCount,
                meshes: parseResult.meshes
            }, transferables);
        } catch (err) {
            self.postMessage({
                success: false,
                filename: filename,
                error: err.message || 'Unknown parsing failure.'
            });
        }
    }
};

