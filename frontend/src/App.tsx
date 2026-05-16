import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
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
import "./index.css";

import ProfilePage from "./pages/ProfilePage";
import PersonPage from "./features/crew/pages/PersonPage";
import { usePageMeta } from "./lib/seo";

function RouteMetaManager() {
  const location = useLocation();
  const { pathname } = location;

  let title = "Reel Review | Weekly Community Movie Night";

  if (pathname.startsWith("/vote")) {
    title = "Rate This Week's Movie | Reel Review";
  } else if (pathname.startsWith("/results")) {
    title = "Results | Reel Review";
  } else if (pathname.startsWith("/film-shelf/vote-order")) {
    title = "Vote Order | Reel Review";
  } else if (pathname.startsWith("/film-shelf")) {
    title = "Film Shelf | Reel Review";
  } else if (pathname.startsWith("/leaderboards")) {
    title = "Leaderboards | Reel Review";
  } else if (pathname.startsWith("/discussions")) {
    title = "Discussions | Reel Review";
  } else if (pathname.startsWith("/requests")) {
    title = "Movie Requests | Reel Review";
  } else if (pathname.startsWith("/admin")) {
    title = "Admin Dashboard | Reel Review";
  } else if (pathname.startsWith("/profile") || pathname.startsWith("/p/")) {
    title = "Profile | Reel Review";
  } else if (pathname.startsWith("/actor/")) {
    title = "Cast Spotlight | Reel Review";
  } else if (pathname.startsWith("/director/")) {
    title = "Director Spotlight | Reel Review";
  } else if (pathname.startsWith("/terms")) {
    title = "Terms of Use | Reel Review";
  } else if (pathname.startsWith("/privacy")) {
    title = "Privacy Policy | Reel Review";
  } else if (pathname.startsWith("/attribution")) {
    title = "Attribution | Reel Review";
  } else if (pathname.startsWith("/auth/callback")) {
    title = "Signing In | Reel Review";
  }

  usePageMeta({ title });
  return null;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <RouteMetaManager />
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
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/p/:username" element={<ProfilePage />} />
          <Route path="/actor/:name" element={<PersonPage type="actor" />} />
          <Route path="/director/:name" element={<PersonPage type="director" />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/attribution" element={<Attribution />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
