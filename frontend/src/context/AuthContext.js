import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
export const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      // No token = not logged in, go to login immediately
      if (!savedToken || !savedUser) {
        setLoading(false);
        return;
      }

      setToken(savedToken);
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser); // set user immediately from localStorage

      // Then fetch fresh data in background
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
        const response = await axios.get('https://chatv2-i91j.onrender.com/api/profile');
        const freshUser = {
          id: response.data._id,
          username: response.data.username,
          email: response.data.email,
          profilePicture: response.data.profilePicture
        };
        setUser(freshUser);
        localStorage.setItem('user', JSON.stringify(freshUser));
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }

      setLoading(false);
    };
    initAuth();
  }, []);
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);
  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
  };
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };
  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};