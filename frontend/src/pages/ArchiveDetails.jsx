import React, { useState, useEffect } from 'react';
import client from '../api/client';
import Navbar from '../components/Navbar';
import theme from '../theme';

const ArchiveDetails = () => {
  const [archive, setArchive] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Get archive ID from URL
  const archiveId = window.location.pathname.split('/').pop();

  useEffect(() => {
    if (archiveId && archiveId !== 'archives') {
      fetchArchive();
    }
  }, [archiveId]);

  const fetchArchive = async () => {
    try {
      const response = await client.get(`/archives/${archiveId}`);
      setArchive(response.data);
    } catch (error) {
      setErrorMessage('Failed to load archive details. Please try again.');
      console.error('Error fetching archive:', error);
    } finally {
      setIsLoading(false);
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
            onClick={() => window.location.href = '/archives'}
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
            ← Back to Archives
          </button>

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
              Loading archive details...
            </div>
          ) : !archive ? (
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
                Archive not found
              </p>
            </div>
          ) : (
            <>
              {/* Archive Header */}
              <div style={sectionStyle}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '1rem',
                }}>
                  <h1 style={{
                    fontFamily: theme.font.family,
                    fontSize: '2rem',
                    fontWeight: theme.font.weights.semibold,
                    color: theme.colors.primary,
                  }}>
                    {archive.projecttitle || 'Untitled Project'}
                  </h1>
                  <span style={{
                    padding: '0.375rem 0.875rem',
                    backgroundColor: '#FEF3C7',
                    color: '#92400E',
                    borderRadius: '9999px',
                    fontSize: '0.875rem',
                    fontWeight: theme.font.weights.medium,
                    fontFamily: theme.font.family,
                    flexShrink: 0,
                    marginLeft: '1rem',
                  }}>
                    Archived
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}>
                  {archive.domain && (
                    <span style={{
                      padding: '0.375rem 0.875rem',
                      backgroundColor: 'rgba(23, 92, 211, 0.1)',
                      color: theme.colors.primary,
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontFamily: theme.font.family,
                      fontWeight: theme.font.weights.medium,
                    }}>
                      {archive.domain}
                    </span>
                  )}
                  {archive.year && (
                    <span style={{
                      padding: '0.375rem 0.875rem',
                      backgroundColor: '#F3F4F6',
                      color: theme.colors.text,
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontFamily: theme.font.family,
                    }}>
                      {archive.year}
                    </span>
                  )}
                </div>
              </div>

              {/* Archive Details */}
              <div style={sectionStyle}>
                {archive.archiveid && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <span style={labelStyle}>Archive ID</span>
                    <p style={valueStyle}>{archive.archiveid}</p>
                  </div>
                )}

                {archive.project_id && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <span style={labelStyle}>Original Project ID</span>
                    <p style={valueStyle}>{archive.project_id}</p>
                  </div>
                )}

                {archive.contactinfo && (
                  <div>
                    <span style={labelStyle}>Contact Information</span>
                    <p style={valueStyle}>{archive.contactinfo}</p>
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}>
                <p style={{
                  fontFamily: theme.font.family,
                  fontSize: '0.875rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  lineHeight: '1.6',
                  margin: 0,
                }}>
                  <strong>Note:</strong> This is an archived project from a previous year. The project is read-only and cannot be modified.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ArchiveDetails;
