import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/Home";
import AuthCallback from "./pages/AuthCallback";
import Vote from "./pages/Vote";
import Admin from "./pages/Admin";
import FilmShelfPage from "./pages/FilmShelfPage";
import LeaderboardsPage from "./pages/LeaderboardsPage";
import DiscussionsPage from "./pages/DiscussionsPage";
import Results from "./features/results/pages/ResultsPage";
import "./index.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/vote" element={<Vote />} />
          <Route path="/vote/:id" element={<Vote />} />
          <Route path="/results/:id" element={<Results />} />
          <Route path="/film-shelf" element={<FilmShelfPage />} />
          <Route path="/leaderboards" element={<LeaderboardsPage />} />
          <Route path="/discussions" element={<DiscussionsPage />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
