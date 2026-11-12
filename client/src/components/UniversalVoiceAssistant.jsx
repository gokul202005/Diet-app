import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Key,
  Edit2,
  RotateCcw,
  Globe
} from 'lucide-react';
import { api } from '../api';

function deduplicateSpeechRepetitions(text) {
  if (!text || typeof text !== 'string') return '';
  // 1. Remove consecutive identical words (e.g. "I I I" -> "I", "idli idli" -> "idli")
  let clean = text.replace(/\b([a-zA-Z0-9]+)(\s+\1\b)+/gi, '$1');

  // 2. Token-level duplicate phrase remover (e.g. repeated sentence halves)
  let words = clean.split(/\s+/).filter(Boolean);
  if (words.length > 3) {
    for (let phraseLen = Math.floor(words.length / 2); phraseLen >= 2; phraseLen--) {
      for (let i = 0; i <= words.length - (phraseLen * 2); i++) {
        const s1 = words.slice(i, i + phraseLen).join(' ').toLowerCase();
        const s2 = words.slice(i + phraseLen, i + phraseLen * 2).join(' ').toLowerCase();
        if (s1 === s2) {
          words.splice(i + phraseLen, phraseLen);
          i--;
        }
      }
    }
    clean = words.join(' ');
  }

  // 3. Remove cumulative prefix repetitions:
  // e.g. "I ate I ate 3 I ate 3 Idli" -> "I ate 3 Idli"
  words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 4) {
    let modified = true;
    while (modified && words.length >= 4) {
      modified = false;
      for (let len = 1; len <= Math.floor(words.length / 2); len++) {
        const p1 = words.slice(0, len).join(' ').toLowerCase();
        const remainder = words.slice(len);
        if (remainder.length >= len) {
          const startOfRemainder = remainder.slice(0, len).join(' ').toLowerCase();
          if (p1 === startOfRemainder) {
            words.splice(0, len);
            modified = true;
            break;
          }
        }
      }
    }
    clean = words.join(' ');
  }

  return clean.replace(/\s+/g, ' ').trim();
}

function combineSpeechBuffers(committed, currentFinal, currentInterim) {
  const normCommitted = (committed || '').trim();
  const normFinal = (currentFinal || '').trim();
  const normInterim = (currentInterim || '').trim();

  // If current session already includes committed text from the beginning, discard committed
  let base = normCommitted;
  if (normFinal) {
    if (!base) {
      base = normFinal;
    } else if (normFinal.toLowerCase().startsWith(base.toLowerCase())) {
      base = normFinal;
    } else if (base.toLowerCase().endsWith(normFinal.toLowerCase())) {
      base = base;
    } else {
      const baseWords = base.split(/\s+/).filter(Boolean);
      const finalWords = normFinal.split(/\s+/).filter(Boolean);
      let overlapCount = 0;
      const maxOverlap = Math.min(baseWords.length, finalWords.length);
      for (let k = maxOverlap; k >= 1; k--) {
        const endWords = baseWords.slice(-k).join(' ').toLowerCase();
        const startWords = finalWords.slice(0, k).join(' ').toLowerCase();
        if (endWords === startWords) {
          overlapCount = k;
          break;
        }
      }
      if (overlapCount > 0) {
        base = baseWords.concat(finalWords.slice(overlapCount)).join(' ');
      } else {
        base = `${base} ${normFinal}`;
      }
    }
  }

  let full = base;
  if (normInterim) {
    if (!full) {
      full = normInterim;
    } else if (normInterim.toLowerCase().startsWith(full.toLowerCase())) {
      full = normInterim;
    } else {
      // Check word-level overlap before appending
      const baseWords = full.split(/\s+/).filter(Boolean);
      const interimWords = normInterim.split(/\s+/).filter(Boolean);
      let overlap = 0;
      const maxCheck = Math.min(baseWords.length, interimWords.length);
      for (let k = maxCheck; k >= 1; k--) {
        if (baseWords.slice(-k).join(' ').toLowerCase() === interimWords.slice(0, k).join(' ').toLowerCase()) {
          overlap = k;
          break;
        }
      }
      if (overlap > 0) {
        full = baseWords.concat(interimWords.slice(overlap)).join(' ');
      } else {
        full = `${full} ${normInterim}`;
      }
    }
  }

  return {
    finalText: deduplicateSpeechRepetitions(base),
    fullText: deduplicateSpeechRepetitions(full)
  };
}

