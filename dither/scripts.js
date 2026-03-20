// --- Setup GIF Worker to avoid Browser CORS issues ---
let gifWorkerUrl = null;
fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js')
    .then(res => res.text())
    .then(text => {
        const blob = new Blob([text], {type: 'application/javascript'});
        gifWorkerUrl = URL.createObjectURL(blob);
    })
    .catch(err => console.error("Failed to load GIF worker:", err));

// --- DOM Elements ---
const mediaInput = document.getElementById('mediaInput');
const algoSelect = document.getElementById('algoSelect');
const scaleSlider = document.getElementById('scaleSlider');
const scaleValue = document.getElementById('scaleValue');
const statusDiv = document.getElementById('status');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

// Image & Video UI
const imageControls = document.getElementById('imageControls');
const imgDownloadBtn = document.getElementById('imgDownloadBtn');
const videoContainer = document.getElementById('videoContainer');
const vidDownloadBtn = document.getElementById('vidDownloadBtn');
const startCameraBtn = document.getElementById('startCameraBtn');
const stopCameraBtn = document.getElementById('stopCameraBtn');
const cameraSelect = document.getElementById('cameraSelect');
const mirrorToggle = document.getElementById('mirrorToggle');
const playPauseBtn = document.getElementById('playPauseBtn');
const videoProgress = document.getElementById('videoProgress');
const currentTimeText = document.getElementById('currentTimeText');
const durationText = document.getElementById('durationText');
const videoControlsBar = document.querySelector('.video-controls-bar');

// --- State Variables ---
let currentMediaType = 'none';
let originalImage = null;
const sourceVideo = document.createElement('video');
sourceVideo.muted = true;
sourceVideo.playsInline = true;
sourceVideo.crossOrigin = "anonymous";

let animationId;
let gifEncoder = null;
let isRenderingForDownload = false;
let isUserScrubbing = false;
let activeCameraStream = null;
let isMirrorEnabled = false;

async function populateCameraDevices() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;

    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(d => d.kind === 'videoinput');

        const previousValue = cameraSelect.value;
        cameraSelect.innerHTML = '';

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Default Camera';
        cameraSelect.appendChild(defaultOption);

        cameras.forEach((cam, index) => {
            const option = document.createElement('option');
            option.value = cam.deviceId;
            option.textContent = cam.label || `Camera ${index + 1}`;
            cameraSelect.appendChild(option);
        });

        cameraSelect.disabled = cameras.length === 0;
        if ([...cameraSelect.options].some(o => o.value === previousValue)) {
            cameraSelect.value = previousValue;
        }
    } catch (err) {
        console.error('Unable to enumerate camera devices:', err);
        cameraSelect.disabled = true;
    }
}

// GIF Recording constants
let lastFrameTime = 0;
const GIF_FPS = 15; // 15 FPS keeps animated GIF file sizes reasonable
const frameDelayMs = 1000 / GIF_FPS;

// --- Pre-defined Bayer Matrices ---
const bayer2 = [[0, 2], [3, 1]];
const bayer4 = [
    [ 0,  8,  2, 10 ], [12,  4, 14,  6 ],
    [ 3, 11,  1,  9 ], [15,  7, 13,  5 ]
];
const bayer8 = [
    [ 0, 32,  8, 40,  2, 34, 10, 42], [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44,  4, 36, 14, 46,  6, 38], [60, 28, 52, 20, 62, 30, 54, 22],
    [ 3, 35, 11, 43,  1, 33,  9, 41], [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47,  7, 39, 13, 45,  5, 37], [63, 31, 55, 23, 61, 29, 53, 21]
];

// --- Utility Functions ---
function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function getTimestampStr() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    return `${y}${m}${d}_${h}${min}${s}`;
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { 
        document.body.removeChild(a); 
        URL.revokeObjectURL(url); 
    }, 100);
}

function setControlsEnabled(enabled) {
    mediaInput.disabled = !enabled;
    algoSelect.disabled = !enabled;
    scaleSlider.disabled = !enabled;
    vidDownloadBtn.disabled = !enabled;
    videoProgress.disabled = !enabled;
    playPauseBtn.disabled = !enabled;
    videoControlsBar.style.opacity = enabled ? '1' : '0.5';
}

function stopCameraStream() {
    if (activeCameraStream) {
        activeCameraStream.getTracks().forEach(track => track.stop());
        activeCameraStream = null;
    }
    if (sourceVideo.srcObject) sourceVideo.srcObject = null;
}

