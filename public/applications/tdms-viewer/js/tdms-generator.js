/**
 * TDMS Binary Generator
 * Generates valid National Instruments TDMS 2.0 streaming files in memory.
 * Provides rich demo datasets for testing and demonstration without needing external files.
 */

export class TDMSGenerator {
    /**
     * Generate a binary TDMS file based on dataset type.
     * @param {string} demoType 'engine', 'audio', or 'battery'
     * @returns {ArrayBuffer} Valid TDMS binary file
     */
    static generate(demoType = 'engine') {
        let groupName = "Engine Diagnostics";
        let channelsData = [];
        let numPoints = 1000;
        let fileProps = {
            Title: "Automotive Dyno Telemetry Run #409",
            Author: "NJS Test Lab",
            Description: "High-frequency telemetry captured during dyno acceleration test with 3-speed shift simulation.",
            SampleRate: "100 Hz"
        };

        if (demoType === 'engine') {
            numPoints = 1000;
            groupName = "Engine Diagnostics";
            fileProps.Title = "Automotive Dyno Telemetry Run #409";
            
            const time = new Float64Array(numPoints);
            const rpm = new Float64Array(numPoints);
            const coolant = new Float64Array(numPoints);
            const oilPress = new Float64Array(numPoints);
            const voltage = new Float64Array(numPoints);
            const vib = new Float64Array(numPoints);
            const afr = new Float64Array(numPoints);

            for (let i = 0; i < numPoints; i++) {
                const t = i * 0.01;
                time[i] = Number(t.toFixed(4));
                
                // RPM: 3 gear shifts
                let baseRpm = 1200;
                if (t < 3.0) {
                    baseRpm = 1200 + (t / 3.0) * 4800; // 1st gear
                } else if (t < 3.3) {
                    baseRpm = 3800 - ((t - 3.0) / 0.3) * 600; // shift dip
                } else if (t < 6.5) {
                    baseRpm = 3200 + ((t - 3.3) / 3.2) * 3300; // 2nd gear
                } else if (t < 6.8) {
                    baseRpm = 4500 - ((t - 6.5) / 0.3) * 700; // shift dip
                } else {
                    baseRpm = 3800 + ((t - 6.8) / 3.2) * 2700; // 3rd gear
                }
                rpm[i] = baseRpm + Math.sin(t * 30) * 25 + (Math.random() - 0.5) * 15;
                
                // Coolant Temp
                coolant[i] = 82.5 + (1 - Math.exp(-t / 4)) * 9.2 + Math.sin(t * 0.5) * 0.1;
                
                // Oil Pressure proportional to RPM with ripple
                oilPress[i] = 25 + (rpm[i] / 6500) * 52 + Math.sin(t * 120) * 1.8;
                
                // Battery Voltage around 14.1V with alternator ripple
                voltage[i] = 14.1 - (rpm[i] > 4000 ? 0.15 : 0) + Math.sin(t * 60) * 0.04 + (Math.random() - 0.5) * 0.02;
                
                // Vibration (g)
                const vibAmp = 0.5 + (rpm[i] / 6500) * 3.2 + ((t > 3.0 && t < 3.3) || (t > 6.5 && t < 6.8) ? 4.5 : 0);
                vib[i] = Math.sin(t * 450) * vibAmp + Math.cos(t * 890) * (vibAmp * 0.6) + (Math.random() - 0.5) * 0.8;
                
                // AFR (Air-Fuel Ratio)
                afr[i] = 14.7 + Math.sin(t * 8) * 0.4 + (Math.random() - 0.5) * 0.15;
            }

            channelsData = [
                { name: "Time", unit: "s", desc: "Elapsed time in seconds", data: time },
                { name: "Engine RPM", unit: "RPM", desc: "Crankshaft rotational speed", data: rpm },
                { name: "Coolant Temp", unit: "°C", desc: "Engine coolant temperature at thermostat", data: coolant },
                { name: "Oil Pressure", unit: "PSI", desc: "Main gallery oil pressure", data: oilPress },
                { name: "Battery Voltage", unit: "V", desc: "Electrical system bus voltage", data: voltage },
                { name: "Block Vibration", unit: "g", desc: "Knock sensor vibration acceleration", data: vib },
                { name: "Air-Fuel Ratio", unit: ":1", desc: "Wideband O2 sensor exhaust AFR", data: afr }
            ];
        } else if (demoType === 'audio') {
            numPoints = 2000;
            groupName = "Acoustic Stream";
            fileProps = {
                Title: "Stereo Chamber Resonance Test",
                Author: "NJS Acoustics Lab",
                Description: "44.1 kHz acoustic capture of A4 (440Hz) tone with phase-shifted stereo reflections and 60Hz hum.",
                SampleRate: "44100 Hz"
            };

            const time = new Float64Array(numPoints);
            const micLeft = new Float64Array(numPoints);
            const micRight = new Float64Array(numPoints);
            const noiseFloor = new Float64Array(numPoints);

            for (let i = 0; i < numPoints; i++) {
                const tSec = i / 44100;
                time[i] = Number((tSec * 1000).toFixed(4)); // time in ms
                
                // 440 Hz fundamental + 880 Hz harmonic
                const env = Math.min(1.0, tSec * 50) * Math.exp(-tSec * 2);
                micLeft[i] = env * (Math.sin(2 * Math.PI * 440 * tSec) * 500 + Math.sin(2 * Math.PI * 880 * tSec) * 120) + (Math.random() - 0.5) * 8;
                micRight[i] = env * (Math.sin(2 * Math.PI * 440 * tSec - 0.5) * 480 + Math.sin(2 * Math.PI * 880 * tSec - 0.2) * 110) + (Math.random() - 0.5) * 8;
                noiseFloor[i] = Math.sin(2 * Math.PI * 60 * tSec) * 15 + Math.sin(2 * Math.PI * 120 * tSec) * 5 + (Math.random() - 0.5) * 3;
            }

            channelsData = [
                { name: "Time", unit: "ms", desc: "Time in milliseconds", data: time },
                { name: "Mic Left", unit: "mV", desc: "Left channel cardioid microphone", data: micLeft },
                { name: "Mic Right", unit: "mV", desc: "Right channel cardioid microphone", data: micRight },
                { name: "Ambient Noise", unit: "mV", desc: "Chamber background noise floor", data: noiseFloor }
            ];
        } else { // battery
            numPoints = 500;
            groupName = "Battery Chamber Test";
            fileProps = {
                Title: "Li-Ion 21700 Thermal Stress & Discharge Cycle",
                Author: "NJS Power Systems",
                Description: "1 Hz continuous logging of 50A stepped load pulses, voltage drop, and cell skin temperature.",
                SampleRate: "1 Hz"
            };

            const time = new Float64Array(numPoints);
            const voltage = new Float64Array(numPoints);
            const current = new Float64Array(numPoints);
            const temp = new Float64Array(numPoints);
            const soc = new Float64Array(numPoints);

            let currTemp = 24.0;
            let currSoc = 100.0;
            for (let i = 0; i < numPoints; i++) {
                time[i] = i;
                
                // Load current step pulses: 0A, 15A, 30A, 45A
                let loadA = 0;
                if ((i > 50 && i <= 150) || (i > 250 && i <= 350)) loadA = 25;
                if (i > 150 && i <= 250) loadA = 45;
                if (i > 380 && i <= 460) loadA = 35;
                current[i] = loadA + (loadA > 0 ? (Math.random() - 0.5) * 0.8 : 0);
                
                // SOC drain
                currSoc -= (loadA * 0.0035);
                currSoc = Math.max(0, currSoc);
                soc[i] = Number(currSoc.toFixed(2));
                
                // Voltage drop under load + internal resistance sag
                const openCircuitV = 3.2 + (currSoc / 100) * 1.0;
                const sag = loadA * 0.012;
                voltage[i] = openCircuitV - sag + (Math.random() - 0.5) * 0.005;
                
                // Temp dynamics
                const heatTarget = 24.0 + (loadA * 0.55);
                currTemp += (heatTarget - currTemp) * 0.04 + (Math.random() - 0.5) * 0.05;
                temp[i] = Number(currTemp.toFixed(2));
            }

            channelsData = [
                { name: "Time", unit: "s", desc: "Test duration in seconds", data: time },
                { name: "Cell Voltage", unit: "V", desc: "Terminal voltage across cell", data: voltage },
                { name: "Load Current", unit: "A", desc: "Active discharge current", data: current },
                { name: "Skin Temp", unit: "°C", desc: "Surface thermocouple temperature", data: temp },
                { name: "State of Charge", unit: "%", desc: "Estimated battery SOC", data: soc }
            ];
        }

        return TDMSGenerator.buildBuffer(fileProps, groupName, channelsData, numPoints);
    }

