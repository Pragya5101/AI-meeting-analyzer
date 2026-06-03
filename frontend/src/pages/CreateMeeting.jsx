import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const CreateMeeting = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sourceType, setSourceType] = useState('file'); // 'file' or 'notes'
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.strip && !title.trim()) {
      setError('Please provide a meeting title.');
      return;
    }

    if (sourceType === 'file' && !file) {
      setError('Please select a transcript file (.txt or .pdf) to upload.');
      return;
    }

    if (sourceType === 'notes' && !notes.trim()) {
      setError('Please paste the meeting notes.');
      return;
    }

    setLoading(true);

    // Using FormData for file uploads
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    
    if (sourceType === 'file') {
      formData.append('uploaded_file', file);
    } else {
      formData.append('notes', notes);
    }

    try {
      const response = await api.post('/api/meetings/meetings/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      // Redirect to the newly created meeting's details page
      navigate(`/meetings/${response.data.id}`);
    } catch (err) {
      if (err.response?.data) {
        const details = err.response.data;
        const messages = Object.keys(details).map(key => `${key}: ${details[key]}`);
        setError('Error: ' + messages.join(' | '));
      } else {
        setError('Failed to create meeting and run AI summary. Please check your backend connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/">&larr; Back to Dashboard</Link>
      </div>

      <h2>Create New Meeting Summary</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Meeting Title</label>
            <input
              id="title"
              type="text"
              className="form-control"
              placeholder="e.g. Q3 Roadmap Planning Session"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description / Objective</label>
            <textarea
              id="description"
              className="form-control"
              placeholder="Provide a brief context or description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              style={{ minHeight: '60px' }}
            />
          </div>

          {/* Toggle source type */}
          <div className="form-group">
            <label>Transcript Source</label>
            <div style={{ display: 'flex', gap: '2rem', marginTop: '0.25rem' }}>
              <label style={{ fontWeight: 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="sourceType"
                  value="file"
                  checked={sourceType === 'file'}
                  onChange={() => setSourceType('file')}
                  disabled={loading}
                />
                Upload File (.txt, .pdf)
              </label>
              <label style={{ fontWeight: 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="sourceType"
                  value="notes"
                  checked={sourceType === 'notes'}
                  onChange={() => setSourceType('notes')}
                  disabled={loading}
                />
                Paste Notes / Plain Text
              </label>
            </div>
          </div>

          {/* Source specific inputs */}
          {sourceType === 'file' ? (
            <div className="form-group">
              <label htmlFor="file">Choose File</label>
              <input
                id="file"
                type="file"
                className="form-control"
                accept=".txt,.pdf"
                onChange={handleFileChange}
                disabled={loading}
                required
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Supported file formats: Plain text (.txt), PDF Document (.pdf)
              </span>
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="notes">Meeting Transcript / Notes Content</label>
              <textarea
                id="notes"
                className="form-control"
                placeholder="Paste the raw meeting transcript text or markdown notes here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
                required
                style={{ minHeight: '200px' }}
              />
            </div>
          )}

          {loading && (
            <div className="alert" style={{ backgroundColor: '#fef3c7', borderColor: '#fde68a', color: '#92400e', marginBottom: '1.5rem' }}>
              <strong>AI Summarization in progress:</strong> Extracting transcript text and sending context to Google Gemini. This may take 5 to 15 seconds. Please do not close or reload this page.
            </div>
          )}

          <div className="d-flex justify-between items-center" style={{ marginTop: '1.5rem' }}>
            <Link to="/" className="btn" style={{ cursor: loading ? 'not-allowed' : 'pointer' }}>
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Processing...' : 'Generate Summary'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMeeting;
