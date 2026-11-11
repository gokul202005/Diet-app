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
  Settings2,
  Check,
  Play,
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

  // 'idle' | 'listening' | 'thinking' | 'speaking'
  const [jarvisState, setJarvisState] = useState('idle');
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('agy_jarvis_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [showSettings, setShowSettings] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [lastJarvisReply, setLastJarvisReply] = useState('');
  const [audioVolume, setAudioVolume] = useState(0);

  // Audio Devices & Voices
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(() => {
    try {
      return localStorage.getItem('agy_selected_audio_device') || '';
    } catch {
      return '';
    }
  });
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState(() => {
    try {
      return localStorage.getItem('agy_selected_voice_name') || '';
    } catch {
      return '';
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

  // 1. Enumerate all audio input devices (PC mic vs Headset vs USB)
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        if (!navigator.mediaDevices?.enumerateDevices) return;
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(d => d.kind === 'audioinput');
        setAudioDevices(audioInputs);

        // If no device currently saved, pick headset or first available
        if (!selectedDeviceId && audioInputs.length > 0) {
          const preferred = audioInputs.find(d => 
            /headset|bluetooth|usb|mic|array/i.test(d.label)
          ) || audioInputs[0];
          setSelectedDeviceId(preferred.deviceId);
          try { localStorage.setItem('agy_selected_audio_device', preferred.deviceId); } catch {}
        }
      } catch (e) {
        console.warn('[GlobalJarvis] Device enum warning:', e);
      }
    };

    fetchDevices();
    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', fetchDevices);
      return () => navigator.mediaDevices.removeEventListener('devicechange', fetchDevices);
    }
  }, [selectedDeviceId]);

  // 2. Fetch and list ALL system voices
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices() || [];
        setAvailableVoices(voices);

        if (!selectedVoiceName && voices.length > 0) {
          // Prioritize British male voice (Jarvis style)
          const british = voices.find(v => 
            /ryan|george|oliver|google uk english male|david/i.test(v.name) && !/female/i.test(v.name)
          ) || voices.find(v => v.lang.startsWith('en-GB') && !/female/i.test(v.name))
            || voices.find(v => v.lang.startsWith('en'));
          if (british) {
            setSelectedVoiceName(british.name);
            try { localStorage.setItem('agy_selected_voice_name', british.name); } catch {}
          }
        }
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
      return () => { window.speechSynthesis.onvoiceschanged = null; };
    }
  }, [selectedVoiceName]);

  // Sync state across tabs
  useEffect(() => {
    isActiveRef.current = isActive;
    try {
      localStorage.setItem('agy_jarvis_voice_mode', String(isActive));
    } catch {}
    window.dispatchEvent(new CustomEvent('agy-jarvis-state-sync', { detail: { isActive } }));

    if (!isActive) {
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

  // Setup Web Audio Analyser with explicit AudioContext resume
  const setupVisualizer = async (stream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      // Chrome requires explicit resume if context started in suspended state
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }

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
    } catch (e) {
      console.warn('[GlobalJarvis] Visualizer notice:', e);
    }
  };

  // Get currently selected voice object
  const getCurrentVoice = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    if (voices.length === 0) return null;
    if (selectedVoiceName) {
      const match = voices.find(v => v.name === selectedVoiceName);
      if (match) return match;
    }
    return voices[0];
  };

  // Speak response aloud
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
      setJarvisState('idle');
      return;
    }

    setLastJarvisReply(clean);
    setJarvisState('speaking');

    const utt = new SpeechSynthesisUtterance(clean);
    const voice = getCurrentVoice();
    if (voice) {
      utt.voice = voice;
      utt.lang = voice.lang;
    }
    utt.pitch = 0.94;
    utt.rate = 1.02;

    utt.onend = () => {
      setJarvisState('idle');
    };

    utt.onerror = () => {
      setJarvisState('idle');
    };

    window.speechSynthesis.speak(utt);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setJarvisState('idle');
  };

  const testVoiceSample = (v) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(`Hello Gokul, I am ${v.name.split(' ')[0]}. All systems ready.`);
    utt.voice = v;
    utt.lang = v.lang;
    utt.pitch = 0.94;
    utt.rate = 1.02;
    window.speechSynthesis.speak(utt);
  };

  // Start Voice Listening Session (Headset / PC mic + Web Speech + Audio Fallback)
  const startListening = async () => {
    if (isListeningRef.current) return;
    stopSpeaking();

    audioChunksRef.current = [];
    capturedTextRef.current = '';
    setLiveTranscript('');
    setJarvisState('listening');

    // 1. Hardware Microphone stream from chosen device (or default PC mic)
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const audioConstraints = selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId } }
          : true;

        const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
        mediaStreamRef.current = stream;
        await setupVisualizer(stream);

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

    // 2. Concurrently run Web Speech Recognition
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

          // 2s pause detector: auto-submit when user stops talking
          if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = setTimeout(() => {
            finishListeningAndProcess();
          }, 2000);
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

  const finishListeningAndProcess = async () => {
    if (!isListeningRef.current) return;
    stopListening();

    const spokenQuery = capturedTextRef.current.trim() || liveTranscript.trim();

    // 1. Direct Web Speech transcription
    if (spokenQuery.length > 1) {
      await executeQuery(spokenQuery);
      return;
    }

    // 2. Direct Hardware Audio Upload fallback (Zero-fail transcription via Gemini)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      const recorder = mediaRecorderRef.current;
      recorder.onstop = async () => {
        const mime = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mime });
        cleanupHardwareAudio();

        if (audioBlob.size > 400) {
          try {
            setJarvisState('thinking');
            const res = await api.universalVoiceAudio(audioBlob, selectedDate);
            if (res.success && res.transcribedText) {
              await executeQuery(res.transcribedText);
            } else {
              speakResponse("I couldn't hear words clearly, Gokul. Could you please tap the mic and repeat?");
            }
          } catch {
            speakResponse("Pardon me, I had trouble processing that audio. Please speak again.");
          }
        } else {
          setJarvisState('idle');
        }
      };

      try { recorder.stop(); } catch { cleanupHardwareAudio(); }
      return;
    }

    setJarvisState('idle');
  };

  const executeQuery = async (query) => {
    setJarvisState('thinking');
    setLiveTranscript(query);

    try {
      const res = await api.sendCoachMessage(query);
      if (res.success && res.message) {
        window.dispatchEvent(new CustomEvent('agy-coach-chat-updated'));
        if (onActionCompleted) onActionCompleted();
        speakResponse(res.message.text);
      } else {
        speakResponse("I have processed your query, sir. All parameters are updated.");
      }
    } catch (err) {
      speakResponse("Apologies, I encountered an issue connecting to the central mainframe: " + err.message);
    }
  };

  const handleToggleActive = () => {
    setIsActive(prev => !prev);
  };

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('agy_jarvis_collapsed', String(next)); } catch {}
      return next;
    });
  };

  // If user has not activated Jarvis, show a subtle floating activation beacon
  if (!isActive) {
    return (
      <div className="fixed bottom-20 right-4 z-40 hidden sm:block">
        <button
          onClick={handleToggleActive}
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

  // COLLAPSED COMPACT PILL MODE (Zero clutter, perfectly minimal)
  if (isCollapsed) {
    return (
      <div className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-50">
        <div className="flex items-center space-x-2 px-3.5 py-2 bg-slate-950/95 border border-cyan-500/40 rounded-full shadow-2xl shadow-cyan-950/60 backdrop-blur-xl">
          <div 
            onClick={() => {
              if (jarvisState === 'listening') finishListeningAndProcess();
              else startListening();
            }}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <span className={`w-2.5 h-2.5 rounded-full ${jarvisState === 'listening' ? 'bg-cyan-400 animate-ping' : jarvisState === 'speaking' ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-500'}`} />
            <span className="text-xs font-black tracking-wider text-cyan-300">JARVIS</span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Quick Mic Action */}
          <button
            onClick={() => {
              if (jarvisState === 'listening') finishListeningAndProcess();
              else startListening();
            }}
            className={`p-1.5 rounded-full transition-all cursor-pointer ${
              jarvisState === 'listening'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/50'
                : 'bg-slate-800 hover:bg-slate-700 text-cyan-300'
            }`}
            title={jarvisState === 'listening' ? 'Send Query' : 'Speak to Jarvis'}
          >
            <Mic className="w-3.5 h-3.5" />
          </button>

          {/* Expand Button */}
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Expand Jarvis HUD"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>

          {/* Close / Deactivate */}
          <button
            onClick={handleToggleActive}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-300 transition-all cursor-pointer"
            title="Deactivate Jarvis"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // EXPANDED SPACIOUS HUD (Clean layout, generous padding, zero stuffing)
  return (
    <div className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-50 transition-all duration-300 max-w-sm w-[92vw] sm:w-[420px]">
      <div className="relative bg-gradient-to-br from-slate-950/98 via-slate-900/98 to-indigo-950/95 border border-cyan-500/40 rounded-3xl shadow-2xl shadow-cyan-950/70 backdrop-blur-2xl p-4 sm:p-5 text-white overflow-hidden space-y-3.5">
        
        {/* Top Glow Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Row 1: Header & Main Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Arc Reactor Orb */}
            <div 
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                jarvisState === 'listening'
                  ? 'bg-cyan-500/20 text-cyan-300 ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/50 scale-105'
                  : jarvisState === 'speaking'
                    ? 'bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/50'
                    : jarvisState === 'thinking'
                      ? 'bg-purple-500/20 text-purple-300 ring-2 ring-purple-400 shadow-lg shadow-purple-500/50'
                      : 'bg-slate-800/80 text-cyan-400 ring-1 ring-slate-700'
              }`}
            >
              {jarvisState === 'speaking' ? (
                <Volume2 className="w-5 h-5 animate-pulse" />
              ) : jarvisState === 'thinking' ? (
                <Sparkles className="w-5 h-5 animate-spin" />
              ) : (
                <Radio className={`w-5 h-5 ${jarvisState === 'listening' ? 'animate-pulse text-cyan-400' : ''}`} />
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-black tracking-wider text-cyan-300">JARVIS AI</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold uppercase">
                  Online
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center space-x-1.5 mt-0.5">
                {jarvisState === 'listening' && (
                  <span className="text-cyan-400 font-semibold animate-pulse">● Listening to mic...</span>
                )}
                {jarvisState === 'speaking' && (
                  <span className="text-emerald-400 font-semibold">● Jarvis is speaking...</span>
                )}
                {jarvisState === 'thinking' && (
                  <span className="text-purple-400 font-semibold">● Processing request...</span>
                )}
                {jarvisState === 'idle' && (
                  <span>Ready • Tap mic to speak</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center space-x-1.5">
            {jarvisState === 'speaking' && (
              <button
                onClick={stopSpeaking}
                className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs transition-colors cursor-pointer"
                title="Mute Voice"
              >
                <VolumeX className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                showSettings 
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400' 
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border-slate-700'
              }`}
              title="Voice & Microphone Settings"
            >
              <Settings2 className="w-4 h-4" />
            </button>

            {onOpenCoach && (
              <button
                onClick={onOpenCoach}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-cyan-300 border border-slate-700 text-xs transition-colors cursor-pointer"
                title="Open Full AI Coach Chat"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={toggleCollapse}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 text-xs transition-colors cursor-pointer"
              title="Collapse into Pill"
            >
              <ChevronDown className="w-4 h-4" />
            </button>

            <button
              onClick={handleToggleActive}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-slate-700 text-xs transition-colors cursor-pointer"
              title="Deactivate Jarvis"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SETTINGS PANEL: Voice & Input Microphone Pickers */}
        {showSettings && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-3">
            {/* Input Device Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>🎙️ Microphone Device</span>
                <span className="text-cyan-400">{audioDevices.length} Detected</span>
              </label>
              <select
                value={selectedDeviceId}
                onChange={(e) => {
                  setSelectedDeviceId(e.target.value);
                  try { localStorage.setItem('agy_selected_audio_device', e.target.value); } catch {}
                  if (isListeningRef.current) {
                    stopListening();
                    setTimeout(() => startListening(), 200);
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {audioDevices.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Microphone (${d.deviceId.slice(0, 8)})`}
                  </option>
                ))}
                {audioDevices.length === 0 && (
                  <option value="">Default System Microphone</option>
                )}
              </select>
            </div>

            {/* Voice Persona Selector (All Installed Voices) */}
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>🔊 AI Spoken Voice</span>
                <span className="text-cyan-400">{availableVoices.length} Available</span>
              </label>
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {availableVoices.map(v => (
                  <div
                    key={v.name}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                      selectedVoiceName === v.name
                        ? 'bg-cyan-950/60 text-cyan-200 border border-cyan-700/60'
                        : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <button
                      onClick={() => {
                        setSelectedVoiceName(v.name);
                        try { localStorage.setItem('agy_selected_voice_name', v.name); } catch {}
                      }}
                      className="flex-1 text-left truncate mr-2 font-medium cursor-pointer"
                    >
                      {v.name} ({v.lang})
                    </button>
                    <button
                      onClick={() => testVoiceSample(v)}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 text-[10px] flex items-center space-x-1 shrink-0 cursor-pointer transition-colors"
                      title="Test Voice Sample"
                    >
                      <Play className="w-2.5 h-2.5" />
                      <span>Test</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Row 2: Live Mic Bar & Big Speak Button */}
        <div className="flex items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3">
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-bold uppercase tracking-wider">Microphone Input</span>
              <span className={jarvisState === 'listening' ? 'text-cyan-400 font-bold' : 'text-slate-500'}>
                {jarvisState === 'listening' ? `${audioVolume}% Level` : 'Standby'}
              </span>
            </div>
            
            {/* Visualizer Bar */}
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  jarvisState === 'listening' 
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-500' 
                    : 'bg-slate-800'
                }`}
                style={{ width: `${jarvisState === 'listening' ? Math.max(8, audioVolume) : 0}%` }}
              />
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={() => {
              if (jarvisState === 'listening') {
                finishListeningAndProcess();
              } else {
                startListening();
              }
            }}
            className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-lg shrink-0 ${
              jarvisState === 'listening'
                ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 shadow-cyan-500/40 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>{jarvisState === 'listening' ? 'Send Query' : 'Speak to Jarvis'}</span>
          </button>
        </div>

        {/* Row 3: Transcript / Spoken Preview Area */}
        {(liveTranscript || lastJarvisReply) && (
          <div className="space-y-2 pt-1 border-t border-slate-800/80">
            {liveTranscript && (
              <div className="bg-slate-950/70 border border-cyan-500/20 p-2.5 rounded-xl text-xs space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">You Said:</span>
                <p className="text-slate-200 leading-relaxed">{liveTranscript}</p>
              </div>
            )}
            {lastJarvisReply && (
              <div className="bg-slate-950/70 border border-emerald-500/20 p-2.5 rounded-xl text-xs space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Jarvis:</span>
                <p className="text-slate-200 leading-relaxed max-h-24 overflow-y-auto">{lastJarvisReply}</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
