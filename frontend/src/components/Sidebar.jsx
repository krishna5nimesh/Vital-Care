import { BookOpen, BarChart2, MessageCircle, LogOut, Sparkles, Calendar, Activity } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, handleLogout, userName }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header" style={{ flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles color="var(--accent-gold)" size={32} />
          <h2>Vital Care</h2>
        </div>
        {userName && <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Hello, {userName}!</p>}
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
          className={`nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          <Calendar size={20} />
          <span>Reminders & Events</span>
        </div>

        <div 
          className={`nav-item ${activeTab === 'symptoms' ? 'active' : ''}`}
          onClick={() => setActiveTab('symptoms')}
        >
          <Activity size={20} />
          <span>Symptom Analyzer</span>
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
