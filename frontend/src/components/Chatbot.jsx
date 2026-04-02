import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Wand2, Sparkles } from 'lucide-react';
import './Chatbot.css';

const Chatbot = ({ token }) => {
  const [messages, setMessages] = useState([
    { text: "Welcome. I am your AI Health Assistant. Ask me about your medications and adherence.", isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { text: userMsg, isBot: false }]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/ai/chat', { message: userMsg }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(prev => [...prev, { text: res.data.reply, isBot: true }]);
    } catch (err) {
      setMessages(prev => [...prev, { text: "Connection error... I cannot reach the server right now.", isBot: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-container fade-in">
      <div className="chatbot-header">
        <Sparkles size={24} color="var(--accent-gold)"/>
        <h2>AI Health Assistant</h2>
      </div>

      <div className="chat-window glass-panel">
        <div className="msgs-area">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-bubble ${msg.isBot ? 'bot' : 'user'}`}>
              <div className="bubble-text">{msg.text}</div>
            </div>
          ))}
          {loading && (
            <div className="chat-bubble bot">
              <div className="bubble-text typing">Analyzing data...</div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form className="chat-input-area" onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Ask a question..." 
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading} className="send-btn">
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
