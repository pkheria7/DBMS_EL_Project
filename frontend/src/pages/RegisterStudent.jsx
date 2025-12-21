import React, { useState, useEffect, useRef } from 'react';
import { GraduationCap, AlertCircle, CheckCircle, X, Lock } from 'lucide-react';
import client from '../api/client';
import Navbar from '../components/Navbar';

const RegisterStudent = () => {
  const [formData, setFormData] = useState({
    usn: '',
    name: '',
    email: '',
    password: '',
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
    const requiredFields = ['usn', 'name', 'email', 'password', 'department', 'cluster', 'semester'];
    
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
        ...formData,
        skills: selectedSkills,
        semester: parseInt(formData.semester),
      };
      
      const response = await client.post('/students/register', payload);
      
      setSuccessMessage('Student registered successfully!');
      setErrorMessage('');
      
      setFormData({
        usn: '',
        name: '',
        email: '',
        password: '',
        department: '',
        cluster: '',
        semester: '',
        skills: [],
        resumelink: '',
        githublink: '',
      });
      setErrors({});
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
              <label htmlFor="department" className="block mb-1 text-sm font-medium text-slate-300">
                Department
              </label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-md bg-slate-700 border text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.department ? 'border-red-500' : 'border-slate-600'
                }`}
              />
              {errors.department && (
                <div className="text-red-300 text-xs mt-1">{errors.department}</div>
              )}
            </div>

            {/* Cluster */}
            <div>
              <label htmlFor="cluster" className="block mb-1 text-sm font-medium text-slate-300">
                Cluster
              </label>
              <input
                type="text"
                id="cluster"
                name="cluster"
                value={formData.cluster}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-md bg-slate-700 border text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.cluster ? 'border-red-500' : 'border-slate-600'
                }`}
              />
              {errors.cluster && (
                <div className="text-red-300 text-xs mt-1">{errors.cluster}</div>
              )}
            </div>

            {/* Semester */}
            <div>
              <label htmlFor="semester" className="block mb-1 text-sm font-medium text-slate-300">
                Semester
              </label>
              <select
                id="semester"
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-md bg-slate-700 border text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer ${
                  errors.semester ? 'border-red-500' : 'border-slate-600'
                }`}
              >
                <option value="">Select Semester</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
              {errors.semester && (
                <div className="text-red-300 text-xs mt-1">{errors.semester}</div>
              )}
            </div>

            {/* Skills */}
            <div>
              <label htmlFor="skills" className="block mb-1 text-sm font-medium text-slate-300">
                Skills
              </label>
              <div ref={skillsDropdownRef} className="relative">
                <div
                  onClick={() => setSkillsDropdownOpen(!skillsDropdownOpen)}
                  className={`w-full px-3 py-2 rounded-md bg-slate-700 border cursor-pointer flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    errors.skills ? 'border-red-500' : 'border-slate-600'
                  }`}
                >
                  <span className={selectedSkills.length === 0 ? 'text-slate-400' : 'text-white'}>
                    {selectedSkills.length === 0 ? 'Select Skills (minimum 2 skills)' : `${selectedSkills.length} skill${selectedSkills.length !== 1 ? 's' : ''} selected`}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform ${skillsDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {skillsDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 border border-slate-600 rounded-md shadow-xl max-h-48 overflow-y-auto z-10">
                    {predefinedSkills.map(skill => (
                      <div
                        key={skill}
                        onClick={() => handleSkillSelect(skill)}
                        className={`px-3 py-2 cursor-pointer text-sm transition-colors ${
                          selectedSkills.includes(skill) 
                            ? 'bg-blue-600/20 text-blue-300' 
                            : 'text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {skill}
                        {selectedSkills.includes(skill) && (
                          <span className="ml-2 text-blue-400">✓</span>
                        )}
                      </div>
                    ))}
                    <div className="px-3 py-2 border-t border-slate-600">
                      <input
                        type="text"
                        placeholder="Add custom skill (press Enter)"
                        value={customSkill}
                        onChange={(e) => setCustomSkill(e.target.value)}
                        onKeyDown={handleAddCustomSkill}
                        className="w-full px-2 py-1.5 bg-slate-600 border border-slate-500 rounded text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
              {selectedSkills.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {selectedSkills.map(skill => (
                    <div
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600/20 border border-blue-500 rounded-full text-xs text-blue-300"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-red-400 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {errors.skills && (
                <div className="text-red-300 text-xs mt-1">{errors.skills}</div>
              )}
            </div>

            {/* Resume Link */}
            <div>
              <label htmlFor="resumelink" className="block mb-1 text-sm font-medium text-slate-300">
                Resume Link <span className="text-slate-400 text-xs">(Optional)</span>
              </label>
              <input
                type="url"
                id="resumelink"
                name="resumelink"
                value={formData.resumelink}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-md bg-slate-700 border text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.resumelink ? 'border-red-500' : 'border-slate-600'
                }`}
              />
              {errors.resumelink && (
                <div className="text-red-300 text-xs mt-1">{errors.resumelink}</div>
              )}
            </div>

            {/* GitHub Link */}
            <div>
              <label htmlFor="githublink" className="block mb-1 text-sm font-medium text-slate-300">
                GitHub Link <span className="text-slate-400 text-xs">(Optional)</span>
              </label>
              <input
                type="url"
                id="githublink"
                name="githublink"
                value={formData.githublink}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-md bg-slate-700 border text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.githublink ? 'border-red-500' : 'border-slate-600'
                }`}
              />
              {errors.githublink && (
                <div className="text-red-300 text-xs mt-1">{errors.githublink}</div>
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

