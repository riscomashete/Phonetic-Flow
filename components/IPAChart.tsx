import React, { useState, useRef } from 'react';
import { X, Sparkles, Volume2, Activity } from 'lucide-react';
import { explainIPASymbol, generateSymbolAudio } from '../services/geminiService';

const VOWELS = [
  { symbol: 'iː', example: 'see' },
  { symbol: 'ɪ', example: 'sit' },
  { symbol: 'ʊ', example: 'good' },
  { symbol: 'uː', example: 'food' },
  { symbol: 'e', example: 'bed' },
  { symbol: 'ə', example: 'teacher' },
  { symbol: 'ɜː', example: 'bird' },
  { symbol: 'ɔː', example: 'door' },
  { symbol: 'æ', example: 'cat' },
  { symbol: 'ʌ', example: 'up' },
  { symbol: 'ɑː', example: 'far' },
  { symbol: 'ɒ', example: 'on' },
];

const DIPHTHONGS = [
  { symbol: 'ɪə', example: 'here' },
  { symbol: 'eɪ', example: 'wait' },
  { symbol: 'ʊə', example: 'tour' },
  { symbol: 'ɔɪ', example: 'boy' },
  { symbol: 'əʊ', example: 'show' },
  { symbol: 'eə', example: 'hair' },
  { symbol: 'aɪ', example: 'my' },
  { symbol: 'aʊ', example: 'cow' },
];

const CONSONANTS = [
  { symbol: 'p', example: 'pea' },
  { symbol: 'b', example: 'boat' },
  { symbol: 't', example: 'tea' },
  { symbol: 'd', example: 'dog' },
  { symbol: 'tʃ', example: 'cheese' },
  { symbol: 'dʒ', example: 'june' },
  { symbol: 'k', example: 'car' },
  { symbol: 'g', example: 'go' },
  { symbol: 'f', example: 'fly' },
  { symbol: 'v', example: 'video' },
  { symbol: 'θ', example: 'think' },
  { symbol: 'ð', example: 'this' },
  { symbol: 's', example: 'see' },
  { symbol: 'z', example: 'zoo' },
  { symbol: 'ʃ', example: 'shall' },
  { symbol: 'ʒ', example: 'vision' },
  { symbol: 'm', example: 'man' },
  { symbol: 'n', example: 'now' },
  { symbol: 'ŋ', example: 'sing' },
  { symbol: 'h', example: 'hat' },
  { symbol: 'l', example: 'love' },
  { symbol: 'r', example: 'red' },
  { symbol: 'w', example: 'wet' },
  { symbol: 'j', example: 'yes' },
];

interface TutorialData {
  name: string;
  category: string;
  howToProduce: string;
  mouthShape: 'rounded' | 'spread' | 'neutral';
  voicing: 'voiced' | 'voiceless';
  examples: {
    initial: string;
    medial: string;
    final: string;
  };
}

// Helper: Decode base64 to byte array
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper: Create AudioBuffer from raw PCM (16-bit, 24kHz default for Gemini TTS)
function createAudioBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): AudioBuffer {
  // Calculate frame count based on byte length and format (16-bit = 2 bytes)
  const frameCount = Math.floor(data.byteLength / (2 * numChannels));
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  
  // Use DataView to ensure Little Endian reading of the 16-bit integers
  const dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Calculate byte offset for this sample
      const offset = (i * numChannels + channel) * 2;
      // Read Int16, normalize to float [-1.0, 1.0]
      const sample = dataView.getInt16(offset, true); // true = Little Endian
      channelData[i] = sample < 0 ? sample / 32768 : sample / 32767;
    }
  }
  return buffer;
}

