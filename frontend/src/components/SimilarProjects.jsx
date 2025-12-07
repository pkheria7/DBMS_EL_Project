import React, { useState, useEffect } from 'react';
import client from '../api/client';
import theme from '../theme';

const SimilarProjects = ({ title, description, domain, excludeId }) => {
  const [similarProjects, setSimilarProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
  }, [title, description, domain, excludeId]);

  const searchSimilarProjects = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        title: title.trim(),
        limit: 5,
      };

      if (description && description.trim()) {
        params.description = description.trim();
      }

      if (domain && domain.trim()) {
        params.domain = domain.trim();
      }

      if (excludeId) {
        params.exclude_id = excludeId;
      }

      const response = await client.get('/projects/similar', { params });
      setSimilarProjects(response.data || []);
    } catch (err) {
      console.error('Error fetching similar projects:', err);
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

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>
          <span style={styles.icon}>🔍</span>
          Similar Projects
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
          <p>No similar projects found. Your project idea seems unique!</p>
        </div>
      )}

      {!loading && similarProjects.length > 0 && (
        <div style={styles.projectsList}>
          <p style={styles.description}>
            Found {similarProjects.length} similar project{similarProjects.length !== 1 ? 's' : ''}. 
            Review these to ensure your project offers something unique:
          </p>
          {similarProjects.map((project, index) => (
            <div key={project.project_id} style={styles.projectCard}>
              <div style={styles.projectHeader}>
                <div style={styles.projectTitleRow}>
                  <h4 style={styles.projectTitle}>{project.title}</h4>
                  <span style={{
                    ...styles.similarityBadge,
                    backgroundColor: getSimilarityColor(project.similarity_score)
                  }}>
                    {Math.round(project.similarity_score * 100)}% match
                  </span>
                </div>
                <div style={styles.projectMeta}>
                  {project.domain && (
                    <span style={styles.metaTag}>
                      <span style={styles.metaIcon}>🏷️</span>
                      {project.domain}
                    </span>
                  )}
                  {project.year && (
                    <span style={styles.metaTag}>
                      <span style={styles.metaIcon}>📅</span>
                      {project.year}
                    </span>
                  )}
                </div>
              </div>
              {project.description && (
                <p style={styles.projectDescription}>
                  {project.description.length > 150
                    ? `${project.description.substring(0, 150)}...`
                    : project.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Helper function to get color based on similarity score
const getSimilarityColor = (score) => {
  if (score >= 0.8) return '#ef4444'; // Red - very similar
  if (score >= 0.6) return '#f97316'; // Orange - quite similar
  if (score >= 0.4) return '#eab308'; // Yellow - somewhat similar
  return '#22c55e'; // Green - different enough
};

const styles = {
  container: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  icon: {
    fontSize: '20px',
  },
  loadingText: {
    fontSize: '14px',
    color: '#64748b',
    fontStyle: 'italic',
  },
  description: {
    fontSize: '14px',
    color: '#475569',
    marginBottom: '12px',
    lineHeight: '1.5',
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '14px',
  },
  noResults: {
    textAlign: 'center',
    padding: '24px',
    color: '#64748b',
  },
  noResultsIcon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '12px',
  },
  projectsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  projectCard: {
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    padding: '16px',
    transition: 'all 0.2s',
    cursor: 'pointer',
  },
  projectHeader: {
    marginBottom: '8px',
  },
  projectTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
    gap: '12px',
  },
  projectTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0',
    flex: 1,
  },
  similarityBadge: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '12px',
    whiteSpace: 'nowrap',
  },
  projectMeta: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  metaTag: {
    fontSize: '13px',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  metaIcon: {
    fontSize: '14px',
  },
  projectDescription: {
    fontSize: '14px',
    color: '#475569',
    margin: '0',
    lineHeight: '1.5',
  },
};

export default SimilarProjects;
