import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Trash2, Clock, Plus } from 'lucide-react';
import './Appointments.css';

const Appointments = ({ token, fetchDataKey }) => {
  const [appointments, setAppointments] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', type: 'doctor', date: '', time: '' });

  const fetchAppointments = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/appointments', { headers: { Authorization: `Bearer ${token}` } });
      setAppointments(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (token) fetchAppointments();
  }, [token, fetchDataKey]); // refetch if globally triggered

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/appointments', formData, { headers: { Authorization: `Bearer ${token}` } });
      setShowAddForm(false);
      setFormData({ title: '', type: 'doctor', date: '', time: '' });
      fetchAppointments();
    } catch (err) { alert('Check your date formatting.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this reminder?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/appointments/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchAppointments();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="grimoire-container fade-in">
      <div className="grimoire-header">
        <h1>Events & Reminders</h1>
        <button onClick={() => setShowAddForm(!showAddForm)} className="add-btn">
          {showAddForm ? 'Cancel' : <><Plus size={20}/> New Reminder</>}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="appointment-form glass-panel">
          <h3>Create Reminder</h3>
          <div className="form-group">
            <input type="text" placeholder="Title (e.g. Period Start, Dr. Smith)" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
          </div>
          <div className="form-group">
            <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
              <option value="doctor">Doctor's Appointment</option>
              <option value="period">Period Tracker</option>
              <option value="other">Other Health Reminder</option>
            </select>
          </div>
          <div className="form-group row" style={{ display: 'flex', gap: '1rem', width: '100%' }}>
            <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required style={{ marginBottom: 0 }} />
            <input type="time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} required style={{ marginBottom: 0 }} />
          </div>
          <button type="submit" style={{marginTop:'1.5rem', width: '100%', fontSize: '1.2rem', padding: '1rem'}}>
            Save Reminder
          </button>
        </form>
      )}

      <div className="appointments-grid">
        {appointments.length === 0 ? (
          <div className="empty-state">No upcoming reminders recorded.</div>
        ) : (
          appointments.map(appt => {
            const isPast = new Date(appt.scheduledDate) < new Date();
            return (
            <div key={appt._id} className={`appt-card glass-panel ${isPast ? 'past' : ''}`}>
              <div className="appt-header">
                <span className={`type-badge ${appt.type}`}>{appt.type.toUpperCase()}</span>
                <button className="del-btn" onClick={() => handleDelete(appt._id)}><Trash2 size={16}/></button>
              </div>
              <h4 className="appt-title">{appt.title}</h4>
              <div className="appt-datetime">
                <span><Calendar size={16}/> {new Date(appt.scheduledDate).toLocaleDateString()}</span>
                <span><Clock size={16}/> {new Date(appt.scheduledDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            </div>
          )})
        )}
      </div>
    </div>
  );
};

export default Appointments;
