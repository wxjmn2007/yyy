import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { GestureState } from '../types';

interface HandControllerProps {
  gestureRef: React.MutableRefObject<GestureState>;
}

const HandController: React.FC<HandControllerProps> = ({ gestureRef }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId: number;

    const setupMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.12/wasm"
        );
        
        if (!isMounted) return;

        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2
        });

        startWebcam();
      } catch (e) {
        console.error("Failed to load MediaPipe:", e);
        if (isMounted) {
          setError("Failed to load AI models.");
          setLoading(false);
        }
      }
    };

    const startWebcam = async () => {
      // Capture ref current value
      const videoEl = videoRef.current;
      if (!videoEl) return;
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        });
        
        if (isMounted && videoEl) {
           videoEl.srcObject = stream;
           videoEl.addEventListener('loadeddata', () => {
             if (videoEl.readyState >= 2) {
               videoEl.play();
               predictWebcam();
             }
           });
           setLoading(false);
        } else {
           // Cleanup if unmounted during await
           stream.getTracks().forEach(t => t.stop());
        }
      } catch (e) {
        console.error("Camera denied:", e);
        if (isMounted) {
          setError("Camera access denied. Please allow camera access to use hand control.");
          setLoading(false);
        }
      }
    };

    const predictWebcam = () => {
      const videoEl = videoRef.current;
      if (!handLandmarker || !videoEl || !isMounted) return;

      if (videoEl.readyState >= 2 && !videoEl.paused && !videoEl.ended) {
        try {
          const startTimeMs = performance.now();
          const results = handLandmarker.detectForVideo(videoEl, startTimeMs);

          if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];
            
            // 1. Calculate Spread
            const wrist = landmarks[0];
            const tips = [4, 8, 12, 16, 20];
            let totalDist = 0;
            
            tips.forEach(idx => {
              const tip = landmarks[idx];
              const dist = Math.sqrt(
                Math.pow(tip.x - wrist.x, 2) + 
                Math.pow(tip.y - wrist.y, 2)
              );
              totalDist += dist;
            });
            
            const avgDist = totalDist / 5;
            const normalizedSpread = Math.min(Math.max((avgDist - 0.15) / 0.25, 0), 1);
            
            // 2. Count Fingers for Numbers (1, 2, 3)
            // Finger Tips: 8 (Index), 12 (Middle), 16 (Ring), 20 (Pinky)
            // Finger PIPs (Knuckles): 6, 10, 14, 18
            // In MediaPipe, Y decreases as you go up. So Tip < PIP means extended.
            
            const isIndexOpen = landmarks[8].y < landmarks[6].y;
            const isMiddleOpen = landmarks[12].y < landmarks[10].y;
            const isRingOpen = landmarks[16].y < landmarks[14].y;
            const isPinkyOpen = landmarks[20].y < landmarks[18].y;
            // Thumb: Check X distance or just assume closed for simplicity in simple counting
            // For robustness, let's just focus on the main 4 fingers
            
            let detectedNumber: 0 | 1 | 2 | 3 = 0;
            
            if (isIndexOpen && !isMiddleOpen && !isRingOpen && !isPinkyOpen) {
                detectedNumber = 1;
            } else if (isIndexOpen && isMiddleOpen && !isRingOpen && !isPinkyOpen) {
                detectedNumber = 2;
            } else if (isIndexOpen && isMiddleOpen && isRingOpen && !isPinkyOpen) {
                detectedNumber = 3;
            }

            // Center Position
            const centerX = (1 - wrist.x) * 2 - 1; 
            const centerY = -(wrist.y * 2 - 1);

            gestureRef.current = {
              isHandDetected: true,
              spreadFactor: normalizedSpread,
              centerX,
              centerY,
              detectedNumber
            };
          } else {
            gestureRef.current = {
              ...gestureRef.current,
              isHandDetected: false,
              detectedNumber: 0
            };
          }
        } catch (err) {
           console.warn("Detection error", err);
        }
      }

      animationFrameId = requestAnimationFrame(predictWebcam);
    };

    setupMediaPipe();

    return () => {
      setIsMounted(false);
      cancelAnimationFrame(animationFrameId);
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(t => t.stop());
      }
      if (handLandmarker) handLandmarker.close();
    };
  }, [gestureRef]);

  return (
    <div className="fixed bottom-4 right-4 z-50 w-32 h-24 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg bg-black/50 backdrop-blur-sm">
       <video 
         ref={videoRef} 
         autoPlay 
         playsInline 
         muted
         className="w-full h-full object-cover transform -scale-x-100 opacity-80" 
       />
       {loading && (
         <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-mono animate-pulse">
           Init AI...
         </div>
       )}
       {error && (
         <div className="absolute inset-0 flex items-center justify-center text-xs text-red-400 bg-black p-1 text-center font-mono">
           {error}
         </div>
       )}
       {!loading && !error && (
         <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
       )}
    </div>
  );
};

export default HandController;