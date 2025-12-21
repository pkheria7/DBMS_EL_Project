import React, { useState, useEffect } from 'react';
import client from '../api/client';
import Navbar from '../components/Navbar';
import theme from '../theme';

const ArchivesList = () => {
  const [archives, setArchives] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [filterDomain, setFilterDomain] = useState('');
  const [filterYear, setFilterYear] = useState('');

  useEffect(() => {
    fetchArchives();
  }, []);

  const fetchArchives = async () => {
    try {
      const response = await client.get('/archives');
      setArchives(response.data);
    } catch (error) {
      setErrorMessage('Failed to load archives. Please try again.');
      console.error('Error fetching archives:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredArchives = archives.filter(archive => {
    const matchesDomain = !filterDomain || archive.domain?.toLowerCase().includes(filterDomain.toLowerCase());
    const matchesYear = !filterYear || archive.year?.toString() === filterYear;
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
    position: 'relative',
    overflow: 'hidden',
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
              Archives
            </h1>
            <p style={{
              fontFamily: theme.font.family,
              fontSize: '1.125rem',
              color: 'rgba(255, 255, 255, 0.9)',
            }}>
              Browse archived EL projects from previous years
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
                placeholder="e.g., 2024"
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
              Loading archives...
            </div>
          ) : filteredArchives.length === 0 ? (
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
                {archives.length === 0 ? 'No archived projects found.' : 'No archives match your filters.'}
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '1.5rem',
            }}>
              {filteredArchives.map((archive) => (
                <div
                  key={archive.id}
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
                  {/* Archived Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    padding: '0.25rem 0.75rem',
                    backgroundColor: '#FEF3C7',
                    color: '#92400E',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: theme.font.weights.medium,
                    fontFamily: theme.font.family,
                  }}>
                    Archived
                  </div>

                  {/* Project Title */}
                  <h3 style={{
                    fontFamily: theme.font.family,
                    fontSize: '1.25rem',
                    fontWeight: theme.font.weights.semibold,
                    color: theme.colors.primary,
                    marginBottom: '0.75rem',
                    lineHeight: '1.4',
                    paddingRight: '5rem',
                  }}>
                    {archive.projecttitle || 'Untitled Project'}
                  </h3>

                  {/* Meta Information */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                  }}>
                    {archive.domain && (
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: 'rgba(23, 92, 211, 0.1)',
                        color: theme.colors.primary,
                        borderRadius: '0.375rem',
                        fontSize: '0.8125rem',
                        fontFamily: theme.font.family,
                        fontWeight: theme.font.weights.medium,
                      }}>
                        {archive.domain}
                      </span>
                    )}
                    {archive.year && (
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: '#F3F4F6',
                        color: theme.colors.text,
                        borderRadius: '0.375rem',
                        fontSize: '0.8125rem',
                        fontFamily: theme.font.family,
                      }}>
                        {archive.year}
                      </span>
                    )}
                  </div>

                  {/* Contact Info */}
                  {archive.contactinfo && (
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#6B7280',
                      fontFamily: theme.font.family,
                      marginBottom: '1rem',
                      flexGrow: 1,
                    }}>
                      Contact: {archive.contactinfo}
                    </div>
                  )}

                  {/* View Button */}
                  <button
                    onClick={() => window.location.href = `/archives/${archive.id}`}
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

export default ArchivesList;
