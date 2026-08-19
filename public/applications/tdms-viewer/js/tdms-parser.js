/**
 * TDMS Binary Parser
 * Implements client-side parsing of National Instruments TDMS 2.0 streaming files.
 * Handles hierarchical objects (File, Group, Channel), properties, and raw binary measurement data.
 */

export class TDMSParser {
    constructor() {
        this.file = { path: '/', properties: {}, groups: new Map() };
        this.activeRawSpecs = new Map(); // path -> { dataType, dimension, count, totalBytes }
        this.lastKnownSpecs = new Map();
    }

    /**
     * Parse an ArrayBuffer containing a TDMS file.
     * @param {ArrayBuffer} buffer 
     * @returns {Object} Parsed TDMS structure
     */
    parse(buffer) {
        const view = new DataView(buffer);
        let offset = 0;
        let segmentIndex = 0;

        while (offset < buffer.byteLength - 4) {
            // Check Tag "TDSm"
            const tag = String.fromCharCode(
                view.getUint8(offset),
                view.getUint8(offset + 1),
                view.getUint8(offset + 2),
                view.getUint8(offset + 3)
            );

            if (tag !== 'TDSm') {
                if (offset === 0) {
                    throw new Error("Invalid TDMS file: Missing 'TDSm' Lead-In tag at file header.");
                } else {
                    // Stop if trailing zeros or corrupted segment
                    console.warn(`Encountered non-TDSm tag at offset ${offset}. Terminating parse.`);
                    break;
                }
            }

            const toc = view.getUint32(offset + 4, true);
            const kTocMetaData = (toc & (1 << 1)) !== 0;
            const kTocNewObjList = (toc & (1 << 2)) !== 0;
            const kTocRawData = (toc & (1 << 3)) !== 0;
            const kTocInterleavedData = (toc & (1 << 4)) !== 0;
            const bigEndian = (toc & (1 << 5)) !== 0;
            const littleEndian = !bigEndian;

            const version = view.getUint32(offset + 8, littleEndian);
            
            // Read 64-bit integers as BigInt or numbers
            const nextSegmentOffset = this.readUint64(view, offset + 12, littleEndian);
            const rawDataOffset = this.readUint64(view, offset + 20, littleEndian);

            const segmentStart = offset + 28;
            let nextSegmentStart;
            if (nextSegmentOffset === 0xFFFFFFFFFFFFFFFFn || nextSegmentOffset + BigInt(segmentStart) >= BigInt(buffer.byteLength)) {
                nextSegmentStart = buffer.byteLength;
            } else {
                nextSegmentStart = segmentStart + Number(nextSegmentOffset);
            }

            let metaDataStart = segmentStart;
            let rawDataStart = segmentStart + Number(rawDataOffset);

            // 1. Process Metadata
            if (kTocMetaData && rawDataOffset > 0n) {
                let metaOffset = metaDataStart;
                const objCount = view.getUint32(metaOffset, littleEndian);
                metaOffset += 4;

                if (kTocNewObjList) {
                    this.activeRawSpecs.clear();
                }

                for (let i = 0; i < objCount; i++) {
                    // Read object path
                    const pathLen = view.getUint32(metaOffset, littleEndian);
                    metaOffset += 4;
                    const path = this.readString(buffer, metaOffset, pathLen);
                    metaOffset += pathLen;

                    const obj = this.getOrCreateObject(path);

                    // Read Raw Data Index
                    const rawIndex = view.getUint32(metaOffset, littleEndian);
                    metaOffset += 4;

                    if (rawIndex === 0xFFFFFFFF) {
                        // No raw data assigned in this segment
                    } else if (rawIndex === 0x00000000) {
                        // Matches previous segment
                        if (!this.lastKnownSpecs.has(path)) {
                            console.warn(`Raw index 0 for ${path} but no previous spec exists.`);
                        } else {
                            this.activeRawSpecs.set(path, this.lastKnownSpecs.get(path));
                        }
                    } else {
                        // New raw data spec
                        const dataType = view.getUint32(metaOffset, littleEndian);
                        metaOffset += 4;
                        const dimension = view.getUint32(metaOffset, littleEndian);
                        metaOffset += 4;
                        const count = this.readUint64(view, metaOffset, littleEndian);
                        metaOffset += 8;

                        let totalBytes = 0n;
                        if (dataType === 0x20) { // String type
                            totalBytes = this.readUint64(view, metaOffset, littleEndian);
                            metaOffset += 8;
                        }

                        const spec = { dataType, dimension, count: Number(count), totalBytes: Number(totalBytes) };
                        this.activeRawSpecs.set(path, spec);
                        this.lastKnownSpecs.set(path, spec);
                        obj.dataType = dataType;
                    }

                    // Read Properties
                    const propCount = view.getUint32(metaOffset, littleEndian);
                    metaOffset += 4;

                    for (let p = 0; p < propCount; p++) {
                        const nameLen = view.getUint32(metaOffset, littleEndian);
                        metaOffset += 4;
                        const propName = this.readString(buffer, metaOffset, nameLen);
                        metaOffset += nameLen;

                        const propType = view.getUint32(metaOffset, littleEndian);
                        metaOffset += 4;

                        const { value, bytesRead } = this.readPropertyValue(view, buffer, metaOffset, propType, littleEndian);
                        metaOffset += bytesRead;

                        obj.properties[propName] = value;
                    }
                }
            }

            // 2. Process Raw Data
            if (kTocRawData && rawDataStart < nextSegmentStart) {
                let currentRawOffset = rawDataStart;
                
                let chunkSize = 0;
                for (const spec of this.activeRawSpecs.values()) {
                    if (spec.dataType === 0x20) {
                        chunkSize += spec.totalBytes; // String total bytes
                    } else {
                        chunkSize += spec.count * this.getTypeSize(spec.dataType);
                    }
                }
                
                let numChunks = 1;
                if (chunkSize > 0) {
                    const rawDataSize = nextSegmentStart - rawDataStart;
                    numChunks = Math.floor(rawDataSize / chunkSize);
                    if (rawDataSize % chunkSize !== 0) {
                        console.warn(`Segment trailing partial chunk detected and ignored (Raw size: ${rawDataSize}, Chunk size: ${chunkSize})`);
                    }
                }

                const MAX_POINTS = 500000;
                let decimationFactor = 1;
                if (numChunks > MAX_POINTS) {
                    decimationFactor = Math.ceil(numChunks / MAX_POINTS);
                }
                
                if (!kTocInterleavedData) {
                    for (let chunk = 0; chunk < numChunks; chunk++) {
                        const skipChunk = (chunk % decimationFactor !== 0);
                        if (skipChunk) {
                            currentRawOffset += chunkSize;
                            continue;
                        }
                        for (const [path, spec] of this.activeRawSpecs.entries()) {
                            const obj = this.getOrCreateObject(path);
                            if (!obj.data) obj.data = [];

                            const bytesConsumed = this.readRawDataChunk(view, buffer, currentRawOffset, spec, obj.data, littleEndian);
                            currentRawOffset += bytesConsumed;
                        }
                    }
                } else {
                    // Interleaved data handling (for standard numeric channels of equal length)
                    for (let chunk = 0; chunk < numChunks; chunk++) {
                        const skipChunk = (chunk % decimationFactor !== 0);
                        if (skipChunk) {
                            currentRawOffset += chunkSize;
                            continue;
                        }
                        const specs = Array.from(this.activeRawSpecs.entries());
                        if (specs.length > 0) {
                            const numPoints = specs[0][1].count;
                            for (let pt = 0; pt < numPoints; pt++) {
                                for (const [path, spec] of specs) {
                                    const obj = this.getOrCreateObject(path);
                                    if (!obj.data) obj.data = [];
                                    const bytesConsumed = this.readRawDataChunk(view, buffer, currentRawOffset, { ...spec, count: 1 }, obj.data, littleEndian);
                                    currentRawOffset += bytesConsumed;
                                }
                            }
                        }
                    }
                }
            }

            offset = nextSegmentStart;
            segmentIndex++;
        }

        return this.formatResult();
    }

