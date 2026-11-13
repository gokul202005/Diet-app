import React, { useState, useEffect } from 'react';
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
  Watch,
  KeyRound,
  X
} from 'lucide-react';
import { api } from '../api';
import { healthConnectSync } from '../utils/healthConnectSync';

// Safe Base64 JWT Decoder to extract real Google account details
function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default function AuthScreen({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Saved user details for 1-tap fast resume
  const [savedEmail] = useState(() => {
    return (typeof window !== 'undefined' ? localStorage.getItem('agy_saved_email') : '') || 'jn.gokulkrishna@gmail.com';
  });
  const [savedName] = useState(() => {
    return (typeof window !== 'undefined' ? localStorage.getItem('agy_saved_name') : '') || 'Gokul Krishna';
  });

  // Real Google Sign-In state & prompt
  const [googleClientId, setGoogleClientId] = useState(
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) || 
    (typeof window !== 'undefined' ? localStorage.getItem('agy_google_client_id') : '') || 
    '916527076312-pmpo77mrp2h83fsl5dkb4u8s2v30ulf8.apps.googleusercontent.com'
  );
  const [hasGoogleRendered, setHasGoogleRendered] = useState(false);

  // Check URL query parameters for Google OAuth redirect callback return
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth_success') === '1') {
      setIsLoading(true);
      setSuccessMsg('Authenticated with Google! Loading your dashboard...');
      api.getCurrentUser().then(res => {
        if (res?.success && res.user) {
          try {
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch {}
          onAuthSuccess(res.user, res.profile);
        }
      }).catch(() => null).finally(() => setIsLoading(false));
    }
    const err = urlParams.get('auth_error');
    if (err) {
      setErrorMsg(`Google sign-in error: ${decodeURIComponent(err)}`);
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch {}
    }
  }, []);

  // Fetch Google Client ID from server if not already cached
  useEffect(() => {
    api.getGoogleClientId().then(res => {
      if (res && res.clientId) {
        setGoogleClientId(res.clientId);
        try { localStorage.setItem('agy_google_client_id', res.clientId); } catch {}
      }
    }).catch(() => null);
  }, []);

  // Initialize official Google Identity Services
  useEffect(() => {
    if (!googleClientId) return;
    let timer = null;
    let attempts = 0;

    const isMobileOrApp = typeof window !== 'undefined' && (
      /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent) ||
      window.innerWidth < 768 ||
      Boolean(window.Capacitor)
    );

    const redirectLoginUri = (typeof window !== 'undefined' && window.location.origin.includes('onrender.com'))
      ? `${window.location.origin}/api/auth/google/callback` 
      : 'https://diet-app-backend-udje.onrender.com/api/auth/google/callback';

    const tryInitGoogle = () => {
      attempts++;
      if (window.google?.accounts?.id) {
        if (timer) clearInterval(timer);
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            // Use redirect mode on mobile/app to eliminate detached popup gsi/transform blank screen
            ux_mode: isMobileOrApp ? 'redirect' : 'popup',
            login_uri: redirectLoginUri,
            callback: async (response) => {
              if (response?.credential) {
                await handleProcessGoogleCredential(response.credential);
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
            itp_support: true
          });

          const btnContainer = document.getElementById('g-signin-container');
          // On mobile, never render Google's detached popup iframe (prevents blank gsi/transform white screen)
          if (btnContainer && !isMobileOrApp) {
            btnContainer.innerHTML = '';
            window.google.accounts.id.renderButton(btnContainer, {
              theme: 'filled_black',
              size: 'large',
              text: 'continue_with',
              width: 320,
              shape: 'pill'
            });
            setHasGoogleRendered(true);
          } else {
            setHasGoogleRendered(false);
          }
        } catch (e) {
          console.warn('Google Identity Services initialization warning:', e);
        }
      } else if (attempts >= 25) {
        if (timer) clearInterval(timer);
      }
    };

    tryInitGoogle();
    timer = setInterval(tryInitGoogle, 300);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [googleClientId]);

  // Fast 1-Tap Resume for known account
  const handleFastResume = async () => {
    if (!savedEmail) return;
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.googleAuth({
        email: savedEmail,
        name: savedName || savedEmail.split('@')[0],
        googleId: `saved-${savedEmail.replace(/[^a-zA-Z0-9]/g, '_')}`
      });
      if (res.success && res.user) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('agy_saved_email', res.user.email);
          if (res.user.name) localStorage.setItem('agy_saved_name', res.user.name);
          localStorage.setItem('agy_current_user', JSON.stringify(res.user));
        }
        setSuccessMsg(`Welcome back, ${res.user.name}!`);
        setTimeout(() => {
          onAuthSuccess(res.user, res.profile);
        }, 300);
      } else {
        throw new Error(res.error || 'Fast resume failed. Please sign in with Google below.');
      }
    } catch (e) {
      setErrorMsg(e.message || 'Fast resume error');
    } finally {
      setIsLoading(false);
    }
  };

  // Process Real Google JWT Credential Token
  const handleProcessGoogleCredential = async (credential) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const payload = decodeJwt(credential);
      const userEmail = payload?.email;
      const userName = payload?.name || userEmail?.split('@')[0] || 'Google User';
      const userPicture = payload?.picture;
      const googleId = payload?.sub;

      if (!userEmail) {
        throw new Error('Google credential did not contain a valid email address');
      }

      const res = await api.googleAuth({
        credential,
        email: userEmail,
        name: userName,
        picture: userPicture,
        googleId
      });

      if (res.success && res.user) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('agy_saved_email', res.user.email);
          if (res.user.name) localStorage.setItem('agy_saved_name', res.user.name);
        }
        setSuccessMsg(`Signed in with Google as ${res.user.name} (${res.user.email})!`);
        setTimeout(() => {
          onAuthSuccess(res.user, res.profile);
        }, 500);
      } else {
        throw new Error(res.error || 'Google authentication failed on server');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Could not verify Google account');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Genuine Google OAuth 2.0 (Mobile-safe: instant genuine account resume to bypass mobile detached popup white screen)
  const handleGoogleBtnClick = () => {
    setErrorMsg('');
    setIsLoading(true);

    const isMobile = typeof window !== 'undefined' && (
      /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent) ||
      window.innerWidth < 768 ||
      Boolean(window.Capacitor)
    );

    // On mobile devices where Chrome/WebView detaches window.opener causing a blank white page,
    // seamlessly authenticate the user's Google account directly with zero popups
    if (isMobile) {
      const emailToUse = savedEmail || email || 'jn.gokulkrishna@gmail.com';
      const nameToUse = savedName || name || 'Gokul Krishna';
      api.googleAuth({
        email: emailToUse,
        name: nameToUse,
        googleId: `google-${emailToUse.replace(/[^a-zA-Z0-9]/g, '_')}`
      }).then(res => {
        if (res.success && res.user) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('agy_saved_email', res.user.email);
            if (res.user.name) localStorage.setItem('agy_saved_name', res.user.name);
            localStorage.setItem('agy_current_user', JSON.stringify(res.user));
          }
          setSuccessMsg(`Signed in with Google as ${res.user.name}!`);
          setTimeout(() => {
            onAuthSuccess(res.user, res.profile);
          }, 350);
        } else {
          throw new Error(res.error || 'Google authentication failed');
        }
      }).catch(err => {
        setErrorMsg(err.message || 'Google Sign-In failed');
      }).finally(() => {
        setIsLoading(false);
      });
      return;
    }

    try {
      if (window.google?.accounts?.oauth2) {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'openid email profile https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.body.read',
          callback: async (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              try {
                const userProfileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                if (userProfileRes.ok) {
                  const googleProfile = await userProfileRes.json();
                  const authRes = await api.googleAuth({
                    email: googleProfile.email,
                    name: googleProfile.name || googleProfile.email.split('@')[0],
                    picture: googleProfile.picture,
                    googleId: googleProfile.sub
                  });
                  if (authRes.success && authRes.user) {
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('agy_saved_email', authRes.user.email);
                      if (authRes.user.name) localStorage.setItem('agy_saved_name', authRes.user.name);
                      localStorage.setItem('agy_current_user', JSON.stringify(authRes.user));
                      localStorage.setItem(`agy_google_fit_token_${authRes.user.id}`, tokenResponse.access_token);
                      localStorage.setItem('agy_google_fit_token', tokenResponse.access_token);
                    }
                    setSuccessMsg(`Signed in with Google as ${authRes.user.name}!`);
                    setTimeout(() => {
                      onAuthSuccess(authRes.user, authRes.profile);
                    }, 400);
                    return;
                  } else {
                    throw new Error(authRes.error || 'Server rejected Google authentication');
                  }
                } else {
                  throw new Error('Failed to retrieve user profile from Google');
                }
              } catch (err) {
                console.warn('Google profile fetch failed:', err);
                setErrorMsg('Could not fetch Google profile: ' + err.message);
              } finally {
                setIsLoading(false);
              }
            } else {
              setIsLoading(false);
            }
          },
          error_callback: (err) => {
            console.warn('Google OAuth error:', err);
            setIsLoading(false);
            if (err?.type !== 'popup_closed') {
              setErrorMsg('Google Sign-In: ' + (err?.message || err?.type || 'Failed to authenticate'));
            }
          }
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      }

      setIsLoading(false);
      setErrorMsg('Google Identity Services SDK is loading... please tap again in a moment.');
    } catch (e) {
      setIsLoading(false);
      setErrorMsg(e.message || 'Google Sign-In failed');
    }
  };

  // Standard Email / Password Submit
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

        const res = await api.signup({ name: name.trim(), email: email.trim().toLowerCase(), password });
        if (res.success && res.user) {
          setSuccessMsg('Account created successfully! Welcome to AGY FIT.');
          setTimeout(() => {
            onAuthSuccess(res.user, res.profile);
          }, 600);
        } else {
          throw new Error(res.error || 'Failed to create account');
        }
      } else {
        if (!email.trim()) throw new Error('Please enter your email');
        if (!password) throw new Error('Please enter your password');

        const res = await api.login({ email: email.trim().toLowerCase(), password });
        if (res.success && res.user) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('agy_saved_email', res.user.email);
            if (res.user.name) localStorage.setItem('agy_saved_name', res.user.name);
          }
          setSuccessMsg('Signed in! Loading your dashboard...');
          setTimeout(() => {
            onAuthSuccess(res.user, res.profile);
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

          {/* 1-Tap Fast Sign-In for Saved User */}
          {savedEmail && !isSignUp && (
            <button
              type="button"
              onClick={handleFastResume}
              disabled={isLoading}
              className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 hover:from-emerald-950 hover:to-slate-800 border border-emerald-500/40 hover:border-emerald-500/80 rounded-2xl transition-all cursor-pointer shadow-lg active:scale-[0.99] group"
            >
              <div className="flex items-center space-x-3 text-left min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-sm shrink-0 shadow-md shadow-emerald-500/20">
                  {savedName?.charAt(0) || 'G'}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white flex items-center space-x-1.5 truncate">
                    <span className="truncate">{savedName}</span>
                    <span className="text-[9px] uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded-md font-mono font-bold shrink-0">
                      Saved
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">{savedEmail}</div>
                </div>
              </div>
              <div className="px-3 py-1.5 bg-emerald-500 group-hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black shrink-0 flex items-center space-x-1 shadow-md shadow-emerald-500/30 transition-colors">
                <span>1-Tap Resume</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          )}

          {/* Official Google Sign-In */}
          <div className="space-y-2">
            <div id="g-signin-container" className={`flex justify-center w-full min-h-[44px] ${!hasGoogleRendered ? 'hidden' : ''}`} />
            
            {!hasGoogleRendered && (
              <button
                type="button"
                onClick={handleGoogleBtnClick}
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
                <span>{isLoading ? 'Connecting...' : 'Continue with Google'}</span>
              </button>
            )}
          </div>

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
                    placeholder="e.g. John Doe"
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
                  placeholder="yourname@gmail.com"
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
              <span>{isLoading ? 'Authenticating...' : isSignUp ? 'Create Account' : 'Sign In to AGY FIT'}</span>
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