function resetPlayerState() {
    if (animationId) cancelAnimationFrame(animationId);
    sourceVideo.pause();
    sourceVideo.removeAttribute('src');
    sourceVideo.currentTime = 0;
    stopCameraStream();
    playPauseBtn.textContent = '▶';
    isRenderingForDownload = false;
}

// --- Event Listeners: Media Loading & Settings ---
mediaInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    resetPlayerState();
    originalImage = null;
    setControlsEnabled(true);
    startCameraBtn.disabled = false;
    stopCameraBtn.disabled = true;

    const url = URL.createObjectURL(file);

    if (file.type.startsWith('video/')) {
        currentMediaType = 'video';
        imageControls.style.display = 'none';
        videoContainer.style.display = 'block';
        statusDiv.textContent = "Loading video...";
        
        sourceVideo.src = url;
        sourceVideo.onloadedmetadata = () => {
            statusDiv.textContent = "Video loaded. Ready.";
            durationText.textContent = formatTime(sourceVideo.duration);
            videoProgress.max = sourceVideo.duration;
            videoProgress.value = 0;
            currentTimeText.textContent = '0:00';
            canvas.style.display = 'block';
            sourceVideo.currentTime = 0; 
        };
        sourceVideo.ontimeupdate = () => {
            if (!isUserScrubbing) videoProgress.value = sourceVideo.currentTime;
            currentTimeText.textContent = formatTime(sourceVideo.currentTime);
            if (sourceVideo.paused && !isRenderingForDownload) processAndDraw(sourceVideo);
        };
    } 
    else if (file.type.startsWith('image/')) {
        currentMediaType = 'image';
        videoContainer.style.display = 'none';
        imageControls.style.display = 'block';
        statusDiv.textContent = "Loading image...";
        
        const img = new Image();
        img.onload = function() {
            originalImage = img;
            processAndDraw(originalImage);
            canvas.style.display = 'block';
            imgDownloadBtn.disabled = false;
            statusDiv.textContent = "Image loaded. Ready.";
        }
        img.src = url;
    }
});

async function startCameraFeed() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Camera access is not supported in this browser.');
        return false;
    }

    resetPlayerState();
    originalImage = null;
    setControlsEnabled(true);

    imageControls.style.display = 'none';
    videoContainer.style.display = 'none';
    currentMediaType = 'camera';
    statusDiv.textContent = 'Requesting camera permission...';
    startCameraBtn.disabled = true;
    stopCameraBtn.disabled = true;

    try {
        const selectedDeviceId = cameraSelect.value;
        const videoConstraints = selectedDeviceId
            ? { deviceId: { exact: selectedDeviceId } }
            : { facingMode: 'user' };

        activeCameraStream = await navigator.mediaDevices.getUserMedia({
            video: videoConstraints,
            audio: false
        });

        sourceVideo.srcObject = activeCameraStream;
        await sourceVideo.play();
        await populateCameraDevices();

        const runningTrack = activeCameraStream.getVideoTracks()[0];
        const runningDeviceId = runningTrack && runningTrack.getSettings ? runningTrack.getSettings().deviceId : '';
        if (runningDeviceId && [...cameraSelect.options].some(o => o.value === runningDeviceId)) {
            cameraSelect.value = runningDeviceId;
        }

        canvas.style.display = 'block';
        statusDiv.textContent = 'Camera active. Dithering live feed.';
        stopCameraBtn.disabled = false;
        renderLoop(performance.now());
        return true;
    } catch (err) {
        console.error('Unable to start camera:', err);
        currentMediaType = 'none';
        startCameraBtn.disabled = false;
        stopCameraBtn.disabled = true;
        statusDiv.textContent = 'Could not access camera. Check browser permissions.';
        return false;
    }
}

startCameraBtn.addEventListener('click', async () => {
    await startCameraFeed();
});

cameraSelect.addEventListener('change', async () => {
    if (currentMediaType !== 'camera') return;
    await startCameraFeed();
});

mirrorToggle.addEventListener('change', () => {
    isMirrorEnabled = mirrorToggle.checked;
    if (currentMediaType === 'image' && originalImage) {
        processAndDraw(originalImage);
    } else if ((currentMediaType === 'video' || currentMediaType === 'camera') && sourceVideo.paused) {
        processAndDraw(sourceVideo);
    }
});

stopCameraBtn.addEventListener('click', () => {
    if (currentMediaType !== 'camera') return;
    resetPlayerState();
    currentMediaType = 'none';
    canvas.style.display = 'none';
    startCameraBtn.disabled = false;
    stopCameraBtn.disabled = true;
    statusDiv.textContent = 'Camera stopped. Waiting for media...';
});

