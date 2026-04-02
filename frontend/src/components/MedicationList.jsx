import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import AddMedicationModal from './AddMedicationModal';
import './MedicationList.css';

const MedicationList = ({ token, medications, setMedications, logs, setLogs }) => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  const fetchData = async () => {
    try {
      const [medsRes, logsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/medications', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:5000/api/medications/logs', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setMedications(medsRes.data);
      setLogs(logsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  useEffect(() => {
    const checkSchedule = setInterval(async () => {
      const now = new Date();
      logs.forEach(async (log) => {
        if (log.status === 'pending' && !log.notified) {
          const scheduledDate = new Date(log.scheduledTime);
          const diffMins = (now - scheduledDate) / 60000;
          
          if (diffMins >= 0 && diffMins < 2) { // Within 2 minutes of schedule
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification("Vital Care Reminder", { body: `It's time to take ${log.medication?.name || 'your medication'}!` });
            } else {
              alert(`Vital Care Reminder: It's time to take ${log.medication?.name || 'your medication'}!`);
            }
            // Mark as notified so we don't spam
            try {
              await axios.put(`http://localhost:5000/api/medications/logs/${log._id}/notify`, {}, { headers: { Authorization: `Bearer ${token}` } });
              fetchData();
            } catch(e) { console.error(e) }
          }
        }
      });
    }, 30000); // check every 30 seconds

    return () => clearInterval(checkSchedule);
  }, [logs, token]);

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this medication?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/medications/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const updateLogStatus = async (logId, status) => {
    try {
      await axios.put(`http://localhost:5000/api/medications/logs/${logId}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (err) {
      console.error("Update log failed", err);
    }
  };

  const formatTimeAMPM = (timeStr) => {
    const [h, m] = timeStr.split(':');
    const d = new Date();
    d.setHours(h, m, 0);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className="grimoire-container fade-in">
      <div className="grimoire-header">
        <h1>Medication Schedule</h1>
        <button onClick={() => setShowModal(true)} className="add-btn">
          <Plus size={20}/> Add Medication
        </button>
      </div>

      <div className="content-grid">
        <div className="medications-panel">
          <h3>Your Medications</h3>
          {medications.length === 0 ? (
            <div className="empty-state">No medications added yet. Add one above!</div>
          ) : (
            <div className="med-list">
              {medications.map(med => (
                <div key={med._id} className="med-card glass-panel" style={{borderLeft: `5px solid ${med.color}`}}>
                  <div className="med-info">
                    <h4>{med.name}</h4>
                    <p>{med.dosage} - {med.frequency}</p>
                    <div className="med-times">
                      {med.times.map(t => <span key={t} className="time-badge">{t ? formatTimeAMPM(t) : ''}</span>)}
                    </div>
                  </div>
                  <button className="del-btn" onClick={() => handleDelete(med._id)}><Trash2 size={18}/></button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="logs-panel glass-panel">
          <h3>Today's Schedule</h3>
          {logs.filter(l => new Date(l.scheduledTime).toDateString() === new Date().toDateString()).length === 0 ? (
            <div className="empty-state">Looks clear! Nothing scheduled for today.</div>
          ) : (
            <div className="log-list">
              {logs.filter(l => new Date(l.scheduledTime).toDateString() === new Date().toDateString()).map(log => (
                <div key={log._id} className={`log-item ${log.status}`}>
                  <div className="log-details">
                    <div className="log-time">{new Date(log.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true})}</div>
                    <div className="log-name" style={{color: log.medication?.color}}>{log.medication?.name || "Unknown Medication"}</div>
                  </div>
                  {log.status === 'pending' ? (
                    <div className="log-actions">
                      <button className="action-btn success" onClick={() => updateLogStatus(log._id, 'taken')}><CheckCircle size={20}/></button>
                      <button className="action-btn danger" onClick={() => updateLogStatus(log._id, 'missed')}><XCircle size={20}/></button>
                    </div>
                  ) : (
                    <div className="log-status-badge">
                      {log.status === 'taken' ? 'Taken' : 'Missed'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && <AddMedicationModal token={token} onClose={() => setShowModal(false)} refresh={fetchData} />}
    </div>
  );
};

export default MedicationList;
