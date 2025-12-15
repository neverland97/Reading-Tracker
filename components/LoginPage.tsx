
import React, { useState, useEffect } from 'react';
import { signInWithGoogle } from '../services/firebase';
import { IconFeather } from './Icons';


interface LoginPageProps {
    onLoginSuccess: (user: any) => void;
}

const MagicParticles = ({ count = 30 }: { count?: number }) => {
    const [particles, setParticles] = useState<{id: number, left: number, top: number, delay: number, size: number, duration: number}[]>([]);
  
    useEffect(() => {
      const newParticles = Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 5,
        size: Math.random() * 2 + 1, // Smaller, subtle stars
        duration: Math.random() * 8 + 10
      }));
      setParticles(newParticles);
    }, [count]);
  
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {particles.map(p => (
          <div 
            key={p.id}
            className="magic-dust"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animation: `float-drift ${p.duration}s infinite ease-in-out ${p.delay}s`
            }}
          />
        ))}
      </div>
    );
  };

// Geometric L-shaped Metal Book Corner (No Rivets)
const BookCorner = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className={className}>
        {/* Outer Metal Plate (Thick) */}
        <path d="M2,100 L2,2 L100,2" strokeWidth="6" strokeLinecap="square" strokeLinejoin="miter" />
        
        {/* Inner Detail Line (Thin) */}
        <path d="M14,100 L14,14 L100,14" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
);

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        setIsLoading(true);
        try {
            const user = await signInWithGoogle();
            if (user) {
                // Trigger unlock animation
                setIsUnlocking(true);
                // Wait for animation to finish before actually setting user state
                setTimeout(() => {
                    onLoginSuccess(user);
                }, 1500);
            }
        } catch (error) {
            console.error("Login failed", error);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-stone-950 relative overflow-hidden font-body">
            
            {/* Background Atmosphere */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(66,32,6,0.2)_0%,rgba(0,0,0,0.8)_80%)]"></div>
            <MagicParticles count={50} />

            {/* Login Card - Square Grimoire Style */}
            {/* Aspect ratio changed to 9/16 for a taller book look */}
            <div className={`relative bg-stone-900 w-full max-w-[300px] md:max-w-sm aspect-[9/16] flex flex-col items-center justify-center p-8 shadow-2xl animate-blur-in overflow-hidden border border-stone-800 rounded-none
                 ${isUnlocking ? 'animate-fade-out' : ''}
            `}>
                
                {/* --- CORNER DECORATIONS (BookCorner) --- */}
                {/* Inset by top-3 left-3 etc */}
                
                {/* Top-Left */}
                <div className={`absolute top-3 left-3 w-20 h-20 text-[#b4926c] pointer-events-none z-20 
                    ${isUnlocking ? 'animate-unlock-tl' : ''}`}>
                    <BookCorner className="w-full h-full" />
                </div>

                {/* Top-Right (Rotated 90deg) */}
                <div className={`absolute top-3 right-3 w-20 h-20 text-[#b4926c] pointer-events-none z-20 origin-top-right
                    ${isUnlocking ? 'animate-unlock-tr' : ''}`}>
                     <BookCorner className="w-full h-full rotate-90" />
                </div>

                {/* Bottom-Left (Rotated -90deg) */}
                <div className={`absolute bottom-3 left-3 w-20 h-20 text-[#b4926c] pointer-events-none z-20 origin-bottom-left
                    ${isUnlocking ? 'animate-unlock-bl' : ''}`}>
                    <BookCorner className="w-full h-full -rotate-90" />
                </div>

                {/* Bottom-Right (Rotated 180deg) */}
                <div className={`absolute bottom-3 right-3 w-20 h-20 text-[#b4926c] pointer-events-none z-20 origin-bottom-right
                    ${isUnlocking ? 'animate-unlock-br' : ''}`}>
                    <BookCorner className="w-full h-full rotate-180" />
                </div>

                {/* Center Content */}
                <div className="z-10 flex flex-col items-center text-center space-y-8 w-full mt-8">
                    
                    {/* Icon - Feather with Single Decorative Circle */}
                    <div className="relative w-24 h-24 flex items-center justify-center">
                         <div className="absolute inset-0 rounded-full border border-[#b4926c] opacity-60"></div>
                         <IconFeather className="w-12 h-12 text-[#b4926c]" />
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <h1 className="font-cursive text-5xl md:text-6xl text-deep-gold">
                            Reading<br/>Tracker
                        </h1>
                        <p className="text-[#b4926c] text-sm uppercase tracking-[0.2em] opacity-70 mt-4 font-body">
                            "開啟您的閱讀魔法卷軸"
                        </p>
                    </div>

                    {/* Login Button */}
                    {/* Removed animate-float */}
                    <button 
                        onClick={handleLogin}
                        disabled={isLoading}
                        className="group relative px-8 py-3 bg-stone-900 border border-[#b4926c]/50 hover:border-[#b4926c] text-[#b4926c] font-display font-bold text-lg tracking-wider transition-all duration-500 overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center gap-3 group-hover:text-[#ffd700] transition-colors">
                           {/* Google G Logo (Simplified for style) */}
                           <span className="font-sans font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-red-400 to-yellow-400">G</span>
                           Google 登入
                        </span>
                        
                        {/* Hover Fill Effect */}
                        <div className="absolute inset-0 bg-[#b4926c]/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
                    </button>
                </div>

                {/* Bottom Watermark */}
                <div className="absolute bottom-6 text-[10px] text-[#b4926c] opacity-30 tracking-[0.3em] font-sans">
                    EST. MMXXIV
                </div>

            </div>
        </div>
    );
};