function updateOutput() {
    if (currentMediaType === 'image' && originalImage) {
        processAndDraw(originalImage);
    } else if (currentMediaType === 'video' && sourceVideo.readyState >= 2 && sourceVideo.paused) {
        processAndDraw(sourceVideo);
    }
}
algoSelect.addEventListener('change', updateOutput);
scaleSlider.addEventListener('input', (e) => scaleValue.textContent = e.target.value + '%');
scaleSlider.addEventListener('change', updateOutput);

populateCameraDevices();


// --- Event Listeners: Video Controls ---
playPauseBtn.addEventListener('click', () => {
    if (sourceVideo.paused) {
        sourceVideo.play();
        playPauseBtn.textContent = '❚❚';
        renderLoop(performance.now());
    } else {
        sourceVideo.pause();
        playPauseBtn.textContent = '▶';
        if (animationId) cancelAnimationFrame(animationId);
    }
});

videoProgress.addEventListener('input', () => {
    isUserScrubbing = true;
    currentTimeText.textContent = formatTime(videoProgress.value);
});
videoProgress.addEventListener('change', () => {
    isUserScrubbing = false;
    sourceVideo.currentTime = videoProgress.value;
});

// Main Animation Loop
function renderLoop(timestamp) {
    if (!timestamp) timestamp = performance.now();

    if ((currentMediaType === 'video' || currentMediaType === 'camera') && !sourceVideo.paused && !sourceVideo.ended) {
        processAndDraw(sourceVideo);
        
        // Grab frames for GIF at specified FPS interval
        if (isRenderingForDownload && gifEncoder) {
            if (timestamp - lastFrameTime >= frameDelayMs) {
                gifEncoder.addFrame(canvas, { copy: true, delay: frameDelayMs });
                lastFrameTime = timestamp;
            }
        }
        
        animationId = requestAnimationFrame(renderLoop);
    } else if (currentMediaType === 'video' && sourceVideo.ended) {
        playPauseBtn.textContent = '▶';
    }
}

// --- GIF Download Logic ---

// Image to GIF Download
imgDownloadBtn.addEventListener('click', () => {
    if (!gifWorkerUrl) return alert("GIF encoder is loading, please try again in a moment.");
    
    statusDiv.innerHTML = "ENCODING GIF...<br>Please wait.";
    imgDownloadBtn.disabled = true;

    const singleGif = new GIF({
        workers: 2,
        quality: 10,
        workerScript: gifWorkerUrl,
        width: canvas.width,
        height: canvas.height
    });
    
    singleGif.addFrame(canvas, { copy: true, delay: 100 });
    
    singleGif.on('finished', function(blob) {
        downloadBlob(blob, `dither_${getTimestampStr()}.gif`);
        statusDiv.innerHTML = "Image loaded. Ready.";
        imgDownloadBtn.disabled = false;
    });
    
    singleGif.render();
});

// Video to Animated GIF Download
vidDownloadBtn.addEventListener('click', () => {
    if (currentMediaType !== 'video' || !sourceVideo.duration) return;
    if (!gifWorkerUrl) return alert("GIF encoder is loading, please try again in a moment.");

    isRenderingForDownload = true;
    setControlsEnabled(false);
    statusDiv.innerHTML = "CAPTURING FRAMES... <br>Please wait, playing video through once.";

    if (animationId) cancelAnimationFrame(animationId);
    sourceVideo.pause();
    sourceVideo.currentTime = 0;
    lastFrameTime = performance.now();

    gifEncoder = new GIF({
        workers: 4,
        quality: 10,
        workerScript: gifWorkerUrl,
        width: canvas.width,
        height: canvas.height
    });

    gifEncoder.on('finished', function(blob) {
        downloadBlob(blob, `dither_${getTimestampStr()}.gif`);
        finishRecordingState();
    });

    gifEncoder.on('progress', function(p) {
        statusDiv.innerHTML = `ENCODING GIF... ${Math.round(p * 100)}%<br>This may take a moment.`;
    });

    sourceVideo.play().then(() => {
        renderLoop(performance.now());
    }).catch(e => {
        console.error("Playback failed during record start", e);
        finishRecordingState();
    });

    sourceVideo.addEventListener('ended', () => {
        statusDiv.innerHTML = "ENCODING GIF... 0%<br>Processing frames.";
        gifEncoder.render();
    }, { once: true });
});

function finishRecordingState() {
    isRenderingForDownload = false;
    setControlsEnabled(true);
    statusDiv.innerHTML = "Rendering complete. Download started.";
    playPauseBtn.textContent = '▶';
    if (animationId) cancelAnimationFrame(animationId);
    gifEncoder = null;
}

