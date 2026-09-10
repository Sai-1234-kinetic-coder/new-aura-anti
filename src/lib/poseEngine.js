/**
 * AuraFit Dual Pose Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Tries Google MediaPipe Pose (33 landmarks) first.
 * If MediaPipe CDN load exceeds the timeout OR the device is low-end,
 * falls back automatically to TensorFlow.js MoveNet Lightning (17 landmarks).
 *
 * Both engines expose the same interface so AICamera.jsx needs zero changes
 * to its frame-pump or pose-evaluation logic.
 *
 * MoveNet keypoint → MediaPipe slot mapping (sparse 33-element array):
 *   MoveNet idx  MediaPipe idx  Joint
 *       0             0         nose
 *       1             2         left_eye
 *       2             5         right_eye
 *       3             7         left_ear
 *       4             8         right_ear
 *       5            11         left_shoulder
 *       6            12         right_shoulder
 *       7            13         left_elbow
 *       8            14         right_elbow
 *       9            15         left_wrist
 *      10            16         right_wrist
 *      11            23         left_hip
 *      12            24         right_hip
 *      13            25         left_knee
 *      14            26         right_knee
 *      15            27         left_ankle
 *      16            28         right_ankle
 */

// How long (ms) to wait for the MediaPipe CDN script before switching to MoveNet
const MEDIAPIPE_TIMEOUT_MS = 6000;

// MoveNet index → MediaPipe index lookup
const MN_TO_MP = [0, 2, 5, 7, 8, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isLowEndDevice() {
  const cores = navigator.hardwareConcurrency || 4;
  const mem   = navigator.deviceMemory       || 4;   // GB (not available on Firefox)
  return cores < 4 || mem < 3;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const el = document.createElement('script');
    el.src = src;
    el.crossOrigin = 'anonymous';
    el.onload  = resolve;
    el.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(el);
  });
}

/** Poll until window.Pose is defined or timeout expires */
function waitForMediaPipe(ms) {
  const deadline = Date.now() + ms;
  return new Promise(resolve => {
    const tick = () => {
      if (window.Pose)       { resolve(true);  return; }
      if (Date.now() > deadline) { resolve(false); return; }
      setTimeout(tick, 250);
    };
    tick();
  });
}

/** Dynamically load TF.js + pose-detection from CDN */
async function loadMoveNetCDN() {
  // Load in dependency order (TF core must come first)
  await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core@4.20.0/dist/tf-core.min.js');
  await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl@4.20.0/dist/tf-backend-webgl.min.js');
  await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter@4.20.0/dist/tf-converter.min.js');
  await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.3/dist/pose-detection.min.js');

  // Wait for the WebGL backend to be fully ready
  if (window.tf) await window.tf.ready();

  const detector = await window.poseDetection.createDetector(
    window.poseDetection.SupportedModels.MoveNet,
    {
      modelType:       window.poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      enableSmoothing: true,
    }
  );
  return detector;
}

/**
 * Converts MoveNet's 17 keypoints (pixel coords) to a 33-slot array
 * matching MediaPipe's normalised {x, y, z, visibility} format.
 * Slots with no MoveNet equivalent are left null (safe — all downstream
 * code already uses null-guards like `lm[24] && lm[26] && lm[28]`).
 */
function movenetToMediaPipe(keypoints, videoW, videoH) {
  const lm = new Array(33).fill(null);
  keypoints.forEach((kp, mnIdx) => {
    const mpIdx = MN_TO_MP[mnIdx];
    if (mpIdx === undefined) return;
    lm[mpIdx] = {
      x:          kp.x / videoW,
      y:          kp.y / videoH,
      z:          0,
      visibility: kp.score ?? 0,
    };
  });
  return lm;
}

// ─── PoseEngine class ─────────────────────────────────────────────────────────

export class PoseEngine {
  constructor() {
    this._type       = null;   // 'mediapipe' | 'movenet' | null
    this._mpPose     = null;
    this._mnDetector = null;
    this._onResults  = null;
    this._mpOptions  = {};
  }

  /** Mirror of MediaPipe Pose.setOptions() */
  setOptions(opts) {
    this._mpOptions = opts;
  }

  /** Mirror of MediaPipe Pose.onResults() */
  onResults(cb) {
    this._onResults = cb;
    // Re-wire if MediaPipe is already initialised
    if (this._mpPose) this._mpPose.onResults(cb);
  }

  /** Which engine is currently active ('mediapipe' | 'movenet' | null) */
  get engineType() { return this._type; }

  /**
   * Initialise the engine. Call this once after construction.
   * Resolves when the engine is ready to accept frames via send().
   */
  async init() {
    // ── 1. Try MediaPipe (skip on low-end devices to save time) ──────────────
    if (!isLowEndDevice()) {
      const mpReady = await waitForMediaPipe(MEDIAPIPE_TIMEOUT_MS);
      if (mpReady) {
        try {
          const pose = new window.Pose({
            locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`
          });
          pose.setOptions({
            modelComplexity:        0,
            smoothLandmarks:        true,
            enableSegmentation:     false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence:  0.5,
            ...this._mpOptions,
          });
          pose.onResults(this._onResults || (() => {}));
          this._mpPose = pose;
          this._type   = 'mediapipe';
          console.info('[PoseEngine] Using MediaPipe Pose (33 landmarks)');
          return;
        } catch (e) {
          console.warn('[PoseEngine] MediaPipe init failed — switching to MoveNet:', e);
        }
      } else {
        console.info(`[PoseEngine] MediaPipe CDN timed out after ${MEDIAPIPE_TIMEOUT_MS}ms — switching to MoveNet`);
      }
    } else {
      console.info('[PoseEngine] Low-end device detected — loading MoveNet Lightning directly');
    }

    // ── 2. Fallback: MoveNet Lightning ───────────────────────────────────────
    try {
      this._mnDetector = await loadMoveNetCDN();
      this._type = 'movenet';
      console.info('[PoseEngine] Using MoveNet Lightning (17 landmarks → mapped to MP-33 format)');
    } catch (e) {
      console.error('[PoseEngine] Both engines failed. Pose tracking unavailable.', e);
    }
  }

  /**
   * Mirror of MediaPipe Pose.send({ image: videoElement }).
   * Internally routes to whichever engine is active.
   */
  async send({ image }) {
    if (this._type === 'mediapipe' && this._mpPose) {
      await this._mpPose.send({ image });

    } else if (this._type === 'movenet' && this._mnDetector) {
      try {
        const poses = await this._mnDetector.estimatePoses(image);
        if (poses?.[0]?.keypoints?.length) {
          const w  = image.videoWidth  || image.width  || 640;
          const h  = image.videoHeight || image.height || 480;
          const lm = movenetToMediaPipe(poses[0].keypoints, w, h);
          this._onResults?.({ poseLandmarks: lm });
        } else {
          this._onResults?.({ poseLandmarks: null });
        }
      } catch (_) {
        // Skip frame silently to avoid dropping the camera feed
      }
    }
  }

  /** Release resources (mirrors MediaPipe Pose.close()) */
  close() {
    if (this._mpPose) {
      try { this._mpPose.close(); } catch (_) {}
      this._mpPose = null;
    }
    if (this._mnDetector) {
      try { this._mnDetector.dispose(); } catch (_) {}
      this._mnDetector = null;
    }
    this._type = null;
  }
}
