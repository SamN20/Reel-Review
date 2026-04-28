import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import AuthCallback from './pages/AuthCallback';
import Vote from './pages/Vote';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/vote" element={<Vote />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
