import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

const MeetingDetails = () => {
  const { id } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);

  const fetchMeetingDetails = async () => {
    try {
      const response = await api.get(`/api/meetings/meetings/${id}/`);
      setMeeting(response.data);
    } catch (err) {
      setError('Failed to load meeting details. It may have been deleted or you do not have permission to view it.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetingDetails();
  }, [id]);

  const handleToggleActionItem = async (itemId, currentStatus) => {
    try {
      const response = await api.patch(`/api/meetings/action-items/${itemId}/`, {
        completed: !currentStatus,
      });
      // Update state locally
      setMeeting({
        ...meeting,
        action_items: meeting.action_items.map((item) =>
          item.id === itemId ? { ...item, completed: response.data.completed } : item
        ),
      });
    } catch (err) {
      alert('Failed to update action item status.');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <p style={{ textAlign: 'center', marginTop: '4rem' }}>Loading meeting analysis details...</p>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="container">
        <div className="alert alert-danger" style={{ marginTop: '2rem' }}>
          {error || 'Meeting not found.'}
        </div>
        <Link to="/">&larr; Back to Dashboard</Link>
      </div>
    );
  }

  // Helper to convert newline lists from backend into bullet items
  const renderList = (text) => {
    if (!text || !text.trim()) return <p style={{ color: 'var(--text-muted)' }}>None recorded.</p>;
    const items = text.split('\n').filter(line => line.trim().length > 0);
    return (
      <ul style={{ paddingLeft: '1.25rem' }}>
        {items.map((item, idx) => {
          // Strip leading bullet markers if present
          const cleanItem = item.replace(/^[\s*\-\u2022]+/g, '').trim();
          return <li key={idx} style={{ marginBottom: '0.4rem' }}>{cleanItem}</li>;
        })}
      </ul>
    );
  };

  const meetingDate = new Date(meeting.created_at).toLocaleString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="container">
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
        <Link to="/">&larr; Back to Dashboard</Link>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Uploaded: {meetingDate}</span>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.25rem', borderBottom: 'none' }}>{meeting.title}</h1>
        {meeting.description && (
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            {meeting.description}
          </p>
        )}
      </div>

      <div className="grid-2">
        {/* Left Side: Summary and Action Items */}
        <div>
          <div className="card">
            <h2 className="card-header">Concise AI Summary</h2>
            <p style={{ whiteSpace: 'pre-wrap' }}>
              {meeting.summary?.summary_text || 'No summary text available.'}
            </p>
          </div>

          <div className="card">
            <h2 className="card-header">Action Items Checklist</h2>
            {meeting.action_items && meeting.action_items.length > 0 ? (
              <ul className="action-items-list">
                {meeting.action_items.map((item) => (
                  <li
                    key={item.id}
                    className={`action-item-row ${item.completed ? 'completed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      className="action-item-checkbox"
                      checked={item.completed}
                      onChange={() => handleToggleActionItem(item.id, item.completed)}
                    />
                    <div style={{ flex: 1 }}>
                      <span>{item.description}</span>
                      {item.assignee && (
                        <span className="action-item-assignee">@{item.assignee}</span>
                      )}
                      {item.due_date && (
                        <span className="action-item-due">Due: {item.due_date}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No actions extracted for this meeting.</p>
            )}
          </div>
        </div>

        {/* Right Side: Key Points & Decisions */}
        <div>
          <div className="card">
            <h2 className="card-header">Key Discussion Points</h2>
            {renderList(meeting.summary?.key_points)}
          </div>

          <div className="card">
            <h2 className="card-header">Decisions Made</h2>
            {renderList(meeting.summary?.decisions)}
          </div>

          <div className="card">
            <h2 className="card-header">Follow-up Tasks</h2>
            {renderList(meeting.summary?.follow_ups)}
          </div>
        </div>
      </div>

      {/* Collapse/Expand Original Transcript */}
      <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
        <button
          className="btn"
          onClick={() => setShowTranscript(!showTranscript)}
          style={{ marginBottom: '1rem' }}
        >
          {showTranscript ? 'Hide Original Transcript' : 'Show Original Transcript'}
        </button>

        {showTranscript && (
          <div className="card" style={{ padding: '1rem' }}>
            <h3>Original Input Content</h3>
            <pre className="transcript-pre">
              {meeting.transcript_text || 'No transcript text stored.'}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingDetails;
