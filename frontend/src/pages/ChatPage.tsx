import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import { api } from '../services/api';

export interface Conversation {
  id: string;
  title: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // For mobile

  const fetchConversations = async () => {
    try {
      const token = await getToken();
      const res = await api.get('/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(res.data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [getToken, conversationId]); // Re-fetch when conversation changes (e.g. title update)

  const handleNewChat = async () => {
    try {
      const token = await getToken();
      const res = await api.post('/conversations', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations([res.data, ...conversations]);
      navigate(`/c/${res.data.id}`);
    } catch (error) {
      console.error('Failed to create new chat', error);
    }
  };

  return (
    <>
      <Sidebar 
        conversations={conversations} 
        currentConversationId={conversationId}
        onNewChat={handleNewChat}
        refreshConversations={fetchConversations}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      
      <ChatArea 
        conversationId={conversationId} 
        onMenuClick={() => setIsSidebarOpen(true)}
        refreshConversations={fetchConversations}
      />
    </>
  );
}
