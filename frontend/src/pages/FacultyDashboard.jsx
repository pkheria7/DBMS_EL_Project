import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  BookOpen, 
  Building,
  LogOut, 
  Edit, 
  Users as UsersIcon,
  Hash,
  GraduationCap,
  Archive
} from 'lucide-react';
import client from '../api/client';

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in and is faculty
    const userType = localStorage.getItem('userType');
    const userId = localStorage.getItem('userId');
    
    if (!userType || userType !== 'faculty') {
      navigate('/login');
      return;
    }

    // Fetch faculty details
    fetchFacultyDetails(userId);
  }, [navigate]);

  const fetchFacultyDetails = async (userId) => {
    try {
      // Get user email from localStorage to find faculty
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Since there's no direct endpoint, we'll use the email to find the faculty
      // You can add a search endpoint or get all faculty endpoint in the backend
      const response = await client.get(`/faculty/search?query=${user.email}`);
      if (response.data && response.data.length > 0) {
        const facultyData = response.data.find(f => f.email === user.email);
        setFaculty(facultyData || response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching faculty details:', error);
      // If search fails, try alternative approach
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        setFaculty({
          id: userId,
          name: user.name,
          email: user.email,
          facultyid: userId,
          department: 'Not specified'
        });
      } catch (err) {
        console.error('Fallback failed:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('userType');
    navigate('/login');
  };

  const handleUpdateProfile = () => {
    navigate('/update-faculty-profile');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!faculty) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Faculty not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header with Logout and Update Profile */}
      <div className="bg-slate-800/50 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Faculty Dashboard</h1>
              <p className="text-slate-400 text-sm">Welcome back, {faculty.name}!</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleUpdateProfile}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200"
            >
              <Edit className="w-4 h-4" />
              <span>Update Profile</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Faculty Details Card */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <User className="w-6 h-6 text-indigo-400" />
            Personal Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Name */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <User className="w-4 h-4" />
                <span>Full Name</span>
              </div>
              <p className="text-white font-medium text-lg">{faculty.name}</p>
            </div>

            {/* Faculty ID */}
            {faculty.facultyid && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Hash className="w-4 h-4" />
                  <span>Faculty ID</span>
                </div>
                <p className="text-white font-medium text-lg">{faculty.facultyid}</p>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </div>
              <p className="text-white font-medium text-lg break-all">{faculty.email}</p>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* View Teams Card */}
          <button
            onClick={() => navigate('/teams')}
            className="bg-gradient-to-br from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 border border-slate-600 rounded-2xl p-8 text-left transition-all duration-300 hover:scale-105 hover:shadow-xl group"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <UsersIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">View Teams</h3>
            <p className="text-slate-300 leading-relaxed">
              Monitor and manage student teams under your mentorship. Track team progress and provide guidance.
            </p>
          </button>

          {/* View Projects Card */}
          <button
            onClick={() => navigate('/projects')}
            className="bg-gradient-to-br from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 border border-slate-600 rounded-2xl p-8 text-left transition-all duration-300 hover:scale-105 hover:shadow-xl group"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">View Projects</h3>
            <p className="text-slate-300 leading-relaxed">
              Review and evaluate student project submissions. Provide feedback and assess project quality.
            </p>
          </button>

          {/* Archives Card */}
          <button
            onClick={() => navigate('/archives')}
            className="bg-gradient-to-br from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 border border-slate-600 rounded-2xl p-8 text-left transition-all duration-300 hover:scale-105 hover:shadow-xl group"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-slate-500 to-slate-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Archive className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Archives</h3>
            <p className="text-slate-300 leading-relaxed">
              Browse through completed projects and learn from past innovations and successful implementations.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
