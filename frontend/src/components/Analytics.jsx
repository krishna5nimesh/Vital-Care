import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';
import './Analytics.css';

const Analytics = ({ token }) => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/medications/logs', { headers: { Authorization: `Bearer ${token}` } });
        setLogs(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchLogs();
  }, [token]);

  // Transform data for charts
  const processData = () => {
    let taken = 0;
    let missed = 0;
    let pending = 0;
    
    logs.forEach(l => {
        if (l.status === 'taken') taken++;
        if (l.status === 'missed') missed++;
        if (l.status === 'pending') pending++;
    });

    return [
      { name: 'Taken', value: taken },
      { name: 'Missed', value: missed },
      { name: 'Pending', value: pending },
    ];
  };

  const COLORS = ['#00e676', '#ff1744', '#ffd700'];

  const generateTrendData = () => {
    const days = [];
    const now = new Date();
    
    // Generate data for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toDateString();
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const dayLogs = logs.filter(l => new Date(l.scheduledTime).toDateString() === dateStr);
      let taken = 0;
      let totalActionable = 0;
      
      dayLogs.forEach(l => {
        if (l.status === 'taken') { taken++; totalActionable++; }
        if (l.status === 'missed') { totalActionable++; }
      });

      const adherence = totalActionable === 0 ? 0 : Math.round((taken / totalActionable) * 100);
      days.push({ day: dayName, adherence });
    }
    return days;
  };

  const trendData = generateTrendData();

  return (
    <div className="analytics-container fade-in">
      <h1>Wellness Rate</h1>
      <p className="subtitle">View your medication adherence over time.</p>
      
      <div className="charts-grid">
        <div className="glass-panel chart-box">
          <h3>Overall Adherence</h3>
          <div style={{width: '100%', height: 300}}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={processData()}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {processData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{background: '#1a0b2e', border:'1px solid #ffd700', borderRadius: '8px'}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="legend">
            <span style={{color: '#00e676'}}>■ Taken</span>
            <span style={{color: '#ff1744'}}>■ Missed</span>
            <span style={{color: '#ffd700'}}>■ Pending</span>
          </div>
        </div>

        <div className="glass-panel chart-box">
          <h3>Weekly Health Trend</h3>
          <div style={{width: '100%', height: 300}}>
            <ResponsiveContainer>
              <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-pink)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--accent-pink)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <Tooltip contentStyle={{background: '#1a0b2e', border:'none', borderRadius: '8px'}}/>
                <Area type="monotone" dataKey="adherence" stroke="var(--accent-pink)" fillOpacity={1} fill="url(#colorUv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
