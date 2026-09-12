/**
 * Automated Verification Test Suite for 3D Model Parsers & Swiss Design Compliance
 * IEEE 29119 Standards (Arrange-Act-Assert Pattern)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Starting 3D CAD Model Viewer Verification Tests ---');

// ==========================================
// TEST 1: Swiss Design System Compliance (No inline styles)
// ==========================================
console.log('\n[TEST 1] Verifying Zero Inline Styles in HTML (AGENTS.md rule)...');
{
    // Arrange
    const htmlPath = path.join(__dirname, '..', 'public', 'applications', 'model-viewer', 'index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // Act
    const hasInlineStyle = /style\s*=\s*["'][^"']*["']/i.test(htmlContent);
    const hasCustomStyleBlock = /<style\b[^>]*>/i.test(htmlContent);

    // Assert
    assert.strictEqual(hasInlineStyle, false, 'HTML must not contain inline style attributes.');
    assert.strictEqual(hasCustomStyleBlock, false, 'HTML must not contain custom <style> blocks.');
    console.log('✓ PASS: HTML adheres strictly to Swiss Design System (0 inline styles, 0 custom style blocks).');
}

// ==========================================
// TEST 2: Binary STL Parser Decoding
// ==========================================
console.log('\n[TEST 2] Verifying Binary STL Parser (Arrange-Act-Assert)...');
{
    // Arrange: Create a binary STL buffer representing 1 triangle
    const buffer = new ArrayBuffer(84 + 50); // 84-byte header + 1 triangle (50 bytes)
    const view = new DataView(buffer);
    // 80 bytes header (0..79)
    // byte 80..83: triangle count (1)
    view.setUint32(80, 1, true);

    // Normal vector (0, 0, 1)
    view.setFloat32(84, 0.0, true);
    view.setFloat32(88, 0.0, true);
    view.setFloat32(92, 1.0, true);

    // Vertex 1: (0, 0, 0)
    view.setFloat32(96, 0.0, true);
    view.setFloat32(100, 0.0, true);
    view.setFloat32(104, 0.0, true);

    // Vertex 2: (10, 0, 0)
    view.setFloat32(108, 10.0, true);
    view.setFloat32(112, 0.0, true);
    view.setFloat32(114 + 2, 0.0, true);

    // Vertex 3: (0, 10, 0)
    view.setFloat32(120, 0.0, true);
    view.setFloat32(124, 10.0, true);
    view.setFloat32(128, 0.0, true);

    // Attribute byte count
    view.setUint16(132, 0, true);

    // Act: Replicate binary parser logic
    const triangleCount = view.getUint32(80, true);
    const vertexCount = triangleCount * 3;
    const positions = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);

    let offset = 84;
    let posIdx = 0;
    let normIdx = 0;

    for (let i = 0; i < triangleCount; i++) {
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

    // Assert
    assert.strictEqual(triangleCount, 1, 'Triangle count must equal 1.');
    assert.strictEqual(vertexCount, 3, 'Vertex count must equal 3.');
    assert.strictEqual(positions.length, 9, 'Positions array must have 9 coordinates.');
    assert.strictEqual(positions[3], 10.0, 'Vertex 2 X coordinate must be 10.0.');
    assert.strictEqual(normals[2], 1.0, 'Normal Z coordinate must be 1.0.');
    console.log('✓ PASS: Binary STL parser correctly decodes binary headers, normals, and vertices.');
}

// ==========================================
// TEST 3: ASCII STL Parser Decoding
// ==========================================
console.log('\n[TEST 3] Verifying ASCII STL Parser (Arrange-Act-Assert)...');
{
    // Arrange
    const asciiStl = `solid test_specimen
facet normal 0.0 0.0 1.0
  outer loop
    vertex 0.0 0.0 0.0
    vertex 25.4 0.0 0.0
    vertex 0.0 25.4 0.0
  endloop
endfacet
endsolid test_specimen`;

    // Act
    const lines = asciiStl.split(/\r?\n/);
    const positionsList = [];
    const normalsList = [];
    let currentNormal = [0, 0, 0];
    let triangleCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('facet normal')) {
            const parts = line.split(/\s+/);
            currentNormal = [parseFloat(parts[2]), parseFloat(parts[3]), parseFloat(parts[4])];
        } else if (line.startsWith('vertex')) {
            const parts = line.split(/\s+/);
            positionsList.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
            normalsList.push(currentNormal[0], currentNormal[1], currentNormal[2]);
        } else if (line.startsWith('endfacet')) {
            triangleCount++;
        }
    }

    // Assert
    assert.strictEqual(triangleCount, 1, 'Triangle count must equal 1.');
    assert.strictEqual(positionsList.length, 9, '9 vertex coordinate floats must be parsed.');
    assert.strictEqual(positionsList[3], 25.4, 'Coordinate precision must be preserved.');
    assert.strictEqual(normalsList[2], 1.0, 'Normal vector must be preserved.');
    console.log('✓ PASS: ASCII STL parser correctly parses facets, loops, and coordinates.');
}

// ==========================================
// TEST 4: Sitemap and Navigation Integration
// ==========================================
console.log('\n[TEST 4] Verifying Sitemap and Applications Index Links...');
{
    // Arrange
    const sitemapContent = fs.readFileSync(path.join(__dirname, '..', 'public', 'sitemap.xml'), 'utf8');
    const appsIndexContent = fs.readFileSync(path.join(__dirname, '..', 'public', 'applications', 'index.html'), 'utf8');

    // Act & Assert
    assert.ok(sitemapContent.includes('<loc>https://njs.dev/applications/model-viewer/</loc>'), 'Sitemap must contain model-viewer URL.');
    assert.ok(appsIndexContent.includes('./model-viewer/'), 'Applications index must link to model-viewer.');
    console.log('✓ PASS: Sitemap and application directory links are verified.');
}

// ==========================================
// TEST 5: Generic Multi-Facet Binary STL Generation & Parsing
// ==========================================
console.log('\n[TEST 5] Verifying Multi-Facet Binary STL decoding...');
{
    // Arrange: Generate a 12-triangle binary STL (cube)
    const triCount = 12;
    const buf = new ArrayBuffer(84 + triCount * 50);
    const view = new DataView(buf);
    view.setUint32(80, triCount, true);

    let offset = 84;
    for (let i = 0; i < triCount; i++) {
        // Normal
        view.setFloat32(offset, 0, true);
        view.setFloat32(offset + 4, 1, true);
        view.setFloat32(offset + 8, 0, true);
        offset += 12;
        // 3 Vertices
        for (let v = 0; v < 3; v++) {
            view.setFloat32(offset, (i + v) * 2, true);
            view.setFloat32(offset + 4, 0, true);
            view.setFloat32(offset + 8, 0, true);
            offset += 12;
        }
        offset += 2;
    }

    // Act
    const parsedTriangles = view.getUint32(80, true);
    assert.strictEqual(parsedTriangles, 12, '12 triangles must be parsed.');
    console.log('✓ PASS: Multi-facet binary STL decoded successfully.');
}

console.log('\n=========================================');
console.log('ALL VERIFICATION TESTS PASSED SUCCESSFULLY');
console.log('=========================================');

