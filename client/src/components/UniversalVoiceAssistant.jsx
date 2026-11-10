import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Utensils, 
  Droplets, 
  Dumbbell, 
  Scale, 
  Watch, 
  MessageSquare,
  Volume2,
  Radio,
  Key
} from 'lucide-react';
import { api } from '../api';

export default function UniversalVoiceAssistant({ selectedDate, onActionCompleted, isOpen: externalIsOpen, onClose: externalOnClose, onOpen: externalOnOpen }) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [manualText, setManualText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [needsApiKey, setNeedsApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [audioVolume, setAudioVolume] = useState(0); // 0 - 100 for live visualizer

  // Hardware & Audio references
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const recognitionRef = useRef(null);
  const recognizedTextRef = useRef('');

  // Global event listener to open from anywhere
  useEffect(() => {
    const handleGlobalTrigger = () => handleOpen();
    window.addEventListener('open-universal-voice', handleGlobalTrigger);
    return () => window.removeEventListener('open-universal-voice', handleGlobalTrigger);
  }, []);

  // Clean up audio streams on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, []);

  const cleanupAudio = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch (e) {}
      audioCtxRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
      recognitionRef.current = null;
    }
    setAudioVolume(0);
  };

  // Web Audio Beep Cue
  const playBeep = (freq = 880, duration = 0.1) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  };

  // Start Hardware Audio Recording + Parallel Speech Recognition
  const startRecording = async () => {
    setErrorMsg('');
    setResult(null);
    setTranscript('');
    recognizedTextRef.current = '';
    audioChunksRef.current = [];

    // Check mediaDevices support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg('Microphone access is not supported by this browser. You can type what you did below!');
      return;
    }

    try {
      // 1. Prompt real device microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // 2. Setup live audio waveform analyzer
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioCtxRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateVolume = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setAudioVolume(Math.min(100, Math.round((avg / 128) * 100)));
            animFrameRef.current = requestAnimationFrame(updateVolume);
          };
          updateVolume();
        }
      } catch (err) {
        console.warn('AudioContext visualizer notice:', err);
      }

      // 3. Setup MediaRecorder for direct audio capture
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
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(100); // 100ms chunks
      setIsRecording(true);
      playBeep(700, 0.12);

      // 4. In parallel, run Web SpeechRecognition if available for instantaneous live subtitles
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-IN'; // Indian English: catches South Indian dishes & fitness terms accurately

          recognition.onresult = (event) => {
            let current = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              current += event.results[i][0].transcript;
            }
            if (current.trim()) {
              setTranscript(current);
              recognizedTextRef.current = current;
            }
          };

          recognition.onerror = (e) => {
            // Non-fatal because MediaRecorder is actively capturing the audio file
            console.log('WebSpeech fallback note:', e.error);
          };

          recognitionRef.current = recognition;
          recognition.start();
        } catch (e) {
          console.warn('SpeechRecognition startup skipped, relying on direct audio recording:', e);
        }
      }

    } catch (err) {
      console.error('Microphone error:', err);
      setIsRecording(false);
      cleanupAudio();
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('Microphone permission was denied. Please allow microphone access in your browser or phone settings.');
      } else {
        setErrorMsg('Could not access microphone: ' + (err.message || 'Unknown device error'));
      }
    }
  };

  // Stop recording and process either via transcript or multimodal audio
  const stopRecordingAndProcess = () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    setIsRecording(false);
    playBeep(500, 0.15);

    const recorder = mediaRecorderRef.current;
    
    recorder.onstop = async () => {
      // Create audio blob
      const mime = recorder.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mime });
      cleanupAudio();

      const recognizedSpeech = recognizedTextRef.current.trim() || transcript.trim();

      // If speech recognition got the text, send directly
      if (recognizedSpeech) {
        await executeVoiceCommand(recognizedSpeech);
      } else if (audioBlob.size > 1000) {
        // Send recorded audio to backend for Gemini Multimodal Transcription & Logging
        await executeVoiceAudio(audioBlob);
      } else {
        setErrorMsg('No speech detected. Please speak closer to your microphone or click an example below.');
      }
    };

    try {
      recorder.stop();
    } catch (e) {
      cleanupAudio();
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
  };

  // Execute Text Command
  const executeVoiceCommand = async (text) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    setIsProcessing(true);
    setProcessingStatus('Analyzing speech with AI...');
    setErrorMsg('');
    setResult(null);

    try {
      const res = await api.universalVoiceCommand(cleanText, selectedDate);
      handleSuccessResult(res, cleanText);
    } catch (err) {
      setErrorMsg('Connection error: ' + err.message);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Execute Audio File directly (Gemini Multimodal)
  const executeVoiceAudio = async (audioBlob) => {
    setIsProcessing(true);
    setProcessingStatus('Uploading audio to Gemini AI Transcriber...');
    setErrorMsg('');
    setResult(null);

    try {
      const res = await api.universalVoiceAudio(audioBlob, selectedDate);
      if (res.needsApiKey || (res.error && res.error.toLowerCase().includes('key'))) {
        setNeedsApiKey(true);
        setErrorMsg(res.details || res.error || 'Gemini API key is required for voice audio transcription.');
        return;
      }
      if (res.transcribedText) {
        setTranscript(res.transcribedText);
      }
      handleSuccessResult(res, res.transcribedText || 'Voice recording');
    } catch (err) {
      setErrorMsg('Voice processing error: ' + err.message);
      if (err.message && err.message.toLowerCase().includes('key')) {
        setNeedsApiKey(true);
      }
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return;
    try {
      await api.updateSettings({ geminiApiKey: apiKeyInput.trim() });
      setNeedsApiKey(false);
      setErrorMsg('');
      alert('Gemini API Key saved! Tap the microphone to record your voice.');
    } catch (err) {
      alert('Failed to save API Key: ' + err.message);
    }
  };

  const handleSuccessResult = (res, utteredText) => {
    if (res.success) {
      setResult(res);
      playBeep(1040, 0.25);
      if (typeof onActionCompleted === 'function') {
        onActionCompleted(res);
      }
      // Auto-close modal after 3.2 seconds
      setTimeout(() => {
        if (externalOnClose) externalOnClose();
        else setInternalIsOpen(false);
      }, 3200);
    } else {
      setErrorMsg(res.error || 'Could not understand command. Please try again.');
    }
  };

  // Handle Opening Modal
  const handleOpen = () => {
    if (externalOnOpen) externalOnOpen();
    else setInternalIsOpen(true);
    setResult(null);
    setErrorMsg('');
    setTranscript('');
    setManualText('');
  };

  // Handle Closing Modal
  const handleClose = () => {
    if (isRecording) {
      cleanupAudio();
      setIsRecording(false);
    }
    if (externalOnClose) externalOnClose();
    else setInternalIsOpen(false);
    setResult(null);
  };

  const getSectionIcon = (section) => {
    switch (section) {
      case 'diet': return <Utensils className="w-5 h-5 text-emerald-400" />;
      case 'water': return <Droplets className="w-5 h-5 text-blue-400" />;
      case 'workouts': return <Dumbbell className="w-5 h-5 text-amber-400" />;
      case 'weight': return <Scale className="w-5 h-5 text-teal-400" />;
      case 'fastrack': return <Watch className="w-5 h-5 text-cyan-400" />;
      case 'coach': return <MessageSquare className="w-5 h-5 text-sky-400" />;
      default: return <Sparkles className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <>
      {/* 1. PERSISTENT FLOATING TRIGGER BUTTON (Desktop Only - Mobile uses center dock button) */}
      <div className="hidden xl:flex fixed bottom-6 right-6 z-40 items-center group">
        <button
          onClick={handleOpen}
          className="relative flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-emerald-300/40"
          title="Universal Voice Assistant: Speak to log meals, water, workouts, or weight"
        >
          <span className="absolute -inset-1 rounded-2xl bg-emerald-400/30 animate-pulse blur-sm -z-10 pointer-events-none" />
          <Mic className="w-5 h-5 shrink-0 animate-bounce" />
          <span className="text-xs font-black tracking-wide hidden sm:inline">Voice Log</span>
        </button>
      </div>

      {/* 2. UNIVERSAL VOICE COMMAND MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
          <div 
            className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Universal AI Voice Assistant</h3>
                  <p className="text-[10px] text-slate-400">Speak naturally to log meals, water, workouts, or scale weight</p>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Central Microphone, Audio Visualizer & Control */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
              <div className="relative inline-block my-1">
                {isRecording && (
                  <div className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping scale-150 pointer-events-none" />
                )}
                <button
                  type="button"
                  onClick={isRecording ? stopRecordingAndProcess : startRecording}
                  disabled={isProcessing}
                  className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all shadow-2xl cursor-pointer mx-auto ${
                    isRecording
                      ? 'bg-rose-500 text-white shadow-rose-500/50 scale-105 animate-pulse'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
                  } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-8 h-8" />
                      <span className="text-[10px] font-black uppercase mt-1">Tap to Stop</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-8 h-8" />
                      <span className="text-[10px] font-black uppercase mt-1">Tap to Speak</span>
                    </>
                  )}
                </button>
              </div>

              {/* Live Audio Visualizer Wave Bars */}
              {isRecording ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-1.5 h-8">
                    {[0.6, 1.2, 0.9, 1.5, 0.8, 1.3, 0.5].map((multiplier, i) => {
                      const barHeight = Math.max(6, Math.min(32, Math.round((audioVolume * multiplier) * 0.4)));
                      return (
                        <div
                          key={i}
                          style={{ height: `${barHeight}px` }}
                          className="w-1.5 bg-gradient-to-t from-rose-500 to-amber-400 rounded-full transition-all duration-75"
                        />
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-rose-400 text-xs font-bold animate-pulse">
                    <Radio className="w-3.5 h-3.5" />
                    <span>Listening... Speak now and tap Stop when done</span>
                  </div>
                </div>
              ) : isProcessing ? (
                <div className="flex items-center justify-center space-x-2 text-emerald-400 text-xs font-bold py-2">
                  <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  <span>{processingStatus || 'Processing with Gemini AI...'}</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-xs font-bold text-white">
                    Tap the microphone button to start recording
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Auto-categorizes meals, water, gym workouts, and scale weight
                  </div>
                </div>
              )}

              {/* Live Recognized Speech Subtitle */}
              {transcript && (
                <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-3.5 text-left space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Recognized Speech:</span>
                  <p className="text-xs font-bold text-emerald-300 italic bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    &ldquo;{transcript}&rdquo;
                  </p>
                  {!isRecording && !isProcessing && !result && (
                    <button
                      onClick={() => executeVoiceCommand(transcript)}
                      className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Confirm & Add Now</span>
                    </button>
                  )}
                </div>
              )}

              {/* Needs Gemini API Key Action Card */}
              {needsApiKey && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl text-left space-y-2.5 animate-in fade-in">
                  <div className="flex items-center space-x-2 text-amber-300 text-xs font-bold">
                    <Key className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Gemini API Key Needed for Audio Transcription</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Enter your Gemini API key from Google AI Studio to process direct audio recordings, or speak clearly to use instant speech recognition:
                  </p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="AIzaSy..."
                      className="flex-1 bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSaveApiKey}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg transition-all shadow-sm cursor-pointer shrink-0"
                    >
                      Save Key
                    </button>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs flex items-center space-x-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Success Result Confirmation */}
              {result && (
                <div className="bg-emerald-500/15 border border-emerald-500/40 p-4 rounded-xl text-left space-y-2 animate-in fade-in">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                      Successfully Logged!
                    </span>
                  </div>
                  <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 flex items-start space-x-3">
                    <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 shrink-0">
                      {getSectionIcon(result.section)}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-emerald-300">{result.feedback}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 capitalize">Target Section: {result.section}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Manual Typewriter Input (Fail-safe for any browser) */}
            <form 
              onSubmit={(e) => { e.preventDefault(); executeVoiceCommand(manualText); }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Or type what you did (e.g. 'I drank 500ml water' or '3 idlis 2 eggs')..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!manualText.trim() || isProcessing}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center space-x-1 transition-all cursor-pointer shadow-md"
              >
                <span>Add</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Quick 1-Tap Example Utterances for All Sections */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                1-Tap quick examples:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {[
                  { text: '3 idlis with sambar and 2 boiled eggs', section: 'Diet', icon: Utensils, color: 'text-emerald-400' },
                  { text: 'I drank 500 ml water', section: 'Water', icon: Droplets, color: 'text-blue-400' },
                  { text: 'Barbell bench press 3 sets 10 reps 60kg', section: 'Workout', icon: Dumbbell, color: 'text-amber-400' },
                  { text: 'My scale weight is 110.5 kg', section: 'Weight', icon: Scale, color: 'text-teal-400' }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setTranscript(item.text);
                        executeVoiceCommand(item.text);
                      }}
                      className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 rounded-xl flex items-center space-x-2 text-xs text-slate-300 transition-all text-left cursor-pointer"
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${item.color}`} />
                      <div className="truncate flex-1">
                        <span className="text-[10px] font-bold text-slate-500 block leading-tight">{item.section}</span>
                        <span className="text-[11px] font-semibold text-slate-200 truncate block">&ldquo;{item.text}&rdquo;</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
