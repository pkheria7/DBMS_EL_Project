import React, { useState, useEffect, useRef } from 'react';
import client from '../api/client';
import Navbar from '../components/Navbar';
import theme from '../theme';

const RegisterStudent = () => {
  const [formData, setFormData] = useState({
    id: '',
    usn: '',
    name: '',
    email: '',
    department: '',
    cluster: '',
    semester: '',
    skills: [],
    resumelink: '',
    githublink: '',
  });

  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillsDropdownOpen, setSkillsDropdownOpen] = useState(false);
  const [customSkill, setCustomSkill] = useState('');
  const skillsDropdownRef = useRef(null);

  const predefinedSkills = [
    "Python", "Java", "C", "C++", "HTML", "CSS", "JavaScript",
    "React", "Node.js", "FastAPI", "SQL", "MongoDB",
    "Machine Learning", "Deep Learning", "Data Science",
    "UI/UX", "Cloud Computing", "DevOps", "Cybersecurity",
    "Blockchain", "Flutter", "React Native", "DSA"
  ];

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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
    if (successMessage) setSuccessMessage('');
    if (errorMessage) setErrorMessage('');
  };

  const handleSkillSelect = (skill) => {
    if (!selectedSkills.includes(skill)) {
      const updatedSkills = [...selectedSkills, skill];
      setSelectedSkills(updatedSkills);
      setFormData(prev => ({ ...prev, skills: updatedSkills }));
      if (errors.skills) {
        setErrors(prev => ({ ...prev, skills: '' }));
      }
    }
    setSkillsDropdownOpen(false);
  };

  const handleRemoveSkill = (skillToRemove) => {
    const updatedSkills = selectedSkills.filter(skill => skill !== skillToRemove);
    setSelectedSkills(updatedSkills);
    setFormData(prev => ({ ...prev, skills: updatedSkills }));
  };

  const handleAddCustomSkill = (e) => {
    if (e.key === 'Enter' && customSkill.trim()) {
      e.preventDefault();
      const skill = customSkill.trim();
      if (!selectedSkills.includes(skill)) {
        const updatedSkills = [...selectedSkills, skill];
        setSelectedSkills(updatedSkills);
        setFormData(prev => ({ ...prev, skills: updatedSkills }));
        setCustomSkill('');
        if (errors.skills) {
          setErrors(prev => ({ ...prev, skills: '' }));
        }
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (skillsDropdownRef.current && !skillsDropdownRef.current.contains(event.target)) {
        setSkillsDropdownOpen(false);
      }
    };

    if (skillsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [skillsDropdownOpen]);

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['id', 'usn', 'name', 'email', 'department', 'cluster', 'semester', 'resumelink', 'githublink'];
    
    requiredFields.forEach(field => {
      if (!formData[field] || (typeof formData[field] === 'string' && !formData[field].trim())) {
        newErrors[field] = 'This field is required';
      }
    });

    if (selectedSkills.length < 2) {
      newErrors.skills = 'Please add at least 2 skills';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setSuccessMessage('');
    setErrorMessage('');

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        skills: selectedSkills,
        semester: parseInt(formData.semester),
      };
      
      const response = await client.post('/students/register', payload);
      
      setSuccessMessage('Student registered successfully!');
      setErrorMessage('');
      
      setFormData({
        id: '',
        usn: '',
        name: '',
        email: '',
        department: '',
        cluster: '',
        semester: '',
        skills: [],
        resumelink: '',
        githublink: '',
      });
      setSelectedSkills([]);
      setCustomSkill('');
      setErrors({});
    } catch (error) {
      // Error handling
      if (error.response) {
        setErrorMessage(error.response.data?.detail || 'Registration failed. Please try again.');
      } else if (error.request) {
        setErrorMessage('Network error. Please check your connection.');
      } else {
        setErrorMessage('An error occurred. Please try again.');
      }
      setSuccessMessage('');
    } finally {
      setIsLoading(false);
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
          maxWidth: '900px',
          width: '100%',
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          padding: '1.5rem',
          maxHeight: 'calc(100vh - 6rem)',
          overflowY: 'auto',
        }}>
          <h1 style={{
            fontFamily: theme.font.family,
            fontSize: '1.75rem',
            fontWeight: theme.font.weights.semibold,
            color: theme.colors.text,
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}>
            Register Student
          </h1>

          {/* Success Message */}
          {successMessage && (
            <div style={{
              backgroundColor: '#D1FAE5',
              color: '#065F46',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              fontSize: '0.8125rem',
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
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              fontSize: '0.8125rem',
              fontFamily: theme.font.family,
            }}>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem',
          }}>
            {/* ID */}
            <div>
              <label htmlFor="id" style={labelStyle}>ID</label>
              <input
                type="text"
                id="id"
                name="id"
                value={formData.id}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  ...(errors.id ? { borderColor: theme.colors.error } : {}),
                }}
                onFocus={(e) => {
                  if (!errors.id) {
                    Object.assign(e.target.style, inputFocusStyle);
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.id ? theme.colors.error : '#D1D5DB';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {errors.id && <div style={errorTextStyle}>{errors.id}</div>}
            </div>

            {/* USN */}
            <div>
              <label htmlFor="usn" style={labelStyle}>USN</label>
              <input
                type="text"
                id="usn"
                name="usn"
                value={formData.usn}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  ...(errors.usn ? { borderColor: theme.colors.error } : {}),
                }}
                onFocus={(e) => {
                  if (!errors.usn) {
                    Object.assign(e.target.style, inputFocusStyle);
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.usn ? theme.colors.error : '#D1D5DB';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {errors.usn && <div style={errorTextStyle}>{errors.usn}</div>}
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" style={labelStyle}>Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  ...(errors.name ? { borderColor: theme.colors.error } : {}),
                }}
                onFocus={(e) => {
                  if (!errors.name) {
                    Object.assign(e.target.style, inputFocusStyle);
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.name ? theme.colors.error : '#D1D5DB';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {errors.name && <div style={errorTextStyle}>{errors.name}</div>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" style={labelStyle}>Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  ...(errors.email ? { borderColor: theme.colors.error } : {}),
                }}
                onFocus={(e) => {
                  if (!errors.email) {
                    Object.assign(e.target.style, inputFocusStyle);
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.email ? theme.colors.error : '#D1D5DB';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {errors.email && <div style={errorTextStyle}>{errors.email}</div>}
            </div>

            {/* Department */}
            <div>
              <label htmlFor="department" style={labelStyle}>Department</label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  ...(errors.department ? { borderColor: theme.colors.error } : {}),
                }}
                onFocus={(e) => {
                  if (!errors.department) {
                    Object.assign(e.target.style, inputFocusStyle);
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.department ? theme.colors.error : '#D1D5DB';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {errors.department && <div style={errorTextStyle}>{errors.department}</div>}
            </div>

            {/* Cluster */}
            <div>
              <label htmlFor="cluster" style={labelStyle}>Cluster</label>
              <input
                type="text"
                id="cluster"
                name="cluster"
                value={formData.cluster}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  ...(errors.cluster ? { borderColor: theme.colors.error } : {}),
                }}
                onFocus={(e) => {
                  if (!errors.cluster) {
                    Object.assign(e.target.style, inputFocusStyle);
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.cluster ? theme.colors.error : '#D1D5DB';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {errors.cluster && <div style={errorTextStyle}>{errors.cluster}</div>}
            </div>

            {/* Semester */}
            <div>
              <label htmlFor="semester" style={labelStyle}>Semester</label>
              <select
                id="semester"
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  ...(errors.semester ? { borderColor: theme.colors.error } : {}),
                  cursor: 'pointer',
                }}
                onFocus={(e) => {
                  if (!errors.semester) {
                    Object.assign(e.target.style, inputFocusStyle);
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.semester ? theme.colors.error : '#D1D5DB';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="">Select Semester</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
              {errors.semester && <div style={errorTextStyle}>{errors.semester}</div>}
            </div>

            {/* Skills */}
            <div>
              <label htmlFor="skills" style={labelStyle}>Skills</label>
              <div ref={skillsDropdownRef} style={{ position: 'relative' }}>
                <div
                  onClick={() => setSkillsDropdownOpen(!skillsDropdownOpen)}
                  style={{
                    ...inputStyle,
                    ...(errors.skills ? { borderColor: theme.colors.error } : {}),
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onFocus={(e) => {
                    if (!errors.skills) {
                      Object.assign(e.target.style, inputFocusStyle);
                    }
                  }}
                >
                  <span style={{ color: selectedSkills.length === 0 ? '#9CA3AF' : theme.colors.text }}>
                    {selectedSkills.length === 0 ? 'Select Skills (minimum 2 skills)' : `${selectedSkills.length} skill${selectedSkills.length !== 1 ? 's' : ''} selected`}
                  </span>
                  <svg
                    style={{
                      width: '1rem',
                      height: '1rem',
                      transform: skillsDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {skillsDropdownOpen && (
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
                    {predefinedSkills.map(skill => (
                      <div
                        key={skill}
                        onClick={() => handleSkillSelect(skill)}
                        style={{
                          padding: '0.5rem 0.75rem',
                          cursor: 'pointer',
                          fontSize: '0.8125rem',
                          fontFamily: theme.font.family,
                          backgroundColor: selectedSkills.includes(skill) ? '#EFF6FF' : 'white',
                          color: selectedSkills.includes(skill) ? theme.colors.primary : theme.colors.text,
                        }}
                        onMouseEnter={(e) => {
                          if (!selectedSkills.includes(skill)) {
                            e.target.style.backgroundColor = '#F9FAFB';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!selectedSkills.includes(skill)) {
                            e.target.style.backgroundColor = 'white';
                          }
                        }}
                      >
                        {skill}
                        {selectedSkills.includes(skill) && (
                          <span style={{ marginLeft: '0.5rem', color: theme.colors.primary }}>✓</span>
                        )}
                      </div>
                    ))}
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      borderTop: '1px solid #E5E7EB',
                    }}>
                      <input
                        type="text"
                        placeholder="Add custom skill (press Enter)"
                        value={customSkill}
                        onChange={(e) => setCustomSkill(e.target.value)}
                        onKeyDown={handleAddCustomSkill}
                        style={{
                          width: '100%',
                          padding: '0.375rem 0.5rem',
                          border: '1px solid #D1D5DB',
                          borderRadius: '0.25rem',
                          fontSize: '0.8125rem',
                          fontFamily: theme.font.family,
                          outline: 'none',
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = theme.colors.primary;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#D1D5DB';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              {selectedSkills.length > 0 && (
                <div style={{
                  marginTop: '0.5rem',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  maxHeight: '100px',
                  overflowY: 'auto',
                }}>
                  {selectedSkills.map(skill => (
                    <div
                      key={skill}
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
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          color: theme.colors.text,
                          fontSize: '0.875rem',
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
              )}
              {errors.skills && <div style={errorTextStyle}>{errors.skills}</div>}
            </div>

            {/* Resume Link */}
            <div>
              <label htmlFor="resumelink" style={labelStyle}>Resume Link</label>
              <input
                type="url"
                id="resumelink"
                name="resumelink"
                value={formData.resumelink}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  ...(errors.resumelink ? { borderColor: theme.colors.error } : {}),
                }}
                onFocus={(e) => {
                  if (!errors.resumelink) {
                    Object.assign(e.target.style, inputFocusStyle);
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.resumelink ? theme.colors.error : '#D1D5DB';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {errors.resumelink && <div style={errorTextStyle}>{errors.resumelink}</div>}
            </div>

            {/* GitHub Link */}
            <div>
              <label htmlFor="githublink" style={labelStyle}>GitHub Link</label>
              <input
                type="url"
                id="githublink"
                name="githublink"
                value={formData.githublink}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  ...(errors.githublink ? { borderColor: theme.colors.error } : {}),
                }}
                onFocus={(e) => {
                  if (!errors.githublink) {
                    Object.assign(e.target.style, inputFocusStyle);
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.githublink ? theme.colors.error : '#D1D5DB';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {errors.githublink && <div style={errorTextStyle}>{errors.githublink}</div>}
            </div>

            {/* Submit Button - spans full width */}
            <div style={{ gridColumn: '1 / -1' }}>
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  backgroundColor: isLoading ? '#9CA3AF' : theme.colors.primary,
                  color: 'white',
                  padding: '0.625rem 1.25rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  fontSize: '0.9375rem',
                  fontWeight: theme.font.weights.medium,
                  fontFamily: theme.font.family,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.target.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                }}
              >
                {isLoading ? (
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
                    <span>Registering...</span>
                  </>
                ) : (
                  'Register Student'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterStudent;

