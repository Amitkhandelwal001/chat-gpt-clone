import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Menu } from 'lucide-react';
import { api } from '../services/api';
import ChatInput from './ChatInput';
import MessageBubble from './MessageBubble';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatAreaProps {
  conversationId?: string;
  onMenuClick: () => void;
  refreshConversations: () => void;
}

export default function ChatArea({ conversationId, onMenuClick, refreshConversations }: ChatAreaProps) {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    try {
      const token = await getToken();
      const res = await api.get(`/messages/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [conversationId, getToken]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (content: string) => {
    if (!conversationId) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const token = await getToken();
      const res = await api.post(`/messages/${conversationId}`, { content }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(prev => [...prev, res.data]);
      
      // Since title might have updated on the backend, refresh sidebar
      if (messages.length === 0) {
        refreshConversations();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Optional: Add a temporary error message in UI
    } finally {
      setIsLoading(false);
    }
  };

  // Filter out system messages from being displayed
  const displayMessages = messages.filter(m => m.role !== 'system');

  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-900 relative">
      <header className="absolute top-0 left-0 right-0 p-4 flex items-center md:hidden z-10 bg-gradient-to-b from-gray-900 to-transparent">
        <button onClick={onMenuClick} className="p-2 text-gray-300 hover:text-white bg-gray-800 rounded-md">
          <Menu size={24} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto pt-16 md:pt-0 custom-scrollbar">
        {displayMessages.length === 0 && !isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <span className="text-3xl">AI</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">How can I help you today?</h2>
            <p className="max-w-md text-sm">Create a new conversation or select one from the sidebar to start chatting.</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full pb-32">
            {displayMessages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="px-4 py-6 md:px-8 text-gray-300">
                <div className="flex gap-4 max-w-3xl mx-auto items-start">
                  <div className="w-8 h-8 rounded bg-teal-600 flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">AI</span>
                  </div>
                  <div className="flex items-center h-8">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 via-gray-900 to-transparent p-4 pt-12 md:p-6">
        <div className="max-w-3xl mx-auto w-full">
          {conversationId ? (
            <ChatInput onSend={handleSendMessage} disabled={isLoading} />
          ) : (
            <div className="text-center text-gray-500 text-sm pb-2">Select a chat to start messaging</div>
          )}
        </div>
      </div>
    </div>
  );
}
