import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const Dashboard = () => {
  const [meetings, setMeetings] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchMeetings = async (searchQuery = '') => {
    setLoading(true);
    try {
      const url = searchQuery ? `/api/meetings/meetings/?search=${encodeURIComponent(searchQuery)}` : '/api/meetings/meetings/';
      const response = await api.get(url);
      setMeetings(response.data);
    } catch (err) {
      setError('Failed to fetch meetings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMeetings(search);
  };

  const handleClearSearch = () => {
    setSearch('');
    fetchMeetings('');
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete the meeting: "${title}"?`)) {
      try {
        await api.delete(`/api/meetings/meetings/${id}/`);
        setMeetings(meetings.filter((m) => m.id !== id));
      } catch (err) {
        alert('Failed to delete meeting. Please try again.');
      }
    }
  };

  return (
    <div className="container">
      <div className="d-flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
        <h2>Meeting History</h2>
        <Link to="/create-meeting" className="btn btn-primary">
          + New Meeting
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="search-bar">
        <input
          type="text"
          className="form-control"
          placeholder="Search by title, description or transcript content..."
          value={search}
          onChange={handleSearchChange}
        />
        <button type="submit" className="btn">Search</button>
        {search && (
          <button type="button" className="btn" onClick={handleClearSearch}>
            Clear
          </button>
        )}
      </form>

      {/* Main Table */}
      <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
        {loading && meetings.length === 0 ? (
          <p style={{ padding: '1.5rem', textAlign: 'center' }}>Loading meetings...</p>
        ) : meetings.length === 0 ? (
          <p style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No meetings found. Click "+ New Meeting" to upload your first transcript.
          </p>
        ) : (
          <table className="table" style={{ margin: '0' }}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>Date Uploaded</th>
                <th>Source Type</th>
                <th>Action Items Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map((meeting) => {
                const totalActions = meeting.action_items?.length || 0;
                const completedActions = meeting.action_items?.filter((a) => a.completed).length || 0;
                const date = new Date(meeting.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <tr key={meeting.id}>
                    <td>
                      <Link to={`/meetings/${meeting.id}`} style={{ fontWeight: 'bold' }}>
                        {meeting.title}
                      </Link>
                    </td>
                    <td>{meeting.description || <span style={{ color: '#ccc' }}>No description</span>}</td>
                    <td>{date}</td>
                    <td>
                      {meeting.uploaded_file ? (
                        <span className="badge badge-info">File</span>
                      ) : (
                        <span className="badge" style={{ backgroundColor: '#e2e8f0', color: '#475569' }}>
                          Text Notes
                        </span>
                      )}
                    </td>
                    <td>
                      {totalActions > 0 ? (
                        <span>
                          {completedActions}/{totalActions} completed
                        </span>
                      ) : (
                        <span style={{ color: '#999' }}>None</span>
                      )}
                    </td>
                    <td className="text-right">
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(meeting.id, meeting.title)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent Summaries Cards panel */}
      {meetings.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Recent AI Summaries</h2>
          <div className="grid-2">
            {meetings.slice(0, 2).map((meeting) => (
              <div key={meeting.id} className="card">
                <h3 style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                  {meeting.title}
                </h3>
                <p style={{ fontSize: '0.9rem', minHeight: '80px' }}>
                  {meeting.summary?.summary_text 
                    ? meeting.summary.summary_text.substring(0, 150) + '...'
                    : 'AI summary is empty or generating...'}
                </p>
                <Link to={`/meetings/${meeting.id}`} style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                  View Full Summary & Decisions &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
