import React, { useState, useEffect } from 'react';
import { X, Sparkles, Volume2, Play, Activity } from 'lucide-react';
import { explainIPASymbol } from '../services/geminiService';

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

const MouthVisualizer: React.FC<{ 
  shape: 'rounded' | 'spread' | 'neutral'; 
  voicing: 'voiced' | 'voiceless'; 
  isAnimating: boolean; 
}> = ({ shape, voicing, isAnimating }) => {
  
  // Base scales for mouth shapes
  const getMouthPath = (state: 'rest' | 'active') => {
    if (state === 'rest') return "M 30,50 Q 50,55 70,50 Q 50,45 30,50"; // Neutral closed mouth

    switch (shape) {
      case 'rounded': // Small circle
        return "M 40,40 Q 50,30 60,40 Q 70,50 60,60 Q 50,70 40,60 Q 30,50 40,40";
      case 'spread': // Wide smile
        return "M 20,45 Q 50,35 80,45 Q 50,65 20,45";
      case 'neutral': // Open oval
      default:
        return "M 30,40 Q 50,30 70,40 Q 75,50 70,60 Q 50,70 30,60 Q 25,50 30,40";
    }
  };

  return (
    <div className="relative w-40 h-40 bg-slate-50 rounded-full border-4 border-slate-100 flex items-center justify-center overflow-hidden">
      {/* Background Face Outline hint */}
      <div className="absolute inset-2 border-2 border-slate-100 rounded-full opacity-50"></div>
      
      {/* Throat / Voicing Indicator */}
      <div className={`absolute bottom-6 w-8 h-8 rounded-full blur-md transition-all duration-300 ${
        isAnimating && voicing === 'voiced' ? 'bg-red-400 opacity-60 scale-150 animate-pulse' : 'bg-transparent opacity-0 scale-100'
      }`}></div>

      <svg width="100" height="100" viewBox="0 0 100 100" className="z-10 relative">
        {/* Voicing Lines (Zigzag in throat area) */}
        {isAnimating && voicing === 'voiced' && (
           <path d="M 40,85 L 45,80 L 50,85 L 55,80 L 60,85" stroke="red" strokeWidth="2" fill="none" className="opacity-50" />
        )}

        {/* Lips */}
        <path 
          d={isAnimating ? getMouthPath('active') : getMouthPath('rest')} 
          fill={isAnimating && shape === 'rounded' ? "#333" : "none"} // Darker interior for open mouth
          stroke="#475569" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="transition-all duration-500 ease-in-out"
        />
        
        {/* Interior (Darkness/Tongue hint) if open */}
        {isAnimating && (
           <path 
             d={getMouthPath('active')} 
             fill="#1e293b" 
             stroke="none"
             className="transition-all duration-500 ease-in-out -z-10"
             style={{ transform: 'scale(0.9)', transformOrigin: 'center' }} // Slightly smaller fill to keep stroke visible
           />
        )}
      </svg>
      
      {/* Labels */}
      <div className="absolute top-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
        {isAnimating ? shape : 'Rest'}
      </div>
      <div className={`absolute bottom-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${
        isAnimating && voicing === 'voiced' ? 'text-red-400' : 'text-slate-300'
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

  const handleSymbolClick = async (symbol: string) => {
    setSelectedSymbol(symbol);
    setLoading(true);
    setTutorial(null);
    setIsAnimating(false);

    const data = await explainIPASymbol(symbol);
    setTutorial(data);
    setLoading(false);
  };

  const closeModal = () => {
    setSelectedSymbol(null);
    setTutorial(null);
    setIsAnimating(false);
  };

  const playSymbol = () => {
    if (!selectedSymbol) return;
    setIsAnimating(true);
    window.speechSynthesis.cancel();
    
    // Attempt to make a clearer sound for just the symbol
    // Often tricky with TTS, but providing a short carrier word or just the sound helps.
    // For vowels, just the vowel. For consonants, maybe adding a schwa if plosive.
    let textToSpeak = selectedSymbol;
    // Basic heuristics for better TTS output of raw phonemes (imperfect but better than silence)
    if (VOWELS.some(v => v.symbol === selectedSymbol)) textToSpeak = selectedSymbol; 
    // This is a simplification; browsers struggle with raw IPA. 
    // Better to speak the example word for the "symbol sound" button in this constrained environment
    // OR try to map symbol to a rough approximation. 
    // Ideally, we'd have audio files. 
    // Fallback: Speak the "Example" word but focus user attention on the visual.
    
    // Let's speak the example word as the best proxy for the sound in a browser context without assets
    const word = tutorial?.examples.initial || "sound";
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-GB';
    utterance.rate = 0.8; // Slower
    
    utterance.onend = () => setIsAnimating(false);
    window.speechSynthesis.speak(utterance);
    
    // Fallback timeout in case onend doesn't fire
    setTimeout(() => setIsAnimating(false), 2000);
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
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-full">
            
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
                  
                  {/* Animation Section */}
                  <div className="bg-slate-50 rounded-2xl p-6 flex flex-col items-center justify-center border border-slate-100">
                    <div className="flex items-center gap-2 mb-4">
                      <h4 className="font-semibold text-slate-700">Pronunciation Animation</h4>
                    </div>
                    
                    <div className="flex items-center gap-8">
                      <MouthVisualizer 
                        shape={tutorial.mouthShape} 
                        voicing={tutorial.voicing} 
                        isAnimating={isAnimating} 
                      />
                      
                      <div className="flex flex-col gap-3">
                        <button
                          onClick={playSymbol}
                          disabled={isAnimating}
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {isAnimating ? <Activity className="w-5 h-5 animate-pulse" /> : <Play className="w-5 h-5 fill-current" />}
                          <span className="font-semibold">{isAnimating ? 'Playing...' : 'Play Sound'}</span>
                        </button>
                        <div className="text-xs text-slate-400 text-center">
                          {tutorial.mouthShape} • {tutorial.voicing}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* How to produce */}
                  <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                    <h4 className="text-indigo-900 font-semibold mb-2 flex items-center gap-2">
                       👄 Articulation Guide
                    </h4>
                    <p className="text-slate-700 text-sm leading-relaxed">
                      {tutorial.howToProduce}
                    </p>
                  </div>

                  {/* Positioning Examples */}
                  <div>
                    <h4 className="text-slate-800 font-semibold mb-3">Word Placement Examples</h4>
                    <div className="space-y-3">
                      
                      {/* Initial */}
                      <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 hover:shadow-sm transition-all group">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-400 uppercase w-12">Start</span>
                          <span className="font-medium text-slate-800 text-lg">{tutorial.examples.initial}</span>
                        </div>
                        <button 
                          onClick={() => playWord(tutorial.examples.initial)}
                          className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-full opacity-60 group-hover:opacity-100 transition-all"
                          title="Listen"
                        >
                          <Volume2 className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Medial */}
                      <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 hover:shadow-sm transition-all group">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-400 uppercase w-12">Middle</span>
                          <span className="font-medium text-slate-800 text-lg">{tutorial.examples.medial}</span>
                        </div>
                        <button 
                          onClick={() => playWord(tutorial.examples.medial)}
                          className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-full opacity-60 group-hover:opacity-100 transition-all"
                           title="Listen"
                        >
                          <Volume2 className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Final */}
                      <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 hover:shadow-sm transition-all group">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-400 uppercase w-12">End</span>
                          <span className="font-medium text-slate-800 text-lg">{tutorial.examples.final}</span>
                        </div>
                        <button 
                          onClick={() => playWord(tutorial.examples.final)}
                          className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-full opacity-60 group-hover:opacity-100 transition-all"
                           title="Listen"
                        >
                          <Volume2 className="w-5 h-5" />
                        </button>
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
                 <p className="text-xs text-slate-400">Generated by Gemini AI</p>
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};