import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/Home";
import AuthCallback from "./pages/AuthCallback";
import Vote from "./pages/Vote";
import Admin from "./pages/Admin";
import FilmShelfPage from "./pages/FilmShelfPage";
import VoteOrderPage from "./features/filmShelf/pages/VoteOrderPage";
import LeaderboardsPage from "./pages/LeaderboardsPage";
import DiscussionsPage from "./pages/DiscussionsPage";
import RequestsPage from "./pages/RequestsPage";
import Results from "./features/results/pages/ResultsPage";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Attribution from "./pages/Attribution";
import { ScrollToTop } from "./components/ScrollToTop";
import { SectionPlaceholderPage } from "./components/SectionPlaceholderPage";
import "./index.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/vote" element={<Vote />} />
          <Route path="/vote/:id" element={<Vote />} />
          <Route path="/results/:id" element={<Results />} />
          <Route path="/film-shelf" element={<FilmShelfPage />} />
          <Route path="/film-shelf/vote-order" element={<VoteOrderPage />} />
          <Route path="/leaderboards" element={<LeaderboardsPage />} />
          <Route path="/discussions" element={<DiscussionsPage />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/admin" element={<Admin />} />
          <Route
            path="/profile"
            element={
              <SectionPlaceholderPage
                activeSection="current-week"
                eyebrow="Account"
                title="Profile"
                description="Profile settings are coming soon. For now, notification preferences live in Nolofication."
              />
            }
          />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/attribution" element={<Attribution />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
