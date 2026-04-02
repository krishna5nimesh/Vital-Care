import React from 'react';
import { BookOpen, BarChart2, MessageCircle, LogOut, Sparkles } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, handleLogout }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <Sparkles color="var(--accent-gold)" size={32} />
        <h2>Vital Care</h2>
      </div>

      <div className="nav-links">
        <div 
          className={`nav-item ${activeTab === 'grimoire' ? 'active' : ''}`}
          onClick={() => setActiveTab('grimoire')}
        >
          <BookOpen size={20} />
          <span>My Medications</span>
        </div>
        
        <div 
          className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          <BarChart2 size={20} />
          <span>Wellness Rate</span>
        </div>

        <div 
          className={`nav-item ${activeTab === 'mystic' ? 'active' : ''}`}
          onClick={() => setActiveTab('mystic')}
        >
          <MessageCircle size={20} />
          <span>AI Health Assistant</span>
        </div>

        <div className="nav-item logout" onClick={handleLogout} style={{marginTop: 'auto'}}>
          <LogOut size={20} />
          <span>Log Out</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
