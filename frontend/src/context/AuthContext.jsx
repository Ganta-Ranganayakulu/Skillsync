import { createContext, useContext, useState, useEffect } from 'react';
// import axios from 'axios';
import API from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Immediately show cached user data so UI renders fast on refresh
      try {
        const cached = localStorage.getItem('cached_user');
        if (cached) setUser(JSON.parse(cached));
      } catch(e) {}

      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      API.get('/api/auth/me')
        .then(res => {
          setUser(res.data);
          localStorage.setItem('cached_user', JSON.stringify(res.data));
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('cached_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const res = await API.post('/api/auth/login', { username, password });
    localStorage.setItem('token', res.data.token);
    API.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    setUser(res.data);
    localStorage.setItem('cached_user', JSON.stringify(res.data));
    return res.data;
  };

  const register = async (data) => {
    const res = await API.post('/api/auth/register', data);
    localStorage.setItem('token', res.data.token);
    API.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    setUser(res.data);
    localStorage.setItem('cached_user', JSON.stringify(res.data));
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('cached_user');
    delete API.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const refreshUser = async () => {
    const res = await API.get('/api/auth/me');
    setUser(res.data);
    localStorage.setItem('cached_user', JSON.stringify(res.data));
    return res.data;
  };

  const addMessage = (text, type = 'success') => {
    const id = Date.now();
    setMessages(prev => [...prev, { id, text, type }]);
    setTimeout(() => setMessages(prev => prev.filter(m => m.id !== id)), 4000);
  };

  const removeMessage = (id) => setMessages(prev => prev.filter(m => m.id !== id));

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, messages, addMessage, removeMessage }}>
      {children}
    </AuthContext.Provider>
  );
};
