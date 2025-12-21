import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Hash, Building } from 'lucide-react';
import client from '../api/client';
import toast from 'react-hot-toast';

const UpdateFacultyProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    ph_no: '',
    designation: '',
    dept_id: '',
  });
  const [facultyId, setFacultyId] = useState('');

  // Check authentication and fetch faculty details on mount
  useEffect(() => {
    const userType = localStorage.getItem('userType');
    if (!userType || userType !== 'faculty') {
      navigate('/login');
      return;
    }

    fetchFacultyDetails();
  }, [navigate]);

  const fetchFacultyDetails = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await client.get(`/faculty/search?query=${user.email}`);
      
      if (response.data && response.data.length > 0) {
        const faculty = response.data.find(f => f.email === user.email) || response.data[0];
        setFacultyId(faculty.id);
        setFormData({
          name: faculty.name || '',
          email: faculty.email || '',
          ph_no: faculty.ph_no || '',
          designation: faculty.designation || '',
          dept_id: faculty.dept_id || '',
        });
      }
    } catch (error) {
      console.error('Error fetching faculty details:', error);
      toast.error('Failed to load faculty details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        ph_no: formData.ph_no.trim(),
        designation: formData.designation.trim(),
        dept_id: formData.dept_id.trim(),
      };

      const response = await client.put(`/profiles/faculty/${facultyId}`, payload);

      if (response.status === 200) {
        toast.success('Profile updated successfully!');
        setTimeout(() => {
          navigate('/faculty-dashboard');
        }, 1000);
      }
    } catch (error) {
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error('Failed to update profile. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header with Back Button */}
      <div className="bg-slate-800/50 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/faculty-dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all duration-200 border border-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Update Profile</h1>
              <p className="text-slate-400 text-sm">Manage your personal information</p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-12 pb-12 px-4 flex justify-center items-center">
        <div className="w-full max-w-3xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                Update Your Profile
              </span>
            </h1>
            <p className="text-lg text-slate-300">
              Keep your information up to date
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Enter your name"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="ph_no" className="block text-sm font-medium text-slate-300 mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      id="ph_no"
                      name="ph_no"
                      value={formData.ph_no}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="e.g., 9876543210"
                    />
                  </div>
                </div>

                {/* Designation */}
                <div>
                  <label htmlFor="designation" className="block text-sm font-medium text-slate-300 mb-2">
                    Designation *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      id="designation"
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="e.g., Associate Professor"
                    />
                  </div>
                </div>

                {/* Department ID */}
                <div className="md:col-span-2">
                  <label htmlFor="dept_id" className="block text-sm font-medium text-slate-300 mb-2">
                    Department ID *
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      id="dept_id"
                      name="dept_id"
                      value={formData.dept_id}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="e.g., CSE"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all duration-200 ${
                  isSubmitting
                    ? 'bg-slate-600 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                } text-white`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Updating...</span>
                  </>
                ) : (
                  'Update Profile'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateFacultyProfile;
