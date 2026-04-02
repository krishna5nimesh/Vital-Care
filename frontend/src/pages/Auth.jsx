import React, { useState } from 'react';
import axios from 'axios';
import { Wand2 } from 'lucide-react';

const Auth = ({ setToken }) => {
  const [isLogin, setIsLogin] = useState(true);

  function formDataInit() { return { email: '', password: '', name: '' } }
  const [formData, setFormData] = useState(formDataInit());

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    try {
      const res = await axios.post(`http://localhost:5000${endpoint}`, formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify({name: res.data.name, id: res.data._id}));
      setToken(res.data.token);
    } catch (err) {
      alert(err.response?.data?.message || 'Authentication Failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-panel auth-panel">
        <div style={{display:'flex',justifyContent:'center',marginBottom:'1rem'}}>
          <Wand2 size={48} color="var(--accent-gold)" />
        </div>
        <h1>Vital Care</h1>
        <h2>{isLogin ? 'Log In' : 'Register Account'}</h2>
        
        <form onSubmit={handleSubmit} style={{marginTop: '2rem'}}>
          {!isLogin && (
            <input 
              type="text" 
              placeholder="Full Name" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required={!isLogin}
            />
          )}
          <input 
            type="email" 
            placeholder="Email Address" 
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
          <button type="submit" style={{width: '100%', marginTop: '1rem'}}>
            {isLogin ? 'Log In' : 'Register'}
          </button>
        </form>
        
        <button 
          className="auth-toggle" 
          onClick={() => {setIsLogin(!isLogin); setFormData(formDataInit());}}>
          {isLogin ? "Don't have an account? Register here." : 'Already have an account? Log in here.'}
        </button>
      </div>
    </div>
  );
};

export default Auth;
