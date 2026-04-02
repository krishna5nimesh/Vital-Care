import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
