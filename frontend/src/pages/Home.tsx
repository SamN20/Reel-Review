import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, loading, login, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8">Reel Review</h1>
      
      {user ? (
        <div className="text-center">
          <p className="mb-6 text-xl">Welcome back, {user.username}!</p>
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => navigate('/vote')}
              className="px-6 py-3 bg-red-600 font-bold rounded hover:bg-red-700 transition-colors"
            >
              Vote on Current Drop
            </button>
            <button 
              onClick={logout}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <p className="mb-4 text-zinc-400">Join the weekly drop.</p>
          <button 
            onClick={login}
            className="px-6 py-3 bg-red-600 font-bold rounded hover:bg-red-700 transition-colors"
          >
            Login with KeyN
          </button>
        </div>
      )}
    </div>
  );
}
