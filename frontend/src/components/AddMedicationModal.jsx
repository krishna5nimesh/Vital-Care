import React, { useState } from 'react';
import axios from 'axios';
import './Modal.css';

const AddMedicationModal = ({ token, onClose, refresh }) => {
  const [formData, setFormData] = useState({
    name: '', dosage: '', frequency: 'Daily', time: '', color: '#ffd700'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        times: formData.time ? [formData.time] : []
      };
      
      await axios.post('http://localhost:5000/api/medications', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      refresh();
      onClose();
    } catch (err) {
      alert("Failed to add medication.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel">
        <h2>Add Medication</h2>
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Medication Name"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            required
          />
          <input 
            type="text" 
            placeholder="Dosage (e.g. 5 drops)"
            value={formData.dosage}
            onChange={e => setFormData({...formData, dosage: e.target.value})}
            required
          />
          <select 
            value={formData.frequency}
            onChange={e => setFormData({...formData, frequency: e.target.value})}
          >
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="As Needed">As Needed</option>
          </select>
          <input 
            type="time" 
            value={formData.time}
            onChange={e => setFormData({...formData, time: e.target.value})}
            required
          />
          <div className="color-picker-group">
            <label>Label Color:</label>
            <input 
              type="color" 
              value={formData.color}
              onChange={e => setFormData({...formData, color: e.target.value})}
              style={{padding: '0', width: '50px', height: '50px'}}
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} style={{background: 'transparent', color: 'var(--text-secondary)', boxShadow: 'none'}}>Cancel</button>
            <button type="submit">Add Medication</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMedicationModal;
