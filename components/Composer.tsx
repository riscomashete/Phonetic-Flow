import React, { useState } from 'react';
import { Send, Timer, Sparkles, X, Languages } from 'lucide-react';
import { draftMessage } from '../services/geminiService';

interface Props {
  onSendMessage: (text: string, selfDestructTime?: number) => void;
  role: 'student' | 'teacher' | 'admin' | 'head_of_department';
}

export const Composer: React.FC<Props> = ({ onSendMessage, role }) => {
  const [text, setText] = useState('');
  const [showAiTools, setShowAiTools] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [selfDestructSeconds, setSelfDestructSeconds] = useState<number | undefined>(undefined);

  const handleSend = () => {
    if (!text.trim()) return;
    onSendMessage(text, selfDestructSeconds);
    setText('');
    setSelfDestructSeconds(undefined); // Reset timer after send
  };

  const handleAiDraft = async (tone: 'professional' | 'casual' | 'stern') => {
    setIsDrafting(true);
    const draft = await draftMessage(text || "A general update regarding class schedule", tone, "Parent/Student");
    setText(draft);
    setIsDrafting(false);
    setShowAiTools(false);
  };

  const toggleSelfDestruct = () => {
    if (selfDestructSeconds) {
      setSelfDestructSeconds(undefined);
    } else {
      setSelfDestructSeconds(30); // Default 30s
    }
  };

  return (
    <div className="p-4 bg-white border-t border-gray-100">
      {/* AI Tools Panel */}
      {showAiTools && (
        <div className="mb-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100 animate-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-indigo-800 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI Assistant
            </span>
            <button onClick={() => setShowAiTools(false)} className="text-indigo-400 hover:text-indigo-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => handleAiDraft('professional')}
              disabled={isDrafting}
              className="text-xs bg-white border border-indigo-200 text-indigo-700 py-2 rounded hover:bg-indigo-100 disabled:opacity-50"
            >
              Professional
            </button>
            <button 
              onClick={() => handleAiDraft('casual')}
              disabled={isDrafting}
              className="text-xs bg-white border border-indigo-200 text-indigo-700 py-2 rounded hover:bg-indigo-100 disabled:opacity-50"
            >
              Friendly
            </button>
            <button 
              onClick={() => handleAiDraft('stern')}
              disabled={isDrafting}
              className="text-xs bg-white border border-indigo-200 text-indigo-700 py-2 rounded hover:bg-indigo-100 disabled:opacity-50"
            >
              Urgent/Strict
            </button>
          </div>
          {isDrafting && <p className="text-xs text-indigo-500 mt-2 text-center animate-pulse">Drafting...</p>}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a secure message..."
            className="w-full bg-gray-100 text-gray-900 rounded-2xl py-3 pl-4 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all min-h-[50px] max-h-[120px]"
            rows={1}
          />
          <button 
            onClick={() => setShowAiTools(!showAiTools)}
            className="absolute right-3 bottom-3 text-indigo-500 hover:text-indigo-700 transition-colors p-1"
            title="Use AI to draft"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-2">
           <button 
            onClick={toggleSelfDestruct}
            className={`p-3 rounded-full transition-all ${
              selfDestructSeconds 
                ? 'bg-red-100 text-red-600 ring-2 ring-red-500 ring-offset-2' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            title="Self-destruct timer"
          >
            <Timer className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/30"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </div>
      </div>
      
      {selfDestructSeconds && (
        <div className="mt-2 flex items-center justify-end gap-2 text-xs text-red-500 font-medium">
           <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
           Messages disappear after 30 seconds
        </div>
      )}
    </div>
  );
};