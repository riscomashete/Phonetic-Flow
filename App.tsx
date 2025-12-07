import React, { useState, useEffect } from 'react';
import { TranscriptionHistoryItem } from './types';
import { getPhoneticTranscription } from './services/geminiService';
import { IPAChart } from './components/IPAChart';
import { 
  Volume2, 
  Copy, 
  ArrowRight, 
  History, 
  Trash2, 
  Sparkles,
  Check,
  Settings,
  Key,
  Info
} from 'lucide-react';

function App() {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<{ uk: string; us: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<TranscriptionHistoryItem[]>([]);
  const [copiedRegion, setCopiedRegion] = useState<'uk' | 'us' | null>(null);
  
  // Settings / API Key State
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    // Check for existing key on mount
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      setHasKey(true);
    }
  }, []);

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      setHasKey(true);
      setShowSettings(false);
      // Reload to ensure service picks up new key (or we could make service reactive, but this is simpler)
      window.location.reload(); 
    } else {
      localStorage.removeItem('gemini_api_key');
      setHasKey(false);
      setApiKey('');
      window.location.reload();
    }
  };

  const handleTranscribe = async () => {
    if (!inputText.trim()) return;
    
    setIsLoading(true);
    setResult(null); // Clear previous
    
    const transcription = await getPhoneticTranscription(inputText);
    
    setResult(transcription);
    setIsLoading(false);

    // Add to history
    const newItem: TranscriptionHistoryItem = {
      id: Date.now().toString(),
      original: inputText,
      transcription: transcription,
      timestamp: Date.now()
    };
    setHistory(prev => [newItem, ...prev].slice(0, 10)); // Keep last 10
  };

  const handleCopy = (text: string, region: 'uk' | 'us') => {
    if (!text) return;
    navigator.clipboard.writeText(`/${text}/`);
    setCopiedRegion(region);
    setTimeout(() => setCopiedRegion(null), 2000);
  };

  const handleSpeak = (text: string, lang: 'en-GB' | 'en-US') => {
    if ('speechSynthesis' in window) {
      // Cancel current speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(inputText); // Speak original text with accent
      utterance.lang = lang;
      
      // Attempt to find a matching voice for better quality
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang === lang && v.localService) || 
                             voices.find(v => v.lang === lang);
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      window.speechSynthesis.speak(utterance);
    }
  };

  const restoreHistoryItem = (item: TranscriptionHistoryItem) => {
    setInputText(item.original);
    setResult(item.transcription);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      
      {/* Header */}
      <header className="w-full bg-white border-b border-slate-200 py-4 shadow-sm z-20 sticky top-0">
        <div className="w-full max-w-[1800px] mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <span className="font-serif italic font-bold text-xl">ə</span>
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Phonetic Flow</h1>
          </div>
          
          <button 
            onClick={() => setShowSettings(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              hasKey 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }`}
          >
            {hasKey ? (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Live AI Active</span>
              </>
            ) : (
              <>
                <Info className="w-3.5 h-3.5" />
                <span>Demo Mode</span>
              </>
            )}
            <Settings className="w-3.5 h-3.5 ml-1 opacity-50" />
          </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 w-full max-w-[1800px] mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left Column: Converter Interface */}
        <div className="flex flex-col space-y-6 lg:sticky lg:top-24">
          
          {/* Intro */}
          <div className="text-center lg:text-left space-y-2 mb-2">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
              English to <span className="text-indigo-600">IPA</span>
            </h2>
            <p className="text-slate-500 text-lg">
              Get accurate British (RP) and American (GenAm) phonetic transcriptions.
            </p>
          </div>

          {/* Input Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 overflow-hidden border border-slate-100">
            <div className="p-6">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Input Text
              </label>
              <div className="relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type English text here..."
                  className="w-full text-lg md:text-xl p-4 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none h-32 transition-all placeholder:text-slate-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleTranscribe();
                    }
                  }}
                />
              </div>

              <div className="mt-4 flex justify-between items-center">
                 {!hasKey && (
                   <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md hidden sm:inline-block">
                     Demo Mode: AI features limited
                   </span>
                 )}
                <button
                  onClick={handleTranscribe}
                  disabled={isLoading || !inputText.trim()}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 ml-auto"
                >
                  {isLoading ? (
                    <>
                      <Sparkles className="w-5 h-5 animate-spin" />
                      <span>Transcribing...</span>
                    </>
                  ) : (
                    <>
                      <span>Convert</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Result Section */}
            <div className="bg-slate-900 text-white relative min-h-[160px] flex flex-col justify-center">
              {result ? (
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-700/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  
                  {/* UK Section */}
                  <div className="p-8 flex flex-col items-center space-y-4">
                     <div className="flex items-center gap-2 text-slate-400 text-sm font-mono uppercase tracking-widest">
                        <span className="text-lg">🇬🇧</span> United Kingdom
                     </div>
                     <div className="font-serif text-2xl md:text-3xl tracking-wide leading-relaxed text-center">
                        /{result.uk}/
                     </div>
                     <div className="flex gap-3 mt-2">
                        <button 
                          onClick={() => handleSpeak(inputText, 'en-GB')}
                          className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-indigo-300 hover:text-white transition-all"
                          title="Listen (UK)"
                        >
                          <Volume2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleCopy(result.uk, 'uk')}
                          className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-indigo-300 hover:text-white transition-all"
                          title="Copy IPA"
                        >
                          {copiedRegion === 'uk' ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                        </button>
                     </div>
                  </div>

                  {/* US Section */}
                  <div className="p-8 flex flex-col items-center space-y-4 bg-slate-900/50">
                     <div className="flex items-center gap-2 text-slate-400 text-sm font-mono uppercase tracking-widest">
                        <span className="text-lg">🇺🇸</span> United States
                     </div>
                     <div className="font-serif text-2xl md:text-3xl tracking-wide leading