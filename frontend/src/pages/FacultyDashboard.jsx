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
  Phone,
  Bell,
  Calendar,
  ArrowLeft
} from 'lucide-react';
import client from '../api/client';
import { useNotifications } from '../hooks/useNotifications';

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(true);

  const userType = localStorage.getItem('userType');
  const { notifications, count: notifCount, loading: loadingNotifications } = useNotifications(userType);

  useEffect(() => {
    const userId = localStorage.getItem('userId');

    if (!userType || userType !== 'faculty') {
      navigate('/login');
      return;
    }

    fetchFacultyDetails(userId);
    fetchTeams(userId);
  }, [navigate]);

  const fetchFacultyDetails = async (userId) => {
    try {
      // Get user email from localStorage to find faculty
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Use the search endpoint to find the faculty
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
          faculty_id: userId,
          name: user.name,
          email: user.email,
          department: 'Not specified'
        });
      } catch (err) {
        console.error('Fallback failed:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async (userId) => {
    try {
      const response = await client.get(`/faculty/${userId}/teams`);
      setTeams(response.data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
      if (error.response?.status === 404) {
        // No teams found is not an error, just empty state
        setTeams([]);
      }
    } finally {
      setTeamsLoading(false);
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
        <div className="text-white text-xl">Loading faculty details...</div>
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
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Hash className="w-4 h-4" />
                <span>Faculty ID</span>
              </div>
              <p className="text-white font-medium text-lg">{faculty.faculty_id}</p>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </div>
              <p className="text-white font-medium text-lg break-all">{faculty.email}</p>
            </div>

            {/* Phone Number */}
            {faculty.ph_no && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Phone className="w-4 h-4" />
                  <span>Phone Number</span>
                </div>
                <p className="text-white font-medium text-lg">{faculty.ph_no}</p>
              </div>
            )}

            {/* Designation */}
            {faculty.designation && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <GraduationCap className="w-4 h-4" />
                  <span>Designation</span>
                </div>
                <p className="text-white font-medium text-lg">{faculty.designation}</p>
              </div>
            )}

            {/* Department */}
            {faculty.dept_id && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Building className="w-4 h-4" />
                  <span>Department</span>
                </div>
                <p className="text-white font-medium text-lg">{faculty.dept_id}</p>
              </div>
            )}
          </div>
        </div>

        {/* Notifications Card */}
        <div 
          onClick={() => navigate('/faculty-notifications')}
          className="bg-slate-800 rounded-2xl border border-slate-700 p-8 mb-8 hover:border-green-500 transition-all duration-300 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1 group-hover:text-green-400 transition-colors">Notifications</h2>
                <p className="text-slate-400 text-sm">
                  {loadingNotifications ? (
                    'Loading...'
                  ) : notifCount === 0 ? (
                    'No new notifications'
                  ) : (
                    `${notifCount} notification${notifCount !== 1 ? 's' : ''}`
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!loadingNotifications && notifCount > 0 && (
                <div className="bg-green-500/20 border border-green-500 rounded-full px-4 py-2">
                  <span className="text-green-400 font-semibold">{notifCount}</span>
                </div>
              )}
              <ArrowLeft className="w-5 h-5 text-slate-400 rotate-180 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Teams Card */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-blue-400" />
            Teams Under My Mentorship
          </h2>

          {teamsLoading ? (
            <div className="text-center py-12">
              <div className="text-slate-400 text-lg">Loading teams...</div>
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No teams assigned yet</p>
              <p className="text-slate-500 text-sm mt-2">Teams will appear here once assigned to you</p>
            </div>
          ) : (
            <div className="space-y-6">
              {teams.map((team) => (
                <div 
                  key={team.team_id}
                  onClick={() => navigate(`/team-review/${team.team_id}`)}
                  className="bg-slate-700/50 rounded-xl border border-slate-600 p-6 hover:border-blue-500 hover:bg-slate-700 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{team.team_name}</h3>
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-300 text-sm">Team ID: {team.team_id}</span>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          team.status === 'active' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                        }`}>
                          {team.status}
                        </div>
                        {team.cluster && (
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-300 text-sm">Cluster: {team.cluster}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Team Members */}
                  <div className="mb-4">
                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <UsersIcon className="w-4 h-4 text-blue-400" />
                      Team Members ({team.members?.length || 0})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {team.members?.map((member) => (
                        <div 
                          key={member.usn}
                          className="bg-slate-800 rounded-lg p-3 border border-slate-600"
                        >
                          <p className="text-white font-medium">{member.name}</p>
                          <p className="text-slate-400 text-sm">{member.usn}</p>
                          <p className="text-slate-500 text-xs mt-1 break-all">{member.email}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Project Details - if available */}
                  {team.project && (
                    <div className="mt-4 pt-4 border-t border-slate-600">
                      <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-400" />
                        Project Details
                      </h4>
                      <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
                        <p className="text-white font-medium mb-2">{team.project.title}</p>
                        {team.project.domain && (
                          <p className="text-slate-400 text-sm mb-2">Domain: {team.project.domain}</p>
                        )}
                        {team.project.abstract && (
                          <p className="text-slate-300 text-sm mt-2">{team.project.abstract}</p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {team.project.phase1_marks !== undefined && team.project.phase1_marks !== null && (
                            <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                              Phase 1: {team.project.phase1_marks}
                            </span>
                          )}
                          {team.project.phase2_marks !== undefined && team.project.phase2_marks !== null && (
                            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                              Phase 2: {team.project.phase2_marks}
                            </span>
                          )}
                          {team.project.marks !== undefined && team.project.marks !== null && (
                            <span className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-sm font-medium">
                              Final: {team.project.marks}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