    getOrCreateObject(path) {
        if (path === '/' || path === '' || path === "''") {
            return this.file;
        }

        // Parse path like /'Group'/'Channel' or /Group/Channel
        const parts = path.split('/').filter(p => p.length > 0).map(p => p.replace(/^'|'$/g, ''));
        
        if (parts.length === 1) {
            const groupName = parts[0];
            if (!this.file.groups.has(groupName)) {
                this.file.groups.set(groupName, { name: groupName, path, properties: {}, channels: new Map() });
            }
            return this.file.groups.get(groupName);
        } else if (parts.length >= 2) {
            const groupName = parts[0];
            const channelName = parts[1];
            
            if (!this.file.groups.has(groupName)) {
                this.file.groups.set(groupName, { name: groupName, path: `/'${groupName}'`, properties: {}, channels: new Map() });
            }
            
            const group = this.file.groups.get(groupName);
            if (!group.channels.has(channelName)) {
                group.channels.set(channelName, {
                    name: channelName,
                    path,
                    properties: {},
                    dataType: null,
                    data: []
                });
            }
            return group.channels.get(channelName);
        }
        
        return this.file;
    }

    getTypeSize(dataType) {
        switch (dataType) {
            case 0x01: case 0x05: case 0x21: return 1;
            case 0x02: case 0x06: return 2;
            case 0x03: case 0x07: case 0x09: return 4;
            case 0x04: case 0x08: case 0x0A: return 8;
            case 0x44: return 16;
            default: return 0;
        }
    }