    static buildBuffer(fileProps, groupName, channelsData, numPoints) {
        // We will build:
        // 1. Lead-In header (28 bytes)
        // 2. Metadata block
        // 3. Raw Data block (contiguous float64 arrays for each channel)
        
        const metaParts = [];
        
        // Helper to push integers/strings into metaParts
        const pushUint32 = (val) => {
            const buf = new Uint8Array(4);
            new DataView(buf.buffer).setUint32(0, val, true);
            metaParts.push(buf);
        };
        const pushUint64 = (valBig) => {
            const buf = new Uint8Array(8);
            const low = Number(valBig & 0xFFFFFFFFn);
            const high = Number((valBig >> 32n) & 0xFFFFFFFFn);
            const view = new DataView(buf.buffer);
            view.setUint32(0, low, true);
            view.setUint32(4, high, true);
            metaParts.push(buf);
        };
        const pushString = (str) => {
            const bytes = new TextEncoder().encode(str);
            pushUint32(bytes.length);
            metaParts.push(bytes);
        };

        // Number of objects: 1 File (/) + 1 Group (/'GroupName') + N Channels
        pushUint32(2 + channelsData.length);

        // Object 1: File Root "/"
        pushString("/");
        pushUint32(0xFFFFFFFF); // No raw data
        const filePropKeys = Object.keys(fileProps);
        pushUint32(filePropKeys.length);
        for (const key of filePropKeys) {
            pushString(key);
            pushUint32(0x20); // string type
            pushString(String(fileProps[key]));
        }

        // Object 2: Group "/'GroupName'"
        const groupPath = `/'${groupName}'`;
        pushString(groupPath);
        pushUint32(0xFFFFFFFF); // No raw data
        pushUint32(1); // 1 property
        pushString("Description");
        pushUint32(0x20);
        pushString(`Test group containing ${channelsData.length} channels of telemetry.`);

        // Objects 3..N+2: Channels
        for (const chan of channelsData) {
            const chanPath = `${groupPath}/'${chan.name}'`;
            pushString(chanPath);
            
            // Raw Data Index: 0x14 (20 bytes header size for new spec)
            pushUint32(0x00000014);
            pushUint32(0x0A); // float64 (double precision)
            pushUint32(1);    // dimension = 1
            pushUint64(BigInt(numPoints)); // count
            
            // Properties: NI_ChannelName, unit_string, description
            pushUint32(3);
            
            pushString("NI_ChannelName");
            pushUint32(0x20);
            pushString(chan.name);
            
            pushString("unit_string");
            pushUint32(0x20);
            pushString(chan.unit || "");
            
            pushString("description");
            pushUint32(0x20);
            pushString(chan.desc || "");
        }

        // Calculate metadata size
        let metaSize = 0;
        for (const part of metaParts) metaSize += part.length;

        // Calculate raw data size: numChannels * numPoints * 8 bytes (float64)
        const rawSize = channelsData.length * numPoints * 8;
        const totalSize = 28 + metaSize + rawSize;

        // Allocate final buffer
        const buffer = new ArrayBuffer(totalSize);
        const view = new DataView(buffer);
        const uint8View = new Uint8Array(buffer);

        // 1. Write Lead-In (28 bytes)
        // Tag 'TDSm'
        uint8View[0] = 0x54; // 'T'
        uint8View[1] = 0x44; // 'D'
        uint8View[2] = 0x53; // 'S'
        uint8View[3] = 0x6D; // 'm'

        // ToC Bitmask: kTocMetaData (0x02) | kTocNewObjList (0x04) | kTocRawData (0x08) = 0x0E
        view.setUint32(4, 0x0000000E, true);
        
        // Version: 4713 (0x1269 for TDMS 2.0)
        view.setUint32(8, 4713, true);

        // Next Segment Offset: metaSize + rawSize
        const nextOffsetBig = BigInt(metaSize + rawSize);
        view.setUint32(12, Number(nextOffsetBig & 0xFFFFFFFFn), true);
        view.setUint32(16, Number((nextOffsetBig >> 32n) & 0xFFFFFFFFn), true);

        // Raw Data Offset: metaSize
        const rawOffsetBig = BigInt(metaSize);
        view.setUint32(20, Number(rawOffsetBig & 0xFFFFFFFFn), true);
        view.setUint32(24, Number((rawOffsetBig >> 32n) & 0xFFFFFFFFn), true);

        // 2. Copy Metadata into buffer starting at byte 28
        let curOffset = 28;
        for (const part of metaParts) {
            uint8View.set(part, curOffset);
            curOffset += part.length;
        }

        // 3. Write Raw Data (Float64 arrays contiguous)
        for (const chan of channelsData) {
            for (let i = 0; i < numPoints; i++) {
                view.setFloat64(curOffset, chan.data[i], true);
                curOffset += 8;
            }
        }

        return buffer;
    }
}
