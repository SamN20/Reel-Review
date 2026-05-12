import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import axios from "axios";

interface User {
  id: number;
  username: string;
  email: string | null;
  display_name: string | null;
  use_display_name: boolean;
  show_on_leaderboard: boolean;
  public_profile: boolean;
  is_active: boolean;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
  handleCallback: (code: string) => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Use the API URL from environment variables, fallback to backend default if not set
  const API_URL = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/api/v1/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
      } catch (error) {
        console.error("Failed to fetch user", error);
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [API_URL]);

  const login = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/auth/login-url`);
      // Redirect user to KeyN
      window.location.href = response.data.url;
    } catch (error) {
      console.error("Failed to get login URL", error);
    }
  };

  const handleCallback = useCallback(
    async (code: string) => {
      setLoading(true);
      try {
        const response = await axios.post(`${API_URL}/api/v1/auth/callback`, {
          code,
        });
        const { access_token } = response.data;
        localStorage.setItem("token", access_token);

        // Fetch user data immediately after getting token
        const userResponse = await axios.get(`${API_URL}/api/v1/auth/me`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        setUser(userResponse.data);
      } catch (error) {
        console.error("Callback failed", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [API_URL],
  );

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, handleCallback, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
