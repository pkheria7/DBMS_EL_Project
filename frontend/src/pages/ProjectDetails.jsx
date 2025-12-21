import React, { useState, useEffect } from 'react';
import client from '../api/client';
import Navbar from '../components/Navbar';
import theme from '../theme';

const ProjectDetails = () => {
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [archiving, setArchiving] = useState(false);

  // Get project ID from URL
  const projectId = window.location.pathname.split('/').pop();

  useEffect(() => {
    if (projectId && projectId !== 'projects') {
      fetchProject();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await client.get(`/projects/${projectId}`);
      setProject(response.data);
    } catch (error) {
      setErrorMessage('Failed to load project details. Please try again.');
      console.error('Error fetching project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!window.confirm('Are you sure you want to archive this project?')) {
      return;
    }

    setArchiving(true);
    try {
      await client.post(`/projects/${projectId}/archive`);
      setSuccessMessage('Project archived successfully!');
      setTimeout(() => {
        window.location.href = '/archives';
      }, 2000);
    } catch (error) {
      setErrorMessage(error.response?.data?.detail || 'Failed to archive project.');
    } finally {
      setArchiving(false);
    }
  };

  const sectionStyle = {
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  };

  const labelStyle = {
    fontSize: '0.875rem',
    fontWeight: theme.font.weights.medium,
    color: '#6B7280',
    fontFamily: theme.font.family,
    marginBottom: '0.5rem',
    display: 'block',
  };

  const valueStyle = {
    fontSize: '1rem',
    color: theme.colors.text,
    fontFamily: theme.font.family,
    lineHeight: '1.6',
  };

  return (
    <>
      <Navbar />
      <div style={{
        minHeight: '100vh',
        background: theme.gradients.hero,
        paddingTop: '5rem',
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '2rem 1rem',
        }}>
          {/* Back Button */}
          <button
            onClick={() => window.location.href = '/projects'}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontSize: '0.9375rem',
              fontFamily: theme.font.family,
              cursor: 'pointer',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            ← Back to Projects
          </button>

          {/* Success Message */}
          {successMessage && (
            <div style={{
              backgroundColor: '#D1FAE5',
              color: '#065F46',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              fontFamily: theme.font.family,
            }}>
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div style={{
              backgroundColor: '#FEE2E2',
              color: '#991B1B',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              fontFamily: theme.font.family,
            }}>
              {errorMessage}
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '300px',
              color: 'white',
              fontFamily: theme.font.family,
              fontSize: '1.125rem',
            }}>
              Loading project details...
            </div>
          ) : !project ? (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '3rem',
              textAlign: 'center',
            }}>
              <p style={{
                fontFamily: theme.font.family,
                fontSize: '1.125rem',
                color: '#6B7280',
              }}>
                Project not found
              </p>
            </div>
          ) : (
            <>
              {/* Project Header */}
              <div style={sectionStyle}>
                <h1 style={{
                  fontFamily: theme.font.family,
                  fontSize: '2rem',
                  fontWeight: theme.font.weights.semibold,
                  color: theme.colors.primary,
                  marginBottom: '1rem',
                }}>
                  {project.title}
                </h1>

                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}>
                  {project.domain && (
                    <span style={{
                      padding: '0.375rem 0.875rem',
                      backgroundColor: 'rgba(23, 92, 211, 0.1)',
                      color: theme.colors.primary,
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontFamily: theme.font.family,
                      fontWeight: theme.font.weights.medium,
                    }}>
                      {project.domain}
                    </span>
                  )}
                  {project.year && (
                    <span style={{
                      padding: '0.375rem 0.875rem',
                      backgroundColor: '#F3F4F6',
                      color: theme.colors.text,
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontFamily: theme.font.family,
                    }}>
                      {project.year}
                    </span>
                  )}
                </div>
              </div>

              {/* Project Details */}
              <div style={sectionStyle}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <span style={labelStyle}>Description</span>
                  <p style={valueStyle}>{project.description || 'No description available'}</p>
                </div>

                {project.team_id && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <span style={labelStyle}>Team ID</span>
                    <p style={valueStyle}>{project.team_id}</p>
                  </div>
                )}

                {project.projectid && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <span style={labelStyle}>Project ID</span>
                    <p style={valueStyle}>{project.projectid}</p>
                  </div>
                )}

                {project.similarityscore !== undefined && project.similarityscore !== null && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <span style={labelStyle}>Similarity Score</span>
                    <p style={valueStyle}>{project.similarityscore}</p>
                  </div>
                )}

                {project.demovideolink && (
                  <div>
                    <span style={labelStyle}>Demo Video</span>
                    <a
                      href={project.demovideolink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: theme.colors.primary,
                        textDecoration: 'none',
                        fontFamily: theme.font.family,
                        fontSize: '1rem',
                      }}
                    >
                      Watch Demo →
                    </a>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
              }}>
                <button
                  onClick={() => window.location.href = `/projects/${projectId}/edit`}
                  style={{
                    flex: 1,
                    minWidth: '200px',
                    backgroundColor: theme.colors.primary,
                    color: 'white',
                    padding: '0.875rem 1.5rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    fontSize: '1rem',
                    fontWeight: theme.font.weights.medium,
                    fontFamily: theme.font.family,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = theme.colors.primaryLight;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = theme.colors.primary;
                  }}
                >
                  Edit Project
                </button>

                <button
                  onClick={handleArchive}
                  disabled={archiving}
                  style={{
                    flex: 1,
                    minWidth: '200px',
                    backgroundColor: archiving ? '#9CA3AF' : '#EF4444',
                    color: 'white',
                    padding: '0.875rem 1.5rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    fontSize: '1rem',
                    fontWeight: theme.font.weights.medium,
                    fontFamily: theme.font.family,
                    cursor: archiving ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!archiving) {
                      e.target.style.backgroundColor = '#DC2626';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!archiving) {
                      e.target.style.backgroundColor = '#EF4444';
                    }
                  }}
                >
                  {archiving ? 'Archiving...' : 'Archive Project'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ProjectDetails;
