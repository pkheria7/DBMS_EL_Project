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
  Archive,
  Phone,
  Github,
  CheckCircle,
  XCircle
} from 'lucide-react';
import client from '../api/client';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teamProject, setTeamProject] = useState(null);
  const [loadingProject, setLoadingProject] = useState(false);

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
        const studentData = exactMatch || response.data[0];
        setStudent(studentData);
        
        // Fetch team project if student is in a team
        if (studentData.team_id) {
          fetchTeamProject(studentData.team_id);
        }
      } else {
        // Fallback: get user email and search all students
        const user = JSON.parse(localStorage.getItem('user'));
        const allStudentsResponse = await client.get('/students/');
        const studentData = allStudentsResponse.data.find(s => s.email === user.email);
        if (studentData) {
          setStudent(studentData);
          
          // Fetch team project if student is in a team
          if (studentData.team_id) {
            fetchTeamProject(studentData.team_id);
          }
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
          
          // Fetch team project if student is in a team
          if (studentData.team_id) {
            fetchTeamProject(studentData.team_id);
          }
        }
      } catch (err) {
        console.error('Error in fallback fetch:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamProject = async (teamId) => {
    setLoadingProject(true);
    try {
      const response = await client.get(`/projects/team/${teamId}`);
      if (response.data) {
        setTeamProject(response.data);
      }
    } catch (error) {
      // If 404, project doesn't exist yet
      if (error.response?.status !== 404) {
        console.error('Error fetching team project:', error);
      }
    } finally {
      setLoadingProject(false);
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
        <div className="flex items-center justify-between w-full">
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
              <p className="text-white font-medium text-lg">{student.dept_id || 'N/A'}</p>
            </div>

            {/* Cluster */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Layers className="w-4 h-4" />
                <span>Cluster</span>
              </div>
              <p className="text-white font-medium text-lg">{student.cluster || 'N/A'}</p>
            </div>

            {/* Semester */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Calendar className="w-4 h-4" />
                <span>Semester</span>
              </div>
              <p className="text-white font-medium text-lg">{student.sem || 'N/A'}</p>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Phone className="w-4 h-4" />
                <span>Phone Number</span>
              </div>
              <p className="text-white font-medium text-lg">{student.ph_no || 'N/A'}</p>
            </div>

            {/* GitHub */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Github className="w-4 h-4" />
                <span>GitHub</span>
              </div>
              {student.github ? (
                <a
                  href={student.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 font-medium text-lg break-all hover:underline"
                >
                  {student.github}
                </a>
              ) : (
                <p className="text-white font-medium text-lg">N/A</p>
              )}
            </div>

            {/* Team Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Users className="w-4 h-4" />
                <span>Team Status</span>
              </div>
              <div className="flex items-center gap-2">
                {student.is_in_active_team || student.team_id ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-medium text-lg">In Active Team</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-400 font-medium text-lg">Not in a Team</span>
                  </>
                )}
              </div>
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

          {/* Resume Link */}
          {student.resume && (
            <div className="mt-6 pt-6 border-t border-slate-700">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
                <BookOpen className="w-4 h-4" />
                <span>Resume</span>
              </div>
              <a
                href={student.resume}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-blue-400 hover:text-blue-300 transition-all"
              >
                <BookOpen className="w-4 h-4" />
                <span>View Resume</span>
              </a>
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

          {/* Submit/Review Project Cards - Conditional based on project status */}
          {teamProject ? (
            // Phase 1 submitted - Show two options
            <>
              {/* Review Phase 1 Submission */}
              <button
                onClick={() => navigate('/submit-project?mode=view')}
                className="bg-gradient-to-br from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 border border-slate-600 rounded-2xl p-8 text-left transition-all duration-300 hover:scale-105 hover:shadow-xl group"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Review Phase 1</h3>
                <p className="text-slate-300 leading-relaxed">
                  View your Phase 1 project submission with all the details and specifications.
                </p>
              </button>

              {/* Submit Phase 2 Project */}
              <button
                onClick={() => navigate('/submit-project?mode=phase2')}
                className="bg-gradient-to-br from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 border border-slate-600 rounded-2xl p-8 text-left transition-all duration-300 hover:scale-105 hover:shadow-xl group"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FolderKanban className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Submit Phase 2</h3>
                <p className="text-slate-300 leading-relaxed">
                  Upload your final project report, presentation, and complete documentation.
                </p>
              </button>
            </>
          ) : (
            // No project yet - Show Phase 1 submission option
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
          )}

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
