import React, { useEffect, useState } from 'react';
import { Message, User } from '../types';
import { ShieldCheck, Clock, Bomb } from 'lucide-react';

interface Props {
  message: Message;
  isOwn: boolean;
  sender?: User;
  onExpire: (id: string) => void;
}

export const MessageBubble: React.FC<Props> = ({ message, isOwn, sender, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(true); // Simplified for demo, usually false for "tap to reveal"

  useEffect(() => {
    if (message.expiresAt) {
      const interval = setInterval(() => {
        const remaining = Math.ceil((message.expiresAt! - Date.now()) / 1000);
        if (remaining <= 0) {
          onExpire(message.id);
          clearInterval(interval);
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [message.expiresAt, message.id, onExpire]);

  if (message.isSystem) {
    return (
      <div className="flex justify-center my-4">
        <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex w-full mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {!isOwn && sender && (
        <img 
          src={sender.avatar} 
          alt={sender.name} 
          className="w-8 h-8 rounded-full mr-2 self-end mb-1 border border-gray-200"
        />
      )}
      <div className={`max-w-[75%] md:max-w-[60%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && sender && (
          <span className="text-xs text-gray-500 ml-1 mb-1">{sender.name}</span>
        )}
        
        <div className={`relative px-4 py-3 rounded-2xl shadow-sm ${
          isOwn 
            ? 'bg-blue-600 text-white rounded-br-none' 
            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
        }`}>
          {/* Encryption Indicator */}
          {message.isEncrypted && (
            <div className={`absolute -top-2 ${isOwn ? '-left-2' : '-right-2'} bg-emerald-500 text-white p-0.5 rounded-full border-2 border-white`} title="Encrypted">
              <ShieldCheck className="w-3 h-3" />
            </div>
          )}

          {/* Self Destruct Timer */}
          {timeLeft !== null && (
            <div className="flex items-center gap-1 text-xs font-bold text-red-300 mb-1 animate-pulse">
              <Bomb className="w-3 h-3" />
              <span>Self-destructs in {timeLeft}s</span>
            </div>
          )}

          <p className="whitespace-pre-wrap leading-relaxed text-sm">
            {message.content}
          </p>

          <div className={`flex items-center gap-1 mt-1 text-[10px] ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
            <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            {message.selfDestructIn && <Clock className="w-3 h-3 ml-1" />}
          </div>
        </div>
      </div>
    </div>
  );
};