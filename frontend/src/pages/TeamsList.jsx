import React, { useState, useEffect } from 'react';
import client from '../api/client';
import Navbar from '../components/Navbar';
import theme from '../theme';

const TeamsList = () => {
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await client.get('/teams');
      setTeams(response.data);
    } catch (error) {
      setErrorMessage('Failed to load teams. Please try again.');
      console.error('Error fetching teams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  };

  const badgeStyle = (hasProject) => ({
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: theme.font.weights.medium,
    backgroundColor: hasProject ? '#D1FAE5' : '#FEE2E2',
    color: hasProject ? '#065F46' : '#991B1B',
  });

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
              Teams
            </h1>
            <p style={{
              fontFamily: theme.font.family,
              fontSize: '1.125rem',
              color: 'rgba(255, 255, 255, 0.9)',
            }}>
              View all registered teams and their projects
            </p>
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
              Loading teams...
            </div>
          ) : teams.length === 0 ? (
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
                No teams found. Create your first team!
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '1.5rem',
            }}>
              {teams.map((team) => (
                <div
                  key={team.id}
                  style={cardStyle}
                  onClick={() => window.location.href = `/teams/${team.id}`}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  {/* Team Name */}
                  <h3 style={{
                    fontFamily: theme.font.family,
                    fontSize: '1.25rem',
                    fontWeight: theme.font.weights.semibold,
                    color: theme.colors.primary,
                    marginBottom: '0.75rem',
                  }}>
                    {team.teamname || 'Unnamed Team'}
                  </h3>

                  {/* Cluster */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                  }}>
                    <span style={{
                      fontFamily: theme.font.family,
                      fontSize: '0.875rem',
                      color: '#6B7280',
                      fontWeight: theme.font.weights.medium,
                    }}>
                      Cluster:
                    </span>
                    <span style={{
                      fontFamily: theme.font.family,
                      fontSize: '0.875rem',
                      color: theme.colors.text,
                    }}>
                      {team.cluster || 'N/A'}
                    </span>
                  </div>

                  {/* Status */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.75rem',
                  }}>
                    <span style={{
                      fontFamily: theme.font.family,
                      fontSize: '0.875rem',
                      color: '#6B7280',
                      fontWeight: theme.font.weights.medium,
                    }}>
                      Status:
                    </span>
                    <span style={{
                      fontFamily: theme.font.family,
                      fontSize: '0.875rem',
                      color: theme.colors.text,
                      textTransform: 'capitalize',
                    }}>
                      {team.status || 'Active'}
                    </span>
                  </div>

                  {/* Members */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <span style={{
                      fontFamily: theme.font.family,
                      fontSize: '0.875rem',
                      color: '#6B7280',
                      fontWeight: theme.font.weights.medium,
                    }}>
                      Members:
                    </span>
                    <div style={{
                      marginTop: '0.5rem',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}>
                      {team.members && team.members.length > 0 ? (
                        team.members.map((member, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: '0.25rem 0.75rem',
                              backgroundColor: '#F3F4F6',
                              borderRadius: '0.375rem',
                              fontSize: '0.8125rem',
                              fontFamily: theme.font.family,
                              color: theme.colors.text,
                            }}
                          >
                            {member.name}
                          </span>
                        ))
                      ) : (
                        <span style={{
                          fontFamily: theme.font.family,
                          fontSize: '0.8125rem',
                          color: '#9CA3AF',
                        }}>
                          No members yet
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Project Status Badge */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginTop: '1rem',
                  }}>
                    <span style={badgeStyle(team.has_project)}>
                      {team.has_project ? '✓ Project Submitted' : '○ No Project'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TeamsList;
