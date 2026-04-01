import { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

export default function AuthModal() {
  const { closeAuthModal, setUser } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.endsWith('@jaincollege.ac.in')) {
      toast.error('You must use an @jaincollege.ac.in email.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Immediately update the store so all components see the user
        if (data?.user) setUser(data.user as any);
        toast.success('Logged in successfully! 👋');
        closeAuthModal();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name || email.split('@')[0] } }
        });
        if (error) throw error;
        // Immediately update the store so all components see the user
        if (data?.user) setUser(data.user as any);
        toast.success('Account created! Welcome to Campus Nexus 🎉');
        closeAuthModal();
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={closeAuthModal} />
      
      <div className="liquid-glass relative z-10 w-full max-w-md rounded-2xl p-8 animate-fade-rise">
        <button 
          onClick={closeAuthModal}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-6 text-3xl text-foreground text-center" style={{ fontFamily: "'Instrument Serif', serif" }}>
          {isLogin ? 'Welcome Back' : 'Join Nexus'}
        </h2>

        {/* Domain badge */}
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0"></span>
          Campus-only access · @jaincollege.ac.in emails only
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">College Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="id@jaincollege.ac.in"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-foreground focus:border-foreground/40 focus:outline-none focus:ring-1 focus:ring-foreground/40"
            />
          </div>
          {!isLogin && (
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Your Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rohan Mehta"
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-foreground focus:border-foreground/40 focus:outline-none focus:ring-1 focus:ring-foreground/40"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-foreground focus:border-foreground/40 focus:outline-none focus:ring-1 focus:ring-foreground/40"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full rounded-lg bg-foreground/10 py-3 text-sm font-medium text-foreground transition-colors hover:bg-foreground/20 mt-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-foreground hover:underline cursor-pointer"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}