const MouthVisualizer: React.FC<{ 
  shape: 'rounded' | 'spread' | 'neutral'; 
  voicing: 'voiced' | 'voiceless'; 
  isAnimating: boolean; 
}> = ({ shape, voicing, isAnimating }) => {
  
  // Inner Mouth (Dark Void) Path
  const getInteriorPath = () => {
    if (!isAnimating) return "M 30,55 Q 50,55 70,55 Q 50,55 30,55"; // Closed Line

    switch (shape) {
      case 'rounded': // Circle
        return "M 40,40 Q 50,30 60,40 Q 70,50 60,60 Q 50,70 40,60 Q 30,50 40,40";
      case 'spread': // Wide Smile
        return "M 25,48 Q 50,42 75,48 Q 75,60 50,60 Q 25,60 25,48";
      case 'neutral': // Tall Oval (Ah)
      default:
        return "M 32,45 Q 50,35 68,45 Q 72,55 68,68 Q 50,78 32,68 Q 28,55 32,45";
    }
  };

  // Tongue Path (Pink)
  const getTonguePath = () => {
    if (!isAnimating) return ""; // Hidden when closed

    switch (shape) {
      case 'rounded': // Small hump at bottom
        return "M 42,56 Q 50,52 58,56 Q 56,62 50,64 Q 44,62 42,56";
      case 'spread': // Wide flat tongue
        return "M 30,55 Q 50,52 70,55 Q 65,58 50,58 Q 35,58 30,55";
      case 'neutral': // Big tongue visible at bottom
        return "M 36,62 Q 50,55 64,62 Q 60,70 50,72 Q 40,70 36,62";
      default:
        return "";
    }
  };

  // Teeth Path (White)
  const getTeethPath = () => {
    if (!isAnimating) return "";

    switch (shape) {
      case 'rounded': 
        return "M 42,42 Q 50,42 58,42 Q 56,48 50,48 Q 44,48 42,42";
      case 'spread': // Prominent top teeth
        return "M 30,48 Q 50,48 70,48 Q 68,54 50,54 Q 32,54 30,48";
      case 'neutral':
        return "M 36,44 Q 50,44 64,44 Q 60,50 50,50 Q 40,50 36,44";
      default:
        return "";
    }
  };

  return (
    <div className="relative w-48 h-48 bg-orange-50 rounded-full border-4 border-orange-100 flex items-center justify-center overflow-hidden shadow-inner">
      {/* Background/Skin Tone */}
      
      {/* Voicing Glow Indicator (Throat) */}
      <div className={`absolute w-full h-full rounded-full transition-all duration-300 ${
        isAnimating && voicing === 'voiced' ? 'bg-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.4)]' : 'bg-transparent'
      }`}></div>

      <svg viewBox="0 0 100 100" className="w-full h-full transform scale-110">
        
        {/* Mouth Interior (Dark) */}
        <path 
          d={getInteriorPath()} 
          fill="#450a0a" // Dark red/black
          className="transition-all duration-300 ease-in-out"
        />

        {/* Tongue (Pink/Red) */}
        <path 
          d={getTonguePath()} 
          fill="#fb7185" // Rose-400
          className="transition-all duration-300 ease-in-out"
        />

        {/* Teeth (White) */}
        <path 
          d={getTeethPath()} 
          fill="#ffffff" 
          className="transition-all duration-300 ease-in-out"
        />

        {/* Lips (Stroke) */}
        <path 
          d={getInteriorPath()} 
          fill="none" 
          stroke="#ef4444" // Red-500
          strokeWidth={isAnimating ? "6" : "4"}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-300 ease-in-out"
        />

        {/* Lip Shine (Highlight) */}
        <path 
          d={getInteriorPath()} 
          fill="none" 
          stroke="white" 
          strokeWidth="2"
          strokeDasharray="5, 15"
          strokeOpacity="0.4"
          className="transition-all duration-300 ease-in-out"
        />

      </svg>
      
      {/* Labels */}
      <div className="absolute top-4 text-[10px] text-orange-300 font-bold uppercase tracking-wider">
        {isAnimating ? shape : 'Rest'}
      </div>
      <div className={`absolute bottom-4 text-[10px] font-bold uppercase tracking-wider transition-colors ${
        isAnimating && voicing === 'voiced' ? 'text-red-500' : 'text-orange-300'
      }`}>
        {voicing}
      </div>
    </div>
  );
};


