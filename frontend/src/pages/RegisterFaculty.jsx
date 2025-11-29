import React, { useState } from 'react';
import client from '../api/client';
import Navbar from '../components/Navbar';
import theme from '../theme';

const RegisterFaculty = () => {
  const [formData, setFormData] = useState({
    id: '',
    facultyid: '',
    name: '',
    department: '',
    email: '',
  });

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

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['id', 'facultyid', 'name', 'department', 'email'];
    
    requiredFields.forEach(field => {
      if (!formData[field] || (typeof formData[field] === 'string' && !formData[field].trim())) {
        newErrors[field] = 'This field is required';
      }
    });

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setSuccessMessage('');
    setErrorMessage('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await client.post('/faculty/register', formData);
      
      setSuccessMessage('Faculty registered successfully!');
      setErrorMessage('');
      
      setFormData({
        id: '',
        facultyid: '',
        name: '',
        department: '',
        email: '',
      });
      setErrors({});
    } catch (error) {
      if (error.response) {
        setErrorMessage(error.response.data?.detail || 'Error registering faculty');
      } else if (error.request) {
        setErrorMessage('Network error. Please check your connection.');
      } else {
        setErrorMessage('Error registering faculty');
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
            Register Faculty
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

            {/* Faculty ID */}
            <div>
              <label htmlFor="facultyid" style={labelStyle}>Faculty ID</label>
              <input
                type="text"
                id="facultyid"
                name="facultyid"
                value={formData.facultyid}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  ...(errors.facultyid ? { borderColor: theme.colors.error } : {}),
                }}
                onFocus={(e) => {
                  if (!errors.facultyid) {
                    Object.assign(e.target.style, inputFocusStyle);
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.facultyid ? theme.colors.error : '#D1D5DB';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {errors.facultyid && <div style={errorTextStyle}>{errors.facultyid}</div>}
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

            {/* Email */}
            <div style={{ gridColumn: '1 / -1' }}>
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

            {/* Submit Button */}
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
                  'Register Faculty'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterFaculty;

