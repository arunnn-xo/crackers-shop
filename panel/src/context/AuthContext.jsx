import { createContext, useContext, useState } from 'react';
import { apiRequest } from '../lib/api';

const AuthContext = createContext();

const TOKEN_KEY = 'authToken';
const USER_KEY = 'authUser';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const rawUser = localStorage.getItem(USER_KEY);
    return rawUser ? JSON.parse(rawUser) : null;
  });

  const isAuthenticated = Boolean(token);

  const validateLogin = async (email, password) => {
    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      return {
        success: true,
        token: response.token,
        user: response.user,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Login failed.',
      };
    }
  };

  const completeLogin = (authData) => {
    if (!authData?.token) {
      return;
    }

    setToken(authData.token);
    setUser(authData.user || null);
    localStorage.setItem(TOKEN_KEY, authData.token);
    localStorage.setItem(USER_KEY, JSON.stringify(authData.user || null));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, user, validateLogin, completeLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
