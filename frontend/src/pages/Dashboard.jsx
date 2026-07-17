import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import MedicationList from '../components/MedicationList';
import Analytics from '../components/Analytics';
import Chatbot from '../components/Chatbot';
import Appointments from '../components/Appointments';
import SymptomChecker from '../components/SymptomChecker';
import './Dashboard.css';
import '../components/MedicationList.css'; 

const Dashboard = ({ token, setToken }) => {
  const [activeTab, setActiveTab] = useState('grimoire');
  const [medications, setMedications] = useState([]);
  const [logs, setLogs] = useState([]);
  const [globalAppts, setGlobalAppts] = useState([]);
  const [fetchDataKey, setFetchDataKey] = useState(0); // to force child re-fetches
  
  // Get user name
  const [userName, setUserName] = useState('');
  
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        if (userObj.name) setUserName(userObj.name);
      } catch (e) { console.error('Failed to parse user', e); }
    }
  }, []);

  // Notification States
  const [toasts, setToasts] = useState([]);
  const [showNotificationHelp, setShowNotificationHelp] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(
    'Notification' in window ? Notification.permission : 'denied'
  );

  useEffect(() => {
    // Initial permission check
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    }
  }, []);

  const addToast = (title, message) => {
    // Play notification sound
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(e => console.log('Audio play blocked by browser interaction policies', e));
    } catch (err) {
      console.log('Error playing sound', err);
    }

    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, title, message, isFadingOut: false }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, isFadingOut: true } : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 500);
    }, 6000);
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      addToast("Not Supported", "Your browser does not support desktop notifications. In-app notifications will still work!");
      return;
    }
    
    if (Notification.permission === 'granted') {
      addToast("Already Active", "🔔 Notifications are already active! You will receive desktop and in-app alerts.");
      return;
    }

    if (Notification.permission === 'denied') {
      setShowNotificationHelp(true);
      return;
    }

    addToast("Check Browser Prompt", "Please click 'Allow' in the prompt that appears at the top left of your browser window.");
    
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        addToast("Notifications Enabled", "🔔 Success! You will now receive desktop alerts for your medications.");
      } else if (permission === 'denied') {
        setShowNotificationHelp(true);
      } else {
        addToast("Notifications Disabled", "Desktop alerts were not enabled.");
      }
    } catch (err) {
      console.error("Permission request error:", err);
      addToast("Error", "Failed to open notification prompt.");
    }
  };

  const fetchData = async () => {
    try {
      const [medsRes, logsRes, apptRes] = await Promise.all([
        axios.get('http://localhost:5000/api/medications', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:5000/api/medications/logs', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:5000/api/appointments', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setMedications(medsRes.data);
      setLogs(logsRes.data);
      setGlobalAppts(apptRes.data);
      setFetchDataKey(prev => prev + 1);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  // Global Schedule Checking Interval
  useEffect(() => {
    if (!token) return;
    const checkSchedule = setInterval(async () => {
      const now = new Date();
      
      // Check medication logs
      logs.forEach(async (log) => {
        if (log.status === 'pending' && !log.notified) {
          const scheduledDate = new Date(log.scheduledTime);
          const diffMins = (now - scheduledDate) / 60000;
          
          if (diffMins >= 0) {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification("Vital Care Reminder", { body: `It's time to take ${log.medication?.name || 'your medication'}!` });
            }
            addToast("Medication Reminder", `It's time to take ${log.medication?.name || 'your medication'} (${log.medication?.dosage || ''})!`);
            
            try {
              await axios.put(`http://localhost:5000/api/medications/logs/${log._id}/notify`, {}, { headers: { Authorization: `Bearer ${token}` } });
              fetchData();
            } catch(e) { console.error(e) }
          }
        }
      });

      // Check appointments / period reminders
      globalAppts.forEach(async (appt) => {
        if (!appt.notified) {
          const scheduledDate = new Date(appt.scheduledDate);
          const diffMins = (now - scheduledDate) / 60000;
          
          if (diffMins >= 0) {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification("Vital Care Event", { body: `Reminder: ${appt.title}` });
            }
            addToast(`Event: ${appt.type.toUpperCase()}`, `Reminder: ${appt.title}`);
            
            try {
              await axios.put(`http://localhost:5000/api/appointments/${appt._id}/notify`, {}, { headers: { Authorization: `Bearer ${token}` } });
              fetchData();
            } catch(e) { console.error(e) }
          }
        }
      });

    }, 15000); // Check every 15 seconds

    return () => clearInterval(checkSchedule);
  }, [logs, globalAppts, token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} userName={userName} />
      
      <div className="main-content">
        {activeTab === 'grimoire' && <MedicationList 
            token={token} 
            medications={medications} 
            setMedications={setMedications} 
            logs={logs} 
            setLogs={setLogs} 
            fetchData={fetchData}
            notificationPermission={notificationPermission}
            requestNotificationPermission={requestNotificationPermission}
            setShowNotificationHelp={setShowNotificationHelp}
        />}
        {activeTab === 'stats' && <Analytics token={token} medications={medications} />}
        {activeTab === 'appointments' && <Appointments token={token} fetchDataKey={fetchDataKey} />}
        {activeTab === 'symptoms' && <SymptomChecker token={token} />}
        {activeTab === 'mystic' && <Chatbot token={token} />}
      </div>

       {/* Browser Notification Helper Modal */}
       {showNotificationHelp && (
        <div className="modal-overlay" onClick={() => setShowNotificationHelp(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '28px', zIndex: 1000 }}>
            <h2 style={{ color: 'var(--accent-gold)', fontFamily: "'Cinzel', serif", textShadow: '0 0 10px rgba(255, 215, 0, 0.3)' }}>Enable Notifications</h2>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-primary)', margin: 0 }}>
              Browser notifications are blocked for localhost. Since it runs over HTTP, Edge and Chrome require you to toggle it in your site permissions panel. Follow these steps:
            </p>
            <ol style={{ fontSize: '0.9rem', lineHeight: '1.7', paddingLeft: '20px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.6rem', margin: 0 }}>
              <li>Look at the address bar next to the URL.</li>
              <li>Click the circular <strong>Info icon (ⓘ)</strong> or the lock icon 🔒 on the left side of the address bar.</li>
              <li>Click the <strong>"Permissions for this site"</strong> option (with the gear icon ⚙️).</li>
              <li>In the browser settings tab that opens, find <strong>"Notifications"</strong> and change the setting to <strong>"Allow"</strong>.</li>
              <li>Go back to this app and <strong>refresh the page</strong>.</li>
            </ol>
            <div className="modal-actions" style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowNotificationHelp(false)} style={{ width: '100%', background: 'linear-gradient(45deg, var(--accent-pink), #ff0055)' }}>
                Got it, let me try!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Premium Toast Container */}
      {toasts.length > 0 && (
        <div className="notification-toast-container" style={{ zIndex: 9999 }}>
          {toasts.map(toast => (
            <div key={toast.id} className={`notification-toast ${toast.isFadingOut ? 'fade-out' : ''}`}>
              <span className="toast-icon">🔔</span>
              <div className="toast-content">
                <h5>{toast.title}</h5>
                <p>{toast.message}</p>
              </div>
              <button 
                className="toast-close" 
                onClick={() => {
                  setToasts(prev => prev.map(t => t.id === toast.id ? { ...t, isFadingOut: true } : t));
                  setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toast.id)), 500);
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
