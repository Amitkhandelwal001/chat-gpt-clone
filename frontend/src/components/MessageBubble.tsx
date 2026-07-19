import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { GitBranch, User } from 'lucide-react';
import type { Message } from './ChatArea';
import { api } from '../services/api';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [isBranching, setIsBranching] = useState(false);

  const handleContinueInNewChat = async () => {
    setIsBranching(true);
    try {
      const token = await getToken();
      const res = await api.post('/conversations/continue', { content: message.content }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate(`/c/${res.data.id}`);
    } catch (error) {
      console.error('Failed to branch conversation:', error);
    } finally {
      setIsBranching(false);
    }
  };

  return (
    <div className={`px-4 py-6 md:px-8 group ${isUser ? '' : 'bg-gray-800/50'}`}>
      <div className="max-w-3xl mx-auto flex gap-4 md:gap-6 items-start">
        <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center shadow-sm ${
          isUser ? 'bg-indigo-600' : 'bg-teal-600'
        }`}>
          {isUser ? (
            <User size={18} className="text-white" />
          ) : (
            <span className="text-white text-xs font-bold">AI</span>
          )}
        </div>
        
        <div className="flex-1 overflow-hidden">
          <div className="prose prose-invert max-w-none text-gray-300">
            {/* Simple text rendering, could be upgraded to Markdown later */}
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
          
          {!isUser && (
            <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleContinueInNewChat}
                disabled={isBranching}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-md transition-colors border border-gray-700 disabled:opacity-50"
                title="Branch this topic into a new conversation"
              >
                <GitBranch size={14} />
                {isBranching ? 'Branching...' : 'Continue in New Chat'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
