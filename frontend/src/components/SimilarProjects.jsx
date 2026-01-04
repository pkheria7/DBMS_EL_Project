import React, { useState, useEffect } from 'react';
import client from '../api/client';
import theme from '../theme';

const SimilarProjects = ({ title, abstract, excludeId }) => {
  const [similarProjects, setSimilarProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedProjects, setExpandedProjects] = useState(new Set());

  useEffect(() => {
    // Only search if we have a title
    if (!title || title.trim().length < 3) {
      setSimilarProjects([]);
      return;
    }

    // Debounce the search
    const timeoutId = setTimeout(() => {
      searchSimilarProjects();
    }, 800); // Wait 800ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [title, abstract, excludeId]);

  const searchSimilarProjects = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        title: title.trim(),
        limit: 5,
      };

      if (abstract && abstract.trim()) {
        params.abstract = abstract.trim();
      }

      const response = await client.get('/archives/similar', { params });
      
      // Filter out excluded project if provided
      let results = response.data || [];
      if (excludeId) {
        results = results.filter(p => p.archive_id !== excludeId);
      }
      
      setSimilarProjects(results);
    } catch (err) {
      console.error('Error fetching similar archives:', err);
      // Don't show error to user unless it's critical
      if (err.response?.status !== 404) {
        setError('Could not load similar projects');
      }
      setSimilarProjects([]);
    } finally {
      setLoading(false);
    }
  };

  if (!title || title.trim().length < 3) {
    return null;
  }

  const getSimilarityColor = (score) => {
    if (score >= 0.7) return '#EF4444'; // Red - very similar
    if (score >= 0.5) return '#F59E0B'; // Orange - moderately similar
    return '#10B981'; // Green - somewhat similar
  };

  const getSimilarityLabel = (score) => {
    if (score >= 0.7) return 'Very Similar';
    if (score >= 0.5) return 'Similar';
    return 'Related';
  };

  const toggleExpand = (archiveId) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(archiveId)) {
        newSet.delete(archiveId);
      } else {
        newSet.add(archiveId);
      }
      return newSet;
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>
          <span style={styles.icon}>🔍</span>
          Similar Past Projects
        </h3>
        {loading && <span style={styles.loadingText}>Searching...</span>}
      </div>

      {error && (
        <div style={styles.error}>
          <span>⚠️ {error}</span>
        </div>
      )}

      {!loading && !error && similarProjects.length === 0 && (
        <div style={styles.noResults}>
          <span style={styles.noResultsIcon}>✨</span>
          <p>No similar projects found. This project idea seems unique!</p>
        </div>
      )}

      {!loading && similarProjects.length > 0 && (
        <div style={styles.projectsList}>
          <p style={styles.description}>
            Found {similarProjects.length} similar project{similarProjects.length !== 1 ? 's' : ''} in archives. 
            Review these to ensure this project offers something unique:
          </p>
          {similarProjects.map((project) => (
            <div key={project.archive_id} style={styles.projectCard}>
              <div style={styles.projectHeader}>
                <div style={styles.projectTitleRow}>
                  <h4 style={styles.projectTitle}>{project.title}</h4>
                  <span style={{
                    ...styles.similarityBadge,
                    backgroundColor: getSimilarityColor(project.similarity_score)
                  }}>
                    {getSimilarityLabel(project.similarity_score)} ({Math.round(project.similarity_score * 100)}%)
                  </span>
                </div>
                <div style={styles.metadataRow}>
                  {project.sem && (
                    <span style={styles.semBadge}>Semester {project.sem}</span>
                  )}
                  {project.project_id && (
                    <span style={styles.projectIdBadge}>ID: {project.project_id}</span>
                  )}
                </div>
              </div>
              {project.abstract && (
                <div style={styles.abstractSection}>
                  <p style={styles.projectAbstract}>
                    {expandedProjects.has(project.archive_id) 
                      ? project.abstract
                      : project.abstract.length > 200 
                        ? `${project.abstract.substring(0, 200)}...` 
                        : project.abstract}
                  </p>
                  {project.abstract.length > 200 && (
                    <button
                      onClick={() => toggleExpand(project.archive_id)}
                      style={styles.expandButton}
                    >
                      {expandedProjects.has(project.archive_id) ? 'Show Less' : 'Show More'}
                    </button>
                  )}
                </div>
              )}
              {project.report_link && (
                <div style={styles.linkSection}>
                  <a 
                    href={project.report_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={styles.reportLink}
                  >
                    📄 View Report
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    marginTop: '1.5rem',
    padding: '1rem',
    backgroundColor: '#F9FAFB',
    borderRadius: '0.5rem',
    border: '1px solid #E5E7EB',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  title: {
    fontSize: '1rem',
    fontWeight: theme.font.weights.semibold,
    color: theme.colors.text,
    fontFamily: theme.font.family,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  icon: {
    fontSize: '1.25rem',
  },
  loadingText: {
    fontSize: '0.875rem',
    color: '#6B7280',
    fontStyle: 'italic',
  },
  error: {
    padding: '0.75rem',
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
  },
  noResults: {
    textAlign: 'center',
    padding: '2rem 1rem',
    color: '#6B7280',
  },
  noResultsIcon: {
    fontSize: '2rem',
    display: 'block',
    marginBottom: '0.5rem',
  },
  description: {
    fontSize: '0.875rem',
    color: '#6B7280',
    marginBottom: '1rem',
    lineHeight: '1.5',
  },
  projectsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  projectCard: {
    backgroundColor: 'white',
    padding: '1rem',
    borderRadius: '0.375rem',
    border: '1px solid #E5E7EB',
    transition: 'box-shadow 0.2s',
    cursor: 'default',
  },
  projectHeader: {
    marginBottom: '0.5rem',
  },
  projectTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    marginBottom: '0.5rem',
  },
  projectTitle: {
    fontSize: '0.9375rem',
    fontWeight: theme.font.weights.medium,
    color: theme.colors.text,
    fontFamily: theme.font.family,
    margin: 0,
    flex: 1,
  },
  similarityBadge: {
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    fontWeight: theme.font.weights.medium,
    color: 'white',
    whiteSpace: 'nowrap',
  },
  metadataRow: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  semBadge: {
    display: 'inline-block',
    padding: '0.125rem 0.5rem',
    backgroundColor: '#E0E7FF',
    color: '#4F46E5',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    fontWeight: theme.font.weights.medium,
  },
  projectIdBadge: {
    display: 'inline-block',
    padding: '0.125rem 0.5rem',
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    fontWeight: theme.font.weights.medium,
  },
  abstractSection: {
    marginTop: '0.75rem',
  },
  projectAbstract: {
    fontSize: '0.8125rem',
    color: '#6B7280',
    lineHeight: '1.5',
    margin: 0,
    marginBottom: '0.5rem',
  },
  expandButton: {
    fontSize: '0.75rem',
    color: theme.colors.primary,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '0.25rem 0',
    fontWeight: theme.font.weights.medium,
    textDecoration: 'underline',
  },
  linkSection: {
    marginTop: '0.75rem',
    paddingTop: '0.75rem',
    borderTop: '1px solid #E5E7EB',
  },
  reportLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.8125rem',
    color: theme.colors.primary,
    textDecoration: 'none',
    fontWeight: theme.font.weights.medium,
    transition: 'color 0.2s',
  },
};

export default SimilarProjects;
