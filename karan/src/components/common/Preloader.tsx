import { useEffect, useState } from 'react';

export default function Preloader() {
  const [exit, setExit] = useState(false);

  useEffect(() => {
    // Start exit animation after 2.2 seconds
    const timer = setTimeout(() => setExit(true), 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`fixed inset-0 z-[999] flex items-center justify-center bg-[#050B14] transition-all duration-1000 ease-in-out ${exit ? 'opacity-0 pointer-events-none scale-110' : 'opacity-100'}`}>
      {/* Dynamic Background Pulse */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse [animation-delay:1s]"></div>
      </div>

      <div className="relative flex flex-col items-center">
        {/* Animated Logo Container */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600 to-emerald-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000 animate-spin-slow"></div>
          <div className="relative h-32 w-32 md:h-40 md:w-40 p-1 rounded-full bg-gradient-to-tr from-white/20 to-transparent backdrop-blur-sm shadow-2xl animate-fade-rise">
            <img 
              src="/logo.png" 
              alt="Campus Nexus" 
              className="h-full w-full object-contain p-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-float"
            />
          </div>
        </div>

        {/* Branding text with reveal animation */}
        <div className="mt-8 overflow-hidden text-center">
          <h1 
            className="text-4xl md:text-5xl font-medium tracking-tight text-white animate-text-reveal"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Campus Nexus<span className="text-blue-400">.</span>
          </h1>
          <p className="mt-2 text-sm uppercase tracking-[0.3em] text-blue-400/60 font-light translate-y-10 animate-fade-in [animation-delay:0.8s]">
            The Student Marketplace
          </p>
        </div>

        {/* Minimal loading bar */}
        <div className="mt-12 w-48 h-[1px] bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 w-0 animate-progress"></div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes text-reveal {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fade-in {
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes progress {
          to { width: 100%; }
        }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-text-reveal { animation: text-reveal 1.2s cubic-bezier(0.77, 0, 0.175, 1) forwards; }
        .animate-fade-in { animation: fade-in 1s cubic-bezier(0.77, 0, 0.175, 1) forwards; }
        .animate-progress { animation: progress 2.5s ease-in-out forwards; }
      `}} />
    </div>
  );
}
