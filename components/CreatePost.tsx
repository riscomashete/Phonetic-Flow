import React, { useState } from 'react';
import { Image, Send, Sparkles, Languages, BookOpen } from 'lucide-react';
import { translateToSilozi, generateLessonIdea } from '../services/geminiService';
import { User } from '../types';

interface Props {
  currentUser: User;
  onPost: (content: string) => void;
}

export const CreatePost: React.FC<Props> = ({ currentUser, onPost }) => {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePost = () => {
    if (!text.trim()) return;
    onPost(text);
    setText('');
  };

  const handleTranslate = async () => {
    if (!text.trim()) return;
    setIsProcessing(true);
    const translated = await translateToSilozi(text);
    setText(translated);
    setIsProcessing(false);
  };

  const handleLessonIdea = async () => {
    setIsProcessing(true);
    const idea = await generateLessonIdea(text || "Silozi Poetry");
    setText(idea);
    setIsProcessing(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex gap-3 mb-4">
        <img 
          src={currentUser.avatar} 
          alt={currentUser.name} 
          className="w-10 h-10 rounded-full object-cover border border-gray-200"
        />
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Mu bata ku bulela kuli ni? (What's on your mind, ${currentUser.name.split(' ')[1]}?)`}
            className="w-full bg-gray-50 border-none rounded-lg p-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all resize-none h-24"
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <div className="flex gap-2">
          <button 
            onClick={handleTranslate}
            disabled={isProcessing || !text}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors disabled:opacity-50"
            title="Translate English to Silozi"
          >
            <Languages className="w-3.5 h-3.5" />
            {isProcessing ? 'Toloka...' : 'Translate to Silozi'}
          </button>
          
          <button 
            onClick={handleLessonIdea}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-full transition-colors disabled:opacity-50"
            title="Generate Lesson Idea"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isProcessing ? 'Nahana...' : 'Lesson Idea'}
          </button>

           <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <Image className="w-3.5 h-3.5" />
            Photo
          </button>
        </div>

        <button 
          onClick={handlePost}
          disabled={!text.trim()}
          className="flex items-center gap-2 px-6 py-2 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
        >
          <span>Post</span>
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};