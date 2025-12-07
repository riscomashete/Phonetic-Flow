import React, { useState, useRef, useEffect } from 'react';
import { User, Conversation, Message } from '../types';
import { MessageBubble } from './MessageBubble';
import { Composer } from './Composer';
import { EncryptionLock } from './EncryptionLock';
import { Search, Phone, Video, MoreVertical, ChevronLeft } from 'lucide-react';

interface Props {
  currentUser: User;
}

const MOCK_USERS: User[] = [
  { id: 'u2', name: 'Nangula Kapofi', role: 'student', avatar: 'https://picsum.photos/id/1011/200/200', school: 'Caprivi SS', isOnline: true },
  { id: 'u3', name: 'Principal Hage', role: 'admin', avatar: 'https://picsum.photos/id/1025/200/200', school: 'Caprivi SS', isOnline: false },
  { id: 'u4', name: 'Grade 12 Physics', role: 'student', avatar: 'https://picsum.photos/id/1012/200/200', school: 'Caprivi SS', isOnline: true }, // Group
];

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    participants: [MOCK_USERS[0]],
    unreadCount: 2,
    isGroup: false,
    messages: [
      { id: 'm1', senderId: 'u2', content: 'Good afternoon. Is the extra class still on for tomorrow?', timestamp: Date.now() - 3600000, isEncrypted: true },
    ]
  },
  {
    id: 'c2',
    participants: [MOCK_USERS[1]],
    unreadCount: 0,
    isGroup: false,
    messages: [
       { id: 'm2', senderId: 'u3', content: 'The report cards are ready.', timestamp: Date.now() - 86400000, isEncrypted: true },
    ]
  },
  {
    id: 'c3',
    participants: [MOCK_USERS[2]],
    name: "Grade 12 Physics",
    unreadCount: 0,
    isGroup: true,
    messages: []
  }
];

export const ChatInterface: React.FC<Props> = ({ currentUser }) => {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversations, activeConversationId]);

  const activeChat = conversations.find(c => c.id === activeConversationId);

  const handleSendMessage = (text: string, selfDestructSeconds?: number) => {
    if (!activeConversationId) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      content: text,
      timestamp: Date.now(),
      isEncrypted: true,
      selfDestructIn: selfDestructSeconds,
      expiresAt: selfDestructSeconds ? Date.now() + (selfDestructSeconds * 1000) : undefined
    };

    setConversations(prev => prev.map(c => {
      if (c.id === activeConversationId) {
        return {
          ...c,
          messages: [...c.messages, newMessage],
        };
      }
      return c;
    }));
  };

  const handleExpireMessage = (messageId: string) => {
    setConversations(prev => prev.map(c => ({
      ...c,
      messages: c.messages.filter(m => m.id !== messageId)
    })));
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      
      {/* Sidebar List */}
      <div className={`${activeConversationId ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-gray-200`}>
        <div className="p-4 border-b border-gray-100">
           <h2 className="font-bold text-lg mb-2">Messages</h2>
           <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search chats..." 
              className="w-full bg-gray-100 text-sm py-2 pl-10 pr-4 rounded-lg focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map(chat => {
            const participant = chat.participants[0];
            const name = chat.isGroup ? chat.name : participant.name;
            const avatar = chat.isGroup ? 'https://picsum.photos/200/200?grayscale' : participant.avatar;
            
            return (
              <div 
                key={chat.id}
                onClick={() => setActiveConversationId(chat.id)}
                className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 border-l-4 ${
                  activeConversationId === chat.id ? 'border-blue-600 bg-blue-50' : 'border-transparent'
                }`}
              >
                <img src={avatar} alt={name} className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
                    {chat.messages.length > 0 && (
                      <span className="text-[10px] text-gray-400">
                        {new Date(chat.messages[chat.messages.length - 1].timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate h-5">
                    {chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].content : ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${activeConversationId ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-slate-50`}>
        {activeChat ? (
          <>
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm z-10">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveConversationId(null)}
                  className="md:hidden p-1 hover:bg-gray-100 rounded-full"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="font-bold text-gray-800">
                  {activeChat.isGroup ? activeChat.name : activeChat.participants[0].name}
                </h2>
                <EncryptionLock isSecure={true} />
              </div>
              <div className="flex gap-2 text-gray-500">
                <Video className="w-5 h-5 cursor-pointer" />
                <Phone className="w-5 h-5 cursor-pointer" />
                <MoreVertical className="w-5 h-5 cursor-pointer" />
              </div>
            </div>

            <div 
              className="flex-1 overflow-y-auto p-4 space-y-2"
              ref={scrollRef}
              style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            >
              {activeChat.messages.map(msg => (
                <MessageBubble 
                  key={msg.id} 
                  message={msg} 
                  isOwn={msg.senderId === currentUser.id}
                  sender={activeChat.isGroup ? MOCK_USERS.find(u => u.id === msg.senderId) : activeChat.participants[0]}
                  onExpire={handleExpireMessage}
                />
              ))}
            </div>
            <Composer onSendMessage={handleSendMessage} role={currentUser.role} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};