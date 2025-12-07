import React, { useState } from 'react';
import { Post, Comment, User } from '../types';
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal, Send } from 'lucide-react';

interface Props {
  post: Post;
  currentUser?: User;
}

export const FeedPost: React.FC<Props> = ({ post, currentUser }) => {
  const [likes, setLikes] = useState(post.likes);
  const [hasLiked, setHasLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>(post.comments);
  const [newComment, setNewComment] = useState('');

  const toggleLike = () => {
    if (hasLiked) {
      setLikes(prev => prev - 1);
      setHasLiked(false);
    } else {
      setLikes(prev => prev + 1);
      setHasLiked(true);
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !currentUser) return;
    
    const comment: Comment = {
      id: Date.now().toString(),
      author: currentUser,
      content: newComment,
      timestamp: Date.now()
    };

    setComments([...comments, comment]);
    setNewComment('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4 overflow-hidden">
      {/* Post Header */}
      <div className="p-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={post.author.avatar} 
            alt={post.author.name} 
            className="w-10 h-10 rounded-full object-cover border border-gray-200"
          />
          <div>
            <h3 className="font-bold text-gray-900 text-sm">{post.author.name}</h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{post.author.school}</span>
              <span>•</span>
              <span>{new Date(post.timestamp).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-2">
        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{post.content}</p>
        
        {post.tags.length > 0 && (
          <div className="flex gap-2 mt-3">
            {post.tags.map(tag => (
              <span key={tag} className="text-blue-600 text-sm hover:underline cursor-pointer">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {post.image && (
        <div className="mt-2">
          <img src={post.image} alt="Post attachment" className="w-full object-cover max-h-[400px]" />
        </div>
      )}

      {/* Stats */}
      <div className="px-4 py-3 flex items-center justify-between text-xs text-gray-500 border-b border-gray-50">
        <span>{likes} Teachers liked this</span>
        <button onClick={() => setShowComments(!showComments)} className="hover:underline">
          {comments.length} Comments
        </button>
      </div>

      {/* Action Buttons */}
      <div className="px-2 py-1 flex items-center justify-between border-t border-gray-50">
        <button 
          onClick={toggleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors text-sm font-medium ${
            hasLiked ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <ThumbsUp className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
          Like
        </button>
        <button 
          onClick={() => setShowComments(!showComments)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors text-sm font-medium ${
            showComments ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          Comment
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium">
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="bg-gray-50 p-4 border-t border-gray-100">
          <div className="space-y-3 mb-4">
            {comments.map(comment => (
              <div key={comment.id} className="flex gap-2">
                <img src={comment.author.avatar} alt={comment.author.name} className="w-8 h-8 rounded-full border border-gray-200" />
                <div className="flex-1 bg-white p-2 rounded-lg rounded-tl-none shadow-sm border border-gray-100">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-gray-900">{comment.author.name}</span>
                    <span className="text-[10px] text-gray-400">{new Date(comment.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-2">No comments yet. Be the first!</p>
            )}
          </div>
          
          {currentUser && (
            <div className="flex gap-2 items-end">
              <img src={currentUser.avatar} alt={currentUser.name} className="w-8 h-8 rounded-full mb-1" />
              <div className="flex-1 relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-[42px]"
                  onKeyDown={(e) => {
                    if(e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                />
                <button 
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="absolute right-2 bottom-2 text-blue-600 disabled:text-gray-300"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};