export const IPAChart: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [tutorial, setTutorial] = useState<TutorialData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Audio Cache: Stores Promise of base64 string
  const audioCache = useRef<Map<string, Promise<string | null>>>(new Map());

  const handleSymbolClick = async (symbol: string) => {
    setSelectedSymbol(symbol);
    setLoading(true);
    setTutorial(null);
    setIsAnimating(false);
    
    // Pre-fetch audio immediately when symbol is clicked
    if (!audioCache.current.has(symbol)) {
      audioCache.current.set(symbol, generateSymbolAudio(symbol));
    }
    
    const data = await explainIPASymbol(symbol);
    setTutorial(data);
    setLoading(false);
  };

  const closeModal = () => {
    setSelectedSymbol(null);
    setTutorial(null);
    setIsAnimating(false);
  };

  const playSymbol = async () => {
    if (!selectedSymbol) return;
    setIsAnimating(true);
    window.speechSynthesis.cancel();
    
    try {
      // Check cache first
      let audioPromise = audioCache.current.get(selectedSymbol);
      
      // If not in cache (fallback), fetch it
      if (!audioPromise) {
        audioPromise = generateSymbolAudio(selectedSymbol);
        audioCache.current.set(selectedSymbol, audioPromise);
      }

      const base64Audio = await audioPromise;
      
      if (base64Audio) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        // Do not force sampleRate; let the browser/OS decide (usually 44.1k or 48k)
        // This prevents errors on devices that don't support specific rates.
        const audioContext = new AudioContextClass();
        
        const bytes = decodeBase64(base64Audio);
        // Explicitly pass 24000 as the source sample rate from Gemini
        const buffer = createAudioBuffer(bytes, audioContext, 24000);
        
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.onended = () => {
            setIsAnimating(false);
            audioContext.close(); // Clean up context to free resources
        };
        source.start(0);
      } else {
        // Fallback: Use synthesis but just the symbol
        console.warn("AI TTS failed, using fallback");
        const utterance = new SpeechSynthesisUtterance(selectedSymbol);
        utterance.lang = 'en-GB';
        utterance.rate = 0.8; 
        utterance.onend = () => setIsAnimating(false);
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
       console.error("Playback failed", error);
       setIsAnimating(false);
    }
  };

  const playWord = (word: string) => {
    if (!word || word === '-') return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-GB';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="p-6 md:p-8 h-full flex flex-col">
      <div className="text-center mb-8 shrink-0">
        <h2 className="text-2xl font-bold text-slate-900">IPA Reference Chart</h2>
        <p className="text-slate-500">Click any symbol for a tutorial</p>
      </div>
      
      <div className="space-y-8 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {/* Vowels */}
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Vowels</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {VOWELS.map((item) => (
              <button 
                key={item.symbol}
                onClick={() => handleSymbolClick(item.symbol)}
                className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center hover:bg-indigo-600 hover:text-white hover:border-indigo-600 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group"
              >
                <span className="font-serif text-2xl font-medium group-hover:text-white">{item.symbol}</span>
                <span className="text-xs text-slate-500 mt-1 group-hover:text-indigo-200">{item.example}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Diphthongs */}
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Diphthongs</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {DIPHTHONGS.map((item) => (
              <button 
                key={item.symbol} 
                onClick={() => handleSymbolClick(item.symbol)}
                className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center hover:bg-emerald-600 hover:text-white hover:border-emerald-600 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group"
              >
                <span className="font-serif text-2xl font-medium group-hover:text-white">{item.symbol}</span>
                <span className="text-xs text-slate-500 mt-1 group-hover:text-emerald-200">{item.example}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Consonants */}
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Consonants</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {CONSONANTS.map((item) => (
              <button 
                key={item.symbol} 
                onClick={() => handleSymbolClick(item.symbol)}
                className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center hover:bg-amber-500 hover:text-white hover:border-amber-500 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group"
              >
                <span className="font-serif text-2xl font-medium group-hover:text-white">{item.symbol}</span>
                <span className="text-xs text-slate-500 mt-1 group-hover:text-amber-100">{item.example}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tutorial Modal Overlay */}
      {selectedSymbol && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200 rounded-2xl">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-3">
                 <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-serif text-2xl font-bold shadow-sm">
                   {selectedSymbol}
                 </div>
                 <div>
                   <h3 className="font-bold text-slate-800 text-lg">Symbol Tutorial</h3>
                   <p className="text-xs text-slate-500 uppercase tracking-wide">
                     {loading ? 'Analyzing...' : tutorial?.name || 'Phonetic Detail'}
                   </p>
                 </div>
               </div>
               <button 
                 onClick={closeModal}
                 className="p-2 bg-white hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors shadow-sm border border-slate-100"
               >
                 <X className="w-5 h-5" />
               </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Sparkles className="w-8 h-8 text-indigo-400 animate-spin" />
                  <p className="text-slate-500 text-sm font-medium">Generating phonetic lesson...</p>
                </div>
              ) : tutorial ? (
                <div className="space-y-6">
                  
                  {/* Top Section: Visuals and Description */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* SVG Animation */}
                    <div className="bg-slate-50 rounded-2xl p-6 flex flex-col items-center justify-center border border-slate-100">
                      <div className="flex items-center gap-2 mb-4">
                        <h4 className="font-semibold text-slate-700">Digital Guide</h4>
                      </div>
                      <MouthVisualizer 
                        shape={tutorial.mouthShape} 
                        voicing={tutorial.voicing} 
                        isAnimating={isAnimating} 
                      />
                      <div className="mt-4 flex flex-col gap-2 w-full">
                        <button
                          onClick={playSymbol}
                          disabled={isAnimating}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-all active:scale-95 disabled:opacity-50 text-sm font-medium"
                        >
                          {isAnimating ? <Activity className="w-4 h-4 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
                          <span>Listen & Simulate</span>
                        </button>
                      </div>
                    </div>

                    {/* How to produce (Moved here) */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col">
                      <h4 className="text-slate-900 font-semibold mb-3 flex items-center gap-2">
                         👄 Articulation Guide
                      </h4>
                      <p className="text-slate-600 text-sm leading-relaxed flex-1">
                        {tutorial.howToProduce}
                      </p>
                      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-slate-400 uppercase font-bold">Mouth Shape</span>
                          <p className="text-sm font-medium text-slate-800 capitalize">{tutorial.mouthShape}</p>
                        </div>
                        <div>
                          <span className="text-xs text-slate-400 uppercase font-bold">Voicing</span>
                          <p className={`text-sm font-medium capitalize ${tutorial.voicing === 'voiced' ? 'text-red-500' : 'text-slate-800'}`}>
                            {tutorial.voicing}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Positioning Examples */}
                  <div>
                    <h4 className="text-slate-800 font-semibold mb-3">Word Placement Examples</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Initial */}
                      <div className="flex flex-col p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-indigo-200 transition-all">
                        <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Start</span>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-slate-800">{tutorial.examples.initial}</span>
                          <button onClick={() => playWord(tutorial.examples.initial)} className="text-indigo-400 hover:text-indigo-600"><Volume2 className="w-4 h-4"/></button>
                        </div>
                      </div>
                      {/* Medial */}
                      <div className="flex flex-col p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-indigo-200 transition-all">
                        <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Middle</span>
                         <div className="flex justify-between items-center">
                          <span className="font-medium text-slate-800">{tutorial.examples.medial}</span>
                          <button onClick={() => playWord(tutorial.examples.medial)} className="text-indigo-400 hover:text-indigo-600"><Volume2 className="w-4 h-4"/></button>
                        </div>
                      </div>
                      {/* Final */}
                      <div className="flex flex-col p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-indigo-200 transition-all">
                        <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">End</span>
                         <div className="flex justify-between items-center">
                          <span className="font-medium text-slate-800">{tutorial.examples.final}</span>
                          <button onClick={() => playWord(tutorial.examples.final)} className="text-indigo-400 hover:text-indigo-600"><Volume2 className="w-4 h-4"/></button>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="text-center py-8 text-red-400">
                  <p>Failed to load tutorial.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {tutorial && !loading && (
               <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                 <p className="text-xs text-slate-400">Powered by Gemini AI</p>
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};