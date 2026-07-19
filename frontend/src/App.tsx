import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth, useUser, SignedIn, SignedOut, SignIn } from '@clerk/clerk-react';
import ChatPage from './pages/ChatPage';
import { api } from './services/api';

function App() {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();

  // Sync user with backend
  useEffect(() => {
    const syncUser = async () => {
      if (isSignedIn && user) {
        try {
          const token = await getToken();
          await api.post(
            '/auth/sync',
            {
              email: user.primaryEmailAddress?.emailAddress,
              name: user.fullName || user.firstName,
              profileImage: user.imageUrl,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        } catch (error) {
          console.error('Failed to sync user:', error);
        }
      }
    };
    syncUser();
  }, [isSignedIn, user, getToken]);

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden">
      <SignedOut>
        <div className="flex-1 flex items-center justify-center bg-gray-950">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-8 text-white">Welcome to AI Chat</h1>
            <SignIn />
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <Routes>
          <Route path="/" element={<ChatPage />} />
          <Route path="/c/:conversationId" element={<ChatPage />} />
        </Routes>
      </SignedIn>
    </div>
  );
}

export default App;
