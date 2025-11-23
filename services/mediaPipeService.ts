import { FaceLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";
import { FaceMetrics } from "../types";

let faceLandmarker: FaceLandmarker | null = null;

export const initializeMediaPipe = async (): Promise<FaceLandmarker> => {
  if (faceLandmarker) return faceLandmarker;

  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );

  faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
      delegate: "GPU"
    },
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrix: true,
    runningMode: "VIDEO",
    numFaces: 1
  });

  return faceLandmarker;
};

export const calculateFaceMetrics = (blendshapes: any[]): FaceMetrics => {
  // Helper to find score by category name
  const getScore = (name: string) => {
    const shape = blendshapes.find((s: any) => s.categoryName === name);
    return shape ? shape.score : 0;
  };

  // Synthesize emotions from blendshapes (Micro-expressions)
  
  // Joy: Smiles, cheek raising
  const joy = (getScore('mouthSmileLeft') + getScore('mouthSmileRight') + getScore('cheekSquintLeft') + getScore('cheekSquintRight')) / 4;
  
  // Sorrow: Frown, brow down
  const sorrow = (getScore('mouthFrownLeft') + getScore('mouthFrownRight') + getScore('browDownLeft') + getScore('browDownRight')) / 4;
  
  // Anger: Brow down, jaw clench (simplified)
  const anger = (getScore('browDownLeft') + getScore('browDownRight') + getScore('jawForward')) / 3;
  
  // Surprise: Brow up, wide eyes
  const surprise = (getScore('browOuterUpLeft') + getScore('browOuterUpRight') + getScore('eyeWideLeft') + getScore('eyeWideRight')) / 4;

  // Eye Openness
  const eyeOpenness = (getScore('eyeWideLeft') + getScore('eyeWideRight')) / 2 + 0.5; // Normalize base

  // Head Tilt (Using matrix would be better, but simplified here or passed from matrix if needed)
  // For now we return a placeholder or calculate from landmarks in main component
  const headTilt = 0; 

  return {
    joy: Math.min(joy * 2, 1), // Amplify slightly as raw scores are low
    sorrow: Math.min(sorrow * 2, 1),
    anger: Math.min(anger * 2, 1),
    surprise: Math.min(surprise * 2, 1),
    eyeOpenness,
    headTilt
  };
};

export const drawFaceMesh = (canvas: HTMLCanvasElement, results: any) => {
  const ctx = canvas.getContext("2d");
  if (!ctx || !results.faceLandmarks || results.faceLandmarks.length === 0) return;

  const drawingUtils = new DrawingUtils(ctx);
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  for (const landmarks of results.faceLandmarks) {
    drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, {
      color: "#C0C0C070",
      lineWidth: 1
    });
    drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, {
      color: "#6366f1",
      lineWidth: 2
    });
    drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, {
      color: "#6366f1",
      lineWidth: 2
    });
    drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, {
      color: "#E0E0E0",
      lineWidth: 2
    });
  }
};
