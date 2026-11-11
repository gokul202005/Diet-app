import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  X, 
  ChevronDown, 
  ChevronUp, 
  MessageSquare,
  Zap,
  Activity
} from 'lucide-react';
import { api } from '../api';

export default function GlobalJarvis({ profile, selectedDate, onActionCompleted, onOpenCoach }) {
  const [isActive, setIsActive] = useState(() => {
    try {
      return localStorage.getItem('agy_jarvis_voice_mode') === 'true';
    } catch {
      return false;
    }
  });

  const [jarvisState, setJarvisState] = useState('idle'); // 'idle' | 'listening' | 'thinking' | 'speaking'
  const [liveTranscript, setLiveTranscript] = useState('');
  const [lastJarvisReply, setLastJarvisReply] = useState('');
  const [audioVolume, setAudioVolume] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [voicePersona, setVoicePersona] = useState(() => {
    try {
      return localStorage.getItem('agy_jarvis_voice_persona') || 'jarvis';
    } catch {
      return 'jarvis';
    }
  });

  const isActiveRef = useRef(isActive);
  const isListeningRef = useRef(false);
  const recognitionRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const capturedTextRef = useRef('');

  useEffect(() => {
    isActiveRef.current = isActive;
    try {
      localStorage.setItem('agy_jarvis_voice_mode', String(isActive));
    } catch {}

    // Dispatch global event so CoachChat stays in sync
    window.dispatchEvent(new CustomEvent('agy-jarvis-state-sync', { detail: { isActive } }));

    if (isActive) {
      // Greet user on first activation if not speaking
      if (typeof window !== 'undefined' && window.speechSynthesis && !window.speechSynthesis.speaking) {
        speakResponse("Jarvis online. All systems calibrated, Gokul. I am listening continuously across all tabs.");
      } else {
        startListening();
      }
    } else {
      stopSpeaking();
      stopListening();
    }
  }, [isActive]);

  // Listen for sync events from CoachChat toggle
  useEffect(() => {
    const handleSync = (e) => {
      if (e?.detail?.isActive !== undefined && e.detail.isActive !== isActiveRef.current) {
        setIsActive(e.detail.isActive);
      }
      if (e?.detail?.persona) {
        setVoicePersona(e.detail.persona);
      }
    };
    window.addEventListener('agy-jarvis-external-toggle', handleSync);
    return () => window.removeEventListener('agy-jarvis-external-toggle', handleSync);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupHardwareAudio();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const cleanupHardwareAudio = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch {}
      audioCtxRef.current = null;
    }
    if (mediaStreamRef.current) {
      try { mediaStreamRef.current.getTracks().forEach(t => t.stop()); } catch {}
      mediaStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
    setAudioVolume(0);
  };

  // Setup live audio visualizer for user headset
  const setupVisualizer = (stream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      src.connect(analyser);
      analyserRef.current = analyser;

      const dataArr = new Uint8Array(analyser.frequencyBinCount);
      const updateMeter = () => {
        if (!isListeningRef.current) {
          setAudioVolume(0);
          return;
        }
        analyser.getByteFrequencyData(dataArr);
        let sum = 0;
        for (let i = 0; i < dataArr.length; i++) sum += dataArr[i];
        const avg = sum / dataArr.length;
        setAudioVolume(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateMeter);
      };
      animFrameRef.current = requestAnimationFrame(updateMeter);
    } catch {}
  };

  // Jarvis Voice synthesis (Paul Bettany British accent)
  const getJarvisVoice = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    if (voices.length === 0) return null;

    // Prioritize British male voices (George, Ryan, Oliver, Google UK English Male)
    const britishMale = voices.find(v => 
      (v.name.includes('Ryan') || v.name.includes('George') || v.name.includes('Oliver') || v.name.toLowerCase().includes('google uk english male')) && 
      !v.name.includes('Female')
    ) || voices.find(v => (v.lang === 'en-GB' || v.lang.startsWith('en-GB')) && !v.name.includes('Female'))
      || voices.find(v => (v.name.includes('Guy') || v.name.includes('David') || v.name.includes('Christopher')) && !v.name.includes('Female'))
      || voices.find(v => v.lang.startsWith('en') && !v.name.includes('Heera'));
    return britishMale || voices[0];
  };

  const speakResponse = (text) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const clean = text
      .replace(/[*#`_~>]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/•/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!clean) {
      if (isActiveRef.current) startListening();
      return;
    }

    setLastJarvisReply(clean);
    setJarvisState('speaking');

    const utt = new SpeechSynthesisUtterance(clean);
    const voice = getJarvisVoice();
    if (voice) {
      utt.voice = voice;
      utt.lang = voice.lang;
    }
    utt.pitch = 0.92;
    utt.rate = 1.02;

    utt.onend = () => {
      setJarvisState('idle');
      // Continuous Jarvis loop: Automatically listen again after speaking!
      if (isActiveRef.current) {
        setTimeout(() => {
          if (isActiveRef.current) startListening();
        }, 350);
      }
    };

    utt.onerror = () => {
      setJarvisState('idle');
      if (isActiveRef.current) {
        setTimeout(() => {
          if (isActiveRef.current) startListening();
        }, 400);
      }
    };

    window.speechSynthesis.speak(utt);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setJarvisState('idle');
  };

  // Start dual-engine listening (Headset hardware stream + Web Speech API)
  const startListening = async () => {
    if (isListeningRef.current) return;
    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    audioChunksRef.current = [];
    capturedTextRef.current = '';
    setLiveTranscript('');
    setJarvisState('listening');

    // 1. Hardware Microphone stream (guarantees PC headset input)
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        mediaStreamRef.current = stream;
        setupVisualizer(stream);

        let mimeType = 'audio/webm';
        if (typeof MediaRecorder !== 'undefined') {
          if (!MediaRecorder.isTypeSupported('audio/webm')) {
            if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
            else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
            else mimeType = '';
          }
        }
        const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        recorder.start(100);
      }
    } catch (e) {
      console.warn('[GlobalJarvis] getUserMedia warning:', e.message);
    }

    isListeningRef.current = true;

    // 2. Concurrently attach Web Speech Recognition
    const SpeechRec = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    if (SpeechRec) {
      try {
        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch {}
        }
        const rec = new SpeechRec();
        rec.lang = 'en-US';
        rec.continuous = true;
        rec.interimResults = true;

        rec.onresult = (event) => {
          let text = '';
          for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0].transcript;
          }
          capturedTextRef.current = text;
          setLiveTranscript(text);

          // 1.8s silence pause detector: automatically process user speech
          if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = setTimeout(() => {
            finishListeningAndProcess();
          }, 1800);
        };

        rec.onerror = (e) => {
          console.warn('[GlobalJarvis] Speech rec error:', e.error);
        };

        rec.onend = () => {
          if (isListeningRef.current && capturedTextRef.current.trim().length > 1) {
            finishListeningAndProcess();
          } else if (isListeningRef.current) {
            try { rec.start(); } catch {}
          }
        };

        recognitionRef.current = rec;
        try { rec.start(); } catch {}
      } catch (err) {
        console.warn('[GlobalJarvis] SpeechRec setup err:', err);
      }
    }
  };

  const stopListening = () => {
    isListeningRef.current = false;
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    cleanupHardwareAudio();
    if (jarvisState === 'listening') setJarvisState('idle');
  };

  // Process what the user spoke and get Jarvis's verbal reply
  const finishListeningAndProcess = async () => {
    if (!isListeningRef.current) return;
    stopListening();

    const spokenQuery = capturedTextRef.current.trim() || liveTranscript.trim();

    // If Web Speech API captured text:
    if (spokenQuery.length > 1) {
      await executeQuery(spokenQuery);
      return;
    }

    // Direct Audio Fallback: Process the background MediaRecorder audio blob through Gemini
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      const recorder = mediaRecorderRef.current;
      recorder.onstop = async () => {
        const mime = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mime });
        cleanupHardwareAudio();

        if (audioBlob.size > 2000) {
          try {
            setJarvisState('thinking');
            const res = await api.universalVoiceAudio(audioBlob, selectedDate);
            if (res.success && res.transcribedText) {
              await executeQuery(res.transcribedText);
            } else {
              speakResponse("I couldn't hear clearly, Gokul. Could you please repeat that?");
            }
          } catch {
            speakResponse("Pardon me, I had trouble processing that audio. Please speak again.");
          }
        } else {
          setJarvisState('idle');
          if (isActiveRef.current) startListening();
        }
      };

      try { recorder.stop(); } catch { cleanupHardwareAudio(); }
      return;
    }

    setJarvisState('idle');
    if (isActiveRef.current) startListening();
  };

  const executeQuery = async (query) => {
    setJarvisState('thinking');
    setLiveTranscript(query);

    try {
      // 1. Send query to AI Coach
      const res = await api.sendCoachMessage(query);
      if (res.success && res.message) {
        // Also inform any mounted CoachChat to reload history
        window.dispatchEvent(new CustomEvent('agy-coach-chat-updated'));
        if (onActionCompleted) onActionCompleted();
        speakResponse(res.message.text);
      } else {
        speakResponse("I have processed your request, sir. All parameters are updated.");
      }
    } catch (err) {
      speakResponse("Apologies, I encountered an issue connecting to the central mainframe: " + err.message);
    }
  };

  const handleToggleJarvis = () => {
    const next = !isActive;
    setIsActive(next);
  };

  // If user has not activated Jarvis, show a subtle floating activation beacon
  if (!isActive) {
    return (
      <div className="fixed bottom-20 right-4 z-40 hidden sm:block">
        <button
          onClick={handleToggleJarvis}
          className="group relative flex items-center space-x-2 px-3.5 py-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-cyan-500/30 hover:border-cyan-400 rounded-full shadow-lg shadow-cyan-950/40 backdrop-blur-md transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer"
          title="Activate Persistent Jarvis Voice Assistant"
        >
          <div className="relative">
            <Radio className="w-4 h-4 text-cyan-400 group-hover:animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 opacity-75 animate-ping" />
          </div>
          <span className="text-xs font-black tracking-wider uppercase text-cyan-300">Jarvis Voice</span>
        </button>
      </div>
    );
  }

  // Active Holographic Jarvis HUD (Floats across ALL tabs)
  return (
    <div className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-50 transition-all duration-300 max-w-sm w-[92vw] sm:w-96">
      <div className="relative bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-indigo-950/90 border border-cyan-500/50 rounded-2xl shadow-2xl shadow-cyan-950/60 backdrop-blur-xl p-3.5 text-white overflow-hidden">
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />

        {/* Main Status Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            {/* Pulsing Arc Reactor Orb */}
            <div className="relative flex items-center justify-center">
              <div 
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                  jarvisState === 'listening'
                    ? 'bg-cyan-500/20 text-cyan-300 ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/50'
                    : jarvisState === 'speaking'
                      ? 'bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/50'
                      : jarvisState === 'thinking'
                        ? 'bg-purple-500/20 text-purple-300 ring-2 ring-purple-400 shadow-lg shadow-purple-500/50'
                        : 'bg-slate-800 text-slate-400 ring-1 ring-slate-700'
                }`}
                style={{
                  transform: jarvisState === 'listening' ? `scale(${1 + audioVolume * 0.003})` : 'scale(1)'
                }}
              >
                {jarvisState === 'speaking' ? (
                  <Volume2 className="w-5 h-5 animate-pulse" />
                ) : jarvisState === 'thinking' ? (
                  <Sparkles className="w-5 h-5 animate-spin" />
                ) : (
                  <Radio className={`w-5 h-5 ${jarvisState === 'listening' ? 'animate-pulse text-cyan-400' : ''}`} />
                )}
              </div>
              {jarvisState === 'listening' && (
                <span className="absolute -inset-1 rounded-full bg-cyan-400 opacity-25 animate-ping pointer-events-none" />
              )}
            </div>

            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-black tracking-wider text-cyan-300 uppercase">JARVIS AI</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30 font-bold uppercase">
                  Continuous Loop
                </span>
              </div>
              <div className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1">
                {jarvisState === 'listening' && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-cyan-300">Listening to headset...</span>
                  </>
                )}
                {jarvisState === 'speaking' && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-300">Jarvis is Speaking...</span>
                  </>
                )}
                {jarvisState === 'thinking' && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                    <span className="text-purple-300">Analyzing biological telemetry...</span>
                  </>
                )}
                {jarvisState === 'idle' && (
                  <span className="text-slate-400">Standby (Listening active)</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center space-x-1">
            {jarvisState === 'speaking' && (
              <button
                onClick={stopSpeaking}
                className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs transition-colors cursor-pointer"
                title="Mute Voice"
              >
                <VolumeX className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => {
                if (jarvisState === 'listening') {
                  finishListeningAndProcess();
                } else {
                  startListening();
                }
              }}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                jarvisState === 'listening'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
              }`}
              title={jarvisState === 'listening' ? 'Send Query Now' : 'Tap to Speak'}
            >
              <Mic className="w-4 h-4" />
            </button>

            {onOpenCoach && (
              <button
                onClick={onOpenCoach}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700 text-xs transition-colors cursor-pointer"
                title="Open AI Coach Chat Tab"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setIsExpanded(prev => !prev)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>

            <button
              onClick={handleToggleJarvis}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-slate-700 text-xs transition-colors cursor-pointer"
              title="Deactivate Jarvis"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Audio Visualizer Bars (Pulses with Headset Volume) */}
        {jarvisState === 'listening' && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] text-cyan-400 font-mono tracking-wider">MIC INPUT ACTIVE</span>
            <div className="flex items-center space-x-1">
              {[0.4, 0.8, 1.2, 0.7, 1.0, 0.5, 0.9, 0.3].map((factor, idx) => {
                const height = Math.max(3, Math.min(18, Math.round((audioVolume * factor * 0.4))));
                return (
                  <div
                    key={idx}
                    className="w-1 bg-cyan-400 rounded-full transition-all duration-75"
                    style={{ height: `${height}px` }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Live Spoken Query or Answer Preview */}
        {(liveTranscript || lastJarvisReply || isExpanded) && (
          <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1.5">
            {liveTranscript && (
              <div className="text-xs text-slate-300 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-cyan-400 block mb-0.5 uppercase tracking-wider">You:</span>
                <p className="line-clamp-2">{liveTranscript}</p>
              </div>
            )}
            {lastJarvisReply && !liveTranscript && (
              <div className="text-xs text-slate-300 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-emerald-400 block mb-0.5 uppercase tracking-wider">Jarvis:</span>
                <p className={isExpanded ? '' : 'line-clamp-3'}>{lastJarvisReply}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