function normalizeFitnessSpeech(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  let clean = rawText;
  const replacements = [
    [/\bi hate\b/gi, 'I ate'],
    [/\bi eight\b/gi, 'I ate'],
    [/\beye ate\b/gi, 'I ate'],
    [/\bsend for\b/gi, 'and 4'],
    [/\bsend\b/gi, 'and'],
    [/\band for\b/gi, 'and 4'],
    [/\bfor boiled eggs?\b/gi, '4 boiled eggs'],
    [/\bfree eggs\b/gi, '3 eggs'],
    [/\bto eggs\b/gi, '2 eggs'],
    [/\bfor eggs\b/gi, '4 eggs'],
    [/\bfree idli\b/gi, '3 idli'],
    [/\bto idli\b/gi, '2 idli'],
    [/\bfor idli\b/gi, '4 idli'],
    [/\bwon\b(?=.*(?:egg|roti|dosa|idli|banana))/gi, '1'],
    [/\bto\b(?=.*(?:eggs|rotis|dosas|idlis|bananas))/gi, '2'],
    [/\bcheap at ease\b/gi, 'chapatis'],
    [/\bcheap party\b/gi, 'chapati'],
    [/\bchapathi\b/gi, 'chapati'],
    [/\bchapattis?\b/gi, 'chapatis'],
    [/\bitaly\b/gi, 'idli'],
    [/\bidly\b/gi, 'idli'],
    [/\bidlies\b/gi, 'idlis'],
    [/\bedli\b/gi, 'idli'],
    [/\bdoshe\b/gi, 'dosa'],
    [/\bdosai\b/gi, 'dosa'],
    [/\bdhose\b/gi, 'dosa'],
    [/\bdose\b(?=.*(?:sambar|chutney))/gi, 'dosa'],
    [/\bsamba\b/gi, 'sambar'],
    [/\bsambhar\b/gi, 'sambar'],
    [/\bpanier\b/gi, 'paneer'],
    [/\bpanir\b/gi, 'paneer'],
    [/\bbriyani\b/gi, 'biryani'],
    [/\bbiriyani\b/gi, 'biryani'],
    [/\bcard\b(?=.*(?:rice|curd))/gi, 'curd'],
    [/\bcurds\b/gi, 'curd'],
    [/\bbench past\b/gi, 'bench press'],
    [/\bbench price\b/gi, 'bench press'],
    [/\bbench fresh\b/gi, 'bench press'],
    [/\bbiceps? girl\b/gi, 'bicep curls'],
    [/\bbiceps? cur\b/gi, 'bicep curl'],
    [/\bdead left\b/gi, 'deadlift'],
    [/\bdead lift\b/gi, 'deadlift'],
    [/\boverhead past\b/gi, 'overhead press'],
    [/\bwait is\b/gi, 'weight is'],
    [/\brate is\b/gi, 'weight is'],
    [/\bmy wait\b/gi, 'my weight'],
    [/\bhalf (?:a )?liter\b/gi, '500ml water'],
    [/\bone liter\b/gi, '1000ml water'],
    [/\btwo liters?\b/gi, '2000ml water'],
    [/\bi 8\b/gi, 'I ate'],
    [/\b8374\b/gi, ''],
    [/(\b[|I]\b\s*){3,}/g, 'I ']
  ];
  for (const [pattern, rep] of replacements) {
    clean = clean.replace(pattern, rep);
  }
  return deduplicateSpeechRepetitions(clean);
}

