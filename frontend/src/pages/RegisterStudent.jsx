import React, { useState } from 'react';
import { GraduationCap, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import client from '../api/client';
import Navbar from '../components/Navbar';
import FileUploadButton from '../components/FileUploadButton';

const RegisterStudent = () => {
  const [formData, setFormData] = useState({
    usn: '',
    name: '',
    email: '',
    password: '',
    dept_id: '',
    ph_no: '',
    sem: '',
    github: '',
    resume: '',
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
    const requiredFields = ['usn', 'name', 'email', 'password', 'dept_id', 'sem'];
    
    requiredFields.forEach(field => {
      if (!formData[field] || (typeof formData[field] === 'string' && !formData[field].trim())) {
        newErrors[field] = 'This field is required';
      }
    });

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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
        usn: formData.usn,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        dept_id: formData.dept_id,
        sem: parseInt(formData.sem),
        ph_no: formData.ph_no || null,
        github: formData.github || null,
        resume: formData.resume || null,
      };
      
      const response = await client.post('/students/register', payload);
      
      setSuccessMessage('Student registered successfully!');
      setErrorMessage('');
      
      setFormData({
        usn: '',
        name: '',
        email: '',
        password: '',
        dept_id: '',
        ph_no: '',
        sem: '',
        github: '',
        resume: '',
      });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />
      <div className="pt-20 pb-4 px-4 flex justify-center items-start min-h-[calc(100vh-4rem)]">
        <div className="max-w-4xl w-full bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 max-h-[calc(100vh-6rem)] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <GraduationCap className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-semibold text-white">
              Register Student
            </h1>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-900/30 border border-green-700 text-green-300 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* USN */}
            <div>
              <label htmlFor="usn" className="block mb-1 text-sm font-medium text-slate-300">
                USN
              </label>
              <input
                type="text"
                id="usn"
                name="usn"
                value={formData.usn}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-md bg-slate-700 border text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.usn ? 'border-red-500' : 'border-slate-600'
                }`}
              />
              {errors.usn && (
                <div className="text-red-300 text-xs mt-1">{errors.usn}</div>
              )}
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block mb-1 text-sm font-medium text-slate-300">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-md bg-slate-700 border text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.name ? 'border-red-500' : 'border-slate-600'
                }`}
              />
              {errors.name && (
                <div className="text-red-300 text-xs mt-1">{errors.name}</div>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block mb-1 text-sm font-medium text-slate-300">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-md bg-slate-700 border text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.email ? 'border-red-500' : 'border-slate-600'
                }`}
              />
              {errors.email && (
                <div className="text-red-300 text-xs mt-1">{errors.email}</div>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block mb-1 text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 6 characters"
                  className={`w-full pl-10 px-3 py-2 rounded-md bg-slate-700 border text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    errors.password ? 'border-red-500' : 'border-slate-600'
                  }`}
                />
              </div>
              {errors.password && (
                <div className="text-red-300 text-xs mt-1">{errors.password}</div>
              )}
            </div>

            {/* Department */}
            <div>
              <label htmlFor="dept_id" className="block mb-1 text-sm font-medium text-slate-300">
                Department
              </label>
              <select
                id="dept_id"
                name="dept_id"
                value={formData.dept_id}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-md bg-slate-700 border text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.dept_id ? 'border-red-500' : 'border-slate-600'
                }`}
              >
                <option value="">Select Department</option>
                <optgroup label="CSE Cluster">
                  <option value="AI">AI — Artificial Intelligence & ML</option>
                  <option value="CD">CD — Computer Science & Design</option>
                  <option value="CS">CS — Computer Science & Engineering</option>
                  <option value="CY">CY — Cyber Security</option>
                  <option value="IS">IS — Information Science & Engineering</option>
                </optgroup>
                <optgroup label="ECE Cluster">
                  <option value="EC">EC — Electronics & Communication</option>
                  <option value="EE">EE — Electrical & Electronics</option>
                  <option value="EI">EI — Electronics & Instrumentation</option>
                  <option value="ET">ET — Electronics & Telecommunication</option>
                </optgroup>
                <optgroup label="ME Cluster">
                  <option value="AS">AS — Aerospace Engineering</option>
                  <option value="IM">IM — Industrial Engineering & Management</option>
                  <option value="ME">ME — Mechanical Engineering</option>
                </optgroup>
                <optgroup label="CV Cluster">
                  <option value="CV">CV — Civil Engineering</option>
                  <option value="BT">BT — Biotechnology</option>
                  <option value="CH">CH — Chemical Engineering</option>
                </optgroup>
              </select>
              {errors.dept_id && (
                <div className="text-red-300 text-xs mt-1">{errors.dept_id}</div>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="ph_no" className="block mb-1 text-sm font-medium text-slate-300">
                Phone Number <span className="text-slate-400 text-xs">(Optional)</span>
              </label>
              <input
                type="tel"
                id="ph_no"
                name="ph_no"
                value={formData.ph_no}
                onChange={handleChange}
                placeholder="e.g., +91 1234567890"
                className={`w-full px-3 py-2 rounded-md bg-slate-700 border text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.ph_no ? 'border-red-500' : 'border-slate-600'
                }`}
              />
              {errors.ph_no && (
                <div className="text-red-300 text-xs mt-1">{errors.ph_no}</div>
              )}
            </div>

            {/* Semester */}
            <div>
              <label htmlFor="sem" className="block mb-1 text-sm font-medium text-slate-300">
                Semester
              </label>
              <select
                id="sem"
                name="sem"
                value={formData.sem}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-md bg-slate-700 border text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer ${
                  errors.sem ? 'border-red-500' : 'border-slate-600'
                }`}
              >
                <option value="">Select Semester</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
              {errors.sem && (
                <div className="text-red-300 text-xs mt-1">{errors.sem}</div>
              )}
            </div>

            {/* Resume */}
            <div>
              <label htmlFor="resume" className="block mb-1 text-sm font-medium text-slate-300">
                Resume <span className="text-slate-400 text-xs">(Optional)</span>
              </label>
              <input
                type="url"
                id="resume"
                name="resume"
                value={formData.resume}
                onChange={handleChange}
                placeholder="Paste URL or upload below"
                className={`w-full px-3 py-2 rounded-md bg-slate-700 border text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.resume ? 'border-red-500' : 'border-slate-600'
                }`}
              />
              <FileUploadButton
                label="Upload Resume (PDF / DOCX)"
                onUpload={(url) => setFormData(prev => ({ ...prev, resume: url }))}
              />
              {errors.resume && (
                <div className="text-red-300 text-xs mt-1">{errors.resume}</div>
              )}
            </div>

            {/* GitHub Link */}
            <div>
              <label htmlFor="github" className="block mb-1 text-sm font-medium text-slate-300">
                GitHub Link <span className="text-slate-400 text-xs">(Optional)</span>
              </label>
              <input
                type="url"
                id="github"
                name="github"
                value={formData.github}
                onChange={handleChange}
                placeholder="https://github.com/username"
                className={`w-full px-3 py-2 rounded-md bg-slate-700 border text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.github ? 'border-red-500' : 'border-slate-600'
                }`}
              />
              {errors.github && (
                <div className="text-red-300 text-xs mt-1">{errors.github}</div>
              )}
            </div>

            {/* Submit Button - spans full width */}
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full px-5 py-3 rounded-xl border-none text-base font-medium text-white transition-all duration-300 flex items-center justify-center gap-2 ${
                  isLoading 
                    ? 'bg-slate-600 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
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

