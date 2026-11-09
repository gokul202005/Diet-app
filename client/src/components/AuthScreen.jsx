import React, { useState } from 'react';
import { 
  Flame, 
  Sparkles, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  LogIn,
  UserPlus,
  Utensils,
  Dumbbell,
  Watch
} from 'lucide-react';
import { api } from '../api';

export default function AuthScreen({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) throw new Error('Please enter your full name');
        if (!email.trim() || !email.includes('@')) throw new Error('Please enter a valid email address');
        if (!password || password.length < 6) throw new Error('Password must be at least 6 characters');

        const res = await api.signup({ name: name.trim(), email: email.trim(), password });
        if (res.success && res.user) {
          setSuccessMsg('Account created successfully! Welcome to AGY FIT.');
          setTimeout(() => {
            onAuthSuccess(res.user);
          }, 600);
        } else {
          throw new Error(res.error || 'Failed to create account');
        }
      } else {
        if (!email.trim()) throw new Error('Please enter your email');
        if (!password) throw new Error('Please enter your password');

        const res = await api.login({ email: email.trim(), password });
        if (res.success && res.user) {
          setSuccessMsg('Signed in! Loading your dashboard...');
          setTimeout(() => {
            onAuthSuccess(res.user);
          }, 500);
        } else {
          throw new Error(res.error || 'Invalid email or password');
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      const demoEmail = email.trim() || 'gokul@gmail.com';
      const demoName = name.trim() || 'Gokul';

      const res = await api.googleAuth({
        email: demoEmail,
        name: demoName,
        googleId: `google-user-${Date.now()}`
      });

      if (res.success && res.user) {
        setSuccessMsg(`Welcome, ${res.user.name}!`);
        setTimeout(() => {
          onAuthSuccess(res.user);
        }, 500);
      } else {
        throw new Error(res.error || 'Google Sign-in failed');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Could not connect with Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8 selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Background glow effects */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md space-y-6">
        
        {/* App Logo & Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 mx-auto flex items-center justify-center text-slate-950 shadow-xl shadow-emerald-500/20">
            <Flame className="w-8 h-8 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center justify-center space-x-2">
              <h1 className="text-2xl font-black tracking-tight text-white">AGY FIT</h1>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                AI • CLOUD
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              South Indian Diet Engine, Fastrack Watch Sync & Biomechanics
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
          
          {/* Sign In / Sign Up Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 border border-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                !isSignUp 
                  ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                isSignUp 
                  ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Google 1-Tap Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-3 py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl font-bold text-xs shadow-md transition-all active:scale-[0.99] cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center space-x-3 my-2">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Or with email</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Feedback banners */}
          {errorMsg && (
            <div className="flex items-center space-x-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-center space-x-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isSignUp && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Your Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Gokul"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>{isLoading ? 'Authenticating...' : isSignUp ? 'Create Fresh Account' : 'Sign In to AGY FIT'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Privacy Note */}
          <div className="flex items-center justify-center space-x-1.5 text-[10px] text-slate-500 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted cloud profile & private progress vault</span>
          </div>

        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-3 gap-2 text-center pt-2">
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-1">
            <Utensils className="w-4 h-4 text-emerald-400 mx-auto" />
            <div className="text-[10px] font-bold text-slate-300">South Indian Diet</div>
          </div>
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-1">
            <Watch className="w-4 h-4 text-cyan-400 mx-auto" />
            <div className="text-[10px] font-bold text-slate-300">Fastrack Sync</div>
          </div>
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-1">
            <Dumbbell className="w-4 h-4 text-amber-400 mx-auto" />
            <div className="text-[10px] font-bold text-slate-300">Gym PR Tracker</div>
          </div>
        </div>

      </div>
    </div>
  );
}
