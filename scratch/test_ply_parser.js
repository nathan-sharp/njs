function parsePLY(buffer) {
    const textDecoder = new TextDecoder('utf-8');
    const headerBytes = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 4096));
    const headerText = textDecoder.decode(headerBytes);
    const endHeaderMatch = headerText.match(/end_header\r?\n/);

    if (!endHeaderMatch) {
        throw new Error('Invalid PLY file: end_header not found.');
    }

    const headerEndOffset = endHeaderMatch.index + endHeaderMatch[0].length;
    const headerLines = headerText.substring(0, endHeaderMatch.index).split(/\r?\n/);

    let isBinary = false;
    let vertexCount = 0;
    let faceCount = 0;

    for (const line of headerLines) {
        const parts = line.trim().split(/\s+/);
        if (parts[0] === 'format') {
            if (parts[1].startsWith('binary')) {
                isBinary = true;
            }
        } else if (parts[0] === 'element') {
            if (parts[1] === 'vertex') {
                vertexCount = parseInt(parts[2], 10);
            } else if (parts[1] === 'face') {
                faceCount = parseInt(parts[2], 10);
            }
        }
    }

    const positions = [];
    const indices = [];

    if (!isBinary) {
        const fullText = textDecoder.decode(buffer);
        const bodyLines = fullText.substring(headerEndOffset).trim().split(/\r?\n/);
        let lineIdx = 0;

        const verts = [];
        for (let i = 0; i < vertexCount && lineIdx < bodyLines.length; i++) {
            const parts = bodyLines[lineIdx++].trim().split(/\s+/);
            verts.push([parseFloat(parts[0]) || 0, parseFloat(parts[1]) || 0, parseFloat(parts[2]) || 0]);
        }

        for (let i = 0; i < faceCount && lineIdx < bodyLines.length; i++) {
            const parts = bodyLines[lineIdx++].trim().split(/\s+/);
            const count = parseInt(parts[0], 10);
            const fVerts = [];
            for (let j = 1; j <= count; j++) {
                fVerts.push(parseInt(parts[j], 10));
            }
            // Fan triangulation
            for (let j = 1; j < fVerts.length - 1; j++) {
                const tri = [fVerts[0], fVerts[j], fVerts[j + 1]];
                for (let k = 0; k < 3; k++) {
                    positions.push(...(verts[tri[k]] || [0, 0, 0]));
                }
            }
        }
    } else {
        // Binary Little Endian
        const view = new DataView(buffer);
        let offset = headerEndOffset;
        const verts = [];

        for (let i = 0; i < vertexCount; i++) {
            if (offset + 12 > buffer.byteLength) break;
            const x = view.getFloat32(offset, true);
            const y = view.getFloat32(offset + 4, true);
            const z = view.getFloat32(offset + 8, true);
            verts.push([x, y, z]);
            offset += 12; // Assuming float x, y, z
        }

        for (let i = 0; i < faceCount; i++) {
            if (offset >= buffer.byteLength) break;
            const count = view.getUint8(offset);
            offset += 1;
            const fVerts = [];
            for (let j = 0; j < count; j++) {
                fVerts.push(view.getInt32(offset, true));
                offset += 4;
            }
            for (let j = 1; j < fVerts.length - 1; j++) {
                const tri = [fVerts[0], fVerts[j], fVerts[j + 1]];
                for (let k = 0; k < 3; k++) {
                    positions.push(...(verts[tri[k]] || [0, 0, 0]));
                }
            }
        }
    }

    return {
        meshes: [{
            positions: new Float32Array(positions),
            normals: null,
            indices: null,
            color: null,
            name: 'PLY_Model'
        }],
        triangleCount: positions.length / 9,
        vertexCount: positions.length / 3
    };
}

const sampleAsciiPly = [
    'ply',
    'format ascii 1.0',
    'element vertex 4',
    'property float x',
    'property float y',
    'property float z',
    'element face 1',
    'property list uchar int vertex_indices',
    'end_header',
    '0 0 0',
    '20 0 0',
    '20 20 0',
    '0 20 0',
    '4 0 1 2 3'
].join('\n');

const buf = Buffer.from(sampleAsciiPly, 'utf8').buffer;
const res = parsePLY(buf);
console.log('PLY parse result:');
console.log('Triangles:', res.triangleCount);
console.log('Vertices:', res.vertexCount);
console.log('Positions count:', res.meshes[0].positions.length);

