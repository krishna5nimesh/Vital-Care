import React, { useState } from 'react';
import axios from 'axios';
import { Activity, Send, AlertCircle } from 'lucide-react';
import './SymptomChecker.css';

const SymptomChecker = ({ token }) => {
  const [symptoms, setSymptoms] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!symptoms.trim()) return;
    
    setLoading(true);
    setAnalysis('');
    
    try {
      const res = await axios.post('http://localhost:5000/api/symptoms/analyze', { symptoms }, { headers: { Authorization: `Bearer ${token}` } });
      setAnalysis(res.data.reply);
    } catch (err) {
      setAnalysis('Unable to connect to the medical analysis engine. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grimoire-container fade-in symptom-checker-layout">
      <div className="grimoire-header">
        <h1>Symptom Analyzer</h1>
      </div>

      <div className="symptom-content">
        <div className="symptom-input-panel glass-panel">
          <div className="panel-header">
            <Activity color="var(--accent-gold)" />
            <h3>Describe Your Symptoms</h3>
          </div>
          <p className="helper-text">Enter your current symptoms in detail (e.g., "I have a mild headache, slight fever of 100°F, and feel very tired since yesterday").</p>
          
          <textarea 
            className="symptom-input" 
            placeholder="Type your symptoms here..."
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
          />
          
          <button className="analyze-btn" onClick={handleAnalyze} disabled={loading || !symptoms.trim()}>
            {loading ? <span className="spinner"></span> : <><Send size={18}/> Analyze Symptoms</>}
          </button>
        </div>

        <div className="symptom-results-panel glass-panel">
          {analysis ? (
             <div className="analysis-result fade-in">
                <div className="disclaimer-alert">
                  <AlertCircle size={20} color="#ff1744" />
                  <p><strong>Remember:</strong> This is AI-generated informational guidance, not professional medical advice.</p>
                </div>
                <div className="ai-formatted-text" style={{marginTop: '1.5rem', lineHeight: '1.6', whiteSpace: 'pre-wrap'}}>
                  {analysis}
                </div>
             </div>
          ) : (
            <div className="empty-state">
              Your analysis results will appear here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SymptomChecker;
