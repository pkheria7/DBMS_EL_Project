import React, { useState, useEffect, useRef } from 'react';
import client from '../api/client';
import Navbar from '../components/Navbar';
import theme from '../theme';
import toast from 'react-hot-toast';

const TeamForm = () => {
  const [teamName, setTeamName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await client.get(`/students/search?query=${encodeURIComponent(searchQuery)}`);
        setSearchResults(response.data || []);
        setShowDropdown(true);
      } catch (error) {
        if (error.response?.status !== 404) {
          toast.error('Failed to search students');
        }
        setSearchResults([]);
        setShowDropdown(false);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleAddMember = (student) => {
    if (selectedMembers.length >= 5) {
      toast.error('Maximum 5 members allowed');
      return;
    }

    if (selectedMembers.some(m => m.id === student.id)) {
      toast.error('Student already added');
      return;
    }

    setSelectedMembers([...selectedMembers, student]);
    setSearchQuery('');
    setShowDropdown(false);
    setSearchResults([]);
  };

  const handleRemoveMember = (studentId) => {
    setSelectedMembers(selectedMembers.filter(m => m.id !== studentId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedMembers.length < 4) {
      toast.error('Please select at least 4 members');
      return;
    }

    if (selectedMembers.length > 5) {
      toast.error('Maximum 5 members allowed');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        teamname: teamName,
        member_ids: selectedMembers.map(m => m.id),
      };

      const response = await client.post('/teams/form', payload);

      if (response.status === 201) {
        toast.success('Team created successfully');
        
        // Reset form
        setTeamName('');
        setSelectedMembers([]);
        setSearchQuery('');
        setSearchResults([]);
        
        // Redirect to home after a short delay
        setTimeout(() => {
          window.history.pushState({}, '', '/');
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      if (error.response?.status === 422) {
        const errorMessage = error.response.data?.detail || 'Validation error';
        toast.error(errorMessage);
      } else if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error('Failed to create team. Please try again.');
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
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          padding: '1.5rem',
        }}>
          <h1 style={{
            fontFamily: theme.font.family,
            fontSize: '1.75rem',
            fontWeight: theme.font.weights.semibold,
            color: theme.colors.text,
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}>
            Form Team
          </h1>

          <form onSubmit={handleSubmit}>
            {/* Team Name */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="teamname" style={labelStyle}>Team Name</label>
              <input
                type="text"
                id="teamname"
                name="teamname"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
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

            {/* Search Members */}
            <div style={{ marginBottom: '1.5rem', position: 'relative' }} ref={dropdownRef}>
              <label htmlFor="search" style={labelStyle}>Search & Add Members (4-5 required)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, USN, or ID..."
                  disabled={selectedMembers.length >= 5}
                  style={{
                    ...inputStyle,
                    ...(selectedMembers.length >= 5 ? { 
                      backgroundColor: '#F3F4F6', 
                      cursor: 'not-allowed',
                      opacity: 0.6 
                    } : {}),
                  }}
                  onFocus={(e) => {
                    if (selectedMembers.length < 5) {
                      Object.assign(e.target.style, inputFocusStyle);
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#D1D5DB';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {isSearching && (
                  <div style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: theme.colors.primary,
                  }}>
                    <svg className="animate-spin" style={{ width: '1rem', height: '1rem' }}>
                      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="43.98" strokeDashoffset="10" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Dropdown Results */}
              {showDropdown && searchResults.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '0.25rem',
                  backgroundColor: 'white',
                  border: '1px solid #D1D5DB',
                  borderRadius: '0.375rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 10,
                }}>
                  {searchResults.map((student) => {
                    const isSelected = selectedMembers.some(m => m.id === student.id);
                    return (
                      <div
                        key={student.id}
                        onClick={() => !isSelected && handleAddMember(student)}
                        style={{
                          padding: '0.5rem 0.75rem',
                          cursor: isSelected ? 'not-allowed' : 'pointer',
                          fontSize: '0.8125rem',
                          fontFamily: theme.font.family,
                          backgroundColor: isSelected ? '#F3F4F6' : 'white',
                          color: isSelected ? '#9CA3AF' : theme.colors.text,
                          borderBottom: '1px solid #F3F4F6',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.target.style.backgroundColor = '#F9FAFB';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.target.style.backgroundColor = 'white';
                          }
                        }}
                      >
                        <div style={{ fontWeight: theme.font.weights.medium }}>
                          {student.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.125rem' }}>
                          {student.usn} • {student.id}
                        </div>
                        {isSelected && (
                          <span style={{ fontSize: '0.75rem', color: theme.colors.primary, marginLeft: '0.5rem' }}>
                            ✓ Added
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Members Chips */}
            {selectedMembers.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: theme.font.weights.medium,
                  color: theme.colors.text,
                  marginBottom: '0.5rem',
                  fontFamily: theme.font.family,
                }}>
                  Selected Members ({selectedMembers.length}/5)
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}>
                  {selectedMembers.map((member) => (
                    <div
                      key={member.id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.25rem 0.75rem',
                        backgroundColor: '#E5E7EB',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontFamily: theme.font.family,
                        color: theme.colors.text,
                      }}
                    >
                      <span>{member.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          color: theme.colors.text,
                          fontSize: '1rem',
                          lineHeight: 1,
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.color = theme.colors.error;
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.color = theme.colors.text;
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || selectedMembers.length < 4 || selectedMembers.length > 5}
              style={{
                width: '100%',
                backgroundColor: (isSubmitting || selectedMembers.length < 4 || selectedMembers.length > 5) 
                  ? '#9CA3AF' 
                  : theme.colors.primary,
                color: 'white',
                padding: '0.625rem 1.25rem',
                borderRadius: '0.75rem',
                border: 'none',
                fontSize: '0.9375rem',
                fontWeight: theme.font.weights.medium,
                fontFamily: theme.font.family,
                cursor: (isSubmitting || selectedMembers.length < 4 || selectedMembers.length > 5) 
                  ? 'not-allowed' 
                  : 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting && selectedMembers.length >= 4 && selectedMembers.length <= 5) {
                  e.target.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
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
                  <span>Creating Team…</span>
                </>
              ) : (
                'Create Team'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeamForm;