// =========================================
// CORE DITHERING PROCESSING ENGINE
// =========================================
function processAndDraw(source) {
    if (!source) return;

    const sourceWidth = source.videoWidth || source.width || 0;
    const sourceHeight = source.videoHeight || source.height || 0;
    if (sourceWidth === 0 || sourceHeight === 0) return;

    let origWidth = sourceWidth;
    let origHeight = sourceHeight;

    const scale = parseInt(scaleSlider.value) / 100;
    let newWidth = Math.max(2, Math.floor((origWidth * scale) / 2) * 2);
    let newHeight = Math.max(2, Math.floor((origHeight * scale) / 2) * 2);

    if (canvas.width !== newWidth || canvas.height !== newHeight) {
        canvas.width = newWidth;
        canvas.height = newHeight;
    }

    if (isMirrorEnabled) {
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
        ctx.restore();
    } else {
        ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    }
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;
    const algo = algoSelect.value;

    for (let i = 0; i < data.length; i += 4) {
        data[i] = data[i]*0.299 + data[i+1]*0.587 + data[i+2]*0.114;
    }

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let idx = (y * width + x) * 4;
            let oldPixel = data[idx]; 
            let newPixel = 0;

            if (algo === 'threshold') {
                newPixel = oldPixel < 128 ? 0 : 255;
            } 
            else if (algo === 'random') {
                newPixel = oldPixel < (Math.random() * 255) ? 0 : 255;
            }
            else if (algo.startsWith('bayer')) {
                let threshold;
                if (algo === 'bayer2') threshold = (bayer2[y % 2][x % 2] / 4) * 255;
                else if (algo === 'bayer4') threshold = (bayer4[y % 4][x % 4] / 16) * 255;
                else threshold = (bayer8[y % 8][x % 8] / 64) * 255;
                newPixel = oldPixel < threshold ? 0 : 255;
            }
            else {
                newPixel = oldPixel < 128 ? 0 : 255;
                let err = oldPixel - newPixel;

                if (algo === 'floyd') {
                    if (x + 1 < width) data[(y * width + x + 1) * 4] += err * 0.4375;
                    if (y + 1 < height) {
                        if (x - 1 >= 0) data[((y + 1) * width + x - 1) * 4] += err * 0.1875;
                        data[((y + 1) * width + x) * 4] += err * 0.3125;
                        if (x + 1 < width) data[((y + 1) * width + x + 1) * 4] += err * 0.0625;
                    }
                } 
                else if (algo === 'atkinson') {
                    let w = err * 0.125;
                    if (x + 1 < width) data[(y * width + x + 1) * 4] += w;
                    if (x + 2 < width) data[(y * width + x + 2) * 4] += w;
                    if (y + 1 < height) {
                        if (x - 1 >= 0) data[((y + 1) * width + x - 1) * 4] += w;
                        data[((y + 1) * width + x) * 4] += w;
                        if (x + 1 < width) data[((y + 1) * width + x + 1) * 4] += w;
                    }
                    if (y + 2 < height) data[((y + 2) * width + x) * 4] += w;
                }
                else if (algo === 'jjn') {
                    let div = err / 48;
                    if (x + 1 < width) data[(y * width + x + 1) * 4] += div * 7;
                    if (x + 2 < width) data[(y * width + x + 2) * 4] += div * 5;
                    if (y + 1 < height) {
                        if (x - 2 >= 0) data[((y + 1) * width + x - 2) * 4] += div * 3;
                        if (x - 1 >= 0) data[((y + 1) * width + x - 1) * 4] += div * 5;
                        data[((y + 1) * width + x) * 4] += div * 7;
                        if (x + 1 < width) data[((y + 1) * width + x + 1) * 4] += div * 5;
                        if (x + 2 < width) data[((y + 1) * width + x + 2) * 4] += div * 3;
                    }
                    if (y + 2 < height) {
                        if (x - 2 >= 0) data[((y + 2) * width + x - 2) * 4] += div * 1;
                        if (x - 1 >= 0) data[((y + 2) * width + x - 1) * 4] += div * 3;
                        data[((y + 2) * width + x) * 4] += div * 5;
                        if (x + 1 < width) data[((y + 2) * width + x + 1) * 4] += div * 3;
                        if (x + 2 < width) data[((y + 2) * width + x + 2) * 4] += div * 1;
                    }
                }
            }
             data[idx] = data[idx+1] = data[idx+2] = newPixel;
        }
    }

    ctx.putImageData(imageData, 0, 0);
}