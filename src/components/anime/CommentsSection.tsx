'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Send, MessageCircle, MoreVertical, Flag, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthStore } from '@/store';
import type { Comment, User } from '@/types/anime';

interface CommentsSectionProps {
  episodeId: string;
}

// Mock comments
const mockComments: (Comment & { user: User })[] = [
  {
    id: 'c1',
    userId: 'u1',
    episodeId: 'e1',
    content: 'This episode was amazing! The animation quality is top notch.',
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30),
    user: {
      id: 'u1',
      username: 'animefan2024',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop',
      email: '',
      role: 'USER',
      createdAt: new Date(),
    }
  },
  {
    id: 'c2',
    userId: 'u2',
    episodeId: 'e1',
    content: 'The fight scenes in this anime are beautifully animated. MAPPA really outdid themselves!',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    user: {
      id: 'u2',
      username: 'otaku_master',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50&fit=crop',
      email: '',
      role: 'USER',
      createdAt: new Date(),
    }
  },
  {
    id: 'c3',
    userId: 'u3',
    episodeId: 'e1',
    content: 'I can\'t wait for the next episode! The cliffhanger is killing me 😭',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    user: {
      id: 'u3',
      username: 'weeb_supreme',
      avatar: null,
      email: '',
      role: 'USER',
      createdAt: new Date(),
    }
  },
];

export function CommentsSection({ episodeId }: CommentsSectionProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [comments, setComments] = useState<(Comment & { user: User })[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setComments(mockComments);
      setLoading(false);
    }, 500);
  }, [episodeId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated) return;

    const comment: Comment & { user: User } = {
      id: `c${Date.now()}`,
      userId: user?.id || '',
      episodeId,
      content: newComment,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: user?.id || '',
        username: user?.username || 'Anonymous',
        avatar: user?.avatar || null,
        email: '',
        role: user?.role || 'USER',
        createdAt: new Date(),
      }
    };

    setComments([comment, ...comments]);
    setNewComment('');
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="glass rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-5 h-5 text-purple-400" />
        <h3 className="font-semibold">Comments ({comments.length})</h3>
      </div>

      {/* Comment input */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <Input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={isAuthenticated ? "Write a comment..." : "Login to comment"}
          disabled={!isAuthenticated}
          className="bg-white/5 border-white/10"
        />
        <Button type="submit" disabled={!isAuthenticated || !newComment.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </form>

      {/* Comments list */}
      <ScrollArea className="max-h-[400px]">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="w-10 h-10 rounded-full skeleton" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 rounded skeleton" />
                  <div className="h-4 w-full rounded skeleton" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-3 group"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
                  {comment.user.avatar ? (
                    <Image
                      src={comment.user.avatar}
                      alt={comment.user.username}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold">
                      {comment.user.username[0].toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{comment.user.username}</span>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{comment.content}</p>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-4 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-purple-400 transition-colors">
                      <ThumbsUp className="w-3 h-3" />
                      Like
                    </button>
                    <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-purple-400 transition-colors">
                      Reply
                    </button>
                    <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition-colors">
                      <Flag className="w-3 h-3" />
                      Report
                    </button>
                  </div>
                </div>

                {/* More options */}
                <button className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
