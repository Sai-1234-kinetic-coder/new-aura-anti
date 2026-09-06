/**
 * AuraFit Computer Vision Mathematics & Joint Angle Engine
 * Privacy-first, zero-cloud client-side joint angle calculations & posture fault analyzers.
 */

/**
 * Calculates the interior angle between three 2D keypoints (A, B, C) in degrees.
 * B is the vertex joint (e.g. Hip -> Knee -> Ankle, or Shoulder -> Elbow -> Wrist).
 */
export function calculateJointAngle(pointA, pointB, pointC) {
  if (!pointA || !pointB || !pointC) return 180;

  const vectorBA = { x: pointA.x - pointB.x, y: pointA.y - pointB.y };
  const vectorBC = { x: pointC.x - pointB.x, y: pointC.y - pointB.y };

  const dotProduct = vectorBA.x * vectorBC.x + vectorBA.y * vectorBC.y;
  const magnitudeBA = Math.sqrt(vectorBA.x * vectorBA.x + vectorBA.y * vectorBA.y);
  const magnitudeBC = Math.sqrt(vectorBC.x * vectorBC.x + vectorBC.y * vectorBC.y);

  if (magnitudeBA === 0 || magnitudeBC === 0) return 180;

  const cosineAngle = Math.max(-1, Math.min(1, dotProduct / (magnitudeBA * magnitudeBC)));
  const angleRadians = Math.acos(cosineAngle);
  return Math.round((angleRadians * 180) / Math.PI);
}

/**
 * Evaluates posture form faults based on keypoint geometries
 */
export function evaluatePostureFaults(exerciseType, angle, keypoints = null) {
  const faults = [];

  if (exerciseType === 'Squats') {
    if (angle > 115) {
      faults.push({
        code: 'SHALLOW_DEPTH',
        message: 'Increase depth: Lower hips until thighs are parallel with floor.',
        voicePrompt: 'Go deeper for full rep'
      });
    }
  } else if (exerciseType === 'Pushups') {
    if (angle > 105) {
      faults.push({
        code: 'SHALLOW_CHEST',
        message: 'Lower chest closer to the floor (elbows past 90 degrees).',
        voicePrompt: 'Lower chest further'
      });
    }
  } else if (exerciseType === 'Lunges') {
    if (angle > 100) {
      faults.push({
        code: 'INSUFFICIENT_LUNGE_DROP',
        message: 'Drop rear knee closer to ground for full quadricep activation.',
        voicePrompt: 'Drop rear knee lower'
      });
    }
  } else if (exerciseType === 'Plank') {
    if (angle < 160) {
      faults.push({
        code: 'HIPS_SAGGING',
        message: 'Hips are sagging: tighten your abdominal core and glutes.',
        voicePrompt: 'Engage core, lift hips'
      });
    } else if (angle > 190) {
      faults.push({
        code: 'HIPS_PIKED',
        message: 'Hips are too high: align shoulders, hips, and ankles in a straight line.',
        voicePrompt: 'Lower hips into neutral line'
      });
    }
  } else if (exerciseType === 'Warrior II') {
    if (angle > 110) {
      faults.push({
        code: 'WARRIOR_KNEE_STRAIGHT',
        message: 'Deepen front knee bend towards 90 degrees over ankle.',
        voicePrompt: 'Deepen front lunge'
      });
    }
  }

  return faults;
}

/**
 * Exercises and Yoga Poses Configuration
 */
export const VISION_EXERCISES = {
  'Squats': {
    name: 'AI Squats',
    category: 'strength',
    angleName: 'Knee Flexion',
    targetGoal: '< 90°',
    color: '#10b981',
    defaultAngle: 175,
    thresholdDown: 90,
    thresholdUp: 160,
    xpPerRep: 10,
    calPerRep: 0.8,
    voiceCues: {
      down: 'Full depth reached',
      up: 'Perfect squat! Drive through heels'
    }
  },
  'Pushups': {
    name: 'AI Push-ups',
    category: 'strength',
    angleName: 'Elbow Flexion',
    targetGoal: '< 90°',
    color: '#38bdf8',
    defaultAngle: 175,
    thresholdDown: 85,
    thresholdUp: 160,
    xpPerRep: 10,
    calPerRep: 0.9,
    voiceCues: {
      down: 'Chest depth locked',
      up: 'Full lockout confirmed'
    }
  },
  'Lunges': {
    name: 'AI Lunges',
    category: 'strength',
    angleName: 'Lead Knee Angle',
    targetGoal: '< 95°',
    color: '#f59e0b',
    defaultAngle: 175,
    thresholdDown: 92,
    thresholdUp: 155,
    xpPerRep: 10,
    calPerRep: 0.7,
    voiceCues: {
      down: 'Lunge depth reached',
      up: 'Stand tall and switch'
    }
  },
  'Jumping Jacks': {
    name: 'Jumping Jacks',
    category: 'cardio',
    angleName: 'Arm Abduction',
    targetGoal: '> 140°',
    color: '#ec4899',
    defaultAngle: 45,
    thresholdDown: 60,
    thresholdUp: 140,
    xpPerRep: 5,
    calPerRep: 0.4,
    voiceCues: {
      down: 'Arms down',
      up: 'Reach high and wide'
    }
  },
  'Plank': {
    name: 'Isometric Plank',
    category: 'isometric',
    angleName: 'Spine Alignment',
    targetGoal: '165° - 180°',
    color: '#a855f7',
    defaultAngle: 178,
    thresholdDown: 160,
    thresholdUp: 178,
    xpPerRep: 10,
    calPerRep: 1.5,
    voiceCues: {
      down: 'Keep spine neutral',
      up: 'Solid core hold locked'
    }
  },
  'Warrior II': {
    name: 'Warrior II Yoga Asana',
    category: 'yoga',
    angleName: 'Front Knee & Arm Line',
    targetGoal: '90° Flexion',
    color: '#06b6d4',
    defaultAngle: 140,
    thresholdDown: 90,
    thresholdUp: 110,
    xpPerRep: 15,
    calPerRep: 1.2,
    voiceCues: {
      down: 'Gaze over front fingertips',
      up: 'Warrior hold mastered'
    }
  }
};
