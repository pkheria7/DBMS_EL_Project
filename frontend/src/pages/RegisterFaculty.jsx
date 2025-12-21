import React, { useState } from 'react';
import { Users, AlertCircle, CheckCircle, Mail, User, Building, Hash, Lock } from 'lucide-react';
import client from '../api/client';
import Navbar from '../components/Navbar';

const RegisterFaculty = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    ph_no: '',
    designation: '',
    dept_id: '',
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
    const requiredFields = ['name', 'email', 'password', 'ph_no', 'designation', 'dept_id'];
    
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
        name: '',
        email: '',
        password: '',
        ph_no: '',
        designation: '',
        dept_id: '',
      });
      setErrors({});
    } catch (error) {
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
      
      <div className="flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Faculty Registration</h1>
            <p className="text-slate-400">Join as a faculty mentor to guide student projects</p>
          </div>

          {/* Form Card */}
          <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 p-8">
            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-900/30 border border-green-700 rounded-xl flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-300">{successMessage}</p>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-xl flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your name"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="ph_no"
                      value={formData.ph_no}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g., 9876543210"
                    />
                  </div>
                  {errors.ph_no && (
                    <p className="mt-1 text-sm text-red-400">{errors.ph_no}</p>
                  )}
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Designation
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g., Associate Professor"
                    />
                  </div>
                  {errors.designation && (
                    <p className="mt-1 text-sm text-red-400">{errors.designation}</p>
                  )}
                </div>

                {/* Department ID */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Department ID
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="dept_id"
                      value={formData.dept_id}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g., CSE"
                    />
                  </div>
                  {errors.dept_id && (
                    <p className="mt-1 text-sm text-red-400">{errors.dept_id}</p>
                  )}
                </div>

                {/* Email */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your email"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter a secure password (min 6 characters)"
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isLoading ? 'Registering...' : 'Register Faculty'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterFaculty;