    readRawDataChunk(view, buffer, offset, spec, outArray, littleEndian) {
        const { dataType, count } = spec;
        let bytesRead = 0;

        if (dataType === 0x20) {
            const offsets = [];
            let strOffset = offset;
            for (let j = 0; j < count; j++) {
                if (strOffset + 4 > buffer.byteLength) break;
                offsets.push(view.getUint32(strOffset, littleEndian));
                strOffset += 4;
            }
            let prevOff = 0;
            for (let j = 0; j < offsets.length; j++) {
                const strLen = offsets[j] - prevOff;
                if (strOffset + strLen > buffer.byteLength) break;
                outArray.push(this.readString(buffer, strOffset, strLen));
                strOffset += strLen;
                prevOff = offsets[j];
            }
            return strOffset - offset;
        }

        for (let i = 0; i < count; i++) {
            if (offset + bytesRead >= buffer.byteLength) break;

            switch (dataType) {
                case 0x01: // int8
                    outArray.push(view.getInt8(offset + bytesRead));
                    bytesRead += 1;
                    break;
                case 0x02: // int16
                    outArray.push(view.getInt16(offset + bytesRead, littleEndian));
                    bytesRead += 2;
                    break;
                case 0x03: // int32
                    outArray.push(view.getInt32(offset + bytesRead, littleEndian));
                    bytesRead += 4;
                    break;
                case 0x04: // int64
                    outArray.push(Number(this.readInt64(view, offset + bytesRead, littleEndian)));
                    bytesRead += 8;
                    break;
                case 0x05: // uint8
                    outArray.push(view.getUint8(offset + bytesRead));
                    bytesRead += 1;
                    break;
                case 0x06: // uint16
                    outArray.push(view.getUint16(offset + bytesRead, littleEndian));
                    bytesRead += 2;
                    break;
                case 0x07: // uint32
                    outArray.push(view.getUint32(offset + bytesRead, littleEndian));
                    bytesRead += 4;
                    break;
                case 0x08: // uint64
                    outArray.push(Number(this.readUint64(view, offset + bytesRead, littleEndian)));
                    bytesRead += 8;
                    break;
                case 0x09: // float32
                    outArray.push(view.getFloat32(offset + bytesRead, littleEndian));
                    bytesRead += 4;
                    break;
                case 0x0A: // float64 (double)
                    outArray.push(view.getFloat64(offset + bytesRead, littleEndian));
                    bytesRead += 8;
                    break;
                case 0x21: // boolean
                    outArray.push(view.getUint8(offset + bytesRead) !== 0 ? 1 : 0);
                    bytesRead += 1;
                    break;
                case 0x44: // timestamp
                    outArray.push(this.readTimestamp(view, offset + bytesRead, littleEndian));
                    bytesRead += 16;
                    break;
                default:
                    // Fallback for strings or unhandled types
                    bytesRead += 4;
                    break;
            }
        }

        return bytesRead;
    }

