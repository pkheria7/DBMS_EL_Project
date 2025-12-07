import React, { useState, useEffect } from 'react';
import client from '../api/client';
import Navbar from '../components/Navbar';
import SimilarProjects from '../components/SimilarProjects';
import theme from '../theme';
import toast from 'react-hot-toast';

const SubmitProject = () => {
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [formData, setFormData] = useState({
    team_id: '',
    title: '',
    description: '',
    domain: '',
    demovideolink: '',
    year: '',
    similarityscore: 0,
    projectid: Math.floor(Math.random() * 9000) + 1000, // Random 4-digit (1000-9999)
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch teams on component mount
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await client.get('/teams/');
        setTeams(response.data || []);
      } catch (error) {
        toast.error('Failed to load teams');
        console.error('Error fetching teams:', error);
      } finally {
        setLoadingTeams(false);
      }
    };

    fetchTeams();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.team_id) {
      newErrors.team_id = 'Team is required';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Project title is required';
    }

    if (formData.demovideolink && formData.demovideolink.trim()) {
      if (!formData.demovideolink.startsWith('http://') && !formData.demovideolink.startsWith('https://')) {
        newErrors.demovideolink = 'Demo video link must start with http:// or https://';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        team_id: parseInt(formData.team_id),
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        domain: formData.domain.trim() || null,
        demovideolink: formData.demovideolink.trim() || null,
        year: formData.year || null,
        similarityscore: 0,
        projectid: formData.projectid,
      };

      const response = await client.post('/projects/', payload);

      if (response.status === 201) {
        toast.success('Project submitted successfully!');
        
        // Clear form
        setFormData({
          team_id: '',
          title: '',
          description: '',
          domain: '',
          demovideolink: '',
          year: '',
          similarityscore: 0,
          projectid: Math.floor(Math.random() * 9000) + 1000, // Generate new projectid
        });
        setErrors({});
      }
    } catch (error) {
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error('Unable to submit project');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    border: '1px solid #D1D5DB',
    fontSize: '0.8125rem',
    fontFamily: theme.font.family,
    transition: 'all 0.2s ease',
    outline: 'none',
  };

  const inputFocusStyle = {
    borderColor: theme.colors.primary,
    boxShadow: `0 0 0 3px rgba(23, 92, 211, 0.1)`,
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '0.25rem',
    fontSize: '0.75rem',
    fontWeight: theme.font.weights.medium,
    color: theme.colors.text,
    fontFamily: theme.font.family,
  };

  const errorTextStyle = {
    color: theme.colors.error,
    fontSize: '0.6875rem',
    marginTop: '0.125rem',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.colors.background }}>
      <Navbar />
      <div style={{ 
        paddingTop: '5rem', 
        paddingBottom: '1rem',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        minHeight: 'calc(100vh - 4rem)',
      }}>
        <div className="fade-up" style={{
          maxWidth: '700px',
          width: '100%',
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          padding: '1.5rem',
          maxHeight: 'calc(100vh - 6rem)',
          overflowY: 'auto',
        }}>
          <h1 style={{
            fontFamily: theme.font.family,
            fontSize: '1.5rem',
            fontWeight: theme.font.weights.semibold,
            color: theme.colors.text,
            marginBottom: '1rem',
            textAlign: 'center',
          }}>
            Submit Project
          </h1>

          <form onSubmit={handleSubmit} style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem',
          }}>
            {/* Team Selection */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="team_id" style={labelStyle}>Team *</label>
              <select
                id="team_id"
                name="team_id"
                value={formData.team_id}
                onChange={handleChange}
                disabled={loadingTeams}
                required
                style={{
                  ...inputStyle,
                  ...(errors.team_id ? { borderColor: theme.colors.error } : {}),
                  cursor: loadingTeams ? 'not-allowed' : 'pointer',
                  ...(loadingTeams ? { backgroundColor: '#F3F4F6', opacity: 0.6 } : {}),
                }}
                onFocus={(e) => {
                  if (!errors.team_id && !loadingTeams) {
                    Object.assign(e.target.style, inputFocusStyle);
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.team_id ? theme.colors.error : '#D1D5DB';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="">{loadingTeams ? 'Loading teams...' : 'Select a team'}</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.teamname || `Team ${team.id}`} {team.cluster ? `(${team.cluster})` : ''}
                  </option>
                ))}
              </select>
              {errors.team_id && <div style={errorTextStyle}>{errors.team_id}</div>}
            </div>

            {/* Project Title */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="title" style={labelStyle}>Project Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                style={{
                  ...inputStyle,
                  ...(errors.title ? { borderColor: theme.colors.error } : {}),
                }}
                onFocus={(e) => {
                  if (!errors.title) {
                    Object.assign(e.target.style, inputFocusStyle);
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.title ? theme.colors.error : '#D1D5DB';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {errors.title && <div style={errorTextStyle}>{errors.title}</div>}
            </div>

            {/* Description */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="description" style={labelStyle}>Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                }}
                onFocus={(e) => {
                  Object.assign(e.target.style, inputFocusStyle);
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#D1D5DB';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Domain */}
            <div>
              <label htmlFor="domain" style={labelStyle}>Domain</label>
              <input
                type="text"
                id="domain"
                name="domain"
                value={formData.domain}
                onChange={handleChange}
                style={inputStyle}
                onFocus={(e) => {
                  Object.assign(e.target.style, inputFocusStyle);
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#D1D5DB';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Demo Video Link */}
            <div>
              <label htmlFor="demovideolink" style={labelStyle}>Demo Video Link</label>
              <input
                type="url"
                id="demovideolink"
                name="demovideolink"
                value={formData.demovideolink}
                onChange={handleChange}
                placeholder="https://..."
                style={{
                  ...inputStyle,
                  ...(errors.demovideolink ? { borderColor: theme.colors.error } : {}),
                }}
                onFocus={(e) => {
                  if (!errors.demovideolink) {
                    Object.assign(e.target.style, inputFocusStyle);
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.demovideolink ? theme.colors.error : '#D1D5DB';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {errors.demovideolink && <div style={errorTextStyle}>{errors.demovideolink}</div>}
            </div>

            {/* Year */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="year" style={labelStyle}>Year</label>
              <select
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  cursor: 'pointer',
                }}
                onFocus={(e) => {
                  Object.assign(e.target.style, inputFocusStyle);
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#D1D5DB';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="">Select year</option>
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
            </div>

            {/* Similar Projects Section */}
            <div style={{ gridColumn: '1 / -1' }}>
              <SimilarProjects
                title={formData.title}
                description={formData.description}
                domain={formData.domain}
              />
            </div>

            {/* Submit Button */}
            <div style={{ gridColumn: '1 / -1' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  backgroundColor: isSubmitting ? '#9CA3AF' : theme.colors.primary,
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: theme.font.weights.medium,
                  fontFamily: theme.font.family,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.target.style.backgroundColor = '#1248A8';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.target.style.backgroundColor = theme.colors.primary;
                }
              }}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin"
                    style={{
                      width: '1.125rem',
                      height: '1.125rem',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                    }}
                  />
                  <span>Submitting...</span>
                </>
              ) : (
                'Submit Project'
              )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubmitProject;