export default function UniversalVoiceAssistant({ selectedDate, onActionCompleted, isOpen: externalIsOpen, onClose: externalOnClose, onOpen: externalOnOpen }) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  // Assistant State: 'idle' | 'listening' | 'preview' | 'success'
  const [stateMode, setStateMode] = useState('idle');
  const [speechLang, setSpeechLang] = useState('en-IN'); // 'en-IN' | 'en-US' | 'ta-IN' | 'hi-IN'
  const [isRecording, setIsRecording] = useState(false);
  const [liveFinalText, setLiveFinalText] = useState('');
  const [liveInterimText, setLiveInterimText] = useState('');
  const [transcript, setTranscript] = useState('');
  const [editableSpeech, setEditableSpeech] = useState('');
  const [manualText, setManualText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [needsApiKey, setNeedsApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [audioVolume, setAudioVolume] = useState(0); // 0 - 100 for live visualizer

  // Hardware & Audio references
  const isRecordingRef = useRef(false);
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

  const finishSpeechAndPreview = async (rawSpeech) => {
    const normalized = normalizeFitnessSpeech(rawSpeech);
    setEditableSpeech(normalized);
    setTranscript(normalized);
    await parseIntentForPreview(normalized);
  };

  // Setup Web Audio Analyser for live visual feedback
  const setupAudioVisualizer = (stream) => {
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

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        if (!isRecordingRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        setAudioVolume(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };
      animFrameRef.current = requestAnimationFrame(updateVolume);
    } catch (e) {}
  };

  // Start Dual-Engine Real-Time & Hardware Microphone Capture (PC & Mobile compatible)
  const startRecording = async () => {
    setErrorMsg('');
    setResult(null);
    setPreviewData(null);
    setTranscript('');
    setLiveFinalText('');
    setLiveInterimText('');
    setEditableSpeech('');
    recognizedTextRef.current = '';
    audioChunksRef.current = [];

    // Step 1: Ensure hardware microphone access via getUserMedia (Guarantees PC browser permission prompt & visualizer)
    let userStream = null;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        userStream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            echoCancellation: true, 
            noiseSuppression: true, 
            autoGainControl: true 
          } 
        });
        mediaStreamRef.current = userStream;
        setupAudioVisualizer(userStream);

        // Start background MediaRecorder on the hardware stream
        let mimeType = 'audio/webm';
        if (typeof MediaRecorder !== 'undefined') {
          if (!MediaRecorder.isTypeSupported('audio/webm')) {
            if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
            else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
            else mimeType = '';
          }
        }
        const recorder = mimeType ? new MediaRecorder(userStream, { mimeType }) : new MediaRecorder(userStream);
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        recorder.start(100);
      }
    } catch (micErr) {
      console.warn('Microphone permission check notice:', micErr);
      if (micErr.name === 'NotAllowedError' || micErr.name === 'PermissionDeniedError') {
        setErrorMsg('Microphone access was denied. Please click the lock or settings icon in your browser address bar and set Microphone to "Allow".');
        setIsRecording(false);
        isRecordingRef.current = false;
        setStateMode('idle');
        return;
      } else if (micErr.name === 'NotFoundError' || micErr.name === 'DevicesNotFoundError') {
        setErrorMsg('No microphone detected. Please plug in a headset or microphone and try again.');
        setIsRecording(false);
        isRecordingRef.current = false;
        setStateMode('idle');
        return;
      }
    }

    setIsRecording(true);
    isRecordingRef.current = true;
    setStateMode('listening');
    playBeep(700, 0.12);

    // Step 2: Concurrently attach real-time Web Speech Recognition for instant word streaming
    const SpeechRecognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

    if (SpeechRecognition) {
      try {
        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch (e) {}
          recognitionRef.current = null;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = speechLang || 'en-IN';
        recognition.maxAlternatives = 1;

        let committedFinal = '';

        recognition.onstart = () => {
          // Web speech actively streaming
        };

        recognition.onresult = (event) => {
          let currentSessionFinal = '';
          let currentSessionInterim = '';

          for (let i = 0; i < event.results.length; ++i) {
            const item = event.results[i];
            const text = item[0]?.transcript || '';
            if (item.isFinal) {
              currentSessionFinal += text + ' ';
            } else {
              currentSessionInterim += text;
            }
          }

          const { finalText, fullText } = combineSpeechBuffers(committedFinal, currentSessionFinal, currentSessionInterim);

          const cleanFinal = normalizeFitnessSpeech(finalText);
          const cleanInterim = normalizeFitnessSpeech(currentSessionInterim);
          const fullDisplay = normalizeFitnessSpeech(fullText);

          setLiveFinalText(cleanFinal);
          setLiveInterimText(cleanInterim);
          setTranscript(fullDisplay);
          recognizedTextRef.current = fullDisplay;
        };

        recognition.onerror = (event) => {
          console.warn('SpeechRecognition notice on PC/Mobile:', event.error);
          // If Web Speech API has a network error or audio-capture on PC,
          // the background MediaRecorder continues capturing audio smoothly!
          if (event.error === 'not-allowed') {
            console.warn('WebSpeech not-allowed, using hardware audio fallback');
          }
        };

        recognition.onend = () => {
          // Auto-rearm if still recording and no error
          if (isRecordingRef.current) {
            if (recognizedTextRef.current.trim()) {
              committedFinal = deduplicateSpeechRepetitions(recognizedTextRef.current.trim());
            }
            try {
              recognition.start();
            } catch (e) {}
          }
        };

        recognitionRef.current = recognition;
        try {
          recognition.start();
        } catch (startErr) {
          console.warn('SpeechRecognition.start() error:', startErr);
        }
      } catch (err) {
        console.warn('SpeechRecognition setup error:', err);
      }
    }
  };

  // Stop recording and parse speech into Human-in-the-Loop verification preview
  const stopRecordingAndProcess = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    playBeep(500, 0.15);

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    const liveCaptured = recognizedTextRef.current.trim() || transcript.trim() || (liveFinalText + ' ' + liveInterimText).trim();

    // If client Web Speech captured clear words, proceed immediately without waiting for audio upload!
    if (liveCaptured && liveCaptured.length > 2) {
      finishSpeechAndPreview(liveCaptured);
      cleanupAudio();
      return;
    }

    // Direct Audio Fallback: Process the background MediaRecorder audio through Gemini
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      const recorder = mediaRecorderRef.current;
      recorder.onstop = async () => {
        const mime = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mime });
        cleanupAudio();

        if (audioBlob.size > 1500) {
          await executeVoiceAudio(audioBlob);
        } else {
          setStateMode('idle');
          setErrorMsg('Could not detect clear speech in the audio. Please try speaking closer to the microphone, or click an example below.');
        }
      };

      try { recorder.stop(); } catch (e) { cleanupAudio(); }
      return;
    }

    cleanupAudio();
    setStateMode('idle');
    setErrorMsg('Could not detect clear speech. Please tap the microphone and speak closer, or tap an example below.');
  };

  // Step 1 -> Step 2: Parse intent and generate structured verification card
  const parseIntentForPreview = async (text) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    setIsProcessing(true);
    setProcessingStatus('Analyzing speech & categorizing...');
    setErrorMsg('');

    try {
      const res = await api.parseVoiceIntent(cleanText, selectedDate);
      if (res.success) {
        setPreviewData(res);
        setStateMode('preview');
      } else {
        setErrorMsg(res.error || 'Could not understand command. Please try again.');
        setStateMode('idle');
      }
    } catch (err) {
      setErrorMsg('Parsing error: ' + err.message);
      setStateMode('idle');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Execute Audio File directly (Gemini Multimodal)
  const executeVoiceAudio = async (audioBlob) => {
    setIsProcessing(true);
    setProcessingStatus('Uploading audio to Gemini AI...');
    setErrorMsg('');

    try {
      const res = await api.universalVoiceAudio(audioBlob, selectedDate);
      if (res.needsApiKey) {
        setNeedsApiKey(true);
        setErrorMsg(res.details || res.error || 'Gemini API key is required for voice audio transcription.');
        setStateMode('idle');
        return;
      }
      if (res.success && res.transcribedText) {
        setTranscript(res.transcribedText);
        setEditableSpeech(res.transcribedText);
        if (res.preview) {
          setPreviewData(res.preview);
          setStateMode('preview');
        } else {
          await parseIntentForPreview(res.transcribedText);
        }
      } else {
        const isLeaked = /leaked|403|forbidden/i.test(res.error || '');
        if (isLeaked) {
          setNeedsApiKey(true);
          setErrorMsg('Your Gemini API key was reported as leaked by Google. Please enter a fresh free key below from Google AI Studio.');
        } else {
          setErrorMsg(res.error || 'Could not process audio recording.');
        }
        setStateMode('idle');
      }
    } catch (err) {
      setErrorMsg('Voice processing error: ' + err.message);
      setStateMode('idle');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Step 2 -> Step 3: User verifies and confirms the action into Diary
  const handleConfirmAndCommit = async () => {
    if (!previewData) return;

    setIsProcessing(true);
    setProcessingStatus('Saving to your diary...');
    setErrorMsg('');

    try {
      const res = await api.universalVoiceCommand({
        confirmedIntent: previewData.intent,
        payload: previewData.parsedData,
        text: editableSpeech || previewData.originalText,
        date: selectedDate
      }, selectedDate);

      if (res.success) {
        setResult(res);
        setStateMode('success');
        playBeep(1040, 0.25);
        if (typeof onActionCompleted === 'function') {
          onActionCompleted(res);
        }
        setTimeout(() => {
          handleClose();
        }, 2800);
      } else {
        setErrorMsg(res.error || 'Failed to log to diary.');
      }
    } catch (err) {
      setErrorMsg('Connection error: ' + err.message);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Switch Category Intent Manually in Preview
  const handleSwitchCategory = async (newCategory) => {
    if (!previewData) return;
    const text = editableSpeech || previewData.originalText;

    if (newCategory === 'water') {
      setPreviewData({
        ...previewData,
        intent: 'water',
        badgeText: 'Hydration',
        badgeColor: 'blue',
        summaryTitle: 'Water Hydration',
        previewDetails: '+500 ml (0.50 L)',
        parsedData: { amountMl: 500 }
      });
    } else if (newCategory === 'workout') {
      const match = text.match(/(\d+)\s*(?:push-?ups?|push\s+ups?|pull-?ups?|pull\s+ups?|reps?)/i);
      const isPush = /push/i.test(text);
      const isPull = /pull/i.test(text);
      const reps = match ? parseInt(match[1]) : 15;
      const exName = isPush ? 'Standard Push-ups' : isPull ? 'Pull-ups' : 'Strength Workout Session';
      const isBodyweight = isPush || isPull;
      const wt = isBodyweight ? 0 : 50;
      const wtDisplay = wt > 0 ? `@ ${wt} kg` : '(Bodyweight)';

      setPreviewData({
        ...previewData,
        intent: 'workout',
        badgeText: isBodyweight ? 'Calisthenics' : 'Strength Workout',
        badgeColor: isBodyweight ? 'emerald' : 'amber',
        summaryTitle: exName,
        previewDetails: `1 set × ${reps} reps ${wtDisplay}`,
        parsedData: {
          exerciseName: exName,
          setsCount: 1,
          repsCount: reps,
          weightKg: wt,
          durationMin: Math.max(2, Math.round(reps * 0.5)),
          caloriesBurned: Math.round(reps * 0.5)
        }
      });
    } else if (newCategory === 'weight') {
      const match = text.match(/(\d+(?:\.\d+)?)/);
      const wt = match ? parseFloat(match[1]) : 75;
      setPreviewData({
        ...previewData,
        intent: 'weight',
        badgeText: 'Body Weight',
        badgeColor: 'teal',
        summaryTitle: 'Morning Scale Weight',
        previewDetails: `${wt} kg`,
        parsedData: { weightKg: wt }
      });
    } else if (newCategory === 'meal') {
      setPreviewData({
        ...previewData,
        intent: 'meal',
        badgeText: 'LUNCH',
        badgeColor: 'emerald',
        summaryTitle: text.slice(0, 30),
        previewDetails: '350 kcal • 20g Protein • 35g Carbs • 10g Fat',
        parsedData: {
          mealType: 'lunch',
          name: text.slice(0, 35),
          foods: [{ name: text.slice(0, 30), quantity: '1 portion', calories: 350, protein: 20, carbs: 35, fat: 10 }],
          totalCalories: 350,
          totalProtein: 20,
          totalCarbs: 35,
          totalFat: 10
        }
      });
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return;
    try {
      await api.updateSettings({ geminiApiKey: apiKeyInput.trim() });
      setNeedsApiKey(false);
      setErrorMsg('');
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('Gemini API Key saved! Tap the microphone to record your voice.', 'success', 'API Key Configured');
      }
    } catch (err) {
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('Failed to save API Key: ' + err.message, 'error', 'Key Error');
      }
    }
  };

  const handleOpen = () => {
    if (externalOnOpen) externalOnOpen();
    else setInternalIsOpen(true);
    setStateMode('idle');
    setResult(null);
    setPreviewData(null);
    setErrorMsg('');
    setTranscript('');
    setLiveFinalText('');
    setLiveInterimText('');
    setEditableSpeech('');
    setManualText('');
  };

  const handleClose = () => {
    if (isRecording) {
      cleanupAudio();
      setIsRecording(false);
    }
    setStateMode('idle');
    if (externalOnClose) externalOnClose();
    else setInternalIsOpen(false);
    setResult(null);
    setPreviewData(null);
  };

  const getSectionIcon = (section) => {
    switch (section) {
      case 'diet': 
      case 'meal': return <Utensils className="w-5 h-5 text-emerald-400" />;
      case 'water': return <Droplets className="w-5 h-5 text-blue-400" />;
      case 'workout':
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

      {/* 2. UNIVERSAL VOICE COMMAND MODAL (PORTAL TO BODY TO PREVENT ANY OVERFLOW CLIPPING) */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          onClick={handleClose}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
        >
          <div 
            className="relative w-full max-w-lg my-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
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
                  <p className="text-[10px] text-slate-400">
                    {stateMode === 'preview' ? 'Step 2 of 2: Review & Confirm your log' : 'Speak naturally to log meals, water, workouts, or weight'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ERROR BANNER */}
            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs flex items-center space-x-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* NEEDS API KEY HELPER */}
            {needsApiKey && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl text-left space-y-2.5 animate-in fade-in">
                <div className="flex items-center space-x-2 text-amber-300 text-xs font-bold">
                  <Key className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Gemini API Key for Direct Audio Upload</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Enter your free Gemini API key from Google AI Studio to process direct audio files, or tap the microphone to use browser speech recognition:
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

            {/* ========================================================================= */}
            {/* VIEW 1: RECORDING & LISTENING VIEW (stateMode === 'idle' | 'listening') */}
            {/* ========================================================================= */}
            {(stateMode === 'idle' || stateMode === 'listening') && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
                
                {/* Spoken Language / Dialect Switcher */}
                <div className="flex items-center justify-center space-x-1.5 flex-wrap gap-y-1">
                  <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider mr-1">
                    <Globe className="w-3 h-3 text-slate-400" />
                    <span>Language:</span>
                  </div>
                  {[
                    { code: 'en-IN', label: '🇮🇳 Indian English' },
                    { code: 'en-US', label: '🌐 English (Global)' },
                    { code: 'ta-IN', label: '🇮🇳 தமிழ்' },
                    { code: 'hi-IN', label: '🇮🇳 हिन्दी' }
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      disabled={isRecording}
                      onClick={() => setSpeechLang(lang.code)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        speechLang === lang.code
                          ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>

                {/* ACTIVE LISTENING (GEMINI / GOOGLE REAL-TIME TYPING STREAM) */}
                {isRecording ? (
                  <div className="space-y-4 py-1">
                    {/* Glowing Pulsing Mic Orb */}
                    <div className="relative inline-block my-1">
                      <div className="absolute -inset-2 rounded-full bg-emerald-400/30 animate-ping pointer-events-none" />
                      <button
                        type="button"
                        onClick={stopRecordingAndProcess}
                        className="relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all shadow-2xl cursor-pointer mx-auto bg-gradient-to-tr from-rose-500 via-rose-600 to-amber-500 text-white shadow-rose-500/50 scale-105 active:scale-95 animate-pulse"
                      >
                        <MicOff className="w-8 h-8" />
                        <span className="text-[10px] font-black uppercase mt-1">Tap to Finish</span>
                      </button>
                    </div>

                    {/* LIVE REAL-TIME WORD-BY-WORD STREAMING CARD */}
                    <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-2xl p-4 text-left shadow-2xl space-y-2 relative overflow-hidden">
                      <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-slate-800">
                        <span className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span>Streaming Speech Live (Word-by-word)</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {speechLang === 'en-IN' ? 'English (India)' : speechLang === 'ta-IN' ? 'Tamil' : speechLang === 'hi-IN' ? 'Hindi' : 'Global English'}
                        </span>
                      </div>

                      {/* Live Text Body */}
                      <div className="min-h-[70px] flex items-center py-1">
                        {(liveFinalText || liveInterimText || transcript) ? (
                          <p className="text-base sm:text-lg font-bold text-white leading-relaxed break-words">
                            <span>{liveFinalText} </span>
                            <span className="text-emerald-300 italic">
                              {liveInterimText}
                            </span>
                            <span className="inline-block w-2 h-4 ml-1 bg-emerald-400 animate-pulse align-middle" />
                          </p>
                        ) : (
                          <div className="text-slate-400 text-sm italic animate-pulse">
                            Speak now... words will appear here live in real-time as you speak!
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Equalizer Sound Waves */}
                    <div className="flex items-center justify-center space-x-1.5 h-6">
                      {[6, 14, 22, 16, 26, 14, 8, 18, 12, 20, 10].map((h, i) => (
                        <div
                          key={i}
                          style={{
                            height: `${h}px`,
                            animation: `pulse 0.7s ease-in-out infinite ${(i * 0.08).toFixed(2)}s`
                          }}
                          className="w-1.5 bg-gradient-to-t from-emerald-500 via-teal-400 to-cyan-400 rounded-full"
                        />
                      ))}
                    </div>

                    {/* One-Tap Finish Button */}
                    <button
                      type="button"
                      onClick={stopRecordingAndProcess}
                      className="w-full py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Done Speaking — Analyze & Review</span>
                    </button>
                  </div>
                ) : (
                  /* IDLE / READY STATE */
                  <div className="space-y-4 py-2">
                    <div className="relative inline-block my-1">
                      <button
                        type="button"
                        onClick={startRecording}
                        disabled={isProcessing}
                        className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all shadow-2xl cursor-pointer mx-auto bg-gradient-to-tr from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/30 hover:scale-105 active:scale-95 ${
                          isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <Mic className="w-8 h-8" />
                        <span className="text-[10px] font-black uppercase mt-1">Tap to Speak</span>
                      </button>
                    </div>

                    {isProcessing ? (
                      <div className="flex items-center justify-center space-x-2 text-emerald-400 text-xs font-bold py-2">
                        <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        <span>{processingStatus || 'Analyzing your speech with AI...'}</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-white">
                          Tap the microphone to speak your meal or workout
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Adds text live on screen as you speak, like Google &amp; Gemini
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* VIEW 2: HUMAN-IN-THE-LOOP VERIFICATION SCREEN (stateMode === 'preview')   */}
            {/* ========================================================================= */}
            {stateMode === 'preview' && previewData && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-150">
                {/* 1. Speech Transcription with Inline Edit Option */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                      What I Heard (Tap to edit if misheard):
                    </span>
                    <Edit2 className="w-3 h-3 text-emerald-400" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={editableSpeech}
                      onChange={(e) => setEditableSpeech(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => parseIntentForPreview(editableSpeech)}
                      disabled={isProcessing}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl transition-all cursor-pointer shrink-0 border border-slate-700"
                    >
                      Re-parse
                    </button>
                  </div>

                  {/* Quick-Fix Suggestion Chips */}
                  <div className="flex items-center space-x-1.5 overflow-x-auto pt-1 pb-0.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider shrink-0 mr-1">
                      Quick Replace:
                    </span>
                    {[
                      '3 idlis with sambar',
                      '2 chapatis with curry',
                      '1 masala dosa',
                      '2 boiled eggs',
                      'protein shake',
                      'drank 500ml water',
                      'bench press 3 sets 10 reps',
                      'my weight is 70 kg'
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setEditableSpeech(item);
                          parseIntentForPreview(item);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-400 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/40 transition-colors shrink-0 cursor-pointer"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Structured AI Intent Card */}
                <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-emerald-500/40 rounded-2xl p-4 text-left space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
                        {getSectionIcon(previewData.intent)}
                      </div>
                      <div>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                          previewData.intent === 'meal' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          previewData.intent === 'workout' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          previewData.intent === 'water' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                          'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                        }`}>
                          {previewData.badgeText || previewData.intent}
                        </span>
                        <h4 className="text-sm font-black text-white mt-1">
                          {previewData.summaryTitle}
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* Numbers & Breakdown Display */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                    <p className="text-xs font-bold text-emerald-300">
                      {previewData.previewDetails}
                    </p>
                    {previewData.intent === 'meal' && previewData.parsedData?.foods && (
                      <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1">
                        {previewData.parsedData.foods.map((food, fidx) => (
                          <div key={fidx} className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>• {food.name} ({food.quantity})</span>
                            <span className="font-semibold text-slate-300">{food.calories} kcal | {food.protein}g P</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Category Switcher Pills */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-800/60">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Wrong Category? Switch to:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'meal', label: '🍽️ Food / Meal' },
                        { id: 'workout', label: '💪 Gym Workout' },
                        { id: 'water', label: '💧 Water' },
                        { id: 'weight', label: '⚖️ Body Weight' }
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleSwitchCategory(cat.id)}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                            previewData.intent === cat.id
                              ? 'bg-emerald-500 text-slate-950 font-black'
                              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Action Buttons: Confirm & Commit vs Try Again */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStateMode('idle');
                      setPreviewData(null);
                      setTranscript('');
                      setEditableSpeech('');
                    }}
                    disabled={isProcessing}
                    className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all border border-slate-700 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmAndCommit}
                    disabled={isProcessing}
                    className="py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-black rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    {isProcessing ? (
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm & Log</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* VIEW 3: SUCCESS CONFIRMATION (stateMode === 'success')                    */}
            {/* ========================================================================= */}
            {stateMode === 'success' && result && (
              <div className="bg-emerald-500/15 border border-emerald-500/40 p-5 rounded-2xl text-left space-y-3 animate-in fade-in zoom-in-95">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    Successfully Logged to Diary!
                  </span>
                </div>
                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 flex items-start space-x-3">
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
                    {getSectionIcon(result.section)}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-emerald-300">{result.feedback}</div>
                    <div className="text-[10px] text-slate-400 mt-1 capitalize">Target Section: {result.section}</div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* MANUAL TYPEWRITER INPUT (Always accessible at bottom)                    */}
            {/* ========================================================================= */}
            {stateMode !== 'preview' && stateMode !== 'success' && (
              <>
                <form 
                  onSubmit={(e) => { 
                    e.preventDefault(); 
                    if (manualText.trim()) {
                      setEditableSpeech(manualText.trim());
                      parseIntentForPreview(manualText.trim());
                    }
                  }}
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
                    <span>Preview</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>

                {/* Quick 1-Tap Example Utterances */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-left">
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
                            setEditableSpeech(item.text);
                            parseIntentForPreview(item.text);
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
              </>
            )}

          </div>
        </div>,
        document.body
      )}
    </>
  );
}
