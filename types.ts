export interface TranscriptionHistoryItem {
  id: string;
  original: string;
  transcription: {
    uk: string;
    us: string;
  };
  timestamp: number;
}

export interface User {
  id: string;
  name: string;
  role: 'student' | 'teacher' | 'admin' | 'head_of_department';
  avatar: string;
  school: string;
  isOnline: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
  isEncrypted?: boolean;
  selfDestructIn?: number;
  expiresAt?: number;
  isSystem?: boolean;
}

export interface Conversation {
  id: string;
  participants: User[];
  unreadCount: number;
  isGroup: boolean;
  name?: string;
  messages: Message[];
}

export interface Comment {
  id: string;
  author: User;
  content: string;
  timestamp: number;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  timestamp: number;
  likes: number;
  comments: Comment[];
  tags: string[];
  image?: string;
}