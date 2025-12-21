import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  BookOpen, 
  Layers, 
  GraduationCap, 
  LogOut, 
  Edit, 
  Users, 
  FolderKanban,
  Calendar,
  Award,
  Archive
} from 'lucide-react';
import client from '../api/client';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in and is a student
    const userType = localStorage.getItem('userType');
    const userId = localStorage.getItem('userId');
    
    if (!userType || userType !== 'student') {
      navigate('/login');
      return;
    }

    // Fetch student details
    fetchStudentDetails(userId);
  }, [navigate]);

  const fetchStudentDetails = async (userId) => {
    try {
      // Try searching by user ID first
      const response = await client.get(`/students/search?query=${userId}`);
      if (response.data && response.data.length > 0) {
        // Find exact match
        const exactMatch = response.data.find(s => s.id === userId);
        setStudent(exactMatch || response.data[0]);
      } else {
        // Fallback: get user email and search all students
        const user = JSON.parse(localStorage.getItem('user'));
        const allStudentsResponse = await client.get('/students/');
        const studentData = allStudentsResponse.data.find(s => s.email === user.email);
        if (studentData) {
          setStudent(studentData);
        }
      }
    } catch (error) {
      console.error('Error fetching student details:', error);
      // Final fallback: try to get by email
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const allStudentsResponse = await client.get('/students/');
        const studentData = allStudentsResponse.data.find(s => s.email === user.email);
        if (studentData) {
          setStudent(studentData);
        }
      } catch (err) {
        console.error('Error in fallback fetch:', err);
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
    navigate('/update-profile');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Student not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header with Logout and Update Profile */}
      <div className="bg-slate-800/50 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Student Dashboard</h1>
              <p className="text-slate-400 text-sm">Welcome back, {student.name}!</p>
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
        {/* Student Details Card */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <User className="w-6 h-6 text-blue-400" />
            Personal Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Name */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <User className="w-4 h-4" />
                <span>Full Name</span>
              </div>
              <p className="text-white font-medium text-lg">{student.name}</p>
            </div>

            {/* USN */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Award className="w-4 h-4" />
                <span>USN</span>
              </div>
              <p className="text-white font-medium text-lg">{student.usn}</p>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </div>
              <p className="text-white font-medium text-lg break-all">{student.email}</p>
            </div>

            {/* Department */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <BookOpen className="w-4 h-4" />
                <span>Department</span>
              </div>
              <p className="text-white font-medium text-lg">{student.department}</p>
            </div>

            {/* Cluster */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Layers className="w-4 h-4" />
                <span>Cluster</span>
              </div>
              <p className="text-white font-medium text-lg">{student.cluster}</p>
            </div>

            {/* Semester */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Calendar className="w-4 h-4" />
                <span>Semester</span>
              </div>
              <p className="text-white font-medium text-lg">{student.semester}</p>
            </div>
          </div>

          {/* Skills */}
          {student.skills && (
            <div className="mt-6 pt-6 border-t border-slate-700">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
                <Award className="w-4 h-4" />
                <span>Skills</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {student.skills.split(',').map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-600/20 border border-blue-500 rounded-full text-blue-300 text-sm"
                  >
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          {(student.resumelink || student.githublink) && (
            <div className="mt-6 pt-6 border-t border-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {student.resumelink && (
                  <a
                    href={student.resumelink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-blue-400 hover:text-blue-300 transition-all"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>View Resume</span>
                  </a>
                )}
                {student.githublink && (
                  <a
                    href={student.githublink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-blue-400 hover:text-blue-300 transition-all"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    <span>View GitHub</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Form Teams Card */}
          <button
            onClick={() => navigate('/form-team')}
            className="bg-gradient-to-br from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 border border-slate-600 rounded-2xl p-8 text-left transition-all duration-300 hover:scale-105 hover:shadow-xl group"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Form Teams</h3>
            <p className="text-slate-300 leading-relaxed">
              Collaborate with students from your cluster. Find teammates with complementary skills and shared interests.
            </p>
          </button>

          {/* Submit Projects Card */}
          <button
            onClick={() => navigate('/submit-project')}
            className="bg-gradient-to-br from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 border border-slate-600 rounded-2xl p-8 text-left transition-all duration-300 hover:scale-105 hover:shadow-xl group"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FolderKanban className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Submit Projects</h3>
            <p className="text-slate-300 leading-relaxed">
              Present your innovative ideas. Submit comprehensive project proposals with clear objectives and timelines.
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

export default StudentDashboard;
