function parseOBJ(text) {
    const lines = text.split(/\r?\n/);
    const rawV = [];
    const rawVN = [];
    const positions = [];
    const normals = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('#')) continue;
        const parts = line.split(/\s+/);
        const tag = parts[0];

        if (tag === 'v') {
            rawV.push([parseFloat(parts[1]) || 0, parseFloat(parts[2]) || 0, parseFloat(parts[3]) || 0]);
        } else if (tag === 'vn') {
            rawVN.push([parseFloat(parts[1]) || 0, parseFloat(parts[2]) || 0, parseFloat(parts[3]) || 0]);
        } else if (tag === 'f') {
            const faceVerts = [];
            for (let j = 1; j < parts.length; j++) {
                const sub = parts[j].split('/');
                let vIdx = parseInt(sub[0], 10);
                if (vIdx < 0) vIdx = rawV.length + vIdx + 1;
                let vnIdx = sub.length >= 3 && sub[2] ? parseInt(sub[2], 10) : 0;
                if (vnIdx < 0) vnIdx = rawVN.length + vnIdx + 1;
                faceVerts.push({ v: vIdx - 1, vn: vnIdx - 1 });
            }
            // Triangulate convex polygon (fan triangulation)
            for (let j = 1; j < faceVerts.length - 1; j++) {
                const tri = [faceVerts[0], faceVerts[j], faceVerts[j + 1]];
                for (let k = 0; k < 3; k++) {
                    const vert = rawV[tri[k].v] || [0, 0, 0];
                    positions.push(...vert);
                    if (tri[k].vn >= 0 && rawVN[tri[k].vn]) {
                        normals.push(...rawVN[tri[k].vn]);
                    }
                }
            }
        }
    }

    return {
        meshes: [{
            positions: new Float32Array(positions),
            normals: normals.length === positions.length ? new Float32Array(normals) : null,
            indices: null,
            color: null,
            name: 'OBJ_Model'
        }],
        triangleCount: positions.length / 9,
        vertexCount: positions.length / 3
    };
}

const sampleObj = [
    '# Test Quad Box',
    'v 0 0 0',
    'v 10 0 0',
    'v 10 10 0',
    'v 0 10 0',
    'vn 0 0 1',
    'f 1//1 2//1 3//1 4//1'
].join('\n');

const res = parseOBJ(sampleObj);
console.log('OBJ parse result:');
console.log('Triangles:', res.triangleCount);
console.log('Vertices:', res.vertexCount);
console.log('Positions count:', res.meshes[0].positions.length);

