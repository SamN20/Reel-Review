import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const { handleCallback } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      handleCallback(code)
        .then(() => navigate('/'))
        .catch(() => setError('Authentication failed. Please try again.'));
    } else {
      setError('No authorization code found.');
    }
  }, [searchParams, handleCallback, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-6 px-4 py-2 bg-red-600 rounded-md hover:bg-red-700 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4 animate-pulse">Authenticating...</h2>
        <p className="text-zinc-400">Please wait while we log you in via KeyN.</p>
      </div>
    </div>
  );
}
