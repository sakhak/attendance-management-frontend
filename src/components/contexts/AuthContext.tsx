// import { error } from "console";
import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
export interface User {
  id?: string;
  user_id?: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  phone?: string;
  gender?: string;
  date_of_birth?: string;
  address?: string;
  roles?: string[];
  token?: string;
  avatar?: string;
  image?: string;
  created_at?: string;
  updated_at?: string;
}
interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  hasRole: (permission: string) => boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load user data from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        const userData = JSON.parse(saved);
        setUser(userData);
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };
  const hasRole = (permission: string) => {
    return user?.roles?.includes(permission) || false;
  };
  const isAuthenticated = !!user?.token;

  // Debug logging
  console.log("AuthContext - user:", user);
  console.log("AuthContext - isAuthenticated:", isAuthenticated);
  console.log("AuthContext - isLoading:", isLoading);

  return (
    <AuthContext.Provider
      value={{ user, login, logout, hasRole, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
