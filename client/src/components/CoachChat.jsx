import React, { useState, useEffect, useRef } from 'react';
import ConfirmModal from './ConfirmModal';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  Flame, 
  Dumbbell, 
  Watch, 
  RefreshCw, 
  Trash2, 
  Mic, 
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Zap,
  Headphones,
  ChevronDown,
  Check
} from 'lucide-react';
import { api } from '../api';

// Markdown text & inline parser for rich AI Coach responses (bold, italics, links, images, code)
function formatInline(str, isUser) {
  if (!str) return '';
  const tokens = [];
  const regex = /(\!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]+)\]\(([^)]+)\)|\*\*(?:[^*]|\*(?!\*))+\*\*|`[^`]+`|(?<=\s|^|\()\*([^*]+)\*(?=\s|[.,!?:;)]|$)|(?<=\s|^|\()_([^_]+)_(?=\s|[.,!?:;)]|$)|https?:\/\/[^\s)]+)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(str.substring(lastIndex, match.index));
    }
    const token = match[0];

    // Image: ![alt](url)
    if (token.startsWith('![') && token.includes('](')) {
      const alt = match[2] || 'Image preview';
      const url = match[3];
      tokens.push(
        <div key={match.index} className="my-2">
          <img 
            src={url} 
            alt={alt} 
            className="rounded-xl max-h-52 w-auto object-cover border border-cyan-500/30 shadow-lg shadow-cyan-950/40" 
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          {alt && <span className="block text-[10px] text-slate-400 mt-1 italic">{alt}</span>}
        </div>
      );
    }
    // Link: [label](url)
    else if (token.startsWith('[') && token.includes('](')) {
      const label = match[4];
      const url = match[5];
      tokens.push(
        <a 
          key={match.index} 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-cyan-400 hover:text-cyan-300 underline font-bold inline-flex items-center space-x-1"
        >
          <span>{label}</span>
          <span className="text-[10px]">↗</span>
        </a>
      );
    }
    // Bare URL: https://...
    else if (token.startsWith('http://') || token.startsWith('https://')) {
      tokens.push(
        <a 
          key={match.index} 
          href={token} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-cyan-400 hover:text-cyan-300 underline font-medium break-all"
        >
          {token}
        </a>
      );
    }
    else if (token.startsWith('**') && token.endsWith('**')) {
      tokens.push(
        <strong key={match.index} className={isUser ? "font-black text-slate-950" : "font-bold text-white tracking-wide"}>
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push(
        <code key={match.index} className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-emerald-300 font-mono text-[11px]">
          {token.slice(1, -1)}
        </code>
      );
    } else if ((token.startsWith('*') && token.endsWith('*')) || (token.startsWith('_') && token.endsWith('_'))) {
      tokens.push(
        <em key={match.index} className={isUser ? "italic text-slate-900 font-medium" : "italic text-slate-300"}>
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < str.length) {
    tokens.push(str.substring(lastIndex));
  }

  return tokens.length > 0 ? tokens : str;
}

function FormattedMessage({ content, isUser }) {
  if (!content) return null;

  const rawLines = content.split('\n');
  const blocks = [];
  let currentList = null;
  let runningOlNumber = 0;

  const flushList = () => {
    if (currentList) {
      if (currentList.type === 'ul') {
        blocks.push(
          <ul key={`ul-${blocks.length}`} className="space-y-1.5 my-2 pl-1">
            {currentList.items.map((it, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-xs leading-relaxed">
                <span className={`font-black mt-0.5 shrink-0 ${isUser ? 'text-slate-900' : 'text-emerald-400'}`}>•</span>
                <span className="flex-1">{formatInline(it, isUser)}</span>
              </li>
            ))}
          </ul>
        );
      } else {
        blocks.push(
          <ol key={`ol-${blocks.length}`} className="space-y-1.5 my-2 pl-1">
            {currentList.items.map((it, idx) => {
              const num = typeof it === 'object' && it.num ? it.num : idx + 1;
              const text = typeof it === 'object' && it.text ? it.text : it;
              return (
                <li key={idx} className="flex items-start space-x-2 text-xs leading-relaxed">
                  <span className={`font-bold shrink-0 ${isUser ? 'text-slate-900' : 'text-emerald-400'}`}>{num}.</span>
                  <span className="flex-1">{formatInline(text, isUser)}</span>
                </li>
              );
            })}
          </ol>
        );
      }
      currentList = null;
    }
  };

  rawLines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      blocks.push(<div key={`blank-${lineIdx}`} className="h-2" />);
      return;
    }

    // Headers
    const headerMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headerMatch) {
      flushList();
      runningOlNumber = 0; // reset list counter for new section
      const level = headerMatch[1].length;
      const text = headerMatch[2];
      blocks.push(
        <div
          key={`h-${lineIdx}`}
          className={`font-black tracking-wide mt-2.5 mb-1 ${
            isUser ? 'text-slate-950' : 'text-emerald-400'
          } ${level === 1 ? 'text-sm' : 'text-xs'}`}
        >
          {formatInline(text, isUser)}
        </div>
      );
      return;
    }

    // Unordered lists (* or -)
    const ulMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (ulMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(ulMatch[1]);
      return;
    }

    // Ordered lists (1. , 2. )
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      const explicitNum = parseInt(olMatch[1], 10);
      if (explicitNum > runningOlNumber) {
        runningOlNumber = explicitNum;
      } else {
        runningOlNumber += 1;
      }

      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push({ num: runningOlNumber, text: olMatch[2] });
      return;
    }

    flushList();
    blocks.push(
      <p key={`p-${lineIdx}`} className="my-1 leading-relaxed">
        {formatInline(line, isUser)}
      </p>
    );
  });

  flushList();

  return <div className="space-y-0.5">{blocks}</div>;
}

export default function CoachChat({ profile, selectedDate }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isJarvisMode, setIsJarvisMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('agy_jarvis_voice_mode') === 'true';
    }
    return false;
  });
  const [voicePersona, setVoicePersona] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('agy_jarvis_voice_persona') || 'jarvis';
    }
    return 'jarvis';
  });
  const [isVoiceMenuOpen, setIsVoiceMenuOpen] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const capturedSpeechRef = useRef('');
  const isListeningRef = useRef(false);
  const isJarvisModeRef = useRef(isJarvisMode);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const silenceTimeoutRef = useRef(null);

  useEffect(() => {
    isJarvisModeRef.current = isJarvisMode;
  }, [isJarvisMode]);

  // Available Voice Personas
  const VOICE_PERSONAS = [
    { id: 'jarvis', label: 'Jarvis (British AI)', flag: '🇬🇧', desc: 'Paul Bettany style British butler' },
    { id: 'titan', label: 'Titan (US Athletic Coach)', flag: '🇺🇸', desc: 'Deep, commanding athletic tone' },
    { id: 'nova', label: 'Nova (Studio AI)', flag: '⚡', desc: 'Futuristic crisp digital assistant' },
    { id: 'aria', label: 'Aria (Natural Female)', flag: '🌸', desc: 'Smooth, friendly conversational tone' }
  ];

  // Load and cache SpeechSynthesis voices
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        setAvailableVoices(window.speechSynthesis.getVoices());
      }
    };
    updateVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const getVoiceForPersona = (persona) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const all = window.speechSynthesis.getVoices();
    if (!all || all.length === 0) return null;

    if (persona === 'jarvis') {
      // Prioritize natural British male voices (Ryan, George, Oliver, Google UK English Male)
      const britishMale = all.find(v => 
        (v.name.includes('Ryan') || v.name.includes('George') || v.name.includes('Oliver') || v.name.toLowerCase().includes('google uk english male')) && 
        !v.name.includes('Female')
      ) || all.find(v => (v.lang === 'en-GB' || v.lang.startsWith('en-GB')) && !v.name.includes('Female'))
        || all.find(v => (v.name.includes('Guy') || v.name.includes('David') || v.name.includes('Christopher')) && !v.name.includes('Female'))
        || all.find(v => v.lang.startsWith('en') && !v.name.includes('Heera'));
      return britishMale || all[0];
    }
    if (persona === 'titan') {
      const titan = all.find(v => 
        (v.name.includes('Christopher') || v.name.includes('Guy') || v.name.toLowerCase().includes('google us english') || v.name.includes('David')) &&
        !v.name.includes('Female')
      ) || all.find(v => v.lang === 'en-US' && !v.name.includes('Female'))
        || all.find(v => v.lang.startsWith('en'));
      return titan || all[0];
    }
    if (persona === 'aria') {
      const female = all.find(v => 
        (v.name.includes('Sonia') || v.name.includes('Jenny') || v.name.includes('Zira') || v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('google uk english female'))
      ) || all.find(v => (v.lang === 'en-GB' || v.lang === 'en-US') && v.name.includes('Female'))
        || all.find(v => v.lang.startsWith('en'));
      return female || all[0];
    }
    // 'nova' (Modern crisp AI studio)
    const studio = all.find(v => v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('google'))
      || all.find(v => v.lang.startsWith('en') && !v.name.includes('Heera'))
      || all[0];
    return studio;
  };

  const handleSelectPersona = (id) => {
    setVoicePersona(id);
    localStorage.setItem('agy_jarvis_voice_persona', id);
    setIsVoiceMenuOpen(false);
    previewVoice(id);
  };

  const previewVoice = (personaId) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const voice = getVoiceForPersona(personaId);
    const sample = personaId === 'jarvis' 
      ? "Jarvis online. All systems calibrated, Gokul."
      : personaId === 'titan'
        ? "Titan ready. Let's conquer the iron today."
        : personaId === 'aria'
          ? "Hello Gokul! How is your nutrition going today?"
          : "Nova activated. Ready to assist your bio-tracking.";

    const utt = new SpeechSynthesisUtterance(sample);
    if (voice) {
      utt.voice = voice;
      utt.lang = voice.lang;
    }
    if (personaId === 'jarvis') {
      utt.pitch = 0.92;
      utt.rate = 1.02;
    } else if (personaId === 'titan') {
      utt.pitch = 0.88;
      utt.rate = 1.05;
    } else {
      utt.pitch = 1.0;
      utt.rate = 1.04;
    }
    window.speechSynthesis.speak(utt);
  };

  const loadHistory = async () => {
    try {
      const res = await api.getChatHistory();
      setMessages(res.chatHistory || []);
    } catch (err) {
      console.error('Error fetching chat history:', err);
    }
  };

  useEffect(() => {
    loadHistory();
    const handleUpdate = () => loadHistory();
    const handleJarvisSync = (e) => {
      if (e?.detail?.isActive !== undefined) {
        setIsJarvisMode(e.detail.isActive);
        isJarvisModeRef.current = e.detail.isActive;
      }
    };
    window.addEventListener('agy-coach-chat-updated', handleUpdate);
    window.addEventListener('agy-jarvis-state-sync', handleJarvisSync);
    return () => {
      window.removeEventListener('agy-coach-chat-updated', handleUpdate);
      window.removeEventListener('agy-jarvis-state-sync', handleJarvisSync);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMsgId(null);
    }
  };

  const speakText = (text, msgId = null, autoListenAfter = false) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    // Clean markdown for natural spoken English
    const cleanSpeech = text
      .replace(/[*#`_~>]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/•/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanSpeech) return;

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    const voice = getVoiceForPersona(voicePersona);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }

    if (voicePersona === 'jarvis') {
      utterance.pitch = 0.92;
      utterance.rate = 1.02;
    } else if (voicePersona === 'titan') {
      utterance.pitch = 0.88;
      utterance.rate = 1.05;
    } else {
      utterance.pitch = 1.0;
      utterance.rate = 1.03;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      if (msgId) setSpeakingMsgId(msgId);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMsgId(null);
      if (autoListenAfter && isJarvisModeRef.current) {
        setTimeout(() => {
          startListeningSession();
        }, 400);
      }
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingMsgId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const cleanupAudio = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      } catch {}
      mediaStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
  };

  const toggleJarvisMode = () => {
    const next = !isJarvisMode;
    setIsJarvisMode(next);
    isJarvisModeRef.current = next;
    localStorage.setItem('agy_jarvis_voice_mode', String(next));
    window.dispatchEvent(new CustomEvent('agy-jarvis-external-toggle', { detail: { isActive: next, persona: voicePersona } }));
    if (next) {
      speakText("Jarvis Mode Activated. All systems are online and dedicated to you, sir. Ask me anything—science, tech, daily tasks, or fitness.", null, true);
    } else {
      stopSpeaking();
      stopListening();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Guaranteed Dual-Engine Speech & Hardware Headset Recording (PC & Mobile compatible)
  const startListeningSession = async () => {
    if (isListeningRef.current) return;

    audioChunksRef.current = [];
    capturedSpeechRef.current = '';

    // Step 1: Open hardware microphone / headset stream
    let stream = null;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        mediaStreamRef.current = stream;

        // Background hardware recorder for guaranteed headset audio capture on PC
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
        recorder.start(100);
      }
    } catch (micErr) {
      console.warn('Microphone permission check failed:', micErr);
      if (micErr.name === 'NotAllowedError' || micErr.name === 'PermissionDeniedError') {
        if (typeof window !== 'undefined' && window.showToast) {
          window.showToast('Please click the lock or camera icon in your browser address bar and allow Microphone access.', 'warning', 'Mic Blocked');
        }
        setIsListening(false);
        isListeningRef.current = false;
        return;
      }
    }

    setIsListening(true);
    isListeningRef.current = true;

    // Step 2: Attach Web Speech API
    const SpeechRec = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    if (SpeechRec) {
      try {
        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch {}
        }

        const recognition = new SpeechRec();
        recognition.lang = 'en-IN'; // Indian English natively handles Tamil & South Indian speech
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          capturedSpeechRef.current = transcript;
          setInputText(transcript);

          // Reset silence timer: auto-send after 1.8s pause when speaking in Jarvis mode
          if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
          if (isJarvisModeRef.current) {
            silenceTimeoutRef.current = setTimeout(() => {
              finishListeningAndSend();
            }, 1800);
          }
        };

        recognition.onerror = (e) => {
          console.warn('Speech recognition notice:', e.error);
        };

        recognition.onend = () => {
          // If still listening and user was speaking, finish and send
          if (isListeningRef.current && capturedSpeechRef.current.trim().length > 1) {
            finishListeningAndSend();
          } else if (isListeningRef.current) {
            try { recognition.start(); } catch {}
          }
        };

        recognitionRef.current = recognition;
        try { recognition.start(); } catch {}
      } catch (err) {
        console.warn('Speech recognition setup notice:', err);
      }
    }
  };

  const finishListeningAndSend = async () => {
    if (!isListeningRef.current) return;
    setIsListening(false);
    isListeningRef.current = false;

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }

    const captured = capturedSpeechRef.current.trim() || inputText.trim();

    // 1. Direct Web Speech words
    if (captured.length > 1) {
      cleanupAudio();
      capturedSpeechRef.current = '';
      setInputText('');
      handleSend(captured);
      return;
    }

    // 2. Headset MediaRecorder audio upload fallback (Zero-fail on desktop PC)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      const recorder = mediaRecorderRef.current;
      recorder.onstop = async () => {
        const mime = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mime });
        cleanupAudio();

        if (audioBlob.size > 2000) {
          try {
            setInputText('Transcribing headset audio...');
            const res = await api.universalVoiceAudio(audioBlob, selectedDate);
            if (res.success && res.transcribedText) {
              setInputText('');
              handleSend(res.transcribedText);
            } else {
              setInputText('');
              if (typeof window !== 'undefined' && window.showToast) {
                const isLeaked = /leaked|403|forbidden/i.test(res.error || '');
                const cleanError = isLeaked
                  ? 'Your Gemini API key was reported as leaked by Google. Please enter a fresh free key in Settings, or speak via browser recognition.'
                  : (res.error || 'Could not detect clear words. Please try speaking closer to your microphone.');
                window.showToast(cleanError, 'warning', isLeaked ? 'Gemini API Key Notice' : 'No Speech Detected');
              }
            }
          } catch (e) {
            setInputText('');
          }
        } else {
          setInputText('');
        }
      };

      try { recorder.stop(); } catch { cleanupAudio(); }
      return;
    }

    cleanupAudio();
  };

  const stopListening = () => {
    setIsListening(false);
    isListeningRef.current = false;
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    cleanupAudio();
  };

  const toggleMic = () => {
    if (isListening || isListeningRef.current) {
      finishListeningAndSend();
    } else {
      startListeningSession();
    }
  };

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || isSending) return;

    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      setIsListening(false);
    }

    // Optimistic user bubble
    const userMsg = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsSending(true);

    try {
      const res = await api.sendCoachMessage(text);
      if (res.success && res.message) {
        setMessages(prev => [...prev, res.message]);
        speakText(res.message.text, res.message.id, isJarvisMode);
      }
    } catch (err) {
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('Error contacting coach: ' + err.message, 'error', 'Coach Error');
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirmClearHistory = async () => {
    try {
      await api.clearChatHistory();
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear chat:', err);
    } finally {
      setIsConfirmClearOpen(false);
    }
  };

  const quickPrompts = [
    'What are we doing right now?',
    'Yo Yo Jarvis what are you doing',
    'Explain quantum computing in simple terms',
    'Suggest a high-protein South Indian dinner under 450 kcal',
    'How do I swap a meal in my South Indian diet plan?'
  ];

  return (
    <div className="space-y-3 pb-20 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-500/20 shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center space-x-1.5">
              <span>JARVIS Autonomous Personal Assistant</span>
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            </h2>
            <p className="text-[10px] sm:text-[11px] text-slate-400">
              Autonomous General Intelligence • Science, Programming, Life & Physical Conditioning
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* JARVIS TWO-WAY VOICE TOGGLE */}
          <button
            onClick={toggleJarvisMode}
            className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center space-x-1.5 transition-all shadow-md cursor-pointer ${
              isJarvisMode 
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white border-cyan-400 shadow-cyan-500/30 animate-pulse' 
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-cyan-500/50 hover:text-cyan-300'
            }`}
            title="Toggle Continuous Hands-Free Two-Way Voice (Jarvis Mode)"
          >
            {isSpeaking ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-cyan-200 animate-bounce" />
                <span className="hidden sm:inline">Speaking...</span>
              </>
            ) : isJarvisMode ? (
              <>
                <Radio className="w-3.5 h-3.5 text-yellow-300" />
                <span>Jarvis Voice Active</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Jarvis Hands-Free</span>
              </>
            )}
          </button>

          {/* VOICE PERSONA SELECTOR */}
          <div className="relative">
            <button
              onClick={() => setIsVoiceMenuOpen(!isVoiceMenuOpen)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-all"
              title="Change Voice Persona"
            >
              <Headphones className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">
                {VOICE_PERSONAS.find(p => p.id === voicePersona)?.flag} {VOICE_PERSONAS.find(p => p.id === voicePersona)?.label.split(' ')[0]}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isVoiceMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 space-y-1">
                <div className="text-[10px] uppercase tracking-wider font-black text-slate-400 px-2 py-1 flex justify-between items-center">
                  <span>Voice Persona</span>
                  <span className="text-cyan-400">Natural Audio</span>
                </div>
                {VOICE_PERSONAS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPersona(p.id)}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-all ${
                      voicePersona === p.id 
                        ? 'bg-cyan-950/60 text-cyan-200 border border-cyan-800/60' 
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold flex items-center space-x-1.5">
                        <span>{p.flag}</span>
                        <span>{p.label}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">{p.desc}</div>
                    </div>
                    {voicePersona === p.id && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="p-1.5 bg-red-950/60 border border-red-500/50 text-red-300 rounded-xl text-xs font-bold hover:bg-red-900/60 transition-all cursor-pointer"
              title="Stop Speaking"
            >
              <VolumeX className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={loadHistory}
            className="p-2 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Refresh Conversation"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsConfirmClearOpen(true)}
            className="p-2 text-rose-400 hover:text-rose-300 bg-slate-950 border border-slate-800 hover:border-rose-500/40 rounded-xl transition-colors cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl h-[48vh] sm:h-[52vh] overflow-y-auto space-y-4 flex flex-col">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center my-auto p-4 text-center space-y-3.5 max-w-md mx-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="relative">
              <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-xl shadow-emerald-500/25">
                <Bot className="w-8 h-8" />
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 bg-slate-900 rounded-full border border-slate-800">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-white">
                Greetings, {profile?.name || 'sir'}!
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                I am JARVIS, your dedicated autonomous personal AI assistant. Ask me anything across any domain—science, technology, programming, daily planning, or health optimization.
              </p>
            </div>

            {/* Target Snapshot Badges */}
            <div className="grid grid-cols-3 gap-2 w-full pt-1">
              <div className="bg-slate-950/70 border border-slate-800/80 p-2 rounded-2xl">
                <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center justify-center space-x-1">
                  <Flame className="w-3 h-3 text-emerald-400" />
                  <span>Target</span>
                </div>
                <div className="text-xs font-black text-white mt-0.5">{profile?.dailyTargetCalories || 2000} kcal</div>
              </div>
              <div className="bg-slate-950/70 border border-slate-800/80 p-2 rounded-2xl">
                <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center justify-center space-x-1">
                  <Dumbbell className="w-3 h-3 text-sky-400" />
                  <span>Protein</span>
                </div>
                <div className="text-xs font-black text-sky-300 mt-0.5">{profile?.dailyTargetProtein || 130}g</div>
              </div>
              <div className="bg-slate-950/70 border border-slate-800/80 p-2 rounded-2xl">
                <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center justify-center space-x-1">
                  <Watch className="w-3 h-3 text-teal-400" />
                  <span>Steps</span>
                </div>
                <div className="text-xs font-black text-teal-300 mt-0.5">{(profile?.dailyTargetSteps || 10000).toLocaleString()}</div>
              </div>
            </div>

            <p className="text-[11px] text-emerald-400 font-medium">
              💡 Tap a suggestion below or tap the mic to speak your query!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-2.5 max-w-[85%] ${
                  isUser ? 'ml-auto flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                    isUser
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-emerald-400 border border-slate-700'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`p-3.5 sm:p-4 rounded-2xl text-xs leading-relaxed ${
                    isUser
                      ? 'bg-emerald-500 text-slate-950 font-medium rounded-tr-none'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                  }`}
                >
                  <FormattedMessage content={msg.text} isUser={isUser} />
                  <div
                    className={`text-[9px] mt-2 pt-1 border-t flex items-center justify-between ${
                      isUser ? 'text-slate-900/70 border-emerald-600/30 text-right' : 'text-slate-500 border-slate-900'
                    }`}
                  >
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {!isUser && msg.source && ` • ${msg.source}`}
                    </span>

                    {!isUser && (
                      <button
                        onClick={() => speakingMsgId === msg.id ? stopSpeaking() : speakText(msg.text, msg.id, false)}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 cursor-pointer transition-colors ml-3"
                        title="Listen to this response"
                      >
                        {speakingMsgId === msg.id ? (
                          <>
                            <VolumeX className="w-3 h-3 text-red-400" />
                            <span className="text-red-400">Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {isSending && (
          <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-slate-950/60 p-3 rounded-2xl border border-slate-800 w-fit">
            <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Analyzing your macros & workouts...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Live Jarvis / Voice Listening Indicator Banner */}
      {(isListening || isSpeaking || isJarvisMode) && (
        <div className="flex items-center justify-between px-3 py-2 bg-slate-950/90 border border-cyan-500/40 rounded-xl text-xs shadow-md shadow-cyan-950/30">
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isSpeaking ? 'bg-emerald-400 animate-bounce' : isListening ? 'bg-cyan-400 animate-ping' : 'bg-cyan-600'}`} />
            <span className="font-bold text-cyan-300">
              {isSpeaking ? '🔊 Jarvis is Speaking...' : isListening ? '🎙️ Jarvis is Listening (Speak now through your headset)' : '⚡ Jarvis Mode Active (Continuous Speech Loop)'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {isListening && (
              <button
                type="button"
                onClick={finishListeningAndSend}
                className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[11px] rounded-lg cursor-pointer transition-all"
              >
                Send Query
              </button>
            )}
            {isSpeaking && (
              <button
                type="button"
                onClick={stopSpeaking}
                className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-[11px] rounded-lg cursor-pointer transition-all"
              >
                Stop Voice
              </button>
            )}
          </div>
        </div>
      )}

      {/* Suggested Quick Questions: Sleek Horizontal Ribbon (Never pushes typing box down) */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar whitespace-nowrap">
        {quickPrompts.map((q) => (
          <button
            key={q}
            onClick={() => handleSend(q)}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 rounded-full text-[11px] text-slate-300 transition-all shrink-0 cursor-pointer shadow-sm active:scale-95"
          >
            💬 {q}
          </button>
        ))}
      </div>

      {/* Input Box with Voice Mic Button */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-2 rounded-2xl shadow-xl"
      >
        <button
          type="button"
          onClick={toggleMic}
          className={`p-2.5 rounded-xl transition-all cursor-pointer shrink-0 ${
            isListening
              ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30'
              : 'bg-slate-950 text-slate-400 hover:text-emerald-400 border border-slate-800'
          }`}
          title={isListening ? 'Listening... Tap to stop' : 'Speak your query'}
        >
          {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isListening ? 'Listening to your voice...' : 'Ask JARVIS anything — coding, science, daily tasks, life, or fitness...'}
          className="flex-1 bg-transparent px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="p-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 rounded-xl transition-all font-bold shadow-md shadow-emerald-500/20 cursor-pointer shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Sleek Dark Confirmation Modal for Clearing Coach Chat */}
      <ConfirmModal
        isOpen={isConfirmClearOpen}
        onClose={() => setIsConfirmClearOpen(false)}
        onConfirm={handleConfirmClearHistory}
        title="Clear AI Coach Conversation?"
        message="This will delete your current coach chat history. You can start a fresh conversation anytime."
        confirmText="Yes, Clear History"
        cancelText="Cancel"
        danger={true}
      />

    </div>
  );
}