    readPropertyValue(view, buffer, offset, propType, littleEndian) {
        switch (propType) {
            case 0x01: // int8
                return { value: view.getInt8(offset), bytesRead: 1 };
            case 0x02: // int16
                return { value: view.getInt16(offset, littleEndian), bytesRead: 2 };
            case 0x03: // int32
                return { value: view.getInt32(offset, littleEndian), bytesRead: 4 };
            case 0x04: // int64
                return { value: Number(this.readInt64(view, offset, littleEndian)), bytesRead: 8 };
            case 0x05: // uint8
                return { value: view.getUint8(offset), bytesRead: 1 };
            case 0x06: // uint16
                return { value: view.getUint16(offset, littleEndian), bytesRead: 2 };
            case 0x07: // uint32
                return { value: view.getUint32(offset, littleEndian), bytesRead: 4 };
            case 0x08: // uint64
                return { value: Number(this.readUint64(view, offset, littleEndian)), bytesRead: 8 };
            case 0x09: // float32
                return { value: view.getFloat32(offset, littleEndian), bytesRead: 4 };
            case 0x0A: // float64
                return { value: view.getFloat64(offset, littleEndian), bytesRead: 8 };
            case 0x20: // string
                const strLen = view.getUint32(offset, littleEndian);
                const strVal = this.readString(buffer, offset + 4, strLen);
                return { value: strVal, bytesRead: 4 + strLen };
            case 0x21: // boolean
                return { value: view.getUint8(offset) !== 0, bytesRead: 1 };
            case 0x44: // timestamp
                return { value: this.readTimestamp(view, offset, littleEndian), bytesRead: 16 };
            default:
                return { value: `[Unhandled Type ${propType}]`, bytesRead: 4 };
        }
    }

    readString(buffer, offset, length) {
        if (length === 0) return '';
        const slice = new Uint8Array(buffer, offset, length);
        return new TextDecoder('utf-8').decode(slice);
    }

    readUint64(view, offset, littleEndian) {
        if (!littleEndian) {
            const high = BigInt(view.getUint32(offset, false));
            const low = BigInt(view.getUint32(offset + 4, false));
            return (high << 32n) | low;
        } else {
            const low = BigInt(view.getUint32(offset, true));
            const high = BigInt(view.getUint32(offset + 4, true));
            return (high << 32n) | low;
        }
    }

    readInt64(view, offset, littleEndian) {
        if (!littleEndian) {
            const high = BigInt(view.getInt32(offset, false));
            const low = BigInt(view.getUint32(offset + 4, false));
            return (high << 32n) | low;
        } else {
            const low = BigInt(view.getUint32(offset, true));
            const high = BigInt(view.getInt32(offset + 4, true));
            return (high << 32n) | low;
        }
    }

    readTimestamp(view, offset, littleEndian) {
        // TDMS Timestamp is stored as 64-bit fraction of second (2^-64) followed by 64-bit integer seconds since 01/01/1904 00:00:00 UTC
        const frac = this.readUint64(view, offset, littleEndian);
        const secondsSince1904 = this.readInt64(view, offset + 8, littleEndian);
        
        // Convert 1904 epoch to 1970 UNIX epoch (diff is 2082844800 seconds)
        const unixSeconds = Number(secondsSince1904) - 2082844800;
        const millis = unixSeconds * 1000 + (Number(frac) / 18446744073709551616) * 1000;
        return new Date(millis).toISOString().replace('T', ' ').replace('Z', ' UTC');
    }

    formatResult() {
        const result = {
            properties: this.file.properties,
            groups: []
        };

        for (const [groupName, groupData] of this.file.groups.entries()) {
            const channels = [];
            for (const [chanName, chanData] of groupData.channels.entries()) {
                const dataArray = chanData.data || [];
                const stats = this.computeStats(dataArray);
                
                channels.push({
                    name: chanName,
                    path: chanData.path,
                    properties: chanData.properties,
                    dataType: chanData.dataType,
                    data: dataArray,
                    stats
                });
            }

            result.groups.push({
                name: groupName,
                path: groupData.path,
                properties: groupData.properties,
                channels
            });
        }

        return result;
    }

    computeStats(dataArray) {
        if (!dataArray || dataArray.length === 0) {
            return { count: 0, min: 0, max: 0, mean: 0, stdDev: 0, rms: 0 };
        }

        let min = Infinity;
        let max = -Infinity;
        let sum = 0;
        let sumSq = 0;
        const count = dataArray.length;

        for (let i = 0; i < count; i++) {
            const val = dataArray[i];
            if (typeof val === 'number' && !isNaN(val)) {
                if (val < min) min = val;
                if (val > max) max = val;
                sum += val;
                sumSq += val * val;
            }
        }

        if (min === Infinity) min = 0;
        if (max === -Infinity) max = 0;
        const mean = sum / count;
        const variance = Math.max(0, (sumSq / count) - (mean * mean));
        const stdDev = Math.sqrt(variance);
        const rms = Math.sqrt(sumSq / count);

        return {
            count,
            min: Number(min.toFixed(4)),
            max: Number(max.toFixed(4)),
            mean: Number(mean.toFixed(4)),
            stdDev: Number(stdDev.toFixed(4)),
            rms: Number(rms.toFixed(4))
        };
    }
}
