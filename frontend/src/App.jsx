import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    // Check if token exists, otherwise require auth
    const storedToken = localStorage.getItem('token');
    if (storedToken) setToken(storedToken);
  }, []);

  useEffect(() => {
    // Intercept 401 unauthorized responses to clear token and log out
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  return (
    <Router>
      <div className="app-container">
         <main>
            <Routes>
              {/* If no token, show login. Once logged in, show Dashboard */}
              <Route path="/*" element={token ? <Dashboard token={token} setToken={setToken}/> : <Auth setToken={setToken} />} />
            </Routes>
         </main>
      </div>
    </Router>
  );
}

export default App;
