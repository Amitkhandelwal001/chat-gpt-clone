import { Link, useNavigate } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { Plus, MessageSquare, Pin, PinOff, Trash2, X } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { api } from '../services/api';
import type { Conversation } from '../pages/ChatPage';

interface SidebarProps {
  conversations: Conversation[];
  currentConversationId?: string;
  onNewChat: () => void;
  refreshConversations: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({
  conversations,
  currentConversationId,
  onNewChat,
  refreshConversations,
  isOpen,
  setIsOpen
}: SidebarProps) {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const handlePin = async (id: string, isPinned: boolean) => {
    try {
      const token = await getToken();
      await api.patch(`/conversations/${id}`, { isPinned }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      refreshConversations();
    } catch (error) {
      console.error('Failed to pin/unpin:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = await getToken();
      await api.delete(`/conversations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (currentConversationId === id) {
        navigate('/');
      }
      refreshConversations();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const pinned = conversations.filter(c => c.isPinned);
  const unpinned = conversations.filter(c => !c.isPinned);

  const sidebarClasses = `fixed inset-y-0 left-0 z-50 w-72 bg-gray-950 text-gray-300 flex flex-col transition-transform transform ${
    isOpen ? 'translate-x-0' : '-translate-x-full'
  } md:relative md:translate-x-0`;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <div className={sidebarClasses}>
        <div className="p-4 flex items-center justify-between">
          <button
            onClick={() => {
              onNewChat();
              setIsOpen(false);
            }}
            className="flex-1 flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors border border-gray-700"
          >
            <Plus size={20} />
            <span className="font-medium">New Chat</span>
          </button>
          <button 
            className="md:hidden ml-4 p-2 text-gray-400 hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 custom-scrollbar">
          {pinned.length > 0 && (
            <div className="mb-6">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pinned</h3>
              <div className="space-y-1">
                {pinned.map(c => (
                  <ConversationItem 
                    key={c.id} 
                    conversation={c} 
                    isActive={c.id === currentConversationId}
                    onPin={() => handlePin(c.id, false)}
                    onDelete={() => handleDelete(c.id)}
                    onClick={() => setIsOpen(false)}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recent</h3>
            <div className="space-y-1">
              {unpinned.map(c => (
                <ConversationItem 
                  key={c.id} 
                  conversation={c} 
                  isActive={c.id === currentConversationId}
                  onPin={() => handlePin(c.id, true)}
                  onDelete={() => handleDelete(c.id)}
                  onClick={() => setIsOpen(false)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 flex items-center gap-3">
          <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: 'w-10 h-10' } }} />
          <span className="font-medium truncate">Account Settings</span>
        </div>
      </div>
    </>
  );
}

function ConversationItem({ 
  conversation, 
  isActive, 
  onPin, 
  onDelete,
  onClick
}: { 
  conversation: Conversation, 
  isActive: boolean,
  onPin: () => void,
  onDelete: () => void,
  onClick: () => void
}) {
  return (
    <div className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-gray-800 text-white' : 'hover:bg-gray-800/50 text-gray-300'}`}>
      <Link to={`/c/${conversation.id}`} onClick={onClick} className="flex items-center gap-3 overflow-hidden flex-1">
        <MessageSquare size={18} className="shrink-0 text-gray-400" />
        <span className="truncate">{conversation.title || 'New Chat'}</span>
      </Link>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={(e) => { e.preventDefault(); onPin(); }} className="p-1 text-gray-400 hover:text-white transition-colors" title={conversation.isPinned ? "Unpin" : "Pin"}>
          {conversation.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
        </button>
        <button onClick={(e) => { e.preventDefault(); onDelete(); }} className="p-1 text-gray-400 hover:text-red-400 transition-colors" title="Delete">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
