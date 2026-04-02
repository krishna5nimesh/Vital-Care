import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import MedicationList from '../components/MedicationList';
import Analytics from '../components/Analytics';
import Chatbot from '../components/Chatbot';
import './Dashboard.css';

const Dashboard = ({ token, setToken }) => {
  const [activeTab, setActiveTab] = useState('grimoire'); // grimoire, stats, mystic
  const [medications, setMedications] = useState([]);
  const [logs, setLogs] = useState([]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} />
      
      <div className="main-content">
        {activeTab === 'grimoire' && <MedicationList token={token} medications={medications} setMedications={setMedications} logs={logs} setLogs={setLogs} />}
        {activeTab === 'stats' && <Analytics token={token} medications={medications} />}
        {activeTab === 'mystic' && <Chatbot token={token} />}
      </div>
    </div>
  );
};

export default Dashboard;
