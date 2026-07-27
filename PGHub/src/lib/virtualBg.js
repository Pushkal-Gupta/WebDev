// Virtual background via MediaPipe Selfie Segmentation. Runs person-segmentation per
// frame, composites a sharp person over a blurred (or replaced) background on a canvas,
// and exposes the canvas as a MediaStream track to send in place of the raw camera.
//
// Everything here is lazy + defensive: the heavy MediaPipe module and its WASM/model load
// on first use, and any failure throws so the caller can silently fall back to the raw
// camera — the call must never break because a background effect couldn't initialize.

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite';

let segmenterPromise = null;
async function getSegmenter() {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const { FilesetResolver, ImageSegmenter } = await import('@mediapipe/tasks-vision');
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);
      return ImageSegmenter.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        outputConfidenceMasks: true,
        outputCategoryMask: false,
      });
    })().catch((e) => { segmenterPromise = null; throw e; });
  }
  return segmenterPromise;
}

// mode: 'blur' | { image: HTMLImageElement }. Returns { track, stop }.
export async function startVirtualBg(srcTrack, mode = 'blur') {
  const segmenter = await getSegmenter();
  const settings = srcTrack.getSettings ? srcTrack.getSettings() : {};
  const w = settings.width || 640, h = settings.height || 480;

  const video = document.createElement('video');
  video.muted = true; video.playsInline = true; video.autoplay = true;
  video.srcObject = new MediaStream([srcTrack]);
  await video.play().catch(() => {});

  const out = document.createElement('canvas'); out.width = w; out.height = h;
  const ctx = out.getContext('2d');
  const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
  const tctx = tmp.getContext('2d', { willReadFrequently: true });

  let running = true, raf = 0;
  const compositePerson = (maskFloat) => {
    // sharp person cutout: draw frame, then use the confidence mask as alpha
    tctx.clearRect(0, 0, w, h);
    tctx.drawImage(video, 0, 0, w, h);
    const frame = tctx.getImageData(0, 0, w, h);
    const d = frame.data;
    for (let i = 0; i < maskFloat.length; i++) d[i * 4 + 3] = Math.round(maskFloat[i] * 255);
    tctx.putImageData(frame, 0, 0);
  };

  const render = () => {
    if (!running) return;
    if (video.readyState >= 2) {
      try {
        segmenter.segmentForVideo(video, performance.now(), (result) => {
          const conf = result.confidenceMasks && result.confidenceMasks[0];
          const maskFloat = conf ? conf.getAsFloat32Array() : null;
          // background layer
          if (mode && mode.image) {
            ctx.drawImage(mode.image, 0, 0, w, h);
          } else {
            ctx.filter = 'blur(14px)';
            ctx.drawImage(video, 0, 0, w, h);
            ctx.filter = 'none';
          }
          // person layer over it
          if (maskFloat) { compositePerson(maskFloat); ctx.drawImage(tmp, 0, 0); }
          else { ctx.drawImage(video, 0, 0, w, h); }
          conf?.close?.();
        });
      } catch { /* transient frame error — skip */ }
    }
    raf = requestAnimationFrame(render);
  };
  render();

  const stream = out.captureStream(24);
  const track = stream.getVideoTracks()[0];
  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
    try { video.pause(); } catch { /* noop */ }
    video.srcObject = null;
    try { track.stop(); } catch { /* noop */ }
  };
  return { track, stop };
}
