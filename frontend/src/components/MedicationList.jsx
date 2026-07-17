import React, { useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import AddMedicationModal from './AddMedicationModal';
import './MedicationList.css';

const MedicationList = ({ token, medications, setMedications, logs, setLogs, fetchData, notificationPermission, requestNotificationPermission }) => {
  const [showModal, setShowModal] = useState(false);

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this medication?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/medications/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (fetchData) fetchData();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const updateLogStatus = async (logId, status) => {
    try {
      await axios.put(`http://localhost:5000/api/medications/logs/${logId}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      if (fetchData) fetchData();
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
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={requestNotificationPermission} 
            className={`notification-toggle-btn ${notificationPermission === 'granted' ? 'enabled' : 'disabled'}`}
          >
            {notificationPermission === 'granted' ? '🔔 Notifications Enabled' : '🔕 Notifications Disabled'}
          </button>
          <button onClick={() => setShowModal(true)} className="add-btn">
            <Plus size={20}/> Add Medication
          </button>
        </div>
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
                  <div className="log-actions">
                    {log.status === 'pending' ? (
                      <>
                        <button className="action-btn success" onClick={() => updateLogStatus(log._id, 'taken')}><CheckCircle size={20}/></button>
                        <button className="action-btn danger" onClick={() => updateLogStatus(log._id, 'missed')}><XCircle size={20}/></button>
                      </>
                    ) : (
                      <span className={`log-status-badge ${log.status}`}>
                        {log.status === 'taken' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                        <span style={{ fontSize: '0.8rem', marginLeft: '4px', fontWeight: 'bold' }}>{log.status.toUpperCase()}</span>
                      </span>
                    )}
                  </div>
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
