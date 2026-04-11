import React, { useState, useEffect, useRef } from 'react';
import { Star, Mail, Lock, Check, Eye, EyeOff } from 'lucide-react';
import crackersBgVideo from '../../assets/crackersbgvideo.mp4';

export default function LoginPage({ onValidate, onLoginComplete }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExploding, setIsExploding] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const canvasRef = useRef(null);

  // Realistic Canvas Fireworks Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    let particles = [];
    let animationId;

    const colors = ['#f59e0b', '#ec4899', '#06b6d4', '#a855f7', '#10b981', '#ffffff'];

    // Particle Generator
    const createExplosion = (x, y, isSuper = false) => {
      const count = isSuper ? 400 : Math.floor(Math.random() * 60 + 40);
      const baseColor = colors[Math.floor(Math.random() * colors.length)];
      
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = isSuper ? Math.random() * 18 + 2 : Math.random() * 6 + 1;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: Math.random() > 0.2 ? baseColor : '#ffffff',
          alpha: 1,
          decay: isSuper ? Math.random() * 0.01 + 0.005 : Math.random() * 0.015 + 0.01,
          size: Math.random() * 2.5 + 0.5
        });
      }
    };

    // Auto-fireworks looping in background
    const autoFire = setInterval(() => {
      if (!window.isExplodingGlobal && document.visibilityState === 'visible') {
        createExplosion(Math.random() * w, Math.random() * (h * 0.4) + h * 0.1);
      }
    }, 1200);

    // Render Loop
    const loop = () => {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';

      for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.vy += 0.05;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(loop);
    };

    loop();

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);

    window.triggerSuperBlast = () => {
      window.isExplodingGlobal = true;
      setTimeout(() => createExplosion(w/2, h/2, true), 0);
      setTimeout(() => createExplosion(w/3, h/3, true), 150);
      setTimeout(() => createExplosion(w*0.6, h*0.4, true), 300);
      setTimeout(() => createExplosion(w/2, h/2, true), 450);
      setTimeout(() => createExplosion(w/4, h*0.6, true), 600);
      setTimeout(() => createExplosion(w*0.8, h*0.2, true), 700);
    };

    return () => {
      window.removeEventListener('resize', resize);
      clearInterval(autoFire);
      cancelAnimationFrame(animationId);
      delete window.triggerSuperBlast;
      delete window.isExplodingGlobal;
    };
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    setTimeout(() => {
      // Step 1: Only validate credentials (does NOT change auth state)
      const result = onValidate(email, password);
      if (result && !result.success) {
        setError(result.message);
        setIsLoading(false);
        return;
      }

      // Step 2: Show success toast
      setShowSuccess(true);

      // Step 3: Trigger the massive fireworks blast!
      setTimeout(() => {
        setIsExploding(true);
        if (window.triggerSuperBlast) window.triggerSuperBlast();
      }, 800);
      
      // Step 4: After blast animation completes, THEN actually log in
      setTimeout(() => {
        onLoginComplete();
      }, 2400);
    }, 500); 
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#050505] overflow-hidden font-['DM_Sans',sans-serif] selection:bg-amber-500/30">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');
        * { font-family: 'DM Sans', sans-serif !important; }

        @keyframes screenFlash {
          0% { opacity: 0; }
          60% { opacity: 0; }
          100% { opacity: 1; background-color: #f8fafc; }
        }
        @keyframes cardFadeOut {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0; }
        }
        @keyframes slideInRight {
          0% { transform: translateX(120%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      {/* Background Video — fades out after login */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-700 ${isExploding ? 'opacity-0' : 'opacity-100'}`}
      >
        <source src={crackersBgVideo} type="video/mp4" />
      </video>

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/40 via-black/20 to-black/50 pointer-events-none"></div>

      {/* Canvas Fireworks Engine */}
      <canvas 
        ref={canvasRef} 
        className={`absolute inset-0 z-[2] transition-opacity duration-1000 ${isExploding ? 'opacity-80' : 'opacity-100'}`} 
      />

      {/* Login Card — Glassmorphism / Mirror Style */}
      <div className={`relative z-20 w-full max-w-md mx-4 transition-all duration-500 ${isExploding ? 'animate-[cardFadeOut_0.4s_ease-out_forwards]' : ''}`}>
        <div className="bg-white/[0.08] backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 mb-5 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/20 blur-xl"></div>
              <Star className="w-8 h-8 text-white fill-white relative z-10" />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-wide drop-shadow-lg">TOM CRACKERS</h2>
            <p className="text-slate-300 mt-2 text-sm font-medium">Sign in to your control center</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-rose-500/15 border border-rose-500/30 text-rose-400 text-sm font-medium px-4 py-3 rounded-xl text-center">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold tracking-wider uppercase text-slate-300 ml-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/[0.08] border border-white/20 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/40 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 focus:bg-white/[0.12] transition-all"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold tracking-wider uppercase text-slate-300 ml-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/[0.08] border border-white/20 rounded-xl pl-11 pr-12 py-3.5 text-white placeholder-white/40 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 focus:bg-white/[0.12] transition-all"
                  placeholder="Enter your password"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-amber-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pb-4 pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div className="w-4 h-4 rounded border border-white/30 bg-white/[0.08] flex items-center justify-center group-hover:border-amber-500 transition-colors">
                  <Check className="w-3 h-3 text-amber-400 opacity-100" />
                </div>
                <span className="text-sm font-medium text-slate-200">Remember me</span>
              </label>
              <a href="#" className="text-sm font-medium text-amber-500 hover:text-amber-400 transition-colors">Recovery?</a>
            </div>

            <button 
              type="submit" 
              disabled={isLoading || isExploding}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold py-4 rounded-xl shadow-[0_4px_14px_rgba(245,158,11,0.4)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.5)] transition-all flex items-center justify-center cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                "Login"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Success toast */}
      {showSuccess && (
        <div className="fixed top-6 right-6 z-[90] animate-[slideInRight_0.5s_ease-out_forwards]">
          <div className="bg-emerald-500/90 backdrop-blur-md text-white px-6 py-4 rounded-xl shadow-[0_8px_30px_rgba(16,185,129,0.4)] flex items-center gap-3 border border-emerald-400/30">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm">Successfully Logged In!</p>
              <p className="text-emerald-100 text-xs mt-0.5">Launching your dashboard...</p>
            </div>
          </div>
        </div>
      )}

      {/* Screen flash transition */}
      {isExploding && (
        <div className="fixed inset-0 z-[100] pointer-events-none bg-white animate-[screenFlash_1.6s_ease-in_forwards]"></div>
      )}
    </div>
  );
}
