import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, User, Flame, Dumbbell, Watch, RefreshCw, Trash2 } from 'lucide-react';
import { api } from '../api';

// Markdown text & inline parser for rich AI Coach responses (bold, italics, lists, code)
function formatInline(str, isUser) {
  if (!str) return '';
  const tokens = [];
  const regex = /(\*\*(?:[^*]|\*(?!\*))+\*\*|`[^`]+`|(?<=\s|^|\()\*([^*]+)\*(?=\s|[.,!?:;)]|$)|(?<=\s|^|\()_([^_]+)_(?=\s|[.,!?:;)]|$))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(str.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
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
  const messagesEndRef = useRef(null);

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
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || isSending) return;

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
      }
    } catch (err) {
      alert('Error contacting coach: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Clear all AI Coach conversation history?')) return;
    try {
      await api.clearChatHistory();
      setMessages([]);
    } catch (err) {
      alert('Failed to clear chat: ' + err.message);
    }
  };

  const quickPrompts = [
    'Suggest a high-protein South Indian dinner under 450 kcal',
    'How do I swap a meal in my South Indian diet plan?',
    'What is a good South Indian pre-workout snack?',
    'I have 35g protein left to reach my goal. What are my quickest options?',
    'What are the best South Indian breakfast options with eggs?'
  ];

  return (
    <div className="space-y-4 pb-20 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-1.5">
              <span>AGY Fitness & Nutrition AI Coach</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            </h2>
            <p className="text-[11px] text-slate-400">
              Personalized for your 100% South Indian diet, Fastrack watch, and bio targets.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadHistory}
            className="p-2 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-xl transition-colors"
            title="Refresh Conversation"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleClearHistory}
            className="p-2 text-rose-400 hover:text-rose-300 bg-slate-950 border border-slate-800 hover:border-rose-500/40 rounded-xl transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl h-[58vh] overflow-y-auto space-y-4 flex flex-col">
        {messages.map((msg) => {
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
                className={`p-4 rounded-2xl text-xs leading-relaxed ${
                  isUser
                    ? 'bg-emerald-500 text-slate-950 font-medium rounded-tr-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                }`}
              >
                <FormattedMessage content={msg.text} isUser={isUser} />
                <div
                  className={`text-[9px] mt-2 pt-1 border-t ${
                    isUser ? 'text-slate-900/70 border-emerald-600/30 text-right' : 'text-slate-500 border-slate-900'
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {!isUser && msg.source && ` • ${msg.source}`}
                </div>
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-slate-950/60 p-3 rounded-2xl border border-slate-800 w-fit">
            <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Analyzing your macros & workouts...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Questions */}
      <div className="flex flex-wrap gap-2">
        {quickPrompts.map((q) => (
          <button
            key={q}
            onClick={() => handleSend(q)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-[11px] text-slate-300 transition-all text-left"
          >
            💬 {q}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-2 rounded-2xl shadow-xl"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask anything about South Indian foods, meal swaps, Fastrack burn, workout critique..."
          className="flex-1 bg-transparent px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="p-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 rounded-xl transition-all font-bold shadow-md shadow-emerald-500/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
