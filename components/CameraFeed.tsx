import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AppState, FaceMetrics } from '../types';
import { initializeMediaPipe, drawFaceMesh, calculateFaceMetrics } from '../services/mediaPipeService';
import { FaceLandmarker } from '@mediapipe/tasks-vision';

interface CameraFeedProps {
  appState: AppState;
  onCapture: (imageSrc: string, metrics: FaceMetrics) => void;
  onModelLoad: () => void;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({ appState, onCapture, onModelLoad }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [landmarker, setLandmarker] = useState<FaceLandmarker | null>(null);
  const [currentMetrics, setCurrentMetrics] = useState<FaceMetrics | null>(null);
  const requestRef = useRef<number>();
  const lastVideoTimeRef = useRef<number>(-1);

  // Initialize MediaPipe
  useEffect(() => {
    const init = async () => {
      try {
        const lp = await initializeMediaPipe();
        setLandmarker(lp);
        onModelLoad();
      } catch (e) {
        console.error("Failed to load MediaPipe", e);
      }
    };
    init();
  }, [onModelLoad]);

  // Start Camera
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setHasPermission(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  // Detection Loop
  const detect = useCallback(() => {
    if (!landmarker || !videoRef.current || !overlayCanvasRef.current) return;

    const video = videoRef.current;
    const canvas = overlayCanvasRef.current;
    
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      // Match canvas to video size
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      let startTimeMs = performance.now();
      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        const results = landmarker.detectForVideo(video, startTimeMs);

        // Draw visual feedback
        drawFaceMesh(canvas, results);

        // Calculate metrics if face found
        if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
          const metrics = calculateFaceMetrics(results.faceBlendshapes[0].categories);
          setCurrentMetrics(metrics);
        } else {
          setCurrentMetrics(null);
        }
      }
    }

    if (appState === AppState.CAPTURING || appState === AppState.IDLE || appState === AppState.SUCCESS) {
      requestRef.current = requestAnimationFrame(detect);
    }
  }, [landmarker, appState]);

  useEffect(() => {
    if (hasPermission && landmarker) {
      requestRef.current = requestAnimationFrame(detect);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [hasPermission, landmarker, detect]);


  const handleCaptureClick = useCallback(() => {
    if (videoRef.current && canvasRef.current && currentMetrics) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageSrc = canvas.toDataURL('image/png');
        // Pass both image AND the precise metrics captured at this moment
        onCapture(imageSrc, currentMetrics);
      }
    } else if (!currentMetrics) {
      alert("No se detecta una cara. Por favor acércate a la cámara.");
    }
  }, [onCapture, currentMetrics]);

  return (
    <div className="relative w-full max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-gray-700 bg-black">
      {!hasPermission && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 p-4 text-center z-20">
          <p>Solicitando acceso a la cámara...</p>
        </div>
      )}

      {!landmarker && hasPermission && (
         <div className="absolute inset-0 flex items-center justify-center text-primary p-4 text-center z-20 bg-black/80">
           <div className="flex flex-col items-center">
             <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
             <p className="font-mono text-sm">CARGANDO MODELOS BIOMÉTRICOS...</p>
           </div>
         </div>
      )}
      
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-auto object-cover transform -scale-x-100 opacity-80`}
      />
      
      {/* Augmented Reality Overlay */}
      <canvas 
        ref={overlayCanvasRef}
        className="absolute inset-0 w-full h-full transform -scale-x-100 pointer-events-none opacity-60"
      />

      {/* Hidden canvas for final capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Overlay UI */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
        <div className="flex justify-between items-start">
          <div className="bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-mono text-green-400 border border-green-500/30 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${currentMetrics ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            {currentMetrics ? 'FACE TRACKED' : 'SEARCHING...'}
          </div>
          <div className="flex flex-col items-end gap-1">
             <div className="bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-mono text-primary border border-primary/30">
              MEDIAPIPE + GEMINI
             </div>
             {currentMetrics && (
               <div className="text-[10px] font-mono text-white/70 bg-black/40 px-2 py-1 rounded">
                 Joy: {(currentMetrics.joy * 100).toFixed(0)}% | Eyes: {(currentMetrics.eyeOpenness * 100).toFixed(0)}%
               </div>
             )}
          </div>
        </div>

        {/* Scanning Line Animation */}
        {appState === AppState.ANALYZING && (
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-primary/20 to-transparent h-[20%] w-full animate-scan"></div>
        )}

        <div className="w-full flex justify-center pb-4 pointer-events-auto">
          <button
            onClick={handleCaptureClick}
            disabled={appState === AppState.ANALYZING || !hasPermission || !landmarker}
            className={`
              w-16 h-16 rounded-full border-4 flex items-center justify-center
              transition-all duration-300 hover:scale-110 active:scale-95
              ${appState === AppState.ANALYZING 
                ? 'opacity-50 cursor-not-allowed border-gray-500' 
                : 'border-white hover:border-primary hover:bg-white/10 shadow-[0_0_15px_rgba(99,102,241,0.5)]'}
            `}
          >
            <div className={`w-12 h-12 bg-white rounded-full transition-all ${appState === AppState.ANALYZING ? 'scale-50 bg-gray-400' : ''}`}></div>
          </button>
        </div>
      </div>
    </div>
  );
};
