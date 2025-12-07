import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { 
  Palette, 
  Hand, 
  Maximize2, 
  Minimize2, 
  Activity, 
  Aperture,
  Globe,
  Heart
} from 'lucide-react';

import ParticleSystem from './components/ParticleSystem';
import HandController from './components/HandController';
import { ShapeType, ParticleConfig, GestureState } from './types';

const App: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [config, setConfig] = useState<ParticleConfig>({
    count: 6000,
    color: '#00ccff',
    shape: ShapeType.SPHERE,
  });

  const gestureRef = useRef<GestureState>({
    isHandDetected: false,
    spreadFactor: 0,
    centerX: 0,
    centerY: 0
  });

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const shapes = [
    { type: ShapeType.SPHERE, icon: <Globe size={18} />, label: "Sphere" },
    { type: ShapeType.HEART, icon: <Heart size={18} />, label: "Heart" },
    { type: ShapeType.FLOWER, icon: <Aperture size={18} />, label: "Flower" },
    { type: ShapeType.SATURN, icon: <Activity size={18} />, label: "Saturn" },
    { type: ShapeType.DNA, icon: <Activity size={18} />, label: "DNA" },
  ];

  return (
    <div className="relative w-full h-screen bg-black text-white font-sans overflow-hidden select-none">
      
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 20], fov: 45 }} dpr={[1, 2]}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <spotLight position={[-10, -10, -10]} angle={0.3} penumbra={1} intensity={1} color={config.color} />
          
          <Suspense fallback={null}>
             <ParticleSystem config={config} gestureRef={gestureRef} />
             <Environment preset="city" />
          </Suspense>
          
          <ContactShadows resolution={512} scale={20} blur={2} opacity={0.5} far={10} color="#000000" />
          <OrbitControls enableZoom={false} autoRotate={false} />
        </Canvas>
      </div>

      {/* Hand Tracker (Hidden Logic + Preview) */}
      <HandController gestureRef={gestureRef} />

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
        
        {/* Header */}
        <header className="flex justify-between items-start pointer-events-auto">
          <div>
             <h1 className="text-3xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
               AETHER
             </h1>
             <p className="text-xs text-white/50 tracking-widest uppercase mt-1">
               Gesture Interactive System
             </p>
          </div>
          <button 
            onClick={toggleFullscreen}
            className="p-3 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all text-white/80 hover:text-white"
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </header>

        {/* Instructions */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center opacity-30 mix-blend-screen">
          <Hand size={64} className="mx-auto mb-4 animate-pulse" />
          <p className="text-sm tracking-widest uppercase">Open hand to expand</p>
          <p className="text-sm tracking-widest uppercase">Close hand to contract</p>
        </div>

        {/* Controls */}
        <div className="pointer-events-auto w-full max-w-2xl mx-auto backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col md:flex-row items-center gap-6 md:gap-8">
          
          {/* Shape Selector */}
          <div className="flex-1 w-full">
            <label className="text-xs text-white/40 uppercase tracking-wider font-bold mb-3 block">Model Geometry</label>
            <div className="flex justify-between gap-2">
              {shapes.map((s) => (
                <button
                  key={s.type}
                  onClick={() => setConfig(prev => ({ ...prev, shape: s.type }))}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 w-full group
                    ${config.shape === s.type 
                      ? 'bg-white/10 border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]' 
                      : 'bg-transparent border-transparent text-white/40 hover:bg-white/5 hover:text-white/80'
                    } border`}
                >
                  <span className={`mb-2 transition-transform duration-300 ${config.shape === s.type ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {s.icon}
                  </span>
                  <span className="text-[10px] font-medium">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="w-px h-16 bg-white/10 hidden md:block"></div>

          {/* Color & Settings */}
          <div className="flex items-center gap-6">
             <div className="flex flex-col gap-2">
                <label className="text-xs text-white/40 uppercase tracking-wider font-bold">Base Color</label>
                <div className="flex items-center gap-3">
                  <div className="relative overflow-hidden w-10 h-10 rounded-full border border-white/20 shadow-inner">
                    <input 
                      type="color" 
                      value={config.color}
                      onChange={(e) => setConfig(prev => ({ ...prev, color: e.target.value }))}
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 border-0 cursor-pointer"
                    />
                  </div>
                  <div className="text-xs font-mono text-white/70">
                    {config.color}
                  </div>
                </div>
             </div>

             <div className="flex flex-col gap-2">
                <label className="text-xs text-white/40 uppercase tracking-wider font-bold">Density</label>
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => setConfig(prev => ({...prev, count: 4000}))} 
                     className={`px-3 py-1 text-xs rounded-full border transition-all ${config.count === 4000 ? 'bg-white text-black border-white' : 'border-white/20 text-white/50 hover:border-white/50'}`}
                   >Low</button>
                   <button 
                     onClick={() => setConfig(prev => ({...prev, count: 8000}))} 
                     className={`px-3 py-1 text-xs rounded-full border transition-all ${config.count === 8000 ? 'bg-white text-black border-white' : 'border-white/20 text-white/50 hover:border-white/50'}`}
                   >Med</button>
                   <button 
                     onClick={() => setConfig(prev => ({...prev, count: 12000}))} 
                     className={`px-3 py-1 text-xs rounded-full border transition-all ${config.count === 12000 ? 'bg-white text-black border-white' : 'border-white/20 text-white/50 hover:border-white/50'}`}
                   >High</button>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default App;