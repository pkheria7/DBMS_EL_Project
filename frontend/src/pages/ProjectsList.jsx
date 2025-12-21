import React, { useState, useEffect } from 'react';
import client from '../api/client';
import Navbar from '../components/Navbar';
import theme from '../theme';

const ProjectsList = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [filterDomain, setFilterDomain] = useState('');
  const [filterYear, setFilterYear] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await client.get('/projects');
      setProjects(response.data);
    } catch (error) {
      setErrorMessage('Failed to load projects. Please try again.');
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesDomain = !filterDomain || project.domain?.toLowerCase().includes(filterDomain.toLowerCase());
    const matchesYear = !filterYear || project.year?.toString() === filterYear;
    return matchesDomain && matchesYear;
  });

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
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
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '2rem 1rem',
        }}>
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{
              fontFamily: theme.font.family,
              fontSize: '2.5rem',
              fontWeight: theme.font.weights.semibold,
              color: 'white',
              marginBottom: '0.5rem',
            }}>
              Projects
            </h1>
            <p style={{
              fontFamily: theme.font.family,
              fontSize: '1.125rem',
              color: 'rgba(255, 255, 255, 0.9)',
            }}>
              Explore all submitted EL projects
            </p>
          </div>

          {/* Filters */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: theme.font.weights.medium,
                color: theme.colors.text,
                fontFamily: theme.font.family,
              }}>
                Filter by Domain
              </label>
              <input
                type="text"
                value={filterDomain}
                onChange={(e) => setFilterDomain(e.target.value)}
                placeholder="e.g., AI, Web, Mobile"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.9375rem',
                  fontFamily: theme.font.family,
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: theme.font.weights.medium,
                color: theme.colors.text,
                fontFamily: theme.font.family,
              }}>
                Filter by Year
              </label>
              <input
                type="text"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                placeholder="e.g., 2025"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.9375rem',
                  fontFamily: theme.font.family,
                  outline: 'none',
                }}
              />
            </div>
          </div>

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
              Loading projects...
            </div>
          ) : filteredProjects.length === 0 ? (
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
                {projects.length === 0 ? 'No projects found. Submit your first project!' : 'No projects match your filters.'}
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '1.5rem',
            }}>
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  style={cardStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  {/* Project Title */}
                  <h3 style={{
                    fontFamily: theme.font.family,
                    fontSize: '1.25rem',
                    fontWeight: theme.font.weights.semibold,
                    color: theme.colors.primary,
                    marginBottom: '0.75rem',
                    lineHeight: '1.4',
                  }}>
                    {project.title}
                  </h3>

                  {/* Description */}
                  <p style={{
                    fontFamily: theme.font.family,
                    fontSize: '0.875rem',
                    color: '#6B7280',
                    marginBottom: '1rem',
                    lineHeight: '1.5',
                    flexGrow: 1,
                  }}>
                    {project.description?.substring(0, 150)}{project.description?.length > 150 ? '...' : ''}
                  </p>

                  {/* Meta Information */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                  }}>
                    {project.domain && (
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: 'rgba(23, 92, 211, 0.1)',
                        color: theme.colors.primary,
                        borderRadius: '0.375rem',
                        fontSize: '0.8125rem',
                        fontFamily: theme.font.family,
                        fontWeight: theme.font.weights.medium,
                      }}>
                        {project.domain}
                      </span>
                    )}
                    {project.year && (
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: '#F3F4F6',
                        color: theme.colors.text,
                        borderRadius: '0.375rem',
                        fontSize: '0.8125rem',
                        fontFamily: theme.font.family,
                      }}>
                        {project.year}
                      </span>
                    )}
                  </div>

                  {/* Team Info */}
                  {project.team_id && (
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#6B7280',
                      fontFamily: theme.font.family,
                      marginBottom: '1rem',
                    }}>
                      Team ID: {project.team_id}
                    </div>
                  )}

                  {/* View Button */}
                  <button
                    onClick={() => window.location.href = `/projects/${project.id}`}
                    style={{
                      width: '100%',
                      backgroundColor: theme.colors.primary,
                      color: 'white',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      fontSize: '0.9375rem',
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
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProjectsList;
